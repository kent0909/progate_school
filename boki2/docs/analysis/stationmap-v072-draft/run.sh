#!/bin/sh
# 版0.7.2 の試し（Opus 5.5、11/10）。計画は PLAN.md（回す前に書いた）。正本ではない（正本は boki2/tools/stationmap-sim.js）。
# 台本：all72.js（../stationmap-v071-draft/all71.js の写しに、地図全体の較正・⑤の2つの量・直しの案を足したもの）＋ ../stationmap-v071-draft/lib71.js（書き換えずに使う）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
A='"tierSpan":6,"lamMul":2,"entryDelay":2,"calMode":"map"'
B='"tierSpan":7.9,"lamMul":1,"entryDelay":2,"calMode":"map"'
run() { SEEDOFF=$2 node all72.js $3 "$4" > "$O/$1.txt"; }
run M_a 6 12 "{$A}" &
run M_g 6 12 "{$B,\"whiteSpace\":1}" &
run M_d 6 12 "{$B,\"demandSignal\":1}" &
run M_gdd 6 12 "{$B,\"whiteSpace\":1,\"demandSignal\":1,\"entryHit\":\"decay\",\"d0\":0.4}" &
wait
run MN_a 6 6 "{$A,\"noise\":true}" &
run MN_g 6 6 "{$B,\"whiteSpace\":1,\"noise\":true}" &
run MN_d 6 6 "{$B,\"demandSignal\":1,\"noise\":true}" &
run M_g18 18 12 "{$B,\"whiteSpace\":1}" &
wait
python3 -I night72.py ../../../js/data/tokyo23.js > "$O/night_move72.txt"
grep -h "^SUMMARY" "$O"/M*.txt > "$O/summary.txt"
