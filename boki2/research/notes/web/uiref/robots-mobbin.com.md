---
src: web
coll: uiref
doc: robots-mobbin.com
file: robots-mobbin.com.txt
sha256: 0c74497d88748000986eb16b303124927d5ec9c222e927bc550f5079e39b61bb
read: full
anchors: ["Allow: /llms-full.txt", "Allow: /acceptable-use.md", "Allow: /changelog/*.md", "Allow: /glossary/*.md", "https://mobbin.com/sitemap.xml"]
---
Mobbin の robots.txt。全部読んだ。User-agent * はすべて許し、GPTBot には説明用の md の頁だけを許してほかを禁じる。Anthropic の名指しの組はない。

読み取ったこと：robots.txt の上では取ってよいが、規約（tos-mobbin.com）がスクレイパー・ロボット等による取得を禁じているので、判断は規約の側に従って no-automation にした。robots が許すことと規約が許すことは別、という例として残す。
