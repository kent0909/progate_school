#!/usr/bin/env node
/* 実際のDOM・クリック・キーボード・通信・描画を調べる。localhost だけで完結。 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../..');
const arg = key => {const i=process.argv.indexOf(key);return i<0?null:process.argv[i+1];};
const artifacts = path.resolve(root,arg('--artifacts')||'boki2/docs/audit/stationmap');
const dataFile = arg('--data') ? path.resolve(root,arg('--data')) : null;
const scratch = path.join(root,'work/stationmap');
// この環境はシステムのChromium/ffmpegを使用。ホームや共有ランタイムは変更しない。
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync('/usr/bin/chromium') && fs.existsSync('/usr/bin/ffmpeg')) {
  const registry=JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core')),'browsers.json'),'utf8'));
  const rev=registry.browsers.find(b=>b.name==='ffmpeg').revision;
  const cache=path.join(scratch,'browser-tools'), bin=path.join(cache,'ffmpeg-'+rev,'ffmpeg-linux');
  fs.mkdirSync(path.dirname(bin),{recursive:true});if(!fs.existsSync(bin))fs.symlinkSync('/usr/bin/ffmpeg',bin);
  process.env.PLAYWRIGHT_BROWSERS_PATH=cache;
}
const { chromium } = require('playwright');
const out = (n,s) => console.log(`[${n}] ${s}`);
(async()=>{
  fs.mkdirSync(artifacts,{recursive:true});fs.mkdirSync(scratch,{recursive:true});
  const server=http.createServer((req,res)=>{const url=decodeURIComponent(req.url.split('?')[0]);const file=dataFile&&url==='/boki2/js/data/tokyo23.js'?dataFile:path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser=await chromium.launch({headless:true,...(process.env.STATIONMAP_CHROMIUM?{executablePath:process.env.STATIONMAP_CHROMIUM}:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
    out('環境',`Chromium ${browser.version()}`);
    const errors=[], external=[];
    async function monitored(options){const c=await browser.newContext(options);await c.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});c.on('page',p=>p.on('pageerror',e=>errors.push(e.stack||e.message)));return c;}
    const context=await monitored({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    async function load(){await page.goto(origin+'/boki2/stationmap-demo.html');await page.waitForFunction(()=>window.mountPaintMs>0);await page.waitForTimeout(350);}
    async function focus(name){await page.selectOption('select', {label:(await page.locator('select option').allTextContents()).find(t=>t.startsWith(name+' ·'))});await page.waitForTimeout(350);}
    async function pick(id){let b=page.locator(`[data-site="${id}"]`);if(!await b.isVisible()){const cluster=page.locator(`.sm-cluster[data-members~="${id}"]`);assert.equal(await cluster.count(),1,`${id} のまとめがある`);await cluster.click();await page.waitForTimeout(300);}await b.click();await page.waitForTimeout(350);}
    async function close(){await page.locator('.sm-card-close').click();if(await page.locator('.sm-group').isVisible())await page.locator('[data-action="group-close"]').click();await page.waitForTimeout(300);}
    async function geometry(){return page.evaluate(()=>{
      const vp=document.querySelector('.sm-viewport').getBoundingClientRect();const rects=[...document.querySelectorAll('.sm-pins .sm-site:not([hidden]),.sm-cluster')].map(el=>({id:el.dataset.site||el.dataset.members,...Object.fromEntries(['x','y','width','height','left','right','top','bottom'].map(k=>[k,el.getBoundingClientRect()[k]]))}));
      let overlaps=0;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)overlaps++;}
      return {overlaps,small:rects.filter(r=>r.width<44||r.height<44).length,rects:rects.length,overflow:document.documentElement.scrollWidth>innerWidth,clipped:rects.filter(r=>r.left<vp.left||r.right>vp.right||r.top<vp.top||r.bottom>vp.bottom).length};
    });}
    async function textGeometry(){return page.evaluate(()=>{
      const viewport=document.querySelector('.sm-viewport'),v=viewport.getBoundingClientRect();
      const visible=selector=>[...viewport.querySelectorAll(selector)].map(el=>({el,text:el.textContent,box:el.getBoundingClientRect()})).filter(({box:b})=>b.width>0&&b.height>0&&b.left<v.right&&b.right>v.left&&b.top<v.bottom&&b.bottom>v.top);
      const labels=visible('.sm-station-label,.sm-ward-label,.sm-town,.sm-ward-entry-name');
      const marks=visible('.sm-dot,.sm-site:not([hidden]) .sm-symbol,.sm-site:not([hidden]) .sm-owner,.sm-cluster');
      const collides=(a,b)=>a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
      let overlap=0,covered=0;const examples=[];
      for(let i=0;i<labels.length;i++){
        for(let j=i+1;j<labels.length;j++)if(collides(labels[i].box,labels[j].box)){overlap++;if(examples.length<5)examples.push(labels[i].text+' × '+labels[j].text);}
        for(const mark of marks)if(!mark.el.contains(labels[i].el)&&collides(labels[i].box,mark.box)){covered++;if(examples.length<5)examples.push(labels[i].text+' × 印 '+mark.text);}
      }
      return {labels:labels.length,overlap,covered,examples};
    });}
    await load();
    const counts=await page.evaluate(()=>({wards:document.querySelectorAll('[data-ward]').length,stations:document.querySelectorAll('[data-station]').length,sites:document.querySelectorAll('[data-site]').length,lines:document.querySelectorAll('[data-line]').length,dots:document.querySelectorAll('[data-pin-dot]').length}));
    const data=await page.evaluate(()=>SIMDATA.tokyo23);
    const expected={wards:data.wards.length,stations:data.stations.length,sites:data.sites.length,lines:data.lines.length,dots:data.sites.length};
    assert.deepEqual(counts,expected);out(1,`DOM=${JSON.stringify(counts)} データ=${JSON.stringify(expected)} --ops=${data.ops||'jm'}`);
    const stationIds=await page.locator('[data-station]').evaluateAll(ns=>ns.map(n=>n.dataset.station).sort());assert.deepEqual(stationIds,data.stations.map(s=>s.id).sort());out('駅',`ピン0本の駅=${data.stations.filter(st=>!data.sites.some(s=>s.st===st.id)).length} を含め、全駅IDとDOMが一致`);
    const palette=await page.locator('[data-line]').evaluateAll(nodes=>nodes.map(n=>({op:n.dataset.op,color:n.getAttribute('stroke')})));const byOp=new Map();for(const p of palette){if(byOp.has(p.op))assert.equal(byOp.get(p.op),p.color);byOp.set(p.op,p.color);}assert.equal(new Set(byOp.values()).size,byOp.size);out('路線色',`事業者=${byOp.size} 各社内の色一致・社ごとの区別: 通過`);
    const shibuya=data.stations.find(s=>s.name==='渋谷'), shibuyaSites=data.sites.filter(s=>s.st===shibuya.id);
    assert.ok(shibuyaSites.length>0);
    for(const width of [375,1440]) {
      await page.setViewportSize({width,height:1000});await load();
      const entries=await page.locator('.sm-cluster').evaluateAll(ns=>ns.map(n=>({opacity:getComputedStyle(n).opacity,animation:getComputedStyle(n).animationName})));assert.ok(entries.every(e=>e.opacity==='1'&&e.animation==='none'));out('入口',`幅${width} まとめ${entries.length}個: 不透明・登場フェードなし`);
      const overviewText=await textGeometry();assert.ok(overviewText.labels>0);assert.equal(overviewText.overlap,0,JSON.stringify(overviewText));assert.equal(overviewText.covered,0,JSON.stringify(overviewText));out(11,`幅${width} 段①: 文字=${overviewText.labels} 文字どうし=${overviewText.overlap} 印に隠れる文字=${overviewText.covered}`);
      await page.screenshot({path:path.join(artifacts,`${width}-1-overview.png`),fullPage:true});
      const entrances=await page.locator('[data-ward-entry]').evaluateAll(nodes=>nodes.map(n=>({code:n.dataset.wardEntry,members:n.dataset.members.split(' '),count:+n.querySelector('strong').textContent})));
      const expectedWards=data.wards.filter(w=>data.sites.some(s=>s.ward===w.name));assert.deepEqual(entrances.map(e=>e.code).sort(),expectedWards.map(w=>w.code).sort());
      assert.deepEqual(entrances.flatMap(e=>e.members).sort(),data.sites.map(s=>s.id).sort());
      const entryGeo=await geometry();assert.equal(entryGeo.overlaps,0);assert.equal(entryGeo.small,0);
      for(const entry of entrances){const ward=data.wards.find(w=>w.code===entry.code);assert.equal(entry.count,data.sites.filter(s=>s.ward===ward.name).length);await page.locator(`[data-ward-entry="${entry.code}"]`).click();assert.equal(await page.locator('.stationmap').getAttribute('data-level'),'2');assert.equal(await page.locator('.stationmap').getAttribute('data-focus-ward'),entry.code);assert.equal(await page.locator('.sm-group').isVisible(),false);await page.locator('[data-action="home"]').click();}
      out('区入口',`幅${width}: ${entrances.length}区・全${data.sites.length}ピンを所属区で網羅、各入口クリックで段②、入口の重なり0・44px未満0。候補地0の区には入口なし`);

      await focus('渋谷');await page.screenshot({path:path.join(artifacts,`${width}-2-shibuya.png`),fullPage:true});
      for(const s of shibuyaSites){await pick(s.id);assert.equal(await page.locator('.sm-card h2').textContent(),s.town);assert.equal(await page.locator('.sm-card .sm-address').textContent(),`${s.ward} / 渋谷駅`);assert.ok((await page.locator('.sm-description').textContent()).includes(s.desc));if(s.id===shibuyaSites[0].id)await page.screenshot({path:path.join(artifacts,`${width}-3-udagawa.png`),fullPage:true});await page.locator('.sm-pick').click();assert.equal(await page.evaluate(()=>window.lastPicked),s.id);await close();}
      out(2,`幅${width} 渋谷${shibuyaSites.length}本をクリック・カード町名とデータ照合・onPick一致: ${shibuyaSites.map(s=>s.town).join('、')}`);
      let allRects=0,overlap=0,small=0,clipped=0,textCount=0,textOverlap=0,textCovered=0;
      // 東京・大手町・日本橋を含む全駅の段②を測る。表示から落ちたピンはまとめに必ず所属する。
      for(const st of data.stations){await page.evaluate(id=>stationMap.focus(id),st.id);const geo=await geometry(),text=await textGeometry();textCount+=text.labels;textOverlap+=text.overlap;textCovered+=text.covered;assert.equal(text.overlap,0,st.name+JSON.stringify(text));assert.equal(text.covered,0,st.name+JSON.stringify(text));allRects+=geo.rects;overlap+=geo.overlaps;small+=geo.small;clipped+=geo.clipped;assert.equal(geo.overflow,false);const missing=await page.evaluate(()=>{const vp=document.querySelector('.sm-viewport').getBoundingClientRect();const represented=new Set([...document.querySelectorAll('.sm-cluster')].flatMap(b=>b.dataset.members.split(' ')));return [...document.querySelectorAll('.sm-site[hidden]')].filter(b=>{const left=parseFloat(b.style.left),top=parseFloat(b.style.top);return left>=2&&left<=vp.width-46&&top>=2&&top<=vp.height-46&&!represented.has(b.dataset.site);}).length;});assert.equal(missing,0);}
      assert.equal(overlap,0);assert.equal(small,0);assert.equal(clipped,0);out(3,`幅${width} 全${data.stations.length}駅の段②（東京・大手町・日本橋を含む）: 操作矩形=${allRects} 重なり=${overlap} 44px未満=${small} 切れ=${clipped} まとめからの脱落=0`);
      assert.equal(textOverlap,0);assert.equal(textCovered,0);out(11,`幅${width} 全${data.stations.length}駅の段②: 文字=${textCount} 文字どうし=${textOverlap} 印に隠れる文字=${textCovered}`);
      await focus('渋谷');const id=shibuyaSites[0].id;let b=page.locator(`[data-site="${id}"]`);if(!await b.isVisible())await page.locator(`.sm-cluster[data-members~="${id}"]`).click();
      // 実際にTabで候補地へ入り、Enterで開く（直接 focus や click で代用しない）。
      await page.locator('select').focus();let reached=false;for(let i=0;i<650;i++){await page.keyboard.press('Tab');const active=await page.evaluate(()=>document.activeElement.dataset.site);if(active){reached=true;const bb=await page.locator(`[data-site="${active}"]`).boundingBox();assert.ok(bb.width>=44&&bb.height>=44);await page.keyboard.press('Enter');await page.waitForTimeout(350);assert.equal(await page.locator('.sm-card h2').textContent(),data.sites.find(s=>s.id===active).town);break;}}assert.ok(reached);out(4,`幅${width} Tabでピンへ移動→Enterでカード一致、44×44px以上`);
      const geo=await geometry();assert.equal(geo.overflow,false);const layout=await page.evaluate(()=>{const a=document.querySelector('.sm-map').getBoundingClientRect(),b=document.querySelector('.sm-card').getBoundingClientRect();return {page:document.documentElement.scrollWidth,viewport:innerWidth,side:b.left>=a.right-1};});if(width===1440)assert.ok(layout.side);out(5,`幅${width}: scrollWidth=${layout.page} viewport=${layout.viewport} PC横並び=${layout.side}`);
    }
    await page.setViewportSize({width:1440,height:1000});await load();
    // ボタン・ホイール・ドラッグで投影が変わることを確かめる。
    const transform=()=>page.locator('.sm-geography').getAttribute('transform');let before=await transform();await page.locator('[data-action="plus"]').click();assert.notEqual(await transform(),before);before=await transform();await page.locator('.sm-viewport').hover();await page.mouse.wheel(0,-400);assert.notEqual(await transform(),before);before=await transform();const box=await page.locator('.sm-viewport').boundingBox();await page.mouse.move(box.x+80,box.y+80);await page.mouse.down();await page.mouse.move(box.x+140,box.y+130,{steps:5});await page.mouse.up();await page.waitForTimeout(100);assert.notEqual(await transform(),before);
    // Chromiumのネイティブタッチ入力でピンチする。
    const touch=await monitored({viewport:{width:375,height:1000},hasTouch:true,isMobile:true});const tp=await touch.newPage();await tp.goto(origin+'/boki2/stationmap-demo.html');await tp.waitForFunction(()=>mountPaintMs>0);const session=await touch.newCDPSession(tp);const tr=await tp.locator('.sm-viewport').boundingBox();const y=tr.y+220,x=tr.x+tr.width/2;before=await tp.locator('.sm-geography').getAttribute('transform');await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:x-35,y},{id:2,x:x+35,y}]});for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:x-35-i*9,y},{id:2,x:x+35+i*9,y}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tp.waitForTimeout(100);assert.notEqual(await tp.locator('.sm-geography').getAttribute('transform'),before);await touch.close();out('操作','＋・ホイール・ドラッグ・ネイティブタッチのピンチで投影変化');
    await focus('渋谷');await pick(shibuyaSites[0].id);const motion=await page.locator('.sm-card-content').evaluate(el=>getComputedStyle(el).animationDuration);assert.notEqual(motion,'0s');
    const reduced=await monitored({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(origin+'/boki2/stationmap-demo.html');await rp.waitForFunction(()=>mountPaintMs>0);await rp.evaluate(id=>stationMap.focus(id),shibuya.id);const rc=rp.locator(`.sm-cluster[data-members~="${shibuyaSites[0].id}"]`);if(await rc.count())await rc.click();await rp.locator(`[data-site="${shibuyaSites[0].id}"]`).click();const durations=await rp.evaluate(()=>[...document.querySelectorAll('.stationmap *')].map(e=>{const c=getComputedStyle(e);return [c.animationDuration,c.transitionDuration];}).flat().filter(s=>s.split(',').some(t=>parseFloat(t)!==0)));assert.deepEqual(durations,[]);await reduced.close();out(8,`カードの動き=${motion} reduced-motion: 全要素のanimation/transition=0s`);
    const timing=[];for(let i=0;i<3;i++){await load();timing.push(await page.evaluate(()=>mountPaintMs));}const median=[...timing].sort((a,b)=>a-b)[1];assert.ok(median<=300,`mount中央値 ${median}ms`);out(7,`mount→描画完了 3回=${timing.map(n=>n.toFixed(1)).join(', ')}ms 中央値=${median.toFixed(1)}ms (上限300ms)`);
    // opts の印・空きなし、destroy 後の再mountを確かめる。
    await focus('新宿');await pick('s002-1');assert.equal(await page.locator('.sm-pick').isDisabled(),true);await page.evaluate(()=>{stationMap.destroy();stationMap=RAMENMAP.mount(document.getElementById('map'),mapOptions);});assert.equal(await page.locator('[data-site]').count(),data.sites.length);assert.equal(await page.locator('.sm-owner').count(),2);assert.equal(await page.locator('.sm-occupied').count(),3);out('API','mine/rivals/vacant・空きなし出店不可・destroy→再mount: 通過');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);out(6,`外部通信=${external.length} ブラウザエラー=${errors.length}`);
    const shots=fs.readdirSync(artifacts).filter(f=>/^\d+-[123]-.*\.png$/.test(f));assert.equal(shots.length,6);out(9,`画面写真=${shots.length}枚: ${shots.join(', ')}`);
    // 動きはWebMに記録。書き出し途中のファイルだけworkに置く。
    const videoContext=await monitored({viewport:{width:1000,height:850},recordVideo:{dir:scratch,size:{width:1000,height:850}}});const vp=await videoContext.newPage();await vp.goto(origin+'/boki2/stationmap-demo.html');await vp.waitForTimeout(400);await vp.selectOption('select',shibuya.id);await vp.waitForTimeout(400);const vc=vp.locator(`.sm-cluster[data-members~="${shibuyaSites[0].id}"]`);if(await vc.count())await vc.click();await vp.waitForTimeout(350);await vp.locator(`[data-site="${shibuyaSites[0].id}"]`).click();await vp.waitForTimeout(600);await vp.locator('.sm-card-close').click();await vp.waitForTimeout(350);await vp.locator('[data-action="plus"]').click();await vp.waitForTimeout(400);const video=vp.video();await videoContext.close();await video.saveAs(path.join(artifacts,'motion.webm'));out('動画',path.relative(root,path.join(artifacts,'motion.webm'))+'（拡大・一覧・ピン選択・カードの出入り）');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
    const fallback=await page.evaluate(()=>{const original=SIMDATA.tokyo23,host=document.createElement('div');document.body.append(host);let m;try{SIMDATA.tokyo23=structuredClone(original);SIMDATA.tokyo23.sites[0].type='__unknown__';m=RAMENMAP.mount(host);const button=host.querySelector('.sm-site');button.click();return button.getAttribute('aria-label').includes('その他')&&host.querySelector('.sm-type').textContent.includes('その他');}finally{if(m)m.destroy();host.remove();SIMDATA.tokyo23=original;}});assert.equal(fallback,true);out('属性','未知の属性でも「その他」の形・カードを描画: 通過');
    await context.close();out('結果','地図の検査はすべて通過');
  } finally {if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
