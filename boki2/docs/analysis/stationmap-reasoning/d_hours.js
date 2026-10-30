// 営業時間の札：出る頻度と、版0.2 4.3 の倍率で出る差の大きさ
global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const D=window.SIMDATA,Wd=D.world,C=D.coef;D.y2.stream=null;
const legacy=D.cards.deck.filter(c=>!c.y2);D.cards.deck.splice(0,D.cards.deck.length,...legacy);
const idle=W=>{const p=Wd.policy0(W,null,{neutral:true});for(const k of Wd.TIME_KEYS)p[k]=false;return {...p,price:850,parts:1,family:0,map:true,line:false,prep:'mid',flyer:0,borrow:false};};
let seen=0,chances=0,runs=200;
for(let s=0;s<runs;s++){let W=Wd.create({seed:s});for(let k=0;k<36;k++){const r=Wd.month(W,idle(W),{rng:D.rng(s*1000+k+5)});if(W.m===6||W.m===12){if(W.t>=2)chances++;if((r.res.cards||[]).includes('hours'))seen++;}W=r.W;}}
console.log(`36か月×${runs}周：6月・12月の機会 ${chances}、hours の札が出た ${seen}（${(100*seen/chances).toFixed(1)}%）、1周あたり ${(seen/runs).toFixed(2)}回`);
// 3年目の平均の店で Nnew の割合
let W=Wd.create({seed:0});for(let k=0;k<30;k++){W=Wd.month(W,idle(W),{noise:false,noCards:true}).W;}
const me=W.stores[0];const list=[me,...W.rivals.map(r=>({...r,rival:true}))];
const Nexp=Wd.expectN(W,850);const L=me.L;console.log('3年目(t=30) 期待の客数',Nexp.toFixed(1),'常連 L',L.toFixed(1),'新規',(Nexp-L).toFixed(1),'新規の割合',((Nexp-L)/Nexp).toFixed(2));
const Nnew=Nexp-L, margin=850*1.12*(1-0.35-0.04);
console.log('1客の限界利益(円) ≈',Math.round(margin));
const show=(lab,mul)=>{const extra=Nnew*(mul-1)*26;console.log(lab,'倍率',mul.toFixed(3),'追加の客/月',extra.toFixed(1),'粗利の差(円/月)',Math.round(extra*margin),'ガスと人 −30,000 を引くと',Math.round(extra*margin-30000));};
for(const [n,L0] of [['繁華街',0.3],['店とオフィス',0.55],['商店街',0.5],['住宅地',0.35],['オフィス',0.75],['工場',0.85]]){show(n+' 昼と夜(up の結果)',1+0.12*(1-L0));show(n+' 昼だけ(lost の結果)',1-0.06*(1-L0));}
console.log('今の札：night 期待の倍率',(0.35*1.06+0.4*1.03+0.25*1).toFixed(4),'lunch',(0.7+0.3*0.98).toFixed(4));
// 版0.2 の式を up の結果だけに入れた場合と、全結果に入れた場合の期待の倍率
for(const [n,L0] of [['繁華街',0.3],['オフィス',0.75]]){const up=1+0.12*(1-L0);const e=0.35*up+0.4*1.03+0.25*1;console.log(n,'night の期待の倍率（up だけ置き換え）',e.toFixed(4));}
// 年あたり：2回×出る確率
