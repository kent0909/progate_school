(function (root) {
'use strict';
// ホーム試作だけの状態。ゲーム本体・外部のデータは読み込まない。
const VARIANTS = ['a', 'b1', 'b2', 'c', 'd', 'e'];
const GOAL = 100_000_000;
const yen = value => `${Math.round(value).toLocaleString('ja-JP')}円`;
function initialSession(variant, now = Date.now(), stale = 0) {
  return {id:globalThis.crypto.randomUUID(), variant, scenarioVersion:2, stale, received:stale?2:1, stampClicks:0, staleVisibleMs:0, staleHomeOpens:0, batchTimings:stale?[{day:7,receivedAt:now,clearedAt:null,advancedAt:null}]:[], startedAt:now, finishedAt:null,
    elapsedMs:null, homeOpens:0, numberClicks:0, lineClicks:0, decision:null,
    posted:0, answers:[], quizOrder:[], events:[], phase:'home'};
}
function financials(session, scenario) {
  const result = {...scenario.opening};
  for (const doc of scenario.documents.slice(0, session.posted)) {
    for (const [key, amount] of Object.entries(doc.effect)) result[key] += amount;
  }
  if (session.decision === 'flyer') {
    result.cash -= 20_000;
  }
  result.money = result.cash + result.account;
  result.net = result.money - result.loan;
  // PROTO-SPEC-home 3章・6620341537：純利益は売上−仕入−家賃−給料−広告。
  // 備品は持ち物なので費用に含めない。記帳した仕訳の借方の費用だけを集計する。
  const expenses = new Set(['仕入','支払家賃','給料','広告宣伝費']);
  result.profit = result.sales - scenario.documents.slice(0,session.posted).flatMap(d=>d.debit).reduce((sum,[name,amount])=>sum+(expenses.has(name)?amount:0),0) - (session.decision==='flyer'?20_000:0);
  result.cashChange = result.money - scenario.opening.cash - scenario.opening.account;
  result.unposted = session.posted === 0;
  return result;
}
function outlook(finance, scenario) {
  // PROTO-SPEC-home 3章：ネットキャッシュ = 現金 + 普通預金 − 借入金。
  // b1: 残額 = max(0, 1億 − いまのネットキャッシュ)。
  // ペース = 記帳後のネットキャッシュ − 月初のネットキャッシュ。
  // 未記帳だけ先月の増え方40,000円。到達まで = ceil(残額 / ペース)。
  // ペースが0以下なら到達日を出さない。年は西暦ではなくゲーム内の「年目」。
  const remaining = Math.max(0, GOAL - finance.net);
  const openingNet = scenario.opening.cash + scenario.opening.account - scenario.opening.loan;
  const pace = finance.unposted ? scenario.previousPace : finance.net - openingNet;
  const months = remaining === 0 ? 0 : pace > 0 ? Math.ceil(remaining / pace) : null;
  const index = months === null ? null : (scenario.startYear - 1) * 12 + scenario.startMonth - 1 + months;
  // b2: 必要な毎月の増え方 = ceil(残額 / (120 − 経過1か月))。
  // 今月の途中なので経過と残り119か月は変えず、各記帳・判断の後で残額とペースを再計算。
  const requiredMonthly = Math.ceil(remaining / scenario.deadlineMonths);
  return {remaining, pace, months, year:index === null ? null : Math.floor(index / 12) + 1,
    month:index === null ? null : index % 12 + 1, requiredMonthly,
    progress:Math.max(0,Math.min(1,finance.net / GOAL))};
}
function log(session, type, detail = {}) {
  session.events.push({type, at:Date.now(), posted:session.posted, ...detail});
}
function quizChoices(correct, seed) {
  // PR #14・6620016898：記録id＋問いを種にFisher–Yatesで並べ替える。
  // 正解の位置を固定せず、同じ記録・問いでは再読み込みしても同じ順になる。
  // FNV-1aで文字列を32bit化し、Mulberry32の乱数列で各交換先を選ぶ。
  // 実際に出した4択は session.quizOrder に保存する（home.js）。
  const choices = [correct + 20_000, Math.max(0,correct - 10_000), correct, correct + 1_000_000];
  let state = 2166136261;
  for (const character of seed) state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  function random() {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// 6620500448：2枚の間には印なしのホームを挟み、進む札で次の日付へ。
const pendingCount = session => Math.max(0,session.received-session.posted);
const hasStamp = session => session.stale === 1 && pendingCount(session)>0;
function delivery(session) {
  const days=[7,14,21];
  return {day:session.posted===6?31:days[Math.floor((session.received-1)/2)],
    bookMonth:session.posted===0?4:5,
    bookDay:session.posted===0?30:days[Math.floor((session.posted-1)/2)],
    pending:pendingCount(session), waiting:session.stale===1&&pendingCount(session)===0&&session.posted<6};
}

const api = root.BOKI_HOME || (root.BOKI_HOME = {});
Object.assign(api, {VARIANTS, GOAL, yen, initialSession, financials, outlook, log, quizChoices, pendingCount, hasStamp, delivery});
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
