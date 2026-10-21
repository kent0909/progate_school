---
src: web
coll: uiux
doc: r2-uiux-govuk-error-message
file: r2-uiux-govuk-error-message.html
sha256: b77e536b1a819783dca25bb344ff084cccbf72280806a883b3991024ca5a5649
read: partial
pages: 説明・使い方・文面の書き方・調査の節（実装コードは未読）
anchors: [explain what went wrong and how to fix it, Do not clear any form fields, positive language and get to the point, An error occurred, This field is required, tested with all types of users in live services, were able to recover from the error]
---
英国政府のデザインシステムの「エラーメッセージ」部品の解説。成功事例の転用候補（行政サービスで利用者テストを経たと書いている）。
- 型：何が起きたかと直し方を平易な言葉で言う。前向きな言い方で、要点だけ。「エラーが発生しました」「必須です」のような一般的な文は文脈なしでは役に立たないので避ける。「有効・無効」という語は何も足さない。入力欄を空に戻さない（合っていた答えも残す）。入力の欄の近くに、赤の枠と文で結びつける。
- 利用者ができない問題（資格なし等）は、エラー文でなく説明ページへ送る。
- 効果：ライブのサービスで全種類の利用者に試して、何が起きたか分かる・直し方が分かる・回復できた、と記す（数値なし）。
- 読んだ範囲：本文の説明・使い方・調査の欄。HTMLの実装例のコードは読み飛ばした。
評価への使い方：不正解の表示が「違います」だけでないか。原因（どの科目・どの金額）と直し方が出るか。打ちかけの答えが消えないか。色だけの区別になっていないか。
