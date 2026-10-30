---
src: web
coll: uiref
doc: robots-www.behance.net
file: robots-www.behance.net.txt
sha256: 1a55abe2475b1430444111a3ffceedde40c2782e40c2fda4a42ca95e2e02ba2b
read: full
anchors: ["Disallow: /search/*?*exif_aperture=*", "Disallow: /search/*?*assetsPriceTier=*", "User-agent: cohere-training-data-crawler", "User-agent: Kangaroo Bot", "Disallow: /v3/"]
---
Behance の robots.txt。全部読んだ。冒頭で AI の取得の道具を名指しで並べて全部を禁じ、その中に anthropic-ai・Claude-Web・ClaudeBot が入っている。User-agent * には古い API の道筋と検索の絞り込みの組み合わせを禁じている。

読み取ったこと：Anthropic の名指しで全部を禁じているので、研究の決まりにより取らない（no-automation）。オーナーの挙げた「プロジェクト全体の表現・複数画面の一貫性」の観点は、担当 B が作品の公式の資料と作り手の記事で代えた。
