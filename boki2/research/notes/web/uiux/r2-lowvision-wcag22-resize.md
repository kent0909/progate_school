---
src: web
coll: uiux
doc: r2-lowvision-wcag22-resize
file: r2-lowvision-wcag22-resize.html
sha256: fce0a64d79be9cc4e66f5979db41370ccfc5c0ca08b60c2d29f74c63e41e32d9
read: full
anchors: [Ensure text can be doubled in size, without requiring the use of assistive technology, in web mail applications the subject column may not be wide enough, complements older screen magnifiers that provide, Images of text do not scale as well as text, G178: Providing controls on the web page that allow users to incrementally change, F80: Failure of Success Criterion 1.4.4 when text-based form controls do not resize, Zoomed text node is not clipped with CSS overflow]
---
W3C の WCAG 2.2 解説文書のうち、達成基準1.4.4「テキストのサイズ変更」（レベルAA）。

要点：
- 字幕と文字の画像を除き、支援技術なしで文字を200％まで大きくしても、内容や機能が失われないこと。拡大の主な担い手はブラウザだが、作り手はそれを妨げてはいけない。
- 狭い枠に収まらない見出しを切り詰めるのは、焦点を当てたり開いたりすれば全文が見られるなら許される。
- 200％を超えると、文字だけを大きくするよりページ全体の拡大（専用の拡大ソフト）の方が向く。大きすぎる拡大では語が枠からはみ出したり、文字が重なったり、1行に1語しか入らなくなったりする。
- 文字の画像は拡大でぼやけ、色の変更もできない。できるだけ本物の文字を使う。
- ページの中に文字の大きさを段階的に変える仕組みを置くのも、達成の方法の1つ。
- 失敗の典型：200％で文字・画像・操作部品が切れる・隠れる／入力欄の文字が大きくならない／画面幅の単位で文字の大きさを決めて拡大が効かない。

評価への使い方：ゲームの textScale(150) とブラウザの拡大200％で、①金額の入力欄の文字も大きくなるか、②ボタンの文字が切れたり重なったりしないか、③絵（文字の画像）に大事な情報が入っていないか、④ゲームの中の「文字の大きさ」設定が段階的に効くか、を確かめる。
