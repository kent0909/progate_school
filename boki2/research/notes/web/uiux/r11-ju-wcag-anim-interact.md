---
src: web
coll: uiux
doc: r11-ju-wcag-anim-interact
file: r11-ju-wcag-anim-interact_html.html
sha256: 14af35e29c3c990a8de49207a26b260c1812eb09b2c70b25f3750a9f114c12f2
read: full
anchors: ["Users are not harmed or distracted by motion.", "Motion animation triggered by interaction can be disabled", "Some users experience distraction or nausea from animated content", "Parallax scrolling occurs when backgrounds move at a different rate", "Take advantage of the reduce motion feature in the user agent or operating system", "Stop that extra movement! You are making me so dizzy I cannot concentrate", "C39: Using the CSS prefers-reduced-motion query to prevent motion", "Motion animation does not include changes of color, blurring, or opacity"]
---
WCAG 2.2 の 2.3.3（操作で起きる動き、AAA）の解説ページ。全文を読んだ。

要点：
- 操作に応じて起きる動き（本質的でないもの）は、利用者が止められること。前庭（内耳）の障害がある人は、めまい・吐き気・頭痛を起こし、寝込むこともある
- 視差スクロール（背景が前景と違う速さで動く）が典型の不要な動き
- 3つの直し方のどれか：不要な動きをやめる／切る設定を置く／OS の「視差効果を減らす」（prefers-reduced-motion）に従う
- 「動き」の定義：位置・大きさ・形が変わるもの。色・ぼかし・不透明度だけの変化は動きに数えない

このゲームへの含意：
- 動きの強さ3段（派手／ふつう／控えめ）の「控えめ」は、この基準に合わせて「位置・大きさ・形の変化を止め、色・不透明度の変化だけ残す」と定義できる。札が列へ入ることは不透明度と色で伝える
- prefers-reduced-motion のときは控えめから始める（依頼文のとおり）。設定でも切れるようにする（OS の設定を知らない人のため）
- 背景の「湯気・客の出入り」は視差に近いので、控えめでは止める。画面の揺れ（ほうび）も控えめでは止める
