---
src: web
coll: uiux
doc: r2-uiux-wcag22-keyboard
file: r2-uiux-wcag22-keyboard.html
sha256: fb44d4faaa9fa54a49aee794e969ccc3b7738f4b09e23aa96e3a3c9d44984feb
read: partial
pages: 基準本文と趣旨の節
anchors: [operable through a keyboard interface, without requiring specific timings for individual keystrokes, path of the user's movement, alternate keyboard, does not forbid and should not discourage providing mouse input]
---
WCAG 2.2 の 2.1.1「キーボード」の解説（A）。
- すべての機能がキーボード（または代替キーボード）で操作できること。キーを押すタイミングを求めない。例外は、手の動きの軌跡そのものが必要な機能（フリーハンドの描画など）だけ。マウスなど他の入力を足すのは構わない。
評価への使い方
- press('Tab') と press('Enter') だけで、タイトルから1か月の最後まで進めるか。ドラッグでしか仕訳が組めない画面があれば不合格。クリックだけで反応する div（ボタンではない要素）がないか a11y で確かめる。
