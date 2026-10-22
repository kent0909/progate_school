// 10年まで。FC（5年目から年6店加盟、加盟金200万(R5)、ロイヤリティ4%×加盟店年商3,000万、本部費 年1,500万）、通販（6年目から 売上 年3,000万・利益率13%（R: 一風堂の商品販売）、在庫の事故あり）
function sim(p){
  let cash=p.start, debt=p.debt, stores=[], fc=0; const out=[];
  for(let y=1;y<=p.years;y++){
    for(let k=0;k<(p.open[y]||0);k++){ stores.push({y}); cash-=p.capex*0.3; debt+=p.capex*0.7; }
    if(p.factory===y){ cash-=20e6; debt+=100e6; }
    let sales=0, op=0; const fac=p.factory&&y>=p.factory;
    stores.forEach(s=>{ const age=y-s.y; const occ=age===0?0.75:age===1?0.95:1; const sv=p.S*occ*(age>=1?p.rep:1); sales+=sv; const c=p.c-(fac&&y>p.factory?0.05:0); op+=sv*(1-c)-p.S*(p.l+0.08+0.07+0.14)*(age===0?0.9:1); });
    if(fac){ const util=y===p.factory?0.5:Math.min(1,0.4+stores.length*0.07+fc*0.03); op+= -30e6 + util*p.whole*0.25; }
    if(p.fcFrom&&y>=p.fcFrom){ const nw=p.fcPerYear; fc+=nw; op+= nw*2e6 + fc*30e6*0.04 - 15e6; }
    if(p.ecFrom&&y>=p.ecFrom){ op+= 30e6*0.13 - (y===p.ecFrom?10e6:0); }
    const tax=op>0?op*0.3:0, int=debt*0.02, dep=stores.length*1.4e6+(fac?6e6:0);
    cash+=op-tax-int+dep; const rp=Math.min(debt,p.repay); debt-=rp; cash-=rp;
    out.push({y,n:stores.length,fc,sales:(sales/1e6)|0,op:(op/1e6)|0,cash:(cash/1e6)|0,debt:(debt/1e6)|0,net:((cash-debt)/1e6)|0});
  }
  return out;
}
const base={start:5e6,debt:10e6,capex:14e6,S:35e6,repay:6e6,years:10};
const good={c:.33,l:.31,rep:1.15}, avg={c:.35,l:.336,rep:1.0};
const plans={
 'B 多店舗のみ（年2〜3店→4店）':{open:{1:1,2:2,3:3,4:3,5:3,6:4,7:4,8:4,9:4,10:4},repay:8e6},
 'D 工場3年目＋卸＋多店舗':{open:{1:1,2:2,3:3,4:4,5:4,6:4,7:4,8:4,9:4,10:4},factory:3,whole:120e6,repay:12e6},
 'E 工場＋FC（5年目〜）＋通販（6年目〜）':{open:{1:1,2:2,3:3,4:3,5:2,6:2,7:2,8:2,9:2,10:2},factory:3,whole:150e6,fcFrom:5,fcPerYear:6,ecFrom:6,repay:12e6},
};
for(const [name,pl] of Object.entries(plans)) for(const [qn,q] of [['平均',avg],['上手',good]]){
  const r=sim({...base,...q,...pl}); const hit=r.find(x=>x.net>=100); console.log(`${name} / ${qn}: 現金−借入(百万) ${r.map(x=>x.net).join(',')}  | 現金 ${r.map(x=>x.cash).join(',')} | 1億到達: ${hit?hit.y+'年目':'なし'}`);
}
