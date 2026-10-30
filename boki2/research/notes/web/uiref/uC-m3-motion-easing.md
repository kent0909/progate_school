---
src: web
coll: uiref
doc: uC-m3-motion-easing
file: uC-m3-motion-easing_page.html
sha256: 7c707c0faadfad57df1a65b1cb2cf8ed7a0c63d398321527f3fbbbbcaaa38038
read: full
image_seen: "画面写真（1280幅）：左に縦の案内の帯（Home・Get started・Develop・Foundations・Styles が選ばれた状態の薄紫の丸・Components・Blog）、右に薄い桃灰色の角の丸い大きな箱に黒の極太の見出し「Easing and duration」と1行の説明、その下に空の大きな箱（動きの見本が入る所、描画の時点では空）、2つに分かれた切り替えの札（右の Tokens & specs が薄紫）、目次の紫の文字3つ、紫の地の注意の箱（ばねの仕組みへの移行）、黒の大きな見出し「Tokens」"
anchors: ["Easing and duration create responsive and expressive motion", "which uses springs", "Emphasized easing set", "Standard easing set", "md.sys.motion.duration.medium4", "ambient transitions that don't involve user input", "Archived versions"]
---
Google の Material Design 3 の「Easing and duration」の決まり（tokens & specs）。描画して取り、全部を読んだ。

要点：
- 注意書き：新しい版（Expressive）では部品と動きは「ばね」の物理の仕組みに移った。この緩急と長さの仕組みは画面の移り変わりには使われるが、もう手入れされていない
- 緩急の組：強調（Emphasized。出るときは速く出てゆっくり止まる曲線、消えるときはゆっくり出て速く去る曲線）と標準（曲線の制御点は表を参照。小さく実用の移り変わりに）
- 長さの段：短い 50〜200ms（小さな実用の動き。選ぶ部品は 200ms）、中 250〜400ms（画面の中ほどを横切る。ボタンが板に広がるのは 400ms）、長い 450〜600ms（大きな表現の移り変わり。カードが全画面に広がるのは 500ms）、とても長い 700〜1000ms（まれ。利用者の操作を伴わない背景の移り変わり。自動で送る回転は 1000ms）

このゲームへの含意（担当 C）：
- 動きの長さを「段」（短・中・長・背景）で決めて名前を付ける型は、DESIGN-JOURNAL-UX 5.1 の種類分け（手ごたえ 400ms 以下・教える動き・背景）と同じ考え方で、CSS の変数として名前を付けられる（--dur-short など）。段の値そのものは Material の業務アプリの値なので、ゲームの手ごたえにそのまま使う根拠にはならない【推論】
- Material 自身が「ばね」に移っている：弾む・行き過ぎて戻る動き（squash・overshoot）を、決め打ちの曲線でなくばねの硬さで作る方向。ゲームの札の着地に合う
- 合わない所：Google の業務・汎用アプリの規則。ゲームの儀式（月替わり・決算）は「とても長い」より長くてよい場合がある（飛ばせることが前提）
