---
src: web
coll: simgames
doc: r6-fc-gdt-modapi-api-platforms-js
file: r6-fc-gdt-modapi-api-platforms-js.html
sha256: f76b3a5ccbdc74a9dba69ec31dc40897c09645be1b490f772646d27102dd2c4a
read: full
anchors: ["var checkPlatform = function (platform)", "'startAmount', 'unitsSold', 'licencePrize'", "platformRetireDate", "Checks.checkAudienceWeightings(platform.audienceWeightings)", "platform.marketPoints", "GDT.addPlatform = function (platform)", "Platforms.allPlatforms.push(platform)", "GDT.addEvent(platform.events[i])"]
---
Game Dev Tycoon の開発元（Greenheart Games）が公開している改造用 API の api/platforms.js（約40行）。新しいゲーム機（プラットフォーム）を足すときの検査と登録の関数。

読めること：1つのゲーム機のデータは、最初の台数（startAmount）・売れた台数（unitsSold）・ライセンス料・発売日・引退の日・開発費・ジャンルの相性（genreWeightings）・客層の相性（audienceWeightings）・技術の段（techLevel）を必ず持つ。任意で「市場の点」（marketPoints、日付つきの点の並び）を持ち、日付の形を検査する。ゲーム機ごとに出来事（events）も足せる。

需要の式として言えること：ゲーム機ごとに日付つきの点（marketPoints）のデータを持ち、ファイルはその日付の形を検査する。点が市場の大きさ（台数）を表すというのは名前からの【推論】で、ファイルには書かれていない（2026-10-23 に直した）。ジャンルと客層の相性はゲーム機ごとの重みとして持つ。式の全体（売上がどう決まるか）はこのファイルには書かれていない。

使い道（BIZ-FILL-CALIB の DEMANDSRC）：SIMDESIGN 1章の Game Dev Tycoon の「式の全体は【資料なし】」のうち、日付つきの点のデータと相性の重みがゲーム機ごとにある、までは一次資料で言える（点の意味は【推論】）。
