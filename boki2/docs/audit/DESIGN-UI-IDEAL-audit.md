# 事実の判定：DESIGN-UI-IDEAL 版0.1（本来あるべき UI・UX の素案）

2026-11-02。判定役（統合の書き手・MB1〜MB3・取りまとめ役とは別の担当。事実の判定だけで、論証の妥当さは別の担当）。決まりは `docs/QUALITY.md` の全章（3章・4.5・6.3・7章）。
対象：`docs/DESIGN-UI-IDEAL.md`（781行）。元：`docs/analysis/uiref-mobbin-MB1.md`・`MB2.md`・`MB3.md`・`uiref-mobbin.md`、確かめの記録 `docs/analysis/uiref-ideal-cites.tsv`（183行）。
外部への通信はしていない。素案・3人の文書・ノート・cites.tsv・count.py は変えていない。commit・push はしていない。

道具（この判定で新しく書いた。すべて `docs/audit/` の下）：
- `uiref-ideal-audit-sheets.py`：cites.tsv の183画面について、素案がその番号に寄せる主張（本文のリンクの前後）と読了ノートの image_seen を書き出し（worklist）、原寸を番号と id つきで6枚ずつ並べた一覧の画像31枚を作る
- `uiref-ideal-audit-wide.py`：横長（web）の16画面を字が読める大きさ（幅1600px）で2枚ずつ並べた8枚を作る
- `uiref-ideal-audit-extra.py`：cites.tsv の外の画面（3人の台帳の同じ番号の別の画面）を一覧にする
- `uiref-ideal-audit-count.py`：判定の件数、書き手の判定との違い、付録Bの数の数え直し（書き手の count.py と別の正規表現）
- 判定の全行：`DESIGN-UI-IDEAL-audit-screens.tsv`（183行。列＝#・番号・id8・素案の主張と画像・image_seen と画像・所見）。下の付録に同じ表

## 0. 総合：**要補強**

| 項目 | 結果 | 章 |
|---|---|---|
| 画面の全数（183画面・147番号） | 判定役が**183枚の全部を原寸の一覧で開いた**（31＋横長8枚の一覧、ほかに cites の外の5枚）。素案の主張と画像：**合う167・一部合わない16・合わない0**（番号では 合う131・一部16）。image_seen と画像：合う176・一部7・合わない0 | 1・2章 |
| 主張が画像に支えられる割合（QUALITY 6.3） | 画面で 167/183＝91.3%、番号で 131/147＝89.1%（目安 90%） | 2章 |
| 書き手の判定との違い | 23行。うち書き手が「合う」とした17行を判定役は「一部合わない」（新しく見つかった食い違い15番号）。逆に書き手の「一部・合わない」6行は、素案がすでに書き直していて今の本文とは合う | 2章 |
| 数の再現（付録B） | 書き手の count.py の出力は付録Bと**1字も違わない**（diff 0）。別の数え方でもリンク425・番号147・担当 40/44/55/8・cites 183行・原寸32・C 13行・781行が一致 | 3章 |
| 3章の食い違い13件と元の文書 | 3人の欄の34か所：合う31・一部3（C1 の MB3、C5 の MB3、C10 の MB1）・合わない0。「根拠・理由」の欄は C1 の画面の主張が画像と逆（5章） | 4章 |
| 「決めた」所が画像から言えるか | 決めた10件（C1・C2・C3・C4・C6・C7・C9・C10・C12・C13）：言える7、一部2（C3 の反対の事実の引き方、C4 は言えるが反例あり）、**言えない1（C1：根拠の3画面のうち2画面は数の札が「次の1つ」より上）** | 5章 |
| QUALITY 3章の7軸 | OK 3（問いの設計・写し方の大胆さ・回避の痕跡）、要補強 4（資料の幅・深さ・良い面の分析・反証） | 6章 |
| 直す点（QUALITY 7章に効くものだけ） | 6 | 7章 |
| 既知の傷 | 15 | 8章 |

「要補強」の理由：引いた画面の9割は主張どおりで、数も3人の文書の写しも正しい。しかし①素案の芯（0章-1・C1「ホームの主役は次の書類1枚」）の根拠に挙げた Copilot W1・Shopify X24 の原寸は、どちらも**数の札とグラフを一番上に置き、「次の1件」の札をその下に置く**画面で、素案の「どれも『次にやる1つ』を数より上に置く」（343行・493行）と逆。②第1回 M1 の「！」は同じ流れの取得済みの画面 c775292b に**ある**（判定役が原寸で確かめた）のに、素案は「足りない・別に探す」としている（120行・573行）。③仕訳の机の反対の事実「差0でも科目違い（W10 原寸）」は W10 の画像になく（画像は差を調整の額で埋めた所）、④1億の見込みの線の「このペースなら◯年◯月」「前提を押せば見える」は X5・X7 の画像にない、⑤状態で段を作る例の Crypto.com X12 は「quests completed」の数で段が開く画面。どれも面白さ・学び・設計の決定に効く（7章）。アウトにしないのは、決定の多く（C2〜C13）は画像と合い、直しは根拠の付け替えと C1 の決め方の見直しで済むから。

## 1. 読んだ範囲（全数）

| 対象 | 開いた数 | 方法 |
|---|---|---|
| cites.tsv の画面 | **183/183** | 原寸 `research/raw/mobbin-mcp/screens/<id>.jpg` を、縦長は1マス 510×1175px に縮めて6枚ずつの一覧（`sheet01〜31`）、横長16枚は幅1600px で2枚ずつ（`wide01〜08`）。小さい字が要る所（X28・X34・X36・X41・W3・W10 の4枚・W16・W28・W29・W40・W42・Q32・Q36）は横長の一覧で読んだ |
| 読了ノートの image_seen | **183/183** | `uiref-ideal-audit-sheets.py` が全ノートから image_seen を書き出し、判定役が画像の横で1行ずつ読んだ（worklist）。M1・W8・W13・W29・W40・W41・W42・Q57・Q78 の7本・M12・M13 は元の行も開いた |
| 素案の主張 | 147番号の全部 | 同じスクリプトが本文の全リンク425か所の前後を書き出し、素案の本文（1〜583行）と付録A（584〜736行）を判定役が通読 |
| cites の外の画面 | 5枚 | 素案の主張が別の画面に頼っていないかを見るため：e6fe4340（W8 の2枚目）・ea307f13（W13 の3枚目）・c9a96ef6（W41 の Thrive Market）・b945aba6（W13 の4枚目）・c775292b（M1 の「！」） |
| 3人の文書 | MB1 の 145〜254行、MB2 の 10〜21・153〜261行、MB3 の 188〜293行と台帳の該当行（X10・X12・X17・X24・W3・W7・W8・W13・W40・W41・W50・Q13・Q14・Q15・Q25・Q38・Q57） | 4章の突き合わせ |
| 開けなかったもの | 0 | 原寸がない画面はなかった |

## 2. 画面の全数の判定（183画面）

### 2.1 件数（`uiref-ideal-audit-count.py`）

| 列 | 合う | 一部合わない | 合わない | 計 |
|---|---|---|---|---|
| 素案の主張と画像（画面） | 167 | 16 | 0 | 183 |
| 素案の主張と画像（番号。1画面でも一部なら一部） | 131 | 16 | 0 | 147 |
| image_seen と画像 | 176 | 7 | 0 | 183 |

「素案の主張」は、素案が今の本文（付録Aの書き直しを含む）でその番号に寄せている主張。書き手の cites.tsv の「合うか」は「ノートと MB の主張が合うか」なので、列の意味が少し違う（2.4）。

### 2.2 素案の主張と画像が「一部合わない」16画面

| # | 番号 | 素案の行 | 素案の主張 | 原寸で見た所 | 効くもの |
|---|---|---|---|---|---|
| 19 | X24 | 13・115・343・454・493 | 「主役は数の帯でなく次にやる1つ」「どれも『次にやる1つ』を数より上に置く」 | Sessions 21・Total sales $149,94・Orders 2 の数の列と折れ線が**上**、「1 Order to fulfill」は下の小さな灰色の札。MB1 自身の台帳（MB1 89行）も「数の列…と青い線。灰色の小札」とこの順に書いている | 設計の決定（C1・D1） |
| 52 | W1 | 13・46・119・343・454・493 | 同上（Copilot の TO REVIEW の札1枚が主役） | 一番上で一番大きいのは「$1,592 left／out of $1,612 budgeted」と予定線の札。TO REVIEW はその下、さらに下に予算の丸5つ。ノートの image_seen も「青い帯の下に白い札…その下に TO REVIEW」と順を書いている | 設計の決定（C1・D1） |
| 175 | M1（参考） | 120・573・729 | 「原寸のこの画面に『！』がなく…人物に印を付ける型は別に探す必要がある（11章）」 | fbbbcbd0 に「！」がないのは正しい。しかし**同じ流れの c775292b（取得済み・ノートあり）の原寸には、橙の服の客の頭に白い吹き出しの「！」がある**。ノートと第1回の文書は同じコミット 7b44cf0 で c775292b を指すよう直されたが、素案だけ直っていない（判定役は fbbbcbd0 の行を「合う」にしたので16件には数えない） | 面白さ（舞台の人物） |
| 62 | W10 | 157・345・455・505 | 「差が0でも科目違いはある。Xero は…赤字のまま Totals match で確定できた（原寸）」 | 画像は Minor adjustment 6.75 を足して差を埋め、警告のまま Totals match と Reconcile が青い所。**科目の誤りは画面にない**。画面が示すのは「差を調整の額で埋める逃げ道」（8章#3 の根拠としては合う） | 設計の決定（C3・D2） |
| 9 | X12 | 66・253 | 「状態で段を作る例は Crypto.com の『駅』」 | 段ごとに特典は増える（+0.25%→+0.50%）が、段は「0/2 quests completed」「1/3 quests completed」と Upgrade Benefits で開く＝こなした数で段を作る画面。MB1 自身が台帳（72行）の悪い面に「quests completed の数で段を上がるのは量への報酬」と書いたのを、素案は落とした | 学び（量の報酬） |
| 3 | X5 | 62・253・365 | 「月の軸の右端に1億の星、このペースの点線…」「見込み（点線・幅）は前提を押せば見える [X5][W32]」 | 線（Today→Age 92）と線の先の星はある。**点線・前提の切り替え・『このペースなら』の文はない**。前提を動かすと見込みが動くのは W32 の Monthly Deposits のつまみ（W32 は合う） | 面白さ（判断の手ごたえ）・D1 |
| 12 | X15 | 183・186 | 「舞台の上の小さな札で、操作を止めない」 | 小さな黒い札「You reached a milestone」の下に、画面の上半分を覆う白い札と紙吹雪が重なる。「止めない・押さずに消える」は静止画で見えない | 面白さ（待ち） |
| 48 | X60 | 237 | 「一番良い週と悪い週を対に」 | 画面は most productive **day**／most distracting **day** | 既知の傷 |
| 60 | W8 | 243 | 「科目を押すと、その月の仕訳の一覧 [W8]」 | 引いた f1778c3a は分類の一覧だけ。押した後の一覧は MB2 の台帳の2枚目 e6fe4340（cites の外）にあり、判定役が開いて確かめた（Other の $1,309.40 と August の取引の行） | 既知の傷（根拠の画面の付け替え） |
| 69 | W13 | 155・474 | 「Copilot の自動の合わせ [W13]」 | 1ae4ac51 は分割の始め（$9.00／$0.00）だけ。自動で減る所は ea307f13（$7.00 と $2）にあり、判定役が開いて確かめた | 既知の傷（同上） |
| 96 | W41 | 217・218 | 「±と品切れ」「Running Low の札」 | 78129b1d は ± と「100」だけ。品切れ・Running Low は c9a96ef6（Thrive Market、cites の外）にあり、判定役が開いて確かめた | 既知の傷（同上） |
| 86 | W30 | 48・148 | 「書類の値を押して拾う [W30]」 | 見るだけの View reimbursement で、値を押す所はない（「証憑と行と合計」は合う） | 既知の傷 |
| 89 | W33 | 204 | 「『借りない』の札も同じ重さで出す [W33]」 | 「借りない」の札はなく、上に大きな「Cash Loan Up to Rp100.000.000」 | 面白さ（判断の重さ） |
| 118 | Q13 | 370 | 「吹き出しは1画面3つまで [Q13]」 | 吹き出しは6つ。MB3 は悪い面（多いと180字超え）から上限を出した（MB3 76行）。素案は反例として引くと書いていない | 既知の傷 |
| 126 | Q21 | 15・147・157 | 穴のある1文（書き手が付録Aで「文末」に直した） | 書き手の訂正どおり、札は文の後ろ。素案の今の本文（157行(4)）と合う所と、0章-3・147行の「文の穴」は一部 | 学び（問いの形。T6 で確かめる） |
| 150 | Q57 | 293 | 「主の線は太く副は細く、誤りの線は色 [Q57]」 | 線は全部同じ細さ、色は点に付く | 既知の傷 |
| 156 | Q68 | 332・387 | 「強さ3段（控えめ・ふつう・派手）は設定で選ぶ [Q68]」 | 音の種類（Sine・Synth・Bowl・Off）・振動 On/Off・声。強さの段はない | 既知の傷（18章 問3 は開いたまま） |

### 2.3 image_seen と画像が「一部合わない」7画面

X34 4d946d9e（ノート「-$720 から $1,200 へ」、表は -$767.31→$1,117.05。付録Aは始点だけ書き、終点の違いは書いていない）、Q21（ノート「問いの文の途中に…埋まる」、札は文の後ろ）、Q68（ノート末尾「演出の強さ」）、Q78 168b1c76（ノート末尾「やったことに後から名前を付ける」は画面から言えない＝付録Aの通り）、M12 2枚・M13 1枚（4つのアプリをまとめた同じ文で、その画像にない物を含む＝付録Aの備考の通り）。M1 fbbbcbd0 のノートは同じコミットで直っていて、今は画像と合う（付録Aの「ノートは『！』と書く」の方が古い）。

### 2.4 書き手の判定（cites.tsv）との違い 23行

- 書き手「合う」→判定役「一部合わない」17行（15番号）：X5・X12・X15・X24・X60・W1・W8・W10・W13・W30・W33・W41・Q13・Q57・Q68（W1・W10 は書き手が**原寸を開いた**画面。開いても、頼る主張の向きを画像の並びと突き合わせていなかった）
- 書き手「一部・合わない」→判定役「合う」6行：X34 の2行・Q78 の5行のうち4行と主の行・M1。書き手の訂正を本文に入れた後の今の主張は画像と合うため（Q78 の1枚目 168b1c76 のノートの誤りは image_seen の列に残した）
- Q21 は両者とも「一部合わない」

書き手の「32枚は原寸」のうち W1・X24・W10 の3枚で主張と画像の食い違いを見落とし、残りの151枚はノートだけで「合う」としていた。ノートで見つけられたはずのもの（W1 のノートは数の札→TO REVIEW の順、W8・W41 のノートに一覧・品切れはない、X12 のノートに quests completed）も「合う」になっている。

## 3. 数の再現（付録B）

- `python3 -I boki2/docs/analysis/uiref-ideal-count.py`：終了コード0。出力を付録Bの ``` の中と diff して**差0**（判定役のスクリプトの外で取った差分。scratchpad の count.out・appB.txt）
- 判定役の別の数え方（`uiref-ideal-audit-count.py` の (3)）：本文のリンク 425、番号の種類 147、担当ごと MB1 40・MB2 44・MB3 55・第1回 8、cites.tsv の番号 147・画像を開いた 32、3章の C の行 13、全体 781 行。付録Bと全部一致
- ただし付録Bの「番号ごとの判定 合う143・一部合わない3・合わない1」は書き手の判定の数で、判定役の判定では 合う131・一部16（2章）。数え方は正しいが、元の判定が変わる

## 4. 3章の13件と3人の元の文書の突き合わせ（全数）

3人の欄の書きぶりを、元の文書の行で確かめた。「—」の欄は、その担当がその論点を扱っていないことを元の文書の範囲の書き方で確かめた。

| # | 素案の行 | MB1 の欄 → 元 | MB2 の欄 → 元 | MB3 の欄 → 元 | 根拠・理由の欄 |
|---|---|---|---|---|---|
| C1 | 343 | 合う：S1 主役「店の外観の絵と『今月の状態』の1語」、④ 1億への見込みの細い線（MB1 153行）。「書類があと3通」も同じ行 | 合う：① 主役「次の書類1枚」（MB2 161行） | **一部**：MB3 の S-3 の主役は月の札（MB3 204行）だが、MB3 は「ホーム」を定めていない。流れの入口（217行）を素案がホームと読んだ | **合わない**：「3人の根拠の画面（W1 X24 X23）は、どれも『次にやる1つ』を数より上に置く」は W1・X24 の原寸と逆（2章）。X23 だけ合う |
| C2 | 344 | 合う：S2（154行）。別の解釈「帳簿は練習室の参考書に置き」（243行） | 合う：④「月の途中でも開ける」（164行） | 合う：扱っていない（MB3 の画面一覧に帳簿の画面はない） | 合う |
| C3 | 345 | 合う：問わなかったこと「仕訳の操作（振り分け）…（MB2）」（35行） | 合う：要点1「一番近い型は…合計が合うまで確定できない分け方」（12行）、要点4（15行） | 合う：S-5「穴のある1文と札」「置く先の図（B/S の箱、MB2 の盤）」（206行）、Q78 の順（203行） | 一部：「差0でも科目違いがある（W10 原寸）」は MB2 F4 の別の解釈（195行）の写しとしては合うが、W10 の画像にはない（2章） |
| C4 | 346 | 合う：反対の事実1（184行） | 合う：画面ごとに絵の扱いが違う（① 店の絵（小）、⑧ 場所の絵（上半分）、② は絵なし：161〜168行） | 合う：全体の考え方1「どの画面も」（194行） | 合う：MB3 が S-11 を舞台なしにした（248行・212行） |
| C5 | 347 | 合う：S6（158行）、捨てた案「町の順位表」（233行） | 合う：⑨「町の順位（自店の行を浮かせ、±と矢印）」（169行） | **一部**：MB3 の「他人との比べ」の禁止は実在の人（Vocabulary Q82・Paired Q40）で、「ライバル店との比べは MB2 の範囲」と書いている（257行）。素案の「扱わない（他人との比べは禁止の型）」は、MB3 がライバル店の比べにも反対しているように読める | 合う |
| C6 | 348 | 合う：X17「習得の3段を、成長の記録で」（77行）。数の扱いは書いていない | 合う（扱わない） | 合う：S-10「Q44（段の条件を書く、数は出さない）」（211行） | 合う（PEDAGOGY 4.3） |
| C7 | 349 | 合う：S4 の4枚と「変化の小さい札は飛ぶ」（156行） | 合う：「Closed period」（184行） | 合う：S-10 ③ 2つの箱（211行）。「直した札だけでよい」は Q38 の悪い面（111行） | 合う |
| C8 | 350 | 合う：S2 の動き（154行） | 合う：② の動き「山が伸びる」（162行） | 合う：反対の事実「返事が来ることから来るのかもしれない」（246行） | 合う |
| C9 | 351 | 合う：S2「記帳した瞬間、斜線の分が塗りに」（154行） | 合う：② 「払った札が山に積まれ」（162行） | 合う：S-6「誤りでも舞台に一度反映」（207行） | 一部：「MB2 の『山』は机の中の列のこと」の【推論】は ② の山については合うが、MB2 は ④ 反映の図にも「科目の山（試算表）…確定のたびに…山に硬貨が積まれる」（164行）を持つ。④ は確定の後に動くので、結論（帳簿は確定の後）とは両立する |
| C10 | 352 | **一部**：X10 の置き場所「1年＝12の石の道」（70行）はあるが、S5（157行）の根拠に X10 はなく、MB1 は道をどの画面に置くか決めていない | 合う（扱わない） | 合う：S-9 タブ「1年の道」（210行）、S-3 の Part・Session（204行） | 合う：X10 と Q59 は同じ Ahead の地図の石（原寸で確かめた） |
| C11 | 353 | 合う（扱わない） | 合う（扱わない） | 合う：論証の表「検定会場は業務的な見た目でよい」（292行） | 合う |
| C12 | 354 | 合う（問わなかったこと、35行） | 合う：要点4・5（15・16行）、F2・F3（193・194行） | 合う：反対の事実の別の解釈「ドラッグは並べ替え…に限る、という分け方もある」（247行） | 合う：捨てた案「試作で比べる候補として残す」（MB2 247行） |
| C13 | 355 | 合う：X24「はじめの月は手順の6行（MB3 と重なる）」（89行） | 合う（扱わない） | 合う：S-1・S-2（202・203行） | 合う |

件数：3人の欄 34か所（「—」の5か所を除く）＝合う31・一部3・合わない0。根拠・理由の欄13＝合う10・一部2（C3・C9）・合わない1（C1）。

## 5. 「決めた」所が根拠の画像から言えるか（事実として）

| # | 決めたこと | 根拠の画像 | 言えるか |
|---|---|---|---|
| C1 | ホームの主役は次の書類1枚 | W1・X24・X23 | **言えない**。W1・X24 は数の札・グラフが一番上で、次の1件は下の札。3件で揃うのは「次の1件を独立した札で出す」「空になると状態が変わる（W1 #54・X24 の That's it for now・X23 の up-to-date）」まで。「数より上・主役」は X23 の位置だけ（X23 も数の札は大きい） |
| C2 | 帳簿は1つの画面に流れの図と山をタブで | X34・X36・W27・W28 | 言える（どれも数の画面。W27 は硬貨の絵つき） |
| C3 | 3層を重ねる | W10・W11・W12・W18・W19・Q21 | 一部：差の帯（W10 #63・#65 の灰色の Reconcile→#62 の Totals match、W11・W12）、2択の払い（W18・W19）、文の後ろの札（Q21）は画像どおり。反対の事実「差0でも科目違い」は W10 の画像にない |
| C4 | 3層は店の場所だけ | X34・X36・X38（絵なし） | 言える。ただし反例 X6（942b1d25 の丘とどんぐり）・X31／W27（硬貨の山）も画像どおりで、素案は7章 #4 に書いている |
| C6 | 進みの数は出さない | X17＝Q44 | 言える（画面は数を出す。素案はそれを写さない決め。根拠は PEDAGOGY） |
| C7 | 締め→月報、最大4枚、最後がふりかえり | X58（5画面）・Q38 | 言える：X58 は入口の3つの数→Spending→Budgets→Cash Flow→Investments→CLOSE の4枚、Q38 は Incorrect／Correct の2つの箱 |
| C9 | 机の列は置いた時点、帳簿と舞台は確定の後 | （画像なし。DESIGN-JOURNAL-UX と PEDAGOGY） | 画像の主張ではない |
| C10 | 1年の道は画面15の中段に1つ | X10・Q59・Q58 | 言える：X10・Q59 は同じ Ahead の地図の石、Q58 は済みが実線・先が点線 |
| C12 | スワイプは2択、ドラッグは必須にしない | W17〜W20・W23・W6 | 言える：見たスワイプは全部2択、W23 は「Press and drag an item to move it.」の並べ替え、W6 は「Tap to add or remove」。Brilliant Q78 b7c9a698 の「Drag to reorder」も同じ向き |
| C13 | はじまりは MB3 の形 | （X24 27c8fc98 の6行の手順は画像どおり） | 画像の主張ではない（PEDAGOGY 0.1・0.2） |

## 6. QUALITY 3章の7軸

| 軸 | 判定 | 根拠（行） |
|---|---|---|
| 問いの設計 | OK | 各画面に「悪い面と反対の事実」（109・120・130・140・157 行…）、7章の論証の表14行（452〜467行）。面白さ（6.2 体験の検討 436〜446 行）と学び（2.5 の学びの段の約束 155 行）に照らしている |
| 資料の幅 | 要補強 | 資料は Mobbin の画面だけ（0章-8、20 行が認める）。家計・業務の画面が多く、ゲームの画面は 0。BIZ-UIREF の声・作り手の話は引くだけ。統合の段の範囲としては既知 |
| 深さ | 要補強 | 各画面の「根拠」は画面の特徴の括弧書き（例 156・207・217 行）で、なぜ効くかの因果の鎖は3人の文書に置いたまま。数字は幅でなく仮の値（4.4、380〜387 行） |
| 良い面の分析 | 要補強 | 「うまくいく理由」の章がない。良い面の因果は C 欄の短い理由（343〜355 行）だけで、根拠の画面の読み違い（C1 の W1・X24、X12）を因果の側から点検できていない |
| 写し方の大胆さ | OK | 帯をなくす（398・416 行）、23画面と4つの場所（26〜35 行）、D4 の最小と大胆（526〜535 行）、D1 の (a)〜(d)（495〜502 行） |
| 回避の痕跡 | OK（注意つき） | 簡略化の台帳14行（471〜486 行）の理由は4つの範囲内。#13（485 行）は負担減と自分で書き7章 #4 に反対2つ。注意：11章（573 行）の「人物に印…足りない」「新しく探していない」は、取得済みの c775292b で満たせる物を足りないとしている |
| 反証 | 要補強 | 反対の事実は各画面と7章にある。しかし C1 の一番強い反対（根拠の W1・X24 自身が数を上に置く）が書かれていない（454 行の反対は X30・X28・ウマ娘だけ）。W10 の反対の事実は画像にない物を画像の名で書いている（157・455 行） |

## 7. 直す点（QUALITY 7章の4つに効くものだけ）

1. **C1・0章-1・D1 の根拠の向き**（設計の決定・面白さ）：W1・X24 は「数の札が上、次の1件の札が下」。素案の 13・343・454・493 行の「次にやる1つを数より上」「主役は数の帯でなく」を、画像どおりに書き直す。C1 の「決めた」が W1・X24 に頼れるのは「次の1件を独立した札で出す」「空で状態が変わる」までで、「数を置かない／数より上」は D1（オーナーの決定）の側に入る。反対の事実の欄（454 行）に W1・X24 自身を足す【確かめた：W1 #52・X24 #19 の原寸と、両方のノートの順】。C1 を「決めない」へ移すかは論証の検査役の判断【問い】
2. **M1 の「！」の取り違えの後始末**（面白さ：書類の相手が舞台に立つ・出来事のある人物）：c775292b（取得済み・ノートあり）の原寸に「！」がある。120 行の「人物に印を付ける型は別に探す」と 573 行の「足りない所」から外し、画面2・4 の根拠に c775292b を足す。付録A 729 行の「ノートは『！』と書く」は今のノートと合わない【確かめた：c775292b の原寸、fbbbcbd0 のノートの訂正（コミット 7b44cf0）】
3. **W10 を「差0でも科目違い」の根拠に使わない**（設計の決定：C3・D2）：157・345・455・505 行。W10 の画像が示すのは「差を調整の額で埋めて確定できる」（8章 #3 の逃げ道）。「差0でも科目違いはある」は貸借の仕組みからの【推論】として印を付けて残す【確かめた：W10 #62〜#65 の原寸】
4. **X12 を「状態で段を作る例」から外す**（学び：量の報酬）：66・253 行。X12 の段は quests completed の数で開く。写すのは「段ごとに増える権限を札で見せる」だけで、段の条件は状態（MB1 72 行の悪い面）、と書く【確かめた：X12 #9 の原寸と MB1 72 行】
5. **1億の見込みの線の根拠**（面白さ：遠い目標が毎月の判断に返るか・D1 の (b)）：62・253・365・443 行。X5 の画像は「線と星」だけで、点線・『このペースなら◯年◯月』・前提を押す所はない。X7 は「目標の期日から逆算した必要なペース（Save about $24 per week）」で、見込みの日付とは向きが逆。前提を動かすと見込みが動くのは W32 のつまみ。見込みの1文は【推論】と印を付け、X7 の逆算の型（「1億までに毎月いくら残せば」）も選択肢に並べる【確かめた：X5 #3・X7 #6・W32 #88】【問い：どちらの向きが遊ぶ人の判断に効くかは T1 で】
6. **画像にない設計の足し分に【推論】の印**（面白さ：待ち・判断の重さ）：X15（183 行「舞台の上の小さな札で、操作を止めない」：画像は上半分を覆う札と紙吹雪）、W33（204 行「借りない札も同じ重さ」：画像は借りる向きの画面）。どちらも画像の名で書かず、設計の決めとして書く【確かめた：X15 #12・W33 #89】

## 8. 既知の傷（差し戻さない。15件）

1. X60 は「週」でなく「日」の対（237 行）
2. Q13 は吹き出し6つの反例。「3つまで [Q13]」の書き方（370 行）
3. Q57 の「線の太さ・誤りの線の色」は画像にない（293 行）
4. 「Ahead・Mimo の道」の Q59 は Ahead（258 行）
5. cites.tsv の ec23b20f のアプリ名は Philips Hue でなく Google Arts & Culture（MB2 149 行の通り）
6. 付録A M1 の行（729 行）と7行目の「合わなかった4件」は、同じコミットで直ったノートの前の状態を書いている
7. X34 のノートの終点（$1,200、表は $1,117.05）は付録Aに書かれていない
8. Q33 の時計「00:01」は経過時間（素案の「残り時間」の根拠は Q34 で足りる）
9. W29 は表で、「札の束」ではない（313 行）
10. W30 に「押して値を拾う」所はない（48・148 行。根拠は PEDAGOGY 1.7 で足りる）
11. W8・W13・W41 の主張は cites の外の画面（e6fe4340・ea307f13・c9a96ef6）にある。リンクと cites.tsv に足す（判定役が開いて、3枚とも主張どおりと確かめた）
12. Q68 に「強さ3段」はない（387 行。18章 問3 は開いたまま）
13. ノートの誤り：Q21（「文の途中」）・Q68（「強さ」）・M12／M13（4画面まとめの文）
14. 3章の欄の書きぶり：C1 の MB3（ホームと定めていない）、C5 の MB3（ライバル店は MB2 の範囲と書いている）、C10 の MB1（S5 に X10 はない）、C9 の MB2 の山（④ にも山がある）
15. 付録Bの「番号ごとの判定」は判定役の判定では 合う131・一部16

## 9. 逆の結論・別の解釈・直し方（印つき）

| 所 | 逆の結論・別の解釈 | 印 |
|---|---|---|
| C1 | W1・X24・X30・QuickBooks X28 の4枚は、どれも数の札を上に置き、次の1件を下に置く。同じ画面から「ホームは数の札1枚＋その下に次の1件」（D1 の (b)(c) 寄り）という逆の結論が組める | 画面の並び【確かめた】／その形が遊ぶ人に効くか【問い】 |
| 画面2 | c775292b の「！」は、人物の上の印で「次の1件」を舞台の側に置く型。書類の札を机に置かず、舞台の人物を押して始めるホームという別の形も組める | 画像【確かめた】／形の良し悪し【問い】 |
| C3 | W10 は「差を埋める札があると誤りを隠せる」の例で、「差の帯があると試し打ちになる」（6.2 の 440 行）の例ではない。差の帯の悪い面の根拠は MB2 の論証の表（255 行）の推論だけ | MB2 の行【確かめた】 |
| 1.3・2.15 | X12 の段の条件が量であることから、「段を見せると量の目標に寄る」という逆の筋も組める（段の札を出さない案） | 画像【確かめた】／筋【問い】 |
| 直し方1 | C1 を「決めない」にするか、「次の1件を札で出す」だけを決めて位置を D1 に返すか | 【問い】（論証の検査役） |
| 直し方5 | 見込みの1文を X7 の逆算の形にする | 【問い】（T1 で比べる） |

## 10. 依頼の対応表

| 依頼の原文 | どこでどう応えたか |
|---|---|
| 「素案が引く画面（cites.tsv の183画面…）の全部を、原寸の画像で自分で見る」 | 1章：183/183 を原寸の一覧（31枚＋横長8枚）で開いた。付録の表に # と id。ほかに cites の外の5枚 |
| 「各画面について、素案がその画面に寄せている主張（2章の根拠の欄・付録A）と、読了ノートの image_seen が、画像と合うか（合う／一部合わない／合わない）。表と件数を判定書に」 | 2章（件数・一部の一覧）と付録（183行の表）、`DESIGN-UI-IDEAL-audit-screens.tsv` |
| 「素案の数（付録B）を uiref-ideal-count.py で再現」 | 3章：diff 0。別の数え方でも一致 |
| 「3章の13件の全部を、元の文書の行と突き合わせる」 | 4章：34か所＋根拠の欄13 |
| 「『決めた』所が、根拠の実例の画像から言えるか（事実として）」 | 5章：決めた10件 |
| 「QUALITY 3章の7軸で判定（行番号つき）」 | 6章 |
| 「総合：OK／要補強／アウト。直す点は QUALITY 7章…に効くものだけ。ほかは既知の傷」 | 0章（要補強）、7章（6点）、8章（15件） |
| 手抜きの予想（抜き取り／ノート同士の突き合わせ／書き手の「合う」を写す／根拠のない判定） | 全数を原寸で見た。書き手の判定と23行違う（2.4）。各行に原寸で見た字・並びを書いた（付録） |
| 「判定書は boki2/docs/audit/DESIGN-UI-IDEAL-audit.md、スクリプトは boki2/docs/audit/ の下に新しく。ほかのファイルは変えない」 | この文書と、冒頭の4本のスクリプト・判定の tsv。素案・3人の文書・ノート・cites は変えていない |
| 「『逆の結論』『直し方』の各行に【確かめた】か【問い】」 | 7章・9章 |
| 「git の commit・push はしない」 | していない |

## 11. やっていないこと

- **論証の妥当さは判定していない**（別の担当）。C1 を決めないにするか等は【問い】のまま
- 画面は原寸を縮めた一覧（縦長は1マス約510px 幅）で見た。小さい字の要る横長は幅1600px で読んだが、縦長の画面の小さい字（例 W19 の右上の小札の字、Q49 の上端の薄い字）は読み切れていない所がある（付録の所見に書いた）
- 動きは見ていない（静止画）。「押さずに消える」「止めない」等の動きの主張は、画像では確かめられないと書いた
- 3人の文書は、3章に関わる行と、判定に要った台帳の行だけを読んだ。3人の台帳の全行（MB1 63行・MB2 48行・MB3 81行）の主張は確かめていない
- cites の外の画面は5枚だけ開いた。3人の台帳が同じ番号で挙げるほかの画面（例 W7 の2枚目、W17 の1〜3・5〜7枚目、W50 の Fi）は開いていない
- 素案の本文の画面の根拠以外の主張（PEDAGOGY・DESIGN-JOURNAL-UX・BIZ-UIREF の引き方）は確かめていない
- research-check・report-check は素案に対して report-check だけ走らせた（✓）。判定書には走らせていない

## 付録 画面183の判定の全行

「書き手の原寸」は cites.tsv の「画像を開いた」。太字は「合う」以外。所見は判定役が原寸で見た字・並び。

| # | 番号 | アプリ（cites） | 画面 id | 書き手の原寸 | 素案の主張と画像 | image_seen と画像 | 判定役が原寸で見た所・食い違い |
|---|---|---|---|---|---|---|---|
| 1 | X2 | Rocket Money | 4dd0e004 | — | 合う | 合う | 70%の輪・「Next milestone is 10th Deposit!」・六角の印。量の数の禁止の例として画面どおり |
| 2 | X4 | Copilot | 05906c98 | — | 合う | 合う | 「$0 saved in Aug」「$10 to go in Aug」。済み・残りの2数 |
| 3 | X5 | Wealthfront | 8e5cbd25 | 開いた | **一部合わない** | 合う | 線（Today→Age 92）と線の先の星の丸は画面どおり。素案が同じ所で寄せる「このペースの点線」「前提を押せば見える」（1.3・2.15・4.1-4）は画面になく（点線も前提の切り替えもない。ⓘは「Current net worth」の横だけ）、星も軸の右端でなく線の途中で止まる |
| 4 | X6 | Acorns | 942b1d25 | — | 合う | 合う | 額「$10.31」の上に丘とどんぐりの立体の絵。7章#4の「数の画面に絵」の通り |
| 5 | X6 | Acorns | 2f052065 | — | 合う | 合う | 同じ番号のほかの画面。全面緑地に折れ線で、絵（イラスト）はない＝#4の主張はこの画面には当たらないが、主の画面で足りる |
| 6 | X7 | ANZ Plus | ca6407b9 | — | 合う | 合う | 「5 months to go (21 June 2026)」「Save about $24 per week to achieve this goal」。ただし「このペースなら◯年◯月」の見込みではなく、期日から逆算した必要なペースの1文（向きが逆） |
| 7 | X8 | Strava | 3a8f7f18 | — | 合う | 合う | 「Your focus／Stay active」と点線、「7 months left」「Dec 31, 2026」 |
| 8 | X10 | Ahead | 27c3c80c | 開いた | 合う | 合う | 番号の丸い石4〜7、5が紫で現在地、右上に炎「1」と左上「18%」。「済み実線・先は点線」の線は画面になく（石は線でつながっていない）、素案の設計の足し分 |
| 9 | X12 | Crypto.com | 07440204 | 開いた | **一部合わない** | 合う | 段ごとに特典が増える（Earn Plus +0.25%→+0.50%、Trading Rebates 0.05%→0.075%）は合う。しかし段の解放は「0/2 quests completed」「1/3 quests completed」と Upgrade Benefits で、こなした数（量）で段を作る画面。素案の「状態で段を作る例」（1.3）とは言えない |
| 10 | X13 | Finch | 7279bc2a | — | 合う | 合う | 取り消し線と赤い DONE の判、次の STRETCH GOAL が枠で強調。ただし段の中身は「12406 / 21219 sponsorships raised」の量 |
| 11 | X14 | Duolingo | 9f9ad31c | — | 合う | 合う | December Quest（19 DAYS）・WEEKEND QUEST・DAILY QUESTS、XP。「月・週・日」の週は週末のクエスト |
| 12 | X15 | Tolan | d2547f6d | — | **一部合わない** | 合う | 「You reached a milestone」の小さな黒い札は上端にあるが、その下に画面の上半分を覆う白い札「Build nourishing friendships」と紙吹雪が世界の絵に重なる。素案の「舞台の上の小さな札で、操作を止めない」（画面8）のうち「小さい」は札の一部だけ、「止めない・押さずに消える」は静止画で見えない |
| 13 | X16 | Ten Percent Happier | da51f189 | — | 合う | 合う | Daily Streaks・Weekly Streaks・My Journey（First Session だけ色）。禁止の型の例として画面どおり |
| 14 | X17 | Quizlet | f5c83f4d | — | 合う | 合う | 条件の1行「Your progress is based on the last two times…」と 0 Not studied・46 Still learning・22 Mastered。数を出さないのは素案の選択で、画面は数を出す（C6 の書き方どおり） |
| 15 | X19 | Oura | bfe532d9 | 開いた | 合う | 合う | 大きな「80 READINESS」と上の小さな丸札（7・102・15m） |
| 16 | X20 | Opal | 3f912d2e | — | 合う | 合う | 「97 Opal Score」が線で3つの丸札（100・92・100）に枝分かれ、Sleep を選ぶと他はぼかし |
| 17 | X21 | Visible | 3f60710a | — | 合う | 合う | 「4」→「Looking stable」と説明→3つの理由の札 |
| 18 | X23 | Monarch | 1744bee6 | — | 合う | 合う | 「July's progress／Great job! You're up-to-date for July.」の札は「$995 net worth」の札より上。ただし画面は札が縦に並ぶダッシュボードで、「1つだけに変わる」形ではない（素案は文言の例として引くだけ） |
| 19 | X24 | Shopify | 2063df51 | 開いた | **一部合わない** | 合う | 「1 Order to fulfill」「That's it for now」「Check back later…」は画面どおり。しかし「1 Order to fulfill」は Sessions 21・Total sales $149,94・Orders 2 の数の列と折れ線のグラフの**下**の小さな灰色の札で、主役でも数より上でもない。素案の「主役は数の帯でなく次にやる1つ」（0章-1）、「どれも『次にやる1つ』を数より上に置く」（C1・D1）は、この画面については逆 |
| 20 | X24 | Shopify | 27c8fc98 | — | 合う | 合う | 「Get ready to sell」と6行の手順（Set up Tap to Pay だけ点線の丸）。C13 の MB1 の引き方どおり。この画面も数の列（Conversion rate・Sessions・Total sales・Orders）が手順より上 |
| 21 | X28 | QuickBooks | a1576a19 | 開いた | 合う | 合う | PROFIT & LOSS の Income・Expenses の棒の右に斜線と「3 to review」「2 to review」。数を多く並べるホーム（7章#1 反対②）も合う |
| 22 | X30 | Copilot | a0fcfcb0 | — | 合う | 合う | 5つの輪（over/left）、UPCOMING（in 10 days Allstate $10.46）、NET THIS MONTH $301.48。数を多く並べるホームで、来月の支払いの例としても合う |
| 23 | X31 | Cleo | a252fcfd | — | 合う | 合う | In $326・Out $188 の硬貨の山の絵、Limit まで灰色の硬貨、「$115.90 per day」。数の画面に絵（7章#4）も合う |
| 24 | X31 | Cleo | d1d13fc6 | — | 合う | 合う | 「$1,274.87 until $1,463」「$115.90 per day」、BILLS DUE、Essential spending と手の絵 |
| 25 | X32 | Cleo AI | 207509eb | — | 合う | 合う | 特大「$978.62」「Over spend limit」「17 days to go」「It happens」。なお棒は黒で赤は使っていない（4.3-2 の「赤は超えた…」の色は素案の決め） |
| 26 | X33 | Monarch | b00a6ecc | — | 合う | 合う | MAY〜SEP 2025 の月の札（JUL が橙）、Left to budget -$1,250 |
| 27 | X34 | YNAB | 4d946d9e | 開いた | 合う | **一部合わない** | 資産（青）と負債（赤）の棒の上を黒い線と白い丸（純資産）が 09/25→10/25 へ上がる形は合う。ノートの「-$720 から $1,200 へ」は表の -$767.31→$1,117.05 と違う（付録A が書いた通り。終点の $1,200 も違うことは付録A に書かれていない） |
| 28 | X34 | YNAB | d8cda354 | — | 合う | 合う | Net Worth $52,218.75、Assets・Debts、Sep の棒、Age of Money 2 Days |
| 29 | X36 | Mercury | 86d1b223 | 開いた | 合う | 合う | 月ごとに灰（資産）と水色（負債・純資産）の対の棒、Working capital の折れ線、表 Total Assets・Liabilities 0.60・Equity。負債がほぼ0なので「対の棒」は資産と純資産がほぼ同じ高さ |
| 30 | X38 | Revolut | 61123e7a | — | 合う | 合う | Total Revenue→Cost of Revenue→Gross Profit→Total Operating Expense（開いて SG&A・R&D）→Operating Income。押すと内訳の通り |
| 31 | X41 | Xero | 0303c0ec | — | 合う | 合う | 「Profit or loss -1,672」と下の1文「No profit was made because the expenses were higher than the income」 |
| 32 | X43 | Copilot | 088f1e0a | — | 合う | 合う | NET INCOME の月の棒が0の線の上は緑・下は赤、月ごとの Total income・Total expenses |
| 33 | X47 | Lloyds | c792115c | — | 合う | 合う | 「£80 less than this time in June」、May・Jun・Jul の棒 |
| 34 | X50 | Strava | 8d71697d | — | 合う | 合う | 「You've done 3 activities so far this month - up from 0 at this point last month.」 |
| 35 | X53 | FotMob | dc306981 | 開いた | 合う | 合う | 左右に Bayern と Chelsea、Top stats の行で勝る側の数に色（FotMob rating だけは両側に色） |
| 36 | X54 | Commons | 98dbc571 | — | 合う | 合う | EMISSIONS 197 KG（紺）と COMMONS AVG. 630 KG（灰）、月の棒も自分は色・平均は灰、YOU VS. THE WORLD |
| 37 | X56 | GoHenry | e1ca6ae4 | — | 合う | 合う | 「£1 transferred to …」と「…'s card balance is now £1」。ただし全面の完了画面で、素案の画面8の「舞台の上の小さな札」の形ではない（素案は額と残高を1画面に、の型だけを引く） |
| 38 | X57 | Wise | 1aecb208 | — | 合う | 合う | 縦の線でつながるチェックの4段（set up→used SGD→paid out→complete） |
| 39 | X58 | Copilot | f2b45e8e | 開いた | 合う | 合う | Budgets：「$3 over total budget」、中央の点線と TARGET、右に出た分類は赤い↑（Shops ↑$85・Other ↑$6）、左は緑の↓、CONTINUE TO INCOME |
| 40 | X58 | Copilot | 0e16bced | — | 合う | 合う | March の札に $2,064 TOTAL INCOME・$702 TOTAL SPENT・$3.44 OVER BUDGET の3つの数と OPEN YOUR MONTH IN REVIEW（入口の3つの数） |
| 41 | X58 | Copilot | 5f8e3760 | — | 合う | 合う | Spending「$702 total spent in March」と分類の帯、CONTINUE TO BUDGETS |
| 42 | X58 | Copilot | eae8101b | — | 合う | 合う | Cash Flow「$1,362 saved from income」、月の棒が0の上で緑・下で赤、CONTINUE TO INVESTMENTS（Budgets の札の「CONTINUE TO INCOME」の次の札の題は Cash Flow） |
| 43 | X58 | Copilot | 5440388d | — | 合う | 合う | Investments「$167 balance change in March」と2つの口座、最後の札は CLOSE。Spending→Budgets→Cash Flow→Investments の4枚＝「最大4枚」の元と合う |
| 44 | X59 | Strava | d6f73070 | — | 合う | 合う | 黒地の巨大な「January」「2024」、FEB〜JAN の縦線（OCT が最長、JAN だけ橙と「3 HRS」） |
| 45 | X59 | Strava | 59094bb8 | — | 合う | 合う | JANUARY TOTALS の巨大な「2」DAYS、3 HRS・4.0 KM・13 M、点の暦、TOP SPORTS「Run」 |
| 46 | X59 | Strava | 5a328a63 | — | 合う | 合う | LONGEST ACTIVITY の地図と Evening Run、下に「Kudos,」 |
| 47 | X59 | Strava | 554e31e8 | — | 合う | 合う | 「Kudos, …!」「Way to get out there this January.」、Share Your Stats と Set A Goal |
| 48 | X60 | Opal | ea59c327 | — | **一部合わない** | 合う | 画面は「most productive **day** was Friday」と「most distracting **day** was Monday」の日の対。素案 2.13 の括弧「一番良い週と悪い週を対に」は週と書く（型＝良い方と悪い方を対に、は合う） |
| 49 | X61 | Commons | 6d4fe16b | — | 合う | 合う | ホームの「WELCOME BACK, SAM.」の下に濃い青の札「SPENDING REFLECTION／How did you do last week?」と NEW INSIGHTS |
| 50 | X62 | Turo | d635a1c2 | — | 合う | 合う | 「Pay or dispute your host's repair invoice／You have until Mar 25, 2025 to respond.」、「Respond to damage report by Mar 25, 2025」（題に何を・いつまでに） |
| 51 | X63 | Shopify | b1bd4556 | — | 合う | 合う | 行ごとに出どころの小見出し（Payments • 9:33 am、Point of Sale • Aug 3, 2026、Settings • …）と太字の題 |
| 52 | W1 | Copilot | 8d99b66f | 開いた | **一部合わない** | 合う | 「TO REVIEW」の札1枚（Sp Vitaly Design Ltd・OTHER・$94.28・MARK AS REVIEWED）はある。しかし画面の一番上で一番大きいのは「$1,592 left／out of $1,612 budgeted」と予定線・「$53 under」の数の札で、TO REVIEW はその**下**、さらに下に予算の丸5つ。素案の「主役は数の帯でなく『次にやる1つ』」（0章-1）、「どれも『次にやる1つ』を数より上に置く」（C1）、「根拠の画面は『次の1つ』を数より上に置く」（D1）は、この画面については逆 |
| 53 | W1 | Copilot | 5ebf5abc | — | 合う | 合う | 札を開いた後、見出しが TRANSACTION、$94.28、EXCLUDE・SPLIT・RECURRING |
| 54 | W1 | Copilot | 0e7388f4 | — | 合う | 合う | TO REVIEW の札が消え、星の印と「19 transactions to unlock Intelligence」（欄の形が変わる、の通り）。上の数の札はそのまま一番上 |
| 55 | W2 | Monarch | 457e2184 | 開いた | 合う | 合う | 緑の丸に白いチェック、「You reviewed everything!」と3行、View all transactions |
| 56 | W3 | YNAB | 325fffea | — | 合う | 合う | 「30 new transactions to approve or categorize.」、「$165.13 Cleared Balance + $0.00 Uncleared Balance = $165.13 Working Balance」、黄色の札「This needs a category」が十数行 |
| 57 | W6 | Cleo | 35656b22 | 開いた | 合う | 合う | 「SORT YOUR SPENDS」「Tap to add or remove your categories」、Essential spend の箱に8つ（緑のチェック）、Other spend に6つ、Save が紫 |
| 58 | W6 | Cleo | 89466e6b | — | 合う | 合う | 同じ見出しと文、Essential spend に5つ、Other spend に8つ、Save は灰（押す前） |
| 59 | W7 | Buddy | 05f44de1 | — | 合う | 合う | 「$500」、EXPENSE・INCOME・TRANSFER、「Category: Miscellaneous」、色の丸4つ（Income・Groceries・Gift・Telephone）と「Browse all categories」 |
| 60 | W8 | Copilot | f1778c3a | — | **一部合わない** | 合う | 画面は分類の一覧（$2,383 spent in Aug・ドーナツ・$1,705 total budget、分類ごとの額と棒と予算）。素案 2.14 ⑦の「科目を押すと、その月の仕訳の一覧（総勘定元帳の見え方）[W8]」の「押した後の一覧」はこの画面になく、MB2 の台帳の2枚目（e6fe4340、Other を開いた画面）にある。その画面は素案のリンクにも cites.tsv にもない |
| 61 | W9 | Cleo AI | a6d10794 | — | 合う | 合う | 「Are these all paychecks?」「If they're not, swipe them away」、札1枚（Deel Inc・+$2,106.62）、「This looks right」 |
| 62 | W10 | Xero | 85cdec88 | 開いた | **一部合わない** | 合う | Minor adjustment 6.75、赤字「Your adjustment is more than 1.00」、「USD 42.75 ✓ Totals match」、Reconcile は青。差を調整の行で埋めて確定できる（雑損の逃げ道、8章#3）は画面どおり。しかし素案が C3・2.5 悪い面(1)・7章#2 反対①・D2 で同じ画面に寄せる「差0でも**科目違い**はある」は画面にない（画面にあるのは科目の誤りでなく、差を調整の額で埋めたこと） |
| 63 | W10 | Xero | 2b57df0e | — | 合う | 合う | 36.00 USD の行を選び Split、3. の文、「Total is out by: 6.75」と灰色の Reconcile（差があると確定できない） |
| 64 | W10 | Xero | 722f15b0 | — | 合う | 合う | Adjustments の選びに「Bank fee」「Minor adjustment」、Reconcile は灰 |
| 65 | W10 | Xero | e194359a | — | 合う | 合う | Minor adjustment の空の入力欄とごみ箱、「Total is out by: 6.75」、Reconcile は灰 |
| 66 | W11 | Monarch | 00af44d3 | — | 合う | 合う | 「$300.00」と緑のチェック「$0.00 left to split」、橙の Save |
| 67 | W11 | Monarch | 31f30340 | — | 合う | 合う | 「$600.00」「$300.00 left to split」、Category Other Income、Save |
| 68 | W12 | Quicken | 3b699b56 | 開いた | 合う | 合う | 上端の帯「Left to Split ✓ $0.00」の下に、スクロールで切れた Groceries の行（帯が上に残る）。Split 2・Add Split・灰色の Add Left to Split・Continue |
| 69 | W13 | Copilot | 1ae4ac51 | — | **一部合わない** | 合う | 画面は分割の始め（1行目 $9.00 GROCERIES、2行目 灰色 $0.00 OTHER、+ add、SAVE、数字の盤）。素案 2.5・8章#2 の「Copilot の自動の合わせ（片方を入れると反対側を自動で埋める）[W13]」の「自動で減る」所は、この画面になく、MB2 の台帳の3・4枚目（ea307f13・b945aba6）にある。その画面は素案のリンク・cites.tsv にない |
| 70 | W15 | Monarch | bd4785a8 | — | 合う | 合う | 「This transaction has been split」と Salary +$600・+$300、黒い知らせ「2 split transactions created / Create a rule to do this automatically.」と CREATE |
| 71 | W16 | Mercury | b5b9a184 | — | 合う | 合う | 左に Banking／Books、右の取引の札に Transaction／Journal Entry のタブ（同じ取引を2つの見え方で）、表の Ledger account の列 |
| 72 | W17 | Cleo | 2b734396 | — | 合う | 合う | 「Swipe right if it's a bill you gotta keep」「Swipe left if it's something you might wanna ditch」、Netflix の札が右へ傾き「Keep」の印。流れの9枚目（大きな数は #73 の4枚目） |
| 73 | W17 | Cleo | 9d375a82 | — | 合う | 合う | 画面の大半を「YOU HAVE / $19 IN BILLS DUE BEFORE PAYDAY」の特大の字。上に自分の答え「bills ✨」と「They're no one's fault」の吹き出し |
| 74 | W17 | Cleo | 39d6b9d5 | — | 合う | 合う | Try this と左右の指示の吹き出し、Netflix $18.63 の札と左右の指の丸 |
| 75 | W18 | Google Photos | 812ba62d | 開いた | 合う | 合う | 写真の札が左へ傾き「Swipe left to delete」と手の印、右にごみ箱の丸、下にごみ箱とハートの押す札 |
| 76 | W18 | Google Photos | fe08f11d | — | 合う | 合う | 札が右へ傾き「Swipe right to keep」、左に赤いハートの丸 |
| 77 | W18 | Google Photos | 5774ee10 | — | 合う | 合う | 札がまっすぐ、下にごみ箱とハートの2つの押す札（同じ2択を押しても） |
| 78 | W19 | Quizlet | 5dacac8f | 開いた | 合う | 合う | 札が右へ傾き緑の枠、札の中に「Know」と薄い「ache」、左上の橙の「0」、下に「Swipe left to mark Still learning」。ノートの「+1 のように光る」は右上の緑の小札で、字は読めない（言い過ぎは「のように」で留めてある） |
| 79 | W19 | Quizlet | 80a4c6a5 | — | 合う | 合う | 「1 / 68」、左右の端に橙「0」と緑「0」、単語カード「ache」、「Swipe left to mark Still learning」 |
| 80 | W20 | mymind | 22fa4170 | — | 合う | 合う | 写真の札1枚、丸い札「Forget」「Keep」、橙の帯「Card deleted and moved to trash.」 |
| 81 | W23 | SiriusXM | a29d4250 | — | 合う | 合う | 「Press and drag an item to move it.」、持ち上げた CNN の行が影つきでずれる＝並べ替え。「12件」は MB2 の検索の数で、この画面からは確かめられない |
| 82 | W26 | Apple Wallet | 25fc692d | — | 合う | 合う | 緑の輪のチェック、「You Paid US$12.94」「…will be reflected in your balance within 24 hours.」 |
| 83 | W27 | Cleo | a822a300 | 開いた | 合う | 合う | X31 と同じ Cleo の FEBRUARY'S BREAKDOWN（In $326・Out $188 の硬貨の山、$1,274.87 until $1,463、$115.90 per day） |
| 84 | W28 | Mercury | 10e9460a | 開いた | 合う | 合う | 左の入り（MOBBIN PTE. LTD.・Amazon・Fi…）→「Money In」→「Expenses」→右の行き先（Refero・Uphold…）の帯の図、左に気づきの3項。金額は伏せ字 |
| 85 | W29 | Expensify | f5b4a2cc | — | 合う | 合う | Default Categories の表 GROUP・DESCRIPTION・CATEGORY（Airlines→Travel、Gas→Car…）。素案の「棚（札の束）」は表で、札の形ではない（決まりの一覧という型は合う） |
| 86 | W30 | Airwallex | 29b835da | — | **一部合わない** | 合う | View reimbursement：receipt.png と View receipt、Amount claimed・Transaction amount・date・Merchant、Line items (2)（Shipping fee 1.50・Mail stamp 1.00）、Total 2.50 SGD。根拠の欄の「証憑と行と合計」は合う。しかし 1.2 と 2.5-3 で同じ番号に寄せる「書類の値を押して拾う」は画面にない（見るだけの頁で、値を押す所はない） |
| 87 | W31 | Redfin | af24a9b8 | — | 合う | 合う | 「$311,318」、Debt-to-income ratio「41% ／ Stretch」、青緑→橙→赤のつまみ、「Exceeds recommended debt-to-income ratio.」の注意 |
| 88 | W32 | Monzo | a196ebe3 | — | 合う | 合う | 「25 Years £49,151.13 Projection」、Projection の線と薄い緑の Likely range の帯、Monthly Deposits のつまみ |
| 89 | W33 | Shopee | 75324601 | — | **一部合わない** | 合う | 「Rp25.000.000」のつまみ、Tenure の6択、「Monthly Repayment Rp2.570.833」（根拠の欄の「額と期間で月の返済」は合う）。2.10 の操作の文「『借りない』の札も同じ重さで出す [W33]」の「借りない」の札は画面になく、上に大きな「Cash Loan Up to Rp100.000.000」がある（借りる向きに寄せた画面） |
| 90 | W34 | Monzo | dee30ae9 | — | 合う | 合う | Compare：列に Free・Plus・Premium のカードの絵、行は×とチェック、Price の行 |
| 91 | W36 | Brilliant | 7df5c89a | — | 合う | 合う | 「2x+2=y+6」の両辺を長さの棒（x x 2／y 6）、x・y のつまみ、Check |
| 92 | W37 | Formula 1 | a8c724bd | — | 合う | 合う | Q10、YES 10 Pts／NO 15 Pts、「2X Apply Chip」、残り時間 03D:02H:41M。点・倍の札・残り時間は素案の言う【禁止の型】の部分として画面どおり |
| 93 | W38 | Wonder | d58fe905 | — | 合う | 合う | 見出しごとに「0/2」「0/1」、下に −1＋と「Add — $10.25」 |
| 94 | W39 | Chipotle | 0d630f70 | — | 合う | 合う | 上に大きな完成の絵（Build Your BURRITO）、PROTEIN OR VEGGIE の品の行、ADD TO BAG |
| 95 | W40 | Shopify | 5528f405 | — | 合う | 合う | 「Mobbin Spice Traders LLC → Shop location」の矢印、4行（Qty 50・$4.00・$200.00）、Cost summary Total $800.00、同じ頁に Terms None |
| 96 | W41 | Shopify | 78129b1d | — | **一部合わない** | 合う | Inventory：Black・Beige・Blue の行に −「100」＋。±は合う。素案 2.11 の根拠「[W41]（±と品切れ）」と悪い面の「Running Low」の札は、この画面になく、MB2 の台帳の2枚目（Thrive Market、c9a96ef6）にある。その画面は素案のリンク・cites.tsv にない |
| 97 | W42 | Xero | e838b7af | — | 合う | 合う | New Bill：From・Date・Due Date、行の列 Item・Description・Qty・Unit Price・**Account**・Amount（行ごとに科目の欄）、TOTAL 0.00、Approve |
| 98 | W43 | Google Arts & Culture | 5b3c4dd9 | — | 合う | 合う | 部屋の絵（Professor Sheldrake's Rooms）、2文「The room is empty. / Sheldrake isn't here.」、選択肢は1つだけ「Maybe Sheldrake left me something?」 |
| 99 | W44 | Revolut Business | 9a34e3c2 | — | 合う | 合う | Approve・Reject、Approvals 1 of 1 の時系列（Submitted for review→Owner Awaiting approval） |
| 100 | W45 | Gmail | d5187615 | — | 合う | 合う | 下の黒い帯「Message archived.」と「Undo」 |
| 101 | W46 | TheFork | 6869f280 | 開いた | 合う | 合う | 点数のピン（9.1・9.2・8.5・7.5・8.9・9.0）と「-50%」「-30%」の値下げの小札、中央でピンが重なり数が隠れる |
| 102 | W47 | Apple Maps | ef125d25 | — | 合う | 合う | 重なる所に数の丸「2」「3」、「Turtle Tower +2 more」 |
| 103 | W48 | DoorDash | ff560597 | — | 合う | 合う | 地図のピンを押した店の札（RT Rotisserie）、下に「31 people visited last week」 |
| 104 | W49 | Bump | 88393975 | — | 合う | 合う | 「Climb the leaderboard」、自分の行「Me +7.17 83.2% ▲」が浮き上がる、ほかの行に ▲▼ |
| 105 | W49 | Bump | 1b028e6a | — | 合う | 合う | corner の leader board「ranked by # of places visited」、1〜4位（767・762・750・702 visited）。実在の人との順位＝素案が禁止の型とする側の例 |
| 106 | W50 | Philips Hue | 8461968f | 開いた | 合う | 合う | 「Position your lights」、等角の部屋の床に黄色く光る丸、左下に金の枠の札「Light」 |
| 107 | W50 | Philips Hue | ec23b20f | — | 合う | 合う | 等角の白い部屋の断面、物に名札「Marcel Breuer / Model B46 chair」、下の丸い札と DONE。**cites.tsv と付録Aのアプリ名は「Philips Hue」だが、画面は Google Arts & Culture**（MB2 の台帳どおり。記録の誤り） |
| 108 | W51 | Finch | 7966062b | — | 合う | 合う | 通貨 2,159、「Finkea Furnishings」「50% OFF SALE 450」、店番の Robin の吹き出し、「Items refresh: 21:07:43」、品の札 500・900・500 |
| 109 | W52 | Cash App | d92c0617 | — | 合う | 合う | 緑のチェック、「Congrats on your first purchase of bitcoin on Cash App!」「You bought $1 of bitcoin」、紙吹雪 |
| 110 | Q1 | Finch | fe8eae1b | — | 合う | 合う | 「Cheep cheep, thanks for hatching me. If my name is Lee, what's your name?」と名前の欄（相手が名乗ってから聞く） |
| 111 | Q2 | Finch | 0b3973cb | — | 合う | 合う | 「What do you want to name your baby birb?」「You can change this later.」、Shuffle と Next |
| 112 | Q3 | Finch | 6ccd84e3 | — | 合う | 合う | 「Choose a trait for Lee」Resilience・Security・Logic の3択 |
| 113 | Q5 | Yazio | 528d7ee1 | — | 合う | 合う | 「Nice to meet you, Alex!」と両手を上げたキャラの全身 |
| 114 | Q7 | Duolingo | b8a54efb | — | 合う | 合う | 「Okay! Here's your first 2 minute lesson.」 |
| 115 | Q8 | Ahead | 2014db16 | — | 合う | 合う | キャラの「Let's put it into action!」と、これからやることの2行（Flip through…／Collect the ones…）、Let's go! |
| 116 | Q11 | Kit | efb78fab | 開いた | 合う | 合う | 上に部屋の絵と2人（黒い丸のキャラと帽子の男）、下に1行の吹き出し「I am! I earn money, but…」と緑の再生のボタン（送りの形） |
| 117 | Q11 | Kit | db053cc5 | — | 合う | 合う | 同じ部屋の絵、吹き出し「I can help you with that. Let's roll.」と緑の再生のボタン（絵は前の画面と同じで動いていない） |
| 118 | Q13 | Tolan | f1474ff0 | — | **一部合わない** | 合う | 部屋の絵の上に白い吹き出し5つと水色の返事1つ（計6つ）。素案 4.2-1 は「吹き出しは1画面3つまで [Q13]」と、6つ並ぶ画面を「3つまで」の根拠の位置に置く。MB3 の台帳では悪い面（多いと180字を超える）から出した上限で、画面は反例。素案はその読み方を書いていない |
| 119 | Q14 | Babbel | bb06ea68 | — | 合う | 合う | 会話の札と灰色の訳、新出の語「Dag」「Tot ziens」だけ四角の枠、Continue |
| 120 | Q15 | Duolingo ABC | 5b2d14ea | — | 合う | 合う | 熊と女の子、女の子の大きな吹き出し「I don't know. What?」（分からないを代弁） |
| 121 | Q16 | Brilliant | 68de0a71 | 開いた | 合う | 合う | 「Can you repeat the explanation?」→「which part wasn't clear? Was it why the truck needed to turn, or why turn left specifically?」と2択「Why turn at all」「Why turn left specifically」、下に自由入力の「How can I help?」 |
| 122 | Q17 | Duolingo | 81b520ac | — | 合う | 合う | Incorrect、Correct Answer の文で違う語「petit」だけ下線、EXPLAIN MY MISTAKE と GOT IT |
| 123 | Q18 | Duolingo | 26c5c998 | — | 合う | 合う | 「Replaced ~~son~~ → petit」、理由2行、同じ型の別の例2つ（un petit chat・une petite maison） |
| 124 | Q19 | Nibble | 93499943 | — | 合う | 合う | 4択の最後に「I don't know」、選んだ誤り（Expressionism）と正解の説明 |
| 125 | Q20 | Turo | b43fc9b9 | — | 合う | 合う | 「Please try again」…「You're partially correct」 |
| 126 | Q21 | Acorns | 4da72f80 | 開いた | **一部合わない** | **一部合わない** | 「Question 1 of 4」「Your Acorns Invest portfolio holds assets called」の下に札「mutual funds」が文末の位置に置かれる（文の途中の穴ではない）。付録Aの判定と同じ。なおこの札は誤答で、下に「The correct answer is ETFs」。ノートの image_seen「問いの文の途中に選んだ語…が埋まる」も画像と合わない（札は文の後ろ） |
| 127 | Q23 | Mimo | c63bc528 | — | 合う | 合う | 「Almost there!」「Make sure to pick h1」（場所だけを言う）、Skip と Try again |
| 128 | Q24 | Mimo | 433fb29c | 開いた | 合う | 合う | Browser のタブを開いた状態で、border の付いた「50% Discount Code」の枠（結果が対象の頁に出る）、「Great job! Let's keep it going.」 |
| 129 | Q25 | Mimo | 2d8d62b7 | — | 合う | 合う | Browser に縦の 1・2・3、「Almost there!」と課題の言い直し、紫の小さな「✦ Get help」と Try again。ヒントの入口は合う。「無料で3段」は画面になく PEDAGOGY 5 の決め（素案も括弧で PEDAGOGY を示しているので、画面の主張とは読まない） |
| 130 | Q28 | Brilliant | 7b63d513 | — | 合う | 合う | 「What state has about 125 cafes?」と5本の棒の図（図の上で答える）、Start over、Check |
| 131 | Q29 | Nibble | 7f33ea08 | — | 合う | 合う | 左右の札「Born developed」「Born helpless」の2択、Horse の札、上に「0★」、下に「0:45」の時計（時計と星＝禁止の型の部分） |
| 132 | Q30 | Deepstash | dd9df113 | — | 合う | 合う | 伏せた札「Tap to reveal the idea」、上に7分割の進み |
| 133 | Q31 | Forest | 9c79865b | — | 合う | 合う | 「1 — 2 — 3 — 木の印」、伏せた「?」の木、「Your Reward Awaits」「Complete challenges… and unlock a new tree.」、Reveal Your Tree |
| 134 | Q32 | Expensify | 991bedee | — | 合う | 合う | 「This exam is not timed…」「5 questions / …You can return to your earlier answers before submitting the exam.」、Start exam |
| 135 | Q33 | Apple News | 57fcc0a4 | 開いた | 合う | 合う | 上に番号つきの格子（1・2・3 に色、4〜8）、下に「1 ▸ Number of sides on a cube」と ‹ ›、左上の時計「00:01」。時計は経過時間で「残り時間」ではない（素案の残り時間の根拠には Q34 の「1:43」が当たる） |
| 136 | Q34 | Duolingo | faf99c88 | — | 合う | 合う | 進みの棒（5・10・20 の目盛り）と時計「1:43」、「Select the correct translation」、3択と CHECK |
| 137 | Q36 | Unity | 0fe586a8 | — | 合う | 合う | 「You got 3 of 5 correct」「4 of 5 to pass」と赤い棒、左の Question 1〜5 に緑・赤の点（格子が正誤の色） |
| 138 | Q37 | Quizlet | ed1ddb57 | — | 合う | 合う | 「You're learning!」、70% の輪と Correct 7・Incorrect 3、Next steps の2つ（Practice with Learn・Take a new test） |
| 139 | Q38 | Babbel | 00c43458 | — | 合う | 合う | 「Answered correctly: 3/4」、Incorrect の箱（Tot ziens!）と Correct の箱（goedemorgen・Hoi!・Dag!）。素案の「直した札／一度で正しかった札」は Incorrect／Correct を言い換えた設計（画面に「直した」はない） |
| 140 | Q39 | Khan Academy | 27314584 | — | 合う | 合う | LEVELED UP 4 skills・LEVELED DOWN 2 skills・NO CHANGE、技能ごとの↑↓、「4/6 correct · 550 energy pts」（energy pts は禁止の型） |
| 141 | Q43 | Cleo | 55459f0d | 開いた | 合う | 合う | 「Review streak 0」「For review 20」、Start review と鍵の付いた「Review on Tue 20」「Review on Fri 23」 |
| 142 | Q44 | Quizlet | f5c83f4d | — | 合う | 合う | X17 と同じ画面（条件の1行と 0・46・22） |
| 143 | Q47 | Fable | 97fe8772 | — | 合う | 合う | MILESTONE 1〜5 の日付つきの区切り（MAR 03 Kickoff、MAR 12、MAR 22、APR 01）と縦の線 |
| 144 | Q48 | CapWords | 43ae2042 | — | 合う | 合う | 「2 Day streak」、文に数を埋める「You learned 4 words In total with a 50% rate. Got it! 2 & Needs review 2」、暦 |
| 145 | Q49 | Finch | 83509751 | 開いた | 合う | 合う | リングで綴じた帳面「Lee's collection」、Micropets「1 / 60」、Food 2/114・Drinks 1/25・Books 1/52、「?」の影、上端に薄い「9 day streak / Longest self-care streak ever!」 |
| 146 | Q50 | Swarm | e3bb25f0 | — | 合う | 合う | Stickers：灰色の影の形の下に名前（1UP・7-10 Split…）、取ったものだけ色 |
| 147 | Q52 | Moonlitt | 58646e99 | — | 合う | 合う | 札に Dec 13・Waxing Gibbous・2 years ago、下に「South Jakarta」「Dec 13, 2024」「02:06 PM」（いつ・どこで）。「誰と」は画面にない |
| 148 | Q54 | How We Feel | 625b38aa | — | 合う | 合う | 感情の語の丸が並び、Eager を選ぶと下に1行「impatiently wanting to do or get something」（近い語との違いの1行） |
| 149 | Q56 | Mindvalley | f81f0d35 | — | 合う | 合う | Achievements：Recent（Calm Beginnings・Day One）と Streaks（Consistency Seed・Week Warrior・Fortnight Focus…）の印 |
| 150 | Q57 | Obsidian | e7c6977d | — | **一部合わない** | 合う | Graph view：5つの点（緑・赤・灰）と名前、細い線が2本ほど。2.19 で同じ番号に寄せる「主の線は太く副は細く、誤りの線は色」は画面になく（線は全部同じ細さ、色は点に付く）、MB3 の設計の足し分。「点と線のつながり」の型だけが画面にある |
| 151 | Q58 | Noom | 3ef3dce1 | — | 合う | 合う | Course Map「Your Noom learning journey」：済んだ所は実線、先は点線、丸い絵の節 |
| 152 | Q59 | Ahead | 1ae37391 | — | 合う | 合う | Ahead の地図の石1〜5（2が紫）、右上に炎「1」、左上「5%」。素案 2.15 は「Ahead・Mimo の道は炎・％と一緒 [X10][Q59]」と書くが、Q59 も Ahead で Mimo ではない（アプリ名の誤り） |
| 153 | Q63 | Finch | 7aa235cf | — | 合う | 合う | 「PAUSED / Productivity」、「Feeling ready to jump back in?」と Resume area、「This area is now paused - take a break and come back anytime!」 |
| 154 | Q64 | Brink | 442d1c66 | — | 合う | 合う | 「Continue Listening / Continue from where you left off.」、前回の要約の3行と「Playing 18 min left」の1つのボタン |
| 155 | Q67 | Life Reset | d6179aa1 | — | 合う | 合う | Settings の Account に「Last backup: 9 Jun 2026, 11:12」と Sync（書き出し・読み込みの別の項目は画面にない） |
| 156 | Q68 | Breathwrk | 9ca8e991 | — | **一部合わない** | **一部合わない** | Customization：音の種類（Sine・Synth・Bowl・Off）、Vibration On/Off、Voice Guide（Lexi・Max・Off）。2.23 の「音・声」は合う。しかし 4.4 の「強さ3段（控えめ・ふつう・派手）は設定で選ぶ [Q68]」の**強さの段**は画面になく、あるのは種類の選択とオン・オフ。ノートの image_seen の末尾「演出の強さ・音・声を自分で選ぶ」の「強さ」は画像にない |
| 157 | Q69 | Quizlet | b26c98e9 | — | 合う | 合う | Game options：Asteroid speed「Normal」、Number of answers、Game duration「60s」（速さ・時間を本人が選ぶ） |
| 158 | Q70 | Eventbrite | d1cca038 | — | 合う | 合う | 「You got here first.」と POPULATION 0 の看板の冗談の絵、Add your crew |
| 159 | Q74 | Notion | 5b76071b | — | 合う | 合う | To Do List の項目そのものが使い方（Check the box to mark items as do…、Click the due date to change it…） |
| 160 | Q77 | Brilliant | 6a699da6 | — | 合う | 合う | Nightly ritual を選ぶと先生役がマグカップの姿になり「Source code by starlight. Sounds dreamy.」 |
| 161 | Q77 | Brilliant | d19406b0 | — | 合う | 合う | 「Sign up for free to discover your learning path」、林檎・Google・email（登録が課題の前） |
| 162 | Q78 | Brilliant | 168b1c76 | 開いた | 合う | **一部合わない** | 「You exercised an important coding skill: using the right commands in the right order.」「In this course, you'll learn to use loops, logic, and variables…」とコードの見本・格子の道。素案の書き直し（loops などは予告、順だけが合う）は画面どおり。ノートの末尾「やったことに後から名前を付ける」は画面から言えない（付録Aの通り） |
| 163 | Q78 | Brilliant | 26456629 | — | 合う | 合う | 地図の絵に車と経路、札 drive forward・turn right、「Writing Programs」「Programs are instructions. You already know how to write them — let's prove it.」（素案の引く扉の文どおり） |
| 164 | Q78 | Brilliant | 0806e864 | — | 合う | 合う | 「Tap the blocks to write a program…」、島の町の地図、番号つきの欄 1 turn left・2 drive forward と札の候補（地図の上で札を置く） |
| 165 | Q78 | Brilliant | 82e01d81 | — | 合う | 合う | 番号つきの欄 drive forward・drive forward・turn right・空の4、黄色い帯「Not quite.」と Get help・Try again |
| 166 | Q78 | Brilliant | b7c9a698 | — | 合う | 合う | 「Drag to reorder the program commands.」、紺の格子の盤、番号つきの札3つ（ドラッグは並べ替え：C12 の向きと合う） |
| 167 | Q79 | Headspace | 50164305 | 開いた | 合う | 合う | 「PART 1 · SESSION 1 / Easing in」、済んだ札が緑一面の「✓ Completed」、次の札「Finding Deeper Motivation」（Video・5 min）が大きく、再生のボタン |
| 168 | Q79 | Headspace | d99e1da1 | — | 合う | 合う | 「Today's Action / Don't forget why you started」と書き留める行動の文、動画の再生中 |
| 169 | Q79 | Headspace | 6ec55816 | — | 合う | 合う | 「Finding Your Best Sleep」18 sessions、Part 1〜3 の札、Start Today（Part・Session の構造） |
| 170 | Q80 | Speak | 16fe98e3 | 開いた | 合う | 合う | 「Section 1: Warm-up」、区切り線「QUESTION 1/9」「QUESTION 2/9」、相手が先に「Bonjour ! Moi, c'est Philippe.」、文字を隠す目の印、絵はない |
| 171 | Q80 | Speak | 4a2727b7 | — | 合う | 合う | 同じ相手の1文と「Say, "Nice to meet you!"」、読み込みの輪 |
| 172 | Q80 | Speak | 67805405 | — | 合う | 合う | 同じ1文と「Speak now...」、マイクの丸と×・キーボード |
| 173 | Q81 | Splitwise | 7499140f | — | 合う | 合う | 「What do these terms mean?」と用語の定義の一覧（Total spent = …、Your share = …） |
| 174 | Q83 | Nibble | 573f7362 | — | 合う | 合う | 黄と青のブロックの「Company」の一部に吹き出し「Stock — a piece of ownership」 |
| 175 | M1 | Duolingo | fbbbcbd0 | 開いた | 合う | 合う | 店を真上から見た部屋（水槽・厨房のカウンターと熊の店員・席・植木・橙の服の客と口ひげの男）、数の帯はない、「！」はない。素案が今この画面に寄せる「真上から見た部屋・数の帯がない」は合う。**ノートはすでに訂正済み**（コミット 7b44cf0 で「『！』があるのは同じ流れの c775292b」と書き換え）で、付録Aの「ノートは『！』と書く」は今のノートと合わない。**c775292b の原寸には橙の服の客の頭に白い吹き出しの「！」がある**（判定役が開いて確かめた）。素案 2.2・11章の「人物に印を付ける型は別に探す必要がある／足りない」は、取得済みの画面で満たせる |
| 176 | M2 | Duolingo | 84d6004b | — | 合う | 合う | 客の上に青い名前の札「LUCIE」と吹き出し「Je voudrais de l'eau.」 |
| 177 | M7 | Forest | 469aaab7 | — | 合う | 合う | 斜め上から見た四角い芝の島に木、Day・Week・Month・Year、月ごとの棒 |
| 178 | M8 | Premier League | 6e9ad774 | — | 合う | 合う | 上に Bank「£6.1m」と桃色の Undo、ピッチの選手と値段 |
| 179 | M11 | CHOPT | d2af9ba5 | — | 合う | 合う | 「GREENS / Select up to 2」、選んだ2枚に −1＋、下に「$10.88 — 340 cal」と I'M DONE |
| 180 | M12 | Duolingo ほか | 5966689f | — | 合う | **一部合わない** | Duolingo「The top 8 move up to the next league.」、PROMOTION ZONE、自分の行（9位 Alex Smith）だけ灰、XP。ノートは4つのアプリ（Mimo・Brilliant・Speak）の画面をまとめた同じ文で、この画像にない物を含む（付録Aの備考の通り） |
| 181 | M12 | Duolingo ほか | 41baf926 | — | 合う | **一部合わない** | Mimo の Weekly Leaderboard（Wooden League・6d 13h 50m・PROMOTION ZONE・XP）。この画面では自分の行の色の区別は見えない。ノートは #180 と同じ4画面まとめの文 |
| 182 | M13 | Spotify ほか | 02228791 | — | 合う | **一部合わない** | Spotify「You listened to 12 albums this year.」「Long live the album.」と円盤の模様。ノートは4画面（Oura・How We Feel・Goodreads）まとめの文で、この画像にない物を含む |
| 183 | M14 | Cleo | 3c9e2d5d | — | 合う | 合う | Score Simulator「Drag the slider to see what each score means」、「800-850 out of 850」、つまみと Drag me、下の2つの結果（4.7%・2.4%） |
