#!/bin/sh
# 版0.7.1 の論証の検査（論証の検査役 Opus 5.5、11/10）。取りまとめの台本 ../stationmap-v071-draft/all71.js・lib71.js を書き換えずに使う。
# 出力はこのフォルダの out/。置き値の JSON は ../stationmap-v071-draft/run.sh と同じ書き方（A＝案α、BASE＝β〜δ の共通）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"; J=../stationmap-v071-draft/all71.js
A='"tierSpan":6,"lamMul":2,"refMode":"mix","entryDelay":2'
BASE='"tierSpan":7.9,"lamMul":1,"refMode":"mix","entryDelay":2'
run() { SEEDOFF=$2 node $J $3 "$4" > "$O/$1.txt"; }
# 1 seed を変える（設計書は seed のずらし6だけ）
run S1_a_so18 18 12 "{$A}" &
run S2_g_so18 18 12 "{$BASE,\"whiteSpace\":1}" &
run S3_d_so18 18 12 "{$BASE,\"demandSignal\":1}" &
# 2 週の揺れを K12・同じ世界（seed のずらし6）で（設計書の N の組は K6 で、T の組と世界の数が違う）
run W1_g_noise_k12 6 12 "{$BASE,\"whiteSpace\":1,\"noise\":true}" &
wait
# 3 設計書が回していない所：γ の参入をピン・距離0.2km、δ の θ を幅の中0.5、α の d₀ 0.8km
run U1_g_pins 6 12 "{$BASE,\"whiteSpace\":1,\"entryHit\":\"pins\"}" &
run U2_g_decay02 6 12 "{$BASE,\"whiteSpace\":1,\"entryHit\":\"decay\",\"d0\":0.2}" &
run U3_d_theta05 6 12 "{$BASE,\"demandSignal\":0.5}" &
run U4_a_decay08 6 12 "{$A,\"entryHit\":\"decay\",\"d0\":0.8}" &
wait
# 4 「①と⑭は水準の問題」：家賃の水準 R₀・伸び b を幅の中で動かす。段の比を幅の下の端に。
run L1_g_R25_b55 6 12 "{$BASE,\"whiteSpace\":1,\"R0\":25000,\"b\":0.55}" &
run L2_g_R25_b70_f10 6 12 "{$BASE,\"whiteSpace\":1,\"R0\":25000,\"b\":0.7,\"floor\":10000}" &
run L3_g_S52 6 12 "{\"tierSpan\":5.2,\"lamMul\":1,\"refMode\":\"mix\",\"entryDelay\":2,\"whiteSpace\":1}" &
run L4_a_k6_nonoise 6 6 "{$A}" &
wait
# 5 両立の確かめ：幅の中で ①・⑭ に最も有利な向きを全部重ねる（S 5.2・R₀ 2.5万・b 0.7・下限1.0万・θ0.5・γ1）、週の揺れも
run X1_gd_best 6 12 "{\"tierSpan\":5.2,\"lamMul\":1,\"refMode\":\"mix\",\"entryDelay\":2,\"whiteSpace\":1,\"demandSignal\":0.5,\"R0\":25000,\"b\":0.7,\"floor\":10000}" &
run X2_gd_best_noise 6 12 "{\"tierSpan\":5.2,\"lamMul\":1,\"refMode\":\"mix\",\"entryDelay\":2,\"whiteSpace\":1,\"demandSignal\":0.5,\"R0\":25000,\"b\":0.7,\"floor\":10000,\"noise\":true}" &
run X3_g_S79_refShinise 6 12 "{\"tierSpan\":7.9,\"lamMul\":1,\"entryDelay\":2,\"whiteSpace\":1}" &
run X4_gd_decay_noise_k12 6 12 "{$BASE,\"whiteSpace\":1,\"demandSignal\":1,\"entryHit\":\"decay\",\"d0\":0.4,\"noise\":true}" &
wait
grep -h "^SUMMARY" "$O"/[SWULX]*.txt > "$O/summary.txt"
