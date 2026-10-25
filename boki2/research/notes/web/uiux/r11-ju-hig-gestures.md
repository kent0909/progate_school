---
src: web
coll: uiux
doc: r11-ju-hig-gestures
file: r11-ju-hig-gestures_json.json
sha256: b00a8249b271de1259554903322347ffbb10c75402c5a47c7b1ab1bf8598b8dc
read: full
anchors: ["Give people more than one way to interact with your app", "Handle gestures as responsively as possible", "Indicate when a gesture isn’t available", "Add custom gestures only when necessary", "Use shortcut gestures to supplement standard gestures, not replace them", "Avoid requiring specific body movements or positions for input", "Move a UI element.", "Reveal actions and controls; dismiss views; scroll."]
---
Apple HIG「Gestures」。全文を読んだ（visionOS・watchOS の固有の節も含む）。

要点：
- 1つの操作に複数の入力の道を用意する。特定のジェスチャーができる前提にしない
- ジェスチャーは期待どおりに（タップは選ぶ・有効にする、スワイプは「操作を出す・閉じる・スクロール」、ドラッグは「要素を動かす」）。よく知られたジェスチャーをアプリ固有の意味に使わない
- できるだけ速く反応し、途中で「どれだけ動かせば完了するか」が分かる手ごたえを出す
- 使えないジェスチャーは使えないと示す（固まった・自分が下手だと誤解される）
- 独自のジェスチャーは必要なときだけ。発見できる・簡単・他と区別できる・それだけが唯一の道でない、の4条件
- 近道のジェスチャーは標準の操作を置き換えず、補う（戻るボタンを残したうえで端からスワイプ）

このゲームへの含意：
- 標準の意味に合わせると、札を列へ「ドラッグ」（要素を動かす）が本筋で、「左右スワイプで列を決める」は標準の意味（閉じる・スクロール）とずれる。スワイプを入れるなら、縦スクロールと衝突しない形（札の上で横に払う・しきい値・途中の手ごたえ）が要る
- 「押して選ぶ」は標準のタップで、これを残すのはこの指針の「近道は補うもの」そのもの
- 途中の手ごたえ：札を引くと列が近づく・色が変わる等で「あと少しで入る」が見える形にする
