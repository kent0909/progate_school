#!/bin/sh
# 組み合わせ：幅の中の端を合わせる（c*）と、幅の外（x*）
cd "$(dirname "$0")"
C1='"p0":0.02,"p1":0.15,"tierSpan":3.0,"b":0.7,"capLunch":0.6'
RH='"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]}'
C3="$C1,$RH,\"kappa\":1.0,\"attr\":{\"hanka\":1.3},\"distSpan\":1.6"
sh batch.sh \
  c1_edge5 "{$C1}" c2_edge5_ret_slot "{$C1,$RH,\"saveMode\":\"slot\"}" c3_edgeall "{$C3}" c4_edgeall_slot "{$C3,\"saveMode\":\"slot\"}" \
  c5_edgeall_slot_R25 "{$C3,\"saveMode\":\"slot\",\"R0\":25000}" x1_p1_03 "{$C3,\"saveMode\":\"slot\",\"p1\":0.3}" x2_p1_05 "{$C3,\"saveMode\":\"slot\",\"p1\":0.5}" x3_round "{$C3,\"saveMode\":\"slot\",\"countMode\":\"round\"}" \
  x4_round_t4 "{$C3,\"saveMode\":\"slot\",\"countMode\":\"round\",\"tierSpan\":4.0}" x5_s30 "{$C3,\"saveMode\":\"slot\",\"sTarget\":30}" x6_retX "{$C3,\"saveMode\":\"slot\",\"ret\":{\"jutaku\":[2.0,0.6],\"hanka\":[0.3,1.5]}}" x7_all "{$C3,\"saveMode\":\"slot\",\"countMode\":\"round\",\"p1\":0.3,\"ret\":{\"jutaku\":[2.0,0.6],\"hanka\":[0.3,1.5]}}"
