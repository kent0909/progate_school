// 開業器材を特定して売却する。新しい器材や追加のコンロは混ぜない。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2,BK=SIM.y2books,{doc,choice,Y1calc}=Y.cards.helpers;
  const COEF={
    resale:{v:150000,lo:100000,hi:200000,source:'取りまとめ役の仮の置き値（PR #2 6383740484）'},
    storage:{v:5000,lo:3000,hi:8000,source:'取りまとめ役の仮の置き値（PR #2 6383823471）'},
    spareLoss:{v:0.5,lo:0.4,hi:0.6,source:'取りまとめ役の仮の置き値（PR #2 6383823471）'},
  };
  const originalCost=S=>{const row=(S.T || []).find(e=>e.ev==='equip');return row?BK.balance([row],'備品'):600000;};
  const soldAt=S=>S.W&&S.W.flags.y2OldSold;
  // 台帳の元資料は開業の取得仕訳と5年定額法の資料。取得から処分月まで使用。
  const ledger=(S,t)=>{const cost=originalCost(S),end=soldAt(S)==null?t:Math.min(t,soldAt(S));return [{assetId:'opening-equipment',cost},{assetId:'opening-equipment',depreciation:Math.min(cost,Math.round(cost/60*(end+1)))}];};
  const value=(S,t)=>BK.assetValue(ledger(S,t),'opening-equipment');
  const currentDep=(S,t)=>Math.round(originalCost(S)/60*(t%12+1));
  const sale=Y.cards.add({id:'maintain_replace',title:'開業の器材を売る？ 予備に残す？',scope:['s-sale'],when:W=>W.y===3&&W.m===9,
    talk:[['eigyo','新しい器材が入りました。開業時の器材は買い取れます。残すなら、保管と点検のお金が毎月かかります。']],
    intro:{t:'discover',id:'y2-sale-name',p:'P4',moves:['マイナス-'],title:'売った器材の、使った分の札も消す',
      b1:{talk:[['shacho','15万円で売れたから、15万円のもうけだね。']]},
      b2:{q:'器材を売ったとき、売れた額だけをもうけにしてよい？',token:'売った器材',layout:'options',targets:[{id:'book',label:'まだ残っていた値打ちと比べる',ok:true},{id:'all',label:'入った額を全部もうけにする',ok:false,react:'器材の残りの値打ちは会社からなくなるね。'}],reasons:[{t:'代金を受け取り、器材を手放すから',ok:true},{t:'現金が入れば全部売上だから',ok:false,react:'もっていた資産をお金に替えたんだね。'}],hints:['使った分を引いた残りは？','その器材の値段と、使った分の札は両方消す。']},
      b3:{ok:'取得価額と使った分の札を両方消し、残りの値打ちと売れた額を比べる。'},
      b4:{name:'固定資産売却損・固定資産売却益',line:'売れた額が帳簿価額より少なければ「固定資産売却損」、多ければ「固定資産売却益」。手放した器材の減価償却累計額も、借方に書いて消す。',teaches:['固定資産売却損','固定資産売却益'],exam:'備品を売却し、代金を普通預金に入金した。',leaf:{p:'P4',label:'資産を手放す'}},hand:'取得価額と、使った分の合計を区別して、売却の損益を計算する。'},
    options:[{id:'sell',label:'売って新しい器材へまとめる',desc:'売却代金が入る。故障に備える予備はなくなる。',outcomes:[{id:'sold',w:100,label:'開業の器材を売却した',flow:'invest',cash:COEF.resale.v,fx:W=>{W.flags.y2OldSold=W.t;W.flags.y2Spare=false;}}]},{id:'keep',label:'予備として残す',desc:'保管と点検に月5,000円。故障の休業損を半減。この先、店を改装するか業態を変えるなら、器材として使える。',outcomes:[{id:'kept',w:100,label:'予備の器材を保管する',fx:W=>{W.flags.y2Spare=true;}}]}],
    resultCalcs:t=>[Y1calc(`sale-gain@${t}`,['s-sale'],'器材を売ると、いくらの損益？',S=>{const a=value(S,t);return [['買った値段',a.cost],['使った分の合計',a.accumulated],['買い取りの見積り',COEF.resale.v]];},'買い取り額から帳簿価額を引いた損益は？（損はマイナス）',S=>COEF.resale.v-value(S,t).book,'買った値段をそのまま売却額と比べず、使った分を引いた帳簿価額と比べる。')],
    docs:t=>[
      {...doc('sale-depreciation','売却月まで使った分',S=>[['今年使った月数',t%12+1],['今年使った分',currentDep(S,t),'amt']],S=>Y.je([['減価償却費',currentDep(S,t)]],[['備品減価償却累計額',currentDep(S,t)]]),['減価償却費','備品減価償却累計額']),when:S=>choice(S,'maintain_replace',t-1,'keep')==='sell'},
      {...doc('sale','器材の売却・通帳と固定資産台帳',S=>{const a=value(S,t);return [['取得価額',a.cost,'amt'],['これまで使った分',a.accumulated,'amt'],['お預け入れ',COEF.resale.v,'amt']];},S=>{const a=value(S,t),gain=COEF.resale.v-a.book;return Y.je([['普通預金',COEF.resale.v],['備品減価償却累計額',a.accumulated],...(gain<0?[['固定資産売却損',-gain]]:[])],[['備品',a.cost],...(gain>0?[['固定資産売却益',gain]]:[])]);},['備品','備品減価償却累計額','固定資産売却損','固定資産売却益']),when:S=>choice(S,'maintain_replace',t-1,'keep')==='sell'}
    ]});
  Y.cards.add({id:'spare_storage',title:'予備器材の保管と点検',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'保管と点検の代金を払う',outcomes:[{id:'paid',w:100,label:'予備器材の保管と点検',cash:-COEF.storage.v}]}]});
  Y.extraCarry.push((S,t)=>!['renovate','format'].includes(choice(S,'close',t-1,''))&&(S.W.flags.y2Spare||choice(S,'maintain_replace',t-1,'')==='keep')?[{id:'spare_storage',option:'pay',t:t-1}]:[]);
  Y.extraEvents.push(t=>t<30?[]:[{...doc('spare-storage','予備器材の保管・点検の支払',()=>[['今月の支払',COEF.storage.v,'amt']],()=>Y.je([['支払手数料',COEF.storage.v]],[['普通預金',COEF.storage.v]]),['支払手数料']),id:`spare-storage@${t}`,when:S=>(((S.res || {})[t] || {}).carried || []).some(x=>x.card==='spare_storage')}]);
  // 開業器材と1年目の追加コンロの定額法を翌年にも継続する。
  const annual=S=>(soldAt(S)==null?originalCost(S)/5:0)+(((S.cardOutcomes || []).some(x=>x.card==='maintain'&&x.option==='new'))?300000/5:0);
  Y.adjustments.push(y=>y<2?[]:[{...doc('old-equipment-dep','引き続き使っている器材の、今年使った分',S=>[['開業器材と1年目の追加コンロ・今年の分',annual(S),'amt'],['条件','取得時の5年定額法を継続。売却した開業器材は売却月に精算済み。']],S=>Y.je([['減価償却費',annual(S)]],[['備品減価償却累計額',annual(S)]]),['減価償却費','備品減価償却累計額']),id:`old-equipment-dep${y}`,when:S=>annual(S)>0}]);
  Y.sale={coef:COEF,ledger,value,currentDep};
})(typeof window!=='undefined'?window:globalThis);
