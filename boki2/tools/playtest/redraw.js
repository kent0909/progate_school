#!/usr/bin/env node
// 検査者の属性のくじの引き直し（panel.json）。割り当てが「その役の人として現実にありそうか」を検査者自身が確かめ、
// ありえないときだけ、根拠つきの理由を書いて引き直す。まとめ役は選ばない（種は id と回数から決まる）。引き直しは panel.json の history に残る。
// Usage: node redraw.js <panel.json> <id> "<ありえない理由（根拠の資料 [[src:coll:doc]] があれば書く）>" [項目,項目]
//   項目を指定しなければ、ありえないと言った項目（slot・device など）だけでなく全部を引き直す
const fs = require('fs');
const crypto = require('crypto');
const [, , file, id, reason, keysArg] = process.argv;
if (!file || !id || !reason || reason.length < 20) { console.error('理由を20字以上で書くこと（なぜ現実にありえないか、根拠）'); process.exit(1); }
const P = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!P.panel[id]) { console.error(`panel.json に ${id} がない`); process.exit(1); }
// 役ごとの、現実にありそうな候補（子どもは学校の時間を除き、端末は家の物・親の物）
const KIDS = id.startsWith('child'), HS = id === 'hs' || id === 'teen15';
const OPT = {
  slot: KIDS ? ['放課後', '夕ごはんのあと', '休日にまとめて'] : HS ? ['放課後', '夜（寝る前）', '休日にまとめて', '通学の電車'] : ['平日の朝', '通勤・通学の電車', '昼休み', '平日の夜', '休日にまとめて', '深夜'],
  device: KIDS ? ['家のiPad', '家のAndroidタブレット', '親のスマホ（iPhone）', '親のスマホ（Android）', '家のパソコン（Windows）'] : ['Androidスマホ', 'iPhone', 'iPad', 'Androidタブレット', 'WindowsノートPC', 'Mac', 'Chromebook'],
  region: ['北海道', '東北', '関東（東京以外）', '東京', '中部', '関西', '中国・四国', '九州・沖縄'],
  games: KIDS ? ['ときどき遊ぶ', 'よく遊ぶ', 'とても遊ぶ'] : ['ほとんど遊ばない', 'ときどき遊ぶ', 'よく遊ぶ', 'とても遊ぶ'],
};
const VP = { 家のiPad: 'iPad', 家のAndroidタブレット: 'Androidタブレット', '親のスマホ（iPhone）': 'iPhone', '親のスマホ（Android）': 'Androidスマホ', '家のパソコン（Windows）': 'WindowsノートPC' };
const keys = keysArg ? keysArg.split(',') : ['slot', 'device'];
P.history = P.history || [];
const n = P.history.filter((h) => h.id === id).length + 1;
if (n > 3) { console.error('引き直しは3回まで。それでも合わないときは、まとめ役に相談する'); process.exit(1); }
const seed = parseInt(crypto.createHash('sha256').update(`${P.seed}:${id}:${n}`).digest('hex').slice(0, 8), 16);
let x = seed;
const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; };
const before = Object.assign({}, P.panel[id]);
for (let t = 0; t < 1000; t++) {
  const cand = Object.assign({}, P.panel[id]);
  for (const k of keys) if (OPT[k]) cand[k] = OPT[k][Math.floor(rnd() * OPT[k].length)];
  // ほかの検査者と「地域と端末の組」が重ならないこと
  const dev = (d) => VP[d] || d;
  const clash = Object.entries(P.panel).some(([o, v]) => o !== id && v.region === cand.region && dev(v.device) === dev(cand.device));
  if (!clash) { P.panel[id] = cand; break; }
}
P.panel[id].viewport_device = VP[P.panel[id].device] || P.panel[id].device;
P.history.push({ id, n, t: new Date().toISOString(), reason, keys, before, after: P.panel[id] });
fs.writeFileSync(file, JSON.stringify(P, null, 1));
console.log(JSON.stringify({ id, before, after: P.panel[id] }, null, 1));
