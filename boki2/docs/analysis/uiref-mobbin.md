# Mobbin で探した「シムゲームで参考になりそうな UI・UX」（BIZ-UIREF の追加・第1回）

2026-11-02、取りまとめ役。オーナーの依頼の原文：「Mobbin接続したから、Simgameで参考になりそうなUI/UX探してきて。」

**取り方**：オーナーが claude.ai のコネクタで接続した Mobbin の公式の MCP（search_screens・search_flows）で探し、**結果の image_url（原寸の画像）を research-fetch で取得した**（取得元 `mobbin-mcp`、集合 `screens`、doc は画面の id。オーナーの指示「research-fetchの記録には残せよ。テキストだけ見てもわからんだろ」）。取得は50枚：下の表で引いた画面21枚と、Duolingo の流れ2本の全画面29枚。画像は `research/raw/mobbin-mcp/screens/<id>.jpg`（git には入らない）、取得記録は `research/ledger.jsonl`、見た所は読了ノート `research/notes/mobbin-mcp/screens/<id>.md` の image_seen。research-check エラー0。Mobbin の頁（mobbin.com/screens/…）は取っていない（規約。MCP の image_url だけ）。流れの29枚は、番号を付けた一覧の画像にして全部を見た。

**この文書は、書いた本人以外の判定・論証の検査をまだ受けていない**（QUALITY 2.3・5章）。BIZ-UIREF に入れる前に受ける。

## 0. 要点

1. **Mobbin には本物の経営シム・街づくり・飲食の経営ゲームが載っていない**。「city building game」「restaurant tycoon game shop upgrade screen」で探しても、出るのはゲームの手触りを持つアプリ（Duolingo・Tolan・BitePal・Forest）と課金の画面だった。Mobbin はアプリの画面の集まりで、ゲームは載せていないと見られる【推論：2つの問いの結果から。Mobbin の収録方針の文は読んでいない】
2. その代わり、**シムの部品を持つアプリ**は多い。我々の画面に一番近いのは **Duolingo のレストランの役割演技**：上から見た店の部屋に、客が「！」を出して座り、近づくと吹き出しで注文を言い（音声つき）、終わると「Well done!」の札で返る。店の断面（BIZ-UIREF 3章）と、取引を人の吹き出しで出す案（B-E37 の大胆な写し方）の両方の実物
3. 作戦の机・一杯の組み立てには、**予算の中で札を置くファンタジースポーツ**（Premier League の Create Team：ピッチに値段つきの選手の札、上に残りの予算「Bank」、取り消す・保存）と、**上限つきで具を選ぶ注文**（CHOPT：「2つまで」、選ぶと下の合計が変わる）が近い
4. 順位（P9）は、**リーグの昇格の帯**（Duolingo・Mimo・Brilliant・Speak・Uxcel）がどれも同じ型：自分の行だけ色、昇格の帯の線、残り時間。ただし PEDAGOGY 1.8 と BIZ-UIREF K10（量への報酬は写さない）に照らすと、**ライバル店との比べに使う形だけ**を写す
5. 月の結果・決算（⑤）には、**1画面に1つの大きな数を出す振り返り**（Spotify・Oura・How We Feel・Goodreads の年の振り返り）が近い

## 1. 見た画面と写し方

番号は M1〜。「見た所」は MCP が返した縮小の画面を取りまとめ役が見て書いた。

| # | アプリ・画面 | Mobbin | 見た所 | 我々のどこへ（BIZ-UIREF の画面・段） | 最小の写し方 | 大胆な写し方 | 悪い面 |
|---|---|---|---|---|---|---|---|
| M1 | Duolingo レストランの部屋 | [画面](https://mobbin.com/screens/fbbbcbd0-e31f-414d-8847-a7a8037e34f0) | 真上から見た店：左に席と植木、右上に厨房のカウンターと熊の店員、床は水色と白の格子、客（橙の服）の頭に「！」の吹き出し。左上に×だけで、数字の帯がない | 店の断面（3章 店）、プロローグの屋台 ① | 開店の前・月の途中の画面の上半分に、店を真上から見た絵を1枚置き、出来事のある客に「！」 | 店の画面を「部屋の絵＋人の印」にし、押した客・業者から書類（取引）が出る | 絵の作り手の量。部屋を描くと席の数・客の数が経営の数と食い違って見える恐れ |
| M2 | Duolingo 客の吹き出し | [画面](https://mobbin.com/screens/84d6004b-67bb-4679-a6c1-d757e5ffb668) | 客の上に名前の札「LUCIE」と白い吹き出し（スピーカーの印つきで1文）、右端に青い→ | 出来事の書類 ②、会話（3章 会話） | 月の書類の前に、相手（大家・問屋・客）が1文で言う吹き出しを出す（「家賃、今月分お願いします」） | 取引を全部「人の1文→書類→仕訳」の順で出す（B-E37 の大胆と同じ向き） | 1文が長いと読ませる紙芝居に戻る |
| M3 | Duolingo 場面の札 | [画面](https://mobbin.com/screens/553a92d5-9b6c-425d-bc1c-a34819b80c40)・[画面](https://mobbin.com/screens/715f478b-6353-4a99-a079-1500411d0245) | 店の絵の上の白い札に、太字の題「Dine at a restaurant」と2行の状況、青い横長の「START／CONTINUE」 | 月の始まり・出来事の入口 ② | 月の始まりに「題1行＋状況2行＋始める」の札を店の絵の上に | 1か月を「場面」の並びにし、各場面を札で始める | 毎回出ると待ちになる（BIZ-UIREF 7章 うまくいかない1） |
| M4 | Duolingo 役割演技の流れ | [流れ](https://mobbin.com/flows/48c160b8-818a-44d4-99eb-7cb23a1f7593)（19画面）・[流れ](https://mobbin.com/flows/f11cb8ed-1645-40fa-a92c-1f7edc667fe7) | 復習の一覧→場面の札→相手の大写しと吹き出し（翻訳の切り替え）→答える欄→「Well done!」の札（選んだ料理を文で返す）→道の画面に戻ると星が付く | 1か月の流れ（書類→記帳→結果）、ふりかえり | 結果の札に「何を選んだか」を1文で返す（「家賃を地代家賃で記帳したね」） | 月を「場面→相手の1文→記帳→相手の返事→道の星」の型でそろえる | 流れが長い（19画面）。毎月だと飽きる |
| M5 | Duolingo 冒険の完了 | [流れ](https://mobbin.com/flows/4b193860-04e6-4695-8f97-bf64c55cdbc6)の最後 | 大きなキャラの絵、黄色の太字「Adventure complete!」、3つの色の札（XP・PERFECT 100%・時間）、青い横長のボタン | 月の締め・月報 ⑤ | 締めの画面に「売上・誤りなし・時間」の3つの札 | 締めの絵に、その月の店の出来（客の顔）を出す | XP・時間は量への報酬（K10）。写すのは札の並びだけ |
| M6 | Duolingo ABC の建物の段 | [画面](https://mobbin.com/screens/e88bf64e-3111-45e1-b369-35ca240ec572) | 桃色の空に、通りに並ぶ建物（郵便局）とフクロウの飛行船、下に「LEVEL 5」 | 1年の進み・店が育つ見せ方 | 年の区切りに、店の外観の絵が1段ずつ変わる | 町の通りを横に送ると、自店とライバルの店の外観が並ぶ | 子ども向けの作風（Duolingo ABC は幼児向け）。中高生には幼く見える恐れ |
| M7 | Forest の島 | [画面](https://mobbin.com/screens/469aaab7-e1db-425f-910e-f6177854e699)・[画面](https://mobbin.com/screens/c191e256-3685-4721-9258-f24331459546) | 斜め上から見た四角い芝の島（等角）に木が生える。下に月ごとの棒グラフ、上に日・週・月・年の切り替え | 町の形（BIZ-UIREF 18章 問4 の (b)）、年のふりかえり | 町のタブに、回さない等角の小さな区画を1枚 | 町を等角の区画にし、月ごとに建物・客が増える。下に月の棒 | 等角の読み取りの誤り（Tversky）。区画が増えると小さくなる |
| M8 | Premier League の Create Team | [画面](https://mobbin.com/screens/6e9ad774-96bb-4ef4-b48c-92dac0bd4712) | 芝のピッチの上に、ユニフォームの絵と名前と値段（£5.7 など）の札を並べる。上に「Squad is complete」の帯、チーム名と残りの予算「Bank £6.1m」、桃色の「Undo」。下に「Confirm team」と「Save」 | 作戦の机（3章）、仕訳の札を盤に置く ③ | 作戦の机の上に「残りのお金」を常に出し、取り消すを置く | 作戦の机を「店の断面の盤に、値段つきの札（人・看板・問屋）を置く」形にする。置くと残りのお金が減る | 札が多いと小さくなる（ピッチは15枚）。スマホで置く操作が細かい（R の動く的・小さな物の不満） |
| M9 | Premier League の移籍の表 | [画面](https://mobbin.com/screens/eb934fd4-6628-42d9-8625-76bf75dfa19f) | 「Squad／List」の切り替え、上に無料の移籍・費用・残りの予算の4つの札、選手の行に調子・今の値段・売値・買値 | 作戦の机の一覧の形 | 盤と一覧を切り替えられるようにする（盤で見て、一覧で比べる） | — | 数字の列が多く業務の表に見える |
| M10 | F1 Fantasy の上限 | [画面](https://mobbin.com/screens/4c8516fb-cdaa-4c6f-8fe3-c1ecd5204bb8) | 上に「Cost Cap: $29.9M」と緑の棒、ドライバーの行に写真・選ばれた割合・点・値段と値の上下の矢印（赤・青）、右に＋ | 問屋・仕入れの選択、上部の帯の「目安まで」 | 選択肢の値段の横に、先月からの上下の小さな矢印 | 仕入れを「上限の棒が減っていく」形で選ぶ | 値の上下が気になり、学びの画面が相場の画面になる |
| M11 | CHOPT の具の選択 | [画面](https://mobbin.com/screens/d2af9ba5-6394-44ed-8053-178bd8953fd8) | 上に「Select up to 2」、横に送る種類の札（DRESSING など）、写真の丸と名前とカロリー・値段の札、選ぶと黄色になり −1＋。下に合計「$10.88 — 340 cal」と「I'M DONE」 | 一杯の組み立て（3章 一杯） | 具の札に「上限◯つまで」と、下に「原価の合計」を出す | 一杯の組み立てを、具の札を選ぶと丼の絵に具が載り、下の原価と売値の差（もうけ）が動く形に | 写真の具は作れない（絵で代える）。合計が数字だけだと業務の注文画面に見える |
| M12 | Duolingo・Mimo・Brilliant・Speak・Uxcel のリーグ | [Duolingo](https://mobbin.com/screens/5966689f-bae2-476e-8afd-57402080775b)・[Mimo](https://mobbin.com/screens/41baf926-b205-4c33-8f99-0d3b984fe904)・[Brilliant](https://mobbin.com/screens/c9a09869-e553-41c9-a821-da36b1404ac9)・[Speak](https://mobbin.com/screens/ccff3aa3-6a95-4103-93b6-3b7ec861eaa0) | 上に段の盾（鍵の付いた次の段）と残り時間、緑の「PROMOTION ZONE」の線、自分の行だけ色（緑・水色）、各行に丸い顔と点 | ライバルと順位（P9） | ライバル店の一覧で、自店の行だけ色を付け、上位との差を1つの数で | 町の「売上の順位」を月ごとに出し、上がった・下がったの矢印 | 量への報酬・せかす（K10、PEDAGOGY 1.8）。他人と競う形は写さない。写すのは「自分の行だけ色」と「差を1つの数で」 |
| M13 | 振り返りの物語（Spotify・Oura・How We Feel・Goodreads） | [Spotify](https://mobbin.com/screens/02228791-9019-41a0-92bc-8f00ce5ba1b5)・[Oura](https://mobbin.com/screens/dbb43eef-653a-4b26-a886-ce7504b8be98)・[How We Feel](https://mobbin.com/screens/060d6644-87d1-4497-833d-8bbf011eee25)・[Goodreads](https://mobbin.com/screens/2aa78a42-966e-43c2-bd75-171b90280565) | 1画面に1つの大きな数と1行（「You took 920,649 steps」「That's like walking 689 km」）、上に進みの線、How We Feel は大きな「10」に色の形が散る | 決算（1年の締め）・月報 ⑤ | 決算の前に「今年の売上」「一番売れた月」を1画面1つで3〜5枚 | 決算の振り返りを物語にし、最後の1枚で貸借対照表が組み上がる | 毎月だと長い。決算の年1回だけにする |
| M14 | Cleo の点数のシミュレーター | [画面](https://mobbin.com/screens/3c9e2d5d-1521-4aec-a6ac-46d21d511ed8) | 紫の札に「Score Simulator」「Drag the slider to see what each score means」、大きな「800-850」、つまみ「Drag me」、下に2つの結果（住宅ローンの利率 4.7%・車 2.4%） | 判断の予告（作戦の机の値段・人数） | 値段の選択に、選ぶ前の試算（客数・もうけの幅）を出す（いまも試算の幅はある：README-autoplay） | 値段をつまみで動かすと、客の数の絵ともうけの数が動く | 試算が正確だと判断の手ごたえが消える（運の幅を残す） |
| M15 | BitePal の着せ替え | [画面](https://mobbin.com/screens/3e7ff7e7-6f80-423d-b078-db43ac597b69) | 上半分に大きなアライグマの絵と名前・ハート・コイン、下に帽子などの札と値段のコイン | 店の飾り（看板・暖簾・器） | — | 看板・暖簾を選ぶと店の絵が変わる（BIZ-UIREF A14 と同じ向き） | 課金の店の形に寄る |
| M16 | Duolingo ロールプレイのふりかえり | [流れ](https://mobbin.com/flows/48c160b8-818a-44d4-99eb-7cb23a1f7593) 16・17枚目 | 白地に「Review your Roleplay feedback」、水色の KEY TAKEAWAY と要点2行、文法の形を水色の枠で。下に会話を並べ直し、自分の答えごとに緑の「Great ✓」と理由1行、または紫の「Revision」と直した文（直した所に下線）と理由1行、親指の上下 | ふりかえり（BIZ-UIREF 3章）、1枚ずつ直す（P4）、段⑤ | 月の締めのふりかえりで、その月の仕訳を並べ直し、1枚ずつ「よい」か「直し」（正しい札と理由1行）を付ける | ふりかえりの頭に「今月の要点」1つ（例：前払いは資産）を枠で出し、各仕訳の直しに下線 | 毎月全部を並べると長い。誤りの所だけにする手も |
| M17 | Duolingo 答えの候補の札 | 同じ流れ 12・13枚目 | キーボードの上に、小さな英語の意味の下に語の札が横に並ぶ（Je veux・un verre・un sandwich）。1つ選ぶと次の候補に変わる | 問いの手がかり（P2）、札の候補 ③ | 仕訳の札の候補を、科目名の上に小さな日常語（「もっているもの」）を添えて並べる（DESIGN-JOURNAL-UX の日常語の見出しと同じ向き） | — | 候補が答えを教えすぎる（候補の数を絞るか、まちがいの札も混ぜる） |
| M18 | Duolingo 店の中の成功の光 | [流れ](https://mobbin.com/flows/4b193860-04e6-4695-8f97-bf64c55cdbc6) 11枚目 | 会話が終わると、客の席の所で緑の光の十字と短い線が弾ける。画面の外の札ではなく、店の絵の中の場所で光る | 手ごたえの動き（P1・P6）、反映の見え方（P3） | 仕訳が正しく入ったとき、店の絵の該当の場所（レジ・倉庫・看板）が短く光る | 取引の相手（客・業者）の所で光り、そこから帳簿の棚へ数が飛ぶ | くり返すと待ち（短く・飛ばせる・止めない：BIZ-UIREF 18章 問2・問3） |
| M19 | Duolingo ロールプレイの結果 | 同じ流れ 18枚目 | 黒地に相手の丸い絵と光の輪、星3つ、札2つ（WORDS USED 13 と緑の NEW RECORD、XP EARNED 30） | 月の結果 ⑤ | 月の結果に「使った科目の数」と「はじめて使った科目」の印 | — | XP・記録は量への報酬（K10）。写すのは「はじめて使った」の印だけ |
## 2. 探して見つからなかったもの（障害）

- 本物の経営シム（Coffee Inc 2・カイロソフト・Good Pizza・Two Point など）の画面は Mobbin にない【推論：2つの問いで出なかった】。BIZ-UIREF の担当 B は、これらを App Store・Google Play の掲載画面と作り手の記事で見ている（uiref-B-gameui.md）
- 動きは見ていない（MCP は静止画の縮小だけ）

## 3. やっていないこと

- 原寸の画像は research-fetch で取ったが、表の21枚は検索のときに見た縮小と同じ画面であることを確かめただけで、原寸を1枚ずつ開き直してはいない。流れの29枚は原寸から作った一覧で見た
- 流れ（search_flows）は Duolingo の役割演技の1問だけ（その2本は全画面を取得して見た）。ほかの流れ（作戦の机に近い「選ぶ→確かめる→決める」など）は探していない
- web（PC）の画面は探していない
- 書いた本人以外の判定・論証の検査は受けていない
- BIZ-UIREF への反映はしていない

## 4. 検索の記録

| # | 種類 | 問い | 結果のアプリ |
|---|---|---|---|
| 1 | screens deep | simulation game home screen with business management and currency | Duolingo, Forest, Life Reset, Cleo AI, Formula 1, Blackbird, Premier League, LinkedIn, GoHenry, SHEIN |
| 2 | screens standard | city building game | Tolan, LinkedIn, Duolingo ABC, Nibble, Duolingo, 7-Eleven, The Atlantic, Vipps |
| 3 | screens standard | restaurant tycoon game shop upgrade screen | BitePal, Tolan, Chick-fil-A, Yubo, Fiverr, Agoda, Crouton, Coffee Meets Bagel |
| 4 | screens deep | Duolingo character scene inside a shop or cafe room | Duolingo ×6 |
| 5 | screens deep | isometric world that grows as you progress, habit or pet app | Tolan, Forest, Duolingo, QUITTR, 7-Eleven, Vocabulary |
| 6 | flows | Duolingo restaurant role-play conversation | Duolingo（Roleplay 3画面、Completing a game lesson 12画面、Completing a roleplay lesson 19画面） |
| 7 | screens deep | fantasy sports team picker with remaining budget | Premier League, Formula 1, FotMob, Public, CHOPT, Shop |
| 8 | screens deep | weekly league leaderboard with promotion and demotion zones | Mimo, Duolingo, Uxcel Go, Life Reset, Brilliant, Speak |
| 9 | screens deep | monthly recap story with big numbers and celebration | Spotify, Oura, How We Feel, Runna, Goodreads, Pool |
