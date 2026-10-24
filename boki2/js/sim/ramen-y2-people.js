// パートの離職は常連客のchurnと別。資料の裏付けはまだない、取りまとめ役の仮の置き値。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2;
  const COEF={
    leave:{v:0.03,lo:0.02,hi:0.05,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。資料の裏付けなし'},
    leaveWithBonus:{v:0.015,lo:0.01,hi:0.03,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。資料の裏付けなし'},
    recruit:{v:50000,lo:30000,hi:80000,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。求人と教育の委託'},
  };
  const departures=(W,t,pol)=>{
    if(t<12)return [];
    const rate=W.flags.staffBonus&&W.flags.staffBonus.kind==='promise'?COEF.leaveWithBonus.v:COEF.leave.v;
    const out=[];
    W.stores.forEach((st,i)=>{if(st.open===false)return;const rng=SIM.rng(W.seed*7331+t*31+i),n=i===0&&pol?pol.parts:st.parts;
      for(let k=0;k<n;k++)if(rng()<rate)out.push({store:i,person:k+1,label:`${i+1}号店のパート${k+1}さん`});});
    return out;
  };
  Y.cards.add({id:'staff_leave',title:'パートさんの退職と求人の手配',scope:[],automatic:true,when:()=>false,options:[{id:'leave',label:'求人と教育を依頼する',outcomes:[{id:'left',w:100,label:'人数が減り、求人と教育を依頼した',cash:W=>-(W.flags.y2Departures || []).length*COEF.recruit.v,fx:W=>{for(const x of W.flags.y2Departures || []){const st=W.stores[x.store];st.parts=Math.max(0,st.parts-1);st.lastDeparture=W.t;}}}]}]});
  const before=Y.beforePlan;
  Y.beforePlan=(S,t,pol)=>{before(S,t,pol);S.W.flags.y2Departures=departures(S.W,t,pol);};
  Y.extraCarry.push((S,t)=>(S.W.flags.y2Departures || []).length?[{id:'staff_leave',option:'leave',t:t-1}]:[]);
  const prior=Y.afterPlan;
  Y.afterPlan=(S,t,r)=>{if(prior)prior(S,t,r);r.res.departures=(S.W.flags.y2Departures || []).map(x=>({...x}));};
  Y.extraEvents.push(t=>t<12?[]:[{t:'doc',id:`staff-cost@${t}`,kind:'staff_cost',when:S=>(((S.res || {})[t] || {}).departures || []).length>0,
    doc:{type:'請求書・支払控え',title:'人材会社への求人と教育の委託',from:'まちの人材サービス',to:'経理',date:`${Y.MON[t%12]}月`,rows:S=>[['辞めた人数',(((S.res || {})[t] || {}).departures || []).length],['1人につき求人・教育の手配',COEF.recruit.v,'amt'],['メモ','採用する人数は、来月の作戦の机で決める']]},
    ans:S=>{const n=(((S.res || {})[t] || {}).departures || []).length*COEF.recruit.v;return Y.je([['支払手数料',n]],[['普通預金',n]]);},opts:Y.opts('支払手数料')}]);
  Y.people={coef:COEF,departures};
})(typeof window!=='undefined'?window:globalThis);
