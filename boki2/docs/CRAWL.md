# cpa-learning.com との突き合わせ手順

この開発用クラウド環境は、ネットワークポリシーで cpa-learning.com への接続を遮断している。次のどれかの経路で、公開ページを取得する。

| 方法 | やること | 向いている場合 |
|---|---|---|
| A. 許可リストに追加 | Claude Code on the web のセッションのタイトルバー → 環境メニュー → Edit → Network access の「Allowed domains」に `cpa-learning.com` と `www.cpa-learning.com` を追加（Allow package managers は付けたまま）。新しいセッションで Claude に「クロールして比較して」と頼む | 一番手軽。取得から比較・教材の更新まで、Claude がこのリポジトリ内で続けて行える |
| B. 自分のPCで実行 | `git pull` してリポジトリ直下で `node boki2/tools/crawl.js https://www.cpa-learning.com/`、続けて `node boki2/tools/compare-crawl.js > boki2/crawl/coverage.md`。`boki2/crawl/` をコミットしてプッシュ | 環境の設定を変えたくない場合。Node 18 以上があれば追加インストール不要 |
| C. PC上の Claude に任せる | Claude Desktop、またはリポジトリのフォルダで `claude remote-control` を起動し、B と同じことを頼む | 自分でコマンドを打たずに B をやりたい場合 |

## クローラーの動き（tools/crawl.js）
- robots.txt（User-agent: *）の Disallow と Crawl-delay を守る。sitemap.xml を先に読む
- 開始ホストの外には出ない。URL に boki・簿記・column などを含むページだけをたどる（`--include` で変更可）
- 1回に1リクエスト、既定で1.5秒間隔。429/5xx のときは待ってから再試行する
- ログインやクッキーの送信はしない。会員限定の動画・PDFは取得対象外（公開ページの見出しと本文だけ）
- PDF はダウンロードせず、リンクだけを `summary.json` に記録する
- 出力：`boki2/crawl/pages.jsonl`（1行1ページ：URL・タイトル・見出し・本文）と `summary.json`

## 比較（tools/compare-crawl.js）
- サイトの見出しごとに、漢字・カタカナの語が教材（レッスン・問題・解説・勘定科目）にどれだけ出てくるかを測る
- 一致率の低い見出しを「不足の可能性」として一覧にする。あくまで目安なので、最後は人か Claude が該当ページを読んで判断する
- 実行前に、サイトの利用規約でクロールや転載の扱いを確認すること。教材に取り込むのは「論点の有無」の判断だけで、文章や問題をそのまま写すことはしない
