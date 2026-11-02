#!/bin/sh
# g31 のまわりの細かい探し（⑤と⑧の引っぱり合い）
cd "$(dirname "$0")"
sh batch.sh i01 '{"p1":0.12,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.6,"R0":25000}' \
  i02 '{"p1":0.12,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.6,"floor":15000}' \
  i03 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.6,"R0":25000,"floor":15000}' \
  i04 '{"p1":0.12,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.6,"distSpan":1.6,"R0":25000,"floor":15000}' \
  i05 '{"p1":0.12,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":1.0,"capLunch":0.55,"distSpan":1.6,"R0":25000,"floor":15000}' \
  i06 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.015,"kappa":1.0,"capLunch":0.6,"distSpan":1.6,"R0":25000}' \
  i07 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.6,"capLunch":0.6,"distSpan":1.6,"R0":25000}' \
  i08 '{"p1":0.15,"attr":{"hanka":1.3,"jutaku":0.6},"ret":{"jutaku":[1.5,0.8],"hanka":[0.5,1.25]},"tierSpan":3.0,"b":0.7,"p0":0.02,"kappa":0.8,"capLunch":0.6,"distSpan":1.6,"R0":25000}'
