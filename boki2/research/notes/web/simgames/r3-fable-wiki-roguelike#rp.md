---
src: web
coll: simgames
doc: r3-fable-wiki-roguelike#rp
file: r3-fable-wiki-roguelike_html.html
sha256: e8e80b72aa9853ab043cc449846b6a6ee332f3d8cba52549638fa30e87cf33bd
read: partial
pages: 本文をすべて（冒頭・Origin・Gameplay and design の4節・History の全節・Community）。参考文献の一覧は読んでいない
anchors: ["the least of all available evils", "put weight on every decision", "play through several times to learn", "former characters reappear as enemies", "make it back to the surface with that sword", "more understandable, more easy-to-play", "store and recover equipment", "coffeebreak roguelikes", "beer and pretzels", "totally revamped my thinking", "Skinner Box design"]
---
## 何の資料か
英語版 Wikipedia「Roguelike」。二次の百科事典（作り手の話の本数には数えない）。r3 の別ノート（ローグライトの節だけ）とは別に、BIZ-REPLAY のために本文を全部読み直した（DESIGN-ROUND2-audit 5章 F6 の材料の確かめ）。

## 読み取れること（自分の言葉で）
- 永久死：Rogue の作者の一人は、永久死を「痛くする・難しくする」ためでなく、**一つ一つの判断に重みを持たせる**ためと見ていた。セーブを入れたら、良い結果が出るまで読み込み直す遊び方が出たので、永久死にした（判断の重みは、やり直せないことから来る）。
- Berlin Interpretation の低い価値の要素に「生き残るための戦術を学ぶために**何度か通して遊ぶ必要がある**戦術の課題」がある（数周かけて覚えることがジャンルの前提）。
- NetHack などでは、**前の周の自分のキャラが敵として**ダンジョンに現れる（前の周が次の周に痕跡を残す）。幽霊や墓標の形もある。
- 不思議のダンジョン（チュンソフト）：Rogue を「分かりやすく、遊びやすく」する意図。だんだん難しくなるダンジョン、難度の選択で永久死を任意に、そして**前の周の装備や道具を預けて取り戻す手段**を置いた。西洋では、セーブの仕組みの違いが若い層に奇妙に見えて売れ行きが伸びなかった。
- ローグライト：短い1周と勝利条件。1周が短いと完走を目指して繰り返す動機になる。固定の出来事（決まった数の区域の最後に必ずボス）を持つものが多い。メタゲーム（目標を達成すると新しいキャラ・道具が開く。資源を集めて持ち越す）。日替わりの固定シード、シードの直接入力。
- 「コーヒー休憩ローグライク」：短時間で終わる派生。Digital Eel の宇宙探索の作品（Strange Adventures）は「短く、遊び直しやすい」体験を狙った。Spelunky は「深い」遊びを何度も繰り返せるようにし、ランダムな状況が新しい戦略をその場で作らせる。
- 生成のおかげで、作り手は詳細な世界を作り込まずに多くの時間分の中身を作れる（作る手間の話）。
- Hades は非線形の物語を組み込み、繰り返して潜る理由を与え、難しさで避けていた人を引き込んだ（と記事は書く。出典は二次）。

## 周回の設計への含み
1. 「判断の重みはやり直せないことから来る」：本作で周の途中のやり直し（巻き戻し）を許すと、判断の重みが減る。重みを残すなら、やり直しは周の単位にする【推論】。
2. 不思議のダンジョンの「預けて取り戻す」は持ち越しの穏やかな形。易しくする方向の持ち越し（簡単になりすぎる危険と、入口が広がる効果の両方）。
3. 「前の周の自分が敵として出る」は、自分の過去の記録と競う形（BIZ-REPLAY「競争」の動機の一例）。
