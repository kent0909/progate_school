#!/bin/sh
# 設計書 版0.7 の下書きのための試し（取りまとめ役、11/5）。台本は検査役のもの（stationmap-v06-measure の all6.js、stationmap-v06-reasoning の all6r.js）を変えずに使う。
# 正本の数ではない（正本は boki2/tools/stationmap-sim.js）。月の中は期待値、noise:true の組だけ週の揺れあり。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
M=../stationmap-v06-measure; R=../stationmap-v06-reasoning
RET='"ret":{"jutaku":[1.5,0.8],"shoten":[1.2,0.85],"shogyo":[1.0,1.0],"office":[0.9,1.1],"hanka":[0.5,1.25],"kojo":[1.1,0.9]}'
REF='"refRivals":["shinise","cheap"]'
# 1. 版0.6 の「0軒」の強さ（Codex の正本の出力から。0軒の割合・上位50の0軒・0軒を使う単純な規則）
for m in station pin; do python3 -I dom.py ../stationmap-sim/v06-initial-$m > "$O/dom_$m.txt"; done
# 2. 人通りの段の比（tierSpan）とライバルの数（lamMul）を幅の外へ（K=6）
(cd $M && node all6.js 6 '{"tierSpan":6,"lamMul":2}' > "$O/A.txt")
(cd $M && node all6.js 6 '{"tierSpan":10,"lamMul":2.5}' > "$O/B.txt")
(cd $M && node all6.js 6 '{"tierSpan":6,"lamMul":3}' > "$O/C.txt")
(cd $M && node all6.js 6 '{"tierSpan":10,"lamMul":1.5}' > "$O/D.txt")
# 3. 基準の組を λ の中心（段3・商店街で 0.8×2＝1.6→2軒）に合わせる・常連の倍率を幅の端
(cd $M && node all6.js 6 "{\"tierSpan\":6,\"lamMul\":2,$REF}" > "$O/A2.txt")
(cd $M && node all6.js 6 "{\"tierSpan\":6,\"lamMul\":2,$REF,$RET}" > "$O/A3.txt")
(cd $M && node all6.js 6 "{\"tierSpan\":6,\"lamMul\":2,$REF,$RET,\"kappa\":1.0}" > "$O/A4.txt")
(cd $M && node all6.js 6 "{\"tierSpan\":10,\"lamMul\":1.5,\"refRivals\":[\"shinise\"],\"target\":52,$RET}" > "$O/D2.txt")
# 4. 確かめ（K=12・seed を6ずらす／参入をピンで割る・予兆2か月／週の揺れ）
B="\"tierSpan\":6,\"lamMul\":2,$REF,$RET"
(cd $R && SEEDOFF=6 node all6r.js 12 "{$B}" > "$O/A3_k12.txt")
(cd $R && node all6r.js 6 "{$B,\"entryHit\":\"pins\",\"entryDelay\":2}" > "$O/A3_faith.txt")
(cd $R && node all6r.js 6 "{$B,\"noise\":true}" > "$O/A3_noise.txt")
(cd $R && node all6r.js 6 "{$B,\"entryDelay\":2}" > "$O/A3_delay.txt")
E="$REF,$RET,\"entryDelay\":2"
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":6,\"lamMul\":2.5,$E}" > "$O/E1.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":8,\"lamMul\":2,$E}" > "$O/E2.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":8,\"lamMul\":2.5,$E}" > "$O/E3.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E}" > "$O/E4.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":8,\"lamMul\":2,$E,\"entryHit\":\"pins\"}" > "$O/E2p.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E,\"entryHit\":\"pins\"}" > "$O/E4p.txt")
(cd $R && node all6r.js 6 "{\"tierSpan\":8,\"lamMul\":2,$E,\"noise\":true}" > "$O/E2n.txt")
(cd $R && node all6r.js 6 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E,\"noise\":true}" > "$O/E4n.txt")
grep -h "^SUMMARY" "$O"/*.txt > "$O/summary.txt"
