// 設備の種類と買い方は別の判断。取得価額・支払・償却を同じ資料へつなぐ。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2,C=SIM.coef,je=Y.je;
  const {doc,choice,Y1calc}=Y.cards.helpers,add=Y.cards.add;
  const COEF={
    newCost:{v:1200000,lo:1200000,hi:1200000,source:'e.4・取りまとめ役承認6383425858'},
    usedCost:{v:600000,lo:600000,hi:600000,source:'e.4・取りまとめ役承認6383425858'},
    quality:{v:0.2,lo:0.2,hi:0.2,source:'e.4・取りまとめ役承認6383665670'},
    capacity:{v:10,lo:10,hi:10,source:'e.4・取りまとめ役承認6383665670。杯/日'},
    terms:{v:24,lo:24,hi:24,source:'e.4・取りまとめ役承認6383425858。分割回数'},
    installment:{v:55000,lo:55000,hi:55000,source:'e.4・取りまとめ役承認6383425858。新品1回の支払'},
    depreciation:{v:0.4,lo:0.4,hi:0.4,source:'e.4・取りまとめ役承認6383425858。問題資料の償却率'},
  };
  const quote=W=>W.flags.y2EquipmentQuote || {kind:'quality',cost:1200000};
  const asset=S=>S.W&&S.W.flags.y2Equipment || {kind:'quality',cost:1200000,at:26,method:'installment',remaining:1200000};
  const improve=(st,kind)=>{if(kind==='quality')st.Q=SIM.bowl.Q(st.bowl,st)+0.2;if(kind==='capacity')st.equipmentCapacity=(st.equipmentCapacity || 0)+10;};
  add({id:'equip',title:'新しい器材は、何を優先する？',scope:['s-dep-rate'],when:W=>W.y===3&&W.m===4,
    talk:[['eigyo','味を安定させる器材か、たくさん回せる器材か。中古なら安く買えます。']],
    options:[['quality','品質を優先する新品',1200000],['capacity','処理量を優先する新品',1200000],['used','中古を選ぶ',600000]].map(([id,label,cost])=>({id,label,desc:`現金で買う価格${cost.toLocaleString()}円。支払方法は次に比べる。`,outcomes:[{id:'quoted',w:100,label:'この種類の見積りを受け取った',fx:W=>{W.flags.y2EquipmentQuote={kind:id,cost};}}]}))});
  const acquire=(W,method)=>{const q=quote(W);W.flags.y2Equipment={...q,method,at:W.t,remaining:method==='cash'?0:q.cost,paid:0};improve(W.stores[0],q.kind);};
  const canBorrow=(S,t)=>Array.from({length:Y.cards.coef.bankMonths.v},(_,i)=>((S.res||{})[t-i]||{}).op||0).reduce((a,b)=>a+b,0)>0;
  const finance=add({id:'finance_asset',title:'器材の代金を、どう用意する？',scope:['s-kappu'],when:W=>W.y===3&&W.m===5,
    talk:[['shacho','一度に払うと口座が薄くなる。分けると、総額が増えるんだね。']],
    options:[{id:'cash',label:'口座から一括で払う',desc:'利息はない。使える現金が一度にへる。',outcomes:[{id:'bought',w:100,label:'一括で買った',flow:'invest',cash:W=>-quote(W).cost,fx:W=>acquire(W,'cash')}]},{id:'installment',label:'24回に分けて払う',desc:'新品は月55,000円。現金価格との差を24回に分ける。',outcomes:[{id:'bought',w:100,label:'翌月から分けて払う約束で買った',flow:'invest',cash:0,fx:W=>acquire(W,'installment')}]},{id:'loan',label:'同じ借入先から借りて、一括で買う',desc:'元本は24回で返す。借入の残りに利息がかかる。',outcomes:[{id:'borrowed',w:100,label:'借りたお金で買った',flow:'capital',cash:W=>quote(W).cost,fx:W=>{W.loan+=quote(W).cost;acquire(W,'loan');}}]}],
    trial:(S,id)=>{const q=quote(S.W||SIM.world.create({seed:S.seed||0}));return [['現金価格',q.cost],['受け取る月に口座から出す額',id==='cash'?q.cost:0],['これから払う元本と代金',id==='cash'?0:q.cost],['支払の条件',id==='installment'?'24回。利息総額は現金価格の10%':id==='loan'?'元本24回。銀行の見積りは年'+(C('loanRate')*100)+'%、借入の残りに掛かる':'まとめて払い、利息はない']];},
    optionsFor:(S,t)=>finance.options.map(o=>({...o,disabled:o.id==='loan'&&!canBorrow(S,t),desc:o.id==='loan'&&!canBorrow(S,t)?'銀行：最近の利益が足りない':o.desc})),
    calcs:t=>[Y1calc(`kappu-interest@${t}`,['s-kappu'],'分けて払うと、総額はいくら増える？',S=>{const q=S.W?quote(S.W):{cost:1200000};return [['現金価格',q.cost],['1回の支払（見積書）',q.cost/1200000*55000],['回数',24]];},'分割の支払総額から現金価格を引くと、利息の総額はいくら？',S=>(S.W?quote(S.W).cost:1200000)/10,'利息の総額を支払回数に均等に分けて、その月の費用にする。')],
    docs:t=>[
      doc('kappu','器材の納品書・支払方法の契約書',S=>{const a=asset(S);return [['現金価格',a.cost,'amt'],['支払方法',a.method==='installment'?'24回の後払い':a.method==='loan'?'借入後に一括':'一括'],['分割の場合の支払総額',a.cost*1.1,'amt']];},S=>{const a=asset(S);return a.method==='installment'?je([['備品',a.cost],['前払利息',a.cost/10]],[['長期未払金',a.cost*1.1]]):je([['備品',a.cost]],[['普通預金',a.cost]]);},['備品','前払利息','長期未払金']),
      {...doc('equipment-loan','追加借入の通帳',S=>[['お預け入れ',asset(S).cost,'amt']],S=>je([['普通預金',asset(S).cost]],[['借入金',asset(S).cost]]),['借入金']),when:S=>asset(S).method==='loan'}
    ]
  });
  add({id:'equipment_purchase',title:'借入で用意した器材代の支払',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'納品された器材の代金を払う',outcomes:[{id:'paid',w:100,label:'器材代を支払った',flow:'invest',cash:W=>-quote(W).cost}]}]});
  add({id:'equipment_principal',title:'器材の元本の支払',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'約束の元本を払う',outcomes:[{id:'paid',w:100,label:'元本の残りがへった',flow:'capital',cash:W=>-Math.min(W.flags.y2Equipment.remaining,W.flags.y2Equipment.cost/24),fx:W=>{const a=W.flags.y2Equipment,p=Math.min(a.remaining,a.cost/24);a.remaining-=p;a.paid++;if(a.method==='loan')W.loan=Math.max(0,W.loan-p);}}]}]});
  add({id:'equipment_interest',title:'分割の利息の支払',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'今月の利息を払う',outcomes:[{id:'paid',w:100,label:'今月の利息を支払った',cash:W=>-W.flags.y2Equipment.cost/240}]}]});
  Y.extraCarry.push((S,t)=>{
    const out=[],a=S.W.flags.y2Equipment;
    if(choice(S,'finance_asset',t-1,'')==='loan')out.push({id:'equipment_purchase',option:'pay',t:t-1});
    if(a&&a.remaining>0&&t>a.at){out.push({id:'equipment_principal',option:'pay',t:t-1});if(a.method==='installment')out.push({id:'equipment_interest',option:'pay',t:t-1});}
    return out;
  });
  const dep=S=>{const a=asset(S);return Math.round(a.cost*0.4*(36-a.at)/12);};
  Y.adjustments.push(y=>y===3?[
    {t:'talk',id:'y2-rate-name',teaches:['償却','償却率'],lines:[['senpai','設備の使った分を費用にすることを「償却」という。残った値打ちに掛ける割合が「償却率」。買った年は、取得価額に率を掛け、使った月数に分ける。']]},
    {...Y1calc('dep-rate@35',['s-dep-rate'],'今年使った器材の分を計算する',S=>{const a=asset(S);return [['取得価額',a.cost],['資料の償却率',0.4],['使用した月数',36-a.at],['1年の月数',12]];},'取得価額に償却率を掛け、今年使った月数の分にするといくら？',dep,'買った年は取得価額から始める。次の年は、使った分を引いた残りに率を掛ける。'),when:S=>!!(S.W&&S.W.flags.y2Equipment)},
    {...doc('dep-rate','器材の償却・今年使った期間の資料',S=>[['取得価額',asset(S).cost,'amt'],['償却率',0.4],['使用月数',36-asset(S).at]],S=>je([['減価償却費',dep(S)]],[['備品減価償却累計額',dep(S)]]),['減価償却費','備品減価償却累計額']),id:'equip-doc0@35',card:'equip',scope:['s-dep-rate'],when:S=>!!(S.W&&S.W.flags.y2Equipment)}
  ]:[]);
  Y.extraEvents.push(t=>t<27?[]:[
    {...doc('equipment-payment','器材の今月の支払',S=>{const a=asset(S);return [['元本',a.cost/24,'amt'],['分割払いのときの利息',a.method==='installment'?a.cost/240:0,'amt']];},S=>{const a=asset(S),p=a.cost/24;return a.method==='installment'?je([['長期未払金',p+a.cost/240]],[['普通預金',p+a.cost/240]]):je([['借入金',p]],[['普通預金',p]]);},['長期未払金','借入金']),id:`equipment-pay@${t}`,when:S=>(((S.res || {})[t] || {}).carried || []).some(x=>x.card==='equipment_principal')},
    {...doc('equipment-interest','分割の利息を今月の費用へ',S=>[['利息の総額',asset(S).cost/10,'amt'],['回数',24]],S=>je([['支払利息',asset(S).cost/240]],[['前払利息',asset(S).cost/240]]),['支払利息','前払利息']),id:`equipment-interest@${t}`,when:S=>(((S.res || {})[t] || {}).carried || []).some(x=>x.card==='equipment_interest')}
  ]);
  Object.assign(SIM.namings,{
    前払利息:{q:'分割の契約に含まれる利息。全部を買った月の費用にする？',opts:[{t:'支払う期間に分けて費用にする',ok:true},{t:'全部を買った月の費用にする',react:'支払を待ってもらう期間は、来月以降にも続くね。'}],line:'あとで期間に分けて費用にする利息を「前払利息」の札に置く。',teaches:['前払利息']},
    長期未払金:{q:'器材を受け取り、代金を2年かけて払う約束。どの棚？',opts:[{t:'返す約束の棚',ok:true},{t:'株主から集めたお金の棚',react:'売った会社に代金を払う約束だね。'}],line:'設備などの代金で、支払期限が1年を超える約束は「長期未払金」。',teaches:['長期未払金']}
  });
  Y.equipment={coef:COEF,quote,asset,improve,dep,canBorrow};
})(typeof window!=='undefined'?window:globalThis);
