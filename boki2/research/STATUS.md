# 情報収集の証跡（自動集計）

`node boki2/tools/research-check.js --write` が生成。手で編集しない。

取得記録 1273 行・読了ノート 186 本（うち docs から出典として引かれていない 31 本）

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
| kentei:kubun2027 | 2027年4月施行の出題区分表・改定趣旨・勘定科目表 | 11 | 4 | 7 | 4 | 4 | 4 | 0 | 0 |
| kentei:renketsukaikei | 連結会計の学習連載 | 15 | 15 | 0 | 15 | 15 | 15 | 0 | 0 |
| kentei:genkakeisan | 原価計算の学習連載 | 20 | 20 | 0 | 20 | 20 | 20 | 0 | 0 |
| kentei:sample2 | 2級サンプル問題 | — | 30 | 0 | 30 | 30 | 30 | 0 | 0 |
| kentei:bokizaka | 簿記坂（日商サイトの読み物）のうち2級学習に関わる記事 | — | 5 | 1 | 5 | 5 | 5 | 0 | 0 |
| biznavi:biznavi | 給与計算・期末処理などの実務解説 | — | 8 | 0 | 8 | 8 | 8 | 0 | 0 |
| bokipedia:sets | 2級の練習問題（65）と検定別過去問（44）。詳細ページと問題PDF | 142 | 109 | 33 | 109 | 1 | 0 | 0 | 0 |
| cpa-learning:courses2 | 日商簿記2級ジャンル（genreId 30004）の講座情報とレッスン一覧（公開API） | 9 | 8 | 1 | 8 | 0 | 0 | 0 | 0 |
| cpa-learning:texts2 | 2級講座の教材PDF（教科書・問題集・模擬試験） | — | 14 | 0 | 14 | 5 | 0 | 0 | 0 |
| cpa-learning:column | 簿記・経理のコラム（post-sitemap.xml の全記事：boki 95・keiri 135・technique 9・career 13） | 252 | 252 | 0 | 69 | 0 | 0 | 0 | 0 |
| cpa-learning:videos | 講義動画 | — | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| law:primary | EPISODES.md・scenario.js の法令・制度の記述を照合した一次資料 | — | 76 | 0 | 76 | 76 | 76 | 59 | 0 |
| web:learnsci | 理解されやすい教え方・伝え方の研究（学習科学・認知心理・教育工学・ゲーム学習、〜2026年10月） | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| web:acctedu | 簿記・会計教育の研究と実践報告（国内外） | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| web:boki2content | 簿記2級の教材・講座・アプリ・動画の教え方と見せ方、学習者の声 | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 検索の記録
- なし

## 外部資料にもとづく文書と出典の引用
| 文書 | 引いている読了ノート | 説明 |
|---|---|---|
| docs/UPDATE_PLAN.md | cpa-learning 0本 | 2026-10-18〜19。検索結果の要約と、cpa-learning コラムの見出しだけ（本文未読）から作った計画。これにもとづいて c47「本試験の戦い方」と問題23問を追加した。本文を読んだ読了ノートで裏づけ直すまで未検査 |
| docs/CRAWL.md | cpa-learning 0本・bokipedia 0本 | 取得手順と、見出しの突き合わせ・簿記ペディアの取得状況のメモ |
| docs/EXAM-ANALYSIS.md | kentei 88本 | 日商の講評・連載・サンプル問題の分析 |
| docs/EPISODES.md | law 59本 | 法令・制度の記述（付録C）。2026-10-20 一次資料で照合 |
| docs/analysis/cpa-shobo-text.md | （未作成） | CPA 商簿教科書の分析 |
| docs/analysis/cpa-shobo-mondai.md | （未作成） | CPA 商簿問題集の分析 |
| docs/analysis/cpa-kobo-text.md | （未作成） | CPA 工簿教科書の分析 |
| docs/analysis/cpa-kobo-mondai-moshi.md | （未作成） | CPA 工簿問題集・模試の分析 |
| docs/analysis/bokipedia-a.md | （未作成） | 簿記ペディア前半の分析 |
| docs/analysis/bokipedia-b.md | （未作成） | 簿記ペディア後半の分析 |
| docs/analysis/cpa-courses-column-a.md | （未作成） | CPA 講座とコラム（簿記・テクニック）の分析 |
| docs/analysis/cpa-column-b.md | （未作成） | CPA コラム（経理・キャリア）の分析 |
| docs/analysis/learning-science.md | （未作成） | 理解されやすい教え方の研究の分析 |
| docs/analysis/accounting-education.md | （未作成） | 簿記・会計教育研究の分析 |
| docs/analysis/boki2-presentation.md | （未作成） | 簿記2級コンテンツの教え方・見せ方の分析 |

## 検査結果：エラー 14・注意 70
- ✗ bokipedia:sets: notes/bokipedia/sets/45.md の sha256 が取得記録のどれとも一致しない（別のファイルを読んだか、取得が記録されていない）
- ✗ bokipedia:sets: notes/bokipedia/sets/45.md の anchors が原文に出てこない：クレジット手数料が販売時に判明する場合 / 他人振出小切手は通貨代表証券 / 増改築工事を行った建物 / 商品評価益は計上しない（本文を読まずに書いた疑い）
- ✗ bokipedia:sets: notes/bokipedia/sets/45.md の anchors のうち、一覧やタイトルに出ない・その文書に固有の語が 0 個（3個以上）。タイトルだけで書いた疑い
- ✗ bokipedia:sets: 取得したが読了ノートがない（読んでいない）108 件：46 47 48 49 50 51 52 53 54 55 56 57 …
- ✗ cpa-learning:courses2: 取得したが読了ノートがない（読んでいない）8 件：30003 120005 510005 240002 360010 360017 630033 360012
- ✗ cpa-learning:texts2: 30002 は全部読んだことになっているが、本文を17区間に分けたうち 14 区間（18%付近・24%付近・29%付近・35%付近・41%付近・47%付近・53%付近・59%付近…）から anchors が出ていない
- ✗ cpa-learning:texts2: 180062 は全部読んだことになっているが、本文を11区間に分けたうち 9 区間（18%付近・27%付近・36%付近・45%付近・55%付近・64%付近・73%付近・82%付近…）から anchors が出ていない
- ✗ cpa-learning:texts2: 180063 は全部読んだことになっているが、本文を9区間に分けたうち 5 区間（44%付近・56%付近・67%付近・78%付近・89%付近）から anchors が出ていない
- ✗ cpa-learning:texts2: 取得したが読了ノートがない（読んでいない）9 件：150110 150113 660021 240015 660022 630036 630037 480123 600037
- ✗ cpa-learning:column: 取得したが読了ノートがない（読んでいない）69 件：kanjokamou-utiwakemeisaisyo for-beginners accounting-annual-income annual-income-career-change career-up financial-statements-skill engine different-boki-test degree-of-difficulty cpa-goukaku carrer-plan-bookkeeping carrer-bookkeeping-2 …
- ✗ cpa-learning:column: 未取得 183 件：car-tax tatekaekin book-shiwake kaihi-kanjokamoku syunyuinshi-kanjokamoku zappi-kanjokamoku syohizei-kanjokamoku azukarikin-kanjokamoku yosankanri equipment-kanjokamoku kanjokamoku-highly-used software-kanjokamoku …
- ✗ 分析文書: docs/UPDATE_PLAN.md は cpa-learning の資料にもとづくが、読了ノートを1本も出典に引いていない（未検査の分析）。2026-10-18〜19。検索結果の要約と、cpa-learning コラムの見出しだけ（本文未読）から作った計画。これにもとづいて c47「本試験の戦い方」と問題23問を追加した。本文を読んだ読了ノートで裏づけ直すまで未検査
- ✗ 分析文書: docs/CRAWL.md は cpa-learning の資料にもとづくが、読了ノートを1本も出典に引いていない（未検査の分析）。取得手順と、見出しの突き合わせ・簿記ペディアの取得状況のメモ
- ✗ 分析文書: docs/CRAWL.md は bokipedia の資料にもとづくが、読了ノートを1本も出典に引いていない（未検査の分析）。取得手順と、見出しの突き合わせ・簿記ペディアの取得状況のメモ
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
- △ 分析文書: docs/analysis/cpa-shobo-text.md はまだない（作業中）
- △ 分析文書: docs/analysis/cpa-shobo-mondai.md はまだない（作業中）
- △ 分析文書: docs/analysis/cpa-kobo-text.md はまだない（作業中）
- △ 分析文書: docs/analysis/cpa-kobo-mondai-moshi.md はまだない（作業中）
- △ 分析文書: docs/analysis/bokipedia-a.md はまだない（作業中）
- △ 分析文書: docs/analysis/bokipedia-b.md はまだない（作業中）
- △ 分析文書: docs/analysis/cpa-courses-column-a.md はまだない（作業中）
- △ 分析文書: docs/analysis/cpa-column-b.md はまだない（作業中）
- △ 分析文書: docs/analysis/learning-science.md はまだない（作業中）
- △ 分析文書: docs/analysis/accounting-education.md はまだない（作業中）
- △ 分析文書: docs/analysis/boki2-presentation.md はまだない（作業中）
