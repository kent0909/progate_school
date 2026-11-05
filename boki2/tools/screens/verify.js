#!/usr/bin/env node
'use strict';
// 生成物の実ファイルと目録を照合する。14px未満はJSONとMarkdownで別々に数える。
const fs=require('fs'),path=require('path'),crypto=require('crypto'),jpegSize=require('./jpeg.js');
const root=process.env.SCREEN_OUTPUT||path.resolve(__dirname,'../../docs/screens');
(async()=>{
 const x=JSON.parse(fs.readFileSync(path.join(root,'inventory.json'))),s=JSON.parse(fs.readFileSync(path.join(root,'summary.json'))),errors=[];
 let photosBytes=0,sheetsBytes=0;
 for(let i=0;i<x.rows.length;i++){
  const r=x.rows[i],buf=fs.readFileSync(path.join(root,r.file)),m=jpegSize(buf);photosBytes+=buf.length;
  if(r.id!=='S'+String(i+1).padStart(3,'0'))errors.push(r.id+':番号');
  if(m.format!=='jpeg'||m.width!==r.width)errors.push(r.id+':形式・幅');
  if(crypto.createHash('sha256').update(buf).digest('hex')!==r.imageSha)errors.push(r.id+':画像SHA256');
  if(r.chars!==r.text.length)errors.push(r.id+':文字数');
 }
 for(const sh of s.sheets){const f=path.join(root,sh.file),m=jpegSize(fs.readFileSync(f));sheetsBytes+=fs.statSync(f).size;if(m.width>1200||m.format!=='jpeg'||sh.ids.length>12)errors.push(sh.file+':一覧');}
 const lines=fs.readFileSync(path.join(root,'INDEX.md'),'utf8').split('\n'),header=lines.find(l=>l.startsWith('|番号|')).split('|'),column=header.indexOf('最小px');
 const md=lines.filter(l=>/^\|S\d+\|/.test(l)).map(l=>l.split('|'));
 const under14=x.rows.filter(r=>r.minFont<14).length,markdownUnder14=md.filter(r=>Number(r[column])<14).length;
 if(md.length!==x.rows.length||fs.readdirSync(path.join(root,'images')).length!==x.rows.length)errors.push('目録行・画像数');
 if(column<0||under14!==markdownUnder14||under14!==s.typography.under14)errors.push('14px未満のJSON・Markdown・集計');
 if(photosBytes+sheetsBytes!==s.totalImageBytes||photosBytes+sheetsBytes>40000000)errors.push('容量');
 if(s.darkKinds<10||s.missing.length||s.missingTimes.length)errors.push('種類・時期');
 const result={screens:x.rows.length,indexRows:md.length,byViewport:Object.fromEntries([...new Set(x.rows.map(r=>r.width+'-'+r.color))].map(k=>[k,x.rows.filter(r=>r.width+'-'+r.color===k).length])),photosBytes,sheetsBytes,totalImageBytes:photosBytes+sheetsBytes,darkKinds:s.darkKinds,missing:s.missing,missingTimes:s.missingTimes,typography:{under14,markdownUnder14,under12:x.rows.filter(r=>r.minFont<12).length,markdownColumn:column},errors};
 fs.mkdirSync(path.join(root,'checks'),{recursive:true});fs.writeFileSync(path.join(root,'checks/artifacts.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 if(errors.length){process.exitCode=1;console.error('NG：生成物の相違 '+errors.length+'件');}
 else console.log(`OK：画像${x.rows.length}枚・一覧${s.sheets.length}枚・目録${md.length}行、幅/形式/SHA/容量と14px未満${under14}枚を照合（相違0）`);
})().catch(e=>{console.error(e);process.exitCode=1;});
