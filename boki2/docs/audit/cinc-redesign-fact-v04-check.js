#!/usr/bin/env node
// J-D（DESIGN-CINC-REBUILD 版0.4 の判定）：cinc-redesign-break.js の Ec と「社長の働きがただ」の確かめ、判定書の表の数え。
// 使い方：node boki2/docs/audit/cinc-redesign-fact-v04-check.js <ratio|labor|judge 判定書>
//   ratio  Ec が住宅地の潜在客 P をどれだけ動かすか：競合0で較正し直した P ÷ 3軒で較正した P（ゲームの calibrate と同じ式）。町 seed 0〜29
//   labor  2号店の「パート1人」の形の回せる客数と人件費：社長の働きが式に入っているか（world.js:34〜37）
//   judge  判定書の表（J8・JR21）の行数と判定の内訳
'use strict';
global.window = global;
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '../..');
const mode = process.argv[2] || 'ratio';
if (mode === 'judge') {
  const t = fs.readFileSync(process.argv[3], 'utf8');
  const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
  const block = (tag) => { const i = t.indexOf(`<!-- ${tag} -->`), j = t.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? [] : t.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
  for (const tag of ['J8', 'JR21']) { const rs = block(tag); const v = {}; rs.forEach((r) => { const k = r[r.length - 2]; v[k] = (v[k] || 0) + 1; }); console.log(`${tag}：${rs.length} 行　${JSON.stringify(v)}`); }
  console.log(`【確かめた】${(t.match(/【確かめた/g) || []).length}／【問い】${(t.match(/【問い/g) || []).length}`);
  process.exit(0);
}
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, BW = D.bowl, C = D.coef;
if (mode === 'ratio') {
  const r = [];
  for (let s = 0; s < 30; s++) {
    const W = Wd.create({ seed: s, area: 'jutaku', form: 'part1' }); const a = W.town.areas.jutaku;
    const ref = { id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: BW.create(BW.presets[0].spec), parts: 1, family: 0, ref: true };
    const sh = Wd.sharesFor({ area: 'jutaku', town: { areas: { jutaku: a } } }, [ref], { neutralFit: true })[0];
    r.push((C('median') * C('potentialScale') * (a.potentialMul || 1) / sh) / a.P);
  }
  r.sort((x, y) => x - y);
  console.log(`住宅地の潜在客 P：Ec（競合0で較正）÷ E（3軒で較正のまま）　町30の中央値 ${r[15].toFixed(3)}、最小 ${r[0].toFixed(3)}、最大 ${r[29].toFixed(3)}`);
}
if (mode === 'labor') {
  for (const f of ['family', 'part1', 'part2']) { const st = { ...Wd.FORMS[f] }; console.log(`${f}：働き手の数（社長を数えない）${Wd.workersOf(st)}、回せる客数 ${Wd.capOf(st)}人/日、月の人件費 ${Wd.laborOf(st)}円`); }
  console.log('読み：パート1人の形は「社長＋パート1人」（DESIGN-RAMEN c.8）で回せる客数を持つが、人件費はパート1人分だけ。2号店に同じ形を使うと、社長が両方の店にいる形になる。');
}
