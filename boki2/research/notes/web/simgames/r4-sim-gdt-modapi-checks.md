---
src: web
coll: simgames
doc: r4-sim-gdt-modapi-checks
file: r4-sim-gdt-modapi-checks.html
sha256: 495b6da26c0aceb66d817ac19e24966cebb65afc9ece8100e68372264b279b0d
read: full
anchors: ["helper methods to perform common checks", "A mod caused an error", "audience weigthing is invalid", "genre weigthing is invalid", "invalid missionOverrides", "date is format y/m/w", "property not set on object", "duplicate value for"]
---
Game Dev Tycoon の公式の改造用 API の検査用の補助関数（helpers/checks.js）。開発元が書いた一次資料。

要点（自分の言葉で）：
- 客層の相性は3つ以上、ジャンルの相性は6つ以上の数で、どれも0以上1以下でなければならない。
- 上書き表（missionOverrides）は6行以上・各行6つ以上で、値は0〜1。行がジャンル、列が開発の重点（6段階の配分の項目）と読める。
- 日付は「年/月/週」の形で、月は12まで、週は4まで。ゲームの時間の刻みが「1か月＝4週」であることが分かる。
- ほかに必須の項目の有無と、ID・名前の重複を確かめる。誤りはゲームを止めずに記録だけする。

需要の作りとして読めること：
- 需要に効く因子はすべて0〜1に正規化した掛け算の重みで、範囲外を機械で弾いている。外部の作り手が足したデータでも、需要の式が壊れないようにデータの段階で検査している。

ピヨ商店への転用：
1. 需要の係数（天気・値段・宣伝・評判・季節）はデータの表に置き、読み込み時に範囲（例：0〜1、または0.5〜1.5）を検査する。validate に「係数の範囲」の検査を足す。
2. 時間の刻みを決めて固定する（ピヨ商店は月が単位。月の中を週か日に分けるなら、そこで返る出来事の数も決める）。
