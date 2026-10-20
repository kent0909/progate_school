---
src: web
coll: learnsci
doc: lehmann2025-llm-harm-learning
file: lehmann2025-llm-harm-learning.pdf
sha256: de776c0b49dd72baf20b8f1c934667caefb473babe4f91a35b576e799f19146a
read: full
anchors: ["When Do Large Language Models Harm Learning", "topic volume and topic understanding", "56 students took the IS course, and 57 students took the BA course", "ChatGPT service interruptions", "their grade on all subsequent questions decreases by 0.06", "the software on the computers in the laboratory blocked all options to copy and paste text", "42% of messages asking for a solution were sent without a single attempt", "LLMs appear to increase inequality in education", "LLMs increase perceived learning by more than can be explained", "present bias", "The pen is mightier than the keyboard", "What am I doing wrong here"]
---
## 何の資料か
Lehmann, Cornelius & Sting（2025, arXiv 2409.09047 v2）。LLM が学習を害する条件を調べた3研究。
- 研究1：オランダの大学院のプログラミング授業2科目（113人）の宿題データ。ChatGPT の障害時間を操作変数にした準実験。
- 研究2・3：ドイツの大学の初心者を対象にした、事前登録・報酬つきの実験室実験（n=107, 69）。Python を45分学ぶ。研究3では研究2と違い、コピー＆ペーストを使えるようにした。

証拠の強さ：小規模実験＋観察データ（主効果は有意でなく、主要な知見は探索的分析）。付録まで全部読んだ。

## 分かったこと
- 実験では、LLM を使えることの全体の学習効果は有意でなかった。
- 研究1：ChatGPT の解答と似たコードを出すほど、その問題の点は上がるが、その後の問題の点が下がった（操作変数推定で後続問題に −0.06）。長期的な学習の低下。
- 使い方の分類：
  - 「解答を出させる」（代替的利用）：進む話題の量は増えるが、各話題の理解が減る。
  - 「説明を求める」（補完的利用）：理解が増える。
- コピー＆ペーストを可能にすると、解答の要求だけが増え（説明の要求は増えず）、理解が下がった。解答要求の42%は、自分で一度も試さずに送られていた。学習者はもともと代替的な使い方を好む（目先の楽を選ぶ現在志向バイアスと解釈）。小さな手間の違いで使い方が大きく変わる。
- 事前知識の少ない学習者は、LLM があると対照より理解が下がった。多い学習者は伸びた。職場の研究（低技能者ほど得をする）とは逆に、教育では格差を広げる。
- LLM を使った学習者は、実際の学習以上に「学んだ」と感じていた。

## 条件・限界
- 実験は短時間（45分）の初心者プログラミング。探索的分析は無作為化されていない変数（使い方）に基づく。研究1は利用を類似度で推定した代理指標。

## 私たちのゲームへの含意
- 助けの機能は、説明を求める使い方を簡単にし、答えを得る使い方を手間のかかるもの（または不可能）にする。「答えを見る」ボタンを置くなら、自分の答えの確定と理由の入力を先に要求する。
- 事前知識の少ないプレイヤーほど、助けに頼ると理解が下がる。初心者向けの助けは、答えの提示ではなく、問いかけと部分的なヒントにする。
- 進んだ章の数（量）を成果として見せすぎない。理解（理由を選べるか）の指標を前に出す。
