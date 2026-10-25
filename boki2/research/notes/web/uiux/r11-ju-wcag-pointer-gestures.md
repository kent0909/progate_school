---
src: web
coll: uiux
doc: r11-ju-wcag-pointer-gestures
file: r11-ju-wcag-pointer-gestures_html.html
sha256: b42109151ffd48c9efe62f0505a34519aa29154e5aa8a5059132aab26245b104
read: full
anchors: ["Let users operate touchscreens with one finger and reduced gestures.", "A path-based gesture involves an interaction where the movement of the pointer along a specific path matters", "is of sufficient length, and is performed above a specific speed", "Multipoint or path-based gestures can be used so long as the functionality can also be operated by another method", "entering your signature may be inherently path-based", "a drag and drop operation could also be achieved by selecting an item", "Dragging movements, on the other hand, generally involve", "G215: Providing controls to achieve the same result as path based or multipoint gestures"]
---
WCAG 2.2 の 2.5.1（ポインタのジェスチャー、A）の解説ページ。全文を読んだ。

要点：
- スワイプ／フリックは「経路ジェスチャー」（軌道の向き・長さ・速さが認識の条件）。多点ジェスチャー（ピンチ）と同じく、単一ポインタの別の操作（タップ・長押し等）でも同じ機能ができること
- 例外は本質的なもの（署名）だけ。「左右に払って答える」は本質的ではない
- ドラッグ（始点・終点だけが大事）はこの基準の外で、2.5.7 が受け持つ。両方に当たる作り（軌道から外れるとつかみが外れるスライダー）は両方に落ちる
- 例：カルーセルのスワイプには前後ボタンを添える

このゲームへの含意：
- 「札を左右に払う」はまさに経路ジェスチャー。入れるなら、しきい値（長さ・速さ）の決め方と、タップの代わりが要る。また「軌道から外れると外れる」作りにしない（つかんだら指がどこへ行っても札はついてくる）
- 否定側の根拠：読み上げ（VoiceOver 等）は画面のスワイプを自分の操作に使うので、スワイプで答える作りは読み上げの操作と衝突する。読み上げでは押して選ぶ経路が唯一の道になる
