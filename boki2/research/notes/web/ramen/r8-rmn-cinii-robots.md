---
src: web
coll: ramen
doc: r8-rmn-cinii-robots
file: r8-rmn-cinii-robots.txt
sha256: 43988facec888a1a56fc03e8b243cd8c3adc0fdb19ba1d2f46200650915432c9
read: full
pages: 全文
anchors: ["Allow: /crid/", "Crawl-Delay: 1", "Allow: /sitemaps/", "Disallow: /crid/*.json$", "User-agent: Bytespider"]
---
CiNii Research の robots.txt（2026-10-22 に取得）。取得してよい範囲を決めるために読んだ。
- すべての bot に対して、トップの頁・論文ごとの頁（/crid/）・サイトマップ・resourcesync だけを許し、残りはすべて禁じる。論文ごとの頁でも書誌の書き出しの形式（json・csv・ris など）は禁じる。
- したがって検索の頁（/all?q=…）と OpenSearch の API（/opensearch/…）は取得できない。論文を探すには、検索をオーナーに頼むか（WANTED.md）、別の窓口で題を知ってから /crid/ の個別の頁を取るしかない。
- 特定の bot（CCBot など13種）は全面禁止。
報告での使い方：BIZ-RAMEN 第5版の24章の「試した窓口」の記録。中身の根拠には使わない。
