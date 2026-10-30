---
src: web
coll: uiref
doc: uC-muzli-font-pairings-2026
file: uC-muzli-font-pairings-2026_page.html
sha256: 6511bf8c6b491f7211762294d9ebf64fe52928fe8e9f5244a728d9841d85aa06
read: full
anchors: ["Most of them used just one", "We counted instead of guessing", "They were offline, blocked the visit", "The headline is now four times the body size", "871 paired sites, 811 different pairs", "The third font is a mono", "Headlines are regular, not bold", "Pick one family. Make the second one earn its place.", "Get Muzli for your browser"]
---
Muzli のブログ、共同創業者 Petras Baukys の調べ（2026-10-21）。本文と数字の表、まとめまで読んだ。

方法：2026年1〜10月に24のデザインのギャラリー（Awwwards など）に載ったサイトを自動の閲覧器で開き、文字ごとに実際に描かれている書体と大きさを記録。数えられたのは 2,190 サイト。

結果（原文の数字）：
- 60% が見出しと本文を同じ1つの書体の一族で組む。対比は書体の違いではなく大きさで作る（見出しの中央値は本文の約4倍、64px 対 16px）
- 2つ組む 871 サイトの組み合わせは 811 通りで、ほぼ重ならない
- 3つ目に使われるのは等幅（23%）で、案内・札・日付・値段など小さな文字に使う
- 見出しは太字にしない例が多い（400 が42%）、字間を少し詰め、行の高さ 1.0。本文は 16px・行の高さ 1.4〜1.5
- 一般の Web で多い書体（Roboto・Open Sans など）は、デザイナーの選んだサイトでは少ない

このゲームへの含意（担当 C）：
- いまの CSS は3つの書体（丸ゴシック M PLUS Rounded 1c・本文の Zen Kaku Gothic New・ドットの DotGothic16）を定義し、文字の大きさが30種類以上ある（style.css・sim.css・ramen.css の font-size を数えた。報告の簡略化の台帳とスクリプト参照）。この調べの向きは「書体は1〜2つ、大きさは少ない段で大きく差をつける」。大きさの段を5〜6段にまとめ、見出しを本文の3〜4倍にする規則の根拠の1つ
- 等幅を数字・値段・日付の札に使う型は、帳簿・通帳の数字（桁がそろう）に合う。日本語の書体では等幅の代わりに数字だけ tabular-nums にする手がある【推論】
- 合わない所：調べたのは英語圏のデザイン事務所・製品のサイトで、日本語の文字組（漢字・かな、ふりがな）とゲームの画面ではない。和文は英字ほど大きさの差を付けると行が崩れやすい【推論】。数字はこの記事の調べの範囲の値
