# 実行部品と取得の記録

今回の作業ではnpm install等によるパッケージの追加取得も、画像処理部品の外部取得も行っていない。外部フォントも取得していない。

初版の一覧生成と画像寸法の検証に使ったSharpは、作業開始時からクラウド実行環境に入っていた0.35.5。解決先は `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs`、package.jsonも同じsharpディレクトリに存在した。リポジトリに導入したものではない。取りまとめ役の環境では使えなかったため、今回の提出版は全ツールからSharp依存を除いた。

- `verify.js`：Node標準のfs/path/cryptoと同梱 `jpeg.js` のみ。JPEGのSOF見出しを直接読み、形式と寸法を照合する。画像全体のデコードによる破損検査ではない。写真338枚と一覧19枚の計357枚について、旧版のSharpによる寸法と照合して相違0だった。
- `inventory.js`：Node標準部品、リポジトリ既存のplaytest、Playwright、Chromium。
- `catalog.js` / `contact-sheets.js`：Node標準部品とリポジトリ内の関数、一覧描画に撮影と同じPlaywright/Chromium。Canvasにローカル画像のdata URLを読み、JPEG品質55で撮影する。ブラウザのネットワーク要求はすべて拒否する。
- `compare.js` / `merge.js`：Node標準部品とリポジトリ内の関数のみ。inventoryの読み込み時にはPlaywrightを要求しない。

Playwrightも環境に既設の1.62.1を使用した。解決先は `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js`。Chromiumは既設の `/usr/bin/chromium`。他環境では `PIYO_PLAYWRIGHT` と `PIYO_CHROMIUM` で既存の場所を指定できる。再撮影・一覧再生成にはこの2部品が必要だが、完成済み写真の検証には不要。

外部requireの検索結果は `docs/screens/checks/dependency-audit.txt`。検証は次のコマンドでNODE_PATHを空にし、ネイティブ追加部品を禁止して実行した。出力全文は `docs/screens/checks/verify.log`。

```sh
env NODE_PATH= node --no-addons boki2/tools/screens/verify.js
```
