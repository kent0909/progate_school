#!/bin/sh
# 判定役の回し直し（11/25）。jobs3.txt の行を名で引き、allk3.js を同じ環境・seed・JSON で回し、out3 の出力と cmp する。
# 使い方：sh rerun.sh 名...   出力は rerun/名.txt、cmp の結果は rerun/cmp.txt に足す
D=/home/user/progate_school/boki2/docs/analysis/stationmap-kojo-draft
H=$(cd "$(dirname "$0")" && pwd)
for n in "$@"; do
  line=$(grep "^$n " "$D/out3/jobs3.txt") || { echo "no job $n"; continue; }
  set -f; set -- $line; set +f
  E=""; [ "$3" != "-" ] && E=$(echo "$3" | tr "," " ")
  t0=$(date +%s)
  (cd "$D" && env SEEDOFF=$2 $E node allk3.js 12 "$4") > "$H/rerun/$n.txt"
  t1=$(date +%s)
  if cmp "$H/rerun/$n.txt" "$D/out3/$n.txt"; then r=一致; else r=不一致; fi
  echo "$n seed=$2 env=$3 secs=$((t1-t0)) cmp=$r" >> "$H/rerun/cmp.txt"
done
