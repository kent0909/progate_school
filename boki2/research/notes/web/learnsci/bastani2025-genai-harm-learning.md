---
src: web
coll: learnsci
doc: bastani2025-genai-harm-learning
file: bastani2025-genai-harm-learning.html
sha256: d3b61ee92873f2ac2eb2b7b82b28f95583c0d12a00b5cd385104dc6d21d60d92
read: full
anchors: ["Generative AI without guardrails can harm learning", "overreliance on autopilot", "four 90-min sessions for about fifty 9th, 10th, and 11th-grade classes", "GPT base 0.137", "they did not perceive that they performed worse or learned less", "GPT Base gives a correct answer only 51% of the time", "Repeat Question Text", "GPT Tutor remains passive", "Tutor copilot", "GenAICanHarmLearning"]
---
## 何の資料か
Bastani, Bastani, Sungu ら（2025, PNAS, CC BY-NC-ND, PMC。訂正あり）。トルコの高校で約1,000人（9〜11年生、約50学級）を対象にした事前登録つきの無作為化比較試験（学級単位）。数学の復習授業（90分×4回）の練習時間に、3条件を割り付けた。
- ChatGPT 風の GPT-4（GPT Base）
- 教師の作った解答・よくある誤り・ヒントを組み込み、「答えを言わずにヒントを出す」よう指示した GPT-4（GPT Tutor）
- AI なし（教科書とノート）

その後、何も使えない試験を行った。証拠の強さ：大規模なフィールド RCT（短期）。参考文献まで全部読んだ。

## 分かったこと
- 練習中の成績：GPT Base は +48%、GPT Tutor は +127%。
- AI なしの試験：GPT Base 群は対照より17%低かった（−0.054、有意）。GPT Tutor 群は対照と差なし（−0.004）。プラスにはならなかった。
- 仕組みの分析：
  - GPT Base は答えを求められると51%しか正解しない（論理の誤り42%、計算の誤り8%）。ただし誤答の影響は試験に持ち越されなかった。
  - 学生は単に答えを写していた（「松葉杖」としての利用）。GPT Base への最頻メッセージは問題文の貼り付けか「答えは？」で、こうした浅い会話がほとんどだった。
  - GPT Tutor では、解答を試みる・助けを求める実質的なやりとりが多く、回を追って増えた。
- 学生の自己認識は楽観的だった。GPT Base 群は成績が下がったのに、そう感じていなかった。GPT Tutor 群は良くなったと感じていたが、実際には差がなかった。
- 練習中は成績のばらつき（技能差）が縮まったが、AI を外した試験では縮まらなかった。
- 著者の提言：GPT Tutor も受け身（聞かれたら答えるだけ）だった。誤解を探る問いかけを能動的に行う設計、既存の知的教授システムとの組み合わせ、教師を支える使い方が有望。

## 条件・限界
- 1校・数学・2023年秋（生成 AI 普及初期）・短期の成果のみ。試験問題は練習問題とほぼ同じ構造。

## 私たちのゲームへの含意
- ゲーム内にどんな助けを置く場合も、プレイヤーが答えを「もらう」経路を作らない。ヒントは段階的にし、最後まで正解そのものを渡さない。答えを見るなら、その前に自分の答えを確定させる。
- 助けのある練習の出来は、助けのない実力を示さない。月末ふりかえりや確認問題は、助けなしで解かせ、実力をそこで測る。
- 本人の「できた感」は当てにならない（Deslauriers らとも一致）。
