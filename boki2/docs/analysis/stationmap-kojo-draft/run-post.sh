#!/bin/sh
# 回したあとに足した分け（PLAN.md 6章）。K7・K7hi のどの項が効いたかを分けるためだけ。選ぶ規則・線には使わない。段の比 7.9・K12・SEEDOFF 6。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out
G='"tierSpan":7.9,"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
cat > "$O/jobs-post.txt" <<J
P_K1K3 6 {$G,"kojo":{"set":"R1","K1":{"mC":1.59,"c":0.27},"big":1.32}}
P_K1hiK3 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"big":1.32}}
P_K7hi_noK2 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"big":1.32,"night":0.25,"ret":[1.5,0.7]}}
P_K7hi_noK6 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"void":{"e":0.5},"big":1.32,"night":0.25}}
P_K7hi_noK5 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"void":{"e":0.5},"big":1.32,"ret":[1.5,0.7]}}
P_K7hi_noK3 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.27},"void":{"e":0.5},"night":0.25,"ret":[1.5,0.7]}}
P_K7hi_c50 6 {$G,"kojo":{"set":"R1","K1":{"mC":2.54,"c":0.5},"void":{"e":0.5},"big":1.32,"night":0.25,"ret":[1.5,0.7]}}
P_K0_bigAll 6 {$G,"kojo":{"set":"R1","big":1.59}}
J
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; SEEDOFF=$2 node allk.js 12 "$3" > "'"$O"'/$1.txt"' < "$O/jobs-post.txt"
