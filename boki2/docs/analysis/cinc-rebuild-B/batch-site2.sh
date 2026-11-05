#!/usr/bin/env bash
# 担当B：上手な打ち手（skilled）は札を「すぐ動くお金の幅の中点」で選ぶので、2号店の札（2年目9月）で必ず「見送る」を選ぶ（出費0が最大）。
# 会社が2店になったときの体験を見るため、2号店の札だけを人が選んだ形にして通す（ほかは skilled のまま）。
# 3年目5月の「器材の代金」の札は、銀行の借入が押せない（最近の利益が足りない）ことがあり、skilled は押せない手を選んで止まる（初回の6本は out/stalled-site2/）。この札だけ「24回に分けて払う」にする。
# 出力は out/skilled-site2-<area>-<seed>-<strategy>.json（analyze.js は別のまとめに入れる）
cd "$(dirname "$0")" || exit 1
{
  for area in shotengai ekimae jutaku; do for seed in 0 4; do echo "$area $seed"; done; done
} > out/jobs-site2.txt
run() {
  set -- $1
  node run-full.js --style skilled --seed "$2" --tag "-site2-$1" --choose "{\"site2@17\":\"$1:part1\",\"finance_asset@25\":\"installment\"}" >> out/batch-site2.log 2>> out/batch-site2.err
}
export -f run
xargs -P 3 -I{} bash -c 'run "{}"' < out/jobs-site2.txt
echo done >> out/batch-site2.log
