# 仕訳の机の比較試作

`index.html` を開く。素の HTML/CSS/JS のみで、外部ライブラリ・外部通信はない。
本番ゲームの保存キー・コード・共通CSSは使わない。

URL の例：`index.html?band=diff&shelf=on&input=drag&lock=1`

- `band=diff|scale|none`：差額＋差0で確定／てんびんのみ＋確定を止めない／帯なし。
- `shelf=on|off`：仮置きでは帯の名前だけを予告し、正解確定で棚を更新／店の小札と帳簿の赤点。
- `input=swipe|drag`：押す・払う・キー／加えて列や棚の増減の口へ引く。
- `lock=1`：比較設定の歯車を隠す。それ以外は歯車から変更できる。変更時は取引1から。

書類の額を押して拾い、科目を押して左右を選ぶ。置いた札を押すと、その札だけ移動・金額の選び直し・棚への返却ができる。
取引4の差額だけは計算パッドから拾う（四則演算、演算の優先順位あり）。
キーは科目で Enter/Space → 左右矢印 → Enter。置いた札で Backspace は棚へ戻す。Esc は持ち上げの取り消し。

記録は `localStorage` の `boki2.proto.desk.v1`。試遊ごとにセッションを分け、取引ごとに更新する。入力回数は実際の配置・修正・返却の回数。`wrongColumnDrops` は正解に存在する科目を引いて別の列に置いた回数で、科目自体の誤選択は確定時の `wrongRows` に記録する。`cancelled` は動き始めてからしきい値未満や落とし先外で戻った回数。
「記録を書き出す」で全記録のJSONを表示する。クリップボードAPIが使えない場合も全選択して手でコピーできる。再読込時は新しい試遊として始まり、過去の記録は保持する。

開始残高は PR #13 コメント6619864456の承認値：現金100,000・備品120,000・減価償却累計額50,000・借入金50,000・資本金120,000。資産の帯は評価勘定控除後の純額。収益・費用と「もっているもののマイナス」の帯は取引4から。取引4の初期5枚と棚の増減の口は同PRコメント6619763389の指示。

## 再現

```sh
node boki2/proto/desk/check/run.cjs
node boki2/proto/desk/check/inputs.cjs
node boki2/proto/desk/check/gestures.cjs
```

既定の検査用依存は `/opt/node-tools/node_modules/playwright`、ブラウザは `/opt/pw-browsers/chromium`。`--playwright MODULE --chromium PATH` または `PIYO_PLAYWRIGHT` / `PIYO_CHROMIUM` で上書きできる。依存は試作ページでは使わない。

この実行環境では上記の既定パスがなかったため、既存の Playwright と Chromium を明示した：

```sh
node boki2/proto/desk/check/run.cjs --http --playwright /opt/codex/cua_node/lib/node_modules/playwright --chromium /usr/bin/chromium
node boki2/proto/desk/check/inputs.cjs --playwright /opt/codex/cua_node/lib/node_modules/playwright --chromium /usr/bin/chromium
```

管理ブラウザが `file://` を `ERR_BLOCKED_BY_ADMINISTRATOR` で拒否したため、直接ファイルを開く実機確認は未了。`--http` は localhost の一時サーバーで同じ3ファイルだけを配信する。それ以外の要求は全拒否。測定方法は取りまとめ役が承認（6619864456）。通常の `run.cjs` は file URL で検査する。

- `check/results/autoplay.json`：12条件×2幅×正答/誤答の2周×4取引。誤答周は典型の誤りを2回確定→正解表示→1枚だけ直して正答。全4枚後にJSON書き出しとlocalStorageの一致も確認。
- `check/results/measurements.json`：12条件×2幅×4取引の空/入力済みの192測定。`measurements.md` は入力済み96行。ページ全高（フッターを含む）、確定の上端/下端（ページ座標）、全画面/確定ボタンそれぞれのスクロール要否を分けて記録。可視の本文から最小字、可視の操作部品から最小幅/高さを計測。横はみ出しもJSONに記録。
- `check/results/screenshots/`：12条件×2幅×取引1/4の48枚。入力済み・確定前、jpg品質60、全高。
- `check/results/inputs.json`：12条件の実タッチ払い・キーで持つ/移動/戻す・しきい値未満の戻り・誤った列へのドラッグ・棚/列へのドラッグ・設定の表示・動きを減らす設定。
- `check/results/gestures.json`：12条件×4取引を払い/引く操作で通す48行。取引4の評価勘定の減少・費用の増加の口、画面端での自動スクロール、diffだけ差額10,000円が見えることも確認。
- `check/results/regression*.log` と `regression.json`：既存ゲームの6つの検査と終了コード・最終行。

## やっていないこと

本番ゲームへの組み込み、外部サイト/Mobbinの再調査、音と完成した店の絵、人による学習効果・好みの比較、モバイル実機・読み上げソフトでの確認、マージはしていない。仕様6章の高さの未達は測定値のまま報告し、文字や押せる面積を縮めていない。確定後の編集による再記帳は対象外（次の書類へ進む前の正誤判定と選び直しまで）。
