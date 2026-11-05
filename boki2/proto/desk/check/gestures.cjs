// 4枚を最後まで払い/ドラッグで遊ぶ。内部状態を直接書き換えない。
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const argv=process.argv.slice(2),arg=(k,d)=>argv.includes(k)?argv[argv.indexOf(k)+1]:d;
const {chromium}=require(arg('--playwright',process.env.PIYO_PLAYWRIGHT||'/opt/node-tools/node_modules/playwright'));
const executablePath=arg('--chromium',process.env.PIYO_CHROMIUM||'/opt/pw-browsers/chromium');
const root=path.resolve(__dirname,'..'),results=[];let browser,server;
const rows=[[['left','現金',10000,'asset-increase'],['right','借入金',10000,'liability-increase']],[['left','備品',5000,'asset-increase'],['right','現金',5000,'asset-decrease']],[['left','仕入',30000,null],['right','現金',10000,'asset-decrease'],['right','買掛金',20000,'liability-increase']],[['left','減価償却累計額',50000,'contra-decrease'],['left','現金',60000,'asset-increase'],['right','備品',120000,'asset-decrease'],['left','固定資産売却損',10000,'expense-increase']]];
async function gesture(page,account,side,mouth,input){
 const card=page.locator(`#cards [data-account="${account}"]`);await card.scrollIntoViewIfNeeded();const box=await card.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+4,y,{steps:2});
 if(input==='swipe'){await page.mouse.move(x+(side==='left'?-100:100),y,{steps:8});}
 else {
  const target=mouth?page.locator(`[data-mouth="${mouth}"]`):page.locator(`.drop[data-drop="${side}"]`);
  // 画面端で待って自動スクロール。取引4の列は手札を見た位置から画面外になる。
  for(let i=0;i<80;i++){
   const t=await target.boundingBox();assert.ok(t,'落とし口がある');
   if(t.y>=0&&t.y+t.height<=844){await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:12});break;}
   await page.mouse.move(x,t.y<0?10:834,{steps:4});await page.waitForTimeout(75);
   if(i===79)throw Error('落とし口まで自動スクロールできない');
  }
 }
 await page.mouse.up();assert.equal(await page.locator(`.row[data-account="${account}"][data-row-side="${side}"]`).count(),1);
}
(async()=>{
 server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!['index.html','desk.js','desk.css'].includes(name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,name)));});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
 for(const band of ['diff','scale','none'])for(const shelf of ['on','off'])for(const input of ['swipe','drag']){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());const page=await ctx.newPage();await page.goto(`${origin}/index.html?band=${band}&shelf=${shelf}&input=${input}&lock=1`);
  for(let tx=0;tx<4;tx++){
   const result={band,shelf,input,transaction:tx+1,pass:false};results.push(result);
   try{
    for(const [side,account,amount,mouth] of rows[tx]){
     if(tx===3&&amount===10000){
      if(band==='diff')assert.equal(await page.locator('#band').textContent(),'左右の差 10,000円');
      if(band==='scale')assert.equal(await page.locator('#band').textContent(),'そろわない');
      if(band==='none')assert.equal(await page.locator('#band').textContent(),'');
      await page.locator('#calc-open').click();for(const k of ['1','2','0','0','0','0','−','5','0','0','0','0','−','6','0','0','0','0','='])await page.locator(`[data-calc="${k}"]`).click();await page.locator('#use-result').click();
     }else await page.locator(`[data-amount="${amount}"]`).click();
     await gesture(page,account,side,shelf==='on'?mouth:null,input);
    }
    await page.locator('#confirm').click();assert.equal(await page.locator('#feedback').getAttribute('data-result'),'correct');result.pass=true;if(tx<3)await page.locator('#next').click();
   }catch(e){result.error=e.message;break;}
  }
  console.log(`${band}/${shelf}/${input}: ${results.filter(r=>r.band===band&&r.shelf===shelf&&r.input===input&&r.pass).length}/4`);
  fs.writeFileSync(path.join(__dirname,'results','gestures.json'),JSON.stringify(results,null,2)+'\n');await ctx.close();
 }
 await browser.close();server.close();console.log(`払い/引く通し ${results.filter(r=>r.pass).length}/${results.length}`);if(results.length!==48||results.some(r=>!r.pass))process.exitCode=1;
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
