#!/bin/sh
# DESIGN-STATIONMAP 版0.6 の数字の論証（docs/audit/DESIGN-STATIONMAP-v06-measure.md）の検算をまとめて回す。
# node 22。出力は out/r_*.txt、表は out/table.md、要約は out/summary.txt。ゲームのファイル・データ（js/・tools/）は書き換えない
# （coef は検算の中で一時的に変えて戻す）。4並びで約1時間（1組 K=6 で約70秒）。
# くじの seed は all6.js の中で固定（候補地 i・くじ k ごと：軒数 7000+101i+k、家賃 5000+37i+k、参入 3000+53i+k）。本走は K=6、確かめは K=12・seed を6ずらす。
cd "$(dirname "$0")"; mkdir -p out
node all6.js 6 '{}' > out/r_v00.txt          # 版0.6 の初めの置き値
node dir6.js > out/r_dir6.txt                # 4.3 の効きの向きの決まり・⑩
sh sweep1.sh                                 # 1つずつ幅の端・仕組みを外す・版0.5 の仕組みに戻す
sh sweep2.sh                                 # 幅の端を合わせる・幅の外
sh sweep3.sh                                 # 幅の中の乱数の40組（rand6.js、seed 6061）
sh sweep4.sh                                 # 狙った格子32組
sh sweep5.sh                                 # g31・g29 のまわり
sh sweep6.sh                                 # 細かい探し
sh verify.sh                                 # K=12・別の seed／参入の比べ（cmp6.js）
node tab6.js > out/table.md
grep -h "^SUMMARY" out/r_*.txt > out/summary.txt
