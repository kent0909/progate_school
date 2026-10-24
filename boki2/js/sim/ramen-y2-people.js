// パートの離職は常連客のchurnと別。資料の裏付けはまだない、取りまとめ役の仮の置き値。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2;
  const COEF={
    leave:{v:0.03,lo:0.02,hi:0.05,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。資料の裏付けなし'},
    leaveWithBonus:{v:0.015,lo:0.01,hi:0.03,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。資料の裏付けなし'},
    recruit:{v:50000,lo:30000,hi:80000,source:'e.5・取りまとめ役の仮の置き値（PR #2 6383689018）。求人と教育の委託'},
  };
  const V=k=>Y.cards.coef[k].v;
  const updateCapacity=st=>{const experienced=(st.partTenure||[]).slice(0,st.parts).filter(n=>n>=V('staffExperienceMonths')).length;st.staffExperienceMul=1+(st.parts?V('staffExperience')*experienced/st.parts:0);};
  const departures=(W,t,pol)=>{
    if(t<12)return [];
    const tier=W.flags.staffBonus&&W.flags.staffBonus.tier||'token',pressure=W.flags.y2HiringUntil>t;
    const ordinary=tier==='generous'?V('bonusGenerousLeave'):tier==='standard'?COEF.leaveWithBonus.v:COEF.leave.v;
    const rate=pressure?(tier==='generous'?V('bonusGenerousPressure'):V('hiringPressure')*(tier==='standard'?V('hiringBonusRatio'):1)):ordinary;
    const out=[];
    W.stores.forEach((st,i)=>{if(st.open===false)return;const rng=SIM.rng(W.seed*7331+t*31+i),n=i===0&&pol?pol.parts:st.parts;
      for(let k=0;k<n;k++)if(rng()<rate)out.push({store:i,person:k+1,label:`${i+1}号店のパート${k+1}さん`});});
    return out;
  };
  Y.cards.add({id:'staff_leave',title:'パートさんの退職',scope:[],automatic:true,when:()=>false,options:[{id:'leave',label:'欠員の月を回す',time:V('leavingTime'),outcomes:[{id:'left',w:100,label:'半月分の給料を精算。欠員で営業の力が下がり、来月は店主の時間も減る',cash:W=>-(W.flags.y2Departures||[]).reduce((n,x)=>n+SIM.coef('wagePart')*(W.stores[x.store].wageUp||1)*V('leavingPay'),0),fx:W=>{W.flags.y2PendingHires=[];for(const x of W.flags.y2Departures || []){const st=W.stores[x.store];st.parts=Math.max(0,st.parts-1);st.lastDeparture=W.t;W.flags.y2PendingHires.push({...x});}for(const st of W.stores){const gone=(W.flags.y2Departures||[]).filter(x=>W.stores[x.store]===st).map(x=>x.person-1).sort((a,b)=>b-a);for(const i of gone)(st.partTenure||[]).splice(i,1);updateCapacity(st);}}}]}]});
  Y.cards.add({id:'staff_hire',title:'欠員を補う採用と教育',scope:[],automatic:true,when:()=>false,options:[{id:'hire',label:'同じ人数まで補う',outcomes:[{id:'hired',w:100,label:'求人と教育で欠員を補った',cash:W=>-(W.flags.y2Recruiting || []).length*COEF.recruit.v}]}]});
  const before=Y.beforePlan;
  Y.beforePlan=(S,t,pol)=>{
    before(S,t,pol);
    const pending=(S.W.flags.y2PendingHires || []).filter(x=>S.W.stores[x.store]&&S.W.stores[x.store].open!==false);
    for(const x of pending){S.W.stores[x.store].parts++;(S.W.stores[x.store].partTenure||=[]).push(0);}
    S.W.flags.y2Recruiting=pending;S.W.flags.y2PendingHires=[];
    for(const [i,st]of S.W.stores.entries()){
      const n=i===0&&pol?pol.parts:st.parts;
      if(!st.partTenure)st.partTenure=Array.from({length:n},(_,k)=>{if(!S.pols)return t===12?12:0;let months=0;for(let p=t-1;p>=0&&((S.pols[p]||{}).parts||0)>k;p--)months++;return months;});
      st.partTenure=st.partTenure.slice(0,n);while(st.partTenure.length<n)st.partTenure.push(0);updateCapacity(st);
    }
    const notice=(S.W.flags.y2CurrentDealt||[]).some(id=>id.startsWith('minwage')||id.startsWith('rival_open'));
    if(notice||(S.W.flags.omen&&!S.W.flags.omenOpened&&S.W.flags.omen.at===t))S.W.flags.y2HiringUntil=t+V('hiringPressureMonths');
    if(t===36){const card=SIM.cards.byId.chain_hire,out=SIM.decide.resolve(card,'notice',S.W,Y.stream(S.W,'card:chain_hire'));S.W.flags.y2ChainHiring=out.id==='hiring';if(S.W.flags.y2ChainHiring)S.W.flags.y2HiringUntil=39;}
    S.W.flags.y2Departures=departures(S.W,t,pol);
  };
  Y.cards.add({id:'chain_hire',title:'近くのチェーン店の求人',scope:[],automatic:true,when:()=>false,options:[{id:'notice',label:'春の求人状況を確かめる',outcomes:[{id:'hiring',w:100*V('chainHiring'),label:'近くに大きなチェーン店が開き、人を集めている（4〜6月）',fx:W=>{W.flags.y2ChainHiring=true;W.flags.y2HiringUntil=39;}},{id:'quiet',w:100*(1-V('chainHiring')),label:'うわさの出店は今春にはなかった',fx:W=>{W.flags.y2ChainHiring=false;}}]}]});
  Y.extraCarry.push((S,t)=>[
    ...(t===36?[{id:'chain_hire',option:'notice',t:t-1}]:[]),
    ...((S.W.flags.y2Recruiting || []).length?[{id:'staff_hire',option:'hire',t:t-1}]:[]),
    ...((S.W.flags.y2Departures || []).length?[{id:'staff_leave',option:'leave',t:t-1}]:[])
  ]);
  const prior=Y.afterPlan;
  Y.afterPlan=(S,t,r)=>{if(prior)prior(S,t,r);r.res.departures=(S.W.flags.y2Departures || []).map(x=>({...x}));r.res.hires=(S.W.flags.y2Recruiting || []).map(x=>({...x}));r.res.leavingPay=-((r.res.choices||[]).find(x=>x.card==='staff_leave')||{cash:0}).cash;r.res.hiringPressure=S.W.flags.y2HiringUntil>t;r.res.chainHiring=!!S.W.flags.y2ChainHiring;for(const st of S.W.stores)if(st.open!==false){st.partTenure||=[];while(st.partTenure.length<st.parts)st.partTenure.push(0);st.partTenure=st.partTenure.map(n=>n+1);}};
  Y.extraEvents.push(t=>t<12?[]:[{t:'doc',id:`staff-left-pay@${t}`,kind:'leaving_salary',when:S=>(((S.res||{})[t]||{}).departures||[]).length>0,doc:{type:'退職時の精算書',title:'月の途中まで働いた人の給料',from:'経理',to:'経理',date:`${Y.MON[t%12]}月`,rows:S=>[['半月分の給与精算',-((((S.res||{})[t]||{}).choices||[]).find(x=>x.card==='staff_leave')||{cash:0}).cash,'amt'],['メモ','残りの期間は店主が穴を埋め、来月の作戦の時間が1つ減る。']]},ans:S=>{const a=-((((S.res||{})[t]||{}).choices||[]).find(x=>x.card==='staff_leave')||{cash:0}).cash;return Y.je([['給料',a]],[['普通預金',a]]);},opts:Y.opts('給料')},{t:'doc',id:`staff-cost@${t}`,kind:'staff_cost',when:S=>(((S.res || {})[t] || {}).hires || []).length>0,
    doc:{type:'請求書・支払控え',title:'欠員を補う求人と教育の委託',from:'まちの人材サービス',to:'経理',date:`${Y.MON[t%12]}月`,rows:S=>[['補充した人数',(((S.res || {})[t] || {}).hires || []).length],['1人につき求人・教育の手配',COEF.recruit.v,'amt'],['メモ','先月の欠員を補い、同じ人数に戻す']]},
    ans:S=>{const n=(((S.res || {})[t] || {}).hires || []).length*COEF.recruit.v;return Y.je([['支払手数料',n]],[['普通預金',n]]);},opts:Y.opts('支払手数料')}]);
  Y.people={coef:COEF,departures,updateCapacity};
})(typeof window!=='undefined'?window:globalThis);
