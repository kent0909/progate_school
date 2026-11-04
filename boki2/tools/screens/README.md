# 現行画面の写真集と目録

依頼書: `boki2/docs/CODEX-TASK-uiref-screens.md`。
取得元: `claude/keen-hawking-sfeg6f` / `37135cbc99cd4daa78913b9ee59bf1bdd42ea7ce`。

ゲームのコードと既存の playtest ツールを変更しない。
変更先は `boki2/docs/screens/` と `boki2/tools/screens/` のみ。

## 再生成

Node.js、Playwright、Chromium、sharpを使う。既存ツールと同様、Playwrightは `PIYO_PLAYWRIGHT`、Chromiumは `PIYO_CHROMIUM` で場所を指定できる。

```sh
PIYO_CHROMIUM=/usr/bin/chromium node boki2/tools/screens/inventory.js
node boki2/tools/screens/catalog.js
```

`inventory.js` が、固定seed=0・skilled・strategy=1で既存 `../playtest/auto.js` を呼ぶ。
スマホlight、PC light、スマホdarkの順に、新しいコンテキストで通常の操作を行う。
localhostのHTTPサーバー以外のブラウザ要求を全て拒否し、外部フォントも取得しない。

開始前だけ既存 `initialSave(0)` のseedのみの保存を置く。開始後の状態への直接書き込みや場面の飛ばしは行わない。
右のタブはPCで常設、スマホでは上部のボタンから開く。SVGの地区は、物件に重ならない地区名の文字をクリックする。

- `inventory.json`: 画面ごとの測定値・全文・画像SHA256・画面位置、操作と到達地点、ページエラー。
- `catalog.js`: 最初の出現と指定4時点を残し、連番を付け直し、INDEX.md・summary.json・一覧画像を生成する。
- スクリーンショットはJPEG品質55・全縦。一覧は12枚ずつ、幅1176px、品質55。
- 文字数はbody.innerText.length。文字サイズは表示Textノードと入力欄の計算値。スクロールで読める範囲を含み、disabledの操作部品は数えない。
- `SCREEN_PROFILE` で `mobile-light` / `desktop-light` / `mobile-dark` の1本だけにできる。`SCREEN_OUTPUT` で作業用の出力先を指定できる。通常の再生成には不要。

`catalog.js` は画像合計40,000,000 bytes以下・スマホdark10種類以上を機械で検査し、満たさなければ終了コード1にする。種類・時期別の不足と進行停止は隠さず目録へ記録する。再撮影前後は同じゲームソース・ブラウザ・フォントを使う。画像の最小文字やはみ出しの測定だけでは、読みやすさや重なりを保証しない。
