#!/bin/sh
# K を増やし、seed をずらした別の世界（SEEDOFF=6、K=12）で確かめる。参入の比べのためにくじごとの結果を保存（K=6、seed は本走と同じ）
cd "$(dirname "$0")"
I08=$(grep -o "^置き値の上書き [^ ]*" out/r_i08.txt | cut -d' ' -f2); G29=$(grep -o "^置き値の上書き [^ ]*" out/r_g29.txt | cut -d' ' -f2); I06=$(grep -o "^置き値の上書き [^ ]*" out/r_i06.txt | cut -d' ' -f2)
SEEDOFF=6 node all6.js 12 '{}' > out/r_k12_v00.txt &
SEEDOFF=6 node all6.js 12 "$I08" > out/r_k12_i08.txt &
SEEDOFF=6 node all6.js 12 "$G29" > out/r_k12_g29.txt &
SEEDOFF=6 node all6.js 12 "$I06" > out/r_k12_i06.txt &
wait
SAVE=out/save_entry0.json PARTS2=0 node all6.js 6 '{"entry":false}' > /dev/null &
SAVE=out/save_p1_0.json PARTS2=0 node all6.js 6 '{"p1":0}' > /dev/null &
SAVE=out/save_v00.json PARTS2=0 node all6.js 6 '{}' > /dev/null &
SAVE=out/save_i08_entry0.json PARTS2=0 node all6.js 6 "$(echo $I08 | sed 's/}$/,"entry":false}/')" > /dev/null &
wait
SAVE=out/save_i08_p1_0.json PARTS2=0 node all6.js 6 "$(echo $I08 | sed 's/}$/,"p1":0}/')" > /dev/null &
SAVE=out/save_i08.json PARTS2=0 node all6.js 6 "$I08" > /dev/null &
wait
node cmp6.js out/save_entry0.json out/save_p1_0.json out/save_v00.json > out/r_cmp_v00.txt
node cmp6.js out/save_i08_entry0.json out/save_i08_p1_0.json out/save_i08.json > out/r_cmp_i08.txt
