---
src: web
coll: uiref
doc: robots-www.figma.com
file: robots-www.figma.com.txt
sha256: 525d1972f1d5699fd9055544b096b6d0fa0e5d6197c7a8dce1541bdcb211ab4b
read: partial
pages: Anthropic の名の組の前後と、末尾の許可の一覧の一部
anchors: ["User-Agent: Claude-SearchBot", "Allow: /id-id/$", "think-outside-of-the-box-with-claude-and-figjam", "/blog/made-in-figma-2019/$", "/blog/accessibility/$"]
---
figma.com の robots.txt。約39万字と長いので、Anthropic の名を含む組（ClaudeBot、Claude-SearchBot・Claude-User）の前後と、末尾の許可の一覧の一部だけ読んだ。

読み取ったこと：ClaudeBot には全部を禁じ、Claude-SearchBot・Claude-User には言語ごとの最上位の頁と一部のブログの頁だけを許している。Community のファイルの頁は許されていないと読めるので、取らない（no-automation）。Figma はオーナーが接続した公式の道具（MCP）でだけ見る。Community のファイルは道具ではファイルの鍵がないと開けないので、候補の一覧（uiref-figma-candidates.md）を作ってオーナーに複製を頼んだ。
