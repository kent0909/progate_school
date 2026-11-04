#!/usr/bin/env node
'use strict';
// 同じseed・設定の撮り直しで、目録の列と本文・並びが一致するかを検査する。
const fs=require('fs'),path=require('path');
const {classify}=require('./catalog.js');
const files=process.argv.slice(2);if(files.length<2)throw Error('2つのinventory.jsonを指定する');
const a=JSON.parse(fs.readFileSync(files[0],'utf8')),b=JSON.parse(fs.readFileSync(files[1],'utf8'));
if(!a.journeys.length||!b.journeys.length)throw Error('撮影がまだ終わっていない');
const fields=['width','height','color','year','month','mi','ei','chars','controls','fontKinds','minFont','pages','fontSizes','text'];
const key=r=>JSON.stringify([r.width,r.color,classify(r),r.markers,r.year,r.month]);
const differences=[];let pixelDifferences=0;
for(let i=0;i<Math.max(a.rows.length,b.rows.length);i++){
 const x=a.rows[i],y=b.rows[i];
 if(!x||!y||key(x)!==key(y)){differences.push({index:i,field:'order',a:x?key(x):null,b:y?key(y):null});continue;}
 for(const f of fields)if(JSON.stringify(x[f])!==JSON.stringify(y[f]))differences.push({id:x.id,field:f,a:f==='text'?'本文A':x[f],b:f==='text'?'本文B':y[f]});
 if(x.imageSha!==y.imageSha)pixelDifferences++;
}
const result={seed:a.seed,firstScreens:a.rows.length,repeatScreens:b.rows.length,fields,measuredDifferences:differences,pixelDifferences,firstJourneys:a.journeys,repeatJourneys:b.journeys};
const dest=files[2]||path.resolve(__dirname,'../../docs/screens/checks/reproducibility.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({compared:a.rows.length,measuredDifferences:differences.length,pixelDifferences}));
if(differences.length)process.exitCode=1;
