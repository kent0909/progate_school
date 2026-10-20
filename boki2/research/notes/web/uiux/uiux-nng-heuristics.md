---
src: web
coll: uiux
doc: uiux-nng-heuristics
file: uiux-nng-heuristics.html
sha256: 63a5f43a837153059e2b1124c4f7caaaefca29a98be6e3033fbf29c6b445e928
read: full
anchors: ["Usability Inspection Methods", "An ornate teapot may have excessive decora", "Visibility of System Status", "Match Between the System and the Real World", "Prevent high-cost errors first, then little frustrations", "Recognition Rather than Recall", "Interfaces should not contain information that is irrelevant or rarely needed", "Error messages should be expressed in plain language", "Help and documentation content should be easy to search"]
---
NN/g のヤコブ・ニールセンによる「ユーザーインターフェースの10のヒューリスティック」。1994年の記事を2024年1月に見直したもの。10個は、状態の見える化、現実世界との一致、ユーザーの制御と自由、一貫性と標準、エラーの予防、覚えさせず見て選ばせる、柔軟さと効率、美しさと最小限、エラーからの回復、ヘルプ。具体的な規則ではなく経験則であると冒頭で断っている。

使い方のメモ。(1) 状態の見える化は『結果がすぐ返る』ことまで含む。保存されたか、いまどの月のどこか、が常に分かるかを見る。(2) 現実世界との一致は『内部の専門語を使わず、利用者の言葉で』。このゲームは会計用語を教える側なので、初出の語にその場の言い換えがあるかが勝負になる。ただし教える対象の語は、避けるのでなく文脈で意味を渡す必要がある（そこは私の解釈）。(3) 制御と自由は、間違って押した時の『非常口』。取り消し、戻る、やり直し。(4) エラーの予防は『高い代償のミスを先に防ぐ』と明記。取り返しのつかない選択に確認があるかを見る。(5) 見て選べる＝覚えさせない。ヘルプは長いチュートリアルより、その場の文脈で出す方が良いと書かれている。(6) 最小限は『余計な情報は大事な情報の見えやすさを下げる』。(7) エラー文は平易な言葉で、何が悪いか、どう直すかまで。

評価の確かめ項目にそのまま使える。ゲームの『不正解』画面は、原因と直し方を平易な言葉で言っているか、を9番で確かめる。
