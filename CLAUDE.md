# CLAUDE.md

このリポジトリの主な作業対象は `boki2/`（日商簿記2級の学習ゲーム）。

- 会話は日本語で行う
- 作業を始める前に必ず `boki2/docs/HANDOFF.md`（引き継ぎメモ）と `boki2/docs/PEDAGOGY.md`（学習設計とゲーム設計の土台）を読む
- 作業の区切りごとに `boki2/docs/HANDOFF.md` の「現在の状態」「いまやっていること」「次にやること」を更新してコミットする
- ブランチは `boki2-quest`
- **時間・作業量を理由に、設計や実装の選択肢を棄却しない**（オーナーの指示。時間はいくらかけてもよい）
- 外部サイトからの情報収集は `boki2/tools/research-fetch.js` を通し、読んだ資料には読了ノートを書く。「調べた・読んだ」と報告する前に `node boki2/tools/research-check.js` を通す（仕組みは `boki2/research/README.md`）
- 調査・分析・設計の質は `boki2/docs/QUALITY.md` に従う：依頼文は `boki2/docs/BRIEF-TEMPLATE.md` の型（肯定側の問い「なぜうまくいくか」を必ず入れる）、報告は `node boki2/tools/report-check.js` を通し、大きな報告・設計は書いた本人以外が判定してからオーナーへ出す。設計書の簡略化は「簡略化の台帳」に載せ、理由は学習効果・面白さ・正しさ・規約の4つだけ（「範囲外」「簡単な」「手間」は理由にならない）
