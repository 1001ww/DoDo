/* ============================================================
   core.js — 主窗/悬浮球共享工具与图标(C57 拆分,单一事实源)
   两窗各自以 <script> 引入;TODAY 由宿主脚本赋值(app.render / ball.applyState)
   ============================================================ */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseISO=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(n,base)=>{const x=base?parseISO(base):new Date();x.setDate(x.getDate()+n);return iso(x)};
let TODAY=iso(new Date());
const WD=['周日','周一','周二','周三','周四','周五','周六'];
const diffDays=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
/* 人话到期日:今天/明天/昨天/逾期N天/周X/M月D日;TODAY 未就绪时透传原值 */
function fmtDue(d){if(!TODAY)return d;const df=diffDays(TODAY,d),x=parseISO(d);
  if(df===0)return'今天';if(df===1)return'明天';if(df===-1)return'昨天';
  if(df<0)return`逾期${-df}天`;if(df<7)return WD[x.getDay()];
  return`${x.getMonth()+1}月${x.getDate()}日`}

/* ================= 图标(两窗联合表,app 设计为权威) ================= */
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
  tag:'<path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2c.5 0 1 .2 1.4.6z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  checkS:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevL:'<path d="m15 18-6-6 6-6"/>',chevR:'<path d="m9 18 6-6-6-6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  edit:'<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  palette:'<path d="M12 3a9 9 0 1 0 .46 18H14a2 2 0 0 0 1.56-3.25 1.5 1.5 0 0 1 1.18-2.44h2.06A3.7 3.7 0 0 0 22.5 11.6C22.06 6.79 17.4 3 12 3z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="10.2" cy="7.6" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.8" cy="7" r="1.2" fill="currentColor" stroke="none"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 15.8v.4"/>',
  minus:'<path d="M5 12h14"/>',
  grip:'<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
  chevD:'<path d="m6 9.5 6 6 6-6"/>',
  home:'<path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M5.5 9v11h13V9"/>',
  gear:'<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95A7 7 0 0 0 14 5.1L13.6 2.6h-4L9.2 5.1a7 7 0 0 0-2.5 1.44l-2.36-.95-2 3.46 2 1.55a7 7 0 0 0 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.51 1.44l.4 2.5h4l.4-2.5a7 7 0 0 0 2.5-1.44l2.36.95 2-3.46-2-1.55c.1-.46.14-.93.14-1.4Z"/>',
  eyeOff:'<path d="M4 4l16 16"/><path d="M10.6 5.9A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.2 3.9M6.1 6.9A16.9 16.9 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
};
const ic=(n,s=16,w=1.8)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;
