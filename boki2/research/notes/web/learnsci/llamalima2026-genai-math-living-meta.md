---
src: web
coll: learnsci
doc: llamalima2026-genai-math-living-meta
file: llamalima2026-genai-math-living-meta.pdf
sha256: b0b80b5222d98ad59130d958b265fa244639870c6fe3cffa96b084a7e8c0ef11
read: full
anchors: ["A Living Meta-Analysis on the Eﬀects of Generative AI on Learning Mathematics", "Version 5, 09/26", "on April 22nd, 2026, the editors retracted", "Generative AI as a dialogic partner", "317 new records", "normalized Helmert contrasts", "with a 95% credible interval of [0.36, 0.79]", "Replace 5 7 0.079", "anecdotal evidence against publication bias", "Boolzen et al. (2026) report a substantially smaller eﬀect", "should not be used as a stand-alone substitute for instruction", "Chat-based support alone may not be enough", "Polya-Aligned Prompting Protocol", "Wang and Kuo (2026)"]
---
## 何の資料か
Strohmaier, Bödefeld, Straser & Reinhold（2026, arXiv 2601.18685、第5版「09/26」、査読前）。生成 AI を使った数学学習介入の効果を2か月ごとに更新する「生きたメタ分析」（ベイズ多層メタ回帰）。第5版は34研究・69効果・4,349人、文献検索は2026年8月1日まで。証拠の強さ：継続更新のメタ分析（研究の多くは小規模・短期、準実験も含む）。付録の研究一覧まで全部読んだ。

## 分かったこと
- 全体効果 g=0.57（95%信用区間 0.36〜0.79）。版を重ねるごとに少しずつ上昇（第4版 0.49）。
- 研究間のばらつきは大きい（τ≈0.44）。出版バイアスはやや否定的（RoBMA の補正後も g=0.52）。
- 最も強い調整変数は「組み込み方」（ベイズ因子 >1000）：
  - 教師の授業に AI を補助として足す（supplement）g=0.88
  - 教師なしの単独利用 g=0.17
  - 教師の代わりに置く（replace）g=0.08
- 介入期間（強い証拠）：1日以下 0.26、1年以下 0.96。長いほど大きい。
- 年少の学習者ほど大きい（中程度の証拠）。最新の技術（2025年）ほど大きい（弱い証拠）。
- AI の役割（数学の専門家・対話相手・教材作成・教師支援）の違いは、効果をほとんど変えない。
- 他の総合研究：
  - Wang & Fan（2025）の ChatGPT メタ分析は2026年4月22日に撤回された。
  - その再分析（Bartoš ら）では出版バイアス補正後 g=0.37。
  - STEM 全体のメタ分析（Boolzen ら 2026）は補正後 g=0.076 と小さい。
- 個別研究：Bastani ら（高校、単独利用）は g≈0.03。チャットでの支援だけでは不十分という研究（Chen ら 2026）もある。

## 条件・限界
- 査読前で、版ごとに結果が変わる。研究の多くが小規模の準実験。成果の測定（直後か遅延か、近い内容か遠い内容か）はまだ調整変数として分析されていない。数学に限る。

## 私たちのゲームへの含意
- AI 助言役は、ゲームの教授設計（拍の順序、問い、結果パネル）を置き換えるものではない。それを補う位置に置く。AI 単独で教えさせる設計は効果が小さい。
- 短期の効果は小さく、長く続けて効く。AI 機能の価値は、数回の試遊では判断しない。
- 生成 AI と学習の総合研究は、撤回・大幅な下方修正が起きている。根拠として引く数値は版と時点を明記し、更新を追う。
