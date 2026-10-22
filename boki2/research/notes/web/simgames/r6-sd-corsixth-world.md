---
src: web
coll: simgames
doc: r6-sd-corsixth-world
file: r6-sd-corsixth-world.html
sha256: 9058547714cf926d4779b3f436f818d3588a355e65d46b1aa38ab9ad79e1f800
read: partial
pages: 世界の初期化の頭（来院の割合の初期値）、患者の出現点（calculateSpawnTiles）、患者を作る spawnPatient、月末の onEndMonth と来院の日の割り振り（_prepareSpawnDates）、患者に病院を割り当てる chooseHospitalForPatient。地図・物・職員・災害・保存などの残りは読んでいない
anchors: [calculateSpawnTiles, Set initial spawn rate in people per month, Roujin's Challenge, round robin if less than gbvAllocDelay, Until changes in competing hospitals' reputations are implemented]
---
CorsixTH（Theme Hospital を作り直した公開のソース、GitHub）の `CorsixTH/Lua/world.lua`。原作のコードそのものではなく、原作の面のデータ（level_config）を読む作り直し。Theme Hospital の客（患者）の来方の資料（コード）。

自分の言葉で：
- **町全体の患者の数は、面の設定で月ごとに決まる**：最初の月の来院の数と、何か月目にいくつ増やすかの表（popn の Month・Change）を面のデータが持ち、毎月その分だけ来院の割合が増える。プレイヤーの評判で総数が動く作りではない（作り直しの版の changelog の要約には「評判で来院の割合が動くようになった」とあるが、この版のコードでは確かめていない）。
- その月の数を日に散らして来させる。0人の月にならないよう、少なくとも1人は来させる。
- **どの病院に行くか**：今のコードは、プレイヤーと AI の病院に**順番に**割り振る（コメント：競合の病院の評判の変化が実装されるまでは順番だけを使う）。コメントで止めてある本来の方法は、**病院ごとに「その病気の評判 × その病気の値段の釣り合い × 倍率」を魅力度として、和に対する割合で抽選**する。最初の数か月は順番に割り振り、ときどき完全に無作為に選ぶ、という面の設定の値（AllocDelay・AllocRand・AllocIndRep）が原作の面のデータにある。

ゲームへの意味（分析）：
1. Theme Hospital の需要の形は【推論】「町の総数は面の台本で増え、取り合いは病気ごとの評判×値段の魅力度の比」。つまり**総数は外から与え、シェアだけ魅力度の比**で、DESIGN-RAMEN の「エリアの潜在客×シェア」と同じ骨。違うのは、**病気（＝品目）ごとに別の評判を持つ**こと。ラーメンなら「醤油の評判」「つけ麺の評判」を品目ごとに持ち、品目ごとに取り合う形が、客層×品目の絡みの最小の入れ方になる。
2. 作り直しの版が AI の病院の評判を「まだ実装していない」まま順番の割り振りで代えている＝ライバルの病院が遊びの芯ではない（Theme Hospital のライバルは順位表の相手に近い）。手応えのあるライバルの資料にはならない。
3. 0人の月を作らない「救済」は、RimWorld の「傷つけるが殺さない」と同じ向きの小さな作り。
