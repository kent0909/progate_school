---
src: web
coll: uiux
doc: r11-ju-wcag-dragging
file: r11-ju-wcag-dragging_html.html
sha256: c3905630a35b6e8246aba32c1769f3ff82b217d464d41e4b1b2a34b9df5771c6
read: full
anchors: ["Don’t rely on dragging for user actions.", "can be achieved by a single pointer without dragging", "tap or click to establish a start-point", "providing a text input can be an acceptable single-pointer alternative", "can't exclusively rely on a path-based gesture", "A sortable list of elements may, after tapping or clicking on a list element", "A kanban widget with several vertical columns", "G219: Ensuring that an alternative is available for dragging movements"]
---
WCAG 2.2 Understanding SC 2.5.7 Dragging Movements（AA）。W3C の一次資料。全文を読んだ（用語の定義まで）。

要点：
- ドラッグで操作できる機能は、すべてドラッグなしの単一ポインタ（タップ・クリック）でも達成できること。例外は「ドラッグが本質的」な場合とブラウザ側の機能
- ドラッグは4つの動作（押す→押したまま→動かす→離す）で、押したまま動かせない人（トラックボール・視線入力・音声マウス）がいる
- キーボードで動かせるだけでは足りない（タッチ端末に物理キーボードがない）。逆に、テキスト入力は単一ポインタの代わりとして認められる
- 代わりの単一ポインタ操作が、スワイプ（経路ジェスチャー）だけに頼るのもだめ（2.5.1 に落ちる）
- 例：並べ替えリストは項目を押すと上下ボタンが出る。かんばんは項目を押すとメニューで列を選べる
- ドラッグ（始点と終点だけが大事）と経路ジェスチャー（軌道の向きが大事。スワイプ）は別の基準

このゲームへの含意：
- 設計の基準に直結する：ドラッグ（PC）・スワイプ（スマホ）を入れるなら、「札を押す→列を押す」の2タップが必ず同じ機能を持つ。これは依頼文の「押して選ぶ形も残す」と一致
- スワイプも経路ジェスチャーなので、スワイプだけ・ドラッグだけのどちらも不可。両方に2タップの道を添える
- 置いた札の「つかみ直す・入れ替える」にも、押して出るメニュー（左へ／右へ／棚へ戻す）を用意する
