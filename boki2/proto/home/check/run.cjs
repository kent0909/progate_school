// 実行: node boki2/proto/home/check/run.cjs
// 検査専用。Playwright は実行環境にインストールしたものを利用。本体に依存を足さない。
const {chromium} = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname,'..');
const results={measurements:[],runs:[],extra:[]};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try {const target=fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));}
  catch {res.writeHead(404).end();}
});
function currentSession(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('boki2.proto.home.v1')).sessions.at(-1));}
async function measure(page,variant,width,height,phase){
  const row=await page.evaluate((variant)=>{
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect();
    const visible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
    const textEls=[...document.querySelectorAll('body *')].filter(el=>visible(el)&&[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const targets=[...document.querySelectorAll('button,a,textarea,select,input')].filter(visible).map(el=>{const r=el.getBoundingClientRect();return {label:el.textContent.trim().slice(0,30),width:r.width,height:r.height};});
    return {cardTop:rect('[data-next-doc]').top,stageHeight:rect('.stage').height,metricsHeight:variant==='d'?rect('.metrics').bottom:(rect('.metrics')?.height||0),
      minFont:Math.min(...textEls.map(el=>parseFloat(getComputedStyle(el).fontSize))),minTargetWidth:Math.min(...targets.map(t=>t.width)),minTargetHeight:Math.min(...targets.map(t=>t.height)),
      horizontalOverflow:document.documentElement.scrollWidth>innerWidth, targets};
  },variant);
  assert(row.minFont>=14,JSON.stringify(row));assert(row.minTargetWidth>=44,JSON.stringify(row));assert(row.minTargetHeight>=44,JSON.stringify(row));assert(!row.horizontalOverflow,JSON.stringify(row));
  const {targets,...metrics}=row;
  results.measurements.push({variant,width,height,phase,...metrics,dWithin211:variant==='d'?row.metricsHeight<=211:null});
}
async function measureDialog(page, selector = '#dialog') {
  const row=await page.locator(selector).evaluate(dialog=>{
    const visible=el=>el.getClientRects().length>0;
    const elements=[...dialog.querySelectorAll('*')].filter(visible);
    const fonts=elements.filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(el=>parseFloat(getComputedStyle(el).fontSize));
    const buttons=elements.filter(el=>el.matches('button,textarea')).map(el=>el.getBoundingClientRect());
    return {font:Math.min(...fonts),width:Math.min(...buttons.map(r=>r.width)),height:Math.min(...buttons.map(r=>r.height))};
  });
  assert(row.font>=14&&row.width>=44&&row.height>=44,JSON.stringify(row));
}
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    for(const viewport of [{width:390,height:844},{width:1280,height:800}]) for(const variant of ['a','b1','b2','c','d']) for(const choice of ['flyer','skip']) {
      const context=await browser.newContext({viewport,acceptDownloads:true});
      const page=await context.newPage();const errors=[],external=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
      page.on('request',r=>{if(!r.url().startsWith(origin)) external.push(r.url());});
      await page.goto(`${origin}/index.html?v=${variant}&lock=1`);
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.locator('#variants').isVisible(),false);
      if(choice==='flyer') {
        await measure(page,variant,viewport.width,viewport.height,'start');
        await page.screenshot({path:path.join(__dirname,`${variant}-${viewport.width}-start.png`)});
      }
      // 数と線は実際のボタンを押して記録。a には押す対象がない。
      if(variant==='b1'||variant==='b2') await page.locator('[data-action=outlook]').click();
      if(variant==='c') await page.locator('[data-action=sales]').click();
      if(variant==='d') await page.locator('[data-action=account]').click();
      if(variant!=='a') {await measureDialog(page);await page.locator('[data-action=back]').click();}
      const forecasts=[];
      for(let i=0;i<6;i++) {
        forecasts.push(await page.locator('.metrics').textContent());
        // 舞台の人物からも同じ書類へ行ける。
        await page.locator(i===0?'[data-action=document].visitor':'[data-next-doc]').click();
        assert.equal(await page.locator('.journal').count(),1);await measureDialog(page);
        await page.locator('[data-action=post]').click();
        if(i===2){assert.equal(await page.locator('#dialog').isVisible(),false);await measureDialog(page,'.decision');await page.locator(`.decision [data-action=${choice}]`).click();}
        if(i===3){await page.reload();assert.equal((await currentSession(page)).posted,4);}
      }
      await page.locator('[data-next-doc]').click();
      // 問いの間、ホームの数を見られないことを dialog の modal 状態で確認。
      assert(await page.locator('#dialog').evaluate(el=>el.matches(':modal')));
      assert.match(await page.locator('#dialog').textContent(),/口座のお金/);await measureDialog(page);
      await page.keyboard.press('Escape');assert(await page.locator('#dialog').isVisible());
      await page.locator('[data-answer="2920000"]').click();
      await page.locator(`[data-answer="${choice==='flyer'?96945000:96925000}"]`).click();
      const session=await currentSession(page);
      assert.equal(session.posted,6);assert.equal(session.decision,choice);assert.equal(session.phase,'done');assert.equal(session.answers.length,2);assert(session.answers.every(a=>a.correct));assert(session.elapsedMs>=0);
      assert.equal(session.events.filter(e=>e.type==='decision').length,1);
      assert.equal(session.events.filter(e=>e.type==='posted').length,6);
      assert.equal(session.numberClicks,['c','d'].includes(variant)?1:0);assert.equal(session.lineClicks,['b1','b2'].includes(variant)?1:0);
      if(variant==='b1') {assert.match(forecasts[0],/203年目の4月/);assert.match(await page.locator('.metrics').textContent(),/このペースでは届かない/);assert.notEqual(forecasts[0],forecasts[1]);}
      if(variant==='b2') {assert.match(forecasts[0],/814,286円/);assert.notEqual(forecasts[0],forecasts[1]);assert.match(await page.locator('.metrics').textContent(),choice==='flyer'?/814,664円/:/814,496円/);}
      if(variant==='c') {assert.match(await page.locator('.metrics').textContent(),/210,000円/);assert.match(await page.locator('.metrics').textContent(),choice==='flyer'?/3,055,000円/:/3,075,000円/);}
      if(choice==='flyer') {
        await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(510);
        await measure(page,variant,viewport.width,viewport.height,'end');
        await page.screenshot({path:path.join(__dirname,`${variant}-${viewport.width}-end.png`)});
      }
      await page.locator('#export').click();await measureDialog(page);
      const exported=JSON.parse(await page.locator('#export-json').inputValue());
      assert.deepEqual(exported.sessions[0].answers,session.answers);
      const downloadPromise=page.waitForEvent('download');await page.locator('[data-action=download]').click();const download=await downloadPromise;
      assert.match(download.suggestedFilename(),/\.json$/);
      const downloadPath=await download.path();assert.equal(JSON.parse(fs.readFileSync(downloadPath,'utf8')).sessions[0].id,session.id);
      if(choice==='flyer') fs.writeFileSync(path.join(__dirname,`record-${variant}-${viewport.width}.json`),JSON.stringify(exported,null,2)+'\n');
      await page.locator('[data-action=back]').click();
      await page.reload();assert.equal((await currentSession(page)).phase,'done');
      assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
      results.runs.push({variant,...viewport,choice,posted:session.posted,answers:session.answers.map(a=>a.correct),numberClicks:session.numberClicks,lineClicks:session.lineClicks,homeOpens:session.homeOpens,elapsedMs:session.elapsedMs,externalRequests:external.length,errors:errors.length,result:'PASS'});
      await context.close();
    }
    // reduced-motion、ロック解除の切り替え、保存不能、再開、問いのESC、既存記録の保持。
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();
    await page.goto(`${origin}/?v=b1`);
    assert.equal(await page.locator('#variants a').count(),5);assert(await page.locator('#variants').isVisible());
    assert.equal(await page.locator('.progress-track i').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await page.locator('[data-action=document].visitor').click();await page.locator('[data-action=post]').click();
    await page.locator('#restart').click();await page.locator('[data-action=confirm-restart]').click();
    let sessions=await page.evaluate(()=>JSON.parse(localStorage.getItem('boki2.proto.home.v1')).sessions);assert.equal(sessions.length,2);assert(sessions[0].archived);assert.equal(sessions[1].posted,0);
    await page.locator('#variants a').last().click();assert.match(page.url(),/v=d/);
    await page.evaluate(()=>{localStorage.setItem('boki2.proto.home.v1','broken json');});await page.reload();assert.equal((await currentSession(page)).posted,0);
    await page.goto(`${origin}/?v=a&lock=1`);
    for(let i=0;i<6;i++) {await page.locator('[data-next-doc]').click();await page.locator('[data-action=post]').click();if(i===2) await page.locator('.decision [data-action=skip]').click();}
    await page.locator('[data-next-doc]').click();await page.locator('[data-answer]').first().click();await page.reload();
    assert.match(await page.locator('#dialog').textContent(),/1億まで/);await page.locator('[data-answer]').first().click();
    const wrongSession=await currentSession(page);assert.equal(wrongSession.phase,'done');assert.equal(wrongSession.answers[0].correct,false);assert.equal(wrongSession.answers[1].correct,false);
    await context.close();results.extra.push('reduced-motion / switch / restart-preserves-records / invalid-storage / quiz-resume / incorrect-answers: PASS');
    const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});const blockedPage=await blocked.newPage();await blockedPage.goto(`${origin}/?v=a&lock=1`);assert.match(await blockedPage.locator('#storage-status').textContent(),/保存できません/);await blockedPage.locator('#export').click();assert.equal(JSON.parse(await blockedPage.locator('#export-json').inputValue()).sessions.length,1);await blocked.close();results.extra.push('storage-unavailable-export: PASS');
  } finally {await browser.close();server.close();}
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2)+'\n');
  const header='|幅×高さ|版|時点|札の上端px|絵の高さpx|数・帯の高さpx|d≦211px|最小字px|最小押下幅×高さpx|';
  const table=[header,'|---|---|---|---:|---:|---:|---|---:|---|',...results.measurements.map(r=>`|${r.width}×${r.height}|${r.variant}|${r.phase}|${r.cardTop.toFixed(2)}|${r.stageHeight.toFixed(2)}|${r.metricsHeight.toFixed(2)}|${r.dWithin211===null?'—':r.dWithin211?'はい':'いいえ'}|${r.minFont}|${r.minTargetWidth.toFixed(2)}×${r.minTargetHeight.toFixed(2)}|`)].join('\n');
  fs.writeFileSync(path.join(__dirname,'measurements.md'),table+'\n');
  const gallery='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ホーム比較の画面写真</title><style>body{font:16px/1.6 system-ui;background:#f6f0e6;color:#332d26;margin:24px}section{margin:32px 0}figure{display:inline-block;vertical-align:top;margin:8px;max-width:46%}img{max-width:100%;height:auto;border:1px solid #d8cdbc}a{color:#ac4228}</style><h1>ホーム比較の画面写真</h1><p>同じ1か月・チラシを打つ場合。各版の月初と月末（回答後）。<a href="measurements.md">実測表</a></p>'+[390,1280].map(width=>'<section><h2>'+width+'px</h2>'+['a','b1','b2','c','d'].map(v=>'<h3>'+v+'</h3>'+['start','end'].map(phase=>'<figure><figcaption>'+ (phase==='start'?'月初':'月末')+'</figcaption><a href="'+v+'-'+width+'-'+phase+'.png"><img loading="lazy" src="'+v+'-'+width+'-'+phase+'.png" alt="'+v+' '+width+'px '+phase+'"></a></figure>').join('')).join('')+'</section>').join('')+'</html>';
  fs.writeFileSync(path.join(__dirname,'index.html'),gallery);
  console.log(table);console.log(`PASS: ${results.runs.length}/20 完走、画面写真20枚、実測20行、JSON書き出し20/20、外部通信0、ブラウザエラー0`);console.log(results.extra.join('\n'));
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
