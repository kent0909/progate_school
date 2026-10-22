# 経営シム・研修ゲームの「判断と需要のモデル」の作り方（BIZ-SIMDESIGN）

版：0.1（2026-10-22）。書き手：調べもの担当（経営シム・研修ゲームの判断と需要の設計）。読み手：ピヨ商店に「売上が動く経営の意思決定」を足す設計者・実装者。
読んだ資料：**38本**（この調べもので新たに取得して読んだもの。取得元19か所）。ほかに、前の調べもので読まれた既存のノート7本を引いた。読了ノートは `boki2/research/notes/web/simgames/r4-sim-*.md` と `boki2/research/notes/web/learnsci/r4-sim-*.md`。`node boki2/tools/research-check.js` で自分のノートのエラーが0であることを確かめた。
取れなかった資料：ABSEL の論文誌サイト（Gold/Pray の需要モデル）は保守中で読めなかった。Game*Spark の Big Ambitions の開発者インタビューは 503 だった（どちらも skip として記録した）。

**印**：【資料なし】＝一次資料に当たれなかったもので、根拠に使わない。【推測】＝資料から筋道を立てて置いた案（ゲームの式や初期値の案はほぼこれ）。【要確認】＝試遊か数字で確かめる必要があるもの。
**出典の質**：開発者本人のブログ・事後検証・講演の要旨・公式の資料・ソース（一次）＞取材記事の発言（一次に近い）＞開発者の寄稿の論考（査読なし）＞Wikipedia（概要の確認だけ）。

---

## 0. 要点（ここだけ読めば設計に入れる）

1. **2回目の検査で判断が「正解が1つの二択」に偏ったのは、結果が金額の一本の物差しで見え、どの状況でも同じ手が勝ったから**。This War of Mine の開発者は「結果がはっきり見える選択では誰もが得な方を選ぶ」と言っている [[web:simgames:r4-sim-gd-thiswarofmine]]。Sid Meier は「いつも1つ目を選ぶなら判断ではない」「良い判断は状況で答えが変わる」と言い [[web:simgames:r4-sim-gd-meier2012]]、Soren Johnson は「どんな条件でも勝つ戦略は、他の選択肢を全部悪手にして選択を奪う」と言う [[web:simgames:r4-sim-soren-waterfinds]]。直し方は、**結果を複数の物差し（現金・評判・在庫・人・取引先との関係・先の危険）に分けて返し、効く手が季節・年・競合の動きで入れ替わるようにすること**。
2. **需要の式の骨組みは Lemonade Stand（1979）でほぼ足りる**：基本の客数（値段で非対称に減る）×(1＋宣伝の効果、逓減)×天気の倍率、売上は需要と仕込みの小さい方 [[web:simgames:r4-sim-lemonade-apple1979]]。ここに評判（遅れて返る）、季節、競合のシェアを足す（10章）。
3. **乱数は「予兆→備え→結果」の組でだけ使う**。原作の Lemonade Stand は予報（雨の確率）を見せてから判断させ、雷雨は曇りの日にしか起きない。派生作は予告のない値上がりと備えようのない事故を入れ、式の穴（ぼったくるほど売れる）まで残した [[web:simgames:r4-sim-lemonade-ts2068]]。Into the Breach は敵の攻撃を全部前もって見せ、「やられたのは自分のせい」と感じさせた [[web:simgames:r4-sim-gd-intothebreach]]。
4. **分岐を多く見せつつ組み合わせ爆発を抑える型は「状態の値＋出来事の山札」**（storylet）。判断が状態（現金・評判・信用…）を変え、出来事は状態を条件に山札から出る [[web:simgames:r4-sim-emshort-storylets]] [[web:simgames:r4-sim-kreminski-storylets2018]]。80 Days は月をまたいで持ち越す値を6つに絞り、出来事を都市ごとの閉じた挿話にしたので、100都市まで書き足しても破綻しなかった [[web:simgames:r4-sim-gd-80days-postmortem]]。
5. **Reigns は「状態で確率が変わる山札」**：平穏なら大きな山、危機なら小さな山、1枚に絞れば一本道の筋も作れる [[web:simgames:r4-sim-gamingtrend-reigns]]。ピヨ商店の決算のような必ず通る場面も、自由な月も、同じ仕組みで作れる。
6. **全ルートの検算は、手で道を数えずに、無作為な判断の組で数千回の通し試験を回す**（Emily Short の提案 [[web:simgames:r4-sim-emshort-beyondbranching]]）。80 Days を救ったのは「保存データに全判断の履歴を入れておいたこと」だった [[web:simgames:r4-sim-gd-80days-postmortem]]。
7. **事故は「傷つけるが殺さない」**：RimWorld の語り手は、資金が尽きかけると手をゆるめ、負けを長い下り坂として見せる [[web:simgames:r4-sim-gd-rimworld]]。RollerCoaster Tycoon は、設備の「調子」が年数で速く落ち、点検の間隔をプレイヤーが選べ、最悪の故障は「古い・手入れが悪い・雨」の条件がそろうときにしか起きない [[web:simgames:r4-sim-openrct2-ride]]。Frostpunk は発電機の故障を何度も通知で前振りした [[web:simgames:r4-sim-inven-frostpunk]]。
8. **設備投資の危険は Markstrat の研究開発の型がそのまま使える**：必要な予算は隠れた値で、出し足りなければ完成せず「あといくら」と返り、出しすぎた分は戻らない。見積り（実現可能性の調査）は有料で1期かかる [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]] [[web:simgames:r4-sim-markstrat-projectbasecost]]。工期の遅れ・上振れ・途中でやめた分の損（建設仮勘定）と、2級の論点がそのまま結びつく。
9. **競合は少数のつまみで性格を作り（元手・出店の攻撃性・値付けの攻撃性・得意分野・途中で戦略を変えるか）、条件がそろわない種類の競合は現れない** [[web:simgames:r4-sim-capilab-competitors]] [[web:simgames:r4-sim-capilab-improvedai]]。買収は Offworld の「子会社（自動経営）にして持ち分で利益を受ける」形が、管理の負担と雪だるまを同時に防ぐ [[web:simgames:r4-sim-soren-otc-stockmarket]]。連結会計の入口にもなる。
10. **判断の結果は月末に短い振り返りで閉じる**。経営ゲームの振り返り（Kolb の4段）で、学びの自己評価が平均 d=0.45 上がった準実験がある（自己申告なので弱い根拠）[[web:learnsci:r4-sim-bbr2018-debriefing]]。

---

## 1. 作品ごとの分析（需要の式・判断・見せ方・返り）

| 作品 | 需要・結果の式 | 判断 | 見せ方 | 返り | 出典 |
|---|---|---|---|---|---|
| **Lemonade Stand（MECC 1973／Apple II 1979）** | 値段10セント未満は直線（0セントで54人→10セント近くで30人）、10セント以上は30×(10/値段)²。看板の効果 1−e^(−0.5×枚数) を掛けて最大2倍。天気の倍率（猛暑2倍、曇りは雨の確率の分減る）。売上＝min(需要, 作った杯数)。需要そのものに乱数なし | 杯数・看板の枚数・値段の3つ（毎日） | 判断の前に天気予報（晴れ40%・曇り30%・猛暑30%、曇りは雨の確率の数字つき）。原価の値上がりは日付で決まり、文で予告 | 毎日の決算表（売れた数・収入・費用・利益・資産）。倒産あり。事件：曇りの日の4分の1で雷雨（売上ゼロ）、晴れの日の4分の1で道路工事（客1割か全部売り切れ） | [[web:simgames:r4-sim-lemonade-apple1979]] |
| Lemonade Stand（TS2068 派生、1984） | 天気6種を等確率。基本の客数は天気ごとの定数×一様乱数の和（山形の分布）。値段は仕入値との差の式で、差が10を超えると符号が反転する穴 | 杯数・値段の2つ | 天気は「今日はこう」と確定してから判断 | 仕入値が毎日40%で1セント上がる（予告なし）。約3%で破壊行為（20ドル損、備えようがない） | [[web:simgames:r4-sim-lemonade-ts2068]] |
| **Game Dev Tycoon（Greenheart 2012）** | 題材ごとに「6ジャンルとの相性」「3客層との相性」を0〜1で持ち、ジャンル×開発の重点の6×6の上書き表もある。掛け算の因子なので1つ悪いと全体が落ちる。時間は1か月＝4週 | 題材・ジャンル・機種・客層・開発の配分 | 相性の数値は画面に出ない（出したあとの批評と売れ行きから推測）【相性を隠すことは資料の外の知識。資料はデータの形だけ】 | 発売後の批評（4人の点数）と売上 | [[web:simgames:r4-sim-gdt-modapi-topics]] [[web:simgames:r4-sim-gdt-modapi-checks]] |
| **Markstrat（StratX、研修用）** | 客層ごとの「理想点」（求める性能・値段）は、ゆるやかに規則的に動く。客は実際の性能ではなく「感じ方」で買う。研究開発は「隠れた必要予算」以上を出せば1期で完成 | 狙う客層・製品の設計・位置づけ・研究開発の予算・基準原価・調査を買うか（市場ごとに銘柄は5つまで） | 調査（有料）で理想点の推移の表とグラフ（最新の点ほど濃い）。2〜3期先を外挿して決める | 期ごとの会社の成績。研究開発は完成・未完成と「あといくら」 | [[web:simgames:r4-sim-markstrat-positioning]] [[web:simgames:r4-sim-markstrat-predictionofidealpoints]] [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] [[web:simgames:r4-sim-markstrat-researchdevelopment1]] [[web:simgames:r4-sim-markstrat-budgetrequiredforcompletion]] [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]] [[web:simgames:r4-sim-markstrat-projectbasecost]] |
| **Capitalism Lab（Enlight）** | 【資料なし】（需要の式の公式資料に当たれなかった。価格・品質・ブランドの3要素で総合評価という説明は二次資料のみで、根拠に使わない） | 競合の設定のつまみ（数・元手・出店と値付けの攻撃性・専門性・技術の先行・戦略を変えるか・事業の重点の配分・非上場の割合） | 競合の企業秘密を見せるかの設定 | 合併・買収。不動産専門の競合は「郊外の安い土地を買い、建てて値上がりで稼ぐ」 | [[web:simgames:r4-sim-capilab-competitors]] [[web:simgames:r4-sim-capilab-improvedai]] |
| **ゲーム発展国++（カイロソフト）** | 【資料なし】（式の資料なし） | 題材・ジャンル・機種・開発方針 | 「分かりやすくデフォルメ」「辛い現実の模擬機にしない」が作り手の方針 | 発売後の評価と売上 | [[web:simgames:r4-sim-denfami-kairosoft]] |
| ルセッティア（Recettear） | 基準価格に対する提示の値段で、客が買うか怒るかが決まる（前の調べもの） | 仕入・値付け・冒険 | 進んだ仕組み（店の雰囲気・適正価格のボーナス）が説明されず不満の元 | 毎週の返済の期限。期限を落としても能力と品物は持ち越し | [[web:simgames:designer-recettear-gd2010]] |
| **Reigns（Nerial 2016）** | 4つの値のどれかが満タンか空で治世が終わる【この仕組みは Wikipedia 由来の検索要約で、ノートの資料は「確率の山札」のほう】。カードは状態で引かれる確率が変わる | 左右の二択（毎手番） | 次のカードの山が状態で広がり・縮み、1枚に絞ると一本道の筋になる | 治世の終わりと後継ぎ。結末は3種と最長記録 | [[web:simgames:r4-sim-gamingtrend-reigns]] [[web:simgames:r4-sim-kreminski-storylets2018]] |
| **80 Days（inkle 2014）** | 持ち越す値はお金・主人の体調・時間と3つの性格だけ | 経路・旅の手段・市場の売買・都市での探索 | 経路は最初伏せ、話を聞くと開く（開くこと自体が報酬） | 到着の日数。8〜10回遊ぶ人がいた | [[web:simgames:r4-sim-gd-80days-postmortem]] [[web:simgames:r4-sim-mcv-ingold-replay]] |
| Fallen London（Failbetter） | 質（quality）＝持ち物も含むすべての数値。質が選択肢の鍵を開ける | 並んだ小片から選ぶ | 約60種の型に名前をつけて管理 | 失敗の場所（牢獄など）も続きのある物語で、プレイヤーは喜んで飛び込んだ | [[web:simgames:r4-sim-failbetter-structures1]] [[web:simgames:r4-sim-failbetter-structures2]] |
| **RimWorld（Ludeon）** | 語り手が少数の統計値を見て、分類した出来事の山から選ぶ | 入植地の運営 | 出来事は長く続き、重なる | 「傷つけるが殺さない」。人口が減ると語り手が手をゆるめる | [[web:simgames:r4-sim-gd-rimworld]] [[web:simgames:r4-sim-tynan-simdream]] |
| **RollerCoaster Tycoon（OpenRCT2 で確認）** | 乗り物の信頼度は一定の割合＋年数の罰で下がり、低いほど故障しやすい。故障の種類は重みつき抽選、ブレーキの故障は雨で重みが増すが、16か月未満か信頼度50%超なら起きない | 点検の間隔（10分〜2時間、しない） | 信頼度・停止の割合を表示 | 修理で信頼度は「失った分の半分×係数」しか戻らない | [[web:simgames:r4-sim-openrct2-ride]] |
| Into the Breach（Subset 2018） | 敵の攻撃を全部予告、自分の攻撃に確率なし | 守る対象（建物か機体か）の優先順位 | 予告の表示 | 失敗の理由がはっきり分かる | [[web:simgames:r4-sim-gd-intothebreach]] |
| Frostpunk（11 bit 2018） | 【資料なし】（数値の式は資料外） | 法の書・誰を救うか | 山場（発電機が直らない）を通知で何度も前振り | 遊び終えたあとに自分の歩みを見返す | [[web:simgames:r4-sim-inven-frostpunk]] |
| This War of Mine（11 bit 2014） | ゲームが「盗んだ数」を覚え、人物の気分が反応 | 生き延びるための選択（道徳を含む） | 「持ち物」を「わたしたちの物」と呼ぶだけで行動が変わった | 結果があいまいで道徳も絡む選択が板挟みを生む | [[web:simgames:r4-sim-gd-thiswarofmine]] |
| Papers, Please（2013） | 台本の出来事と、規則にもとづく乱数の生成を混ぜる | 書類の照合と通すか止めるか | 新しい規則と会話を同じ朝にぶつけない | 結末20通り（前の調べもの） | [[web:simgames:designer-papersplease-gd2014]] |
| **Offworld Trading Company（Mohawk 2016）** | 需給で値段が動く市場（検索の要約。ノートは株式と AI の資料） | 経済への投資・自社株の防衛・他社株の買い | 買収の近さが見える（残り5株は一括） | 買収された会社は子会社（もうけだけを狙う AI）になり、持ち分で配当 | [[web:simgames:r4-sim-soren-otc-stockmarket]] [[web:simgames:r4-sim-soren-otc-eapostmortem]] |
| Detroit: Become Human（2018） | — | 会話と制限時間つきの操作 | 章の途中と直後に分岐の「流れ図」。戻って選び直せる。流れ図は没入を損なうという声も | 3人の主人公が死んでも物語は続く | [[web:simgames:r4-sim-wiki-detroit]]（Wikipedia、概要のみ） |
| MG（マネジメントゲーム、1976） | 【資料なし】（ルール本文はフォーム経由でしか配られず、前の調べもので取っていない） | 1人1社の経営、リスクカード | 自分で決算書を作る | 期末の決算 | [[web:simgames:r2-designer-mg-about]] [[web:simgames:r2-designer-mg-rule]] |
| ビズストーム | 各市場の客がどの商品を買うかを判定（前の調べもの） | 市場・資源の配分 | 導入は短く「8期で結果を出せ」 | 期ごとの販売と会計 | [[web:simgames:r2-designer-bizstorm-play]] |

**【資料なし】**（一次資料に当たれず、この調べものでは根拠にしない）：Capitalism の需要の式、Two Point Hospital（評価と機械の故障）、Potion Craft（値切りと客の注文。公式の説明は「値切りが上手くいけば安く買える」程度）、Stardew Valley（品質と値段）、Hot Dog Bush 系、Big Ambitions（取得が503）、Railroad Tycoon（競合の路線）、Game Dev Tycoon のライバル会社、RollerCoaster Tycoon の近隣（RCT には近隣パークの仕組み自体が見当たらない【要確認】）、ドラクエのフラグ管理、Gold/Pray の需要モデル（ABSEL 保守中）。

---

## 2. 判断を「正解が1つ」にしない原則

### 2.1 面白い判断の条件（資料を突き合わせた点検表）
Meier の講演 [[web:simgames:r4-sim-gd-meier2012]]、Johnson のコラム [[web:simgames:r4-sim-soren-waterfinds]]、「定期的に板挟みを生む仕組み」の論考（査読なし）[[web:simgames:r4-sim-gd-pdg]]、This War of Mine [[web:simgames:r4-sim-gd-thiswarofmine]]、Into the Breach [[web:simgames:r4-sim-gd-intothebreach]] から、各判断を次の7つで点検する。

| # | 条件 | 欠けたときの症状（2回目の検査で見えたもの） |
|---|---|---|
| 1 | **引き換えがある**（得るものと失うものが両方ある） | 社長の案が常に悪手で「選ぶまでもない」 |
| 2 | **状況で答えが変わる**（季節・現金・競合・評判で最適が変わる） | 一度分かると以後ずっと同じ手 |
| 3 | **遊び方を表せる**（慎重派・攻め派・品質派のどれでも勝ち筋がある） | 正解当てになる |
| 4 | **選ぶ前に費用と効果がおおよそ分かる**（情報は多すぎるくらいでよい） | 「どうなるの」と気をもむだけ |
| 5 | **結果が1本の物差しで決まらない**（金額・評判・人・関係・先の危険） | 金額の大きい方を選ぶだけ |
| 6 | **どれを選んでも勝ちは確実でなく、負けも確定しない** | 序盤で詰む／序盤で決まる |
| 7 | **判断の直後に小さな返りがある**（本当の返りは数か月後でも） | 「何も起きずに先へ進む」のが最悪（Meier） |

- **短期・中期・長期を同時に走らせる**：Civ では短期の戦車と長期の遺産が並び、優先順位をつけるのがプレイヤーの仕事 [[web:simgames:r4-sim-gd-meier2012]]。ピヨ商店なら、今月の値付け（短期）・季節の仕入と販促（中期）・設備と出店（長期）。
- **削る勇気**：Meier は試した要素の3分の1以上を削ると言う [[web:simgames:r4-sim-gd-meier2012]]。判断を増やすことが目的ではない。
- **会計はパズル、経営は板挟み**：仕訳には正解が1つあってよい（学びの正しさ）。経営の判断には正解がない（遊びの板挟み）。判断の結果を正しく帳簿に書く、という組み合わせにすれば両立する【推測】。PDG の論考は「科学は最適解のパズルだから遊び直せない」と言うが [[web:simgames:r4-sim-gd-pdg]]、これは学習ゲームには一般化しすぎで、役割を分ければよい。

### 2.2 支配的な戦略の潰し方
- **逓増する負担**：Civ 4 は都市の数に比例して増える維持費で「小さな都市の大量建設」を潰した [[web:simgames:r4-sim-soren-waterfinds]]。ピヨ商店なら、安売りの連発には「評判（安物の印象）の低下」「常連の目の値段の基準が下がる」「原価割れ」を、出店の連発には「店長の不足・管理の手間」を逓増させる【推測】。
- **時間を安く見積もらせない**：危険ゼロで少しずつ得をする作業（毎月同じ安全策）が最適になると、遊びが作業になる [[web:simgames:r4-sim-soren-waterfinds]]。売り切れ・客の流出などの「機会の損」を数字で見せる。
- **効く手を入れ替える**：経営・育成のゲームでは、序盤は A、中盤は B、また A と最適が入れ替わるように倍率を設計する（AdVenture Capitalist の開発者の説明の引用）[[web:simgames:r4-sim-gd-pdg]]。
- **式の端を検算する**：派生の Lemonade Stand は、値段の上限側で需要の式の符号が反転し「ぼったくるほど売れる」穴があった [[web:simgames:r4-sim-lemonade-ts2068]]。

---

## 3. 選択肢を多くしても迷わせない見せ方

| 型 | 中身 | 出典 |
|---|---|---|
| **段階的に開く** | 80 Days は経路を最初に全部伏せ、話を聞くと開くようにしたら、読み飛ばしが止まり選択に意味が出た。開くこと自体が報酬になった | [[web:simgames:r4-sim-gd-80days-postmortem]] |
| **状況で山を絞る** | Reigns は危機のとき引ける山を小さくし、関連の出来事だけが続く | [[web:simgames:r4-sim-gamingtrend-reigns]] |
| **並び順と印** | Fallen London は選べる小片が多すぎるとプレイヤーが溺れるので、並び順と色で重要なものを目立たせた | [[web:simgames:r4-sim-emshort-beyondbranching]] |
| **推移のグラフで先を読ませる** | Markstrat は客の好みの推移を表とグラフで見せ（最新を濃く）、2〜3期先を外挿させる | [[web:simgames:r4-sim-markstrat-predictionofidealpoints]] |
| **情報を買う** | 調査・見積りは有料で時間がかかる。「情報に払うか」も判断になる | [[web:simgames:r4-sim-markstrat-projectbasecost]] [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] |
| **進む道ははっきり、迷うのは中身** | inkle：電子の世界は目印がないので、作り手は進む道を全力で示す。迷わせるのは判断の中身であって操作ではない | [[web:simgames:r4-sim-inkle-forkingpaths]] |
| **新しい規則と会話をぶつけない** | Papers, Please は話しかけられる朝には新しい規則を出さない | [[web:simgames:designer-papersplease-gd2014]] |
| **ジャンルと題材の常識を使う** | 説明しなくても伝わる情報（歴史上の人物の性格など）は判断の材料になる | [[web:simgames:r4-sim-gd-meier2012]] |
| **頭の中の模型に写る単純さ** | プレイヤーの頭の中に写らない仕組みは無価値。関係が多すぎる模型は因果が追えない | [[web:simgames:r4-sim-tynan-simdream]] |
| **難しさは数で跳ねる** | Into the Breach は敵が1体増えるだけで「楽しい」が「不可能」になった | [[web:simgames:r4-sim-gd-intothebreach]] |

**ピヨ商店の画面の案【推測】**：
- 月初の「作戦の机」：今月効く手を3つまで目立たせ（並び順・印）、残りは「ほかの手」に畳む。開いた手（話を聞いて知った販促・仕入先）が少しずつ増える。
- 各手に「試算」（Lemonade Stand の予報のように、天気・季節・評判から見た来客の幅：少ない日〜多い日）。幅を出すのは「確実ではない」ことを正直に伝えるため。
- 「記録帳」：過去の月の判断と結果を並べ、要因ごとに「何が効いたか」を1行で残す（Markstrat の推移・Lemonade の決算表）。プレイヤーが自分で需要の式を推測できる余地を残す。
- 判断の直後の一言（社長・常連・先輩）。数字の返りは月末。

---

## 4. 結果が分かれる作り（確率・隠れた変数・遅れて返る効果）

| 手法 | 例 | ピヨ商店での使い方【推測】 |
|---|---|---|
| **予報つきの確率** | Lemonade Stand の雨の確率（30〜70%）と、曇りの日だけの雷雨 [[web:simgames:r4-sim-lemonade-apple1979]] | 天気予報を月初（週ごと）に出す。仕込みすぎの損は予報に対する自分の判断として返る |
| **隠れた変数** | Markstrat の研究開発の「通常の必要予算」は知らされない [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]]。Game Dev Tycoon の題材×ジャンルの相性表 [[web:simgames:r4-sim-gdt-modapi-topics]] | 立地×客層×品目の相性表、工事の本当の必要額。調査や試行で少しずつ分かる |
| **実際と「感じ方」の差** | Markstrat：客は実際の性能ではなく感じ方で買う [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] | 広告は評判（感じ方）を上げるが、実際の品質が伴わなければ数か月かけて下がる（遅れて返る） |
| **ゆるやかで規則的な変化** | 理想点の動きは急でなく規則的 [[web:simgames:r4-sim-markstrat-predictionofidealpoints]] | 客層の好み（健康志向・映え）が年ごとに少しずつ動き、グラフで読める |
| **長く続き重なる出来事** | RimWorld：包囲中に商人、火事の最中に動物が暴れる [[web:simgames:r4-sim-gd-rimworld]] | 機械の修理中に大口の注文、値上がりの最中に競合の安売り |
| **乱数の種の保存** | Civ 3 は保存に乱数の種を入れ、やり直しで結果が変わらないようにした（怒る人もいたので設定に） [[web:simgames:r4-sim-soren-waterfinds]] | 月ごとの種を保存。良い結果の引き直しは「練習」としてだけ許す |
| **選ぶ前に分かる／先は読めない** | チェスの一手の効果は分かるが勝てるかは分からない [[web:simgames:r4-sim-gd-pdg]] | 1つの判断の直接の効果は試算で見せ、数か月先の評判・関係・事故は見せない |

**「自分の判断で勝った」と感じる設計**：
- 運の要素は予告し、事故は備えの手と組にする（6章）。そうすれば勝ちも負けも「読み」の結果になる [[web:simgames:r4-sim-gd-intothebreach]]。
- 頭の中の模型で再現できる要因に絞る（値段・天気・宣伝・評判・季節の5つ程度）[[web:simgames:r4-sim-tynan-simdream]]。プレイヤーが記録帳から「宣伝は3枚目から効きが鈍る」と気づけるくらいの形にする（Lemonade の看板は1枚で39%、4枚で86%と頭打ち）[[web:simgames:r4-sim-lemonade-apple1979]]。
- 失敗のときは、なぜ起きたか・次に何ができるかを同じ画面で見せる（乱数を疑う人・一度の不運を引きずる人への配慮）[[web:simgames:r4-sim-gd-meier2012]]。

---

## 5. 分岐の多い物語・経営ゲームの作り方（オーナーの追加の観点）

オーナーの見立て：「分岐ルートが少ないことによるやらされ感」が課題で、「意思決定に応じた現実味のある分岐ルートをどれだけ多く用意できるか」が面白さの主な原動力。資料はこれを支持するが、**分岐を「木の枝」で増やすと作る量と検算が爆発する**ことも、ほぼすべての資料が言っている。

### 5.1 組み合わせ爆発を抑えつつ分岐を多く見せる型

| 型 | 中身 | 出典 | ピヨ商店での形【推測】 |
|---|---|---|---|
| **状態の値による分岐（質・quality）** | 判断が数値の状態を変え、出来事・選択肢は状態を条件に開く。同じ困りごとに、どの値が十分かで違う解き方が開く（教会とのつながりか、社交界とのつながりか） | [[web:simgames:r4-sim-failbetter-structures2]] [[web:simgames:r4-sim-emshort-beyondbranching]] | 状態：現金・評判・常連・銀行の信用・仕入先との関係・社長の自信・設備の調子・従業員の負担。困りごと「仕入先の値上げ」に、信用が高ければ「掛けの期日を延ばす交渉」、関係が深ければ「値上げを据え置いてもらう」、現金が多ければ「まとめ買い」が開く |
| **進み（progress）と困り度（menace）の2本** | この2本があれば、一本道・合流・振り分け・季節の繰り返しなどの型を全部作り直せる | [[web:simgames:r4-sim-emshort-storylets]] | 進み＝月、困り度＝資金繰りの危うさ（口座の残り・期日の詰まり） |
| **合流と再分岐（branch-and-bottleneck）** | 途中で散って、大事な場面で一点に絞る | [[web:simgames:r4-sim-emshort-storylets]] | 毎月の締めと決算が合流点。違いは状態の値として残り、次の月の分岐の条件になる |
| **二度と合流しない枝（time cave）は小さく埋め込む** | 合流しない枝は作る量と検査が爆発する。大きな構造の中に小片として埋める | [[web:simgames:r4-sim-emshort-storylets]] | 倒産・民事再生などのバッドエンドの枝だけを time cave にし、長さを短く保つ |
| **遅れて返る結果** | 質の値が5まで上がると結末が開く（venture）。広告と品質の差は時間をかけて評判に効く | [[web:simgames:r4-sim-failbetter-structures2]] [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] | 宣伝を3か月続けると評判の段が上がる／安売りを続けると半年後に「安い店」の印象が固まる |
| **品質の差としての分岐** | 同じ結果に、持っている資源によって違う道（違う文・小さな特別な報酬）で着く。前の冒険の持ち物を正確に持っていると特別な選択肢 | [[web:simgames:r4-sim-emshort-beyondbranching]] | 同じ「決算を締める」でも、前の月に棚卸を丁寧にした人には「監査が1日で終わる」道が開く |
| **出来事の山札（重みつき）** | 状態で引かれる確率が変わる。状況に強く合う札は山に何枚も入れる。1枚に絞れば一本道 | [[web:simgames:r4-sim-gamingtrend-reigns]] [[web:simgames:r4-sim-kreminski-storylets2018]] | 梅雨は雨の札、評判が高いと大口の注文の札、設備が古いと故障の札が増える |
| **引数つきの小片** | 1枚の小片を、状態から当てはまる相手（人物・持ち物）を探して埋める。同じ札が相手で違う文と効果になる | [[web:simgames:r4-sim-kreminski-storylets2018]] | 「掛けの取引先 X が支払いを遅らせる」1枚を、評価の低い相手に当てはめる |
| **際立ち（salience）で台詞を選ぶ** | 広い既定の台詞を先に作り、気になった状況にだけ細かい台詞を足す。全場面を均等に覆わなくてよい | [[web:simgames:r4-sim-emshort-beyondbranching]] | 先輩・社長の一言は既定を先に、「評判が高い」「先月値上げした」などの条件つきを後から足す |
| **1回きりの話の印** | 終えると印がつき、その話は二度と出ない（周回でしか別の道を見られない） | [[web:simgames:r4-sim-failbetter-structures2]] | A社に掛けで売った周は、A社の別の筋が出ない |
| **持ち越す値を絞り、出来事は閉じた挿話にする** | 80 Days は持ち越しを6つだけにし、都市の話を閉じた挿話にしたので、順番に関係なく何人でも書けた | [[web:simgames:r4-sim-gd-80days-postmortem]] | 月をまたぐ値を最初に決めて固定する。出来事はその値だけを読み書きする |
| **フラグ（ドラクエ的）** | 【資料なし】（一次資料に当たれなかった）。一般に、真偽の印で分岐を管理する方式は、Emily Short の言う「各場面に固有の印を持たせる」time cave の管理と同じ問題を抱える [[web:simgames:r4-sim-emshort-storylets]] | — | 真偽の印より数値の状態を優先する |
| **ジャンルの組み合わせ表** | 題材×ジャンル×客層の相性を表で持ち、組み合わせの数だけ結果が分かれる | [[web:simgames:r4-sim-gdt-modapi-topics]] | 品目×立地×客層×販促の相性表。表1枚で数百の結果の違いが生まれる |
| **台本と乱数の混合** | 台本で決めない属性を規則にもとづく乱数で埋める | [[web:simgames:designer-papersplease-gd2014]] | 客・取引先の名前や金額を周ごとに変える（数字が変わるので仕訳の練習にもなる） |
| **失敗も行き先にする** | 牢獄・狂気などの失敗の場所を足したら、プレイヤーは喜んで飛び込んだ | [[web:simgames:r4-sim-failbetter-structures1]] | 倒産・取引停止の先に、そこでしか見られない場面（債権者との話し合い・再建の相談）を置く |
| **負けを長い下り坂に** | RimWorld：負けていく過程こそ劇的なので引き延ばし、立ち直れることもある | [[web:simgames:r4-sim-gd-rimworld]] | 資金ショートを即終わりにせず、数か月の立て直しの判断（借入・資産の売却・在庫の処分・値上げ）を挟む |

**数の感覚【推測】**：状態の値を8つ、それぞれ3段（低・中・高）とすると、状態の組み合わせは 3^8＝6,561。出来事の札を80枚作れば、プレイヤーが通る道は事実上すべて違う。それでも作るのは札80枚と、状態ごとの台詞の追加だけで済む。木の枝で同じ多さを作ろうとすると、12か月×各月2択でも 2^12＝4,096 本の枝を書くことになる。

### 5.2 作る手間と検査（全ルートの検算）の両立
- **型に名前をつける**：Failbetter は物語の枠組みに名前をつけた型の言葉を作り（約60種）、外部の書き手と共有した [[web:simgames:r4-sim-failbetter-structures1]] [[web:simgames:r4-sim-failbetter-structures2]]。ピヨ商店でも「合流」「遅れて返る」「山札」「1回きり」などの型名を設計書と sim-check で共有する。
- **書き方の順**：Reigns は人物ごとに単発の札→脇の話→複数をつなぐ筋、の順で書き足した [[web:simgames:r4-sim-gamingtrend-reigns]]。80 Days は「世界を一周する1本の旅」を最初に作り、遊んでから広げた [[web:simgames:r4-sim-gd-80days-postmortem]]。
- **無作為の通し試験**：数千回の無作為な通し試験を回し、一度も出ない話・出すぎる話を図にする [[web:simgames:r4-sim-emshort-beyondbranching]]。sim-check に「無作為な判断の組で N 周回し、①帳簿が合わない道 ②一度も出ない札 ③出すぎる結末 ④常に勝つ手（支配的な戦略）⑤どう選んでも詰む状態、を報告する」検査を足す【推測】。
- **係数は3段から**：Emily Short は最初「少し・中・たくさん」の3つの定数だけ決め、無作為の試験の分布を見て上下させる [[web:simgames:r4-sim-emshort-beyondbranching]]。
- **全判断の履歴を保存に入れる**：80 Days は保存データにそこまでの全選択の履歴があったので、発売後の不具合を突き止められた [[web:simgames:r4-sim-gd-80days-postmortem]]。ピヨ商店の保存（S）に判断の列を持たせ、検査役が任意の道を再生できるようにする。
- **AI の穴は同じ種で並べて見つける**：Offworld は毎日違う種の「毎日の挑戦」の録画をプレイヤーに上げてもらい、AI の穴を見て直した [[web:simgames:r4-sim-soren-otc-eapostmortem]]。
- **新しい仕組みはオン・オフの設定で入れる**：Offworld は物議を醸す変更を設定にして試し、大会で必須にして意見を集めた [[web:simgames:r4-sim-soren-otc-eapostmortem]]。
- **データの段階で検査する**：Game Dev Tycoon の改造用 API は、相性の値の個数と範囲（0〜1）を読み込み時に確かめ、不正なものを捨てる [[web:simgames:r4-sim-gdt-modapi-checks]]。validate に「係数の範囲」「札の条件が満たされうるか」を足す。

### 5.3 分岐を「見える」ようにする工夫
- **もしもの道**：Markstrat は同じ企画を4通りの予算・原価で比べた表を手引きに載せる [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]]。月末の振り返りに「もし仕込みを半分にしていたら」の試算を1行出す（ピヨ商店の既存の「もしも」と同じ考え）。
- **流れ図**：Detroit は章の途中と直後に分岐の流れ図を見せ、多くの評者が褒めたが、没入を損なうという声もあった [[web:simgames:r4-sim-wiki-detroit]]。→ 月末に「今月の分かれ道の図」（通った道を太く、通らなかった道は輪郭だけ）。消せる設定にする。
- **結末の図鑑**：Reigns は結末3種と最長記録で遊び直しの目標を作った [[web:simgames:r4-sim-gamingtrend-reigns]]。Hades は難しさを自分で足すほど新しい話が開く [[web:simgames:r3-fable-wiki-hades]]。→ 結末の図鑑は輪郭だけ見せ、中身は体験して開く。
- **前の周との比較**：Jon Ingold は、2周目が「仕掛けの針金が見える」体験になって1周目まで損なう作り（性格診断のような作り）を避け、2周目に文脈が変わって深くなる作りを目指す。新しい周で何が違うかは伝える必要がある（Heaven's Vault では伝えきれず、2周目をしない人が多かった）[[web:simgames:r4-sim-mcv-ingold-replay]]。→ 周の終わりに「前の周と比べて」の表（売上・評判・結末・判断の違い）。
- **選んだ道を主役に**：inkle は「選ばなかった道」より「選んだ道」に設計の重心を置く [[web:simgames:r4-sim-inkle-forkingpaths]]。もしもの道・図鑑は、選んだ道の体験を損なわない控えめな形にする。
- **戻って選び直す**：Detroit は特定の地点に戻って選び直せる [[web:simgames:r4-sim-wiki-detroit]]。ピヨ商店では練習（記録に数えない）としてだけ許し、本番の周の記録は一本道にする（判断の責任を残す）。

---

## 6. コストの事故と設備投資の危険（オーナーの追加の観点）

### 6.1 経営シムは事故をどう出しているか

| 作品 | 事故 | 確率・条件 | 予兆 | 備え・保険 | 出典 |
|---|---|---|---|---|---|
| Lemonade Stand（原作） | 雷雨で売上ゼロ／道路工事で客が来ない | 曇りの日の4分の1／晴れの日の4分の1、半々で良い方にも転ぶ | 曇りの日は雨の確率を数字で出す | 仕込みを減らす（作りすぎない） | [[web:simgames:r4-sim-lemonade-apple1979]] |
| 同上 | 原価の値上がり（2→4→5セント） | 日付で決まる | 文で予告（砂糖をもらえなくなった、粉が値上がり） | 値段を上げる | 同上 |
| Lemonade Stand（派生） | 仕入値の上昇・破壊行為 | 毎日40%で1セント上昇（予告なし）・約3%で20ドル損 | なし | なし | [[web:simgames:r4-sim-lemonade-ts2068]] |
| RollerCoaster Tycoon | 乗り物の故障（7種＋ブレーキ） | 信頼度が低いほど起きやすい。信頼度は年数で速く落ちる。種類は重みつき抽選。ブレーキの故障は雨で増えるが、新しい（16か月未満）か信頼度50%超なら起きない | 信頼度・停止の割合を表示 | 点検の間隔を選ぶ（費用）。修理しても全部は戻らない→買い替えの判断 | [[web:simgames:r4-sim-openrct2-ride]] |
| Frostpunk | 発電機が直らない | 台本 | 異常の通知を何度も出して前振り | 避難の段取り（誰を先に救うか） | [[web:simgames:r4-sim-inven-frostpunk]] |
| RimWorld | 襲撃・心の崩れ・火事・有毒の降下物 | 語り手が状態を見て選ぶ。人口が減ると手をゆるめる | 長く続く出来事 | 「傷つけるが殺さない」強さ | [[web:simgames:r4-sim-gd-rimworld]] |
| Into the Breach | 敵の攻撃 | 確率なし | 全部予告 | 押す・塞ぐ・犠牲にする | [[web:simgames:r4-sim-gd-intothebreach]] |
| MG | リスクカード | 【資料なし】（ルール本文を読んでいない） | — | — | [[web:simgames:r2-designer-mg-about]] |

**保険の仕組みそのもの**を経営シムがどう作っているかは、一次資料に当たれなかった【資料なし】（Capitalism Lab に保険会社の競合がいることは公式の設定で分かる [[web:simgames:r4-sim-capilab-competitors]] が、プレイヤーが保険を買う仕組みの資料ではない）。

### 6.2 理不尽に感じさせない工夫（資料から抽出した型）
1. **予兆を出す**：確率を数字で（雨の確率）、状態を数字で（信頼度）、物語で（通知の前振り）[[web:simgames:r4-sim-lemonade-apple1979]] [[web:simgames:r4-sim-openrct2-ride]] [[web:simgames:r4-sim-inven-frostpunk]]。
2. **最悪の事故は条件つきにする**：「古い・手入れが悪い・悪天候」がそろったときだけ。新しく手入れのよい設備では起きないと分かれば、事故は判断の結果になる [[web:simgames:r4-sim-openrct2-ride]]。
3. **備えの手を必ず組にする**：点検の頻度・仕込みの量・まとめ買い・保険（6.3）。
4. **良い方にも転ぶ乱数を混ぜる**：道路工事の日は、半々で「客が来ない」か「工事の人が全部買ってくれた」 [[web:simgames:r4-sim-lemonade-apple1979]]。
5. **一撃で終わらせない**：傷つけるが殺さない／弱っているときは事故の札を減らす [[web:simgames:r4-sim-gd-rimworld]]。
6. **失敗の理由がはっきり分かる**（どの要因で損をしたかを1行で）[[web:simgames:r4-sim-gd-intothebreach]] [[web:simgames:r4-sim-gd-meier2012]]。
7. **やり直しで運を引き直させない**（種を保存）。ただし練習として選べる設定は残す [[web:simgames:r4-sim-soren-waterfinds]]。
8. **学びに関係のない辛さは入れない**：カイロソフトは「辛い現実の模擬機」にしないため、社員が倒れるような出来事を入れない [[web:simgames:r4-sim-denfami-kairosoft]]。ピヨ商店は簿記の学びに結びつく事故（貸倒れ・故障＝修繕費か資本的支出・腐敗＝棚卸減耗・値上がり＝原価の差異）に絞る【推測】。

### 6.3 ピヨ商店の事故と備えの案【推測】（係数は調べもの2の数字で埋める）

| 事故 | 状態の値 | 起きやすさ | 予兆 | 備えの手 | 会計の学び |
|---|---|---|---|---|---|
| 材料の腐敗 | 在庫の「仕入れてからの日数」（新しい変数を作らずに表す、Tynan の「既存の値を使い回す」[[web:simgames:r4-sim-tynan-simdream]]） | 日数と気温（夏に高い） | 冷蔵庫の温度・在庫の日付の一覧 | 仕込みを減らす・冷蔵庫を買う（設備投資）・見切り販売 | 棚卸減耗・評価損 |
| 機械の故障 | 設備の「調子」（年数で落ち方が速くなる） | 調子が低いほど高い。最悪の故障は「古い＋点検なし」のときだけ | 点検の報告書・異音のお知らせ（数か月前から） | 点検の頻度（費用）・修理（調子は全部は戻らない）・買い替え・保守契約 | 修繕費と資本的支出の区別・減価償却・除却 |
| 原価の値上がり | 仕入先との関係・市況 | 季節と市況の札 | 仕入先から1か月前に通知 | まとめ買い（現金と在庫の負担）・別の仕入先・値上げ・据え置き交渉（関係が深いとき） | 原価の差異・先入先出と平均の違い |
| 取引先の倒産（貸倒れ） | 掛けで売った相手の評価 | 評価の低い相手ほど高い（引数つきの札） | 支払いの遅れ・噂 | 与信の上限・前金・取引の縮小 | 貸倒引当金・貸倒損失 |
| 悪天候（売上の機会の損） | 天気 | 季節と予報 | 予報（確率の数字） | 仕込みの調整・雨の日の品（ホット） | 機会の損は帳簿に出ない（もしもで見せる） |
| 店の事故（ガラス・盗難） | — | 低い・一定 | なし | 保険（毎月の保険料＝前払費用・支払保険料） | 保険差益・未決算（【要確認】2級の範囲） |

保険は「保険料を払う月が続くと、事故が起きなければ損に見える」ので、**期待値と最悪の場合の両方を試算で見せる**のが判断の芯になる【推測】。

### 6.4 設備投資の危険（工期・上振れ・稼働率）
Markstrat の研究開発の仕組みが、ほぼそのまま使える [[web:simgames:r4-sim-markstrat-budgetrequiredforcompletion]] [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]] [[web:simgames:r4-sim-markstrat-projectbasecost]]：
- 必要な予算は**規模・経験（2回目は安い）・求める原価の低さ**で決まり、**本当の必要額はプレイヤーに知らされない**。
- 割り当てが足りなければ完成せず、「あといくら要る」と返る（＝工期の遅れ）。多く出しすぎた分は戻らない。
- 続ける・棚上げ・やめる、を選べる。やめれば払った分は失われる。
- 実現可能性の調査（見積り）は有料で1期かかる。
- 「安く作るために開発にお金をかける」か「単価は高めでも早く安く始める」かのトレードオフ。

**ピヨ商店の工場・2号店の案【推測】**：
- 工事の本当の必要額＝見積り×(1＋上振れ)。上振れは見積りを取ったかどうか・業者の質・経験で幅が変わる。
- 予算が足りなければ工期が延び（稼働が遅れる＝その間の売上の機会の損）、追加の請求が来る。
- 完成後の稼働率は需要で決まる（作りすぎた設備は遊ぶ＝固定費が重い。CVP の判断に直結）。
- 2級の論点：建設仮勘定・固定資産への振替・減損（やめた工事）・CVP・固定費と変動費・予算と差異。
- 予兆：需要の推移のグラフ（Markstrat の理想点）で「完成するころの需要」を読ませる [[web:simgames:r4-sim-markstrat-predictionofidealpoints]]。

---

## 7. 競合 AI の作り方（オーナーの追加の観点：周辺エリアに同業の競合が複数）

Coffee Inc 2 は別の担当が調べる。ここでは他の作品の資料から型を抜く。

### 7.1 性格づけ（つまみ）
- Capitalism Lab は競合を少数のつまみで作る：数、元手（6段）、出店・拡大の攻撃性（5段）、値付けの攻撃性（4段）、専門性、技術の先行、地元の競合の手強さ、企業秘密を見せるか、途中で戦略を変えるか。性格は事業の重点の配分（小売・不動産・株式…）で決め、**希望であって保証ではない** [[web:simgames:r4-sim-capilab-competitors]]。
- **戦略は成り立つ条件と組**：不動産専門の競合は、元手が「高い」以上の設定のときだけ現れ、郊外の安い土地を買って建てて値上がりで稼ぐ [[web:simgames:r4-sim-capilab-improvedai]]。

**ピヨ商店の競合の案【推測】**（つまみ：元手・出店の攻撃性・値付けの攻撃性・得意（品質／安さ／映え）・季節性・戦略を変えるか）
| 競合 | 性格 | 現れる条件 | 動き |
|---|---|---|---|
| 大手のチェーン | 値付けの攻撃性・元手が高い。品質は中 | 町の人口と人通りが一定以上 | 近くに出店すると周辺の客を奪う。安売りの期間を仕掛ける（予兆：工事の看板・求人） |
| こだわりの個人店 | 品質が得意、拡大しない | 常にいる | 値段は高め。評判で客を持つ。後継ぎ不在で身売りの話が出ることも（買収の機会） |
| 移動販売 | 季節と催しに出る | 夏・祭り | 一時的に客を奪う。祭りの出店の枠を取り合う |
| コンビニ | 品ぞろえと便利さ | 立地 | 新商品（似た飲み物）で模倣する |

### 7.2 反応
- 競合が途中で戦略を変える設定は、プレイヤーの出し抜きに競合が反応する感覚を作る [[web:simgames:r4-sim-capilab-competitors]]。ピヨ商店では反応に**予兆**（求人・工事の看板・値札の張り替え）と**遅れ**（1〜2か月）を入れ、プレイヤーが先回りできるようにする【推測】。
- AI はプレイヤーと同じ会計の論理で動かす（安く買って価値を上げる）[[web:simgames:r4-sim-capilab-improvedai]]。競合の決算書を年に1回の公開情報（決算公告・噂）として見せれば、他社の帳簿を読む練習になる【推測】。
- 隠れた情報を AI に推測させる仕組みは AI に向かない（Offworld は、相手の隠した市場を当てる必要のある道具を AI に扱わせられず、1人用では切った、と検索の要約にあるが、ノートの資料では確かめていない【要確認】）。

### 7.3 市場の取り合いの式
- 【資料なし】：経営シム（Capitalism・Coffee Inc など）の市場配分の式の一次資料に当たれなかった。Gold/Pray の需要モデル（ABSEL）は保守中で読めなかった。
- 【推測】マーケティングの教科書に一般的な「魅力度のモデル」（各店のシェア＝その店の魅力度÷全店の魅力度の和。魅力度＝品質^a×評判^b×値段^(−c)×距離^(−d)）を案として置く。**根拠の資料をこの調べものでは読んでいない**ので、係数の形も含めて BIZ-MKT・BIZ-MGMT の数字か別の調べもので裏づけること。
- Markstrat の「客は実際の性能ではなく感じ方で買う」「好みは規則的に動く」は、魅力度の中の品質を「感じ方の品質」にする根拠になる [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] [[web:simgames:r4-sim-markstrat-predictionofidealpoints]]。

### 7.4 買収と倒産
- Offworld の教訓 [[web:simgames:r4-sim-soren-otc-stockmarket]]：
  - 買収で相手の建物を丸ごと引き継ぐと、管理しきれず手に負えなくなった → **買った会社は子会社として簡単な AI（もうけだけを狙う）に任せ、持ち分で利益を受ける**。
  - 全か無かの買収は勝者が雪だるまになる → 部分的な持ち分・過半で子会社化。
  - 買収の近さを見えるようにする（自社株を体力のように）。ただし多人数で1人を寄ってたかって落とせないよう、最後の5株は一括。
  - 勝ち目のない会社は早く退場させ、場を乱させない。
  - 攻める（相手の株を買う）・守る（自社株を買う）・育てる（経済に投資）が三すくみになった。
- ピヨ商店の案【推測】：個人店の後継ぎ問題・競合の赤字続きから「身売りの話」が来る。買えば子会社として自動経営に任せ、持ち分と利益だけ返る（2級の連結会計の入口：子会社株式・のれん・非支配株主持分）。競合が倒産すると、その客の一部が流れてくる（7.3の式で自然に起きる）。逆にプレイヤーが弱れば、チェーンから買収の打診が来る（バッドエンドではなく「行ける場所」の一つ）。

### 7.5 「出し抜いた」と感じる見せ方
- 競合の動きに予兆がある（看板・求人・噂）→ 先回りできたときに「読み勝った」と感じる（Into the Breach の予告の考え方 [[web:simgames:r4-sim-gd-intothebreach]]）。
- 競合の手の内を見せるかは難易度のつまみ（初めは見せ、慣れたら伏せる）[[web:simgames:r4-sim-capilab-competitors]]。
- 月報に「シェアの推移」と「競合の一手とこちらの一手」を並べる【推測】。
- 有利な場所・仕入先は早い者勝ちにせず、「借金で買う」代価をつける（Offworld の開始地点の借金の競り）[[web:simgames:r4-sim-soren-otc-eapostmortem]]。

---

## 8. 研修用の経営ゲームの判断の構造と、学びにつながる振り返り

- **判断が先、記帳はその結果**：MG は1人1社で全部の役を担い、自分で決算書を作る [[web:simgames:r2-designer-mg-about]]。ビズストームは1期を「仕事（市場の選択と資源の配分）→販売（客がどれを買うか判定）→会計」の順で回し、導入は短く「8期で結果を出せ」と期限を置く [[web:simgames:r2-designer-bizstorm-play]]。Markstrat は分け方・競争の戦略の理論を手引きで教えず授業に任せ、ゲームの中は判断と結果に集中させる [[web:simgames:r4-sim-markstrat-positioning]]。ピヨ商店の「原理は練習室・先輩の手帳、ゲームの中は判断と結果」と同じ役割分担。
- **振り返り**：経営ゲームのラウンドごとに進行役が導く振り返り（Kolb の4段の質問：何が起き何を感じたか→別の見方→概念に結びつける→次の指針）をした組は、9項目中7項目で学びの自己評価が高く、特に「全体を見る見方」（d=0.66）と「意思決定の練習」（d=0.60）。チームで働くことには差がなかった。遊んでいる最中は締め切りと競争に気をとられて振り返らない、という解釈 [[web:learnsci:r4-sim-bbr2018-debriefing]]。**限界**：自己申告・1つのゲーム・2校だけ。
- 前の調べもので読んだ実務家の手引き：振り返りは事実→理由と意味→次に何を変えるか、の3段。正解当てにせず、結果を知った後から当時の判断を責めない [[web:simgames:bg-debrief-questions]]。
- Frostpunk は遊び終えたあとに自分の歩みを見返すことを目標の1つにした [[web:simgames:r4-sim-inven-frostpunk]]。

**ピヨ商店の月末の振り返りの案【推測】**（1画面・180字以内に収まる問い）：
1. 今月なにが起きた？（売上・原価・事故を数字で1行ずつ、要因つき）
2. 別の見方では？（客・取引先・社長の一言）
3. 帳簿ではどこに出た？（どの勘定・どの原理）
4. 来月はどうする？（1行の方針を自分で選ぶ・書く。次の月の判断の画面に表示）
効果は自己申告ではなく、練習室の問題の正答で確かめる前提にする。

---

## 9. 避けるべき失敗（資料から）

| 失敗 | 何が起きたか | 出典 |
|---|---|---|
| 結果がはっきり見える選択 | 誰もが得な方を選ぶ（二択の正解当て） | [[web:simgames:r4-sim-gd-thiswarofmine]] |
| 支配的な戦略 | 他の選択肢が全部悪手になり、選択が消える | [[web:simgames:r4-sim-soren-waterfinds]] |
| 式の端の穴 | 値段を上げすぎると売れる（符号の反転） | [[web:simgames:r4-sim-lemonade-ts2068]] |
| 予告のない事故・値上がり | 備えようがなく、運のゲームになる | [[web:simgames:r4-sim-lemonade-ts2068]] |
| 全部見える選択肢 | 読み飛ばし、選択に意味がなくなる | [[web:simgames:r4-sim-gd-80days-postmortem]] |
| 誰も気づかない作り込み | Ultima Online の生態系は誰にも見られず外された | [[web:simgames:r4-sim-tynan-simdream]] |
| 説明されない進んだ仕組み | 「もっと早く知っていれば」の苛立ち | [[web:simgames:designer-recettear-gd2010]] |
| 判断の後の沈黙 | 不安になる。「何も起きずに先へ進む」のが最悪 | [[web:simgames:r4-sim-gd-meier2012]] |
| 内容を足しても判断が生まれない | Frostpunk の人口制限の初期案は、道徳の選択を不要にして簡単すぎた。内容を足すより絞る | [[web:simgames:r4-sim-inven-frostpunk]] |
| 買収で全部を引き継ぐ | 管理しきれない・雪だるま | [[web:simgames:r4-sim-soren-otc-stockmarket]] |
| 合流しない枝を広げる | 作る量と検査が爆発（後半が力尽きて薄くなった） | [[web:simgames:r4-sim-emshort-storylets]] [[web:simgames:r4-sim-gd-80days-postmortem]] |
| 少人数の身内の試遊だけ | 7〜8人の試遊では見つからず、発売直後に進めなくなる不具合が殺到 | [[web:simgames:r4-sim-gd-80days-postmortem]] |
| 2周目に仕掛けが見える | 1周目の価値まで下がる | [[web:simgames:r4-sim-mcv-ingold-replay]] |
| 辛い現実の再現 | 面白くない（学びに関係のない辛さ） | [[web:simgames:r4-sim-denfami-kairosoft]] |
| 人を資源として扱わせる表示 | 使い捨てにされる。言葉の選び方で行動が変わる | [[web:simgames:r4-sim-gd-thiswarofmine]] |

---

## 10. ピヨ商店の需要モデルの案（変数と、係数の決め方）

すべて【推測】。式の骨組みは資料から、係数は**調べもの2の数字**（BIZ-MKT.md の打ち手ごとの費用と効果、BIZ-MGMT.md の小さな店の数字）で埋める前提。BIZ-MKT は1杯300円・原価100円で計算している。

### 10.1 変数（状態）
| 変数 | 意味 | 動き | 持ち越し |
|---|---|---|---|
| 基本の人通り B（立地×季節×曜日） | 店の前を通る見込みの客 | 立地で決まり、季節で動く | 固定（出店で変わる） |
| 天気 W | 晴れ・曇り（雨の確率）・雨・猛暑 | 週ごとに予報→実際 | なし |
| 値段 p と基準の値段 p_ref | 客が「ふつう」と感じる値段 | p_ref は自分と競合の過去の値段にゆっくり寄る（安売りを続けると下がる） | あり |
| 宣伝の残り A（広告の在庫） | 打った宣伝の効きの残り | A_t ＝ 支出_t ＋ λ×A_{t−1}（λ は打ち手ごと。チラシは小さく、看板・地図の口コミは大きい） | あり |
| 実際の品質 Q | 材料・作り方・設備の調子 | 判断と設備で決まる | あり |
| 評判 R（感じ方の品質） | 客の頭の中の店の印象 | R_{t+1} ＝ R_t ＋ α×(体験 − R_t)。体験＝Q −待ち時間と品切れの罰 ＋宣伝の上乗せ（宣伝は R を一時的に押し上げるが、Q が伴わなければ戻る）[[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] | あり |
| 常連 L | 繰り返し来る客の数 | 体験が良いと増え、悪いと減る | あり |
| 競合の魅力度 C_j | 7章の競合 | 競合の判断と予兆 | あり |
| 仕込み・在庫 S と日数 | 作った量と古さ | 腐敗は日数と気温 | あり（腐る） |
| 設備の調子 H | 故障の確率と品質に効く | 年数で落ち方が速くなる。点検で戻る（全部ではない）[[web:simgames:r4-sim-openrct2-ride]] | あり |

### 10.2 式（骨組み）
```
来店の見込み N ＝ B × W倍率 × 価格効果(p, p_ref) × (1 ＋ 宣伝効果(A)) × 評判倍率(R) × 自店のシェア ＋ 常連 L
  価格効果：p ≦ p_ref ならゆるやかに増え、p > p_ref なら (p_ref/p)^ε で急に減る（Lemonade Stand の非対称 [[web:simgames:r4-sim-lemonade-apple1979]]）
  宣伝効果：上限 × (1 − e^(−k×A))（逓減。Lemonade の看板は最大2倍）
  自店のシェア：魅力度の比（7.3。【資料なし】のため要裏づけ）
売れた数 ＝ min(N × 小さな乱数(±10%程度), 仕込み)
売れ残り → 翌日以降に持ち越し、日数で腐敗（棚卸減耗）
```
- 需要の乱数は小さく（±10%程度【要確認】）。大部分を見える要因で説明できるようにし、プレイヤーが記録帳から式を推測できる余地を残す（原作は需要に乱数なし、派生作は大きな乱数で判断と運の区別が消えた [[web:simgames:r4-sim-lemonade-apple1979]] [[web:simgames:r4-sim-lemonade-ts2068]]）。
- 掛け算の因子は範囲を決めて読み込み時に検査する（0〜1 または 0.5〜1.5）[[web:simgames:r4-sim-gdt-modapi-checks]]。
- 時間の刻み：ゲームの単位は月。月の中を4週に分け、天気と事故は週ごと、締めは月末（Game Dev Tycoon も1か月＝4週）[[web:simgames:r4-sim-gdt-modapi-checks]]。

### 10.3 係数の決め方（手順）
1. **3段で置く**：各係数を「少し・中・大」の3値で仮置きする [[web:simgames:r4-sim-emshort-beyondbranching]]。
2. **調べもの2で現実の幅に合わせる**：宣伝の費用と反応（CPA）、リピート率、季節の変動、原価率、客単価を BIZ-MKT・BIZ-MGMT の数字で当てる。現実の数字が「業者の目安しかない」ものは【推測】の印を残す。
3. **デフォルメする**：現実の数字の幅を、ゲームで違いが目に見える大きさに広げる（カイロソフトの「分かりやすくデフォルメ」[[web:simgames:r4-sim-denfami-kairosoft]]）。ただし会計の金額（仕訳の練習）は現実的な桁に保つ。
4. **無作為の通し試験で検算**（sim-check に足す）：
   - 値段を1円刻みで回し、来店の見込みが単調に減るか（穴がないか）
   - 判断の組を無作為に数千通り回し、**常に勝つ手がないか**（支配的な戦略）、**どう選んでも詰む状態がないか**
   - 季節・年で最適の手が入れ替わるか（同じ手が通年で最適なら係数を直す）
   - 一度も出ない出来事・出すぎる結末
   - 帳簿が全道で合うか（既存の sim-check の検算を道ごとに）
5. **試遊で「頭の中の模型」に写るかを確かめる**：試遊者に「先月の売上が増えた理由は？」と聞き、要因を言い当てられるか [[web:simgames:r4-sim-tynan-simdream]]。

### 10.4 判断の例（板挟みの点検表を通したもの）【推測】
| 判断 | 引き換え | 状況で答えが変わる | 遅れて返る |
|---|---|---|---|
| 値段（250／300／350円） | 客数と1杯の粗利 | 猛暑・競合の安売り・評判の高さ | p_ref が動き、半年後の常連と印象に効く |
| 仕込みの量 | 売り切れの機会の損と腐敗 | 天気予報・催し | 腐敗が多いと棚卸の手間・減耗 |
| 販促（チラシ／SNS／看板／試飲） | 費用と効きの長さ（λ） | 客層（高齢の住宅地か学生街か、BIZ-MKT） | 宣伝の残り A と評判 R |
| 材料の質 | 原価と品質 Q | 評判が低い時期は効きが遅い | Q→R は数か月 |
| 点検の頻度 | 毎月の費用と故障の確率 | 設備の年数・夏の繁忙期 | 調子 H、故障は予兆のあと |
| 保険 | 保険料と最悪の損 | 現金の余裕 | 事故が起きなければ「損」に見える |
| 2号店・工場 | 工事費（隠れた必要額）と将来の需要 | 需要の推移のグラフ・競合の出店 | 工期・稼働率・減価償却 |
| 競合の身売りの話 | 買収の資金と子会社の利益 | 現金・競合の赤字 | 子会社の配当・連結 |

---

## 11. 次に調べるなら（要確認）
- Gold/Pray の需要モデル（ABSEL の論文誌が保守から戻ったら）と、経営シムの市場配分の式（魅力度モデルの一次資料）。
- 経営シムの「保険」を買う仕組みの一次資料（Capitalism Lab の保険業、Big Ambitions など）。
- Coffee Inc 2 の競合と需要（別の担当）。
- MG のリスクカードの中身（ルール本文はフォーム経由で個人情報の提供を伴うため、オーナーの判断が要る）。
- 「流れ図・結末の図鑑」の開発者の一次資料（Detroit は Wikipedia の概要のみ）。

---

## 12. 読んだ資料（この調べもので新たに読んだ38本）

**分岐の作り方**
- [[web:simgames:r4-sim-emshort-storylets]] Emily Short のブログ（ストーリーレット、2019）
- [[web:simgames:r4-sim-emshort-beyondbranching]] Emily Short のブログ（木の分岐を超える3方式、2016）
- [[web:simgames:r4-sim-failbetter-structures1]] [[web:simgames:r4-sim-failbetter-structures2]] Failbetter Games の公式ブログ（Echo Bazaar の物語構造、2010）
- [[web:simgames:r4-sim-kreminski-storylets2018]] Kreminski & Wardrip-Fruin（ICIDS 2018、論文）
- [[web:simgames:r4-sim-gd-80days-postmortem]] 80 Days の事後検証（開発者本人、Game Developer）
- [[web:simgames:r4-sim-mcv-ingold-replay]] Jon Ingold の聞き取り（MCV/DEVELOP、2023）
- [[web:simgames:r4-sim-inkle-forkingpaths]] inkle の公式ブログ（2012）
- [[web:simgames:r4-sim-gamingtrend-reigns]] Reigns の開発者への聞き取り（Gaming Trend、2016）
- [[web:simgames:r4-sim-wiki-detroit]] Wikipedia「Detroit: Become Human」（概要のみ）

**判断の設計**
- [[web:simgames:r4-sim-gd-meier2012]] Sid Meier の GDC 2012 講演の取材記事
- [[web:simgames:r4-sim-soren-waterfinds]] Soren Johnson のコラム（Water Finds a Crack）
- [[web:simgames:r4-sim-gd-pdg]] 定期的に板挟みを生む仕組みの論考（開発者の寄稿、査読なし）
- [[web:simgames:r4-sim-gd-thiswarofmine]] This War of Mine の GDC 講演の取材記事
- [[web:simgames:r4-sim-gd-intothebreach]] Into the Breach の開発者への聞き取り
- [[web:simgames:r4-sim-tynan-simdream]] Tynan Sylvester のブログ（The Simulation Dream）
- [[web:simgames:r4-sim-gd-rimworld]] RimWorld の記事（Game Developer、2016）
- [[web:simgames:r4-sim-inven-frostpunk]] Frostpunk の IGC 2018 講演の取材記事
- [[web:simgames:r4-sim-denfami-kairosoft]] カイロソフト社長の聞き取り（電ファミ、2018）

**需要と経営の仕組み**
- [[web:simgames:r4-sim-lemonade-apple1979]] Lemonade Stand（Apple II 版、1979）の BASIC の一覧（ディスクイメージから取り出した）
- [[web:simgames:r4-sim-lemonade-ts2068]] Lemonade Stand（TS2068 派生、1984）の解説とソース
- [[web:simgames:r4-sim-gdt-modapi-topics]] [[web:simgames:r4-sim-gdt-modapi-checks]] Game Dev Tycoon の公式の改造用 API
- [[web:simgames:r4-sim-markstrat-positioning]] [[web:simgames:r4-sim-markstrat-predictionofidealpoints]] [[web:simgames:r4-sim-markstrat-assessingperceptionsandpreferences]] [[web:simgames:r4-sim-markstrat-researchdevelopment1]] [[web:simgames:r4-sim-markstrat-budgetrequiredforcompletion]] [[web:simgames:r4-sim-markstrat-responsesfromtherddepartment]] [[web:simgames:r4-sim-markstrat-projectbasecost]] Markstrat の参加者用の手引き（7ページ）
- [[web:simgames:r4-sim-openrct2-ride]] OpenRCT2 のソース（故障と点検）

**競合 AI**
- [[web:simgames:r4-sim-capilab-competitors]] [[web:simgames:r4-sim-capilab-improvedai]] Capitalism Lab の公式サイト
- [[web:simgames:r4-sim-soren-otc-stockmarket]] [[web:simgames:r4-sim-soren-otc-eapostmortem]] Offworld Trading Company の設計者のブログ

**学習科学**
- [[web:learnsci:r4-sim-bbr2018-debriefing]] Lacruz & Américo（Brazilian Business Review、2018、経営ゲームの振り返りの準実験）

**引いた既存のノート（前の調べもの）**：[[web:simgames:designer-recettear-gd2010]] [[web:simgames:designer-papersplease-gd2014]] [[web:simgames:r2-designer-mg-about]] [[web:simgames:r2-designer-mg-rule]] [[web:simgames:r2-designer-bizstorm-play]] [[web:simgames:bg-debrief-questions]] [[web:simgames:r3-fable-wiki-hades]]

**取得したが読まなかったもの・取れなかったもの（根拠にしない）**：Game Dev Tycoon の README・events.js（中身がほぼない）、ABSEL の Gold/Pray の論文（サイトが保守中）、Game*Spark の Big Ambitions の聞き取り（503）。
