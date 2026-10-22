#!/bin/bash
# 途中保存のループ（コンテナの再起動で、下請けが書きかけた文書や調べものが消えないように）。
# 5分ごとに、boki2/docs と boki2/research の変更だけをコミットしてプッシュする（ゲームのコードは対象にしない。書きかけのコードを混ぜないため）。
# setsid と nohup で切り離して動かし、見張り役が5分ごとにループを確かめて止まっていれば動かし直す（archive-loop.sh と同じ形）。
# 使い方：bash boki2/tools/wip-sync.sh         … 動いていなければ動かす
#         bash boki2/tools/wip-sync.sh status  … 動いているかを表示
REPO="$(cd "$(dirname "$0")/../.." && pwd)"; PIDF=/tmp/piyo-wip-sync.pid; WPIDF=/tmp/piyo-wip-watch.pid; LOG=/tmp/piyo-wip-sync.log
live() { local p="$1"; [ -n "$p" ] && [ -e "/proc/$p" ] && ! grep -q "^State:.*Z" "/proc/$p/status" 2>/dev/null; }
alive() { [ -f "$PIDF" ] && live "$(cat "$PIDF")"; }
walive() { [ -f "$WPIDF" ] && live "$(cat "$WPIDF")"; }
if [ "$1" = status ]; then if alive; then echo "動いている pid=$(cat $PIDF) 最後：$(tail -1 $LOG 2>/dev/null | cut -c1-80)"; else echo "止まっている"; fi; walive && echo "見張り役：動いている pid=$(cat $WPIDF)" || echo "見張り役：止まっている"; exit 0; fi
if [ "$1" = _watch ]; then echo $$ > "$WPIDF"; while true; do alive || { echo "$(date -u +%FT%TZ) 見張り役が動かし直した" >> "$LOG"; setsid nohup bash "$0" _run > /dev/null 2>&1 < /dev/null & }; sleep 300; done; fi
if [ "$1" = _run ]; then
  echo $$ > "$PIDF"
  while true; do
    cd "$REPO" || exit 1
    if [ ! -e .git/index.lock ] && [ -n "$(git status --porcelain -- boki2/docs boki2/research)" ]; then
      git add -A -- boki2/docs boki2/research >/dev/null 2>&1
      if git commit -q -m "途中保存（自動・5分ごと）：docs と research の書きかけ

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Ubs6z4SgCNCQXwp7VHqmiL" -- boki2/docs boki2/research >/dev/null 2>&1; then
        for i in 1 2 3 4; do git push -q origin boki2-quest >/dev/null 2>&1 && break; sleep $((2 ** i)); done
        echo "$(date -u +%FT%TZ) 保存した $(git log --oneline -1 | cut -c1-12)" >> "$LOG"
      fi
    fi
    sleep 300
  done
fi
walive || setsid nohup bash "$0" _watch > /dev/null 2>&1 < /dev/null &
if alive; then echo "もう動いている pid=$(cat $PIDF)"; exit 0; fi
setsid nohup bash "$0" _run > /dev/null 2>&1 < /dev/null &
sleep 1; alive && echo "動かした pid=$(cat $PIDF)" || echo "動かせなかった"
