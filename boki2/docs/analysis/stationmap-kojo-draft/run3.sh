#!/bin/sh
# 版0.3 の試し（戦略構想 Opus 5.5、11/25）。計画は PLAN.md 9章（この台本と out3/ より前に書いた）。正本ではない。
# 台本：allk3.js（allk2.js の写し＋湾岸の報告・TOKYO23 で地図を差し替え）＋ libk3.js・kojodata3.js。地図は mk-maps.sh が先に作る（out3/maps/）。
# 1行＝名 SEEDOFF 環境変数（カンマ区切り、- はなし） JSON。順は PLAN.md 9.4（A → H → C → D → B → E → F → G → I → J）。出力が既にある組は回し直さない（止まったときの続き）。
set -e
cd "$(dirname "$0")"; O=$(pwd)/out3; MP=$O/maps; mkdir -p "$O"
G='"lamMul":1,"entryDelay":2,"calMode":"map","whiteSpace":1'
KM='"K1":{"mC":1.93,"c":0.27}'; KH='"K1":{"mC":2.54,"c":0.27}'; K1='"K1":{"mC":1.59,"c":0.27}'
V='"void":{"e":0.5}'; B='"big":1.32'; N='"night":0.25'; R='"ret":[1.5,0.7]'
kj() { case $1 in
  K0) echo '' ;;
  KO|KOT) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B,$N}" ;;
  KO_noK1) echo ",\"kojo\":{\"set\":\"R1\",$V,$B}" ;;
  KO_noK2) echo ",\"kojo\":{\"set\":\"R1\",$KM,$B,$N}" ;;
  KO_noK3h) echo ",\"kojo\":{\"set\":\"R1\",$KH,$V,$N}" ;;
  KO_noK3m) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$N}" ;;
  KO_noK5) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B}" ;;
  K7m) echo ",\"kojo\":{\"set\":\"R1\",$KM,$V,$B,$N,$R}" ;;
  K1only) echo ",\"kojo\":{\"set\":\"R1\",$K1}" ;;
  K2only) echo ",\"kojo\":{\"set\":\"R1\",$V}" ;;
  K3only) echo ",\"kojo\":{\"set\":\"R1\",$B}" ;;
  K6only) echo ",\"kojo\":{\"set\":\"R1\",$R}" ;;
  K1hiK5) echo ",\"kojo\":{\"set\":\"R1\",$KH,$N}" ;;
esac; }
sp() { case $1 in s214) echo '' ;; s45) echo '"tierSpan":4.5,' ;; s65) echo '"tierSpan":6.5,' ;; s79) echo '"tierSpan":7.9,' ;; esac; }
env_of() { E=DAYNULL1=1; case $1 in KOT) E=$E,KTFLAT=1 ;; esac; echo $E; }
SPANS="s214 s45 s65 s79"; SEEDS="18 30 42 54"; MAPS="X1 X2 X2b X3 X4 X5 L A U"
J="$O/jobs3.txt"; : > "$J"
job() { echo "$1 $2 $3 {$4}" >> "$J"; }  # 名 seed 環境 JSON の中
# A 今の地図
for k in K0 KO KOT; do for s in $SPANS; do job "A_${k}_$s" 6 $(env_of $k) "$(sp $s)$G$(kj $k)"; done; done
# H 入れ替えた地図（P2a）
for m in $MAPS; do for k in K0 KO KOT; do for s in $SPANS; do job "H_${m}_${k}_$s" 6 "$(env_of $k),TOKYO23=$MP/${m}_P2a.js" "$(sp $s)$G$(kj $k)"; done; done; done
# C 1つずつ抜く
for k in KO_noK1 KO_noK2 KO_noK3h KO_noK3m KO_noK5; do for s in $SPANS; do job "C_${k}_$s" 6 DAYNULL1=1 "$(sp $s)$G$(kj $k)"; done; done
# D パート2人の良いほう
for k in K0 KO; do for s in $SPANS; do job "D_${k}_$s" 6 DAYNULL1=1,P2ALL=1 "$(sp $s)$G$(kj $k)"; done; done
# B seed
for k in K0 KO KOT; do for so in $SEEDS; do job "B_${k}_s79_so$so" $so $(env_of $k) "$(sp s79)$G$(kj $k)"; done; done
# E R15 昼夜の上限の分け方
for k in K0 KO KO_noK5; do for c in 0.40 0.50; do for s in s79 s45; do job "E_${k}_cap${c#0.}_$s" 6 DAYNULL1=1 "$(sp $s)\"capLunch\":$c,$G$(kj $k)"; done; done; done
# F 段の比 2.14 の seed の運
for k in K0 K7m KO; do for so in $SEEDS; do job "F_${k}_s214_so$so" $so DAYNULL1=1 "$(sp s214)$G$(kj $k)"; done; done
# G 単独の仕組み（day＝1）
for k in K1only K2only K3only K6only K1hiK5; do for s in $SPANS; do job "G_${k}_$s" 6 DAYNULL1=1 "$(sp $s)$G$(kj $k)"; done; done
# I 入れ替えた地図の seed
for m in $MAPS; do for k in K0 KO; do for so in $SEEDS; do job "I_${m}_${k}_s79_so$so" $so "DAYNULL1=1,TOKYO23=$MP/${m}_P2a.js" "$(sp s79)$G$(kj $k)"; done; done; done
# J 入れ替えの手順の比べ
for m in L A; do for p in P2b P3 P1; do for k in K0 KO; do for s in $SPANS; do job "J_${m}${p}_${k}_$s" 6 "DAYNULL1=1,TOKYO23=$MP/${m}_$p.js" "$(sp $s)$G$(kj $k)"; done; done; done; done
wc -l < "$J" > "$O/jobs3.count"
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; [ -s "'"$O"'/$1.txt" ] && grep -q "^SUMMARY3" "'"$O"'/$1.txt" && exit 0; E=""; [ "$3" != "-" ] && E=$(echo "$3" | tr "," " "); env SEEDOFF=$2 $E node allk3.js 12 "$4" > "'"$O"'/$1.tmp" && mv "'"$O"'/$1.tmp" "'"$O"'/$1.txt"' < "$J"
grep -h "^SUMMARY" "$O"/[A-J]_*.txt > "$O/summary3.txt"
