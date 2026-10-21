/* ============================================================
   updater.js — 应用内检查更新(C66)
   更新源/公钥见 src-tauri/tauri.conf.json plugins.updater,权限见
   capabilities/default.json(updater:default);仅主窗加载。
   状态机 idle/checking/available/downloading/installing/error,
   每次变化向 document 派发 'dodo:updater-state',app.js 据此刷新关于页。
   Windows/NSIS 流程:downloadAndInstall 落地后安装器以 /P /UPDATE /R
   静默接管,PREINSTALL 钩子结束本进程,装完自动重启——JS 侧无需 relaunch。
   ============================================================ */
const Updater=(()=>{
  const CHECK_GAP=24*3600*1000; // 自动检查节流:24h 内不重复请求更新源
  const CHECK_DELAY=5000;       // 启动后延迟,避开首屏渲染与数据库初始化
  const CHECK_TIMEOUT=15000;
  const inv=()=>window.__TAURI__?.core?.invoke;
  /* 必须走插件全局 API(返回带 downloadAndInstall 方法的 Update 实例);
     直接 invoke('plugin:updater|check') 只得纯数据,调不了安装 */
  const up=()=>window.__TAURI__?.updater;
  const fmtMB=b=>(b/1048576).toFixed(1)+' MB';
  let state='idle',update=null,total=0,done=0,errMsg='',ov=null;
  let lastCheck=+(localStorage.getItem('dodo-upcheck')||0);

  const enabled=()=>{try{return settings.updates!==false}catch(e){return true}};
  const busy=()=>state==='downloading'||state==='installing';
  const setState=s=>{state=s;document.dispatchEvent(new CustomEvent('dodo:updater-state'))};

  /* 关于页「软件更新」行文案:{sd 状态,btn 按钮文字,dim 按钮禁用} */
  function statusText(){
    if(state==='checking')return{sd:'正在检查更新…',btn:'检查中',dim:1};
    if(state==='available')return{sd:`发现新版本 v${esc(update.version)},点「更新」查看详情`,btn:'更新'};
    if(state==='downloading')return{sd:`正在下载 v${esc(update.version)}${total?` ${Math.round(done/total*100)}%`:''}`,btn:'下载中',dim:1};
    if(state==='installing')return{sd:'正在安装,完成后将自动重启',btn:'安装中',dim:1};
    if(state==='error')return{sd:'上次检查失败('+(errMsg||'网络异常')+')',btn:'重试'};
    return{sd:'点击检查是否有新版本;更新源 GitHub Releases',btn:'检查更新'};
  }

  async function check(manual){
    const api=up();
    if(!api){if(manual)toast('桌面端才能检查更新');return}
    if(busy()||state==='checking')return;
    errMsg='';setState('checking');
    try{
      update=await Promise.race([
        api.check({timeout:CHECK_TIMEOUT}),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('检查超时')),CHECK_TIMEOUT))]);
      lastCheck=Date.now();localStorage.setItem('dodo-upcheck',lastCheck);
      if(update){setState('available');if(!manual)notify()}
      else{update=null;setState('idle');if(manual)toast('已是最新版本'+(APP_VERSION?' v'+APP_VERSION:''))}
    }catch(e){
      update=null;errMsg=String(e.message||e).slice(0,60);setState('error');
      if(manual)toast('检查更新失败:'+errMsg); // 自动检查失败静默,不打扰
    }
  }

  function notify(){ // 启动自动发现:轻提示带入口,不打断当前操作
    toast(`发现新版本 v${update.version}`,{label:'更新',fn:openDialog});
  }

  async function downloadAndInstall(){
    if(!update||busy())return;
    total=0;done=0;setState('downloading');render();
    try{
      await update.downloadAndInstall(ev=>{
        if(ev.event==='Started'){total=ev.data.contentLength||0;setBar(0)}
        else if(ev.event==='Progress'){done+=ev.data.chunkLength;setBar(total?done/total:0)}
        else if(ev.event==='Finished')setBar(1);
      });
      /* Windows/NSIS 下走不到这行(installer 会结束本进程并 /R 重启);
         仍活着说明更新器接管异常退出,提示手动重启兜底 */
      setState('installing');render();
      setTimeout(()=>{closeDialog();toast('更新已安装,重启 DoDo 后生效')},1200);
    }catch(e){
      errMsg=String(e.message||e).slice(0,60);setState('error');render();
    }
  }
  function setBar(f){
    const bar=document.querySelector('#updOverlay .uprog-bar'),t=document.querySelector('#updOverlay .uprog-t');
    if(bar)bar.style.width=Math.min(100,Math.round(f*100))+'%';
    if(t)t.textContent=state==='installing'?'正在安装,完成后将自动重启…'
      :(total?`${Math.round(f*100)}% · ${fmtMB(done)} / ${fmtMB(total)}`:(f>=1?'校验签名中…':'下载中…'));
  }

  function openDialog(){
    if(!update)return;
    if(!ov){
      ov=document.createElement('div');ov.id='updOverlay';ov.className='overlay';ov.style.zIndex=120;
      document.body.appendChild(ov);
      ov.addEventListener('click',e=>{
        if(busy())return; // 下载/安装中锁定弹窗,防误关导致装到一半失去反馈
        if(e.target===ov||e.target.closest('[data-uclose],[data-ulater]'))closeDialog();
        else if(e.target.closest('[data-unow]'))downloadAndInstall();
      });
    }
    render();
  }
  function closeDialog(){if(ov){ov.remove();ov=null}} // 关闭不改状态:available 保持,关于页仍可继续更新
  function render(){
    if(!ov||!update)return;
    const notes=(update.body!=null?update.body:update.notes)||'';
    const prog=state==='downloading'||state==='installing';
    const err=state==='error';
    ov.innerHTML=`<div class="udialog">
      ${busy()?'':`<button class="icon-btn sclose" data-uclose title="关闭">${ic('x',15)}</button>`}
      <div class="uhead"><span class="uico">${ic('download',17)}</span><div>
        <h4>${state==='installing'?'正在安装更新':'发现新版本'}</h4>
        <span class="uver">v${esc(update.version)}${APP_VERSION&&APP_VERSION!==update.version?' · 当前 v'+esc(APP_VERSION):''}</span></div></div>
      ${notes?`<div class="unotes">${esc(notes)}</div>`:''}
      ${prog?`<div class="uprog"><div class="uprog-bar" style="width:0%"></div></div><div class="uprog-t">准备下载…</div>`:''}
      ${err?`<div class="uerr">${ic('alert',13)} ${esc(errMsg||'下载失败,请稍后重试')}</div>`:''}
      ${prog?'':`<div class="ubtns"><button class="sbtn" data-ulater>稍后</button><button class="sbtn primary" data-unow>${err?'重试':'立即更新'}</button></div>`}
    </div>`;
  }

  /* boot 与回前台都会调:开关关闭或 24h 内查过则跳过 */
  function autoCheck(){
    if(!inv()||!enabled()||busy())return;
    if(Date.now()-lastCheck<CHECK_GAP)return;
    setTimeout(()=>{if(enabled()&&!busy()&&state!=='checking')check(false)},CHECK_DELAY);
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&inv())autoCheck()});

  return{check,autoCheck,openDialog,statusText,state:()=>state,hasUpdate:()=>!!update};
})();
