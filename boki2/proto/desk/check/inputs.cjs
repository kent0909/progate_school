const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const argv=process.argv.slice(2),arg=(k,d)=>argv.includes(k)?argv[argv.indexOf(k)+1]:d;
const {chromium}=require(arg('--playwright',process.env.PIYO_PLAYWRIGHT||'/opt/node-tools/node_modules/playwright'));
const executablePath=arg('--chromium',process.env.PIYO_CHROMIUM||'/opt/pw-browsers/chromium');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'results','inputs.json');
const results=[];let browser,server;
(async()=>{
 server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['index.html','desk.js','desk.css'].includes(name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,name)));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
 for(const band of ['diff','scale','none'])for(const shelf of ['on','off'])for(const input of ['swipe','drag']){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});const page=await context.newPage();await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  const result={band,shelf,input,pass:false};results.push(result);
  try{
   await page.goto(`${origin}/index.html?band=${band}&shelf=${shelf}&input=${input}`);
   assert.equal(await page.locator('#settings-open').isVisible(),true);await page.locator('#settings-open').click();assert.equal(await page.locator('#band-setting').inputValue(),band);await page.locator('#settings [data-close]').click();
   await page.locator('[data-amount="10000"]').click();
   const cash=page.locator('#cards [data-account="現金"]');await cash.focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');assert.equal(await page.locator('#left-rows .row').count(),1);
   // キーで移す・戻す。無関係な札には触れない。
   await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');assert.equal(await page.locator('#right-rows .row').count(),1);await page.keyboard.press('Backspace');assert.equal(await page.locator('.row').count(),0);
   // しきい値未満の動きは元に戻る。
   await cash.scrollIntoViewIfNeeded();let box=await cash.boundingBox();let x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+5,y,{steps:3});await page.waitForTimeout(50);await page.mouse.up();assert.equal(await page.locator('.row').count(),0);
   if(input==='drag'){box=await cash.boundingBox();x=box.x+box.width/2;y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+4,y);const wrong=await page.locator('.drop[data-drop="right"]').boundingBox();await page.mouse.move(wrong.x+wrong.width/2,wrong.y+wrong.height/2,{steps:10});await page.mouse.up();assert.equal(await page.locator('#right-rows .row').count(),1);assert.equal(await page.locator('#feedback').getAttribute('data-result'),null);await page.locator('#right-rows .row').focus();await page.keyboard.press('Backspace');}
   // 本物の touch Pointer Events を CDP 経由で送る（状態には書き込まない）。
   const cdp=await context.newCDPSession(page);box=await cash.boundingBox();x=box.x+box.width/2;y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-100*i/8,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.locator('#left-rows .row').count(),1);
   if(input==='drag'){
    const loan=page.locator('#cards [data-account="借入金"]');await loan.scrollIntoViewIfNeeded();box=await loan.boundingBox();x=box.x+box.width/2;y=box.y+box.height/2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+4,y,{steps:2});
    const target=shelf==='on'?page.locator('[data-mouth="liability-increase"]'):page.locator('.drop[data-drop="right"]');const targetBox=await target.boundingBox();await page.mouse.move(targetBox.x+targetBox.width/2,targetBox.y+targetBox.height/2,{steps:12});await page.mouse.up();assert.equal(await page.locator('#right-rows .row[data-account="借入金"]').count(),1);
   }else{await page.locator('#cards [data-account="借入金"]').click();await page.locator('[data-place="right"]').click();}
   await page.locator('#confirm').click();assert.equal(await page.locator('#feedback').getAttribute('data-result'),'correct');
   await page.locator('#export-open').click();const records=JSON.parse(await page.locator('#export-json').inputValue()).records,r=records[0];assert.ok(r.inputs.key>=3);assert.ok(r.inputs.swipe>=1);assert.ok(r.cancelled[input]>=1);if(input==='drag'){assert.ok(r.inputs.drag>=2);assert.equal(r.wrongColumnDrops,1);}result.record=r;
   // 動きを減らす設定は位置・大きさのアニメーションを止める。
   await page.locator('#export [data-close]').click();await page.emulateMedia({reducedMotion:'reduce'});const durations=await page.locator('.row').first().evaluate(e=>({animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration}));assert.equal(durations.animation,'none');result.reducedMotion=durations;
   result.pass=true;
  }catch(e){result.error=e.message;}
  console.log(`${band}/${shelf}/${input}: ${result.pass?'OK':result.error}`);fs.writeFileSync(out,JSON.stringify(results,null,2)+'\n');await context.close();
 }
 await browser.close();server.close();console.log(`入力検査 ${results.filter(r=>r.pass).length}/${results.length}`);if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
