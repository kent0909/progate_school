#!/usr/bin/env node
// J-B：B が「ない」とした31行について、ramen.html が読むゲームのファイル（boki2/js のうち ramen.html の <script> にあるもの）を語で探す。
// 語ごとに当たった行を数え、当たった行の頭を並べる（判定は人が読んで書く。ここは探した証拠を残すだけ）。
// 使い方：node cinc-rebuild-B-fact-nai.js [--lines]
'use strict';
const fs = require('fs'), path = require('path');
const B = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(B, 'ramen.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]).filter(f => !/^js\/data\//.test(f)); // 試験問題のデータは外す（ゲームの仕組みではない）
const TERMS = {
  R6: ['委任', '店長', '方針の札', '任せる', 'manager', 'delegate'],
  R8: ['規模', '共通の仕入', '本部', 'まとめ買い', 'scale', 'hq'],
  L3a: ['工場', 'factory', '製麺'], L3b: ['子会社', '出資', '産地', '自家製', 'subsidiar'],
  L4b: ['購入', '買う', '土地', '2階', '賃料', 'buyLot', 'own'],
  L5a: ['本部', '部署', 'department'], L5b: ['方針', '採点', '枠を守'],
  L6b: ['議決', '否決', '総会', '上場', 'IPO', 'vote'],
  L7b: ['rivals.push', '身売り', '買収', 'expand', '出店'],
  L8a: ['有価証券', '株を買', '株式を', 'securities', 'invest'],
  L9b: ['役員報酬', '社長の財布', '社長個人', '寄付', '報酬', 'salary'],
  L10b: ['新聞', 'news', '号外', '施行'],
  L11b: ['副目標', 'ゴールの後', '1億', 'GOAL', '占有率'],
  L12a: ['隣町', '県内', '通販', '町の外', 'town2'], L12b: ['別の町', '地域'],
  V2: ['都市', 'city'], V9: ['農園', '畑', 'farm'], V13: ['店長'], V15: ['代理店', '広告', 'agency'],
  V17: ['オフィス', '事務所'], V18: ['部署'], V20: ['重役', '役員', 'executive'], V23: ['上場', 'IPO'],
  V25: ['他社株', '有価証券', '売買目的'], V26: ['ベンチャー', 'venture', '出資'], V27: ['買収', 'acquire', '合併'],
  V28: ['不動産', '土地', '建物を買', 'realEstate'], V31: ['球団', 'スポーツ', 'sports'], V33: ['移動', 'travel', '別の町'],
  E1: ['フランチャイズ', 'FC', '割引', 'volume', '規模'], E3: ['株主の要求', '要求', '株主が', 'demand'],
};
const src = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(B, f), 'utf8').split('\n')]));
const out = {};
for (const [id, terms] of Object.entries(TERMS)) {
  out[id] = {};
  for (const t of terms) {
    const hits = [];
    for (const [f, L] of Object.entries(src)) L.forEach((l, i) => { if (l.includes(t)) hits.push(`${f}:${i + 1}`); });
    out[id][t] = process.argv.includes('--lines') ? hits.slice(0, 12) : hits.length;
  }
}
console.log(JSON.stringify({ files: files.length, out }, null, 1));
