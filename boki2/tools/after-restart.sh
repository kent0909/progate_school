#!/bin/bash
# コンテナが再起動したあとに、最初に走らせる確かめ。「失った」と報告する前に、ここで本当に失ったかを見る。
# 1) 途中保存のループ 2) 会話記録の写しのループ 3) 下請けの台帳の各 id について、会話記録が残っているか（残っていれば SendMessage で再開できる）と、書く先のファイルの有無 4) git の状態
SP=/tmp/claude-0/-home-user-progate-school/0f5c124a-6604-5e69-b554-2beafc4f2038/scratchpad
SUB=/root/.claude/projects/-home-user-progate-school/0f5c124a-6604-5e69-b554-2beafc4f2038/subagents
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
echo "== 途中保存"; bash "$REPO/boki2/tools/wip-sync.sh" status
echo "== 会話記録の写し"; bash "$REPO/boki2/tools/playtest/archive-loop.sh" "$SP/review2/playtest.json" status
echo "== 下請け（台帳 $SP/agents.tsv）"
grep -v '^#' "$SP/agents.tsv" 2>/dev/null | while IFS=$'\t' read -r id what out st; do
  [ -z "$id" ] && continue
  f="$SUB/agent-$id.jsonl"; sz=$( [ -f "$f" ] && stat -c %s "$f" || echo 0 )
  o=$( [ -n "$out" ] && [ -e "$REPO/$out" ] && echo "あり" || echo "なし" )
  if [ "$sz" -gt 0 ]; then rec="会話記録あり（${sz}バイト）→ SendMessage で再開できる"; else rec="会話記録なし → 作り直す"; fi
  echo "- $id $what［$st］ 書く先：$out（$o） $rec"
done
echo "== git"; cd "$REPO" && git status --short | head -10; git log --oneline -1
