#!/bin/sh
# 狙った格子（幅の中）：住宅地0.6・常連の端・p1 0.15・繁華街1.3 を据え、段の比・b・p0・κ・昼の席の割合を端で
cd "$(dirname "$0")"
sh batch.sh g00 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.005,"kappa":0.3,"capLunch":0.4}' \
  g01 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.005,"kappa":0.3,"capLunch":0.6}' \
  g02 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.005,"kappa":1.0,"capLunch":0.4}' \
  g03 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.005,"kappa":1.0,"capLunch":0.6}' \
  g04 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.02,"kappa":0.3,"capLunch":0.4}' \
  g05 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.02,"kappa":0.3,"capLunch":0.6}' \
  g06 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.02,"kappa":1.0,"capLunch":0.4}' \
  g07 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.55,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  g08 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.005,"kappa":0.3,"capLunch":0.4}' \
  g09 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.005,"kappa":0.3,"capLunch":0.6}' \
  g10 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.005,"kappa":1.0,"capLunch":0.4}' \
  g11 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.005,"kappa":1.0,"capLunch":0.6}' \
  g12 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.4}' \
  g13 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.6}' \
  g14 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.4}' \
  g15 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":2.5,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  g16 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.005,"kappa":0.3,"capLunch":0.4}' \
  g17 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.005,"kappa":0.3,"capLunch":0.6}' \
  g18 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.005,"kappa":1.0,"capLunch":0.4}' \
  g19 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.005,"kappa":1.0,"capLunch":0.6}' \
  g20 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.02,"kappa":0.3,"capLunch":0.4}' \
  g21 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.02,"kappa":0.3,"capLunch":0.6}' \
  g22 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.02,"kappa":1.0,"capLunch":0.4}' \
  g23 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.55,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  g24 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.005,"kappa":0.3,"capLunch":0.4}' \
  g25 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.005,"kappa":0.3,"capLunch":0.6}' \
  g26 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.005,"kappa":1.0,"capLunch":0.4}' \
  g27 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.005,"kappa":1.0,"capLunch":0.6}' \
  g28 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.4}' \
  g29 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.6}' \
  g30 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.4}' \
  g31 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}'
