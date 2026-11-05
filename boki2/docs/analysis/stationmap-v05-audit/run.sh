#!/bin/sh
# DESIGN-STATIONMAP 版0.5 の判定の検算（判定役）。出力は out/。リポジトリのデータ・コードは書き換えない。
cd "$(dirname "$0")"; mkdir -p out
node count.js > count.out.txt
node sim05.js 6 > out/s_a_design.txt &
node sim05.js 6 '{"entry":0}' > out/s_b_noentry.txt &
node sim05.js 6 '{"count":"round","entry":0}' > out/s_c_round_noentry.txt &
node sim05.js 6 '{"count":"poisson","entry":0}' > out/s_h_poisson_noentry.txt &
wait
node sim05.js 6 '{"b":0.4}' > out/s_d_b04.txt &
node sim05.js 6 '{"b":0.55}' > out/s_e_b055.txt &
node sim05.js 6 '{"noMix":true,"noRet":true}' > out/s_f_nomix_noret.txt &
node sim05.js 6 '{"noRet":true}' > out/s_g_noret.txt &
wait
W='"tierSet":{"1":0.5,"2":0.6,"3":0.75,"4":0.9,"5":1.1,"6":1.3,"8":1.5},"distSet":[1.2,1.0,0.75],"attrSet":{"hanka":1.3,"jutaku":0.9,"kojo":0.7}'
node sim05.js 6 "{$W}" > out/s_i_widest.txt &
node sim05.js 6 "{$W,\"b\":0.55}" > out/s_j_widest_b055.txt &
node sim05.js 6 "{$W,\"R0\":40000}" > out/s_k_widest_R40.txt &
wait
node direction05.js > out/s_direction.txt
