---
src: web
coll: simgames
doc: r5-fv-tufte-sparkline
file: r5-fv-tufte-sparkline.html
sha256: f604599833b6bfb6470a322fb48163f7ccd686f162069c6fb8e529ead594283e
read: partial
pages: 冒頭の定義・連勝の錯覚・血糖の例・為替の表・投資信託の表・縦横比・意図しない視覚の雑音・解像度の節。それより後ろ（作例の一覧・寄せられた投稿）は読んでいない
anchors: ["Data graphics should have the resolution of typography", "too few long streaks", "in random order", "the normal range of glucose", "red = the oldest and newest rates in the series", "approximately right rather than exactly wrong", "hill-slopes averaging 45", "Do the prominent visual effects convey relevant content"]
---
Edward Tufte の公式サイトの記事「スパークラインの理論と実践」。情報デザインの第一人者の一次資料。

要点（自分の言葉で）：
- スパークライン＝文字の大きさの、データが濃く、設計が簡素なグラフ。文・表・見出し・地図の中に、言葉や数と同じ場所に置ける。
- 人は乱数の中にも連続や流れを見てしまう（本当の乱数には人が思うより長い連続がある）。試合の振り返りで場面を無作為の順に並べて、先入観の物語を防いだ例。
- 1つの数は文脈の中で意味を持つ：最新の値の横に過去80回の線を置き、正常の範囲を灰色の帯で示すと、外れた所がすぐ見える。最新の値と線の右端を同じ色で結ぶ。
- 表に線を添えると、最近の変化を長い過去の中で見られ、**最近の出来事を重く見すぎる偏り**を減らす。色の約束：赤＝最初と最新、青＝期間の最高と最低。
- 縦横比：坂がおおむね45度になる比が変化を読みやすい（尖りすぎも平らすぎも読めない）。
- 太い枠や縞の余白など、内容を伝えない目立つ効果（視覚の雑音）を避ける。「目立つ効果は関係のある内容を伝えているか」で点検する。

ピヨ商店への示唆（ブラウザでそのまま作れる）：
1. 店の一覧・口座の帯・月報の各行に、12か月のスパークライン（SVG の polyline、高さ1em）。最新の点を数字と同じ色に。目標の範囲（原価率の30%前後など）を灰色の帯で。
2. 月報で「今月は運が悪かった」と思い込む偏りを、長い線で見せて和らげる（会計の判断の訓練にもなる）。
3. 枠線を減らし、余白と細い罫で表を作る（今のチープさの原因の一つになりうる太い枠・強い色の箱を見直す）。
