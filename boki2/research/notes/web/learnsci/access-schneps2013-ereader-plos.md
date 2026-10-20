---
src: web
coll: learnsci
doc: access-schneps2013-ereader-plos
file: access-schneps2013-ereader-plos.html
sha256: cda3753293ae1ba43b6a2de1325f1ed220de1b7dab3f66ce4eeb82bb4a6def3f
read: full
anchors: [formatted to display few words per line, Span Limited Tactile Reinforcement, practiced reading using SLTR on the iPod for a minimum of 300 minutes, those with VA Span scores below 3.09, decreased by a factor of two when short lines were used, historically imposed constraints, Freeman Deutsch wrote the iCue app]
---
Schneps ほか（PLOS ONE 2013、CC0）。読み障害のある高校生 103 人に、同じ読解テストを「紙（1行に約14語）」と「小さな携帯端末で大きな字・1行に2〜3語・指で縦に送る」の2通りで読ませ、読解の得点と速さを比べた。

要点（自分の言葉で）
- 全体の平均では紙と端末に差はなかった。差は人によって逆向きに出た。音をたどって読む力（ふりがなのない語を音に直す力）が弱い人ほど端末のほうが速く、一度に見て取れる字の幅が狭い人ほど端末のほうが内容をよく理解した。読む力が強い人は逆に紙のほうがよかった。
- 対象のうち、理解で得をする人は約3分の1、速さで得をする人は半分近く。
- 先行の視線の研究では、1行を約12語から約2語にすると、前に戻って読み直す目の動きが半分に減った。著者は、行が長いと、すでに読んだ左側の詰まった字に注意が引きずられて読み直しが増える、と考えている（推測であると明記）。
- 慣れの差をなくすため、事前に端末での読みを合計300分以上練習させてから測っている。
- 行を短くしても、語を音に結びつける遅さそのものは解決しない、と限界を書いている。

このゲームの評価にどう使うか
- 行の長さを物差しにする。この人物の端末は 1366×768 のノートPCで、横に広い画面に文字が1行に何十字も並ぶと読み直しが増えるはず。inspect() で文章の箱の幅と文字の大きさを取り、1行あたりの字数（幅÷文字の大きさ）を出す。
- 「短い行がいい人もいれば長い行がいい人もいる」ので、評価は「行の長さを選べるか・文字を大きくすると行が短くなるか」を見る。固定の長い行しかないのは不利、と判定する。
- 限界：英語の高校生の研究。和文の1行の字数への換算は自分で決める（knowledge.md の物差しに明記する）。
