// 検査出力をそのまま PR 本文へ写す。数値を手で書き換えない。
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'results'),read=name=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8'));
const autoplay=read('autoplay.json'),inputs=read('inputs.json'),gestures=read('gestures.json'),measurements=read('measurements.json'),regression=read('regression.json');
const filled=measurements.filter(r=>r.phase==='filled'),heightFailures=filled.filter(r=>r.transaction<4&&r.confirmRequiresScroll),pass=rows=>rows.filter(r=>r.pass).length;
if(process.argv.includes('--final')){
 if(autoplay.total!==192||autoplay.passed!==192||inputs.length!==12||pass(inputs)!==12||gestures.length!==48||pass(gestures)!==48||measurements.length!==192||regression.length!==6||regression.some(r=>r.exitCode!==0))throw Error('検査が未完了または失敗。本文の完了報告を作れない');
}
const originals=fs.readFileSync(path.resolve(__dirname,'../../../docs/CODEX-TASK-proto-desk.md'),'utf8').split('## 依頼の原文（オーナーの言葉。要約しない）')[1].split('## 役目')[0].trim().split('\n').filter(x=>x.startsWith('- '));
const responses=[
 '既存の設計2.5/2.6・T2/T3/T10に基づく比較試作。新しいMobbin調査や本番への組み込みはしない。index.html と desk.css/js で配置・入力・反映を独立させた。',
 'band=diff/scale/none × shelf=on/off × input=swipe/drag の全12条件。全版で同じ4取引。確定後にすぐ正誤を返し、初回は行だけ、2回目は正解を表示。',
 '指定された仕訳の机だけを独立して実装。check/run.cjs が打ち手・測り・写真、inputs.cjs と gestures.cjs が入力の確認を担う。',
 '札の右に反映先の帯名だけを予告し、正解確定で棚を更新。棚なしでは店の小札＋帳簿の赤点。札ごとの左/右/棚へ戻す、金額の選び直し。押す・払う・引く・キーの各経路。'
];
let body=`同じ4枚の取引で、差の帯・B/Sの棚・入力を切り替えて比較する独立した試作を追加した。ゲームのコードは変更していない。ドラフトのまま、取り込みはしない。\n\n**高さの約束の未達は ${heightFailures.length} 条件。** 各条件の確定の位置と超過量を「仕様どおりにできなかった所」に、測定出力から記載した。字や押せる面積を縮めず、そのまま記録した。\n\n## 依頼の対応表\n\n|原文（依頼書の各行）|対応|\n|---|---|\n`;
originals.forEach((line,i)=>body+=`|${line.slice(2).replaceAll('|','\\|')}|${responses[i]}|\n`);
body+='\n|仕様7章|対応と証拠|\n|---|---|\n';
body+=`|1. 全12通りで4枚を最後まで|autoplay.json：${autoplay.passed}/${autoplay.total}。12条件×2幅×正答/誤答の2周×4枚。gestures.json：${pass(gestures)}/${gestures.length}（390幅、払い/引くで4枚完走）|\n`;
body+='|2. 正しい仕訳と典型の誤りの返し|売上／消耗品費／売掛金／固定資産売却益を使う誤答を2回→正解表示→その1枚だけ戻して修正→正答。最初の誤答で正解を表示しないことも確認。|\n';
body+=`|3. 全条件×2幅で大きさを測る|measurements.json の ${measurements.length} 測定（空/入力済み）。入力済み ${filled.length} 行を下記へ転記。高さ未達 ${heightFailures.length} 条件。最小字 ${Math.min(...filled.map(r=>r.minFont))}px、最小操作 ${Math.min(...filled.map(r=>r.minHitWidth))}×${Math.min(...filled.map(r=>r.minHitHeight))}px、横はみ出し ${filled.filter(r=>r.horizontalOverflow).length} 件。|\n`;
body+='|4. 記録のJSON書き出し|全48周で4枚分のexport JSONとlocalStorageが一致。条件・時間・確定/修正/入力/戻り/列違い・計算パッドを記録。inputs.jsonで実タッチ・キー・戻り・誤列ドラッグも確認。|\n|5. ゲームを変えない|下記のgit diff --statとscope.txt。変更は boki2/proto/desk/ 内だけ。|\n';
body+='\n## 仕様への確認と回答\n\n取引4の5枚と棚の「増えた／減った」の口はコメント6619763389の指示。開始残高とlocalhost測定は6619864456の承認。更新された仕様を元ブランチから取り込んだ。修正指示6620110518に従い資産は控除前220,000円、直下の評価勘定は△50,000円。取引4の前後（220,000・△50,000→160,000・△0）は打ち手で確認。減価償却累計額は「もっているもののマイナス」の帯、資本金は「返さないお金」。\n\n## 自動の打ち手\n\n';
body+=`- 正答/典型誤答：**${autoplay.passed}/${autoplay.total}**。落ちたもの：${autoplay.failed.length?JSON.stringify(autoplay.failed):'なし'}。\n- 4つの入力と記録・動きを減らす設定：**${pass(inputs)}/${inputs.length}**。落ちたもの：${inputs.filter(r=>!r.pass).length?'inputs.jsonを参照':'なし'}。\n- 払い/引くで4取引：**${pass(gestures)}/${gestures.length}**。落ちたもの：${gestures.filter(r=>!r.pass).length?'gestures.jsonを参照':'なし'}。画面端スクロール、取引4のマイナスの帯の減少、diffの差10,000円（答えそのもの）も確認。\n- 写真：${fs.readdirSync(path.join(base,'screenshots')).filter(x=>x.endsWith('.jpg')).length}枚（12条件×2幅×取引1/4、jpg品質60、入力済み・確定前・全高）。\n`;
body+='\n## 測りの条件と表\n\n管理Chromiumはfile://をERR_BLOCKED_BY_ADMINISTRATORで拒否するため、**ファイルを直接開く実機確認は未了**。同一HTML/CSS/JSを一時的なlocalhostで配信し、他の要求は全拒否した。試作自体は外部依存・通信なし。実行コマンドと既定パスからの変更はREADME.md。\n\n値は check/results/measurements.md から転記。高さはフッターを含む全高、確定上端/下端はページ座標。「画面スクロール」はページ全体、「確定にスクロール」は確定ボタン下端までを分ける。入力済み96行。空の状態もJSONに保持。\n\n';
body+=fs.readFileSync(path.join(base,'measurements.md'),'utf8');
body+='\n## 仕様どおりにできなかった所\n\n';
for(const r of heightFailures)body+=`- ${Object.values(r.config).join('/')}・${r.viewport.width}×${r.viewport.height}・取引${r.transaction}：確定の下端${r.confirmBottom}px（${r.confirmBottom-r.viewport.height}px超過）。縦スクロールが必要。\n`;
body+=`- 取引4は全${filled.filter(r=>r.transaction===4&&r.scroll).length}条件でページ全体の縦スクロールが必要（仕様で許容）。確定までの要否は各行の表のとおり。\n- 14px未満への縮小や44px未満への縮小で収めていない。file://での実機確認の未了は上記。\n`;
body+='\n## 既存ゲームの回帰検査（出力の最終行）\n\n';
for(const r of regression)body+=`- \`${r.command}\`：exit ${r.exitCode}\n\n  \`${r.lastLine}\`\n`;
if(regression.length<6)body+='\n**残りの回帰検査は実行中。完了報告ではない。**\n';
const scope=fs.readFileSync(path.join(base,'scope.txt'),'utf8');
body+='\n## 変更範囲\n\n```text\ngit diff --stat claude/keen-hawking-sfeg6f...\n'+scope+'```\n';
body+='\n## やっていないこと\n\n- 本番ゲームへの組み込み、外部サイト/Mobbinの再調査、完成した絵・音、マージ。\n- 人による学習効果・操作の好みの評価、実機スマホと読み上げソフトの確認。\n- file://での実機確認（管理ブラウザが拒否）。\n- 高さ未達の4条件を、文字や操作面を縮めて解消すること。\n- 確定後の取り消しによる再記帳（試作の範囲は確定前の1枚ずつの修正と誤答からの選び直し）。\n';
body=body.replace('高さ未達の4条件を','高さ未達の'+heightFailures.length+'条件を');
fs.writeFileSync(path.join(base,'report.md'),body);
const files=['index.html','desk.css','desk.js','check/run.cjs','check/inputs.cjs','check/gestures.cjs'];
fs.writeFileSync(path.join(base,'source-hashes.json'),JSON.stringify(Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'..',f))).digest('hex')])),null,2)+'\n');
console.log(body);
