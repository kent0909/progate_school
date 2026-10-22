---
src: web
coll: simgames
doc: r4-sim-soren-otc-eapostmortem
file: r4-sim-soren-otc-eapostmortem.html
sha256: 21393aecc8fe44d059f00b484abb000d6fa0a8304c6449e1840f01bfd524d7c7
read: partial
pages: 本文の全部と、コメント欄の最初の2件（読者の批判と著者の返事）
anchors: ["The most common problem in the games industry is waste", "over 18 months before we shipped", "Reveal Map option", "debt auction", "Corpse and Hound", "next_version", "Destroy Buyout", "Daily Challenge", "design, code, play, and listen feedback loop", "unlisted store pages"]
---
Soren Johnson のブログ（2016年、Offworld Trading Company の早期アクセスの事後検証）。早期アクセスの14か月の事後検証。一次情報。

要点（自分の言葉で）：
- 開発の一番の無駄は、面白くない案に時間を使うこと。外の人に早く遊んでもらうのが最良の学び方（Civ 4 は発売の18か月前から外部の試遊団を持った）。
- 例：大会で「最良の開始地点を先に見つけた人が勝つ」と不公平を訴えられ、地図を最初から全部見せ、開始地点を「借金の競り」で決める方式にした（早く決めるほど多い借金を背負って始める＝良い場所を借金で買う）。発売の1年前に気づいたので、AI もこの方式に対応させられた。
- 物議を醸す変更は、オン・オフできる設定にして入れた（買収で建物を壊す・過半で脱落）。大会でその設定を必須にして練習させ、意見を集めた。過半の脱落は標準になり、建物を壊す方は子会社の仕組みに置き換わった。
- AI の改良：毎日違う乱数の種の「毎日の挑戦」で遊んだ録画をプレイヤーに上げてもらい、AI の一番大きな穴を見て直し、翌日の版で試してもらう。設計・実装・遊ぶ・聞くの輪を何回回せるかで品質が決まる（Civ 4 は2週に1回、Offworld は毎日）。

ピヨ商店への転用：
1. 良い立地・良い仕入先などの有利な選択には「借金で買う」型の代価をつける（早い者勝ちを避け、取引の判断にする）。資金調達と投資の判断が結びつく。
2. 競合 AI の弱点は、同じ乱数の種で人が遊んだ記録と AI の結果を並べて見つける（通し試験で、AI が明らかに損をする場面・プレイヤーが常に勝つ定石を拾う）。
3. 新しい仕組み（買収・保険など）は、まず設定でオン・オフできる形で入れ、試遊で残すかを決める。
