# 情報収集の証跡（自動集計）

`node boki2/tools/research-check.js --write` が生成。手で編集しない。

取得記録 1645 行・読了ノート 804 本（うち docs から出典として引かれていない 131 本）

## 利用規約
- 商工会議所の検定試験（日本商工会議所）（kentei）：規約 確認済み・問題なし（2026-10-20）。robots.txt は /wp/wp-admin/ のみ禁止。自動取得を禁じる規約ページは見当たらない。ただしサンプル問題のページに「著作権は日本商工会議所に帰属、無断転載・無断の営利利用を厳禁」と明記されている。原文はリポジトリに入れず、転載しない（分析・数字と設定を変えたオリジナル問題のみ）
- 業務の教科書（biznavi.jp）（biznavi）：規約 確認済み・グレー（判断を記録）（2026-10-20）。https://www.biznavi.jp/terms は個人情報保護方針（第一〜六条）のみで、転載・自動取得・著作権の条項なし。robots.txt は 404。著作物なので原文はリポジトリに入れず転載しない
- 簿記ペディア（株式会社CPA）（bokipedia）：規約 確認済み・グレー（判断を記録）（2026-10-20）。robots.txt なし（404）。規約に自動取得の明文の禁止はない。ただし6条(6)「本来のサービス提供の目的とは異なる目的で利用する行為」、7条「提供目的を超えて利用」の禁止がある。オーナー判断（2026-10-20）：個人の学習設計の分析に限り、原文の転載はせず、数字・設定を変えたオリジナル問題にする。会員ログインはしない。運営会社は cpa-learning.com と同じで、そちらの規約は自動取得を明示的に禁止している点に注意
- CPAラーニング（cpa-learning）：規約 規約上は制限ありだがオーナーが条件付きで許可（判断を記録）（2026-10-20）。利用規約 第4条18号は自動的なダウンロード・複製・保存を禁止、第5条は複製を禁止している。オーナー判断（2026-10-20）：個人利用・非商用で、サイトを見て本人が勉強するのと実態が変わらないため、取得と分析を許可。条件：速さは問わない（5秒以上の間隔）、さぼり・斜め読みは禁止（全文の読了ノート必須）、ログインはしない、原文はリポジトリに入れない・転載しない
- 法令・官公庁・業界団体の一次資料（e-Gov法令、国税庁、法務省、裁判所、厚労省、全銀協、でんさいネット、JPX、金融庁など）（law）：規約 確認済み・問題なし（2026-10-20）。官公庁サイトの多くは公共データ利用規約（PDL1.0）や政府標準利用規約で出典を示せば複製・加工を認める。法令の条文は著作権の対象外（著作権法13条）。業界団体（全銀協・でんさいネット・JPX）は規則類の閲覧のみ・原文はリポジトリに入れない
- 学習科学・会計教育・簿記教材の調査（論文・公的資料・出版社・学習者の声など、サイトを横断）（web）：規約 サイトごとに確認して取得記録に残す。サイトごとに取得前に利用規約・robots.txt を確認し、取得記録の tos 欄（checked・verdict・basis）に残す。verdict が no-automation のサイトは取得しない（オーナーの個別許可がない限り）。論文はオープンアクセス（J-STAGE、ERIC、PMC、arXiv、機関リポジトリ等）のみ。有料・ログインが必要なものは取らない

## 集合ごとの状況
| 集合 | 内容 | 一覧上 | 対象 | 対象外(理由あり) | 取得済 | 読了ノート | 原文で照合済 | 一部読了 | 照合不能 |
|---|---|---|---|---|---|---|---|---|---|
| kentei:kouhyou2 | 2級 出題の意図・講評（PDF） | 30 | 18 | 17 | 18 | 18 | 18 | 0 | 0 |
| kentei:kubun2027 | 2027年4月施行の出題区分表・改定趣旨・勘定科目表。工業簿記・原価計算の区分表は2022年度版（2022_kogen）が2027年度にもそのまま適用される（区分表ページの記載） | 11 | 5 | 7 | 5 | 5 | 5 | 0 | 0 |
| kentei:renketsukaikei | 連結会計の学習連載 | 15 | 15 | 0 | 15 | 15 | 15 | 0 | 0 |
| kentei:genkakeisan | 原価計算の学習連載 | 20 | 20 | 0 | 20 | 20 | 20 | 0 | 0 |
| kentei:sample2 | 2級サンプル問題 | — | 30 | 0 | 30 | 30 | 30 | 0 | 0 |
| kentei:bokizaka | 簿記坂（日商サイトの読み物）のうち2級学習に関わる記事 | — | 5 | 1 | 5 | 5 | 5 | 0 | 0 |
| biznavi:biznavi | 給与計算・期末処理などの実務解説 | — | 8 | 0 | 8 | 8 | 8 | 0 | 0 |
| bokipedia:sets | 2級の練習問題（65）と検定別過去問（44）。詳細ページと問題PDF | 142 | 109 | 33 | 109 | 109 | 109 | 0 | 0 |
| cpa-learning:courses2 | 日商簿記2級ジャンル（genreId 30004）の講座情報とレッスン一覧（公開API） | 9 | 8 | 1 | 8 | 8 | 8 | 0 | 0 |
| cpa-learning:texts2 | 2級講座の教材PDF（教科書・問題集・模擬試験） | — | 14 | 0 | 14 | 14 | 9 | 2 | 0 |
| cpa-learning:column | 簿記・経理のコラム（post-sitemap.xml の全記事：boki 95・keiri 135・technique 9・career 13） | 252 | 252 | 0 | 252 | 252 | 252 | 0 | 0 |
| cpa-learning:videos | 講義動画 | — | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| law:primary | EPISODES.md・scenario.js の法令・制度の記述を照合した一次資料 | — | 76 | 0 | 76 | 76 | 76 | 59 | 0 |
| web:learnsci | 理解されやすい教え方・伝え方の研究（学習科学・認知心理・教育工学・ゲーム学習、〜2026年10月） | — | 37 | 0 | 37 | 37 | 37 | 0 | 0 |
| web:acctedu | 簿記・会計教育の研究と実践報告（国内外） | — | 49 | 0 | 49 | 49 | 49 | 0 | 0 |
| web:boki2content | 簿記2級の教材・講座・アプリ・動画の教え方と見せ方、学習者の声 | — | 33 | 0 | 33 | 33 | 33 | 0 | 0 |
| web:simgames | 既存の会計・財務・経営シミュレーションゲーム（ボードゲーム・研修ゲーム・デジタルゲーム・教育用シミュレーション） | — | 57 | 0 | 57 | 57 | 57 | 0 | 0 |

## 検索の記録
- searches/acctedu.jsonl：検索 21 回、採用したURL 49 件（うち取得済み 49）
- searches/boki2content.jsonl：検索 31 回、採用したURL 33 件（うち取得済み 33）
- searches/learnsci.jsonl：検索 31 回、採用したURL 40 件（うち取得済み 37）
- searches/simgames.jsonl：検索 20 回、採用したURL 36 件（うち取得済み 34）

## 外部資料にもとづく文書と出典の引用
| 文書 | 引いている読了ノート | 説明 |
|---|---|---|
| docs/UPDATE_PLAN.md | cpa-learning 28本 | 2026-10-18〜19 に検索結果の要約とコラムの見出しだけから作った計画。2026-10-20 に読了ノートで主張ごとに検証し、判定（裏づけあり・誤り・未確認）と出典を付けた。c47 と追加23問の検証を含む |
| docs/CRAWL.md | cpa-learning 7本・bokipedia 4本 | 取得の手順（research-fetch.js・research-check.js）と、cpa-learning・簿記ペディアの取得範囲・規約の扱い。2026-10-20 に読了ノートで検証 |
| docs/EXAM-ANALYSIS.md | kentei 88本 | 日商の講評・連載・サンプル問題の分析 |
| docs/EPISODES.md | law 60本 | 法令・制度の記述（付録C）。2026-10-20 一次資料で照合 |
| docs/analysis/cpa-shobo-text.md | cpa-learning 18本 | CPA 商簿教科書の分析 |
| docs/analysis/cpa-shobo-mondai.md | cpa-learning 3本 | CPA 商簿問題集の分析 |
| docs/analysis/cpa-kobo-text.md | cpa-learning 1本 | CPA 工簿教科書の分析 |
| docs/analysis/cpa-kobo-mondai-moshi.md | cpa-learning 4本 | CPA 工簿問題集・模試の分析 |
| docs/analysis/bokipedia-a.md | bokipedia 55本 | 簿記ペディア前半の分析 |
| docs/analysis/bokipedia-b.md | bokipedia 55本 | 簿記ペディア後半の分析 |
| docs/analysis/cpa-courses-column-a.md | cpa-learning 94本 | CPA 講座とコラム（簿記・テクニック）の分析 |
| docs/analysis/cpa-column-b.md | cpa-learning 115本 | CPA コラム（経理・キャリア）の分析 |
| docs/analysis/learning-science.md | web 38本 | 理解されやすい教え方の研究の分析 |
| docs/analysis/accounting-education.md | web 49本 | 簿記・会計教育研究の分析 |
| docs/analysis/boki2-presentation.md | web 33本 | 簿記2級コンテンツの教え方・見せ方の分析 |
| docs/analysis/sim-games.md | web 52本 | 既存の会計・財務シミュレーションゲームの分析と取り入れる要素 |
| docs/DESIGN-REVISION.md | web 62本・kentei 14本・cpa-learning 16本 | 全分析を統合した設計改訂案（Fable、2026-10-20） |

## 検査結果：エラー 0・注意 65
- △ cpa-learning:texts2: 480123 は一部だけ読了（150110との差分箇所（PDF 4・9・11・187・270・329・330ページ）。全330ページを150110とページごとに比べ（文字は pdftotext の全ページ比較、図や枠は40dpiの画像の画素比較）、差分が出た7ページだけを読んだ。それ以外の323ページは150110と同一と判定し、中身は 150110 の章ノートで読んでいる）
- △ cpa-learning:texts2: 600037 は一部だけ読了（全302ページを 180063 とページ単位で機械比較（pdftotext を NFKC・空白除去で正規化）し、差分のあった p.4, 8, 11, 13〜17, 20, 74, 77, 193, 301, 302 を読んだ。さらに全302ページを30dpiの画像で画素比較し、文字の差分がないページに図や枠の差分がないことも確かめた（画素差が出たのは p.8・11・13〜17・193・301・302 で、すべて上の差分ページに含まれる）。その他の288ページは 180063 と文字列が完全に一致したため 180063 の読了ノート（180063#ch01〜ch14, q4, q5）で代える。p.301（奥付）は文字が抽出できず画像でも空白に見えるため読めなかった）
- △ law:primary: nta-sozei-taino-r7 は一部だけ読了（1〜3ページ、7ページ（主要税目別の表））
- △ law:primary: nta-release-index は一部だけ読了（報道発表資料の一覧から滞納状況のリンクのみ）
- △ law:primary: courts-tokyo-min20 は一部だけ読了（「事件の受付」「申立ての費用」の項とリンク）
- △ law:primary: mhlw-tatekae-page は一部だけ読了（制度の概要の段落と実績一覧の見出し）
- △ law:primary: mhlw-chingin-index は一部だけ読了（「4. 賃金支払の保全、その他」の項のみ）
- △ law:primary: mhlw-koyochosei は一部だけ読了（「助成内容」「主な受給要件」の項）
- △ law:primary: mhlw-koyochosei-corona は一部だけ読了（お知らせ・支給対象・助成率の表まで）
- △ law:primary: mhlw-gyomukaizen は一部だけ読了（冒頭と助成上限額の項のみ）
- △ law:primary: zengin-top は一部だけ読了（リンク一覧のみ）
- △ law:primary: zengin-kessai は一部だけ読了（新着情報とリンク一覧のみ）
- △ law:primary: zengin-koukan-rules は一部だけ読了（第4章 取引停止処分（第39〜50条）と目次）
- △ law:primary: densai-top は一部だけ読了（リンク一覧のみ）
- △ law:primary: densai-rules は一部だけ読了（第2条（定義）、第18条、第9章（第46〜51条））
- △ law:primary: jpx-rules-top は一部だけ読了（リンク一覧のみ）
- △ law:primary: jpx-regulations-index は一部だけ読了（リンク一覧のみ）
- △ law:primary: jpx-regulations-ose は一部だけ読了（見出しと説明文のみ）
- △ law:primary: kentei-top は一部だけ読了（新着情報とリンク一覧のみ）
- △ law:primary: kentei-class2 は一部だけ読了（レベルの説明と出題区分表へのリンクのみ）
- △ law:primary: kentei-news は一部だけ読了（お知らせ一覧のタイトルのみ）
- △ law:primary: kentei-2027kubunhyo-fixed は一部だけ読了（注記、第二 諸取引の処理の3（売掛金・買掛金・電子記録債権等）・15（リース）・16（外貨建取引））
- △ law:primary: kentei-2027-kaitei-shushi は一部だけ読了（1〜5ページ（基本的な考え方、改定事項のうちリースの仕訳例まで））
- △ law:primary: kentei-2027-setsumeishiryo は一部だけ読了（手形・リース・級の移行に関する行の検索のみ）
- △ law:primary: kentei-kubun-2022 は一部だけ読了（5（手形）・6（債権の譲渡）・17（リース取引）の項のみ）
- △ law:primary: moj-top は一部だけ読了（リンク一覧のみ）
- △ law:primary: moj-minji は一部だけ読了（新着情報とリンク一覧のみ）
- △ law:primary: moj-saiken は一部だけ読了（更新履歴と改正事項別の資料一覧のみ）
- △ law:primary: fsa-top は一部だけ読了（リンク一覧のみ）
- △ law:primary: egov-naibu-furei-full は一部だけ読了（第10条の2（監査証明を受けることを要しない上場会社等の規模））
- △ law:primary: egov-koueki-20261201-full は一部だけ読了（第五章 罰則（第21条・第22条）と改正情報）
- △ law:primary: egov-minji-hozen は一部だけ読了（第20条・第50条（各条を別ファイルで取得。sha256は第20条））
- △ law:primary: egov-roudou-kijun は一部だけ読了（第20条・第24条・第26条・第120条（sha256は第24条））
- △ law:primary: egov-minpo は一部だけ読了（第137・369・404・412・415・419・446・454・505・653条（sha256は第404条））
- △ law:primary: egov-kaishaho は一部だけ読了（第297・303・305・328・331・339・341・348・349・353・362・364・386・423・429・445・454・458・461・462・463・465・847・915・960・963・976条（sha256は第462条））
- △ law:primary: egov-kaisha-keisan-kisoku は一部だけ読了（第5条・第22条（sha256は第5条））
- △ law:primary: egov-kaishaho-sekou-kisoku は一部だけ読了（第100条）
- △ law:primary: egov-chinkaku-ho は一部だけ読了（第7条）
- △ law:primary: egov-chinkaku-rei は一部だけ読了（第2条・第3条・第4条（sha256は第4条））
- △ law:primary: egov-hasanho は一部だけ読了（第2・15・22・30・31・149・253条（sha256は第15条））
- △ law:primary: egov-minji-saisei は一部だけ読了（第172条の3）
- △ law:primary: egov-minji-shikko は一部だけ読了（第143条・第180条（sha256は第180条））
- △ law:primary: egov-kokuzei-tsusoku は一部だけ読了（第37・46・60・65・66・68・70・74条の9・74条の11・75・77条（sha256は第68条））
- △ law:primary: egov-kokuzei-choshu は一部だけ読了（第39・47・62・68・151・151条の2（sha256は第47条））
- △ law:primary: egov-hojinzei は一部だけ読了（第31・52・57・61条の8・61条の9・74・127・159条（sha256は第127条））
- △ law:primary: egov-hojinzei-rei は一部だけ読了（第122条の4・122条の5・122条の7（sha256は第122条の7））
- △ law:primary: egov-keiho は一部だけ読了（第60条・第62条・第246条（sha256は第246条））
- △ law:primary: egov-kinsho-ho は一部だけ読了（第21条の2・24条の2・24条の4の4・172条の4・193条の2・197条・207条（sha256は第172条の4））
- △ law:primary: egov-koueki-tsuho は一部だけ読了（第11条・第21条・第22条（現行版。sha256は第11条））
- △ law:primary: egov-shokuhin-eisei は一部だけ読了（第55条・第58条（sha256は第58条））
- △ law:primary: egov-torikitekiho は一部だけ読了（第1・2・4・5・6条（sha256は第5条））
- △ law:primary: egov-gaitame-ho は一部だけ読了（第55条）
- △ law:primary: egov-gaitame-rei は一部だけ読了（第18条の4）
- △ law:primary: egov-gaitame-hokoku-shorei は一部だけ読了（第1条）
- △ law:primary: egov-sotoku-ho は一部だけ読了（第61条の4・第94条（sha256は第61条の4））
- △ law:primary: egov-shohizei-ho は一部だけ読了（第42条・第45条（sha256は第45条））
- △ law:primary: egov-zeirishi-ho は一部だけ読了（第36条・第45条（sha256は第45条））
- △ law:primary: egov-tegata-ho は一部だけ読了（第43条・第77条（sha256は第77条））
- △ law:primary: egov-roudou-keiyaku は一部だけ読了（第16条）
- △ law:primary: egov-kashikingyo-ho は一部だけ読了（第21条）
- △ law:primary: egov-servicer-ho は一部だけ読了（第18条）
- △ web:boki2content: lec-topic33066 は取得に失敗した（404）。読んでいないので根拠にしない
- △ web:simgames: panasonic-smg-202405 は取得に失敗した（404）。読んでいないので根拠にしない
- △ 検索: searches/learnsci.jsonl：採用したURL 40 件のうち 3 件に取得記録がない
- △ 検索: searches/simgames.jsonl：採用したURL 36 件のうち 2 件に取得記録がない
