#!/bin/sh
# 判定役の回し直し。picked_reruns.txt（乱数で選んだ3本）＋ 意図して足した1本（P_K7hi_noK5：設計の案5.3の「いちばん効くのは K5」の元）。
# 出力は scratchpad の judge/ に出し、元の out/ と cmp する。
set -e
H="$(cd "$(dirname "$0")" && pwd)"; S="$H/../stationmap-kojo-draft"
J=/tmp/claude-0/-home-user-progate-school/ef13c52d-ab3f-5272-b455-0fd08a3f1e7a/scratchpad/judge
mkdir -p "$J"
{ cat "$H/picked_reruns.txt"; grep '^P_K7hi_noK5 ' "$S/out/jobs-post.txt"; } > "$J/jobs.txt"
cd "$S"
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; SEEDOFF=$2 node allk.js 12 "$3" > "'"$J"'/$1.txt"' < "$J/jobs.txt"
for n in $(cut -d' ' -f1 "$J/jobs.txt"); do
  if cmp -s "$J/$n.txt" "$S/out/$n.txt"; then echo "$n 一致 $(sha256sum < "$J/$n.txt" | cut -c1-16)"; else echo "$n 不一致"; fi
done
