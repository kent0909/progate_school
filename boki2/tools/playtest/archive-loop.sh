#!/bin/bash
# 会話記録の写し（archive.js）を2分ごとに回し続けるループ。Bash の道具の時間切れに縛られないよう、setsid と nohup で切り離して動かす。
# archive.js が失敗してもループは止まらない。二重に動かないよう、pid のファイルで確かめる。
# 見張り役（_watch）が5分ごとにループを確かめ、止まっていれば動かし直す。
# 使い方：bash archive-loop.sh <playtest.json>        … 動いていなければ動かす（動いていれば何もしない）
#         bash archive-loop.sh <playtest.json> status … 動いているかを表示
CFG="$1"; PIDF=/tmp/piyo-archive-loop.pid; WPIDF=/tmp/piyo-archive-watch.pid; LOG=/tmp/piyo-archive-loop.log
DIR="$(cd "$(dirname "$0")" && pwd)"
# 生きているか：プロセスがあり、ゾンビ（終わったのに親が後始末していない）でないこと。kill -0 だけではゾンビも生きていると出る
live() { local p="$1"; [ -n "$p" ] && [ -e "/proc/$p" ] && ! grep -q "^State:.*Z" "/proc/$p/status" 2>/dev/null; }
alive() { [ -f "$PIDF" ] && live "$(cat "$PIDF")"; }
walive() { [ -f "$WPIDF" ] && live "$(cat "$WPIDF")"; }
if [ "$2" = status ]; then if alive; then echo "動いている pid=$(cat $PIDF) 最後の写し：$(tail -1 $LOG | cut -c1-80)"; else echo "止まっている"; fi; walive && echo "見張り役：動いている pid=$(cat $WPIDF)" || echo "見張り役：止まっている"; exit 0; fi
# 見張り役：5分ごとにループが動いているかを見て、止まっていたら動かし直す
if [ "$2" = _watch ]; then echo $$ > "$WPIDF"; while true; do alive || { echo "$(date -u +%FT%TZ) 見張り役が動かし直した" >> "$LOG"; setsid nohup bash "$0" "$CFG" _run > /dev/null 2>&1 < /dev/null & }; sleep 300; done; fi
if [ "$2" = _run ]; then
  echo $$ > "$PIDF"
  while true; do node "$DIR/archive.js" "$CFG" > /tmp/piyo-archive-last.json 2>&1 && echo "$(date -u +%FT%TZ) ok" >> "$LOG" || echo "$(date -u +%FT%TZ) 失敗 $(head -c 200 /tmp/piyo-archive-last.json)" >> "$LOG"; sleep 120; done
fi
walive || setsid nohup bash "$0" "$CFG" _watch > /dev/null 2>&1 < /dev/null &
if alive; then echo "もう動いている pid=$(cat $PIDF)"; sleep 1; walive && echo "見張り役 pid=$(cat $WPIDF)"; exit 0; fi
setsid nohup bash "$0" "$CFG" _run > /dev/null 2>&1 < /dev/null &
sleep 1; alive && echo "動かした pid=$(cat $PIDF)" || echo "動かせなかった"
