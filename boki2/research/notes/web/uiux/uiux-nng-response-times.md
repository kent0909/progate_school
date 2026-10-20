---
src: web
coll: uiux
doc: uiux-nng-response-times
file: uiux-nng-response-times.html
sha256: 53c84eaf8c86ac7c2741d6becfd7cf73aa65ce2f0e7fc1d046a108d9795341b4
read: full
anchors: ["Usability Engineering", "percent-done indicator", "percent-done progress indicators should be used for operations taking more than about 10 seconds", "display inertia", "Assume that users will need to reorient themselves", "Miller 1968"]
---
NN/g に載った、ニールセンの『Usability Engineering』（1993年）第5章の抜粋と、2014年の追記。人の知覚に決まる3つの時間の壁。0.1秒＝反応が即時に感じられる限界（結果を出すだけでよい）。1秒＝思考の流れが途切れない限界（遅れには気づくが特別な表示は要らない。ただし画面上の物を直接動かしている感覚は薄れる）。10秒＝注意をその作業に留められる限界（それを超えるなら完了までの目安を示し、中断できる方法も示す）。

追記では、0.1秒を『物を直接触っている感覚』、1秒を『コマンドの空間を自由に動いている感覚』と言い直している。10秒を超えると利用者は戻ってきたとき状況を思い出し直す必要があるので、10秒超の遅れは作業の自然な切れ目でだけ許される。また、2〜10秒の処理に大げさな進捗バーを出すのは、画面が急に変わって気持ちを急かす『表示の慣性』に反するという注意もある。

評価への使い方。ボタンを押してから画面が変わるまでを体感で測る。押した直後に押下の反応があるか（0.1秒）、画面の切り替えが1秒以内か。起動直後の読み込みが長い時、進み具合が分かるか。ゲーム内の演出アニメが1秒を超えて操作を止めていないか。
