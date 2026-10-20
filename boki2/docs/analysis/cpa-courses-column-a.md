# CPAラーニング：2級講座の構成（courses2）とコラム（boki・technique）の分析

担当：courses2 の8講座（講座説明・レッスン一覧・教材一覧のJSON）と、コラムの /column/boki/ と /column/technique/ の104本。全部読み、読了ノートは `boki2/research/notes/cpa-learning/courses2/` と `.../column/` にある。動画の中身は文字情報がないため対象外。コラムの図表のうち画像だけのもの（important・how-to-study・kanjokamoku の解答例や表など）は読めていない。

一言でいうと、講座の配分からは「どこに時間がかかるか」の実測値が取れる。コラムからは「CBTの実際の操作規則」「大問ごとの戦い方」「誤りの分類と復習の間隔」が取れる。一方でコラムの論点解説（入門記事）は誤りが多く、内容の出典としては使えない。教え方を取る材料として読む。

---

## 1. 構成と教え方

### 1.1 講座の章立てと時間配分（courses2）

| 講座 | 本数・時間 | 特徴 |
|---|---|---|
| 商業 講義 [[cpa-learning:courses2:30003]] | 23本・約1013分 | 教科書の第1〜16章どおり。連結3回で約2割、有価証券2回で12.5% |
| 工業 講義・植田 [[cpa-learning:courses2:120005]] | 14本・約798分 | 費目別22%、製造間接費＋部門別20% |
| 工業 講義・登川 [[cpa-learning:courses2:510005]] | 14本・約862分 | 同じ教科書・同じ説明文。材料費108分・総合106分が最長 |
| ネット試験対策 [[cpa-learning:courses2:240002]] | 5本・約106分 | 大問ごとに1本（約20分ずつ）。教材PDFなし |
| 商業 問題集解説 [[cpa-learning:courses2:360010]] | 16本・約485分 | 1章1本。商品・預金・債権・有価証券が各43分前後 |
| 工業 問題集解説 [[cpa-learning:courses2:360017]] | 14本・約584分 | 部門別61分・製造間接費57分・個別53分 |
| ネット模試 実践解説 [[cpa-learning:courses2:630033]] | 3本・約473分 | 1回90分の模試を約2.5時間かけて解きながら解説 |
| パーフェクト模試 [[cpa-learning:courses2:360012]] | 3本・約473分 | 630033 と同じ動画を、問題ページと組で置いた古い版 |

読み取れること：

- **順番**：商業は「資産の各論（商品→収益認識→現金預金→債権債務→有価証券→固定資産→無形→リース）→引当金→純資産→外貨→税効果→財務諸表→本支店→連結」。表を作る論点（財務諸表・本支店・連結）を最後にまとめている。工業は「全体像→費目別→製造間接費・部門別→個別→総合→工場の決算→標準→直接・CVP→本社工場」で、原価計算の3段階（費目別→部門別→製品別）を地図として見せる [[cpa-learning:courses2:120005]]。
- **講義と演習で時間の乗る場所が違う**：講義では連結が約20%なのに、商業の問題集解説では連結は約10%に下がる。代わりに現金預金・債権債務・商品の比率が約1.7倍に上がる [[cpa-learning:courses2:360010]]。工業でも、講義では短い個別原価計算・工場の決算・本社工場会計が、演習解説では比率が倍近くになる [[cpa-learning:courses2:360017]]。概念が難しい所は説明に時間がかかり、取引の種類が多い所や表を埋める作業が多い所は演習に時間がかかる、と読める。商業は講義が長く工業は演習が長い、という逆転もある。
- **2人の講師が一致している山**：材料費・製造間接費・部門別・総合・標準を、両講師とも70分以上かけて扱う [[cpa-learning:courses2:510005]]。経費と「その他の総合」（工程別・組別・等級別）は両者とも短い。
- **導入の仕方**：レッスン説明は毎回「この章で何をするか」と「3級との関係（復習・延長・2級で新規）」を最初に言う。リースは取引のイメージから、税効果は税法の仕組みから、純資産は全体像から、連結は「イメージ→資本連結→成果連結」の順で入る。制度の背景と取引の絵を仕訳より先に置く設計で、PEDAGOGY の4拍（困りごと→原理→結果→名前）と相性がよい [[cpa-learning:courses2:30003]]。
- **つまずきを予告する**：有価証券は保有目的で決算整理が分かれる、連結③はアップストリームが難所、と説明文で名指しする。部分所有を独立した回にしている [[cpa-learning:courses2:30003]]。
- **試験の形から逆算した講座**：論点別の講義とは別に、大問ごとの対策を1本ずつ（[[cpa-learning:courses2:240002]]）と、講師が模試を解く実演（[[cpa-learning:courses2:630033]]）を持つ。実演では計算用紙の使い方を見せることを売りにしている。

### 1.2 コラムの教え方（型）

- **記事の型**：冒頭で読者の悩みを2つほど代弁し、「この記事を読むと分かること」を箇条書きにし、本文で結論→理由→表、最後にまとめと自社講座の宣伝、という SEO 記事の型が大半（例：[[cpa-learning:column:what-is-boki]]、[[cpa-learning:column:boki2-information]]）。論点の解説記事も同じ型で、先に定義、次に仕訳例、最後に「ポイント」が来る（[[cpa-learning:column:syokyaku]]、[[cpa-learning:column:point-of-kessan]]）。
- **困りごとから入る良い例**：
  - 通帳（単式）だけでは借金と売上が区別できない、から複式を導く [[cpa-learning:column:the-difference-between-fukushiki-and-tanshiki]]
  - 帳簿をつけないと社長の公私混同に気づけない [[cpa-learning:column:information-about-boki]]
  - 年末まで原価が分からないと値付けに間に合わない、から月次の原価計算を導く [[cpa-learning:column:the-information-for-syogyoboki]]
  - 建設会社の資金繰りのために前払いする、から建設仮勘定を導く [[cpa-learning:column:the-information-for-deposit]]
  - 銀行や投資家に見せるため、から記録の目的を導く [[cpa-learning:column:what-is-boki]]
  
  どれも PEDAGOGY の「困りごとを先に」に合う。
- **一つの品物で対比する**：ワインを「仕入れて売る」と「作って売る」で比べ、商業と工業の違いを見せる [[cpa-learning:column:bookkeeping2-starting]]。同じパソコンでも、売る会社には商品、使う会社には備品になる [[cpa-learning:column:measures3]]。
- **語呂合わせ**は3級記事に少しある（売上原価の「しいくりくりしい」[[cpa-learning:column:how-to-evaluate]]、借方・貸方の向き [[cpa-learning:column:credit-and-debit]]）。2級の講義説明文にはない。
- **「理解すれば暗記が減る」という主張**：理解できれば楽しくなり暗記の苦労も減る [[cpa-learning:column:how-to-study]]。仕訳は覚えるものではなくその場で考え出すもの [[cpa-learning:column:how-to-memorize]]。取引の意味→科目→5要素の増減→仕訳の順で組み立てる [[cpa-learning:column:bokikentei-important]]。正解しても根拠を説明できなければ合格としない [[cpa-learning:column:how-many-hours]]。いずれも PEDAGOGY 0.1・1.3 と同じ仮説を受験指導側が持っていることを示す。
- **原則・容認・並列を書き分けて趣旨を最優先する**というテキストの作り込み方 [[cpa-learning:column:my-text]]。並列規定（先入先出法と平均法、定額法と定率法）は、ゲームでは「どちらを選ぶと何が変わるか」の判断の場面になる。

### 1.3 学習方法についての主張（technique 系）

- **学習の段階**：
  - 「分かった→できる→いつでもできる」の3段で、戦略は時間・方法・継続の3要素 [[cpa-learning:column:studying-step]]。
  - 新しい理解は机で集中して、復習はスキマで軽く、演習は本番の環境で [[cpa-learning:column:cpa-goukaku]]。
  - 教科書→例題の改題（基本）→本試験形式（応用）→時間を計る模試、の4段 [[cpa-learning:column:teaching-material]]。
- **復習の間隔**：
  - 翌日→3日後→1週後→2週後 [[cpa-learning:column:practice-time]]（記事自身が、忘却曲線は意味のない音節の実験で、意味づけがあれば忘れにくいと注記している）。
  - 1日→2日→まとまりごと [[cpa-learning:column:hukusyu-cpa]]。
  - 数日後に同じ問題を解き直す [[cpa-learning:column:how-long-does-it-take]]。
  - 間違えた所に印をつけ、直前は印だけ見直す [[cpa-learning:column:last-3days]]。
- **誤りの分類**：
  - 未習・忘却・計算ミスの3分類 [[cpa-learning:column:todo-tertiary]]。
  - 模試の失点を時間不足か知識不足かに分け、時間不足なら慣れ、知識不足ならテキストへ戻る [[cpa-learning:column:how-study]]。
  - 誤りはテキストに書き残す（「どこで何と間違えたか」）[[cpa-learning:column:mistake]]。
  - 不合格の原因を機械的な解き方に求める [[cpa-learning:column:to-pass]]。
- **インターリーブ**：商業と工業を交互に学ぶことを勧める [[cpa-learning:column:bookkeeping2-starting]]。ただしサイト内で主張が割れる（4節末を参照）。
- **動機づけ**：外的報酬は油断と諦めの両方を生む [[cpa-learning:column:engine]]。記録・仲間・公言を勧める記事もある [[cpa-learning:column:how-to-maintain-motivation]]。ゲームは PEDAGOGY の方針（量や連続日数に報酬を出さない）を維持し、進歩は会社の状態で見せる。

### 1.4 合格体験記に出る学習行動

- **1級全国1位** [[cpa-learning:column:experience-note]]：
  - 決め手は「下書きの型を固める」こと（連結はタイムテーブル、総合原価計算はボックス図）。型を暗記するのでなく、講義で計算過程を理解したうえで同じ下書きを何度も作り、手が勝手に動く状態にする。
  - 初見の問題では、テキストの例題（数値つき）を思い出して判断の拠り所にする。
- **サッカー選手の2級合格** [[cpa-learning:column:boki2_interview_criacao]]：毎日1時間を確保し、講義はスキマ時間、演習は朝と時間帯を分けた。網羅的に学んでいたので、一部のミスを他の大問で取り返せた。
- **ゲームへの翻訳**：
  - 型（タイムテーブル・ボックス図・勘定連絡）を「操作できる部品」にして何度も使わせる。
  - 初見の問題では、例題の代わりに「自分の会社でやった場面」を思い出させる。たとえば検定会場の問題に、関連する過去のエピソードの1コマを添える。

---

## 2. 論点の網羅（scope.js の項目ごと）

コラムは3級・入門の記事が多く、2級の論点を正面から扱う記事は少ない。講座は動画が対象外なので、扱いの深さは説明文と時間配分からしか読めない。以下は資料に出てきた項目だけを挙げる。

### 土台（b-xxx）
- **b-je**：
  - 借方・貸方を4つの仕訳から決算書まで通しで作り、P/Lの差額がB/Sの純資産に入る流れを見せる [[cpa-learning:column:credit-and-debit]]。
  - 一方で、借方を「資産の増加」とだけ書く入門記事がある（費用・負債・純資産が抜けている）[[cpa-learning:column:what-is-boki]]。
  - 歴史の記事は、貸借が合わないから誤りに気づける、を複式が広まった理由に挙げる [[cpa-learning:column:history-of-boki]]。
- **b-tb**：第3問は貸借の一致で自分の正誤が分かる [[cpa-learning:column:net-tertiary]]。電卓のメモリーで貸借を足し引きして0を確かめる [[cpa-learning:column:sharp]]、[[cpa-learning:column:calculator-casio]]。
- **b-mibarai・b-expense・b-accrual**：
  - 3級で間違えやすい対の論点（未払金と買掛金、前期分と当期分の貸倒れ、付随費用など）[[cpa-learning:column:important]]。ただし表は画像で、一部しか読めていない。
  - 10万円未満は費用で以上は資産、年一括払いは前払費用から月々振り替える [[cpa-learning:column:kanjokamoku-highly-used]]。
  - 決算に残った印紙は貯蔵品 [[cpa-learning:column:information-for-syunyuinshi]]。
- **給料の源泉所得税（b-expense の周辺）**：預り金（負債）と租税公課（費用）の取り違えが典型的な誤り [[cpa-learning:column:mistake]]。
- **現金過不足**（3級の土台）：原因を類型化している（数え間違い、記帳ミス、受け取った印紙を現金にした、換金前の小切手）[[cpa-learning:column:genkin-kabusoku]]。本文の説明に借方と貸方を取り違えた箇所がある。

### 商業（s-xxx）
- **s-stock・s-dividend・s-keisu**：
  - 繰越利益剰余金の記事が、配当で積み立てる準備金の「10分の1」と「資本金の4分の1までの残り」を扱う [[cpa-learning:column:definition-of-joyokin]]。ただし仕訳表の金額が本文と合わないなどの誤りがある。
  - 資本金に「過去の利益」を含める誤り、利益準備金を配当のための現金と書く誤りもある [[cpa-learning:column:how-to-memorize]]。
  - 純資産は講義で58分。全体像から入り、仕訳は後半に回す [[cpa-learning:courses2:30003]]。
- **s-cogs・s-genmo**：
  - 売上原価は期首＋仕入−期末。大量仕入れで黒字なのに現金がない、という数値例がある [[cpa-learning:column:cost-of-sales-boki3]]。
  - 移動平均法の記事は、端数を処理しないまま単価を出している（35,500÷350 を101円とする）[[cpa-learning:column:the-way-of-evaluating]]。払出欄に売価を書く、という典型的な混同も紹介している。
  - 仕入の付随費用、棚卸資産の評価 [[cpa-learning:column:how-to-evaluate]]。
- **s-sanbunpo**：
  - 2級の例題として、かねて掛けで仕入れた商品の仕入割戻（1個あたりの支払いの免除）を選択肢つきで出す [[cpa-learning:column:what-is-boki2]]。
  - 手付金（前払金・前受金）の記事は、手付の性質の説明が不正確 [[cpa-learning:column:the-information-for-deposit]]。
- **s-revenue**：講義では収益認識を独立した回にしており（39分）、3級の延長として履行義務を扱う [[cpa-learning:courses2:30003]]。コラムには該当記事がない。
- **s-bankrec**：講義の現金預金の回で銀行勘定調整表を扱う [[cpa-learning:courses2:30003]]。演習解説では比率が上がる [[cpa-learning:courses2:360010]]。
- **s-tegata・s-hosho**：講義の債権債務の回は前半が約束手形で、後半が債務の保証 [[cpa-learning:courses2:30003]]。2027年度の区分表では手形は出題外（4節）。
- **s-factoring**：3級の区分表に「債権の譲渡」が入っている、と書く記事がある [[cpa-learning:column:what-is-boki3]]。2級のファクタリングは、この延長として示せる。
- **s-hojinzei・s-kazei**：
  - 内訳書は決算書の残高と一致していないと税務調査のリスクになる [[cpa-learning:column:uchiwake-meisaisyo]]。
  - 法人の申告期限、中間申告 [[cpa-learning:column:kakuteishinkoku2]]。
  - 控除で税額が減る仕組みの例（範囲外）[[cpa-learning:column:hurusatonozei]]。
- **s-zeikoka**：税効果の目的とメリットを紹介する入門記事 [[cpa-learning:column:introduction-zeikouka-kaikei]]。講義は税法の仕組みから入る2回・68分 [[cpa-learning:courses2:30003]]。
- **s-dep・s-sale・s-fire**：
  - 減価償却の記事は、減価償却累計額を「資産科目」と書き、残存価額10%を旧来の設定のまま使っている [[cpa-learning:column:syokyaku]]。
  - 月割の数え間違いが「知っているのに本番で落とす」代表例 [[cpa-learning:column:boki-notime]]、[[cpa-learning:column:mistake]]。
  - 講義の固定資産②で、買換え・除却・廃棄・滅失を扱う [[cpa-learning:courses2:30003]]。
- **s-kensetsu**：前払金から建設仮勘定への流れ [[cpa-learning:column:the-information-for-deposit]]。
- **s-mukei・s-rd**：講義の研究開発費の回は、製薬・ソフト開発の業界の話から入る [[cpa-learning:courses2:30003]]。コラムには、自社利用ソフトの扱いを誤って書く記事がある [[cpa-learning:column:kanjokamoku-highly-used]]。
- **s-sec・s-secval**：講義は2回・127分で、保有目的ごとの決算整理を難所に挙げる [[cpa-learning:courses2:30003]]。第1問の頻出に挙がる [[cpa-learning:column:boki2-net-exam-measures]]。
- **s-fs**：
  - P/Lの区分（営業外・特別）の説明に誤りがある。振込手数料を営業外とし、社債発行費の扱いも不正確 [[cpa-learning:column:how-to-analyze-pl]]。
  - B/Sの見方の記事は、銀行の目線で指標を読む [[cpa-learning:column:for-beginners]]。
  - B/S作成問題は、B/Sに出る側だけを集計すると速い [[cpa-learning:column:different-boki-test]]。
- **s-seisanhyo**：精算表は「解答欄も資料の一つ」（印刷された科目の並びから整理事項を推測する）、全問正解を狙わず部分点を拾う [[cpa-learning:column:question-of-seisanhyo]]。
- **s-keika**：前期の決算仕訳を見ながらやれば誤りが少ない、という実務の話 [[cpa-learning:column:point-of-kessan]]。
- **s-renketsu1・2・s-naibu・s-renketsufs**：
  - 講義は3回・約199分と最大。部分所有とアップストリームを山場にする [[cpa-learning:courses2:30003]]。
  - 難しい回は連結精算表などの商業で起きる [[cpa-learning:column:information-boki2]]。
  - 下書きはタイムテーブル [[cpa-learning:column:experience-note]]。
- **s-honshiten**：講義35分、演習14分と軽い [[cpa-learning:courses2:360010]]。

### 工業（k-xxx）
- **k-flow**：講義の基礎の回は、細部は後の章として先に全体像を見せる [[cpa-learning:courses2:120005]]。
- **k-zairyo・k-romu・k-keihi**：費目別は「何がその費目か→どう計算するか」の2段 [[cpa-learning:courses2:120005]]。材料費は最長級で108分 [[cpa-learning:courses2:510005]]。
- **k-yotei・k-bumon**：講義では製造間接費が最長級（約90分）、演習では部門別が最長（61分）[[cpa-learning:courses2:360017]]。
- **k-kobetsu**：講義では短い（31〜46分）のに、演習では比率が倍以上になる [[cpa-learning:courses2:360017]]。わかったつもりで解けない所と読める。
- **k-sogo・k-shison**：講義では総合原価計算を厚く扱う（83〜106分）。下書きはボックス図 [[cpa-learning:column:experience-note]]。第5問はボックス図を描かずに解けるかを試す、という時短の主張もある [[cpa-learning:column:boki2-net-exam-measures]]。
- **k-hyojun**：講義は「非常に重要」と明示して約76分 [[cpa-learning:courses2:120005]]。
- **k-chokusetsu・k-cvp**：
  - 直接原価計算は、それまでの方法との違いを意識させる。CVPは利益目標に必要な売上から入る [[cpa-learning:courses2:120005]]。
  - 損益分岐点比率と安全余裕率の記事は、比率の関係（足すと100%）を誤って書いている [[cpa-learning:column:about-sonekibunkiten]]。
- **k-honsha**：本支店会計との類比で導入する [[cpa-learning:courses2:120005]]。
- **k-kessan**：製造業の会計は「工業の後に見よ」と注記して商業講座の最後に置く [[cpa-learning:courses2:30003]]。

### scope.js に無い、または薄いもの
- **CBTの操作規則そのもの**（5節の比較を参照）。scope.js の項目ではなく、検定会場の仕様として必要。
- **電卓操作**（GT・メモリー、月割の「÷12×月数」、利息の日数計算）[[cpa-learning:column:how-to-use-dentaku]]、[[cpa-learning:column:dentaku5]]。ゲームでは計算パッドの機能として考える。
- **証憑の実務**（領収書の日付・宛名・但し書き、控えの意味、収入印紙）[[cpa-learning:column:howtoget-ryousyuusyo]]、[[cpa-learning:column:hikae-ryousyuusyo]]、[[cpa-learning:column:recipt-inshi]]。2級の範囲外だが、PEDAGOGY 1.7 の証憑タップの素材になる。
- **経費精算システム**（名目から科目を自動で決める）[[cpa-learning:column:keihi-seisan-system]]。PEDAGOGY 1.6 の自動仕訳ルールと同じ発想。

---

## 3. 問われ方（コラムが伝える本試験の形）

- **配点と構成**：
  - 2級は第1〜3問が商業で各20点、第4問が28点、第5問が12点 [[cpa-learning:column:about-boki]]。第4問は(1)仕訳12点と(2)16点に分かれる。
  - 第1・4・5問の計60点を確実に取る戦略 [[cpa-learning:column:boki2-net-exam-measures]]。工業は型が安定していて稼ぐ問題 [[cpa-learning:column:pass-rate-decline]]、[[cpa-learning:courses2:240002]]。
- **第1問**：
  - 仕訳5題・各4点で部分点なし。1題2分以内が目安。
  - 問題文が長く、「本日」より前の経緯が書いてあるので、どの段階の仕訳かを読み分ける。取引を点でなく線として捉える。
  - 頻出は有価証券・純資産・リースを含む固定資産・債権債務 [[cpa-learning:column:boki2-net-exam-measures]]。
- **第2問**：受験者が「過去問と同じ水準のものが出るか」と最も不安になる大問 [[cpa-learning:courses2:240002]]。理論の穴埋めが出ることもある [[cpa-learning:column:about-boki3]]。
- **第3問**：未処理事項が見つかると、決算整理（引当金など）にも波及する [[cpa-learning:column:boki2-net-exam-measures]]。解答欄の科目の並びが手がかりになる [[cpa-learning:column:question-of-seisanhyo]]。
- **連鎖で崩れる**：前の答えを使って次を解く問題では、最初の誤りが全体に波及する（1級の記事だが、2級の第4・5問も同じ構造）[[cpa-learning:column:acceptance-rate-of-boki1]]。
- **CBTの操作規則**（複数の記事で一致）：
  - 勘定科目はプルダウンから選ぶ。候補は5〜6個で、使わない科目も混ざる [[cpa-learning:column:different-boki-test]]。
  - 同じ科目は借方・貸方でそれぞれ1回しか使えない（同じ側に2行書くと誤り）[[cpa-learning:column:boki2-net]]、[[cpa-learning:column:boki2-net-exam-measures]]。
  - 金額は半角数字だけで、カンマも「円」も付けない [[cpa-learning:column:careful-net-test]]、[[cpa-learning:column:the-test-day-of-boki3]]。
  - 問題文には書き込めず、配られる計算用紙（A4で2枚）に写す [[cpa-learning:column:careful-net-test]]、[[cpa-learning:column:test-goukaku]]、[[cpa-learning:column:the-information-for-boki3]]。
  - 結果は点数だけが表示され、どこを誤ったかは返らない [[cpa-learning:column:boki3-comparing-net-paper]]。合格証はデジタルで出る [[cpa-learning:column:certification]]。
- **難しさの源**：CBTの難しさは時間あたりの処理量で決まる [[cpa-learning:column:degree-of-difficulty]]。中心は全体像の理解を問う基本問題 [[cpa-learning:column:possibility-of-passing]]。難しい回は商業で新しい傾向が出たとき [[cpa-learning:column:information-boki2]]。
- **ミスの源**（[[cpa-learning:column:careful-test]]、[[cpa-learning:column:boki-notime]]）：
  - 「記号で答えよ」の見落とし
  - 端数処理（電卓の設定と問題の指示）
  - 月数の誤り
  - 単位の誤り
  - 同じ合計を何度も打ち直すこと
- **科目名の二層**：作業中は略記してよく、解答は正式名で書く [[cpa-learning:column:kanjokamoku]]。CBTでは科目が与えられて選ぶので、科目名を暗記する負担は小さい [[cpa-learning:column:information-for-internet-exam]]。

---

## 4. 2027年度改定への対応状況

- **講座は旧区分表のまま**：
  - 商業講義の債権債務の回は、前半が約束手形 [[cpa-learning:courses2:30003]]。
  - 固定資産②は除却・廃棄・滅失を2級として扱う（2027年度は除却・廃棄が3級の土台へ）。
  - リースの説明は取引のイメージだけで、使用権資産モデルへの言及はない。
  - 2027年度向けの撮り直しは、説明文からは確認できない。
- **コラム**：
  - 2級の範囲表を載せる記事（[[cpa-learning:column:what-is-boki2]]）は、手形・除却などを旧区分のまま載せている。
  - テキストは最新版を買え、という記事が改定の扱いに触れている [[cpa-learning:column:text-workbook]]。変わった所だけ差し替えて参考表示を残す、という scope.js の y27 の方針と同じ考え方。
  - 小切手を例に使う記事（[[cpa-learning:column:genkin-kabusoku]]、[[cpa-learning:column:important]]）や手形の内訳書を扱う記事 [[cpa-learning:column:uchiwake-meisaisyo]] は、2027年度の2級の例としては古い。
  - 売上原価対立法の3級移行に言及する記事は、担当範囲には見当たらない。売上原価の記事（[[cpa-learning:column:how-to-evaluate]]）は三分法の公式中心。
  - ファクタリングを直接扱う記事はない。3級の「債権の譲渡」に触れる程度 [[cpa-learning:column:what-is-boki3]]。
  - 新リース基準を扱う記事もない。
- **情報の信頼度**：試験日程・申込の記事は年度が古く、記述にも誤りがある [[cpa-learning:column:how-to-apply-boki2]]。試験情報は商工会議所の一次情報（出題区分表）で確かめる前提にする。
- **サイト内の矛盾**（どちらかに乗る前に一次情報や PEDAGOGY で判断する）：
  - 過去問は要らない（[[cpa-learning:column:teaching-material]]）vs 過去問をゴールとして早く見る（[[cpa-learning:column:how-many-hours]]）。
  - 商業と工業の順番：工業から（[[cpa-learning:column:pass-rate-decline]]）、交互に（[[cpa-learning:column:bookkeeping2-starting]]）、テキスト先行（[[cpa-learning:column:boki2-information]]）。
  - 必要な勉強時間：250時間（[[cpa-learning:column:what-is-boki]]）、講義利用で150〜350時間（[[cpa-learning:column:practice-time]]）。

---

## 5. ゲームへの反映案

### 5.1 検定会場（E56「検定会場の戦い方」、c47）
- **入力規則を本物どおりに**：
  - 科目はプルダウン（候補5〜6個、使わない科目入り）。
  - 同じ科目は同じ側に1回だけ。複数の取引を合算して1行にまとめさせる。
  - 金額は半角数字だけ。
  - 会場の最初に、得点に関係しない操作練習を1題置く [[cpa-learning:column:boki2-net]]、[[cpa-learning:column:careful-net-test]]。
- **計算用紙**：問題文へのマーキングは不可にし、計算パッドは「2枚」の枠に限る。限られた紙にタイムテーブルやボックス図を小さく書く技術が要るようになる [[cpa-learning:column:careful-net-test]]、[[cpa-learning:column:test-goukaku]]。
- **会場の下見**：解く前に、大問ごとの役割を地図として見せる [[cpa-learning:courses2:240002]]、[[cpa-learning:column:about-boki]]。
  - 第1問は配点が大きく部分点のない仕訳
  - 第3問は未処理から決算整理へ波及する
  - 第4・5問は工業で稼ぐ
- **振り返りで本物を超える**：本物のCBTは点数しか返さない [[cpa-learning:column:boki3-comparing-net-paper]]。ゲームでは誤答を3つに分類し、行き先を変える [[cpa-learning:column:todo-tertiary]]、[[cpa-learning:column:how-study]]。
  - 未習なら、該当する発見イベントへ
  - 忘却なら、間隔反復のやり直し依頼へ
  - 計算・時間なら、計算パッドの使い方へ
- **先輩の実演**：解答のあと、先輩が同じ問題を解く手順（読む順、計算用紙に何を書くか、どこで検算するか）を見せる [[cpa-learning:courses2:630033]]。
- **第1問の作り方**：「かねて〜していた」の経緯は、プレイヤーが物語で体験済みの取引にする。そうすれば、長文でも「本日」がどの段階かを読める [[cpa-learning:column:boki2-net-exam-measures]]。
- **解答欄を資料として使う**：精算表の解答欄に、整理事項の手がかりになる科目行を本試験どおり先に印刷しておく [[cpa-learning:column:question-of-seisanhyo]]。

### 5.2 エピソードへの対応づけ（数字・設定はオリジナルにする）
- **E00〜E02（屋台・株式会社化・もうけ）**：
  - ピヨが通帳の残高だけ見て「増えた＝もうかった」と言う。借入と売上が通帳では区別できない困りごとから二面性へ進む [[cpa-learning:column:the-difference-between-fukushiki-and-tanshiki]]。
  - 「銀行に見せないとお金が借りられない」を記録の動機にする [[cpa-learning:column:what-is-boki]]。
  - 社長がお店のお金で私物を買い、企業実体（P8）の名前カードを出す [[cpa-learning:column:information-about-boki]]。
- **E03・E06（大量仕入れ・大口注文）**：社長が値引きにつられて大量に仕入れる。P/Lは黒字なのに、支払日に現金が足りない [[cpa-learning:column:cost-of-sales-boki3]]。
  - オリジナル問題案：単価600円のレモンを通常の3倍の1,800個まとめて仕入れ（掛け、翌月末払い）、月の売上は900個×1,000円とする。月末の利益と、支払日の現金残高の差を試算させる。
- **E05（通帳と帳簿）**：現金過不足やレジの締めの不一致の原因を、証憑（印紙を受け取った領収書・控え）から探す後始末型の場面 [[cpa-learning:column:genkin-kabusoku]]、[[cpa-learning:column:hikae-ryousyuusyo]]。
- **E08（決算）**：
  - 期中に買ったトラックの償却で、月割を忘れると利益がずれ、銀行の評価に返る [[cpa-learning:column:boki-notime]]。
  - 累計額は「資産の箱の中のマイナスの箱」として見せ、「累計額は資産」という誤解を先回りして防ぐ [[cpa-learning:column:syokyaku]]。
  - 決算で残った印紙を数えて貯蔵品へ移す小さな発見 [[cpa-learning:column:information-for-syunyuinshi]]。
- **給料日（E13 または E24 の周辺）**：源泉所得税の理由選択で、誤答肢に「租税公課」を入れる（預り金と取り違える典型）[[cpa-learning:column:mistake]]。
- **E11（配当）**：社長が利益を全部配りたいと言う。準備金の積立額を「配当の10分の1」と「資本金の4分の1までの残り」の小さいほうで決める計算を、債権者保護の理由と一緒に体験させる [[cpa-learning:column:definition-of-joyokin]]。
  - オリジナル問題案：資本金800万円、資本準備金120万円、利益準備金50万円の会社が、繰越利益剰余金から400万円を配当する。配当の10分の1は40万円、資本金の4分の1（200万円）までの残りは30万円なので、積み立てるのは小さいほうの30万円。2つの値が同額になる設定は避ける。
- **E23（区分のある決算書）**：振込手数料・売却手数料など、区分の曖昧な費用をP/Lの行に並べ替えさせ、本業か・臨時かで判断する [[cpa-learning:column:how-to-analyze-pl]]。
- **E24（工場を建てる）**：建設会社から中間金の請求が来る。払ったお金はまだ使えない「建設仮勘定」の箱に入り、完成で建物の箱へ移る [[cpa-learning:column:the-information-for-deposit]]。同じレモネードを「仕入れていた」から「自分で作る」に変え、原価の中身が増える体験にする [[cpa-learning:column:bookkeeping2-starting]]。
- **E34（税効果）**：税務で今年は認められない費用が翌年以降に認められる。その時間のずれを期間の帯で動かし、払いすぎた税金が前払いの税金（繰延税金資産）になると発見させる [[cpa-learning:column:introduction-zeikouka-kaikei]]。
- **E35〜E45（工場編）**：
  - 講義・演習ともに費目別・製造間接費・部門別・総合に時間がかかる [[cpa-learning:courses2:120005]]、[[cpa-learning:courses2:510005]]、[[cpa-learning:courses2:360017]]。だから最初の数か月は、勘定連絡と配賦を手で動かす反復を厚くする。
  - 指図書別の集計（E41）と部門費配賦表（E40）は、月次締めで実際に埋めさせる。
  - 配賦率の最初の誤りが製品原価・売上原価・利益まで連鎖する様子を見せる [[cpa-learning:column:acceptance-rate-of-boki1]]。
  - 月次で原価を出す理由として、社長が年末まで原価を知らずに値付けして損をする場面を置く [[cpa-learning:column:the-information-for-syogyoboki]]。
- **E36（材料の単価）**：
  - 出庫票に売価と原価の両方が見える証憑を置き、払出に何を書くかを選ばせる（売価を書く混同を分かれ道にする）[[cpa-learning:column:the-way-of-evaluating]]。
  - 端数の指示がない移動平均で詰まる経験もさせる（問題文の端数指示を読む練習）。
- **E48〜E51（連結）**：講義は連結に2割をかけ、部分所有とアップストリームを独立した山にしている [[cpa-learning:courses2:30003]]。そこで E48 は全部所有、E49 は部分所有（非支配株主）、E50 はダウンストリームとアップストリームを別の月に分けて起こす。タイムテーブルを「操作できる部品」にする [[cpa-learning:column:experience-note]]。
- **E53（CVP）**：社長が「値下げで売上を倍に」と言い出す。分岐点比率と安全余裕率（足すと100%）を試算パネルで見せる [[cpa-learning:column:about-sonekibunkiten]]。記事にある比率の誤りは使わない。
- **与信の判断（E07・E19）**：取引先の決算書を読んで与信を決める（売上は大きいが利益が出ていない相手）[[cpa-learning:column:difficulty-of-boki3]]、[[cpa-learning:column:advantage-of-taking-boki2]]。

### 5.3 教え方の吸収（そのまま借りずに置き換える）
- **「制度の背景→取引の絵→仕訳」の順**（講義説明文）は、4拍の1〜2拍目に置き換える。背景は社長や銀行の困りごととして出す。
- **原則・容認・並列の書き分け**（[[cpa-learning:column:my-text]]）は、先輩の手帳の名前カードで「原則」「選べる」の印として見せる。並列規定は、判断の場面（選ぶと何が変わるか）にする。
- **誤りを書き残す**（[[cpa-learning:column:mistake]]）は、分かれ道の記録として自動化する。「どこで、何と取り違えたか」を残し、直前に印の束として一覧で見直せるようにする [[cpa-learning:column:last-3days]]。
- **間隔反復**：翌日・3日・1週・2週の間隔（[[cpa-learning:column:practice-time]]）は、やり直し依頼の間隔の初期値にする。ゲーム内の時間（月）に換算して調整する。
- **語呂合わせ**（[[cpa-learning:column:how-to-evaluate]]）は、PEDAGOGY の禁止（意味のない暗記）にあたるので使わない。売上原価は箱の運搬操作で作らせる。
- **入門記事の誤り**（引当金＝準備したお金、累計額＝資産、資本金に利益を含める）は、初学者の誤解そのもの。理由選択の誤答肢の候補として使う [[cpa-learning:column:how-to-memorize]]、[[cpa-learning:column:syokyaku]]。
- **市販教材との差**：市販教材の「楽しさ」は、キャラクター・漫画・物語を読ませる方向にある（[[cpa-learning:column:fifteen-textbooks-for-boki2]]、[[cpa-learning:column:10-textbooks]]、[[cpa-learning:column:7-websites]]）。判断が結果に返る双方向性はない。ここがゲームの差別化点になる。

---

## 6. 既存の問題（js/data）との比較

- **c47「本試験の戦い方」**：ネット試験の画面（科目は候補から選ぶ、カンマ不要、画面に書き込めない）は扱っている。足りないのは次の点。
  - 同じ科目は同じ側に1回だけ、という規則と、それに伴う合算の練習（[[cpa-learning:column:boki2-net]]）。c47 の「同じ科目」の記述は、下書きの話にとどまる。
  - 計算用紙は2枚という制限 [[cpa-learning:column:careful-net-test]]。
  - 結果は点数だけ、という本物の仕様と、ゲームの振り返り（誤りの3分類）との対比。
  - c47 の例「候補に保証債務費用があれば手形の裏書・割引」は、2027年度の2級では出題外の手形が前提になっている。y27 の方針に合わせて例を差し替える必要がある（例：候補に「電子記録債権売却損」があれば、債権の割引・譲渡を疑う）。
- **未達取引**：w6.js の本支店会計の課に未達取引の整理が残っている（範囲外の注記つきで、模試には出さない扱い）。outOfScope2 の方針と整合しているので問題はない。講義説明（[[cpa-learning:courses2:30003]]）にも未達は出てこない。
- **下書きの型**：js/data に「タイムテーブル」の語はない。連結（w7・exam2）で時系列の下書きを部品として使わせる問題がない。ボックス図は exam45c・w9 にある。体験記の決め手（型の反復）に照らすと、連結の下書きの練習が足りない [[cpa-learning:column:experience-note]]。
- **部分所有**：「部分所有」の語はないが、非支配株主は w7・exam2 にある。講義のように「全部所有→部分所有」を段階として分けて出しているかは要確認 [[cpa-learning:courses2:30003]]。
- **端数・解答形式の指示**：「円未満」の指示は w4 だけで、「記号で答えよ」型の問いはない。指示を読み落とすミスを点検する問題を検定会場に足す [[cpa-learning:column:careful-test]]。
- **準備金の積立計算**：準備金の語は多くの章にあるが、「4分の1までの残り」と「10分の1」の比較を問う形の問題が十分にあるかは要確認（「4分の1」の文字列はない）[[cpa-learning:column:definition-of-joyokin]]。
- **CVP**：安全余裕率・分岐点比率は exam45b・w9 にある。両者が足して100%になる関係を理由選択で問う形は、追加の候補。
- **源泉の預り金**：w3・w5・w8・w9 にある。誤答肢に租税公課を入れているかは各問を要確認 [[cpa-learning:column:mistake]]。
- **第3問の波及**：未処理事項が決算整理に波及する形（売掛金の回収漏れ→貸倒引当金）は、c47 の解説に1行ある。exam2c3c などの第3問で、波及を明示的に問う設問を増やす余地がある [[cpa-learning:column:boki2-net-exam-measures]]。
- **工業の演習量**：演習解説で時間がかかる個別原価計算・部門別・工場の決算 [[cpa-learning:courses2:360017]] について、w8・w9・c46 の問題数が講義相当の論点（材料費・総合）より少なくないかを点検する。
