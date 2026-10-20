# CLAUDE.md

このリポジトリの主な作業対象は `boki2/`（日商簿記2級の学習ゲーム）。

- 会話は日本語で行う
- 作業を始める前に必ず `boki2/docs/HANDOFF.md`（引き継ぎメモ）と `boki2/docs/PEDAGOGY.md`（学習設計とゲーム設計の土台）を読む
- 作業の区切りごとに `boki2/docs/HANDOFF.md` の「現在の状態」「いまやっていること」「次にやること」を更新してコミットする
- ブランチは `boki2-quest`
- **時間・作業量を理由に、設計や実装の選択肢を棄却しない**（オーナーの指示。時間はいくらかけてもよい）
- 外部サイトからの情報収集は `boki2/tools/research-fetch.js` を通し、読んだ資料には読了ノートを書く。「調べた・読んだ」と報告する前に `node boki2/tools/research-check.js` を通す（仕組みは `boki2/research/README.md`）
