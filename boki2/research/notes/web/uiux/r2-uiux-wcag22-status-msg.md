---
src: web
coll: uiux
doc: r2-uiux-wcag22-status-msg
file: r2-uiux-wcag22-status-msg.html
sha256: d5a085f7be8814e4f01520db08d41d09b62491f40dc0fb6fb4941ec762cf3746
read: partial
anchors: [status messages can be programmatically determined, without receiving focus, "18 results returned", waiting state of an application, not delivered via a change in context]
---
WCAG 2.2 の 4.1.3「ステータスメッセージ」の解説（AA）。
- 成功・失敗・待ち・進捗などの知らせは、フォーカスを奪わずに読み上げソフトへ伝わること（role=status / alert など）。画面が変わる（文脈の変化）場合は対象外。
評価への使い方
- 正解・不正解の表示、所持金の増減、トースト（一時的な知らせ）が、見える人にだけ見えて、読み上げでは伝わらない作りになっていないか。a11y と read で比べる。
