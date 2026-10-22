# オーナーに開いて保存してほしいページ

自動取得が規約で禁止されているページ。research-fetch が自動で追記する（調べる側は止まらずに代わりの資料で続ける）。
保存のしかたと取り込み方は research/README.md の「オーナーが開いた資料」。急ぎではない。まとめて都合のよいときに。

| 追加日 | 取得元/集合/文書 | URL | 理由 | 状態 |
|---|---|---|---|---|
| 2026-10-22 | web/simgames/r4-cinc-apple-appstore | App Store で「Coffee Inc 2」を検索した製品ページ（説明文・アップデート履歴を開いた状態） | Apple の規約が自動取得を禁止 | 未 |
| 2026-10-22 | web/simgames/r4-cinc-substack-blog | https://sidelabsblog.substack.com/archive （開発者ブログの記事一覧。Coffee Inc 2 の更新・設計の記事を数本） | Substack の規約が自動取得を禁止 | 未 |
| 2026-10-22 | web/simgames/r4-cinc-sidelabs-home | https://www.sidelabs.com/ （開発元サイトの Coffee Inc 2 の紹介） | 開発元の規約が自動取得を禁止 | 未 |
| 2026-10-22 | web/simgames/r5-cinc-steam-search | https://store.steampowered.com/search/?term=Coffee+Inc+2 | 規約で自動取得が禁止のサイト（Steam Subscriber Agreement 4.C Automation が scripts・bots 等による Steam の Content and Services との一切のやり取りを禁止（ledger r5-cinc-tos-steam-ssa）。Coffee Inc 2 の Steam 版の有無の確認だけを依頼） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-steamcommunity | https://steamcommunity.com/search/groups/?text=Coffee+Inc+2 | 規約で自動取得が禁止のサイト（Steam Subscriber Agreement 4.C Automation（steamcommunity.com も Steam の Services。ledger r5-cinc-tos-steam-ssa）） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-reddit | https://www.reddit.com/search/?q=%22Coffee+Inc+2%22 | 規約で自動取得が禁止のサイト（Reddit User Agreement が書面の同意のないスクレイピングを禁止し、robots.txt は User-agent * に Disallow /（ledger r5-cinc-tos-reddit・r5-cinc-robots-www-reddit-com）。攻略スレッド（競合・買収・上場・株価の観察）を数本） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-rawg | https://rawg.io/games/coffee-inc-2 | 規約で自動取得が禁止のサイト（RAWG Terms of Use が robot・spider・scraper 等による自動アクセスを明示的な許可なしに禁止（ledger r5-cinc-tos-rawg）） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-taptap | https://www.taptap.io/app/227582 | 規約で自動取得が禁止のサイト（taptap.io の robots.txt が User-agent ClaudeBot に Disallow /（本ツールは Claude が動かすため従う。ledger r5-cinc-robots-www-taptap-io）。説明文とプレイヤーの評価） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-toyokeizai | https://toyokeizai.net/articles/-/757372 | 規約で自動取得が禁止のサイト（東洋経済オンライン利用規約 第3条(5) がロボット・クローラー等の自動化された手段による収集・抽出を禁止、(6)(7) が AI による要約等を禁止（ledger r5-cinc-tos-toyokeizai）。開発者（日本人1人の開発）を扱った記事） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-appfollow-us | https://apps.appfollow.io/ios/coffee-inc-2/1573482724?country=us | 規約で自動取得が禁止のサイト（AppFollow Terms（https://appfollow.io/terms）4.4 がサービスからのスクレイピング・収集を書面の同意なしに禁止（商用の文脈だが明示の禁止として扱う）、4.2 が機械学習への利用も禁止（ledger r5-cinc-tos-appfollow-terms）。米国 App Store の口コミと開発者の返信の一覧） | 未 |
| 2026-10-22 | web/simgames/r5-fv-hg101-gamedevtycoon | https://www.hardcoregaming101.net/game-dev-tycoon/ | 規約で自動取得が禁止のサイト（www.hardcoregaming101.net/robots.txt が ClaudeBot・anthropic-ai などを名指しで Disallow:/（明示の拒否）） | 未 |
| 2026-10-22 | web/simgames/r5-fv-giantbomb-minimetro | https://giantbomb.com/users/3929/articles/interview-peter-curry-co-creator-of-mini-metro | 規約で自動取得が禁止のサイト（giantbomb.com/robots.txt が ClaudeBot を名指しで Disallow:/、AI 入力の利用を留保（明示の拒否）） | 未 |
| 2026-10-22 | web/simgames/r5-fv-shacknews-offworld | https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space | 規約で自動取得が禁止のサイト（www.shacknews.com/robots.txt が ClaudeBot・anthropic-ai を名指しで拒否（明示の拒否）） | 未 |
| 2026-10-22 | web/simgames/r5-fv-pcgamesn-twopoint-diary | https://pcgamesn.com/two-point-hospital/two-point-hospital-personalities-dev-diary | 規約で自動取得が禁止のサイト（pcgamesn.com/robots.txt にスクレイピング・テキストマイニング・AI 利用の権利留保の明記と AI クローラの拒否） | 未 |
| 2026-10-22 | web/simgames/r5-fv-caniplaythat-twopoint | https://caniplaythat.com/2019/02/24/deaf-game-review-two-point-hospital/ | 規約で自動取得が禁止のサイト（caniplaythat.com/robots.txt が anthropic-ai などを名指しで拒否） | 未 |
| 2026-10-22 | web/simgames/r5-fv-strategywiki-lemonadetycoon | https://strategywiki.org/wiki/Lemonade_Tycoon | 規約で自動取得が禁止のサイト（strategywiki.org/robots.txt が ClaudeBot を名指しで Disallow:/） | 未 |
| 2026-10-22 | web/simgames/r5-fv-indieorama-minimetro | https://www.indieorama.com/mini-metro-and-robert-curry-the-minimalism-was-one-of-the-things-that-made-the-game-hard-to-make | 規約で自動取得が禁止のサイト（www.indieorama.com/robots.txt の Content-Signal で AI 入力（ai-input）の利用を明示的に留保） | 未 |
| 2026-10-22 | web/simgames/r6-sd-steam-reviews-bigambitions | https://store.steampowered.com/appreviews/1331550?json=1&filter=all&language=all&num_per_page=100 | 規約で自動取得が禁止のサイト（Steam Subscriber Agreement 4.C Automation が scripts・bots 等による Steam の Content and Services との一切のやり取りを禁止（ledger r5-cinc-tos-steam-ssa）。Coffee Inc 2 の Steam 版の有無の確認だけを依頼） | 未 |
| 2026-10-22 | web/simgames/r5-cinc-owner-screens | （App Store の Coffee Inc 2 の製品ページ、またはゲームを遊んでいる端末の画面） | Coffee Inc 2 の画面写真8種：①都市の地図（区画の印と自社・ライバルの店が見える状態）②店の画面（内装・店員）③週の業績（締めの数字が回る画面）④新聞⑤経理部の三表⑥投資銀行（株・上場）⑦タイトル画面⑧開始時のブランドを作る画面。BIZ-COFFEEINC2 9章の「絵の質」を言葉ではなく写真で確かめるため。App Store は規約で自動取得禁止。スクリーンショットで十分 | 未 |
| 2026-10-22 | web/simgames/r6-rp-rps-hades-myths | https://www.rockpapershotgun.com/2020/02/12/how-hades-plays-with-greek-myths/ | 規約で自動取得が禁止のサイト（rockpapershotgun.com の robots.txt 冒頭に Ziff Davis が robot・crawler 等での自動取得を書面の許可なく禁止と明記（2026-10-22確認）） | 未 |
| 2026-10-22 | web/ramen/（補填） | 東洋経済オンラインの「夏の間は看板のみそラーメンを休止し、つけ麺専門営業に切り替える」店の記事（検索で見つかった記事。URL は補填の担当の検索記録 research/searches/ にある） | 東洋経済の規約が自動取得を禁止 | 未 |
| 2026-10-22 | web/ramen/r8-rmn-ndl-kojinsoshin | 国立国会図書館デジタルコレクションの個人送信で、岡田哲『ラーメンの誕生』（ちくま新書、2002年）・関満博ほか『ご当地ラーメンの地域ブランド戦略』（新評論、2009年）が読めるかを確かめ、読めれば「はじめに」と各章の冒頭を開いて保存 | 個人送信は利用者の登録（本人の本人確認）が要り、この環境からは使えない。BIZ-RAMEN の受け入れの基準2（本の本文）のため | 未 |
| 2026-10-22 | web/ramen/r8-rmn-cinii-irdb-search | CiNii Research（https://cir.nii.ac.jp/）と IRDB（https://irdb.nii.ac.jp/）で「ラーメン 自由記述」「ラーメン店 顧客」「ラーメン 原価」を検索した結果の頁（論文の題と機関リポジトリへのリンク） | 両サイトの robots.txt が検索の頁を禁止（CiNii は /crid/ 等のみ許可、IRDB は Disallow: /）。BIZ-RAMEN の基準4・7 の窓口 | 未 |
| 2026-10-22 | web/ramen/r8-rmn-toyokeizai-shio | 東洋経済オンラインの塩ラーメンの原価率50%の店の記事（「無冠 阿佐ヶ谷」、牡蠣塩ラーメン税込800円）。検索記録は research/searches/ramen.jsonl | 東洋経済の規約が自動取得を禁止。BIZ-RAMEN の基準7（塩の原価） | 未 |
