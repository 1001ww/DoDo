# -*- coding: utf-8 -*-
# 把 prototype/index.html 拆分为 ui/ 三件套并注入桌面版适配
import re, sys, io

SRC = 'prototype/index.html'
OUT = 'ui/'

src = io.open(SRC, encoding='utf-8').read()

style = re.search(r'<style>([\s\S]*?)</style>', src).group(1)
script = re.search(r'<script>([\s\S]*?)</script>', src).group(1)
html = src
html = html.replace(re.search(r'<style>[\s\S]*?</style>', src).group(0), '<link rel="stylesheet" href="styles.css">')
html = html.replace(re.search(r'<script>[\s\S]*?</script>', src).group(0), '<script defer src="app.js"></script>')
html = html.replace('<header class="titlebar">', '<header class="titlebar" data-tauri-drag-region>')

def rep(s, old, new, tag):
    n = s.count(old)
    assert n == 1, 'PATTERN %s matched %d times' % (tag, n)
    return s.replace(old, new)

# ---- 持久层 + 提醒调度 + 桌面集成(插入到启动段之前) ----
DB_CHUNK = '''/* ================= 本地持久化(SQLite) ================= */
const DB={ready:false,inv:null,
  async init(){
    const inv=window.__TAURI__?.core?.invoke;
    if(!inv)return;
    try{
      await inv('plugin:sql|load',{db:'sqlite:dodo.db'});
      this.inv=inv;this.ready=true;
    }catch(e){console.warn('[DoDo] SQLite 初始化失败,本次以内存模式运行:',e)}
  },
  async select(sql,values=[]){const r=await this.inv('plugin:sql|select',{db:'sqlite:dodo.db',sql,values});return r||[]},
  async exec(sql,values=[]){await this.inv('plugin:sql|execute',{db:'sqlite:dodo.db',sql,values})}
};
let syncTimer=null;
function scheduleSync(){if(syncTimer)return;syncTimer=setTimeout(async()=>{syncTimer=null;await syncAll()},400)}
function taskPack(t){return[t.id,t.title,t.note||'',t.list||null,JSON.stringify(t.tags||[]),t.prio||0,t.due||null,t.time||null,t.remind||null,t.repeat||null,t.done?1:0,t.doneAt||null,JSON.stringify(t.subs||[])]}
async function syncAll(){
  if(!DB.ready)return;
  try{
    await DB.exec('DELETE FROM tasks');
    for(const t of tasks)await DB.exec('INSERT OR REPLACE INTO tasks(id,title,note,list,tags,prio,due,time,remind,repeat,done,doneAt,subs) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',taskPack(t));
    await DB.exec('DELETE FROM lists');
    for(let i=0;i<LISTS.length;i++){const l=LISTS[i];await DB.exec('INSERT OR REPLACE INTO lists(id,name,color,sort) VALUES(?,?,?,?)',[l.id,l.name,l.color,i])}
    await DB.exec('INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)',['seq',String(seq)]);
    await DB.exec('INSERT OR REPLACE INTO meta(key,value) VALUES(?,?)',['extraTags',JSON.stringify(EXTRA_TAGS)]);
  }catch(e){console.warn('[DoDo] 数据同步失败:',e)}
}
function mapRow(r){return{id:r.id,title:r.title,note:r.note||'',list:r.list||null,tags:JSON.parse(r.tags||'[]'),
  prio:r.prio||0,due:r.due||null,time:r.time||null,remind:r.remind||null,repeat:r.repeat||null,
  done:!!r.done,doneAt:r.doneAt||null,subs:JSON.parse(r.subs||'[]')}}
async function loadAll(){
  if(!DB.ready)return;
  try{
    const rows=await DB.select('SELECT * FROM tasks');
    if(!rows.length){
      const seeded=await DB.select("SELECT value FROM meta WHERE key='seeded'");
      if(!seeded.length){await syncAll();await DB.exec("INSERT OR REPLACE INTO meta(key,value) VALUES('seeded','1')");return}
    }
    tasks=rows.map(mapRow).sort((a,b)=>a.id-b.id);
    const ls=await DB.select('SELECT * FROM lists ORDER BY sort');
    if(ls.length)LISTS=ls.map(l=>({id:l.id,name:l.name,color:l.color}));
    for(const m of await DB.select('SELECT * FROM meta')){
      if(m.key==='seq')seq=+m.value||seq;
      else if(m.key==='extraTags')EXTRA_TAGS=JSON.parse(m.value||'[]');
    }
  }catch(e){console.warn('[DoDo] 数据加载失败:',e)}
}
const notified=new Set();
async function sendNotify(title,body){
  const T=window.__TAURI__;
  try{
    if(T?.notification){await T.notification.requestPermission?.();await T.notification.sendNotification({title,body});return}
    if(DB.inv){await DB.inv('plugin:notification|notify',{options:{title,body}})}
  }catch(e){console.warn('[DoDo] 通知失败:',e)}
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

/* ================= 桌面集成 ================= */
if(window.__TAURI__?.event?.listen){
  window.__TAURI__.event.listen('quick-add-focus',()=>{$('#qaInput').focus()});
}
'''

NEW_BOOT = DB_CHUNK + '''
/* ================= 启动 ================= */
async function boot(){
  await DB.init();
  await loadAll();
  if(SMART.some(s=>s.id===settings.startView))state.view=settings.startView;
  applyTheme();
  render();
  startReminders();
}
boot();
function render(){TODAY=iso(new Date());buildSidebar();buildMain();buildDetail();scheduleSync()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
'''

script = rep(script, '''/* ================= 启动 ================= */
if(SMART.some(s=>s.id===settings.startView))state.view=settings.startView;
applyTheme();
render();
function render(){TODAY=iso(new Date());buildSidebar();buildMain();buildDetail()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});''', NEW_BOOT, 'boot')

# ---- 窗口控制按钮:接 Tauri 真实窗口 API ----
script = rep(script, '''  if(e.target.closest('[data-win]')){
    const w=e.target.closest('[data-win]').dataset.win;
    toast(w==='close'?'这是设计原型,不会真的关闭窗口':(w==='min'?'已最小化(原型演示)':'已最大化(原型演示)'));
    return}''', '''  if(e.target.closest('[data-win]')){
    const w=e.target.closest('[data-win]').dataset.win;
    const win=window.__TAURI__?.window?.getCurrentWindow?.();
    try{
      if(w==='min'){win?win.minimize():toast('已最小化(浏览器预览)')}
      else if(w==='max'){win?win.toggleMaximize():toast('已最大化(浏览器预览)')}
      else{win?win.close():toast('浏览器预览中不会关闭窗口')}
    }catch(err){toast('窗口操作失败:'+err.message)}
    return}''', 'winctl')

# ---- 详情字段编辑落库 ----
script = rep(script, "document.addEventListener('change',e=>{if(e.target.dataset.field){buildMain();buildSidebar()}});",
             "document.addEventListener('change',e=>{if(e.target.dataset.field){buildMain();buildSidebar();scheduleSync()}});", 'change')

io.open(OUT+'index.html', 'w', encoding='utf-8').write(html)
io.open(OUT+'styles.css', 'w', encoding='utf-8').write(style)
io.open(OUT+'app.js', 'w', encoding='utf-8').write(script)
print('OK: ui/index.html, ui/styles.css, ui/app.js')
