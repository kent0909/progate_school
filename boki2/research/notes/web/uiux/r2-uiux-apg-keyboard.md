---
src: web
coll: uiux
doc: r2-uiux-apg-keyboard
file: r2-uiux-apg-keyboard.html
sha256: c387b1907b2a6025998f92d8ff998a8ad2e648435738c64a551d8c73d7cd1868
read: partial
anchors: [tab sequence, Predictability of movement, Discernible and Predictable Keyboard Focus, selection follows focus, roving, The default order of elements in the tab sequence is the order of elements in the DOM]
---
W3C の ARIA 作成実践ガイド（APG）の「キーボード操作」の章。
- Tab／Shift+Tab で部品から部品へ、矢印キーで部品の中（ラジオ・タブ・メニュー・表）を動く、というのが全環境共通の約束。
- フォーカスの順序は画面の読む順と合わせる（左から右、上から下、区画ごと）。見た目の位置と順序がずれると迷う。tabindex で順序を変えるのは勧めない。
- 「選択」と「フォーカス」は別物。タブでは矢印で動かしたときに選択も変わる（速い）方式と、Enter/Space で選ぶ方式がある。
評価への使い方
- Tab の順序が画面の流れと合うか、フォーカスが迷子にならないか、ラジオのような選択肢（仕訳の科目選びなど）が矢印で動くか、Enter と Space の両方で押せるか。
