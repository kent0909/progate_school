<!-- quality:v2 -->
# 本来あるべき UI・UX の設計の素案（DESIGN-UI-IDEAL）

版0.1（2026-11-02）。書き手：統合の担当（MB1〜MB3 とは別）。依頼文は `docs/BRIEF-UIREF-MOBBIN.md`、材料は `docs/analysis/uiref-mobbin-MB1.md`（実例 X）・`uiref-mobbin-MB2.md`（W）・`uiref-mobbin-MB3.md`（Q）・`uiref-mobbin.md`（第1回、M）。決まりは `docs/QUALITY.md`、学びの土台は `docs/PEDAGOGY.md`。

**読み手**：オーナー（抜本的な作り直しを決める人）。いまの画面・コード・PR #7 に合わせて縮めない。3人の素案（MB1 の S0〜S10、MB2 の10画面、MB3 の S-1〜S-12）を、**1つのゲームの画面体系**に組み直した。
**引き方**：実例は3人と第1回の番号のまま引き、リンクは各担当が台帳に書いた `mobbin_url`（Mobbin の頁）。**又引きはしない**：引いた147の番号の全部について、読了ノート（`research/notes/mobbin-mcp/screens/<id>.md`）の image_seen を開き、素案で頼る主張と合うかを確かめた。要の画面32枚は原寸の画像（`research/raw/mobbin-mcp/screens/<id>.jpg`）を開いた。記録は `docs/analysis/uiref-ideal-cites.tsv`、数は `docs/analysis/uiref-ideal-count.py`（付録B）。合わなかった4件は付録Aと本文の該当の所に書いた（M1・Q21・Q78・X34）。
**印**：【推論】＝画面にない、統合の担当の筋道。【禁止の型】＝PEDAGOGY 0.2・1.8 と BIZ-UIREF K10（量・連続・ログイン・時間の圧への報酬）。【オーナーの決定が要る】＝BIZ-UIREF 18章の5問か、9章の問いの答えを先取りしている所。
**この文書は、書いた本人以外の判定・論証の検査をまだ受けていない**（QUALITY 2.3・5.2）。オーナーに出す前に受ける。

## 0. 要点

1. **画面の芯は「店の前の机に、次の書類が1枚だけ載っている」**（画面2）。Copilot の「TO REVIEW」の札1枚 [W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)・Shopify の「1 Order to fulfill」[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144) と同じ形で、主役は数の帯でなく「次にやる1つ」。上に店の絵（舞台）、下に人物の1行（MB3 の3層）。
2. **1か月の1周は8画面を回る**：月の扉（画面3、Headspace の済んだ札が緑に変わり次が大きくなる [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2)）→書類の会話（画面4、Speak の相手が先に話し問いの番号が会話の区切りに出る [Q80](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e)）→仕訳の机（画面5）→反映の小札（画面8）→…→締め（画面12、Monarch の「You reviewed everything!」[W2](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)）→月報（画面13、Copilot の1枚1問の札 [X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db)）→店の前へ戻る。
3. **仕訳の机は「差の帯」「左右へ払う札」「穴のある1文」の3つを重ねる**。Xero の「Total is out by: 6.75」→「Totals match」[W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b) と Quicken の上端に残る「Left to Split」[W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84)（差の帯）、Google Photos・Quizlet の2択の払い [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)[W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)、Acorns の文の穴に札 [Q21](https://mobbin.com/screens/4da72f80-d8cf-4225-87ff-ee497dc03e15)。3人の案は対立でなく層の違いとして1つにできた（3章 C3）。机の盤を「列」にするか「箱（B/S）」にするかは決めない。
4. **帳簿は別の場所（画面14）で、店のダッシュボードを兼ねる**。YNAB の資産と負債の棒の上を純資産の線 [X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938)、QuickBooks の未確認分の斜線 [X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8)、Mercury のお金の流れの図 [W28](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9)。店の画面は絵、帳簿の画面は数、と役を分ける（C4）。
5. **3段の目標は1つの画面（画面15）に縦に積む**：ゲーム全体＝1億への見込みの線（Wealthfront の線の先の星 [X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)）と試験範囲の状態、年＝12か月の道（Ahead の地図の石 [X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)）と年の方針（Strava の「Your focus」[X8](https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a)）、目の前＝今月の札。数や％の報酬は出さない（Quizlet の画面を MB1 と MB3 が逆に読んだ所は、PEDAGOGY 4.3 で決めた：C6）。
6. **報酬は状態の変化だけ**：箱が空になる・札が緑に変わる・帳面に科目が貼られる（Finch の綴じた帳面 [Q49](https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3)）・店の絵が変わる。XP・連続・バッジは全画面で出さない。
7. **決めなかったこと**：ホームに数を置くか（18章 問1 を3人とも (b) 側に先取りしている）、ライバルを順位で見せるか対戦の表で見せるか、机の盤の形、動きの量、検定会場の見た目。9章で選択肢と推しを分けて出す。
8. **反対の事実**：Mobbin にはゲームそのものがなく、実例は大人の家計・業務・学びのアプリからの類推（3人とも同じ）。ドラッグで箱へ分類する実例はなく [W23](https://mobbin.com/screens/a29d4250-9d1a-4d95-bb99-6c5f6cb28178)、静止画なので動きは1つも見ていない。

## 1. 体験の芯：1か月の遊びの1周と3段の目標

### 1.1 画面体系の形（4つの場所と、月の画面の3層）

ゲームは**4つの場所**を持ち、下のタブで行き来する【推論：3人の素案の画面を、遊ぶ人が「どこに行けば何があるか」で束ねた】。

| 場所 | 何の場所か | 入る画面 | 見た目の主役 |
|---|---|---|---|
| **店** | 1か月を遊ぶ所（既定の場所） | 2 店の前（ホーム）、3 月の扉、4 書類の会話、5 仕訳の机、6 返し、7 名前の札、8 反映の小札、9 出来事、10 作戦の机、11 仕入れ・一杯、12 締め、13 月報、18 決算の振り返り | 店の絵（舞台） |
| **帳簿** | 会社のお金の全体を見る所 | 14 帳簿＝店のダッシュボード、21 決まりの棚 | 数と図（舞台なし） |
| **町** | 世界とライバルを見る所 | 16 町とライバル、17 店の断面 | 町の絵 |
| **成長** | 目標・学びの記録と会社の外の練習 | 15 目標と1年の道、19 科目の帳面と原理マップ、20 届く封筒とまちがいノート、22 練習室・検定会場 | 帳面・地図 |

設定と休業（画面23）は、店ののれんを押して開く。画面1（はじまり）は最初の1回だけ。

**店の場所の画面は3層**（MB3 の全体の考え方1）：上に**舞台**（店の絵。客・業者が立つ）、下に**人物の帯**（社長・先輩・相手の1行）、その間に**手元**（書類・札・机）。会話・問題・結果を別の頁にせず、同じ舞台の上で帯と手元が入れ替わる。根拠：Kit の部屋の絵と下の1行 [Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9)、Mimo の結果がその場の頁に出る [Q24](https://mobbin.com/screens/433fb29c-cb3b-41af-9508-e8562b34b88b)、Duolingo の店を真上から見た部屋 [M1](https://mobbin.com/screens/fbbbcbd0-e31f-414d-8847-a7a8037e34f0)。**帳簿・成長・検定会場は3層にしない**（数・本番の形が主役。3章 C4）。

### 1.2 1か月の1周（画面の流れ）

PEDAGOGY 1.1 の①届く→②決める→③締める→④返る→⑤広がる を、画面の流れに置いた。1ターン5〜10分、新しい判断の要る書類は1〜3件、残りは決まり（自動仕訳）で流れる（PEDAGOGY 1.1・1.6）。

| 段 | 画面 | 主役 | 何が起きるか | 次の画面 |
|---|---|---|---|---|
| 0 | 3 月の扉 | 今月の札 | 先月の札が緑に変わって縮み、今月の札が前に出る。今月の困りごとの予告1行（先月の「今月の一手」の札から）[Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2) | 2 |
| ① 届く | 2 店の前 | 次の書類1枚 | 書類が机に載り、舞台では相手（問屋・大家・客）が店の前に立つ。受け箱の「あと3枚」 [W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144) | 4 |
| ①→② | 4 書類の会話 | 相手と書類 | 相手が先に1文を言う（「今月分の請求です、3万円」）。問いの番号は会話の区切り線（「書類 2/5」）[Q80](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e) | 5 |
| ② 決める | 5 仕訳の机 | 穴のある1文と左右の札 | 書類の値を押して拾い [W30](https://mobbin.com/screens/29b835da-3f61-49a1-b3a6-448b5e23d949)、札を左右へ払い [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)、差の帯が0で確定 [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)、理由を1つ選ぶ（PEDAGOGY 1.3） | 6 か 8 |
| ②（誤り） | 6 返し | 先輩の1行 | 1回目は場所だけ [Q23](https://mobbin.com/screens/c63bc528-b64d-461a-82bd-b13140589cfe)、2回目は「どっちで迷った？」の2択 [Q16](https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af) | 5 |
| ②→④の予告 | 8 反映の小札 | 動いた勘定 | 舞台の上に小さな札「現金 −3万円→残り12万円」[X56](https://mobbin.com/screens/e1ca6ae4-c7fd-4df4-9fc2-843b65ff21ef)。押さなければ消える。相手が「確かに」と去る | 2（次の書類）／ 7（新しい原理の月だけ） |
| ②（判断） | 9・10・11 | 出来事・作戦・仕入れ | 受け箱に差し込まれる。判断は書類を生む（仕入れを決める→請求書の札が受け箱へ） | 2 |
| ③ 締める | 12 締め | 空の受け箱と試算表 | 受け箱が空になると大きなチェック [W2](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)、試算表の左右がそろうか [X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)。合わなければ森さんが場所だけ示す | 13 |
| ④ 返る | 13 月報 | 1枚に1つの問い | 変化の大きい札だけ、最大4枚 [X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db)。最後の札が「直した札・一度で正しかった札」[Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e) | 3（次の月）、年度末は 18 |
| ⑤ 広がる | 3 月の扉 | 来月の困りごと | 月報の最後の「今月の一手」が来月の扉の予告になる [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2) | — |

**行き来の約束**：店の場所の画面は「戻る」でいつも店の前（画面2）へ帰る。帳簿・町・成長へは、月のどの段からもタブで行けて、戻ると同じ段へ帰る（MB2 の「④反映の図は月の途中でも開ける」）。締め（画面12）は受け箱が空になるまで押せない。

### 1.3 3段の目標（どこに何が出るか）

| 段 | 何で測るか | いつも見える所 | 開くと見える所 | 根拠 |
|---|---|---|---|---|
| ゲーム全体 | 口座のお金（ネットキャッシュ1億）と2級の満点 | 決めない（【オーナーの決定が要る】9章 D1：店の前に細い見込みの線を1本出すか） | 画面15の上段：月の軸の右端に1億の星、純資産の線と、このペースの点線、「このペースなら◯年◯月」の1文。満点の側は試験範囲マップの状態（数なし） | [X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)[X7](https://mobbin.com/screens/ca6407b9-5665-4509-9948-8830b3a0ca61) |
| 年 | 年の方針と、12か月の道 | 月の扉（画面3）で、年の道の上の今月の位置 | 画面15の中段：年の方針の札と期限（決算まで◯か月）、12の石の道（済み実線・先は点線と輪郭） | [X8](https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a)[X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)[Q58](https://mobbin.com/screens/3ef3dce1-8f8e-416b-b8c2-5d52d177fe26)[Q59](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7)[Q47](https://mobbin.com/screens/97fe8772-ff56-42b9-b86c-830e103fc441) |
| 目の前 | 今月の書類と今月の一手 | 店の前（受け箱「あと3枚」） | 画面15の下段：今月の分の「済み・残り」 | [X4](https://mobbin.com/screens/05906c98-edab-4f98-91a9-bbed376ff424)[W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef) |

段の中身は**会社の状態**（純資産・借入の残り・決まりの数・任される仕事）にし、量（記帳の回数・連続日数）にしない。段の並べ方は Duolingo の月・週・日のクエスト [X14](https://mobbin.com/screens/9f9ad31c-ec4e-4a7c-98a0-764d40835315) と同じだが、中身は写さない【禁止の型】。状態で段を作る例は Crypto.com の「駅」（段ごとに特典が増える [X12](https://mobbin.com/screens/07440204-140d-43b0-822b-1dfb63ebf89b)）。

## 2. 画面の一覧と各画面の設計

### 2.0 一覧

| # | 画面 | 場所 | 主役（1つ） | 元にした素案 |
|---|---|---|---|---|
| 1 | はじまり（屋台の前の3分） | 店 | 屋台と社長ミライ | MB3 S-1・S-2 |
| 2 | 店の前（ホーム＝月の机） | 店 | 次の書類1枚 | MB1 S1、MB2 ①、MB3 S-3 の一部 |
| 3 | 月の扉 | 店 | 今月の札 | MB3 S-3、MB1 S5 の年の段 |
| 4 | 書類の会話 | 店 | 取引相手と書類 | MB3 S-4、MB2 ③ |
| 5 | 仕訳の机 | 店 | 穴のある1文と左右の札 | MB2 ②、MB3 S-5 |
| 6 | 返しと聞き返し | 店 | 先輩の1行 | MB3 S-6 |
| 7 | 名前がつく札 | 店 | 伏せた札 | MB3 S-7 |
| 8 | 反映の小札 | 店 | 動いた勘定と残り | MB1 S3、MB2 ④ の一部 |
| 9 | 出来事と承認・お知らせ | 店 | 場所の絵と大きな数1つ | MB2 ⑧、MB1 S8 |
| 10 | 作戦の机（判断の予告） | 店 | 選ぶ物と結果の幅 | MB2 ⑥ |
| 11 | 仕入れ・一杯の組み立て | 店 | 問屋→店の矢印／丼の絵 | MB2 ⑦、第1回 M11 |
| 12 | 締め | 店 | 空の受け箱と試算表の左右 | MB2 ①・1か月の流れ、MB1 S2 の対の棒 |
| 13 | 月報とふりかえり | 店 | 1枚に1つの問い | MB1 S4、MB3 Q38 |
| 14 | 帳簿＝店のダッシュボード | 帳簿 | 純資産の1つの数 | MB1 S2、MB2 ④ |
| 15 | 目標と1年の道 | 成長 | 1億への見込みの線 | MB1 S5、MB3 S-9 の道 |
| 16 | 町とライバル | 町 | 自店とライバルのピン | MB2 ⑨、MB1 S6 |
| 17 | 店の断面 | 町 | 等角に切った店 | MB2 ⑩ |
| 18 | 決算の振り返り（年1回） | 店 | 巨大な1つの数か語 | MB1 S7 |
| 19 | 科目の帳面と原理マップ | 成長 | 綴じた帳面 | MB3 S-8・S-9 |
| 20 | 届く封筒とまちがいノート | 成長 | 机の上の封筒1つ | MB3 S-10 |
| 21 | 決まりの棚（自動仕訳ルール） | 帳簿 | 自分で作った決まり | MB2 ⑤ |
| 22 | 練習室・検定会場 | 成長 | 試験の約束と問題の格子 | MB3 S-11 |
| 23 | 休業・再開・設定 | （のれん） | 店ののれん | MB3 S-12 |

各画面は「主役／情報の階層（いま大事な1つ・次・縁）／操作（押す・振り分ける・置く）／動き（いつ・何が・どれだけ）／報酬（状態の変化だけ）／根拠の実例／悪い面と反対の事実」の順に書く。動きの長さは DESIGN-JOURNAL-UX 5.1 の線（手ごたえ 400ms 以下、値が動いて止まるまで 0.5〜1秒）を仮に使う。どちらも試作で比べる値（BIZ-UIREF 0章-6）。

### 2.1 画面1 はじまり（屋台の前の3分）

- **主役**：夜明けの屋台の絵と社長ミライ。
- **階層**：いま＝社長の1行「わたしミライ！ きみは？」と名前の欄。次＝屋号の欄（くじの案つき）→店の方針の3択（味で勝負／常連づくり／客を呼んでたくさん売る）。縁＝右上の小さな「とばす」。**3画面まで**で、すぐに最初の1杯の手本へ。
- **操作**：名前を打つ・屋号を「くじ」で選ぶ・方針を1つ押す。続く手本では、売上の札を現金の箱へ置く（押す1手で置ける。並べ替え以外はドラッグを必須にしない）。
- **動き**：名前を入れると社長が両手を上げる（1回）。屋号を決めると看板に字が書かれていく。方針を選ぶと屋台の飾りが変わる。手本で札を置くと箱が膨らみ、屋台のレジが光る。
- **報酬**：看板に自分の屋号が出る、屋台の飾りが変わる（状態）。
- **はじめの1回の手本の順**：「お店のお金は、もう数えられるよね」→置く→箱が増える→最後に「これを簿記では仕訳と呼ぶ」。Brilliant の最初の課題は、扉で「You already know how to write them — let's prove it.」と言い、地図の上で札を置かせてから言葉を出す [Q78](https://mobbin.com/screens/168b1c76-7485-45fd-9b09-f762cc336907)。ただし原寸で見ると、課の後の文は「正しい命令を正しい順で使った」と言い直し、loops・logic・variables は**これから学ぶ物の予告**だった（付録A）。「操作が先、言葉が後」の順は支えられるが、「やったことに名前を付けた実例」とまでは言えない。PEDAGOGY 1.2 の4拍の根拠は PEDAGOGY 自身で、Brilliant は順の一致の例にとどまる。
- **根拠**：[Q1](https://mobbin.com/screens/fe8eae1b-d8af-4db5-951c-17e92c497001)（相手が名乗ってから名前を聞く）、[Q2](https://mobbin.com/screens/0b3973cb-4909-47e5-a90f-aa289957b6d4)（「あとで変えられる」と Shuffle）、[Q3](https://mobbin.com/screens/6ccd84e3-79f7-4157-993e-695ecb11bcd6)（正解のない3択）、[Q5](https://mobbin.com/screens/528d7ee1-600a-4132-a9a4-ee364eb20b76)（名前を呼ぶ一言と全身の喜び）、[Q7](https://mobbin.com/screens/b8a54efb-c06d-4818-b56e-968b2309c88b)（最初の1回の長さを先に言う）、[Q77](https://mobbin.com/screens/6a699da6-fc16-4a7b-9176-b180a84e1e75)（選ぶと先生の台詞と姿が変わる）、[Q78](https://mobbin.com/screens/168b1c76-7485-45fd-9b09-f762cc336907)、[Q74](https://mobbin.com/screens/5b76071b-1098-461d-b8e4-223c41bd02b2)（使い方が実物の項目になっている＝最初の帳簿に練習の行）。
- **悪い面と反対の事実**：Brilliant の Onboarding は14画面のうち学びが0で、登録が課題の前 [Q77](https://mobbin.com/screens/6a699da6-fc16-4a7b-9176-b180a84e1e75)（MB3）。それでも商用で成り立っているので、「質問を先にすると離れる」とは言えない。方針の3択が後で効かないと裏切りになる（MB3 Q3 の悪い面）。名前の入力を嫌う人がいる。

### 2.2 画面2 店の前（ホーム＝月の机）

- **主役**：机の上の**次の書類1枚**（相手の顔・1文・額）。
- **階層**：いま＝次の書類の札（大きく）。次＝受け箱の「今月の書類 あと3枚」と、記帳済みの札（薄く、下へ畳む）。縁＝上の舞台（店の絵。書類の相手が店の前に立つ）、届いたお知らせの札（最大1枚 [X61](https://mobbin.com/screens/6d4fe16b-2d05-459c-8ea9-eb452c0c819a)）、月の札（4月・1年目）。**数の帯は置かない**か、置くとしても1億への見込みの細い線1本（【オーナーの決定が要る】9章 D1、18章 問1）。
- **2つの状態**：未処理がある間は「次の書類」、空になると札が「今月は締められる」1つだけに変わる（Shopify の「That's it for now」[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144)、Monarch の「You're up-to-date for July.」[X23](https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b)、Copilot の札が消えて欄の形が変わる [W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)）。Shopify の「Check back later」は待つ画面だが、ゲームでは「締める」をすぐ押せる。
- **操作**：書類を押す→画面4へ。舞台の人物を押しても同じ書類へ。下のタブで帳簿・町・成長へ。
- **動き**：記帳を終えた札が畳まれ、「あと3枚」が「あと2枚」に変わる。新しい書類が机に滑り込む（1回）。全部終えると受け箱が空になり、締めの札が前に出る。
- **報酬**：受け箱が空になる（状態。量ではない）。
- **根拠**：[W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)[W2](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144)[X23](https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b)[X19](https://mobbin.com/screens/bfe532d9-62fe-4246-9775-9c8934195bcb)（1つの大きな物を主役に、細かい数は小札に退く）[X61](https://mobbin.com/screens/6d4fe16b-2d05-459c-8ea9-eb452c0c819a)（振り返りが届いたことをホームの札で）。舞台の形は [M1](https://mobbin.com/screens/fbbbcbd0-e31f-414d-8847-a7a8037e34f0)（店を真上から見た部屋、数の帯がない）。
- **悪い面と反対の事実**：数を見張ることが経営シムの面白さ（ウマ娘は能力の値を常に出す：BIZ-UIREF 0章-2、MB1 反対の事実5）。Copilot [X30](https://mobbin.com/screens/a0fcfcb0-2e7a-40eb-8cbd-f0845067be4a)・QuickBooks [X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8) のように数を多く並べるホームも多い。「次の1枚」は宿題の残りに見え、作業感を強める恐れ（MB2 論証の表）。第1回 M1 の「出来事のある客に「！」」は、原寸のこの画面に「！」がなく（付録A）、根拠にできない。人物に印を付ける型は別に探す必要がある（11章）。

### 2.3 画面3 月の扉

- **主役**：今月の札（「第1部 屋台／第3話 6月」）。
- **階層**：いま＝今月の札（大きく）と予告1行（「今月：初めての借入」）。次＝先月の札（緑の済み、縮む）と来月の札（輪郭だけ。題は出さない：PEDAGOGY 0.2）。縁＝1年の道の上の位置（12の石の何番目か）。
- **操作**：今月の札を押して始める（1押し）。
- **動き**：先月の札が緑に変わって縮み、今月の札が前に出る（約1秒）。毎月出るので押せば飛ばせる。
- **報酬**：済んだ月の札が緑に変わり、道に残る。
- **根拠**：[Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2)（済んだ札が緑一面の「Completed」に変わり、次の札が大きい。動画の最後の「Today's Action」の札）、[Q47](https://mobbin.com/screens/97fe8772-ff56-42b9-b86c-830e103fc441)（日付つきの区切りの道）、[Q8](https://mobbin.com/screens/2014db16-b3ab-4acc-b20d-728932085c53)（これからやることを2行で予告）。
- **悪い面と反対の事実**：毎月出ると待ちになる（BIZ-UIREF 7章 うまくいかない1）。初めての操作の月以外は1行だけにする。Headspace は動画の講師が主役で、学ぶ人は見るだけ [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2)。写すのは「済み→次が大きい」の構造だけ。

### 2.4 画面4 書類の会話

- **主役**：取引相手（問屋・大家・客・銀行）と、その手の書類。
- **階層**：いま＝相手の1文（「今月分の請求です、3万円」）。次＝書類（請求書の絵。金額・日付・相手は押せる枠）と指示1行（「左と右を決めて」）。縁＝区切り「書類 2/5」、科目名に枠（名前がついた後の語だけ [Q14](https://mobbin.com/screens/bb06ea68-f1a1-462c-8993-84377b580bc9)）。
- **操作**：書類の値を押して拾う（PEDAGOGY 1.7 の証憑タップ）→画面5へ。台詞は送りのボタンで進めず、「書類を受け取る」操作で進む（紙芝居にしない）。
- **動き**：相手が入力中の点3つ→1文。正しく切ると相手が「確かに」と頭を下げて去る。
- **報酬**：相手の返事（状態）。
- **根拠**：[Q80](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e)（相手が先に話す、問いの番号が会話の区切り線、文字を隠す印）、[Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9)（部屋の絵と下の1行の帯）、[Q15](https://mobbin.com/screens/5b2d14ea-25ef-4408-8820-75587e339cfa)（社長が「分からない」を代弁）、[M2](https://mobbin.com/screens/84d6004b-67bb-4679-a6c1-d757e5ffb668)（客の上に名前の札と1文の吹き出し）、[W17](https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a)（大きな数を先に1つ見せてから振り分けへ）。
- **悪い面と反対の事実**：Kit は台詞を緑の再生ボタンで送る＝オーナーの言う紙芝居の形そのもの [Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9)（原寸で確かめた）。送るたびに絵が動かないと同じ不満になる。Speak の1課9問の会話は長い [Q80](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e)。問いを人物の文にすると、本番（文で聞く）で読めない恐れ（MB3 論証の表）→ 本試験の文は検定会場と「文字を隠す」で練習する。

### 2.5 画面5 仕訳の机（遊びの芯）

- **主役**：上の**穴のある1文**と、左右へ払う**札**。
- **階層（縦長のスマホ、MB2 の割り付けを基に）**：
  1. 上端：**差の帯**（「左 ¥30,000／右 ¥24,000／差 ¥6,000」）。差が0でない間は灰色の地、0で緑の地に「左右がそろった」。スクロールしても上に残る [W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84)
  2. 問いの1文：「この3万円は［　　］として左へ」。札を置くと穴が埋まる [Q21](https://mobbin.com/screens/4da72f80-d8cf-4225-87ff-ee497dc03e15)
  3. 書類（証憑の絵。押すと値を拾う [W30](https://mobbin.com/screens/29b835da-3f61-49a1-b3a6-448b5e23d949)）
  4. 左右2つの列（借方・貸方。日常語の見出し「何があるか／どこから来たか」：DESIGN-JOURNAL-UX 7.2）。置いた札に科目名と額
  5. 科目の棚：5区分の色の帯の上に、その場面で使いうる4つ（うち1つ以上は典型の誤り＝分かれ道）と「全部の棚」[W7](https://mobbin.com/screens/05f44de1-5a20-4bc4-b849-746680f91834)
  6. 確定の札：差が0になるまで押せない [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)
- **操作**：札を押す→左右の押す札「左へ／右へ」が出る。同じことを札を左右へ払っても、PC ではつかんで落としても、キーボードでもできる（DESIGN-JOURNAL-UX 4.1 の4つの入力。オーナー承認済み）。払う途中で行き先の列が光り、札に列の名が出る [W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)。初回だけ札の上に「左へ払うと『何があるか』」の字 [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)。置いた札は押すと「左へ／右へ／棚へ戻す」で1枚ずつ直せる。確定の後に理由を1つ選ぶ（PEDAGOGY 1.3）。
- **動き**：札が列に着地（400ms 以下）。差の帯の数が動き、0で緑に変わる。確定で両方の列が光り、下に「取り消す」の帯が数秒 [W45](https://mobbin.com/screens/d5187615-adaf-4a7d-ba16-c75ac4799634)。
- **報酬**：差が0になる・相手が「確かに」と言う・舞台の物が変わる（画面8）。
- **学びの段の約束**：片方の額を入れても反対側を自動で埋めない（Copilot の自動の合わせ [W13](https://mobbin.com/screens/1ae4ac51-0c47-4c59-804f-6ecce7cdaadf) は使わない）。「残りを入れる」の札 [W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84) は練習室と検定会場では出さない（計算を奪う）。決まりにした型は自動で積まれ、札に決まりの印。差を埋める「雑損」の札は、現金過不足の論点の月だけ出す。
- **根拠**：[W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)[W11](https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6)[W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84)（差の数→0で確定）、[W36](https://mobbin.com/screens/7df5c89a-cc35-4e23-9aa6-c26cac73678c)（両辺を長さの棒にする）、[W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)[W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)[W20](https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e)（2択の払い＋同じ2択の押す札）、[W6](https://mobbin.com/screens/35656b22-a704-4b52-8cd0-9ae4c8addf3d)（押して箱を移す。原寸の文「Tap to add or remove」）、[W7](https://mobbin.com/screens/05f44de1-5a20-4bc4-b849-746680f91834)（候補4つ→全部の棚）、[W30](https://mobbin.com/screens/29b835da-3f61-49a1-b3a6-448b5e23d949)（証憑と行と合計）、[W45](https://mobbin.com/screens/d5187615-adaf-4a7d-ba16-c75ac4799634)（取り消しの帯）、[Q21](https://mobbin.com/screens/4da72f80-d8cf-4225-87ff-ee497dc03e15)（穴に札）、[Q28](https://mobbin.com/screens/7b63d513-c0f3-4f43-860f-d6a2b3d60722)（図の上で答える）、[W16](https://mobbin.com/screens/b5b9a184-bd88-48e7-ba5a-f3f151278cc2)（同じ取引を日常の見え方と帳簿の行で切り替える＝書類の裏返し）。
- **悪い面と反対の事実**：(1) 差が0でも科目違いはある。Xero は「Your adjustment is more than 1.00」の赤字のまま「Totals match」で確定できた（原寸で確かめた [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)）＝差の帯だけでは正しさを示せない。確定の後の正誤の返し（画面6）と組む。(2) 差の帯は「作業の残り」で、楽しさでなく義務感を生むかもしれない（MB2 論証の表）。(3) 見たスワイプは全部2択 [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)[W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)[W20](https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e) で、科目選びには使えない。(4) Acorns の穴は文の途中でなく文末だった（付録A）。「文の途中の穴」は実例がなく、作ってみて読めるかを確かめる。(5) 業務の画面（Xero・Quicken）の見た目は写さない。

### 2.6 画面6 返しと聞き返し

- **主役**：先輩（森さん）の顔の横の1行。画面5の上に重なる帯で、別の頁にしない。
- **階層**：正しい→舞台の物が変わり相手が返事（それだけ）。一部正しい→「左はいい。右を見て」[Q20](https://mobbin.com/screens/b43fc9b9-96af-4191-a5eb-71759ae1fd18)。誤り1回目→場所だけ「右を見て」[Q23](https://mobbin.com/screens/c63bc528-b64d-461a-82bd-b13140589cfe)。誤り2回目→「どっちで迷った？ ①お金が出たのに費用じゃない？ ②どうして資産？」の2択（分かれ道）[Q16](https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af)、選んだ枝の説明2行と同じ枝の別の例2つ（「~~買掛金~~→未払金」）[Q18](https://mobbin.com/screens/26c5c998-56b0-410b-9f81-326fdb66dcaa)。「わからない」も選べる [Q19](https://mobbin.com/screens/93499943-b5af-4860-a9b2-23740d190ccd)。
- **操作**：選び直す・聞き返しの2択を押す。ヒントは無料で3段（PEDAGOGY 5）[Q25](https://mobbin.com/screens/2d8d62b7-fabc-4909-96f9-7b09efa22106)。
- **動き**：誤りでも舞台に一度反映し（PEDAGOGY 1.2 拍3）、直すと戻る。
- **報酬**：直した札が「直した」の印つきで残る（まちがいノートへ）。
- **根拠**：[Q16](https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af)（原寸で「which part wasn't clear? Was it why the truck needed to turn, or why turn left specifically?」の2択を確かめた）、[Q17](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124)（違う語だけ下線）、[Q18](https://mobbin.com/screens/26c5c998-56b0-410b-9f81-326fdb66dcaa)、[Q19](https://mobbin.com/screens/93499943-b5af-4860-a9b2-23740d190ccd)、[Q20](https://mobbin.com/screens/b43fc9b9-96af-4191-a5eb-71759ae1fd18)、[Q23](https://mobbin.com/screens/c63bc528-b64d-461a-82bd-b13140589cfe)、[Q25](https://mobbin.com/screens/2d8d62b7-fabc-4909-96f9-7b09efa22106)。
- **悪い面と反対の事実**：Duolingo は正解をすぐ見せて広く使われている [Q17](https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124)。正解をすぐ見るほうが待ちが少なく続く人もいる（MB3 論証の表）。Brilliant の聞き返しは AI の自由な会話で、我々は台本の2択で作る（正しさ）。

### 2.7 画面7 名前がつく札（新しい原理の月だけ）

- **主役**：伏せた札。
- **階層**：先輩「いまやったこと、名前があるんだ」→伏せた札「なんて呼ぶと思う？」→開くと名前・本試験の文言・原理マップに葉が生える予告（PEDAGOGY 1.2 拍4、3行以内）。
- **操作**：札を押して開く。
- **動き**：札がめくれ、名前が帳面（画面19）へ飛んで貼られる。
- **報酬**：帳面に科目が1枚貼られる。
- **根拠**：[Q30](https://mobbin.com/screens/dd9df113-cd8d-47e4-a0ef-11a38f224671)（押して開く札）、[Q31](https://mobbin.com/screens/9c79865b-4525-45ad-a89c-f4de4128fa27)（3つ済むと正体が明かされる＝決まりの登録も同じ形）、[Q83](https://mobbin.com/screens/573f7362-933a-4241-8c35-bb8451146864)（全体の中の1つのブロックに吹き出しで名前＝B/S の箱の一部に「これが資本金」）。
- **悪い面と反対の事実**：押すだけで考えない人もいる。Forest の「Your Reward Awaits」は報酬の言い方で量に寄る [Q31](https://mobbin.com/screens/9c79865b-4525-45ad-a89c-f4de4128fa27)。開くのは熟達の結果で飾りではない、と言い方を変える。

### 2.8 画面8 反映の小札（記帳の結果の瞬間）

- **主役**：動いた勘定と、その後の残り。
- **階層**：いま＝「現金 −3万円」。次＝「現金の残りは12万円」[X56](https://mobbin.com/screens/e1ca6ae4-c7fd-4df4-9fc2-843b65ff21ef)。縁＝初めの数回だけ、書類→仕訳帳→元帳→試算表の段 [X57](https://mobbin.com/screens/1aecb208-2c41-4dd5-bcbc-cded84156138)。
- **操作**：押さなくても消える（舞台の上の小さな札で、操作を止めない [X15](https://mobbin.com/screens/d2547f6d-14a5-4c78-ae50-e9be602c4622)）。押すと帳簿（画面14）の該当の行へ。
- **動き**：確定の後に、舞台の場所（レジ・倉庫・看板）から帳簿のタブへ数が飛ぶ。**置いた時点では動かさず、確定の後に動かす**（3章 C9）。
- **報酬**：舞台の物が変わる（倉庫に麺の箱が増える、レジの硬貨が減る）。
- **根拠**：[X56](https://mobbin.com/screens/e1ca6ae4-c7fd-4df4-9fc2-843b65ff21ef)（動かした額と、その結果の残高を1画面で）、[X57](https://mobbin.com/screens/1aecb208-2c41-4dd5-bcbc-cded84156138)（1つの取引が通る段）、[X15](https://mobbin.com/screens/d2547f6d-14a5-4c78-ae50-e9be602c4622)（世界の絵の上の小さな知らせ）、[W26](https://mobbin.com/screens/25fc692d-19a1-4de4-a63f-b0a6ecca0bd6)（いつ反映されるかを一文で＝掛けの取引で「お金は月末に口座から出ます」）、[Q24](https://mobbin.com/screens/433fb29c-cb3b-41af-9508-e8562b34b88b)（結果が対象の物にすぐ出る）。
- **悪い面と反対の事実**：毎回1画面を挟むと待ちになる（BIZ-UIREF 7章）。だから小札にする。第1回 M18（店の中の光）は流れの中の画面で、静止画では長さを見ていない。

### 2.9 画面9 出来事と承認・お知らせ

- **主役**：場所の絵（上半分）と大きな数1つ。
- **階層**：いま＝大きな数（「給料日前の支払い ¥19万」）。次＝2文と選択肢。縁＝出どころの小見出し（銀行・税務署・問屋・大家・ライバル）[X63](https://mobbin.com/screens/b1bd4556-d2f2-4e50-91d4-eea279f21206)。社長の頼みごと（「これ買っていい？」）は承認・却下と、誰が決めたかの時系列 [W44](https://mobbin.com/screens/9a34e3c2-65fa-49e0-9a6f-5833c749d333)。
- **操作**：選ぶ・承認・却下・「続ける／やめる」で左右に払う（経営の判断。仕訳ではない）[W17](https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a)。
- **動き**：大きな数が先に出て、次に吹き出し。
- **報酬**：はじめての出来事（はじめての黒字の月など）だけ1回祝う [W52](https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f)。
- **お知らせの書き方**：題に「何を・いつまでに」（「修理の請求：今月中に払うか争うか」）[X62](https://mobbin.com/screens/d635a1c2-0eb9-49f9-9e2e-81f3871d1439)。新しい知らせは店の前に1枚だけ。
- **根拠**：[W17](https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a)（大きな数→気持ちを聞く→2択の振り分け）、[W43](https://mobbin.com/screens/5b3c4dd9-00f8-4ca7-847a-2a8f4b6857e1)（場所の絵と2文と選択肢）、[W44](https://mobbin.com/screens/9a34e3c2-65fa-49e0-9a6f-5833c749d333)、[W52](https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f)、[X62](https://mobbin.com/screens/d635a1c2-0eb9-49f9-9e2e-81f3871d1439)、[X63](https://mobbin.com/screens/b1bd4556-d2f2-4e50-91d4-eea279f21206)。
- **悪い面と反対の事実**：Cleo の流れは9画面で長い [W17](https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a)。選択肢が1つの所は押すだけの紙芝居になる [W43](https://mobbin.com/screens/5b3c4dd9-00f8-4ca7-847a-2a8f4b6857e1)。期限が多いと急かされる画面になる（ターン制なので「今月中」の単位）。

### 2.10 画面10 作戦の机（判断の予告）

- **主役**：選ぶ物（値段・仕入れ・借入・リースか購入か）と、結果の**幅**。
- **階層**：いま＝つまみか選択肢の札。次＝結果の幅の帯（来月の客数・もうけ）と危ない帯の色と一言。縁＝比べの表（買う／リース）。
- **操作**：つまみを動かす・札を押す。「借りない」の札も同じ重さで出す [W33](https://mobbin.com/screens/75324601-2929-4219-a6fe-3110888e9aeb)。
- **動き**：つまみに合わせて幅の帯が動く。危ない側で色と銀行の担当の一言。
- **報酬**：なし（判断の結果は数か月後に会社に返り、経営日誌に残る：PEDAGOGY 1.4）。
- **根拠**：[W31](https://mobbin.com/screens/af24a9b8-c6eb-4097-ac80-c2f1f2ded4e3)（色の変わるつまみと「Stretch」の注意、禁止はしない）、[W32](https://mobbin.com/screens/a196ebe3-0c04-4b4e-8241-201b961696a7)（見込みを薄い帯の幅で）、[W33](https://mobbin.com/screens/75324601-2929-4219-a6fe-3110888e9aeb)（額と期間で月の返済）、[W34](https://mobbin.com/screens/dee30ae9-d5ee-4948-9cfe-7e68c6e4dc07)（列を絵で、行は×とチェック）、[W37](https://mobbin.com/screens/a8c724bd-26fe-4105-a82c-5ebb7fcbcd3a)（選択肢ごとに見返りの幅が違う。点・倍の札・残り時間は【禁止の型】）、[M14](https://mobbin.com/screens/3c9e2d5d-1521-4aec-a6ac-46d21d511ed8)（つまみで結果を見る）、[M8](https://mobbin.com/screens/6e9ad774-96bb-4ef4-b48c-92dac0bd4712)（残りの予算を常に上に、取り消す）。
- **悪い面と反対の事実**：予告が正確すぎると判断の手ごたえが消える（第1回 M14・MB2 W31）。幅が広いと「何を選んでも同じ」に見える。比べの表は答えを示しがち（行は事実だけ）。

### 2.11 画面11 仕入れ・一杯の組み立て

- **主役**：仕入れは「問屋→店」の矢印、一杯は丼の絵。
- **階層**：仕入れ＝問屋の顔と矢印→品の札3〜5枚（数・単価）→合計→支払条件（現金／掛け）→冷蔵庫の棚（±と「残り少し」の札）。一杯＝上半分に丼の絵、見出しごとに「0/1」、下の確定の札に「原価 ¥◯・売値 ¥◯」。
- **操作**：数を±、支払条件を押す、具の札を押す。
- **動き**：届いた品が棚に入る。支払条件を選ぶと「右の列に入る科目（現金か買掛金か）が変わる」ことを予告。具を選ぶと丼に具が載り、原価と売値の差が動く。
- **報酬**：丼の絵が変わる・棚が埋まる（状態）。
- **根拠**：[W40](https://mobbin.com/screens/5528f405-0e95-4df2-90ff-6457bbf9ce15)（誰から→どこへの矢印、支払条件が同じ頁）、[W41](https://mobbin.com/screens/78129b1d-65a8-4e90-907f-b112f819f4f6)（±と品切れ）、[W42](https://mobbin.com/screens/e838b7af-a035-4d7d-944f-5e02a52ce379)（請求書の行ごとに科目の欄）、[W38](https://mobbin.com/screens/d58fe905-4961-4f07-a6f5-279a7da50e59)（見出しごとの「0/2」と下の合計）、[W39](https://mobbin.com/screens/0d630f70-79ce-485f-a335-ee62fb74d30c)（完成の絵を上に大きく）、[M11](https://mobbin.com/screens/d2af9ba5-6394-44ed-8053-178bd8953fd8)（「2つまで」と下の合計）。
- **悪い面と反対の事実**：業務の注文・発注の画面で、絵がないと事務に見える。写真は作れず、絵で代える量の問題（BIZ-UIREF 18章 問5）。「Running Low」の札は急がせる圧になりうる。

### 2.12 画面12 締め

- **主役**：空になった受け箱と、試算表の左右。
- **階層**：いま＝大きなチェックと「今月の書類はぜんぶ記帳した」。次＝試算表の左（資産）と右（負債＋純資産）の2本の棒。そろえば「締める」が押せる。縁＝通帳と帳簿のずれ（銀行勘定調整・現金過不足の月）。
- **操作**：「締める」を押す。合わなければ森さんが場所だけ示し（PEDAGOGY 1.1 ③）、押すとその書類へ戻る。
- **動き**：2本の棒の高さがそろうと短く光る。締めると月の札に「締めた」の判。
- **報酬**：月が閉じる（状態）。Xero の期間の札「Closed period」（MB2 の1か月の流れ）と同じ。
- **根拠**：[W2](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)（空になると大きなチェック。原寸で確かめた）、[X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)（月ごとの資産と負債・純資産の対の棒）、[W3](https://mobbin.com/screens/325fffea-71f9-4c44-8109-c1476771616f)（「確かめた分＋まだの分＝残高」の式＝通帳と帳簿のずれ）。
- **悪い面と反対の事実**：対の棒は額が小さいと区別できない。Mercury の画面は業務アプリそのもの [X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)。

### 2.13 画面13 月報とふりかえり

- **主役**：1枚に1つの問い。
- **階層**：最大4枚。①損益（今月の利益と原因の1文：「費用が収益より多かったので赤字」[X41](https://mobbin.com/screens/0303c0ec-446a-4f27-b2fa-c82f58d98a4e)[X21](https://mobbin.com/screens/3f60710a-3d4e-4892-a146-05dc3a432fc9)）②資金繰り（現金の増減と来月の支払い [X30](https://mobbin.com/screens/a0fcfcb0-2e7a-40eb-8cbd-f0845067be4a)）③貸借（資産・負債の増減。[X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938) の棒と線の形）④ふりかえり（今月の札を「直した札／一度で正しかった札」の2つの箱に [Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e)、最後に「今月の一手」の札＝来月の予告 [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2)）。変化の小さい札は出さない。目標を立てた月だけ「目標との差」の札（目標の線の左右 [X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db)）。
- **操作**：めくる・飛ばす・あとで見る（帳簿にいつでもある）。
- **動き**：札が下から上がる。数は止まるまで 0.5〜1秒。
- **報酬**：なし（結果そのものが返り）。
- **根拠**：[X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db)（入口の3つの数→1枚ずつの札→CONTINUE TO 〜。原寸で Budgets の札の目標の線と赤緑の↑↓を確かめた）、[X21](https://mobbin.com/screens/3f60710a-3d4e-4892-a146-05dc3a432fc9)[X41](https://mobbin.com/screens/0303c0ec-446a-4f27-b2fa-c82f58d98a4e)（数の後に理由を文で）、[X47](https://mobbin.com/screens/c792115c-8ac3-4bfd-bab8-ea72deb09752)[X50](https://mobbin.com/screens/8d71697d-b15c-4ebe-8f31-cc348fd9f115)（先月の同じ時点と1文で比べる）、[X60](https://mobbin.com/screens/ea59c327-1787-47dc-b850-15708c5e337d)（一番良い週と悪い週を対に）、[Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e)、[X32](https://mobbin.com/screens/207509eb-1252-49bc-bff4-4524dfc83da3)（超えた額と責めない1語）。
- **悪い面と反対の事実**：毎月4枚は長い。毎月同じだと飽きて飛ばされ、結果が返る体験が消える（MB1 S10）。月報は1枚に要約し、詳しくは帳簿で見るほうがよい、という別の解釈がある（MB1 論証の表）→試作で比べる（6章 T3）。

### 2.14 画面14 帳簿＝店のダッシュボード

- **主役**：純資産の1つの大きな数（「店の値打ち」。名前がつく前は「店に残る分」などの日常語）。
- **階層**：①純資産と先月比の1文 [X50](https://mobbin.com/screens/8d71697d-b15c-4ebe-8f31-cc348fd9f115) ②資産の棒・負債の棒と純資産の線 [X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938) ③損益の札：売上→原価→粗利→経費→利益、押すと内訳 [X38](https://mobbin.com/screens/61123e7a-f3d3-49a7-8f35-f0ee80c5dcf0)、未記帳の書類の分は斜線 [X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8) ④資金繰り：入金と出金の硬貨の山・1日あたりの残り [X31](https://mobbin.com/screens/a252fcfd-1c89-43d2-a090-7c70d5af3c5c)[W27](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626) ⑤タブ「お金の流れ」：入りの源→口座→行き先の帯、今月の仕訳の帯だけ光る [W28](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9) ⑥月の札の列で過去の月へ [X33](https://mobbin.com/screens/b00a6ecc-5e8e-4d63-968e-279012067c1c) ⑦科目を押すと、その月の仕訳の一覧（総勘定元帳の見え方）[W8](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)。
- **操作**：札を押すと1段深く（総合→3つ→勘定→仕訳）[X20](https://mobbin.com/screens/3f912d2e-2bc2-400b-aba4-88b02852a4c8)。月の札を押すと過去の月。
- **動き**：画面8から数が飛んで来たとき、斜線の分が塗りに変わる。
- **報酬**：店の値打ちが増えるのが見える（状態）。
- **根拠**：[X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938)[X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)[X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8)[X38](https://mobbin.com/screens/61123e7a-f3d3-49a7-8f35-f0ee80c5dcf0)[X20](https://mobbin.com/screens/3f912d2e-2bc2-400b-aba4-88b02852a4c8)[X31](https://mobbin.com/screens/a252fcfd-1c89-43d2-a090-7c70d5af3c5c)[W27](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626)[W28](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9)[W8](https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2)[X33](https://mobbin.com/screens/b00a6ecc-5e8e-4d63-968e-279012067c1c)。
- **悪い面と反対の事実**：流れの図は帯が多いと読めず、現金を通らない仕訳（減価償却）が出ない（MB2 F6）→ 山（試算表）と2つ要る。純資産は名前を知る前は読めない（PEDAGOGY 1.2 の後に段で出す）。大人の家計の画面は自分のお金だから読まれる、架空の店のお金に同じ関心が生まれるかは分からない（MB1 反対の事実4）。原寸の YNAB の線の始まりは表の -$767.31 で、MB1 の「-$720」は読み違い（付録A。型には影響しない）。

### 2.15 画面15 目標と1年の道

- **主役**：1億への見込みの線。
- **階層**：上段（ゲーム全体）：月の軸の右端に1億の星、純資産の線、このペースの点線、「このペースなら◯年◯月」の1文 [X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)[X7](https://mobbin.com/screens/ca6407b9-5665-4509-9948-8830b3a0ca61)。点線の前提（客数・値段・借入）は押すと見える。満点の側は試験範囲マップの状態（輪郭／これから起きる／自分で書けた／日をあけても書けた。数や％は出さない：PEDAGOGY 4.3）。中段（年）：年の方針の札と「決算まで◯か月」[X8](https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a)、12の石の道（済み実線・先は点線と輪郭、今の石に自分）[X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)[Q58](https://mobbin.com/screens/3ef3dce1-8f8e-416b-b8c2-5d52d177fe26)[Q59](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7)。下段（目の前）：今月の「済み・残り」[X4](https://mobbin.com/screens/05906c98-edab-4f98-91a9-bbed376ff424)。縁：任される仕事の段（新人→…→CFO、段ごとに触れる勘定・画面）[X12](https://mobbin.com/screens/07440204-140d-43b0-822b-1dfb63ebf89b)。
- **操作**：年の初めに方針を1つ選ぶ。石を押すとその月の月報へ。
- **動き**：年の段を越えると済んだ段に判が押され、次の段が枠で強調 [X13](https://mobbin.com/screens/7279bc2a-9d5f-4c4d-afbe-1e123cba3f01)。
- **報酬**：道が延びる・任される仕事が増える（状態）。
- **根拠**：[X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)[X7](https://mobbin.com/screens/ca6407b9-5665-4509-9948-8830b3a0ca61)[X8](https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a)[X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)[X12](https://mobbin.com/screens/07440204-140d-43b0-822b-1dfb63ebf89b)[X13](https://mobbin.com/screens/7279bc2a-9d5f-4c4d-afbe-1e123cba3f01)[X4](https://mobbin.com/screens/05906c98-edab-4f98-91a9-bbed376ff424)[Q58](https://mobbin.com/screens/3ef3dce1-8f8e-416b-b8c2-5d52d177fe26)[Q59](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7)[X17](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f)（習得の条件を1行で書く。数は出さない）。
- **悪い面と反対の事実**：初めの数か月は線が平らで寂しい。見込みは前提次第で、根拠のない点線は嘘の安心になる。道は1本道に見え、判断の分岐（Coffee Inc 2）が消える [X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)。Ahead・Mimo の道は炎・％と一緒に置かれている [X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632)[Q59](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7)（原寸で炎「1」を確かめた）【禁止の型】の部分は写さない。

### 2.16 画面16 町とライバル

- **主役**：町の地図の上の、自店とライバル店のピン。
- **階層**：いま＝地図（形は【オーナーの決定が要る】18章 問4）。ピンに評判の点と「値下げ中」の小札 [W46](https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4)、重なるピンは数の丸 [W47](https://mobbin.com/screens/ef125d25-1074-43b1-aa75-d643acc4ffc1)、自店のピンは色を変える。次＝ピンを押すと店の札（先週の客 ◯人 [W48](https://mobbin.com/screens/ff560597-4452-4581-9ae3-557360a35206)）。縁＝その店との**対戦の表**（自店とライバル1店：客数・値段・原価率・評判を左右に、勝る側に色）[X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f)。町の平均は灰の棒 [X54](https://mobbin.com/screens/98dbc571-d930-44fa-9860-3b79dbc8ef9b)。
- **順位を出すか**：【オーナーの決定が要る】（9章 D3）。出すなら自店の行だけ浮かせ、先月からの±と矢印 [W49](https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9)。他人（実在の人）との順位は出さない【禁止の型】。
- **操作**：ピンを押す、相手を選ぶ。
- **動き**：月ごとにピンの小札が変わる。静か。
- **報酬**：なし。
- **根拠**：[W46](https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4)[W47](https://mobbin.com/screens/ef125d25-1074-43b1-aa75-d643acc4ffc1)[W48](https://mobbin.com/screens/ff560597-4452-4581-9ae3-557360a35206)[W49](https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9)[X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f)[X54](https://mobbin.com/screens/98dbc571-d930-44fa-9860-3b79dbc8ef9b)、[M12](https://mobbin.com/screens/5966689f-bae2-476e-8afd-57402080775b)（リーグの昇格の帯。写すのは「自分の行だけ色」だけ）。
- **悪い面と反対の事実**：原寸の TheFork でも点数のピンが重なって数が隠れた [W46](https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4)（「隠れるピン」は BIZ-UIREF が退けた形）。Coffee Inc 2 そのものの地図は Mobbin になく、これらは「地図に比べる数を載せる」一般の実例で、Coffee Inc 2 の再現の根拠にはならない（MB2 F5）。負けが続くと見るのがつらい。

### 2.17 画面17 店の断面

- **主役**：斜め上から切った店（厨房・客席・倉庫）。
- **階層**：断面の絵→置いた設備の名札（取得原価）→下に置ける物の札。
- **操作**：物の札を押し、置く場所の候補の光る輪を押す（ドラッグを必須にしない）。
- **動き**：置くと名札が付き、客が座る。
- **報酬**：店の絵が変わる。看板・暖簾を選ぶと店の前（画面2）の絵も変わる。
- **根拠**：[W50](https://mobbin.com/screens/8461968f-48e3-4870-980c-3c140c07fcdb)（原寸で等角の部屋と床に光る丸い印、金の枠の札「Light」を確かめた）、[W51](https://mobbin.com/screens/7966062b-2480-48b7-abce-d868ca9eb345)（品の札と店番のキャラの一言。通貨・時間で入れ替わる品は【禁止の型】）、[M7](https://mobbin.com/screens/469aaab7-e1db-425f-910e-f6177854e699)（等角の島）。
- **悪い面と反対の事実**：回さない等角でも読み違いはある（Tversky、BIZ-UIREF 18章 問4）。絵を作る量。

### 2.18 画面18 決算の振り返り（年1回）

- **主役**：1枚に巨大な1つの数か語。
- **階層**：「1年目」→12か月の利益の縦線 [X59](https://mobbin.com/screens/d6f73070-f70c-4fdd-81b2-dfe31a1bba15)[X43](https://mobbin.com/screens/088f1e0a-1d5c-4daa-a0ac-519460f16512)→一番もうかった月と苦しかった月 [X60](https://mobbin.com/screens/ea59c327-1787-47dc-b850-15708c5e337d)→一番大きな判断の場所を町の地図で [X59](https://mobbin.com/screens/d6f73070-f70c-4fdd-81b2-dfe31a1bba15)→ねぎらいと「来年の方針を決める」[X59](https://mobbin.com/screens/d6f73070-f70c-4fdd-81b2-dfe31a1bba15)[X8](https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a)。最後の1枚で貸借対照表が組み上がる（第1回 M13 の大胆な写し方）。
- **操作**：めくる、最後に方針を選ぶ。
- **動き**：1枚ずつ大きく出る（年1回なので長くてよい）。
- **根拠**：[X59](https://mobbin.com/screens/d6f73070-f70c-4fdd-81b2-dfe31a1bba15)（巨大な月の名→合計→一番の種目→一番長い走りの地図→Kudos と Set A Goal）、[X43](https://mobbin.com/screens/088f1e0a-1d5c-4daa-a0ac-519460f16512)（0の線の上は黒字・下は赤字の月の棒）、[X60](https://mobbin.com/screens/ea59c327-1787-47dc-b850-15708c5e337d)、[M13](https://mobbin.com/screens/02228791-9019-41a0-92bc-8f00ce5ba1b5)。
- **悪い面と反対の事実**：赤字の年でも成り立つ文の用意が要る。

### 2.19 画面19 科目の帳面と原理マップ

- **主役**：リングで綴じた帳簿の形の帳面。
- **階層**：原理ごとの見開き（P1 二面性…）→貼られた科目の札と「？」の影（箱の形だけ。名前は出さない）→札を押すと：生まれた場面（何年目何月・どこで・誰と）[Q52](https://mobbin.com/screens/58646e99-5a30-4d88-ad38-c2f97e6c2945)、兄弟との違い1行 [Q54](https://mobbin.com/screens/625b38aa-a4bf-42fe-bbc3-335565a2aa82)、本試験の呼び名、B/S・P/L の位置。タブ「原理マップ」：8原理の点、用語の葉、主の線は太く副は細く、誤りの線は色 [Q57](https://mobbin.com/screens/e7c6977d-1963-412c-8ade-bf6b9aeeecd3)。
- **操作**：頁をめくる・札を押す・「生まれた場面をもう一度」。
- **動き**：新しい札が貼られるとき頁がめくれる。
- **報酬**：帳面の頁が埋まる（状態）。**「1/60」のような数は出さない**（PEDAGOGY 4.3）。
- **根拠**：[Q49](https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3)（原寸で綴じた帳面と「1 / 60」「2 / 114」の数、上端に薄い「9 day streak」を確かめた）、[Q50](https://mobbin.com/screens/e3bb25f0-8176-452c-8c3f-c0216a27c1af)（影の形。名前を影の下に出すのは PEDAGOGY 0.2・4.3 に反する）、[Q52](https://mobbin.com/screens/58646e99-5a30-4d88-ad38-c2f97e6c2945)、[Q54](https://mobbin.com/screens/625b38aa-a4bf-42fe-bbc3-335565a2aa82)、[Q57](https://mobbin.com/screens/e7c6977d-1963-412c-8ade-bf6b9aeeecd3)、[Q70](https://mobbin.com/screens/d1cca038-4e34-4ac9-a510-52d398c427e2)（空の帳面を冗談の絵で）、[Q81](https://mobbin.com/screens/7499140f-c314-49f3-873a-f390c11148a7)（用語の一覧の頁＝作らない見本）。
- **悪い面と反対の事実**：Finch は数（1/60）で集める動機を作っている。数を外すと集める動機が弱まるかもしれない（MB3 論証の表）。点が増えると原理マップは絡まって読めない。

### 2.20 画面20 届く封筒とまちがいノート

- **主役**：机の上の封筒1つ（森さんから「同じ型の別の案件」）。
- **階層**：今日の封筒→鍵の付いた封筒（3日後・7日後の日付）[Q43](https://mobbin.com/screens/55459f0d-6d76-41bc-b1bf-697ad394c16a)→まちがいノート（月ごとの「直した札」「一度で正しかった札」の箱）[Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e)→段の名前と条件1行（「別の月にもう一度正しく切れたら定着」）[Q44](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f)。
- **操作**：封筒を開けて1件を切る。ノートの札を押すと生まれた場面へ。
- **動き**：届いた封筒が机に滑り込む。日付で鍵が外れる。
- **報酬**：段の名前が変わる（数でなく言葉）。
- **根拠**：[Q43](https://mobbin.com/screens/55459f0d-6d76-41bc-b1bf-697ad394c16a)（原寸で鍵の付いた「Review on Tue 20」「Review on Fri 23」と、同じ枠の「Review streak 0」を確かめた。streak は写さない）、[Q44](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f)、[Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e)。
- **悪い面と反対の事実**：連続日数で続けられた人の声がある（BIZ-UIREF K10、MB3 論証の表）。連続を数えないことは、作り手の負担が減る向きなので反対の事実を7章に書いた。

### 2.21 画面21 決まりの棚（自動仕訳ルール）

- **主役**：自分で作った決まりの札の束。
- **階層**：同じ型を3回・別の月で正しく切った直後の知らせ「この切り方を決まりにする？」[W15](https://mobbin.com/screens/bd4785a8-2499-4f95-9ea5-4ff6ab39964c)→決まりの文を組む（「問屋から掛けで仕入れたとき→仕入／買掛金」）→棚（札の束）[W29](https://mobbin.com/screens/f5b4a2cc-77d8-4a1c-82db-32dbc9b38374)。監査の月は条件の外の札が混ざり、違う札を払いのけて確かめる [W9](https://mobbin.com/screens/a6d10794-203e-4693-ad2c-96e8ce54254b)。
- **操作**：知らせから組む・棚の札を外す・違う札を払う。
- **動き**：決まりの札が棚に入る。
- **報酬**：決まりが増え、その型の書類が自動で流れる（PEDAGOGY 1.6）。
- **根拠**：[W15](https://mobbin.com/screens/bd4785a8-2499-4f95-9ea5-4ff6ab39964c)[W29](https://mobbin.com/screens/f5b4a2cc-77d8-4a1c-82db-32dbc9b38374)[W9](https://mobbin.com/screens/a6d10794-203e-4693-ad2c-96e8ce54254b)[Q31](https://mobbin.com/screens/9c79865b-4525-45ad-a89c-f4de4128fa27)。
- **悪い面と反対の事実**：Monarch は1回で提案する。早すぎると理解の前に自動化する。推測を見せて払う型は、何も考えずに「This looks right」を押す [W9](https://mobbin.com/screens/a6d10794-203e-4693-ad2c-96e8ce54254b)。

### 2.22 画面22 練習室・検定会場

- **主役**：試験の約束と問題の格子。**舞台を出さない**（本番の形）。
- **階層**：入口＝「90分・5問・100点。どの大問にも戻れる」の2行（練習は「時間なし」と明示）[Q32](https://mobbin.com/screens/991bedee-4ad4-40cc-8827-526546050877)。試験中＝上に大問と小問の格子（済み／未／見直しの印だけ。正誤を先に漏らさない）、下にいまの問いの帯と ‹ ›、残り時間 [Q33](https://mobbin.com/screens/57fcc0a4-5f6e-4253-ae06-fb09f14c11c6)[Q34](https://mobbin.com/screens/faf99c88-e9a5-44ef-8e7d-3335018c4781)。採点後＝格子が正誤の色、合格までの差1つ [Q36](https://mobbin.com/screens/0fe586a8-ee63-46ee-984d-e65456fcf2d4)、原理×分かれ道で「上がった・下がった」[Q39](https://mobbin.com/screens/27314584-b77a-4ad4-bda9-b6b6f6d149eb)、次の一手2つ [Q37](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014)。練習室の札の速さは時間の圧を本人が選ぶ [Q69](https://mobbin.com/screens/b26c98e9-f78d-4892-8984-041091d7dfee)、左右の2択の振り分け [Q29](https://mobbin.com/screens/7f33ea08-dfc8-4ce6-b877-a29486f38865)。
- **操作**：CBT と同じキー入力（PEDAGOGY 1.7）。
- **動き**：採点の後、格子が1つずつ色づく。
- **根拠**：[Q32](https://mobbin.com/screens/991bedee-4ad4-40cc-8827-526546050877)[Q33](https://mobbin.com/screens/57fcc0a4-5f6e-4253-ae06-fb09f14c11c6)[Q34](https://mobbin.com/screens/faf99c88-e9a5-44ef-8e7d-3335018c4781)[Q36](https://mobbin.com/screens/0fe586a8-ee63-46ee-984d-e65456fcf2d4)[Q37](https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014)[Q39](https://mobbin.com/screens/27314584-b77a-4ad4-bda9-b6b6f6d149eb)[Q69](https://mobbin.com/screens/b26c98e9-f78d-4892-8984-041091d7dfee)[Q29](https://mobbin.com/screens/7f33ea08-dfc8-4ce6-b877-a29486f38865)。
- **悪い面と反対の事実**：業務的な見た目は、オーナーの「チープ」「UI デザインが終わってる」に当たるかもしれない（MB3 論証の表。【オーナーの決定が要る】9章 D5）。Khan の energy pts・Nibble の時計と星は【禁止の型】。

### 2.23 画面23 休業・再開・設定

- **主役**：店ののれん。
- **階層**：休業＝のれんが下がり「休業中」、時間は進まない [Q63](https://mobbin.com/screens/7aa235cf-4192-42df-859e-fd0447bb71fe)。再開＝社長「おかえり」と、日をあけたときだけ前回までのあらすじ3行と「店を開ける」1つ [Q64](https://mobbin.com/screens/442d1c66-914c-4e8b-b0fa-eb9d6620a5c6)。設定＝最後の保存の時刻と書き出し・読み込み [Q67](https://mobbin.com/screens/d6179aa1-b903-40a7-b547-ca01fc2943c5)、手ごたえの強さ（控えめ・ふつう・派手）・音・声 [Q68](https://mobbin.com/screens/9ca8e991-56ec-415c-a983-2f96c0f035a4)、練習の時間の圧（なし・あり）[Q69](https://mobbin.com/screens/b26c98e9-f78d-4892-8984-041091d7dfee)。
- **操作**：のれんを上げる＝再開。
- **根拠**：[Q63](https://mobbin.com/screens/7aa235cf-4192-42df-859e-fd0447bb71fe)[Q64](https://mobbin.com/screens/442d1c66-914c-4e8b-b0fa-eb9d6620a5c6)[Q67](https://mobbin.com/screens/d6179aa1-b903-40a7-b547-ca01fc2943c5)[Q68](https://mobbin.com/screens/9ca8e991-56ec-415c-a983-2f96c0f035a4)[Q69](https://mobbin.com/screens/b26c98e9-f78d-4892-8984-041091d7dfee)。
- **悪い面と反対の事実**：休む画面を作ると休みを意識させる。強さの既定は決まっていない（18章 問3）。

## 3. 3人の素案の食い違い

決められる所は根拠で決め、決められない所は決めない。「決めた」の行も、論証の検査の対象（7章）。

| # | 論点 | MB1 | MB2 | MB3 | 結論 | 根拠・理由 |
|---|---|---|---|---|---|---|
| C1 | ホームの主役 | 店の絵と「今月の状態」の1語、1億への見込みの細い線（S1） | 次の書類1枚（① 受け箱） | 月の扉（S-3、今月の札） | **決めた（主役は次の書類1枚）**。月の扉は月の始まりの切り替えに回す。見込みの線を置くかは**決めない**（D1） | MB1 の状態の1語の例「書類があと3通」は MB2 の受け箱と同じ物を指す。3人の根拠の画面（[W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144)[X23](https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b)）は、どれも「次にやる1つ」を数より上に置く。Headspace [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2) は済んだ→次が大きい、の**切り替え**の画面で、ホームの常の姿ではない |
| C2 | 帳簿をダッシュボードにするか | する（S2。帳簿＝店のダッシュボード） | 反映の図（④）を月の途中でも開ける別の画面 | 扱わない | **決めた（1つの帳簿の画面14に MB2 の流れの図と山をタブで入れる）**。帳簿を店の画面に常に見える盤にするか（DESIGN-JOURNAL-UX 10章の大胆）は**決めない**（D4） | MB1 と MB2 の根拠（[X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938)[X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3) と [W27](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626)[W28](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9)）はどれも数の画面で、同じ場所に置ける。MB1 の別の解釈「帳簿は練習室の参考書に置く」は、PEDAGOGY 1.1 ④「会社の状態が動く」を会社の外に出すので採らない |
| C3 | 仕訳の操作 | （MB1 の担当の問いに入っていない） | 「差を0にする」が本来の形に一番近い。スワイプは2択の段だけ | 穴のある1文と置く先の図（S-5）、操作が先・名前が後 | **決めた（層の違いとして重ねる）**：差の帯＝確定の条件、左右へ払う＝操作、穴の1文＝問いの形。**決めない**：机の盤が「列」か「箱（B/S の日常語の盤）」か（DESIGN-JOURNAL-UX 10章の試遊） | 3つは同じ画面の別の役で、どれかを選ぶと他が消える関係にない。ただし差の帯は義務感を生む恐れ（MB2 論証の表）、差0でも科目違いがある（[W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b) 原寸）ので、試作で「あり／なし」を比べる（6章 T2）。盤の形は PEDAGOGY 1.3（P1・P2 は箱を動かす）と本試験の第1問の形（列）の両方に根拠がある |
| C4 | 画面の層 | ホームは絵、帳簿は数、と分ける（反対の事実1） | 画面ごとに違う | どの画面も舞台・人物の帯・手元の3層 | **決めた（3層は店の場所の画面だけ）**。帳簿・成長・検定会場は3層にしない | MB1 の反対の事実1（数の画面の多くは絵を使わない）と、MB3 自身が検定会場（S-11）を舞台なしにした。3層の目的（「何のための記帳か」を切らない）は、月の1周の画面で果たせる |
| C5 | ライバルの見せ方 | 対戦の表（1店と左右に）、順位表は捨てた | 町の順位（自店の行を浮かせる） | 扱わない（他人との比べは禁止の型） | **決めない**（D3）。地図→店の札→対戦の表、の道は3人の範囲で矛盾しないので置く | 順位も対戦の表も相手はゲームの中の店で、K10（他人との量の競争）に当たるかは解釈が割れる。オーナーの「周辺エリアの同業種競合が複数」は複数を一度に見る形（順位）とも読める |
| C6 | 進みの数（同じ Quizlet の画面 [X17](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f)＝[Q44](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f)） | 習得の3段を成長の記録で（数の扱いは書かない） | — | 数（46・22）は出さない | **決めた（数は出さない。段の名前と条件の1行）** | PEDAGOGY 4.3「数や％・進捗バー・残り項目数は出さない」は決定済み。1億・純資産の数は会社の状態で、これには当たらない |
| C7 | 月の終わりの画面 | 月報4枚（損益→予算→資金→貸借）（S4） | 締めの札（Closed period） | ふりかえり＝直した札と正しかった札の2つの箱 | **決めた（締め→月報の順。月報は最大4枚、最後の札がふりかえり）**。枚数を毎月4枚にするか1枚にするかは試作（T3） | PEDAGOGY 1.1 の③締める→④返るの順。MB1 自身が「変化の小さい札は飛ぶ」と書き、MB3 は「直した札だけでよい」と書く。どちらも「毎月全部」を勧めていない |
| C8 | 動きの量 | 数が数え上がる・斜線が塗りに変わる・左右の棒がそろうと「合った」 | 札が山に積まれ山が伸びる | 動きより「返事が来る」が効くかもしれない（反対の事実） | **決めない**（18章 問2・問3） | Mobbin は静止画で、3人とも動きを1つも見ていない |
| C9 | 反映をいつ動かすか | 記帳した瞬間に斜線が塗りに | 払った札が山に積まれる | 誤りでも舞台に一度反映 | **決めた（机の列は置いた時点で伸びる。帳簿と舞台は確定の後に動く）** | DESIGN-JOURNAL-UX 6章は「帳簿に書く前は棚を動かさない（正しさ）」。PEDAGOGY 1.2 拍3「誤りも一度は反映」は確定の後でも満たせる。MB2 の「山」は机の中の列のことで、帳簿の反映とは別の物、と読めば3人と6章が両立する【推論】 |
| C10 | 1年の道の置き場所 | 目標の画面（S5）と Ahead の12の石 | — | 原理マップのタブ（S-9）と月の扉の Part・Session（S-3） | **決めた（1年の道は画面15の中段に1つ。月の扉はその上の今月の位置を見せる）**。原理マップは帳面（画面19）のタブ | 同じ「12か月の道」を2か所に置くと、どちらが本物か迷う。MB1 の [X10](https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632) と MB3 の [Q59](https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7) は同じ Ahead の別の画面で、型は同じ |
| C11 | 検定会場の見た目 | — | — | 業務的な見た目でよい（本番の形に寄せる） | **決めない**（D5） | オーナーの「チープ」との関係が資料で決まらない |
| C12 | スワイプとドラッグ | （MB1 の担当の問いに入っていない） | スワイプは2択だけ、箱へのドラッグの実例なし | ドラッグは並べ替えに限る分け方もある | **決めた（DESIGN-JOURNAL-UX 4.1 の4つの入力は残す。スワイプは左右の2択だけ、ドラッグは必須にせず並べ替え（P5）の主な操作）** | 4つの入力はオーナーが承認済み（OWNER-WORDS）。MB2 の「ドラッグを捨てたのでなく試作で比べる候補に残す」と同じ向き |
| C13 | はじまり | Shopify の「Get ready to sell」6行の手順（S1、MB3 と重なると書く） | — | 物語の3画面＋最初の1杯の手本（S-1・S-2） | **決めた（MB3 の形）** | PEDAGOGY 0.1「行動が反映される」と 0.2「読む→解く」の禁止。手順の6行は読ませる形になる |

## 4. 見た目と情報の決まり

3人が書いた決まり（MB1 の S9、MB2 の操作の約束、MB3 の全体の考え方）を1つにした。

### 4.1 数の見せ方
1. 大きな数は1画面に1つ [X19](https://mobbin.com/screens/bfe532d9-62fe-4246-9775-9c8934195bcb)[X23](https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b)。ほかの数は小さく、押すと開く [X20](https://mobbin.com/screens/3f912d2e-2bc2-400b-aba4-88b02852a4c8)
2. 比べは「先月の同じ時点」か「名指しの相手」を1文で [X47](https://mobbin.com/screens/c792115c-8ac3-4bfd-bab8-ea72deb09752)[X50](https://mobbin.com/screens/8d71697d-b15c-4ebe-8f31-cc348fd9f115)[X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f)。％だけで比べない（小さな額や0からの変化で％が極端になる：MB1 うまくいかない2）
3. 数の後に「なぜその数か」を文で [X21](https://mobbin.com/screens/3f60710a-3d4e-4892-a146-05dc3a432fc9)[X41](https://mobbin.com/screens/0303c0ec-446a-4f27-b2fa-c82f58d98a4e)
4. 見込み（点線・幅）は前提を押せば見える [X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)[W32](https://mobbin.com/screens/a196ebe3-0c04-4b4e-8241-201b961696a7)
5. 量の数（記帳の回数・連続日数・XP・集めた数「1/60」）は出さない【禁止の型】[X2](https://mobbin.com/screens/4dd0e004-24b3-4efa-8e10-2af3b11251b9)[X14](https://mobbin.com/screens/9f9ad31c-ec4e-4a7c-98a0-764d40835315)[X16](https://mobbin.com/screens/da51f189-852c-47b1-a096-bcdc16583b5c)[Q48](https://mobbin.com/screens/43ae2042-624d-4cd4-805b-13c78b3138af)[Q56](https://mobbin.com/screens/f81f0d35-6c03-42b7-8388-230f90c38f4a)。進みは会社の状態と習得の状態の言葉で（PEDAGOGY 1.8・4.3）
6. 文の中に数を埋める形はよい（「今月は3枚を直して、2枚は一度で切れた」[Q48](https://mobbin.com/screens/43ae2042-624d-4cd4-805b-13c78b3138af) の形だけ）

### 4.2 文字
1. 1画面 180字まで（PEDAGOGY 0.2）。人物の帯は1行、吹き出しは1画面3つまで [Q13](https://mobbin.com/screens/f1474ff0-3e47-4d6b-b9b6-b945415c183e)
2. 新しい科目名は1画面2つまで。名前がついた語だけ枠つき [Q14](https://mobbin.com/screens/bb06ea68-f1a1-462c-8993-84377b580bc9)
3. 帯の字は14px 以上（BIZ-UIREF 0章-1）。帯に数を置かないなら帯の高さの問題は小さくなる（18章 問1 との関係は5章）

### 4.3 色の役割
1. 自分は色、比べる相手は灰 [X54](https://mobbin.com/screens/98dbc571-d930-44fa-9860-3b79dbc8ef9b)
2. 赤は「超えた・足りない」だけに使い、責める言葉と組まない [X32](https://mobbin.com/screens/207509eb-1252-49bc-bff4-4524dfc83da3)。借方・貸方の列は中立の色（DESIGN-JOURNAL-UX ぶつかり #19）
3. 緑は「そろった・済んだ」（差の帯が0 [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)、済んだ札 [Q79](https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2)、空の受け箱 [W2](https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3)）。3つの役を同じ緑で通す
4. 5区分の色（資産・負債・純資産・収益・費用）は科目の棚と帳面で同じ [W7](https://mobbin.com/screens/05f44de1-5a20-4bc4-b849-746680f91834)

### 4.4 動きの段（仮の値。試作で比べる）
| 段 | 何が | 長さ | 飛ばせるか |
|---|---|---|---|
| 手ごたえ | 押して沈む・札が列に着地 | 400ms 以下 | 止めない |
| 値の変化 | 差の帯・残高・棒 | 0.5〜1秒（止まるまで） | 次の操作で即座に止まる |
| 切り替え | 月の扉・月報の札 | 約1秒 | 押せば飛ぶ |
| 儀式 | 決算の振り返り（年1回） | 長くてよい | 押せば飛ぶ |
強さ3段（控えめ・ふつう・派手）は設定で選ぶ [Q68](https://mobbin.com/screens/9ca8e991-56ec-415c-a983-2f96c0f035a4)。既定は決まっていない（18章 問3）。

### 4.5 報酬（全画面）
報酬は状態の変化だけ：受け箱が空になる・差が0になる・札が緑になる・帳面に貼られる・店の絵が変わる・任される仕事が増える・決まりが増える。祝うのは「はじめて」だけ [W52](https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f)。

## 5. いまの設計とのぶつかり（DESIGN-JOURNAL-UX と BIZ-UIREF 18章）

### 5.1 BIZ-UIREF 18章の5問：素案がどの答えを前提にしているか

| 問 | 素案の前提 | どこで | 判定 |
|---|---|---|---|
| 問1 上部の帯 | 3人とも**数の帯を置かない側**。MB1 は「ホームは1つ」（(b) の先取り。MB1 自身が反対の事実5で認める）、MB2 は受け箱が主役で帯の記述がない、MB3 の3層には帯がない。この素案も画面2で帯を置かない | 画面2、4.2-3 | **【オーナーの決定が要る】**。(b) よりさらに進んだ「帯をなくし、数は帳簿の場所へ」で、18章の選択肢 (a)〜(c) のどれでもない。9章 D1 に選択肢を足して返す |
| 問2 動きを足す理由 | 3人とも動きを書くが、成績の根拠にはしていない＝(a) の前提 | 4.4、各画面の「動き」 | **【オーナーの決定が要る】**（問2 のまま） |
| 問3 強さの既定 | 前提にしない（3段の設定だけ） | 画面23 | 決めない |
| 問4 町の形 | MB2 は「回さない等角」＝(b) を先取り。店の断面も等角 | 画面16・17 | **【オーナーの決定が要る】**。この素案は地図の形を決めずに書いた（ピン・対戦の表は (a)〜(c) のどれでも成り立つ）。店の断面（画面17）は等角で書いたので (b)・(c) 寄り |
| 問5 チープさの主役 | 3人とも (a) 世界の絵の側（店の絵・舞台・硬貨の山）。MB3 の帳面の形は (c) の側 | 1.1 の3層、画面17・19 | **【オーナーの決定が要る】**。3層は (a) を前提にした形。(b)・(c) を選ぶと舞台の役が薄くなる |

### 5.2 DESIGN-JOURNAL-UX（版0.4）とのぶつかり

| 節 | いまの決定 | 素案 | ぶつかり方 |
|---|---|---|---|
| 3.1 問いの文 | 問いは2文 | 相手の1文＋指示1行＋穴のある1文（画面4・5） | 同じ向き（BIZ-UIREF 6章 #1 の案「指示1行と手がかりを分ける」） |
| 3.3 手本 | ピヨが最初の1枚を入れる（飛ばせる） | はじまりの手本は自分で置く（画面1） | 向きが違う。ピヨの手本を見せた後に自分で置くなら両立する【推論】 |
| 4.1 4つの入力 | 同格 | 残す（C12） | ぶつからない |
| 4.2 1枚ずつ直す | 札ごとのメニュー | 残す（画面5） | ぶつからない |
| 5.1 長さ | 400ms・700ms | 4.4 で同じ値を仮に使う | ぶつからない（値はどちらも【推論】） |
| 6章 反映 | 書く前は棚を動かさない | 机の列は置いた時点、帳簿と舞台は確定の後（C9） | 両立する読みを C9 に書いた。BIZ-UIREF 6章 #17 の割れ（A 即時／B 押す重み）の B 側 |
| 6章 棚の小さな絵を列の下に常に置く | 列の下に棚の帯3本 | 反映は舞台の上の小札（画面8）と帳簿（画面14） | **ぶつかる**：素案は机の下に棚を置かない。「どこに反映されたか」を棚で見せるか、舞台と帳簿で見せるかは試作で比べる（6章 T2） |
| 10章 最小と大胆 | 最小で作り、試遊で盤と列を比べる | 机の盤は決めない（C3）。帳簿を常に見える盤にするかも決めない（D4） | ぶつからない（試遊の比べを引き継ぐ） |
| 上部の帯（ramen.css） | 帯に数を並べる | 帯をなくす | **ぶつかる**（5.1 問1） |
| 差の帯 | なし | 机の上端に常に（画面5） | **新しく足す物**。左右が合わないときの横揺れ（いまの唯一の動き）の代わりになる |

## 6. 試作で確かめること

対象は中高生（15歳以上：PEDAGOGY 8）。短い試作を2版以上作り、同じ書類で比べる。数は道具で記録する。

### 6.1 比べる物

| # | 何を比べるか | 版 | 測る物 | 決まること |
|---|---|---|---|---|
| T1 | ホームの数 | (a) 数なし・次の書類1枚 (b) (a)＋1億の見込みの細い線 (c) いまの帯の数 | 1か月を終えるまでの時間、「いまお店のお金はいくら？」「1億まであとどれくらい？」に答えられた率、「楽しい・続けたい」 | D1・18章 問1 |
| T2 | 仕訳の机 | (a) 差の帯あり (b) なし。それぞれ反映を (x) 舞台の小札＋帳簿 (y) 列の下の棚 | 1回目の正答率、確定までの時間、読まずに払い直した率、「選んだ科目は帳簿のどこに入った？」に答えられた率（オーナーの原文への答え） | C3・C9、DESIGN-JOURNAL-UX 6章 |
| T3 | 月報 | (a) 最大4枚 (b) 1枚の要約 | 飛ばした率、翌月の判断が変わった率（値段・仕入れを変えたか） | C7 |
| T4 | ライバル | (a) 対戦の表 (b) 町の順位 (c) 両方 | 町の画面を開いた回数、ライバルを理由に判断を変えた率、「つらい」の声 | D3 |
| T5 | 返し | (a) 場所だけ→聞き返しの2択 (b) 正解をすぐ見せる | 2回目の正答率、別の月の同じ型の正答率、待ちの不満 | 画面6 |
| T6 | 問いの形 | (a) 3層（相手の1文＋穴の1文） (b) 別の頁の問題文 | 「何を聞かれている？」を自分の言葉で言えた率（オーナーの原文への答え）、読む時間 | 画面4・5 |
| T7 | はじまり | (a) 3画面＋自分で置く手本 (b) ピヨの手本を見てから置く | 最初の書類まで着いた時間と率、手本の後の1枚目の正答率 | 画面1、DESIGN-JOURNAL-UX 3.3 |
| T8 | 動き | (a) 4.4 の段 (b) 動きなし（色だけ） | 好み、正答率、使い込み（BIZ-UIREF 18章 問2 と同じ測り） | 18章 問2・問3 |

### 6.2 体験の検討（QUALITY 7.1）

| 仕様の候補 | 放っておくと遊ぶ人は何をするか | 何が壊れるか | 直す仕様 | その仕様で遊ぶとどう感じるか（良い面・悪い面と和らげる手） | 現実の裏づけ |
|---|---|---|---|---|---|
| 差の帯（画面5） | 差が0になるまで札を順に試す | 科目の判断が消え、試し打ちになる | 差が0でも確定の後に正誤の返し。誤りの後は文を閉じるまで同じ札を払えない（DESIGN-JOURNAL-UX 4.7）。理由の1タップ | 良：終わりがはっきりする。悪：宿題の残りに見える・義務感→差を責める色にしない（灰→緑）、1〜3件だけにする | [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)[W11](https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6)[W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84)、MB2 論証の表 |
| 次の書類1枚のホーム（画面2） | 書類だけ片づけて、町・帳簿を見ない | 経営の数を見張る楽しさが消える | 書類の相手が舞台に立ち、月の中で出来事が差し込まれる。締めの後の月報で数が返る | 良：迷わない。悪：数を見張る手ごたえが減る（ウマ娘）→T1 で比べる | [W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144)、BIZ-UIREF 0章-2 |
| 月報の札（画面13） | めくらずに閉じる | 記帳と経営がつながらない（④返る） | 変化の大きい札だけ、各札に原因の1文 | 良：月の区切りの儀式。悪：毎月同じで飽きる・待ち→飛ばせる・止めない・変化がなければ出さない | [X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db)、MB1 S10 |
| 1億の見込みの線（画面15） | 線だけ見て毎月の判断を考えない | 判断の手ごたえが消える | 前提（客数・値段・借入）を押すと見え、判断を変えると点線が動く | 良：遠い目標が毎月の判断に返る。悪：初めは線が平らで寂しい→年・今月の段を前に出す | [X5](https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67)[X7](https://mobbin.com/screens/ca6407b9-5665-4509-9948-8830b3a0ca61) |
| 対戦の表（画面16） | 勝っている項目だけ見る、負けると見ない | ライバル比が判断に使われない | 負けている項目に「何をすれば」の1行 | 良：相手が人になり物語が生まれる。悪：負けが続くとつらい→相手を選べる（町の平均） | [X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f)[X54](https://mobbin.com/screens/98dbc571-d930-44fa-9860-3b79dbc8ef9b) |
| 帳面に数を出さない（画面19） | 集める動機が弱まり、帳面を開かない | 図鑑が使われず、生まれた場面の再生が消える | 札に生まれた場面（何月・どこで・誰と）。新しい札が貼られた月は店の前に1行 | 良：量の報酬にならない。悪：集める楽しさが弱い→「？」の影の並び（箱の形）で先を見せる | [Q49](https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3)[Q50](https://mobbin.com/screens/e3bb25f0-8176-452c-8c3f-c0216a27c1af)[Q52](https://mobbin.com/screens/58646e99-5a30-4d88-ad38-c2f97e6c2945)、MB3 論証の表 |
| 聞き返しの2択（画面6） | どちらかを当てずっぽうで押す | 分かれ道の集計が汚れる | 「わからない」も選べる [Q19](https://mobbin.com/screens/93499943-b5af-4860-a9b2-23740d190ccd)、選んだ枝の説明の後に同じ枝の別の例 | 良：説明が1点に絞られて短い。悪：2回誤ると待ちが増える→2回目からだけ出す | [Q16](https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af)[Q19](https://mobbin.com/screens/93499943-b5af-4860-a9b2-23740d190ccd) |

## 7. 論証の表（QUALITY 5.1）

「好み」＝オーナーの好み（動き・ドラッグ・Coffee Inc 2）と同じ向き。「負担減」＝作り手の負担が減る向き。どちらも反対の事実と別の解釈を2つ以上書く。

| # | 結論 | 根拠の事実（番号と画面の箇所） | 推論の形 | 暗黙の前提 | 反対の事実 | 別の解釈 | 作り手の負担 | 向き |
|---|---|---|---|---|---|---|---|---|
| 1 | ホームの主役は次の書類1枚（C1） | [W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef) の TO REVIEW の札1枚、[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144) の「1 Order to fulfill」と「That's it for now」、[X23](https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b) の「You're up-to-date」 | 類推（家計・業務→ゲーム）、一般化（3件） | 遊ぶ人は数を見張るより次にやることを知りたい | ①ウマ娘は値を常に出す（BIZ-UIREF 0章-2）②[X30](https://mobbin.com/screens/a0fcfcb0-2e7a-40eb-8cbd-f0845067be4a)[X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8) は数を多く並べるホーム ③[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144) の「Check back later」は待つ画面 | ①経営シムは数を見張ること自体が遊び ②「次の1枚」は宿題の残りに見える | 減る（帯の数を作らない） | 負担減：反対3つ・別の解釈2つ。T1 で比べる |
| 2 | 仕訳の机に差の帯を常に置く（C3） | [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b) の「Total is out by: 6.75」→「Totals match」、[W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84) の上に残る「Left to Split」、[W11](https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6) の「$0.00 left to split」 | 類推 | 差が見えると終えたくなる気持ちがゲームでも働く | ①差0でも科目違い（[W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b) は赤字の警告のまま確定できた：原寸）②業務の画面が中心で事務に見える | ①義務感を生む ②1行の仕訳が多い1年目には差がほぼ0で意味が薄い | 増える | — |
| 3 | 仕訳の操作は3つの層を重ねる（C3） | 差の帯・左右の払い [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)[W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)・穴の1文 [Q21](https://mobbin.com/screens/4da72f80-d8cf-4225-87ff-ee497dc03e15) | 統合（3人の案の役の分解）【推論】 | 3つは同じ画面に収まる | Acorns の穴は文末で、文の途中の穴の実例はない（原寸）。重ねると1画面の情報が多い（180字・2語の上限） | 3つのうち1つを主役にしたほうが分かりやすい | 増える | — |
| 4 | 3層は店の場所の画面だけ（C4） | MB1 反対の事実1（[X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938)[X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)[X38](https://mobbin.com/screens/61123e7a-f3d3-49a7-8f35-f0ee80c5dcf0) は絵なし）、MB3 の S-11 | 一般化・権威（MB3 自身の例外） | 数の画面は絵がないほうが読める | ①[X6](https://mobbin.com/screens/942b1d25-40c3-42c4-a925-404558f375c9) Acorns・[X31](https://mobbin.com/screens/a252fcfd-1c89-43d2-a090-7c70d5af3c5c) Cleo は数の画面に絵を置いている ②オーナーの「チープ」は帳簿の画面にも当たる | ①帳簿にも舞台の小さな絵を置けば「何のための数か」が切れない ②3層をやめるのは絵を作る量を減らす向き | 減る（帳簿に舞台の絵を作らない） | 負担減：反対2つ・別の解釈2つ |
| 5 | 進みの数は出さない（C6） | PEDAGOGY 4.3、[Q49](https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3) の「1/60」、[X17](https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f) の「46・22」 | 演繹（決定済みの規則） | 数は量の報酬になる | ①Finch は数で集める動機を作る ②1億・純資産の数は出すので、線引きが分かりにくい | 状態の数（習得した論点の数）は量でない、という読み | 減る | 負担減：反対2つ・別の解釈1つ＋PEDAGOGY が決定済み |
| 6 | 反映は確定の後に帳簿と舞台を動かす（C9） | DESIGN-JOURNAL-UX 6章、PEDAGOGY 1.2 拍3 | 演繹（既決の設計と土台） | 置いた瞬間に動くと誤りも動いて見える | オーナーの「どこに反映されてるかわからない」には即時の方が強い答え（BIZ-UIREF 6章 #17 の A） | 置いた時点で予告（どの帯が動くか）を出せば即時の分かりやすさも残る | 変わらない | — |
| 7 | 帳簿は1つの画面で店のダッシュボードを兼ねる（C2） | [X34](https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938)[X36](https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3)[X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8)[W28](https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9)[W27](https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626) | 類推 | 架空の店のお金にも関心が生まれる | ①大人が自分のお金だから読まれる（MB1 反対の事実4）②業務の画面に寄る | ①帳簿は練習室の参考書に置く（MB1 の別の解釈）②帳簿を店の画面の盤にする（大胆） | 増える | — |
| 8 | スワイプは左右の2択、ドラッグは必須にしない（C12） | [W18](https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9)[W19](https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f)[W20](https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e) が全部2択、[W23](https://mobbin.com/screens/a29d4250-9d1a-4d95-bb99-6c5f6cb28178) の12件が並べ替え、[W6](https://mobbin.com/screens/35656b22-a704-4b52-8cd0-9ae4c8addf3d) は押して箱を移す（原寸の文） | 一般化（問い1つ・6件） | Mobbin の外にも箱へのドラッグは少ない | ①Mobbin はゲームを載せていない ②BIZ-UIREF の Unpacking の指の声 ③オーナーの試遊の「UX は良いのでは」 | ①ゲームではドラッグが好まれうる ②4方向のスワイプはゲームにある【問い】 | 減る（ドラッグの判定を主にしない） | 好み（ドラッグ）と逆・負担減：反対3つ・別の解釈2つ。4つの入力は残し T2 で入力ごとの誤操作を測る |
| 9 | 3層の舞台（世界の絵）を月の画面の主役に | [Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9)[Q24](https://mobbin.com/screens/433fb29c-cb3b-41af-9508-e8562b34b88b)[M1](https://mobbin.com/screens/fbbbcbd0-e31f-414d-8847-a7a8037e34f0)、BIZ-UIREF 0章-3 の3人の一致 | 類推 | 絵があると「何のための記帳か」が切れない | ①[Q80](https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e) Speak は絵なしで会話の手ごたえを出す ②[Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9) Kit は絵があっても紙芝居（原寸）③絵の読み違いが誤答になる（BIZ-UIREF 18章 問5 (a)） | ①手ごたえは絵より「返事が来る」から来る（MB3 反対）②UI の形（のれん・帳面）でも同じ役ができる | 増える | 好み（Coffee Inc 2・絵）：反対3つ・別の解釈2つ |
| 10 | 動きは段を決めて置く（4.4） | DESIGN-JOURNAL-UX 5.1、BIZ-UIREF 0章-4〜6 | 権威 | 動きが気持ちよさを上げる | ①Liang 調査2 で成績は上がらない ②くり返すと待ちになる（待たされる声 16件）③Mobbin で動きは1つも見ていない | ①返事の言葉で足りる ②強さの既定を「控えめ」にする | 増える | 好み（動き）：反対3つ・別の解釈2つ。T8 |
| 11 | 町はピン→店の札→対戦の表（画面16） | [W46](https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4)[W47](https://mobbin.com/screens/ef125d25-1074-43b1-aa75-d643acc4ffc1)[W48](https://mobbin.com/screens/ff560597-4452-4581-9ae3-557360a35206)[X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f) | 類推（店探し・スポーツ→経営シム） | 地図に比べる数を載せると楽しい | ①原寸の TheFork でピンが重なり数が隠れる ②Coffee Inc 2 そのものは Mobbin にない（MB2 F5）③負けが続くとつらい | ①Coffee Inc 2 のシェアの円のほうが町の全体が分かる ②順位のほうが「複数の競合」に合う | 増える | 好み（Coffee Inc 2）：反対3つ・別の解釈2つ |
| 12 | 月報は最大4枚・最後がふりかえり（C7） | [X58](https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db) の4枚、[Q38](https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e) の2つの箱 | 類推 | 月の区切りの儀式が④返るを強める | ①毎月だと飛ばされる ②BIZ-UIREF の待たされる声 | 1枚に要約し詳しくは帳簿 | 増える | — |
| 13 | 検定会場は舞台なし（画面22） | [Q32](https://mobbin.com/screens/991bedee-4ad4-40cc-8827-526546050877)[Q33](https://mobbin.com/screens/57fcc0a4-5f6e-4253-ae06-fb09f14c11c6)[Q36](https://mobbin.com/screens/0fe586a8-ee63-46ee-984d-e65456fcf2d4)、MB3 S-11 | 類推 | 本番の形に寄せるほど本番で迷わない | オーナーの「チープ」「UI デザインが終わってる」 | CBT の本番の画面はもっと簡素で、会場が本番より派手でも困らない | 減る（舞台を作らない） | 負担減：反対1つ・別の解釈1つ（不足）。**決めず D5 に返した** |
| 14 | 連続日数を数えない（画面20・23） | PEDAGOGY 0.2・1.8、[Q48](https://mobbin.com/screens/43ae2042-624d-4cd4-805b-13c78b3138af)[Q56](https://mobbin.com/screens/f81f0d35-6c03-42b7-8388-230f90c38f4a) | 演繹 | 連続の圧で離れる人がいる | ①BIZ-UIREF K10 の連続で続けられた声 ②[Q49](https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3)[Q43](https://mobbin.com/screens/55459f0d-6d76-41bc-b1bf-697ad394c16a) の Finch・Cleo も streak を並べている（原寸） | 連続を見せること自体は報酬でない（K10 の別の解釈） | 減る | 負担減：反対2つ・別の解釈1つ＋PEDAGOGY が決定済み |

## 8. 簡略化の台帳

| # | 簡略化した所 | 簡略化しない場合の形 | 理由（学習効果・面白さ・正しさ・規約） |
|---|---|---|---|
| 1 | スワイプを左右の2択だけに使う | 科目の札をめくって払う多段のスワイプ | 学習効果：数十の科目をめくると偶然の正解が増える（MB2 捨てた案） |
| 2 | 片方を入れても反対側を自動で埋めない（学びの段） | Copilot [W13](https://mobbin.com/screens/1ae4ac51-0c47-4c59-804f-6ecce7cdaadf) の自動の合わせ | 学習効果：貸借を合わせる考えが消える。決まりにした型だけ自動 |
| 3 | 差を埋める「雑損」の札は現金過不足の月だけ | 常に出す（Xero の Minor adjustment [W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)） | 学習効果：誤りを隠す逃げ道になる |
| 4 | 進み・帳面に数や％を出さない | 「1/60」・％の輪 | 学習効果：PEDAGOGY 4.3（量の報酬） |
| 5 | 月報は最大4枚、変化の小さい札は出さない | 毎月の全部の札 | 面白さ：毎月同じだと飛ばされ、④返るが消える |
| 6 | 決算の振り返りの物語は年1回 | 毎月の物語 | 面白さ：毎月だと長い（MB1 X59 の悪い面） |
| 7 | 再開のあらすじは日をあけたときだけ | 毎回のあらすじ | 面白さ：毎回は待ち |
| 8 | はじまりは3画面まで | Brilliant 型の質問の連続 [Q77](https://mobbin.com/screens/6a699da6-fc16-4a7b-9176-b180a84e1e75) | 学習効果：最初の数分に学びがない（PEDAGOGY 0.1） |
| 9 | 聞き返しは台本の2択で、自由な会話の先生を作らない | AI の自由な会話（[Q16](https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af) の入力欄） | 正しさ：自由な答えでは会計・法令の正しさを保てない |
| 10 | 検定会場に舞台を出さない（仮。D5） | 店の絵の中で試験 | 学習効果：本番の形（CBT）に寄せる。オーナーの決定で変わる |
| 11 | 他人（実在の人）との順位を置かない | Bump・corner の順位 [W49](https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9) | 学習効果：PEDAGOGY 1.8・K10（量の報酬） |
| 12 | 祝いは「はじめて」だけ | 毎回の祝い | 学習効果：毎回は量の報酬（[W52](https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f) の悪い面） |
| 13 | 帳簿の画面と目標の画面に舞台（店の絵）を置かない（C4） | すべての画面を3層に | 面白さ・学習効果：数の読み取りが要る画面で絵が数を隠す（MB1 反対の事実1）。ただし作り手の負担が減る向きなので7章 #4 で反対の事実を2つ書いた |
| 14 | 時間の圧は検定会場の本番と、本人が選んだ練習だけ | 全画面に残り時間 | 学習効果：K10・PEDAGOGY 0.2 |

## 9. オーナーに決めてもらうこと

選択肢は並べただけ。推しは各問の下に分けて書いた（統合の担当の意見で、選択肢の重さを変えない）。

### D1 店の前（ホーム）に数を置くか（18章 問1 に選択肢を足す）
見せる事実：3人の素案はどれも数の帯を置かない側（5.1）。根拠の画面は「次の1つ」を数より上に置く（[W1](https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef)[X24](https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144)）。反対：ウマ娘は値を常に出す、[X30](https://mobbin.com/screens/a0fcfcb0-2e7a-40eb-8cbd-f0845067be4a)[X28](https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8) は数を多く並べる。いまの帯は 197.8px（画面の23.4%）、字を14px 以上にすると 240.9px（BIZ-UIREF 18章 問1）。

| 選択肢 | 選んだら作る物 | 悪い面 |
|---|---|---|
| (a) 帯をなくし、数は帳簿の場所へ。ホームは次の書類1枚と店の絵 | 画面2・14。ramen.css の帯を外す | 数を見張る手ごたえが薄れる。経営シムらしさが減る恐れ |
| (b) (a)＋1億への見込みの細い線1本 | (a)＋線の部品（画面15の上段の縮小） | 初めは線が平らで寂しい。線だけ見て判断しない恐れ |
| (c) 帯の数を残す（18章の (a)〜(c) から選ぶ） | 18章 問1 の通り | 遊ぶ所が縮む。次の1つが埋もれる |
| (d) T1 の試作で比べてから決める | (a)(b)(c) の3版 | 試作の量と時間 |

**推し**：(d)、試作は (b) と (c)。根拠：「次の1つを主役に」は3人と実例が一致するが、経営シムで数を見張る面白さを示す材料（ウマ娘）も同じ重さで、資料で決まらない。

### D2 仕訳の机の上端に「差の帯」を常に置くか
見せる事実：[W10](https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b)[W11](https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6)[W12](https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84) の「差の数→0で確定」。反対：差0でも科目違い（Xero は警告のまま確定できた：原寸）、義務感の恐れ。

| 選択肢 | 選んだら作る物 | 悪い面 |
|---|---|---|
| (a) 常に置く | 差の帯・確定の色・差に連動する確定の札 | 1行の仕訳では意味が薄い。義務感 |
| (b) 複合仕訳（3行以上）の書類だけ | (a) を条件つきで | 帯が出たり消えたりして約束が分かりにくい |
| (c) 置かない（いまの「合わないと横に揺れる」） | なし | 「何をすれば終わるか」が見えない |

**推し**：T2 で (a) と (c) を比べる。根拠：3系統の実例（会計の照合・家計の分割・予算の割り当て）が同じ型を持つが、どれも業務・家計で、遊ぶ人に効くかの材料がない。

### D3 ライバルを何で見せるか
見せる事実：MB1 は順位表を捨てて対戦の表（[X53](https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f)）、MB2 は町の順位（[W49](https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9)）。どちらも相手はゲームの中の店。オーナーの原文「周辺エリアの同業種競合が複数いるみたいな」。

| 選択肢 | 選んだら作る物 | 悪い面 |
|---|---|---|
| (a) 対戦の表（1店と左右） | 画面16の店の札から対戦の表 | 町の全体（複数の競合）が一度に見えない |
| (b) 町の順位（自店の行を浮かせる） | 順位の頁 | 量の競争に寄る（K10）。負けた理由（どの項目か）が見えない |
| (c) 両方（地図→順位→1店の対戦の表） | (a)＋(b) | 画面が増える |

**推し**：(c)。根拠：(a) は「なぜ負けたか」、(b) は「町の中のどこか」で、答える問いが違う。反対：順位は量の競争に寄るので、順位の数は売上でなく評判・客数など判断の結果にする。

### D4 帳簿を「別の場所（タブ）」にするか「店の画面に常に見える盤」にするか
見せる事実：素案は別の場所（画面14）。DESIGN-JOURNAL-UX 10章の大胆（T字の盤に札を直接入れる）は、盤が常に見える面白さ（Mini Metro の常時盤面）を持つ。

| 選択肢 | 選んだら作る物 | 悪い面 |
|---|---|---|
| (a) 別の場所（素案） | 画面14 | 記帳と帳簿が離れ、「どこに反映されたか」をタブを開いて見る |
| (b) 常に見える盤 | 店の画面の一部に日常語の盤（いまの miniBS を広げた形） | 舞台（店の絵）と盤が画面を取り合う。スマホで狭い |
| (c) DESIGN-JOURNAL-UX 10章の試遊の結果で決める | 試遊 | 決まるまで画面14の形が仮 |

**推し**：(c)。根拠：DESIGN-JOURNAL-UX がすでに同じ比べを試遊に置いている。

### D5 検定会場の見た目
見せる事実：MB3 は「業務的でよい（本番の形）」、根拠は [Q32](https://mobbin.com/screens/991bedee-4ad4-40cc-8827-526546050877)[Q33](https://mobbin.com/screens/57fcc0a4-5f6e-4253-ae06-fb09f14c11c6)[Q36](https://mobbin.com/screens/0fe586a8-ee63-46ee-984d-e65456fcf2d4)。反対：オーナーの「チープ」「UI デザインが終わってる」。

| 選択肢 | 選んだら作る物 | 悪い面 |
|---|---|---|
| (a) 本番（CBT）の形に寄せ、舞台なし | 画面22 | 簡素でチープに見える恐れ |
| (b) 店の世界の絵の中の会場（建物・試験官） | 会場の絵と人物 | 本番の画面との差で本番に迷う恐れ |
| (c) 入口と結果だけ世界の絵、解く画面は本番の形 | 入口・結果の絵 | 作る物が両方要る |

**推し**：(c)。根拠：解く画面を本番に寄せる理由（学習効果）と、チープさの不満の両方に応える。反対：入口と結果の絵は試験そのものの見た目を変えない。

**BIZ-UIREF 18章の5問はそのまま残る**（問2 動き・問3 強さ・問4 町の形・問5 チープさの主役）。素案は問1・問4・問5 で答えを先取りしている（5.1）。

## 10. 依頼の対応表

| 依頼の原文（一文ごと） | どこでどう応えたか |
|---|---|
| 「今やっていることに合わせてProgress indicator や Dashboardとかも含め」 | 1か月の1周と3段の目標（1.2・1.3）、目標と1年の道（画面15）、帳簿＝店のダッシュボード（画面14）、月の扉の済んだ札（画面3）、受け箱の「あと3枚」（画面2）。数の見せ方（4.1） |
| 「本ゲームのコンセプトに合うデザインUi/UXをmobbinで探索・引用してきて。」 | 3人と第1回の実例 147 番号を番号と mobbin_url で引用（付録A）。この担当は新しく探していない（依頼の決まり）。各画面に「根拠」と「悪い面と反対の事実」 |
| 「抜本的にデザインとユーザ体験を見直すことを想定している。」 | 4つの場所と3層（1.1）、23画面の画面体系（2章）。帯をなくす・問題を別の頁にしない・反映を舞台と帳簿で見せる、などいまの作りと違う形（5章でぶつかりを明示） |
| 「「いまつくっているものに取り込むならどうか」ではなく「本来あるべきデザインとしてどうか」という視点で。」 | いまの画面の小直しは書いていない。いまの設計とのぶつかりは5章に分けて書いた。ぶつかる所で素案を縮めていない（帯・棚の小さな絵） |
| 「research-fetchの記録には残せよ。テキストだけ見てもわからんだろ」 | 引いた全画面は3人と第1回が research-fetch で取得済み（付録B で取得記録とノートの有無を数えた）。この担当は147番号のノートを全部開き、要の32枚は原寸を開いた。記録は `docs/analysis/uiref-ideal-cites.tsv` |
| 最初の依頼「簿記２級アプリのUI・UXデザインがマジで終わってるんだけど、本コンセプトに適うUI/UXデザインとしてリファレンスできるもの相当な深度まで勉強・分析・考察してくまなく探してきて。」 | 統合の段では、食い違いの13件（3章）、論証の表14行（7章）、原寸で見つけた食い違い4件（付録A）。「くまなく探す」の新しい検索はしていない（11章） |
| 過去の原文「アニメーション要素無さすぎて紙芝居になっててしんどい」 | 画面4（送りボタンでなく書類を受け取る操作で進む）、Kit の紙芝居の形を反対の例に（[Q11](https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9) 原寸）、動きの段（4.4） |
| 過去の原文「問題文がわかりづらい。なにを聞かれてるのか」 | 画面4・5（相手の1文→指示1行→穴のある1文）、T6 |
| 過去の原文「自分が左右選んだ科目が帳簿のどこに反映されてるかわからない。」 | 画面8（反映の小札）・画面14（帳簿、流れの図）、C9、T2 の問い |
| 過去の原文「一つ取り消す、というか自分が選んだ特定の科目のみを修正する仕様にしたい。」 | 画面5（置いた札を押すと「左へ／右へ／棚へ戻す」、取り消しの帯 [W45](https://mobbin.com/screens/d5187615-adaf-4a7d-ba16-c75ac4799634)） |
| 過去の原文「ドラッグ、スマホならswipeで科目を入れていくスタイルの方がUXは良いのでは？」 | C12、7章 #8（反対の事実3つ）、T2 の入力ごとの測り |
| 過去の原文「選択肢、文字や背景にもアニメーションや動的表現を設けないとドパガキには耐えられないと思うけどどう思う？」 | 4.4 動きの段、7章 #10、T8。強さ3段（画面23） |
| 過去の原文「正直いまの我々のグラフィックデザインはチープすぎるので。」 | 3層の舞台（1.1）、5.1 問5、D5 |
| 過去の原文「Coffeeinc2をしっかりとパクっていきたい。徹底的に。」 | 画面16・17、7章 #11（Coffee Inc 2 そのものは Mobbin になく再現の根拠にならない）、D3 |
| 依頼文（取りまとめ役）の章 0〜11 | 0〜11章と付録A・B |
| 依頼文の受け入れの基準（又引き禁止・20枚以上の原寸・cites.tsv・count.py・検査） | 付録A（ノート147番号・原寸32枚）、付録B（数の出力）、検査の出力は返事に |

## 11. やっていないこと

- **新しく Mobbin を探していない**（依頼の決まり）。足りない所：人物（客・業者）に「出来事あり」の印を付けた店の画面（M1 の「！」は原寸になかった）、Coffee Inc 2 に近い地図、PC の仕訳の机（キーボードでの科目選び）、文の途中に穴のある問い、ドラッグで箱へ分類する画面（問いの言い換え）、ゲームの物語の分岐の画面
- **原寸を開いたのは要の32枚だけ**。残りの115番号はノートの image_seen と突き合わせただけで、画像は開いていない。ノートの誤り（M1 のような）は、開いていない画面にも残っている恐れがある
- 3人と第1回の主張のうち、**素案で頼る所だけ**をノートと突き合わせた。3人の台帳の全行（MB1 63行・MB2 48行・MB3 81行）の全部の主張は確かめていない
- 第1回の流れの画面（M4・M5・M16〜M19）は、ノートに流れの id が書かれておらず画面を特定できなかったので引いていない（M16 のふりかえり・M18 の店の中の光は、本文で番号を挙げるだけにした）
- 動きは1つも見ていない（Mobbin の MCP は静止画）。4.4 の長さはすべて DESIGN-JOURNAL-UX と BIZ-UIREF の値の借用【推論】
- 絵・試作・画面の図は作っていない。素案は言葉だけ。中高生に見せていない
- PC の画面の割り付けは書いていない（スマホの縦長で書いた）。2年目以降（工場・子会社）の画面（P6〜P8 の操作の盤）は書いていない
- 書いた本人以外の判定・論証の検査を受けていない
- BIZ-UIREF・DESIGN-JOURNAL-UX・3人の文書は変えていない。M1 のノートの誤り・MB3 の Q21・Q78 の言い過ぎ・MB1 の X34 の数の読み違い・MB2 の W18 の [1] の画面違いは、それぞれの文書を直していない（取りまとめ役に返す）
- 7章 #13 は反対の事実・別の解釈が1つずつで、決まりの「2つ以上」に足りない（決めずに D5 に返した）

## 付録A 根拠の実例の台帳（引いた画面と確かめ）

全番号でノートの image_seen を開いた。「原寸」は原寸の画像を開いた印。合わなかった物は備考に書いた。詳しい列は `docs/analysis/uiref-ideal-cites.tsv`。

| 番号 | 担当 | アプリ | mobbin_url（主の画面） | ほかに開いたノート | 原寸 | image_seen と合うか | 備考 |
|---|---|---|---|---|---|---|---|
| X2 | MB1 | Rocket Money | https://mobbin.com/screens/4dd0e004-24b3-4efa-8e10-2af3b11251b9 | 0 | — | 合う |  |
| X4 | MB1 | Copilot | https://mobbin.com/screens/05906c98-edab-4f98-91a9-bbed376ff424 | 0 | — | 合う |  |
| X5 | MB1 | Wealthfront | https://mobbin.com/screens/8e5cbd25-73a0-4d79-8c6b-567c425d6f67 | 0 | 開いた | 合う |  |
| X6 | MB1 | Acorns | https://mobbin.com/screens/942b1d25-40c3-42c4-a925-404558f375c9 | 1 | — | 合う |  |
| X7 | MB1 | ANZ Plus | https://mobbin.com/screens/ca6407b9-5665-4509-9948-8830b3a0ca61 | 0 | — | 合う |  |
| X8 | MB1 | Strava | https://mobbin.com/screens/3a8f7f18-90d9-43e3-96c9-57cde11ac64a | 0 | — | 合う |  |
| X10 | MB1 | Ahead | https://mobbin.com/screens/27c3c80c-782b-4f61-b8ff-24e614e39632 | 0 | 開いた | 合う |  |
| X12 | MB1 | Crypto.com | https://mobbin.com/screens/07440204-140d-43b0-822b-1dfb63ebf89b | 0 | 開いた | 合う |  |
| X13 | MB1 | Finch | https://mobbin.com/screens/7279bc2a-9d5f-4c4d-afbe-1e123cba3f01 | 0 | — | 合う |  |
| X14 | MB1 | Duolingo | https://mobbin.com/screens/9f9ad31c-ec4e-4a7c-98a0-764d40835315 | 0 | — | 合う |  |
| X15 | MB1 | Tolan | https://mobbin.com/screens/d2547f6d-14a5-4c78-ae50-e9be602c4622 | 0 | — | 合う |  |
| X16 | MB1 | Ten Percent Happier | https://mobbin.com/screens/da51f189-852c-47b1-a096-bcdc16583b5c | 0 | — | 合う |  |
| X17 | MB1 | Quizlet | https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f | 0 | — | 合う | MB3 の Q44 と同じ画面。MB1 は数の出し方を書かず、MB3 は数を出さないと書く（3章 C6） |
| X19 | MB1 | Oura | https://mobbin.com/screens/bfe532d9-62fe-4246-9775-9c8934195bcb | 0 | 開いた | 合う |  |
| X20 | MB1 | Opal | https://mobbin.com/screens/3f912d2e-2bc2-400b-aba4-88b02852a4c8 | 0 | — | 合う |  |
| X21 | MB1 | Visible | https://mobbin.com/screens/3f60710a-3d4e-4892-a146-05dc3a432fc9 | 0 | — | 合う |  |
| X23 | MB1 | Monarch | https://mobbin.com/screens/1744bee6-a59f-4c52-b60e-7362fbe6fe8b | 0 | — | 合う |  |
| X24 | MB1 | Shopify | https://mobbin.com/screens/2063df51-e95a-4a2d-a384-792cc2053144 | 1 | 開いた | 合う |  |
| X28 | MB1 | QuickBooks | https://mobbin.com/screens/a1576a19-53f6-498d-80a7-02ece64072d8 | 0 | 開いた | 合う |  |
| X30 | MB1 | Copilot | https://mobbin.com/screens/a0fcfcb0-2e7a-40eb-8cbd-f0845067be4a | 0 | — | 合う |  |
| X31 | MB1 | Cleo | https://mobbin.com/screens/a252fcfd-1c89-43d2-a090-7c70d5af3c5c | 1 | — | 合う | MB2 の W27（a822a300）とほぼ同じ画面 |
| X32 | MB1 | Cleo AI | https://mobbin.com/screens/207509eb-1252-49bc-bff4-4524dfc83da3 | 0 | — | 合う |  |
| X33 | MB1 | Monarch | https://mobbin.com/screens/b00a6ecc-5e8e-4d63-968e-279012067c1c | 0 | — | 合う |  |
| X34 | MB1 | YNAB | https://mobbin.com/screens/4d946d9e-a904-426c-b36c-0b1782ab3938 | 1 | 開いた | 一部合わない | 原寸では 09/25 の純資産の点は表の値 -$767.31（MB1・ノートは「-$720 から」）。形（資産と負債の棒の上を純資産の線）は合う |
| X36 | MB1 | Mercury | https://mobbin.com/screens/86d1b223-4450-4f3e-ac66-72a05f9a8ea3 | 0 | 開いた | 合う |  |
| X38 | MB1 | Revolut | https://mobbin.com/screens/61123e7a-f3d3-49a7-8f35-f0ee80c5dcf0 | 0 | — | 合う |  |
| X41 | MB1 | Xero | https://mobbin.com/screens/0303c0ec-446a-4f27-b2fa-c82f58d98a4e | 0 | — | 合う |  |
| X43 | MB1 | Copilot | https://mobbin.com/screens/088f1e0a-1d5c-4daa-a0ac-519460f16512 | 0 | — | 合う |  |
| X47 | MB1 | Lloyds | https://mobbin.com/screens/c792115c-8ac3-4bfd-bab8-ea72deb09752 | 0 | — | 合う |  |
| X50 | MB1 | Strava | https://mobbin.com/screens/8d71697d-b15c-4ebe-8f31-cc348fd9f115 | 0 | — | 合う |  |
| X53 | MB1 | FotMob | https://mobbin.com/screens/dc306981-a03f-4e3e-8526-7943a724039f | 0 | 開いた | 合う |  |
| X54 | MB1 | Commons | https://mobbin.com/screens/98dbc571-d930-44fa-9860-3b79dbc8ef9b | 0 | — | 合う |  |
| X56 | MB1 | GoHenry | https://mobbin.com/screens/e1ca6ae4-c7fd-4df4-9fc2-843b65ff21ef | 0 | — | 合う |  |
| X57 | MB1 | Wise | https://mobbin.com/screens/1aecb208-2c41-4dd5-bcbc-cded84156138 | 0 | — | 合う |  |
| X58 | MB1 | Copilot | https://mobbin.com/screens/f2b45e8e-da23-49a7-9832-19e84ec7f9db | 4 | 開いた | 合う |  |
| X59 | MB1 | Strava | https://mobbin.com/screens/d6f73070-f70c-4fdd-81b2-dfe31a1bba15 | 3 | — | 合う |  |
| X60 | MB1 | Opal | https://mobbin.com/screens/ea59c327-1787-47dc-b850-15708c5e337d | 0 | — | 合う |  |
| X61 | MB1 | Commons | https://mobbin.com/screens/6d4fe16b-2d05-459c-8ea9-eb452c0c819a | 0 | — | 合う |  |
| X62 | MB1 | Turo | https://mobbin.com/screens/d635a1c2-0eb9-49f9-9e2e-81f3871d1439 | 0 | — | 合う |  |
| X63 | MB1 | Shopify | https://mobbin.com/screens/b1bd4556-d2f2-4e50-91d4-eea279f21206 | 0 | — | 合う |  |
| W1 | MB2 | Copilot | https://mobbin.com/screens/8d99b66f-6b36-4994-bce1-49e51c06c9ef | 2 | 開いた | 合う |  |
| W2 | MB2 | Monarch | https://mobbin.com/screens/457e2184-a004-40e9-b75b-77afc37d42d3 | 0 | 開いた | 合う |  |
| W3 | MB2 | YNAB | https://mobbin.com/screens/325fffea-71f9-4c44-8109-c1476771616f | 0 | — | 合う |  |
| W6 | MB2 | Cleo | https://mobbin.com/screens/35656b22-a704-4b52-8cd0-9ae4c8addf3d | 1 | 開いた | 合う | 原寸では見出しの下に「Tap to add or remove your categories」：押して箱を移す（ドラッグでない）ことを画面の文で確かめた |
| W7 | MB2 | Buddy | https://mobbin.com/screens/05f44de1-5a20-4bc4-b849-746680f91834 | 0 | — | 合う |  |
| W8 | MB2 | Copilot | https://mobbin.com/screens/f1778c3a-ee4e-4bd7-960b-52db273f15d2 | 0 | — | 合う |  |
| W9 | MB2 | Cleo AI | https://mobbin.com/screens/a6d10794-203e-4693-ad2c-96e8ce54254b | 0 | — | 合う |  |
| W10 | MB2 | Xero | https://mobbin.com/screens/85cdec88-2dba-400d-aa56-172760982a9b | 3 | 開いた | 合う | 原寸で「Your adjustment is more than 1.00」の赤字のまま「Totals match」と Reconcile が押せる＝差を雑損で埋める逃げ道（F4）を確かめた |
| W11 | MB2 | Monarch | https://mobbin.com/screens/00af44d3-cfd0-4cb1-8b0f-26cf2eda8ee6 | 1 | — | 合う |  |
| W12 | MB2 | Quicken | https://mobbin.com/screens/3b699b56-4cce-4ad6-8c7e-89ef58dbbe84 | 0 | 開いた | 合う |  |
| W13 | MB2 | Copilot | https://mobbin.com/screens/1ae4ac51-0c47-4c59-804f-6ecce7cdaadf | 0 | — | 合う |  |
| W15 | MB2 | Monarch | https://mobbin.com/screens/bd4785a8-2499-4f95-9ea5-4ff6ab39964c | 0 | — | 合う |  |
| W16 | MB2 | Mercury | https://mobbin.com/screens/b5b9a184-bd88-48e7-ba5a-f3f151278cc2 | 0 | — | 合う |  |
| W17 | MB2 | Cleo | https://mobbin.com/screens/2b734396-0b39-4d58-b282-9977d45f623a | 2 | — | 合う |  |
| W18 | MB2 | Google Photos | https://mobbin.com/screens/812ba62d-7097-4c6b-8be1-65b961a201a9 | 2 | 開いた | 合う | MB2 の台帳の [1] の画面（335005bc）は Google One の容量の画面で、スワイプの画面ではない。スワイプの根拠は 812ba62d・fe08f11d・5774ee10 で引く |
| W19 | MB2 | Quizlet | https://mobbin.com/screens/5dacac8f-b958-417c-bae8-e70c4ac3273f | 1 | 開いた | 合う |  |
| W20 | MB2 | mymind | https://mobbin.com/screens/22fa4170-49a0-45b8-bde3-474c27e4492e | 0 | — | 合う |  |
| W23 | MB2 | SiriusXM | https://mobbin.com/screens/a29d4250-9d1a-4d95-bb99-6c5f6cb28178 | 0 | — | 合う |  |
| W26 | MB2 | Apple Wallet | https://mobbin.com/screens/25fc692d-19a1-4de4-a63f-b0a6ecca0bd6 | 0 | — | 合う |  |
| W27 | MB2 | Cleo | https://mobbin.com/screens/a822a300-6318-4db7-8e54-a4a42ab91626 | 0 | 開いた | 合う |  |
| W28 | MB2 | Mercury | https://mobbin.com/screens/10e9460a-1e44-4361-afe6-e0e9d857e6d9 | 0 | 開いた | 合う |  |
| W29 | MB2 | Expensify | https://mobbin.com/screens/f5b4a2cc-77d8-4a1c-82db-32dbc9b38374 | 0 | — | 合う |  |
| W30 | MB2 | Airwallex | https://mobbin.com/screens/29b835da-3f61-49a1-b3a6-448b5e23d949 | 0 | — | 合う |  |
| W31 | MB2 | Redfin | https://mobbin.com/screens/af24a9b8-c6eb-4097-ac80-c2f1f2ded4e3 | 0 | — | 合う |  |
| W32 | MB2 | Monzo | https://mobbin.com/screens/a196ebe3-0c04-4b4e-8241-201b961696a7 | 0 | — | 合う |  |
| W33 | MB2 | Shopee | https://mobbin.com/screens/75324601-2929-4219-a6fe-3110888e9aeb | 0 | — | 合う |  |
| W34 | MB2 | Monzo | https://mobbin.com/screens/dee30ae9-d5ee-4948-9cfe-7e68c6e4dc07 | 0 | — | 合う |  |
| W36 | MB2 | Brilliant | https://mobbin.com/screens/7df5c89a-cc35-4e23-9aa6-c26cac73678c | 0 | — | 合う |  |
| W37 | MB2 | Formula 1 | https://mobbin.com/screens/a8c724bd-26fe-4105-a82c-5ebb7fcbcd3a | 0 | — | 合う |  |
| W38 | MB2 | Wonder | https://mobbin.com/screens/d58fe905-4961-4f07-a6f5-279a7da50e59 | 0 | — | 合う |  |
| W39 | MB2 | Chipotle | https://mobbin.com/screens/0d630f70-79ce-485f-a335-ee62fb74d30c | 0 | — | 合う |  |
| W40 | MB2 | Shopify | https://mobbin.com/screens/5528f405-0e95-4df2-90ff-6457bbf9ce15 | 0 | — | 合う |  |
| W41 | MB2 | Shopify | https://mobbin.com/screens/78129b1d-65a8-4e90-907f-b112f819f4f6 | 0 | — | 合う |  |
| W42 | MB2 | Xero | https://mobbin.com/screens/e838b7af-a035-4d7d-944f-5e02a52ce379 | 0 | — | 合う |  |
| W43 | MB2 | Google Arts & Culture | https://mobbin.com/screens/5b3c4dd9-00f8-4ca7-847a-2a8f4b6857e1 | 0 | — | 合う |  |
| W44 | MB2 | Revolut Business | https://mobbin.com/screens/9a34e3c2-65fa-49e0-9a6f-5833c749d333 | 0 | — | 合う |  |
| W45 | MB2 | Gmail | https://mobbin.com/screens/d5187615-adaf-4a7d-ba16-c75ac4799634 | 0 | — | 合う |  |
| W46 | MB2 | TheFork | https://mobbin.com/screens/6869f280-374f-4d61-a7a1-791fe0ea3ab4 | 0 | 開いた | 合う | 原寸でもピンの重なり（9.2・8.5・7.5・8.9 が重なって数が隠れる）を確かめた |
| W47 | MB2 | Apple Maps | https://mobbin.com/screens/ef125d25-1074-43b1-aa75-d643acc4ffc1 | 0 | — | 合う |  |
| W48 | MB2 | DoorDash | https://mobbin.com/screens/ff560597-4452-4581-9ae3-557360a35206 | 0 | — | 合う |  |
| W49 | MB2 | Bump | https://mobbin.com/screens/88393975-8ac9-4b99-bae5-c12a943287b9 | 1 | — | 合う |  |
| W50 | MB2 | Philips Hue | https://mobbin.com/screens/8461968f-48e3-4870-980c-3c140c07fcdb | 1 | 開いた | 合う |  |
| W51 | MB2 | Finch | https://mobbin.com/screens/7966062b-2480-48b7-abce-d868ca9eb345 | 0 | — | 合う |  |
| W52 | MB2 | Cash App | https://mobbin.com/screens/d92c0617-9f5c-4a0e-9b13-03084bf3157f | 0 | — | 合う |  |
| Q1 | MB3 | Finch | https://mobbin.com/screens/fe8eae1b-d8af-4db5-951c-17e92c497001 | 0 | — | 合う |  |
| Q2 | MB3 | Finch | https://mobbin.com/screens/0b3973cb-4909-47e5-a90f-aa289957b6d4 | 0 | — | 合う |  |
| Q3 | MB3 | Finch | https://mobbin.com/screens/6ccd84e3-79f7-4157-993e-695ecb11bcd6 | 0 | — | 合う |  |
| Q5 | MB3 | Yazio | https://mobbin.com/screens/528d7ee1-600a-4132-a9a4-ee364eb20b76 | 0 | — | 合う |  |
| Q7 | MB3 | Duolingo | https://mobbin.com/screens/b8a54efb-c06d-4818-b56e-968b2309c88b | 0 | — | 合う |  |
| Q8 | MB3 | Ahead | https://mobbin.com/screens/2014db16-b3ab-4acc-b20d-728932085c53 | 0 | — | 合う |  |
| Q11 | MB3 | Kit | https://mobbin.com/screens/efb78fab-2427-4aef-be68-001c7cc840f9 | 1 | 開いた | 合う |  |
| Q13 | MB3 | Tolan | https://mobbin.com/screens/f1474ff0-3e47-4d6b-b9b6-b945415c183e | 0 | — | 合う |  |
| Q14 | MB3 | Babbel | https://mobbin.com/screens/bb06ea68-f1a1-462c-8993-84377b580bc9 | 0 | — | 合う |  |
| Q15 | MB3 | Duolingo ABC | https://mobbin.com/screens/5b2d14ea-25ef-4408-8820-75587e339cfa | 0 | — | 合う |  |
| Q16 | MB3 | Brilliant | https://mobbin.com/screens/68de0a71-6e02-41a6-880e-ddba41c466af | 0 | 開いた | 合う |  |
| Q17 | MB3 | Duolingo | https://mobbin.com/screens/81b520ac-e864-4e64-bc18-f16caca3b124 | 0 | — | 合う |  |
| Q18 | MB3 | Duolingo | https://mobbin.com/screens/26c5c998-56b0-410b-9f81-326fdb66dcaa | 0 | — | 合う |  |
| Q19 | MB3 | Nibble | https://mobbin.com/screens/93499943-b5af-4860-a9b2-23740d190ccd | 0 | — | 合う |  |
| Q20 | MB3 | Turo | https://mobbin.com/screens/b43fc9b9-96af-4191-a5eb-71759ae1fd18 | 0 | — | 合う |  |
| Q21 | MB3 | Acorns | https://mobbin.com/screens/4da72f80-d8cf-4225-87ff-ee497dc03e15 | 0 | 開いた | 一部合わない | 原寸では選んだ札「mutual funds」は文「…holds assets called」の後ろ（文末の穴）に置かれ、文の途中には入っていない。「穴のある1文」の型としては使えるが、MB3 の「文の途中に埋まる」は言い過ぎ |
| Q23 | MB3 | Mimo | https://mobbin.com/screens/c63bc528-b64d-461a-82bd-b13140589cfe | 0 | — | 合う |  |
| Q24 | MB3 | Mimo | https://mobbin.com/screens/433fb29c-cb3b-41af-9508-e8562b34b88b | 0 | 開いた | 合う | 原寸では結果は Browser のタブを開いた状態で見えている（MB3 の悪い面「タブで切り替えると結果が裏に隠れる」の通り） |
| Q25 | MB3 | Mimo | https://mobbin.com/screens/2d8d62b7-fabc-4909-96f9-7b09efa22106 | 0 | — | 合う |  |
| Q28 | MB3 | Brilliant | https://mobbin.com/screens/7b63d513-c0f3-4f43-860f-d6a2b3d60722 | 0 | — | 合う |  |
| Q29 | MB3 | Nibble | https://mobbin.com/screens/7f33ea08-dfc8-4ce6-b877-a29486f38865 | 0 | — | 合う |  |
| Q30 | MB3 | Deepstash | https://mobbin.com/screens/dd9df113-cd8d-47e4-a0ef-11a38f224671 | 0 | — | 合う |  |
| Q31 | MB3 | Forest | https://mobbin.com/screens/9c79865b-4525-45ad-a89c-f4de4128fa27 | 0 | — | 合う |  |
| Q32 | MB3 | Expensify | https://mobbin.com/screens/991bedee-4ad4-40cc-8827-526546050877 | 0 | — | 合う |  |
| Q33 | MB3 | Apple News | https://mobbin.com/screens/57fcc0a4-5f6e-4253-ae06-fb09f14c11c6 | 0 | 開いた | 合う |  |
| Q34 | MB3 | Duolingo | https://mobbin.com/screens/faf99c88-e9a5-44ef-8e7d-3335018c4781 | 0 | — | 合う |  |
| Q36 | MB3 | Unity | https://mobbin.com/screens/0fe586a8-ee63-46ee-984d-e65456fcf2d4 | 0 | — | 合う |  |
| Q37 | MB3 | Quizlet | https://mobbin.com/screens/ed1ddb57-4ef7-47a5-a9f5-60aafbbf2014 | 0 | — | 合う |  |
| Q38 | MB3 | Babbel | https://mobbin.com/screens/00c43458-c5b4-4e0f-9223-f5a933ccc59e | 0 | — | 合う |  |
| Q39 | MB3 | Khan Academy | https://mobbin.com/screens/27314584-b77a-4ad4-bda9-b6b6f6d149eb | 0 | — | 合う |  |
| Q43 | MB3 | Cleo | https://mobbin.com/screens/55459f0d-6d76-41bc-b1bf-697ad394c16a | 0 | 開いた | 合う |  |
| Q44 | MB3 | Quizlet | https://mobbin.com/screens/f5c83f4d-eded-4850-ac6a-9675f4b1141f | 0 | — | 合う | MB1 の X17 と同じ画面 |
| Q47 | MB3 | Fable | https://mobbin.com/screens/97fe8772-ff56-42b9-b86c-830e103fc441 | 0 | — | 合う |  |
| Q48 | MB3 | CapWords | https://mobbin.com/screens/43ae2042-624d-4cd4-805b-13c78b3138af | 0 | — | 合う |  |
| Q49 | MB3 | Finch | https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3 | 0 | 開いた | 合う | 原寸の上端に薄く「9 day streak / Longest self-care streak ever!」：帳面の画面にも連続の札が重なっている（MB3 論証の表の反対③と合う） |
| Q50 | MB3 | Swarm | https://mobbin.com/screens/e3bb25f0-8176-452c-8c3f-c0216a27c1af | 0 | — | 合う |  |
| Q52 | MB3 | Moonlitt | https://mobbin.com/screens/58646e99-5a30-4d88-ad38-c2f97e6c2945 | 0 | — | 合う |  |
| Q54 | MB3 | How We Feel | https://mobbin.com/screens/625b38aa-a4bf-42fe-bbc3-335565a2aa82 | 0 | — | 合う |  |
| Q56 | MB3 | Mindvalley | https://mobbin.com/screens/f81f0d35-6c03-42b7-8388-230f90c38f4a | 0 | — | 合う |  |
| Q57 | MB3 | Obsidian | https://mobbin.com/screens/e7c6977d-1963-412c-8ade-bf6b9aeeecd3 | 0 | — | 合う |  |
| Q58 | MB3 | Noom | https://mobbin.com/screens/3ef3dce1-8f8e-416b-b8c2-5d52d177fe26 | 0 | — | 合う |  |
| Q59 | MB3 | Ahead | https://mobbin.com/screens/1ae37391-2ea3-4ad8-89dc-e146f731fce7 | 0 | — | 合う |  |
| Q63 | MB3 | Finch | https://mobbin.com/screens/7aa235cf-4192-42df-859e-fd0447bb71fe | 0 | — | 合う |  |
| Q64 | MB3 | Brink | https://mobbin.com/screens/442d1c66-914c-4e8b-b0fa-eb9d6620a5c6 | 0 | — | 合う |  |
| Q67 | MB3 | Life Reset | https://mobbin.com/screens/d6179aa1-b903-40a7-b547-ca01fc2943c5 | 0 | — | 合う |  |
| Q68 | MB3 | Breathwrk | https://mobbin.com/screens/9ca8e991-56ec-415c-a983-2f96c0f035a4 | 0 | — | 合う |  |
| Q69 | MB3 | Quizlet | https://mobbin.com/screens/b26c98e9-f78d-4892-8984-041091d7dfee | 0 | — | 合う |  |
| Q70 | MB3 | Eventbrite | https://mobbin.com/screens/d1cca038-4e34-4ac9-a510-52d398c427e2 | 0 | — | 合う |  |
| Q74 | MB3 | Notion | https://mobbin.com/screens/5b76071b-1098-461d-b8e4-223c41bd02b2 | 0 | — | 合う |  |
| Q77 | MB3 | Brilliant | https://mobbin.com/screens/6a699da6-fc16-4a7b-9176-b180a84e1e75 | 1 | — | 合う |  |
| Q78 | MB3 | Brilliant | https://mobbin.com/screens/168b1c76-7485-45fd-9b09-f762cc336907 | 4 | 開いた | 一部合わない | 原寸の文は「You exercised an important coding skill: using the right commands in the right order.」の後に「In this course, you'll learn to use loops, logic, and variables」。やったことには「正しい命令を正しい順で」と言い直すだけで、loops などは**これから学ぶ物の名前の予告**。MB3 の「やり終えた後で名前（loops・logic）を付ける」は言い過ぎ。「操作が先、言葉が後」の順は合う |
| Q79 | MB3 | Headspace | https://mobbin.com/screens/50164305-7985-4568-8936-c78d9c480cd2 | 2 | 開いた | 合う |  |
| Q80 | MB3 | Speak | https://mobbin.com/screens/16fe98e3-36c3-483b-af28-2b8456faeb2e | 2 | 開いた | 合う |  |
| Q81 | MB3 | Splitwise | https://mobbin.com/screens/7499140f-c314-49f3-873a-f390c11148a7 | 0 | — | 合う |  |
| Q83 | MB3 | Nibble | https://mobbin.com/screens/573f7362-933a-4241-8c35-bb8451146864 | 0 | — | 合う |  |
| M1 | 第1回 | Duolingo | https://mobbin.com/screens/fbbbcbd0-e31f-414d-8847-a7a8037e34f0 | 0 | 開いた | 合わない | 第1回とノートは「客（橙の服）の頭に白い吹き出しの「！」」と書くが、原寸のこの画面に「！」の吹き出しはない（橙の服の客は席に座り、口ひげの客が立つだけ）。店を真上から見た部屋・数の帯がない、は合う。「出来事のある客に「！」」の根拠には使わない |
| M2 | 第1回 | Duolingo | https://mobbin.com/screens/84d6004b-67bb-4679-a6c1-d757e5ffb668 | 0 | — | 合う |  |
| M7 | 第1回 | Forest | https://mobbin.com/screens/469aaab7-e1db-425f-910e-f6177854e699 | 0 | — | 合う |  |
| M8 | 第1回 | Premier League | https://mobbin.com/screens/6e9ad774-96bb-4ef4-b48c-92dac0bd4712 | 0 | — | 合う |  |
| M11 | 第1回 | CHOPT | https://mobbin.com/screens/d2af9ba5-6394-44ed-8053-178bd8953fd8 | 0 | — | 合う |  |
| M12 | 第1回 | Duolingo ほか | https://mobbin.com/screens/5966689f-bae2-476e-8afd-57402080775b | 1 | — | 合う | 第1回のノートは4つのアプリの画面をまとめて1つの文で書いている（画面ごとの image_seen ではない） |
| M13 | 第1回 | Spotify ほか | https://mobbin.com/screens/02228791-9019-41a0-92bc-8f00ce5ba1b5 | 0 | — | 合う | M12 と同じく、4画面をまとめた文のノート |
| M14 | 第1回 | Cleo | https://mobbin.com/screens/3c9e2d5d-1521-4aec-a6ac-46d21d511ed8 | 0 | — | 合う |  |

## 付録B 数の出力

`python3 -I boki2/docs/analysis/uiref-ideal-count.py` の出力：

```
== 章ごとの行数 ==
  10  （頭書き）
  11  0. 要点
  46  1. 体験の芯：1か月の遊びの1周と3段の目標
 269  2. 画面の一覧と各画面の設計
  20  3. 3人の素案の食い違い
  35  4. 見た目と情報の決まり
  27  5. いまの設計とのぶつかり（DESIGN-JOURNAL-UX と BIZ-UIREF 18章）
  29  6. 試作で確かめること
  21  7. 論証の表（QUALITY 5.1）
  19  8. 簡略化の台帳
  62  9. オーナーに決めてもらうこと
  21  10. 依頼の対応表
  13  11. やっていないこと
 154  付録A 根拠の実例の台帳（引いた画面と確かめ）
  44  付録B 数の出力
全体: 781 行
要点の行（空行を除く）: 8
画面の数（2章の見出し）: 23  番号: 1〜23
一覧の表の行: 23
本文（付録Aより前）のリンクの数: 425  番号の種類: 147
引いた番号（担当ごと）: {'MB2': 44, 'MB1': 40, 'MB3': 55, '第1回': 8}  計 147
1つの番号に2つ以上の id のリンク: なし
台帳の行に同じ id がない（流れの画面はノートの流れの id で確かめた）: なし
cites.tsv の行（画面）: 183  番号の種類: 147
ノートがない: 0  原寸がない: 0  取得記録（200）がない: 0  image_seen が60字未満: 0
ノートを開いた（はい）: 183  画像を開いた（はい）: 32
原寸を開いた番号: 32 件 ['M1', 'Q11', 'Q16', 'Q21', 'Q24', 'Q33', 'Q43', 'Q49', 'Q78', 'Q79', 'Q80', 'W1', 'W2', 'W6', 'W10', 'W12', 'W18', 'W19', 'W27', 'W28', 'W46', 'W50', 'X5', 'X10', 'X12', 'X19', 'X24', 'X28', 'X34', 'X36', 'X53', 'X58']
番号ごとの判定: {'合う': 143, '一部合わない': 3, '合わない': 1}
合わない・一部合わない: [('X34', '一部合わない'), ('Q21', '一部合わない'), ('Q78', '一部合わない'), ('M1', '合わない')]
本文の番号で cites.tsv にない: なし  cites.tsv にあって本文にない: なし
同じ画面が2つの番号で引かれている: [['X17', 'Q44']]
食い違いの行（3章）: 13
論証の表の行（7章）: 14
簡略化の台帳の行（8章）: 14
オーナーに決めてもらう問い（9章の ### D）: 5
試作で比べる物（6.1 の T）: 8
```
