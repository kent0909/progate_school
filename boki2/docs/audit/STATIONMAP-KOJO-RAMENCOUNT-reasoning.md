<!-- quality:v2 -->
# 論証の検査：BIZ-RAMENCOUNT23・DESIGN-STATIONMAP-KOJO・CODEX-TASK-stationmap-sim-2-ADD1（QUALITY 5.2）

この検査を書いた担当：論証の検査役（Opus 5.5、2026-11-17）。3本の書き手とも、事実の判定役とも別の担当。
検査したもの：
- 文書1：調べ物 `docs/BIZ-RAMENCOUNT23.md` 版0.1（出力 `docs/analysis/ramencount23/out/count.txt`。以下「count」）
- 文書2：設計の案 `docs/DESIGN-STATIONMAP-KOJO.md` 版0.1（試し `docs/analysis/stationmap-kojo-draft/`。以下「試し」）
- 文書3：依頼書の足し `docs/CODEX-TASK-stationmap-sim-2-ADD1.md`

見た観点：数が出力と合うかは事実の判定役が見る。ここでは「その事実から、その結論が言えるか」を見た。
- 数は、自分で出力を開いて引いた。
- 自分で回した確かめは `docs/analysis/stationmap-kojo-reasoning/` に置いた。
  - `osmcheck.py`：OSM の点を半径・単位・間引きで数え直す。出力は `out-osmcheck.txt`
  - `recount.py`：count と試しの出力を数え直す。出力は `out-recount.txt`
  - `allk-r.js`：試しの台本 `allk.js` の写し。足したのは環境変数3つだけで、省けば元と同じ数になる
  - `run.sh`・`run2.sh`：確かめの組。出力は `out/*.txt`
- 試しの数は全部、月の中が期待値・K12 の試しの台本の数で、正本の道具の数ではない。

【結果待ち：0章】
