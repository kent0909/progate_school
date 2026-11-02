global.window=global;require('/home/user/progate_school/boki2/js/data/tokyo23.js');
const T=SIMDATA.tokyo23;const tiers=T.pinTiers;console.log('pinTiers',JSON.stringify(tiers));
const pinOf=r=>{for(const [th,p] of tiers) if(r>=th) return p; return 1;};
// 和と最大、和と「最大＋残りの半分」でピンの段が変わる駅
let chMax=0,chHalf=0,ex=[],sumP=0,maxP=0,halfP=0;
for(const s of T.stations){const v=Object.values(s.byOp||{});const sum=v.reduce((a,b)=>a+b,0),mx=Math.max(0,...v),half=mx+(sum-mx)/2;
 const p0=pinOf(sum),p1=pinOf(mx),p2=pinOf(half);if(sum!==s.riders)ex.push(s.name+':sum≠riders');
 sumP+=p0;maxP+=p1;halfP+=p2;if(p1!==p0){chMax++;}if(p2!==p0)chHalf++;}
console.log('駅',T.stations.length,'和→最大で段が変わる駅',chMax,'和→最大＋残り半分で変わる駅',chHalf,'ピン合計 和/最大/間',sumP,maxP,halfP,ex.slice(0,3));
const multi=T.stations.filter(s=>Object.keys(s.byOp||{}).length>=2);console.log('事業者2つ以上の駅',multi.length);
// 用途地域：住宅地の候補地の zone
const z={};T.sites.forEach(s=>{const k=s.type+'|'+s.zone;z[k]=(z[k]||0)+1});console.log(z);
// 歩く距離の分布（住宅地）
const w=T.sites.filter(s=>s.type==='jutaku').map(s=>s.walk).sort((a,b)=>a-b);console.log('住宅地 walk 中央',w[Math.floor(w.length/2)],'>500m',w.filter(x=>x>500).length,'/',w.length);
