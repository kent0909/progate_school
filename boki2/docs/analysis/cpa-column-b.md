# CPAラーニング：コラム（経理・キャリア）の分析

担当：CPAラーニングのコラムのうち、URL が /column/keiri/ と /column/career/ の148本（一覧は column/_index.xml）。全部読み、1記事1本の読了ノートを `boki2/research/notes/cpa-learning/column/` に置いた（簿記・テクニックの記事は [cpa-courses-column-a.md](cpa-courses-column-a.md) の担当）。URL が日本語の記事（振込手数料・為替手形2本・ホテルの領収書・保険料の5本）はノートはあるが、引用記号の書式に合わないので本文では題名で示す。

一言でいうと、この148本は「2級の論点の解説」としては誤りが多く出典に使えない。一方で、**経理の現場で起きる場面**（書類・締切・よくあるミス・その結果）の材料としては豊富で、ゲームのイベントの骨組みと「現実では」画面の1行に使える。キャリア記事は、2級を「入場券」として語り、中身（2級で何ができるようになるか）を語らない。そこを埋めるのがゲームの役目になる。

読めなかった部分（画像だけの表・図）：年収の比較表（[[cpa-learning:column:annual-income-career-change]]、[[cpa-learning:column:accounting-annual-income]]）、経理業務の分類図（[[cpa-learning:column:carrer-plan-bookkeeping]]）、3級と2級の比較表（[[cpa-learning:column:carrer-bookkeeping-2]]）、業務一覧と1日の流れ（[[cpa-learning:column:qualification-about-accounting]]）、用語・保存期間の表など本文の中心部分（[[cpa-learning:column:documents-accounting]]）、売掛金管理の図（[[cpa-learning:column:accounts-receivable-and-accounts-payable]]）、請求書の記入例（[[cpa-learning:column:accounting04]]）、経費精算の比較表とフロー図（[[cpa-learning:column:expense-settlement-system]]）、電帳法改正の表（[[cpa-learning:column:electric-book-storage-act]]）、インボイスの交付免除の表（[[cpa-learning:column:invoice-about]]）、所得税の申告要否表（[[cpa-learning:column:youtube]]、[[cpa-learning:column:food-delivery]]）、控除の計算表（[[cpa-learning:column:tax-advantage]]）。いずれも本文の文字から読める範囲で読んだ。

---

## 1. 構成と教え方

### 1.1 記事群の中身（おおよその本数）

| 群 | 本数 | 代表例 | 性格 |
|---|---|---|---|
| 勘定科目もの（「○○の勘定科目は？」） | 約27 | 交通費・立替金・預り金・会費・収入印紙・ソフトウェア・駐車場代・社用車・送料・保険料 | 検索で来る読者向け。科目の候補を並べ、仕訳例を1〜5個 |
| 領収書・請求書などの証憑 | 約26 | 宛名・但し書き・上様・再発行・日付・割印（消印）・受領書との違い・保管期間 | 実務の細則。記事どうしで記述が食い違う |
| 税制・法令 | 約21 | インボイス6本・電子帳簿保存法3本・消費税・法人税の節税・税務調査・所得税の確定申告 | 時点が古いものが多い（2021〜2023年） |
| 経理業務の解説（連載） | 約18 | 新人経理向け連載（日次・月次・年次）、月次決算、上場企業の経理、経理と他部署 | 実務家の寄稿があり、最も質が高い |
| 資金・財務・管理会計 | 約14 | 資金繰り3本、予算管理3本、損益分岐点、意思決定会計、M&A、IFRS | 概念の解説。資金繰りの記事に式の誤りがある |
| キャリア・資格 | 約19 | 2級と年収、キャリアプラン、会計士・税理士、経理に必要な技能、法人導入の事例 | 年収と求人の数字で動機づける |
| 帳簿・簿記の基礎 | 約11 | 単式と複式、帳簿の種類、仕訳帳、試算表、発生主義、企業会計原則 | 3級の内容。基本的な誤りがある |
| 手形 | 7 | 為替手形・約束手形・手形割引 | 為替手形は現行2級の範囲外。2027年度は手形全体が外れる |
| システム・その他 | 5 | ERP・CRM・セミナー紹介・農業簿記2本 | 会計の内容は薄い |

### 1.2 記事の型

- **SEO 記事の型**が大半：冒頭で読者の疑問を代弁→定義→種類・方法→注意点→まとめ→自社講座の宣伝欄（全記事にほぼ同じ文面の宣伝欄が入る）。勘定科目ものは「この科目が一般的、ほかに○○でも可、継続して同じ科目を使え」で終わることが多い（[[cpa-learning:column:gas-station]]、[[cpa-learning:column:juminhyo]]、[[cpa-learning:column:copy-kanjokamoku]]）。
- **場面で分ける書き方**がよい記事もある。送料を「売るときの送料・買うときの送料・材料の送料・書類の送料・固定資産の送料」と、生じた場面で科目が変わることを示す（[[cpa-learning:column:hassohi-kanjokamoku]]）。本の購入を「読む人と目的」で新聞図書費・研修費・福利厚生費・減価償却資産に分ける（[[cpa-learning:column:book-shiwake]]）。収入印紙を「すぐ使うか保管するか」で租税公課と貯蔵品に分ける（[[cpa-learning:column:syunyuinshi-kanjokamoku]]）。PEDAGOGY の「同じお金でも目的と時間で科目が変わる」の素材になる。
- **実務家の連載**（上場企業の経理部長・公認会計士の寄稿）は、手順と順序を示すのが特長：
  - 年次決算は「まず数えて照合し（現金・預金・在庫・固定資産・債権債務）、次に評価し（時価・簿価切下げ・税効果）、最後に税金と決算書」 [[cpa-learning:column:beginner-keiri]]。
  - 月次決算の7段（残高確認→月次棚卸→仮勘定の整理→経過勘定→引当金・償却の月割→試算表→業績報告）は年次の決算整理と同じ並び [[cpa-learning:column:monthly-closing-accelerate]]。
  - 月次の概算計上は翌月に洗い替えないと二重計上になる [[cpa-learning:column:monthly-settlement]]。
  - 経理は購買・製造・営業・企画開発・経営企画のすべてと接している（運転資本・標準原価・収益認識・研究開発費・M&A） [[cpa-learning:column:relationship]]。
- **困りごとから入る記事**：大口の売上が増えると仕入の支払いが回収より先に来て資金が足りなくなる（[[cpa-learning:column:shikinguri]]）、天引きした税金は会社のお金ではない（[[cpa-learning:column:azukarikin-kanjokamoku]]）、税抜方式なら期中から預かった消費税が見える（[[cpa-learning:column:syohizei-kanjokamoku]]）。いずれも PEDAGOGY の4拍の「困りごと」に使える。
- **利害関係者の対立から説明する記事**：配当を増やせば銀行が心配し、経営者報酬を増やせば税収が減る、それを調整するのが財務会計 [[cpa-learning:column:about-financial-accounting]]。株主が帳簿の閲覧を請求する目的（取締役の不正の調査・代表訴訟・解任） [[cpa-learning:column:kaikeityobo-seikyuken]]。EPISODES の人物配置（佐藤さん・田中さん・岩田さん・社長）と同じ構図。

### 1.3 信頼度：誤りの多さ

論点の解説としては誤りが多い。主なもの（数字・制度・仕訳）：

- **仕訳・計算の誤り**
  - 仮払金の精算例で、本文の使用額・返金額と仕訳の金額・向きが合わない [[cpa-learning:column:accounting03]]。
  - 自己株式の処分差損で資本金を減らすとしている（その他資本剰余金の減少が正しい） [[cpa-learning:column:dif-soritsu-kaigyo]]。
  - 資金繰り表の営業収支を「売上総利益−販管費」と利益の式で書き、財務収支がプラスだと経営悪化と書く [[cpa-learning:column:shikinguri-akka]]。
  - 簡易課税の納税額の式を「売上の消費税×みなし仕入率」と書く（控除額であって納付額ではない） [[cpa-learning:column:kanikazei-seido]]。
  - 掛仕入の相手科目を未払金にしている [[cpa-learning:column:difference-between-fukushiki-and-tanshiki]]。コピー機の購入を「購入日に費用を計上」と書きながら仕訳は備品 [[cpa-learning:column:hasseisyugi-genkinsyugi-jitugensyugi]]。
  - 営業利益を「最終的な利益」と呼ぶ [[cpa-learning:column:keihisakugen-gutairei]]。純資産を「現金」のように説明する [[cpa-learning:column:about-corporate-finance]]。
- **基準・制度の誤り・古さ**
  - 売上の計上基準に回収基準を選択肢として並べる（収益認識基準以前の説明） [[cpa-learning:column:accounts-receivable-and-accounts-payable]]。1年契約のサービスの期間按分を「実現主義」と呼ぶ [[cpa-learning:column:hasseisyugi-genkinsyugi-jitugensyugi]]。
  - 低価法の比較対象を「時価」、科目を「棚卸評価損」とし、後入先出法を比較に出す [[cpa-learning:column:evaluation-tanaoroshi]]。
  - 継続性の原則とゴーイング・コンサーンを混同 [[cpa-learning:column:copy-kanjokamoku]]。確定決算主義を申告納税制度の意味で使う [[cpa-learning:column:fukushikiboki-kakikata]]。
  - 社用車・サブスクの説明が旧リース基準（2027年度の2級は使用権資産モデル） [[cpa-learning:column:cars-keihi]]、[[cpa-learning:column:subcription]]、[[cpa-learning:column:car-tax]]。
  - 電子帳簿保存法で「紙の保存が認められなくなる」「作成・受領した領収書は電子保存が義務」と誇張（義務化は電子取引のデータ） [[cpa-learning:column:keiri-effective]]、[[cpa-learning:column:ryousyuusyo-hokankikan]]。
  - 印紙税の境目（5万円「以上」か「超」か）が記事ごと、記事内でも揺れる [[cpa-learning:column:difference-seikyuusyo-ryousyuusyo]]、[[cpa-learning:column:receipt-ryosyusyo]]。印紙がないと領収書が「無効」と書く記事もある（実際は過怠税の対象になるだけ） [[cpa-learning:column:difference-receipt-ryousyuusyo]]、[[cpa-learning:column:ginkoufurikomi-ryousyuusyo]]。
  - 消印の正式名を「割印」とし、消印漏れにも3倍の過怠税がかかるように読める [[cpa-learning:column:wariin]]。
- **記事どうし・記事内の食い違い**
  - 民法486条を改正前の文言で引く記事 [[cpa-learning:column:ryousyuusyo-saihakkou]] と改正後で引く記事 [[cpa-learning:column:ginkoufurikomi-ryousyuusyo]]。
  - 会計士の実務経験を2年とする記事 [[cpa-learning:column:certified-public-accountant]] と3年とする記事 [[cpa-learning:column:difference-between-accountants]]。前者は簿記検定の合格を「80点以上」と書く（日商は70%）。
  - レシートで精算できる場合が「ほとんど」と本文で書き、まとめでは「通常は認めない」と書く [[cpa-learning:column:difference-receipt-ryousyuusyo]]。宿泊証明書が領収書の代わりになる・ならないの両方を書く記事（ホテルの領収書の記事）。

結論：**仕訳の形・制度の細目はこれらの記事に頼らない**。使うのは「どんな場面で、どの書類が、いつまでに必要で、間違えると何が起きるか」という現場の手触りと、記事自身の誤り（学習者がつまずく形の実例）。制度の数字は一次情報（法令・国税庁）で確かめる。

### 1.4 キャリア記事の語り口（学習者の動機）

- **2級は入場券**：求人の「2級以上」という条件、資格手当（月数千円）、勉強時間に対する年収差を「費用対効果」として示す（[[cpa-learning:column:annual-income-career-change]]、[[cpa-learning:column:career-up]]）。ただし年収を決めるのは実務経験の中身（決算を締める・監査対応・税務・予算と原価の管理）と、どの会社にいるか、と同時に言う。
- **書く段階から読む段階へ**：3級は帳簿の書き方、2級は書いた帳簿を読み経営に返す段階、という位置づけ（[[cpa-learning:column:carrer-bookkeeping-2]]）。日次は資格がなくてもできるが、月次から簿記で経営が見えてくる（[[cpa-learning:column:qualification-about-accounting]]）。
- **キャリアの段**：アシスタント（伝票入力）→日次〜月次（現預金・売掛買掛）→月次決算（給与・試算表・棚卸表。1人で月次を締められて3年）→年次決算・連結・税務（[[cpa-learning:column:carrer-plan-bookkeeping]]）。新人経理の連載も同じ並び（[[cpa-learning:column:beginner-keiri-2]]）。
- **高年収は管理会計**：予算を組み、事業・商品で業績を分解し先行指標を見る人材が希少。「経営者の言うとおりに帳簿を付けることではない」と先に否定してから説明する（[[cpa-learning:column:accounting-annual-income]]）。
- **上場企業ならではの経理**：会計基準どおりの決算（時価評価・減損・税効果・連結）と開示。中小企業は税法の基準で済ませることが多い、と率直（[[cpa-learning:column:listed-operations]]）。2級の後半（税効果・連結・有価証券の評価）の動機づけ。
- **理解の喜び**：簿記を学ぶと仕事の覚えが速くなり、わからなかった仕事がわかって楽しくなる（[[cpa-learning:column:keiri-skill]]）。会社が新卒の立ち上がりの差を埋めるために学習を組織で支え、「経理の言うことなら間違いない」と言われる部門を目指す（[[cpa-learning:column:case-nipponham-accounting-education]]）。
- **上位資格への階段**：2級→1級→税理士（簿記論・財務諸表論）・会計士（[[cpa-learning:column:certified-public-accountant]]、[[cpa-learning:column:difference-between-accountants]]、[[cpa-learning:column:what-do-accountants-do]]）。会計士の独立の記事は年収の数字が中心（[[cpa-learning:column:cpa]]）。

どの記事も「2級で具体的に何ができるようになるか」はほとんど書かない。年収・求人という外からの動機で語る。ゲームは逆に、仕事の手触り（この判断は現実の経理の○○の仕事）で語る（PEDAGOGY：数の報酬を使わない）。

---

## 2. 論点の網羅（scope.js の項目ごと）

経理・キャリアのコラムは論点の解説ではないので、2級の論点との対応は「その論点が現場のどこに出るか」として整理する。

### 土台（b-xxx）

- **b-je・b-tb**：単式と複式（[[cpa-learning:column:difference-tanshiki-fukushiki]]、[[cpa-learning:column:fukushikiboki-kakikata]]）、仕訳帳（[[cpa-learning:column:siwaketyo-kinyu]]）、試算表は融資の際にも提出を求められる（[[cpa-learning:column:shisanhyo-reason]]）、帳簿の種類と記帳ルール（[[cpa-learning:column:kinds-of-kaikeityobo]]、[[cpa-learning:column:the-account-book]]）。
- **b-credit**：売掛金台帳と管理表、消込み、入金がないときの手順（[[cpa-learning:column:accounts-receivable-and-accounts-payable]]）。請求書と領収書と受領書の流れ（[[cpa-learning:column:difference-seikyuusyo-ryousyuusyo]]、[[cpa-learning:column:difference-juryousyo-ryousyuusyo]]）。
- **b-mibarai**：買掛金と未払金を内訳書の科目欄で書き分ける（[[cpa-learning:column:kanjokamou-utiwakemeisaisyo]]）。
- **b-expense**：交通費・立替金・預り金・給料の天引き（[[cpa-learning:column:kotsuhi]]、[[cpa-learning:column:tatekaekin]]、[[cpa-learning:column:azukarikin-kanjokamoku]]、[[cpa-learning:column:kyuryo]]）。経費精算の流れと仮払金（[[cpa-learning:column:keihiseisan]]、[[cpa-learning:column:accounting03]]）。
- **b-accrual**：発生主義と現金主義（[[cpa-learning:column:hasseisyugi-genkinsyugi-jitugensyugi]]）、資金繰り表（利益と現金のずれ）（[[cpa-learning:column:shikingurihyo]]）、領収書の日付（入金日）と売上の日（引渡日）は別（[[cpa-learning:column:day-of-ryousyuusyo]]）。
- **b-loan**：融資と出資の違い（[[cpa-learning:column:shikinguri]]、[[cpa-learning:column:about-corporate-finance]]）。

### 商業（s-xxx）

| scope ID | 現場での出方 | 主な記事 |
|---|---|---|
| s-stock・s-keisu | 設立前の発起人口座、申込証拠金→払込期日、増資・減資、欠損填補 | [[cpa-learning:column:dif-soritsu-kaigyo]] |
| s-dividend | 配当は債権者保護の問題（財務会計の利害調整） | [[cpa-learning:column:about-financial-accounting]] |
| s-cogs・s-genmo | 棚卸の方法と時期、数量と単価の2軸の誤り、評価方法と評価損（洗替・切放） | [[cpa-learning:column:purpose-of-tanaoroshi]]、[[cpa-learning:column:evaluation-tanaoroshi]] |
| s-revenue・s-service | 出荷・検収の証憑、受領書の日付、営業が持ってくる契約内容 | [[cpa-learning:column:difference-juryousyo-ryousyuusyo]]、[[cpa-learning:column:relationship]] |
| s-shohizei | 税込・税抜方式、中間納付、インボイス（6本）、簡易課税 | [[cpa-learning:column:syohizei-kanjokamoku]]、[[cpa-learning:column:invoice-issuing]]、[[cpa-learning:column:invoice-positive-negative]]、[[cpa-learning:column:kanikazei-seido]] |
| s-hojinzei・s-kazei | 申告期限（2か月）、節税と脱税の境目（事実と証拠）、損金不算入（加算税・延滞税）、税務調査 | [[cpa-learning:column:hojinzei-setsuzei]]、[[cpa-learning:column:about-zeimutyosa]]、[[cpa-learning:column:car-tax]] |
| s-bankrec | 現金出納と預金の照合、振込明細 | [[cpa-learning:column:accounting02]]、[[cpa-learning:column:ginkoufurikomi-ryousyuusyo]] |
| s-tegata（out） | 不渡り2回で取引停止、印紙税、手形割引、紙の手形の廃止 | [[cpa-learning:column:difference-tegata-kogitte]]、[[cpa-learning:column:merit-demerit-tegatawaribiki]] |
| s-denshi（chg） | 手形の代わりとして紹介される程度。クレジット払いの領収書・手数料 | [[cpa-learning:column:credit-ryousyuusyo]]、[[cpa-learning:column:tesuryo]] |
| s-factoring（new） | 直接の記事なし。運転資本の改善策として触れる程度 | [[cpa-learning:column:relationship]] |
| s-allow・s-kashidaore | 督促→内容証明→回収不能の判断の前段 | [[cpa-learning:column:accounts-receivable-and-accounts-payable]] |
| s-cost・s-capex・s-dep | 10万円の境（消耗品費と備品）、ソフトウェア、社用車の減価償却、固定資産台帳と償却資産申告 | [[cpa-learning:column:equipment-kanjokamoku]]、[[cpa-learning:column:software-kanjokamoku]]、[[cpa-learning:column:cars-keihi]]、[[cpa-learning:column:carrer-plan-bookkeeping]] |
| s-fire | 保険料と保険金の仕訳（記事は保険金を全額雑収入とし、2級の未決算→保険差益／火災損失と違う） | 保険料の勘定科目の記事 |
| s-lease（chg） | 旧基準のリース料処理のみ | [[cpa-learning:column:subcription]]、[[cpa-learning:column:cars-keihi]] |
| s-mukei・s-rd | ソフトウェア（会計と税務の混在）、研究開発費（日本基準は費用、IFRS は条件付き資産化） | [[cpa-learning:column:software-kanjokamoku]]、[[cpa-learning:column:relationship]] |
| s-keika | 前払費用（サブスク・保険の数年分）、月次の概算計上と洗替え | [[cpa-learning:column:subcription]]、[[cpa-learning:column:monthly-settlement]] |
| s-seisanhyo・s-fs | 決算整理の手順、決算書の一覧と期限、段階利益 | [[cpa-learning:column:beginner-keiri]]、[[cpa-learning:column:information-for-profit]] |
| s-zeikoka | 上場企業の決算で必要になる、税務会計と財務会計の違い | [[cpa-learning:column:listed-operations]]、[[cpa-learning:column:about-zeimukaikei]] |
| s-secval・s-sonota | 有価証券の内訳書は保有区分ごと、売買目的は評価前後の両方 | [[cpa-learning:column:kanjokamou-utiwakemeisaisyo]] |
| s-merger・s-renketsu1/2 | M&A の流れとデューデリジェンス、IFRS の会計方針の統一、ERP の一元管理 | [[cpa-learning:column:about-ma]]、[[cpa-learning:column:merit-ifrs]]、[[cpa-learning:column:about-erp]] |
| s-fx | 輸入の流れ（船積→保税→輸入申告と納税→引取り）、関税と輸入消費税 | [[cpa-learning:column:kanzei-kaikeishori]] |

### 工業（k-xxx）

- **k-romu**：給与計算・残業代・勤怠（[[cpa-learning:column:accounting5]]、[[cpa-learning:column:accounting6]]）。
- **k-keihi**：ガソリン代は事業内容と重要性で科目を選ぶ（[[cpa-learning:column:gas-station]]）。
- **k-zairyo**：材料の送料は材料費（[[cpa-learning:column:hassohi-kanjokamoku]]）、払出単価（先入先出・移動平均）は商品有高帳と同じ形（[[cpa-learning:column:kinds-of-kaikeityobo]]）。
- **k-hyojun・k-yotei**：予算と実績の差異、部門ごとの責任（[[cpa-learning:column:yosankanri]]、[[cpa-learning:column:information-for-yojitsukanri]]）、標準原価の材料（予定生産量・作業時間・償却費）を製造部門が持つ（[[cpa-learning:column:relationship]]）。
- **k-cvp・k-chokusetsu**：損益分岐点・限界利益・安全余裕率（[[cpa-learning:column:about-sonekibunkiten-2]]）、意思決定会計の差額と埋没原価（2級の範囲外。[[cpa-learning:column:isikettei-kaikei]]）。

### scope.js に無い、または薄いもの（実務では頻出）

- **預り金と納付期限**（源泉所得税は翌月10日、社会保険料は翌月末、遅れると加算税・延滞税）、**年末調整**（[[cpa-learning:column:valuable]]）：3級の預り金の延長だが、資金繰りの罠として強い。
- **印紙税・過怠税・消印**、**証憑の要件**（宛名・日付・但し書き、再発行、受取証書の交付請求）：2級の論点ではないが、型③（ありがちな誤り）の小問の宝庫。
- **勘定科目内訳明細書**：税務署が「役員・関係会社との貸し借り」を見る書類（[[cpa-learning:column:kanjokamou-utiwakemeisaisyo]]）。
- **電子帳簿保存法・インボイスの事務**：2級では仕訳の形だけが出るが、現場の事務量の大半を占める。
- **内部統制**（同じ人に長く任せない・承認・二重計上の防止・月次比較での異常の発見）：[[cpa-learning:column:merit-keiridaiko]]、[[cpa-learning:column:information-for-genkinkanri]]、[[cpa-learning:column:monthly-closing-accelerate]]。

---

## 3. 問われ方（現場で何が問われるか）

試験の問われ方は担当範囲の記事にほとんど出ない。代わりに、**現場で「何が・いつまでに・間違えると何が起きるか」**を一覧にする。ゲームのイベントは、この表の1行を「困りごと」に、最後の列を「結果」にすると組める。

| 場面 | 書類 | 期限・時期 | よくあるミス | 起きること | 記事 |
|---|---|---|---|---|---|
| 給料の支払い | 給与明細・賃金台帳 | 源泉所得税は翌月10日、社会保険料は翌月末 | 天引き分を運転資金に使う、預り金のマイナス残高を放置 | 不納付加算税・延滞税、社会保険料は差押えまで | [[cpa-learning:column:azukarikin-kanjokamoku]]、[[cpa-learning:column:kyuryo]] |
| 経費精算 | 精算書・領収書・仮払申請書 | 月末締めから数営業日 | 年度をまたいで精算を繰り越す、仮払金の精算漏れ、同じ領収書で二重精算 | 利益操作（期ずれ）、仮払金が社長名で内訳書に載る | [[cpa-learning:column:monthly-settlement]]、[[cpa-learning:column:keihiseisan]]、[[cpa-learning:column:accounting03]] |
| 売掛金の回収 | 請求書・売掛金管理表・督促状 | 締日・支払日 | 請求書の送付漏れ（自社のミス）を疑わずに督促、消込み忘れで払った相手に督促 | 取引先の信用を失う、回収不能の判断が遅れる | [[cpa-learning:column:accounts-receivable-and-accounts-payable]] |
| 支払い | 請求書・振込明細 | 支払期日 | 1日の遅れ、1円の違い、振込手数料の負担者の取り違え | 取引先の不信、相手の売掛金の消込みが合わない | [[cpa-learning:column:recomended-qualification]]、振込手数料の記事 |
| 手形の決済 | 約束手形・当座預金 | 満期日 | 期日に口座残高が足りない | 不渡り、半年に2回で2年間の銀行取引停止＝事実上の倒産 | [[cpa-learning:column:difference-tegata-kogitte]] |
| 月次決算 | 月次試算表・業績報告 | 翌月の数営業日 | 概算計上を翌月に洗い替えない | 二重計上 | [[cpa-learning:column:monthly-settlement]] |
| 融資 | 試算表・決算書・資金繰り表 | 申込時 | 役員貸付金・仮払金の慢性化 | 銀行が貸さない | [[cpa-learning:column:shikinguri]]、[[cpa-learning:column:shikingurihyo]] |
| 実地棚卸 | 棚卸表・タグ | 期末（3月） | 数量の誤り、単価の誤り（1,000円を100円） | 売上原価と利益の誤り、評価損の漏れ | [[cpa-learning:column:purpose-of-tanaoroshi]] |
| 決算・申告 | 決算書・申告書・内訳書 | 株主総会前、申告は事業年度末の翌日から2か月 | 期限を過ぎる、内訳書で買掛金と未払金を混ぜる | 加算税・延滞税、調査の目印 | [[cpa-learning:column:beginner-keiri]]、[[cpa-learning:column:kanjokamou-utiwakemeisaisyo]] |
| 消費税 | 適格請求書・帳簿 | 確定申告と中間申告 | 免税事業者からの仕入を全額控除、登録番号を照合しない、端数を商品ごとに丸める、簡易課税の届出を出し忘れる | 仮払消費税の否認、選択できず損をする | [[cpa-learning:column:invoice-register]]、[[cpa-learning:column:invoice-kaniseikyu]]、[[cpa-learning:column:kanikazei-seido]] |
| 領収書を出す | 領収書・収入印紙 | 受領時 | 5万円以上で印紙を貼らない、消印をしない、日付を入金日以外にする | 過怠税（貼らなければ3倍、自主申告なら1.1倍）、改ざんの疑い | [[cpa-learning:column:wariin]]、[[cpa-learning:column:day-of-ryousyuusyo]] |
| 税務調査 | 事前通知・帳簿・証憑 | 通知から数日〜数週 | 証拠のない経費、資本的支出を修繕費に、在庫の計上漏れ、雑談からの私的流用の発覚 | 修正申告、過少申告加算税・延滞税、重加算税 | [[cpa-learning:column:about-zeimutyosa]]、[[cpa-learning:column:hojinzei-setsuzei]] |
| 株主の請求 | 会計帳簿・議事録 | 請求時 | 帳簿の不備、取締役の不透明な取引 | 代表訴訟・解任の材料 | [[cpa-learning:column:kaikeityobo-seikyuken]] |

税務調査の「目印」として、売上は増えたのに利益が少ない、設備投資や消費税の還付を受けた、という外から見える数字の不自然さが挙がる（[[cpa-learning:column:about-zeimutyosa]]）。帳簿の中の誤り（修繕費と資本的支出、在庫の計上漏れ）が、外からどう見えるかの因果としてそのまま使える。

---

## 4. 2027年度改定への対応状況

- **手形**：為替手形の記事が4本、約束手形・手形割引が3本あるが、2027年度は s-tegata が出題外（y27: out）。為替手形はすでに現行2級でも範囲外。手形割引の記事は保証債務（s-hosho）に触れない。紙の約束手形の廃止の動き（2026年度末が目標）を紹介する記事はある（[[cpa-learning:column:difference-tegata-kogitte]]）。不渡りと取引停止の規則は、BE10 の現実の根拠としてだけ残す。
- **電子記録債権・ファクタリング**（chg・new）：直接の解説記事はない。手形の代わりとして紹介されるだけ。売掛債権の譲渡は運転資本の改善策として触れられる程度（[[cpa-learning:column:relationship]]）。
- **リース**（chg）：社用車・サブスクの記事は旧基準（オペレーティング・リースは賃借料、ファイナンス・リースは資産計上）で、使用権資産モデルへの言及はない（[[cpa-learning:column:cars-keihi]]、[[cpa-learning:column:subcription]]、[[cpa-learning:column:car-tax]]）。
- **減価償却**（chg：200%定率法の保証率・改定償却率）：社用車の記事に定率法の計算があるが保証率の扱いがない（[[cpa-learning:column:cars-keihi]]）。
- **除却・廃棄の3級移行**（s-sale chg）：節税の記事が除却損・廃棄損を挙げる（[[cpa-learning:column:hojinzei-setsuzei]]）が、2級・3級の区分には触れない。
- **売上原価対立法の3級移行**（s-taiwitsu to3）：担当範囲に記事はない。
- **税制の時点の古さ**（2級の改定とは別だが、ゲームの「現実では」画面に使う際の注意）：
  - インボイスの記事（2023年夏の時点）は、免税事業者からの仕入の経過措置（8割→2026年10月から5割）や2割特例の終了時期を反映していない（[[cpa-learning:column:invoice-affects]]、[[cpa-learning:column:invoice-positive-negative]]）。
  - 登録に課税事業者選択届出が必要と書く記事は、経過措置（登録申請だけでよい）を落としている（[[cpa-learning:column:invoice-individual-affect]]）。
  - 電子取引の宥恕措置（2023年末まで）は2024年以降の猶予措置に変わっている（[[cpa-learning:column:ryousyuusyo-kojin-jigyounusi]]、[[cpa-learning:column:ryousyuusyo-hokankikan]]）。
  - 所得税の基礎控除（48万円）や加算税の率は改正前（[[cpa-learning:column:youtube]]、[[cpa-learning:column:food-delivery]]）。四半期報告書の制度変更も反映前（[[cpa-learning:column:listed-operations]]）。
- **方針**：制度の数字はゲームに直接書かず、書く場合は一次情報で確かめて「2026年10月時点」と明示する。古い記事の内容は、scope.js の y27 の方針どおり「参考」扱いにとどめる。

---

## 5. ゲームへの反映案

### 5.1 背景のカレンダー（エピソードのない月にも定型業務を置く）

新人経理の連載の年間スケジュール（3月決算）を、1年＝12ターンの背景にする（[[cpa-learning:column:guidance-accounting]]、[[cpa-learning:column:what-do-accountants-do]]）。数字と会社名は独自にする。

| 月 | 定型業務 | 資金・判断への効き方 | 関係する回 |
|---|---|---|---|
| 毎月10日 | 源泉所得税の納付（預り金） | 天引き分は会社のお金ではない | E06・E13 |
| 毎月末 | 社会保険料の納付、月次の締め（概算計上→翌月洗替え） | 締めの段が増えていく | E05・E08 |
| 4月 | 年次決算（数える→照合→評価→税金→決算書） | 決算整理の順番 | E08・E22 |
| 5月 | 法人税・消費税の申告納付、株主総会 | 利益が急に出た年は納税で資金が苦しい | E13・E14・E11 |
| 11月 | 中間申告・中間納付 | 前払いした税金は決算で差し引く | E14 |
| 12月 | 年末調整 | 預り金の過不足の精算 | E35〜E37（給与） |
| 1月 | 償却資産の申告（固定資産台帳） | 台帳が税の書類にもつながる | E04・E20 |
| 3月 | 実地棚卸 | 帳簿と実物のずれ | E33 |

### 5.2 エピソードとバッドエンドへの対応づけ

（数字・台詞・会社名はオリジナルにする。記事の文言は使わない。）

- **E01（会社化）**：お小遣い帳（単式）では「掛けで買った」ことが書けない（[[cpa-learning:column:difference-between-fukushiki-and-tanshiki]]）。会社のお金と社長のお金を分ける最初の規約（[[cpa-learning:column:information-for-genkinkanri]]）。設立前に発起人口座にお金がある順序（[[cpa-learning:column:dif-soritsu-kaigyo]]）。個人事業の家事按分が会社では使えない（[[cpa-learning:column:ryousyuusyo-kojin-jigyounusi]]）。
- **E03・E04（仕入・トラック）**：商品は買掛金、トラックは未払金（記事の誤り＝型③）。10万円の境で消耗品費と備品が分かれる理由を森さんが語る（[[cpa-learning:column:siwaketyo-kinyu]]、[[cpa-learning:column:equipment-kanjokamoku]]）。高い道具を買った年に全額経費にしようとする（[[cpa-learning:column:food-delivery]]）。
- **E05（通帳）**：振込明細と売掛金の消込み、振込手数料を差し引かれた入金、二重消込み（[[cpa-learning:column:ginkoufurikomi-ryousyuusyo]]）。1円の差を追う意味（[[cpa-learning:column:recomended-qualification]]）。
- **E06・BE1（大口でもお金がない／黒字倒産）**：大口受注→仕入の支払いが回収より先（[[cpa-learning:column:shikinguri]]）。プレイヤーが予定資金繰り表を「入るお金・出るお金」で作り、P/L の利益と並べる（記事の「利益の式で書く」誤りを使わない：[[cpa-learning:column:shikinguri-akka]]）。打ち手の選択（回収を早める・支払いを延ばす・借りる・売る・債権を割り引く）がそれぞれ別の鎖につながる：延ばしすぎ→BE10、借りすぎ→BE2、高い割引業者→BE1（[[cpa-learning:column:shikingurihyo]]、[[cpa-learning:column:merit-demerit-tegatawaribiki]]）。運転資本を「回収の日・在庫・支払いの日」の3つのつまみにする（[[cpa-learning:column:relationship]]）。
- **E07・E19（A社の与信と貸倒れ）**：締日・支払日を管理表に置き、入金がない→まず自社の請求漏れを疑う→督促→内容証明→回収不能の判断（[[cpa-learning:column:accounts-receivable-and-accounts-payable]]）。請求した日に売上を計上する誤り（請求＝売上ではない：[[cpa-learning:column:difference-seikyuusyo-ryousyuusyo]]）。
- **E08・E22（決算）**：数える→照合→評価→税金→決算書の順（[[cpa-learning:column:beginner-keiri]]）。年度をまたぐ経費の繰越しは期ずれ＝利益操作（BE3 の軽い段：[[cpa-learning:column:monthly-settlement]]）。赤字の年の損は将来の黒字と相殺できる（「今年は赤字でもよい」という対の選択：[[cpa-learning:column:ryousyuusyo-hokankikan]]）。単一性の原則（銀行用と税務署用で決算書を分けない）を型⑤の「現実では」に（[[cpa-learning:column:meaning-kaikesyori]]）。
- **E09（銀行の成績表）**：月次試算表を融資の際に出す（[[cpa-learning:column:shisanhyo-reason]]）。田中さんが役員貸付金・仮払金の行を指でたどる（[[cpa-learning:column:shikinguri]]）。貸借が一致しているのに間違っている試算表（[[cpa-learning:column:shisanhyo-reason]]）。
- **E10（増資）**：申込証拠金→払込期日→資本金・資本準備金（記事にない1/2ルールは規約型で示す：[[cpa-learning:column:dif-soritsu-kaigyo]]）。借入か出資かで、佐藤さんの持分が薄まる不満と田中さんの利息の対比（[[cpa-learning:column:about-ma]]）。
- **E11・BE5（配当・違法配当）**：配当を増やすと銀行が心配する（[[cpa-learning:column:about-financial-accounting]]）。佐藤さんが帳簿の閲覧を書面で請求→配当の計算や取締役の取引を調べる→代表訴訟・解任議案（BE5・BE6：[[cpa-learning:column:kaikeityobo-seikyuken]]）。
- **E13・E14（消費税・中間申告）**：税抜方式なら期中から預かった消費税が見える（[[cpa-learning:column:syohizei-kanjokamoku]]）。預かった消費税・天引きの税金で仕入れようとする誘惑（兄弟の罠：[[cpa-learning:column:azukarikin-kanjokamoku]]）。益税の話から「仮受消費税は会社のお金ではない」を導く（[[cpa-learning:column:invoice-positive-negative]]）。小さな仕入先（個人の職人）が登録すべきか悩み、社長が値下げを迫るか選ぶ（強要は違法：[[cpa-learning:column:invoice-individual-affect]]）。請求書の登録番号の照合（[[cpa-learning:column:invoice-register]]）。簡易課税の届出の期限と、設備投資の年は還付を受けられない（[[cpa-learning:column:kanikazei-seido]]）。
- **E15（収益認識）**：受領書（検収）の日付が期末をまたぐ（3月31日出荷・4月2日受領）（[[cpa-learning:column:difference-juryousyo-ryousyuusyo]]）。領収書の日付を3月にすれば今期の売上、という社長の提案は改ざん＝BE3 の入口（[[cpa-learning:column:day-of-ryousyuusyo]]）。「実現主義」という古い言葉と現行基準の違い（[[cpa-learning:column:hasseisyugi-genkinsyugi-jitugensyugi]]）。
- **E16（教室）**：自社が領収書を出す側になる回。5万円以上で印紙、消印、簡易インボイスの形式、端数は税率ごとに1回（[[cpa-learning:column:wariin]]、[[cpa-learning:column:invoice-kaniseikyu]]）。印紙の貼り忘れは、調査で見つかれば3倍、自分で申し出れば1.1倍＝誤りを隠さないほうが得（PEDAGOGY の価値観と結ぶ）。
- **E17・E18（手形・電子記録債権）**：E17 は参考回。最後の紙の手形を受け取る回として描き、不渡りと取引停止の規則は BE10 の根拠にとどめる（[[cpa-learning:column:difference-tegata-kogitte]]）。
- **E20・BE4（改良・税務調査）**：「売上が増えたのに利益が少ない」が調査の目印（[[cpa-learning:column:about-zeimutyosa]]）。事前通知→実地調査→質疑→指摘→修正申告→加算税・延滞税の段階を BE4 の軽→中→重に。岩田さんが内訳書の「仮払金・役員」の行を見る（[[cpa-learning:column:kanjokamou-utiwakemeisaisyo]]）。証拠のない経費（自分で作った出金伝票だけ）は否認されやすい（[[cpa-learning:column:ryousyuusyo-saihakkou]]）。現実では顧問税理士が立ち会う、という1行（[[cpa-learning:column:what-do-accountants-do]]）。期限を過ぎると延滞税が日割りで増える（[[cpa-learning:column:youtube]]）。
- **E21（前払）**：2年分の火災保険料をまとめて払い、前払費用から振り替える（保険料の勘定科目の記事）。サブスクの年払い（[[cpa-learning:column:subcription]]）。
- **E23（区分）**：営業利益を最終利益と呼ぶ誤り（[[cpa-learning:column:keihisakugen-gutairei]]）。本業以外の売却益で利益をかさ上げする見せ方を田中さんが区分で見抜く（[[cpa-learning:column:financial-statements-skill]]）。
- **E24（工場）**：育成仮勘定→生物（子牛が乳を出すまで償却しない）を建設仮勘定の比喩に（[[cpa-learning:column:nogyoboki-kanjo]]）。多額の仮払消費税で還付→調査されやすい（[[cpa-learning:column:about-zeimutyosa]]）。
- **E29（売却・火災）**：倉庫の火災。記事の「保険金は全部雑収入」をピヨが提案し、森さんが未決算→保険差益／火災損失に直す型③（保険料の勘定科目の記事）。
- **E30（アプリ研究）**：研究費・研修費を削って今期を黒字にする判断の後日の結果（[[cpa-learning:column:keihisakugen-gutairei]]）。ソフトウェアの資産と費用の境（[[cpa-learning:column:software-kanjokamoku]]）。
- **E33（棚卸）**：閉店後に数え、帳簿100個に実物80個。原因（盗難・破損・記帳漏れ）で処理が変わる。流行遅れの在庫の評価損を社長が拒む型⑤（[[cpa-learning:column:purpose-of-tanaoroshi]]、[[cpa-learning:column:evaluation-tanaoroshi]]）。
- **E34（税効果）**：税法の基準で済ませていた決算を会計基準どおりにする転換（上場準備）（[[cpa-learning:column:listed-operations]]、[[cpa-learning:column:about-zeimukaikei]]）。
- **E46（支店）・中盤の組織**：ピヨやハルカに仕事が集中して休めない（属人化）→手順書＝自動仕訳ルールを整える（[[cpa-learning:column:keiri-effective]]）。同じ人に長く現金を任せない、承認の流れ（[[cpa-learning:column:merit-keiridaiko]]、[[cpa-learning:column:information-for-genkinkanri]]）。
- **E47・E48・BE8（合併・買収・連結訂正）**：中村さんがデューデリジェンスを説き、社長が「シナジーですぐ利益」と楽観。払いすぎはのれんとして残る（[[cpa-learning:column:about-ma]]）。子会社の会計方針が揃っていないことを BE8 の原因に（[[cpa-learning:column:merit-ifrs]]）。
- **E52（標準原価）**：工場長が年間予定生産量・作業時間・償却費を持ってきて「あるべき原価」を組む（[[cpa-learning:column:relationship]]）。差異を購買（価格）と製造（数量）の責任に分ける（[[cpa-learning:column:information-for-yojitsukanri]]）。前年の5倍の売上目標を立てる社長（同）。
- **E53（CVP）**：社長の「もう200万円使ったから続けたい」（埋没原価。2級の範囲外なので発展コラム：[[cpa-learning:column:isikettei-kaikei]]）。何本売れば黒字かを先に示すのが経理の参謀の仕事（[[cpa-learning:column:accounting-annual-income]]）。
- **E55・BE7（上場・上場延期）**：内部統制の弱さが延期につながる（[[cpa-learning:column:career-accountant]]）。終盤に「経理の言うことなら間違いない」と信頼される場面を置く（数の報酬ではなく信頼の報酬：[[cpa-learning:column:case-nipponham-accounting-education]]）。

### 5.3 書類の小イベント（型③：ありがちな誤り）

領収書・請求書系の記事は、2級の論点ではないが、短い確認作業の素材が多い。1回10〜30秒の「書類を見て誤りを1つ見つける」小イベントにして、月の締めの合間に置く。

- 宛名が「上様」・空欄の領収書で仕入税額控除ができるか（小売・飲食などは宛名不要）（[[cpa-learning:column:recipt-uesama]]、[[cpa-learning:column:recipt-atena-nashi]]）。
- 但し書きが「品代」だけの領収書（[[cpa-learning:column:recipt-tadashigaki]]）。
- 日付をまたいだタクシーの領収書はどの月の費用か（降車日）（[[cpa-learning:column:taxi-ryosyusyo]]）。
- 同じ領収書で二度精算（再発行の領収書に「再発行」の表示がない）（[[cpa-learning:column:ryosyusyo-funshitsu]]、[[cpa-learning:column:day-of-ryousyuusyo]]）。
- 来客用の飲み物の科目は目的で変わる（会議費か福利厚生費か）（[[cpa-learning:column:receipt-ryosyusyo]]）。
- カード払いの領収書と印紙（[[cpa-learning:column:credit-ryousyuusyo]]）。
- 仮払金の精算書の返金額と仕訳の現金の向きが合わない（記事の誤りそのものを題材に：[[cpa-learning:column:accounting03]]）。PEDAGOGY 10.5 の「書類から言えること と 仕訳が言っていること」を並べるパネルの良い例。

### 5.4 キャリア記事からの吸収

- **権限証の説明文に現実の職務名を添える**：新人（伝票入力・現金）→主任（通帳と台帳・売掛買掛）→課長（月次決算を1人で締める・給与・試算表・棚卸表）→部長（年次決算・監査対応・税務）→工場経理（原価管理・予算）→CFO（資金調達）（[[cpa-learning:column:carrer-plan-bookkeeping]]、[[cpa-learning:column:career-up]]、[[cpa-learning:column:accounting-annual-income]]）。学習者が自分のキャリアと重ねられる。
- **振り返りに1行**：「この判断は、現実の経理では○○の仕事」（例：督促の前に請求漏れを疑う＝売掛金管理、概算計上の洗替え＝月次決算）。年収・求人という外の動機を、仕事の手触りという内の動機に置き換える（[[cpa-learning:column:annual-income-career-change]]）。
- **ピヨが質問される側に回る**：権限証が上がるほど、ハルカ・工場長・社長から「この費用はどう処理するの？」と聞かれ、原理から答える（[[cpa-learning:column:beginner-keiri-2]]）。
- **書く段階から読む段階へ**：1年目は記録が主、2年目以降は社長に試算を返す場面が増える、と言葉で気づかせる（[[cpa-learning:column:carrer-bookkeeping-2]]）。
- **森さんの背景**：監査法人出身で独立し、中小企業の顧問と監査補助で事務所を回す（[[cpa-learning:column:cpa]]、[[cpa-learning:column:career-accountant]]）。監査は書類を機械的に見るのではなく内部統制を理解して経営者と議論する仕事、という像は、森さんが自動仕訳ルールの「条件外」を点検する設定と合う。

### 5.5 使わないもの

- 記事の数値例・仕訳例・図表（誤りが多く、また転載になる）。制度の数字（税率・期限・控除額）は一次情報で確かめたものだけを使う。
- 年収の金額を動機の中心にする語り口（[[cpa-learning:column:cpa]]、[[cpa-learning:column:annual-income-career-change]]）。
- 為替手形、農業簿記、CRM・ERP・セミナーの製品紹介、個人の所得税（ふるさと納税・iDeCo など：[[cpa-learning:column:tax-advantage]]）。

---

## 6. 既存の問題（js/data）との比較

js/data を語で検索した結果（出現回数）にもとづく。

- **火災・保険**：c17（売却・除却・買換え・火災）に未決算・保険差益・火災損失がある。保険料の記事の「保険金は全部雑収入」という素朴な処理を誤答肢に使う問題があるかは要確認。保険の前払い（前払保険料17・長期前払費用7）はある。
- **資金繰り表の置き場所**：資金繰り表の課は c11「手形の応用」の中にある（受取手形記入帳と資金繰り表）。c11 は2027年度に出題外（s-tegata: out）になる章なので、資金繰り表の考え方（利益と現金のずれ、税込で書く、減価償却費は載せない）は、出題外になっても残る場所（E06 に対応する章、または c00・c26）へ移すか複製する必要がある。「黒字倒産」の語は js/data にない。
- **預り金と納付期限**：預り金は35回出る。納付期限（翌月10日など）や加算税（0回）・延滞（3回）と結びつけた問いはほとんどない。資金繰りの罠として、天引き分を使ってしまう誤答肢を足す余地がある。
- **月次の概算計上と洗替え**：「概算」2回・「再振替」4回と少ない。月次決算の現実（概算→翌月洗替え、しないと二重計上）は、c26（決算整理と精算表）の再振替の導入として使える。
- **買掛金と未払金**：「買掛金と未払金」の並びは1回だけ。掛仕入の相手を未払金にする誤り（記事の誤り）を誤答肢に使う問題を足せる。
- **棚卸資産の評価**：商品評価損43・棚卸減耗67・正味売却価額29と厚い。洗替7・切放2は少なめで、洗替法と切放法の翌期の評価損の違い（例：1,000→900→800）を問う問題は増やせる。総平均0・移動平均3・平均法24：材料費（c34）で平均法の扱いがあるが、商品有高帳との対応（同じ計算の型）を示す一言はない。売価還元法0は2級の範囲外で問題ない。
- **消費税**：仮払消費税27・未払消費税15・中間納付32・仮払法人税等33はある。インボイス5回のみ。税込方式（w2 で0回）は2級の出題範囲の中心ではないが、「税込で処理していると決算まで納付額が見えない」という資金の錯覚（E13）は、理由選択の問いにできる。簡易課税0は範囲外で問題ない。
- **印紙・租税公課・貯蔵品**：租税公課19・貯蔵品13・印紙8。期末に未使用の印紙を貯蔵品に振り替える問題はある。過怠税0（範囲外でよい。手帳の小話にとどめる）。
- **損金不算入**：15回ある。加算税・延滞税を損金不算入の例として示す問題は見当たらない（加算税0）。s-kazei の例として足せる。
- **内部統制**：語として0回。二重計上の語は c47・w3・w7（連結）にあるが、経費の二重精算・同じ領収書の二重使用はない。5.3 の小イベントで補う（問題集ではなくイベント側で扱う）。
- **収益認識の証憑**：検収19・出荷7・着荷基準2。受領書・検収書の日付が期末をまたぐ形の問題は、c07（収益認識のルール）に足せる。
- **役員との取引**：役員24回のうち役員貸付金は1回。内訳書や融資で見られる「役員への貸付・仮払の慢性化」は、E09 のイベント側で扱う。

---

## 付記：読了ノートと記事の対応

- 全148本の読了ノートは `boki2/research/notes/cpa-learning/column/<slug>.md`（read: full）。宣伝欄（全記事に共通の講座紹介）しか後ろ3分の1にない記事は、宣伝欄も読んだうえで本文の範囲を注記した。
- 記事の誤り・食い違いは各ノートの「読み取ったこと」に記録した。分析の 1.3 はその要約。
