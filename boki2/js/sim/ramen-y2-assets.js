// 設備と、翌年まで残る約束。PR #2で承認した金額・期間を問題の資料にも出す。
(function(g){
  'use strict';
  const SIM=g.SIMDATA,Y=SIM.y2,BK=SIM.y2books,C=SIM.coef;
  const {doc,amount,choice,Y1calc}=Y.cards.helpers,add=Y.cards.add,je=Y.je;
  const COEF={
    failure:{v:30,lo:20,hi:40,source:'取りまとめ役の仮の置き値（PR #2 6383831532）。故障確率%'},
    closedDays:{v:3,lo:2,hi:5,source:'取りまとめ役の仮の置き値（PR #2 6383831532）。休業日数、月26営業日'},
    bonus:{v:60000,lo:60000,hi:60000,source:'版1.2.1の取りまとめ役承認6383573548・e.5。1人・12月〜5月・6月払い'},
    repairReserve:{v:240000,lo:240000,hi:240000,source:'版1.2.1の取りまとめ役承認6383425858・e.3。当期負担分24万円'},
    repairActual:{v:260000,lo:260000,hi:260000,source:'版1.2.1の取りまとめ役承認6383425858・e.3。実施時26万円'},
  };
  const parts=W=>W.stores.filter(s=>s.open!==false).reduce((n,s)=>n+s.parts,0);
  const reserveIntro=(id,title,cause,terms,line)=>({t:'discover',id,p:'P3',moves:['費用+','負債+'],title,
    b1:{talk:[['shacho',cause],['senpai','払う日と、何のための支出かを分けて考えよう。']]},
    b2:{q:'今年の働きや使用が原因で、あとで払う見込みがある。どの年に負担を残す？',token:'今年が原因の負担',layout:'options',targets:[{id:'now',label:'今年の分を、今年に見積もる',ok:true},{id:'paid',label:'払う年に全部入れる',ok:false,react:'払う日が遅くても、今年の働きや使用が原因の分は今年だね。'}],reasons:[{t:'今年の売上のために働いてもらったり、使ったりした分だから',ok:true},{t:'銀行から引き落とされた日だけを見れば、全部の費用が分かるから',ok:false,react:'払う日と、どの年の負担かは同じとは限らない。'}],hints:['原因になったのは今年？来年？','払う日だけで決めると、今年の費用は小さく見えない？']},
    b3:{ok:'今年に原因がある負担を見積もる。払うときは、見積もっていた札を取り崩す。'},
    b4:{name:terms.join('・'),line,teaches:terms,exam:'翌期に支払う額のうち、当期負担分を見積もって計上する。',leaf:{p:'P3',label:title}},hand:'将来払うだけでは足りない。今年に原因があり、支払う見込みがあり、金額を合理的に見積もれる分を今年に残す。'});
  const named=(card,k,t,e,when)=>({...e,id:`${card}-doc${k}@${t}`,card,ramenT:t,scope:Y.cards.byId[card].scope,when,doc:{...e.doc,date:`${Y.MON[t%12]}月`}});
  add({id:'bonus',title:'パートさんの夏のお礼を、約束しておく？',scope:['s-hikiate'],when:W=>W.y===3&&W.m===12,
    intro:reserveIntro('y2-bonus-name','夏に払う分も、今年の働き？','夏に払うお礼なら、今年の費用には関係ないよね。',['賞与引当金繰入','賞与引当金'],'今年の勤務分の費用を「賞与引当金繰入」、翌年の支払へ残す見積りの札を「賞与引当金」という。'),
    talk:[['shacho','来年の春、駅前に大きなチェーン店ができるかもしれない。人を集めるらしい。うわさを信じて人を守るか、店に残すお金を優先するか。']],
    options:[{id:'promise',label:'夏のお礼を約束する',desc:'12月から5月の勤務を対象に、1人6万円を6月に払う。',outcomes:[{id:'promised',w:100,label:'働く人に支給の約束を伝えた',fx:W=>{W.flags.staffBonus={kind:'promise',started:W.t};}}]},{id:'now',label:'今、1人6万円を払う',desc:'今の口座から払い、夏の支給の約束は作らない。',outcomes:[{id:'paid',w:100,label:'今までのお礼を支払った',cash:W=>-60000*parts(W),fx:W=>{W.flags.staffBonus={kind:'now',paid:W.t};}}]},{id:'none',label:'支給の約束はしない',desc:'お金を店に残し、理由を働く人に説明する。',outcomes:[{id:'none',w:100,label:'支給の約束はしなかった',fx:W=>{W.flags.staffBonus={kind:'none'};}}]}],
    docs:t=>[{...doc('bonus-now','今まで働いてもらったお礼の支払',S=>[['お引出し',-amount(S,'bonus',t,0),'amt']],S=>je([['賞与',-amount(S,'bonus',t,0)]],[['普通預金',-amount(S,'bonus',t,0)]]),['賞与']),when:S=>choice(S,'bonus',t-1,'promise')==='now'}]
  });
  add({id:'maintain_y2',title:'来春の大きな修理を、計画しておく？',scope:['s-hikiate'],when:W=>W.y===3&&W.m===2,
    intro:reserveIntro('y2-repair-name','今年使ったことが原因の修理','来春に直すなら、今年は何も残さなくていいね。',['修繕引当金繰入','修繕引当金'],'今年の使用が原因の修理を見積もる費用は「修繕引当金繰入」、支払へ残す見積りの札は「修繕引当金」。'),
    talk:[['eigyo','点検で、来春にまとまった修理が必要と分かりました。今年使ったことが原因で、見積りは24万円です。']],
    options:[{id:'plan',label:'来春の修理を計画する',desc:'今年の負担分24万円を見積もり、来春に修理する。',outcomes:[{id:'planned',w:100,label:'修理の日を決めた',fx:W=>{W.flags.y2Repair='plan';}}]},{id:'break',label:'故障したら、そのとき直す',desc:'修理の約束は作らない。予定外の修理と休業の危険が残る。',outcomes:[{id:'wait',w:100,label:'点検の記録を残し、様子を見る',fx:W=>{W.flags.y2Repair='break';}}]}]
  });
  add({id:'bonus_pay',title:'約束した夏のお礼の支払',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'支払う',outcomes:[{id:'paid',w:100,label:'約束した額を支払った',cash:W=>-60000*(W.flags.bonusCount || 0),fx:W=>{W.flags.staffBonus.paid=W.t;}}]}]});
  add({id:'repair_pay',title:'予定していた修理の実施',scope:[],automatic:true,when:()=>false,options:[{id:'pay',label:'修理を実施する',outcomes:[{id:'paid',w:100,label:'修理が終わった',cash:-260000,fx:W=>{W.flags.y2RepairPaid=true;}}]}]});
  add({id:'repair_failure',title:'春の器材の故障の確認',scope:[],automatic:true,when:()=>false,options:[{id:'check',label:'故障したら修理する',outcomes:[{id:'broken',w:30,label:'器材が故障して修理した',cash:-260000,fx:(W,fx)=>{W.flags.y2RepairBroken=true;const days=COEF.closedDays.v*(W.flags.y2Spare?SIM.y2.sale.coef.spareLoss.v:1);fx.demandMul*=1-days/26;}},{id:'ok',w:70,label:'今春は故障しなかった'}]}]});
  Y.extraCarry.push((S,t)=>{
    const out=[];
    if(t===36&&S.W.flags.y2Repair==='break')out.push({id:'repair_failure',option:'check',t:t-1});
    if(t===36&&S.W.flags.y2Repair==='plan')out.push({id:'repair_pay',option:'pay',t:t-1});
    if(t===38&&S.W.flags.staffBonus && S.W.flags.staffBonus.kind==='promise')out.push({id:'bonus_pay',option:'pay',t:t-1});
    return out;
  });
  const promised=S=>S.W && S.W.flags.staffBonus && S.W.flags.staffBonus.kind==='promise';
  const n=S=>S.res && S.res[35] ? (S.res[35].staffParts || 0) : S.W ? parts(S.W) : 1;
  Y.adjustments.push(y=>y===3?[
    named('bonus',1,35,doc('bonus-hikiate','翌6月の支給に関する資料',S=>[['3月末のパートの人数',n(S)],['1人の支給額',60000,'amt'],['対象期間','12月〜5月の6か月'],['今年の勤務分','12月〜3月の4か月']],S=>je([['賞与引当金繰入',40000*n(S)]],[['賞与引当金',40000*n(S)]]),['賞与引当金繰入','賞与引当金']),promised),
    named('maintain_y2',0,35,doc('shuzen-hikiate','点検報告・来春の修理の見積り',()=>[['修理の見積り',240000,'amt'],['今年使ったことが原因の負担分',240000,'amt'],['修理予定','翌4月']],()=>je([['修繕引当金繰入',240000]],[['修繕引当金',240000]]),['修繕引当金繰入','修繕引当金']),S=>S.W&&S.W.flags.y2Repair==='plan')
  ]:[]);
  Y.extraEvents.push(t=>{
    const out=[];
    if(t===36)out.push(named('maintain_y2',1,t,doc('shuzen-pay','修理が終わった日の請求書',()=>[['実際の修理代',260000,'amt'],['去年に見積もった分',240000,'amt'],['見積りを超えた分',20000,'amt']],()=>je([['修繕引当金',240000],['修繕費',20000]],[['普通預金',260000]]),['修繕引当金','修繕費']),S=>S.W&&S.W.flags.y2RepairPaid));
    if(t===36)out.push({...doc('repair-failure','急な故障の修理・支払の控え',()=>[['修理代',260000,'amt'],['休業','3日。予備器材があれば1.5日。']],()=>je([['修繕費',260000]],[['普通預金',260000]]),['修繕費']),id:'repair-failure@36',when:S=>!!(S.W&&S.W.flags.y2RepairBroken)});
    if(t===38)out.push(named('bonus',2,t,doc('bonus-pay','夏のお礼の支給明細',S=>[['3月末のパートの人数',n(S)],['1人の支給額',60000,'amt'],['去年の勤務分','4か月'],['今年の勤務分','2か月']],S=>je([['賞与引当金',40000*n(S)],['賞与',20000*n(S)]],[['普通預金',60000*n(S)]]),['賞与引当金','賞与']),promised));
    return out;
  });
  const before=Y.beforePlan;
  Y.beforePlan=(S,t)=>{before(S,t);if(t===36)S.W.flags.bonusCount=n(S);};
  Y.assets={coef:COEF};
  SIM.namings.賞与={q:'毎月の給料とは別に、今まで働いてもらったお礼を払った。これは？',opts:[{t:'働いてもらった分の費用',ok:true},{t:'株主に分けたお金',react:'株主へ分けたのではなく、働いた人へのお礼だね。'}],line:'毎月の給料とは別に、働いてもらったお礼として払うお金は「賞与」。',teaches:['賞与']};
})(typeof window!=='undefined'?window:globalThis);
