<!-- quality:v2 -->
# Mobbin で探した「本来あるべきデザイン」：遊びの芯の操作と判断・世界（MB2）

2026-11-02、担当 MB2。依頼文は `docs/BRIEF-UIREF-MOBBIN.md`（9章 MB2）。第1回 `docs/analysis/uiref-mobbin.md`（M1〜M19）の画面は番号で触れるだけにし、新しい画面を探した。

**取り方**：Mobbin の公式 MCP（search_screens・search_flows）で探し、引いた画面の image_url を全部 `tools/research-fetch.js`（取得元 `mobbin-mcp`）で原寸を取得した。原寸から番号付きの一覧の画像を18枚作って Read で開き、見た所を読了ノート `research/notes/mobbin-mcp/screens/<id>.md` の image_seen に書いた。画面の一覧（id・アプリ・領域・Mobbin の頁）は `docs/analysis/uiref-mobbin-MB2-screens.tsv`、検索の記録は `docs/analysis/uiref-mobbin-MB2-searches.tsv`、数は `docs/analysis/uiref-mobbin-MB2-count.py` の出力（「数の出力」の章）から写した。Mobbin の頁（mobbin.com/screens/…）は取っていない。

**この文書は、書いた本人以外の判定・論証の検査をまだ受けていない**（QUALITY 2.3・5章）。

## 要点

1. **仕訳の本来の形に一番近い型は「振り分け」ではなく「合計が合うまで確定できない分け方」だった**。会計ソフトの照合（Xero：選んだ取引の合計が明細の額と合うまで Reconcile が灰色、赤字で「Total is out by: 6.75」→ 調整を足すと緑の「Totals match」）、家計アプリの分割（Monarch・Quicken・Copilot：「$300.00 left to split」→ 緑のチェックと「$0.00」で保存が押せる）、YNAB の割り当て（「Ready to Assign」を0まで配る）の3系統が、同じ「残りの差が数で見え、0で確定」の型を持つ（W10〜W14）。これは貸借一致そのもので、**仕訳を「左右の差を0にする遊び」として組める**【推論：画面の型の一致から。遊ぶ人に効くかは試していない】。
2. **家計アプリの取引の細目は、すでに二面を持っている**。Monarch の細目は Account（My Cash Account）と Category（Other Income）を別の行で持ち（W4）、Mercury は同じ取引を「Transaction／Journal Entry」のタブで切り替え、借方側の行に「Uncategorized Cash Outflow」（仮の科目）を置く（W16）。家計アプリは口座の側を通帳から自動で決め、人には分類の側だけを選ばせる。**ゲームの仕訳は「片側は書類が決め、もう片側を選ぶ」から入り、のちに両側を選ぶ段へ進む**のが本来の形の候補【推論】。ただし2級の取引の多く（掛け・減価償却・引当）は両側とも現金でなく、この型だけでは覆えない（反対の事実 F1）。
3. **月は「確かめる箱を空にする」形にできる**。Copilot（TO REVIEW の札1枚と MARK AS REVIEWED）、Monarch（Needs Review の決まりと、空になると緑のチェック「You reviewed everything!」）、YNAB（「30 new transactions to approve or categorize.」と黄色の「This needs a category」の列）、QuickBooks（Pending (762)）が同じ型（W1〜W3・W5）。1か月の書類を受け箱に入れ、空になったら締めへ進む。
4. **スワイプの仕分けは実在するが、Mobbin で見た全部が2択だった**。Cleo（請求を「Keep」か「ditch」）、Google Photos（残す／消す）、Quizlet（Know／Still learning）、mymind（Forget／Keep）、Cleo AI（給料でないものを払いのける）。どれも2択で、Google Photos と mymind は同じ2択の押す札も並べる（W9・W17〜W20）。科目は数十あるので、**スワイプは「左か右か（借方か貸方か）」「残すか直すか」の2択の段に置き、科目を選ぶ所には置かない**【推論】。
5. **ドラッグで箱へ入れる分類は、スマホの画面では1件も見つからなかった**。「drag and drop a card into a bucket or folder to categorize」の12件はすべて並べ替えで、SiriusXM は「Press and drag an item to move it.」の帯で使い方を言い添える（W23）。箱への振り分けは Cleo のように**押して箱を移す**形だった（W6）。オーナーの「ドラッグ」の案は、Mobbin の実例からは支えられない（反対の事実 F2）。
6. **反映の見え方には、お金の流れの図と硬貨の山がある**。Mercury の流れの図（入りの源→Money In→Expenses→行き先、W28）と Cleo の In／Out の硬貨の山（Out の上に灰色の Limit、Spent と Due の色、W27）。オーナーの原文「自分が左右選んだ科目が帳簿のどこに反映されてるかわからない」に、**選んだ札が帳簿の図の帯・山に流れ込む**形で応えられる【推論】。
7. **同じ型の取引は「決まり」にできる**。Monarch は分割のあとに「2 split transactions created / Create a rule to do this automatically.」の知らせを出し、Expensify は店の種類→分類の表を持つ（W15・W29）。PEDAGOGY 1.6 の自動仕訳ルールの実物の型。
8. **判断の予告は「動かすと結果が動き、危ない帯は色で知らせる」型が多い**（Redfin の色の変わるつまみと「Stretch」の注意、Monzo の見込みの幅、Shopee の借入の期間と月の返済、W31〜W35）。Monzo は線だけでなく**薄い帯の幅（Likely range）**を出す。運の幅を残す PEDAGOGY 1.5 に合う。
9. **世界の側（地図・順位・店）は、MB2 の範囲で一番弱い**。経営シムそのものは Mobbin になく（第1回と同じ）、地図は店探しのアプリ、順位は暮らしのアプリ、店を育てるのは部屋の配置のアプリ（Google Arts & Culture の等角の部屋、Philips Hue）からの類推になる（W46〜W51）。

## 問いの設計

| 側 | 問い | 答えた章 |
|---|---|---|
| 肯定 | 取引を分類する画面は、なぜ「全部終わらせたくなる」のか。何と何が絡むのか | 実例の台帳 W1〜W16、うまくいく理由 |
| 肯定 | スワイプ・ドラッグ・押す、のどれが分類で使われ、なぜそうなるのか | W17〜W23、要点4・5 |
| 肯定 | 判断の前に結果を見せる画面は、なぜ選ぶ手ごたえを残せるのか | W31〜W35 |
| 否定 | 分類の操作がうまくいかない・ゲームに合わないのはどこか（2択の限界、業務の画面の退屈、答えを教えすぎる自動化） | うまくいかない理由、反対の事実と合わない型 |
| 写し方 | 本来のゲームのどの体験の芯に置くか（第3章の「1か月＝受け箱」「仕訳＝差を0にする」） | 実例の台帳の「置き場所」、本来あるべき設計の素案 |

**問わなかったこと**：進み具合・ダッシュボード・月報（MB1）、はじめの体験・会話・学びの画面（MB3）。ただし反映の見え方（W27・W28）は仕訳の操作の結果として MB2 で扱った。Mobbin の外の資料（口コミ・研究）は今回の依頼の外なので集めていない（「やっていないこと」）。

## 資料の内訳

資料は Mobbin の画面だけ（一次資料：実在のアプリの画面）。数は「数の出力」から写した。

| 領域 | 画面の数 |
|---|---|
| 家計（Monarch・Cleo・Copilot・YNAB・Quicken・Buddy） | 51 |
| 業務の会計・経費（Xero・Mercury・QuickBooks・Expensify・Airwallex・Revolut Business） | 19 |
| 片づけ・整理（Google Photos・mymind・Gmail・Matter・SiriusXM・The Weather Channel） | 11 |
| 学び（Quizlet・Brilliant） | 8 |
| 銀行・投資（Monzo・Shopee・Redfin・Apple Wallet・Cash App） | 8 |
| 地図（TheFork・Apple Maps・Skip・DoorDash） | 4 |
| 飲食の注文（Wonder・Uber Eats・Chipotle・sweetgreen） | 4 |
| 部屋・世界の絵（Google Arts & Culture・Philips Hue・Fi） | 4 |
| 店の業務（Shopify・Thrive Market） | 3 |
| ゲーム的な予想・順位（Formula 1・Bump・corner） | 3 |
| 健康・習慣（BitePal・Finch） | 2 |

**家計が 51/117（43.6%）で一番多い**。半分は超えないが偏っている。理由：オーナーと依頼文が「家計アプリの取引の分類・スワイプの仕分けを flows まで深く」と名指ししたため、流れを全画面で取った（Monarch 15・Cleo 12・Copilot 9・YNAB 8）。同じアプリの上限（全体の3分の1）に対し、一番多い Monarch は 15/117。Duolingo は0（第1回の M1〜M19 で扱った）。

## 実例の台帳

番号は W1〜。「見た所」は原寸の一覧の画像を開いて書いた（一覧の番号は「数の出力」の画面の番号）。リンクは Mobbin の頁。

### A. 取引を受け箱から確かめる（1か月＝受け箱）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W1 | Copilot ダッシュボードの「TO REVIEW」 | [流れ](https://mobbin.com/flows/29c464c7-82f7-4af9-b1c6-2996f535e515)：[1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)・[2](https://mobbin.com/screens/baeed91c-a61c-42ff-9370-883b755c77ae)・[3](https://mobbin.com/screens/5ebf5abc-02b1-4874-b430-7388635ae074)・[4](https://mobbin.com/screens/0e7388f4-b89e-4806-9a11-5627c7fcf3e1) | ホームの予算の札（「$1,592 left」と緑の「$53 under」）の下に、確かめる取引の札が**1枚だけ**（店名・灰色の OTHER の札・$94.28）と青字「MARK AS REVIEWED」。押すと下から取引の紙が出て、見出しが青い「• TRANSACTION TO REVIEW」から灰色の「TRANSACTION」に変わり、札の REVIEW が消える。全部終わると欄が光の点と「19 transactions to unlock Intelligence」に変わる | ホームに次の1枚だけを出す→迷わず押せる→終えると欄の形そのものが変わり「終わった」が見える→次の札を開きたくなる | **月の机（ホーム）の主役＝次の書類1枚**。押すと書類の紙が開き、記帳を終えると「未記帳」の印が消える | 「19 transactions to unlock」は量で機能を解く形（K10 の量への報酬に近い）。写すのは「次の1枚を主役に置く」と「終えると見出しが変わる」だけ |
| W2 | Monarch の「Needs Review」の決まりと空の状態 | [流れ](https://mobbin.com/flows/7316be7d-a6b8-4cee-985d-d1a6eb49eb08)：[1](https://mobbin.com/screens/79d30b2e-9e94-4d96-889f-08d936562d15)・[2](https://mobbin.com/screens/10356894-8494-4152-9ddc-e7e676ca0750)・[3](https://mobbin.com/screens/94b244ab-7c20-4b1f-a752-d9dee4f2775d)・[4](https://mobbin.com/screens/0e67293e-fade-4311-811f-e3efc8f7b230)・[5](https://mobbin.com/screens/1c4c8931-47f1-42df-8a6c-2c24b6a6cdc7)・[6](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)、[設定](https://mobbin.com/screens/efe642f7-5c0f-42d1-bf07-11af2336fcdb) | 設定に「Mark uncategorized transactions as Needs Review」（赤い入）。絞り込みの紙で「NEEDS REVIEW BY」の丸を橙で選び Apply。絞り込みの印に橙の「2」、中央に緑の丸のチェックと太字「You reviewed everything!」と枠の「View all transactions」 | 分類していない取引は自動で「確かめる」箱に入る→箱の中だけを見ればよい→空になると大きなチェックで終わりが宣言される→「全部終えた」状態が報酬になる（量ではなく状態） | **月の受け箱**。その月の書類が「未記帳」の箱に入り、空になると締めの扉が開く（PEDAGOGY 1.1 ③の前） | 設定の文が長く業務的（3〜5行の説明）。ゲームでは決まりは見せず、箱の空と満だけを見せる |
| W3 | YNAB（web）「This needs a category」 | [画面](https://mobbin.com/screens/325fffea-71f9-4c44-8109-c1476771616f) | 上の薄紫の帯「30 new transactions to approve or categorize.」と青い View。表の CATEGORY の列に黄色の丸い札「This needs a category」が十数行並ぶ。上に「$165.13 Cleared + $0.00 Uncleared = $165.13 Working Balance」の式 | 未分類を**色の札で列に並べる**→どこが残っているか一目で分かる→黄色を消したくなる | PC の帳簿の画面：その月の仕訳帳で、未記帳の行に黄色の札。「残高＝確かめた分＋まだの分」の式は通帳と帳簿のずれ（PEDAGOGY 1.5 の銀行勘定調整）の見せ方の候補 | 業務の表そのもので、ゲームの手ざわりはない。PC の補助の画面に限る |
| W4 | Monarch の取引の細目 | [画面](https://mobbin.com/screens/000a1e05-3de9-4d2c-b54f-5771d0d0e25e) | 上に緑の大きな「+$900.00」。行：Merchant Salary／History「1 transaction」／**Account「$ My Cash Account」**／**Category「💰 Other Income」**／Goal／Date／Notes／Tags | 家計アプリは1つの取引に「お金がどの口座で動いたか」と「何の分類か」の2つを持たせている→人は分類だけ選べばよい→これは仕訳の左右（現金／受取の収益）の片側を自動で決める形 | **仕訳の入口の段**：書類の札に「お金の側（現金・普通預金）」は書類から決まって表示され、プレイヤーは反対側の科目を選ぶ。のちの段で両側を選ぶ | 家計アプリは借方・貸方の言葉を出さない。2級の掛け・減価償却・引当は現金が動かず、この型は使えない（F1） |
| W5 | QuickBooks（web）Bank transactions | [画面](https://mobbin.com/screens/8b515fbd-8bbf-4bc2-b753-c0b62df38fa2) | 緑の枠の札「Main Bank: $47.40」と右上の「762」、タブ Pending (762)・Posted・Excluded、列 From/To・Match/Categorise、各行に灰色の Select category と Match・Categorise の札と青い Post | 通帳の行を「Pending」に溜め、行ごとに「照合」か「分類」を選んで「Post（記帳）」する→記帳済みに移る | 月の書類の受け箱の業務の原型。「照合（既にある書類と合わせる）」と「新しく分類」の2つの道 | 762 件の数字は圧。ゲームの月は1〜3件の新しい判断＋自動（PEDAGOGY 1.1）なので、数の大きさは写さない |

### B. 分類を選ぶ（科目の棚と2つの箱）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W6 | Cleo「SORT YOUR SPENDS」 | [流れ](https://mobbin.com/flows/e7cc3fe9-c50a-410a-adf9-c73f4be7c9fb)：[2](https://mobbin.com/screens/89466e6b-d12b-407e-a8ae-2a6bc1fc579a)・[3](https://mobbin.com/screens/35656b22-a704-4b52-8cd0-9ae4c8addf3d) | 上の水色の箱「Essential spend」と下の薄橙の箱「Other spend」。丸い立体の絵（ドクロ・さくらんぼ・宝石）を**押すと箱を移り**、上の箱の絵には緑の輪とチェック。上の箱が5→8つに増えると、灰色の Save が濃い紫に変わる | 2つの色の箱が並ぶ→押すたびに絵が箱を移る（指で運ばなくても「入れた」感じがある）→全部置くと保存が押せる | **カードを箱へ**の本来の形：科目の札を「資産の箱／費用の箱」へ押して移す（前払いの判断、P3）。2つの箱を上下に置く | 絵が派手で中高生向けの作風に近いが、ドクロなどの冗談の絵は会計の科目には合わない。箱が2つの時だけ成り立つ |
| W7 | Buddy の分類の棚 | [流れ](https://mobbin.com/flows/0da6b259-ff4a-43b6-a24e-daec4d8d2f98)：[1](https://mobbin.com/screens/05f44de1-5a20-4bc4-b849-746680f91834)・[2](https://mobbin.com/screens/0e922147-2e98-47e3-a352-e0c2548bb20e) | 新しい取引で大きな「$500」、EXPENSE／INCOME／TRANSFER の3つの切り替え、帯「Category: Miscellaneous」、色の丸い印4つ（Income・Groceries・Gift・Telephone）と「Browse all categories」。全部の棚は見出し（Miscellaneous・Entertainment…）ごとに**同じ色の丸い印**が3列 | まず「出・入・移し」の3択→よく使う4つ→全部の棚、の順に狭める→選ぶ数が一度に多くならない。見出しの色で群が分かる | **科目の棚**：5区分（資産・負債・純資産・収益・費用）を色で分け、各科目に印。最初はその場面で使いうる4つだけを出し、「全部の棚」は開けばある | 候補4つが答えを教えすぎる（第1回 M17 と同じ悪い面）。誤りの候補も混ぜる。色の区分は覚える助けにも、色に頼る癖にもなる |
| W8 | Copilot の分類の頁 | [Categories](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)・[Other](https://mobbin.com/screens/e6fe4340-7a37-48d0-bf3a-47638a72bf31) | 上の札に「$2,383 spent in Aug」とドーナツの輪と「$1,705 total budget」。分類の行に色の点・絵・額・横の棒（赤＝超え、黄・緑）・予算。Other を開くと大きな「$1,309.40」と赤い点「$1,159 over」、月ごとの棒の赤い高い柱、その分類の取引の一覧 | 分類した結果がすぐ分類の棚の額と棒に足される→選んだ分類が「どこに効いたか」が分かる→超えると赤 | **科目の残高の棚**：選んだ科目の行の額が増え、棒が伸びる。科目を開くとその月の仕訳の一覧（総勘定元帳の見え方） | 予算と比べる赤・緑は家計の考え方。ゲームでは「予算超え」ではなく「先月より」の比べにする（MB1 と重なる） |
| W9 | Cleo AI「Are these all paychecks?」 | [画面](https://mobbin.com/screens/a6d10794-203e-4693-ad2c-96e8ce54254b) | 茶色の太字の問い「Are these all paychecks?」、灰色「If they're not, swipe them away」、白い札1枚（Deel Inc・+$2,106.62）、下に「This looks right」 | アプリの推測を見せて、人は**違うものを払いのけるだけ**→確かめる作業が「はい」か「払う」の2択に縮む | 自動仕訳ルールの点検（PEDAGOGY 1.6）：「この3件はルールどおり『仕入／買掛金』でよい？」と札を見せ、違う札だけ払いのける | 推測が正しい前提の作り。監査の罠（条件の外の取引）を混ぜないと、何も考えずに「This looks right」を押す |

### C. 合計が合うまで確定できない（仕訳＝差を0にする）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W10 | Xero（web）照合の流れ | [流れ](https://mobbin.com/flows/20b6281b-32f0-4804-bc8e-25782233fa94)：[1](https://mobbin.com/screens/b433257a-a7a0-4249-a4a5-04e2681d1432)・[2](https://mobbin.com/screens/d434009d-5eba-4d42-833b-19e97f3d1fa7)・[3](https://mobbin.com/screens/2b57df0e-4fe6-48ed-af7c-9c2409253c47)・[4](https://mobbin.com/screens/722f15b0-bb7c-4bb3-90b8-0cb41e1cab74)・[5](https://mobbin.com/screens/e194359a-f186-4480-8073-37d9c0390ae5)・[6](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)・[7](https://mobbin.com/screens/91485894-7e42-497d-949e-bde624d3cd0c)・[8](https://mobbin.com/screens/18e0c767-a227-464b-a1a6-856881a7b9fa)・[9](https://mobbin.com/screens/64f0ada5-9ade-418a-ae10-0f01910461a5) | 左に明細の行（Staples・Spent 42.75）、右に Match。候補の表で 36.00 の行を選ぶと緑。「3. The sum of your selected transactions must match the money spent」の下に「Must match money spent: USD 42.75」と赤い！「Total is out by: 6.75」、Reconcile は灰色。Adjustments から「Minor adjustment」を足して 6.75 を入れると、緑のチェック「Totals match」で Reconcile が青くなる。日付の食い違いには「Warning」の窓と Confirm。終わった行は緑字「Reconciled」 | **差が数で常に見える**→何をすれば合うかが分かる→合った瞬間に確定の札が色づく→「合わせた」手ごたえ。合わない時は確定できないので、誤りが帳簿に入らない | **仕訳の机の確定**：左右の合計の差を常に出し（「左右の差：¥6,750」）、0で確定の札が色づく。調整の行（雑損・雑益、現金過不足）は「差を埋める札」として出す（PEDAGOGY 1.5 の現金過不足） | 業務の画面そのもので、文が多く事務に見える（BRIEF 5章 4）。写すのは「差の数」「0で色づく確定」だけ。Xero は「調整が1.00より多い」と赤字で警告しつつ通す。ゲームでは差を雑損で埋めるのが楽な逃げ道になる（F3） |
| W11 | Monarch の分割 | [流れ](https://mobbin.com/flows/0a0f283a-5b8a-49c1-a107-774992a44de9)：[1](https://mobbin.com/screens/802b848c-9c9c-4f8d-9a56-2392c1163661)・[2](https://mobbin.com/screens/e2878dfd-981d-4019-bea2-b403dbf1efa2)・[3](https://mobbin.com/screens/b0d85ef3-3bb1-4369-924c-6fa501442185)・[4](https://mobbin.com/screens/31f30340-cc9d-4222-bd97-d51611da2f23)・[5](https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6)・[6](https://mobbin.com/screens/c59cd911-7ee3-4058-8bd7-560348827f87)・[7](https://mobbin.com/screens/bd4785a8-2499-4f95-9ea5-4ff6ab39964c) | 元の取引「Salary +$900.00」の下に Splits、下に「LEFT TO SPLIT $900.00」と薄い橙の押せない Save。行を足すたびに大きな額と「$300.00 left to split」、最後は緑のチェックと「$0.00 left to split」。まとめで「Split into 2 transactions」、終わると分かれ道の印「This transaction has been split」 | 残りの額が大きな字で減っていく→0で緑→保存が押せる。元の1件と分けた2件が並ぶので、分けても合計が変わらないことが見える | **複合仕訳**：1枚の書類（給料の支払い＝給料／現金・預り金）を行に分け、「残り」が0になるまで行を足す。元の書類と分けた行を上下に並べる | 家計の分割は同じ側（収益どうし）を分けるだけで、左右の対はない。ゲームでは左右の2列にする必要がある |
| W12 | Quicken の分割 | [流れ](https://mobbin.com/flows/d540e38b-aab2-40c9-ac22-40c6108edc53)：[1](https://mobbin.com/screens/2cbade55-1f55-4aea-8daf-90e284b0f2e5)・[2](https://mobbin.com/screens/76fa502a-dc67-4b51-9140-d8b091a1d521)・[3](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84)・[4](https://mobbin.com/screens/b437dd7f-d3ce-4e92-b9d3-8a21e193ed6b) | 「Left to Split $120.00」の太い行を**上に固定の帯**として置き、Split 1・Split 2 の枠（Category・Amount・Tags）。合うと帯が緑のチェックと「$0.00」。灰色の「Add Left to Split」（残りを1押しで入れる）。戻ると「2 Splits」と Edit | 差の帯がスクロールしても上に残る→行を足しても見失わない。「残りを入れる」の札で最後の行を楽にする | 仕訳の机の上端に「左右の差」の帯を置き続ける。最後の行の額は「差を入れる」札で入る（計算の負担を減らし、科目の判断に集中させる） | 「残りを入れる」は学びの段では金額の計算（月割・差額）を奪う。検定会場と練習室では出さない（PEDAGOGY 1.7 の計算パッドとそろえる） |
| W13 | Copilot の分割 | [流れ](https://mobbin.com/flows/20c05efa-e379-446c-ba45-d19525a98764)：[2](https://mobbin.com/screens/1ae4ac51-0c47-4c59-804f-6ecce7cdaadf)・[3](https://mobbin.com/screens/ea307f13-0255-4b7d-a6ca-18db31407f9d)・[4](https://mobbin.com/screens/b945aba6-956f-47a7-973f-f37c4159e8e0) | 題「Mobile Purchase 08-18 Target $9.00」、1行目 $9.00 と紫の GROCERIES、2行目の灰色「$0.00」と OTHER。2行目に「$2」と打つと**1行目が自動で $7.00 に減る**。保存すると一覧に同じ名の行が GROCERIES $7.00・OTHER $2.00 で並ぶ | 合計を崩せない作り→人は「分ける額」だけ考えればよい→誤って合計がずれることがない | 決算整理の「振り替え」（前払費用の月割で、支払った額のうち当期分と翌期分を分ける、P3）。分けた片方を入れると、もう片方が自動で決まる見せ方は**結果の見せ方**として使う | 自動で合わせると、貸借を合わせる考え自体が消える。学びの段では自動で合わせず、差を見せる（W10・W12）。習熟した型だけ自動（PEDAGOGY 1.6） |
| W14 | YNAB の割り当て | [流れ](https://mobbin.com/flows/4214291a-a93f-45b9-aa14-c1272861321d)：[1](https://mobbin.com/screens/e4798a83-cd7c-444f-8929-0eda37637013)・[2](https://mobbin.com/screens/58dff4a5-ec23-41e0-a22e-fdcc12757579)・[3](https://mobbin.com/screens/2db151ae-64c7-48dd-a696-66ef10d6e774)・[4](https://mobbin.com/screens/8aa01ad2-5822-4a9c-be54-9135a47529be)・[5](https://mobbin.com/screens/6396d7d9-50dc-4b66-aa21-6808e8d37c82)・[6](https://mobbin.com/screens/15747c12-b670-42aa-81b9-d9b4d1998c5a)、[自動](https://mobbin.com/screens/2ba4c88c-74f3-4856-8e0b-e6b100c85a19) | 黄緑の大きな札「Assign Your $50,000.00」と封筒からお札が出る絵、問い「What does this money need to do before I get paid again?」。紫の札「Give every dollar a job」。行を押すと薄紫に光り、数字の盤の上に「Assign $2,800.00」（足りない額を1押し）。上の札が「$47,200.00 … Keep funding until you hit zero.」。満ちた行は緑の棒と「Funded」、足りない行は黄色「$0.00」と「$60.00 more needed by the 30th」 | 配るお金の残りが上で減っていく→0を目指す目標が1つ→各行に「あといくら」が出るので次に押す所が分かる | **資金繰りの判断**（PEDAGOGY 1.5）：月初に口座のお金を「家賃・仕入・給料・返済」の箱へ配り、足りない箱は黄色。月末に払えるかが先に見える | 「Give every dollar a job」は家計の哲学で、会計の仕訳ではない（配分は予算、記帳は事実）。仕訳の操作と混ぜると「記帳＝予算づくり」と誤解させる恐れ。資金繰りの画面だけに置く |
| W15 | Monarch の「決まりを作る」知らせ | [画面](https://mobbin.com/screens/bd4785a8-2499-4f95-9ea5-4ff6ab39964c)・[メニュー](https://mobbin.com/screens/802b848c-9c9c-4f8d-9a56-2392c1163661) | 分けた後、下に黒い知らせ「2 split transactions created / Create a rule to do this automatically.」と右に CREATE。取引の…のメニューにも「Create rule from transaction」 | 手でやった**直後**に「次からは自動に」を提案→自分の操作が決まりになる手ごたえ→同じ作業をくり返さない | **自動仕訳ルールの提案**（PEDAGOGY 1.6）：同じ型を3回正しく切った直後に「この切り方を決まりにする？」の知らせ。決まりの文は自分で組む | Monarch は1回で提案する。PEDAGOGY は3回・別の月を条件にする。提案が早すぎると、理解の前に自動化する |
| W16 | Mercury（web）Transaction／Journal Entry | [画面](https://mobbin.com/screens/b5b9a184-bd88-48e7-ba5a-f3f151278cc2) | 左のメニューに Journal Entries・Chart of Accounts・Rules。表の列 Account と **Ledger account**（1行目は「Uncategorize…」）。右の取引の紙に「$1.00 Money out」と **Transaction／Journal Entry のタブ**、Line items に Ledger account「Uncategorized Cash Outflow 1.00」。上の薄紫の札「Categorization that keeps up with you」（自動で分類、それまでは Uncategorized Cash Inflow or Outflow に置く） | 同じ取引を「日常の見え方」と「帳簿の行」で切り替えられる→分類が決まるまで仮の科目に置く→帳簿は常に合っている | **仕訳の札の裏返し**：書類の札を裏返すと仕訳の行になる。分類を決める前のお金は「仮払金・仮受金」に置き、決まったら振り替える（2級の論点そのもの） | 業務の画面。仮の科目に置ける作りは、ゲームでは「とりあえず仮払金」の逃げ道になる。月末までに0にする決まり（PEDAGOGY 0.4）とつなぐ |

### D. スワイプ・ドラッグ・押す（操作の手ざわり）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W17 | Cleo の請求の振り分け（チャットの流れ） | [流れ](https://mobbin.com/flows/4afc2eab-1d7b-4674-acff-d64fe0e63ec9)：[1](https://mobbin.com/screens/7a1d7cb1-9eec-4112-bdfc-5b6167ed1feb)・[2](https://mobbin.com/screens/b812a2ef-a69f-4a3e-95cf-896bef880cd8)・[3](https://mobbin.com/screens/d73f5da7-4c63-4008-8643-f307bd080c02)・[4](https://mobbin.com/screens/9d375a82-786e-49bf-b60c-6b07de6bd728)・[5](https://mobbin.com/screens/edda1f12-1737-4f6c-8af1-9b9c21609085)・[6](https://mobbin.com/screens/0c454f50-2831-4dc0-bf95-9a75b58dcbca)・[7](https://mobbin.com/screens/b915a84c-f94d-4d4e-8e0c-f016bdefef4e)・[8](https://mobbin.com/screens/39d6b9d5-1a21-4085-bb29-45d0609a5680)・[9](https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a) | 9画面。紫の地に桃色の輪郭の字「BILLS」と茶色の絵→答えの札 live・laugh・bills→画面いっぱいの橙の太字「$19 IN BILLS DUE BEFORE PAYDAY」と大きなナスの絵と親指の上下→吹き出し「Are all these bills must-haves?」→紫「Swipe right 👉 if it's a bill you gotta keep」と赤「Swipe left 👈 … ditch」→Netflix の白い札（$18.63）を右へ倒すと緑の枠の「Keep」の印と緑の丸 | 会話で**まず数を大きく1つ見せ**、気持ちを聞き、それから振り分けの遊びへ入る→2色の吹き出しで左右の意味を先に教える→札を倒すと印が出て、決めたことが目に見える | **出来事→判断の流れ**：月の出来事（「今月の固定費、給料日前に¥19万」）を大きな数で出し、店長の一言のあと、固定費の札を「続ける／やめる」で左右に払う（経営の判断。仕訳ではない） | 9画面は長い（第1回 M4 と同じ）。冗談の画像（アニメの場面）は Cleo の作風で、学びの画面では読み違いのもと。量を払うほど報われる作りではない（1回の点検）ので K10 には当たらない |
| W18 | Google Photos の片づけのスワイプ | [流れ](https://mobbin.com/flows/bbf6760f-a1bc-48f8-9bc6-df429d81421e)：[1](https://mobbin.com/screens/335005bc-aa41-4aa5-995e-112b9af4b4f9)・[2](https://mobbin.com/screens/ff71c065-00cb-4cf0-afb3-3aaa9a84bca2)・[3](https://mobbin.com/screens/81e1c9b4-ef1d-4dd6-bf9c-568f63698a61)・[4](https://mobbin.com/screens/5774ee10-df28-4ff4-8363-9b3688cad2d1)・[5](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)・[6](https://mobbin.com/screens/fe08f11d-55f0-43b7-a506-2acc10e4bc26) | 上に「Delete some items to make more room」と進みの棒「0 MB selected」。角丸の大きな写真の札、下に白い台の**ごみ箱とハートの押す札**。札を左へ傾けると手の印と白字「Swipe left to delete」と右に灰色のごみ箱の丸、右へ傾けると「Swipe right to keep」と左に赤いハート | 初めの1枚で札の上に操作を書く→左右の意味と色が対になる→押す札も同じ2択なので、スワイプが苦手でも進める | 仕訳の机の「左か右か」の段：科目の札を左（借方）か右（貸方）へ払う。同じ2択を押す札でも出す（BIZ-UIREF の「押す形も残す」と同じ） | 札が大きい（写真）。科目の札は小さい字なので、払う距離と誤操作の釣り合いは試す。消すことは取り返しがつかないので Google Photos は確かめの窓を出す（後の画面） |
| W19 | Quizlet の Know／Still learning | [流れ](https://mobbin.com/flows/6e6d62b6-eadd-492e-86bc-8e893d074802)：[1](https://mobbin.com/screens/98362fa0-3d46-424b-88c8-6805491d7f50)・[2](https://mobbin.com/screens/a6fa907d-6b71-4ae5-89d8-0c67e196bd09)・[3](https://mobbin.com/screens/80a4c6a5-566b-4005-a227-16ff5eac01e0)・[4](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)・[5](https://mobbin.com/screens/818753de-b0a1-4e66-b033-95298fa217c4)・[6](https://mobbin.com/screens/f0707e72-e036-47fa-8f58-99e2387ba0ff)・[7](https://mobbin.com/screens/20636ebc-0eec-4627-9917-7a9c1dd91f74) | 上の左に橙の丸「0」、右に緑の丸「0」（**2つの箱の数が常に見える**）。札を右へ引くと緑の枠と大きな「Know」、左へ引くと橙の枠と「Still learning」、引いた側の丸が「+1」。下に戻る矢印（取り消し）。終わりは緑の輪「94%」と Know 64・Still learning 4、「Keep reviewing 4 terms」 | 引く途中で札の色と字が変わる→離す前に「どちらへ入るか」が分かる→入れた側の数が増える→取り消しがすぐそこにある | 仕訳の札を左右へ払う時、**引いている途中で行き先の欄（借方・貸方の山）が光り、札に行き先の名が出る**。左右の山の数が上に見える | Quizlet の振り分けは自己申告（覚えたか）で、正誤はない。仕訳は正誤があるので、払った後に正誤の返しが要る。この画面は MB3 も引いている（学びの側） |
| W20 | mymind の Forget／Keep | [画面](https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e) | 中央に写真の札1枚、下に青い細い輪の丸い札「Forget」「Keep」、点の進み、橙の帯の知らせ「Card deleted and moved to trash.」 | 2択を**押す丸**で出す→結果を帯で知らせる→消しても「ごみ箱へ」なので戻せる | 押す形の振り分け（スワイプが苦手な人・PC） | 押す丸が小さく札から遠い。スワイプとの両立は W18 の方が分かりやすい |
| W23 | ドラッグ＝並べ替え（SiriusXM・The Weather Channel） | [SiriusXM](https://mobbin.com/screens/a29d4250-9d1a-4d95-bb99-6c5f6cb28178)・[The Weather Channel](https://mobbin.com/screens/5b4d61e9-1fd4-469b-8e32-cd9f9f565fcf) | SiriusXM：灰色の帯「Press and drag an item to move it.」、持ち上げた CNN の行が影つきで左にずれる。Weather Channel：説明2行「Drag and drop activities into the order you prefer…」、Hiking の札の右に小さな写しが浮く。同じ問いの12件すべてが並べ替え | 持ち上げた物に影と浮き→どこへ動くかが分かる。ただし**使い方を文で言い添える**必要があった | 決算書の行を区分へ並べ替える操作（PEDAGOGY 1.3 の P5 の sort）にはそのまま合う | **分類（箱へ入れる）にドラッグを使う実例はなかった**（F2）。スマホでは長押し→引く→離すの3手で、押す1手より遅い |

※W21・W22・W24・W25 は欠番（書いている途中で、W6・W27・W11・W13 と同じ画面だと分かったので消した）。

### E. 反映の見え方（選んだ科目はどこへ行ったか）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W26 | Apple Wallet の支払いの完了 | [画面](https://mobbin.com/screens/25fc692d-19a1-4de4-a63f-b0a6ecca0bd6) | 黄緑から緑へ変わる輪と緑のチェック、太字「You Paid US$12.94」、灰色の3行「…will be reflected in your balance within 24 hours.」、黒い Done | 終わった時に**どこへ、いつ反映されるか**を一文で言う→待つ理由が分かる | 掛けの取引・手形の決済で「お金は月末に口座から出ます」の一文。記帳と現金の動きの時差（P3、黒字倒産）を言葉にする | 1文だけで絵がない。反映そのものは見せない（W27・W28 と組む） |
| W27 | Cleo の In／Out の硬貨の山 | [画面](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626) | 紫の地に「FEBRUARY'S BREAKDOWN」と緑の細い線「11 days left」。左の山 In（青い硬貨、緑の札 Other、$326）、右の山 Out（金の硬貨と紫の Due、その上に灰色の積みが Limit の高さまで、札 Spent・Due、$188）。下に紫の手の絵 | 2つの山が**高さで比べられる**→硬貨が積まれる物の比喩でお金の量が分かる→まだ払っていない分（Due）が別の色で積まれる | **T勘定の山**：仕訳を確定すると、借方・貸方の山に硬貨が積まれる。未払い（未払金・買掛金）は別の色。科目ごとの山を並べると試算表 | 山の高さは額が大きく違うと見えなくなる（$326 と $188 程度の差が限界）。立体の硬貨の絵は作る量が多い（チープさの問題、BIZ-UIREF 18章 問5） |
| W28 | Mercury（web）お金の流れの図 | [画面](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9) | 左に入りの源（MOBBIN PTE. LTD.・Amazon・Fi・Liberty Mutual・Rover・Other）が青紫の帯で「Money In」へ集まり、灰色の帯で「Expenses」へ、さらに右の行き先（Refero・Uphold・Amazon・Apple・Fi.Dogs・Other）へ分かれる。左の欄に気づき3つ（「4 uncategorized payments」） | 帯の太さで額、つながりで行き先が一目で分かる→自分の分類が図の帯になる→「分類していない」が気づきとして出る | **月の締めの「お金の流れ」**：その月の仕訳が、源（売上・借入）→口座→行き先（仕入・給料・家賃）の帯になり、自分が選んだ科目の帯がどれかを光らせる。オーナーの原文「どこに反映されてるかわからない」への答えの本命 | 帯が多いと細くなって読めない。2級の仕訳には現金を通らないもの（減価償却）があり、お金の流れの図には出ない。帳簿（試算表）の図と2つ要る |
| W29 | Expensify（web）店の種類→分類の表 | [画面](https://mobbin.com/screens/f5b4a2cc-77d8-4a1c-82db-32dbc9b38374) | 3列の表 GROUP・DESCRIPTION・CATEGORY：Airlines→Travel、Gas→Car、Groceries→Meals and Entertainment、Mail→Office Supplies… | 「どんな店なら、どの分類」を表にする→同じ種類の取引が自動で同じ分類に入る | **自動仕訳ルールの棚**（PEDAGOGY 1.6）：登録した決まり（「問屋から掛けで仕入→仕入／買掛金」）を表で並べる | 表は業務の見た目。ゲームでは決まりを札の束にして、監査が条件の外の札を混ぜる |
| W30 | Airwallex の経費の細目 | [画面](https://mobbin.com/screens/29b835da-3f61-49a1-b3a6-448b5e23d949) | 「Receipt」に小さな領収書の絵と「View receipt」、Amount claimed 2.50 SGD、Merchant Post Office Ltd.、「Line items (2)」に Shipping fee 1.50・Mail stamp 1.00、Total 2.50 SGD | 証憑（領収書）と行の明細と合計が同じ頁にある→どの行が書類のどこから来たかが追える | **証憑の札**（PEDAGOGY 1.7 の証憑タップ）：領収書の絵の上の行を押すと、仕訳の行に額が入る | 文字の並びだけで、領収書の絵は小さい。ゲームでは証憑の絵を主役にする |

### F. 判断の予告と比べ（シミュレーター・おすすめ・比べ）

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W31 | Redfin の Affordability Calculator | [画面](https://mobbin.com/screens/af24a9b8-c6eb-4097-ac80-c2f1f2ded4e3) | 大きな「$311,318」、Monthly payment $1,712・Down payment 16.1%、「Debt-to-income ratio: 41% \| Stretch」、**青緑→橙→赤と色の変わるつまみ**、黄色の三角「Exceeds recommended debt-to-income ratio.」 | つまみの位置の色で「安全・きつい・危ない」が分かる→危ない側では注意の一文→判断は人に任せる（禁止しない） | **借入・出店の判断**：借りる額のつまみと、返済の重さの色の帯。危ない帯では銀行の担当の一言（PEDAGOGY 1.5 の資金繰り） | 予告が正確すぎると判断の手ごたえが消える（第1回 M14 と同じ）。色の境目を固く見せると「赤に入らない」だけの遊びになる |
| W32 | Monzo の見込みの幅 | [画面](https://mobbin.com/screens/a196ebe3-0c04-4b4e-8241-201b961696a7) | 「25 Years」と大きな「£49,151.13 Projection」、線のグラフ（橙の積立、緑の見込み、**薄緑の帯 Likely range が £30K〜£64.9K に広がる**）、「Monthly Deposits: £100」のつまみ、「You could get back less than you invest」 | 見込みを1本の線でなく**幅**で見せる→運があることが先に分かる→外れても裏切られた感じが小さい | **作戦の机の試算**：値段や仕入れを決めると、来月の客数・もうけを幅で出す（いまの試算の幅＝README-autoplay の延長ではなく、主役の見せ方として） | 幅が広いと「何を選んでも同じ」に見える。幅の見せ方は決める前に試す |
| W33 | Shopee の Loan Simulation | [画面](https://mobbin.com/screens/75324601-2929-4219-a6fe-3110888e9aeb) | 橙の大きな「Rp25.000.000」と橙のつまみ（500.000〜100.000.000）、「Select Tenure」の6つの札（12 months が橙）、「Monthly Repayment Rp2.570.833」と「Assume instalment fee rate is 1.95%/month」 | 額と期間の2つを選ぶ→月の返済が即座に出る→借りる重さが「毎月いくら」で分かる | **借入の判断**（借入金・支払利息・未払利息の論点の入口）：額と期間を選ぶと、毎月の返済と利息の札が出る | 消費者金融の画面で、借りることを勧める作り。ゲームでは「借りない」の札も同じ重さで出す |
| W34 | Monzo の比べの表 | [画面](https://mobbin.com/screens/dee30ae9-d5ee-4948-9cfe-7e68c6e4dc07)（[Plus](https://mobbin.com/screens/56c0f428-eb63-4cb2-8f66-f2a92ab61bc9)・[Premium](https://mobbin.com/screens/8248afc0-6363-46a0-b845-fda5e2b05ad9)） | 列に3枚のカードの絵（Free 赤・Plus 青・Premium 白）、行ごとに灰色の×と緑のチェック、利率の行 4.10%／4.60%／4.60%、最下行 Price a month Free／£5／£15。Plus と Premium の頁は上の切り替えで行き来 | 列を絵で見分け、行は×とチェックで差だけが目立つ→比べる軸が揃う | **リースか購入か**（PEDAGOGY 1.4 の判断）：「買う／リース」の2列で、毎月の出・決算の見え方・中途解約の行を×とチェックで比べる | 課金の頁の作り。比べの表は答え（どちらが得か）を示しがちなので、行は事実だけにする |
| W35 | BitePal の「Recommended」 | [画面](https://mobbin.com/screens/52067204-a95e-43b0-b8c9-011c736417bb) | アライグマの吹き出し「How fast you want to achieve your goal?」、大きな「0.4 kg」、つまみの上に緑の札「Recommended」、Slow・Optimal・Fast、白い札「Reach your goal by 27 December」 | 案内役がおすすめの位置を示す→選んだ結果を日付で言う | 年の目標の立て方（MB1 の範囲と重なる）、作戦の机の「先輩のおすすめ」 | おすすめが正解を教える。学びの判断（理由の選択）には出さず、経営の判断の参考に限る |
| W36 | Brilliant の釣り合いの棒 | [画面](https://mobbin.com/screens/7df5c89a-cc35-4e23-9aa6-c26cac73678c) | 式「2x + 2 = y + 6」の下に2本の棒（上は橙の x 2つと青の 2、下は紫の y と青の 6）、長さを比べる灰色の溝、x と y の目盛りのつまみ（1 と 5）、灰色の Check | **両辺を長さの棒にする**→つまみを動かすと棒が伸び縮み→長さが揃うと等しい、が目で分かる | **貸借の釣り合いの棒**：仕訳の左右を2本の棒にし、行を足すと棒が伸びる。長さが揃うと確定（W10 の「差の数」と組む） | 抽象の図で、店の世界とつながらない。見た目は学びのアプリ（教科書の画面に戻る恐れ、PEDAGOGY 0.2） |
| W37 | Formula 1 の予想の札 | [画面](https://mobbin.com/screens/a8c724bd-26fe-4105-a82c-5ebb7fcbcd3a) | 黒い帯に残り時間「03D:02H:41M」、赤い点の進み10個、白い札に「Q10」と太字の問いと2行の手がかり、YES（10 Pts）と NO（15 Pts、黒いチェック）、赤い丸「2X Apply Chip」 | 選択肢ごとに**見返りの大きさが違う**→当たりにくい方が見返りが大きい→どちらに賭けるか考える | 経営の判断の札（「雨の予報、仕込みを増やす？」）：選ぶ前に「当たれば＋、外れれば−」の幅を各選択肢に添える | 点・倍の札・残り時間は量と時間の圧（K10）。写すのは「選択肢ごとに見返りの幅が違う」だけ |

### G. 予算の中で組み立てる・在庫・仕入れ

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W38 | Wonder・Uber Eats の「必須の数」 | [Wonder](https://mobbin.com/screens/d58fe905-4961-4f07-a6f5-279a7da50e59)・[Uber Eats](https://mobbin.com/screens/df9e20e9-2391-4de2-a795-25bbbad0f089) | Wonder：見出し「PROTEIN (SERVED CHILLED)」の右に「0/2」、「1 Required, Choose up to 2」、写真つきの行に +$3.00 など、「SIDE OF PITA 0/1 Required」、下に「Add — $10.25」。Uber Eats：「Required • Choose 1」と Reset、選んだ品の下に灰色の枠（How it Comes・Additional Toppings +$0.31）、下の黒い帯「Add 2 • $15.62」と打ち消しの $30.62 | 見出しごとに「いくつ選んだ／いくつ要る」の数→足りない所が分かる→合計の額が確定の札の上で動く | **一杯の組み立て**（第1回 M11 の発展）：麺・スープ・具の見出しごとに「0/1」、下の確定の札に「原価 ¥○○・売値 ¥○○」 | 業務の注文の画面で、組み立ての楽しさ（絵が変わる）はない。M11（CHOPT）と同じく絵で代える |
| W39 | Chipotle・sweetgreen の絵の組み立て | [Chipotle](https://mobbin.com/screens/0d630f70-79ce-485f-a335-ee62fb74d30c)・[sweetgreen](https://mobbin.com/screens/05a75920-f79f-4f0a-b953-d91bdb0d98fb) | Chipotle：茶色の太字「Build Your BURRITO」と、具の見える大きなブリトーの写真が上、下に具の写真と大きな字（CHIPOTLE HONEY CHICKEN $9.55 210 cal）、選んだ具の下に Normal／Double $3.60 の升。sweetgreen：ベージュの角丸の札に具の絵と名前が3列（Raw Carrots・Avocado・Roasted Chicken） | 完成の絵を上に大きく置く→具を選ぶ→量（Double）を同じ行で選べる | 一杯の組み立ての上半分に丼の絵、具の札は絵の札で3列、量（大盛り）は同じ行の升 | 写真は作れない。絵で作る量の問題（BIZ-UIREF 18章 問5） |
| W40 | Shopify（web）発注 | [画面](https://mobbin.com/screens/5528f405-0e95-4df2-90ff-6457bbf9ce15) | 上に「Mobbin Spice Traders LLC → Shop location」の**矢印**、表 Products・Supplier SKU・Qty・Cost・Total（4行×$200.00）、右に Cost summary「4 variants (200 items) $800.00」「Total $800.00」、Terms None | 「誰から→どこへ」を矢印で上に置く→行の数と単価で合計が右に集まる→支払条件（Terms）が同じ頁にある | **仕入れの札**：問屋→店の矢印、品と数、合計、支払条件（現金／掛け）。支払条件の選びが仕訳の貸方（現金か買掛金か）を決めることを、ここで先に見せる | 業務の画面。品が多いと表になる。ラーメン屋の仕入れは数品（麺・肉・野菜）なので札3〜5枚にする |
| W41 | Shopify の在庫・Thrive Market の品切れ | [Shopify](https://mobbin.com/screens/78129b1d-65a8-4e90-907f-b112f819f4f6)・[Thrive Market](https://mobbin.com/screens/c9a96ef6-03f8-4122-b08b-117204c2f2a2) | Shopify：行 Black・Beige・Blue の右に −・灰色の丸い枠の「100」・＋。Thrive Market：茶色の札「Out of Stock」と下線の「Remind me when in stock」、「Similar items (30)」に橙の札「Running Low」、各品に薄茶の「Replace」 | 数を ± で直す→品切れには代わりを並べる→「足りない」を出来事にする | **在庫の棚**（期末の棚卸・売上原価の論点）：食材の棚に ± と、品切れ・残り少しの札。品切れの日は「代わりの問屋」の札が出る | 在庫の ± は事務的。棚の絵（冷蔵庫の中）に置き換える。「Running Low」の札は急がせる圧になりうる |
| W42 | Xero（web）New Bill | [画面](https://mobbin.com/screens/e838b7af-a035-4d7d-944f-5e02a52ce379) | From・Date・Due Date・Reference、行の表 Item・Description・Qty・Unit Price・**Account**・Amount、右下に太い「TOTAL 0.00」、下に Save・「Approve and make payment」・緑の Approve | 請求書の行ごとに**科目（Account）**の欄がある→請求書を書き写すことと仕訳が同じ画面で起きる→承認で帳簿に入る | 届いた請求書の札の各行に科目の欄。承認（Approve）＝記帳、「承認して払う」＝記帳と支払いを一度に（買掛金を経ない） | 業務の画面そのもので空の表は退屈。ゲームでは請求書の絵の上に行を出す |

### H. 出来事・承認・取り消し

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W43 | Google Arts & Culture の物語の札 | [画面](https://mobbin.com/screens/5b3c4dd9-00f8-4ca7-847a-2a8f4b6857e1) | 紺の旗の題「Professor Sheldrake's Rooms」、線画の部屋、紺の飾り枠の札に斜体の白字「The room is empty. / Sheldrake isn't here.」、赤い「!」と帯「CLICK THE CHOICE BELOW TO CONTINUE.」、白い枠の選択肢 | 場所の絵を上に、短い2文と選択肢を下に→何が起きたかを場所で示す→次の手を選ぶ | **出来事の札**：店の絵（厨房・客席）を上半分、出来事の2文と選択肢を下半分 | 線画の古風な作風。選択肢が1つの所は「押すだけ」の紙芝居（オーナーの原文「紙芝居」）になる |
| W44 | Revolut Business・Airwallex の承認 | [Revolut 1](https://mobbin.com/screens/9a34e3c2-65fa-49e0-9a6f-5833c749d333)・[Revolut 2](https://mobbin.com/screens/92523bcc-943b-4b63-b82b-01106b6ea268)・[Airwallex](https://mobbin.com/screens/06b8c573-c826-44a5-9311-a1075fd57308) | Revolut：黒い地に「New virtual card」、白い「✓ Approve」と灰色の「✕ Reject」、Status Pending review と縦の線の時系列（Submitted for review→Owner Awaiting approval）、承認後は一覧に灰色の Approved と下の丸い知らせ「✓ Approved」。Airwallex：ロケットの絵と「You're all done!」、帯「You have rejected 1 request」 | 承認・却下の2つが頁の上に並ぶ→時系列で誰が決めたかが残る→終わると空の絵 | **社長の頼みごとを承認する**（社長ミライに振り回される物語）：社長の「これ買っていい？」の札に承認／却下、時系列に「社長が頼んだ→経理が決めた」 | 黒い業務の画面で、物語の顔がない。社長の顔と一言を足す（MB3 と重なる） |
| W45 | Gmail・Matter の取り消しの知らせ | [Gmail](https://mobbin.com/screens/d5187615-adaf-4a7d-ba16-c75ac4799634)・[Matter](https://mobbin.com/screens/df93ead5-408c-46ee-8099-40ac61f061da) | Gmail：下に黒い帯「Message archived.」と右に青い「Undo」。Matter：黒い角丸の帯「2 items archived」と右に「Undo」 | 操作はすぐ効かせ、**数秒だけ取り消しを出す**→確かめの窓で止めない→手早く進められて、誤りも戻せる | 仕訳の札を払った直後に「取り消す」の帯（月末の締めまでは直せる、PEDAGOGY 0.4 の「月末までに必ず修正」）。締めの後は訂正仕訳（論点）になる | 取り消しが楽すぎると、試し打ち（全部の科目を順に払う）になる。取り消しの回数を見て返しを変える |

### I. 地図・ライバル・店を育てる

| # | アプリ・画面 | Mobbin | 見た所 | 効く理由（A→B→C） | 本来のゲームでの置き場所 | 悪い面・合わない理由・ゲームとして合うか |
|---|---|---|---|---|---|---|
| W46 | TheFork の点数のピン | [画面](https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4) | パリの地図に白い吹き出しのピンで**点数（9.1・9.2・8.5・7.5・9.0）と緑の小札（-50%・-20%）**、選んだピンは濃緑「8.9 -30%」。下に店の札（料理の写真・Mulan・8.9・~€20・Up to -30%）と「Show list of 258 restaurants」 | ピンそのものに比べる数を載せる→開かなくても地図で比べられる→選ぶと下の札で詳しく | **町の地図**：ライバル店のピンに「評判の点」と「値下げ中」の小札。自店のピンは色を変える。Coffee Inc 2 の地図のピンの本来の形の候補 | 数が重なると読めない（パリの中心で既に重なる）。点数を常に出すと、比べの圧が強い |
| W47 | Apple Maps・Skip のまとまりのピン | [Apple Maps](https://mobbin.com/screens/ef125d25-1074-43b1-aa75-d643acc4ffc1)・[Skip](https://mobbin.com/screens/a93712a5-9bf3-4459-a59a-004f29b8b0a6) | Apple Maps：橙の丸いピンが重なる所は数「2」「3」と「+2 more」。Skip：白い丸に数（2・3・4・7・9）、店の印のピン、選んだ店の札「Mr.Sub 7 – 22 mins · 0.1 km」と橙の「7.6」 | 重なるピンを数の丸にまとめる→地図が読める→拡大すると割れる | 町が育って店が増えた時（2年目以降の支店・ライバル）のピンのまとめ方。BIZ-UIREF の「隠れるピンで誤タップ」への答え | まとめると個々のライバルの顔が消える |
| W48 | DoorDash の店の札 | [画面](https://mobbin.com/screens/ff560597-4452-4581-9ae3-557360a35206) | 赤いピンの密集の下に白い札「RT Rotisserie」4.8★ (20k+)・赤字 Closed、「PUNCHES」の点線の丸1〜7（2と5が黄色）、「31 people visited last week」、赤い「Check-in & use rewards」 | 店の札に「先週の来客の数」を1行で出す→その店の勢いが数で分かる | ライバル店の札に「先週の客 ○人」（Coffee Inc 2 のシェアの代わりの1行） | スタンプ（PUNCHES）は量への報酬（K10）。写すのは「先週の来客」の1行だけ。ピンの密集は W47 で解く |
| W49 | Bump・corner の地域の順位 | [Bump](https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9)・[corner](https://mobbin.com/screens/1b028e6a-46d9-4a26-8350-73c36ecbf607) | Bump：題「Climb the leaderboard」、順位表「Williamsburg」で**自分の行が浮き上がって**（六角の 2・Me・灰色の +7.17・大きな 83.2%・緑の▲）、下に 2 Frankie 77.4%▼・3 Me 76.3%▲…。corner：New York／Global の切り替え、2位と3位に「1 place in common with you」 | 町の名で範囲を区切る→自分の行だけ浮かせ、差を1つの数と矢印で示す→町と全体を切り替えられる | **ライバル店の順位**：「○○町のラーメン店」の売上・評判の順位で自店の行を浮かせ、先月からの±と矢印。全国の切り替えは置かない（町の中の競争に絞る） | 他人（実在の人）と競う形は写さない（K10、PEDAGOGY 1.8）。相手はゲームの中のライバル店だけ。第1回 M12 と同じ注意 |
| W50 | Google Arts & Culture・Philips Hue・Fi の等角の部屋 | [Google Arts & Culture](https://mobbin.com/screens/ec23b20f-835e-49d4-aaf6-006299baa54b)・[Philips Hue](https://mobbin.com/screens/8461968f-48e3-4870-980c-3c140c07fcdb)・[Fi](https://mobbin.com/screens/acc72465-033d-4339-a896-87295db18b07) | Google A&C：斜め上から見た白い部屋の断面（黒いカーテンの壁、絵2枚、緑の長椅子）、物に付いた名札、下に丸い札（筆・枠・ごみ箱）と黄色の DONE。Hue：紺の地の灰紫の等角の部屋の床に黄色く光る明かりの印、左下に金の枠の札「Light」。Fi：線画で3つの床を切った家、置き場所の候補に黄色い輪 | 部屋を斜め上から切って見せる→物を置く場所が一目で分かる→置いた物に名札 | **店の断面**（BIZ-UIREF 3章、第1回 M1 の発展）：等角に切った店（厨房・客席・倉庫）に、買った設備（券売機・寸胴・看板）を置く。置いた設備に名札と取得原価（固定資産の論点の入口） | 回さない等角でも読み違いはある（Tversky、BIZ-UIREF 18章 問4）。絵の量 |
| W51 | Finch の家具の店 | [画面](https://mobbin.com/screens/7966062b-2480-48b7-abce-d868ca9eb345) | 上に虹色の石の通貨 2,159、青い看板「Finkea Furnishings」と「50% OFF SALE 450」、鳥のキャラ Robin の吹き出し、「Items refresh: 21:07:43」と FREE、家具の札に値段 500・900・500 | キャラが店番をし、品の札に値段→買うと部屋が変わる | 店の改装の買い物（看板・暖簾・椅子）で、問屋のキャラが一言 | 通貨・時間で入れ替わる品・無料の札は課金と時間の圧（K10）。写すのは「品の札と店番のキャラの一言」だけ |
| W52 | Cash App のはじめての購入 | [画面](https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f) | 緑の丸に白いチェック、大きな太字「Congrats on your first purchase of bitcoin on Cash App!」、小さな字「You bought $1 of bitcoin」、緑の細い紙吹雪 | 「はじめて」の時だけ祝う→量ではなく初めての出来事に印 | **良い出来事**：はじめての黒字の月、はじめて手形を受け取った、など論点の初登場に1回だけの祝い（PEDAGOGY 1.2 の「名前がつく」と同じ時） | 毎回出すと量の報酬になる。初回だけ |

## 本来あるべき設計の素案

MB2 の範囲（遊びの芯の操作と判断・世界）。各画面の「主役」「情報の階層（上から）」「操作」「動き」「根拠の実例」。この章は全部が実例からの類推【推論】で、遊ぶ人では確かめていない。試作で確かめる前提。

### 画面の一覧

| 画面 | 主役 | 情報の階層（上から） | 操作 | 動き | 根拠 |
|---|---|---|---|---|---|
| ① 月の受け箱 | 次の書類1枚 | 店の絵（小）→「今月の書類 あと3枚」→次の書類の札（相手の顔・1文・額）→記帳済みの札（薄く、下へ畳む） | 札を押すと仕訳の机へ。全部終えると「締める」 | 記帳を終えた札が畳まれ、箱の数が減る。空になると大きなチェックと「締めへ」 | W1・W2・W3・W5 |
| ② 仕訳の机（芯） | 書類の札と、左右2本の山（棒） | 上端：左右の差の帯（「左 ¥30,000／右 ¥24,000／差 ¥6,000」、差が0で緑）→書類の札（証憑の絵、押すと値を拾う）→左右2本の山（借方・貸方。積んだ札の名と額）→科目の棚（5区分の色、場面で使いうる4つ＋「全部の棚」）→確定の札（差が0になるまで灰色） | (1) 証憑の値を押して拾う (2) 科目の札を押す (3) 左か右へ払う（スワイプ）または左右の押す札 (4) 額は拾った値か計算パッド (5) 差が0で確定 (6) 理由を1つ選ぶ（Who／What／Why の Why） | 払った札が山に積まれ、山が伸びる。差の帯の数が動く。確定で両方の山が光り、取り消しの帯が数秒出る | W10・W12・W18・W19・W27・W36・W7・W30・W45 |
| ③ 書類の裏返し | 同じ取引の2つの見え方 | 表：日常の言葉（「問屋から麺を掛けで買った ¥30,000」）／裏：仕訳の行（仕入 30,000／買掛金 30,000）。決まるまでは「仮」の科目 | 札を裏返す | 裏返る動き。仮の科目は月末までに消す印 | W16・W4 |
| ④ 反映の図（月の途中でも開ける） | 選んだ科目がどこへ行ったか | 上：お金の流れの帯（売上・借入→口座→仕入・給料・家賃）／下：科目の山（試算表）。今確定した仕訳の帯と山だけ光る | 帯・山を押すと、その科目の仕訳の一覧 | 確定のたびに該当の帯が太り、山に硬貨が積まれる | W28・W27・W8・W26 |
| ⑤ 決まりの提案と決まりの棚 | 自分で作った決まり | 同じ型を3回・別の月で正しく切った直後の知らせ「この切り方を決まりにする？」→決まりの文を組む→決まりの棚（札の束） | 知らせから組む。棚の札を外せる | 決まりの札が棚に入る。監査の月は条件の外の札が混ざり、払いのけて確かめる（W9） | W15・W29・W9 |
| ⑥ 作戦の机（判断の予告） | 選ぶもの（値段・仕入れ・借入）と結果の幅 | 選択肢の札（各に「当たれば／外れれば」の幅）→つまみ（値段・借入の額）→結果の幅の帯（客数・もうけ）と危ない帯の色→比べの表（リースか購入か） | つまみ・札を押す | つまみに合わせて幅の帯が動く。危ない側で色と一言 | W31・W32・W33・W34・W37 |
| ⑦ 仕入れと在庫 | 問屋→店の矢印と、冷蔵庫の棚 | 問屋の顔と矢印→品の札（数・単価）→合計→支払条件（現金／掛け）→棚（± と品切れの札） | 数を ±、支払条件を選ぶ | 届いた品が棚に入る。支払条件で、②の右の山に入る科目が変わることを予告 | W40・W41・W42 |
| ⑧ 出来事と承認 | 店の場所の絵と、大きな数1つ | 場所の絵（上半分）→大きな数（「給料日前の支払い ¥19万」）→2文→選択肢／社長の頼みの札は承認・却下と時系列 | 選ぶ・承認・却下・左右に払う（続ける／やめる） | 大きな数が先に出て、次に吹き出し | W17・W43・W44・W52 |
| ⑨ 町 | 自店とライバル店のピン | 地図（回さない等角）→ピンに評判の点と「値下げ中」の小札→重なるピンは数の丸→店の札（先週の客・評判）→町の順位（自店の行を浮かせ、±と矢印） | ピンを押す、順位を開く | 自店の行が浮く。月ごとに矢印が変わる | W46・W47・W48・W49 |
| ⑩ 店の断面 | 等角に切った店 | 店の断面（厨房・客席・倉庫）→置いた設備の名札（取得原価）→下に置ける物の札 | 物の札を押して置く場所を選ぶ（ドラッグではなく、場所の候補の輪を押す） | 置くと名札が付く。客が座る | W50・W51 |

### 仕訳の机（②）を言葉で再現する

- 縦長のスマホで、上端 8% に「左右の差」の帯（W12 の固定の帯）。差が0でない間は灰色の地に黒字、0で緑の地に白字「左右がそろった」。
- その下 30% に書類の札（W30 の証憑）。金額・日付・相手の所は押せる枠。押すと値が下の計算パッドへ。
- 中央 35% に左右2本の山（W27 の硬貨の山、W36 の棒）。左が借方、右が貸方。積んだ札には科目名と額。山の上に合計。
- 下 20% に科目の棚。5区分の色の帯の上に、その場面で使いうる科目4つ（W7）。うち少なくとも1つは典型の誤り（分かれ道表）。右端に「全部の棚」。
- 科目の札を押すと札が持ち上がり、左右に「借方へ」「貸方へ」の押す札が出る。同時に、札を左右に払えば同じこと（W18：初回だけ札の上に「左へ払うと借方」の字）。払う途中で、行き先の山が光り、札に山の名が出る（W19）。
- 確定は差が0になるまで灰色（W10）。確定すると両方の山が光り、下に「取り消す」の帯が数秒（W45）。続いて理由を1つ選ぶ（PEDAGOGY 1.3、W10 の Why の欄）。
- 学びの段では、片方の額を入れても反対側を自動で埋めない（W13 の自動の合わせは使わない）。決まりにした型（W15）は自動で積まれ、山の札に決まりの印。

### 1か月の流れ

月の受け箱（①）→ 書類を1枚ずつ仕訳の机（②）→ 途中で反映の図（④）を開ける → 出来事・承認（⑧）が受け箱に差し込まれる → 作戦の机（⑥）・仕入れ（⑦）の判断は書類を生む（仕入れの判断→請求書の札が受け箱へ） → 受け箱が空になると締め（Xero の「Closed period」の札、[画面](https://mobbin.com/screens/beb6c16c-ecae-4461-87bd-d95c9d001054)：期間と緑の小札「Closed period」と「Closed by…」） → 町（⑨）・店の断面（⑩）に結果が返る。

## 反対の事実と合わない型

### オーナーの好み（ドラッグ・スワイプ・Coffee Inc 2）と同じ向きの結論への反対の材料

| # | 結論の向き | 反対の事実（Mobbin で見たもの） | 別の解釈 |
|---|---|---|---|
| F1 | 家計アプリの「分類を1つ選ぶ」形を仕訳に写す | 家計アプリの分類は片側だけ（Monarch の Account は自動、W4）。2級の取引の多くは現金を通らない（掛け・減価償却・引当・振替）。家計の分割（W11）も同じ側を分けるだけ | 片側の型は導入の数か月だけに使い、早い段で両側を選ぶ机（②）へ移る。家計の型を芯にすると「現金が動く取引しか分からない人」を育てる恐れ |
| F2 | ドラッグで科目を入れる（オーナーの原文「ドラッグ…で科目を入れていくスタイル」） | 「drag and drop a card into a bucket or folder to categorize」の結果12件はすべて並べ替え（W23）。分類の画面（W6・W7・W8・W11〜W13）はどれも押す。SiriusXM は使い方を帯で言い添えた | Mobbin はアプリの画面の集まりで、ゲーム（パズル）のドラッグは載っていない【推論：第1回の要点1と同じ】。ゲームの文脈ではドラッグが好まれうる。BIZ-UIREF の R の声（Unpacking の指、押す方が早い声）と合わせて試作で比べる |
| F3 | スワイプで仕分ける（オーナーの原文「スマホならswipeで」） | 見たスワイプは全部2択（W17〜W20・W9）。Google Photos と mymind は同じ2択を押す札でも出す。Quizlet の2択は自己申告で正誤がない | 科目は数十あるので、スワイプは「左右（借方・貸方）」の段にだけ置ける。スワイプを科目選びに使うなら、札を何段にも分ける（資産か？→流動か？）作りになり、段が多いと遅い |
| F4 | 差を0にする遊び（要点1） | Xero は差を「Minor adjustment」で埋められ、赤字の警告つきで確定できる（W10）。差を埋める札があると、誤りの仕訳を雑損で合わせる逃げ道になる。Copilot は自動で合わせる（W13） | 差が0でも科目が誤りのことはある（貸借は合うが科目違い）。差の帯だけでは正しさは示せないので、確定のあとの正誤の返し（PEDAGOGY 1.1 の即時の返り）と組む |
| F5 | Coffee Inc 2 の地図（オーナーの原文「Coffeeinc2をしっかりとパクっていきたい」） | 経営シムは Mobbin にない（第1回と同じ）。地図は店探しのアプリで、ピンの密集（DoorDash、W48）とその解き方（まとめの数の丸、W47）が見えた。点数をピンに載せると重なる（TheFork、W46） | Coffee Inc 2 の地図の手ざわりは Mobbin からは確かめられない。W46〜W49 は「地図に比べる数を載せる」型の一般の実例で、Coffee Inc 2 の再現の根拠にはならない |
| F6 | 反映の図（④）で「どこに反映されたか」が分かる | Mercury の流れの図は帯が多いと細い。現金を通らない仕訳（減価償却）は流れの図に出ない（W28）。Cleo の山は額の差が大きいと高さで比べられない（W27） | 反映の図は2つ（お金の流れと科目の山）要る。1つで済ませると、現金でない論点（P3・P4）の反映が見えないまま残る |

### PEDAGOGY の禁止（K10・1.8）に当たる型と、写す部分

| 型 | 当たる禁止 | 写す部分 |
|---|---|---|
| Copilot「19 transactions to unlock Intelligence」（W1） | 量で機能を解く | 次の1枚を主役にする所だけ |
| Formula 1 の点・倍の札・残り時間（W37） | 量・時間の圧 | 選択肢ごとの見返りの幅 |
| DoorDash の PUNCHES（W48） | 量への報酬（スタンプ） | 先週の来客の1行 |
| Finch の通貨・入れ替わりの時間・FREE（W51） | 課金・時間の圧 | 品の札と店番の一言 |
| Bump・corner の他人との順位（W49） | 他人と競う量 | 町のライバル店（ゲームの中）との比べ、自店の行を浮かせる |
| Cash App の祝い（W52） | 毎回なら量の報酬 | 初回だけ |

### 業務の画面をそのまま写すと事務になるもの

Xero（W10・W42）、QuickBooks（W5）、YNAB の web（W3）、Mercury（W16・W28）、Expensify（W29）、Shopify（W40）は、業務の表そのもの。写すのは型（差の数・0で色づく確定・矢印・行ごとの科目・裏返し）だけで、表の見た目は写さない。各行の「悪い面」の欄に書いた。

## うまくいく理由

1. **差の数→確定の色→誤りが入らない**：W10・W11・W12・W14 は、残りの差を大きな数で常に出し、0になった時だけ確定の札が色づく。人は「何をすれば終わるか」が分かり、終わった瞬間がはっきりする。帳簿の側から見ると、合わない記録が入らない。会計の貸借一致と遊びの「終わりの合図」が同じ物で表せる。
2. **1枚ずつ→箱が空→状態が報酬**：W1・W2 は次の1枚だけを主役にし、空になると大きなチェック（「You reviewed everything!」）を出す。報酬は量（何枚やったか）ではなく状態（全部終えた）で、PEDAGOGY 0.1 の「量への報酬は使わない」と両立する。
3. **2つの見え方の切り替え→仮の置き場→いつも合っている**：W16 は同じ取引を日常の見え方と帳簿の行で切り替え、決まる前のお金を仮の科目に置く。帳簿は常に合い、人は後で分類を決められる。2級の仮払金・仮受金の論点と同じ仕組み。
4. **途中で行き先が分かる→離す前に直せる→誤りが減る**：W18・W19 は札を引く途中で色と字が変わる。離す前に行き先が分かるので、押し間違いを離す前に直せる。
5. **手でやった直後の提案→自分の操作が決まりになる**：W15 は分けた直後に「次から自動に」を出す。PEDAGOGY 1.6 の自動仕訳ルールの「熟達の結果としての進捗」に合う。
6. **予告を幅で出す→運を先に知る→外れても納得**：W32 は見込みを帯の幅で出す。運の要素（PEDAGOGY 1.5 の改訂）と予告を両立させる。

## うまくいかない理由

1. **2択の操作→数十の科目に合わない**：スワイプは2択（F3）。科目選びに使うと段が増え、遅くなる。
2. **業務の見た目→事務の画面→ゲームにならない**：差を0にする型の実例は業務の画面（Xero）が中心で、そのまま写すと「教科書が画面に置きかわっただけ」に戻る（PEDAGOGY 0.2）。
3. **自動で合わせる→考えが消える**：W13（Copilot の自動の合わせ）・W12（残りを入れる）は便利だが、学びの段では貸借の考えそのものを奪う。
4. **逃げ道の科目→誤りが隠れる**：W10 の調整・W16 の仮の科目は、ゲームでは誤りを隠す逃げ道になる（F4）。
5. **量の圧→続ける理由が作業になる**：W1・W37・W48・W51 の量・時間の型（K10）。

## 反証と限界

- **ゲームの画面がない**：Mobbin にはゲームそのものが載っていない（第1回と同じ。今回の地図・部屋の問いでも経営シムは0）。操作の型はアプリからの類推で、ゲームで同じように効くかは分からない。
- **静止画だけ**：動き（払う速さ・山が積まれる動き）は見ていない。流れの画面の並びから途中の状態を推した。
- **ドラッグの実例の不在は「ない」の証明ではない**：問い1つ（12件）と分類の画面の観察から。Mobbin がドラッグの分類を収めていないだけかもしれない（F2）。
- **家計の画面に偏る**：51/117（資料の内訳）。業務の会計（19）と合わせると6割が金融で、遊びの手ざわりの実例（ゲーム的なもの3、部屋の絵4）は少ない。
- **遊ぶ人での確かめはない**：中高生（対象は15歳以上、HANDOFF 2章）で試していない。
- **書き手の取り違え**：取得の途中で、画面の id と image_url を取り違えた記録が2件ある（やっていないこと）。根拠には使っていない。

## 捨てた案と理由

| 捨てた案 | 理由（学習効果・面白さ・正しさ・規約のどれか） |
|---|---|
| 科目選びそのものをスワイプにする（科目の札を次々にめくって「これ」で払う） | 学習効果・面白さ：Mobbin のスワイプは全部2択（F3）。数十の科目をめくるのは遅く、偶然の正解が増える。2択の段（左右）にだけ置く |
| 片方を入れると反対側を自動で埋める（Copilot W13 の型）を学びの段で使う | 学習効果：貸借を合わせる考えが消える。習熟した型（決まり）だけ自動 |
| YNAB の「Give every dollar a job」を仕訳の机に写す | 正しさ：予算の配分と記帳の事実を混ぜると、記帳＝予算と誤解させる。資金繰りの画面だけに置く（W14） |
| ドラッグを分類の主な操作にする | 学習効果・面白さの根拠が Mobbin にない（F2）。並べ替え（P5）には使う。分類は押す＋2択のスワイプ。ドラッグを捨てたのではなく、試作で比べる候補として残す |
| 他人（実在の人）との順位 | 規約ではなく PEDAGOGY 1.8・K10（学習効果：量の報酬） |
| 差を埋める「雑損」の札を常に出す（Xero の Minor adjustment） | 学習効果：誤りを隠す逃げ道。現金過不足の論点の月だけ出す |

## 論証の表

| 結論 | 根拠の事実（出典） | 推論の形 | 暗黙の前提 | 反対の事実 | 別の解釈 | この結論で作り手の仕事は増えるか減るか |
|---|---|---|---|---|---|---|
| 仕訳を「差を0にする遊び」にする（要点1） | W10・W11・W12・W14 の「差の数→0で確定」 | 類推（業務・家計→ゲーム） | 差が見えると終わりたくなる気持ちが、ゲームでも働く | 差が0でも科目違いはある（F4）。Xero は警告つきで差を埋めて通す | 差の数は「作業の残り」で、楽しさではなく義務感を生むかもしれない | 増える（左右の山・差の帯・確定の色を作る） |
| 仕訳の入口は片側から（要点2） | W4 の Account／Category、W16 の Journal Entry | 類推 | 家計アプリで慣れた形が入りやすい | 2級の多くは現金を通らない（F1） | 片側から入ると、両側を選ぶ段で混乱するかもしれない | 増える（段を2つ作る） |
| 月＝受け箱を空にする（要点3） | W1・W2・W3・W5 | 類推 | 空の状態が量でない報酬として働く | Copilot は量で機能を解く（W1）。QuickBooks の 762 は圧 | 受け箱の数が「宿題の残り」に見え、作業感を強める | 増える |
| スワイプは2択の段にだけ（要点4） | W17〜W20・W9 の全部が2択 | 一般化（見た6件から） | Mobbin の外にも多択のスワイプは少ない | Mobbin にゲームがない（反証と限界） | 多択のスワイプ（上下左右の4方向）はゲームにはある【問い：確かめていない】 | 減る（スワイプの段が少ない）→ 反対の事実と別の解釈を2つ以上：上の2つと、F2 の「押す方が早い声」 |
| ドラッグの分類の実例はない（要点5） | 検索7の12件が全部並べ替え | 一般化（1つの問い） | 問いの言い方が適切だった | 問いが1つで、言い換えていない（やっていないこと） | Mobbin の収録の偏り | 減る（ドラッグを作らない向き）→ 別の解釈：収録の偏り、ゲームでは好まれうる、オーナーの試遊の感想（「UXは良いのでは？」）。この結論は「捨てる」ではなく「試作で比べる」に留めた |
| 反映を流れの図と山で（要点6） | W27・W28 | 類推 | 図を見れば反映が分かる | 帯が多いと読めない、現金でない仕訳は出ない（F6） | 図より、店の絵の場所が光る方が分かる（第1回 M18） | 増える |

## 依頼の対応表

| 依頼の原文（一文ずつ） | どこでどう応えたか |
|---|---|
| 「今やっていることに合わせてProgress indicator や Dashboardとかも含め本ゲームのコンセプトに合うデザインUi/UXをmobbinで探索・引用してきて。」 | MB2 の範囲（操作と判断・世界）で実例48件・画面117枚（数の出力）を Mobbin の頁で引用。進み具合・ダッシュボードは MB1 の範囲。MB2 では反映の見え方（W26〜W28）と受け箱の空（W2）が近い |
| 「抜本的にデザインとユーザ体験を見直すことを想定している。」 | 本来あるべき設計の素案（10画面）。いまの画面の小直しは書いていない |
| 「「いまつくっているものに取り込むならどうか」ではなく「本来あるべきデザインとしてどうか」という視点で。」 | 各実例の「本来のゲームでの置き場所」は体験の芯（1か月＝受け箱、仕訳＝差を0にする、反映＝流れの図）で書いた。いまのコードへの合わせ方は書いていない |
| 「research-fetchの記録には残せよ。テキストだけ見てもわからんだろ」 | 引いた画面は全部 research-fetch で取得し、読了ノートの image_seen に見た所を書いた（数の出力）。一覧の画像18枚を開いた |
| 「自分が左右選んだ科目が帳簿のどこに反映されてるかわからない」 | 要点6、E 章（W26〜W30）、素案の④反映の図と②の山。反対の事実 F6 |
| 「ドラッグ、スマホならswipeで科目を入れていくスタイルの方がUXは良いのでは？」 | D 章（W17〜W23）、要点4・5、F2・F3。スワイプは2択の段に、ドラッグは試作で比べる候補に |
| 「Coffeeinc2をしっかりとパクっていきたい。徹底的に。」 | I 章（W46〜W50）を地図・順位・店の断面の型として。F5：Coffee Inc 2 そのものは Mobbin になく、ここからは再現の根拠にならない |
| 依頼文 MB2「取引を振り分ける・分類する操作（家計アプリ…）＝仕訳の本来の形」 | A〜C 章。Copilot・Monarch・YNAB・Cleo・Quicken・Buddy を flows で全画面（数の出力）。Mint は Mobbin の結果に出なかった（やっていないこと） |
| 依頼文 MB2「判断のカード・選択肢と、その結果の予告」 | F 章 W31〜W37、素案⑥ |
| 依頼文 MB2「予算・上限の中で選ぶ・組み立てる、在庫・仕入れ・発注」 | G 章 W38〜W42、W14、素案⑦ |
| 依頼文 MB2「出来事・トラブル・お知らせのカード（良い出来事も）、承認・取り消し・やり直し」 | H 章 W43〜W45、W17、W52、素案⑧ |
| 依頼文 MB2「地図と場所、ライバル・比べ・順位、店や部屋を育てる・飾る」 | I 章 W46〜W51、素案⑨⑩ |
| 依頼文 4章 6「反対の事実・悪い面」 | 「反対の事実と合わない型」F1〜F6、禁止の型の表 |
| 依頼文 5章 3「Duolingo ばかり（最大3分の1）」 | Duolingo は0。一番多いアプリは Monarch 15/117（数の出力） |

## やっていないこと

- **書いた本人以外の判定・論証の検査を受けていない**（QUALITY 2.3・5章）。
- **Mint は探せていない**：「budgeting app swipe to categorize transactions」などの問いの結果に Mint が出なかった。Mint を名指しした問いはしていない。
- **ドラッグの問いは1つだけ**（検索7）。言い換え（「drag item onto category」「sort cards into piles」など）をしていない。要点5は1つの問いからの一般化。
- **web の画面は会計・地図の一部だけ**。PC で仕訳の机を作る時の型（キーボードでの科目選び）は探していない。
- **動きは見ていない**（静止画の並びから推した）。
- **書き手の取り違え（記録の傷）**：(1) Skip の画面（a6e9c7da…）を、別の画面（Uber Eats）の image_url で取得してしまい、気づいて `--force` で正しい画像を取り直したが、拡張子の付け替えがぶつかって `.html` の名で保存された。(2) Uber Eats の画面を、検索結果の id を確かめずに書き手が作った id（2c32101f-9220-…）で取得した。どちらも取得記録に「根拠に使わない」の skip を足し、台帳では引用していない（Uber Eats は正しい id df9e20e9 で取り直して W38 に使った）。取得記録は追記だけの決まりなので、誤った記録は消していない。
- **Quizlet の流れ（W19）は MB3 も取得している**：80a4c6a5 は MB3 が先に取得し、ノートも MB3 が書いた。MB2 は取り直していない（数の出力の「MB2 が取得した数」に入れていない）。
- **中高生での試し、試作は作っていない**。
- **research-check のエラー2件**は MB1・MB3 のノート（f5c83f4d…・ab8cfc23…、作業中のもの）で、MB2 のものではない。触っていない。
- **Mobbin の AI 利用の知らせ**：検索の結果に「Your Mobbin AI usage is high this month」（credits_used 305〜315）の知らせが付いた。オーナーへそのまま伝える（返事に書く）。

## 検索の記録

`docs/analysis/uiref-mobbin-MB2-searches.tsv` と同じ（27件）。

| # | 種類 | 問い | 結果のアプリ |
|---|---|---|---|
| 1 | flows | Copilot Money categorizing a transaction | Copilot（Transaction detail 3、Reviewing a transaction 4、Searching 3、Tagging 5） |
| 2 | flows | budgeting app swipe to categorize transactions | Monarch・Buddy・Copilot・Cleo・YNAB（スワイプの仕分けは0） |
| 3 | screens deep | finance app swipe card left or right to sort transactions | Cleo・Cleo AI・Cash App |
| 4 | flows | Cleo swipe right to keep a bill swipe left to ditch subscription | Cleo（Confirming bills 4、Reviewing upcoming bills 9、Bills due 3） |
| 5 | flows | Monarch Money reviewing and recategorizing transactions | Monarch（Preferences・Customizing categories・Filtering transactions・Transaction detail） |
| 6 | flows | YNAB assigning money to categories | YNAB（Editing amount・Assigning money・Auto-assigning・Spotlight） |
| 7 | screens deep | drag and drop a card into a bucket or folder to categorize | 12件すべて並べ替え（Numo・Klarna・Weverse・Behance・Character AI・Peloton・Linktree・SiriusXM・The Weather Channel・Insight Timer・TIDE・Google） |
| 8 | flows | swipe through photos to keep or delete cleanup | Google Photos・Apple Photos・GoPro Quik |
| 9 | screens deep (web) | accounting app categorize bank transaction match to account suggestion | Mercury・QuickBooks・YNAB・Xero・Rocket Money・Midday・Copilot・Quicken・Monarch・Expensify |
| 10 | flows (web) | Xero reconciling a bank statement line | Xero（Importing 11、Reconciling 9、Reconcile period 5） |
| 11 | flows | splitting a transaction into multiple categories | Monarch・Quicken・Copilot・Origin |
| 12 | flows | flashcards swipe to sort know and still learning | Quizlet |
| 13 | screens deep | what-if simulator slider shows projected outcome before deciding | Plum・Redfin・Monzo・Cleo AI・MyFitnessPal・Shopee・Lifesum・Stake・Brilliant・BitePal・Crypto.com・Acorns |
| 14 | flows | comparing two plans side by side before choosing | Unfold・Monzo・KOHO・Citizen |
| 15 | screens deep | restaurant inventory stock levels with low stock warning and reorder | Shopify・alias・Woolworths・Squarespace・Peerspace・Walmart・Thrive Market・Yami・Recime・Swiggy・Bevel・YNAB（飲食の在庫は0） |
| 16 | screens deep (web) | create purchase order from supplier with quantities and total cost | Programa・Fresha・Shopify・AWS・Xero・Navan・Deel・QuickBooks・Melio・Contra |
| 17 | screens deep | build your own bowl customization with ingredients and running price | sweetgreen・Wonder・CHOPT・Chipotle・Uber Eats・Subway・Skip・Starbucks・Shopee・Keeta・Cal AI・foodpanda |
| 18 | screens deep | event card with unexpected news and choice of how to respond in a game | NFL・Riot Mobile・Duolingo ABC・Google Arts & Culture・Posh・Cleo・Paired・Meta Quest・Tolan・mymind・Discord・Formula 1 |
| 19 | flows | undo action from snackbar after deleting or archiving | Gmail・Matter・LinkedIn・Google Home |
| 20 | screens deep | map with pins of nearby restaurants and a store card at the bottom | Resy・Wolt・Blackbird・TheFork・Apple Maps・DoorDash・Microsoft Copilot・corner・Skip・Zesty |
| 21 | screens deep | isometric room or shop you decorate by placing furniture items | Replika・Google Arts & Culture・Duolingo・Tolan・Philips Hue・Finch・Fi・YouTube・IKEA・Fable・Meta Quest・Airbnb |
| 22 | screens deep | leaderboard comparing my business with nearby competitors ranking | corner・Crypto.com・Forest・Bump・Brilliant・Hevy・Abode・Fetch・Tonal・Vivino |
| 23 | screens deep | Monarch cash flow sankey diagram income to expenses | （0件） |
| 24 | screens standard (web) | sankey flow chart showing where money goes | Snowflake・Meetup・Square・Calendly・Mercury・Klaviyo・Copilot・HoneyBook |
| 25 | flows | approving or rejecting expense requests one by one | Airwallex・Remote Global HR・Revolut Business |
| 26 | screens standard | Uber Eats build your own munchie meal choose your entree（取り違えの確かめ） | Uber Eats ×3 |
| 27 | screens deep | you got paid celebration screen with money received | Ladder・Everyday Rewards・Apple Wallet・Fresha・Cash App・Bloomberg・Zip・Wise |

## 数の出力

`python3 boki2/docs/analysis/uiref-mobbin-MB2-count.py` の出力を写す（下に貼る）。

```
実例の行の数: 48 （番号 W1 〜 W52 ）
台帳が引く画面の数: 116 ／文書全体が引く画面の数: 117
引いたのに一覧（screens.tsv）にない画面: なし
一覧にあるのに文書が引かない画面: なし
引いた画面のうち取得記録（200）がない: なし
引いた画面のうち読了ノートがない: なし
一覧の画面のうち MB2 が書いた読了ノート: 116 ／ 他の担当のノートを使った: ['80a4c6a5-566b-4005-a227-16ff5eac01e0']
MB2 の取得の記録（200）: 119 ＝ 一覧の画面 116 ＋ 取り違えの記録 3
取り違えの skip の記録: 2
画面の数（一覧）: 117 ／アプリの数: 44
一番多いアプリ: ('Monarch', 15) 割合 12.8% （上限 33.3%）
Duolingo の画面: 0
アプリ別: Monarch 15, Cleo 12, Xero 11, Copilot 9, YNAB 8, Quizlet 7, Google Photos 6, Quicken 4, Monzo 4, Buddy 2, Mercury 2, Shopify 2, Google Arts & Culture 2, Revolut Business 2, Airwallex 2, Cleo AI 1, SiriusXM 1, The Weather Channel 1, QuickBooks 1, Expensify 1, Redfin 1, Shopee 1, Brilliant 1, BitePal 1, Thrive Market 1, Chipotle 1, Wonder 1, sweetgreen 1, Formula 1 1, mymind 1, Gmail 1, Matter 1, TheFork 1, Apple Maps 1, Skip 1, DoorDash 1, Philips Hue 1, Finch 1, Fi 1, Bump 1, corner 1, Uber Eats 1, Apple Wallet 1, Cash App 1
領域別: 家計 51, 業務の会計・経費 19, 片づけ・整理 11, 学び 8, 銀行・投資 8, 飲食の注文 4, 部屋・世界の絵 4, 地図 4, 店の業務（在庫・発注） 3, ゲーム的な予想・順位 3, 健康・習慣 2
家計の割合: 51/117 = 43.6%
検索の数: 27 （種類別 {'flows': 12, 'screens': 15} ）
```

一覧の画像（番号つき）は s01〜s18 の18枚を開いた（画面117枚。うち番号 #93 は取り違えの画像で、別に取り直した正しい画像2枚と取り違えの1枚を並べた確かめの一覧1枚、Skip の取り直しの画像1枚も開いた）。一覧の画像は作業場所（scratchpad）にあり、リポジトリには入れていない。
