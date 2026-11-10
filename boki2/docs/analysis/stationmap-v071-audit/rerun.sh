#!/bin/sh
# 版0.7.1 の判定役：stationmap-v071-draft/run.sh の 8・15〜17・21・22 行と同じコマンドを、出力先だけ判定役の out/rerun/ に向けて回す
set -e
cd "$(dirname "$0")/../stationmap-v071-draft"; O=$(cd ../stationmap-v071-audit && pwd)/out/rerun; mkdir -p "$O"
python3 -I facts71.py ../../../research/raw/web/footfall23 ../../../js/data/tokyo23.js > "$O/facts71.txt"
S=7.9
A="\"tierSpan\":6,\"lamMul\":2,\"refMode\":\"mix\",\"entryDelay\":2"
BASE="\"tierSpan\":$S,\"lamMul\":1,\"refMode\":\"mix\",\"entryDelay\":2"
run() { SEEDOFF=$2 node all71.js $3 "$4" > "$O/$1.txt"; }
run T0_v06 6 12 "{}" &
run T2_a 6 12 "{$A}" &
run T5_d_signal 6 12 "{$BASE,\"demandSignal\":1}" &
run T6_a_decay 6 12 "{$A,\"entryHit\":\"decay\",\"d0\":0.4}" &
wait
