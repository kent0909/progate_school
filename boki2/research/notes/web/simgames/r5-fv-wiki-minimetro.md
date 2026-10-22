---
src: web
coll: simgames
doc: r5-fv-wiki-minimetro
file: r5-fv-wiki-minimetro.html
sha256: b0f9f618a67c84bf95310a2231e7d3cbf96b8b793f0fdb74a469b3881d1acb34
read: partial
pages: 概要・遊び方・開発・評価の節。参考文献は読んでいない
anchors: ["bold colours and simple geometry", "procedural audio system", "their shape matching the type of station", "typically six", "Minimising the amount of production art was a necessary restriction", "Mind the Gap", "elegant even in disaster", "New Zealand postage stamp"]
---
英語版 Wikipedia「Mini Metro」（2015年、Dinosaur Polo Club）。概要。

要点：
- 見た目は現代の路線図をまねた太い色と単純な幾何学。音は操作と路線網から音を生成する仕組み（ミニマル音楽に着想）。
- 駅は形（丸・三角・四角…）で、乗客は小さな形で行き先の駅の形を示す＝**色と形だけで情報を伝える**。駅は約6人で満員になり、長く満員だと終わり。毎週の終わりに新しい線・トンネル・橋・乗換駅をもらって選ぶ。止めて組み替えられる。標準・極端（一度置いたら動かせない）・無限（満員にならない、のんびり）の3つの遊び方。
- 開発：2人の兄弟。作り切るため、**最初に制約を決めた**（絵の素材を最小に・音に頼らない・面を手作りしない）。そのため抽象的な見た目と自動生成の面に集中した。週末で試作し、大会で革新部門1位。ブラウザ版の試作を無料で公開。早期アクセスで利用者の声を入れて画面を直した。絵と音は外部の人（後の GDC 講演者と作曲家）に頼んだ。
- 評価：直感的な画面・単純な遊び・ミニマルな作りが好評。難しさが上がって崩れていく様子まで「破綻しても優雅」と評された。2024年にニュージーランドの切手になった。

分析：**少人数で安っぽく見えない作り方の代表**。素材の数を減らす代わりに、色・形・線の規則（設計の言語）を厳密にして、崩れる場面まで美しくする。ブラウザの SVG で最も再現しやすい型（線・円・多角形・太い色）。ピヨ商店の町の地図・資金の流れの図・工場の「川」を、路線図の作法（45度の角度、太い色の線、駅＝丸）で描ける。
