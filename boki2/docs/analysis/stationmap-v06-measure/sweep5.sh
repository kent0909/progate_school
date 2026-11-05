#!/bin/sh
# g31（段の比3・b0.7・p0 0.02・p1 0.15・κ1・昼の席0.6・繁華街1.3・住宅地0.6・常連の端）と g29（κ0.3）のまわり。hoursL/hoursN は設計書に幅のない置き値
cd "$(dirname "$0")"
sh batch.sh h01 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.55}' \
  h02 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.6}' \
  h03 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.2}' \
  h04 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"R0":25000}' \
  h05 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"R0":32000}' \
  h06 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"floor":15000}' \
  h07 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6,"kojo":0.4},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  h08 '{"p1":0.15,"attr":{"hanka":1.0,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  h09 '{"p1":0.12,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  h10 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.6,"capLunch":0.6}' \
  h11 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"hoursL":5,"hoursN":4}' \
  h12 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.6,"capLunch":0.6,"hoursL":5,"hoursN":4}' \
  h13 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.6,"hoursL":5,"hoursN":4}' \
  h14 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.3,"capLunch":0.5}' \
  h15 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.6,"capLunch":0.6}' \
  h16 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.6,"capLunch":0.5,"hoursL":5,"hoursN":4}' \
  h17 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.5,"hoursL":5,"hoursN":4}' \
  h18 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.3,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6}' \
  h19 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"floor":10000}' \
  h20 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.015,"kappa":1.0,"capLunch":0.6}'
