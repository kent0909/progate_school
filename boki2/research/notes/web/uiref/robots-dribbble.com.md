---
src: web
coll: uiref
doc: robots-dribbble.com
file: robots-dribbble.com.txt
sha256: a1a6a1e8019095c68d4289e4daea63c55f62c6923c644623149f0484bdf8ca50
read: full
anchors: ["Disallow: /*/click?type=*$", "Disallow: /colors/for_404.json", "Disallow: /jobs/*/apply_now", "Disallow: /shots/*/colors.aco", "sitemap: https://dribbble.com/sitemap.xml"]
---
Dribbble の robots.txt。全部読んだ。User-agent * について、アカウント・管理・メッセージ・作品の編集やコメント・日ごとの一覧などの道筋を禁じ、作品の頁そのものは禁じていない。Anthropic の名指しの組はない。

読み取ったこと：robots の上では作品の頁は取れるが、利用規約（tos-dribbble.com）がスクレイピングとロボットによる取得を禁じているので、判断は規約に従い no-automation にした。
