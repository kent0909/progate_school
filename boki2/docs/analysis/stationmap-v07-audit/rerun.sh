#!/bin/sh
# run.sh の該当行を、出力先だけ判定役の作業フォルダに向けて回す
set -e
D=$(cd "$(dirname "$0")/../stationmap-v07-draft" && pwd)
O=${1:-$(cd "$(dirname "$0")" && pwd)/out}; mkdir -p "$O"
M=$D/../stationmap-v06-measure; R=$D/../stationmap-v06-reasoning
RET='"ret":{"jutaku":[1.5,0.8],"shoten":[1.2,0.85],"shogyo":[1.0,1.0],"office":[0.9,1.1],"hanka":[0.5,1.25],"kojo":[1.1,0.9]}'
REF='"refRivals":["shinise","cheap"]'
E="$REF,$RET,\"entryDelay\":2"
B="\"tierSpan\":6,\"lamMul\":2,$REF,$RET"
(cd $D && for m in station pin; do python3 -I dom.py ../stationmap-sim/v06-initial-$m > "$O/dom_$m.txt"; done)
(cd $D && node dir7.js "{}" > "$O/dir7_v06.txt")
(cd $D && node dir7.js "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E}" > "$O/dir7_E4.txt")
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E}" > "$O/E4.txt") &
(cd $R && SEEDOFF=6 node all6r.js 12 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E,\"entryHit\":\"pins\"}" > "$O/E4p.txt") &
(cd $R && node all6r.js 6 "{\"tierSpan\":6,\"lamMul\":2,\"p1\":0.12,$E,\"noise\":true}" > "$O/E4n.txt") &
(cd $M && node all6.js 6 "{\"tierSpan\":6,\"lamMul\":2,$REF,$RET}" > "$O/A3.txt") &
wait
for f in dom_station dom_pin dir7_v06 dir7_E4 E4 E4p E4n A3; do if cmp -s "$O/$f.txt" "$D/out/$f.txt"; then echo "$f 一致 $(sha256sum < $O/$f.txt | cut -c1-16)"; else echo "$f 不一致"; fi; done
