---
src: web
coll: uiref
doc: uC-heer-animated-transitions
file: uC-heer-animated-transitions_pdf.pdf
sha256: 6f08d6bf46903ac8ebb2bae98aae1592dea2b3b2d5dda589c2464ad2c5e45c05
read: full
anchors: ["Animated Transitions in Statistical Data Graphics", "temporal “chart junk”", "Maintain valid data graphics during transitions", "Make transitions as long as needed, but no longer", "we implemented staggering", "Experiment 1: Object Tracking", "Twenty-four subjects", "most subjects laughed upon first viewing", "persisting axis gridlines as landmarks", "Phosphor: Explaining Transitions"]
---
Heer（当時 Berkeley）と Robertson（Microsoft Research）の InfoVis 2007 論文。本文と参考文献まで全部読んだ。

主張と実験：
- 棒・円（ドーナツ）・散布図の間の切り替え（並べ替え・絞り込み・時点の変化・表し方の変更・詳しくする）を、一瞬で替える／そのまま補間する／段に分ける、で比べた。データの図を仕事で使う24人（26〜62歳）
- 実験1（2つの印を追って最後の位置を押す）：動かす方が全条件で誤差が小さい。段に分ける方がさらに小さいことが多い（重なりが減るため）
- 実験2（1つの印の値が何％変わったかを当てる）：散布図・横並びの棒・ドーナツで動かす方が正確。一瞬で替えると「分からない」の答えが多い。目盛りが変わると難しくなる
- 好み：段に分けた動き＞そのままの動き＞一瞬の切り替え。ただし段を細かくしすぎた（積み上げの棒を1段ずつ、ドーナツを4段）ものは誤差が増え、見た人の多くが笑った（発表の場では困る）
- 設計の決まり：途中の姿も正しい図であること、同じ意味の操作には同じ動き、データの意味と動きをずらさない（関係のない値を同じ棒で入れ替えると誤解）、重なりを減らすために少しずつずらす（stagger）、ゆっくり出てゆっくり止まる、単純な動き（回転より平行移動）、段に分けるのは複雑なときだけ、長さは必要なだけ（約1秒）、目盛りの線は目印として残す
- 動きの危うさ：注意を奪いすぎる、関係のないものをつなげて見せる、時間の上の「飾りの線（チャートジャンク）」になりうる、消えるので見比べにくい

このゲームへの含意（担当 C）：
- 棚の帯・月報の棒・ライバルとの比べの棒が変わるとき、一瞬で替えるより動かす方が「どれがどれだけ変わったか」を読み取らせる。P3（どこに反映されたか）への直接の根拠
- 長さは1秒前後が実験の値。手ごたえの動き（DESIGN-JOURNAL-UX の 400ms 以下）と、数字の変化を読ませる動き（約1秒）を別の枠にする根拠になる
- 月報の行を少しずつずらして出す（stagger）、目盛りは変えない（月をまたいでも同じ目盛り）、変わる途中も正しい棒であること、は規則にそのまま入れられる
- 限界：2007年、デスクトップの大きな画面、仕事でグラフを使う大人。スマホの小さい画面・中高生は調べていない
