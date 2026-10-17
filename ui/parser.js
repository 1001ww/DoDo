/* ============================================================
   parser.js — 快速添加自然语言解析器(C57 自 app.js 拆出)
   parseQuick 为唯一解析入口;依赖 core.js 的 iso/addDays 与宿主的 LISTS
   ============================================================ */
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
  const chips=[];let due=null,time=null,list=null,prio=0,repeat=null,remind=null;const tags=[];
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
  /* 清单与标签:捕获在 ! @ # 处截断,支持 #清单!高 / #清单@标签 连写,不再整体吞成一个标记(C47) */
  while(m=take(/#([^#!@\s]+)/)){const g=m[1];const l=LISTS.find(l=>l.name===g||l.name.startsWith(g));if(l){list=l.id;chips.push({k:'list',v:'#'+l.name})}else{tags.push(g);chips.push({k:'tag',v:'#'+g})}}
  while(m=take(/@([^#!@\s]+)/)){tags.push(m[1]);chips.push({k:'tag',v:'@'+m[1]})}
  /* 优先级:!高 / 高优先级 / 优先级高 / P1-P3 */
  if(m=take(/!(?:优先级)?(高|中|低)(?:优先级)?/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/(高|中|低)优先级/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/优先级(高|中|低)/)){prio={高:3,中:2,低:1}[m[1]]}
  else if(m=take(/\bP([123])\b/i)){prio={'1':3,'2':2,'3':1}[m[1].toLowerCase()]}
  if(prio)chips.push({k:'prio',v:{3:'高',2:'中',1:'低'}[prio],p:prio});
  /* 提醒(C48):时刻+提醒[我] / 准时提醒 / 提前N分钟|小时提醒(支持中文数字与「半」,按任务时刻换算);无任务时刻则保留原文 */
  const trimTail=()=>{text=text.replace(m[0],' ').trim().replace(/[\s,，、;；:：.。]+$/,'')};
  if(!remind&&(m=text.match(/((?:上午|早上|中午|下午|晚上|凌晨)?\s*\d{1,2}(?:[:：点]\d{0,2})?分?半?|\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*提醒(?:我)?/i))){
    const am=m[1].match(/上午|早上|中午|下午|晚上|凌晨/)?.[0],half=/半/.test(m[1]);
    let t=m[1].replace(/[分\s]/g,'').replace(/[：点]/g,':').replace(/半/g,'').replace(/\s*(am|pm)/i,'');
    if(am)t=t.replace(am,'');
    let[h2,m2]=t.split(':');h2=+h2;m2=m2?+m2:(half?30:0);
    if(/pm/i.test(m[1])&&h2<12)h2+=12;
    if(/am/i.test(m[1])&&h2===12)h2=0;
    if(h2<24&&m2<60){remind=`${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}`;chips.push({k:'remind',v:remind});trimTail()}
  }
  if(!remind&&time&&(m=text.match(/准时提醒(?:我)?/))){remind=time;chips.push({k:'remind',v:remind});trimTail()}
  if(!remind&&time&&(m=text.match(/提前\s*(半|\d{1,3}|[零一二两三四五六七八九十]{1,3})(?:个)?\s*(分钟|小时)\s*提醒(?:我)?/))){
    const[h2,m2]=time.split(':').map(Number);
    const n=m[1]==='半'?0.5:(/^\d+$/.test(m[1])?+m[1]:cnNum(m[1]));
    if(Number.isFinite(n)){
      const mins=Math.max(0,h2*60+m2-Math.round(n*(m[2]==='小时'?60:1)));
      remind=`${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
      chips.push({k:'remind',v:remind});trimTail();
    }
  }
  if(!remind&&time&&(m=text.match(/(^|[,,，、;；:：\s])提醒(?:我)?(?=[,,，、;；:：\s]|$)/))){remind=time;chips.push({k:'remind',v:remind});trimTail()}
  /* 重复规则缺省补全:每周未选周几→跟随到期日;每月未选几号→跟随到期日/今天 */
  if(repeat){
    if(repeat.type==='weekly'&&(!repeat.weekdays||!repeat.weekdays.length)){
      repeat.weekdays=[due?((parseISO(due).getDay()+6)%7+1):((new Date().getDay()+6)%7+1)];
      if(!due)due=addDays(0);
    }
    if(repeat.type==='monthly'&&!repeat.monthDay)repeat.monthDay=due?parseISO(due).getDate():new Date().getDate();
  }
  /* 只写了时刻未写日期:落最近一次到来——今天该时刻未到落今天,已过顺延明天;重复任务不带此默认,仍由锚定/nextOccur 排期 */
  if(time&&!due&&!repeat){
    const n=new Date(),hm=time.split(':').map(Number);
    const past=n.getHours()*60+n.getMinutes()>hm[0]*60+hm[1];
    due=addDays(past?1:0);chips.push({k:'date',v:past?'明天':'今天'});
  }
  /* 提醒统一(C58):非重复任务且已定 due 时,把锚定 'HH:MM' 换算为绝对日期时刻;
     重复任务保持锚定 'HH:MM' 跟随每次复活的 due;无 due 时保留锚定(暂不触发) */
  if(remind&&due&&!repeat)remind=due+' '+remind;
  return{text,chips,due,time,list,prio,repeat,tags,remind};
}
