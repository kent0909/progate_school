// 版0.4 の 4.1・4.2・4.3 の初めの置き値を、今の js/sim のまま全965候補地に当てる（36か月・期待値・放置の平均の店）
global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const D=window.SIMDATA,Wd=D.world,RV=D.rivals,C=D.coef;D.y2.stream=null;
const T=(()=>{const g={};const src=require('fs').readFileSync(process.argv[2],'utf8');new Function('globalThis',src.replace('typeof window !== \'undefined\' ? window : globalThis','globalThis'))(g);return g.SIMDATA.tokyo23})();
const BASECOMBO=(process.argv[3]||'cheap,shinise').split(',').filter(Boolean);
const st=Object.fromEntries(T.stations.map(s=>[s.id,s]));
const TIER={1:0.7,2:0.8,3:0.9,4:1.0,5:1.15,6:1.3,8:1.5}, ATTR={hanka:1.15,shogyo:1.1,office:1.0,shoten:1.0,jutaku:0.8,kojo:0.6};
const dist=w=>w<=200?1.15:w<=500?1.0:0.8;
const LAM={1:0.3,2:0.5,3:0.8,4:1.1,5:1.5,6:2.0,8:2.6}, LATTR={hanka:1.4,shogyo:1.2,office:1.0,shoten:1.0,jutaku:0.6,kojo:0.4};
const WT={hanka:[0.4,0.4,0.2],office:[0.5,0.3,0.2],shoten:[0.3,0.3,0.4],jutaku:[0.3,0.3,0.4]}; WT.shogyo=WT.office; WT.kojo=WT.jutaku; // shogyo・kojo は設計書にない（私の置き方）
const MIX={office:{office:.7,family:.1,student:.05,tourist:.15},shogyo:{office:.5,family:.25,student:.1,tourist:.15},hanka:{office:.35,family:.15,student:.2,tourist:.3},shoten:{office:.3,family:.55,student:.1,tourist:.05},jutaku:{office:.15,family:.75,student:.1,tourist:0},kojo:{office:.6,family:.3,student:.1,tourist:0}};
const useMix=process.argv[4]==='mix';
const pois=(rng,l)=>{let L=Math.exp(-l),k=0,p=1;do{k++;p*=rng()}while(p>L);return Math.min(5,k-1)};
const idle=W=>{const p=Wd.policy0(W,null,{neutral:true});for(const k of Wd.TIME_KEYS)p[k]=false;return {...p,price:850,parts:1,family:0,map:true,line:false,prep:'mid',flyer:0,borrow:false};};
const rs=r=>({id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true});
// P_ref：基準の候補地（段3・〜500m・商店街・BASECOMBO）で share から逆算（今の calibrate の形）
const W0=Wd.create({seed:0,area:'shotengai'});const a0=W0.town.areas.shotengai;
const ref={id:'ref',price:850,R:3,A:0,L:0,bowl:D.bowl.create(D.bowl.presets[0].spec),parts:1,family:0};
a0.mix=useMix?MIX.shoten:a0.mix;
const shB=Wd.sharesFor(W0,[ref,...BASECOMBO.map((t,k)=>rs(RV.make(t,k)))],{neutralFit:true})[0];
const epsB=1/Math.max(0.5,1-shB);
const Fbase=0.9*1.0*1.0;
function run(F,types,attr){
  const W=Wd.create({seed:0,area:'shotengai'});const a=W.town.areas.shotengai;a.potentialMul=1;if(useMix)a.mix=MIX[attr];
  a.epsScale=epsB; a.P=C('median')*C('potentialScale')/shB*(F/Fbase);
  W.rivals=types.map((t,k)=>RV.make(t,k));
  let x=W,N=0,dem=0;for(let k=0;k<36;k++){const r=Wd.month(x,idle(x),{noise:false,noCards:true,noFactors:true,rng:D.rng(90001+k)});if(k>=24){N+=r.res.N/12;dem+=r.res.demand/12;}x=r.W;}
  return {N,dem};
}
const base=run(Fbase,BASECOMBO,'shoten');
const out=T.sites.map((s,i)=>{const S=st[s.st];const rng=D.rng(1000+i);const n=pois(rng,LAM[S.pins]*LATTR[s.type]);const w=WT[s.type];const types=[];for(let k=0;k<n;k++){const x=rng();types.push(x<w[0]?'cheap':x<w[0]+w[1]?'kodawari':'shinise')}
  const F=TIER[S.pins]*dist(s.walk)*ATTR[s.type];const v=run(F,types,s.type);return {id:s.id,name:S.name,pins:S.pins,type:s.type,walk:s.walk,n,types:types.join('+'),F,rel:v.dem/base.dem,N:v.N,dem:v.dem}});
const q=(a,p)=>a[Math.floor(p*(a.length-1))];
const rel=out.map(o=>o.rel).sort((a,b)=>a-b);
console.log('基準の組',BASECOMBO.join('+')||'0軒','mix',useMix?'属性別(v0.2)':'今の商店街','基準 3年目 需要',base.dem.toFixed(1),'売れた',base.N.toFixed(1));
console.log('ライバル数の内訳',[0,1,2,3,4,5].map(k=>k+':'+out.filter(o=>o.n===k).length).join(' '));
console.log('需要/基準 min',rel[0].toFixed(2),'p25',q(rel,.25).toFixed(2),'中央',q(rel,.5).toFixed(2),'p75',q(rel,.75).toFixed(2),'max',rel.at(-1).toFixed(2),'→44換算の中央値',(q(rel,.5)*44).toFixed(1));
console.log('44換算で70を越える候補地',out.filter(o=>o.rel*44>70).length,'/965 =',(out.filter(o=>o.rel*44>70).length/9.65).toFixed(1)+'%');
for(const k of [0,1,2,3]){const a=out.filter(o=>o.n===k).map(o=>o.rel).sort((x,y)=>x-y);if(a.length)console.log(' ライバル',k,a.length,'中央',q(a,.5).toFixed(2))}
const top=[...out].sort((a,b)=>b.rel-a.rel).slice(0,50);
console.log('需要の上位50：段',[...new Set(top.map(o=>o.pins))].sort().join(','),'属性',JSON.stringify(top.reduce((m,o)=>(m[o.type]=(m[o.type]||0)+1,m),{})),'ライバル0軒',top.filter(o=>o.n===0).length);
const lv=a=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return a.reduce((s,v)=>s+(v-m)**2,0)/a.length;};
const ld=out.map(o=>Math.log(o.rel)),lf=out.map(o=>Math.log(o.F/Fbase));console.log('log 需要の分散',lv(ld).toFixed(3),'F_site 分',lv(lf).toFixed(3),'残り（ライバル）',lv(ld.map((v,i)=>v-lf[i])).toFixed(3));
require('fs').writeFileSync(process.argv[5]||'/dev/null',JSON.stringify(out));
