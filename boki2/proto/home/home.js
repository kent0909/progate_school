(function () {
'use strict';
const {VARIANTS, yen, initialSession, financials, outlook, log, quizChoices, pendingCount, hasStamp, delivery, scenario} = window.BOKI_HOME;
const params = new URLSearchParams(location.search);
const variant = VARIANTS.includes(params.get('v')) ? params.get('v') : 'a';
const stale = params.get('stale') === '1' ? 1 : 0;
const locked = params.get('lock') === '1';
const KEY = 'boki2.proto.home.v1';
const home = document.querySelector('#home');
const dialog = document.querySelector('#dialog');
const content = document.querySelector('#dialog-content');
const status = document.querySelector('#storage-status');
let stampSince = null, pageIsActive = true;
let store = {version:1,sessions:[]};
try {
  const raw = localStorage.getItem(KEY);
  if(raw) {const parsed=JSON.parse(raw);if(parsed.version===1&&Array.isArray(parsed.sessions))store=parsed;}
} catch {status.textContent='端末に保存できません。終了前に記録を書き出してください。';}
let session=store.sessions.findLast(s=>s.variant===variant&&s.stale===stale&&s.scenarioVersion===2&&!s.archived)||newSession();
function newSession(){const next=initialSession(variant,Date.now(),stale);store.sessions.push(next);return next;}
function stampCanBeSeen(){
  const el=home.querySelector('[data-stale]'),r=el?.getBoundingClientRect();
  return pageIsActive&&document.visibilityState==='visible'&&!home.hidden&&!dialog.open&&hasStamp(session)&&r&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;
}
function pauseStamp(){if(stampSince!==null){session.staleVisibleMs+=Math.max(0,Date.now()-stampSince);stampSince=null;}}
function save(){
  pauseStamp();
  if(stampCanBeSeen())stampSince=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(store));}
  catch{status.textContent='端末に保存できません。終了前に記録を書き出してください。';}
}
function showDialog(title,body,after,kind='standard'){
  pauseStamp();home.hidden=kind==='quiz';dialog.classList.toggle('quiz',kind==='quiz');
  content.innerHTML=`<h2 id="dialog-title">${title}</h2>${body}`;
  if(!dialog.open)dialog.showModal();after?.();save();
}
function closeDialog(){dialog.close();openHome();}
const button=(label,action,cls='')=>`<button class="${cls}" data-action="${action}">${label}</button>`;
const signYen=n=>`${n>=0?'＋':'−'}${yen(Math.abs(n))}`;
function stamp(){
  if(!hasStamp(session))return '';
  const d=delivery(session);
  const text=variant==='a'?`まだの書類 ${d.pending}枚`:`${d.bookMonth}月${d.bookDay}日の帳簿まで・まだの書類 ${d.pending}枚`;
  return `<button class="stale-stamp" data-action="stale" data-stale data-pending="${d.pending}" data-book-date="${d.bookMonth}-${d.bookDay}">${text}</button>`;
}
function metric(label,value,comparison,action){
  return `<button data-action="${action}"><span class="metric-label">${label}</span><strong class="big-number">${yen(value)}</strong>${comparison===undefined?'':`<span class="comparison">先月比 ${signYen(comparison)}</span>`}</button>`;
}
function renderMetrics(f,o){
  const cls=hasStamp(session)?' is-stale':'';
  if(variant==='a')return '<section class="metrics empty" aria-hidden="true"></section>';
  if(variant==='e')return `<section class="metrics money-overlay${cls}" aria-label="お金と日付"><button data-action="money">お金 <strong class="money-number">${yen(f.money)}</strong></button><span class="date-badge">1年目 5月${delivery(session).day}日</span>${stamp()}</section>`;
  if(variant==='b1'||variant==='b2'){
    const forecast=variant==='b1'?(o.months===null?'このペースでは届かない':`このペースだと${o.year}年目の${o.month}月`):`1億まで、毎月${yen(o.requiredMonthly)}ずつ増やせば10年目に届く（いまは毎月${yen(o.pace)}）`;
    return `<section class="metrics progress-metrics${cls}" aria-label="1億への見込み"><button data-action="outlook"><span class="forecast">${forecast}</span><span class="progress-track" role="img" aria-label="1億への線"><i></i></span></button>${stamp()}</section>`;
  }
  if(variant==='c')return `<section class="metrics kpis${cls}" aria-label="今月の業績">${metric('売上',f.sales,f.sales-scenario.previous.sales,'sales')}${metric('今月のもうけ（純利益）',f.profit,f.profit-scenario.previous.profit,'profit')}<p class="cash-change">お金の増え ${signYen(f.cashChange)}</p>${stamp()}</section>`;
  return `<section class="metrics band${cls}" aria-label="店のお金">${metric('口座のお金',f.account,undefined,'account')}${metric('借入金',f.loan,undefined,'loan')}${metric('手もとに残るお金',f.net,undefined,'net')}${stamp()}</section>`;
}
function stage(done, overlay = '') {
  // 全版で同じSVG・同じ人物を使い、配置と絵の高さだけ変える。
  return `<section class="stage" aria-label="屋台と客と店員の仮の絵">${overlay}<span class="stage-caption">いつもの商店街</span><svg viewBox="0 0 880 340" preserveAspectRatio="xMidYMid meet" role="img" aria-label="中央に朱色の暖簾の屋台、奥に店員、左に客">
  <path fill="#ded1bc" d="M0 250h880v90H0z"/><path fill="#eee7dc" d="M0 0h880v250H0z"/>
  <path fill="#d7c6ad" d="M30 105h115v145H30zm680-55h135v200H710z"/><path fill="#c4b198" d="M45 130h80v70H45zm680-45h100v95H725z"/>
  <path fill="#b18a61" stroke="#735a41" stroke-width="3" d="M240 135h365v145H240z"/><path fill="#493f35" d="m216 135 40-48h333l42 48z"/><path fill="#ac4228" d="M240 135h365v48H240z"/><path stroke="#f6f0e6" stroke-width="3" d="M300 135v44m61-44v44m61-44v44m61-44v44m61-44v44"/>
  <path fill="#e7d1ac" d="M260 188h325v55H260z"/><circle fill="#cea585" stroke="#735a41" stroke-width="2" cx="429" cy="202" r="17"/><path fill="#fffdf8" d="M407 219h44v28h-44z"/><path fill="#fffdf8" d="M410 182h38v9h-38z"/>
  <path fill="#866342" d="M223 242h400v15H223z"/><path fill="#f6f0e6" stroke="#735a41" stroke-width="2" d="M315 233h35l-7 10h-21zm170 0h35l-7 10h-21z"/><path fill="#6e5640" d="M270 278h35v17h-35zm275 0h35v17h-35z"/>
  <circle fill="#cea585" stroke="#735a41" stroke-width="2" cx="162" cy="229" r="17"/><path fill="#89725e" d="M140 249q22-10 44 0v47h-44z"/><path stroke="#493f35" stroke-width="8" d="M150 292v19m23-19v19"/>
  <path fill="#a8ae91" d="M640 218h36v52h-36z"/><path fill="#69765c" d="m632 220 26-42 27 42z"/>
  </svg>${done ? '' : '<button class="visitor" data-action="document" aria-label="書類を持ってきた相手と話す"><span class="alert" aria-hidden="true">!</span><span class="head" aria-hidden="true"></span><span class="body" aria-hidden="true"></span></button>'}</section>`;
}
function renderCard(){
  const d=delivery(session),done=session.posted===6,doc=scenario.documents[session.posted];
  if(d.waiting)return `<section class="inbox"><button class="next-card" data-next-doc data-action="advance"><span class="face" aria-hidden="true">届</span><span class="card-copy"><span class="card-title">届いた書類を記帳しました</span><span class="card-sentence">5月${d.day===7?14:21}日へ進む</span></span><span class="arrow" aria-hidden="true">→</span></button></section>`;
  const layers=Array.from({length:Math.min(2,pendingCount(session)-1)},(_,i)=>`<div class="stack ${i?'second':''}" aria-hidden="true"></div>`).join('');
  return `<section class="inbox ${done?'closed':''}" aria-label="次の書類">${layers}<button class="next-card" data-next-doc data-action="${done?'close-month':'document'}"><span class="face" aria-hidden="true">${done?'済':doc.person.slice(0,1)}</span><span class="card-copy"><span class="card-title">${done?'受け箱は空になりました':`${doc.person}から・${doc.kind}`}</span><span class="card-sentence">${done?'5月31日、今月を締める':doc.sentence}</span>${done?'':`<span class="card-amount">${yen(doc.amount)}</span>`}</span><span class="arrow" aria-hidden="true">→</span></button>${variant==='a'?stamp():''}</section>`;
}
function render(changed=false){
  home.className=`variant-${variant}${changed?' changed':''}`;
  const f=financials(session,scenario),o=outlook(f,scenario),metrics=renderMetrics(f,o);
  home.innerHTML=(variant==='e'?'':metrics)+stage(pendingCount(session)===0,variant==='e'?metrics:'')+renderCard()
    +(session.posted>=3&&!session.decision?`<section class="decision"><h2>今月、チラシを打つ？</h2><p>近所の人に店を知ってもらうために。</p><div class="choices">${button('チラシを打つ（20,000円、現金）','flyer')}${button('打たない','skip')}</div></section>`:'')
    +`<p class="month-status">${session.finishedAt?'今月の記録を残しました。':session.decision?'チラシの判断をしました。次の書類へ。':'届いた書類から、お店の一日を進めよう。'}</p>`;
  const line=home.querySelector('.progress-track i');if(line)line.style.width=`${o.progress*100}%`;
  save();
}
function openHome(changed=false){
  pauseStamp();home.hidden=false;dialog.classList.remove('quiz');
  session.homeOpens++;if(hasStamp(session))session.staleHomeOpens++;
  log(session,'home',{staleVisible:hasStamp(session)});render(changed);
  if(changed)setTimeout(()=>home.classList.remove('changed'),500);
}
function openDocument(){
  if(session.posted>=3&&!session.decision){showDecision();return;}
  if(pendingCount(session)===0)return;
  const doc=scenario.documents[session.posted];
  log(session,'document_open',{document:doc.id});
  showDialog(doc.kind,`<p>${doc.person}「${doc.sentence}」</p><p><strong>${yen(doc.amount)}</strong></p><div class="journal"><div><b>借方</b>${doc.debit.map(row=>`<p>${row[0]}<span>${yen(row[1])}</span></p>`).join('')}</div><div><b>貸方</b>${doc.credit.map(row=>`<p>${row[0]}<span>${yen(row[1])}</span></p>`).join('')}</div></div>${button('記帳した','post','primary')}${button('店の前へ戻る','back','close')}`);
}
function showNumbers(action){
  if(action==='outlook')session.lineClicks++;else session.numberClicks++;
  log(session,action==='outlook'?'line_click':'number_click',{target:action});
  const f=financials(session,scenario),o=outlook(f,scenario);
  showDialog(action==='outlook'?'1億への見込み':'今月のお金',`<ul class="details-list"><li>口座のお金：${yen(f.account)}</li><li>現金：${yen(f.cash)}</li><li>借入金：${yen(f.loan)}</li><li>手もとに残るお金：${yen(f.net)}（現金 ＋ 普通預金 − 借入金）</li><li>売上：${yen(f.sales)}</li><li>今月のもうけ（純利益）：${yen(f.profit)}</li><li>お金の増え：${signYen(f.cashChange)}</li>${action==='outlook'?`<li>1億まで：${yen(o.remaining)}</li><li>毎月のペース：${yen(o.pace)}</li><li>${scenario.assumption}</li><li>期限まで${scenario.deadlineMonths}か月、必要月額${yen(o.requiredMonthly)}。</li>`:''}</ul>${button('店の前へ戻る','back','close')}`);
}
function showDecision(){showDialog('今月、チラシを打つ？','<p>近所の人に店を知ってもらうために。</p><div class="choices">'+button('チラシを打つ（20,000円、現金）','flyer')+button('打たない','skip')+'</div>'+button('店の前へ戻る','back','close'));}
function closeMonth(){
  if(!session.decision){showDecision();return;}
  if(!session.finishedAt){session.finishedAt=Date.now();session.elapsedMs=session.finishedAt-session.startedAt;session.phase='quiz';if(stale)session.batchTimings.at(-1).closedAt=Date.now();log(session,'month_closed');save();}
  if(session.answers.length<2)showQuiz();else showDialog('今月を締めました','<p>受け箱が空になり、お店の1か月が終わりました。</p>'+button('店の前へ戻る','back','close'));
}
function showQuiz(){
  const f=financials(session,scenario),o=outlook(f,scenario),q=session.answers.length,correct=q===0?f.account:o.remaining;
  session.quizOrder||=[];
  if(!session.quizOrder[q])session.quizOrder[q]={question:q===0?'account':'remaining',choices:quizChoices(correct,`${session.id}:${q}`),at:Date.now()};
  showDialog('今月のふりかえり',`<p>${q===0?'いまお店の口座のお金はいくら？':'1億まであとどれくらい？'}</p><div class="quiz-options">${session.quizOrder[q].choices.map(n=>`<button data-answer="${n}">${yen(n)}</button>`).join('')}</div>`,undefined,'quiz');
}
function exportRecords(){
  pauseStamp();log(session,'export');
  showDialog('記録を書き出す','<p>この端末にある試遊の記録です。下の JSON をコピーして保存できます。</p><label for="export-json">記録（JSON）</label><textarea id="export-json" readonly></textarea><div class="choices">'+button('JSONを保存','download')+button('店の前へ戻る','back')+'</div>');
  document.querySelector('#export-json').value=JSON.stringify({version:1,exportedAt:new Date().toISOString(),sessions:store.sessions},null,2);
}
function advance(){
  if(!delivery(session).waiting)return;
  const now=Date.now(),batch=session.batchTimings.at(-1),nextDay=batch.day===7?14:21;
  batch.advancedAt=now;batch.elapsedUntilAdvanceMs=now-batch.receivedAt;batch.clearToAdvanceMs=now-batch.clearedAt;
  session.received+=2;session.batchTimings.push({day:nextDay,receivedAt:now,clearedAt:null,advancedAt:null});
  log(session,'advance',{day:nextDay,elapsedUntilAdvanceMs:batch.elapsedUntilAdvanceMs,clearToAdvanceMs:batch.clearToAdvanceMs});openHome();home.focus();
}
function handleAction(action){
  if(action==='document')openDocument();
  if(action==='advance')advance();
  if(action==='post'){
    if(pendingCount(session)===0)return;
    log(session,'posted',{document:scenario.documents[session.posted].id,day:delivery(session).day});session.posted++;
    if(!stale)session.received=Math.min(6,session.posted+1);
    else if(pendingCount(session)===0)session.batchTimings.at(-1).clearedAt=Date.now();
    dialog.close();openHome(true);home.focus();
  }
  if(action==='back')closeDialog();
  if(['account','loan','net','sales','profit','money','outlook'].includes(action))showNumbers(action);
  if(action==='stale'){
    session.stampClicks++;log(session,'stamp_click',{...delivery(session)});
    const d=delivery(session);showDialog('まだ記帳していない書類があります',`<p>${d.bookMonth}月${d.bookDay}日の帳簿までの数です。届いた書類のうち、まだ${d.pending}枚を記帳していません。</p><p>数と線は、記帳した書類だけで計算しています。</p>${button('店の前へ戻る','back','close')}`);
  }
  if(action==='flyer'||action==='skip'){if(session.decision)return;session.decision=action;log(session,'decision',{choice:action});if(dialog.open)dialog.close();openHome(true);}
  if(action==='close-month')closeMonth();
  if(action==='confirm-restart'){pauseStamp();session.archived=true;session=newSession();dialog.close();openHome();home.focus();}
  if(action==='download'){
    const url=URL.createObjectURL(new Blob([document.querySelector('#export-json').value],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`home-${variant}-stale${stale}-${session.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}
for(const container of [home,dialog])container.addEventListener('click',event=>{
  const answer=event.target.closest('[data-answer]');
  if(answer&&session.phase==='quiz'&&session.answers.length<2){
    const f=financials(session,scenario),q=session.answers.length,correct=q===0?f.account:outlook(f,scenario).remaining;
    session.answers.push({question:q===0?'account':'remaining',answer:Number(answer.dataset.answer),selectedIndex:session.quizOrder[q].choices.indexOf(Number(answer.dataset.answer)),correct:Number(answer.dataset.answer)===correct,at:Date.now()});log(session,'quiz_answer',{question:q});save();
    if(session.answers.length===2){session.phase='done';save();dialog.close();openHome();home.focus();}else showQuiz();return;
  }
  const target=event.target.closest('[data-action]');if(target)handleAction(target.dataset.action);
});
dialog.addEventListener('cancel',event=>{event.preventDefault();if(session.phase!=='quiz')closeDialog();});
document.querySelector('#export').addEventListener('click',exportRecords);
document.querySelector('#restart').addEventListener('click',()=>showDialog('もう一度遊びますか？','<p>今の記録を残して、同じホームで新しく始めます。</p><div class="choices">'+button('もう一度遊ぶ','confirm-restart','primary')+button('今の試遊へ戻る','back')+'</div>'));
for(const event of ['scroll','resize'])window.addEventListener(event,()=>save(),{passive:true});
document.addEventListener('visibilitychange',save);
window.addEventListener('pagehide',()=>{pageIsActive=false;save();});
window.addEventListener('pageshow',()=>{pageIsActive=true;save();});
document.body.classList.add(`variant-${variant}`);
if(variant==='d')document.querySelector('.masthead p').textContent=`方針：${scenario.policy}`;
const nav=document.querySelector('#variants');nav.hidden=locked;
nav.innerHTML=VARIANTS.map(v=>`<a href="?v=${v}&stale=${stale}" ${v===variant?'aria-current="page"':''}>${({a:'a 数なし',b1:'b1 見込み',b2:'b2 逆算',c:'c 業績',d:'d 帯',e:'e 店とお金'})[v]}</a>`).join('');
const options=document.querySelector('#stale-options');options.hidden=locked;
options.innerHTML=[0,1].map(s=>`<a href="?v=${variant}&stale=${s}" ${s===stale?'aria-current="page"':''}>帳簿の遅れ ${s?'あり':'なし'}</a>`).join('');
openHome();if(session.phase==='quiz')showQuiz();
})();
