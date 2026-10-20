---
src: web
coll: uiux
doc: uiux-xag-101-text
file: uiux-xag-101-text.html
sha256: d97d0794d9426b12e67a777d4bdfd60e3a8a4fd6be1b1aeb52c1baad4e7267b9
read: full
anchors: ["approximately 2.9 billion people in the world with some degree of low vision", "Players should be able to resize text up to 200 percent", "should be at least a space-and-a-half", "players can enable subtitles to display ch", "Want to try using Ask Learn to clarify or", "Measuring text size"]
---
Xbox Accessibility Guideline 101『文字の表示』（Microsoft）。目的は、弱視の人を含む全員が文字を読めるようにすること。文字の最小の既定サイズを決め（本体の高さ＝上端から下端までのピクセル数で測る。コンソール/PC は 1080p で26px、モバイルは18px@100DPI など、機器の密度で変わる）、200%まで拡大してもコンテンツ・機能・意味が失われない、行間は文字の1.5倍以上、といった基準。文字の大きさ・書体・太さ・字間・揃え・大文字小文字・色を、利用者が設定できるのが最良とされる。字幕、HUD、目標の文字も対象。画面が遠い、小さい画面、音が出せない状況でも文字は重要になる、という状況的な理由も挙げている。

このゲームへの当て方：文字の大きさは inspect() で font-size（CSS ピクセル）を取り、スマホ・タブレットでは密度が違うので数値の単純比較はせず、読めるかどうかは『拡大200%で崩れないか』で判定する。行間は、本文の行の高さ÷文字の大きさ（computed）が1.5以上かを見る。
