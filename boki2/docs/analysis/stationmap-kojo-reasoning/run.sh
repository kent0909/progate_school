#!/bin/sh
# 論証の検査役（Opus 5.5、11/17）の確かめの組。台本は allk-r.js（../stationmap-kojo-draft/allk.js の写しに環境変数2つを足した形）。K12。
# 1行＝名 SEEDOFF 環境変数(なしは -) JSON
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
G='"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
K1H='"K1":{"mC":2.54,"c":0.27}'; K1='"K1":{"mC":1.59,"c":0.27}'
ALL='"void":{"e":0.5},"big":1.32,"night":0.25,"ret":[1.5,0.7]'
cat > "$O/jobs.txt" <<J
X_repro_K7hi_s79 6 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,$ALL}}
E_K0_so30 30 - {"tierSpan":7.9,$G}
E_K7hi_so30 30 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,$ALL}}
E_K0_so42 42 - {"tierSpan":7.9,$G}
E_K7hi_so42 42 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,$ALL}}
F_K1hiK5 6 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,"night":0.25}}
F_K1hiK3K5 6 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,"big":1.32,"night":0.25}}
F_K7hi_noK5_s45 6 - {"tierSpan":4.5,$G,"kojo":{"set":"R1",$K1H,"void":{"e":0.5},"big":1.32,"ret":[1.5,0.7]}}
F_K7hi_noK5_so18 18 - {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,"void":{"e":0.5},"big":1.32,"ret":[1.5,0.7]}}
I_K7hi_daynull1 6 DAYNULL1=1 {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H,$ALL}}
H_K7hi_s94 6 - {"tierSpan":9.4,$G,"kojo":{"set":"R1",$K1H,$ALL}}
G_K1hi_p2 6 P2ALL=1 {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1H}}
G_K1K2K3_p2 6 P2ALL=1 {"tierSpan":7.9,$G,"kojo":{"set":"R1",$K1,"void":{"e":0.5},"big":1.32}}
J
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; if [ "$3" = "-" ]; then E=""; else E="$3"; fi; env SEEDOFF=$2 $E node allk-r.js 12 "$4" > "'"$O"'/$1.txt"' < "$O/jobs.txt"
echo done > "$O/run.log"
