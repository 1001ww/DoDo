
/* ================= 桌面端标识(去除浏览器预览外框) ================= */
if(window.__TAURI__)document.documentElement.classList.add('desktop');
let APP_VERSION=''; // 版本号单一来源=plugin:app|version(发版只改 tauri.conf 一处);浏览器预览取不到则不显示
if(window.__TAURI__)window.__TAURI__.core.invoke('plugin:app|version').then(v=>{
  APP_VERSION=v;const ov=document.getElementById('settingsOverlay');if(ov)buildSettings();
}).catch(()=>{});

/* ================= 工具 ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(n,base)=>{const x=base?parseISO(base):new Date();x.setDate(x.getDate()+n);return iso(x)};
let TODAY=iso(new Date());
const WD=['周日','周一','周二','周三','周四','周五','周六'];
const diffDays=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
function fmtDue(d){const df=diffDays(TODAY,d),x=parseISO(d);
  if(df===0)return'今天';if(df===1)return'明天';if(df===-1)return'昨天';
  if(df<0)return`逾期${-df}天`;if(df<7)return WD[x.getDay()];
  return`${x.getMonth()+1}月${x.getDate()}日`}
function dayLabel(d){const df=diffDays(TODAY,d),x=parseISO(d);
  if(df===0)return`今天 · ${x.getMonth()+1}月${x.getDate()}日 ${WD[x.getDay()]}`;
  if(df===1)return`明天 · ${x.getMonth()+1}月${x.getDate()}日 ${WD[x.getDay()]}`;
  return`${WD[x.getDay()]} · ${x.getMonth()+1}月${x.getDate()}日`}
function fmtTime(t){
  if(!t)return t;
  if(settings.timeFormat!=='12')return t;
  let[h,m]=t.split(':').map(Number);
  const ap=h<12?'上午':'下午';h=h%12||12;
  return`${ap} ${h}:${String(m).padStart(2,'0')}`;
}
const cmp=(a,b)=>{const ad=a.due||'9999-99-99',bd=b.due||'9999-99-99';if(ad!==bd)return ad<bd?-1:1;return(b.prio||0)-(a.prio||0)};

/* ================= 图标 ================= */
const I={
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  inbox:'<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  cal7:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18.5h.01M12 18.5h.01"/>',
  kanban:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>',
  chart:'<path d="M18 20V10M12 20V4M6 20v-6"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  layers:'<path d="m12 2 8.5 4.7L12 11.4 3.5 6.7 12 2z"/><path d="m3.5 11.7 8.5 4.7 8.5-4.7"/><path d="m3.5 16.6 8.5 4.7 8.5-4.7"/>',
  check:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4 4.8-5.2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  moon:'<path d="M20.8 14.5A8.5 8.5 0 0 1 9.5 3.2a8.5 8.5 0 1 0 11.3 11.3z"/>',
  sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/>',
  undo:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  note:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/>',
  tag:'<path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2c.5 0 1 .2 1.4.6z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  checkS:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevL:'<path d="m15 18-6-6 6-6"/>',chevR:'<path d="m9 18 6-6-6-6"/>',
  sub:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  edit:'<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  palette:'<path d="M12 3a9 9 0 1 0 .46 18H14a2 2 0 0 0 1.56-3.25 1.5 1.5 0 0 1 1.18-2.44h2.06A3.7 3.7 0 0 0 22.5 11.6C22.06 6.79 17.4 3 12 3z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="10.2" cy="7.6" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.8" cy="7" r="1.2" fill="currentColor" stroke="none"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 15.8v.4"/>',
  minus:'<path d="M5 12h14"/>',
  grip:'<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
};
const ic=(n,s=16,w=1.8)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
const CHECK_SVG='<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5 4.6 9 10 3"/></svg>';

/* ================= 数据 ================= */
let LISTS=[
  {id:'work', name:'工作', color:'#5B5BD6'},
  {id:'life', name:'生活', color:'#30A46C'},
  {id:'study',name:'学习', color:'#F5A524'},
];
const listById=id=>LISTS.find(l=>l.id===id);
const PALETTE=['#5B5BD6','#30A46C','#F5A524','#E5484D','#4A9EF5','#B16DFF','#00A2C7'];
let seq=100;
/* 演示任务仅用于浏览器预览(!__TAURI__)与「恢复示例数据」;桌面端首次启动保持空列表,不再自动写入示例 */
const DEMO_TASKS=[
  {id:1, title:'写周报并发给项目负责人', list:'work', tags:['深度工作'], prio:3, due:TODAY, time:'14:00', remind:'13:50', repeat:'weekly', note:'模板在共享盘 /周报/2026,记得附上数据截图。', subs:[{t:'汇总本周进展',d:true},{t:'整理下周计划',d:false},{t:'同步风险项',d:false}]},
  {id:2, title:'客户方案评审会', list:'work', tags:['重要客户'], prio:2, due:TODAY, time:'10:30', remind:'10:15', note:'腾讯会议 889-2231,提前准备演示环境。'},
  {id:3, title:'回复合作方邮件', list:'work', prio:2, due:addDays(-1)},
  {id:4, title:'缴纳房租', list:'life', prio:3, due:addDays(-2), repeat:'monthly'},
  {id:5, title:'预约下周体检', list:'life', prio:1, due:TODAY},
  {id:6, title:'健身 · 上肢训练', list:'life', due:TODAY, time:'19:00', remind:'18:30', repeat:'weekly'},
  {id:7, title:'超市采购:牛奶、鸡蛋、咖啡豆', list:'life', due:TODAY},
  {id:8, title:'Rust 入门 · 第 5 章所有权', list:'study', prio:1, due:TODAY, tags:['阅读'], subs:[{t:'阅读章节内容',d:true},{t:'完成课后练习',d:false}]},
  {id:9, title:'英语听力 30 分钟', list:'study', due:TODAY, repeat:'daily', tags:['通勤']},
  {id:10,title:'整理项目复盘文档', list:'work', prio:2, due:addDays(1)},
  {id:11,title:'和设计师过一遍官网视觉稿', list:'work', tags:['重要客户'], prio:2, due:addDays(1), time:'15:00'},
  {id:12,title:'阅读《卡片笔记写作法》第 3 章', list:'study', tags:['阅读'], due:addDays(2)},
  {id:13,title:'给妈妈打电话', list:'life', due:addDays(3), repeat:'weekly'},
  {id:14,title:'团队季度 OKR 讨论会', list:'work', prio:2, due:addDays(4), time:'10:00'},
  {id:15,title:'规划十一出行路线', list:'life', due:addDays(5)},
  {id:16,title:'整理桌面文件归档', due:addDays(1)},
  {id:17,title:'看看新品发布会的回放', due:addDays(3)},
  {id:18,title:'晨会', list:'work', due:TODAY, done:true, doneAt:TODAY},
  {id:19,title:'买咖啡豆', list:'life', due:TODAY, done:true, doneAt:TODAY},
  {id:20,title:'提交差旅报销单', list:'work', due:addDays(-1), done:true, doneAt:addDays(-1)},
  {id:21,title:'健身房年卡续费', list:'life', done:true, doneAt:addDays(-3)},
];
let tasks=window.__TAURI__?[]:JSON.parse(JSON.stringify(DEMO_TASKS));
const byId=id=>tasks.find(t=>t.id===id);
const PRIO={3:{n:'高',c:'#E5484D',cls:'flag-hi'},2:{n:'中',c:'#F5A524',cls:'flag-md'},1:{n:'低',c:'#4A9EF5',cls:'flag-lo'},0:{n:'无',c:'#A4A4B0',cls:''}};
function fmtRepeat(r){
  if(!r||!r.type)return'';
  const iv=r.interval&&r.interval>1?r.interval:1;
  if(r.type==='daily')return iv>1?`每 ${iv} 天`:'每天';
  if(r.type==='workday')return'工作日';
  if(r.type==='weekly'){
    const w=(r.weekdays||[]).slice().sort((a,b)=>a-b).map(d=>'一二三四五六日'[d-1]).join('、');
    return(iv>1?`每 ${iv} 周`:'每周')+(w?`(${w})`:'');
  }
  if(r.type==='monthly')return(iv>1?`每 ${iv} 月`:'每月')+(r.monthDay?` ${r.monthDay} 号`:'');
  if(r.type==='yearly')return iv>1?`每 ${iv} 年`:'每年';
  return'重复';
}
function normRepeat(r){
  if(!r)return null;
  if(typeof r!=='object'){
    const m={daily:{type:'daily',interval:1},weekly:{type:'weekly',interval:1,weekdays:[]},
      monthly:{type:'monthly',interval:1},yearly:{type:'yearly',interval:1}};
    return m[r]||null;
  }
  return r.type?r:null;
}

/* ================= 状态 ================= */
let settings=Object.assign({themeMode:localStorage.getItem('dodo-theme')||'light',startView:'today',weekStart:'mon',timeFormat:'24',notify:true,defaultRemind:null,dataDir:'',backupDir:'',ballVisible:true},JSON.parse(localStorage.getItem('dodo-settings')||'{}'));
const SAMPLE=JSON.parse(JSON.stringify(DEMO_TASKS));
const state={view:'today',search:'',calMonth:null,calSel:TODAY,detailId:null,addingList:false,addingTag:false};
if(!state.calMonth){const n=new Date();state.calMonth=new Date(n.getFullYear(),n.getMonth(),1)}

/* ================= 侧边栏 ================= */
const SMART=[
  {id:'today',   name:'今天',  icon:'sun'},
  {id:'inbox',   name:'收件箱',icon:'inbox'},
  {id:'upcoming',name:'计划',  icon:'cal7'},
  {id:'kanban',  name:'看板',  icon:'kanban'},
  {id:'calendar',name:'日历',  icon:'calendar'},
  {id:'all',     name:'全部',  icon:'layers'},
  {id:'completed',name:'已完成',icon:'check'},
  {id:'stats',   name:'统计',  icon:'chart'},
];
let EXTRA_TAGS=[];
function tagList(){return[...new Set([...EXTRA_TAGS,...tasks.flatMap(t=>t.tags||[])])]}
function buildSidebar(){
  const todayCnt=tasks.filter(t=>!t.done&&t.due&&diffDays(TODAY,t.due)<=0).length;
  const overdueCnt=tasks.filter(t=>!t.done&&t.due&&diffDays(TODAY,t.due)<0).length;
  const inboxCnt=tasks.filter(t=>!t.done&&!t.list).length;
  const nav=(v,name,icon,badge,red)=>`
    <div class="nav-item ${state.view===v?'active':''}" data-nav="${v}">
      ${ic(icon,16.5)}<span class="nav-name">${name}</span>${badge?`<span class="badge ${red?'red':''}">${badge}</span>`:''}
    </div>`;
  let html=`
  <div class="nav-sec" style="margin-top:2px">${SMART.map(s=>nav(s.id,s.name,s.icon,
    s.id==='today'?todayCnt:(s.id==='inbox'?inboxCnt:0),s.id==='today'&&overdueCnt>0)).join('')}</div>`;
  html+=`<div class="nav-sec">
    <div class="nav-sec-head"><span>清单</span></div>
    ${LISTS.map(l=>{const c=tasks.filter(t=>!t.done&&t.list===l.id).length;return`
      <div class="nav-item ${state.view==='list:'+l.id?'active':''}" data-nav="list:${l.id}">
        <span class="dot" style="background:${l.color}"></span><span class="nav-name">${esc(l.name)}</span>${c?`<span class="badge">${c}</span>`:''}
      </div>`}).join('')}
  </div>`;
  const tags=tagList();
  if(tags.length)html+=`<div class="nav-sec"><div class="nav-sec-head"><span>标签</span></div>
    ${tags.map(tg=>{const c=tasks.filter(t=>!t.done&&(t.tags||[]).includes(tg)).length;return`
      <div class="nav-item ${state.view==='tag:'+tg?'active':''}" data-nav="tag:${esc(tg)}">
        ${ic('tag',15)}<span class="nav-name">${esc(tg)}</span>${c?`<span class="badge">${c}</span>`:''}
      </div>`}).join('')}</div>`;
  html+=`<div class="sidebar-foot">
    <div class="nav-item" data-settings>${ic('sliders',16.5)}<span class="nav-name">设置</span></div>
  </div>`;
  $('#sidebar').innerHTML=html;
}

/* ================= 视图数据 ================= */
function matchSearch(t){
  const q=state.search.trim().toLowerCase();
  return !q||(t.title+' '+(t.note||'')).toLowerCase().includes(q);
}
function groups(){
  const v=state.view, g=[];
  const push=(title,items,accent)=>{items=items.filter(matchSearch).sort(cmp);if(items.length||!state.search.trim())g.push({title,items,accent})};
  if(v==='today'){
    push('逾期',tasks.filter(t=>!t.done&&t.due&&diffDays(TODAY,t.due)<0),'overdue');
    push('今天',tasks.filter(t=>!t.done&&t.due===TODAY));
  }else if(v==='inbox'){
    push('收件箱',tasks.filter(t=>!t.done&&!t.list));
  }else if(v==='upcoming'){
    for(let i=0;i<7;i++){const d=addDays(i);
      push(dayLabel(d),tasks.filter(t=>!t.done&&t.due===d),i===0?'today':'');}
  }else if(v==='all'){
    for(const l of LISTS)push(l.name,tasks.filter(t=>!t.done&&t.list===l.id));
    push('收件箱',tasks.filter(t=>!t.done&&!t.list));
  }else if(v.startsWith('list:')){
    const l=listById(v.slice(5));push(l?l.name:'清单',tasks.filter(t=>!t.done&&t.list===v.slice(5)));
  }else if(v.startsWith('tag:')){
    const tg=v.slice(4);push('# '+tg,tasks.filter(t=>!t.done&&(t.tags||[]).includes(tg)));
  }else if(v==='completed'){
    push('今天完成',tasks.filter(t=>t.done&&t.doneAt===TODAY));
    push('更早完成',tasks.filter(t=>t.done&&t.doneAt&&t.doneAt!==TODAY));
  }
  return g;
}

/* ================= 任务行 ================= */
/* 标题高亮:搜索状态下把命中片段包上 <mark>(先转义再替换,防注入) */
function hlTitle(s){
  const q=state.search.trim();if(!q)return esc(s);
  return esc(s).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),m=>`<mark>${m}</mark>`);
}
function taskRow(t,opts={}){
  const l=t.list?listById(t.list):null;
  const df=t.due?diffDays(TODAY,t.due):null;
  const dueCls=df==null?'':(df<0?'due over':(df===0?'due today':'due'));
  const subs=t.subs||[],sd=subs.filter(s=>s.d).length;
  return`
  <div class="task-row ${t.done?'done':''}" data-open="${t.id}">
    <button class="checkbox ${t.done?'checked':''}" data-toggle="${t.id}">${CHECK_SVG}</button>
    <div class="task-main">
      <div><span class="tt">${hlTitle(t.title)}</span><span class="chips">${(t.tags||[]).map(tg=>`<span class="tchip">${esc(tg)}</span>`).join('')}</span></div>
      ${(l||t.due||t.time||t.repeat||subs.length)?`<div class="meta">
        ${l?`<span class="m-item"><span class="ldot" style="background:${l.color}"></span>${esc(l.name)}</span>`:''}
        ${t.time?`<span class="m-item">${ic('clock',12)}${fmtTime(t.time)}</span>`:''}
        ${t.due?`<span class="m-item due ${dueCls}">${fmtDue(t.due)}</span>`:''}
        ${t.repeat?`<span class="m-item">${ic('repeat',12)}${esc(fmtRepeat(t.repeat))}</span>`:''}
        ${t.done&&t.nextDue?`<span class="m-item">${ic('repeat',12)}下次 ${fmtDue(t.nextDue)} 恢复待办</span>`:''}
        ${subs.length?`<span class="m-item"><span class="subbar"><i style="width:${Math.round(sd/subs.length*100)}%"></i></span>${sd}/${subs.length}</span>`:''}
      </div>`:''}
    </div>
    <div class="task-side">
      ${t.prio?`<span class="${PRIO[t.prio].cls}" title="${PRIO[t.prio].n}优先级">${ic('flag',14,2)}</span>`:''}
      <span class="row-actions">
        ${opts.move?`<button class="row-btn" data-move="${t.id}" title="移到明天">${ic('arrow',14)}</button>`:''}
        ${t.done?`<button class="row-btn ok" data-restore="${t.id}" title="恢复任务">${ic('undo',14)}</button>`:''}
        <button class="row-btn del" data-del="${t.id}" title="删除">${ic('trash',14)}</button>
      </span>
    </div>
  </div>`;
}
function emptyState(icon,title,sub){
  const badge=icon==='inbox'
    ?`<circle cx="63" cy="63" r="9" fill="var(--surface)" stroke="var(--primary)" stroke-width="2.4"/><path d="M69.5 69.5 76 76" stroke="var(--primary)" stroke-width="2.4" stroke-linecap="round"/>`
    :`<circle cx="66" cy="66" r="11" fill="url(#egb)"/><path d="M61.2 66.4l3.1 3.1 5.9-6.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return`<div class="empty"><div class="eicon">
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <defs>
        <radialGradient id="egr" cx="50%" cy="40%" r="70%">
          <stop offset="0" stop-color="var(--primary)" stop-opacity=".16"/>
          <stop offset="1" stop-color="var(--primary)" stop-opacity=".03"/>
        </radialGradient>
        <linearGradient id="egb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/>
        </linearGradient>
      </defs>
      <circle cx="48" cy="48" r="40" fill="url(#egr)"/>
      <circle cx="17" cy="29" r="3" fill="var(--primary)" opacity=".3"/>
      <circle cx="81" cy="26" r="2.5" fill="var(--orange)" opacity=".65"/>
      <circle cx="76" cy="74" r="3" fill="var(--green)" opacity=".3"/>
      <path d="M74 11.6l1.5 4.1 4.1 1.5-4.1 1.5-1.5 4.1-1.5-4.1-4.1-1.5 4.1-1.5z" fill="var(--orange)" opacity=".8"/>
      <g transform="rotate(-4 48 51)">
        <rect x="30" y="24" width="36" height="54" rx="9" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
        <rect x="41" y="20" width="14" height="8" rx="4" fill="var(--primary-soft)" stroke="var(--primary)" stroke-width="1.5"/>
        <rect x="36" y="38" width="10" height="10" rx="3" fill="var(--green)"/>
        <path d="M38.6 43l2 2 3.6-4" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="50" y="41.5" width="13" height="3" rx="1.5" fill="var(--text-3)" opacity=".5"/>
        <rect x="36" y="52" width="10" height="10" rx="3" stroke="var(--text-3)" stroke-width="1.5" opacity=".55"/>
        <rect x="50" y="55.5" width="10" height="3" rx="1.5" fill="var(--text-3)" opacity=".35"/>
        <rect x="36" y="66" width="10" height="10" rx="3" stroke="var(--text-3)" stroke-width="1.5" opacity=".55"/>
        <rect x="50" y="69.5" width="12" height="3" rx="1.5" fill="var(--text-3)" opacity=".35"/>
      </g>
      ${badge}
    </svg></div>
    <h3>${title}</h3><p>${sub}</p></div>`;
}

/* ================= 主区渲染 ================= */
/* 统计视图交互:趋势悬浮提示 + 环形图例双向联动(元素随渲染重建,渲染后直接绑定,不会累积) */
function bindStInteractions(){
  const svg=document.getElementById('stChartSvg');
  if(svg){
    const tip=document.getElementById('stTip'),guide=document.getElementById('stGuide');
    const pts=JSON.parse(svg.dataset.pts);
    const dots=[...svg.querySelectorAll('.st-pt')];
    let hot=-1;
    svg.addEventListener('mousemove',e=>{
      const r=svg.getBoundingClientRect();
      const vx=(e.clientX-r.left)/r.width*600;
      let b=0;for(let i=1;i<pts.length;i++)if(Math.abs(pts[i].x-vx)<Math.abs(pts[b].x-vx))b=i;
      if(b!==hot){if(hot>=0)dots[hot].classList.remove('hot');hot=b;dots[b].classList.add('hot')}
      guide.setAttribute('x1',pts[b].x);guide.setAttribute('x2',pts[b].x);guide.style.opacity=.45;
      tip.style.left=Math.min(Math.max(pts[b].x/600*r.width,56),r.width-56)+'px';
      tip.style.top=pts[b].y/168*r.height+'px';
      tip.innerHTML=pts[b].l+' · 完成 <b>'+pts[b].v+'</b> 项';
      tip.classList.add('show');
    });
    svg.addEventListener('mouseleave',()=>{
      if(hot>=0)dots[hot].classList.remove('hot');hot=-1;
      tip.classList.remove('show');guide.style.opacity=0;
    });
  }
  const box=document.querySelector('.st-dist[data-total]');
  if(box){
    const num=document.getElementById('stDcNum'),lbl=document.getElementById('stDcLbl');
    const segs=[...box.querySelectorAll('.st-seg')],rows=[...box.querySelectorAll('.st-lgrow')];
    const focus=i=>{
      segs.forEach((s,j)=>{s.style.opacity=i<0||j===i?1:.25;s.style.strokeWidth=j===i?17:14});
      rows.forEach((r,j)=>r.classList.toggle('dim',i>=0&&j!==i));
      if(i>=0){num.textContent=rows[i].dataset.n;lbl.textContent=rows[i].dataset.name+' · '+rows[i].dataset.pct+'%'}
      else{num.textContent=box.dataset.total;lbl.textContent='未完成'}
    };
    [...segs,...rows].forEach(el=>{
      el.addEventListener('mouseenter',()=>focus(+el.dataset.i));
      el.addEventListener('mouseleave',()=>focus(-1));
    });
  }
}
let lastAnimView=null;
function buildMain(){
  const v=state.view;
  const av=(lastAnimView===v)?'':(lastAnimView=v,'view-anim');
  const el=$('#mainScroll');
  /* 日历视图 */
  if(v==='calendar'){
    const y=state.calMonth.getFullYear(),m=state.calMonth.getMonth();
    const ws=settings.weekStart==='sun'?0:1;
    const off=((new Date(y,m,1).getDay()-ws)+7)%7, dim=new Date(y,m+1,0).getDate(), dimP=new Date(y,m,0).getDate();
    let cells='';
    for(let i=0;i<42;i++){
      let num,diso,dimmed=false;
      if(i<off){num=dimP-off+1+i;dimmed=true;diso=iso(new Date(y,m-1,num))}
      else if(i-off<dim){num=i-off+1;diso=iso(new Date(y,m,num))}
      else{num=i-off-dim+1;dimmed=true;diso=iso(new Date(y,m+1,num))}
      const dts=tasks.filter(t=>t.due===diso&&!t.done);
      const dots=dts.slice(0,3).map(t=>{const c=t.list?listById(t.list)?.color:null;return`<span class="cal-dot" style="background:${c||'var(--text-3)'}"></span>`}).join('');
      cells+=`<div class="cal-cell ${dimmed?'dim':''} ${diso===state.calSel?'sel':''} ${diso===TODAY?'today':''}" data-cal="${diso}">
        <span class="cal-num">${num}</span><div class="cal-dots">${dots}${dts.length>3?`<span class="cal-more">+${dts.length-3}</span>`:''}</div></div>`;
    }
    const sel=state.calSel, selTs=tasks.filter(t=>t.due===sel).sort(cmp);
    const sx=parseISO(sel);
    el.innerHTML=`<div class="${av}">
      <div class="view-head"><div><div class="view-title">日历</div><div class="view-sub">按月浏览任务,点击日期查看当天安排</div></div></div>
      <div class="cal-wrap"><div class="cal-main">
        <div class="cal-nav">
          <span class="ym">${y} 年 ${m+1} 月</span>
          <button class="btn-ghost" data-cal-today>回到今天</button>
          <button class="icon-btn" data-cm="-1">${ic('chevL',16)}</button>
          <button class="icon-btn" data-cm="1">${ic('chevR',16)}</button>
        </div>
        <div class="cal-week">${(ws===1?['一','二','三','四','五','六','日']:['日','一','二','三','四','五','六']).map(d=>`<span>周${d}</span>`).join('')}</div>
        <div class="cal-grid">${cells}</div>
      </div>
      <div class="cal-side">
        <h4>${sx.getMonth()+1}月${sx.getDate()}日</h4><div class="cs-sub">${WD[sx.getDay()]}${sel===TODAY?' · 今天':''}</div>
        ${selTs.length?selTs.map(t=>taskRow(t)).join(''):`<div style="font-size:12.5px;color:var(--text-3);padding:8px 2px">这一天没有任务</div>`}
      </div></div></div>`;
    return;
  }
  /* 看板视图 */
  if(v==='kanban'){
    const cols=[3,2,1,0].map(p=>({p,items:tasks.filter(t=>!t.done&&(t.prio||0)===p&&matchSearch(t))}));
    el.innerHTML=`<div class="${av}">
      <div class="view-head"><div><div class="view-title">看板</div><div class="view-sub">按优先级分列,拖动卡片可调整优先级</div></div></div>
      <div class="kanban">${cols.map(c=>`
        <div class="kcol" data-drop="${c.p}">
          <div class="kcol-head"><span class="dot" style="background:${PRIO[c.p].c};width:9px;height:9px"></span>${PRIO[c.p].n}优先级<span class="cnt">${c.items.length}</span></div>
          <div class="kcol-body">${c.items.map(t=>{
            const l=t.list?listById(t.list):null;const df=t.due?diffDays(TODAY,t.due):null;
            return`<div class="kcard" draggable="true" data-open="${t.id}" data-drag="${t.id}">
              <div class="kcard-title">${esc(t.title)}</div>
              <div class="kcard-meta">${l?`<span class="dot" style="background:${l.color};width:6px;height:6px"></span>${esc(l.name)}`:''}
              ${t.due?`<span class="${df!=null&&df<0?'due over':(df===0?'due today':'')}">${fmtDue(t.due)}</span>`:''}
              ${(t.subs||[]).length?`<span>${ic('checkS',11)}${t.subs.filter(s=>s.d).length}/${t.subs.length}</span>`:''}</div>
            </div>`}).join('')||`<div class="kempty">拖卡片到这里</div>`}</div>
        </div>`).join('')}</div></div>`;
    return;
  }
  /* 统计视图(W13,C41 改版):语义指标卡(可点跳转)+ 近 7 天面积趋势(悬浮提示/日均参考线)+ 未完成环形分布(图例联动) */
  if(v==='stats'){
    const undone=tasks.filter(t=>!t.done).length;
    const todayDue=tasks.filter(t=>!t.done&&t.due===TODAY).length;
    const overdueList=tasks.filter(t=>!t.done&&t.due&&diffDays(TODAY,t.due)<0);
    const overdue=overdueList.length;
    const doneCnt=tasks.filter(t=>t.done).length;
    const doneOn=d=>tasks.filter(t=>(t.history||[]).includes(d)||(t.done&&t.doneAt===d)).length;
    const days=[...Array(7)].map((_,i)=>addDays(i-6));
    const counts=days.map(doneOn);
    const max=Math.max(1,...counts),weekSum=counts.reduce((a,b)=>a+b,0),avg=weekSum/7;
    const prevSum=[...Array(7)].map((_,i)=>doneOn(addDays(i-13))).reduce((a,b)=>a+b,0);
    const dist=LISTS.map(l=>({name:l.name,color:l.color,n:tasks.filter(t=>!t.done&&t.list===l.id).length}))
      .concat([{name:'收件箱',color:'',n:tasks.filter(t=>!t.done&&!t.list).length}])
      .filter(d=>d.n>0).sort((a,b)=>b.n-a.n);
    /* 指标卡背景说明:让每个数字自带语义 */
    const usedLists=LISTS.filter(l=>tasks.some(t=>!t.done&&t.list===l.id)).length;
    const usedInbox=tasks.some(t=>!t.done&&!t.list);
    const undoneSub=!undone?'享受当下吧':usedLists&&usedInbox?`${usedLists} 个清单 + 收件箱`:usedLists?`${usedLists} 个清单`:'收件箱';
    const hiToday=tasks.filter(t=>!t.done&&t.due===TODAY&&t.prio===3).length;
    const todaySub=!todayDue?'今天没有到期任务':hiToday?`含 ${hiToday} 项高优先级`:'无高优先级任务';
    const maxOver=overdue?Math.max(...overdueList.map(t=>-diffDays(TODAY,t.due))):0;
    const overSub=!overdue?'没有逾期任务':`最久逾期 ${maxOver} 天`;
    const card=o=>`<div class="st-card" data-nav="${o.nav}" title="${o.title}">
      <span class="st-go">${ic('chevR',14,2)}</span>
      <div class="st-chip ${o.chip}">${ic(o.icon,16)}</div>
      <div class="st-num ${o.cls||''}">${o.n}</div><div class="st-label">${o.label}</div>
      <div class="st-sub">${o.dot?`<span class="sd" style="background:${o.dot}"></span>`:''}${o.sub}</div></div>`;
    /* 近 7 天面积图:平滑曲线(Catmull-Rom)+ 日均虚线;整周无完成则出空状态 */
    const r1=x=>Math.round(x*10)/10;
    const pts=days.map((d,i)=>({x:r1(10+i*(580/6)),y:r1(128-counts[i]/max*100),v:counts[i],l:d===TODAY?'今天':WD[parseISO(d).getDay()]}));
    const avgY=r1(128-avg/max*100),avgLy=avgY-7<16?r1(avgY+16):avgY-7;
    let chart,deltaHtml='';
    if(!weekSum){
      chart=`<div class="st-chart-empty"><div class="ic-wrap">${ic('minus',16)}</div>近 7 天还没有完成记录<small>完成任务后,这里会记录你的节奏</small></div>`;
    }else{
      let line=`M${pts[0].x},${pts[0].y}`;
      for(let i=0;i<6;i++){
        const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
        line+=` C${r1(p1.x+(p2.x-p0.x)/6)},${r1(p1.y+(p2.y-p0.y)/6)} ${r1(p2.x-(p3.x-p1.x)/6)},${r1(p2.y-(p3.y-p1.y)/6)} ${p2.x},${p2.y}`;
      }
      const dPct=prevSum?Math.round(Math.abs(weekSum-prevSum)/prevSum*100):0;
      const delta=!prevSum?'':weekSum===prevSum?`<span class="st-delta flat">与上周持平</span>`
        :weekSum>prevSum?`<span class="st-delta"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>较上周 +${dPct}%</span>`
        :`<span class="st-delta down"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-6-6 6 6 6-6"/></svg>较上周 -${dPct}%</span>`;
      chart=`<div class="st-chart">
        <svg id="stChartSvg" viewBox="0 0 600 168" data-pts="${esc(JSON.stringify(pts))}">
          <defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--primary)" stop-opacity=".2"/><stop offset="1" stop-color="var(--primary)" stop-opacity="0"/>
          </linearGradient></defs>
          <line class="avg" x1="10" y1="${avgY}" x2="590" y2="${avgY}"/><text class="avglbl" x="590" y="${avgLy}" text-anchor="end">日均 ${avg.toFixed(1)}</text>
          <path class="afill" fill="url(#stg)" d="${line} L590,128 L10,128 Z"/>
          <path class="aline" d="${line}"/>
          <line class="sguide" id="stGuide" x1="0" y1="16" x2="0" y2="128"/>
          ${pts[6].v?`<circle cx="${pts[6].x}" cy="${pts[6].y}" r="9" fill="var(--primary-halo)"/>`:''}
          ${pts.map((p,i)=>`<circle class="st-pt${i===6?' tdy':''}" cx="${p.x}" cy="${p.y}" r="${i===6?4.5:3.5}" fill="var(--surface)" stroke="var(--primary)" stroke-width="${i===6?2.25:2}"/>`).join('')}
          ${pts.map((p,i)=>`<text class="aval${i===6?' tdy':''}" x="${p.x}" y="${Math.max(14,p.y-14)}" text-anchor="middle">${p.v}</text>`).join('')}
          <line class="base" x1="10" y1="128" x2="590" y2="128"/>
          ${pts.map((p,i)=>`<text class="aday${i===6?' tdy':''}" x="${i===6?586:p.x}" y="152" text-anchor="middle">${p.l}</text>`).join('')}
        </svg>
        <div class="st-tip" id="stTip"></div></div>`;
      deltaHtml=delta;
    }
    /* 未完成分布:环形(圆头扇区,缝隙自适应)+ 图例;全部完成则出空状态 */
    const C=2*Math.PI*52;
    let distHtml;
    if(!dist.length){
      distHtml=`<div class="st-dist"><div class="st-donut">
          <svg viewBox="0 0 132 132" width="132" height="132"><circle cx="66" cy="66" r="52" fill="none" stroke="var(--surface-2)" stroke-width="14"/></svg>
          <div class="st-donut-c"><b>0</b><span>未完成</span></div></div>
        <div class="st-empty-msg"><div class="ic-wrap">${ic('check',16,2)}</div>所有任务都完成了<small>添加新任务后,分布会出现在这里</small></div></div>`;
    }else{
      const raws=dist.map(d=>d.n/undone*C);
      const gap=dist.length===1?0:Math.min(16,Math.min(...raws)*0.5);
      let acc=0,segs='';
      dist.forEach((d,i)=>{
        const len=Math.max(.5,r1(raws[i]-gap));
        segs+=`<circle class="st-seg" data-i="${i}" data-n="${d.n}" data-name="${esc(d.name)}" data-pct="${Math.round(d.n/undone*100)}" cx="66" cy="66" r="52" stroke="${d.color||'var(--text-3)'}" stroke-dasharray="${len} ${r1(C)}" stroke-dashoffset="${r1(-(acc+gap/2))}"/>`;
        acc+=raws[i];
      });
      const rows=dist.map((d,i)=>`<div class="st-lgrow" data-i="${i}">
        <span class="st-lg-dot" style="background:${d.color||'var(--text-3)'}"></span>
        <span class="st-lg-name">${esc(d.name)}</span>
        <div class="st-lg-track"><i style="width:${Math.max(3,Math.round(d.n/undone*100))}%;background:${d.color||'var(--text-3)'}"></i></div>
        <span class="st-lg-val"><b>${d.n}</b> · ${Math.round(d.n/undone*100)}%</span></div>`).join('');
      distHtml=`<div class="st-dist" data-total="${undone}">
        <div class="st-donut"><svg viewBox="0 0 132 132" width="132" height="132">
          <circle cx="66" cy="66" r="52" fill="none" stroke="var(--surface-2)" stroke-width="14"/>${segs}</svg>
          <div class="st-donut-c"><b id="stDcNum">${undone}</b><span id="stDcLbl">未完成</span></div></div>
        <div class="st-legend">${rows}</div></div>`;
    }
    el.innerHTML=`<div class="${av}">
      <div class="view-head"><div><div class="view-title">统计</div><div class="view-sub">完成趋势与任务分布,数据来自本机完成记录</div></div></div>
      <div class="st-cards">
        ${card({nav:'all',title:'查看全部待办',chip:'t2',icon:'list',n:undone,label:'待办任务',sub:undoneSub})}
        ${card({nav:'today',title:'查看今日任务',chip:'tp',icon:'clock',n:todayDue,cls:todayDue?'is-pri':'',label:'今日到期',sub:todaySub,dot:hiToday?'var(--red)':''})}
        ${card({nav:'today',title:'查看逾期任务',chip:'tr',icon:'alert',n:overdue,cls:overdue?'is-red':'',label:'逾期',sub:overSub})}
        ${card({nav:'completed',title:'查看已完成',chip:'tg',icon:'check',n:doneCnt,cls:'is-green',label:'已完成',sub:`今日 +${doneOn(TODAY)}`,dot:'var(--green)'})}
      </div>
      <div class="st-panel">
        <div class="st-sec-head"><span class="st-sec-title">近 7 天完成</span>
          <span class="st-sec-side">${weekSum?'<span class="st-sec-sum">合计 '+weekSum+' · 日均 '+avg.toFixed(1)+'</span>'+(deltaHtml||''):''}</span></div>
        ${chart}
      </div>
      <div class="st-panel dist">
        <div class="st-sec-head" style="margin-bottom:2px"><span class="st-sec-title">未完成任务分布</span><span class="st-sec-sum">共 ${undone} 项</span></div>
        ${distHtml}
      </div>
    </div>`;
    bindStInteractions();
    return;
  }
  /* 全局搜索结果页(W7):标题+备注跨全库匹配,顶栏回车进入;按 清单/收件箱/已完成 分组 */
  if(v==='search'){
    const q=state.search.trim().toLowerCase();
    const res=tasks.filter(t=>(t.title+' '+(t.note||'')).toLowerCase().includes(q));
    const secs=LISTS.map(l=>({title:l.name,items:res.filter(t=>!t.done&&t.list===l.id).sort(cmp)}))
      .concat([{title:'收件箱',items:res.filter(t=>!t.done&&!t.list).sort(cmp)},
               {title:'已完成',items:res.filter(t=>t.done).sort((a,b)=>(b.doneAt||'').localeCompare(a.doneAt||''))}])
      .filter(s=>s.items.length);
    const head=`<div class="view-title">搜索</div><div class="view-sub">跨清单与已完成任务,匹配标题和备注;清空搜索框即退出</div>`;
    const stat=`<span>搜索“${esc(state.search.trim())}” · ${res.length} 个结果</span>`;
    const body=secs.length?secs.map(g=>`<div class="group">
        <div class="group-title">${esc(g.title)}<span class="cnt">${g.items.length}</span></div>
        ${g.items.map(t=>taskRow(t)).join('')}</div>`).join('')
      :emptyState('inbox','没有找到匹配的任务','试试更换关键词,搜索范围含标题与备注');
    el.innerHTML=`<div class="${av}"><div class="view-head"><div>${head}</div><div class="view-stat">${stat}</div></div>${body}</div>`;
    return;
  }
  /* 列表类视图 */
  const G=groups();
  const flat=G.flatMap(x=>x.items);
  const shown=G.filter(g=>g.items.length);
  let head='',ring='';
  if(v==='today'){
    const undone=tasks.filter(t=>!t.done&&t.due&&diffDays(TODAY,t.due)<=0).length;
    const doneToday=tasks.filter(t=>t.done&&t.doneAt===TODAY).length;
    const total=undone+doneToday, pct=total?Math.round(doneToday/total*100):0;
    if(total)ring=`<div class="ring-wrap"><svg width="46" height="46" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r="19" fill="none" stroke="var(--border)" stroke-width="4.5"/>
      <circle cx="23" cy="23" r="19" fill="none" stroke="${pct===100?'var(--green)':'var(--primary)'}" stroke-width="4.5" stroke-linecap="round"
        stroke-dasharray="${(2*Math.PI*19).toFixed(1)}" stroke-dashoffset="${(2*Math.PI*19*(1-pct/100)).toFixed(1)}" transform="rotate(-90 23 23)" style="transition:stroke-dashoffset .5s"/>
      </svg><div class="ring-num">${pct}%</div></div>`;
    const x=new Date();
    head=`<div class="view-title">今天</div><div class="view-sub">${x.getFullYear()}年${x.getMonth()+1}月${x.getDate()}日 · ${WD[x.getDay()]}</div>`;
  }else{
    const names={inbox:'收件箱',upcoming:'计划',all:'全部',completed:'已完成'};
    const subs={inbox:'没有清单归属的任务会先落在这里',upcoming:'未来 7 天的任务安排',all:'所有未完成任务,按清单分组',completed:'已完成任务的记录'};
    if(v.startsWith('list:')){const l=listById(v.slice(5));head=`<div class="view-title">${esc(l?l.name:'')}</div><div class="view-sub">${flat.length} 个未完成任务</div>`}
    else if(v.startsWith('tag:'))head=`<div class="view-title"># ${esc(v.slice(4))}</div><div class="view-sub">按标签筛选的任务</div>`;
    else head=`<div class="view-title">${names[v]||''}</div><div class="view-sub">${subs[v]||''}</div>`;
  }
  const stat=state.search.trim()
    ?`<span>搜索“${esc(state.search)}” · ${flat.length} 个结果</span>`
    :(v==='today'?`<span>${flat.length} 项待完成</span>`:`<span>${flat.length} 项</span>`);
  let body='';
  if(state.search.trim()&&!flat.length)body=emptyState('inbox','没有找到匹配的任务','试试更换关键词');
  else if(!flat.length)body=emptyState('check','这里没有任务','享受当下,或用下方输入条快速添加');
  else body=shown.map(g=>`<div class="group">
      <div class="group-title ${g.accent==='overdue'?'overdue':''}">${g.title}<span class="cnt">${g.items.length}</span></div>
      ${g.items.map(t=>taskRow(t,{move:v==='today'})).join('')}</div>`).join('');
  el.innerHTML=`<div class="${av}"><div class="view-head"><div>${head}</div><div class="view-stat">${stat}${ring}</div></div>${body}</div>`;
}

/* ================= 详情面板 ================= */
function openDetail(id){state.detailId=id;buildDetail();$('#detailPanel').classList.add('open')}
function closeDetail(){state.detailId=null;closeRep();$('#detailPanel').classList.remove('open')}
function buildDetail(){
  if(state.detailId==null)return;
  const t=byId(state.detailId);if(!t){closeDetail();return}
  const l=t.list?listById(t.list):null;
  const subs=t.subs||[],sd=subs.filter(s=>s.d).length;
  $('#detailInner').innerHTML=`
    <div class="d-head">
      <button class="checkbox ${t.done?'checked':''}" data-toggle="${t.id}">${CHECK_SVG}</button>
      <textarea class="d-title" data-field="title" rows="1" placeholder="任务标题">${esc(t.title)}</textarea>
      <button class="icon-btn" data-close-detail title="关闭">${ic('x',15)}</button>
    </div>
    <textarea class="d-note" data-field="note" placeholder="添加备注…">${esc(t.note||'')}</textarea>
    <div class="d-sec">
      <div class="d-sec-head"><span>子任务 ${subs.length?`· ${sd}/${subs.length}`:''}</span>
        ${subs.length?`<span class="subbar" style="width:64px"><i style="width:${Math.round(sd/subs.length*100)}%;background:var(--primary)"></i></span>`:''}</div>
      ${subs.map((s,i)=>`<div class="d-sub-item ${s.d?'done':''}">
        <button class="checkbox ${s.d?'checked':''}" data-sub="${i}" style="width:15px;height:15px">${CHECK_SVG}</button>
        <span class="st">${esc(s.t)}</span>
        <button class="row-btn" data-subdel="${i}" style="width:22px;height:22px">${ic('x',12)}</button></div>`).join('')}
      <div class="d-sub-add">${ic('plus',14)}<input data-subadd placeholder="添加子任务,回车确认"></div>
    </div>
    <div class="d-sec d-props">
      <div class="d-prop" data-menu="list">${ic('list',15)}<span class="p-label">清单</span>
        <span class="p-val">${l?`<span class="dot" style="background:${l.color}"></span>${esc(l.name)}`:`<span class="ph">收件箱</span>`}${ic('chevR',13)}</span></div>
      <div class="d-prop" data-menu="date">${ic('calendar',15)}<span class="p-label">日期</span>
        <span class="p-val">${t.due?esc(fmtDue(t.due)):(t.time?`<span class="ph">${fmtTime(t.time)}</span>`:`<span class="ph">设置日期</span>`)}${t.time?`<span class="ph">${fmtTime(t.time)}</span>`:''}${ic('chevR',13)}</span></div>
      <div class="d-prop" data-menu="remind">${ic('bell',15)}<span class="p-label">提醒</span>
        <span class="p-val">${t.remind?esc(fmtTime(t.remind)):`<span class="ph">不提醒</span>`}${ic('chevR',13)}</span></div>
      <div class="d-prop" data-menu="repeat">${ic('repeat',15)}<span class="p-label">重复</span>
        <span class="p-val">${t.repeat?esc(fmtRepeat(t.repeat)+(t.repeat.endDate?` · 至${t.repeat.endDate.slice(5)}`:'')+(t.done&&t.nextDue?` · 下次${fmtDue(t.nextDue)} 恢复`:'')):`<span class="ph">不重复</span>`}${ic('chevR',13)}</span></div>
      <div class="d-prop" data-menu="prio">${ic('flag',15)}<span class="p-label">优先级</span>
        <span class="p-val">${t.prio?`<span class="${PRIO[t.prio].cls}" style="display:flex">${ic('flag',13,2)}</span>${PRIO[t.prio].n}`:`<span class="ph">无</span>`}${ic('chevR',13)}</span></div>
      <div class="d-prop" data-menu="tags">${ic('tag',15)}<span class="p-label">标签</span>
        <span class="p-val">${(t.tags||[]).length?(t.tags||[]).map(tg=>`<span class="tchip">${esc(tg)}</span>`).join(''):`<span class="ph">添加标签</span>`}${ic('chevR',13)}</span></div>
    </div>
    <div class="d-foot"><button class="d-copy" data-copy="${t.id}">${ic('copy',15)}复制任务</button><button class="d-del" data-del="${t.id}">${ic('trash',15)}删除任务</button></div>`;
  fitTitle($('#detailInner .d-title'));
}
/* 标题按内容自适应高度(换行显示);回车确认,不插换行 */
function fitTitle(el){
  if(!el)return;
  el.style.height='auto';
  el.style.height=el.scrollHeight+'px';
}

/* ================= 菜单 ================= */
let menuEl=null;
function closeMenu(){if(menuEl){menuEl.remove();menuEl=null;document.removeEventListener('mousedown',outside,false)}}
function outside(e){if(menuEl&&!menuEl.contains(e.target))closeMenu()}
function openMenu(anchor,html,after,cls){
  closeMenu();
  menuEl=document.createElement('div');menuEl.className='menu'+(cls?' '+cls:'');menuEl.innerHTML=html;
  document.body.appendChild(menuEl);
  const r=anchor.getBoundingClientRect(),w=menuEl.offsetWidth,h=menuEl.offsetHeight;
  let x=Math.min(r.left,innerWidth-w-10),y=r.bottom+6;
  if(y+h>innerHeight-10)y=Math.max(10,r.top-h-6);
  menuEl.style.left=x+'px';menuEl.style.top=y+'px';
  document.addEventListener('mousedown',outside,false);
  if(after)after(menuEl);
}
function menuHTML(items){return items.map(it=>{
  if(it.sep)return'<div class="menu-sep"></div>';
  if(it.custom==='date')return`<div class="menu-label">自定义日期</div><div class="menu-input"><input type="date" value="${esc(it.value||'')}" data-date-input></div>`;
  return`<div class="menu-item ${it.active?'active':''}" data-mi="${esc(it.v)}">${it.icon?ic(it.icon,14.5):it.dot?`<span class="dot" style="background:${it.dot};width:9px;height:9px"></span>`:'<span style="width:9px"></span>'}
    <span${it.color?` style="color:${it.color}"`:''}>${esc(it.label)}</span><span class="m-check">${ic('checkS',14,2.2)}</span></div>`;
}).join('')}
function propMenu(kind,anchor){
  const t=byId(state.detailId);if(!t)return;
  if(kind==='list'){
    const items=[{v:'',label:'收件箱',icon:'inbox',active:!t.list},...LISTS.map(l=>({v:l.id,label:l.name,dot:l.color,active:t.list===l.id}))];
    openMenu(anchor,menuHTML(items),m=>m.addEventListener('click',e=>{const mi=e.target.closest('[data-mi]');if(!mi)return;t.list=mi.dataset.mi||null;render()}));
  }else if(kind==='date'){
    openDatePicker(anchor,t);
  }else if(kind==='remind'){
    const cur=(t.remind||'09:00').split(':');
    const html=`
      <div class="menu-label" style="padding-left:12px">快速选择</div>
      ${[['09:00','当天 09:00'],['12:00','当天 12:00'],['21:00','前一天 21:00']].map(([v,l])=>
        `<div class="menu-item ${t.remind===v?'active':''}" data-tp-preset="${v}">${ic('bell',14.5)}<span>${l}</span><span class="m-check">${ic('checkS',14,2.2)}</span></div>`).join('')}
      <div class="menu-sep"></div>
      <div class="ti-row"><span class="lbl">自定义</span>
        <input class="ti-box" data-ti="h" inputmode="numeric" maxlength="2" value="${cur[0]}">
        <span class="ti-sep">:</span>
        <input class="ti-box" data-ti="m" inputmode="numeric" maxlength="2" value="${cur[1]}">
      </div>
      <div class="menu-sep"></div>
      <div class="menu-item" data-mi="__clear">${ic('x',14.5)}<span>不提醒</span></div>`;
    openMenu(anchor,html,m=>{
      const boxes={h:m.querySelector('[data-ti="h"]'),m:m.querySelector('[data-ti="m"]')};
      const commit=()=>{
        if(boxes.h.value===''||boxes.m.value==='')return;
        const h=Math.min(+boxes.h.value,23),mn=Math.min(+boxes.m.value,59);
        t.remind=String(h).padStart(2,'0')+':'+String(mn).padStart(2,'0');
        /* 原地更新提醒行,不重建界面 */
        const cell=document.querySelector('.d-prop[data-menu="remind"] .p-val');
        if(cell)cell.innerHTML=`${esc(fmtTime(t.remind))}${ic('chevR',13)}`;
        m.querySelectorAll('[data-tp-preset]').forEach(b=>b.classList.toggle('active',b.dataset.tpPreset===t.remind));
      };
      Object.entries(boxes).forEach(([unit,el])=>{
        el.addEventListener('input',()=>{
          el.value=el.value.replace(/\D/g,'').slice(0,2);
          if(el.value.length===2){
            el.value=Math.min(+el.value,unit==='h'?23:59);
            commit();
            const next=boxes[unit==='h'?'m':'h'];next.focus();next.select();
          }
        });
        el.addEventListener('blur',()=>{
          if(el.value!=='')el.value=String(Math.min(+el.value||0,unit==='h'?23:59)).padStart(2,'0');
        });
        el.addEventListener('keydown',e=>{if(e.key==='Enter'){el.blur();commit()}});
      });
      m.addEventListener('click',e=>{
        const p=e.target.closest('[data-tp-preset]');
        if(p){const[vh,vm]=p.dataset.tpPreset.split(':');
          t.remind=p.dataset.tpPreset;boxes.h.value=vh;boxes.m.value=vm;
          const cell=document.querySelector('.d-prop[data-menu="remind"] .p-val');
          if(cell)cell.innerHTML=`${esc(fmtTime(t.remind))}${ic('chevR',13)}`;
          m.querySelectorAll('[data-tp-preset]').forEach(b=>b.classList.toggle('active',b===p));return}
        const mi=e.target.closest('[data-mi]');
        if(mi&&mi.dataset.mi==='__clear'){t.remind=null;closeMenu();buildDetail()}
      });
    },'time-menu');
  }else if(kind==='repeat'){
    openRepeatEditor(anchor,t);
  }else if(kind==='prio'){
    const items=[{v:0,label:'无',icon:'flag',active:!t.prio},{v:1,label:'低',icon:'flag',color:PRIO[1].c,active:t.prio===1},
      {v:2,label:'中',icon:'flag',color:PRIO[2].c,active:t.prio===2},{v:3,label:'高',icon:'flag',color:PRIO[3].c,active:t.prio===3}];
    openMenu(anchor,menuHTML(items),m=>m.addEventListener('click',e=>{const mi=e.target.closest('[data-mi]');if(!mi)return;
      t.prio=+mi.dataset.mi||0;render()}));
  }else if(kind==='tags'){
    const all=tagList();    const items=all.length?all.map(tg=>({v:tg,label:tg,icon:'tag',active:(t.tags||[]).includes(tg)})):[{v:'__none',label:'暂无标签 · 去「设置 → 清单与标签」创建',icon:'tag'}];
    openMenu(anchor,menuHTML(items),m=>m.addEventListener('click',e=>{const mi=e.target.closest('[data-mi]');if(!mi)return;
      if(mi.dataset.mi==='__none'){openSettings('lists');return}
      const tg=mi.dataset.mi;t.tags=t.tags||[];const i=t.tags.indexOf(tg);
      if(i>=0)t.tags.splice(i,1);else t.tags.push(tg);render()}));
  }
}

/* ================= 快速添加(自然语言) ================= */
/* 中文数字→数值:支持 零一二两三四五六七八九十 / 十X / X十 / X十Y(时刻范围足够) */
function cnNum(s){
  const D={'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
  if(/^\d+$/.test(s))return+s;
  if(!s||!/^[零一二两三四五六七八九十]+$/.test(s))return NaN;
  const i=s.indexOf('十');
  if(i<0)return D[s]??NaN;
  const a=s.slice(0,i),b=s.slice(i+1);
  return(a?D[a]:1)*10+(b?D[b]:0);
}
function parseQuick(raw){
  /* 全角标点归一化(中文输入法场景) */
  let text=raw.replace(/[！＃＠]/g,c=>({'！':'!','＃':'#','＠':'@'}[c]));
  /* 中文数字时刻归一化:下午三点→下午3点、十二点半→12点半、三点十五分→3点15分 */
  text=text.replace(/(上午|早上|中午|下午|晚上|凌晨)?\s*([零一二两三四五六七八九十]{1,3})点(?:([零一二两三四五六七八九十]{1,3})分)?/g,(w,ap,h,mm)=>{
    const hn=cnNum(h);if(!(hn>=1&&hn<=24))return w;
    let out=(ap||'')+hn+'点';
    if(mm!==undefined){const mn=cnNum(mm);if(mn>=0&&mn<=59)out+=mn+'分'}
    return out;
  });
  const chips=[];let due=null,time=null,list=null,prio=0,repeat=null;const tags=[];
  const take=re=>{const m=text.match(re);if(m){text=text.replace(m[0],' ').trim();return m}return null};
  let m;
  /* 英文时刻:3pm / 10:30am(必须先于数字时刻,否则 3:30pm 会被截成 3:30) */
  if(m=take(/\b(0?[0-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i)){
    let hh=+m[1];const mm=m[2]?+m[2]:0;
    if(/pm/i.test(m[3])&&hh<12)hh+=12;
    if(/am/i.test(m[3])&&hh===12)hh=0;
    time=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;chips.push({k:'date',v:time});
  }
  /* 时刻:14:00 / 14点 / 下午3点半 / 上午9:30 */
  if(!time&&(m=take(/(?:上午|早上|中午|下午|晚上|凌晨)?\s*\d{1,2}[:：点]\d{0,2}分?半?/))){
    const am=m[0].match(/上午|早上|中午|下午|晚上|凌晨/)?.[0];
    const half=/半/.test(m[0]);
    let s=m[0].replace(/[分\s]/g,'').replace(/[：点]/g,':').replace('半','');
    if(am)s=s.replace(am,'');
    let[hh,mm]=s.split(':');hh=+hh;mm=mm?+mm:(half?30:0);
    if((am==='下午'||am==='晚上')&&hh<12)hh+=12;
    if(am==='中午'&&hh<12)hh=12;
    if(hh<24){time=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;chips.push({k:'date',v:time})}
  }
  /* 重复:每天 / 每周 / 每月 */
  if(m=take(/每个?月/)){repeat={type:'monthly',interval:1};chips.push({k:'date',v:'每月'})}
  else if(m=take(/每个?周([一二三四五六日天])?/)){
    repeat={type:'weekly',interval:1,weekdays:m[1]?['一二三四五六日天'.indexOf(m[1])+1]:[]};
    if(m[1]){const wd='一二三四五六日天'.indexOf(m[1]);
      let delta=(wd+1-new Date().getDay()+7)%7;if(delta===0)delta=7;due=addDays(delta)}
    chips.push({k:'date',v:'每周'+(m[1]||'')});
  }
  else if(m=take(/每个?(天|日)/)){repeat={type:'daily',interval:1};chips.push({k:'date',v:'每天'})}
  /* 相对日期:今天/明天/后天/大后天/tomorrow */
  if(m=take(/tomorrow|大后天|后天|明天|今天|今日|明日/i)){
    const off=m[0].toLowerCase()==='tomorrow'?1:{'今天':0,'今日':0,'明天':1,'明日':1,'后天':2,'大后天':3}[m[0]];
    due=addDays(off);chips.push({k:'date',v:m[0]});
  }
  if(!due&&(m=take(/下个?月(\d{1,2})[日号]?/))){
    const now=new Date();due=iso(new Date(now.getFullYear(),now.getMonth()+1,+m[1]||1));chips.push({k:'date',v:m[0]});
  }
  /* 复杂表达:月底=本月最后一天 */
  if(!due&&(m=take(/月底/))){
    const now=new Date();due=iso(new Date(now.getFullYear(),now.getMonth()+1,0));chips.push({k:'date',v:'月底'});
  }
  if(!due&&(m=take(/\d{1,2}月\d{1,2}[日号]/))){
    const[a,b]=m[0].match(/\d+/g).map(Number);
    const now=new Date();let d=new Date(now.getFullYear(),a-1,b);if(d<now)d=new Date(now.getFullYear()+1,a-1,b);
    due=iso(d);chips.push({k:'date',v:m[0]});
  }
  if(!due&&(m=text.match(/\d{4}-\d{1,2}-\d{1,2}/))){
    const[y,mo,dd]=m[0].split('-').map(Number),p=v=>String(v).padStart(2,'0'),d=new Date(y,mo-1,dd);
    // 越界日期(2026-99-99 / 2026-2-30)不解析也不吞字:round-trip 校验拦截 Date 自动进位
    if(mo>=1&&mo<=12&&dd>=1&&dd<=31&&iso(d)===`${y}-${p(mo)}-${p(dd)}`){
      text=text.replace(m[0],' ').trim();due=iso(d);chips.push({k:'date',v:m[0]});
    }
  }
  if(!due&&(m=take(/(下下|下)?周[一二三四五六日天]/))){
    const wd='一二三四五六日天'.indexOf(m[0].replace(/下/g,'').replace('周',''));
    const now=new Date();let delta=(wd+1-now.getDay()+7)%7;if(delta===0)delta=7;
    delta+=7*(m[0].startsWith('下下')?2:(m[0].includes('下')?1:0));
    due=addDays(delta);chips.push({k:'date',v:m[0]});
  }
  if(!due&&(m=take(/(下下|下)?周末/))){
    let delta=(6-new Date().getDay()+7)%7||7;
    delta+=7*(m[0].startsWith('下下')?2:(m[0].includes('下')?1:0));
    due=addDays(delta);chips.push({k:'date',v:m[0]});
  }
  if(!due&&(m=text.match(/\d{1,2}[日号]/))){
    const day=parseInt(m[0],10);
    if(day>=1&&day<=31){
      text=text.replace(m[0],' ').trim();
      const now=new Date();
      let d=new Date(now.getFullYear(),now.getMonth(),day);
      if(d<new Date(now.getFullYear(),now.getMonth(),now.getDate()))d=new Date(now.getFullYear(),now.getMonth()+1,day);
      due=iso(d);chips.push({k:'date',v:m[0]});
    }
  }
  /* 清单与标签 */
  while(m=take(/#(\S+)/)){const g=m[1];const l=LISTS.find(l=>l.name===g||l.name.startsWith(g));if(l){list=l.id;chips.push({k:'list',v:'#'+l.name})}else{tags.push(g);chips.push({k:'tag',v:'#'+g})}}
  while(m=take(/@(\S+)/)){tags.push(m[1]);chips.push({k:'tag',v:'@'+m[1]})}
  /* 优先级:!高 / 高优先级 / 优先级高 / P1-P3 */
  if(m=take(/!(?:优先级)?(高|中|低)(?:优先级)?/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/(高|中|低)优先级/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/优先级(高|中|低)/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/\bP([123])\b/i)){prio={'1':3,'2':2,'3':1}[m[1].toLowerCase()]}
  if(prio)chips.push({k:'prio',v:{3:'高',2:'中',1:'低'}[prio],p:prio});
  /* 重复规则缺省补全:每周未选周几→跟随到期日;每月未选几号→跟随到期日/今天 */
  if(repeat){
    if(repeat.type==='weekly'&&(!repeat.weekdays||!repeat.weekdays.length)){
      repeat.weekdays=[due?((parseISO(due).getDay()+6)%7+1):((new Date().getDay()+6)%7+1)];
      if(!due)due=addDays(0);
    }
    if(repeat.type==='monthly'&&!repeat.monthDay)repeat.monthDay=due?parseISO(due).getDate():new Date().getDate();
  }
  return{text,chips,due,time,list,prio,repeat,tags};
}

/* ================= 解析器自测(浏览器地址加 ?selftest=1 自动运行) ================= */
function runParseTests(){
  const tests=[];const F=(cond,msg)=>tests.push(cond?null:msg);
  const wed=(()=>{const n=new Date();return addDays((3-n.getDay()+7)%7||7)})();
  const sat=(()=>{const n=new Date();return addDays((6-n.getDay()+7)%7||7)})();
  const nm5=(()=>{const n=new Date();return iso(new Date(n.getFullYear(),n.getMonth()+1,5))})();
  const day20=(()=>{const n=new Date();let d=new Date(n.getFullYear(),n.getMonth(),20);
    if(d<new Date(n.getFullYear(),n.getMonth(),n.getDate()))d=new Date(n.getFullYear(),n.getMonth()+1,20);return iso(d)})();
  let r;
  r=parseQuick('明天 14:00 写周报 #工作 !高');F(r.text==='写周报'&&r.due===addDays(1)&&r.time==='14:00'&&r.list==='work'&&r.prio===3,'标准全字段');
  r=parseQuick('今天 站会');F(r.due===TODAY&&r.text==='站会','今天');
  r=parseQuick('后天 复诊');F(r.due===addDays(2),'后天');
  r=parseQuick('交电费 20号');F(r.due===day20&&r.text==='交电费','X号(未来顺延)');
  r=parseQuick('99号 东西');F(r.due===null&&r.text==='99号 东西','X号越界不解析');
  r=parseQuick('2026-9-8 提交');F(r.due==='2026-09-08','ISO日期补零归一化');
  r=parseQuick('2026-99-99 提交');F(r.due===null&&r.text==='2026-99-99 提交','ISO越界日期不解析不吞字');
  r=parseQuick('2026-2-30 交房租');F(r.due===null&&r.text==='2026-2-30 交房租','ISO不存在日期(2月30)不解析');
  r=parseQuick('每周三健身');F(r.repeat&&r.repeat.type==='weekly'&&r.repeat.weekdays[0]===3&&r.due===wed&&r.text==='健身','每周X=重复+最近周三');
  r=parseQuick('每天背单词');F(r.repeat&&r.repeat.type==='daily'&&r.text==='背单词','每天=每日重复');
  F(nextOccur({due:'2026-01-31',repeat:{type:'monthly',interval:1,monthDay:31}})==='2026-02-28','每月31号小月钳制');
  F(nextOccur({due:'2026-09-28',repeat:{type:'weekly',interval:1,weekdays:[1,3]}})==='2026-09-30','每周多选取下一匹配日');
  F(nextOccur({due:'2026-09-28',repeat:{type:'daily',interval:1,endDate:'2026-09-28'}})===null,'超过结束日停止重复');
  r=parseQuick('写周报！高优先级 #工作');F(r.prio===3&&r.list==='work'&&r.text==='写周报','全角!+高优先级');
  r=parseQuick('P1 修复bug');F(r.prio===3&&r.text==='修复bug','P1=高');
  r=parseQuick('下月5号 体检');F(r.due===nm5,'下月X号');
  r=parseQuick('周末大扫除');F(r.due===sat,'周末=最近周六');
  r=parseQuick('下午3点半 开会');F(r.time==='15:30'&&r.text==='开会','下午X点半');
  r=parseQuick('买牛奶');F(r.text==='买牛奶'&&!r.due&&!r.time&&!r.prio&&!r.repeat,'纯标题不被改动');
  /* W9 解析器增强:中文数字时刻 / 英文日期与时刻 / 复杂表达 */
  const monthEnd=(()=>{const n=new Date();return iso(new Date(n.getFullYear(),n.getMonth()+1,0))})();
  const nnWed=(()=>{const n=new Date();let delta=(3-n.getDay()+7)%7||7;return addDays(delta+14)})();
  const nWeekSat=(()=>{const n=new Date();let delta=(6-n.getDay()+7)%7||7;return addDays(delta+7)})();
  r=parseQuick('下午三点 开会');F(r.time==='15:00'&&r.text==='开会','中文数字·下午三点');
  r=parseQuick('中午十二点 吃饭');F(r.time==='12:00'&&r.text==='吃饭','中文数字·中午十二点');
  r=parseQuick('上午八点半 晨会');F(r.time==='08:30'&&r.text==='晨会','中文数字·上午八点半');
  r=parseQuick('明天下午三点半 复诊');F(r.due===addDays(1)&&r.time==='15:30'&&r.text==='复诊','中文数字·明天下午三点半');
  r=parseQuick('tomorrow 3pm 提交报告');F(r.due===addDays(1)&&r.time==='15:00'&&r.text==='提交报告','英文·tomorrow+3pm');
  r=parseQuick('9pm 加班');F(r.time==='21:00'&&r.text==='加班','英文·9pm');
  r=parseQuick('3:30pm 银行面签');F(r.time==='15:30'&&r.text==='银行面签','英文·3:30pm');
  r=parseQuick('月底交房租');F(r.due===monthEnd&&r.text==='交房租','月底=本月最后一天');
  r=parseQuick('下下周三 复诊');F(r.due===nnWed&&r.text==='复诊','下下周三');
  r=parseQuick('下周末 露营');F(r.due===nWeekSat&&r.text==='露营','下周末=下周六');
  /* toggleDone 复活排期三分支:结束日归档 / 正常下一轮 / 补完成次日 */
  tasks.push({id:900001,title:'__t_end',due:'2026-01-01',repeat:{type:'daily',interval:1,endDate:'2026-01-01'},done:false});
  toggleDone(900001);
  F(byId(900001).done===true&&byId(900001).nextDue===null,'超过结束日完成=永久归档不再复活');
  tasks.push({id:900002,title:'__t_norm',due:TODAY,repeat:{type:'daily',interval:1},done:false});
  toggleDone(900002);
  F(byId(900002).nextDue===addDays(1),'当天完成每天任务=明天复活');
  tasks.push({id:900003,title:'__t_late',due:addDays(-7),repeat:{type:'weekly',interval:1,weekdays:[(new Date().getDay()+6)%7+1]},done:false});
  toggleDone(900003);
  F(byId(900003).nextDue===addDays(1),'补完成逾期轮次=最早明天复活');
  tasks.length-=3;
  const fails=tests.filter(Boolean);
  console[fails.length?'error':'log'](`parseQuick 自测: ${tests.length-fails.length}/${tests.length} 通过`,fails.length?fails:'');
  return{fails,total:tests.length};
}
if(location.search.includes('selftest'))runParseTests();
function renderQaChips(){
  const v=$('#qaInput').value.trim();
  $('#qaChips').innerHTML=v?parseQuick(v).chips.map(c=>{
    if(c.k==='date')return`<span class="qa-chip date">${ic('calendar',11)}${esc(c.v)}</span>`;
    if(c.k==='list')return`<span class="qa-chip list">${ic('list',11)}${esc(c.v)}</span>`;
    if(c.k==='prio')return`<span class="qa-chip prio ${c.p===2?'p2':c.p===1?'p1':''}">${ic('flag',11)}${esc(c.v)}优先级</span>`;
    return`<span class="qa-chip tag">${ic('tag',11)}${esc(c.v)}</span>`;
  }).join(''):'';
}
function quickAdd(){
  const inp=$('#qaInput'),v=inp.value.trim();if(!v)return;
  closeHelp();
  const p=parseQuick(v);if(!p.text)return;
  let list=p.list,due=p.due;
  if(state.view.startsWith('list:')&&!list)list=state.view.slice(5);
  tasks.push({id:seq++,title:p.text,list,tags:p.tags,prio:p.prio,due,time:p.time,remind:settings.defaultRemind||null,repeat:p.repeat||null,
    note:'',subs:[],done:false,doneAt:null});
  inp.value='';renderQaChips();render();
  /* 未指明日期=无日期:提示落点,避免在「今天」等视图里看起来像"添加后消失" */
  toast(`已添加「${esc(p.text)}」${due?'':(list?` · 已入「${esc(listById(list)?.name||'')}」`:' · 在收件箱')}`);
}

/* ================= 迷你月历浮层(日期/重复共用) ================= */
let mcPop=null,mcOnPick=null,mcM=null;
function closeMcPop(){
  if(mcPop){mcPop.remove();mcPop=null;mcOnPick=null;document.removeEventListener('mousedown',mcOutside,false)}
}
function mcOutside(e){if(mcPop&&!mcPop.contains(e.target))closeMcPop()}
function openMcPop(anchor,selISO,onPick){
  closeMcPop();
  mcOnPick=onPick;
  mcM=selISO?parseISO(selISO):new Date(new Date().getFullYear(),new Date().getMonth(),1);
  mcPop=document.createElement('div');mcPop.className='menu mc-pop';
  mcPop.innerHTML=mcHTML(mcM.getFullYear(),mcM.getMonth(),selISO||'','data-mcdate');
  document.body.appendChild(mcPop);
  const r=anchor.getBoundingClientRect(),w=mcPop.offsetWidth,h=mcPop.offsetHeight;
  let x=Math.min(r.left,innerWidth-w-10),y=r.bottom+6;
  if(y+h>innerHeight-10)y=Math.max(10,r.top-h-6);
  mcPop.style.left=x+'px';mcPop.style.top=y+'px';
  document.addEventListener('mousedown',mcOutside,false);
  mcPop.addEventListener('click',e=>{
    const nav=e.target.closest('[data-mcnav]');
    if(nav){mcM.setMonth(mcM.getMonth()+ +nav.dataset.mcnav);mcPop.innerHTML=mcHTML(mcM.getFullYear(),mcM.getMonth(),selISO||'','data-mcdate');return}
    const d=e.target.closest('[data-mcdate]');
    if(d){const fn=mcOnPick;closeMcPop();fn&&fn(d.dataset.mcdate)}
  });
}
function mcHTML(y,m,selISO,attr){
  const ws=settings.weekStart==='sun'?0:1;
  const off=((new Date(y,m,1).getDay()-ws)+7)%7,dimN=new Date(y,m+1,0).getDate(),dimP=new Date(y,m,0).getDate();
  const hd=(ws===1?['一','二','三','四','五','六','日']:['日','一','二','三','四','五','六']);
  let cells='';
  for(let i=0;i<42;i++){
    let num,diso,dm=false;
    if(i<off){num=dimP-off+1+i;dm=true;diso=iso(new Date(y,m-1,num))}
    else if(i-off<dimN){num=i-off+1;diso=iso(new Date(y,m,num))}
    else{num=i-off-dimN+1;dm=true;diso=iso(new Date(y,m+1,num))}
    const cls=['mc-cell',dm?'dim':'',diso===selISO?'sel':'',diso===TODAY?'today':''].join(' ');
    cells+=`<div class="${cls}" ${attr}="${diso}">${num}</div>`;
  }
  return`<div class="mc-nav">
      <button type="button" data-mcnav="-1">${ic('chevL',14)}</button>
      <span class="ym">${y} 年 ${m+1} 月</span>
      <button type="button" data-mcnav="1">${ic('chevR',14)}</button></div>
    <div class="mc-week">${hd.map(d=>`<span>${d}</span>`).join('')}</div>
    <div class="mc-grid">${cells}</div>`;
}

/* ================= 日期选择器(详情面板·日期) ================= */
let dpEl=null,dpTask=null;
function closeDP(){
  if(!dpEl)return;
  dpEl.remove();dpEl=null;dpTask=null;closeMcPop();
  document.removeEventListener('mousedown',dpOutside,false);
}
function dpOutside(e){if(dpEl&&!dpEl.contains(e.target)&&!e.target.closest('.mc-pop')&&!e.target.closest('[data-menu="date"]'))closeDP()}
function patchDateRow(t){
  const cell=document.querySelector('.d-prop[data-menu="date"] .p-val');
  if(cell)cell.innerHTML=`${t.due?esc(fmtDue(t.due)):(t.time?fmtTime(t.time):'<span class="ph">设置日期</span>')}${t.time?`<span class="ph">${fmtTime(t.time)}</span>`:''}${ic('chevR',13)}`;
}
function openDatePicker(anchor,t){
  if(dpEl&&dpTask===t){closeDP();return}
  closeDP();closeMenu();
  dpTask=t;
  dpEl=document.createElement('div');dpEl.className='menu date-menu';dpEl.innerHTML=dpHTML(t);
  document.body.appendChild(dpEl);
  const r=anchor.getBoundingClientRect(),w=dpEl.offsetWidth,h=dpEl.offsetHeight;
  let x=Math.min(r.left,innerWidth-w-10),y=r.bottom+6;
  if(y+h>innerHeight-10)y=Math.max(10,r.top-h-6);
  dpEl.style.left=x+'px';dpEl.style.top=y+'px';
  document.addEventListener('mousedown',dpOutside,false);
  dpEl.addEventListener('click',e=>{
    const mi=e.target.closest('[data-mi]');
    if(mi){dpTask.due=mi.dataset.mi;patchDateRow(dpTask);scheduleSync();dpEl.innerHTML=dpHTML(dpTask);buildMain();buildSidebar();return}
    if(e.target.closest('[data-dpcustom]')){
      openMcPop(e.target.closest('[data-dpcustom]'),dpTask.due||TODAY,iso=>{
        dpTask.due=iso;patchDateRow(dpTask);scheduleSync();dpEl.innerHTML=dpHTML(dpTask);buildMain();buildSidebar();
      });
      return}
    if(e.target.closest('[data-dclear]')){dpTask.due=null;dpTask.time=null;closeDP();render()}
  });
}
function dpHTML(t){
  const mi=(v,l,i)=>`<div class="menu-item ${t.due===v?'active':''}" data-mi="${v}">${ic(i,14.5)}<span>${l}</span><span class="m-check">${ic('checkS',14,2.2)}</span></div>`;
  return`<div class="menu-label">快速选择</div>
    ${mi(TODAY,'今天','sun')}${mi(addDays(1),'明天','arrow')}${mi(addDays(7),'下周此时','cal7')}
    <div class="menu-sep"></div>
    <div class="menu-item" data-dpcustom>${ic('calendar',14.5)}<span>自定义日期…</span></div>
    <div class="menu-item" data-dclear>${ic('x',14.5)}<span>清除日期</span></div>`;
}

/* ================= 重复规则编辑器(复用 Todoist/滴答清单机制) ================= */
let repEl=null,repTask=null;
function closeRep(){
  if(!repEl)return;
  if(repTask){
    if(repTask.repeat&&repTask.repeat.type==='none')repTask.repeat=null;
    patchRepeatRow(repTask);scheduleSync();
  }
  repEl.remove();repEl=null;repTask=null;closeMcPop();
  document.removeEventListener('mousedown',repOutside,false);
}
function repOutside(e){if(repEl&&!repEl.contains(e.target)&&!e.target.closest('.mc-pop')&&!e.target.closest('[data-menu="repeat"]'))closeRep()}
function patchRepeatRow(t){
  const cell=document.querySelector('.d-prop[data-menu="repeat"] .p-val');
  if(cell)cell.innerHTML=t.repeat&&t.repeat.type?`${esc(fmtRepeat(t.repeat)+(t.repeat.endDate?` · 至${t.repeat.endDate.slice(5)}`:'')+(t.done&&t.nextDue?` · 下次${fmtDue(t.nextDue)} 恢复`:''))}${ic('chevR',13)}`:`<span class="ph">不重复</span>${ic('chevR',13)}`;
}
function refreshRep(){if(repEl&&repTask){repEl.innerHTML=repHTML(repTask);patchRepeatRow(repTask);scheduleSync()}}
function openRepeatEditor(anchor,t){
  if(repEl&&repTask===t){closeRep();return}
  closeRep();closeMenu();
  repTask=t;
  if(!t.repeat||!t.repeat.type)t.repeat={type:'none'};
  repEl=document.createElement('div');repEl.className='menu rep-menu';repEl.innerHTML=repHTML(t);
  document.body.appendChild(repEl);
  const r=anchor.getBoundingClientRect(),w=repEl.offsetWidth,h=repEl.offsetHeight;
  let x=Math.min(r.left,innerWidth-w-10),y=r.bottom+6;
  if(y+h>innerHeight-10)y=Math.max(10,r.top-h-6);
  repEl.style.left=x+'px';repEl.style.top=y+'px';
  document.addEventListener('mousedown',repOutside,false);
  repEl.addEventListener('click',e=>{
    const rt=e.target.closest('[data-rt]');
    if(rt){
      const ty=rt.dataset.rt;
      if(ty==='none')t.repeat=null;
      else if(!t.repeat||t.repeat.type!==ty){
        t.repeat={type:ty,interval:1};
        if(ty==='weekly')t.repeat.weekdays=[t.due?((parseISO(t.due).getDay()+6)%7+1):((new Date().getDay()+6)%7+1)];
        if(ty==='monthly')t.repeat.monthDay=t.due?parseISO(t.due).getDate():new Date().getDate();
      }
      refreshRep();return;
    }
    const wd=e.target.closest('[data-rwd]');
    if(wd){
      const d=+wd.dataset.rwd;t.repeat.weekdays=t.repeat.weekdays||[];
      const i=t.repeat.weekdays.indexOf(d);
      if(i>=0)t.repeat.weekdays.splice(i,1);else t.repeat.weekdays.push(d);
      refreshRep();return;
    }
    const re=e.target.closest('[data-rend]');
    if(re){
      if(re.dataset.rend==='date'){
        t.repeat.endDate=t.repeat.endDate||(t.due||TODAY);
        refreshRep();
        const btn=repEl.querySelector('[data-ropencal]');
        if(btn)openMcPop(btn,t.repeat.endDate,iso=>{t.repeat.endDate=iso;refreshRep()});
      }
      else{t.repeat.endDate=null;refreshRep()}
      return;
    }
    const oc=e.target.closest('[data-ropencal]');
    if(oc){openMcPop(oc,t.repeat.endDate||TODAY,iso=>{t.repeat.endDate=iso;refreshRep()});return}
  });
  repEl.addEventListener('input',e=>{
    if(!repTask||!repTask.repeat)return;
    if(e.target.dataset.rint!==undefined){repTask.repeat.interval=Math.max(1,Math.min(365,+e.target.value||1));scheduleSync()}
    if(e.target.dataset.rday!==undefined){repTask.repeat.monthDay=Math.max(1,Math.min(31,+e.target.value||1));scheduleSync()}
  });
  repEl.addEventListener('change',e=>{
    if(e.target.dataset.renddate!==undefined){
      if(repTask.repeat)repTask.repeat.endDate=e.target.value||null;
      refreshRep();
    }
  });
}
function repHTML(t){
  const r=(t.repeat&&t.repeat.type)?t.repeat:{type:'none'};
  const ty=r.type;
  const chip=(id,n)=>`<span class="rep-chip ${ty===id?'on':''}" data-rt="${id}">${n}</span>`;
  const wd=(r.weekdays||[]).slice().sort((a,b)=>a-b);
  const wch=[1,2,3,4,5,6,7].map(d=>`<span class="rep-wd-chip ${wd.includes(d)?'on':''}" data-rwd="${d}">${'一二三四五六日'[d-1]}</span>`).join('');
  let sec='';
  if(ty==='weekly')sec=`<div class="rep-sec"><div class="menu-label">周几(可多选,不选则跟随到期日)</div><div class="rep-wd">${wch}</div>
    <div class="rep-line">每 <input type="number" min="1" max="52" value="${r.interval||1}" data-rint> 周</div></div>`;
  else if(ty==='monthly')sec=`<div class="rep-sec"><div class="rep-line">每 <input type="number" min="1" max="12" value="${r.interval||1}" data-rint> 个月的 <input type="number" min="1" max="31" value="${r.monthDay||(t.due?parseISO(t.due).getDate():new Date().getDate())}" data-rday> 号</div>
    <div class="menu-label">31 号这类日期在小月自动按当月最后一天处理</div></div>`;
  else if(ty==='daily')sec=`<div class="rep-sec"><div class="rep-line">每 <input type="number" min="1" max="365" value="${r.interval||1}" data-rint> 天</div></div>`;
  else if(ty==='yearly')sec=`<div class="rep-sec"><div class="rep-line">每 <input type="number" min="1" max="10" value="${r.interval||1}" data-rint> 年</div></div>`;
  else if(ty==='workday')sec=`<div class="rep-sec"><div class="rep-line">每周一至周五</div></div>`;
  const endChip=(m,n)=>`<span class="rep-chip ${(m==='date')===(!!r.endDate)?'on':''}" data-rend="${m}">${n}</span>`;
  return`<div class="menu-label">重复频率</div>
    <div class="rep-chips">${chip('none','不重复')}${chip('daily','每天')}${chip('workday','工作日')}${chip('weekly','每周')}${chip('monthly','每月')}${chip('yearly','每年')}</div>
    ${sec}
    ${ty!=='none'?`<div class="menu-sep"></div>
    <div class="rep-line"><span class="lbl">结束</span>
      <span class="rep-end">${endChip('never','永不')}${endChip('date','到某日')}</span>
      ${r.endDate?`<button type="button" class="mc-trigger" data-ropencal title="修改结束日期">${ic('calendar',13)}${r.endDate}</button>`:'<span class="qhn">选「到某日」后挑日期</span>'}
    </div>`:''}`;
}

/* ================= 快速输入语法帮助 ================= */
let helpEl=null;
function closeHelp(){if(helpEl){helpEl.remove();helpEl=null;document.removeEventListener('mousedown',helpOutside,false)}}
function helpOutside(e){if(helpEl&&!helpEl.contains(e.target)&&!e.target.closest('#qaHelp'))closeHelp()}
function toggleHelp(){
  if(helpEl){closeHelp();return}
  const tok=(c,t)=>`<code class="tok ${c}">${t}</code>`;
  helpEl=document.createElement('div');helpEl.className='qa-help-pop';
  helpEl.innerHTML=`<h4>快速输入语法</h4>
    <div class="qh-row"><span class="k">截止日期</span><span class="v">${tok('d','今天')}${tok('d','明天')}${tok('d','周五')}${tok('d','下周三')}${tok('d','下下周三')}${tok('d','周末')}${tok('d','月底')}${tok('d','9月30日')}${tok('d','下月5号')}${tok('d','2026-10-01')}${tok('d','tomorrow')}</span></div>
    <div class="qh-row"><span class="k">时刻</span><span class="v">${tok('d','14:00')}${tok('d','14点')}${tok('d','下午三点')}${tok('d','下午3点半')}${tok('d','3pm')}</span></div>
    <div class="qh-row"><span class="k">清单</span><span class="v">${tok('l','#工作')}<span class="qhn"># + 清单名,可只写前缀</span></span></div>
    <div class="qh-row"><span class="k">标签</span><span class="v">${tok('t','@重点')}<span class="qhn">@ + 标签名,新名字会自动创建</span></span></div>
    <div class="qh-row"><span class="k">优先级</span><span class="v">${tok('p','!高')}${tok('p','高优先级')}${tok('p1','P1')}<span class="qhn">P1 最高</span></span></div>
    <div class="qh-row"><span class="k">重复</span><span class="v">${tok('d','每天')}${tok('d','每周三')}${tok('d','每月')}</span></div>
    <div class="tip">以上全部可省略、可任意组合、顺序不限;写得不规范任务也会正常添加,未识别的字段留空,随时在详情面板补填。</div>`;
  document.body.appendChild(helpEl);
  const r=document.getElementById('qaHelp').getBoundingClientRect();
  helpEl.style.right=Math.max(10,innerWidth-r.right)+'px';
  helpEl.style.bottom=(innerHeight-r.top+10)+'px';
  setTimeout(()=>document.addEventListener('mousedown',helpOutside,false));
}
$('#qaHelp').onclick=toggleHelp;

/* ================= 动作 ================= */
function startOfWeek(x){const d=new Date(x);const wd=(d.getDay()+6)%7;d.setDate(d.getDate()-wd);d.setHours(0,0,0,0);return d}
function nextOccur(t){
  const r=t.repeat;if(!r||!r.type)return null;
  const n=Math.max(1,r.interval||1);
  const base=parseISO(t.due||TODAY);
  const end=r.endDate?parseISO(r.endDate):null;
  const clampDay=(y,m,d)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()));
  let d=null;
  if(r.type==='daily'){d=new Date(base);d.setDate(d.getDate()+n)}
  else if(r.type==='workday'){d=new Date(base);do{d.setDate(d.getDate()+1)}while(d.getDay()===0||d.getDay()===6)}
  else if(r.type==='weekly'){
    let wds=(r.weekdays||[]).slice().sort((a,b)=>a-b);
    if(!wds.length)wds=[(base.getDay()+6)%7+1];
    const toIdx=x=>((x.getDay()+6)%7)+1;
    let cand=new Date(base);
    for(let i=0;i<800&&!d;i++){
      cand.setDate(cand.getDate()+1);
      if(!wds.includes(toIdx(cand)))continue;
      if(n>1){
        const wk=Math.round((startOfWeek(cand)-startOfWeek(base))/6048e5);
        if(wk%n!==0)continue;
      }
      d=new Date(cand);
    }
  }
  else if(r.type==='monthly'){
    const day=r.monthDay||base.getDate();
    const nm=new Date(base.getFullYear(),base.getMonth()+n,1);
    d=clampDay(nm.getFullYear(),nm.getMonth(),day);
  }
  else if(r.type==='yearly'){
    d=clampDay(base.getFullYear()+n,base.getMonth(),base.getDate());
  }
  if(!d)return null;
  if(end&&d>end)return null;
  return iso(d);
}
function toggleDone(id){
  const t=byId(id);if(!t)return;
  /* 重复任务完成 = 归档当前轮 + 记下下一次到期日,等日期到了再自动恢复待办(完成感更强) */
  if(!t.done&&t.repeat){
    t.history=t.history||[];t.history.push(TODAY);
    if(t.history.length>30)t.history=t.history.slice(-30);
    const next=nextOccur(t);
    t.done=true;t.doneAt=TODAY;
    if(next===null)t.nextDue=null;                        // 已过结束条件:本轮完成后永久归档,不再复活
    else t.nextDue=diffDays(TODAY,next)>=1?next:addDays(1); // 正常排下一轮;补完成的逾期/当日轮最早明天复活
    if(t.subs)t.subs.forEach(s=>s.d=false);
    toast(t.nextDue?`已完成 · ${fmtDue(t.nextDue)} 自动恢复待办`:'已完成 · 重复已结束,不再生成');
    const row=document.querySelector(`.task-row[data-open="${id}"]`);
    if(row){
      row.classList.add('done');
      const cb=row.querySelector('.checkbox');cb&&cb.classList.add('checked');
      setTimeout(()=>{render();scheduleSync()},450);
    }else{render();scheduleSync()}
    return;
  }
  if(!t.done&&t.nextDue)t.nextDue=null; // 恢复待办时清掉排期
  t.done=!t.done;t.doneAt=t.done?TODAY:null;
  if(t.done&&state.view!=='completed'){
    const row=document.querySelector(`[data-open="${id}"]`);
    if(row){row.classList.add('done');const cb=row.querySelector('.checkbox');cb&&cb.classList.add('checked');
      setTimeout(render,420);return}
  }
  render();
}
/* 惰性复活:到期日当天把已完成的重复任务恢复为待办 */
function reviveRepeats(){
  let changed=false;
  for(const t of tasks){
    if(t.done&&t.nextDue&&t.nextDue<=TODAY){
      t.done=false;t.doneAt=null;t.due=t.nextDue;t.nextDue=null;
      if(t.subs)t.subs.forEach(s=>s.d=false);
      changed=true;
    }
  }
  if(changed){scheduleSync()}
}
function deleteTask(id){
  const i=tasks.findIndex(t=>t.id===id);if(i<0)return;
  const[t]=tasks.splice(i,1);
  if(state.detailId===id)closeDetail();
  render();
  toast(`已删除「${esc(t.title)}」`,()=>{tasks.push(t);render()});
}
/* W8:复制任务生成副本,标题追加「副本」;完成状态与历史清零,子任务重置为未完成 */
function copyTask(id){
  const t=byId(id);if(!t)return;
  const c=JSON.parse(JSON.stringify(t));
  c.id=seq++;c.title=t.title+' 副本';
  c.done=false;c.doneAt=null;c.nextDue=null;c.history=[];
  if(c.subs)c.subs.forEach(s=>s.d=false);
  tasks.push(c);
  state.detailId=c.id;render();
  toast(`已创建副本「${esc(c.title)}」`);
}
function moveTomorrow(id){const t=byId(id);if(!t)return;t.due=addDays(1);render();toast('已移到明天')}
function toast(msg,undoFn){
  const el=$('#toast');
  el.innerHTML=`<span>${msg}</span>${undoFn?'<button data-undo>撤销</button>':''}`;
  el.style.display='flex';
  if(undoFn)el.querySelector('[data-undo]').onclick=()=>{undoFn();el.style.display='none'};
  clearTimeout(el._t);el._t=setTimeout(()=>el.style.display='none',undoFn?4500:2600);
}

/* ================= 主题 ================= */
function applyTheme(){
  const resolved=settings.themeMode==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):settings.themeMode;
  document.documentElement.dataset.theme=resolved;
  saveSettings();
  $('#themeBtn').innerHTML=ic(resolved==='light'?'moon':'sun',16);
  ballPush();
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(settings.themeMode==='auto')applyTheme()});
$('#themeBtn').onclick=()=>{
  const cur=document.documentElement.dataset.theme;
  settings.themeMode=cur==='light'?'dark':'light';
  applyTheme();
  toast(settings.themeMode==='light'?'已切换到亮色主题':'已切换到暗色主题');
};

/* ================= 事件 ================= */
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]');
  if(nav){state.view=nav.dataset.nav;closeDetail();render();return}
  if(e.target.closest('[data-settings]')){openSettings('appearance');return}
  if(e.target.closest('[data-close-detail]')){closeDetail();render();return}
  if(e.target.closest('[data-win]')){
    const w=e.target.closest('[data-win]').dataset.win;
    const win=window.__TAURI__?.window?.getCurrentWindow?.();
    try{
      if(w==='min'){win?win.minimize():toast('已最小化(浏览器预览)')}
      else if(w==='max'){win?win.toggleMaximize():toast('已最大化(浏览器预览)')}
      else{win?win.close():toast('浏览器预览中不会关闭窗口')}
    }catch(err){toast('窗口操作失败:'+err.message)}
    return}
  const tg=e.target.closest('[data-toggle]');
  if(tg){e.stopPropagation();toggleDone(+tg.dataset.toggle);return}
  const mv=e.target.closest('[data-move]');if(mv){e.stopPropagation();moveTomorrow(+mv.dataset.move);return}
  const rs=e.target.closest('[data-restore]');if(rs){e.stopPropagation();toggleDone(+rs.dataset.restore);return}
  const cp=e.target.closest('[data-copy]');if(cp){e.stopPropagation();copyTask(+cp.dataset.copy);return}
  const dl=e.target.closest('[data-del]');if(dl){e.stopPropagation();deleteTask(+dl.dataset.del);return}
  if(state.detailId!=null){
    const pm=e.target.closest('[data-menu]');if(pm){propMenu(pm.dataset.menu,pm);return}
    const sb=e.target.closest('[data-sub]');if(sb){const t=byId(state.detailId);t.subs[+sb.dataset.sub].d=!t.subs[+sb.dataset.sub].d;render();return}
    const sd=e.target.closest('[data-subdel]');if(sd){const t=byId(state.detailId);t.subs.splice(+sd.dataset.subdel,1);render();return}
  }
  const cal=e.target.closest('[data-cal]');if(cal){state.calSel=cal.dataset.cal;buildMain();return}
  const cm=e.target.closest('[data-cm]');if(cm){state.calMonth.setMonth(state.calMonth.getMonth()+ +cm.dataset.cm);buildMain();return}
  if(e.target.closest('[data-cal-today]')){const n=new Date();state.calMonth=new Date(n.getFullYear(),n.getMonth(),1);state.calSel=TODAY;buildMain();return}
  const open=e.target.closest('[data-open]');
  if(open&&!e.target.closest('.checkbox,.row-btn,.kcard-meta'))openDetail(+open.dataset.open);
});
/* 看板拖拽 */
document.addEventListener('dragstart',e=>{const c=e.target.closest('.kcard');if(c){e.dataTransfer.setData('text/plain',c.dataset.drag);c.classList.add('dragging')}});
document.addEventListener('dragend',e=>{const c=e.target.closest('.kcard');c&&c.classList.remove('dragging');document.querySelectorAll('.kcol').forEach(k=>k.classList.remove('drag-over'))});
document.addEventListener('dragover',e=>{const col=e.target.closest('.kcol');if(col){e.preventDefault();col.classList.add('drag-over')}});
document.addEventListener('dragleave',e=>{const col=e.target.closest('.kcol');if(col&&!col.contains(e.relatedTarget))col.classList.remove('drag-over')});
document.addEventListener('drop',e=>{const col=e.target.closest('.kcol');if(!col)return;e.preventDefault();
  const id=+e.dataTransfer.getData('text/plain');const t=byId(id);
  if(t){t.prio=+col.dataset.drop||0;render();toast('已调整优先级')}});
/* 设置页清单/标签拖拽排序 */
let sortDrag=null,sortOver=null;
document.addEventListener('dragstart',e=>{
  const row=e.target.closest&&e.target.closest('[data-sortrow]');
  if(!row)return;
  sortDrag={kind:row.dataset.sortrow,id:row.dataset.sortid};
  e.dataTransfer.effectAllowed='move';
  try{e.dataTransfer.setData('text/plain',row.dataset.sortid)}catch(err){}
});
document.addEventListener('dragend',()=>{
  if(sortOver){sortOver.el.classList.remove('sort-before','sort-after')}
  sortOver=null;sortDrag=null;
});
document.addEventListener('dragover',e=>{
  if(!sortDrag)return;
  const row=e.target.closest&&e.target.closest('[data-sortrow]');
  if(!row||row.dataset.sortrow!==sortDrag.kind||row.dataset.sortid===sortDrag.id)return;
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  const r=row.getBoundingClientRect();
  const before=e.clientY<r.top+r.height/2;
  if(sortOver&&sortOver.el!==row)sortOver.el.classList.remove('sort-before','sort-after');
  row.classList.toggle('sort-before',before);
  row.classList.toggle('sort-after',!before);
  sortOver={el:row,before};
});
document.addEventListener('drop',e=>{
  if(!sortDrag)return;
  e.preventDefault();
  const row=e.target.closest&&e.target.closest('[data-sortrow]');
  if(row&&row.dataset.sortrow===sortDrag.kind&&row.dataset.sortid!==sortDrag.id){
    const r=row.getBoundingClientRect();
    reorderSort(sortDrag.kind,sortDrag.id,row.dataset.sortid,e.clientY<r.top+r.height/2);
  }
  if(sortOver){sortOver.el.classList.remove('sort-before','sort-after')}
  sortOver=null;sortDrag=null;
});
function reorderSort(kind,id,refId,before){
  let ok=false;
  if(kind==='list'){
    const from=LISTS.findIndex(l=>l.id===id),ref=LISTS.findIndex(l=>l.id===refId);
    if(from>=0&&ref>=0){
      const [m]=LISTS.splice(from,1);
      let to=LISTS.findIndex(l=>l.id===refId);
      if(!before)to++;
      LISTS.splice(to,0,m);ok=true;
    }
  }else{
    /* 标签:设置顺序为权威,写回 extraTags(任务上存在而未登记的标签一并收编) */
    const all=tagList();
    const from=all.indexOf(id),ref=all.indexOf(refId);
    if(from>=0&&ref>=0){
      const [m]=all.splice(from,1);
      let to=all.indexOf(refId);
      if(!before)to++;
      all.splice(to,0,m);
      EXTRA_TAGS.length=0;EXTRA_TAGS.push(...all);ok=true;
    }
  }
  if(ok){scheduleSync();buildSettings();render();toast('排序已保存')}
}
/* 输入 */
document.addEventListener('input',e=>{
  if(e.target.id==='searchInput'){
    state.search=e.target.value;
    if(state.view==='search'&&!state.search.trim())state.view='today'; // 清空搜索词即退出结果页
    buildMain();return;
  }
  if(e.target.id==='qaInput'){renderQaChips();return}
  const t=state.detailId!=null?byId(state.detailId):null;if(!t)return;
  if(e.target.dataset.field==='title'){t.title=e.target.value;fitTitle(e.target)}
  if(e.target.dataset.field==='note')t.note=e.target.value;
});
document.addEventListener('change',e=>{if(e.target.dataset.field){buildMain();buildSidebar();scheduleSync()}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeMenu();closeHelp();closeRep();closeDP();closeMcPop();const ov=document.getElementById('settingsOverlay');if(ov){closeSettings();return}if(state.detailId!=null){closeDetail();render()}return}
  const typing=/INPUT|TEXTAREA/.test(e.target.tagName);
  if(typing){
    if(e.target.id==='qaInput'&&e.key==='Enter'){e.preventDefault();quickAdd()}
    if(e.target.id==='searchInput'&&e.key==='Enter'){
      e.preventDefault();
      if(e.target.value.trim()){state.view='search';closeDetail();render()} // 回车=跨视图全局搜索
      return;
    }
    if(e.target.dataset.field==='title'&&e.key==='Enter'){e.preventDefault();e.target.blur()}
    if(e.target.dataset.subadd&&e.key==='Enter'&&e.target.value.trim()){
      const t=byId(state.detailId);(t.subs=t.subs||[]).push({t:e.target.value.trim(),d:false});render()}
    if(e.target.id==='newListInput')return;
    return;
  }
  if(e.key==='n'){e.preventDefault();$('#qaInput').focus()}
  if(e.key==='/'){e.preventDefault();$('#searchInput').focus()}
});
$('#qaInput').addEventListener('focus',renderQaChips);

/* ================= 设置弹窗 ================= */
const STABS=[{id:'appearance',n:'外观',i:'palette'},{id:'general',n:'通用',i:'sliders'},{id:'lists',n:'清单与标签',i:'list'},{id:'notify',n:'提醒',i:'bell'},{id:'data',n:'数据',i:'db'},{id:'about',n:'关于',i:'info'}];
let settingsTab='appearance';
let editState={mode:null,id:null,color:null};
function openSettings(tab){
  settingsTab=tab||settingsTab||'appearance';
  let ov=document.getElementById('settingsOverlay');
  if(!ov){
    ov=document.createElement('div');ov.id='settingsOverlay';ov.className='overlay';
    ov.innerHTML=`<div class="sdialog">
      <button class="icon-btn sclose" data-sclose title="关闭">${ic('x',15)}</button>
      <aside class="snav"><h2>设置</h2><div id="sNav"></div><div class="snav-foot">DoDo${APP_VERSION?' v'+APP_VERSION:''}</div></aside>
      <div class="scontent" id="sContent"></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',settingsClick);
    ov.addEventListener('keydown',e=>{
      if(e.target.id!=='mEditInput')return;
      if(e.key==='Enter'){e.preventDefault();commitManage()}
      else if(e.key==='Escape'){e.stopPropagation();editState={mode:null,id:null,color:null};buildSettings()}
    });
  }
  buildSettings();
  refreshAutostart();
}
function closeSettings(){const ov=document.getElementById('settingsOverlay');if(ov)ov.remove()}
function saveSettings(){localStorage.setItem('dodo-settings',JSON.stringify(settings))}
function buildSettings(){
  const ov=document.getElementById('settingsOverlay');if(!ov)return;
  $('#sNav').innerHTML=STABS.map(t=>`<div class="snav-item ${settingsTab===t.id?'active':''}" data-stab="${t.id}">${ic(t.i,15.5)}<span>${t.n}</span></div>`).join('');
  const c=$('#sContent');
  if(settingsTab==='appearance'){
    const card=(mode,name,prev)=>`<div class="tcard ${settings.themeMode===mode?'active':''}" data-tmode="${mode}">
      <div class="prev ${prev}"><span class="bar" style="top:10px;width:56%"></span><span class="bar" style="top:20px;width:38%"></span><span class="bar" style="top:30px;width:46%"></span></div>
      <div class="tname">${name}<span class="m-check">${ic('checkS',14,2.4)}</span></div></div>`;
    c.innerHTML=`<h3>主题</h3><div class="sdesc">选择界面外观;「跟随系统」将随 Windows 深色模式自动切换</div>
      <div class="tcards">${card('light','亮色','prev-light')}${card('dark','暗色','prev-dark')}${card('auto','跟随系统','prev-auto')}</div>`;
  }else if(settingsTab==='general'){
    const sv=SMART.find(s=>s.id===settings.startView);
    c.innerHTML=`<h3>通用</h3><div class="sdesc">启动与本地化偏好</div>
      <div class="srow" data-ssel="startview"><div><div class="sl">启动时打开</div><div class="sd">应用启动后默认显示的视图</div></div><span class="sv">${sv?sv.name:'今天'}${ic('chevR',13)}</span></div>
      <div class="srow" data-ssel="weekstart"><div><div class="sl">一周起始日</div><div class="sd">影响日历视图的排列</div></div><span class="sv">${settings.weekStart==='mon'?'周一':'周日'}${ic('chevR',13)}</span></div>
      <div class="srow" data-ssel="timeformat"><div><div class="sl">时间格式</div><div class="sd">任务时刻的显示方式</div></div><span class="sv">${settings.timeFormat==='24'?'24 小时制':'12 小时制'}${ic('chevR',13)}</span></div>
      <div class="srow"><div><div class="sl">悬浮速记球</div><div class="sd">桌面常驻小圆球:待办数一眼可见,点开查看今天、勾选完成、快速记录</div></div><button class="switch ${settings.ballVisible!==false?'on':''}" data-stoggle="ballVisible" title="切换"></button></div>
      <div class="srow"><div><div class="sl">开机自启动</div><div class="sd">登录 Windows 后自动在后台启动 DoDo(托盘常驻)</div></div><button class="switch ${autostartOn?'on':''}" data-autostart title="切换"></button></div>`;
  }else if(settingsTab==='notify'){
    c.innerHTML=`<h3>提醒</h3><div class="sdesc">桌面通知与默认提醒</div>
      <div class="srow"><div><div class="sl">桌面通知</div><div class="sd">任务到期时弹出 Windows 系统通知</div></div><button class="switch ${settings.notify?'on':''}" data-stoggle="notify" title="切换"></button></div>
      <div class="srow" data-ssel="defaultremind"><div><div class="sl">新任务默认提醒</div><div class="sd">快速添加的任务将自动使用该提醒时刻</div></div><span class="sv">${settings.defaultRemind?fmtTime(settings.defaultRemind):'不提醒'}${ic('chevR',13)}</span></div>`;
  }else if(settingsTab==='data'){
    if(!defaultDataDir&&DB.inv){DB.inv('default_data_dir').then(d=>{defaultDataDir=d;if(settingsTab==='data')buildSettings()}).catch(()=>{})}
    const curDir=settings.dataDir||defaultDataDir;
    refreshBackups();
    const bkRows=(backupsCache&&backupsCache.length)?backupsCache.map(b=>{
      const armed=restoreArm===b.name;
      const d=b.name.replace(/^dodo-/,'').replace(/\.db$/,'');
      const lbl=/^\d{4}-\d{2}-\d{2}$/.test(d)?d+(d===TODAY?'(今天)':''):b.name;
      return`<div class="mrow" style="cursor:default">
        <span style="flex:1;min-width:0"><span class="mname" style="display:block">${esc(lbl)}</span>
        <span style="font-size:11px;color:var(--text-3)">${fmtSize(b.size)} · ${b.modified?new Date(b.modified*1000).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span></span>
        <button class="sbtn ${armed?'danger':''}" data-bkrestore="${esc(b.name)}">${armed?'确认恢复':'恢复'}</button></div>`}).join('')
      :`<div class="mrow" style="cursor:default;color:var(--text-3);font-size:12.5px">${backupsCache?'暂无备份,点上方「立即备份」创建':(window.__TAURI__?'加载中…':'桌面端可用,浏览器预览不展示')}</div>`;
    c.innerHTML=`<h3>数据</h3><div class="sdesc">任务数据保存在本地 SQLite;更改存储位置后自动迁移现有数据</div>
      <div class="srow" style="cursor:default"><div style="min-width:0"><div class="sl">存储位置</div><div class="sd" style="word-break:break-all">${esc(curDir||'获取中…')}${settings.dataDir?'(自定义)':'(默认)'}</div></div></div>
      <div class="srow" style="cursor:default"><div><div class="sl">位置维护</div><div class="sd">可放到网盘目录实现多机备份;不影响导出与示例数据重置</div></div>
        <div style="display:flex;gap:8px;flex:none"><button class="sbtn" data-sact="openfolder">打开文件夹</button><button class="sbtn" data-sact="changedir">更改位置</button>${settings.dataDir?`<button class="sbtn" data-sact="resetdir">恢复默认</button>`:''}</div></div>
      <div class="srow" style="cursor:default"><div style="min-width:0"><div class="sl">自动备份</div><div class="sd">每日首次启动自动备份数据库,保留最近 7 份${lastBackupDate?`;上次备份 ${lastBackupDate}`:''}</div></div>
        <div style="display:flex;gap:8px;flex:none"><button class="sbtn" data-sact="backupnow">立即备份</button><button class="sbtn" data-sact="openbackups">打开备份夹</button><button class="sbtn" data-sact="changebackupdir">更改位置</button>${settings.backupDir?`<button class="sbtn" data-sact="resetbackupdir">恢复默认</button>`:''}</div></div>
      <div class="srow" style="cursor:default;align-items:flex-start;padding-bottom:4px"><div><div class="sl">备份列表</div><div class="sd">「恢复」将该备份覆盖回当前数据库并立即重载,可覆盖现有任务</div></div></div>
      <div class="mlist">${bkRows}</div>
      <div class="srow" style="cursor:default;margin-top:4px"><div style="min-width:0"><div class="sl">备份位置</div><div class="sd" style="word-break:break-all">${esc(backupLoc()||'获取中…')}${settings.backupDir?'(自定义)':'(数据目录 backups 子文件夹)'}</div></div></div>
      <div class="srow" style="cursor:default"><div><div class="sl">导出任务</div><div class="sd">将当前清单与任务导出为 JSON 文件</div></div><button class="sbtn" data-sact="export">导出</button></div>
      <div class="srow" style="cursor:default"><div><div class="sl">恢复示例数据</div><div class="sd">清空当前改动,还原到初始演示数据</div></div><button class="sbtn danger" data-sact="reset">重置</button></div>`;
  }else if(settingsTab==='lists'){
    const lcnt=l=>tasks.filter(t=>!t.done&&t.list===l.id).length;
    const tcnt=tg=>tasks.filter(t=>!t.done&&(t.tags||[]).includes(tg)).length;
    const editRow=(kind,name,withColors)=>`<div class="medit">
      ${withColors?`<span class="cswatches">${PALETTE.map(p=>`<span class="csw ${editState.color===p?'on':''}" data-mcolor="${p}" style="background:${p}"></span>`).join('')}</span>`:ic('tag',15)}
      <input id="mEditInput" value="${esc(name)}" placeholder="${kind==='list'?'清单名称':'标签名称'}">
      <button class="sbtn" data-msave>保存</button><button class="sbtn" data-mcancel>取消</button></div>`;
    const listRows=LISTS.map(l=>{
      if(editState.mode==='list'&&editState.id===l.id)return editRow('list',l.name,true);
      return`<div class="mrow" draggable="true" data-sortrow="list" data-sortid="${esc(l.id)}"><span class="grip" title="拖动排序">${ic('grip',12)}</span><span class="dot" style="background:${l.color}"></span>
        <span class="mname">${esc(l.name)}</span><span class="mcount">${lcnt(l)} 项</span>
        <button class="row-btn" data-mact="edit" data-mkind="list" data-mid="${esc(l.id)}" title="编辑">${ic('edit',14)}</button>
        <button class="row-btn" data-mact="del" data-mkind="list" data-mid="${esc(l.id)}" title="删除">${ic('trash',14)}</button></div>`;
    }).join('');
    const tagRows=tagList().map(tg=>{
      if(editState.mode==='tag'&&editState.id===tg)return editRow('tag',tg,false);
      return`<div class="mrow" draggable="true" data-sortrow="tag" data-sortid="${esc(tg)}"><span class="grip" title="拖动排序">${ic('grip',12)}</span>${ic('tag',15)}<span class="mname">${esc(tg)}</span><span class="mcount">${tcnt(tg)} 项</span>
        <button class="row-btn" data-mact="edit" data-mkind="tag" data-mid="${esc(tg)}" title="编辑">${ic('edit',14)}</button>
        <button class="row-btn" data-mact="del" data-mkind="tag" data-mid="${esc(tg)}" title="删除">${ic('trash',14)}</button></div>`;
    }).join('');
    const addRow=(kind,label)=>editState.mode===kind+'-new'?'':`<div class="madd" data-mact="add" data-mkind="${kind}">${ic('plus',13)}${label}</div>`;
    c.innerHTML=`<h3>清单</h3><div class="sdesc">删除清单时,其中任务将自动移入收件箱;拖动 ⠿ 调整顺序,侧边栏同步</div>
      <div class="mlist">${listRows}${editState.mode==='list-new'?editRow('list','',true):''}</div>${addRow('list','新增清单')}
      <h3 style="margin-top:20px">标签</h3><div class="sdesc">重命名会同步到所有任务;删除会从所有任务上移除;拖动 ⠿ 调整顺序</div>
      <div class="mlist">${tagRows}${editState.mode==='tag-new'?editRow('tag','',false):''}</div>${addRow('tag','新增标签')}`;
  }else{
    c.innerHTML=`<h3>关于</h3><div class="sdesc" style="margin-bottom:10px"></div>
      <div class="about-hero"><div class="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg></div>
        <div><h4>DoDo <span style="font-weight:500;font-size:12px;color:var(--text-3)">${APP_VERSION?'v'+APP_VERSION:''}</span></h4><p>快速捕捉、清晰聚焦、赏心悦目的 Windows 桌面待办应用</p></div></div>
      <div class="srow" style="cursor:default"><span class="sl">技术预览</span></div>
      <div class="chiprow"><span class="stackchip">Tauri 2</span><span class="stackchip">Web 前端</span><span class="stackchip">本地 SQLite</span><span class="stackchip">Noto Sans SC</span></div>
      <p class="sdesc" style="margin-top:14px">本地优先的 Windows 桌面待办应用;数据仅存本地,无需注册登录。</p>`;
  }
  const ei=document.getElementById('mEditInput');
  if(ei)ei.focus();
}
function settingsClick(e){
  if(e.target.id==='settingsOverlay'){closeSettings();return}
  if(e.target.closest('[data-sclose]')){closeSettings();return}
  const tb=e.target.closest('[data-stab]');if(tb){settingsTab=tb.dataset.stab;buildSettings();refreshAutostart();return}
  const tm=e.target.closest('[data-tmode]');if(tm){settings.themeMode=tm.dataset.tmode;applyTheme();buildSettings();return}
  const as=e.target.closest('[data-autostart]');
  if(as){
    const inv=window.__TAURI__?.core?.invoke;
    if(!inv){toast('桌面端才能设置开机自启动');return}
    (async()=>{try{
      if(autostartOn){await inv('autostart_disable');autostartOn=false;toast('已关闭开机自启动')}
      else{await inv('autostart_enable');autostartOn=true;toast('已开启开机自启动')}
      buildSettings();
    }catch(err){toast('设置失败:'+(err.message||err))}})();
    return;
  }
  const tg=e.target.closest('[data-stoggle]');if(tg){const k=tg.dataset.stoggle;settings[k]=!settings[k];saveSettings();buildSettings();
    if(k==='ballVisible'){inv2('set_ball_visible',settings.ballVisible);ballPush()}
    toast(settings[k]?'已开启':'已关闭');return}
  const sel=e.target.closest('[data-ssel]');if(sel){settingsMenu(sel);return}
  const mc=e.target.closest('[data-mcolor]');if(mc){editState.color=mc.dataset.mcolor;buildSettings();return}
  const mb=e.target.closest('[data-mact]');
  if(mb){
    const act=mb.dataset.mact,kind=mb.dataset.mkind,id=mb.dataset.mid;
    if(act==='add'){editState={mode:kind+'-new',id:null,color:PALETTE[LISTS.length%PALETTE.length]};buildSettings();return}
    if(act==='edit'){editState={mode:kind,id,color:(LISTS.find(x=>x.id===id)||{}).color};buildSettings();return}
    if(act==='del'){
      if(mb.dataset.arm){
        if(kind==='list'){
          const moved=tasks.filter(t=>t.list===id).length;
          tasks.forEach(t=>{if(t.list===id)t.list=null});
          LISTS=LISTS.filter(x=>x.id!==id);
          if(state.view==='list:'+id)state.view='today';
          if(state.detailId!=null)closeDetail();
          toast('清单已删除'+(moved?`,${moved} 个任务移入收件箱`:''));
        }else{
          deleteTag(id);toast('标签已删除');
        }
        editState={mode:null,id:null,color:null};buildSettings();render();
      }else{
        mb.dataset.arm='1';mb.classList.add('confirm');
        setTimeout(()=>{mb.dataset.arm='';mb.classList.remove('confirm')},2400);
      }
    }
    return;
  }
  if(e.target.closest('[data-msave]')){commitManage();return}
  if(e.target.closest('[data-mcancel]')){editState={mode:null,id:null,color:null};buildSettings();return}
  const bk=e.target.closest('[data-bkrestore]');
  if(bk){
    if(restoreArm===bk.dataset.bkrestore){clearTimeout(restoreArmTimer);restoreArm='';doRestoreBackup(bk.dataset.bkrestore)}
    else{restoreArm=bk.dataset.bkrestore;buildSettings();
      clearTimeout(restoreArmTimer);
      restoreArmTimer=setTimeout(()=>{if(restoreArm){restoreArm='';if(settingsTab==='data')buildSettings()}},3000)}
    return;
  }
  const act=e.target.closest('[data-sact]');if(act){
    const a=act.dataset.sact;
    if(a==='export'){exportData();return}
    if(a==='backupnow'){backupNow();return}
    if(a==='openfolder'){openDataFolder();return}
    if(a==='openbackups'){openBackups();return}
    if(a==='changebackupdir'){changeBackupDir();return}
    if(a==='resetbackupdir'){resetBackupDir();return}
    if(a==='changedir'){changeDataDir();return}
    if(a==='resetdir'){resetDataDir();return}
    if(a==='reset'){
      if(act.dataset.arm){resetDemo();closeSettings()}
      else{act.dataset.arm='1';act.textContent='再点一次确认';
        setTimeout(()=>{act.dataset.arm='';if(act.isConnected)act.textContent='重置'},2600)}
    }
  }
}
function settingsMenu(anchor){
  const key=anchor.dataset.ssel;let items,apply;
  if(key==='startview'){
    items=SMART.map(s=>({v:s.id,label:s.name,icon:s.icon,active:settings.startView===s.id}));
    apply=v=>{settings.startView=v;state.view=v};
  }else if(key==='weekstart'){
    items=[{v:'mon',label:'周一',active:settings.weekStart==='mon'},{v:'sun',label:'周日',active:settings.weekStart==='sun'}];
    apply=v=>{settings.weekStart=v};
  }else if(key==='timeformat'){
    items=[{v:'24',label:'24 小时制',active:settings.timeFormat==='24'},{v:'12',label:'12 小时制',active:settings.timeFormat==='12'}];
    apply=v=>{settings.timeFormat=v};
  }else if(key==='defaultremind'){
    items=[{v:'__none',label:'不提醒',icon:'x',active:!settings.defaultRemind},
      {v:'09:00',label:'当天 09:00',icon:'bell',active:settings.defaultRemind==='09:00'},
      {v:'12:00',label:'当天 12:00',icon:'bell',active:settings.defaultRemind==='12:00'},
      {v:'21:00',label:'前一天 21:00',icon:'bell',active:settings.defaultRemind==='21:00'}];
    apply=v=>{settings.defaultRemind=v==='__none'?null:v};
  }else return;
  openMenu(anchor,menuHTML(items),m=>m.addEventListener('click',e=>{
    const mi=e.target.closest('[data-mi]');if(!mi)return;
    apply(mi.dataset.mi);saveSettings();buildSettings();render();
  }));
}
function renameTag(old,nv){
  EXTRA_TAGS=EXTRA_TAGS.map(t=>t===old?nv:t);
  tasks.forEach(t=>{t.tags=(t.tags||[]).map(x=>x===old?nv:x)});
  if(state.view==='tag:'+old)state.view='tag:'+nv;
}
function deleteTag(tg){
  EXTRA_TAGS=EXTRA_TAGS.filter(t=>t!==tg);
  tasks.forEach(t=>{t.tags=(t.tags||[]).filter(x=>x!==tg)});
  if(state.view==='tag:'+tg)state.view='today';
}
function commitManage(){
  const inp=document.getElementById('mEditInput');
  const nv=(inp?inp.value:'').trim();
  const es=editState;
  if(!nv){toast('名称不能为空');return}
  if(es.mode==='list-new'){
    if(LISTS.some(l=>l.name===nv)){toast('清单「'+esc(nv)+'」已存在');return}
    LISTS.push({id:'c'+seq++,name:nv,color:es.color||PALETTE[0]});
    toast('清单「'+esc(nv)+'」已创建');
  }else if(es.mode==='list'){
    const l=LISTS.find(x=>x.id===es.id);
    if(LISTS.some(x=>x!==l&&x.name===nv)){toast('清单「'+esc(nv)+'」已存在');return}
    l.name=nv;l.color=es.color||l.color;
    toast('清单已更新');
  }else if(es.mode==='tag-new'){
    if(tagList().includes(nv)){toast('标签「'+esc(nv)+'」已存在');return}
    EXTRA_TAGS.push(nv);
    toast('标签「'+esc(nv)+'」已创建');
  }else{
    if(tagList().some(x=>x!==es.id&&x===nv)){toast('标签「'+esc(nv)+'」已存在');return}
    renameTag(es.id,nv);
    toast('标签已更新');
  }
  editState={mode:null,id:null,color:null};buildSettings();render();
}
let defaultDataDir='',autostartOn=false,lastBackupDate='';
function normDir(d){return(d||'').replace(/[\\/]+$/,'').toLowerCase()}
async function changeDataDir(){
  const inv=window.__TAURI__?.core?.invoke;
  if(!inv){toast('桌面端才能更改存储位置');return}
  let picked;
  try{picked=await inv('plugin:dialog|open',{options:{directory:true,title:'选择数据存储位置',multiple:false}})}
  catch(e){toast('选择失败:'+e.message);return}
  if(!picked)return;
  const dir=picked.replace(/[\\/]+$/,'');
  if(normDir(dir)===normDir(settings.dataDir||defaultDataDir)){toast('位置未变化');return}
  try{
    await inv('make_dir',{path:dir});
    await DB.close();
    settings.dataDir=dir;saveSettings();
    await DB.init();
    if(!DB.ready)throw new Error('新位置初始化失败');
    await syncAll();
    buildSettings();render();renderSyncBar();
    toast(syncBlocked?'已切换存储位置,但数据加载失败,改动暂无法保存':'数据已迁移到新位置');
  }catch(e){
    toast('迁移失败,已回退:'+(e.message||e));
    await DB.close();
    settings.dataDir='';saveSettings();
    await DB.init();await syncAll();buildSettings();renderSyncBar();
  }
}
async function resetDataDir(){
  await DB.close();
  settings.dataDir='';saveSettings();
  await DB.init();await syncAll();
  buildSettings();render();renderSyncBar();
  toast(syncBlocked?'已切回默认存储位置,但数据加载失败,改动暂无法保存':'已恢复默认存储位置');
}
async function openDataFolder(){
  const inv=window.__TAURI__?.core?.invoke;if(!inv)return;
  const dir=settings.dataDir||defaultDataDir;
  if(!dir){toast('存储位置获取中,稍后再试');return}
  try{await inv('open_folder',{path:dir})}catch(e){toast('打开失败:'+e.message)}
}
/* 生效的备份文件夹:自定义 backupDir 优先,否则数据目录 backups 子文件夹 */
function backupLoc(){
  if(settings.backupDir)return settings.backupDir.replace(/[\\/]+$/,'');
  const dir=(settings.dataDir||defaultDataDir||'').replace(/[\\/]+$/,'');
  if(!dir)return'';return dir+(dir.includes('\\')?'\\':'/')+'backups'; // 分隔符随数据目录,避免 D:\DoDo\data/backups 混排
}
/* W14 备份管理:列表查看 / 立即备份 / 一键恢复 */
const fmtSize=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':n>=1024?(n/1024).toFixed(1)+' KB':n+' B';
let backupsCache=null,restoreArm='',restoreArmTimer=null,backupsLoading=false;
async function refreshBackups(){
  const inv=window.__TAURI__?.core?.invoke;if(!inv)return;
  if(backupsLoading)return;backupsLoading=true; // 防重入:每次数据页渲染都会调这里
  const dir=(settings.dataDir||defaultDataDir||'').replace(/[\\/]+$/,'');
  if(!dir){backupsLoading=false;return}
  try{
    const list=await inv('list_backups',{dir,bdir:settings.backupDir||null});
    if(JSON.stringify(list)===JSON.stringify(backupsCache))return; // 未变化不重渲染,防循环
    backupsCache=list;
    if(settingsTab==='data')buildSettings();
  }catch(e){console.warn('[DoDo] 备份列表加载失败:',e)}
  finally{backupsLoading=false}
}
async function backupNow(){
  const inv=window.__TAURI__?.core?.invoke;if(!inv){toast('桌面端才能手动备份');return}
  const dir=(settings.dataDir||defaultDataDir||'').replace(/[\\/]+$/,'');
  if(!dir){toast('数据目录获取中,稍后再试');return}
  try{
    const dest=await inv('backup_database',{dir,bdir:settings.backupDir||null,name:`dodo-${TODAY}.db`,keep:7,force:true});
    if(!dest){toast('数据库文件不存在,备份未创建');return} // Rust 侧空串=没拷到东西,不能当日志记,否则当天自动备份被跳过
    lastBackupDate=TODAY;
    try{await DB.exec("INSERT OR REPLACE INTO meta(key,value) VALUES('lastBackup',?)",[TODAY])}catch(e){}
    await refreshBackups();buildSettings();toast('已创建备份');
  }catch(e){toast('备份失败:'+(e.message||e))}
}
async function doRestoreBackup(name){
  const inv=window.__TAURI__?.core?.invoke;if(!inv)return;
  const loc=backupLoc();if(!loc){toast('备份目录获取中,稍后再试');return}
  const sep=loc.includes('\\')?'\\':'/';
  const wasReady=DB.ready;
  DB.ready=false;resetSyncState(); // 暂停增量同步,防止恢复瞬间把旧内存状态写回恢复后的库
  try{
    const tmp=DB.filePath()+'.restore-tmp'; // 先拷临时文件再同卷 rename 原子替换,中途失败不会截断在用库(G3/B10)
    await inv('fs_copy',{from:loc+sep+name,to:tmp});
    await inv('fs_rename',{from:tmp,to:DB.filePath()});
    await DB.init();
    if(!DB.ready)throw new Error('恢复后数据库初始化失败'); // DB.init 内部吞错,必须显式核验,否则假成功(G3)
    await loadAll();reviveRepeats();scheduleSync();
    backupsCache=null;restoreArm='';
    buildSettings();render();renderSyncBar();
    toast(syncBlocked?'备份已恢复,但数据加载失败,改动暂无法保存':`已恢复 ${name.replace(/^dodo-/,'').replace(/\.db$/,'')} 的备份`);
  }catch(e){
    if(wasReady){try{await DB.init()}catch(_){/* 恢复可用状态 */}}
    restoreArm='';buildSettings();
    toast('恢复失败:'+(e.message||e));
  }
}
async function openBackups(){
  const inv=window.__TAURI__?.core?.invoke;if(!inv)return;
  const loc=backupLoc();
  if(!loc){toast('数据目录获取中,稍后再试');return}
  try{await inv('make_dir',{path:loc})}catch(e){}
  try{await inv('open_folder',{path:loc})}catch(e){toast('打开失败:'+e.message)}
}
async function changeBackupDir(){
  const inv=window.__TAURI__?.core?.invoke;
  if(!inv){toast('桌面端才能更改备份位置');return}
  let picked;
  try{picked=await inv('plugin:dialog|open',{options:{directory:true,title:'选择自动备份文件夹',multiple:false}})}
  catch(e){toast('选择失败:'+e.message);return}
  if(!picked)return;
  try{
    const sep=picked.includes('\\')?'\\':'/';
    if(await inv('fs_exists',{path:picked+sep+'dodo.db'})===true){toast('该文件夹包含 dodo.db,为防误清理请选择其他文件夹');return}
  }catch(e){}
  const dir=picked.replace(/[\\/]+$/,'');
  if(normDir(dir)===normDir(backupLoc())){toast('位置未变化');return}
  try{await inv('make_dir',{path:dir})}catch(e){}
  settings.backupDir=dir;saveSettings();
  buildSettings();toast('备份位置已更新');
}
function resetBackupDir(){
  settings.backupDir='';saveSettings();
  buildSettings();toast('已恢复默认备份位置');
}
function refreshAutostart(){
  const inv=window.__TAURI__?.core?.invoke;if(!inv)return;
  inv('autostart_status').then(v=>{const on=!!v;if(on!==autostartOn){autostartOn=on;if(settingsTab==='general')buildSettings()}}).catch(()=>{});
}
function exportData(){
  try{
    const blob=new Blob([JSON.stringify({app:'DoDo',exportedAt:new Date().toISOString(),lists:LISTS,tasks},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dodo-export.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast('已导出 dodo-export.json');
  }catch(err){toast('导出受限:当前环境不支持下载')}
}
function resetDemo(){
  tasks=JSON.parse(JSON.stringify(SAMPLE));
  syncBlocked=false; // 示例数据是用户主动重置,解除加载失败的写库封锁
  state.detailId=null;render();scheduleSync();toast('已恢复示例数据');
}

/* ================= 本地持久化(SQLite,读写统一走数据目录 filePath) ================= */
const DB={ready:false,inv:null,
  async init(){
    const inv=window.__TAURI__?.core?.invoke;
    if(!inv)return;
    this.inv=inv;
    // legacy=旧默认库:目标库全新时自动搬迁数据(自定义数据位置无缝接续)
    const legacy=defaultDataDir?defaultDataDir.replace(/[\\/]+$/,'')+'/dodo.db':undefined;
    try{
      await inv('sqlite_init',{path:this.filePath(),legacy});
      this.ready=true;
    }catch(e){console.warn('[DoDo] SQLite 初始化失败,本次以内存模式运行:',e)}
  },
  async close(){this.ready=false;resetSyncState()},
  async select(sql,values=[]){
    if(!this.inv)return[];
    try{return await this.inv('sqlite_select',{path:this.filePath(),sql,values})||[]}
    catch(e){console.warn('[DoDo] 查询失败:',e);return[]}
  },
  async exec(sql,values=[]){await this.inv('sqlite_exec',{path:this.filePath(),sql,values})},
  /* 批量写入:Rust 端单连接事务执行 */
  async batch(stmts){await this.inv('sqlite_batch',{path:this.filePath(),statements:stmts})},
  filePath(){const d=(settings.dataDir||defaultDataDir||'').replace(/[\\/]+$/,'');return d?d.replace(/\\/g,'/')+'/dodo.db':''}
};
let syncTimer=null;
function scheduleSync(){if(syncTimer)return;syncTimer=setTimeout(async()=>{syncTimer=null;await syncAll()},400)}
function taskPack(t){return[t.id,t.title,t.note||'',t.list||null,JSON.stringify(t.tags||[]),t.prio||0,t.due||null,t.time||null,t.remind||null,t.repeat||null,t.done?1:0,t.doneAt||null,t.nextDue||null,JSON.stringify(t.subs||[]),JSON.stringify(t.history||[])]}
let synced=new Map(),syncedLists='',syncedMeta=''; // 上次成功落库的快照,用于增量 diff
function resetSyncState(){synced=new Map();syncedLists='';syncedMeta=''}
function snapshotTasks(){return new Map(tasks.map(t=>{const a=taskPack(t);return[t.id,{key:a.join('\u0001'),args:a}]}))}
async function syncAll(){
  if(!DB.ready||syncBlocked)return;
  try{
    const rows=snapshotTasks();
    const listsKey=JSON.stringify(LISTS),metaKey=JSON.stringify([seq,EXTRA_TAGS]);
    const ups=[...rows].filter(([id,r])=>{const s=synced.get(id);return!s||s.key!==r.key});
    const dels=[...synced.keys()].filter(id=>!rows.has(id));
    const doLists=listsKey!==syncedLists,doMeta=metaKey!==syncedMeta;
    if(!ups.length&&!dels.length&&!doLists&&!doMeta)return;
    const stmts=dels.map(id=>({sql:'DELETE FROM tasks WHERE id=?',values:[id]}));
    for(const[,r]of ups)stmts.push({sql:'INSERT OR REPLACE INTO tasks(id,title,note,list,tags,prio,due,time,remind,repeat,done,doneAt,nextDue,subs,history) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',values:r.args});
    if(doLists){
      stmts.push({sql:'DELETE FROM lists',values:[]});
      for(let i=0;i<LISTS.length;i++){const l=LISTS[i];stmts.push({sql:'INSERT OR REPLACE INTO lists(id,name,color,sort) VALUES(?,?,?,?)',values:[l.id,l.name,l.color,i]})}
    }
    if(doMeta){
      stmts.push({sql:'INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)',values:['seq',String(seq)]});
      stmts.push({sql:'INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)',values:['extraTags',JSON.stringify(EXTRA_TAGS)]});
    }
    await DB.batch(stmts);
    synced=rows;syncedLists=listsKey;syncedMeta=metaKey;
  }catch(e){console.warn('[DoDo] 数据同步失败:',e)}
}
/* JSON 字段容错解析:单个字段损坏只丢该字段,不再让整次加载失败而写库覆盖(F3) */
const jparse=(s,d)=>{try{const v=JSON.parse(s);return v??d}catch(e){return d}};
function mapRow(r){return{id:r.id,title:r.title||'',note:r.note||'',list:r.list||null,tags:jparse(r.tags,[]),
  prio:r.prio||0,due:r.due||null,time:r.time||null,remind:r.remind||null,repeat:normRepeat(r.repeat),
  done:!!r.done,doneAt:r.doneAt||null,nextDue:r.nextDue||null,subs:jparse(r.subs,[]),history:jparse(r.history,[])}}
let syncBlocked=false; // loadAll 失败时置位:拒绝增量写库,防止内存默认值覆盖库中数据(F3)
async function loadAll(){
  if(!DB.ready)return;
  try{
    const rows=await DB.select('SELECT * FROM tasks');
    if(!rows.length){
      const seeded=await DB.select("SELECT value FROM meta WHERE key='seeded'");
      if(!seeded.length){syncBlocked=false;await syncAll();await DB.exec("INSERT OR REPLACE INTO meta(key,value) VALUES('seeded','1')");return}
    }
    tasks=rows.map(mapRow).sort((a,b)=>a.id-b.id);
    const ls=await DB.select('SELECT * FROM lists ORDER BY sort');
    if(ls.length)LISTS=ls.map(l=>({id:l.id,name:l.name,color:l.color}));
    for(const m of await DB.select('SELECT * FROM meta')){
      if(m.key==='seq')seq=+m.value||seq;
      else if(m.key==='extraTags')EXTRA_TAGS=jparse(m.value,[]); // meta 同样容错,损坏不再触发封锁(G1)
      else if(m.key==='lastBackup')lastBackupDate=m.value||'';
    }
    synced=snapshotTasks();syncedLists=JSON.stringify(LISTS);syncedMeta=JSON.stringify([seq,EXTRA_TAGS]);
    syncBlocked=false;renderSyncBar();
  }catch(e){
    console.warn('[DoDo] 数据加载失败,已暂停写库以防默认值覆盖:',e);
    if(!syncBlocked)toast('数据加载失败,改动暂无法保存;可尝试 设置 → 数据 → 恢复示例数据');
    syncBlocked=true;renderSyncBar();
  }
}
/* syncBlocked 常驻状态条:加载失败后透出,避免"界面正常但改动不保存"的静默丢数据(G1) */
function renderSyncBar(){
  let bar=document.getElementById('syncBlockBar');
  if(!syncBlocked){if(bar)bar.remove();return}
  if(!bar){
    bar=document.createElement('div');bar.id='syncBlockBar';
    bar.textContent='⚠ 数据加载失败,改动暂无法保存——可尝试「设置 → 数据 → 恢复示例数据」或重启应用';
    document.body.appendChild(bar);
  }
}
const notified=new Set();
async function sendNotify(title,body){
  const inv=window.__TAURI__?.core?.invoke;
  if(!inv)return;
  try{await inv('send_notification',{title,body})}
  catch(e){
    try{await inv('plugin:notification|notify',{options:{title,body}})}
    catch(_){console.warn('[DoDo] 通知失败:',e)}
  }
}
function startReminders(){
  if(!window.__TAURI__)return;
  setInterval(async()=>{
    if(!settings.notify)return;
    const now=new Date(),cur=iso(now);
    const hhmm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    for(const t of tasks){
      if(t.done||!t.due||!t.remind)continue;
      const key=t.id+':'+t.due+':'+t.remind;
      if(t.due<cur||(t.due===cur&&t.remind<=hhmm)){
        if(!notified.has(key)){notified.add(key);sendNotify('DoDo · '+fmtDue(t.due),t.title+(t.time?' ('+fmtTime(t.time)+')':''))}
      }
    }
  },30000);
}

/* 每日自动备份:每日首次启动把 dodo.db 复制到 backups 子目录,保留最近 7 份 */
async function autoBackup(){
  const inv=window.__TAURI__?.core?.invoke;
  if(!inv||!DB.ready)return;
  const dir=(settings.dataDir||defaultDataDir||'').replace(/[\\/]+$/,'');
  if(!dir||lastBackupDate===TODAY)return;
  try{
    await inv('backup_database',{dir,bdir:settings.backupDir||null,name:`dodo-${TODAY}.db`,keep:7});
    lastBackupDate=TODAY;
    await DB.exec("INSERT OR REPLACE INTO meta(key,value) VALUES('lastBackup',?)",[TODAY]);
  }catch(e){console.warn('[DoDo] 自动备份失败:',e)}
}

/* ================= 桌面集成 ================= */
if(window.__TAURI__?.event?.listen){
  window.__TAURI__.event.listen('quick-add-focus',()=>{$('#qaInput').focus()});
}

/* ================= 悬浮速记球桥接(球窗为纯视图,逻辑全在主窗) ================= */
function inv2(cmd,args){const inv=window.__TAURI__?.core?.invoke;if(inv)Promise.resolve(inv(cmd,args)).catch(()=>{})}
function ballPush(){
  if(!window.__TAURI__?.event?.emit)return;
  try{
    window.__TAURI__.event.emit('ball-state',{
      today:TODAY,
      theme:document.documentElement.dataset.theme,
      visible:settings.ballVisible!==false,
      lists:LISTS.map(l=>({id:l.id,name:l.name,color:l.color})),
      tasks:tasks.filter(t=>!t.done?(t.due&&t.due<=TODAY):t.doneAt===TODAY).map(t=>({
        id:t.id,t:t.title,due:t.due||null,time:t.time||null,list:t.list||null,
        prio:t.prio||0,rep:t.repeat?fmtRepeat(t.repeat):null,
        done:!!t.done,doneAt:t.doneAt||null,
        subs:t.subs&&t.subs.length?t.subs.filter(s=>s.d).length+'/'+t.subs.length:null
      }))
    });
  }catch(e){}
}
function ballAdd(text){
  /* 与主窗快速添加同一套落点:解析优先,未指明日期=无日期 */
  const p=parseQuick(text);
  const title=p.text||text.trim();
  if(!title)return;
  const list=p.list||null;
  tasks.push({id:seq++,title,list,tags:p.tags||[],prio:p.prio||0,
    due:p.due||null,time:p.time||null,remind:settings.defaultRemind||null,
    repeat:p.repeat||null,note:'',subs:[],done:false,doneAt:null});
  render();toast(`已添加「${esc(title)}」${p.due?'':(list?` · 已入「${esc(listById(list)?.name||'')}」`:' · 在收件箱')}`);
  try{window.__TAURI__.event.emit('ball-toast',{m:`已添加「${title}」${p.due?'':(list?' · 已入清单':' · 在收件箱')}`})}catch(e){} // 主窗常隐藏,落点确认回投球窗
}
if(window.__TAURI__?.event?.listen){
  const ballOn=(n,f)=>window.__TAURI__.event.listen(n,f);
  ballOn('ball-ready',()=>{ballPush();inv2('set_ball_visible',settings.ballVisible!==false)});
  ballOn('ball-toggle',e=>{const id=e.payload&&e.payload.id;if(byId(id)){toggleDone(id);render()}});
  ballOn('ball-add',e=>{const t=e.payload||{};if(t.text)ballAdd(t.text)});
  ballOn('ball-del',e=>{const id=e.payload&&e.payload.id;if(byId(id)){deleteTask(id);render()}});
  ballOn('ball-tomorrow',e=>{const id=e.payload&&e.payload.id;if(byId(id)){moveTomorrow(id);render()}});
  ballOn('ball-parse',e=>{window.__TAURI__.event.emit('ball-parsed',parseQuick((e.payload&&e.payload.text)||''))});
  ballOn('ball-hide',()=>{settings.ballVisible=false;saveSettings();inv2('set_ball_visible',false);if(settingsTab==='general')buildSettings()});
  ballOn('ball-error',e=>{toast('球窗错误: '+((e.payload&&e.payload.m)||''))});
  ballOn('open-settings',()=>{openSettings('general')});
}

/* ================= 启动 ================= */
/* 旧版数据搬迁:数据目录已改为可执行文件同级 data\(v0.2.2 起)。
   仅当新目录无库且旧 %APPDATA% 目录有库时执行一次:复制 dodo.db / backups / dodo.ico,
   并清掉 localStorage 里可能残留的旧自定义 dataDir */
let inv0=null;
async function migrateLegacyData(inv){
  try{
    const legacy=await inv('legacy_data_dir');
    if(!legacy)return;
    const J=(a,b)=>a.replace(/[\/]+$/,'')+'/'+b.replace(/^[\/]+/,''); // 统一正斜杠拼接,避开反斜杠转义
    const exists=async p=>{try{return await inv('fs_exists',{path:p})===true}catch(e){return false}};
    const copy=async(a,b)=>{try{await inv('fs_copy',{from:a,to:b})}catch(e){}};
    const copyDir=async(a,b)=>{try{await inv('make_dir',{path:b});await inv('fs_copy_dir',{from:a,to:b})}catch(e){}};
    const legacyDb=J(legacy,'dodo.db');
    if(!await exists(legacyDb))return;
    const newDb=J(defaultDataDir,'dodo.db');
    if(await exists(newDb))return; // 新目录已有数据,不覆盖
    await copy(legacyDb,newDb);
    if(await exists(J(legacy,'backups')))await copyDir(J(legacy,'backups'),J(defaultDataDir,'backups'));
    if(await exists(J(legacy,'dodo.ico')))await copy(J(legacy,'dodo.ico'),J(defaultDataDir,'dodo.ico'));
    if(settings.dataDir){settings.dataDir='';saveSettings()} // 清指向旧 APPDATA 时代的残留
  }catch(e){console.warn('[DoDo] 旧数据搬迁失败(数据仍在旧目录):',e)}
}
async function boot(){
  const inv=window.__TAURI__?.core?.invoke;
  if(inv){
    inv0=inv;
    try{defaultDataDir=await inv('default_data_dir')}catch(e){}
    await migrateLegacyData(inv);
  }
  await DB.init();
  await loadAll();
  tasks.forEach(t=>{t.repeat=normRepeat(t.repeat)});
  if(SMART.some(s=>s.id===settings.startView))state.view=settings.startView;
  applyTheme();
  reviveRepeats();
  render();
  startReminders();
  setInterval(reviveRepeats,30000);
  if(inv){
    inv('autostart_status').then(v=>{autostartOn=!!v}).catch(()=>{});
    autoBackup();
  }
}
boot();
function render(){TODAY=iso(new Date());buildSidebar();buildMain();buildDetail();scheduleSync();ballPush();renderSyncBar()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden){reviveRepeats();render()}});

