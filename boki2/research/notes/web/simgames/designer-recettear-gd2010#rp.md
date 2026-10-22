---
src: web
coll: simgames
doc: designer-recettear-gd2010#rp
file: designer-recettear-gd2010.html
sha256: 2e5c847460fb6d5596958fd964e0bc1ae46a285ee3c77e5d323dcc86ff0bfc21
read: full
anchors: ["Peanut Butter cup", "stay persistent with each play through", "attack arc", "one more turn", "ever increasing debt", "completely missed the fourth dungeon", "not a lot of customer types", "not go overboard in prices", "bouncer to keep", "Game-Wisdom"]
---
## 何の資料か
Game Developer（旧 Gamasutra）のブログ欄の Josh Bycer（評論家）によるルセッティア（Recettear）の評（2010年）。作り手の話ではなく、遊んだ評者の分析（BIZ-REPLAY では「評者の分析」に数える）。別ノートがあるが、BIZ-REPLAY のために持ち越しと周回の観点で全文を読み直した（DESIGN-ROUND2-audit 5章 F13 の確かめ）。

## 読み取れること（自分の言葉で）
- 目的は借金の返済。毎週末に分割の支払いがあり、払えなければゲームオーバー。ただし**能力と見つけた道具は遊び直しても残る**ので、負けても全部が無駄にはならない。
- 店（値付けで客と駆け引き）とダンジョン（道具を拾う）の二つが回り合う。商人の段が上がると新しい仕組みが開く。「もう1ターン」の感じに作ってある。
- クリアすると、借金を気にせず続けるモードと、**借金が増え続ける**生き残りのモードが開く。
- 不満：仕組みの説明が足りず、時間制限があるのに、後で「前にできたはずのこと」を知って苛立つ。1周目で4つ目のダンジョンを見逃した。客の種類が少なく、欲しがる物が乱数に見え、売り上げの見通しが立てにくい。
- 評者は本編を終え、続けるモードを少し遊んでみたい、と書く（2周目以降への動機は弱め）。

## 周回の設計への含み
1. 持ち越し（能力・道具）は負けの痛みを減らし、次の周を始めやすくする。代わりに次の周は易しくなる（本作の簿記の論点では、持ち越すと練習が減る）【推論】。
2. 「借金が増え続ける」モードは、クリア後に難度の段を足す仕掛け（StS の段と同じ働き）。
3. 時間制限があるときに説明が足りないと、1周目の失敗が「知らなかった」せいになり、学びでなく苛立ちになる。本作の1周目の発見の場面の作り方への注意【推論】。
