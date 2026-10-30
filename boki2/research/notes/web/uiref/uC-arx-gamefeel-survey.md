---
src: web
coll: uiref
doc: uC-arx-gamefeel-survey
file: uC-arx-gamefeel-survey_pdf.pdf
sha256: d9ddc74f1fe7b91faadf07412afa623fed4fa462f90257bc708b0ef9791e9a7f
read: partial
pages: 1〜3ページ（序・ジュースの目的）、9〜10ページ（出来事を知らせる手法：画面の揺れ・粒）、17〜18ページ（3つの領域：物の手ざわり・増幅・支え）。それ以外の手法の一覧と参考文献は読んでいない
anchors: ["tuning, juicing, and streamlining respectively", "There is an adequacy to juice", "juice-dance of the chain-daggers", "subway legibility", "One-shot Particles", "Juicing the amplification means providing adequate", "5400 lines of"]
---
Pichlmair と Johansen（コペンハーゲン IT 大学）の「ゲームの手ざわりの設計」の総説（2020、arXiv）。200本以上の資料を整理した26ページのうち、上の3か所だけ読んだ（partial）。

読んだ所の要点：
- 手ざわりの磨き方は3つの領域に分かれる：物の手ざわり（重さ・動きの調整）、増幅（ジュース：遊ぶ人に力を感じさせ、出来事の大事さを伝える）、支え（遊ぶ人の意図をくんで、気づかれないように助ける。Celeste の操作のコードの多くが「許し」のため、という例）
- ジュースには「ちょうどよさ」がある。画面中が揺れる粒で埋まると、どこが仕組みとして大事かが読み取れなくなる（意図した作風でない限り）
- 見ている人のためのジュースもある（後ろで見ている人が足を止める、配信）
- 画面の揺れは大きな出来事（爆発・被弾）を知らせるもの。でたらめに揺らすのでなく、補間（イージング）で作る
- 出来事を知らせる手法は、出来事の大事さに応じて重ねる数を変えるのがふつう

このゲームへの含意（担当 C）：
- 「支え」の領域（気づかれない助け）は、仕訳の札の磁石・しきい値（DESIGN-JOURNAL-UX 4.7）と同じ考え。見た目の規則とは別に、操作の許しを設計に入れる根拠
- 「見ている人のためのジュース」は、中高生が友だちに画面を見せる・配信する場面（月の締め・決算の演出）に効く向き【推論】
- 揺れは大きな出来事だけに。札1枚ごとに揺らさない
