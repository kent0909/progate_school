'use strict';
// 撮影と同じPlaywright/Chromiumで一覧を描く。画像専用ライブラリは使わない。
const fs=require('fs'),path=require('path');
module.exports=async function contactSheets(rows,out){
 const {chromium}=require(process.env.PIYO_PLAYWRIGHT||'playwright');
 const browser=await chromium.launch({executablePath:process.env.PIYO_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 const sheets=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1176,height:1932},deviceScaleFactor:1,serviceWorkers:'block'});
  await ctx.route('**/*',r=>r.abort()); // 入力画像はdata URLだけ。外部通信なし。
  const p=await ctx.newPage();p.setDefaultTimeout(60000);
  await p.setContent('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1176px;height:1932px;overflow:hidden}canvas{display:block}</style><canvas width="1176" height="1932"></canvas>');
  fs.mkdirSync(path.join(out,'sheets'),{recursive:true});
  const mobile=rows.filter(r=>r.width===390).sort((a,b)=>a.kind.localeCompare(b.kind,'ja')||a.id.localeCompare(b.id));
  for(let i=0;i<mobile.length;i+=12){
   const group=mobile.slice(i,i+12);
   const input=group.map(r=>({id:r.id,color:r.color,year:r.year,month:r.month,src:'data:image/jpeg;base64,'+fs.readFileSync(path.join(out,r.file)).toString('base64')}));
   await p.evaluate(async items=>{
    const c=document.querySelector('canvas'),g=c.getContext('2d');g.fillStyle='#ddd';g.fillRect(0,0,1176,1932);
    for(let j=0;j<items.length;j++){
     const r=items[j],x=(j%4)*294+7,y=Math.floor(j/4)*644;
     const img=new Image();img.src=r.src;await img.decode();
     g.fillStyle='#eee';g.fillRect(x,y+30,280,606);
     const h=Math.min(844,img.naturalHeight),scale=Math.min(280/img.naturalWidth,606/h),w2=img.naturalWidth*scale,h2=h*scale;
     g.drawImage(img,0,0,img.naturalWidth,h,x+(280-w2)/2,y+30+(606-h2)/2,w2,h2);
     g.fillStyle='white';g.fillRect(x,y+6,280,24);g.fillStyle='black';g.font='14px serif';g.fillText(`${r.id} / ${r.color} / ${r.year}-${r.month}`,x+6,y+23);
    }
   },input);
   const file='sheets/sheet-'+String(sheets.length+1).padStart(2,'0')+'.jpg';
   await p.screenshot({path:path.join(out,file),type:'jpeg',quality:55});
   sheets.push({file,ids:group.map(r=>r.id)});
  }
  await ctx.close();
 }finally{await browser.close();}
 return sheets;
};
