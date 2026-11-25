#!/bin/sh
# 論証の検査役：draft の mk-maps.sh と同じ手順で、draft が作らなかった地図（X4・X3 の P3・P2b）を maps/ に作る。X4_P2a は再現の確かめ。
cd "$(dirname "$0")"; D=../stationmap-kojo-draft; B=$(cd ../../.. && pwd); M=$(pwd)/maps; mkdir -p "$M"
mk() { r=$1; p=$2; n=${r}_$p
  python3 $D/stations-build-x.py --exclude $r --replace $p --out "$M/$n.pass1.js" --xreport "$M/$n.pass1.json" > "$M/$n.pass1.log" || return 1
  FOOTFALL_JSON="$M/$n.ff.json" python3 -I "$B/docs/analysis/footfall23-count.py" "$B/research/raw/web/footfall23" "$M/$n.pass1.js" > /dev/null || return 1
  python3 $D/stations-build-x.py --exclude $r --replace $p --ffall "$M/$n.ff.json" --out "$M/$n.js" --xreport "$M/$n.json" > "$M/$n.log"; }
mk X4 P2a && cmp "$M/X4_P2a.js" $D/out3/maps/X4_P2a.js && echo "X4_P2a：draft の地図とバイト一致" > "$M/repro-check.txt"
for x in "X4 P3" "X3 P3" "X4 P2b" "X3 P2b"; do mk $x; done
