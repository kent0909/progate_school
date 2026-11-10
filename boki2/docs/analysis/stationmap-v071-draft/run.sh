#!/bin/sh
# 版0.7.1 の試し（戦略構想・管理 Opus 5.5、11/10）。計画は PLAN.md（回す前に書いた）。正本ではない（正本は boki2/tools/stationmap-sim.js）。
# 台本：all71.js・lib71.js（検査役の all6r.js・lib6r.js の写しに切り替えと ⑪〜⑭ を足したもの。切り替えを省けば元と同じ数）。
# 月の中は期待値（N の組だけ週の揺れあり）。K=12・SEEDOFF=6（版0.7 の E4 と同じ世界）。4つずつ並べて回す。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
# 0. データだけの数（段の比 S の規則・候補地の数・⑦ 案A の L）
python3 -I facts71.py ../../../research/raw/web/footfall23 ../../../js/data/tokyo23.js > "$O/facts71.txt"
S=7.9   # facts71.txt の「段の比 S」（PLAN.md 3章の規則で決まった数）
RET7='"ret":{"jutaku":[1.5,0.8],"shoten":[1.2,0.85],"shogyo":[1.0,1.0],"office":[0.9,1.1],"hanka":[0.5,1.25],"kojo":[1.1,0.9]}'
E4="\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,\"refRivals\":[\"shinise\",\"cheap\"],$RET7,\"entryDelay\":2"
A="\"tierSpan\":6,\"lamMul\":2,\"refMode\":\"mix\",\"entryDelay\":2"
BASE="\"tierSpan\":$S,\"lamMul\":1,\"refMode\":\"mix\",\"entryDelay\":2"
run() { SEEDOFF=$2 node all71.js $3 "$4" > "$O/$1.txt"; }
run T1_a_v07 6 12 "{$E4}" &
run T0_v06 6 12 "{}" &
run T2_a 6 12 "{$A}" &
run T3_b_rent 6 12 "{$BASE,\"b\":0.15}" &
wait
run T4_g_white 6 12 "{$BASE,\"whiteSpace\":1}" &
run T5_d_signal 6 12 "{$BASE,\"demandSignal\":1}" &
run T6_a_decay 6 12 "{$A,\"entryHit\":\"decay\",\"d0\":0.4}" &
run T7_gd_decay 6 12 "{$BASE,\"whiteSpace\":1,\"demandSignal\":1,\"entryHit\":\"decay\",\"d0\":0.4}" &
wait
run T8_a_7A 6 12 "{$A,\"Lmode\":\"meshAdj\",\"nu\":0.5}" &
run N2_a 6 6 "{$A,\"noise\":true}" &
run N3_b_rent 6 6 "{$BASE,\"b\":0.15,\"noise\":true}" &
run N4_g_white 6 6 "{$BASE,\"whiteSpace\":1,\"noise\":true}" &
wait
run N5_d_signal 6 6 "{$BASE,\"demandSignal\":1,\"noise\":true}"
grep -h "^SUMMARY" "$O"/T*.txt "$O"/N*.txt > "$O/summary.txt"
# 写しの確かめ：T1 の ①〜⑨ の行が、論証の検査役の e4_so6.txt（同じ置き値・同じ seed、all6r.js）と同じか
for k in ① ② ③ ④ ⑤ ⑦ ⑧ ⑨; do a=$(grep -h "^$k" "$O/T1_a_v07.txt"); b=$(grep -h "^$k" ../stationmap-v07-reasoning/out/e4_so6.txt); [ "$a" = "$b" ] && echo "$k 同じ" || echo "$k 違う"; done > "$O/copycheck.txt"
