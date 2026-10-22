<!-- quality:v2 -->
# 経営シム・飲食シムはなぜ長く遊ばれるのか、なぜ安っぽく見えないのか（BIZ-FUNVISUAL）

版：0.2（2026-10-22）。書き手：調べもの担当（経営シムの面白さと表現）。読み手：DESIGN-RAMEN を改訂する設計者（Fable）、オーナー、取りまとめ役。
版0.2 は書き直し。事実の判定書 `docs/audit/BIZ-FUNVISUAL-audit.md`（判定アウト）と論証の検査書 `docs/audit/BIZ-FUNVISUAL-reasoning.md`（結論77件のうち妥当37・弱い26・不当15）の両方の直しの依頼に従った。直した箇所には判定書の番号（例：判3.2-6）と検査書の番号（例：K27）を書いた。対応の一覧は「依頼の対応表」。
**この版で足した調べ**：利用者の声を 100件→**778件**（6作品、Coffee Inc 2 の135件を含む。全ページを読んだ）、画面写真を **15の資料で目で見た**（3.0.1）、ラーメンの手元の有報・決算短信を読み直して変数を 53→**74**個。
**印**：【推論】＝資料に書いていない、私の筋道。【見立て】＝私が付けた値（数え方は書く）。【要確認】＝試作・試遊で確かめるもの。【資料なし】＝探した場所を書いたうえで、当たれなかったもの。
**出典の書き方**：`[[取得元:集合:文書|「語句」]]`。語句は原文にそのまま出る4〜20字で、その主張の根拠の箇所を指す（QUALITY 6.2-1）。声・相関・優先順の点数は `docs/analysis/` のスクリプトで数えた（QUALITY 6.2-2）。

---

## 0. 要点（ここだけ読めば改訂に入れる）

1. **長く遊ばれる経営シムの芯は「作る自由」＋「やれることの多さ・深さ（変数の数と、店の外まで広がる事業）」＋「毎回変わる条件」**。版0.1 の「変数の数より絡み方」は撤回する（K01・K27・判1章-3）。理由：版0.1 が反例に使った2作の原文が逆を言っていた。Startup Company の評者は、見張る値が数十あるのを好む人には [[web:simgames:r5-fv-gamesasylum-startup|「certainly appeal」]] と書き、欠点は [[web:simgames:r5-fv-gamesasylum-startup|「lack of character」]] だった。Lemonade Tycoon の飽きの理由は [[web:simgames:r5-fv-pocketgamer-lemonadetycoon|「less variety」]]（中身の少なさ）だった。数と絡みを切り分けて測った資料はない。資料は両方を支持する（1.15 の表で支持14・反対11を並べた）。
2. **オーナーの仮説（豆・土地・生産・不動産・商品開発のような「実際のビジネスの変数」がスルメの源）は、条件つきで支持される**。一番近い作品 Coffee Inc 2 の声135件を全部読むと、店の外の事業（株・不動産・融資・上場・豆の栽培・買収）を楽しむ声が22件、もっと欲しがる声が18件で、どちらかを言う件は37件（27%）。例：[[web:simgames:r4-cinc-applion-reviews|「コーヒー豆の自家栽培」]]、[[web:simgames:r4-cinc-applion-reviews|「別業種のM&A」]]、[[web:simgames:r5-cinc-applion-p4|「垂直統合可能な産業」]]。条件は2つ。①店の遊びを食わないこと（前作は [[web:simgames:r5-cinc-applion-p2|「面白くなかったのですが」]] と、投資会社になってしまうと言われた）。②規模が出たときの一覧と委任（Coffee Inc 2 の不満の最多は一覧・操作の N で36件）。Capitalism Lab は開発元自身が [[web:simgames:r5-fv-capilab-home|「Land Plots」]] や子会社の [[web:simgames:r5-fv-capilab-home|「Merging Subsidiary」]] を機能の見出しに並べる（1.14）。
3. **だれる理由は3つ**：①上限に達して目標が消える、②効きの小さい変数が触られなくなる、③**中身（新しい選択・変数）が尽きる、解放の谷**（K04）。版0.1 の「作った物が絵にならない」はだれの理由ではなく、「無個性・安っぽい」の理由なので鎖C に移した。声の L1（中身の谷・やることがなくなる）は20件、L2（目標の消失）13件、L3（作業感）19件。
4. **安っぽく見えない作品は、規則（設計の言語）を決めたうえで、主役（作った物・人・店）に絵と動きと音を厚く重ねている**。版0.1 の「規則を決めて削る」は撤回する（K06・K36・判3.2-2）。Mini Metro の兄弟は絵と音に [[web:simgames:r5-fv-wiki-minimetro|「hired external help」]] し、発売の遅れの一因は絵の [[web:simgames:r5-fv-wiki-minimetro|「graphical overhaul」]]、音で [[web:simgames:r5-fv-wiki-minimetro|「Excellence in Audio」]] を取った。Two Point の美術の人は [[web:simgames:r5-fv-cgm-twopoint|「That layering」]]、別の聞き取りで画面の密度が [[web:simgames:r5-fv-pcgi-twopoint|「much higher」]] と言う。カイロソフトは [[web:simgames:r4-sim-denfami-kairosoft|「それなりの絵でもカッコイイ」]] と、見栄えを視点（クオータービュー）の側に置く。私が画面写真を見た13作（3.0.1）でも、Coffee Inc 2・Capitalism Lab・Big Ambitions は店の外の事業（売り物件・貸し物件・銀行・輸入）を**地図の上の印や色で見せていた**。
5. **利用者の声 778件（6作品）を1件ずつ符号にした**（2章、`docs/analysis/funvisual-voices.js`）。符号の多い順（1件が複数に入る）：C2「ハマった・時間を忘れた」の結果の言葉 183、W「やれることの多さ・奥の深さ」109、J2「買い切り・課金や広告が少ない」96、A1「自分で作る・組む自由」83、K「作り手への信頼」79、J1「せかされない」70、R「不具合」70、V「配信・動画で知った」68。版0.1 の「一番多い褒めは少しずつ上がる数字」は撤回する（K11）。数字の伸びを具体に言う C1 は44件で、C2 の4分の1。**載っている口コミはほぼ★5の選ばれたもの**で、ページ上部の全体の分布では、買い切りのラーメン館は★3以下が53%、グルメ食堂は38%（K10）。
6. **予告のない小さな事故（仕入れの腐敗・故障・欠勤）は入れる**（K71・K77）。版0.1 の「捨てた案」から戻す。条件は3つ：**両方向に揺れる**（良い出来事もある）／**起きた後に対処の手がある**／**起きやすさを自分の判断で下げられる**。根拠の声の直し方が [[web:simgames:r5-fv-applion-gamedevstory|「良い方向に起こるイベント」]] だった。予告のない揺れを好む声もある（[[web:simgames:r5-fv-applion-gamedevstory|「社員の努力が乱数」]]、[[web:simgames:r5-fv-applion-goodpizza|「機械の故障とかある」]]）。オーナーの例示「仕入れた食材が腐ってたから廃棄」もこの形で入る（4章 #60）。すごろく型の寄り道も、同じページの声3件のうち2件が好意的だったので捨てない（K72）。
7. **ラーメン屋で動かせる変数は74個**（4章）。足したのは、版0.1 にない系：資金調達・M&A・自社の農地と生産・物流と倉庫・好みの選択・自動調理・持ち帰りと配達・社長の個人保証・製麺所との関係・副業・不動産の賃貸。オーナーの例示（土地取得・生産・副業の不動産・商品開発）は、それぞれ現実の原文2本以上と作品1本以上で裏づけた（4.9）。
8. **ピヨ商店に取り入れる優先順**（5章。点数の付け方を先に決め、`docs/analysis/funvisual-priority.js` で並べた）：1位「毎回変わる町・相手・相場と周回の持ち越し」、2位「店・一杯・客を絵にする（絵と音の作り手を置く）」、3位「店の外の事業の変数と、店→会社へ段が変わる形」、4位「一杯の組み立て＋名づけ（現実に沿って当てられる相性）」、5位「客の個性と物語」。版0.1 の順（1位 隠れた相性、2位 設計の言語）との前後の表も載せた（K53）。

---

## 問いの設計

版0.1 には「ビジネスの変数の多さそのものが長く遊ばれる源か」を切り分ける問いがなかった（判2章の問いの行）。オーナーの原文の「そういう考察にいくつくような調査出なかったのだとしたらそもそもの考察・調査設計に疑問」に応えて、問い4・5を足した。

**問うたこと（肯定側と否定側）**
| # | 肯定側の問い | 否定側の問い | ゲームの目的との関係 |
|---|---|---|---|
| 1 | なぜ長く遊ばれるのか。変数の数と深さ、絡み、解放の順、目標、運と予兆、ライバル、周回の動機のどれが効くのか | なぜ飽きられるのか。どこでだれ、何が作業になるのか | 面白さ・自由度 |
| 2 | 少人数の作品は、なぜ安っぽく見えないのか。何を足し、何を削ったのか（作品ごとに両方） | なぜ「無個性」「見た目が一覧」と言われるのか | 表現（オーナーの「チープすぎる」） |
| 3 | ラーメン屋で動かせる変数は何か（現実と作品の両方から） | 効きが小さくて触られなくなる変数、支配的な答えができる変数はどれか | リアリティと自由度 |
| 4（足した） | **店の外の事業の変数（資金・不動産・土地・生産・M&A・別業種・副業・商品開発）が多いこと自体が、長く遊ばれる源か**。どの作品で、どの変数が、いつ開き、何と絡むから効くのか | 変数を足しても続かなかった例はあるか。店の外の事業が店の遊びを食った例はあるか | オーナーの例示そのもの。2級の論点（社債・リース・連結・固定資産）にも近い |
| 5（足した） | 変数を足す更新・DLC で遊ばれ続けた例の中身と声 | 足して複雑になりすぎた例 | 周回と寿命 |
| 6（足した） | 前の版の調べと分析が浅くなった傾向は何で、どう防ぐか（オーナーの「傾向と対策」） | — | この報告の信頼 |

**傾向と対策（問6への答え。この版で実際にしたこと）**
| 前の版の傾向 | この版の対策 |
|---|---|
| 手元の原文のうち、作り手の労力が減る側の材料だけで結論を組んだ（判1章、K06・K27・K53） | 結論ごとに論証の表で反対の事実と別の解釈を2つ以上書いた。仮説の表（1.15）で両側の事実を先に並べ、結論は表の後に書いた |
| 1ページ目の20件だけを読み、偏りを「読めない」と書いた（判3.1） | 全ページ（6作品・計45ページ・778件）を読み、星の分布をスクリプトで出した |
| 分類の名前が中身を大きく見せた（K11） | 符号を小分けにし（C1 と C2、A1〜A4 など）、件ごとの符号をファイルに残した |
| 【資料なし】で変数を捨てた（判3.4） | 手元の有報・決算短信（ギフト・力の源・山岡家・幸楽苑）を通読し、探した場所を書いたうえで残りだけを【資料なし】にした |
| 画面を見ずに画面の型を決めた（判3.5） | 15の資料の画面写真を目で見て、3章の各項目に「見た／文章だけ」の列を付けた |
| 資料にない語を資料の名で書いた（判3.2-5・10・11・13） | すべての出典に原文の語句を付け、`research-check` で原文に出るかを確かめた |

**問わなかったこと**
- Coffee Inc 2 の作品の分析そのもの（別の担当の BIZ-COFFEEINC2）。ただし比較の材料として、原文（口コミ7ページ・攻略の記事）を自分で読み直して引いた（判3.3-1。又引きはしない）。
- 各作品の需要の式の数値（BIZ-SIMDESIGN の領分）。
- 課金・スタミナの設計（PEDAGOGY 1.8 で使わない。声に出るものは数えた）。

---

## 資料の内訳

この版で引いた資料を種類で分けた（読了ノートのあるもの。数え方：`[[…]]` で引いた文書を種類ごとに数えた）。

| 種類 | 本数 | 中身 |
|---|---|---|
| 作り手の話・公式の資料（聞き取り・開発元のブログ・公式サイトと手引き・講演の紹介） | 17 | Greenheart のブログ、Soren Johnson の聞き取り（Offworld）、Capitalism Lab の公式4本（手引き2・戦略・トップ）、Two Point の開発者2本、Good Pizza の CEO、Cook Serve Delicious の作者、Mini Metro の講演の紹介、放置ゲームの数学2本、カイロソフトの社長の聞き取り（電ファミ）、Meier の講演の記事、Hovgaard・Mohawk の公式ページ、Big Ambitions の開発者の聞き取り2本 |
| 利用者の声（全件を符号にしたもの） | 45ページ（**778件**） | APPLION の App Store の口コミ：ラーメン館（買い切り）1・全国編10・グルメ食堂2・発展国++10・グッドピザ10・Coffee Inc 2 7 ページ |
| 記者の評（評者の判断があるもの） | 9 | Pocket Gamer 2本、Digitally Downloaded、Games Asylum、CGMagazine、Sixth Axis、AppBank、MoguLive、AUTOMATON |
| 配信の知らせ（プレスリリースの転載。評者の判断はない） | 3 | Game*Spark・電ファミ・ファミ通のラーメン館の記事（判3.2-9・19 で記者の評から移した） |
| 集約サイトの紹介文 | 6 | APPLION の作品ページ（紹介文・良い点と気になる点の箇条。書き手はサイト） |
| 攻略の記事（遊んだ人の二次資料） | 8 | Coffee Inc 2 の Applizm の記事、Big Ambitions の GamesFuze の記事 2本 |
| 開発者の寄稿の論考 | 5 | 物語の外骨格、ジュース、経営ゲームの平凡な深さ、Tynan、Tufte のスパークライン（Tufte は情報デザインの第一人者のサイトの議論） |
| **研究（査読のある論文・学術書）** | **0** | 版0.1 で「研究・論考 4」と書いたのは誤り（判3.2-19）。学術の研究には当たっていない（やっていないこと） |
| 百科事典 | 9 | Wikipedia：カイロソフト（英・日）、Lemonade Tycoon、Game Dev Tycoon、Offworld、Two Point Hospital、Good Pizza、Cook Serve Delicious、Mini Metro |
| 画面写真（目で見たもの） | 15の資料に付いた画像 | 3.0.1 の表 |
| 現実の一次資料（有報・決算短信・決算説明・統計・公的な手引き） | 18 | ギフト HD の有報、力の源 HD の決算短信、山岡家・幸楽苑の決算説明、日本政策金融公庫の開業の調査、J-Net21 の開業の手引き、農水省の小麦と郷土の食、JETRO、帝国データバンク・東京商工リサーチ、冷凍食品協会、福岡市の屋台 ほか |
| 反対意見・不満が中心のもの | （上に含む） | Games Asylum（Startup Company）、Pocket Gamer（Lemonade Tycoon）、Digitally Downloaded（Game Dev Tycoon。総評は [[web:simgames:r5-fv-digdl-gamedevtycoon|「mixed bag」]]）、経営ゲームの平凡な深さ、★1〜3 の分布 |

- 1種類が全体の半分を超えたものはない。
- **偏り**：声 778件のうち、カイロソフト4作のページが443件（57%）。日本の App Store だけで、英語圏の利用者の声（Steam・Reddit）は規約で取れない（`research/site-policy.json` で no-automation）。
- 現実の一次資料は、BIZ-RAMEN の担当が取得した原文を、この版で私が読み直して引いた（ノートは BIZ-RAMEN の担当のもの。引いた語句は原文で確かめた）。版0.1 で「BIZ-RAMEN 25本のうち23本」と書いたのは誤りで、引いていたのは22本（判3.2-20）。

---

## 1. 作品ごとの分析（13作品＋比較1）

すべて同じ8つの軸で書いた：**変数（数と深さ）／絡み／解放の順／目標／運と予兆／ライバル／周回の動機／表現**。最後の行に、その作品から抜く**型**を書いた。表現の行の「（見た）」は画面写真を自分で見た所、「（文章）」は文章の記述だけの所（3.0.1）。

### 1.1 こだわりラーメン館（カイロソフト。買い切り版と全国編）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 麺（加水率まで）、スープ（材料の組み合わせ）、タレ、具とその置き方、値段、材料費、店員の能力と育成、店内の配置と設備、販売エリア（全国編は都道府県）、大会、ライバル店、常連 | [[web:simgames:r5-fv-mogura-ramenkan|「VTuber」]] [[web:simgames:r5-fv-applion-ramenkan-app|「ラーメン作りの自由度が高く」]] |
| 絡み | 一杯の値→客数→売上と経験→新しい食材と店員→一杯の値、の輪。値段を下げると客が増えて利益が減るので材料費を下げる、という三つ巴を声が語る | [[web:simgames:r5-fv-applion-ramenkan-zenkoku|「材料費をdown」]] |
| 解放の順 | 食材・店員・エリアが順に開く。新しい食材までの谷がある | [[web:simgames:r5-fv-applion-ramenkan-zenkoku|「虚無期間」]] |
| 目標 | 行列・大会・日本一・テーマパーク（配信の知らせの文で、評者の判断ではない） | [[web:simgames:r5-fv-denfami-ramenkan|「日本一のお店をめざし」]] |
| 運と予兆 | 一杯の評価が予想とずれる。全国編のすごろくは運が強いが、声3件のうち2件は好意的（K72） | [[web:simgames:r5-fv-applion-ramenkan-zenkoku|「雑仕様でマゾいけど」]] [[web:simgames:r5-fv-applion-ramenkan-zenkoku|「ワクワク感があります」]] |
| ライバル | 近くに出て客を奪う。共存・買収・引き抜きができないことが不満 | [[web:simgames:r5-fv-applion-ramenkan|「ライバル店の買収」]] |
| 周回の動機 | 二周目に入る声がある | [[web:simgames:r5-fv-applion-ramenkan-app|「二周目に突入しました」]] |
| 表現 | （見た）クオータービューのドット絵の箱庭で、店を断面で切り、カウンターの客・厨房・外の行列・隣のビルまで描く。客の上に吹き出し、売上の札が浮く。宣伝の絵は丼を大きく描いて具を周りに散らす。（文章）丼に具を置く画面は配信の知らせの文で「最大のポイント」と書かれる（評者の判断ではない。判3.2-9） | [[web:simgames:r5-fv-applion-ramenkan-app|「行列の出来るラーメン店」]] [[web:simgames:r5-fv-gamespark-ramenkan|「最大のポイント」]] |
| 評価の分布 | 買い切り版は平均3.4で★3以下が53%。全国編は4.4で13%（2章） | [[web:simgames:r5-fv-applion-ramenkan|「こだわりラーメン館」]] |
| **抜く型** | 一杯を組み立てる画面と経営の数字をつなぐ輪。名前をつける自由。段の目標。運の強い寄り道も谷の時期の息抜きになる | |

### 1.2 大盛グルメ食堂（カイロソフト）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 基の料理×食材（最大2つ）、値段・味・魅力、食材の集め方、設備、ホールと調理の人、2号店・3号店 | [[web:simgames:r5-fv-appbank-gurume|「食材を最大二つ選びます」]] |
| 絡み | 食材がないと開発できず、店が伸びない。食材探しにお金が要るので手元に現金を残す理由ができる | [[web:simgames:r5-fv-appbank-gurume|「食材をいかに探すか」]] |
| 解放の順 | 最初の数品→開発で品数→食材の店と経営計画→2号店 | [[web:simgames:r5-fv-applion-gurume-app|「多店舗経営に挑戦できる」]] |
| 目標 | 人気の店・多店舗（版0.1 の「地域一番」は原文にない語なので消した。判3.2-10） | [[web:simgames:r5-fv-applion-gurume-app|「レシピ開発や食材探し」]] |
| 運と予兆 | （見た）料理の開発の窓で、店員の顔と一緒に「何ができそうか」の一言が出る＝結果を前もってほのめかす。サービスの提案は運だと集約サイトの紹介文 | [[web:simgames:r5-fv-applion-gurume-app|「サービスの提案がランダム」]] |
| ライバル | 【資料なし】（読んだ紹介文・声・記事に出てこない） | |
| 周回の動機 | 声23件のうち周回の I は1件 | [[web:simgames:r5-fv-applion-gurume|「大盛グルメ食堂」]] |
| 表現 | （見た）表の形の窓（項目名・小さな絵・星の数）、背景に店の箱庭が見えたまま。（文章）温かいドット絵 | [[web:simgames:r5-fv-applion-gurume-app|「温かみのあるグラフィック」]] |
| 評価の分布 | 平均3.6で★3以下が38%（2章） | |
| **抜く型** | 短い組み合わせと「何ができそうか」の一言。食べ物の絵 | |

### 1.3 ゲーム発展国++（カイロソフト）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 作るゲームのジャンル×内容×機種、社員の職種・能力・転職・育成、受託、研究の点、機種のライセンス、自社の機種、作品名・会社名 | [[web:simgames:r5-fv-applion-gds-app|「多彩な職業システム」]] [[web:simgames:r5-fv-applion-gds-app|「新規ハードや転職システム」]] |
| 絡み | 組み合わせの相性は表に出ず、結果から推す。ただし声には「実在の物を参考にすれば当たる」（見える相性）もある | [[web:simgames:r5-fv-applion-gamedevstory|「参考にしていれば大体正解」]] |
| 解放の順 | 機種のライセンス→大きな予算→ハード開発。だれた頃にハード開発で熱が戻る声 | [[web:simgames:r5-fv-applion-gds-app|「ハード開発や新ジャンルの追加」]] |
| 目標 | 年1回の大賞（グランプリ）。取った喜びを語る声 | [[web:simgames:r5-fv-applion-gamedevstory|「グランプリを獲得」]] |
| 運と予兆 | 予告つきの賭け（主力の機種が数か月後に販売停止と知らされ、全額を新機種に賭けた）。予告なしの停電・故障は嫌われたが、直し方の要望は「良い方向の出来事も」。乱数の揺れを楽しむ声もある | [[web:simgames:r5-fv-applion-gamedevstory|「3ヶ月後に販売停止」]] [[web:simgames:r5-fv-applion-gamedevstory|「良い方向に起こるイベント」]] [[web:simgames:r5-fv-applion-gamedevstory|「社員の努力が乱数」]] |
| ライバル | 続編を作る途中で似たゲームを出される出来事 | [[web:simgames:r5-fv-applion-gamedevstory|「ゲーム発展国」]] |
| 周回の動機 | 声200件で I（周回・再訪）29件、L2（目標の消失）10件 | （2章の表） |
| 表現 | （見た）上に年月週と所持金、下に進み具合と能力の点・期待度・知名度の帯、真ん中に人を選ぶ窓（顔の絵・能力の数字・費用・一言）、窓の後ろに事務所の箱庭。（文章）頭上の顔文字と吹き出しで社員の状態が分かる | [[web:simgames:r5-fv-pocketgamer-gamedevstory|「speech bubbles」]] |
| **抜く型** | 名前の入力＋浮き沈みを起こす仕組み＝物語の外骨格。予告つきの大事件と、両方向の小さな揺れ。頭上のアイコン | |

### 1.4 Game Dev Tycoon（Greenheart Games）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 題材×ジャンル×機種×客層、開発の配分、設計と技術の2本の軸、社員の向き、研究、事務所、研究所 | [[web:simgames:r5-fv-digdl-gamedevtycoon|「research tasks」]] [[web:simgames:r4-sim-gdt-modapi-topics|「genre」]] |
| 絡み | 組み合わせの重みは 0〜1 の値で持つ（改造の手引きの検査）。重みを掛け合わせて全体が決まるかは原文になく、版0.1 の「掛け算」は【推論】（判3.2-17） | [[web:simgames:r4-sim-gdt-modapi-checks|「checkGenreWeightings」]] |
| 解放の順 | ガレージ→事務所→研究所（場所が変わる節目） | [[web:simgames:r5-fv-wiki-gamedevtycoon|「starts out in a garage」]] |
| 目標 | 期限の中で会社を育てる。「期限が早く来る」と言った利用者は **many players**（「一番多い」ではない。判3.2-8） | [[web:simgames:r5-fv-greenheart-onemonth|「Many players」]] |
| 運と予兆 | 型破りな組み合わせは罰せられる。一方、無責任な判断を罰することは長所と書かれる | [[web:simgames:r5-fv-digdl-gamedevtycoon|「not afraid to punish」]] |
| ライバル | 【資料なし】（読んだ記事・百科・ブログに出てこない） | |
| 周回の動機 | 最初の数周は研究の無駄打ち。改造で中身を足す人がいる | [[web:simgames:r5-fv-wiki-gamedevtycoon|「Mods」]] |
| 評価 | 総評は厳しい（[[web:simgames:r5-fv-digdl-gamedevtycoon|「mixed bag」]]、[[web:simgames:r5-fv-digdl-gamedevtycoon|「not particularly fun」]]）。PC 版の Metacritic は 68 [[web:simgames:r5-fv-wiki-gamedevtycoon|「Metacritic」]]。版0.1 は「長く遊ばれる」側にだけ置いていた（判3.3-8） | |
| 表現 | （見た）事務所の3D の箱庭の上に、雑誌の評の窓（大きな点数の数字と一言）。社員の名と役が床の上に斜めの文字で書かれ、右上に売れ行きの小さな棒グラフ | （画面写真：r5-fv-digdl-gamedevtycoon の part shot1） |
| **抜く型** | 設計と技術の2本×人の向き。場所が変わる解放。評の大きな数字の窓 | |

### 1.5 Lemonade Tycoon（Jamdat）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | レシピ（氷・レモン・砂糖）、値段、場所（家賃と人気が違う）、宣伝、設備、日払いの人、天気、ニュース。8つ | [[web:simgames:r5-fv-wiki-lemonadetycoon|「decide on a recipe」]] |
| 絡み | 満足すると客が戻る。人気と満足は場所ごとで、移ると持ち越さない | [[web:simgames:r5-fv-wiki-lemonadetycoon|「weather and news」]] |
| 解放の順 | 歩道→公園・街・浜辺 | [[web:simgames:r5-fv-pocketgamer-lemonadetycoon|「at the beach」]] |
| 目標 | 期限なし／30日／選手権 | [[web:simgames:r5-fv-wiki-lemonadetycoon|「Lemonade Tycoon」]] |
| 運と予兆 | 予報は外れる。見出しが売上を動かす | [[web:simgames:r5-fv-wiki-lemonadetycoon|「weather and news」]] |
| ライバル | なし | |
| 周回の動機 | 弱い。1週間ほどで平らになる。理由は**中身の少なさ**（K04） | [[web:simgames:r5-fv-pocketgamer-lemonadetycoon|「fall a little flat」]] [[web:simgames:r5-fv-pocketgamer-lemonadetycoon|「less variety」]] |
| 表現 | （見た）記事の画像は題名の絵だけで、遊びの画面は見ていない。（文章）客が通り、吹き出しで味や値段の感想を言う画面。眺める画面は数日で飛ばされる | [[web:simgames:r5-fv-pocketgamer-lemonadetycoon|「security」]] |
| **抜く型** | 客の吹き出しで「なぜ売れたか」を伝える。**反面教師**：場所を開いても中身が足りなければ1週間で飽きる | |

### 1.6 Offworld Trading Company（Mohawk Games）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 資源は**13**：地面から掘る5（水・アルミ・鉄・ケイ素・炭素）と、建物で作る8。お金は別（版0.1 の「作る7・お金」は誤り。判3.2-7）。地面の埋まり方、建物、売買、闇市場、自社株と他社株 | [[web:simgames:r5-fv-wiki-offworld|「There are 13 resources」]] |
| 絡み | 値段は全員の売買で動く1つの値。買値と売値を分けていた試作を1つにしたら市場が強くなった。作り手は次に資源の木を深くしたいと言う | [[web:simgames:r5-fv-matchstick-offworld|「a single price」]] [[web:simgames:r5-fv-matchstick-offworld|「deeper resource tree」]] |
| 解放の順 | 1試合の中で本部→採掘→加工→株 | [[web:simgames:r5-fv-matchstick-offworld|「Offworld」]] |
| 目標 | 全社の過半の株を買う | [[web:simgames:r5-fv-wiki-offworld|「majority stake」]] |
| 運と予兆 | 闇市場は買うと値上がりし、相手に備える機会を与える | [[web:simgames:r5-fv-wiki-offworld|「black market」]] |
| ライバル | 同じ市場で売買する AI と人。買収される会社は子会社として稼ぐ | [[web:simgames:r5-fv-wiki-offworld|「hostile takeovers」]] |
| 周回の動機 | 毎回違う地図と相手 | [[web:simgames:r5-fv-mohawk-offworld|「changing economy」]] |
| 表現 | （見た）赤茶の地形を静かに置き、会社ごとの建物を色の違う光の縁で囲む。資源の小さな立方体が地面に散る。（文章）速さの段・停止中の命令 | [[web:simgames:r5-fv-matchstick-offworld|「multiple game speeds」]] |
| **抜く型** | 共有の相場。手作業を自動にして判断を市場に集める。予兆つきの妨害と買収 | |

### 1.7 Capitalism Lab（Enlight）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 街ごとの賃金・地価・人通り、原料・農場・工場・店・研究所、輸入、卸、品目ごとの評価の重み、研修、役員、借入・株式、陳腐化。DLC と更新で、土地の区画、集合住宅と商業ビル、子会社（IPO・合併）、市の経済（政府の側・政党）、デジタルの会社、未公開会社の買収 | [[web:simgames:r5-fv-capilab-beginners|「comes from branding」]] [[web:simgames:r5-fv-capilab-home|「Land Plots」]] [[web:simgames:r5-fv-capilab-home|「Private Company」]] |
| 絡み | 品目ごとに効く手が違い、重みは手引きと画面で**見せる**（「見えない相性」ではない。判3.2-1）。電子部品は21品に使え、次の行き先が見える | [[web:simgames:r5-fv-capilab-beginners|「21 different products」]] |
| 解放の順 | 単純な分野から始め、信用を得て社債、研究の重い縦の統合へ、という順の戦略 | [[web:simgames:r5-fv-capilab-strategies|「Real Estate」]] |
| 目標 | シナリオの目標値、品目の分類を押さえること | [[web:simgames:r5-fv-capilab-strategies|「strateg」]] |
| 運と予兆 | 地図は毎回違う。後継の品が出ると需要が数年かけて移る | [[web:simgames:r5-fv-capilab-beginners|「obsole」]] |
| ライバル | 性格の違う競合を観察で見分ける。（見た）企業の一覧で、各社に顔写真とロゴと36か月の利益の小さな線 | [[web:simgames:r5-fv-capilab-monopolistic|「monopol」]] |
| 周回の動機 | 開発元が載せる推薦文は、終えた後に初めからやり直して別の製品と戦略を試すと語る（売り手が選んだ文） | [[web:simgames:r5-fv-capilab-home|「It never gets boring」]] |
| 表現 | （見た）製造の手引きは部品から完成品への流れを箱と線で描き、品質の重み（生産技術と原料の割合）を棒と数字で見せる。右に街の俯瞰が常に見え、建物は密に描き込まれる。（文章）地価と人通りの色の重ね表示、需給の棒 | [[web:simgames:r5-fv-capilab-beginners|「is high value」]] |
| **抜く型** | 品目ごとの重みを見せる。土地・不動産・子会社・買収を同じ会社の中の事業として持つ。表の各行に小さな線 | |

### 1.8 Two Point Hospital（Two Point Studios）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 部屋と設備、区画の拡張、職員（資格・技能・性格）、研究、宣伝、飾り、病院の段、部屋の格、評判、衛生 | [[web:simgames:r5-fv-wiki-twopointhospital|「building rooms」]] |
| 絡み | 飾り×職員の特性×成績。置いた物が職員と患者に波及する | [[web:simgames:r5-fv-pcgi-twopoint|「casual player」]] |
| 解放の順 | 1つ星で次の病院が開き、複数を同時に経営、後で開いた物を前の病院に入れに戻る | [[web:simgames:r5-fv-sixthaxis-twopoint|「Slapstick Vomit」]] |
| 目標 | 1〜3つ星。気軽な人と熱心な人を同じ場で、というのは**作り手の意図**（効果を測った資料ではない。K03） | [[web:simgames:r5-fv-pcgi-twopoint|「hardcore gamers」]] |
| 運と予兆 | 作り手は「乱す要素」を多く入れたと言う | [[web:simgames:r5-fv-sixthaxis-twopoint|「disrupting factors」]] |
| ライバル | なし | |
| 周回の動機 | 発売後に**7本の大きな更新（DLC）**で地域と病気を足した（判3.3-3） | [[web:simgames:r5-fv-wiki-twopointhospital|「seven major updates」]] |
| 表現 | 「絵はゲームを支える」に続けて、絵と動きを**重ねること**が基本だと言う（K37）。受付の人が退屈して鍵盤をいじる仕草。（見た）壁を低く切った部屋の断面、右上に星の段の目標の札、下に助言役の顔と一文の知らせ | [[web:simgames:r5-fv-cgm-twopoint|「support the game」]] [[web:simgames:r5-fv-cgm-twopoint|「That layering」]] [[web:simgames:r5-fv-cgm-twopoint|「bored」]] |
| **抜く型** | 星の段。後の解放で前に戻る。飾り×特性。仕草の動き。更新で中身を足し続ける | |

### 1.9 Good Pizza, Great Pizza（TapBlaze）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 生地・ソース・具・焼き・切り方、材料の量、設備と修理、客（100人超・あいまいな注文）、お金が足りない客を受けるか、飾り | [[web:simgames:r5-fv-applion-goodpizza-app|「個性的なお客さんたち」]] |
| 絡み | 注文を読み解く→応えるとチップ。親切が後で返る | [[web:simgames:r5-fv-applion-goodpizza-app|「設備のアップグレード」]] |
| 解放の順 | 章立ての物語 | [[web:simgames:r5-fv-wiki-goodpizza|「Good Pizza」]] |
| 目標 | 向かいのライバル店に勝つ | [[web:simgames:r5-fv-applion-goodpizza-app|「ライバル店との競争」]] |
| 運と予兆 | 機械の故障を楽しむ声と、理不尽な客を現実味として好む声がある。判定の不満（M1 24件）は本人が不具合と書くものを含む（K15） | [[web:simgames:r5-fv-applion-goodpizza|「機械の故障とかある」]] [[web:simgames:r5-fv-applion-goodpizza|「理不尽なお客さん」]] |
| ライバル | 向かいの店主が物語に繰り返し出る | [[web:simgames:r5-fv-applion-goodpizza-app|「ライバル店との競争」]] |
| 周回の動機 | 物語なので周回は弱い。毎日少しずつ戻る | [[web:simgames:r5-fv-pmq-goodpizza|「Good Pizza」]] |
| 伸びた理由 | 1日の利用者の伸びの前に直したのは、設計・UI・**課金の仕方**を合わせたもの。分割の画面をやめたことだけの効果ではない（判3.2-12・K42）。書き手を雇って会話・ニュース・なぞ・偽の口コミを足した | [[web:simgames:r5-fv-wiki-goodpizza|「monetization」]] [[web:simgames:r5-fv-pmq-goodpizza|「worked with writers」]] [[web:simgames:r5-fv-pmq-goodpizza|「fake Yelp review」]] |
| 表現 | （見た）手描きの平らな絵、くすんだ暖色と太めの濃い輪郭線で全部を統一。上に具の箱、木のへらの上の生地、左の窓口に客。客は年齢・肌・髪・服を同じ線の約束で描き分ける。賞は絵と人物の意匠で取った | [[web:simgames:r5-fv-wiki-goodpizza|「Best Visual Art」]] [[web:simgames:r5-fv-wiki-goodpizza|「Best Character Design」]] |
| **抜く型** | 客の言葉を読む技能。締めの儀式。世界のニュース。人物の描き分けの約束 | |

### 1.10 Cook, Serve, Delicious!（Vertigo Gaming）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | メニュー（最初の品から選ぶ）、機材、手順、雑用。2作目は品目が **30→180超**（判3.3-4） | [[web:simgames:r5-fv-wiki-csd|「over 180 food types」]] [[web:simgames:r5-fv-wiki-csd|「the original's 30」]] |
| 絡み | 同じ品ばかりだと飽きられ魅力が落ちる。混む時間の山 | [[web:simgames:r5-fv-wiki-csd|「Cook, Serve, Delicious」]] |
| 解放の順 | 見た目は単純だが、掘るほど複雑になる | [[web:simgames:r5-fv-gamemaker-csd|「dig into it」]] [[web:simgames:r5-fv-gamemaker-csd|「more and more complex」]] |
| 目標 | 古い店を立て直す（版0.1 の「星の段」はこの作品の原文にない語で、Two Point と取り違えた。判3.2-11） | [[web:simgames:r5-fv-wiki-csd|「Cook, Serve, Delicious」]] |
| 運と予兆 | 混む時間は予告どおり来る | [[web:simgames:r5-fv-wiki-csd|「Cook, Serve, Delicious」]] |
| ライバル | なし | |
| 周回の動機 | 難しさと、のんびりの設定の両方 | [[web:simgames:r5-fv-gamemaker-csd|「complex」]] |
| 表現 | （見た）左に番号付きの注文の札が縦に並び、料理の小さな絵と待ち時間の棒。真ん中は夜の街が見える窓の前のカウンターに客が並ぶ手描き風の絵。（文章）読み飛ばせるメールで外の世界をほのめかす | [[web:simgames:r5-fv-gamemaker-csd|「Cook」]] |
| **抜く型** | 支配的な選択を時間（飽き）で崩す。品目を足し続ける更新。番号付きの注文の札 | |

### 1.11 Startup Company（Hovgaard Games）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | サイトの型、社員の職種と給料・研修・賞与、家具、色分けされた資源、サイトの機能、広告、サーバー、調査、競合。見張る値が**数十**（判断の変数の数ではない。判2章の深さの行） | [[web:simgames:r5-fv-gamesasylum-startup|「dozens of variables」]] |
| 絡み | 社員が資源を作り、資源で機能を作る。途切れると止まる | [[web:simgames:r5-fv-gamesasylum-startup|「Startup Company」]] |
| 解放の順 | 黒字で事務所・年金・営業、数時間後にサーバー | [[web:simgames:r5-fv-gamesasylum-startup|「Startup Company」]] |
| 目標 | いつでも引退でき、財産と功績の内訳が出る | [[web:simgames:r5-fv-gamesasylum-startup|「Startup Company」]] |
| 評価 | 数十の値を見張るのが好きな人には刺さる、と評者（7/10）。山と谷が癖になるとも書く。欠点は人物と個性のなさ。版0.1 の「チープ」は原文にない語（判3.2-5・6） | [[web:simgames:r5-fv-gamesasylum-startup|「certainly appeal」]] [[web:simgames:r5-fv-gamesasylum-startup|「moreish highs」]] [[web:simgames:r5-fv-gamesasylum-startup|「lack of character」]] |
| 周回の動機 | 最初の数社は惨敗→学んで再挑戦 | [[web:simgames:r5-fv-gamesasylum-startup|「Startup Company」]] |
| 表現 | （文章）人物が机に現れて消える、作ったサイトの見た目が出ず機能の一覧で表される。17時に社員が帰る演出は好意的。（見た）開発元の紹介の絵では、斜め上からの3D の事務所を色の違う家具で描く（宣伝の絵で、遊びの画面と同じとは限らない） | [[web:simgames:r5-fv-automaton-startup|「Startup Company」]] [[web:simgames:r5-fv-hovgaard-startup|「Startup Company」]] |
| **抜く型** | いつでも終われる結末の内訳。**反面教師**：変数が多くても、作った物と人が絵にならなければ無個性に見える（多さの問題ではない） | |

### 1.12 Coffee Inc 2（Side Labs。比較のために原文を読み直した）
| 軸 | 中身 | 出典 |
|---|---|---|
| 変数 | 店（場所・内装・商品・値段・人・宣伝）、本部の各部門（経理・人事・宣伝・商品開発・投資・技術）、上場と増資、融資、株式投資、不動産の売買（拡張パック）、ベンチャー投資、豆の栽培とブレンド・品種改良、オークション、スポーツクラブ、大学への寄付 | [[web:simgames:r4-cinc-applizm-inc2-kabusiki|「株式公開の条件」]] [[web:simgames:r4-cinc-applizm-kojinsisan|「不動産物件を購入できる」]] [[web:simgames:r5-cinc-applion-p4|「品種改良までできる」]] |
| 絡み | 本部の部門を全部動かすと費用が足りず、どこに投資するかを考え続けさせる、と声 | [[web:simgames:r4-cinc-applion-reviews|「どこに投資するのか」]] |
| 解放の順 | 店で稼ぐ→資金が貯まると株・不動産・豆の栽培が開く、と声 | [[web:simgames:r4-cinc-applion-reviews|「コーヒー豆の自家栽培」]] |
| 目標 | 決まった終わりがない。コーヒー屋→投資会社→コングロマリットへと段が変わるのを楽しむ声 | [[web:simgames:r4-cinc-applion-reviews|「コングロマリット」]] |
| 運と予兆 | 中盤から外資の大手が入ってくる。新聞を読み直したいという声 | [[web:simgames:r5-cinc-applion-p2|「外資大手が参入」]] |
| ライバル | ライバル企業。全く動かないライバルへの不満と、競い合うから楽しいという声 | [[web:simgames:r5-cinc-applion-p6|「ライバル会社と競い合う」]] |
| 周回の動機 | 何度もやり直して別の方針を試す声（1-1）。全部手に入ると別のデータで始めるしかないという声（2-7） | [[web:simgames:r4-cinc-applion-reviews|「何度も最初からやり直して」]] [[web:simgames:r5-cinc-applion-p2|「新たに始めるしかなくなって」]] |
| 反対の声 | 黒字の店を建てるかが全てで作業感／店を出し終えるとやることがなくなる／前作は不動産・投資会社になって面白くなかった（店の外が店を食う） | [[web:simgames:r4-cinc-applion-reviews|「黒字店舗を建てるかが全て」]] [[web:simgames:r4-cinc-applion-reviews|「やることがなくなる」]] [[web:simgames:r5-cinc-applion-p2|「面白くなかったのですが」]] |
| 表現 | （見た）都市の地図は斜め上からの立体の絵で、貸し物件・売り物件・自分の店・他社の店が**色と絵の違う印**で地図に立つ。上下の情報は半透明の暗い札。店の画面は店の中の断面に店長の顔と一言、客の評価の平均と4つの内訳（値段・商品・サービス・雰囲気） | [[web:simgames:r5-fv-applion-cinc-app|「多通貨対応で世界中の市場」]] |
| 評価の分布 | 平均4.7、★3以下 7%（8,467件中577件） | （2章） |
| **抜く型** | 店で稼いだお金の行き先として、店の外の事業（土地・建物・生産・投資）が開く。段が店→会社→企業集団へ変わる。店の外の変数を地図の上の印で見せる | |

### 1.13 Big Ambitions（Hovgaard Games）と Mini Metro（比較）
**Big Ambitions**（開発者の聞き取り2本・攻略の記事2本・画面写真2枚）：開発者は、経営シムの種類は数が足りないのではなく、よく知られた仕組みを写した平板な模擬が多すぎると言う [[web:simgames:r6-sd-gamediscover-bigambitions|「flat simulators」]]。二つ目の掴みは、車に乗って運転できると分かった時だと言う [[web:simgames:r6-sd-gamediscover-bigambitions|「enter a car」]]。ライバルは値下げ・競合店・人の引き抜き・自分の建物を貸さない、の手で攻める [[web:simgames:r6-sd-gamesfuze-bigambitions-rivals|「poach your employees」]]。規模が出ると値付けを本部の係に任せられる [[web:simgames:r6-sd-gamesfuze-bigambitions-pricing|「HQ Pricing Manager」]]。（見た）街の3D の地図に、貸し出し中の建物の種類（住宅・小売・事務所・倉庫）と、銀行・輸入・卸・人材の会社などの特別な建物を、切り替えられる重ねの色で出す。会社の管理の画面は、ゲームの中のパソコンの「アプリ」の形で、従業員のシフトを色の札で組む表。
**Mini Metro**（Dinosaur Polo Club）：経営シムではないが、問2（少人数で安っぽく見えない）の比較として読んだ。兄弟は、作り切るために素材の制約を先に置いた [[web:simgames:r5-fv-wiki-minimetro|「reach a finished state」]]。そのうえで、初めの課題のうち絵と音に外の手を雇い、見た目の設計は [[web:simgames:r5-fv-wiki-minimetro|「Jamie Churchman」]]、音は [[web:simgames:r5-fv-wiki-minimetro|「Disasterpeace」]] が手続き型の仕組みで作って賞を取った。発売の遅れの一因は絵の全面的な作り直しだった（判3.2-2・K06）。（見た）記事の見出しの絵は、白に近い背景に太い色の線が角を丸めて曲がり、重なりは透けて混ざる。「削った」のは素材の数で、絵と音の作り手は**足した**。
