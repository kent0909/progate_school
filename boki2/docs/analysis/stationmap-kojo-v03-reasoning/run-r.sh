#!/bin/sh
# 論証の検査役（Opus 5.5、11/25）の試し。台本は allk3r.js（draft の allk3.js の写し。変えたのは require の場所と、over.kojo.cut で R1 の線を動かせる1行だけ）。
# 1行＝名 SEEDOFF 環境変数 JSON。出力 out/<名>.txt、くじごとの結果 out/<名>.json（SAVE）。
cd "$(dirname "$0")"; O=$(pwd)/out; mkdir -p "$O"
J=${1:-jobs-r.txt}
xargs -d '\n' -P 4 -n 1 sh -c 'set -f; set -- $0; [ -s "'"$O"'/$1.txt" ] && grep -q "^SUMMARY3" "'"$O"'/$1.txt" && exit 0; E=""; [ "$3" != "-" ] && E=$(echo "$3" | tr "," " "); env SEEDOFF=$2 SAVE="'"$O"'/$1.json" $E node allk3r.js 12 "$4" > "'"$O"'/$1.tmp" 2>"'"$O"'/$1.err" && mv "'"$O"'/$1.tmp" "'"$O"'/$1.txt"' < "$J"
