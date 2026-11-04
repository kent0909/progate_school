// ホーム試作だけの状態。ゲーム本体・外部のデータは読み込まない。
export const VARIANTS = ['a', 'b1', 'b2', 'c', 'd'];
export const GOAL = 100_000_000;
export const yen = value => `${Math.round(value).toLocaleString('ja-JP')}円`;
export function initialSession(variant, now = Date.now()) {
  return {id:globalThis.crypto.randomUUID(), variant, startedAt:now, finishedAt:null,
    elapsedMs:null, homeOpens:0, numberClicks:0, lineClicks:0, decision:null,
    posted:0, answers:[], events:[], phase:'home'};
}
export function financials(session, scenario) {
  const result = {...scenario.opening};
  for (const doc of scenario.documents.slice(0, session.posted)) {
    for (const [key, amount] of Object.entries(doc.effect)) result[key] += amount;
  }
  if (session.decision === 'flyer') {
    result.cash -= 20_000;
  }
  result.net = result.cash + result.account - result.loan;
  result.unposted = session.posted === 0;
  return result;
}
export function outlook(finance, scenario) {
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
export function log(session, type, detail = {}) {
  session.events.push({type, at:Date.now(), posted:session.posted, ...detail});
}
export function quizChoices(correct) {
  // 4つとも異なる円額。毎回同じ並びで、正解の位置だけを目印にできないよう問いごとに回す。
  return [correct + 20_000, Math.max(0,correct - 10_000), correct, correct + 1_000_000];
}
