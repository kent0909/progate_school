#!/bin/sh
# 1つずつ動かす（幅の端）と、仕組みを外す・版0.5 に戻す比べ
cd "$(dirname "$0")"
sh batch.sh \
  a_p0_005 '{"p0":0.005}' a_p0_02 '{"p0":0.02}' a_p1_003 '{"p1":0.03}' a_p1_015 '{"p1":0.15}' \
  a_k03 '{"kappa":0.3}' a_k10 '{"kappa":1.0}' a_t16 '{"tierSpan":1.6}' a_t30 '{"tierSpan":3.0}' \
  a_b015 '{"b":0.15}' a_b04 '{"b":0.4}' a_b055 '{"b":0.55}' a_b07 '{"b":0.7}' \
  a_retHi '{"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]}}' a_retLo '{"ret":{"jutaku":[1.1,0.8],"hanka":[0.9,1.25]}}' a_slot '{"saveMode":"slot"}' a_flat16 '{"saveMode":"flat","save":160000}' \
  a_cap04 '{"capLunch":0.4}' a_cap06 '{"capLunch":0.6}' a_R0_25 '{"R0":25000}' a_R0_40 '{"R0":40000}' \
  a_hanka13 '{"attr":{"hanka":1.3}}' a_jutaku09 '{"attr":{"jutaku":0.9}}' a_dist16 '{"distSpan":1.6}' a_dist12 '{"distSpan":1.2}' \
  m_p1_0 '{"p1":0}' m_entry0 '{"entry":false}' m_Lattr05 '{"Lmode":"attr05"}' m_v05mech '{"p1":0,"Lmode":"attr05","saveMode":"flat","save":160000}' \
  m_noise '{"noise":true}' m_same0 '{"sameType":0}' m_same1 '{"sameType":1}' m_floor10 '{"floor":10000}'
