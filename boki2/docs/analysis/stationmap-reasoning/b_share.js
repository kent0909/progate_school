// world.js の calibrate・sharesFor を読み込み、基準の組で P_cal を出したあと、ライバルの数を変えたときの平均の店の割合と客数を見る
global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const D=window.SIMDATA,Wd=D.world,RV=D.rivals,C=D.coef;
const rivalStore=r=>({id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true});
const MIX={office:{office:.7,family:.1,student:.05,tourist:.15},shogyo:{office:.5,family:.25,student:.1,tourist:.15},hanka:{office:.35,family:.15,student:.2,tourist:.3},shoten:{office:.3,family:.55,student:.1,tourist:.05},jutaku:{office:.15,family:.75,student:.1,tourist:0},kojo:{office:.6,family:.3,student:.1,tourist:0}};
const SETS={'0軒':[],'1軒 安売り':['cheap'],'1軒 こだわり':['kodawari'],'1軒 老舗':['shinise'],'2軒 安売り+こだわり':['cheap','kodawari'],'2軒 安売り+老舗':['cheap','shinise'],'3軒 基準(安売り+こだわり+老舗)':['cheap','kodawari','shinise'],'3軒 安売り×2+こだわり':['cheap','cheap','kodawari'],'4軒 基準+安売り':['cheap','kodawari','shinise','cheap'],'4軒 安売り×2+こだわり×2':['cheap','cheap','kodawari','kodawari']};
function refShare(mixKey,types){
  const W=Wd.create({seed:0,area:'shotengai'});const a=W.town.areas[W.area];a.mix=MIX[mixKey];a.epsScale=1;
  const ref={id:'ref',price:a.pRef,R:3,A:0,L:0,bowl:D.bowl.create(D.bowl.presets[0].spec),parts:1,family:0};
  const riv=types.map((t,k)=>rivalStore(RV.make(t,k)));
  const sh0=Wd.sharesFor(W,[ref,...riv],{neutralFit:true})[0];
  a.epsScale=1/Math.max(0.5,1-sh0);
  return Wd.sharesFor(W,[ref,...riv],{neutralFit:true})[0];
}
// 今の calibrate の再現（shotengai の今の mix で）
{const W=Wd.create({seed:0,area:'shotengai'});const a=W.town.areas.shotengai;console.log('今の calibrate：shotengai seed0 P=',a.P.toFixed(1),'epsScale',a.epsScale.toFixed(3),'potentialMul',a.potentialMul.toFixed(3));}
console.log('\n属性ごと・ライバルの組ごとの平均の店の新規の割合 s、基準3軒との比 s/s_base（＝P_cal 固定での新規客の倍率）');
for(const m of Object.keys(MIX)){const base=refShare(m,SETS['3軒 基準(安売り+こだわり+老舗)']);const line=[m,'base s='+base.toFixed(4)];for(const [k,ty] of Object.entries(SETS)){line.push(k+':'+(refShare(m,ty)/base).toFixed(2));}console.log(line.join(' | '));}
