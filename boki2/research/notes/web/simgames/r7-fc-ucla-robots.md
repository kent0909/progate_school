---
src: web
coll: simgames
doc: r7-fc-ucla-robots
file: r7-fc-ucla-robots.txt
sha256: aa270a71da13ed870c9bcff3c8f0e3d6db2d43c230824f75076101e8f3d23263
read: full
anchors: ["User-agent: *", "Allow: /core/*.css$", "Disallow: /admin/", "Disallow: /index.php/user/login", "User-agent: anthropic-ai", "User-agent: Claude-Web", "User-agent: cohere-ai"]
---
UCLA Anderson のサイトの robots.txt の全文（97行）。* の組は管理画面・検索・ログインなどを禁じるだけで、教員の頁（/faculty/）は禁じていない。ただし後半の名指しの組で、anthropic-ai・Claude-Web・Google-Extended・CCBot・cohere-ai などの AI の取得者を全面禁止にしている。この調べ物は Claude が動かしているので名指しの禁止に従い、Cooper & Nakanishi の MCI の本の PDF は取らないと判定を直した（site-policy.json の www.anderson.ucla.edu を no-automation に。直す前の2回の取得は状態0で何も取れていない）。
