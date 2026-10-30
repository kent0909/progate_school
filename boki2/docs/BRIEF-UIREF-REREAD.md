# 依頼文：BIZ-UIREF の補強のための全文の読み直し（BRIEF-UIREF-REREAD）

2026-10-30、取りまとめ役。事実の判定書 `boki2/docs/audit/BIZ-UIREF-audit.md`（総合「要補強」）の直す点1〜4に応える。型は `BRIEF-TEMPLATE.md`、決まりは `QUALITY.md`（特に 4.5「原文は全文を読む。浅さは主張に関係しない所にある」）。

## 依頼の原文（オーナーの言葉）
「簿記２級アプリのUI・UXデザインがマジで終わってるんだけど、本コンセプトに適うUI/UXデザインとしてリファレンスできるもの相当な深度まで勉強・分析・考察してくまなく探してきて。その際に障害があったら都度相談して。」（全文と追加は `BRIEF-UIREF.md` 1章）
過去の指摘：「イヤ全部見ろよ」（QUALITY 4.5）。

## なぜ読み直すか
判定役が原文を全文読めた10文書のうち6文書で、統合にも下書きにも入っていない「不利な声・悪い面」が見つかった（例：Coffee Inc 2 の地図の印の誤タップ・週の業績の画面で30秒待ち、mikan の連続正解の赤い囲みが気が散る、freee のプルダウンで検索できない）。統合の書き手も判定役も、残りの37文書は語句の前後しか読んでいない。

## 担当と文書（全文を読む。拾い読み禁止）
- **R1（日本語アプリと口コミ）**：uA-applion-duolingo・uA-applion-minna・uA-applion-moneyforward・uA-applion-odipo・uA-applion-pboki2・uA-applion-zaim・uA-dads-spacing・uA-dads-typo・uA-gmark-minna・uA-gp-freee、uB-applion-bluearchive-rev・uB-applion-gakumas-rev・uB-applion-pokesleep-rev・uB-applion-royalmatch-rev・uB-applion-papersplease。加えて：**B の口コミのノートで `read: partial` のもの全部**（`grep -l "read: partial" boki2/research/notes/web/uiref/uB-applion-*-rev*.md`）を通読し、**Coffee Inc 2 の作品ページ（uB-applion-coffeeinc2）の口コミも**符号付けの対象に入れて、`boki2/docs/analysis/uiref-B-voices.tsv` に行を足し、`uiref-B-voices.py` で数え直す（元の行は消さない。足した行に印を付ける）
- **R2（作り手の記事）**：uB-4g-charagame-ui・uB-4g-kirby-ui・uB-fami-p3r-ui・uB-fami-p5-ui・uB-gi-balatro・uB-gi-florence・uB-gw-umamusume-talk・uB-gw-umamusume-ui2・uB-duolingo-shape・uC-duolingo-shape-language・uC-kirby-ui-denfami・uC-kirby-ui-gamewatch・uC-collectui-leaderboard
- **R3（研究と動き）**：uC-arx-juicy-or-dry・uC-arx-juicy-text・uC-arx-juicy-vis・uC-bateman-useful-junk・uC-heer-animated-transitions・uC-hicks-goodgamefeel・uC-juul-juicy-feedback・uC-tversky-animation・uC-wsu-seductive-details。加えて：**Collect UI の動画8本（uC-cui-*、raw にあれば）の動きの長さを ffprobe・ffmpeg で測る**（何が何 ms で動くか。コマの差分で始まりと終わりを決め、測り方とスクリプトを `boki2/docs/analysis/uiref-motion-measure.py` に残す）。動画が手元にないなら、ないと書く

原文は `boki2/research/raw/web/uiref/`。テキストにする道具は `boki2/docs/audit/uiref-audit-extract.py` がある（使ってよい）。

## 受け入れの基準
1. 担当の文書の**全部を全文**読む。各文書の読了ノートを `read: full` にし、anchors を前・中・後ろの3区間から足す（research-check の区間の検査が通ること）。全文を読めない文書（長すぎる論文など）は読めた範囲を `pages:` に正直に書き、partial のままにする（嘘の full より正直な partial）
2. 成果 `boki2/docs/analysis/uiref-reread-R1.md`（R2・R3 も同じ形）：文書ごとに、**統合（BIZ-UIREF.md）と下書きに入っていない事実**を全部、表にする。列：文書／事実（自分の言葉）／出典 `[[web:uiref:<doc>|「語句」]]`（4〜20字）／向き（BIZ-UIREF のどの結論・P・画面・推しを支える／反する／新しい）／その結論の行番号（BIZ-UIREF.md の）／面白さ・学び・見栄えへの効き。**反する事実と悪い面を先に、漏れなく**。「拾い漏れなし」の文書はその理由（何を探したか）を書く
3. R3 は加えて：論文ごとに、**動きの長さ・強さ・頻度の数値**（原文の表・図の値）を全部拾い、BIZ-UIREF の「置き値」（C の規則の案の動きの5段、6章 #8 の 400ms と約1秒）と比べる表。動画の実測の表
4. R1 は加えて：数え直した声の数（元の数→新しい数、スクリプトの出力を写す）と、「動きを褒める17・待たされる8」がどう変わったか
5. 先頭 `<!-- quality:v2 -->` は不要（中間の成果）。ただし章「依頼の対応表」「やっていないこと」（空にしない）を持つ
6. 終わる前に `node boki2/tools/research-check.js` のエラー0

## 手抜きの予想（先に禁じる）
1. 主張に関係する所だけ読む（禁止。浅さは関係しない所にある。前・中・後ろの anchors で確かめる）
2. 都合のよい事実（推しを支える方）だけ拾う（反する事実を先に。取りまとめ役は、判定書が挙げた5件が R1 の表に入っているかで確かめる）
3. 論文の数値を「約」で丸める・図を見ない（表・図の値を拾う。図だけの値は「図から読んだ」と書く）
4. 頭で数える（スクリプトで）
5. 「拾い漏れなし」を理由なく書く

## 決まり
外部への通信はしない（手元の原文だけで足りる。足りない所は「やっていないこと」へ）。報告 BIZ-UIREF.md・下書き3本・ゲームのファイルは変えない（R1 は uiref-B-voices.tsv に行を足すことだけ許す）。git の commit・push はしない。返事に：成果のパス、文書ごとの読んだ範囲（full／partial と理由）、拾った事実の数（反する・支える・新しい）、research-check の出力、依頼の対応表、やっていないこと。
