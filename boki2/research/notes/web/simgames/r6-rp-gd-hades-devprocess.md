---
src: web
coll: simgames
doc: r6-rp-gd-hades-devprocess
file: r6-rp-gd-hades-devprocess.html
sha256: 72976500ed7ad0ee8e9b664db1339a88dad4a9f7c12ba207fc1e2700e5aa5154
read: full
anchors: ["Supergiant's fourth outing", "GDC Twitch channel", "pilot episode of a series", "fewer than 20 people", "designed around immediacy and replayability", "not just a one-and-done game", "not necessarily games designed to be replayed many many times", "a big dysfunctional family", "nudged into a new set of tools", "not having the same experience over and over", "monthly milestone cadence"]
---
## 何の資料か
Game Developer（旧 Gamasutra）の記事（2018年12月）。Hades の早期アクセス開始直後に、Supergiant の Greg Kasavin（クリエイティブ・ディレクター）が GDC の配信で話した内容を抜き出したもの。作り手の話（一次の発言の書き起こし）。Wikipedia の Hades の記事が Pyre の教訓の出典の一つとして挙げる記事で、BIZ-SIMDESIGN-audit 00章・DESIGN-ROUND2-audit F1・F2 の確かめのために取得した。

## 読み取れること（自分の言葉で）
- 早期アクセスは最初から全体の一部として考えた。物語も、最初に始めから終わりまで全部入れるのでなく、連続ものの**第1話**のように出し、人物と出来事を足していく。
- チームは20人未満。早く更新するため、まず一つの版に絞った。
- 「見て楽しく、遊んで楽しい」ことを狙う。**すぐ始められることと遊び直せること**を軸に作り、毎回違う体験、隣の友人や配信の視聴者にも読みやすい動き、を目指した（F2 の「配信者向け」の根拠はここ）。
- 企画の出発点：前の3作のような**一度きり**でなく、出した後も広げられるゲーム。前作までは直線の構成で、心に残っても、何度も遊び直すように作ってはいなかった。短い時間でも長くでも遊べる、すぐ始められるものに惹かれた。
- 深さ：うまくいく遊び方を自分で見つけられること。完璧な組み合わせを見つけたと思ったら、別の道具の組へ**そっと押し出される**。重なり合う仕組みから豊かさが出て、自分たちの試遊でも同じ体験を繰り返さず、新しいランを始めたくなる。
- 開発は月ごとの区切りに変えた。物語の出来事の追加はデータで行うので、区切りの後半でも足せる。
- **Pyre の「ほとんどの人が1回しか遊ばなかった」という発言は、この記事にはない**（Wikipedia が同じ箇所で挙げるもう一つの出典 Rock Paper Shotgun は規約で自動取得が禁止で読めない）。この記事で確かめられるのは「前作までは何度も遊び直すように作っていなかった」まで。

## 周回の設計への含み
1. 周回の動機を「構造（すぐ始められる短い回・毎回違う展開）」に置くことが、企画の最初の条件だった。物語は連続ものの話数として後から足す。本作でも周回の骨を先に決め、話（出来事）はデータとして足せる作りにするのが筋【推論】。
2. 「完璧な組み合わせを見つけたら別の組へ押し出す」は、固定の最適を崩す仕掛け（習熟で板挟みが消える問題への手当て。PDG の論点と同じ）。
