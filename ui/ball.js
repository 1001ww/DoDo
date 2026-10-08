/* ================= 悬浮速记球窗口:纯视图层 =================
   数据与动作全部经事件桥接主窗口:
   ← ball-state(状态快照) / ball-parsed(解析结果)
   → ball-ready / ball-toggle / ball-add / ball-del / ball-tomorrow
     ball-parse / ball-open-main / ball-open-settings / ball-hide      */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(n,base)=>{const x=base?parseISO(base):new Date();x.setDate(x.getDate()+n);return iso(x)};
const WD=['周日','周一','周二','周三','周四','周五','周六'];
const diffDays=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
function fmtDue(d){if(!S)return d;const t=S.today,df=diffDays(t,d),x=parseISO(d);
  if(df===0)return'今天';if(df===1)return'明天';if(df===-1)return'昨天';
  if(df<0)return`逾期${-df}天`;if(df<7)return WD[x.getDay()];
  return`${x.getMonth()+1}月${x.getDate()}日`}

/* ================= 图标 ================= */
const I={
  cal:'<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  repeat:'<path d="m17 2.5 4 4-4 4"/><path d="M3 11.5v-1a4 4 0 0 1 4-4h14"/><path d="m7 21.5-4-4 4-4"/><path d="M21 12.5v1a4 4 0 0 1-4 4H3"/>',
  flag:'<path d="M5 21V4.5"/><path d="M5 4.5c4-2.6 7 2.2 12-.3V13c-5 2.5-8-2.3-12 .3"/>',
  tag:'<path d="M3.5 5.5v6l8.8 8.8a2 2 0 0 0 2.8 0l5-5a2 2 0 0 0 0-2.8L11.5 3.5h-6a2 2 0 0 0-2 2Z"/><circle cx="8" cy="8" r="1.2"/>',
  chevD:'<path d="m6 9.5 6 6 6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  home:'<path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9v11h13V9"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95A7 7 0 0 0 14 5.1L13.6 2.6h-4L9.2 5.1a7 7 0 0 0-2.5 1.44l-2.36-.95-2 3.46 2 1.55a7 7 0 0 0 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.51 1.44l.4 2.5h4l.4-2.5a7 7 0 0 0 2.5-1.44l2.36.95 2-3.46-2-1.55c.1-.46.14-.93.14-1.4Z"/>',
  eyeOff:'<path d="M4 4l16 16"/><path d="M10.6 5.9A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.2 3.9M6.1 6.9A16.9 16.9 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  trash:'<path d="M4 7h16"/><path d="M9.5 3.5h5a1 1 0 0 1 1 1V7h-7V4.5a1 1 0 0 1 1-1Z"/><path d="M6.5 7 7.3 20a1.5 1.5 0 0 0 1.5 1.4h6.4A1.5 1.5 0 0 0 16.7 20l.8-13"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7"/>',
};
const ic=(n,s=16,w=1.8)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
$('#pPlus').innerHTML=ic('plus',14,2);

/* ================= 完成表情 ================= */
const spark=(cx,cy,s)=>`<path d="M${cx} ${cy-s}L${cx+s*.3} ${cy-s*.3}L${cx+s} ${cy}L${cx+s*.3} ${cy+s*.3}L${cx} ${cy+s}L${cx-s*.3} ${cy+s*.3}L${cx-s} ${cy}L${cx-s*.3} ${cy-s*.3}Z" fill="#fff"/>`;
const FACES=[
  {n:'经典',s:'<circle cx="8.4" cy="9.6" r="1.5" fill="#fff"/><circle cx="15.6" cy="9.6" r="1.5" fill="#fff"/><path d="M6.9 13.1a5.1 5.1 0 0 0 10.2 0Z" fill="#fff"/>'},
  {n:'弯眼',s:'<path d="M6 10.3c.9-1.6 2.5-1.6 3.4 0" stroke="#fff" stroke-width="1.9" stroke-linecap="round" fill="none"/><path d="M14.6 10.3c.9-1.6 2.5-1.6 3.4 0" stroke="#fff" stroke-width="1.9" stroke-linecap="round" fill="none"/><path d="M7.3 13.4a4.7 4.7 0 0 0 9.4 0Z" fill="#fff"/><circle cx="4.9" cy="13.2" r="1.15" fill="#fff" opacity=".4"/><circle cx="19.1" cy="13.2" r="1.15" fill="#fff" opacity=".4"/>'},
  {n:'星星眼',s:spark(8.2,9.7,2.7)+spark(15.8,9.7,2.7)+'<path d="M7.1 13.6a4.9 4.9 0 0 0 9.8 0Z" fill="#fff"/>'},
  {n:'惊喜',s:'<path d="M5.9 10.1c.9-1.6 2.5-1.6 3.4 0" stroke="#fff" stroke-width="1.9" stroke-linecap="round" fill="none"/><path d="M14.7 10.1c.9-1.6 2.5-1.6 3.4 0" stroke="#fff" stroke-width="1.9" stroke-linecap="round" fill="none"/><circle cx="12" cy="14.4" r="1.9" fill="#fff"/><circle cx="4.9" cy="13.4" r="1.15" fill="#fff" opacity=".4"/><circle cx="19.1" cy="13.4" r="1.15" fill="#fff" opacity=".4"/>'},
  {n:'大笑',s:'<path d="M5.9 8.4l2.9 1.7-2.9 1.7" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M18.1 8.4l-2.9 1.7 2.9 1.7" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M6.8 13.2a5.2 5.2 0 0 0 10.4 0Z" fill="#fff"/>'},
  {n:'眨眼',s:'<circle cx="8" cy="9.4" r="1.5" fill="#fff"/><path d="M14.6 10c.9-1.7 2.6-1.7 3.5 0" stroke="#fff" stroke-width="1.9" stroke-linecap="round" fill="none"/><path d="M6.8 13a5.2 5.2 0 0 0 10.4 0Z" fill="#fff"/><path d="M10.4 15.4h3.2c.05 1.5-.55 2.5-1.6 2.5s-1.65-1-1.6-2.5Z" fill="#FF9DB5"/>'},
  {n:'^o^',text:'^o^'},
  {n:':D',text:':D'},
];
let faceIdx=+(localStorage.getItem('ball-face')||6);
function faceHtml(f,big){
  return f.text!==undefined
    ?`<span style="font-size:${big?13:11.5}px;font-weight:800;color:#fff;letter-spacing:.5px">${f.text}</span>`
    :`<svg width="${big?25:22}" height="${big?25:22}" viewBox="0 0 24 24">${f.s}</svg>`;
}

/* ================= Tauri 桥 ================= */
const inv=window.__TAURI__?.core?.invoke||null;
const EV=window.__TAURI__?.event||null;
const WIN=window.__TAURI__?.window?.getCurrentWindow?.();
const WINMOD=window.__TAURI__?.window;
const DPI=window.__TAURI__?.dpi;
const emit=(n,p)=>{try{EV&&EV.emit(n,p)}catch(e){}};

/* ================= 窗口几何 ================= */
const BALL=62,PANEL_W=376,PAD=8;
const ball=$('#ball'),panel=$('#panel');
let S=null,mode='ball',side='right';
let ballX=0,ballY=0,panelPos=null,peekTimer=null;
let wasAllDone=false,animLock=0,pendingS=null,justOpened=false,doneOpen=true;

function savePos(){try{localStorage.setItem('ball-pos',JSON.stringify({x:Math.round(ballX),y:Math.round(ballY),side}))}catch(e){}}
let screenCache=null;
async function screenLogical(){
  if(screenCache)return screenCache;
  for(const f of [()=>WINMOD&&WINMOD.currentMonitor(),()=>WINMOD&&WINMOD.primaryMonitor()]){
    try{const m=await f();if(m&&m.size){const s=m.size.toLogical(m.scaleFactor);
      if(s.width>100)return screenCache={w:s.width,h:s.height}}}catch(e){}
  }
  return screenCache={w:1280,h:720}; // 兜底:宁可贴内也不出屏
}
let winOp=Promise.resolve(); // 窗口操作串行队列:防展开/收起/拖拽的 IPC 交错竞态
function winSet(x,y,w,h){
  winOp=winOp.then(async()=>{
    /* 先移位再改尺寸:窗口贴边时先扩宽会被系统钳制,导致 setPosition 不生效 */
    await WIN.setPosition(new DPI.LogicalPosition(Math.round(x),Math.round(y)));
    await WIN.setSize(new DPI.LogicalSize(Math.round(w),Math.round(h)));
  }).catch(e=>{console.warn('[DoDo] 窗口操作失败:',e)});
  return winOp;
}
function winSize(w,h){
  winOp=winOp.then(()=>WIN.setSize(new DPI.LogicalSize(Math.round(w),Math.round(h)))).catch(e=>{console.warn('[DoDo] 窗口操作失败:',e)});
  return winOp;
}
async function applyWin(x,y,w,h){return winSet(x,y,w,h)}
async function dock(){
  const sc=await screenLogical();
  ballX=side==='left'?-12:sc.w-50;
  ballY=Math.max(PAD,Math.min(sc.h-BALL-PAD,ballY||sc.h*0.34));
  savePos();
  ball.classList.add('docked');
  ball.style.setProperty('--peekdx',side==='left'?'-20px':'20px');
  await applyWin(ballX,ballY,BALL,BALL);
  armPeek();
}
async function peekOn(){ball.classList.add('peek')}
async function peekOff(){if(!ball.classList.contains('peek'))return;ball.classList.remove('peek');armPeek()}
function armPeek(){clearTimeout(peekTimer);peekTimer=setTimeout(()=>{if(mode==='ball')peekOn()},5000)}

/* ================= 状态渲染 ================= */
EV&&EV.listen('ball-state',e=>{const s=e.payload;if(!s)return;
  if(Date.now()<animLock){pendingS=s;return}
  applyState(s)});
let shown=false,dockDone=false;
function tryShow(){
  if(shown||!S||S.visible===false||!dockDone)return;
  shown=true;
  try{WIN.show()}catch(e){}
  dock(); // 重新落位并强制一次位置/尺寸写入,规避透明窗隐藏后不重绘
}
function applyState(s){
  S=s;
  document.documentElement.dataset.theme=s.theme||'light';
  if(s.visible===false){shown=false;try{WIN.hide()}catch(e){}} // 重置闩锁:下次开启可再次显示
  else tryShow();
  renderBall();
  if(mode!=='ball')renderList(!justOpened);
  justOpened=false;
}
const pending=()=>S.tasks.filter(t=>!t.done&&t.due&&t.due<=S.today);
const doneToday=()=>S.tasks.filter(t=>t.done&&t.doneAt===S.today);
const listColor=id=>{const l=S.lists.find(x=>x.id===id);return l?l.color:'#A4A4B0'};
const listName=id=>{const l=S.lists.find(x=>x.id===id);return l?l.name:''};

function updateBall(){
  const p=pending(),d=doneToday(),total=p.length+d.length;
  const allDone=p.length===0;
  $('#ballIco').innerHTML=allDone
    ?`${faceHtml(FACES[faceIdx],true)}<span class="blab">完成</span>`
    :`<span class="bnum">${p.length}</span><span class="blab">待办</span>`;
  if(allDone&&!wasAllDone){ball.classList.add('pulse');setTimeout(()=>ball.classList.remove('pulse'),520)}
  wasAllDone=allDone;
  const C=175.93,pct=total?d.length/total:0;
  $('#ballRing').style.display=!total?'none':'';
  $('#ballRing').querySelector('.arc').style.strokeDashoffset=C*(1-pct);
}
function renderBall(){updateBall()}

function renderList(anim){
  const box=$('#pList'),p=pending(),d=doneToday();
  box.classList.toggle('noanim',anim===false);
  const n=new Date();$('#pHd').textContent=`${n.getMonth()+1}月${n.getDate()}日 ${WD[n.getDay()]}`;
  const tDone=d.length,tTotal=p.length+tDone;
  const R=13,C=2*Math.PI*R,pct=tTotal?tDone/tTotal:0;
  $('#pRing').innerHTML=`<svg width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="${R}" fill="none" stroke="var(--border)" stroke-width="3"/>
    <circle cx="15" cy="15" r="${R}" fill="none" stroke="var(--green)" stroke-width="3" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}" transform="rotate(-90 15 15)" style="transition:stroke-dashoffset .4s ease"/>
    </svg><span class="ring-num">${tDone}/${tTotal}</span>`;
  if(!p.length&&!d.length){
    box.innerHTML=`<div class="alldone"><div class="big">${ic('check',22,2.4)}</div>
      <div class="t1">今天暂无待办</div><div class="t2">从上方输入框快速记一条吧</div></div>`;
    updateBall();fitWindow();return;
  }
  let html='';
  const over=p.filter(t=>t.due<S.today),today=p.filter(t=>t.due===S.today);
  const row=t=>{
    const lc=listColor(t.list);
    return`<div class="trow" data-id="${t.id}">
      <span class="checkbox" data-check="${t.id}"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 4.6 9 10 3"/></svg></span>
      <span class="tmain"><span class="ldot" style="background:${lc}"></span><span class="tt2" title="${esc(t.t)}">${esc(t.t)}</span></span>
      <span class="tmeta">${t.time?`<span>${t.time}</span>`:''}${t.rep?`<span class="rep">${ic('repeat',11,2)}${t.rep}</span>`:''}${t.subs?`<span>${t.subs}</span>`:''}${t.due<S.today?`<span class="over">${fmtDue(t.due)}</span>`:''}${t.prio?`<span class="flag${t.prio}">${ic('flag',12,2)}</span>`:''}</span>
      <span class="acts">${t.due<S.today?`<button class="row-btn" data-tom="${t.id}" title="移到明天">${ic('arrow',13)}</button>`:''}<button class="row-btn del" data-del="${t.id}" title="删除">${ic('trash',13)}</button></span>
    </div>`};
  if(over.length)html+=`<div class="grp over">${ic('cal',12,2.2)}逾期<span class="cnt">${over.length}</span></div>`+over.map(row).join('');
  if(today.length)html+=`<div class="grp">${ic('sun',12,2.2)}今天<span class="cnt">${today.length}</span></div>`+today.map(row).join('');
  if(d.length){
    html+=`<div class="done-head ${doneOpen?'':'closed'}" data-donehead>${ic('check',12,2.4)}已完成<span class="cnt">${d.length}</span><span class="arr">${ic('chevD',12,2.2)}</span></div>`;
    if(doneOpen)html+=d.map(t=>`<div class="donerow" data-id="${t.id}">
      <span class="checkbox checked" data-check="${t.id}"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 4.6 9 10 3"/></svg></span>
      <span class="tmain"><span class="tt2" title="${esc(t.t)}">${esc(t.t)}</span></span>
      <span class="when">${t.due<S.today?'逾期已办':'今天'}</span></div>`).join('');
  }
  if(!p.length&&d.length){
    html=`<div class="alldone"><div class="big">${ic('check',22,2.4)}</div>
      <div class="t1">今天全部完成 🎉</div><div class="t2">共 ${d.length} 项 · 休息一下吧</div></div>`+html;
  }
  box.innerHTML=html;
  updateBall();
  fitWindow();
}
/* 面板高度随内容自适应(只调高度;位置归 openPanel 管,避免竞态搬回旧位) */
async function fitWindow(){
  if(mode==='ball')return;
  const sc=await screenLogical();
  const h=Math.max(260,Math.min(panel.scrollHeight+2,sc.h-16));
  winSize(PANEL_W,h);
}

/* ================= 展开 / 收起 ================= */
async function openPanel(){
  try{
    if(mode!=='ball'||!S){return}
    mode='panel';clearTimeout(peekTimer);justOpened=true;
    renderList(true);
    const sc=await screenLogical();
    const h=Math.max(260,Math.min(panel.offsetHeight+2,sc.h-16));
    const cx=ballX+31,cy=ballY+31;
    let px,py;
    if(panelPos){px=panelPos.x;py=panelPos.y}
    else{
      /* 面板覆盖球的原位:双击的第二击必然落在面板内,不会触发失焦收起 */
      px=cx>sc.w/2?cx+31-PANEL_W:cx-31;
      px=Math.max(PAD,Math.min(sc.w-PANEL_W-PAD,px));
      py=Math.min(Math.max(PAD,cy-64),sc.h-h-PAD);
    }
    document.body.classList.add('expanded');
    ball.style.display='none';
    await applyWin(px,py,PANEL_W,h);
    if(mode!=='panel'){ /* 展开期间被失焦/Esc 收起:撤销展开,回到球态 */
      panel.classList.remove('open');document.body.classList.remove('expanded');ball.style.display='';
      await dock();return;
    }
    panel.style.transformOrigin=`${Math.max(20,Math.min(356,cx-px))}px ${Math.max(20,Math.min(h-20,cy-py))}px`;
    panel.classList.add('open');
    setTimeout(()=>{$('#pInput').focus()},120);
    try{await WIN.setFocus()}catch(e){}
  }catch(err){reportErr('openPanel: '+(err&&err.message||err))}
}
async function closeToBall(){
  mode='ball';panel.classList.remove('open');hideMenu();
  document.body.classList.remove('expanded');ball.style.display='';
  await dock();
  try{await WIN.show()}catch(e){} // 兜底:任何路径收起后球必须可见
}
/* 面板头部拖拽:窗口跟随;双击头部复位到球旁 */
const phead=$('#pHead');
let pdrag=null;
phead.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  pdrag={sx:e.screenX,sy:e.screenY};
  phead.setPointerCapture(e.pointerId);phead.classList.add('dragging');
});
phead.addEventListener('pointermove',async e=>{
  if(!pdrag)return;
  const f=await WIN.scaleFactor();
  const r=await WIN.outerPosition();
  const nx=r.x/f+(e.screenX-pdrag.sx)/f,ny=r.y/f+(e.screenY-pdrag.sy)/f;
  pdrag.sx=e.screenX;pdrag.sy=e.screenY;
  const sc=await screenLogical();
  panelPos={x:Math.max(PAD,Math.min(sc.w-PANEL_W-PAD,nx)),y:Math.max(PAD,Math.min(sc.h-260-PAD,ny))};
  await WIN.setPosition(new DPI.LogicalPosition(Math.round(panelPos.x),Math.round(panelPos.y)));
});
const endPdrag=()=>{pdrag=null;phead.classList.remove('dragging')};
phead.addEventListener('pointerup',endPdrag);
phead.addEventListener('pointercancel',endPdrag);
phead.addEventListener('dblclick',()=>{panelPos=null;closeToBall().then(openPanel)});

/* ================= 球体:点击 / 拖拽 / 右键 ================= */
let SCALE=1; // 启动时缓存,指针事件内全同步
let drag=null;
ball.addEventListener('pointerdown',e=>{
  if(e.button!==0||mode!=='ball')return;
  drag={sx:e.screenX,sy:e.screenY,ox:ballX,oy:ballY,moved:false,sw:screenCache?screenCache.w:1536,sh:screenCache?screenCache.h:864};
  ball.setPointerCapture(e.pointerId);
});
ball.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=(e.screenX-drag.sx)/SCALE,dy=(e.screenY-drag.sy)/SCALE;
  if(!drag.moved&&Math.hypot(dx,dy)>5){
    drag.moved=true;ball.classList.add('dragging');ball.classList.remove('docked','peek');
    clearTimeout(peekTimer);
  }
  if(drag.moved){
    ballX=Math.max(-34,Math.min(drag.sw-28,drag.ox+dx));
    ballY=Math.max(PAD,Math.min(drag.sh-BALL-PAD,drag.oy+dy));
    WIN.setPosition(new DPI.LogicalPosition(Math.round(ballX),Math.round(ballY)));
  }
});
ball.addEventListener('pointerup',e=>{
  if(!drag)return;
  const moved=drag.moved,sw=drag.sw;drag=null; // 先取值再清空,否则 drag.sw 必抛 TypeError 且 dock 不执行
  if(moved){
    ball.classList.remove('dragging');
    side=(ballX+31)<sw/2?'left':'right';
    dock();
  }else{
    openPanel();
  }
});
ball.addEventListener('mouseenter',()=>peekOff());
ball.addEventListener('contextmenu',e=>{e.preventDefault();if(mode==='ball')openMenu()});

/* ================= 右键菜单 ================= */
let menuEl=null;
function hideMenu(){if(menuEl){menuEl.remove();menuEl=null}}
async function openMenu(){
  if(mode!=='ball')return;
  mode='menu';clearTimeout(peekTimer);
  menuEl=document.createElement('div');menuEl.className='menu';
  menuEl.innerHTML=`<div class="mi" data-mi="main">${ic('home',15)}打开 DoDo 主窗口</div>
    <div class="mi" data-mi="settings">${ic('gear',15)}设置…</div>
    <div class="sep"></div>
    <div class="mi" data-mi="hide">${ic('eyeOff',15)}隐藏悬浮球</div>`;
  document.body.appendChild(menuEl);
  await applyWin(Math.max(0,ballX),Math.max(0,ballY),240,170);
  menuEl.addEventListener('click',e=>{
    const mi=e.target.closest('[data-mi]');if(!mi)return;
    const k=mi.dataset.mi;hideMenu();
    if(k==='main'){emit('ball-open-main');closeToBall()}
    else if(k==='settings'){emit('ball-open-settings');closeToBall()}
    else if(k==='hide'){mode='ball';hideMenu();emit('ball-hide')}
  });
}

/* ================= chips(主窗真解析器回传) ================= */
let parseT=null;
function renderChips(p){
  const box=$('#pChips'),v=$('#pInput').value;
  if(!v.trim()){box.innerHTML='';box.classList.remove('has');return}
  box.classList.add('has');
  const chips=[];
  if(p&&p.due)chips.push(`<span class="chip date">${ic('cal',11,2)}${fmtDue(p.due)}</span>`);
  if(p&&p.time)chips.push(`<span class="chip time">${ic('clock',11,2)}${p.time}</span>`);
  if(p&&p.list)chips.push(`<span class="chip list">${ic('tag',11,2)}${esc(listName(p.list)||p.list)}</span>`);
  if(p&&p.tags)p.tags.forEach(tg=>chips.push(`<span class="chip tag">${ic('tag',11,2)}${esc(tg)}</span>`));
  if(p&&p.prio)chips.push(`<span class="chip prio${p.prio}">${ic('flag',11,2)}${['','低','中','高'][p.prio]}优先级</span>`);
  box.innerHTML=chips.join('')||`<span style="font-size:11.5px;color:var(--text-3);padding:0 2px">将记录「${esc(v.trim())}」</span>`;
}
$('#pInput').addEventListener('input',e=>{
  clearTimeout(parseT);
  parseT=setTimeout(()=>emit('ball-parse',{text:e.target.value}),120);
});
if(EV)EV.listen('ball-parsed',e=>renderChips(e.payload));
$('#pInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    const v=e.target.value.trim();if(!v)return;
    /* 落点与主窗一致:解析优先,未解析到日期落今天(等价主窗今天视图),无自造选择器 */
    emit('ball-add',{text:v});
    e.target.value='';renderChips(null);closeToBall();
  }
});

/* ================= Toast ================= */
let toastTimer=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200)}

/* ================= 列表交互 ================= */
$('#pList').addEventListener('click',e=>{
  const ck=e.target.closest('[data-check]');
  if(ck){
    const id=+ck.dataset.check;
    const rowEl=ck.closest('.trow');
    if(rowEl){ // 行内收尾动画,期间暂存新状态
      rowEl.classList.add('finishing');
      animLock=Date.now()+820;
      setTimeout(()=>{rowEl.style.height=rowEl.offsetHeight+'px';rowEl.style.overflow='hidden';
        requestAnimationFrame(()=>{rowEl.classList.add('collapsing');rowEl.style.height='0px'})},500);
      setTimeout(()=>{emit('ball-toggle',{id})},540);
      setTimeout(()=>{animLock=0;if(pendingS){const s=pendingS;pendingS=null;applyState(s)}},860);
    }else{ // 已完成行再点 → 恢复待办
      emit('ball-toggle',{id});
    }
    return;
  }
  if(e.target.closest('[data-donehead]')){doneOpen=!doneOpen;renderList(false);return}
  const tom=e.target.closest('[data-tom]');
  if(tom){emit('ball-tomorrow',{id:+tom.dataset.tom});return}
  const del=e.target.closest('[data-del]');
  if(del){emit('ball-del',{id:+del.dataset.del});toast('已删除')}
});

/* ================= 失焦自动收起 / Esc ================= */
if(WIN)WIN.onFocusChanged(({payload:focused})=>{
  if(!focused&&mode!=='ball')closeToBall();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(mode==='menu'){hideMenu();closeToBall()}
    else if(mode==='panel')closeToBall();
  }
});

/* ================= 启动 ================= */
function reportErr(m){document.title='球窗错误: '+String(m).slice(0,80);try{emit('ball-error',{m:String(m).slice(0,160)})}catch(e){}}
window.addEventListener('error',e=>reportErr(e.message||'script error'));
window.addEventListener('unhandledrejection',e=>reportErr((e.reason&&(e.reason.message||e.reason))||'promise rejection'));
(async function(){
  try{
    if(!WIN||!EV||!inv){ // 非桌面环境兜底:仅显示球壳
      $('#ballIco').innerHTML='<span class="bnum">–</span>';
      return;
    }
    try{SCALE=await WIN.scaleFactor()}catch(e){}
    try{const saved=JSON.parse(localStorage.getItem('ball-pos')||'null');
      if(saved){ballX=saved.x;ballY=saved.y;side=saved.side||'right'}}catch(e){}
    await dock();
    dockDone=true;
    tryShow();
    emit('ball-ready');
  }catch(err){reportErr(err&&err.message||err)}
})();
