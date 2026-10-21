---
src: web
coll: simgames
doc: r3-fable-wiki-slay-the-spire
file: r3-fable-wiki-slay-the-spire_html.html
sha256: a6cd4125cf6bfa1a8b39a4ba75be156c14842f01ebbb04ec5fc369bdf0cf5b4e
read: partial
pages: Gameplay・Development の節（Reception・References は読んでいない）
anchors: ["elements of metaprogression", "Up to 20 Ascension difficulty levels", "optional Act IV", "A daily challenge gives players a single chance", "too many weak cards or the unplayable cards dilute", "gameplay metric reporting from the game client", "when they were not picked by players when offered"]
---
英語版 Wikipedia「Slay the Spire」（Mega Crit、2017〜2019）。二次情報（証拠の強さは低い）。周回（ローグライト）の設計を確かめるために Gameplay と Development の節だけ読んだ。

仕組みの要点（自分の言葉で）：
- 1周（run）は3幕＋隠し第4幕。負けると最初から。1周ごとに選べるカード・遺物が変わるので、同じ目標でも手持ちの組み合わせが毎回ちがう。
- 周回の持ち越し（メタ進行）は2段。①勝っても負けても、得た点で新しいキャラ・カード・遺物が開く（周回の「幅」が増える）。②勝つたびに「Ascension」が1段ずつ開き、20段まで、負の条件が積み重なる（周回の「深さ」が増える）。
- 毎日1回だけ挑める固定シードの課題（全員が同じ盤面）、条件を自分で足す custom mode、実績（例：初期遺物だけで登る）がある。
- 開発側は、多数のテスターと「クライアントからの指標」で、提示されても選ばれないカードは価値が低いと判断して直した。単人プレイなので強い組み合わせの発見は問題にしなかった。

ピヨ商店の周回設計への示唆：
1. 周回の「幅」（新しい会社・業種・取引先が開く）と「深さ」（支えを外した難度が段で開く）を分ける。両方を同時に上げない。
2. Ascension のように「勝ったら次の段が1つ開く」は、オーナーの「何周かして定着したら満点」に合う。ただし会計の学習では「負の条件」は敵の強化ではなく、足場（ヒント・候補・自動仕訳）を外すこと。
3. 「提示されても選ばれない」の指標は、判断の選択肢の良し悪しの検査にそのまま使える（誰も選ばない選択肢は判断になっていない）。
4. 固定シードの「日替わり」は、本作では「同じ出来事を別の数字で」の抜き打ちに相当する。
