---
src: web
coll: uiux
doc: r2-lowvision-wcag22-reflow
file: r2-lowvision-wcag22-reflow.html
sha256: bc0b7f0afa54f9f3817026aa3e070251174ccf6db1244c927a1e83e9819a6183
read: full
anchors: [Content can be enlarged without increasing line length, Vertical scrolling content at a width equivalent to 320 CSS pixels, Carousels and carousel-like widgets, Interfaces with persistent toolbars, Why specifically 320px and 256px, Focus Not Obscured (Minimum), C34: Using media queries to un-fixing sticky headers / footers, F102: Failure of Success Criterion 1.4.10]
---
W3C の WCAG 2.2 解説文書のうち、達成基準1.4.10「リフロー」（レベルAA）。

要点：
- 拡大しても、縦に流れる内容は幅320 CSS px 相当で、縦横の両方向にスクロールしなくても情報と機能が失われないこと。1280px の画面を400％にした状態にあたる。
- 横にはみ出した行を左右に動かして読むと、行の位置を見失い、体力も頭も余計に使う。だから文は表示幅の中で折り返す。
- 例外は、2次元の配置そのものに意味がある部分（地図・図・動画・ゲーム・データ表など）。ただし例外はその部分だけで、表の前後の見出しや説明文、表の中の各セルは折り返す必要がある。表は専用のスクロール枠に入れて、ページ全体が横にスクロールしないようにするのが望ましい。
- 固定表示（sticky）の帯やツールバーは、拡大すると読める範囲を大きく奪い、キーボードの焦点を隠す。小さい表示では固定をやめるか、利用者が畳めるようにする。
- 失敗の典型：折り返したときに内容が消える。

評価への使い方：仕訳の表・精算表のような表はリフローの例外にあたりうるが、その場合もページ全体が横にはみ出していないか、表の外の説明文が折り返されているか、固定の帯（上下のバー）が拡大時に画面を占領していないか、焦点が帯の下に隠れないか、を zoom(200)・textScale で見る。1366px のノートPCで200％なら約683px 幅で、320px よりはだいぶ広い。そこで横スクロールが出るなら明確な不合格とする。
