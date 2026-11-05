// 版0.2 4.2 の段の倍率を tokyo23 のデータに当てて分布を出す
global.window=global;require('/home/user/progate_school/boki2/js/data/tokyo23.js');
const T=SIMDATA.tokyo23, st=Object.fromEntries(T.stations.map(s=>[s.id,s]));
const tierM={1:0.75,2:0.85,3:0.95,4:1.05,5:1.15,6:1.25,8:1.4};
const dM=w=>w<=200?1.15:w<=500?1.0:0.8;
const aM={hanka:1.15,shogyo:1.1,office:1.0,shoten:1.0,jutaku:0.8,kojo:0.6};
const rivN=p=>p<=2?1:p<=4?2:p<=6?3:4;
const rows=T.sites.map(s=>{const p=st[s.st].pins;return {id:s.id,pins:p,type:s.type,walk:s.walk,price:s.price,m:tierM[p]*dM(s.walk)*aM[s.type],riv:rivN(p)};});
const ms=rows.map(r=>r.m).sort((a,b)=>a-b);const med=ms[Math.floor(ms.length/2)];
const q=(a,p)=>a[Math.floor(p*(a.length-1))];
console.log('n',rows.length,'raw min',ms[0],'max',ms[ms.length-1].toFixed(3),'median',med.toFixed(4));
const nm=ms.map(x=>x/med);console.log('normalized min',nm[0].toFixed(3),'p10',q(nm,.1).toFixed(3),'p25',q(nm,.25).toFixed(3),'p75',q(nm,.75).toFixed(3),'p90',q(nm,.9).toFixed(3),'max',nm[nm.length-1].toFixed(3));
// 中央値の候補地の駅の段・ライバルの数
const near=rows.filter(r=>Math.abs(r.m/med-1)<0.03);const cnt={};near.forEach(r=>{cnt[r.riv]=(cnt[r.riv]||0)+1});console.log('siteMul≈1 (±3%) の候補地',near.length,'ライバル数の内訳',cnt);
const all={};rows.forEach(r=>{all[r.riv]=(all[r.riv]||0)+1});console.log('全候補地のライバル数の内訳',all);
// 44×max
console.log('44×正規化max',(44*nm[nm.length-1]).toFixed(1),'44×1.85(書き手)',(44*1.85).toFixed(1));
console.log('正規化後に 70/44=1.59 を越える候補地',nm.filter(x=>x>70/44).length);
// 属性ごとの siteMul 中央値（正規化後）
for(const t of Object.keys(aM)){const a=rows.filter(r=>r.type===t).map(r=>r.m/med).sort((x,y)=>x-y);console.log(t,a.length,'med',q(a,.5).toFixed(3),'max',a[a.length-1].toFixed(3));}
// 地価と siteMul の相関（順位）
const rk=a=>{const o=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]);const r=Array(a.length);o.forEach((x,k)=>r[x[1]]=k);return r;};
const r1=rk(rows.map(r=>r.m)),r2=rk(rows.map(r=>r.price));const n=rows.length,mean=(n-1)/2;let sxy=0,sx=0,sy=0;for(let i=0;i<n;i++){sxy+=(r1[i]-mean)*(r2[i]-mean);sx+=(r1[i]-mean)**2;sy+=(r2[i]-mean)**2;}console.log('siteMul と地価の順位相関',(sxy/Math.sqrt(sx*sy)).toFixed(3));
require('fs').writeFileSync('rows.json',JSON.stringify({rows,med}));
