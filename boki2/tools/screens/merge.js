#!/usr/bin/env node
'use strict';
// SCREEN_PROFILEで分けて撮影した場合だけ使う。引数の順でまとめる。
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out=process.env.SCREEN_OUTPUT||path.resolve(__dirname,'../../docs/screens');
const dirs=process.argv.slice(2);if(!dirs.length)throw Error('撮影フォルダを順に指定する');
const merged={schema:1,seed:0,rows:[],journeys:[],errors:[],actions:[]};
fs.mkdirSync(path.join(out,'images'),{recursive:true});
for(let i=0;i<dirs.length;i++){
 const dir=path.resolve(dirs[i]);if(dir===path.resolve(out))throw Error('出力先と入力先が同じ');
 const inv=JSON.parse(fs.readFileSync(path.join(dir,'inventory.json'),'utf8'));
 if(inv.seed!==0)throw Error('seedが違う');
 for(const r of inv.rows){
  const image=fs.readFileSync(path.join(dir,r.file));
  if(crypto.createHash('sha256').update(image).digest('hex')!==r.imageSha)throw Error('画像のSHA256が違う：'+r.file);
  const file=`images/run${i+1}-${path.basename(r.file)}`;fs.writeFileSync(path.join(out,file),image);
  merged.rows.push({...r,style:r.style||'skilled',file});
 }
 merged.journeys.push(...inv.journeys.map(j=>({...j,style:j.style||'skilled'})));merged.errors.push(...inv.errors);merged.actions.push(...inv.actions);
}
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(merged,null,2)+'\n');
console.log(JSON.stringify({runs:dirs.length,images:merged.rows.length,journeys:merged.journeys,errors:merged.errors}));
