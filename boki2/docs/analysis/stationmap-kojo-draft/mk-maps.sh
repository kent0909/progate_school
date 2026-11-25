#!/bin/sh
# 版0.3（戦略構想 Opus 5.5、11/25）：「店が出せない」の規則ごとに入れ替えた地図を作る（PLAN.md 9.2。この台本より前に書いた）。正本ではない。元の tokyo23.js・stations-build.py は書き換えない。
# 1回目：stations-build-x.py で入れ替え → footfall23-count.py をその地図に回して新しい点の day・food を出す → 2回目：--ffall で入れて作り直す。
# 出力：out3/maps/<規則>_<手順>.js（地図）・.json（入れ替えの記録）・.log。out3/maps/none.js は元と同じかの確かめ。
set -e
cd "$(dirname "$0")"; B=$(cd ../../.. && pwd); M=$(pwd)/out3/maps; mkdir -p "$M"
python3 stations-build-x.py --out "$M/none.js" > "$M/none.log"
cmp "$M/none.js" "$B/js/data/tokyo23.js" && echo "none：元の tokyo23.js とバイト一致" > "$M/none-check.txt"
mk() { r=$1; p=$2; n=${r}_$p
  python3 stations-build-x.py --exclude $r --replace $p --out "$M/$n.pass1.js" --xreport "$M/$n.pass1.json" > "$M/$n.pass1.log"
  FOOTFALL_JSON="$M/$n.ff.json" python3 -I "$B/docs/analysis/footfall23-count.py" "$B/research/raw/web/footfall23" "$M/$n.pass1.js" > /dev/null
  python3 stations-build-x.py --exclude $r --replace $p --ffall "$M/$n.ff.json" --out "$M/$n.js" --xreport "$M/$n.json" > "$M/$n.log"
  rm -f "$M/$n.pass1.js"; }
for r in X1 X2 X2b X3 X4 X5 L A U; do mk $r P2a; done
for r in L A; do for p in P2b P3 P1; do mk $r $p; done; done
node mapcount.js > out3/maps.md
