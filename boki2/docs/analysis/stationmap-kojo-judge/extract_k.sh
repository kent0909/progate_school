#!/bin/sh
# 判定役：出力 K*.txt・P_*.txt の本文から、工場の行・判定の行・⑫a の行・工場の候補地ごとの行を抜く（table.md を使わない）。
D="$(cd "$(dirname "$0")" && pwd)/../stationmap-kojo-draft/out"
for f in "$D"/K*.txt "$D"/P_*.txt; do
  n=$(basename "$f" .txt)
  echo "=== $n"
  grep -n '^地図全体の較正\|^工場 ⑪k\|^工場（報告）\|^工場 H2\|^工場の判定\|^⑫a 段ごと\|^判定：\|^⑤ 世界ごと\|^① 3年目' "$f" | cut -c1-400
  grep -n '^工場の候補地ごと' "$f"
done
