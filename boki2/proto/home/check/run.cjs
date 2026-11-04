// node boki2/proto/home/check/run.cjs（検査だけPlaywright・Chromiumを使う）
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),variants=['a','b1','b2','c','d','e'];
const results={measurements:[],runs:[],extra:[]};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const target=fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));}
  catch{res.writeHead(404).end();}
});
const yen=n=>`${n.toLocaleString('ja-JP')}円`;
const signed=n=>`${n>=0?'＋':'−'}${yen(Math.abs(n))}`;
const current=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('boki2.proto.home.v1')).sessions.at(-1));
async function measure(page,variant,stale,viewport,phase){
  const row=await page.evaluate(v=>{
    const rect=s=>document.querySelector(s)?.getBoundingClientRect();
    const visible=el=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
    const elements=[...document.querySelectorAll('body *')].filter(visible);
    const text=elements.filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const targets=elements.filter(el=>el.matches('button,a,textarea,select,input')).map(el=>el.getBoundingClientRect());
    return {cardTop:rect('[data-next-doc]').top,stageHeight:rect('.stage').height,metricsHeight:v==='d'?rect('.metrics').bottom:(rect('.metrics')?.height||0),
      minFont:Math.min(...text.map(el=>parseFloat(getComputedStyle(el).fontSize))),minTargetWidth:Math.min(...targets.map(r=>r.width)),minTargetHeight:Math.min(...targets.map(r=>r.height)),horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
  },variant);
  assert(row.minFont>=14&&row.minTargetWidth>=44&&row.minTargetHeight>=44&&!row.horizontalOverflow,JSON.stringify({variant,stale,...row}));
  results.measurements.push({variant,stale,...viewport,phase,...row,dWithin211:variant==='d'?row.metricsHeight<=211:null});
}
async function measureControls(page,selector='#dialog'){
  const r=await page.locator(selector).evaluate(container=>{
    const els=[...container.querySelectorAll('*')].filter(el=>el.getClientRects().length);
    const fonts=els.filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(el=>parseFloat(getComputedStyle(el).fontSize));
    const targets=els.filter(el=>el.matches('button,textarea')).map(el=>el.getBoundingClientRect());
    return {font:Math.min(...fonts),width:Math.min(...targets.map(r=>r.width)),height:Math.min(...targets.map(r=>r.height))};
  });
  assert(r.font>=14&&r.width>=44&&r.height>=44,JSON.stringify(r));
}
async function numbers(page,v,posted,flyer){
  // 更新された仕様3章の検算の値。UI・modelの実装からは取らない。
  const cash=[100000,220000,220000,220000,160000,160000,155000][posted]-(flyer?20000:0);
  const bank=posted<3?3000000:2920000,money=bank+cash;
  const sales=[0,120000,120000,120000,120000,210000,210000][posted];
  const profit=[0,120000,80000,0,-60000,30000,30000][posted]-(flyer?20000:0);
  if(v==='c'){
    assert.equal(await page.locator('[data-action=sales] .big-number').textContent(),yen(sales));
    assert.equal(await page.locator('[data-action=profit] .big-number').textContent(),yen(profit));
    assert.equal(await page.locator('.cash-change').textContent(),`お金の増え ${signed(money-3100000)}`);
  }
  if(v==='d'){
    assert.equal(await page.locator('[data-action=account] .big-number').textContent(),yen(bank));
    assert.equal(await page.locator('[data-action=net] .big-number').textContent(),yen(money));
    assert.equal(await page.locator('[data-action=loan] .big-number').textContent(),'0円');
  }
  if(v==='e')assert.equal(await page.locator('.money-number').textContent(),yen(money));
  if(v==='b1'||v==='b2'){
    const width=await page.locator('.progress-track i').evaluate(el=>parseFloat(el.style.width));
    assert(Math.abs(width/100-money/100000000)<1e-8);
    if(v==='b2')assert.match(await page.locator('.forecast').textContent(),new RegExp(yen(Math.ceil((100000000-money)/119)).replace(/,/g,',')));
  }
}
async function stamp(page,v,mode,pending,book,currentDay){
  const active=mode===1&&pending>0;
  assert.equal(await page.locator('[data-stale]').count(),active?1:0);
  if(active){
    const el=page.locator('[data-stale]');assert.equal(await el.getAttribute('data-pending'),String(pending));
    assert.equal(await el.getAttribute('data-book-date'),book);
    const text=await el.textContent();assert.match(text,new RegExp(`まだの書類 ${pending}枚`));
    if(v==='a')assert.equal(text,`まだの書類 ${pending}枚`);
    else{const [month,day]=book.split('-');assert.match(text,new RegExp(`${month}月${day}日の帳簿まで`));}
  }
  if(v!=='a')for(const opacity of await page.locator('.metrics > button:not(.stale-stamp)').evaluateAll(els=>els.map(el=>getComputedStyle(el).opacity)))assert.equal(opacity,active?'0.5':'1');
  if(v==='e')assert.equal(await page.locator('.date-badge').textContent(),`1年目 5月${currentDay}日`);
}
async function post(page){await page.locator('[data-next-doc]').click();await measureControls(page);await page.locator('[data-action=post]').click();}
async function quiz(page,choice){
  await page.locator('[data-next-doc]').click();
  assert(await page.locator('#dialog').evaluate(el=>el.matches(':modal')));
  assert.equal(await page.locator('#home').isVisible(),false);assert.equal(await page.locator('.stage').isVisible(),false);assert.equal(await page.locator('.metrics').isVisible(),false);
  assert.equal(await page.locator('#dialog').evaluate(el=>getComputedStyle(el,'::backdrop').backgroundColor),'rgb(246, 240, 230)');
  await measureControls(page);await page.keyboard.press('Escape');assert(await page.locator('#dialog').isVisible());
  await page.locator('[data-answer="2920000"]').click();assert.equal(await page.locator('#home').isVisible(),false);
  await page.locator(`[data-answer="${choice==='flyer'?96945000:96925000}"]`).click();assert.equal(await page.locator('#home').isVisible(),true);
}
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
  const patterns=[/type\s*=\s*["']module/i,/\b(import|export)\s/,/\bimport\s*\(/,/\bfetch\s*\(/];
  const checkedFiles=['index.html','model.js','scenario.js','home.js'];
  for(const file of checkedFiles){const source=fs.readFileSync(path.join(root,file),'utf8');for(const pattern of patterns)assert(!pattern.test(source),file+': '+pattern);}
  results.staticFileCheck={files:checkedFiles,esModulesAndFetchMatches:0};results.extra.push('static file compatibility: type=module / import / export / fetch matches 0: PASS');
  const {quizChoices}=require('../model.js');const positions=new Set();
  for(let i=0;i<128;i++){const seed=`session-${i}:account`,options=quizChoices(2920000,seed);assert.deepEqual(options,quizChoices(2920000,seed));assert.equal(new Set(options).size,4);positions.add(options.indexOf(2920000));}
  assert.equal(positions.size,4);results.extra.push('seeded-quiz: 128 seeds deterministic, all 4 answer positions reached: PASS');
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    for(const viewport of [{width:390,height:844},{width:1280,height:800}])for(const v of variants)for(const mode of [0,1])for(const choice of ['flyer','skip']){
      const context=await browser.newContext({viewport,acceptDownloads:true}),page=await context.newPage(),errors=[],external=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
      await page.goto(`${origin}/index.html?v=${v}&stale=${mode}&lock=1`);assert.equal(await page.locator('#variants').isVisible(),false);assert.equal(await page.locator('#stale-options').isVisible(),false);
      await numbers(page,v,0,false);await stamp(page,v,mode,mode?2:1,'4-30',7);
      if(choice==='flyer'){
        await page.mouse.move(0,0);await measure(page,v,mode,viewport,'start');
        await page.screenshot({path:path.join(__dirname,`${v}-${viewport.width}-${mode?'stale':'start'}.png`)});
      }
      if(mode){
        await page.waitForTimeout(100);await page.evaluate(()=>dispatchEvent(new Event('scroll')));
        assert((await current(page)).staleVisibleMs>0);
        await page.locator('[data-stale]').click();const before=(await current(page)).staleVisibleMs;await page.waitForTimeout(100);assert.equal((await current(page)).staleVisibleMs,before);await measureControls(page);await page.locator('[data-action=back]').click();
      }
      const action={b1:'outlook',b2:'outlook',c:'sales',d:'account',e:'money'}[v];
      if(action){await page.locator(`[data-action=${action}]`).click();await measureControls(page);await page.locator('[data-action=back]').click();}
      for(let i=0;i<6;i++){
        if(i===0){await page.locator('.visitor').click();await measureControls(page);await page.locator('[data-action=post]').click();}else await post(page);
        const posted=i+1,flyer=choice==='flyer'&&posted>3;
        await numbers(page,v,posted,flyer);
        const book=posted===0?'4-30':posted<=2?'5-7':posted<=4?'5-14':'5-21';
        const pending=mode?(posted%2?1:0):(posted<6?1:0);
        const day=posted===6?31:mode?(posted<=2?7:posted<=4?14:21):(posted<2?7:posted<4?14:21);
        await stamp(page,v,mode,pending,book,day);
        if(i===2){await measureControls(page,'.decision');await page.locator(`.decision [data-action=${choice}]`).click();await numbers(page,v,posted,choice==='flyer');}
        if(i===3){await page.reload();assert.equal((await current(page)).posted,4);await stamp(page,v,mode,pending,book,day);}
        if(mode&&(posted===2||posted===4)){
          assert.equal(await page.locator('[data-stale]').count(),0);assert.match(await page.locator('[data-next-doc]').textContent(),new RegExp(`5月${posted===2?14:21}日へ進む`));
          await page.locator('[data-action=advance]').click();await stamp(page,v,mode,2,book,posted===2?14:21);await numbers(page,v,posted,choice==='flyer'&&posted>=3);
        }
      }
      if(v==='b1')assert.match(await page.locator('.forecast').textContent(),/このペースでは届かない/);
      await quiz(page,choice);
      const session=await current(page);
      assert.equal(session.posted,6);assert.equal(session.stale,mode);assert.equal(session.phase,'done');assert.equal(session.decision,choice);assert(session.elapsedMs>=0);
      assert.equal(session.quizOrder.length,2);assert(session.answers.every(a=>a.correct));assert(session.quizOrder.every(o=>new Set(o.choices).size===4));
      assert.equal(session.events.filter(e=>e.type==='posted').length,6);assert.equal(session.events.filter(e=>e.type==='decision').length,1);
      assert.equal(session.numberClicks,['c','d','e'].includes(v)?1:0);assert.equal(session.lineClicks,['b1','b2'].includes(v)?1:0);
      assert.equal(session.stampClicks,mode);assert.equal(session.staleHomeOpens,session.events.filter(e=>e.type==='home'&&e.staleVisible).length);
      if(mode){assert(session.staleVisibleMs>0&&session.staleHomeOpens>0);assert.equal(session.batchTimings.length,3);assert.equal(session.events.filter(e=>e.type==='advance').length,2);assert(session.batchTimings.slice(0,2).every(b=>b.elapsedUntilAdvanceMs>=0&&b.clearToAdvanceMs>=0&&b.clearedAt&&b.advancedAt));}
      else{assert.equal(session.staleVisibleMs,0);assert.equal(session.staleHomeOpens,0);}
      if(choice==='flyer'){
        await page.evaluate(()=>scrollTo(0,0));await page.mouse.move(0,0);await page.waitForTimeout(510);await measure(page,v,mode,viewport,'end');
        if(!mode)await page.screenshot({path:path.join(__dirname,`${v}-${viewport.width}-end.png`)});
      }
      await page.locator('#export').click();await measureControls(page);const exported=JSON.parse(await page.locator('#export-json').inputValue());
      assert.deepEqual(exported.sessions[0].answers,session.answers);assert.deepEqual(exported.sessions[0].quizOrder,session.quizOrder);assert.equal(exported.sessions[0].stampClicks,mode);
      const downloadPromise=page.waitForEvent('download');await page.locator('[data-action=download]').click();const download=await downloadPromise;assert.equal(JSON.parse(fs.readFileSync(await download.path(),'utf8')).sessions[0].id,session.id);
      if(choice==='flyer')fs.writeFileSync(path.join(__dirname,`record-${v}-${viewport.width}${mode?'-stale':''}.json`),JSON.stringify(exported,null,2)+'\n');
      await page.locator('[data-action=back]').click();await page.reload();assert.equal((await current(page)).phase,'done');
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
      results.runs.push({variant:v,stale:mode,...viewport,choice,posted:6,answers:session.answers.map(a=>a.correct),homeOpens:session.homeOpens,numberClicks:session.numberClicks,lineClicks:session.lineClicks,stampClicks:session.stampClicks,staleVisibleMs:session.staleVisibleMs,staleHomeOpens:session.staleHomeOpens,batchTimings:session.batchTimings,externalRequests:0,errors:0,result:'PASS'});
      await context.close();
    }
    // 環境が許す場合だけファイルを開く。管理ポリシーの拒否は理由を記録して引き継ぐ。
    const fileExecutable=process.env.FILE_CHROMIUM_PATH||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':null);
    const fileBrowser=fileExecutable?await chromium.launch({executablePath:fileExecutable,headless:true,args:['--no-sandbox']}):browser;
    let localContext;
    try {
      localContext=await fileBrowser.newContext({viewport:{width:390,height:844}});
      const localPage=await localContext.newPage(),localErrors=[];
      localPage.on('pageerror',e=>localErrors.push(e.message));localPage.on('console',m=>{if(m.type()==='error')localErrors.push(m.text());});
      const fileUrl=require('node:url').pathToFileURL(path.join(root,'index.html')).href;
      await localPage.goto(fileUrl+'?v=e&stale=1&lock=1');
      assert(await localPage.locator('[data-next-doc]').isVisible());await stamp(localPage,'e',1,2,'4-30',7);await numbers(localPage,'e',0,false);
      await post(localPage);await post(localPage);assert.equal(await localPage.locator('[data-stale]').count(),0);
      await localPage.locator('[data-action=advance]').click();await stamp(localPage,'e',1,2,'5-7',14);await numbers(localPage,'e',2,false);
      assert.deepEqual(localErrors,[]);
      results.fileCheck={status:'passed',protocol:'file:',variant:'e',stale:1,browserVersion:await fileBrowser.version(),errors:0,nextDocumentVisible:true,postingAndAdvance:true};
      results.extra.push('file:// e stale=1: errors 0, next document visible, posting and advance: PASS');
    } catch(error) {
      if(!String(error.message).includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw error;
      results.fileCheck={status:'skipped',reason:'ERR_BLOCKED_BY_ADMINISTRATOR',alternativePath:'/opt/pw-browsers/chromium',alternativeAvailable:fs.existsSync('/opt/pw-browsers/chromium')};
      results.extra.push('file://: SKIP (ERR_BLOCKED_BY_ADMINISTRATOR; /opt/pw-browsers/chromium unavailable); coordinator verification required');
    } finally {if(localContext)await localContext.close();if(fileBrowser!==browser)await fileBrowser.close();}
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(`${origin}/?v=b1&stale=1`);assert.equal(await page.locator('#variants a').count(),6);assert.equal(await page.locator('#stale-options a').count(),2);
    assert.equal(await page.locator('.progress-track i').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    await post(page);await page.locator('#restart').click();await page.locator('[data-action=confirm-restart]').click();let sessions=await page.evaluate(()=>JSON.parse(localStorage.getItem('boki2.proto.home.v1')).sessions);assert.equal(sessions.length,2);assert(sessions[0].archived);assert.equal(sessions[1].posted,0);
    await page.locator('#variants a').last().click();assert.match(page.url(),/v=e&stale=1/);
    await page.waitForTimeout(100);await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=> 'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    const paused=(await current(page)).staleVisibleMs;await page.waitForTimeout(120);await page.evaluate(()=>dispatchEvent(new Event('scroll')));assert.equal((await current(page)).staleVisibleMs,paused);
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{get:()=> 'visible',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);await page.evaluate(()=>dispatchEvent(new Event('scroll')));assert((await current(page)).staleVisibleMs>paused);
    results.extra.push('stale timer excludes dialog and hidden tab; advance receipt/clear times retained: PASS');
    await page.goto(`${origin}/?v=a&stale=0&lock=1`);
    for(let i=0;i<6;i++){await post(page);if(i===2)await page.locator('.decision [data-action=skip]').click();}
    await page.locator('[data-next-doc]').click();await page.locator('[data-answer]:not([data-answer="2920000"])').first().click();const order=(await current(page)).quizOrder;await page.reload();assert.deepEqual((await current(page)).quizOrder,order);assert.match(await page.locator('#dialog').textContent(),/1億まで/);await page.locator('[data-answer]:not([data-answer="96925000"])').first().click();assert((await current(page)).answers.every(a=>!a.correct));await context.close();
    results.extra.push('reduced-motion / switches / restart-preserves-records / quiz-order-resume / incorrect-answers: PASS');
    const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});const blockedPage=await blocked.newPage();await blockedPage.goto(`${origin}/?v=a&lock=1`);assert.match(await blockedPage.locator('#storage-status').textContent(),/保存できません/);await blockedPage.locator('#export').click();assert.equal(JSON.parse(await blockedPage.locator('#export-json').inputValue()).sessions.length,1);await blocked.close();results.extra.push('storage-unavailable-export: PASS');
  }finally{await browser.close();server.close();}
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(results,null,2)+'\n');
  const table=['|幅×高さ|版|stale|時点|札の上端px|絵の高さpx|数・帯の高さpx|d≦211px|最小字px|最小押下幅×高さpx|','|---|---|---|---|---:|---:|---:|---|---:|---|',...results.measurements.map(r=>`|${r.width}×${r.height}|${r.variant}|${r.stale}|${r.phase}|${r.cardTop.toFixed(2)}|${r.stageHeight.toFixed(2)}|${r.metricsHeight.toFixed(2)}|${r.dWithin211===null?'—':r.dWithin211?'はい':'いいえ'}|${r.minFont}|${r.minTargetWidth.toFixed(2)}×${r.minTargetHeight.toFixed(2)}|`)].join('\n');
  fs.writeFileSync(path.join(__dirname,'measurements.md'),table+'\n');
  const gallery='<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ホーム比較の画面写真</title><style>body{font:16px/1.6 system-ui;background:#f6f0e6;color:#332d26;margin:24px}figure{display:inline-block;vertical-align:top;margin:8px;max-width:30%}img{max-width:100%;height:auto;border:1px solid #d8cdbc}</style><h1>ホーム比較の画面写真36枚</h1><p>全6版の月初・月末（stale=0、チラシあり）と、stale=1の最初の未記帳の印。</p>'+[390,1280].map(width=>'<h2>'+width+'px</h2>'+variants.map(v=>'<h3>'+v+'</h3>'+['start','end','stale'].map(phase=>'<figure><figcaption>'+({start:'月初',end:'月末',stale:'未記帳の印'})[phase]+'</figcaption><a href="'+v+'-'+width+'-'+phase+'.png"><img loading="lazy" src="'+v+'-'+width+'-'+phase+'.png" alt="'+v+' '+width+'px '+phase+'"></a></figure>').join('')).join('')).join('')+'</html>';
  fs.writeFileSync(path.join(__dirname,'index.html'),gallery);
  console.log(table);console.log('PASS: 48/48 完走（6版×stale 0/1×2幅×チラシ2択）、画面写真36枚、実測48行、JSON書き出し48/48、外部通信0、ブラウザエラー0');console.log(results.extra.join('\n'));
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});
