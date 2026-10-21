---
src: web
coll: uiux
doc: r2-uiux-wcag22-name-role
file: r2-uiux-wcag22-name-role.html
sha256: 8c62f3e1f2dc70597a4b290e76354c4ca2639762fa76032d7bccb113c7b96641
read: partial
pages: 基準本文と趣旨の節（事例の節は未読）
anchors: ["name and role can be programmatically determined", "states, properties, and values that can be set by the user", "standard HTML controls already meet this success", "custom controls", "assistive technologies"]
---
WCAG 2.2 の 4.1.2「名前・役割・値」の解説（A）。
- 部品の名前と役割（ボタン・見出し・リンクなど）と状態（選択中・展開中など）が、読み上げソフトに伝わること。標準のHTMLの部品を仕様どおり使えば満たされる。自作の部品（div に click を付けただけ等）が危ない。
評価への使い方
- a11y（押せる所の一覧）で、ボタンに名前（文字）があるか、アイコンだけのボタンに名前がないか、選択中の状態（aria-pressed 等）が伝わるかを見る。名前が「ボタン」だけ、全部同じ名前の並び、は不合格寄り。
