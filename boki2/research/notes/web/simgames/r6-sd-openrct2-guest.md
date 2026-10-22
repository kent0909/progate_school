---
src: web
coll: simgames
doc: r6-sd-openrct2-guest
file: r6-sd-openrct2-guest.html
sha256: 2a4cfe10e4f1b870450017322926ce60124fdaf1b99e0cc6fff0d7b46a790851
read: partial
pages: 客が乗り物・店に行くか決める shouldGoOnRide と GuestShouldGoToShop、次に向かう乗り物の選び方（GuestPickRideToGoOn・GuestFindRidesToGoOn・GuestFindBestRideToGoOn）、もう一度乗るか（GuestShouldGoOnRideAgain）、乗った後の満足（GuestCalculateRideSatisfaction・値段の満足・お気に入り）、園を出るか（GuestLeavePark の前後）、名前の隠し要素。移動・行列・食べ物・天気の細部・画面の更新など残りの大部分は読んでいない
anchors: [katieBrayshaw, GuestLeavePark, Always take the tall rides into consideration, realistic as you can usually see them from anywhere in the park, Pick the most exciting ride, won't pay more than twice the value of the ride, decreased by 75% if they had to pay to enter the park, good value if the price is 50% or less, GuestCalculateRideValueSatisfaction, GuestShouldGoOnRideAgain, Peeps that are happy enough, have enough energy, Approx 95% chance of staying in the park]
---
OpenRCT2（RollerCoaster Tycoon 2 を作り直した公開のソース、GitHub の develop の枝）の `src/openrct2/entity/Guest.cpp`。客（peep）一人ずつの判断のコード。元のゲームの番地（rct2: 0x…）の注記が残っていて、原作の判断をそのまま写したものとされる。一次資料（コード）。

客の判断の流れ（自分の言葉で）：
1. **どの乗り物を候補にするか**：地図を持っていれば園の全部の乗り物。持っていなければ**自分の周り（半径10マス）の乗り物**と、どこからでも見える高い乗り物・興奮度8以上の乗り物だけ。まだ乗っていないものの中から、行ってよいと判断したもので**興奮度が一番高いもの**へ向かう。
2. **行くかどうかのふるい**（すべて閾値）：
   - 所持金より高ければ行かない（「お金がない」と思う）。
   - 最近事故を起こした乗り物は、とても機嫌が良い客（幸福225以上）以外は行かない。
   - 雨なら、屋根のある乗り物以外は行かない。
   - 激しさが客の好みの幅の外なら行かない。**幸福が高いほど幅が広がる**（上にも下にも約2.5まで）。気持ち悪さも、客の耐性＋幸福を越えると行かない。
   - **値段が乗り物の価値の2倍を越えると行かない**（「割に合わない」と思い、幸福の目標が下がり、乗り物の人気も下がる）。**入園料を払った客は、払う気が4分の1になる**。値段が価値の半分以下なら「お得」と思う（入園料を払っていない客だけ）。
   - 同じ乗り物・同じ店には続けて行かない。
3. **乗った後の満足**：値段と価値（幸福で少し上乗せ）、激しさと気持ち悪さが好みに合うか、行列で待った時間（長いと減り、短いと増える）、同じ種類・同じ乗り物に乗ったことがあれば少し増える。満足が高く幸福なら「お気に入り」になる。
4. **もう一度乗るか**：幸福・元気・空腹・のど・トイレの条件がそろい、乗った数が少ないほど乗り直しやすい。
5. **帰るか**：元気・幸福が一定以上で所持金が5以上なら必ず残る。そうでなければ判定のたびに約5%で帰る。

ゲームへの意味（分析）：
1. RCT の需要は**式ではなく、一人ずつの閾値のふるいの集まり**。値段（価値の2倍）・天気（屋根）・評判（事故）・好み（激しさ）・場所（周りしか見えない）・入園料の有無が、客ごとに別々に効く。だから「値段を上げる」ことの効きが、入園料を取るか・雨が多いか・園が楽しくて客の幸福が高いかで変わる＝**因子が絡み合う**。
2. ただし値段の最適は「価値の2倍のすぐ下」（入園料を取るならその4分の1の2倍）で、**閾値の位置にほぼ固定**される。上手な人はこれを覚えて全部の乗り物をその値にする（判定書が Lemonade Stand に見つけた「最適が1つに決まる」と同じ型。最適が動くのは、入園料を取るか・乗り物ごとに取るかの大きな選択の側）。
3. **場所の効果**が強い：客は周りの乗り物しか候補にせず、高い乗り物は遠くからでも見える。店・乗り物の配置（客の通り道の上に置く）が需要を決める＝ラーメン屋なら「駅からの動線」「看板の見え方」を、エリアの潜在客の掛け算でなく、客の流れの中の位置として扱う大胆案の根拠。
4. 一人ずつの判断は、プレイヤーに「理由の吹き出し」（高すぎる・雨だから・激しすぎる）として見せられる。ピヨ商店でも、来なかった客の理由を数えて「高すぎ 32%・遠い 18%・待ちが長い 11%」と月報に出せば、需要の式を推測する手がかりになる（Tynan の頭の中の模型の原則への答えの一つ）。
