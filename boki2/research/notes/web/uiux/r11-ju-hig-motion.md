---
src: web
coll: uiux
doc: r11-ju-hig-motion
file: r11-ju-hig-motion_json.json
sha256: 957268c323af4617dabb6c0449d0920248c995159d54f76c691aa180ceb72a61
read: full
anchors: ["Add motion purposefully, supporting the experience without overshadowing it", "Make motion optional.", "Aim for brevity and precision in feedback animations", "generally avoid adding motion to UI interactions that occur frequently", "Let people cancel motion.", "maintaining a consistent frame rate of 30 to 60 fps", "avoid showing an oscillation that has a frequency of around 0.2 Hz", "Consider giving people a stationary frame of reference", "Explore how to adopt the zoom transition in navigation and presentations", "All layout- and appearance-based animations automatically include built-in easing"]
---
Apple HIG「Motion」。全文を読んだ（visionOS 向けの節も含む）。

要点：
- 動きは目的をもって足す。過剰な動きは気を散らし、体の不快にもつながる
- 動きを唯一の伝達手段にしない（音・触覚などで補う）。動きを切れるようにする
- 手ごたえの動きは短く正確に。ゲームでは成功した操作にぴったり結びついた短い動きが、長い演出より伝わる
- 頻繁に起きる操作には、一般のアプリでは動きを足さない（毎回待たされる）
- 動きを途中で打ち切れるようにする。とくに何度も見るものは待たせない
- ゲームは 30〜60fps を保つ。visionOS の節：周辺視野の動きは不快、0.2Hz 付近の揺れは避ける、止まった枠（基準）を与えると楽

このゲームへの含意：
- 「札が列へ飛ぶ」は成功した操作に結びついた短い動きで、この指針が言う「伝わる動き」の形。長さは短く（0.3秒前後）、押せば飛ばせる
- 毎回の記帳（頻繁な操作）に、意味のない飾りの動きを足さない。意味のある動き（どこに入ったか・数がどう変わったか）だけにする
- 背景のゆっくりした動き（湯気・客）は、0.2Hz（5秒周期）付近の揺れを避け、画面の中央の読む文は動かさない（止まった基準）
- 「控えめ」の設定と prefers-reduced-motion で動きを切れるようにする
