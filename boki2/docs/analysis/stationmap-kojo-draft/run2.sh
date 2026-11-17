#!/bin/sh
# 回し直し（戦略構想 Opus 5.5、11/17）。計画と変更の表は PLAN.md 7章（この台本と out2/ より前に書いた）。正本ではない。
# 台本：allk2.js（論証の検査役の allk-r.js の写し。DAYNULL1・KTFLAT・P2ALL）＋ libk.js・kojodata.js。1行＝名 SEEDOFF 環境変数（- はなし） JSON。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out2; mkdir -p "$O"
G='"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
K1='"K1":{"mC":1.59,"c":0.27}'; KH='"K1":{"mC":2.54,"c":0.27}'; KM='"K1":{"mC":1.93,"c":0.27}'
V='"void":{"e":0.5}'; B='"big":1.32'; N='"night":0.25'; R='"ret":[1.5,0.7]'
ALL="$V,$B,$N,$R"
kj() { case $1 in
  K0) echo '' ;;
  K1hi) echo ",\"kojo\":{\"set\":\"R1\",$KH}" ;;
  K123a) echo ",\"kojo\":{\"set\":\"R1\",$K1,$V,$B}" ;;
  K123m) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B}" ;;
  K123h) echo ",\"kojo\":{\"set\":\"R1\",$KH,$V,$B}" ;;
  K7) echo ",\"kojo\":{\"set\":\"R1\",$K1,$ALL}" ;;
  K7m|K7mT) echo ",\"kojo\":{\"set\":\"R1\",$KM,$ALL}" ;;
  K7m_noK2) echo ",\"kojo\":{\"set\":\"R1\",$KM,$B,$N,$R}" ;;
  K7m_noK3) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$N,$R}" ;;
  K7m_noK5) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B,$R}" ;;
  K7m_noK6) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B,$N}" ;;
  K7hi) echo ",\"kojo\":{\"set\":\"R1\",$KH,$ALL}" ;;
esac; }
sp() { case $1 in s214) echo '' ;; s45) echo '"tierSpan":4.5,' ;; s65) echo '"tierSpan":6.5,' ;; s79) echo '"tierSpan":7.9,' ;; esac; }
J="$O/jobs2.txt"; : > "$J"
for k in K0 K1hi K123a K123m K123h K7 K7m K7mT; do for s in s214 s45 s65 s79; do
  E=DAYNULL1=1; [ $k = K7mT ] && E=DAYNULL1=1,KTFLAT=1
  echo "A_${k}_$s 6 $E {$(sp $s)$G$(kj $k)}" >> "$J"; done; done
for k in K0 K7 K7m; do for so in 18 30 42 54; do echo "B_${k}_s79_so$so $so DAYNULL1=1 {$(sp s79)$G$(kj $k)}" >> "$J"; done; done
for k in K7m_noK2 K7m_noK3 K7m_noK5 K7m_noK6; do for s in s79 s45; do echo "C_${k}_$s 6 DAYNULL1=1 {$(sp $s)$G$(kj $k)}" >> "$J"; done; done
echo "D_K7m_median_s79 6 - {$(sp s79)$G$(kj K7m)}" >> "$J"
echo "E_repro_I_K7hi_daynull1 6 DAYNULL1=1 {$(sp s79)$G$(kj K7hi)}" >> "$J"
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; E=""; [ "$3" != "-" ] && E=$(echo "$3" | tr "," " "); env SEEDOFF=$2 $E node allk2.js 12 "$4" > "'"$O"'/$1.txt"' < "$J"
cmp "$O/E_repro_I_K7hi_daynull1.txt" ../stationmap-kojo-reasoning/out/I_K7hi_daynull1.txt && echo "E の再現：バイト一致" > "$O/repro.txt" || echo "E の再現：不一致" > "$O/repro.txt"
grep -h "^SUMMARY" "$O"/[ABCD]_*.txt > "$O/summary2.txt"
