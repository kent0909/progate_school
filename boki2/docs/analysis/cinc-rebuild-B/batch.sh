#!/usr/bin/env bash
# 担当B：3つの打ち方 × seed 0〜9 を台本の終わりまで通す（4本ずつ並列）。
# 加えて、倒産を探す「無理な開店」（駅前・パート2人・大きい看板・高い問屋、あとは前月のまま＝画面の写真集 S320〜 と同じ開店の手）を idle で seed 0〜4。
# 出力は out/<style>[-risky]-<seed>-<strategy>.json、一覧は out/batch.log
# 使い方：bash batch.sh
cd "$(dirname "$0")" || exit 1
{
  for style in idle random skilled; do for seed in 0 1 2 3 4 5 6 7 8 9; do echo "$style $seed -"; done; done
  for seed in 0 1 2 3 4; do echo "idle $seed risky"; done
} > out/jobs.txt
run() {
  set -- $1
  if [ "$3" = risky ]; then
    node run-full.js --style "$1" --seed "$2" --tag -risky --choose '{"site":"ekimae","form":"part2","sign":"large","supplier":"high"}' >> out/batch.log 2>> out/batch.err
  else
    node run-full.js --style "$1" --seed "$2" >> out/batch.log 2>> out/batch.err
  fi
}
export -f run
xargs -P 4 -I{} bash -c 'run "{}"' < out/jobs.txt
echo done >> out/batch.log
