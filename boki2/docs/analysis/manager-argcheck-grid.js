'use strict';
// DESIGN-MANAGER db0c229 第3・4節のモデルを lo/hi の一様な乱数で動かす検算。
let s=12345;const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
const U=(lo,hi)=>lo+(hi-lo)*rnd(), I=(lo,hi)=>lo+Math.floor(rnd()*(hi-lo+1));
function plan(p,n,Y,OC,H){
  const E=p.we*(1+p.r)+p.be*(1+p.r)/12, T=p.wt*(1+p.r)+p.bt*(1+p.r)/12;
  let ex=0,tr=0;
  for(let m=1;m<=H;m++){
    ex+=Math.min(p.de,n)*Y-(m===1?p.h*OC+p.fe:0)-E;
    const train=m<=p.tm;
    tr+=Math.min(p.dt,n)*Y-(train?p.es*OC+p.x:0)-(m===1?p.ft:0)-T;
  }
  let self=0;for(let k=0;k<=n;k++)self=Math.max(self,k*(Y-OC)*H);
  return {none:0,self,ex,tr};
}
function sample(){return {we:U(250e3,400e3),wt:U(180e3,260e3),r:U(.10,.20),be:U(0,240e3),bt:U(0,120e3),de:I(1,2),dt:I(1,2),tm:I(1,4),es:I(1,2),h:I(0,2),fe:U(40e3,120e3),ft:U(20e3,80e3),x:U(20e3,60e3)};}
const sits={A:{n:1,Y:[0,300e3],OC:[0,400e3],H:12},B:{n:2,Y:[0,400e3],OC:[0,400e3],H:6},C:{n:1,Y:[0,450e3],OC:[0,450e3],H:18}};
const N=200000;
for(const [k,S] of Object.entries(sits)){
  const w={none:0,self:0,ex:0,tr:0},w3={none:0,ex:0,tr:0};
  for(let i=0;i<N;i++){const p=sample(),Y=U(...S.Y),OC=U(...S.OC);const r=plan(p,S.n,Y,OC,S.H);
    const b=Object.entries(r).sort((a,c)=>c[1]-a[1])[0][0];w[b]++;
    const b3=Object.entries({none:0,ex:r.ex,tr:r.tr}).sort((a,c)=>c[1]-a[1])[0][0];w3[b3]++;}
  const f=o=>Object.entries(o).map(([a,v])=>a+' '+(100*v/N).toFixed(1)+'%').join(' / ');
  console.log(k,'自分で見る込み:',f(w));console.log(k,'設計の3択（雇わない・経験者・育成）:',f(w3));
}
// 設計書の置き値での確認と、機会損失を変えたとき
const p0={we:300e3,wt:220e3,r:.15,be:120e3,bt:60e3,de:2,dt:1,tm:2,es:1,h:1,fe:80e3,ft:50e3,x:40e3};
console.log('B 置き値',plan(p0,2,250e3,250e3,6));console.log('C 置き値',plan(p0,1,340e3,340e3,18));
for(const OC of [0,20e3,100e3,178250,258750]){console.log('OC',OC,'B',plan(p0,2,250e3,OC,6),'C',plan(p0,1,340e3,OC,18));}
// 支配の組み合わせ：育成が経験者より1枠あたり安い条件
const best={we:250e3,be:0,wt:180e3,bt:0,r:.10};
console.log('経験者の最安',best.we*1.1,'育成の最安(委任2枠)',best.wt*1.1);
const pT={we:250e3,wt:180e3,r:.10,be:0,bt:0,de:2,dt:2,tm:1,es:1,h:2,fe:120e3,ft:20e3,x:20e3};
for(const [k,S] of Object.entries(sits)){let cnt=0,tot=0;for(let Y=0;Y<=S.Y[1];Y+=10e3)for(let OC=0;OC<=S.OC[1];OC+=10e3){tot++;const r=plan(pT,S.n,Y,OC,S.H);if(r.tr>=r.ex)cnt++;}console.log('育成が上限2・給料最安側・経験者は引継ぎ2:',k,'育成>=経験者',cnt+'/'+tot);}
const pE={we:250e3,wt:260e3,r:.10,be:0,bt:120e3,de:2,dt:1,tm:4,es:2,h:0,fe:40e3,ft:80e3,x:60e3};
for(const [k,S] of Object.entries(sits)){let cnt=0,tot=0;for(let Y=0;Y<=S.Y[1];Y+=10e3)for(let OC=0;OC<=S.OC[1];OC+=10e3){tot++;const r=plan(pE,S.n,Y,OC,S.H);if(r.ex>=r.tr)cnt++;}console.log('経験者が最安側・育成が最高側:',k,'経験者>=育成',cnt+'/'+tot);}
// 1枠あたりの平常月の費用：育成が経験者より安くなる割合（設計の lo/hi 一様）
let c=0;for(let i=0;i<N;i++){const p=sample();const E=p.we*(1+p.r)+p.be*(1+p.r)/12,T=p.wt*(1+p.r)+p.bt*(1+p.r)/12;if(T/p.dt<E/p.de)c++;}console.log('1枠あたり育成が安い割合',(100*c/N).toFixed(1)+'%');
