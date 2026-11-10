#!/bin/sh
# 続き（run.sh のあと）：⑥ にない規則（ライバルの多い順・0軒を避ける）を、SAVE の出力から rules.js で測る。置き値は設計書の T2・T4・T5 と同じ（K12・seed のずらし6）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out; J=../stationmap-v071-draft/all71.js
A='"tierSpan":6,"lamMul":2,"refMode":"mix","entryDelay":2'
BASE='"tierSpan":7.9,"lamMul":1,"refMode":"mix","entryDelay":2'
sv() { SAVE=$O/$1.json SEEDOFF=6 node $J 12 "$2" > "$O/$1.txt"; node rules.js "$O/$1.json" > "$O/$1_rules.txt"; rm -f "$O/$1.json"; }
sv R2_a_save "{$A}" &
sv R4_g_save "{$BASE,\"whiteSpace\":1}" &
sv R5_d_save "{$BASE,\"demandSignal\":1}" &
sv R7_gd_save "{$BASE,\"whiteSpace\":1,\"demandSignal\":1,\"entryHit\":\"decay\",\"d0\":0.4}" &
wait
# 主張4 の分け：版0.7 の E4 から「較正だけ」を mix にした組（常連 版0.7・p₁ 0.12 は E4 のまま）と、較正は E4 のまま常連と p₁ だけ版0.6 に戻した組
RET7='"ret":{"jutaku":[1.5,0.8],"shoten":[1.2,0.85],"shogyo":[1.0,1.0],"office":[0.9,1.1],"hanka":[0.5,1.25],"kojo":[1.1,0.9]}'
run() { SEEDOFF=$2 node $J $3 "$4" > "$O/$1.txt"; }
run C1_e4_mixonly 6 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$RET7,\"entryDelay\":2,\"refMode\":\"mix\"}" &
run C2_e4_ret06p108 6 12 "{\"tierSpan\":6,\"lamMul\":2,\"refRivals\":[\"shinise\",\"cheap\"],\"entryDelay\":2}" &
# 主張9：工場・繁華街の属性の倍率を 4.1 の探してよい幅の端へ（工場 0.7・繁華街 1.3）。Codex の探索に属性の倍率は入っていない
run K1_g_attr_edge 6 12 "{$BASE,\"whiteSpace\":1,\"attr\":{\"kojo\":0.7,\"hanka\":1.3}}" &
wait
grep -h "^SUMMARY" "$O"/[RCK]*.txt > "$O/summary2.txt"
