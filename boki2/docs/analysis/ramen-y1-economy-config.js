'use strict';
// CODEX-TASK-y1-economy 1/2 の感度分析。採用値ではない。
// 範囲外も意図的に試すが coef.check の lo/hi と正式検査の基準は変更しない。
module.exports = {
  base: { label: '基準（版1.2.1）', coef: {} },
  potential: { label: '案A 潜在客×1.15', coef: { potentialScale: 0.6669 }, source: 'd.9.1：0.579913×1.15（小数6桁）。3年目44への再較正なし' },
  ramp: { label: '案B 坂0.75→0.95', coef: { rampStart: 0.75, rampEnd: 0.95 }, source: 'l.4：立ち上がりのみを変更。Pは基準のまま' },
  fixed: { label: '案C その他固定費10万', coef: { otherFixed: 100000 }, source: 'l.4：15万の店のみ10万。25%の20万の店は維持' },
  combined: { label: '案D 坂＋固定費', coef: { rampStart: 0.75, rampEnd: 0.95, otherFixed: 100000 }, source: '案B＋案C（相互作用の比較）' },
  rampStart: { label: '坂の始まり0.55→0.75のみ', coef: { rampStart: 0.75 }, source: 'l.4' },
  rampEnd: { label: '坂の終わり0.85→0.95のみ', coef: { rampEnd: 0.95 }, source: 'l.4' },
  opening: { label: '開店時に話題の山+0.15', coef: {}, openingPeak: 0.15, source: 'd.8：基準の開店時peak=0を普通の山へ。乱数を追加消費しない' },
  rent: { label: '家賃のみ×0.8', coef: { rentPerTsubo: { shotengai: 9600, ekimae: 16000, jutaku: 7200 } }, source: 'l.4：坪数・家賃の町乱数は同じ' },
  freeRent: { label: '家賃なし3→6か月', coef: { freeRent: 6 }, source: 'coef freeRent の注記。教材との接続は未変更' },
  loanGrace: { label: '返済すえおき3→6か月', coef: { loanGrace: 6 }, source: 'coef loanGrace の注記。営業利益と口座の差を診断' },
  retain: { label: '常連定着0.035→0.05', coef: { retain: 0.05 }, source: 'd.1/d.9.1。再較正なし' },
  churn: { label: '常連離れ0.03→0.02', coef: { churn: 0.02 }, source: 'd.1/d.9.1。再較正なし' },
  reputation: { label: '評判の更新0.25→0.35', coef: { repAlpha: 0.35 }, source: 'd.1。初期R=3・体験の式は同じ' },
};
