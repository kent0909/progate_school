---
src: web
coll: learnsci
doc: kestin2025-ai-tutor-rct
file: kestin2025-ai-tutor-rct.pdf
sha256: afa6965dfd885fccdeb7ba48bec6a9e8293886db12a02860bbc388fa93e7ff72
read: full
anchors: ["AI tutoring outperforms in-class active learning", "uncanny confidence when giving an incorrect answer", "The median time on task for students in the AI group was 49 minutes", "an effect size in the range of 0.73 to 1.3 standard deviations", "could not reliably provide enough structure to scaffold problems with multiple parts", "83% of students reported", "as a crutch to circumvent critical thinking", "PS2 Pal", "took several months", "Unreflected acceptance"]
---
## 何の資料か
Kestin, Miller ら（2025, Scientific Reports, CC BY-NC-ND）。ハーバード大の生命科学系物理入門（N=194）での無作為化交差実験（2023年秋、2回の授業）。比較したのは2条件。
- 自宅で、教授法の原則を組み込んだ GPT-4 ベースの AI チューター（「PS2 Pal」）と学ぶ。
- 教室で、よく練られた能動学習の授業を受ける。

教材・ワークシートは同一。証拠の強さ：単一の無作為化交差実験（短期・直後テスト、著者の能動学習授業が比較対象）。参考文献まで全部読んだ。

## 分かったこと
- AI チューター群は事後テストの中央値で上回り（4.5 対 3.5）、伸びは2倍以上。回帰で効果量 0.63、天井効果を考慮した分位点回帰で 0.73〜1.3SD。時間は短かった（中央値49分、教室は60分）。所要時間と成績には相関がなかった。
- 関与（4.1 対 3.6）と動機づけ（3.4 対 3.1）は AI 群が高く、楽しさと成長マインドセットは同程度。
- 設計の要点：
  - システムプロンプトに「能動的に関わらせる」「認知負荷を管理する」「成長マインドセットを促す」を組み込んだ。
  - ただしプロンプトだけでは多段の問題を順に扱えなかった。そのため、問題の各部分を順番に進めるプラットフォーム側の構造を作った。
  - 幻覚（誤答）対策として、各問の段階的な模範解答をプロンプトに与えた。83%が「AI の説明は人の教員と同等以上」と回答。
- 著者の解釈：利点は、個別の即時フィードバックと自分のペースで進めること。教室で「速すぎる」と感じた学生は AI で長く、「遅すぎる」学生は短く使った。
- 構造のない ChatGPT 利用では、ふりかえりの欠如や成績の低下が報告されている（先行研究）。AI を思考の近道に使わせる場面は避けるべき、と著者は述べる。
- 準備：1授業分のプロンプト整備は数日。教授法に沿ったプラットフォームの開発には数か月かかった。

## 条件・限界
- 初めて学ぶ内容（理解・応用・分析レベル）での2回分のみ。遅延テストなし。比較授業の担当者と著者が重なる。複雑な統合や高次思考を要する場面では優位とは限らない、と著者自身が書いている。

## 私たちのゲームへの含意
- AI 助言役を入れるなら、自由対話に任せず、問題の段取り（拍1〜4の順）をゲーム側の構造で固定する。AI はその枠の中で、つまずきへの個別ヒントを出す役にとどめる。
- 正解と段階的な解き方はあらかじめ用意して AI に渡し、勘定科目の誤りなど幻覚を防ぐ。
- 速さを本人に任せる（自分のペースで進める）設計は、学習者による必要時間の差を吸収できる。
