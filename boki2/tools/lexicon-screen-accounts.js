// 画面の本文・表・選択肢の初出科目を、実際の台本の経路で数える。
// engine.jsの画面の区切りを投影する。世界・台本・__onEventの状態には書かない。
'use strict';
const fs=require('fs');
const stringParts=x=>typeof x==='string'?[x]:Array.isArray(x)?x.flatMap(stringParts):x&&typeof x==='object'?Object.values(x).flatMap(stringParts):[];
function scanner(accounts,lex){
  const words=[...new Set([...Object.keys(accounts),...(lex.concepts||[]),...Object.keys(lex.docWords||{})])].sort((a,b)=>b.length-a.length),cache=new Map();
  return text=>{text=stringParts(text).join(' ');if(cache.has(text))return cache.get(text);let rest=text.replace(/<[^>]*>/g,' ');const out=new Set();
    for(const w of words){let i=rest.indexOf(w);while(i>=0){const next=rest[i+w.length];if(accounts[w]&&!((w==='仕入'&&next==='れ')||(w==='売上'&&next==='げ')))out.add(w);rest=rest.slice(0,i)+'□'.repeat(w.length)+rest.slice(i+w.length);i=rest.indexOf(w,i+w.length);}}
    const result=[...out];cache.set(text,result);return result;};
}
class AccountScreens{
  constructor(scan){this.scan=scan;this.seen=new Set();this.learned=new Set();this.rows=[];this.months=new Map();this.intro=new Set();}
  learn(xs){for(const a of xs||[]){this.learned.add(a);this.seen.add(a);}}
  show(month,id,text,teaches=[]){const names=[...new Set([...this.scan(text),...teaches.filter(a=>this.scan(a).includes(a))])],fresh=names.filter(a=>!this.seen.has(a));
    const firstTeaches=teaches.filter(a=>!this.learned.has(a)&&this.scan(a).includes(a)),beforeTeach=names.filter(a=>!this.learned.has(a)&&!teaches.includes(a));
    const row={month,id,newCount:fresh.length,newNames:fresh,shownNames:names,firstTeaches,beforeTeach};this.rows.push(row);for(const a of names)this.seen.add(a);this.learn(teaches);
    if(!this.months.has(month))this.months.set(month,{month,newNames:new Set(),screens:[]});const m=this.months.get(month);fresh.forEach(a=>m.newNames.add(a));if(fresh.length)m.screens.push({id,newNames:fresh});return row;
  }
  result(){return{screens:this.rows,months:[...this.months.values()].map(m=>({...m,newCount:m.newNames.size,newNames:[...m.newNames]})),failures:this.rows.filter(r=>r.newCount>2)};}
}
// __onEventの状態を、読むことだけを許すProxyで渡す。コピーを世界へ書き戻さない。
const readOnlyViews=new WeakMap(),viewProxies=new WeakSet();
function readOnly(value,cache=readOnlyViews){
  if(!value||typeof value!=='object'||viewProxies.has(value))return value;
  if(cache.has(value))return cache.get(value);
  const fail=()=>{throw Error('画面の検査から状態を書き換えようとした');};
  const proxy=new Proxy(value,{get:(o,k,r)=>readOnly(Reflect.get(o,k,r),cache),set:fail,deleteProperty:fail,defineProperty:fail,setPrototypeOf:fail});cache.set(value,proxy);viewProxies.add(proxy);return proxy;
}
// 科目ごとに帳簿全体を再走査せず、同じ残高を一度で作る。入力は変更しない。
function entryBalances(entries){const out={};for(const entry of entries){for(const [a,n]of entry.dr)out[a]=(out[a]||0)+n;for(const [a,n]of entry.cr)out[a]=(out[a]||0)-n;}return out;}
function frozenCopy(x){if(!x||typeof x!=='object')return x;const copy=Array.isArray(x)?x.map(frozenCopy):Object.fromEntries(Object.entries(x).map(([k,v])=>[k,frozenCopy(v)]));Object.freeze(copy);viewProxies.add(copy);return copy;}
function projectEvent(audit,D,B,live,e,m,cache=new Map()){
  // 同じ出来事の5表示で同じ計算の行を再計算しない。帳簿のコピーは凍結し、元へは書かない。
  if(!cache.has('state'))cache.set('state',readOnly(e.t==='calc'?{...live,T:frozenCopy(live.T)}:live));
  const S=cache.get('state'),month=m.m===0?'プロローグ':!m.year&&live.mi<4?'開店前 3月':`${m.year||(/翌年/.test(m.label)?2:1)}年目 ${m.m}月`,id=m.label+'/'+(e.id||`${e.t}#${m.events.indexOf(e)}`),show=(stage,text,learn=[])=>audit.show(month,id+'/'+stage,[e.t==='discover'&&!(audit.pro3&&D.pro3.lite.includes(e.id))?e.title:'',text],learn),v=x=>{if(typeof x!=='function')return x;if(!cache.has(x))cache.set(x,x(S));return cache.get(x);},talk=x=>v(x)||[];
  // 誤答・任意のヒントは見なくても進める。別経路の初出を先取りさせない。
  const optional=(stage,text)=>{const seen=new Set(audit.seen),learned=new Set(audit.learned);show(stage,text);audit.seen=seen;audit.learned=learned;};
  const branch=fn=>{const seen=new Set(audit.seen),learned=new Set(audit.learned);fn();audit.seen=seen;audit.learned=learned;};
  const paper=(stage,d,teaches=[],header=[])=>{const body=[header,d.from,d.to,d.date,d.title,d.body];show(stage,body,teaches);for(const [i,mark]of(d.marks||[]).entries())optional(stage+'/言い直し'+i,[body,mark.plain]);};
  let balanceValues;const bookBalances=()=>balanceValues||(balanceValues=entryBalances(S.T));
  const balances=()=>Object.keys(B.accounts).filter(a=>(bookBalances()[a]||0)!==0);
  if(audit.mi!==S.mi){if(audit.pendingAuto){audit.pendingAuto.flush();audit.pendingAuto=null;}audit.show(month,m.label+'/月の入口',m.title);audit.mi=S.mi;}

  function naming(acc){if(audit.learned.has(acc))return;const n=D.namings[acc];if(!n)throw Error(id+'：名前の札がない '+acc);
    show('名前/'+acc+'/問い',[n.q,n.opts.map(o=>o.t)]);for(const [i,o]of n.opts.entries())if(!o.ok&&o.react)optional('名前/'+acc+'/反応'+i,[n.q,n.opts.map(o=>o.t),o.react]);show('名前/'+acc+'/説明',[n.q,acc,n.line],n.teaches);}
  function intro(kind){const n=D.kindIntro[kind];if(!n||audit.intro.has(kind))return;show('動きの問い',[n.q,n.opts.map(o=>o.t)]);for(const [i,o]of n.opts.entries())if(!o.ok&&o.react)optional('動きの反応'+i,[n.q,n.opts.map(o=>o.t),o.react]);show('動きの説明',[n.q,n.line]);audit.intro.add(kind);}
  for(const r of D.returns||[])if(!audit.returned?.has(r.id)&&(m.year||1)===r.y&&m.m===r.m&&(r.seg||null)===(m.seg||null)&&!m.label.includes('後半')&&r.cond(S)){show('前の判断の返り/'+r.id,[r.from,talk(r.lines)]);(audit.returned||=new Set()).add(r.id);}
  // 社長が書いた伝票は、renderで画面を出さずに記帳される。
  if(e.t==='doc'&&e.byPres){if(audit.pendingAuto){audit.pendingAuto.flush();audit.pendingAuto=null;}return;}
  const preset=e.t==='doc'&&audit.preset?.has(e.kind)&&!e.manual;
  if(audit.pendingAuto&&(!preset||D.kindIntro[e.kind]&&!audit.intro.has(e.kind))){audit.pendingAuto.flush();audit.pendingAuto=null;}
  if(e.t==='doc')intro(e.kind);
  if(preset){const ans=v(e.ans),names=[...ans.dr,...ans.cr].map(x=>x[0]);
    if(!audit.pendingAuto){const texts=[];audit.pendingAuto={texts,flush:()=>show('自動で記帳',texts)};}
    audit.pendingAuto.texts.push([e.doc?.date,e.doc?.title,names]);return;
  }
  for(const acc of e.names||[])naming(acc);
  switch(e.t){
    case 'board':for(const [i,s]of e.steps.entries()){
      if(audit.pro3&&i>0&&i+1<e.steps.length&&(e.lite||[]).includes(i))continue;
      const base=[talk(s.say),s.q,(s.tokens||[]).map(x=>x.label),(s.dests||[]).map(x=>x.label),(s.opts||[]).map(x=>x.t),(s.lines||[]).map(x=>x.title)];
      if(s.k==='card')show('手順'+i+'/説明',[s.name,s.line,s.leaf?.label],s.teaches);
      else{show('手順'+i+'/問い',base);if(s.k==='note'){const cards=(s.lines||[]).flatMap(l=>l.cards.map(c=>c.label));for(let k=0;k<cards.length;k+=2)show('手順'+i+'/記入'+k,[base,cards.slice(0,k+2)]);}for(const [j,t]of (s.tokens||[]).entries())if(t.react)optional('手順'+i+'/札の反応'+j,[base,t.react]);for(const [j,l]of (s.lines||[]).entries())if(l.ask)optional('手順'+i+'/途中の問い'+j,[base,l.ask.say,l.ask.opts.map(o=>o.t)]);for(const [j,r]of Object.values(s.react||{}).entries())optional('手順'+i+'/反応'+j,[base,r]);for(const [j,o]of (s.opts||[]).entries())if(o.result)optional('手順'+i+'/選択の結果'+j,[base,o.result]);show('手順'+i+'/あと',talk(s.after));}
    }show('つづき',talk(e.next));break;
    case 'discover':{
      if(audit.pro3&&D.pro3.lite.includes(e.id)){show('3級の確認',[talk(e.b1.talk),e.b1.dyn?e.b1.dyn(S):'',e.b1.doc&&{...e.b1.doc,rows:v(e.b1.doc.rows)},e.b4.name,e.b4.line,e.b4.exam],e.b4.teaches);break;}
      if(e.dynamic&&!cache.has('dynamic'))cache.set('dynamic',e.dynamic(S,e));const x=e.dynamic?cache.get('dynamic'):e,b=x.b2;
      show('困りごと',[talk(x.b1.talk),x.b1.dyn?x.b1.dyn(S):'',x.b1.doc&&{...x.b1.doc,rows:v(x.b1.doc.rows)}]);
      if(x.predict)show('予想',[x.predict.q,x.predict.opts.map(o=>o.t)]);
      const question=[x.b1.doc&&{...x.b1.doc,rows:v(x.b1.doc.rows)},b.q,b.token,(v(b.tokens)||[]).map(t=>t.label),b.targets.map(t=>[t.label,t.sub])];show('問い',question);
      const hints=base=>branch(()=>{for(const [i,hint]of(b.hints||[]).entries())show('問いのヒント'+i,[base,(b.hints||[]).slice(0,i+1)]);});
      hints(question);const reason=[question,b.reasons.map(r=>r.t)];show('問いの理由',reason);hints(reason);
      for(const [i,t]of b.targets.entries())if(!t.ok&&t.react)optional('問いの反応'+i,t.react);
      for(const [i,r]of b.reasons.entries())if(!r.ok&&r.react)optional('理由の反応'+i,r.react);if(b.wrongReact)optional('並べ方の反応',b.wrongReact);
      show('結果',[b.targets.filter(t=>t.ok).map(t=>t.react),x.b3.ok,x.b3.bs,x.b3.bars]);show('名前',[x.b4.name,x.b4.line,x.b3.bs,(b.layout==='flow'?v(b.tokens).filter(t=>t.je).map(t=>t.je):[]),S.mode==='2026'&&x.b4.exam26?x.b4.exam26:x.b4.exam,x.b4.leaf?.label],x.b4.teaches);optional('手帳',x.hand);break;}
    case 'doc':{
      const ans=v(e.ans);for(const [acc]of [...ans.dr,...ans.cr])naming(acc);
      const doc=e.doc?{...e.doc,rows:v(e.doc.rows)}:null,opts=[...new Set([...(e.opts||[]),...ans.dr.map(x=>x[0]),...ans.cr.map(x=>x[0])])].filter(x=>audit.learned.has(x));
      show('記帳',[doc,opts]);show('書いたあと',[doc,opts,ans.dr.map(x=>x[0]),ans.cr.map(x=>x[0])]);optional('記帳のヒント',[doc,opts,ans.dr.map(x=>x[0]),ans.cr.map(x=>x[0])]);for(const alt of [...(v(e.alts)||[]),...(B.kubun?.altsOf?B.kubun.altsOf(ans,e):[])])optional('会社の書き方/'+alt.form,[doc,opts,alt.note]);
      audit.docCounts||={};audit.docCounts[e.kind]=(audit.docCounts[e.kind]||0)+1;
      const rule=D.rules?.[e.kind];if(rule&&audit.docCounts[e.kind]>=3){const base=[rule.label,rule.entry,rule.conds.map(c=>c.t)];optional('自動仕訳の条件',base);for(const [i,c]of rule.conds.entries())optional('自動仕訳の条件の反応'+i,[base,c.why]);}
      break;}
    case 'calc':show('計算',[e.title,talk(e.talk),v(e.rows),e.q,e.unit]);show('計算の理由',[e.unit,e.why],e.teaches);break;
    case 'desk':{const base=[talk(e.talk),e.q,e.items.map(x=>[x.title,v(x.line)])];show('作業台',base);show('点検の結果',[base,e.items.map(x=>x.why)]);break;}
    case 'sheet':{
      const deskMi=D.months.findIndex(x=>(x.year||1)===(m.year||1)&&x.seg==='desk'),pre={},adj={};
      for(const entry of S.L){if(entry.mi<deskMi){for(const [acc,n]of entry.dr)pre[acc]=(pre[acc]||0)+n;for(const [acc,n]of entry.cr)pre[acc]=(pre[acc]||0)-n;}else if(entry.mi<=S.mi&&!entry.closing){for(const [acc,n]of [...entry.dr,...entry.cr])adj[acc]=(adj[acc]||0)+n;}}
      const names=[...new Set([...Object.keys(pre),...Object.keys(adj)])].filter(acc=>pre[acc]||adj[acc]);show('精算表',[names,'勘定科目 試算表 整理記入 整理後 損益計算書 貸借対照表']);show('差を運ぶ',[names,'当期純利益 損益計算書 貸借対照表']);show('精算表の名前','精算表');break;}
    case 'report':{
      const names=balances();if(!e.kubun&&!e.redo&&!audit.built){for(const acc of names)show('決算書を組む/'+acc,acc);audit.built=true;}
      let displayed=names;if(e.kubun&&D.y2?.maturity){const b=Object.fromEntries(Object.keys(B.accounts).map(a=>[a,bookBalances()[a]||0])),classified=D.y2.maturity.display(S,b,m.bookT??((S.W?.t||1)-1));displayed=Object.keys(classified).filter(a=>classified[a]);}
      const shown=displayed.map(a=>({差入保証金:'差入保証金（投資その他の資産）',長期前払費用:'長期前払費用（投資その他の資産）',繰越商品:'商品',前払家賃:'前払費用',未払賃金:'未払費用',減価償却累計額:'機械装置減価償却累計額'})[a]||a);
      if(e.kubun)shown.push('繰越利益剰余金');show('決算書',[e.kubun?[]:names,shown,'貸借対照表 損益計算書',e.teaches],e.teaches);break;}
    case 'ss':show('株主資本等変動計算書',['資本金','資本準備金','利益準備金','繰越利益剰余金',talk(e.talk)]);break;
    case 'closing':{
      for(const acc of balances().filter(x=>['収益','費用'].includes(B.accounts[x].cat)))show('締切の札/'+acc,acc);
      show('もうけを運ぶ',[audit.learned.has('損益')?'損益':'1年のもうけを集める箱',audit.learned.has('繰越利益剰余金')?'繰越利益剰余金':'これまでのもうけの貯まり','資本金 普通預金']);
      show('締切の名前','損益 繰越利益剰余金 締め切り 当期純利益 決算振替',['損益','繰越利益剰余金','締め切り','当期純利益','決算振替']);break;}
    case 'opening':for(const acc of balances().filter(x=>!['収益','費用'].includes(B.accounts[x].cat)))show('開始記入の札/'+acc,acc);show('開始記入の名前','前期繰越 開始記入',['前期繰越','開始記入']);break;
    case 'talk':if(e.memo)paper('会話の書類',v(e.memo),e.teaches);else show('会話',talk(e.lines),e.teaches);break;
    case 'decision':{const opts=e.optionsFor?v(e.optionsFor):e.options;const base=[talk(e.talk),e.q,opts.map(o=>[o.label,o.desc])];show('判断',base,e.teaches);const trials=[];for(const o of opts.filter(o=>!o.disabled)){const key='trial/'+o.id;if(e.trial&&!cache.has(key))cache.set(key,e.trial(S,o.id));const rows=e.trial?cache.get(key):[];optional('判断の確認/'+o.id,[talk(e.talk),e.q,o.label,o.result,rows]);trials.push([o.label,rows]);}if(e.trial)(audit.trialBookmarks||={})[e.id]=[e.q,trials];break;}
    case 'plan':show('作戦の机',[D.rview.TEXT.plan,D.rview.TEXT.band,e.opens.map(k=>D.rview.HANDS[k]?.label)]);break;
    case 'rreport':{
      const RV=D.rview,t=e.ramenT,tree=RV.forkTree(S,t),back=tree.back.map(x=>[x.title,x.got]);
      show('月報',[RV.TEXT.report,v(e.rows),'給料',t<7?'売上（現金）':'',e.auto(S).map(x=>x.label),back]);
      show('店じまいの帯',RV.TEXT.band);if(t>0){const base=[RV.TEXT.debrief[0],RV.TEXT.debrief[1],Object.values(RV.FACTORS).map(x=>x.label)];show('ふりかえり1',base);for(const [key,f]of Object.entries(RV.FACTORS))optional('ふりかえりの返事/'+key,[base,f.line]);if([2,5,8,11].includes(t%12)){show('ふりかえり2','ほかの理由を合わせると、増えた？へった？');show('ふりかえり3',[RV.TEXT.debrief[0],RV.TEXT.debrief[3],'売上 材料 人のお金 宣伝 家賃・ガス水道電気']);show('ふりかえり4',[RV.TEXT.debrief[0],RV.TEXT.debrief[4],['price','prep','staff','flyer','tweak'].map(k=>RV.HANDS[k].label)]);}}
      show('分かれ道の図',tree);break;}

    case 'bank':show('銀行',talk(e.lines));break;
    case 'ending':{
      const x=D.endings[e.id],SX=readOnly({...live,__ni:D.y2books.income(S.L.filter(entry=>(entry.y||1)===1&&!entry.closing)).net});
      show('原因',[x.title,x.cause(SX)]);show('数字',[x.title,x.numbers(SX).rows]);
      for(const [i,d]of x.docs(SX).entries())paper('届いた書類'+i,d,[],x.title);
      show('その後',[x.title,x.scene(SX)]);show('現実の制度',[x.title,x.reality]);
      const lesson=[x.title,x.lesson,x.check?.q,x.check?.opts.map(o=>o.t),audit.trialBookmarks?.[x.back]];show('学び',lesson);for(const [i,o]of(x.check?.opts||[]).entries())if(o.react)optional('学びの反応'+i,[lesson,o.react]);break;}

    case 'bowl':show('一杯の組立',D.rview.TEXT.bowl);break;
    case 'recall':show('想起',[]);break; // 既出書類から選び、候補もknowsで絞る（engine.js:1122〜1132）。初出はない。
    case 'end':show('年の区切り',[]);break;
    default:throw Error('画面の数え方が未定義 '+e.t);
  }

}
function auditStory({cases='all',seeds=Array.from({length:12},(_,i)=>i),modes=['2026','2027']}={}){
  const {economicStory,forcedStory}=require('./ramen-y2-check.js'),D=SIMDATA,B=BOKI,scan=scanner(B.accounts,B.lex),visited=new Set(),types=new Set(),coverage=[],failures=[],nonCardCases=new Map();let runs=0;
  const bucket=()=>({screens:new Map(),months:new Map(),receivables:new Map()}),normal=bucket(),shortcut=bucket();
  function collect(target,audit,label){
    for(const row of audit.rows)for(const kind of ['firstTeaches','beforeTeach'])if(row[kind].includes('売掛金')){const key=row.month+' '+row.id+' '+kind;if(!target.receivables.has(key))target.receivables.set(key,{month:row.month,id:row.id,kind,witness:label});}
    for(const row of audit.rows){const key=row.month+' '+row.id,old=target.screens.get(key);if(!old||row.newCount>old.newCount)target.screens.set(key,{...row,witness:label});}
    for(const row of audit.result().months){const old=target.months.get(row.month);if(!old||row.newCount>old.newCount)target.months.set(row.month,{...row,witness:label});}
  }
  function run(seed,choices={},forced){const label=forced?`${forced.card}/${forced.option}/${forced.outcome}/seed${seed}/${JSON.stringify(choices)}`:`seed${seed}/${choices.__mode||'2026'}/${JSON.stringify(choices)}`;
    const audits=[new AccountScreens(scan),...[3,5,6,7].map(mask=>{const a=new AccountScreens(scan);a.pro3=true;a.gate=mask;a.learn(D.pro3.words);a.intro=new Set(D.pro3.intros);a.preset=new Set(D.pro3.gate.flatMap((q,i)=>(mask&(1<<i))?q.kinds:[]));return a;})];
    const opts={...choices,__onEvent:(S,e,m)=>{visited.add(S.mi+':'+(e.id||e.t+'#'+m.events.indexOf(e)));types.add(e.t);
      if(e.t==='decision'&&!e.card)for(const option of(e.optionsFor?e.optionsFor(readOnly(S)):e.options).filter(o=>!o.disabled)){
        const key=S.mode+'/'+e.id+'/'+option.id;if(!nonCardCases.has(key))nonCardCases.set(key,{mode:S.mode,event:e.id,option:option.id,seed,choices:{...choices,[e.id]:option.id},forced,reached:false});
      }
      const values=new Map();for(const audit of audits)projectEvent(audit,D,B,S,e,m,values);}};
    const result=forced?forcedStory(seed,opts,forced.card,forced.outcome):economicStory(seed,opts);runs++;if(runs%5===0)console.error(`画面の集計中：${runs}経路（通常＋近道の合格4通り）`);
    for(const c of nonCardCases.values())if(result.S.mode===c.mode&&result.S.decisions[c.event]===c.option){c.reached=true;c.witness||=label;}
    collect(normal,audits[0],label);for(const a of audits.slice(1))collect(shortcut,a,label+'/近道gate'+a.gate);
    return result;
  }
  for(const mode of modes)for(const seed of seeds)run(seed,{__mode:mode});
  if(cases==='all'){
    for(const card of D.cards.deck.filter(c=>!c.y2&&c.docs))for(const opt of card.options){let reached=false;for(const seed of [0,3,7,1,2,4,5,6,8,9,10,11]){const {S}=run(seed,{[card.id]:opt.id});if(Object.entries(S.decisions).some(([id,v])=>id.startsWith(card.id+'@')&&+id.slice(card.id.length+1)<12&&v===opt.id)){reached=true;break;}}if(!reached)failures.push('旧札の選択肢へ未到達 '+card.id+'/'+opt.id);}
    for(const card of D.y2.cards.cards)for(const opt of card.options)for(const out of opt.outcomes){let reached=false;for(const seed of [3,0,7]){const choices={finance_asset:'installment',maintain_y2:'break',maintain_replace:'keep',bonus:'standard',[card.id]:opt.id};if(card.id==='items_stock_sale')choices.ticket_items='n20';if(card.id==='equipment_purchase')choices.finance_asset='loan';if(card.id==='repair_pay')choices.maintain_y2='plan';if(card.id==='close_restore')choices.close='close';if(card.id==='close_equipment')choices.close='format';const {S}=run(seed,choices,{card:card.id,option:opt.id,outcome:out.id});if(S.cardOutcomes.some(x=>x.card===card.id&&x.option===opt.id&&x.outcome===out.id)){reached=true;break;}}coverage.push({card:card.id,option:opt.id,outcome:out.id,reached});if(!reached)failures.push('札の結果へ未到達 '+card.id+'/'+opt.id+'/'+out.id);}
  }
  if(cases==='all')for(const c of nonCardCases.values())if(!c.reached){run(c.seed,c.choices,c.forced);if(!c.reached)failures.push('札以外の選択肢へ未到達 '+c.mode+'/'+c.event+'/'+c.option);}
  const finish=(b,variant)=>{const result={variant,nonCardOptions:[...nonCardCases.values()].map(({mode,event,option,reached,witness})=>({mode,event,option,reached,witness})),receivables:[...b.receivables.values()],runs,displayPaths:runs*(variant==='shortcut'?4:1),types:[...types],eventCount:visited.size,outcomes:coverage,screens:[...b.screens.values()],months:[...b.months.values()],failures};result.screenErrors=result.screens.filter(x=>x.newCount>2);result.monthWarnings=result.months.filter(x=>x.newCount>2);return result;};
  const result=finish(normal,'normal');result.shortcut=finish(shortcut,'shortcut');return result;
}
function exitCode(r){return r.screenErrors.length||r.failures.length||(r.shortcut&&exitCode(r.shortcut))?1:0;}
function auditFixture(fixture){
  const audit=new AccountScreens(scanner(fixture.accounts,{}));
  for(const screen of fixture.screens)audit.show(screen.month,screen.id,screen.text,screen.teaches||[]);
  const r=audit.result();return{runs:1,eventCount:fixture.screens.length,screens:r.screens,months:r.months,screenErrors:r.failures,monthWarnings:r.months.filter(m=>m.newCount>2),failures:[]};
}
function printReport(r){
  console.log(`${r.variant==='shortcut'?'近道':'通常'}の画面の負荷：${r.runs}経路・${r.eventCount}出来事・${r.screens.length}画面・${r.months.length}区切り、1画面3科目以上 ${r.screenErrors.length}件`);
  for(const row of r.screenErrors)console.error(`画面の負荷超過 ${row.month} ${row.id}：${row.newCount}科目（${row.newNames.join('・')}）[${row.witness}]`);
  for(const row of r.monthWarnings)console.log(`注意（月の目安）：${row.month} 新しい科目${row.newCount}（${row.screens.map(s=>s.id+'＝'+s.newNames.join('・')).join(' / ')}）`);
  for(const error of r.failures)console.error(error);if(r.shortcut)printReport(r.shortcut);
}
module.exports={entryBalances,readOnly,AccountScreens,scanner,projectEvent,auditStory,auditFixture,exitCode,printReport};
if(require.main===module&&process.argv.includes('--fixture')){const p=process.argv.indexOf('--fixture'),r=auditFixture(JSON.parse(fs.readFileSync(process.argv[p+1],'utf8')));printReport(r);process.exitCode=exitCode(r);}
else if(require.main===module){global.window=global;for(const f of ['../js/core.js','../js/data/accounts.js','../js/data/kubun.js','../js/sim/lexicon.js'])require(f);const r=auditStory({cases:process.argv.includes('--sample')?'sample':'all'}),i=process.argv.indexOf('--report');if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(r,null,2)+'\n');printReport(r);process.exitCode=exitCode(r);}
