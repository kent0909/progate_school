# 検査記録

ゲームと既存ツールのソースは取得元 `37135cbc99cd4daa78913b9ee59bf1bdd42ea7ce` と同じ。
`source-hashes.json` は対象92ファイルのGit blob SHAで、取得元のtreeと全数を機械で照合し相違0。

- `sim-check.log`: `node boki2/tools/sim-check.js`
- `ramen300.log`: `node boki2/tools/sim-check.js --ramen --runs 300`（完了後に格納）
- `validate.log`: `node boki2/tools/validate.js`
- `lexicon-check.log`: `node boki2/tools/lexicon-check.js --ramen`
- `coverage.log`: `node boki2/tools/coverage.js --ramen --stage 1`
- `law-check.log`: `node boki2/tools/law-check.js`
- `resume-verification.json`: 画面のファイル入力から標準保存を読み込んだ結果。mi・ei・seed・L・T・decisionsの全数一致を確認。進行位置をコードで設定していない。

Node.js v24.19.0、Chromium、Playwright。法令検査は同じ取得元のリポジトリ内の読了ノートを参照。外部の法令サイトへの取得は行っていない。
