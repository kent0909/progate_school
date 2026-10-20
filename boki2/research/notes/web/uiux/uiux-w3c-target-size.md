---
src: web
coll: uiux
doc: uiux-w3c-target-size
file: uiux-w3c-target-size.html
sha256: 361694575d2a4ca5834de57dbc44b24c27ecc67956625703a140b9f1d79c62d4
read: full
anchors: ["The function can be achieved through a dif", "Browsers have default renderings of some c", "This success criterion has an exception fo", "Please share your ideas, suggestions, or c", "at least 24 by 24 CSS pixels", "24 CSS pixel diameter circle", "The requirement is independent of the zoom factor of the page", "Some people with physical impairments cannot click small buttons", "User Agent Control", "digital maps, the position of pins"]
---
W3C の WCAG 2.2 の達成基準 2.5.8『ターゲットのサイズ（最小）』（AA）の解説。ポインタで押す対象は24×24 CSSピクセル以上。ただし例外が5つ：間隔（24px の円を各対象の中心に置いて、他の対象の円と重ならなければよい）、同等の別の操作がある、文章中のインライン、ブラウザ既定の部品、本質的な配置。

大事な点を自分の言葉で。24px は『最低限』で、これを満たしても小さいボタンは押しにくい。解説自身が、できるだけ大きくするのがよいと書いている。ページを拡大して満たしたことにはできない（CSSピクセルの大きさは拡大で変わらないため）。手の震えや運動機能の制限がある人のための基準だが、タッチ操作やマウス、ペンの人の誤タップも減らす。丸い角で24pxの正方形が内側に取れなければ『小さい』扱い。

評価への使い方。AAの24pxは最低ライン、Apple の44ptやWCAG 2.5.5の44px（AAA）は『よい水準』と区別する。このゲームの選択肢や進むボタンを、実寸（getBoundingClientRect）で測る場面で使う。測定値が24未満なら不合格、24〜43は『合格だが小さい』、44以上なら良。
