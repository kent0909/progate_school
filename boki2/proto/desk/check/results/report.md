同じ4枚の取引で、差の帯・B/Sの棚・入力を切り替えて比較する独立した試作を追加した。ゲームのコードは変更していない。ドラフトのまま、取り込みはしない。

**高さの約束の未達は 4 条件。** 各条件の確定の位置と超過量を「仕様どおりにできなかった所」に、測定出力から記載した。字や押せる面積を縮めず、そのまま記録した。

## 依頼の対応表

|原文（依頼書の各行）|対応|
|---|---|
|「今やっていることに合わせてProgress indicator や Dashboardとかも含め本ゲームのコンセプトに合うデザインUi/UXをmobbinで探索・引用してきて。抜本的にデザインとユーザ体験を見直すことを想定している。「いまつくっているものに取り込むならどうか」ではなく「本来あるべきデザインとしてどうか」という視点で。」|既存の設計2.5/2.6・T2/T3/T10に基づく比較試作。新しいMobbin調査や本番への組み込みはしない。index.html と desk.css/js で配置・入力・反映を独立させた。|
|8問への回答（11/04）：問2 差の帯「試作で比べる」、問3 机の B/S の棚「試作で比べる」、問5「棚へ引く版も試作」、問8「やっぱここは誤りはすぐ返す仕様でいったんOK」|band=diff/scale/none × shelf=on/off × input=swipe/drag の全12条件。全版で同じ4取引。確定後にすぐ正誤を返し、初回は行だけ、2回目は正解を表示。|
|「順番は任せる。Codexに振れるタスク・仕事はCodexに渡せるように仕事を分解して。」|指定された仕訳の机だけを独立して実装。check/run.cjs が打ち手・測り・写真、inputs.cjs と gestures.cjs が入力の確認を担う。|
|過去の原文（試遊の感想）：「自分が左右選んだ科目が帳簿のどこに反映されてるかわからない」「一つ取り消す、というか自分が選んだ特定の科目のみを修正する仕様にしたい」「ドラッグ、スマホならswipeで科目を入れていくスタイルの方がUXは良いのでは？」|札の右に反映先の帯名だけを予告し、正解確定で棚を更新。棚なしでは店の小札＋帳簿の赤点。札ごとの左/右/棚へ戻す、金額の選び直し。押す・払う・引く・キーの各経路。|

|仕様7章|対応と証拠|
|---|---|
|1. 全12通りで4枚を最後まで|autoplay.json：192/192。12条件×2幅×正答/誤答の2周×4枚。gestures.json：48/48（390幅、払い/引くで4枚完走）|
|2. 正しい仕訳と典型の誤りの返し|売上／消耗品費／売掛金／固定資産売却益を使う誤答を2回→正解表示→その1枚だけ戻して修正→正答。最初の誤答で正解を表示しないことも確認。|
|3. 全条件×2幅で大きさを測る|measurements.json の 192 測定（空/入力済み）。入力済み 96 行を下記へ転記。高さ未達 4 条件。最小字 14px、最小操作 52×44px、横はみ出し 0 件。|
|4. 記録のJSON書き出し|全48周で4枚分のexport JSONとlocalStorageが一致。条件・時間・確定/修正/入力/戻り/列違い・計算パッドを記録。inputs.jsonで実タッチ・キー・戻り・誤列ドラッグも確認。|
|5. ゲームを変えない|下記のgit diff --statとscope.txt。変更は boki2/proto/desk/ 内だけ。|

## 仕様への確認と回答

取引4の5枚と棚の「増えた／減った」の口はコメント6619763389の指示。開始残高とlocalhost測定は6619864456の承認。更新された仕様を元ブランチから取り込んだ。修正指示6620110518に従い資産は控除前220,000円、直下の評価勘定は△50,000円。取引4の前後（220,000・△50,000→160,000・△0）は打ち手で確認。減価償却累計額は「もっているもののマイナス」の帯、資本金は「返さないお金」。

## 自動の打ち手

- 正答/典型誤答：**192/192**。落ちたもの：なし。
- 4つの入力と記録・動きを減らす設定：**12/12**。落ちたもの：なし。
- 払い/引くで4取引：**48/48**。落ちたもの：なし。画面端スクロール、取引4のマイナスの帯の減少、diffの差10,000円（答えそのもの）も確認。
- 写真：48枚（12条件×2幅×取引1/4、jpg品質60、入力済み・確定前・全高）。

## 測りの条件と表

管理Chromiumはfile://をERR_BLOCKED_BY_ADMINISTRATORで拒否するため、**ファイルを直接開く実機確認は未了**。同一HTML/CSS/JSを一時的なlocalhostで配信し、他の要求は全拒否した。試作自体は外部依存・通信なし。実行コマンドと既定パスからの変更はREADME.md。

値は check/results/measurements.md から転記。高さはフッターを含む全高、確定上端/下端はページ座標。「画面スクロール」はページ全体、「確定にスクロール」は確定ボタン下端までを分ける。入力済み96行。空の状態もJSONに保持。

|条件 band/shelf/input|幅|取引|高さ|確定上端|確定下端|画面スクロール|確定にスクロール|最小字|最小幅×高さ|帯高|棚高|
|---|---:|---:|---:|---:|---:|---|---|---:|---|---:|---:|
|diff/on/swipe|390|1|858|744|792|要|不要|14|52×44|36|84|
|diff/on/swipe|390|2|844|722|770|不要|不要|14|52×44|36|84|
|diff/on/swipe|390|3|928|814|862|要|要|14|52×44|36|84|
|diff/on/swipe|390|4|1180|1066|1114|要|要|14|52×44|36|171.19|
|diff/on/swipe|1280|1|800|656|704|不要|不要|14|52×44|36|84|
|diff/on/swipe|1280|2|800|656|704|不要|不要|14|52×44|36|84|
|diff/on/swipe|1280|3|840|726|774|要|不要|14|52×44|36|84|
|diff/on/swipe|1280|4|1045|931|979|要|要|14|52×44|36|171.19|
|diff/on/drag|390|1|858|744|792|要|不要|14|52×44|36|84|
|diff/on/drag|390|2|844|722|770|不要|不要|14|52×44|36|84|
|diff/on/drag|390|3|928|814|862|要|要|14|52×44|36|84|
|diff/on/drag|390|4|1180|1066|1114|要|要|14|52×44|36|171.19|
|diff/on/drag|1280|1|800|656|704|不要|不要|14|52×44|36|84|
|diff/on/drag|1280|2|800|656|704|不要|不要|14|52×44|36|84|
|diff/on/drag|1280|3|840|726|774|要|不要|14|52×44|36|84|
|diff/on/drag|1280|4|1045|931|979|要|要|14|52×44|36|171.19|
|diff/off/swipe|390|1|844|636|684|不要|不要|14|52×44|36|0|
|diff/off/swipe|390|2|844|614|662|不要|不要|14|69×44|36|0|
|diff/off/swipe|390|3|870|687|735|要|不要|14|69×44|36|0|
|diff/off/swipe|390|4|995|812|860|要|要|14|69×44|36|0|
|diff/off/swipe|1280|1|800|548|596|不要|不要|14|52×44|36|0|
|diff/off/swipe|1280|2|800|548|596|不要|不要|14|69×44|36|0|
|diff/off/swipe|1280|3|800|598|646|不要|不要|14|69×44|36|0|
|diff/off/swipe|1280|4|881|698|746|要|不要|14|69×44|36|0|
|diff/off/drag|390|1|844|636|684|不要|不要|14|52×44|36|0|
|diff/off/drag|390|2|844|614|662|不要|不要|14|69×44|36|0|
|diff/off/drag|390|3|870|687|735|要|不要|14|69×44|36|0|
|diff/off/drag|390|4|995|812|860|要|要|14|69×44|36|0|
|diff/off/drag|1280|1|800|548|596|不要|不要|14|52×44|36|0|
|diff/off/drag|1280|2|800|548|596|不要|不要|14|69×44|36|0|
|diff/off/drag|1280|3|800|598|646|不要|不要|14|69×44|36|0|
|diff/off/drag|1280|4|881|698|746|要|不要|14|69×44|36|0|
|scale/on/swipe|390|1|858|744|792|要|不要|14|52×44|36|84|
|scale/on/swipe|390|2|844|722|770|不要|不要|14|52×44|36|84|
|scale/on/swipe|390|3|928|814|862|要|要|14|52×44|36|84|
|scale/on/swipe|390|4|1180|1066|1114|要|要|14|52×44|36|171.19|
|scale/on/swipe|1280|1|800|656|704|不要|不要|14|52×44|36|84|
|scale/on/swipe|1280|2|800|656|704|不要|不要|14|52×44|36|84|
|scale/on/swipe|1280|3|840|726|774|要|不要|14|52×44|36|84|
|scale/on/swipe|1280|4|1045|931|979|要|要|14|52×44|36|171.19|
|scale/on/drag|390|1|858|744|792|要|不要|14|52×44|36|84|
|scale/on/drag|390|2|844|722|770|不要|不要|14|52×44|36|84|
|scale/on/drag|390|3|928|814|862|要|要|14|52×44|36|84|
|scale/on/drag|390|4|1180|1066|1114|要|要|14|52×44|36|171.19|
|scale/on/drag|1280|1|800|656|704|不要|不要|14|52×44|36|84|
|scale/on/drag|1280|2|800|656|704|不要|不要|14|52×44|36|84|
|scale/on/drag|1280|3|840|726|774|要|不要|14|52×44|36|84|
|scale/on/drag|1280|4|1045|931|979|要|要|14|52×44|36|171.19|
|scale/off/swipe|390|1|844|636|684|不要|不要|14|52×44|36|0|
|scale/off/swipe|390|2|844|614|662|不要|不要|14|69×44|36|0|
|scale/off/swipe|390|3|870|687|735|要|不要|14|69×44|36|0|
|scale/off/swipe|390|4|995|812|860|要|要|14|69×44|36|0|
|scale/off/swipe|1280|1|800|548|596|不要|不要|14|52×44|36|0|
|scale/off/swipe|1280|2|800|548|596|不要|不要|14|69×44|36|0|
|scale/off/swipe|1280|3|800|598|646|不要|不要|14|69×44|36|0|
|scale/off/swipe|1280|4|881|698|746|要|不要|14|69×44|36|0|
|scale/off/drag|390|1|844|636|684|不要|不要|14|52×44|36|0|
|scale/off/drag|390|2|844|614|662|不要|不要|14|69×44|36|0|
|scale/off/drag|390|3|870|687|735|要|不要|14|69×44|36|0|
|scale/off/drag|390|4|995|812|860|要|要|14|69×44|36|0|
|scale/off/drag|1280|1|800|548|596|不要|不要|14|52×44|36|0|
|scale/off/drag|1280|2|800|548|596|不要|不要|14|69×44|36|0|
|scale/off/drag|1280|3|800|598|646|不要|不要|14|69×44|36|0|
|scale/off/drag|1280|4|881|698|746|要|不要|14|69×44|36|0|
|none/on/swipe|390|1|844|704|752|不要|不要|14|52×44|0|84|
|none/on/swipe|390|2|844|682|730|不要|不要|14|52×44|0|84|
|none/on/swipe|390|3|888|774|822|要|不要|14|52×44|0|84|
|none/on/swipe|390|4|1140|1026|1074|要|要|14|52×44|0|171.19|
|none/on/swipe|1280|1|800|616|664|不要|不要|14|52×44|0|84|
|none/on/swipe|1280|2|800|616|664|不要|不要|14|52×44|0|84|
|none/on/swipe|1280|3|800|686|734|不要|不要|14|52×44|0|84|
|none/on/swipe|1280|4|1005|891|939|要|要|14|52×44|0|171.19|
|none/on/drag|390|1|844|704|752|不要|不要|14|52×44|0|84|
|none/on/drag|390|2|844|682|730|不要|不要|14|52×44|0|84|
|none/on/drag|390|3|888|774|822|要|不要|14|52×44|0|84|
|none/on/drag|390|4|1140|1026|1074|要|要|14|52×44|0|171.19|
|none/on/drag|1280|1|800|616|664|不要|不要|14|52×44|0|84|
|none/on/drag|1280|2|800|616|664|不要|不要|14|52×44|0|84|
|none/on/drag|1280|3|800|686|734|不要|不要|14|52×44|0|84|
|none/on/drag|1280|4|1005|891|939|要|要|14|52×44|0|171.19|
|none/off/swipe|390|1|844|596|644|不要|不要|14|52×44|0|0|
|none/off/swipe|390|2|844|574|622|不要|不要|14|69×44|0|0|
|none/off/swipe|390|3|844|647|695|不要|不要|14|69×44|0|0|
|none/off/swipe|390|4|955|772|820|要|不要|14|69×44|0|0|
|none/off/swipe|1280|1|800|508|556|不要|不要|14|52×44|0|0|
|none/off/swipe|1280|2|800|508|556|不要|不要|14|69×44|0|0|
|none/off/swipe|1280|3|800|558|606|不要|不要|14|69×44|0|0|
|none/off/swipe|1280|4|841|658|706|要|不要|14|69×44|0|0|
|none/off/drag|390|1|844|596|644|不要|不要|14|52×44|0|0|
|none/off/drag|390|2|844|574|622|不要|不要|14|69×44|0|0|
|none/off/drag|390|3|844|647|695|不要|不要|14|69×44|0|0|
|none/off/drag|390|4|955|772|820|要|不要|14|69×44|0|0|
|none/off/drag|1280|1|800|508|556|不要|不要|14|52×44|0|0|
|none/off/drag|1280|2|800|508|556|不要|不要|14|69×44|0|0|
|none/off/drag|1280|3|800|558|606|不要|不要|14|69×44|0|0|
|none/off/drag|1280|4|841|658|706|要|不要|14|69×44|0|0|

## 仕様どおりにできなかった所

- diff/on/swipe・390×844・取引3：確定の下端862px（18px超過）。縦スクロールが必要。
- diff/on/drag・390×844・取引3：確定の下端862px（18px超過）。縦スクロールが必要。
- scale/on/swipe・390×844・取引3：確定の下端862px（18px超過）。縦スクロールが必要。
- scale/on/drag・390×844・取引3：確定の下端862px（18px超過）。縦スクロールが必要。
- 取引4は全24条件でページ全体の縦スクロールが必要（仕様で許容）。確定までの要否は各行の表のとおり。
- 14px未満への縮小や44px未満への縮小で収めていない。file://での実機確認の未了は上記。

## 既存ゲームの回帰検査（出力の最終行）

- `node boki2/tools/sim-check.js`：exit 0

  `OK：12692 本の分かれ道で検算した（会社の書き方 alt 86548 件も検算。結末：be5-warn 6684・be10-warn 4・be5-final 1300・be3-warn 1300・be1-warn 228・be1-final 228・be5-quit 76・be3-final 1296）`
- `node boki2/tools/sim-check.js --ramen --runs 300`：exit 0

  `OK：ラーメン版の無作為の通し試験（1・3・5年版）300周（3342.2秒）`
- `node boki2/tools/validate.js`：exit 0

  `OK`
- `node boki2/tools/lexicon-check.js --ramen`：exit 0

  `OK：教えた語 113・札の兄弟 7/22`
- `node boki2/tools/coverage.js --ramen --stage 1`：exit 0

  `OK：段 1（累計 26/77）`
- `node boki2/tools/law-check.js`：exit 0

  `OK：結末に出る法令の条文 17 件（会社法432条・民法415条・民法419条・民事保全法20条・労働基準法24条・破産法15条・会社計算規則5条・民法446条・会社法445条・会社法461条・会社法458条・会社計算規則158条・会社法462条・会社法463条・会社法847条・会社法976条・国税通則法65条）をすべて一次資料のノートで確認`

## 変更範囲

```text
git diff --stat claude/keen-hawking-sfeg6f...
 boki2/proto/desk/README.md                         |   50 +
 boki2/proto/desk/check/gestures.cjs                |   48 +
 boki2/proto/desk/check/inputs.cjs                  |   39 +
 boki2/proto/desk/check/report.cjs                  |   40 +
 boki2/proto/desk/check/results/autoplay.json       | 3080 +++++++++++++
 boki2/proto/desk/check/results/gestures.json       |  338 ++
 boki2/proto/desk/check/results/inputs.json         |  698 +++
 boki2/proto/desk/check/results/measurements.json   | 4610 ++++++++++++++++++++
 boki2/proto/desk/check/results/measurements.md     |   98 +
 boki2/proto/desk/check/results/regression-1.log    |    1 +
 boki2/proto/desk/check/results/regression-2.log    |  107 +
 boki2/proto/desk/check/results/regression-3.log    |   13 +
 boki2/proto/desk/check/results/regression-4.log    |   26 +
 boki2/proto/desk/check/results/regression-5.log    |   79 +
 boki2/proto/desk/check/results/regression-6.log    |    1 +
 boki2/proto/desk/check/results/regression.json     |   32 +
 boki2/proto/desk/check/results/report.md           |  243 ++
 boki2/proto/desk/check/results/scope.txt           |   63 +
 .../results/screenshots/diff-off-drag-1280-tx1.jpg |  Bin 0 -> 44116 bytes
 .../results/screenshots/diff-off-drag-1280-tx4.jpg |  Bin 0 -> 54738 bytes
 .../results/screenshots/diff-off-drag-390-tx1.jpg  |  Bin 0 -> 33231 bytes
 .../results/screenshots/diff-off-drag-390-tx4.jpg  |  Bin 0 -> 42267 bytes
 .../screenshots/diff-off-swipe-1280-tx1.jpg        |  Bin 0 -> 44116 bytes
 .../screenshots/diff-off-swipe-1280-tx4.jpg        |  Bin 0 -> 54738 bytes
 .../results/screenshots/diff-off-swipe-390-tx1.jpg |  Bin 0 -> 33231 bytes
 .../results/screenshots/diff-off-swipe-390-tx4.jpg |  Bin 0 -> 42267 bytes
 .../results/screenshots/diff-on-drag-1280-tx1.jpg  |  Bin 0 -> 50614 bytes
 .../results/screenshots/diff-on-drag-1280-tx4.jpg  |  Bin 0 -> 68029 bytes
 .../results/screenshots/diff-on-drag-390-tx1.jpg   |  Bin 0 -> 36051 bytes
 .../results/screenshots/diff-on-drag-390-tx4.jpg   |  Bin 0 -> 50378 bytes
 .../results/screenshots/diff-on-swipe-1280-tx1.jpg |  Bin 0 -> 50614 bytes
 .../results/screenshots/diff-on-swipe-1280-tx4.jpg |  Bin 0 -> 68029 bytes
 .../results/screenshots/diff-on-swipe-390-tx1.jpg  |  Bin 0 -> 36051 bytes
 .../results/screenshots/diff-on-swipe-390-tx4.jpg  |  Bin 0 -> 50378 bytes
 .../results/screenshots/none-off-drag-1280-tx1.jpg |  Bin 0 -> 43262 bytes
 .../results/screenshots/none-off-drag-1280-tx4.jpg |  Bin 0 -> 53286 bytes
 .../results/screenshots/none-off-drag-390-tx1.jpg  |  Bin 0 -> 32616 bytes
 .../results/screenshots/none-off-drag-390-tx4.jpg  |  Bin 0 -> 41506 bytes
 .../screenshots/none-off-swipe-1280-tx1.jpg        |  Bin 0 -> 43262 bytes
 .../screenshots/none-off-swipe-1280-tx4.jpg        |  Bin 0 -> 53286 bytes
 .../results/screenshots/none-off-swipe-390-tx1.jpg |  Bin 0 -> 32616 bytes
 .../results/screenshots/none-off-swipe-390-tx4.jpg |  Bin 0 -> 41506 bytes
 .../results/screenshots/none-on-drag-1280-tx1.jpg  |  Bin 0 -> 49997 bytes
 .../results/screenshots/none-on-drag-1280-tx4.jpg  |  Bin 0 -> 66333 bytes
 .../results/screenshots/none-on-drag-390-tx1.jpg   |  Bin 0 -> 35387 bytes
 .../results/screenshots/none-on-drag-390-tx4.jpg   |  Bin 0 -> 49502 bytes
 .../results/screenshots/none-on-swipe-1280-tx1.jpg |  Bin 0 -> 49997 bytes
 .../results/screenshots/none-on-swipe-1280-tx4.jpg |  Bin 0 -> 66333 bytes
 .../results/screenshots/none-on-swipe-390-tx1.jpg  |  Bin 0 -> 35387 bytes
 .../results/screenshots/none-on-swipe-390-tx4.jpg  |  Bin 0 -> 49502 bytes
 .../screenshots/scale-off-drag-1280-tx1.jpg        |  Bin 0 -> 44029 bytes
 .../screenshots/scale-off-drag-1280-tx4.jpg        |  Bin 0 -> 54664 bytes
 .../results/screenshots/scale-off-drag-390-tx1.jpg |  Bin 0 -> 33236 bytes
 .../results/screenshots/scale-off-drag-390-tx4.jpg |  Bin 0 -> 42285 bytes
 .../screenshots/scale-off-swipe-1280-tx1.jpg       |  Bin 0 -> 44029 bytes
 .../screenshots/scale-off-swipe-1280-tx4.jpg       |  Bin 0 -> 54664 bytes
 .../screenshots/scale-off-swipe-390-tx1.jpg        |  Bin 0 -> 33236 bytes
 .../screenshots/scale-off-swipe-390-tx4.jpg        |  Bin 0 -> 42285 bytes
 .../results/screenshots/scale-on-drag-1280-tx1.jpg |  Bin 0 -> 50550 bytes
 .../results/screenshots/scale-on-drag-1280-tx4.jpg |  Bin 0 -> 67911 bytes
 .../results/screenshots/scale-on-drag-390-tx1.jpg  |  Bin 0 -> 36064 bytes
 .../results/screenshots/scale-on-drag-390-tx4.jpg  |  Bin 0 -> 50383 bytes
 .../screenshots/scale-on-swipe-1280-tx1.jpg        |  Bin 0 -> 50550 bytes
 .../screenshots/scale-on-swipe-1280-tx4.jpg        |  Bin 0 -> 67911 bytes
 .../results/screenshots/scale-on-swipe-390-tx1.jpg |  Bin 0 -> 36064 bytes
 .../results/screenshots/scale-on-swipe-390-tx4.jpg |  Bin 0 -> 50383 bytes
 boki2/proto/desk/check/results/source-hashes.json  |    8 +
 boki2/proto/desk/check/run.cjs                     |   88 +
 boki2/proto/desk/desk.css                          |    5 +
 boki2/proto/desk/desk.js                           |  173 +
 boki2/proto/desk/index.html                        |   29 +
 71 files changed, 9869 insertions(+)
```

## やっていないこと

- 本番ゲームへの組み込み、外部サイト/Mobbinの再調査、完成した絵・音、マージ。
- 人による学習効果・操作の好みの評価、実機スマホと読み上げソフトの確認。
- file://での実機確認（管理ブラウザが拒否）。
- 高さ未達の4条件を、文字や操作面を縮めて解消すること。
- 確定後の取り消しによる再記帳（試作の範囲は確定前の1枚ずつの修正と誤答からの選び直し）。
