#!/bin/sh
# BIZ-RAMENCOUNT23 の数を出し直す（調べ物の担当 Opus 5.5、2026-11-17）。司令塔はこれを回して out/count.txt が同じになるかを見る。
# 要るもの：python3（openpyxl・pyshp・shapely）、libreoffice（一般食堂の古い xls を xlsx に直すため）、
#           research/raw/web/ramencount23（この調べ物で取った原文）・research/raw/web/footfall23（メッシュ）・research/raw/geo/geodata（N03・A29）
set -e
cd "$(dirname "$0")"; B=../../..; O=$(pwd)/out; mkdir -p "$O"
RAW=$B/research/raw/web/ramencount23
# 一般食堂（平成25年）の甲票は .xls なので、out/ の下に xlsx に直して読む（原文は書き換えない）
mkdir -p "$O/tmp"
soffice --headless --convert-to xlsx --outdir "$O/tmp" "$RAW/mhlw-shokudo-h25-kohyo.xls" >/dev/null 2>&1
python3 -I count.py "$RAW" "$B/research/raw/web/footfall23" "$B/research/raw/geo/geodata" "$B/js/data/tokyo23.js" "$O/tmp/mhlw-shokudo-h25-kohyo.xlsx" > "$O/count.txt"
rm -rf "$O/tmp"
sha256sum "$O/count.txt"
