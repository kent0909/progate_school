#!/usr/bin/env node
// DESIGN-JOURNAL-UX 2章の表（問いの文・札の文：いまの文／何がまずいか／直した文）を、
// journal-ux-prompts.tsv（台本からの洗い出し）と、ここに書いた直し（REWRITE）から組み立てる。
// 直しは設計者の判断。直さない行は「そのまま」と理由を出す。calc（計算の作業台）は仕訳・分類の問いではないので表に入れず、件数だけ出す。
// Usage: node boki2/docs/analysis/journal-ux-rewrite.js > boki2/docs/analysis/journal-ux-rewrite-table.md
const fs = require('fs');
const path = require('path');
const rows = fs.readFileSync(path.join(__dirname, 'journal-ux-prompts.tsv'), 'utf8').trim().split('\n').slice(1).map((l) => { const [screen, where, kind, id, flags, text] = l.split('\t'); return { screen, where, kind, id, flags, text }; });
// 直した文。鍵は screen|kind|id。値は [何がまずいか, 直した文]
const REWRITE = {
  'board|q|prologue:0:tap': ['「左の棚」が何の棚か（何があるか）を言っていない', '屋台にあるものを、左の棚（何があるか）に並べよう。札を押すと棚に入る。'],
  'board|token|coin': ['数の意味（ある額）が札にない', '小銭 1万円'],
  'board|token|pot': ['数の意味が札にない', '寸胴なべ 5千円'],
  'board|q|prologue:1:sort': ['「どこから来たか」はあるが、左右を決める手がかり（返す約束があるか）がない', 'この2つは、どこから来たお金？ 右の棚の「返すお金」「返さないお金」に置こう。手がかり：返す約束があるか。'],
  'board|token|oya': ['返す約束が札に見えない', '親方に借りた 1万円（月末に返す）'],
  'board|token|own': ['だれのお金か', 'じぶんの貯金 5千円'],
  'board|q|prologue:2:choice': ['仕込みの判断。仕訳の問いではない', 'そのまま'],
  'board|q|prologue:3:sort': ['「かせいだ」が何の額か、置く手がかりがない', 'かせいだ{売れた額}。右の棚のどちらに置く？ 手がかり：お客さんに返すお金？'],
  'board|token|earn': ['額の意味が見えない', 'かせいだ ＋{売れた額}'],
  'board|q|prologue:4:sort': ['へった側を問うのに「へった」の手がかりがない', '材料につかった{使った額}。右の棚のどちらがへった？ 手がかり：親方に返す額は変わった？'],
  'board|token|use': ['額の意味が見えない', 'つかった −{使った額}'],
  'board|q|prologue:5:note': ['左右を決める手がかり（左の列＝左の棚が増えた、右の列＝右の棚が増えた、へったら反対）が問いにない', '出来事ごとに、変わったものを左と右に分けて書こう。左の列は、左の棚（何があるか）が増えたとき。右の列は、右の棚（どこから来たか）が増えたとき。へったときは反対の列。'],
  'board|title|0': ['見出しとして使う（案B）', 'そのまま（見出し）'],
  'board|title|1': ['見出しとして使う（案B）', 'そのまま（見出し）'],
  'board|title|2': ['見出しとして使う（案B）', 'そのまま（見出し）'],
  'board|token|0-0': ['「増えた」と額が別々で、札として長い。見出しと「：」でつながれて1文に見える', '小銭 ＋1万円'],
  'board|token|0-1': ['同上。「返すお金」がだれへの分か', '親方に返すお金 ＋1万円'],
  'board|token|1-0': ['同上', '小銭 ＋{売れた額}'],
  'board|token|1-1': ['同上。かっこの中が長い', 'じぶんのお金（かせいだ） ＋{売れた額}'],
  'board|token|2-0': ['同上', '小銭 −{使った額}'],
  'board|token|2-1': ['同上', 'じぶんのお金（つかった） −{使った額}'],
  'board|shown|0-0': ['engine が「{出来事}：{札}」の1文に組む。オーナー「二つの文の羅列で間に:があるだけ」', '出来事は見出し、札は「小銭 ＋1万円」だけ（engine の組み立てをやめる）'],
  'board|shown|0-1': ['同上', '同上'],
  'board|shown|1-0': ['同上', '同上'],
  'board|shown|1-1': ['同上', '同上'],
  'board|shown|2-0': ['同上', '同上'],
  'board|shown|2-1': ['同上', '同上'],
  'board|q|2:ask': ['問いは1文で分かる。長さ 46字', 'そのまま'],
  'discover|q|d-capital:b2': ['「右の棚のどちら」だけで、決める手がかり（返す約束）がない', '社長からの300万円は、どこから来たお金？ 右の棚の「返すお金」「返さないお金」のどちら？ 手がかり：返す約束があるか。'],
  'discover|token|d-capital:token': ['だれが出した額か、札にない', '社長が出した 300万円'],
  'discover|q|d-sales:b2': ['増やした／へらしたの手がかり（返すか・戻るか）がない', '2つの出来事は、右の棚の「返さないお金（じぶんのお金）」を増やした？ へらした？ 手がかり：お客さんに返す？ 材料は戻ってくる？'],
  'discover|shown|d-sales:sale:up': ['読み上げ用の aria-label が「{札}：{箱}」の形。見た目には出ないが、読み上げでは「：」の羅列になる', '「{札}を{箱}に置く」の文にする'],
  'discover|shown|d-sales:sale:down': ['同上', '同上'],
  'discover|shown|d-sales:use:up': ['同上', '同上'],
  'discover|shown|d-sales:use:down': ['同上', '同上'],
  'discover|q|d-cash:predict': ['予想の問い。手がかりは意図して入れない（予想→結果の対比のため）', 'そのまま（予想）'],
  'discover|token|d-kake:token': ['払っていないことが札に見えない', '6月に届いた材料 25万円（まだ払っていない）'],
  'discover|q|d-tax:b2': ['「右の棚のどっち」だけで手がかりがない', 'お客さんから預かった消費税は、だれのもの？ 右の棚の「返すお金」「返さないお金」のどちら？ 手がかり：最後に国へ納めるか。'],
  'discover|token|d-dep:token': ['使う年数が札にない', '内装 150万円（あと5年使う）'],
  'discover|q|d-allow:b2': ['「資産の棚でどう見せる」の手がかり（請求している額を残すか）がない', 'カード会社からもらえないかもしれない分。左の棚（何があるか）ではどう見せる？ 手がかり：いくら請求しているかも残したいか。'],
  'doc|q|docScreen': ['どの書類でも同じ1文で、出来事も手がかりもない。「帳簿に書こう」だけ', '出来事を見出しに：「{書類の題}」。何が増え、何がへった？ 左の列＝左の棚（何があるか）が増えた、右の列＝右の棚（どこから来たか）が増えた。へったら反対の列。（列の見出しの下に常に出す）'],
  'doc|q|docScreen:fix': ['見直しの入口。手がかりは本文の列の見出しに出る', 'そのまま（列の見出しの手がかりを足す）'],
  'naming|q|普通預金': ['「棚のどこ」で、左右の意味を言っていない', '通帳に入った300万円。会社が「もっているもの」（左の棚）？ それとも「どこから来たか」（右の棚）？'],
  'naming|q|商品': ['「どの棚」だけ', '売るために仕入れた鉢。売れるまでは店にある。「もっているもの」（左の棚）？ それとも、もう使った費用？'],
  'naming|q|長期未払金': ['「どの棚」だけ', '器材を受け取り、代金を2年かけて払う約束。右の棚の「返す約束」？ それとも株主から集めたお金？'],
};
const DEFAULT = {
  q: (r) => (r.screen === 'naming' ? ['選択肢の文が手がかり（資産／負債／費用の棚の言葉）になっている。問いは出来事を言う', 'そのまま'] : r.screen === 'kindIntro' ? ['何が起きたかを問う。左右は問わない', 'そのまま'] : r.screen === 'discover' && /predict/.test(r.id) ? ['予想の問い。手がかりは意図して入れない', 'そのまま（予想）'] : ['左右（棚）を問わない問い。1文で読める', 'そのまま']),
  token: (r) => ['出来事の札。額なし', 'そのまま'],
  target: (r) => ['箱の名前', 'そのまま'],
  title: (r) => ['見出し', 'そのまま'],
  shown: (r) => ['engine が組む表示', 'そのまま'],
};
const want = rows.filter((r) => r.screen !== 'calc' && r.kind !== 'target');
const out = ['| # | 画面 | 種類 | id | いまの文 | 何がまずいか | 直した文 |', '|---|---|---|---|---|---|---|'];
let n = 0, changed = 0;
for (const r of want) {
  n++;
  const k = `${r.screen}|${r.kind}|${r.id}`;
  const [why, to] = REWRITE[k] || DEFAULT[r.kind](r);
  if (!/^そのまま/.test(to) && to !== '同上') changed++; else if (to === '同上') changed++;
  out.push(`| ${n} | ${r.screen} | ${r.kind} | ${r.id} | ${r.text.replace(/\|/g, '｜')} | ${why}${r.flags ? `（印：${r.flags}）` : ''} | ${to} |`);
}
const calcN = rows.filter((r) => r.screen === 'calc').length, targetN = rows.filter((r) => r.kind === 'target').length;
console.log(`表の行：${n}（直す：${changed}、そのまま：${n - changed}）。表に入れない：calc の問い ${calcN}（計算の問いで左右を問わない）、箱の名前（target） ${targetN}（journal-ux-prompts.tsv にある）\n`);
console.log(out.join('\n'));
