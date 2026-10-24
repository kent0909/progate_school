#!/usr/bin/env node
'use strict';
// 公式--info出力の丸めた率から、母数が既知で一意な整数件数だけを復元する。
// 率を推測しない。一意でない／行がない場合は停止する。
const fs=require('fs'),path=require('path');
const dir=path.resolve(process.argv[2]||path.join(__dirname,'ramen-y1-economy-results'));
const variants=['base','potential','ramp','fixed','combined'];
const configs=require('./ramen-y1-economy-config.js');
const entries={};
function rate(p,n){
 const ks=Array.from({length:n+1},(_,k)=>k).filter(k=>Math.round(1000*k/n)/10===+p);
 if(ks.length!==1)throw Error(`件数を一意に復元できない ${p}/${n}`);
 const k=ks[0],z=1.96,x=k/n,d=1+z*z/n,c=(x+z*z/(2*n))/d,h=z/d*Math.sqrt(x*(1-x)/n+z*z/(4*n*n));
 return {k,n,pct:+p,lo:100*(c-h),hi:100*(c+h)};
}
const fmt=r=>`${r.k}/${r.n} = ${r.pct.toFixed(1)}% [${r.lo.toFixed(1)}, ${r.hi.toFixed(1)}]`;
const add=(id,v,value,pass,criterion)=>{(entries[id]||={criterion,cells:{}}).cells[v]={value,pass};};
const raw=[];
for(const v of variants){
 const s=fs.readFileSync(path.join(dir,`formal-${v}.log`),'utf8');
 const get=re=>{const m=s.match(re);if(!m)throw Error(`${v}: 正式行がない ${re}`);return m;};
 for(const st of ['常連と地図','一杯と衛生','集客と席']){
  const m=get(new RegExp(`上手${st}（(\\d+)周・5年末）：基礎に勝つ([\\d.]+)%、放置に勝つ([\\d.]+)%`));
  for(const [j,target,cut]of [[2,'基礎',80],[3,'放置',90]]){const r=rate(m[j],+m[1]);add(`上手${st}→${target}`,v,fmt(r),r.pct>=cut,`≥${cut}%`);raw.push({variant:v,row:st+'→'+target,...r});}
 }
 let m=get(/基礎が放置に勝つ（5年末）：([\d.]+)%/);let r=rate(m[1],300);add('基礎→放置',v,fmt(r),r.pct>=60,'≥60%');raw.push({variant:v,row:'基礎→放置',...r});
 for(const [name,keys]of [['仕入先',['cheap','std','high']],['看板/放置＋LINE',['none','small','large','later']],['原価の予兆',['switch','keep','bulk']]]){
  const line=s.split('\n').find(l=>l.startsWith(name+'（'));if(!line)throw Error('正式行がない '+name);
  const n=+line.match(/（(\d+)周/)[1]-+line.match(/同点(\d+)/)[1];
  const rs=keys.map(k=>rate(line.match(new RegExp(k+' ([\\d.]+)%'))[1],n));
  const check=name==='仕入先'?rs[2]:rs.reduce((a,b)=>a.pct>b.pct?a:b);
  add(name,v,keys.map((k,i)=>`${k}: ${fmt(rs[i])}`).join('<br>'),check.pct<70,name==='仕入先'?'high <70%':'最多 <70%');rs.forEach((r,i)=>raw.push({variant:v,row:name+'/'+keys[i],...r}));
 }
 m=get(/無作為 (\d+)周（13か月）：1年目（12か月以内）の倒産 ([\d.]+)%（F7 の目安 5〜10%）、詰み ([\d.]+)%/);
 for(const [id,j,cut]of [['F7',2,'5〜10%'],['詰み',3,'<1%']]){r=rate(m[j],+m[1]);add(id,v,fmt(r),id==='F7'?r.pct>=5&&r.pct<=10:r.pct<1,cut);raw.push({variant:v,row:id,...r});}
 m=get(/値段（上手な3方針・(\d+)周）：36か月累計の入れ替わり ([\d.]+)%/);r=rate(m[2],+m[1]);add('価格の長期入れ替わり',v,fmt(r),r.pct>50,'>50%');raw.push({variant:v,row:'価格の長期入れ替わり',...r});
 for(const mode of ['放置どうし','上手どうし']){
  m=get(new RegExp(`店の形（${mode}・(\\d+)周）：家族の3年末([\\d.]+)%／5年末([\\d.]+)%、引き分け(\\d+)/(\\d+)周`));
  const a=rate(m[2],+m[1]-+m[4]),b=rate(m[3],+m[1]-+m[5]);
  add('家族/'+mode,v,'3年末 '+fmt(a)+'<br>5年末 '+fmt(b),mode==='放置どうし'?a.pct>=60&&a.pct<=80:a.pct<=40,mode==='放置どうし'?'3年末60〜80%':'3年末≤40%');
  raw.push({variant:v,row:'家族/'+mode+'/3年末',...a},{variant:v,row:'家族/'+mode+'/5年末',...b});
 }
 const lines=s.split('\n'), end=lines.findIndex(l=>/^\d+ 件（[\d.]+秒）$/.test(l));
 const errors=end<0?[]:lines.slice(0,end).filter(l=>l.trim()&&!/^#|^影の線|^予兆：|^OK：画面|^参考探索だけ除外/.test(l));
 if(end>=0&&errors.length!==Number(lines[end].match(/^\d+/)[0]))throw Error(v+': 不合格行を全件抽出できない');
 add('正式検査の終了コード',v,fs.readFileSync(path.join(dir,`formal-${v}.exit`),'utf8').trim(),fs.readFileSync(path.join(dir,`formal-${v}.exit`),'utf8').trim()==='0','0');
 add('正式検査の失敗行',v,errors.join('<br>')||'なし',!errors.length,'基準変更なし');
}
const out=['# (b) 版1.2.1の正式検査行','','実行: `RAMEN_Y1_VARIANT=<ID> node -r ./boki2/docs/analysis/ramen-y1-economy-formal-hook.js -r ./boki2/docs/analysis/ramen-y1-economy-load.js boki2/tools/sim-check.js --ramen --runs 300 --info`。本体と検査のファイルは無変更。読み込み時に合否に使わない2つの参考探索だけを除く（差分8行を添付）。全ての合否の計算と閾値は残す。価格の長期入れ替わりは正式検査の内蔵上限で150周、他の主行は300周（予兆は対象の町のみ）。各率に分子/分母とWilson95%を併記。合否は元の検査と同じ点推定の線で判定する。区間は母集団推定の幅であり、合否の線の変更には使わない。','','|正式行|基準|'+variants.map(v=>configs[v].label).join('|')+'|','|---|---|'+variants.map(()=>'---').join('|')+'|'];
for(const [id,row]of Object.entries(entries))out.push(`|${id}|${row.criterion}|${variants.map(v=>{const c=row.cells[v];return `${c.pass?'○':'✗'} ${c.value}`;}).join('|')}|`);
fs.writeFileSync(path.join(dir,'proposals-b.md'),out.join('\n')+'\n');
fs.writeFileSync(path.join(dir,'formal-counts.json'),JSON.stringify(raw,null,2)+'\n');
console.log('正式検査の行とWilson区間を生成');
