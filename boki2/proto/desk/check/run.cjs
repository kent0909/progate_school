/* 依存は検査用のみ。試作は file:// で開き、ネットワークを全部拒否する。 */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const args=process.argv.slice(2);
function arg(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const modulePath=arg('--playwright',process.env.PIYO_PLAYWRIGHT||'/opt/node-tools/node_modules/playwright');
const executablePath=arg('--chromium',process.env.PIYO_CHROMIUM||'/opt/pw-browsers/chromium');
const {chromium}=require(modulePath);
const root=path.resolve(__dirname,'..');
const out=path.resolve(arg('--output',path.join(__dirname,'results')));
fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const answers=[[['left','現金',10000],['right','借入金',10000]],[['left','備品',5000],['right','現金',5000]],[['left','仕入',30000],['right','現金',10000],['right','買掛金',20000]],[['left','減価償却累計額',50000],['left','現金',60000],['left','固定資産売却損',10000],['right','備品',120000]]];
const wrongAccounts=['売上','消耗品費','売掛金','固定資産売却益'];
const replaceIndices=[1,0,2,2];
const results=[],measurements=[],extras=[];
let browser,server,origin;
async function localServer(){server=require('node:http').createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['index.html','desk.css','desk.js'].includes(name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,name)));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;} 
const money=n=>new Intl.NumberFormat('ja-JP').format(n)+'円';
async function calculate(page){await page.locator('#calc-open').click();await page.locator('[data-calc="C"]').click();for(const k of ['1','2','0','0','0','0','−','5','0','0','0','0','−','6','0','0','0','0','='])await page.locator(`[data-calc="${k}"]`).click();assert.equal(await page.locator('#calculation').textContent(),'10000');await page.locator('#use-result').click();}
async function amount(page,n,tx){if(tx===3&&n===10000)await calculate(page);else await page.locator(`[data-amount="${n}"]`).click();}
async function put(page,[side,account,n],tx){await amount(page,n,tx);await page.locator(`#cards [data-account="${account}"]`).click();await page.locator(`[data-place="${side}"]`).click();}
async function metrics(page,config,viewport,transaction,phase){return page.evaluate(({config,viewport,transaction,phase})=>{
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const els=[...document.querySelectorAll('main *')].filter(visible);
  const text=els.filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
  const controls=els.filter(e=>e.matches('button,select,textarea,[role=button]'));
  const dim=id=>{const e=document.getElementById(id);return visible(e)?Math.round(e.getBoundingClientRect().height*100)/100:0;};
  const confirm=document.getElementById('confirm').getBoundingClientRect();
  return {config,viewport,transaction,phase,height:document.documentElement.scrollHeight,confirmTop:Math.round(confirm.top+scrollY),confirmBottom:Math.round(confirm.bottom+scrollY),scroll:document.documentElement.scrollHeight>innerHeight,confirmRequiresScroll:confirm.bottom+scrollY>innerHeight,minFont:Math.min(...text.map(e=>parseFloat(getComputedStyle(e).fontSize))),minHitWidth:Math.min(...controls.map(e=>e.getBoundingClientRect().width)),minHitHeight:Math.min(...controls.map(e=>e.getBoundingClientRect().height)),bandHeight:dim('band'),shelfHeight:dim('shelf'),horizontalOverflow:document.documentElement.scrollWidth>innerWidth};
},{config,viewport,transaction,phase});}
function save(){
  fs.writeFileSync(path.join(out,'autoplay.json'),JSON.stringify({results,extras,passed:results.filter(r=>r.pass).length,total:results.length,failed:results.filter(r=>!r.pass)},null,2)+'\n');
  fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(measurements,null,2)+'\n');
  const lines=['|条件 band/shelf/input|幅|取引|高さ|確定上端|確定下端|画面スクロール|確定にスクロール|最小字|最小幅×高さ|帯高|棚高|','|---|---:|---:|---:|---:|---:|---|---|---:|---|---:|---:|'];
  for(const m of measurements.filter(m=>m.phase==='filled'))lines.push(`|${Object.values(m.config).join('/')}|${m.viewport.width}|${m.transaction}|${m.height}|${m.confirmTop}|${m.confirmBottom}|${m.scroll?'要':'不要'}|${m.confirmRequiresScroll?'要':'不要'}|${m.minFont}|${m.minHitWidth}×${m.minHitHeight}|${m.bandHeight}|${m.shelfHeight}|`);
  fs.writeFileSync(path.join(out,'measurements.md'),lines.join('\n')+'\n');
}
(async()=>{
  origin=args.includes('--http')?await localServer():null;
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
  for(const band of ['diff','scale','none'])for(const shelf of ['on','off'])for(const input of ['swipe','drag'])for(const viewport of [{width:390,height:844},{width:1280,height:800}])for(const scenario of ['correct','error']){
    const config={band,shelf,input},id=Object.values(config).join('-');
    const context=await browser.newContext({viewport,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));
    await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith('file:')||(origin&&url.startsWith(origin+'/')))return route.continue();requests.push(url);return route.abort();});
    await page.goto((origin?origin+'/index.html':pathToFileURL(path.join(root,'index.html')).href)+`?band=${band}&shelf=${shelf}&input=${input}&lock=1`);
    try{
      assert.equal(await page.locator('#settings-open').isVisible(),false);
      for(let tx=0;tx<4;tx++){
        const result={config,viewport,scenario,transaction:tx+1,pass:false};results.push(result);
        try{
          assert.equal(await page.locator('#progress').textContent(),`書類 ${tx+1} / 4`);
          if(scenario==='correct')measurements.push(await metrics(page,config,viewport,tx+1,'empty'));
          const rows=answers[tx].map(r=>[...r]);if(scenario==='error')rows[replaceIndices[tx]][1]=wrongAccounts[tx];
          for(const row of rows)await put(page,row,tx);
          if(scenario==='correct'){
            measurements.push(await metrics(page,config,viewport,tx+1,'filled'));
            if(tx===0||tx===3){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'screenshots',`${id}-${viewport.width}-tx${tx+1}.jpg`),type:'jpeg',quality:60,fullPage:true,animations:'disabled'});}
          }
          await page.locator('#confirm').click();
          if(scenario==='error'){
            assert.equal(await page.locator('#feedback').getAttribute('data-result'),'incorrect');assert.equal(await page.locator('#answer').isVisible(),false);
            await page.locator('#confirm').click();assert.equal(await page.locator('#answer').isVisible(),true);
            await page.locator(`.row[data-account="${wrongAccounts[tx]}"]`).click();await page.locator('#return').click();
            await put(page,answers[tx][replaceIndices[tx]],tx);await page.locator('#confirm').click();
          }
          assert.equal(await page.locator('#feedback').getAttribute('data-result'),'correct');assert.match(await page.locator('#feedback').textContent(),/正しい。.*確かに/);
          if(shelf==='off'){assert.equal(await page.locator('#ledger-dot').isVisible(),true);assert.ok(await page.locator('#shop-note').textContent());}
          result.pass=true;
        }catch(e){result.error=e.message;throw e;}
        if(tx<3)await page.locator('#next').click();
      }
      await page.locator('#next').click();const exported=JSON.parse(await page.locator('#export-json').inputValue());assert.equal(exported.records.length,4);
      const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('boki2.proto.desk.v1')));assert.deepEqual(exported.records,stored);
      for(const r of stored){assert.equal(r.completed,true);assert.equal(r.config.band,band);assert.equal(r.firstCorrect,scenario==='correct');assert.equal(r.confirmCount,scenario==='correct'?1:3);assert.ok(r.firstConfirmMs>0);if(scenario==='error'){assert.ok(r.fixes>=1);assert.ok(r.wrongRows.length>0);}if(r.transaction===4)assert.equal(r.calculatorOpened,true);}
      assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
      console.log(`${id} ${viewport.width} ${scenario}: 4/4`);
    }catch(e){if(!results.at(-1)?.error)results.push({config,viewport,scenario,phase:'export',pass:false,error:e.message});console.error(`${id} ${viewport.width} ${scenario}: ${e.message}`);}
    await context.close();save();
  }
  await browser.close();if(server)server.close();save();console.log(`打ち手 ${results.filter(r=>r.pass).length}/${results.length}、測定 ${measurements.length}、写真 ${fs.readdirSync(path.join(out,'screenshots')).length}`);
  if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(async e=>{console.error(e);save();if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
