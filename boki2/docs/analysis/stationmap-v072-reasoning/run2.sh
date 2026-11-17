#!/bin/sh
# 続き：δ（M_d と同じ置き値・世界）の SAVE から、9章 (a) の選択肢2 の数と、同じ駅の中で軒数で選ぶ規則の当たり（bot.js）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; J=../stationmap-v072-draft/all72.js
B='"tierSpan":7.9,"lamMul":1,"entryDelay":2,"calMode":"map"'
sv() { SAVE=$O/$1.json SEEDOFF=$2 node $J $3 "$4" > "$O/$1.txt"; node bot.js "$O/$1.json" > "$O/$1_bot.txt"; rm -f "$O/$1.json"; }
sv V7_d_save 6 12 "{$B,\"demandSignal\":1}" &
sv V8_d_noise_save 6 12 "{$B,\"demandSignal\":1,\"noise\":true}" &
wait
grep -h "^SUMMARY" "$O"/V*.txt > "$O/summary.txt"
