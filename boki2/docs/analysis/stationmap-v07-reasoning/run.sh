#!/bin/sh
# 設計書 版0.7 の論証の検査（論証検査役、11/5）。台本は検査役のもの（../stationmap-v06-reasoning/all6r.js・dir6r.js）と
# 取りまとめ役の ../stationmap-v07-draft/dir7.js を変えずに使う。出力は out/。月の中は期待値（noise の組だけ週の揺れあり）。
# 使い方：sh run.sh  （4つずつ並べて回す。K=12 の1本が約140秒）
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
A=../stationmap-v06-reasoning/all6r.js
RET='"ret":{"jutaku":[1.5,0.8],"shoten":[1.2,0.85],"shogyo":[1.0,1.0],"office":[0.9,1.1],"hanka":[0.5,1.25],"kojo":[1.1,0.9]}'
REF='"refRivals":["shinise","cheap"]'
# 版0.7 の候補（設計書 0章の E4）
E4="\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$REF,$RET,\"entryDelay\":2"
run() { SEEDOFF=$2 node $A $3 "$4" > "$O/$1.txt"; }
# 1. 写しの確かめと、λ・人通りの比・p₁ を分ける（K=12・seed のずらし6＝設計書の E4 と同じ世界）
run e4_so6 6 12 "{$E4}" &
run lam_only_so6 6 12 "{\"lamMul\":2,\"p1\":0.12,$REF,$RET,\"entryDelay\":2}" &
run tier_only_so6 6 12 "{\"tierSpan\":6,\"p1\":0.12,$REF,$RET,\"entryDelay\":2}" &
run e4_p108_so6 6 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.08,$REF,$RET,\"entryDelay\":2}" &
wait
run tier_only_ref1_so6 6 12 "{\"tierSpan\":6,\"p1\":0.12,$RET,\"entryDelay\":2}" &
run neither_so6 6 12 "{\"p1\":0.12,$RET,\"entryDelay\":2}" &
run e4_so18 18 12 "{$E4}" &
run e4_so24 24 12 "{$E4}" &
wait
# 3. 週の揺れ（K=12）・常連の倍率を版0.6 に戻す・基準の組を老舗＋こだわりに
run e4_noise_so6 6 12 "{$E4,\"noise\":true}" &
run e4_noise_so18 18 12 "{$E4,\"noise\":true}" &
run e4_ret06_so6 6 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$REF,\"entryDelay\":2}" &
run e4_refsk_so6 6 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,\"refRivals\":[\"shinise\",\"kodawari\"],$RET,\"entryDelay\":2}" &
wait
# 4. ⑦の繁華街を置き値で動かす（版0.6 の論証の検査の e1 の型：κ1.0・繁華街の倍率1.0・昼の席0.5）・分ける組を別の seed で
run e4_hanka7_so6 6 12 "{$E4,\"kappa\":1.0,\"attr\":{\"hanka\":1.0},\"capLunch\":0.5}" &
run lam_only_so18 18 12 "{\"lamMul\":2,\"p1\":0.12,$REF,$RET,\"entryDelay\":2}" &
run tier_only_so18 18 12 "{\"tierSpan\":6,\"p1\":0.12,$REF,$RET,\"entryDelay\":2}" &
run e4_p108_so18 18 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.08,$REF,$RET,\"entryDelay\":2}" &
wait
# 5. 効きの向き：版0.6 の決まり（dir6r.js、⑩の値下げも出す）と、版0.7 の決まり（dir7.js）
node ../stationmap-v06-reasoning/dir6r.js "{$E4}" > "$O/dir6r_e4.txt"
node ../stationmap-v07-draft/dir7.js "{$E4}" > "$O/dir7_e4.txt"
node ../stationmap-v07-draft/dir7.js "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,\"refRivals\":[\"shinise\",\"kodawari\"],$RET}" > "$O/dir7_refsk.txt"
grep -h "^SUMMARY" "$O"/*.txt > "$O/summary.txt"
