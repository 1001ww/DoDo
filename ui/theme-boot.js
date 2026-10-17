/* 首屏主题防闪白(FOUC):在样式表应用前同步解析持久化偏好,立即设置 data-theme。
   逻辑须与 app.js applyTheme 保持一致:themeMode=auto 跟随系统深色,否则用显式值。C56 */
(function(){
  try{
    var s={};try{s=JSON.parse(localStorage.getItem('dodo-settings')||'{}')}catch(e){}
    var m=s.themeMode||localStorage.getItem('dodo-theme')||'light';
    if(m==='auto')m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
    document.documentElement.dataset.theme=m;
  }catch(e){}
})();