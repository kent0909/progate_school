// 年2以降の札。PR #2の設計回答に沿い、結果の書類はcashが動く翌月へ置く。
(function (g) {
  'use strict';
  const SIM = g.SIMDATA, Y = SIM.y2, BK = SIM.y2books;
  // 置き値（取りまとめ時にcoef.jsへ）。PR #2 / DESIGN-RAMEN e.6。
  const COEF = {
    itemStockMonths:{v:3,lo:3,hi:3,source:'取りまとめ役回答6385102972・6385248922。仕入月を含め3か月'},
    itemExpiredPrice:{v:0,lo:0,hi:0,source:'取りまとめ役回答6385102972。3か月後の売れる値段0円'},
    bonusToken:{v:20000,lo:10000,hi:30000,source:'オーナーの決定10/24・取りまとめ役回答6385119292'},
    bonusStandard:{v:60000,lo:60000,hi:60000,source:'オーナーの決定10/24・取りまとめ役回答6385119292'},
    bonusGenerous:{v:100000,lo:80000,hi:120000,source:'オーナーの決定10/24・取りまとめ役回答6385119292'},
    bonusGenerousLeave:{v:0.0075,lo:0.005,hi:0.01,source:'オーナーの決定10/24・取りまとめ役回答6385119292'},
    bonusGenerousPressure:{v:0.02,lo:0.02,hi:0.02,source:'オーナーの決定10/24・取りまとめ役回答6385119292'},
    leavingPay:{v:0.5,lo:0.4,hi:0.6,source:'取りまとめ役回答6385010670。退職月の半月分給与'},
    leavingTime:{v:1,lo:1,hi:1,source:'取りまとめ役回答6385010670。店主の穴埋めで翌月の時間を減らす'},
    chainHiring:{v:0.5,lo:0.3,hi:0.7,source:'取りまとめ役回答6384880485。春のチェーン求人の確率'},
    staffExperience:{v:0.1,lo:0.05,hi:0.15,source:'取りまとめ役回答6384822252。勤続6か月後の上限増加'},
    staffExperienceMonths:{v:6,lo:6,hi:6,source:'取りまとめ役回答6384822252'},
    hiringPressure:{v:0.08,lo:0.06,hi:0.1,source:'取りまとめ役回答6384822252。求人競争時の離職率'},
    hiringPressureMonths:{v:3,lo:3,hi:3,source:'取りまとめ役回答6384822252'},
    hiringBonusRatio:{v:0.5,lo:0.5,hi:0.5,source:'取りまとめ役回答6384822252。賞与制度による半減'},
    bankMonths:{v:3,lo:3,hi:3,source:'取りまとめ役 6384653772への回答6384658872。直近3か月の営業利益合計が正'},
    frozenOutside:{v:0.8,lo:0.7,hi:0.9,source:'取りまとめ役 6384653772への回答6384658872'},
    frozenOwn:{v:0.6,lo:0.45,hi:0.75,source:'取りまとめ役 6384653772への回答6384658872'},
    frozenPeak:{v:1.3,lo:1.15,hi:1.5,source:'取りまとめ役 6384653772への回答6384658872'},
    frozenMonths:{v:3,lo:3,hi:3,source:'取りまとめ役 6384653772への回答6384658872'},
    itemBuy:{v:[10,20],lo:10,hi:20,source:'取りまとめ役回答6383573548。仕入数の選択肢'},
    itemDemand:{v:[6,18],lo:6,hi:18,source:'取りまとめ役 6384653772への回答6384658872。仮の需要・一様'},
    initialShares: {v:300,lo:300,hi:300,source:'PR #2 6383425858：開業300万円・1株1万円'},
    issue: {v:[[500,10000],[100,30000],[50,45000],[25,88000]],lo:25,hi:500,source:'DESIGN-RAMEN e.6 issue。各組は株数・払込単価'},
  };
  Y.extraEvents = []; Y.extraCarry = []; Y.adjustments = [];
  const cards = [], byId = {}, money = n => Math.round(n).toLocaleString('ja-JP');
  const choice = (S,id,t,fallback) => (S.decisions || {})[`${id}@${t}`] || fallback;
  const je = Y.je;
  const doc = (kind,title,rows,ans,accounts) => ({t:'doc',kind,doc:{type:'取引の書類',title,from:'経理',to:'経理',rows},ans,opts:Y.opts(...accounts)});
  const amount = (S,id,t,fallback) => {const c=((S.res || {})[t] || {}).choices || [];const got=c.find(x=>x.card===id);return got ? got.cash : fallback;};
  const add = c => { c.y2 = true; c.tFrom = 12; c.fixed = true; cards.push(c); byId[c.id] = c; return c; };
  const date = t => ({t,y:Math.floor(t/12)+1,m:Y.MON[t%12]});
  const schedule = (y,m) => W => W.y >= y && W.y <= 3 && W.m === m;
  const capitalDiscovery = {t:'discover',id:'y2-capital-name',p:'P2',moves:['純資産+'],title:'株主のお金は、店のもうけ？',
    b1:{talk:[['shacho','株主からお金が入るなら、今月は大もうけだね。']]},
    b2:{q:'株主から入るお金。店で売ったお金と同じ札に入れる？',token:'株主からのお金',layout:'options',targets:[{id:'separate',label:'売ったお金とは分ける',ok:true},{id:'sales',label:'どちらも売上にする',ok:false,react:'ラーメンを売った代金ではないね。'}],reasons:[{t:'株を渡して集めたお金だから',ok:true},{t:'入った金額が大きいお金だから',ok:false,react:'金額が小さくても、株主から集めたお金は売上ではない。'}],hints:['お金の代わりに、何を渡す？','株主にはラーメンを売った？']},
    b3:{ok:'株主から集めた分と、店でかせいだ分を分けて残す。'},
    b4:{name:'資本準備金',line:'株主から集めた額のうち、資本金とは別の札に残す分が「資本準備金」。会社に残る合計のお金は変わらない。',teaches:['資本準備金'],exam:'株式を発行し、払込金のうち指定された額を資本準備金とする。',leaf:{p:'P2',label:'集めたお金の区分'}},hand:'会社に入ったお金でも、売上と株主から集めたお金は分ける。'};
  const dividendDiscovery = {t:'discover',id:'y2-dividend-name',p:'P2',moves:['純資産-'],title:'もうけを分けるのは、店の費用？',
    b1:{talk:[['shacho','株主にお金を分けたら、今年の費用が増えるね。']]},
    b2:{q:'去年までに残したもうけを株主へ分ける。何がへる？',token:'株主へ分けるお金',layout:'options',targets:[{id:'saved',label:'会社に残していたもうけ',ok:true},{id:'cost',label:'今年のラーメンの原価',ok:false,react:'ラーメンを作るために払ったお金ではないね。'}],reasons:[{t:'かせいだ後のもうけを分けるから',ok:true},{t:'現金を払えば全部費用になるから',ok:false,react:'借りたお金を返すときも、現金はへるけれど費用ではなかったね。'}],hints:['材料や人の働きと引き換えに払う？','会社に残していたもうけは、どの札だった？']},
    b3:{ok:'店でかせぐ費用とは分けて、会社に残したもうけから引く。'},
    b4:{name:'配当・株主総会',line:'会社のもうけを株主へ分けることを「配当」、株主が集まって会社の大事なことを決める場を「株主総会」という。',teaches:['配当','株主総会'],exam:'株主総会で、繰越利益剰余金を財源とする配当を決議した。',leaf:{p:'P2',label:'株主へ分けるお金'}},hand:'配当は費用ではない。準備金を会社に残し、分ける額と店に残す額を比べる。'};
  const issue = add({id:'issue',title:'次の店のため、何株を渡す？',scope:['s-stock'],when:schedule(2,4),
    talk:[['kabunushi','店を増やすなら、お金を出すことを考えています。株を少なくするほど1株は高くなりますが、出す総額は小さくなります。']],
    options:COEF.issue.v.map(([n,p])=>({id:`s${n}`,label:`${n}株・1株${money(p)}円`,desc:`集まるお金${money(n*p)}円。既存の株は300株。`,outcomes:[{id:'paid',w:100,label:'約束した額が払い込まれた',flow:'capital',cash:n*p,fx:W=>{W.flags.y2Shares=(W.flags.y2Shares || COEF.initialShares.v)+n;}}]})),
    optionsFor:S=>issue.options.map(o=>({...o,desc:`集まるお金${money(o.outcomes[0].cash)}円。今ある株は${(S.W&&S.W.flags.y2Shares)||COEF.initialShares.v}株。渡す株が多いほど既存株主の割合は小さくなる。`})),
    calcs:t=>[Y1calc(`issue-amount@${t}`,['s-stock'],'次の店へ使えるお金',S=>{const o=issue.options.find(o=>o.id===choice(S,'issue',t,'s500'));const pair=COEF.issue.v.find(x=>o.id===`s${x[0]}`);return [['渡す株数',pair[0]],['1株の値段',pair[1]]];},'払い込んでもらえる額はいくら？',S=>issue.options.find(o=>o.id===choice(S,'issue',t,'s500')).outcomes[0].cash,'株数と1株の値段を掛ける。株数の多さと、集まるお金は同じ物差しではない。')],
    extra:t=>[{t:'decision',id:`capital@${t}`,q:'受け取る額を、どちらの形で残す？',options:[{id:'all',label:'全額を資本金にする',desc:'出してもらった額を、ひとつの札に残す。',result:'受け取る全額を資本金に残す。'},{id:'half',label:'決まりの範囲で、資本準備金にも分ける',desc:'会社に残るお金の合計は同じ。使えるお金が増えるわけではない。',result:'資本金と資本準備金に分ける。合計のお金は同じ。'}]}],
    docs:t=>[doc('zoushi','新株の払込の通帳',S=>[['摘要','新しい株主からの払込み'],['お預け入れ',amount(S,'issue',t,5000000),'amt']],S=>{const a=amount(S,'issue',t,5000000),half=choice(S,'capital',t-1,'all')==='half';return je([['普通預金',a]],half?[['資本金',a/2],['資本準備金',a/2]]:[['資本金',a]]);},['資本準備金'])]
  });
  // 配当可能額：year2.jsの計算の構造。準備金を直接配当する枝は作らない。
  const dividendQuote = S => {
    const T=S.T || [], bal=a=>BK.balance(T,a), shares=(S.W && S.W.flags.y2Shares) || COEF.initialShares.v;
    const cap=Math.max(0,-bal('資本金')), reserves=Math.max(0,-bal('資本準備金')-bal('利益準備金'));
    const retained=Math.max(0,-bal('繰越利益剰余金')), need=Math.max(0,Math.floor(cap/4)-reserves);
    const equity=Object.entries(g.BOKI.accounts).filter(([,a])=>a.cat==='純資産').reduce((n,[a])=>n-bal(a),0);
    const room=Math.max(0,equity-3000000);
    // 配当と積立の合計が利益の残りを超えない、最大の整数額。上限到達後まで一律1/10を引かない。
    let lo=0,hi=Math.floor(Math.min(room,retained));
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(mid+Math.min(Math.floor(mid/10),need)<=retained)lo=mid;else hi=mid-1;}
    const available=lo;
    return {shares,cap,reserves,retained,need,equity,per:Math.floor(available/shares)};
  };
  // coverage専用の正額資料：総会で30万円の配当、準備金の残枠75万円。
  const dividendFixture=t=>()=>({decisions:{[`dividend@${t-1}`]:'half'},T:[],L:[],W:{flags:{y2Dividend:{need:750000}}},res:{[t]:{choices:[{card:'dividend',option:'half',outcome:'paid',cash:-300000}],carried:[{card:'dividend',option:'half',outcome:'paid',cash:-300000}]}}});
  const divAmount = (W,ratio) => {const q=W.flags.y2Dividend || {per:0,shares:COEF.initialShares.v};return Math.floor(q.per*ratio)*q.shares;};
  const dividend = add({id:'dividend',title:'今年、株主にいくら分ける？',scope:['s-dividend'],when:schedule(2,5),
    talk:[['shacho','分けたら株主は喜ぶ。でも、次の店のお金も残したい。']],
    options:[['none','配らない',0],['half','配れる額の半分',0.5],['eighty','配れる額の8割',0.8]].map(([id,label,ratio])=>({id,label,desc:ratio?'口座から出す額と、次の店に残す額を比べる。':'店にお金を残す。株主への説明が要る。',outcomes:[{id:'paid',w:100,label:ratio?'総会で決めた額を支払った':'会社に残した',flow:'capital',cash:W=>-divAmount(W,ratio)}]})),
    calcs:t=>[Y1calc(`div-limit@${t}`,['s-dividend'],'分ける前に、会社に残す額を確かめる',S=>{const q=dividendQuote(S);return [['去年までのもうけの残り',q.retained],['返さなくてよいお金の合計',q.equity],['株の数',q.shares],['1株に配れる上限（先生の計算書）',q.per]];},'1株の上限に株の数を掛けると、総額の上限はいくら？',S=>{const q=dividendQuote(S);return q.per*q.shares;},'利益を全部配るのではなく、会社に残す分を差し引いてから株の数で割り、端数を切り捨てる。')],
    docs:t=>[
      {...doc('dividend-dec','株主総会議事録・会社に残す分',S=>{const a=-amount(S,'dividend',t,0),q=(S.W && S.W.flags.y2Dividend) || dividendQuote(S);return [['配当の総額',a,'amt'],['準備金を積める残りの枠',q.need,'amt'],['積む額（資料の条件）',Math.min(Math.floor(a/10),q.need),'amt']];},S=>{const a=-amount(S,'dividend',t,0),q=(S.W && S.W.flags.y2Dividend) || dividendQuote(S),r=Math.min(Math.floor(a/10),q.need);return je([['繰越利益剰余金',a+r]],[['未払配当金',a],['利益準備金',r]]);},['繰越利益剰余金','未払配当金','利益準備金']),fixture:dividendFixture(t),when:S=>-amount(S,'dividend',t,0)>0},
      {...doc('dividend-pay','配当の支払の通帳',S=>[['お引出し',-amount(S,'dividend',t,0),'amt']],S=>{const a=-amount(S,'dividend',t,0);return je([['未払配当金',a]],[['普通預金',a]]);},['未払配当金']),fixture:dividendFixture(t),when:S=>-amount(S,'dividend',t,0)>0}
    ]
  });
  const site2 = add({id:'site2',title:'2号店を、どこにどの形で出す？',scope:['s-kensetsu','s-honshiten'],
    when:W=>schedule(2,9)(W)&&!(W.stores && W.stores.length>1)&&!(W.flags && W.flags.y2Build),
    talk:[['shacho','店を増やすなら、場所と人の数を決めよう。今の店から人を回せるかな。']],
    options:[...Object.entries(SIM.world.AREAS).flatMap(([area,a])=>Object.entries(SIM.world.FORMS).map(([form,f])=>({id:`${area}:${form}`,label:`${a.label}・${f.label}`,desc:`内装${money(SIM.coef('fitout'))}円、保証金${money(SIM.coef('deposit'))}円。家賃は場所で変わる。`,outcomes:[{id:'start',w:100,label:'工事に着手した',flow:'invest',cash:-(SIM.coef('deposit')+SIM.coef('fitout')/2),fx:W=>{W.flags.y2Build={area,form,at:W.t+1,staff:W.flags.y2Staff || 'hire'};}}]}))),{id:'wait',label:'今年は1号店に集中する',desc:'出店のお金を残し、店を増やす機会を見送る。',outcomes:[{id:'wait',w:100,label:'今の店で続けた'}]}],
    trial:(S,id)=>{if(id==='wait')return [['出店の支払',0]];const [area,form]=id.split(':'),f=SIM.world.FORMS[form],W=S.W||SIM.world.create({seed:S.seed||0});return [['着手時の内装半額と保証金',SIM.coef('fitout')/2+SIM.coef('deposit')],['完成時に払う残り',SIM.coef('fitout')/2],['新しい店の月の家賃',Math.round(SIM.coef('rentPerTsubo')[area]*SIM.coef('tsubo')*(W.rentMul||1))],['新しい店の月の給料（見積り）',SIM.world.laborOf(f)]];},
    extra:t=>[{t:'decision',id:`site2_staff@${t}`,when:S=>S.W && S.W.stores[0].parts>0 && choice(S,'site2',t,'wait')!=='wait',q:'新しい店の人は、どう用意する？',options:[{id:'hire',label:'新しい店で雇う',desc:'1号店の人を残す。2号店の人のお金が増える。',result:'選んだ形の人数を、新しい店で雇う。'},{id:'transfer',label:'1号店から1人回す',desc:'1号店のパートがいる場合。いなければ新しい店で雇う。',result:'1号店のパートがいれば1人を2号店へ。1号店の回せる客数も変わる。'}]}],
    docs:t=>[doc('kensetsu-in','内装工事の着手金',()=>[['内装工事の総額',SIM.coef('fitout'),'amt'],['今回の支払',SIM.coef('fitout')/2,'amt'],['残り','翌月の完成時に支払う']],()=>je([['建設仮勘定',SIM.coef('fitout')/2]],[['普通預金',SIM.coef('fitout')/2]]),['建設仮勘定']),
      doc('site2-deposit','2号店の大家さんへの預け金',()=>[['退去時に精算して返る額',SIM.coef('deposit'),'amt']],()=>je([['差入保証金',SIM.coef('deposit')]],[['普通預金',SIM.coef('deposit')]]),['差入保証金'])]
  });
  const completion = {id:'site2_complete',title:'2号店の工事が完成',y2:true,tFrom:12,automatic:true,when:()=>false,options:[{id:'complete',label:'引き渡しを受ける',outcomes:[{id:'open',w:100,label:'新しい店が開いた',flow:'invest',cash:-SIM.coef('fitout')/2,fx:W=>{
    const b=W.flags.y2Build;if(!b)throw new Error('完成する工事がない');
    const branch=SIM.world.create({seed:W.seed,area:b.area,form:b.form,tier:W.tier});
    const st=branch.stores[0];st.id='branch';st.openedAt=W.t;
    if(b.staff==='transfer'&&W.stores[0].parts>0){W.stores[0].parts--;st.parts++;}
    W.stores.push(st);
    if(!W.town.areas[b.area]){W.town.areas[b.area]=branch.town.areas[b.area];W.rivals.push(...branch.rivals.map(r=>({...r,id:`branch:${r.id}`,area:b.area})));}
    W.flags.y2Build=null;
  }}]}]};
  cards.push(completion);byId[completion.id]=completion;
  const buildDocs = t => {
    const done=S=>(((S.res || {})[t] || {}).carried || []).some(x=>x.card==='site2_complete');
    const transfer=S=>{const r=(((S.res || {})[t] || {}).stores || [])[1];return r?Math.round(r.labor+r.cogs+r.wasteCost):300000;};
    const discovery = {t:'discover',id:'y2-interstore',p:'P1',moves:['その他-','その他+'],title:'会社の中で送ったお金',
      b1:{talk:[['shacho','2号店にお金を送ったから、会社全体のお金がへったね。']]},
      b2:{q:'1号店から2号店へ送ったお金。会社全体では？',token:'会社の中の送金',layout:'options',targets:[{id:'same',label:'全体のお金は変わらない',ok:true},{id:'less',label:'全体のお金がへる',ok:false,react:'2号店にも、同じだけ入っているね。'}],reasons:[{t:'同じ会社の中で移しただけだから',ok:true},{t:'送った側だけを数えればよいから',ok:false,react:'会社全体なら、受け取った側も合わせよう。'}],hints:['2号店では増えた？へった？','2つの口座を足すとどうなる？']},
      b3:{ok:'店ごとにやり取りを記録し、会社全体の表では社内の分を消し合う。'},
      b4:{name:'本店・支店',line:'会社の中心が「本店」、別の場所の店が「支店」。店ごとの帳簿に同じ名前の札を置き、会社の中のやり取りを記録する。',teaches:['本店','支店'],exam:'本店から支店へ現金を送付した。本店と支店の仕訳をそれぞれ示す。',leaf:{p:'P1',label:'会社の中の送金'}},hand:'全体を合わせると、会社の中の送金は資金の増減でも売上でもない。'};
    const documents = [
      {...doc('kensetsu-done','工事の引き渡し・残代金の支払',()=>[['引き渡された内装',SIM.coef('fitout'),'amt'],['先月払った着手金',SIM.coef('fitout')/2,'amt'],['今回の支払',SIM.coef('fitout')/2,'amt']],()=>je([['建物',SIM.coef('fitout')]],[['建設仮勘定',SIM.coef('fitout')/2],['普通預金',SIM.coef('fitout')/2]]),['建物','建設仮勘定']),id:`site2-doc2@${t}`},
      {...doc('shiten','本店の帳簿・2号店へ運転資金を送る',S=>[['新しい店の人と材料の当月分',transfer(S),'amt'],['記帳する帳簿','本店']],S=>je([['支店',transfer(S)]],[['普通預金',transfer(S)]]),['支店']),id:`site2-doc3@${t}`},
      {...doc('honten','2号店の帳簿・本店から受け取る',S=>[['本店からの入金',transfer(S),'amt'],['記帳する帳簿','2号店']],S=>je([['普通預金',transfer(S)]],[['本店',transfer(S)]]),['本店']),id:`site2-doc4@${t}`},
      {...doc('internal-elimination','会社全体を合わせるための消去',S=>[['会社の中で送った額',transfer(S),'amt'],['メモ','本店と支店の両方の帳簿を合わせた表だけで消す。外との取引ではない。']],S=>je([['本店',transfer(S)]],[['支店',transfer(S)]]),['本店','支店']),id:`site2-doc5@${t}`},
    ].map(e=>({...e,card:'site2',scope:site2.scope,ramenT:t,when:done,doc:{...e.doc,date:`${Y.MON[t%12]}月`}}));
    return [{...discovery,when:S=>done(S)&&((S.discDone || {})[discovery.id]==null||(S.discDone || {})[discovery.id]===S.mi)},...documents];
  };
  Object.assign(COEF,{
    prototype:{v:30000,lo:30000,hi:60000,source:'版1.2.1の取りまとめ役承認6383573548・e.8。試作3万/6万'},
    coldWaste:{v:0.8,lo:0.8,hi:1,source:'版1.2.1の取りまとめ役承認6383573548・e.8。冷たい麺の廃棄費用'},
    awareness:{v:0.5,lo:0,hi:0.5,source:'版1.2.1の取りまとめ役承認6383573548・e.8、教室'},
    serviceRevenue:{v:80000,lo:80000,hi:80000,source:'版1.2.1の取りまとめ役承認6383573548・e.3、役務の受注'},
    serviceCost:{v:40000,lo:20000,hi:40000,source:'版1.2.1の取りまとめ役承認6383573548・e.3。人と材料'},
    itemCost:{v:600,lo:600,hi:600,source:'版1.2.1の取りまとめ役承認6383573548・e.4、鉢の物販'},
    itemPrice:{v:1000,lo:1000,hi:1000,source:'版1.2.1の取りまとめ役承認6383573548・e.4、鉢の物販'},
  });
  const V=k=>COEF[k].v;
  for(const [id,t]of [['minwage_y2',18],['minwage_y3',30]]){const old=SIM.cards.byId.minwage;add({id,title:old.title,scope:old.scope,when:W=>W.t===t,talk:old.talk,options:old.options});}

  const actualChoice=(S,id,t)=>(((S.res || {})[t] || {}).choices || []).find(x=>x.card===id);
  const expenseDoc=(kind,label,acc,id,t,defaultCost)=>doc(kind,label,S=>[['支払った額',-amount(S,id,t,-defaultCost),'amt'],['使った目的',label]],S=>je([[acc,-amount(S,id,t,-defaultCost)]],[['普通預金',-amount(S,id,t,-defaultCost)]]),[acc]);
  const limited=add({id:'bowl_limited_y2',title:'今年の夏の限定を、どう作る？',scope:['s-rd'],when:schedule(2,8),talk:[['shacho','季節の素材も、冷たい麺も、ほかの店との共同作も気になる。試すお金と手間を比べよう。']],
    options:[...['season','cold','collab'].map((id,i)=>({id,label:['季節の素材を試す','冷たい麺を試す','ほかの店と共同で試す'][i],desc:`試作${money(i===2?60000:30000)}円。${i===1?'準備の手間1。夏の廃棄を抑える。':i===2?'準備の手間2。話題になりやすいが出費は大きい。':'いつもの店で試作する。'}`,time:i,
      outcomes:[['hit',20,0.1],['mid',50,0.4],['miss',30,0.9]].map(([out,w,luck])=>({id:out,w,label:{hit:'限定が評判になった',mid:'ふつうに売れた',miss:'試したが定番には届かなかった'}[out],cash:-(i===2?60000:30000),fx:(W,fx,st)=>{st.bowl=SIM.bowl.apply(st.bowl,'limited',()=>luck,W.t);if(W.flags.y2FrozenTrial&&W.flags.y2FrozenTrial.ready){st.bowl.peak*=V('frozenPeak');st.bowl.peak0*=V('frozenPeak');st.bowl.y2TrialUntil=W.t+V('frozenMonths');W.flags.y2FrozenTrial.ready=false;W.flags.y2FrozenTrial.activeUntil=st.bowl.y2TrialUntil;}if(id==='cold'&&[7,8,9].includes(W.m))fx.wasteMul=V('coldWaste');if(id==='collab')st.A+=V('awareness');}}))})),{id:'no',label:'限定を出さない',desc:'試作費を残し、いつもの一杯に集中する。',outcomes:[{id:'keep',w:100,label:'看板の一杯を続けた'}]}],
    docs:t=>[expenseDoc('rd','新しい味の試作・将来の売上は未確定','研究開発費','bowl_limited_y2',t,V('prototype'))]
  });
  const summer=add({id:'ev_summer_y2',title:'夏祭りの屋台を引き受ける？',scope:['s-service'],when:schedule(2,7),talk:[['eigyo','夏祭りの屋台を運営してほしいそうです。引き受けると、人と材料の手配も必要です。']],
    options:[{id:'go',label:'引き受ける',desc:'報酬8万円。人と材料に2万〜4万円。',outcomes:[{id:'good',w:60,label:'段取りがよく、店の名前も広まった',cash:60000,fx:(W,fx,st)=>{st.A+=0.5;}},{id:'tired',w:40,label:'店の人手が薄くなった',cash:40000,fx:(W,fx)=>{fx.Rd-=0.02;}}]},{id:'no',label:'店に集中する',desc:'屋台の報酬は受け取らない。',outcomes:[{id:'ok',w:70,label:'祭り帰りの客が来た',fx:(W,fx)=>{fx.demandMul*=1.03;}},{id:'quiet',w:30,label:'祭りに客が流れた',fx:(W,fx)=>{fx.demandMul*=0.98;}}]}],
    docs:t=>serviceDocs('ev_summer_y2',t)
  });
  const classroom=add({id:'kyoshitsu',title:'スープの作り方の教室を開く？',scope:['s-service'],when:W=>W.y===3&&W.m===6,talk:[['eigyo','常連さんから、スープの作り方を教えてほしいと頼まれました。']],
    options:[{id:'go',label:'教室を開く',desc:'参加費8万円、材料と講師4万円。準備の時間2。',time:2,outcomes:[{id:'held',w:100,label:'教室を開き、店の名前が広まった',cash:40000,fx:(W,fx,st)=>{st.A+=0.5;}}]},{id:'no',label:'店に集中する',desc:'参加費は受け取らず、店の仕込みに時間を残す。',outcomes:[{id:'keep',w:100,label:'通常の営業を続けた'}]}],docs:t=>serviceDocs('kyoshitsu',t)
  });
  function serviceDocs(id,t){const revenue=80000;const cost=S=>revenue-amount(S,id,t,40000);return [
    doc('service-rev','屋台・教室を終えた報酬の通帳',()=>[['約束した仕事','屋台の運営、または教室の実施'],['受け取った報酬',revenue,'amt']],()=>je([['普通預金',revenue]],[['役務収益',revenue]]),['役務収益']),
    doc('service-cost','屋台・教室の人と材料の支払',S=>[['その仕事のための人・材料',cost(S),'amt']],S=>je([['役務原価',cost(S)]],[['普通預金',cost(S)]]),['役務原価'])
  ];}
  add({id:'frozen_noodle',title:'持ち帰り用の冷凍麺を試作する？',scope:['s-rd'],when:W=>W.y===3&&W.m===7,talk:[['shacho','持ち帰ってもおいしい麺にしたい。試しても、売れるとは限らないけどね。']],
    options:[...['outside','own'].map((id,i)=>({id,label:i?'自分たちで試作する':'外の専門店と試作する',desc:`試作${i?'3':'6'}万円・時間${i?3:1}。成功すると次の限定の話題を3か月高める。`,time:i?3:1,outcomes:[['success',100*V(i?'frozenOwn':'frozenOutside')],['failed',100*(1-V(i?'frozenOwn':'frozenOutside'))]].map(([out,w])=>({id:out,w,label:out==='success'?'試作が成功。次の限定の話題が3か月高まる':'試作は実った商品につながらなかった。試作費は今年の費用',cash:i?-30000:-60000,fx:W=>{W.flags.y2FrozenTrial={ready:out==='success',at:W.t};}}))})),{id:'no',label:'今回は見送る',desc:'お金と時間を残す。新しい商品はまだ作らない。',outcomes:[{id:'keep',w:100,label:'今の品ぞろえを続けた'}]}],
    docs:t=>[expenseDoc('rd','冷凍麺の試作・売れるかはまだ未確定','研究開発費','frozen_noodle',t,30000)]
  });
  const items=add({id:'ticket_items',title:'店の鉢を、おみやげに売る？',scope:['s-taiwitsu'],when:schedule(2,12),talk:[['eigyo','この鉢を買って帰りたいというお客さんがいます。仕入れて並べますか。']],
    options:[...V('itemBuy').map(n=>({id:`n${n}`,label:`${n}個仕入れて並べる`,desc:'1個600円で仕入、1,000円で販売。需要は6〜18個。売れ残りは商品として残る。',outcomes:Array.from({length:V('itemDemand')[1]-V('itemDemand')[0]+1},(_,i)=>i+V('itemDemand')[0]).map(demand=>({id:`d${demand}`,w:100/(V('itemDemand')[1]-V('itemDemand')[0]+1),label:`需要${demand}個、${Math.min(n,demand)}個売れた`,cash:Math.min(n,demand)*V('itemPrice')-n*V('itemCost'),fx:W=>{W.flags.y2Items={bought:n,sold:Math.min(n,demand),demand};(W.flags.y2ItemBatches||=[]).push({at:W.t,remaining:n-Math.min(n,demand)});}}))})),{id:'no',label:'売らない',desc:'在庫を持たず、ラーメンの販売を続ける。',outcomes:[{id:'keep',w:100,label:'鉢は仕入れなかった'}]}],
    docs:t=>{const x=S=>{const c=actualChoice(S,'ticket_items',t);return c&&c.option!=='no'?{bought:+c.option.slice(1),sold:Math.min(+c.option.slice(1),+c.outcome.slice(1))}:{bought:10,sold:8};};return [
      doc('items-buy','販売用の鉢の仕入れ',S=>[['仕入数',x(S).bought],['1個の仕入価格',600,'amt']],S=>je([['商品',x(S).bought*V('itemCost')]],[['普通預金',x(S).bought*V('itemCost')]]),['商品']),
      doc('taiwitsu','鉢の販売・売れた値段と仕入れた値段',S=>[['販売数',x(S).sold],['1個の売価',1000,'amt'],['1個の原価',600,'amt']],S=>je([['普通預金',x(S).sold*V('itemPrice')],['売上原価',x(S).sold*V('itemCost')]],[['売上',x(S).sold*V('itemPrice')],['商品',x(S).sold*V('itemCost')]]),['商品','売上原価'])
    ];},
    resultCalcs:t=>[Y1calc(`taiwitsu-vs@${t}`,['s-taiwitsu'],'書き方を替えても、鉢のもうけは同じ？',S=>{const c=actualChoice(S,'ticket_items',t),n=c&&c.option!=='no'?+c.option.slice(1):10,sold=c&&c.option!=='no'?Math.min(n,+c.outcome.slice(1)):8;return [['仕入総額',n*V('itemCost')],['売上',sold*V('itemPrice')],['月末に残った鉢の原価',(n-sold)*V('itemCost')]];},'三分法なら仕入から残った分を戻す。売上から、使った原価を引くといくら？',S=>{const c=actualChoice(S,'ticket_items',t);return c&&c.option!=='no'?Math.min(+c.option.slice(1),+c.outcome.slice(1))*(V('itemPrice')-V('itemCost')):3200;},'売れるたびに原価を書く方法でも、残りを数えて原価を出す三分法でも、同じ鉢のもうけは一致する。')]
  });
  function Y1calc(id,scope,title,rows,q,answer,why){return SIM.y1.calc(id,{scope,title,rows,q,answer,unit:'円',why});}
  // 名前の札は、初めて手書きする直前にengineが出す。会社の純資産の区分を混同させない。
  Object.assign(SIM.namings,{
    研究開発費:{q:'まだ売れるか分からない味の試作に使った材料。来年の売上を約束する資産？',opts:[{t:'試すために使い切った今年の費用',ok:true},{t:'将来売れるので必ず資産',react:'売れるか、商品になるかは、まだ分からないね。'}],line:'新しいものを作るための試作に使ったお金は「研究開発費」。将来の売上を約束する資産として残さず、使った年の費用にする。',teaches:['研究開発費']},
    役務収益:{q:'屋台を運営する仕事を終え、約束の報酬を受け取った。何を提供してかせいだ？',opts:[{t:'約束した仕事をしてかせいだ',ok:true},{t:'株を渡して集めた',react:'株主から集めたお金ではないね。'}],line:'仕事やサービスを提供してかせいだ分は、収益の「役務収益」。',teaches:['役務収益']},
    役務原価:{q:'引き受けた屋台の仕事のために使った人と材料。何のための費用？',opts:[{t:'その仕事の報酬を得るため',ok:true},{t:'来年のために残す資産',react:'仕事を終えたときには、材料や人の働きは使い終わっているね。'}],line:'サービスの報酬を得るために使った分は、費用の「役務原価」。役務収益に対応させる。',teaches:['役務原価']},
    商品:{q:'売るために仕入れた鉢。売れるまでは店に残っている。どの棚？',opts:[{t:'もっているものの棚',ok:true},{t:'もう全部使った費用の棚',react:'鉢は店に残り、これから売れるね。'}],line:'売れるまで仕入れた物を資産に残す書き方では、その札を「商品」という。',teaches:['商品']},
    売上原価:{q:'鉢が1個売れた。売上とは別に、どの額を費用へ移す？',opts:[{t:'売れた鉢を仕入れた値段',ok:true},{t:'残った鉢も含めた全額',react:'売れ残りはまだ店にあるね。'}],line:'売れた商品の仕入れた値段を、商品の札から費用の「売上原価」へ移す。',teaches:['売上原価']},
    建設仮勘定:{q:'まだ工事中の内装へ払った着手金。完成した店と同じ札でよい？',opts:[{t:'工事中の分を別の資産の札に置く',ok:true},{t:'すぐに今年の費用へ入れる',react:'完成したら、来年以降も店で使う内装だね。'}],line:'工事中の建物や設備へ払った分は、資産の「建設仮勘定」。完成したら、建物や設備の札へ移す。',teaches:['建設仮勘定']},
    支店:{q:'本店から2号店へお金を送った。本店の帳簿で、代わりに残す札は？',opts:[{t:'2号店とのやり取りを残す札',ok:true},{t:'外のお客さんに売った札',react:'同じ会社の中で送ったお金だね。'}],line:'本店の帳簿で2号店とのやり取りを残す札を「支店」という。会社全体では外への支払ではない。',teaches:['支店']},
    本店:{q:'2号店が会社の中心の店からお金を受け取った。2号店の帳簿では？',opts:[{t:'会社の中心の店とのやり取りを残す',ok:true},{t:'売上に入れる',react:'ラーメンを売った代金ではないね。'}],line:'支店の帳簿で会社の中心の店とのやり取りを残す札を「本店」という。合わせるときは、支店の札と消し合う。',teaches:['本店']},
    資本準備金:{q:'株主から受け取ったお金の一部を、会社に残す別の札へ分けた。店で売ってかせいだお金？',opts:[{t:'出してもらったお金',ok:true},{t:'店がかせいだ売上',react:'ラーメンを売った代金ではないね。'}],line:'株主からの払込みのうち、資本金にせず会社に残す分は、純資産の「資本準備金」。',teaches:['資本準備金']},
    利益準備金:{q:'利益を株主に分けるとき、会社に残して積む分。だれかに返す約束？',opts:[{t:'会社に残す、もうけの一部',ok:true},{t:'株主へ払う約束',react:'払う分とは別に、会社に残す分だね。'}],line:'配当のとき、会社に残して積む分を「利益準備金」という。',teaches:['利益準備金']},
    未払配当金:{q:'株主に分ける額が決まったが、振込はまだ。いま何が残る？',opts:[{t:'株主へ払う約束',ok:true},{t:'店の新しい費用',react:'もうけを株主へ分けることは、ラーメンを作る費用ではない。'}],line:'配当が決まってから、まだ払っていない分は、負債の「未払配当金」。',teaches:['未払配当金']}
  });
  Y.afterPlan=(S,t,r)=>{r.res.frozenTrialActive=!!(S.W.flags.y2FrozenTrial&&S.W.flags.y2FrozenTrial.activeUntil>t);};
  Y.beforePlan = (S,t) => { if(t>=12) {const b=S.W.stores[0].bowl;if(b.y2TrialUntil!=null&&t>=b.y2TrialUntil){b.peak/=V('frozenPeak');b.peak0/=V('frozenPeak');delete b.y2TrialUntil;}S.W.flags.y2Dividend=dividendQuote(S);S.W.flags.y2Staff=choice(S,'site2_staff',t-1,'hire');} };
  Y.carry = (S,t) => [...(S.W.flags.y2Build && S.W.flags.y2Build.at === t ? [{id:'site2_complete',option:'complete',t:t-1}] : []),...Y.extraCarry.flatMap(fn=>fn(S,t))];
  Y.cardEvents = t => {
    const out=[];
    for(const c of cards){
      if(c.automatic)continue;
      const dealt=S=>((S.dealt || {})[t] || []).includes(c.id);
      if(c.when(date(t))){
        if(c.intro) out.push({...c.intro,when:S=>dealt(S)&&((S.discDone || {})[c.intro.id]==null||(S.discDone || {})[c.intro.id]===S.mi)});
        if(c.id==='issue') out.push({...capitalDiscovery,when:S=>dealt(S)&&((S.discDone || {})[capitalDiscovery.id]==null||(S.discDone || {})[capitalDiscovery.id]===S.mi)});
        if(c.id==='dividend') out.push({...dividendDiscovery,when:S=>dealt(S)&&((S.discDone || {})[dividendDiscovery.id]==null||(S.discDone || {})[dividendDiscovery.id]===S.mi)});
        out.push({t:'decision',id:`${c.id}@${t}`,card:c.id,optionsFor:c.optionsFor?(S=>c.optionsFor(S,t).map(o=>({...o,result:o.result||'結果は翌月の書類と月報で確かめよう。'}))):undefined,ramenT:t,trial:c.trial||((S,oid)=>{const tr=SIM.decide.trial(c,oid,S.W||SIM.world.create({seed:S.seed||0}));return [['この札の入出金',tr.cashMin===tr.cashMax?tr.cashMin:money(tr.cashMin)+'〜'+money(tr.cashMax)+'円'],['結果の見込み',tr.weights.length>4?'各結果は同じ見込み（'+tr.weights.length+'通り）':tr.weights.map(w=>c.options.find(o=>o.id===oid).outcomes.find(o=>o.id===w.id).label+' '+Math.round(w.w)+'%').join('／')],['準備に使う時間',tr.time+'（翌月の作戦の予算から引く）']];}),when:dealt,q:c.title,talk:c.talk,options:c.options.map(o=>({id:o.id,label:o.label,desc:o.desc,result:'条件を決めた。結果の書類は、翌月に届く。'}))});
        if(c.calcs) out.push(...c.calcs(t).map(e=>({...e,when:dealt})));
        if(c.extra) out.push(...c.extra(t).map(e=>({...e,when:S=>dealt(S)&&(!e.when || e.when(S))})));
      }
      if(c.when(date(t-1)) && c.docs){
        const happened=S=>(((S.res || {})[t] || {}).carried || []).some(x=>x.card===c.id && !['no','wait'].includes(x.option));
        if(c.resultCalcs) out.push(...c.resultCalcs(t).map(e=>({...e,when:happened})));
        out.push(...c.docs(t).map((e,k)=>({...e,id:`${c.id}-doc${k}@${t}`,card:c.id,ramenT:t,scope:c.scope,when:S=>happened(S)&&(!e.when || e.when(S)),doc:{...e.doc,date:`${Y.MON[t%12]}月`}})));
      }
    }
    if(t>=12 && t%12===7) out.push(...buildDocs(t));
    return out.concat(Y.extraEvents.flatMap(fn=>fn(t)));
  };
  Y.cards = {cards,byId,coef:COEF,dividendQuote,add:c=>{add(c);SIM.cards.register([c]);return c;},helpers:{doc,amount,actualChoice,choice,schedule,Y1calc}};
  SIM.cards.register(cards);
})(typeof window !== 'undefined' ? window : globalThis);
