#!/bin/sh
# 版0.7.2 の論証の検査（論証の検査役 Opus 5.5、11/10）。取りまとめの台本 ../stationmap-v072-draft/all72.js（と ../stationmap-v071-draft/lib71.js）を書き換えずに使う。
# 置き値は ../stationmap-v072-draft/run.sh と同じ書き方（A＝α、B＝β〜δ の共通、どちらも地図全体の較正 calMode map）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"; J=../stationmap-v072-draft/all72.js
A='"tierSpan":6,"lamMul":2,"entryDelay":2,"calMode":"map"'
B='"tierSpan":7.9,"lamMul":1,"entryDelay":2,"calMode":"map"'
run() { SEEDOFF=$2 node $J $3 "$4" > "$O/$1.txt"; }
sv() { SAVE=$O/$1.json SEEDOFF=$2 node $J $3 "$4" > "$O/$1.txt"; node bot.js "$O/$1.json" > "$O/$1_bot.txt"; rm -f "$O/$1.json"; }
# 1 決定2：α の「15超の世界の割合」は世界を増やすと 10% の線のどちら側か（設計書の M_a は seed のずらし6 の12世界で 1/12）
run V1_a_so18 18 12 "{$A}" &
run V2_a_so30 30 12 "{$A}" &
# 2 決定1：地図全体の較正（期待値で求める）に週の揺れを入れたときの①・⑭・⑤（K12、M_g と同じ世界）。SAVE から 9章 (a) の選択肢2 の数も
sv V3_g_noise_k12 6 12 "{$B,\"whiteSpace\":1,\"noise\":true}" &
# 3 δ の seed（M_d を18で）
run V4_d_so18 18 12 "{$B,\"demandSignal\":1}" &
wait
# 4 9章 (a) の選択肢2：考えて選んだ店（見える情報のボット）の赤字。期待値の列（M_g・M_a と同じ置き値・世界）
sv V5_g_save 6 12 "{$B,\"whiteSpace\":1}" &
sv V6_a_save 6 12 "{$A}" &
wait
grep -h "^SUMMARY" "$O"/V*.txt > "$O/summary.txt"
