#!/usr/bin/env node
// ラーメン版を画面の取っ手で通す。結果と計測は別JSONL、失敗も1周として残す。
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { performance } = require('perf_hooks');
const autoRun = require('./auto.js');
const ROOT = path.resolve(__dirname, '../..');
const STYLES = ['idle', 'random', 'skilled'];
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
function loadChromium(modulePath = process.env.PIYO_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright') { return require(modulePath).chromium; }
function browserPath() { return process.env.PIYO_CHROMIUM || '/opt/pw-browsers/chromium'; }
function seedList(s) {
  const out=[];
  for(const part of s.split(',')) {
    const m=/^(\d+)(?:-(\d+))?$/.exec(part); if(!m) throw new Error('seeds は 0-29 または 0,2,4 の形');
    const a=+m[1], b=m[2]==null?a:+m[2];
    if(b<a || b>2147483647 || b-a>100000) throw new Error('seed の範囲が不正');
    for(let i=a;i<=b;i++)out.push(i);
  }
  return [...new Set(out)];
}
function args(argv) {
  const o={styles:STYLES,seeds:seedList('0-29'),width:1280,height:900,parallel:4,maxSteps:2400,errorRate:0,timeout:10000,output:null,chromium:browserPath(),playwright:process.env.PIYO_PLAYWRIGHT || '/opt/node-tools/node_modules/playwright',game:path.join(ROOT,'ramen.html'),strategy:null};
  const names={'--style':'styles','--seeds':'seeds','--width':'width','--height':'height','--parallel':'parallel','--max-steps':'maxSteps','--error-rate':'errorRate','--timeout':'timeout','--output':'output','--chromium':'chromium','--playwright':'playwright','--game':'game','--strategy':'strategy'};
  for(let i=0;i<argv.length;i++) {
    if(argv[i]==='--help') return {help:true};
    const k=names[argv[i]],v=argv[++i]; if(!k || v==null) throw new Error('引数が不正：'+argv[i-1]);
    o[k]=k==='styles'?v.split(','):k==='seeds'?seedList(v):['width','height','parallel','maxSteps','errorRate','timeout','strategy'].includes(k)?Number(v):v;
  }
  if(o.styles.some(s=>!STYLES.includes(s)) || !o.styles.length) throw new Error('style が不正');
  o.styles=[...new Set(o.styles)];
  for(const k of ['width','height','parallel','maxSteps','timeout'])if(!Number.isInteger(o[k])||o[k]<1)throw new Error(k+' が不正');
  if(o.parallel>32 || o.errorRate<0 || o.errorRate>1 || !Number.isFinite(o.errorRate) || (o.strategy!=null && ![0,1,2].includes(o.strategy)))throw new Error('並列数・誤答率・方針が不正');
  o.output=path.resolve(o.output || `work/bot-runs-${o.width}.jsonl`); o.game=path.resolve(o.game);
  return o;
}
function sourceHash(game) {
  const root=path.dirname(game), files=new Set([game,__filename,path.join(__dirname,'auto.js'),path.join(__dirname,'harness.js')]);
  const html=fs.readFileSync(game,'utf8');
  for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g))if(!/^(https?:|data:)/.test(m[1]))files.add(path.resolve(root,m[1]));
  return sha([...files].sort().map(f=>`${path.relative(root,f)}\0${sha(fs.readFileSync(f))}`).join('\n'));
}
// Claude承認：開始前にseedのみをv4保存へ置く。進行状態は一切書かない。
function initialSave(seed) { return {v:4,meta:{examLog:[],growth:[],runs:[],scopeMet:{},examDate:null},slots:[{id:'s1',label:'',savedAt:0,run:{seed}},{id:'s2',label:'',savedAt:0,run:null},{id:'s3',label:'',savedAt:0,run:null}],cur:'s1'}; }
function readRows(file) {
  if(!fs.existsSync(file))return [];
  const txt=fs.readFileSync(file,'utf8'); let complete=txt;
  if(txt && !txt.endsWith('\n')) {
    const at=txt.lastIndexOf('\n')+1,tail=txt.slice(at);
    try { JSON.parse(tail); fs.appendFileSync(file,'\n'); }
    catch { fs.writeFileSync(file+'.partial',tail); fs.truncateSync(file,Buffer.byteLength(txt.slice(0,at))); complete=txt.slice(0,at); console.error('中断された末尾を .partial に保存し、最後の完成行から再開'); }
  }
  return complete.split('\n').filter(Boolean).map((line,i)=>{try{return JSON.parse(line);}catch{throw new Error(`${file}:${i+1} のJSONが壊れている`);}});
}
async function serve(game) {
  const root=path.dirname(game);
  const server=http.createServer((req,res)=>{
    let f; try { f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)); } catch { res.writeHead(400);res.end();return; }
    if(!f.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    try { const data=fs.readFileSync(f); res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(data); }catch{res.writeHead(404);res.end();}
  });
  await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {server,origin:`http://127.0.0.1:${server.address().port}`};
}
async function one(browser,origin,o,job,configHash,actionsDir) {
  const started=performance.now(), {seed,style}=job, strategy=o.strategy==null?Math.floor(seed/3)%3:o.strategy;
  const runKey=`${configHash}:${style}:${seed}:${strategy}`;
  const ctx=await browser.newContext({viewport:{width:o.width,height:o.height},hasTouch:o.width<1024,isMobile:o.width<900,deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  const errors=[], warnings=[], actions=[], overflow=new Set(); let outcome={}, observed=null, init=false, progressStuck=false, page, diagnostic=null, steps=0, everDeadEnd=false;
  try {
    await ctx.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
    await ctx.addInitScript(({save})=>{localStorage.setItem('boki2sim.v4',JSON.stringify(save));},{save:initialSave(seed)});
    const p=await ctx.newPage(); page=p; p.setDefaultTimeout(o.timeout);
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='warning')warnings.push(m.text());});
    await p.goto(origin+'/'+path.basename(o.game));
    init=await p.evaluate(seed=>{const s=window.__sim.S,st=window.BOKI.store;return s.seed===seed && st.v4.isV4(window.__sim.doc) && st.status().error==='' && s.mi===0 && s.ei===0 && !s.W && !s.L.length && !s.T.length && Object.keys(s.decisions).length===0;},seed);
    if(!init)throw new Error('seedだけのv4初期化検査に失敗');
    let last='',same=0;
    outcome=await autoRun(p,{style,seed,strategy,errorRate:o.errorRate,maxSteps:o.maxSteps,endMode:'slice',onAction:async a=>{actions.push(a); if(a.sel==='[data-plan-ok]'||a.sel==='[data-plan-same]') everDeadEnd ||= await p.evaluate(()=>window.SIMDATA.world.rescueFails(JSON.parse(JSON.stringify(window.__sim.S.W)),3));},onStep:async n=>{
      steps=n;
      const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1?`${window.__sim.S.mi}:${window.__sim.S.ei}`:null);if(ov)overflow.add(ov);
      const sig=await p.evaluate(()=>`${window.__sim.S.mi}:${window.__sim.S.ei}:`+document.querySelector('#sim').innerText);
      same=sig===last?same+1:0;last=sig;
      if(same>=12){progressStuck=true;throw new Error('同じ画面で12回進まなかった');}
    }});
  } catch(e) { diagnostic=e.stack; errors.push(e.message.split('\n')[0]); outcome={...outcome,stuck:progressStuck?'同じ画面':'操作またはページの失敗'}; }
  finally {
    try { if(page) {
      observed=await page.evaluate(()=>{
      const S=window.__sim.S,D=window.SIMDATA,W=S.W;
      const months=Array.from({length:12},(_,t)=>({t,month:D.rview.MON[t],operatingProfit:S.res?.[t]?.op ?? null}));
      const first=months.find(x=>x.operatingProfit>0), b=window.__sim.balances(S.L);
      // 救済判定は世界の複製で実行し、プレイヤーの状態を動かさない。
      const deadEnd=W?D.world.rescueFails(JSON.parse(JSON.stringify(W)),3):null;
      const lastMonth=D.months[S.mi];
      return {gameSeed:S.seed,bankrupt:!!W?.bankrupt,deadEnd,monthly:months,firstBlackMonth:first?.month ?? null,
        nextAprilAccount:lastMonth?.m===4 && lastMonth?.ramenT==null ? ((b['普通預金']||0)+(b['現金']||0)):null,
        finalWorldAccount:W?.cash ?? null,choices:S.choices||[],decisions:S.decisions||{},reached:{mi:S.mi,ei:S.ei,label:lastMonth?.label},f4:S.f4||[]};
    });
    } } catch(e) { errors.push('最終状態の取得失敗：'+e.message.split('\n')[0]); }
    await ctx.close();
  }

  // 時刻入りの保存情報はゲーム結果ではない。choicesの t が暦/月ならそのまま保持する。
  const result={schema:1,runKey,configHash,seed,style,strategy,width:o.width,height:o.height,errorRate:o.errorRate,initialSaveValid:init,warnings,
    ...observed,deadEnd:everDeadEnd || observed?.deadEnd || false,stuck:!!(outcome.stuck||outcome.maxed),ended:!!outcome.end,steps:outcome.steps??steps,errors,overflow:[...new Set([...overflow,...(outcome.overflow||[])])],
    selectedHands:actions.filter(a=>['plan','bowl','decision'].includes(a.kind) && !/data-yes|data-plan-ok|data-plan-same|data-bowl-ok|data-bowl-tweak/.test(a.sel)).length,
    actionCounts:Object.fromEntries(['plan','bowl','decision','report','debrief','fork'].map(k=>[k,actions.filter(a=>a.kind===k).length]))};
  fs.writeFileSync(path.join(actionsDir,`${style}-${seed}-${strategy}.jsonl`),actions.map(x=>JSON.stringify(x)).join('\n')+'\n');
  return {result,timing:{runKey,diagnostic,seconds:(performance.now()-started)/1000,at:new Date().toISOString(),chromium:o.chromium,parallel:o.parallel}};
}
function summary(rows,times,parallel) {
  const median=xs=>{const a=xs.filter(x=>x!=null).sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null;};
  const groups=STYLES.map(style=>{
    const a=rows.filter(r=>r.style===style);if(!a.length)return null;
    const distribution={};for(const r of a){const k=r.firstBlackMonth==null?'なし/未到達':String(r.firstBlackMonth);distribution[k]=(distribution[k]||0)+1;}
    return {style,runs:a.length,bankrupt:a.filter(r=>r.bankrupt).length,deadEnd:a.filter(r=>r.deadEnd).length,stuck:a.filter(r=>r.stuck).length,errorRuns:a.filter(r=>r.errors.length).length,overflowRuns:a.filter(r=>r.overflow.length).length,firstBlackMonth:distribution,nextAprilAccountMedian:median(a.map(r=>r.nextAprilAccount))};
  }).filter(Boolean);
  const keys=new Set(rows.map(r=>r.runKey)), measured=[...new Map(times.filter(t=>keys.has(t.runKey)).map(t=>[t.runKey,t])).values()],avg=measured.length?measured.reduce((s,t)=>s+t.seconds,0)/measured.length:null;
  return {groups,meanSeconds:avg,estimated3000Seconds:avg==null?null:avg*3000/parallel};
}
async function main(argv) {
  const o=args(argv);if(o.help){console.log('node bot-runs.js --style idle,random,skilled --seeds 0-29 --width 1280 [--parallel 4 --output work/bots.jsonl --error-rate 0 --strategy 0 --chromium PATH --playwright MODULE]');return;}
  fs.mkdirSync(path.dirname(o.output),{recursive:true});
  const lock=o.output+'.lock';let fd;
  try {fd=fs.openSync(lock,'wx');}catch(e){throw new Error(`同じ出力を別プロセスが使用中。停止済みなら ${lock} を確認して除去：${e.code}`);}
  fs.writeFileSync(fd,String(process.pid));
  let browser,server,stop=false;
  const signal=()=>{stop=true;console.error('実行中の周を保存してから停止します');};process.on('SIGINT',signal);process.on('SIGTERM',signal);
  try {
    const configHash=sha(JSON.stringify({source:sourceHash(o.game),width:o.width,height:o.height,errorRate:o.errorRate,maxSteps:o.maxSteps,strategy:o.strategy}));
    const rows=readRows(o.output),times=readRows(o.output+'.timing.jsonl');
    if(rows.some(r=>r.configHash!==configHash))throw new Error('コードまたは条件が違う出力には再開できない。別の --output を指定する');
    const done=new Set();for(const r of rows){if(done.has(r.runKey))throw new Error('出力に重複したrunKey');done.add(r.runKey);}
    const jobs=o.styles.flatMap(style=>o.seeds.map(seed=>({style,seed}))).filter(j=>!done.has(`${configHash}:${j.style}:${j.seed}:${o.strategy==null?Math.floor(j.seed/3)%3:o.strategy}`));
    const actionsDir=o.output+'.actions';fs.mkdirSync(actionsDir,{recursive:true});
    if(jobs.length){
      const hosting=await serve(o.game);server=hosting.server;
      browser=await loadChromium(o.playwright).launch({executablePath:o.chromium,headless:true});
      let next=0;
      await Promise.all(Array.from({length:Math.min(o.parallel,jobs.length)},async()=>{
        while(!stop && next<jobs.length){const job=jobs[next++];const {result,timing}=await one(browser,hosting.origin,o,job,configHash,actionsDir);
          // 計測を先に保存。途中停止で結果がなければ、その周は再実行する。
          fs.appendFileSync(o.output+'.timing.jsonl',JSON.stringify(timing)+'\n');
          fs.appendFileSync(o.output,JSON.stringify(result)+'\n');rows.push(result);times.push(timing);
          console.log(JSON.stringify(result));
        }
      }));
    }
    const requested=rows.filter(r=>o.styles.includes(r.style)&&o.seeds.includes(r.seed));
    const report=summary(requested,times,o.parallel);fs.writeFileSync(o.output+'.summary.json',JSON.stringify(report,null,2)+'\n');console.error(JSON.stringify(report,null,2));
    if(stop)process.exitCode=130;
    else if(requested.some(r=>r.stuck||r.errors.length||!r.ended||!r.initialSaveValid))process.exitCode=1;
  }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.closeSync(fd);fs.unlinkSync(lock);process.off('SIGINT',signal);process.off('SIGTERM',signal);}
}
module.exports={loadChromium,browserPath,seedList,initialSave,readRows,summary,sourceHash,main};
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error(e.stack);process.exitCode=1;});
