#!/bin/sh
# 論証の検査役の確かめの2回目（run.sh のあと）。I：m_C の店の大きさの二重の数え・働き手の項の段の倍率。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
G='"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
ALL='"void":{"e":0.5},"big":1.32,"night":0.25,"ret":[1.5,0.7]'
cat > "$O/jobs2.txt" <<J
I_K7_mC193 6 - {"tierSpan":7.9,$G,"kojo":{"set":"R1","K1":{"mC":1.93,"c":0.27},$ALL}}
I_K7hi_Tflat 6 KTFLAT=1 {"tierSpan":7.9,$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},$ALL}}
I_K7hi_Tflat_s214 6 KTFLAT=1 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},$ALL}}
I_K7hi_retmid 6 - {"tierSpan":7.9,$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"void":{"e":0.5},"big":1.32,"night":0.25,"ret":[1.3,0.8]}}
J
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; if [ "$3" = "-" ]; then E=""; else E="$3"; fi; env SEEDOFF=$2 $E node allk-r.js 12 "$4" > "'"$O"'/$1.txt"' < "$O/jobs2.txt"
echo done > "$O/run2.log"
