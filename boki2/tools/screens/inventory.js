#!/usr/bin/env node
'use strict';
// 状態の書き換えで場面を飛ばさず、既存auto.jsと画面の取っ手で撮影する。
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const auto = require('../playtest/auto.js');
const { initialSave } = require('../playtest/bot-runs.js');
const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.SCREEN_OUTPUT || path.join(ROOT, 'docs/screens');
const SEED = 0;
const STYLE = process.env.SCREEN_STYLE || 'skilled';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');

// 全文のinnerText、表示中（画面外のスクロール領域も含む）の操作部品とテキストを測定。
async function measure(page) {
  return page.evaluate(() => {
    const shown = e => { const c=getComputedStyle(e),r=e.getBoundingClientRect(); return c.visibility!=='hidden' && c.display!=='none' && +c.opacity!==0 && r.width>0 && r.height>0; };
    const fonts = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let t;
    while ((t=walker.nextNode())) if(t.textContent.trim() && shown(t.parentElement)) {
      const range=document.createRange();range.selectNodeContents(t);
      if(range.getBoundingClientRect().width) fonts.add(parseFloat(getComputedStyle(t.parentElement).fontSize));
    }
    // 入力欄のvalue/placeholderはTextノードを持たないため別に取る。
    document.querySelectorAll('input,select,textarea').forEach(e=>{if(shown(e))fonts.add(parseFloat(getComputedStyle(e).fontSize));});
    const sizes=[...fonts].sort((a,b)=>a-b);
    return {chars:document.body.innerText.length,controls:[...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab]')].filter(e=>shown(e)&&!e.disabled).length,
      fontSizes:sizes,fontKinds:sizes.length,minFont:sizes[0]??null,pages:+(document.documentElement.scrollHeight/innerHeight).toFixed(3),
      scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      text:document.body.innerText};
  });
}

async function state(page) {
  return page.evaluate(()=>{
    const S=window.__sim.S, m=window.SIMDATA.months[S.mi], e=window.__sim.events()[S.ei];
    const has=s=>!!document.querySelector(s);
    const markers=['data-nameok','data-pickmode','data-p3','data-go','data-step','data-note','data-put','data-ask','data-pick','data-opt','data-yes','data-o','data-sort','data-reason','data-decide','data-b','data-guess','data-ok','data-n','data-plan-ok','data-bowl-ok','data-rep-ok','data-band-next','data-deb-next','data-deb-factor','data-deb-opt','data-fork-next','data-cl','data-ca','data-cdone','data-sh','data-shdone','data-op','data-oq','data-odone','data-chk','data-restart','data-again','data-rc','data-calc-in','data-calc-next'];
    return {mi:S.mi,ei:S.ei,year:m?.year||(m?.next4?2:1),month:m?.m??null,label:m?.label||'',phase:S.phase,type:e?.t||'none',event:e?.id||'',worldT:S.W?.t??null,bankrupt:!!S.W?.bankrupt,
      markers:markers.filter(k=>has('['+k+']')).join(','),classes:[...document.querySelectorAll('#sim main,#sim .s-card,#sim .s-disc,#sim [data-screen]')].map(x=>x.dataset.screen||x.className).join('|'),
      note:has('[data-note],[data-ask]'),sort:has('[data-put],[data-sort]'),doc:has('.s-doc'),title:has('.s-title'),report:has('[data-rep-ok]'),band:has('[data-band-next]'),plan:has('[data-plan-ok]'),bowl:has('[data-bowl-ok]')};
  });
}
function kind(s) {
  if(s.title)return 'タイトル・セーブ枠';
  if(s.markers.includes('data-nameok'))return '屋号・名前';
  if(s.markers.includes('data-pickmode'))return '受験年度';
  if(s.note)return 'プロローグ・note';
  if(s.sort)return s.mi===0?'プロローグ・sort/tap':'発見・sort/tap';
  if(s.plan)return '作戦の机';if(s.bowl)return '一杯の組み立て';
  if(s.report)return '月報';if(s.band)return '締めの帯';
  if(s.doc&&s.classes.includes('s-docscreen'))return '書類・docScreen';
  if(s.markers.includes('data-reason'))return '発見・理由';
  if(s.markers.split(',').includes('data-o'))return '名前の札';
  if(s.markers.split(',').includes('data-guess'))return '予想';
  if(s.classes.split('|').includes('debrief'))return 'ふりかえり';
  if(s.classes.split('|').includes('fork'))return '分かれ道の図';
  if(s.classes.split('|').includes('intro'))return '月はじめ・開店';
  if(s.bankrupt)return '倒産';
  return ({talk:'会話',board:'プロローグ・会話と操作',choice:'選択肢',decision:'判断・card',discover:'発見',closing:'締め',opening:'開始記入',sheet:'決算書・精算表',report:'決算書',doc:'書類・docScreen',calc:'計算の作業台',end:'結末',ending:'結末',rreport:'月報',debrief:'ふりかえり',recall:'思い出す',predict:'予想',bowl:'一杯の組み立て',plan:'作戦の机'})[s.type]||s.type;
}
function stage(k){if(/note/.test(k))return '①';if(/docScreen/.test(k))return '②';if(/sort\/tap/.test(k))return '③';if(/選択|判断|理由|予想|名前の札|発見/.test(k))return '④';if(/月報|締め|開始記入|決算/.test(k))return '⑤';return '';}

async function run(options={}) {
  const { chromium }=require(process.env.PIYO_PLAYWRIGHT||'playwright');
  fs.mkdirSync(path.join(OUT,'images'),{recursive:true});
  const rows=[], journeys=[], seen=new Set(), errors=[], actions=[];
  const server=http.createServer((req,res)=>{
    const file=path.resolve(ROOT,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
    try{const b=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(b);}catch{res.writeHead(404);res.end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({executablePath:process.env.PIYO_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let current;
  const persist=()=>fs.writeFileSync(path.join(OUT,'inventory.json'),JSON.stringify({schema:1,seed:SEED,rows,journeys,errors,actions},null,2)+'\n');
  async function shot(page,k,key,extra={}) {
    const now=await state(page);
    const timed=/^(上部の情報|タブ・town|町の地区|ライバル|月報|締めの帯)$/.test(k)&&['1-4','1-9','1-3','2-4'].includes(`${now.year}-${now.month}`);
    key=k+':'+(/^(タブ・|練習室|検定会場|上部の情報|ゲームの設定|ライバル|空き物件|町の地区|考え方の地図|成長の記録|会社の棚)/.test(k)?'':now.markers)+(timed?':'+now.year+'-'+now.month:'');
    const sig=current.name+':'+key;if(seen.has(sig))return;
    seen.add(sig);await page.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>document.fonts.ready);
    const s=await state(page), m=await measure(page), id='S'+String(rows.length+1).padStart(3,'0');
    const file=`images/${id}-${current.name}.jpg`;
    await page.screenshot({path:path.join(OUT,file),type:'jpeg',quality:55,fullPage:true,animations:'disabled'});
    rows.push({id,file,width:current.width,height:current.height,color:current.color,seed:SEED,style:current.style||STYLE,kind:k,stage:stage(k),...s,...m,...extra,imageSha:sha(fs.readFileSync(path.join(OUT,file)))});
    persist();console.log(id,current.name,k,s.label,s.ei);
  }
  const click=async(p,sel)=>{await p.locator(sel).first().click();actions.push({profile:current.name,selector:sel});};
  const close=async p=>{while(await p.locator('.s-ov [data-close]').count())await p.locator('.s-ov').last().locator('[data-close]').click();};
  async function extras(p,s) {
    const time=`${s.year}-${s.month}`;
    if(s.worldT==null||![ '1-4','1-9','1-3','2-4'].includes(time)||!await p.locator('[data-rpanel="town"]').count())return;
    const sig=current.name+':extras:'+time;if(seen.has(sig))return;seen.add(sig);
    await shot(p,'上部の情報','header:'+time);
    const mobile=await p.locator('.r-tabs').isVisible();
    const root=mobile?'.s-ov':'.r-right';
    const panels=mobile?await p.locator('.r-tabs [data-rpanel]').evaluateAll(xs=>xs.map(x=>x.dataset.rpanel)):['money','town','shop','book','log','co'];
    for(const panel of panels){
      if(mobile)await click(p,`.r-tabs [data-rpanel="${panel}"]`);else if(panel!=='money')await click(p,`[data-rtab="${panel}"]`);
      await shot(p,'タブ・'+panel,`panel:${time}:${panel}`);
      if(panel==='town'){
        for(const [attr,k] of [['data-rival','ライバル'],['data-lot','空き物件'],['data-area','町の地区']]){
          const loc=p.locator(`${root} [${attr}]`).first();
          if(await loc.count()){
            // 地区のSVG中央には物件が重なる。地区名の文字を通常クリックする。
            if(attr==='data-area')await loc.locator('text').first().click();else await loc.click();
            await shot(p,k,`${k}:${time}`);await p.locator('.s-ov').last().locator('[data-close]').click();
          }
        }
      }
      if(panel==='co')for(const [v,k] of [['map','考え方の地図'],['grow','成長の記録'],['co','会社の棚と元帳']]){
        await click(p,`${root} [data-ov="${v}"]`);await shot(p,k,`${k}:${time}`);await p.locator('.s-ov').last().locator('[data-close]').click();
      }
      await close(p);
    }
    // 練習室は全面の画面遷移。戻るボタンを押して同じ進行位置へ戻る。
    if(mobile)await click(p,'.r-tabs [data-rpanel="co"]');else await click(p,'[data-rtab="co"]');
    await click(p,`${root} [data-ov="room"]`);await close(p);
    await shot(p,'練習室',`room:${time}`);
    for(const tab of ['miss','speed','items']){await click(p,`[data-rt="${tab}"]`);await shot(p,'練習室・'+tab,`room:${time}:${tab}`);}
    await click(p,'[data-ref]');await shot(p,'練習室・参考書',`reference:${time}`);await close(p);
    await click(p,'[data-rhall]');await shot(p,'検定会場・メニュー',`hall:${time}`);
    await click(p,'[data-start="practice"]');await shot(p,'検定会場・本試験形式',`exam:${time}`);
    for(const part of ['2','3','4','5'])if(await p.locator(`[data-part="${part}"]`).count()){await click(p,`[data-part="${part}"]`);await shot(p,'検定会場・第'+part+'問',`exam:${time}:${part}`);}
    for(const tool of ['memo','calc']){await click(p,`[data-tool="${tool}"]`);await shot(p,'検定会場・'+tool,`exam:${time}:${tool}`);await click(p,`[data-tool="${tool}"]`);}
    await click(p,'[data-hallback]');if(await p.locator('[data-hallquit]').count())await click(p,'[data-hallquit]');
    await close(p);
    const after=await state(p);if(after.mi!==s.mi||after.ei!==s.ei)throw Error('閲覧後の進行位置が変わった');
  }
  try{
    for(current of (options.profiles||[
      {name:'mobile-light',width:390,height:844,color:'light'},
      {name:'desktop-light',width:1280,height:800,color:'light'},
      {name:'mobile-dark',width:390,height:844,color:'dark'},
      {name:'idle-mobile-light',width:390,height:844,color:'light',style:'idle'},
      {name:'idle-desktop-light',width:1280,height:800,color:'light',style:'idle'}])){
      if(process.env.SCREEN_PROFILE&&current.name!==process.env.SCREEN_PROFILE)continue;
      const context=await browser.newContext({viewport:{width:current.width,height:current.height},hasTouch:current.width===390,isMobile:current.width===390,deviceScaleFactor:1,colorScheme:current.color,reducedMotion:'reduce',serviceWorkers:'block',locale:'ja-JP',timezoneId:'Asia/Tokyo'});
      await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
      await context.addInitScript(({save,seed})=>{localStorage.setItem('boki2sim.v4',JSON.stringify(save));let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}, {save:initialSave(SEED),seed:SEED});
      const p=await context.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push({profile:current.name,error:e.message}));p.on('dialog',d=>d.accept());
      await p.goto(origin+'/ramen.html');
      await shot(p,'タイトル・セーブ枠','title');await click(p,'.s-more > summary');await shot(p,'ゲームの設定','settings');await click(p,'.s-more > summary');
      let last='',repeated=0,supplementDone=false;
      let result;
      try{
        result=await auto(p,{style:current.style||STYLE,choose:(current.style||STYLE)==='idle'?{site:'ekimae',form:'part2',sign:'large',supplier:'high'}:{},seed:SEED,strategy:1,maxSteps:5500,endMode:'y2',stopWhen:async()=>supplementDone,onClickTiming:async info=>{
          if(/data-pick=|data-sort=/.test(info.selector)&&await p.locator('[data-reason]:visible').count())await shot(p,'発見・理由','reason');
        },onStep:async n=>{
          const s=await state(p), k=kind(s), key=`${s.type}:${s.markers}:${s.classes}`;
          const stamp=`${s.mi}:${s.ei}:${s.markers}:${(await p.locator('#sim').innerText()).slice(-500)}`;
          repeated=stamp===last?repeated+1:0;last=stamp;if(repeated>12)throw Error('同じ画面で13回停止');
          await shot(p,k,key);
          if((s.report||s.band||s.plan)&&['1-4','1-9','1-3','2-4'].includes(`${s.year}-${s.month}`))await shot(p,k,`${k}:${s.year}:${s.month}`);
          if(s.plan&&s.year>=2&&await p.locator('[data-plan-more] > summary').count()&&!seen.has(current.name+':expanded-plan')){
            seen.add(current.name+':expanded-plan');
            if(await p.locator('[data-plan-more] > summary').count()){await click(p,'[data-plan-more] > summary');await shot(p,'作戦の机・すべての手','plan-expanded');await click(p,'[data-plan-more] > summary');}
            if(process.env.SCREEN_SUPPLEMENT)supplementDone=true;
          }
          if(!process.env.SCREEN_SUPPLEMENT)await extras(p,s);
          if(n%100===0)console.log('進行',current.name,n,s.label);
        },onAction:async a=>actions.push({profile:current.name,...a}),shot:async label=>{const s=await state(p);await shot(p,kind(s),'auto:'+label);}});
      }catch(e){errors.push({profile:current.name,error:e.stack});await shot(p,'進行停止','stuck');result={stuck:true};}
      journeys.push({profile:current.name,style:current.style||STYLE,seed:SEED,result,final:await state(p)});persist();await context.close();
    }
  }finally{await browser.close();await new Promise(r=>server.close(r));persist();}
  return {rows,journeys,errors};
}
module.exports={measure,state,kind,stage,run};
if(require.main===module)run().then(x=>console.log(JSON.stringify({screens:x.rows.length,journeys:x.journeys,errors:x.errors}))).catch(e=>{console.error(e);process.exitCode=1;});
