---
src: web
coll: uiux
doc: r2-uiux-wcag-info-rel
file: r2-uiux-wcag-info-rel.html
sha256: 73c1817bc00626b8c2c9cabac114bf94914ce316be4b256815d49af6537e7bd2
read: partial
pages: 基準本文と趣旨の節（技法の一覧は未読）
anchors: ["Information, structure, and relationships conveyed through presentation", "programmatically determined", "Sighted users perceive structure and relationships", "user style sheet", "Auditory cues may be used as well", "a larger font colored red"]
---
WCAG 2.2 の 1.3.1「情報及び関係性」の解説（A）。
- 見た目で伝えている構造（見出し・表の見出しセル・リストなど）が、読み上げでも分かるように、構造として定義されていること。
- 目で見る人は、大きい太字の見出し、箇条書きの印、行と列の並び、背景色のまとまりから関係を読む。表では各セルと行・列の見出しの関係が理解に必要。その関係を機械が分かる形か文字にしておけば、誰にでも伝わる。
- 例：赤く大きな値段は、通貨記号が前にあれば色が見えない人にも伝わる。音の合図も同じ考え方。直列に（別の方法で）読み上げて確かめる方法が紹介されている。
評価への使い方：精算表や元帳のような表が、本物の表（見出しセルと行・列の関係）か、div を並べただけか。a11y と read で見出しが読めるか。借方と貸方の列が、読み上げで区別できるか。
