#!/usr/bin/env node
// 年2以降の検査。基準23d31d7の1年目の世界全文をハッシュで固定する。
// --world は世界の境界だけ。台本の受け入れ合格とは区別する。
'use strict';
const assert = require('assert/strict');
const crypto = require('crypto');
const path = require('path');
global.window = global;
const root = path.join(__dirname, '..');
for (const f of ['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', ...require('./ramen-files.js').story]) require(path.join(root, f));
const D = global.SIMDATA, wd = D.world;
const clone = x => JSON.parse(JSON.stringify(x));
const BASELINE = /* 基準の実測。検査対象から作り直さない */ {
  "0:shotengai": "22519878fb2c72ebaec22b204019ccf24dd021619a01aa3a16220251637821ea",
  "0:ekimae": "52e033c02a49d37a14e821e6bdbbbf5555b82e61b1c7798bd2d5aca1f8172146",
  "0:jutaku": "9bd5abff1568dd6bc2f25e661f580f2a74ffffb42e002533c6cafe7414ef0694",
  "1:shotengai": "a0e4cc55cae92a81288335b59cc69c8cb2627a0758cc8a9878c3cd5a07bc2ebb",
  "1:ekimae": "8be8c01ce35dabb2544416d2c06af65eee51bf2bb091cfe0baff32401da490ba",
  "1:jutaku": "70a1ea4da377f3cb52634ec49a5b5190c8fecbb929030c291c779878137f1305",
  "2:shotengai": "6effcf437ae21a3978dfa60c16d0aa56dbb24cf07d85e773906f2164b27f3536",
  "2:ekimae": "a82384652d8e54b95fbd00202b572b5fea7e25b916ed11a466078e235bed1cfc",
  "2:jutaku": "30f70c857add2e37041a9dc6d918c770592ae88caaec58a2b94c0973090f6081"
};
let baselineMonths = 0;
for (const [key, want] of Object.entries(BASELINE)) {
  const [seed0, area] = key.split(':'), seed = +seed0;
  let W = wd.create({ seed, area });
  const h = crypto.createHash('sha256');
  for (let t = 0; t < 12; t++) {
    const r = wd.month(W, wd.policy0(W), { rng: D.rng(seed * 100 + t) });
    h.update(JSON.stringify(r)); W = r.W; baselineMonths++;
  }
  assert.equal(h.digest('hex'), want, `1年目の基準と不一致：${key}`);
}
const finite = (x, at) => {
  if (typeof x === 'number') assert.ok(Number.isFinite(x), `${at}が有限でない`);
  else if (x && typeof x === 'object') for (const [k,v] of Object.entries(x)) finite(v, `${at}.${k}`);
};
// 会社の借入を複製せず、同じ町の2店は需要の分母を共有する。
function twoStores(seed, area) {
  const W = wd.create({ seed }); W.t = 12; W.y = 2;
  const branch = wd.create({ seed, area });
  const st = branch.stores[0]; st.id = 'branch'; W.stores.push(st);
  if (area !== W.area) {
    W.town.areas[area] = branch.town.areas[area];
    W.rivals.push(...branch.rivals.map(r => ({ ...r, id: `branch:${r.id}`, area })));
  }
  return W;
}
const SUM = ['N', 'Nd', 'demand', 'X', 'waste', 'lost', 'sales', 'cogs', 'wasteCost', 'labor', 'rent', 'util', 'other', 'dep', 'ads', 'op', 'interest', 'ord', 'repay', 'fx'];
let multiMonths = 0;
for (let seed = 0; seed < 8; seed++) for (const area of ['shotengai', 'ekimae', 'jutaku']) {
  let W = twoStores(seed, area);
  for (let t = 12; t < 36; t++) {
    const before = JSON.stringify(W);
    const { W: next, res } = wd.month(W, wd.policy0(W), { noCards: true, rng: D.rng(seed * 97 + t) });
    assert.equal(JSON.stringify(W), before, '入力の世界を書き換えた');
    finite(next, '世界'); finite(res, '月報');
    for (const k of SUM) assert.equal(res[k], res.stores.reduce((a,r) => a + (r[k] || 0), 0), `店別の合計：${k}`);
    assert.equal(next.cash, W.cash + res.ord + res.dep - res.repay);
    assert.equal(res.interest, res.stores[0].interest, '利息を2店分にした');
    assert.equal(res.repay, res.stores[0].repay, '返済を2店分にした');
    W = next; multiMonths++;
  }
}
{
  const W = wd.create({ seed: 1 }); W.t = 12; W.y = 2;
  const alone = wd.month(W, wd.policy0(W), { noise: false, noCards: true }).res;
  const same = twoStores(1, 'shotengai');
  const near = wd.month(same, wd.policy0(same), { noise: false, noCards: true }).res;
  assert.ok(near.stores[0].demand < alone.demand, '同じ町で客を取り合わない');
  const farW = twoStores(1, 'ekimae');
  const far = wd.month(farW, wd.policy0(farW), { noise: false, noCards: true }).res;
  assert.equal(far.stores[0].demand, alone.demand, '別の町の支店が本店の需要を削った');
  same.stores[1].open = false;
  const closed = wd.month(same, wd.policy0(same), { noise: false, noCards: true }).res;
  assert.equal(closed.sales, alone.sales, '閉店した支店の売上が残る');
}
// 通常・carryともapplyを通る。capital/investは売上や費用を動かさない。
let flowCases = 0;
for (const flow of ['op', 'capital', 'invest']) for (const cash of [-50000, 300000]) {
  const id = `check-${flow}-${cash}`;
  const card = { id, when: () => false, options: [{ id: 'go', cash: 1000, outcomes: [{ id: 'ok', w: 100, cash, flow }] }] };
  D.cards.register([card]);
  const W = wd.create({ seed: 1 }), p = wd.policy0(W);
  const base = wd.month(W, p, { noise: false, carry: [] });
  const got = wd.month(W, p, { noise: false, carry: [{ id, option: 'go', t: -1 }] });
  assert.equal(got.W.cash - base.W.cash, cash + 1000);
  assert.equal(got.res.op - base.res.op, flow === 'op' ? cash + 1000 : 0);
  assert.equal(got.res.ord - base.res.ord, flow === 'op' ? cash + 1000 : 0);
  if (flow !== 'op') assert.equal(got.res[flow], cash + 1000);
  flowCases++;
}
console.log(`OK：世界の境界（1年目の基準全文 ${baselineMonths}か月・2店 ${multiMonths}か月・資金区分 ${flowCases}枝・同じ町/別の町/閉店）`);
if (!process.argv.includes('--world')) {
  console.error('未完：2・3年目の台本と全札・口座照合はまだ接続していない。--worldの成功は全体の合格ではない。');
  process.exitCode = 1;
}
