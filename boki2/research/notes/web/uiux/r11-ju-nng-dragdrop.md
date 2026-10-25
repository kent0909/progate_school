---
src: web
coll: uiux
doc: r11-ju-nng-dragdrop
file: r11-ju-nng-dragdrop_html.html
sha256: 66427e00298b1c8b9b0bf572be686c7139554aac8a4f44c49fde677b7dc1e972
read: full
anchors: ["Clear signifiers and clear feedback at all stages of the interaction", "it can be inefficient, imprecise, and even physically challenging, especially over long distances", "using menus to move a file to a different folder can be less error-prone than drag-and-drop", "A small, translucent “ghost” image of the object", "use a quick animation (roughly 100 ms) to show them moving towards their new location", "begins the reshuffling animation once the center of the dragged object overlaps the edge of the other object", "simulating a magnetic effect that snaps objects into place", "at least 1cm x 1cm of unused space for dragging"]
---
Nielsen Norman Group, Page Laubheimer「Drag-and-Drop: How to Design for Ease of Use」（2020-02-23）。全文を読んだ。

要点：
- ドラッグは直接操作の一種で、並べ替え・移動・大きさ変えに向く。欠点は、非効率・不正確・体に負担（長い距離）で、間違った所に落として最初からやり直しになりやすい
- 発見のしるし：つかめることのアイコン（統一されていない）とカーソルの変化（PC）。タッチにはホバーがないので難しい
- つかんだ手ごたえ：輪郭・色・影で浮く・傾く・半透明のゴースト。並べ替えでは、離す前に他の項目が約100msの動きでどいて結果を予告する
- どいて動き始めるのは、つかんだ物の中心が相手の端に重なったとき（端どうしだと「過敏」、カーソル位置だと「もっさり」）
- 磁石：落とし先を見た目より広くして、届く前に吸い付く。吸い付く先を強調して知らせる
- アクセシビリティ：Tab で取っ手に行き、スペースでつかみ、矢印で動かし、読み上げに状態と位置を伝える
- タッチ：指で手ごたえが隠れる、1cm×1cm の空き、タップ・スクロール・つかむの区別に少しの遅延、触覚の「こつん」。ホバーがないので、利用者が期待している証拠があり、安い代わりがないときだけ使う。Gmail はモバイルでドラッグをやめてメニューにした

このゲームへの含意（肯定と否定の両方）：
- 肯定：この画面の操作は「札を列へ移す」＝ドラッグが向く用途そのもの。磁石（列の当たり判定を広く）・ゴースト・約100ms の予告・中心の重なりで判定、を設計に写す
- 否定：スマホでは指が札と列を隠す、縦スクロールと衝突する。だから列の当たり判定を大きく、スクロールと衝突しない向き（横）に、押して選ぶ2タップを残す（Gmail の例と同じ考え）
- 「あてずっぽうで払う」の対策：吸い付きを強くしすぎると考えずに投げられる。しきい値を超えるまで列を光らせない・離すまで確定しない
