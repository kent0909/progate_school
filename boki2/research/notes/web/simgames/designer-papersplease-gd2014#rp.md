---
src: web
coll: simgames
doc: designer-papersplease-gd2014#rp
file: designer-papersplease-gd2014.html
sha256: 6ee315e897ba454847adace0af308cde6585c952f4cbc8fa65711d77ed656123
read: full
anchors: ["Designing the bleak genius of Papers", "the bureaucratic inspector", "Scripted encounters, random encounters", "will change between replays", "filled in with random data", "too delicate to allow further messing", "shuffle some events around", "stunning 20 endings", "the bulletin is basically ignored", "together with my wife", "family status screen at night", "Southeast Asia"]
---
## 何の資料か
Game Developer（旧 Gamasutra）の Lucas Pope への取材記事（Leigh Alexander、2013年）。作り手の話。r2 の別ノートがあるが、BIZ-REPLAY のために周回の観点で全文を読み直した（DESIGN-ROUND2-audit 5章 F8 の確かめ）。

## 読み取れること（自分の言葉で）
- 入国者は「決めた情報だけ決め、残りはその日の規則に沿って乱数で埋める」仕組み。だから台本のある入国者でも、**遊び直すと顔や名前は変わるが台詞は同じ**。台本の出来事と乱数の出来事を混ぜやすくなった。
- 乱数の生成は検証の手順を書けば済み、難しくなかった。一番難しかったのは、台本の出来事・規則の変更・襲撃・夜の出来事・長い物語の筋を、筋の通った物語と**ゲームの進み方の両方**として並べること。何週間もかかり、何度も並べ替えた。
- 評者から「台本の出来事を日ごとにずらして、もっと乱数を」と求められた。Pope もそうするつもりだったが、互いに依存する要素が繊細すぎて予定をいじれなかった。例：朝に誰かが話しかける日には、掲示で新しい規則を出さないようにした（話し相手がいると掲示は読まれないと試遊で分かった）。一つの出来事を足すだけで後の予定が全部崩れる、と言う。手で並べたが、**依存関係を表現すれば一部の出来事を入れ替えられただろう**、とも言う。
- 結末は20。物語は下から組み、小さな筋を足し、それぞれが判断で何通りかに終わる。重ねると、良くも悪くもない自分なりの道を通った感じが残る。技術的に簡素だから多くの枝を置けた（3D や音声があると枝を絞らざるを得ない）。
- 家族の画面はわざと情報を減らし、遊ぶ人が自分の家族を重ねられるようにした。

## 周回の設計への含み
1. 「皮（顔・名前）だけが周ごとに変わり、台詞（答え）は同じ」は、Papers, Please では台本の出来事の性質。2周目以降の新しさは台本ではなく判断の枝（20の結末）から来る【推論】。本作の変種を「皮」と「答えを動かす」に分ける根拠の一つ。
2. 出来事の順番を周ごとに入れ替えたいなら、依存関係（この規則はこの説明の後、など）を書いておく必要がある。Pope は手で並べて入れ替えを諦めた。本作では学習の順（前提の論点）が依存関係にあたる【推論】。
3. 規則の告知と会話を同じ日に重ねない、の教訓は、新しい論点の導入と別の出来事を重ねないことにそのまま写せる【推論】。
