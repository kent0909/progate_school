# AGENTS.md（Codex など、Claude 以外の作業者向け）

このリポジトリの主な作業対象は `boki2/`（日商簿記2級の学習ゲーム。ラーメン屋の経営として作り直し中）。決まりの元は `CLAUDE.md` と `boki2/docs/` にある。ここには、外から入る作業者が最低限守ることだけを書く。

- 会話・コミットの文・コメントは日本語
- 作業を始める前に `boki2/docs/HANDOFF.md` の「5. いまやっていること」と、渡された依頼書（`boki2/docs/CODEX-TASK-*.md`）を全文読む
- ブランチは依頼書が指定するもの。`boki2-quest` には直接 push しない（別の作業者が同時に作業している）
- 外部への通信をしない（調べ物が要るなら依頼書の「やっていないこと」に書く）
- 今あるゲーム（`boki2/index.html` のレモネード版・検定会場・成長の記録、`boki2/ramen.html`）を壊さない。終わる前に次を全部走らせて通す：
  - `node boki2/tools/sim-check.js`
  - `node boki2/tools/sim-check.js --ramen --runs 300`
  - `node boki2/tools/validate.js`
  - `node boki2/tools/lexicon-check.js --ramen`
  - `node boki2/tools/coverage.js --ramen --stage 1`
  - `node boki2/tools/law-check.js`
- 検査の基準を、通すために後から緩めない。緩めるなら理由を報告に書く
- 置き値は `boki2/js/sim/coef.js` に範囲つきで置き、出どころ（設計書の節）をコメントに書く
- 報告（PR の本文か `boki2/docs/CODEX-TASK-*.md` の末尾）には「依頼の対応表」と「やっていないこと」を必ず付ける。数は検査の出力から写す
