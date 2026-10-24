// 物販の残りは仕入月を含め3か月販売。3月末の評価損は帳簿だけで、お金をもう一度引かない。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2,{doc}=Y.cards.helpers,C=Y.cards.coef;
  const batches=W=>W.flags.y2ItemBatches||[];
  const live=W=>batches(W).filter(b=>b.remaining>0&&W.t>b.at&&W.t<b.at+C.itemStockMonths.v);
  const count=W=>live(W).reduce((n,b)=>n+b.remaining,0);
  Y.cards.add({id:'items_stock_sale',title:'先月から並べている鉢の販売',scope:['s-taiwitsu'],automatic:true,when:()=>false,options:[{id:'sell',label:'残っている商品から売る',outcomes:Array.from({length:13},(_,i)=>i+6).map(demand=>({id:`d${demand}`,w:100/13,label:`今月の需要は${demand}個。残っている鉢から売れた`,cash:W=>Math.min(count(W),demand)*C.itemPrice.v,fx:W=>{let need=demand;for(const b of live(W)){const sold=Math.min(b.remaining,need);b.remaining-=sold;need-=sold;}}}))}]});
  Y.extraCarry.push((S,t)=>count(S.W)>0?[{id:'items_stock_sale',option:'sell',t:t-1}]:[]);
  const sold=(S,t)=>Math.round(((((S.res||{})[t]||{}).choices||[]).find(x=>x.card==='items_stock_sale')||{cash:0}).cash/C.itemPrice.v);
  Y.extraEvents.push(t=>t<12?[]:[{...doc('items-stock-sale','前の月から並べている鉢のレジ記録',S=>[['売れた個数',sold(S,t)],['1個の売価',C.itemPrice.v,'amt'],['1個の仕入原価',C.itemCost.v,'amt']],S=>Y.je([['普通預金',sold(S,t)*C.itemPrice.v],['売上原価',sold(S,t)*C.itemCost.v]],[['売上',sold(S,t)*C.itemPrice.v],['商品',sold(S,t)*C.itemCost.v]]),['商品','売上原価']),id:`items-stock-sale@${t}`,when:S=>sold(S,t)>0}]);
  const prior=Y.afterPlan;
  Y.afterPlan=(S,t,r)=>{if(prior)prior(S,t,r);let lost=0;for(const b of batches(S.W))if(t===b.at+C.itemStockMonths.v-1){lost+=b.remaining;b.remaining=0;b.expired=true;}r.res.itemsWriteDown=lost*C.itemCost.v;};
  Y.adjustments.push(y=>[{
    ...doc('items-stock-value','3月31日・3か月並べた鉢の残りの評価',S=>[['仕入原価から減らす額',((S.res||{})[y*12-1]||{}).itemsWriteDown||0,'amt'],['資料の条件','仕入月を含め3か月たった残りは、売れる値段0円として評価する。']],S=>{const a=((S.res||{})[y*12-1]||{}).itemsWriteDown||0;return Y.je([['商品評価損',a]],[['商品',a]]);},['商品評価損','商品']),id:`items-stock-value${y}`,when:S=>(((S.res||{})[y*12-1]||{}).itemsWriteDown||0)>0
  }]);
  Y.itemsStock={live,count};
})(typeof window!=='undefined'?window:globalThis);
