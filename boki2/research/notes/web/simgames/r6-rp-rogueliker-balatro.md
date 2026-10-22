---
src: web
coll: simgames
doc: r6-rp-rogueliker-balatro
file: r6-rp-rogueliker-balatro.html
sha256: 6d849430683db8e664ec91d9b7cce32e728bcc29aa374c734b51be16fbadf876
read: partial
pages: 記事本文（前置き・全問答・後書き）をすべて。サイト末尾の記事一覧は読んでいない
anchors: ["indie take on solitaire with a poker coat of paint", "500k copies", "Big Two", "as a kind of ‘passive’ item", "akin to hanging a picture on the wall", "the discourse around how random the game feels", "Luck Be a Landlord", "Rocket League"]
---
## 何の資料か
Rogueliker の記者による Balatro の作者 LocalThunk への書面の聞き取り（2024年春、発売後に50万本を売った頃）。作り手本人の言葉。

## 作り手の言葉（自分の言葉で要約）
- 1周ごとに遊ぶトランプのゲーム。上がり続ける必要点数を超えるために点を稼ぎ、絡み合う仕組みと相乗効果が面白い方向へ誘う。
- ポーカーの見た目は入り口のための飾りで、仕組みは中国の札捨てゲーム「大老二」から。誰もが知るトランプは、情報の多い戦略ゲームを身近にする媒体。
- 当初は道化札がなく、札自体を店で強化するだけで物足りなかった。道化札（持っているだけで効く札）を足して深まった。
- 釣り合いは「絵を壁にかけるとき、本当に水平かより、水平に**感じる**か」で調整する。強すぎて周りの戦法を食う札、弱すぎて選ぶ理由がない札は数字を変えて直す。
- 発売後に見えた意外なこと：運の強さをめぐる議論。乱数は多い（多すぎるかもしれない）が、上手な遊び方は**危険を減らし、崩されにくく、それでも勝てる構成を組むこと**へ移っていった。
- 開発中は他のデッキ構築を遊ばなかった（Slay the Spire を買ったのは18か月後）。車輪の再発明もしたが、新鮮さを保てた。

## 周回の設計への含み
1. 運が大きいゲームでも、上達は「運を読んで備える」方向に進む（Into the Breach の予告、Kasavin の「制御できるものとできないもの」と同じ向き）。本作の「資金繰りは決定論」を外し、**運の振れ幅を判断と帳簿の正しさで抑える**形にする根拠の1つ。
2. 選ばれない選択肢・強すぎる選択肢を数字で直す作り＝判断の選択肢ごとの選ばれ方を検査で数える（DESIGN-ROUND2 3.9 で宣言して落とした指標）。
