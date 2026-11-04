# 通常プレイの保存（再撮影の入力）

すべてseed=0。実際の画面操作で進めたゲームから、標準の `BOKI.store.exportText('boki2sim.v4')` を読み出したv4保存。保存内容の書き換えはしていない。

- `adverse-desktop-start.json`: 駅前・パート2人・大きい看板・高い問屋、その後は前月のまま進めたPCの保存。4年目の営業前（W.t=36）。
- `adverse-mobile-start.json`: 同じ方針で進めたスマホの保存。3年目6月のはじめ（W.t=26）。
- `bankrupt-desktop.json` / `bankrupt-mobile.json`: 4年目6月の倒産。開き直すと結末の原因から再表示される。
- `normal-ending.json`: PCで通常方針を4年目6月の実装終端まで完走した保存。スマホの通常終端も、画面のファイル入力でこの保存を読み込んで撮った。

再表示の例（作業フォルダへ出力する）：

```sh
SCREEN_PROFILE=mobile-light SCREEN_STYLE=idle \
  SCREEN_RESUME=boki2/tools/screens/fixtures/bankrupt-mobile.json \
  SCREEN_OUTPUT=work/ending-mobile \
  node boki2/tools/screens/inventory.js
```

倒産の探索を続ける場合は、開始点の保存に `SCREEN_DISASTER=1` を足す。4年目4月から、画面の制約内で人員・値段・仕込み・問屋・チラシ・クーポンを操作して確定する。`window.__sim`への書き込みはしていない。
