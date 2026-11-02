#!/bin/sh
# 使い方：sh batch.sh 名前 'JSON' [名前 'JSON' ...]  （4つずつ並べて回す）
cd "$(dirname "$0")"; mkdir -p out; i=0
while [ $# -ge 2 ]; do node all5.js 6 "$2" > "out/r_$1.txt" & i=$((i+1)); shift 2; if [ $i -ge 4 ]; then wait; i=0; fi; done; wait
