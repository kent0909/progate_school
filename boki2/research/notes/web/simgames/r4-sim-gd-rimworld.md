---
src: web
coll: simgames
doc: r4-sim-gd-rimworld
file: r4-sim-gd-rimworld.html
sha256: 6f3eac609a46a38cb33b4b89efa2dfef9d3c540bdd2f50077485eaa24d4f70a4
read: full
anchors: ["Boatmurdered and Gemclod", "carefully designed ecosystem of Ultima Online", "a player can observe and comprehend", "categorized database", "The game tries to hurt but not kill the colony", "The storyteller eases off", "drama is good", "manhunting animals go mad during a fire"]
---
Game Developer の記事（2016年、RimWorld の早期アクセス中）。設計者 Tynan Sylvester への聞き取りと、本人の2013年のブログの紹介。発言の部分は一次に近い。

要点（自分の言葉で）：
- プレイヤーは思うほど複雑なシミュレーションを望んでいない。Ultima Online の作り込んだ生態系は、誰も全体を見られず、気づかれずに終わった。大事なのは、プレイヤーが観察して理解できる程度の単純さ。
- AI の語り手（storyteller）は、ゲームの中の少数の統計値をもとに、分類した出来事の山から出来事を選ぶ仕組み。乱数の要素を入れつつ、プレイヤーの行動とかみ合った物語を生む。
- 物語の本当の動力は遊びの仕組みそのもの（遊びに効く程度に単純化した性格、覚えられる程度の少人数、家族関係の生成）。
- 「傷つけるが殺さない」設計：襲撃者は勝っても皆殺しにせず、奪うかさらって去る。心が折れた人物は少し暴れて立ち直る。人口が減ると語り手は手をゆるめる。負けを一瞬で終わらせず、長い下り坂として見せ、ときには立ち直れるようにする。負けていく過程こそ劇的だから。
- 出来事は長く続き、重なるように作る（有毒の降下物は数日、火事はゆっくり、包囲も数日）。包囲中に商人が来る、火事の最中に動物が暴れる、のように、重なりが物語の豊かさを生む。

ピヨ商店への転用：
1. 出来事の山札は、少数の状態の値（現金・在庫・評判・季節・機械の古さ）を見て選ぶ。山札は分類しておく（客足・原価・設備・人・取引先）。
2. 事故（腐敗・故障・値上がり・貸倒れ）は「傷つけるが殺さない」強さにする。1回で倒産させず、資金繰りが苦しくなる下り坂として数か月かけて見せ、立て直しの判断（借入・値上げ・在庫の処分・資産の売却）を挟む。資金が乏しいときは新しい事故の札を減らす。
3. 事故は数か月続く形にして、他の出来事と重なる場面を作る（機械の修理中に大口の注文が来る、など）。重なりは判断の材料を増やし、正解を1つに決めにくくする。
