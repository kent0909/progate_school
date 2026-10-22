---
src: web
coll: simgames
doc: r6-rp-wiki-obradinn
file: r6-rp-wiki-obradinn.html
sha256: 27df42d6b5e73a1dff86b7962cfe016e707cf613784de20a0df1e75fd9d267c0
read: partial
pages: 英語版 Wikipedia の記事本文（冒頭・遊び方・あらすじ・開発・発売・評価の節）をすべて。参考文献・情報欄・受賞の表は読んでいない
anchors: ["determine the fates of all sixty souls", "Memento Mortem", "correct fates are validated only in sets of three", "His initial idea was one where the player character repeatedly died", "spreadsheets to link all the various characters", "ten events in the narrative serve as a catalyst", "there's not going to be a lot of replay value", "became commonplace in the detective genre"]
---
## 何の資料か
英語版 Wikipedia「Return of the Obra Dinn」。二次の百科事典（作り手の話の本数には数えない）。

## 読み取れること（自分の言葉で）
- 船の60人全員の名前・死因・誰に殺されたかを推理する、1つの大きな論理パズル。懐中時計で死の瞬間を見る。
- 当て推量を防ぐため、**正しい運命は3人分そろって初めて確定**と知らされる（後に推理ゲームの定番になった）。
- 当初の案は「主人公が何度も死に、1分前に戻ってその死を再現する」だったが技術的に難しく、死の瞬間の静止画で物語を語る形にした。60人の運命は表計算で結びつけ、論理的に追えるようにした。順不同だと混乱したので、10の出来事で章に分けた。
- 評価：「よくできた推理ゲームなので遊び直しの価値はあまりないが、1回の遊びで十分に値打ちがある」という評がある。

## 周回の設計への含み
1. 推理型（答えが1つに固定）は**周回で尽きる**。Obra Dinn 型を本作の決算に入れるなら、周ごとに数字と手がかりの組が変わらないと2回目は推理にならない。
2. 「3つそろうまで正誤を教えない」は、当て推量で論点を飛ばすのを防ぐ形。DESIGN-ROUND2 の「発見を1問の正解で省略」（当て推量で飛ばせる）への手当てに写せる【推論】。
