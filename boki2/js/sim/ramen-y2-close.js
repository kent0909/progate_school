// 支店の3か月赤字から、閉店・改装・商品変更・継続を選ぶ。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2,BK=SIM.y2books,C=SIM.coef,{doc,choice,Y1calc}=Y.cards.helpers;
  const COEF={restoration:{v:300000,lo:200000,hi:400000,source:'取りまとめ役の仮の置き値（PR #2 6383740484）'},renovation:{v:0.5,lo:0.5,hi:0.5,source:'e.4・取りまとめ役承認6383718639。元の内装工事費の半分'},prototype:{v:30000,lo:30000,hi:30000,source:'e.4・取りまとめ役承認6383718639'}};
  const branch=W=>W.stores&&W.stores[1];
  const eligible=W=>W.y===3&&[6,10].includes(W.m)&&(!W.stores||(branch(W)&&branch(W).open!==false&&(branch(W).lossMonths||0)>=3));
  const originalCost=S=>{const e=(S.T||[]).find(e=>/^site2-doc2@/.test(e.ev||''));return e?BK.balance([e],'建物'):C('fitout');};
  const value=S=>{
    const st=S.W&&branch(S.W),from=st?(st.fitoutAt==null?st.openedAt:st.fitoutAt):19;
    const cost=st&&st.fitoutCost!=null?st.fitoutCost:originalCost(S), rows=Object.entries(S.res||{}).filter(([t])=>+t>=from).map(([t,r])=>({t:+t,dep:r.stores&&r.stores[1]?r.stores[1].dep||0:0}));
    const accumulated=rows.reduce((n,r)=>n+r.dep,0),y=S.W?S.W.y:3;
    return {cost,accumulated,book:cost-accumulated,current:rows.filter(r=>Math.floor(r.t/12)+1===y).reduce((n,r)=>n+r.dep,0),from};
  };
  const quote=S=>S.W&&S.W.flags.y2CloseQuote||value(S);
  const snapshot=(W,kind)=>{W.flags.y2CloseResult={...W.flags.y2CloseQuote,kind,at:W.t};};
  Y.cards.add({id:'close',title:'赤字が3か月続いた2号店を、どうする？',scope:['s-sale','s-honshiten'],when:eligible,
    talk:[['shacho','店ごとのもうけを見よう。閉める費用も、続ける費用もある。']],
    intro:{t:'discover',id:'y2-disposal-name',p:'P4',moves:['マイナス-'],title:'使わなくなった内装の札を片付ける',
      b1:{talk:[['shacho','店を閉めれば、内装の残りの値打ちはなかったことにできる？']]},
      b2:{q:'使わなくなった内装に、まだ値打ちが残っている。帳簿では？',token:'手放す内装',layout:'options',targets:[{id:'loss',label:'残っていた値打ちを損失にする',ok:true},{id:'leave',label:'内装の札をずっと残す',ok:false,react:'もう会社で使える内装ではなくなるね。'}],reasons:[{t:'使えない資産の値打ちを失うから',ok:true},{t:'支払う現金だけが損失だから',ok:false,react:'以前払って残していた資産の値打ちも失うね。'}],hints:['取得価額から使った分を引く。','内装の札と、その使った分の札を両方消す。']},
      b3:{ok:'取得価額と使った分を消すと、残っていた値打ちが損失になる。'},
      b4:{name:'固定資産除却損',line:'使うのをやめた資産を帳簿から除き、残っていた帳簿価額を損失にする札が「固定資産除却損」。使った分の減価償却累計額は借方に書いて消す。',teaches:['固定資産除却損'],exam:'使わなくなった建物を除却した。',leaf:{p:'P4',label:'使わなくなった資産'}},hand:'残っていた資産の値打ちと、別に支払う工事代を分ける。'},
    options:[
      {id:'close',label:'2号店を閉める',desc:'家賃と人の費用がなくなる。内装を手放し、原状回復を払う。',outcomes:[{id:'closed',w:100,label:'2号店を閉め、保証金が返った',flow:'invest',cash:()=>C('deposit'),fx:W=>{snapshot(W,'close');branch(W).open=false;}}]},
      {id:'renovate',label:'改装して立て直す',desc:'元の内装を除き、半額の工事を行う。品質か処理量を選ぶ。',outcomes:[{id:'renovated',w:100,label:'新しい内装へ替えた',flow:'invest',cash:()=>-C('fitout')*COEF.renovation.v,fx:W=>{snapshot(W,'renovate');const st=branch(W);st.fitoutCost=C('fitout')*COEF.renovation.v;st.fitoutAt=W.t;Y.equipment.improve(st,W.flags.y2CloseImprove||'quality');}}]},
      {id:'format',label:'一杯と看板を変える',desc:'試作3万円。別の一杯と看板を選び直す。',outcomes:[{id:'changed',w:100,label:'2号店の一杯を変えた',cash:-COEF.prototype.v,fx:W=>{snapshot(W,'format');const st=branch(W),p=SIM.bowl.presets.find(p=>p.id===W.flags.y2CloseBowl)||SIM.bowl.presets[0];st.bowl=SIM.bowl.create(p.spec,p.name);st.Q=SIM.bowl.Q(st.bowl,st);const s=W.flags.y2CloseSign||'none';st.sign=s==='later'?'large':s;st.signAt=W.t+(s==='later'?12:0);st.signA=0;}}]},
      {id:'stick',label:'今の形で粘る',desc:'追加工事や閉店の支出はない。赤字が続く危険を引き受ける。',outcomes:[{id:'stayed',w:100,label:'今の形で続ける'}]}
    ],
    extra:t=>[
      {t:'decision',id:`close-improve@${t}`,when:S=>choice(S,'close',t,'')==='renovate',q:'改装では何を優先する？',options:[{id:'quality',label:'品質を安定させる',desc:'品質を0.2高める。',result:'品質を優先する。'},{id:'capacity',label:'多くの杯数を回す',desc:'1日10杯分の処理量を増やす。',result:'処理量を優先する。'}]},
      {t:'decision',id:`close-bowl@${t}`,optionsFor:S=>SIM.bowl.presets.filter(p=>JSON.stringify(p.spec)!==JSON.stringify(S.W.stores[1].bowl.spec)).map(p=>({id:p.id,label:p.name,desc:p.say,result:p.name+'へ替える。'})),when:S=>choice(S,'close',t,'')==='format',q:'2号店の新しい一杯は？',options:SIM.bowl.presets.map(p=>({id:p.id,label:p.name,desc:p.say,result:p.name+'へ替える。'}))},
      {t:'decision',id:`close-sign@${t}`,when:S=>choice(S,'close',t,'')==='format',q:'2号店の看板は？',options:[['none','付けない'],['small','小さな看板'],['large','大きな看板'],['later','大きな看板を1年後に']].map(([id,label])=>({id,label,desc:id==='small'?'10万円':id==='none'?'看板の支出なし':'50万円と月2,500円。許可が遅れる場合もある。',result:label+'を選んだ。'}))}
    ],
    docs:t=>[
      {...doc('josekison','内装を手放す前の、今年使った分',S=>[['今年使った分',quote(S).current,'amt']],S=>Y.je([['減価償却費',quote(S).current]],[['建物減価償却累計額',quote(S).current]]),['減価償却費','建物減価償却累計額']),when:S=>['close','renovate'].includes(choice(S,'close',t-1,''))},
      {...doc('josekison','手放した内装の固定資産台帳',S=>{const a=quote(S);return [['取得価額',a.cost,'amt'],['これまで使った分',a.accumulated,'amt'],['残っていた値打ち',a.book,'amt']];},S=>{const a=quote(S);return Y.je([['建物減価償却累計額',a.accumulated],['固定資産除却損',a.book]],[['建物',a.cost]]);},['建物','建物減価償却累計額','固定資産除却損']),when:S=>['close','renovate'].includes(choice(S,'close',t-1,''))},
      {...doc('deposit-return','2号店の保証金の返還',()=>[['返還額',C('deposit'),'amt']],()=>Y.je([['普通預金',C('deposit')]],[['差入保証金',C('deposit')]]),['差入保証金']),when:S=>choice(S,'close',t-1,'')==='close'},
      {...doc('new-fitout','新しい内装の工事代',()=>[['工事代',C('fitout')*COEF.renovation.v,'amt']],()=>Y.je([['建物',C('fitout')*COEF.renovation.v]],[['普通預金',C('fitout')*COEF.renovation.v]]),['建物']),when:S=>choice(S,'close',t-1,'')==='renovate'},
      {...doc('format-prototype','2号店の新しい一杯の試作費',()=>[['試作費',COEF.prototype.v,'amt']],()=>Y.je([['研究開発費',COEF.prototype.v]],[['普通預金',COEF.prototype.v]]),['研究開発費']),when:S=>choice(S,'close',t-1,'')==='format'}
    ]});
  Y.cards.add({id:'close_restore',title:'退去する店の原状回復',automatic:true,scope:[],when:()=>false,options:[{id:'pay',label:'原状回復の工事代を払う',outcomes:[{id:'paid',w:100,label:'原状回復を終えた',cash:-COEF.restoration.v}]}]});
  Y.extraCarry.push((S,t)=>choice(S,'close',t-1,'')==='close'?[{id:'close_restore',option:'pay',t:t-1}]:[]);
  Y.extraEvents.push(t=>t<24?[]:[{...doc('restoration','退去時の原状回復の請求書',()=>[['原状回復工事',COEF.restoration.v,'amt']],()=>Y.je([['修繕費',COEF.restoration.v]],[['普通預金',COEF.restoration.v]]),['修繕費']),id:`close-restore@${t}`,when:S=>choice(S,'close',t-1,'')==='close'}]);
  const before=Y.beforePlan;Y.beforePlan=(S,t,pol)=>{before(S,t,pol);S.W.flags.y2CloseQuote=value(S);S.W.flags.y2CloseImprove=choice(S,'close-improve',t-1,'quality');S.W.flags.y2CloseBowl=choice(S,'close-bowl',t-1,'shoyu');S.W.flags.y2CloseSign=choice(S,'close-sign',t-1,'none');};
  const after=Y.afterPlan;Y.afterPlan=(S,t,r)=>{if(after)after(S,t,r);const st=branch(S.W),sr=r.res.stores&&r.res.stores[1];if(st&&st.open!==false&&sr)st.lossMonths=sr.op<0?(st.lossMonths||0)+1:0;};
  Y.fitoutAnnual=(S,y)=>{const normal=Object.entries(S.res||{}).filter(([t])=>Math.floor(+t/12)+1===y).reduce((n,[,r])=>n+(r.dep||0),0);const booked=(S.T||[]).filter(e=>(e.y||1)===y&&/^close-doc0@/.test(e.ev||'')).reduce((n,e)=>n+BK.balance([e],'減価償却費'),0);return normal-booked;};
  Y.close={coef:COEF,value,eligible};
})(typeof window!=='undefined'?window:globalThis);
