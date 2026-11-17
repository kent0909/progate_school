#!/bin/sh
# 判定役の足しの試し：新木場4丁目・有明3丁目（工場で day なし）を属性の中央値でなく 1 で埋めたとき、K7hi の4列がどうなるか（設計の案 9章の決定2 の両側を見るため）。
# 本人の台本は書き換えない（libk_day1.js・allk_day1.js は写しで、違いは day の埋め方の1行と require の道だけ）。
set -e
H="$(cd "$(dirname "$0")" && pwd)"; J=/tmp/claude-0/-home-user-progate-school/ef13c52d-ab3f-5272-b455-0fd08a3f1e7a/scratchpad/judge
cd "$H"
grep '^K7hi_' ../stationmap-kojo-draft/out/jobs.txt > "$J/jobs-day1.txt"
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; SEEDOFF=$2 node allk_day1.js 12 "$3" > "'"$J"'/day1_$1.txt"' < "$J/jobs-day1.txt"
for f in "$J"/day1_*.txt; do echo "== $(basename $f)"; grep '^工場 ⑪k\|^工場の判定\|^⑫a 段ごと' "$f"; done
