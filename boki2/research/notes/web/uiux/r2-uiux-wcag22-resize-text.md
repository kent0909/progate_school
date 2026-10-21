---
src: web
coll: uiux
doc: r2-uiux-wcag22-resize-text
file: r2-uiux-wcag22-resize-text.html
sha256: fce0a64d79be9cc4e66f5979db41370ccfc5c0ca08b60c2d29f74c63e41e32d9
read: partial
pages: 基準本文と趣旨の節
anchors: [up to 200 percent, without loss of content or functionality, images of text, The author's responsibility is to create web content that does not prevent the user agent, people with milder visual impairments, text-only resizing]
---
WCAG 2.2 の 1.4.4「テキストのサイズ変更」の解説（AA）。
- 補助技術なしで、文字を200%まで大きくしても内容と機能が失われないこと。画像になった文字は例外だが、文字を画像にしない方が良い。
- 拡大は主にブラウザの責任だが、作り手は「拡大を妨げない」責任がある（固定の高さで文字が切れる、拡大禁止の設定、など）。
評価への使い方
- textScale(150)・textScale(200) で、文字が切れていないか、ボタンの中の字がはみ出していないか、重なっていないか。ビューポートのズーム禁止（user-scalable=no）がないか。
- ゲームの中に文字サイズの設定があるなら、それとブラウザの拡大のどちらも効くか。
