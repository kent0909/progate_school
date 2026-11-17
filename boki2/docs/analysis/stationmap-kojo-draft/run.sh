#!/bin/sh
# 工場の仕組みの試し（戦略構想 Opus 5.5、11/17）。計画と線は PLAN.md（台本と出力より前に書いた）。正本ではない（正本は boki2/tools/stationmap-sim.js）。
# 台本：allk.js（../stationmap-v072-draft/all72.js の写し）＋ libk.js（../stationmap-v071-draft/lib71.js の写し）＋ kojodata.js（count.txt §6 を読む）。
# 組：PLAN.md 4章。段の比 7.9・4.5・2.14（tierSpan を省く）× 12組（K12・SEEDOFF 6）＋ 7.9 の12組を SEEDOFF 18。4本ずつ並べて回す。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
node factsk.js > "$O/factsk.txt"
G='"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
K1='"K1":{"mC":1.59,"c":0.27}'; K1H='"K1":{"mC":2.54,"c":0.27}'
ALL='"void":{"e":0.5},"big":1.32,"night":0.25,"ret":[1.5,0.7]'
kojo() { # 名 kojo の中身
  case $1 in
    K0) echo '' ;;
    K1) echo ",\"kojo\":{\"set\":\"R1\",$K1}" ;;
    K1hi) echo ",\"kojo\":{\"set\":\"R1\",$K1H}" ;;
    K2) echo ',"kojo":{"set":"R1","void":{"e":0.5}}' ;;
    K3) echo ',"kojo":{"set":"R1","big":1.32}' ;;
    K5) echo ",\"kojo\":{\"set\":\"R1\",$K1,\"night\":0.25}" ;;
    K6) echo ',"kojo":{"set":"R1","ret":[1.5,0.7]}' ;;
    K7) echo ",\"kojo\":{\"set\":\"R1\",$K1,$ALL}" ;;
    K7hi) echo ",\"kojo\":{\"set\":\"R1\",$K1H,$ALL}" ;;
    K1R4) echo ",\"kojo\":{\"set\":\"R4\",$K1}" ;;
    K1R3) echo ",\"kojo\":{\"set\":\"R3\",$K1}" ;;
    K1R2) echo ",\"kojo\":{\"set\":\"R2\",$K1}" ;;
  esac
}
JOBS="$O/jobs.txt"; : > "$JOBS"
for k in K0 K1 K1hi K2 K3 K5 K6 K7 K7hi K1R4 K1R3 K1R2; do
  echo "${k}_s79 6 {\"tierSpan\":7.9,$G$(kojo $k)}" >> "$JOBS"
  echo "${k}_s45 6 {\"tierSpan\":4.5,$G$(kojo $k)}" >> "$JOBS"
  echo "${k}_s214 6 {$G$(kojo $k)}" >> "$JOBS"
  echo "${k}_s79_so18 18 {\"tierSpan\":7.9,$G$(kojo $k)}" >> "$JOBS"
done
# 1行＝名 SEEDOFF JSON。K5 は K1 に夜を足した形（PLAN.md 2章：夜の世界にも P_w×n）
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; SEEDOFF=$2 node allk.js 12 "$3" > "'"$O"'/$1.txt"' < "$JOBS"
grep -h "^SUMMARY" "$O"/K*.txt > "$O/summary.txt"
