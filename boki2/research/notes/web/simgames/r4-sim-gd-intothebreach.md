---
src: web
coll: simgames
doc: r4-sim-gd-intothebreach
file: r4-sim-gd-intothebreach.html
sha256: a5094ad52fa4bca34c87d4cd4d7a9d82736af2c8a7be6bb8150b89c2256261a6
read: full
anchors: ["turning each match into a kind of puzzle", "mechs vs monsters where collateral damage matters", "Notepad++ for the Lua scripting", "every death felt like your own fault", "various superhero movies", "starts to feel like a puzzle", "A single additional enemy", "you can’t ‘max out’ all attributes", "it’s very clear how or why you failed"]
---
Game Developer（当時 Gamasutra）の「Road to the IGF」の聞き取り（2018年頃）。Into the Breach（Subset Games、FTL の開発元）の設計者 Justin Ma 本人の答え。一次情報。

要点（自分の言葉で）：
- 出発点は「巻き添えの被害が大事な、ロボット対怪獣」。1年ほど試作を重ねてから中心の仕組みが決まった。
- FTL より乱数を減らし、「やられたのは毎回自分のせい」と感じられるゲームをねらった。そのために敵の攻撃を前もって全部見せる（予告する）仕組みを中心に置いた。自分の攻撃にも当たり外れの確率がない。結果として各戦闘がパズルのように感じられる。
- 目標を「敵を倒す」だけにせず、街の建物を守ることを加えた。建物を見捨てる方がよい場面も、ロボットを犠牲にして街を守る場面もある。目標が複数で優先順位が状況で変わるから、面白い選択が生まれる。1つの戦法でずっと勝てないようにすることを最優先にした。
- 難しさの調整は数の勝負で、敵が1体増えるだけで「楽しい難しさ」が「不可能」になる。ただ、少し易しめでも創意工夫の余地があれば楽しい。
- 武器は副作用（隣のマスを押す等）の方が本体より効くことが多く、組み合わせで新しい解き方が生まれる。成長の道は毎回違い、全部の能力を上げきれないので選ぶ必要がある。
- 失敗したときに、どう・なぜ失敗したかがはっきり分かることが、上達できると感じさせる。乱数への依存が少ないことが「自分で制御している」感覚を支える。

ピヨ商店への転用：
1. コストの事故（故障・腐敗・値上がり・貸倒れ）は「来月こうなる」を前もって見せる（点検の報告・天気予報・仕入先の値上げの通知・取引先の支払いの遅れの兆し）。事故そのものより「予告にどう備えたか」が判断になる。
2. 目標を複数にする（もうけ・現金の残り・評判・従業員の負担）。その月に何を優先するかで正解が変わるようにすると、二択の正解問題から抜けられる。
3. 判断の結果の振り返りでは、どの要因で損をしたかを1行で示す（「仕込みすぎで在庫が腐った」「値上げで常連が減った」）。
4. 判断の幅（敵の数にあたるもの：同じ月の出来事の数）は1つ増やすだけで難しさが跳ねるので、月ごとの出来事の数は通し試験で慎重に決める。
