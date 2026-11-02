#!/bin/sh
# DESIGN-STATIONMAP 版0.5・BIZ-FOOTFALL23・BIZ-RENT23 版0.2 の論証の検査（docs/audit/DESIGN-STATIONMAP-v05-reasoning.md）の検算をまとめて回す。
# node 22・python3（openpyxl・shapely）。出力は out/r_*.txt。ゲームのファイル・データ（js/・tools/data/・research/raw/）は書き換えない。
# 全部で 4並びで約15分。
cd "$(dirname "$0")"; mkdir -p out
B=../../..
# ---- 乗り換えの補正（BIZ-FOOTFALL23 9節）：元の台本をそのまま回して、割る値・相関の揺れ・コロナの落ち込み・候補地の昼の比（out/site_L.json）
python3 -I ff5.py $B/research/raw/web/footfall23 $B/js/data/tokyo23.js > out/r_ff5.txt
# ---- 閑静の枠：段の下限を 5（設計）と 1（下限なし）にしたら何駅に入るか。stations-build.py の写しを out/ に作り、out/ にだけ書く
for th in 5 1; do
  sed -e "s/if s\['tier'\] < 5: continue/if s['tier'] < $th: continue/" -e "s#^ROOT = .*#ROOT = '$(cd $B && pwd)/tools/..'#" $B/tools/stations-build.py > out/sb_quiet$th.py
  python3 -I out/sb_quiet$th.py --out out/t23_quiet$th.js | grep '閑静' > out/r_quiet_tier$th.txt
  rm -f out/sb_quiet$th.py out/t23_quiet$th.js
done
# ---- 4.3 の効きの向きと検査⑩（ライバルの値下げ）
node dir5.js > out/r_dir5.txt
# ---- 6章の検査①〜⑨：版0.5 の初めの置き値と、置き値・仕組みを動かした組
RET='"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]}'
S3='"tierSpan":3.0,"b":0.15,"R0":25000,"floor":15000'
SAVE=out/sites_v00.json node all5.js 6 '{}' > out/r_v00_as_written.txt &
sh batch.sh v01_b04 '{"b":0.4}' v02_b055 '{"b":0.55}' v03_pref_moving '{"pRefFixed":false}' \
  m1_poisson '{"countMode":"poisson"}' m2_entry0 '{"entry":0}' m4_nosplit '{"split":false}' m5_retoff '{"ret":{"jutaku":[1,1],"shoten":[1,1],"office":[1,1],"hanka":[1,1],"kojo":[1,1]}}' \
  s1_ret "{$RET}" s2_tier30 '{"tierSpan":3.0}' s3_tier30_flat "{$S3}" s4_edge "{$S3,\"attr\":{\"hanka\":1.3,\"jutaku\":0.6,\"kojo\":0.7},\"dist\":[1.2,1.0,0.75]}" \
  w1_inrange "{\"tierSpan\":3.0,\"b\":0.4,$RET,\"attr\":{\"hanka\":1.3}}" h1_Lhanka05 '{"L":{"hanka":0.5}}' h2_Lmesh '{"LsiteFile":"out/site_L.json"}' \
  t1_entry05 '{"entry":0.05}' t2_lam15 '{"lamMul":1.5}' t3_cmin1 '{"cMin":1}' t4_ret_churn '{"ret":{"jutaku":[1.5,0.6],"hanka":[0.5,1.5]}}' \
  u1_tier60 '{"tierSpan":6.0}' u2_V0_4 '{"V0":4}' u3_V0_4_cmin1 '{"V0":4,"cMin":1}' u4_ret_churn2 '{"ret":{"jutaku":[1.5,0.5],"hanka":[0.5,1.5]}}' \
  u5_t6_V04_c1 '{"tierSpan":6.0,"V0":4,"cMin":1}' u6_t4_V04_c1 '{"tierSpan":4.0,"V0":4,"cMin":1}' u7_t3_V04_c1 '{"tierSpan":3.0,"V0":4,"cMin":1}'
sh batch.sh m3_round '{"countMode":"round"}' m6_pref850 '{"pRef":{"office":850,"shogyo":850,"hanka":850,"kojo":850}}' v03_pref_moving '{"pRefFixed":false}'
SAVE=out/sites_v00.json node all5.js 6 '{}' > out/r_v00_as_written.txt
wait
grep -h '^SUMMARY' out/r_v*.txt out/r_m*.txt out/r_s*.txt out/r_w*.txt out/r_h*.txt out/r_t*.txt out/r_u*.txt > out/r_summary.txt
