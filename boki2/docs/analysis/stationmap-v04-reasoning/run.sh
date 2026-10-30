#!/bin/sh
# DESIGN-STATIONMAP 版0.4 の論証の検査の検算をまとめて回す（出力は out/r_*.txt）。node 18 以上。リポジトリのデータは書き換えない。
# out/ の r_ で始まらない .txt は、検査の途中で同じ台本を回した前の出力（⑤の行がないものがある）。
cd "$(dirname "$0")"; mkdir -p out
node h_direction.js > out/r_h_direction.txt
node h2_pref.js > out/r_h2_pref.txt
node k_rent.js > out/r_k_rent.txt
B='"refRivals":["shinise"],"countMode":"round","pRefStep":0'
SAVE=out/sites_base.json node i_all.js 8 > out/r_v00_design_as_written_K8.txt &
SAVE=out/sites_v1.json node i_all.js 6 '{"refRivals":["shinise"]}' > out/r_v01_ref_shinise.txt &
node i_all.js 6 '{"lamMul":2.5}' > out/r_v02_lam25.txt &
node i_all.js 6 '{"Pmul":0.6}' > out/r_v03_pmul06.txt &
node i_all.js 6 '{"b":0.5}' > out/r_v04_b05.txt &
node i_all.js 6 '{"Pmul":0.6,"lamMul":2}' > out/r_v06_pmul06_lam2.txt &
wait
node i_all.js 6 '{"refRivals":["shinise"],"bestParts":true}' > out/r_v10_refsh_bestparts.txt &
node i_all.js 6 '{"bestParts":true}' > out/r_v10b_design_bestparts.txt &
node i_all.js 6 '{"refRivals":["shinise"],"lamMul":1.5}' > out/r_v09_refsh_lam15.txt &
node i_all.js 6 '{"refRivals":["shinise"],"pRefStep":0}' > out/r_v12_refsh_pref0.txt &
node i_all.js 6 "{$B}" > out/r_v13_refsh_round_pref0.txt &
node i_all.js 6 '{"refRivals":["shinise"],"countMode":"round","fixedTypes":true}' > out/r_v14_refsh_round_fixedtypes.txt &
wait
node i_all.js 6 "{$B,\"tierMul\":2}" > out/r_v16_v13_tier2.txt &
node i_all.js 6 "{$B,\"b\":0.5,\"R0\":34000,\"floor\":10000}" > out/r_v17_v13_b05.txt &
node i_all.js 6 "{$B,\"R0\":45000}" > out/r_v18_v13_R045.txt &
node i_all.js 6 "{$B,\"tierMul\":2,\"b\":0.5,\"R0\":34000,\"floor\":10000}" > out/r_v19_v13_tier2_b05.txt &
node i_all.js 6 "{$B,\"tierMul\":2,\"R0\":45000}" > out/r_v20_v13_tier2_R045.txt &
node i_all.js 6 "{$B,\"b\":0.317}" > out/r_v22_v13_b032.txt &
wait
SAVE=out/sites_v13.json node i_all.js 6 "{$B}" > /dev/null
node j_hours.js out/sites_base.json > out/r_j_hours_design.txt
node j_hours.js out/sites_v1.json > out/r_j_hours_v01.txt
node j_hours.js out/sites_v13.json > out/r_j_hours_v13.txt
