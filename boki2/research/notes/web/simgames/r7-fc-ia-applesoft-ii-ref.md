---
src: web
coll: simgames
doc: r7-fc-ia-applesoft-ii-ref
file: r7-fc-ia-applesoft-ii-ref.txt
sha256: 8de93562d31caf55651544b74e8fe405062f07b3f9e5bef6b3e172995a5b7206
read: partial
pages: RND の項（早見表の段 1,055〜1,070行と、関数の本文の段 8,445〜8,470行）。ほかの章は読んでいない
anchors: ["RND(l) Returns random real number from", "RND(0) Returns last random number again.", "as if from a permanent random", "initialize (or \"seed\") a repeatable sequence", "particularly helpful in debugging programs that use RND."]
---
Apple の Applesoft II BASIC の手引き（OCR の文字、14,641行）のうち、RND の項を読んだ。早見表の段では、正の引数は0から1未満の乱数を毎回返し、0は直前の乱数をもう一度返し、負の引数（例の -3）は決まった小さな数（4.48×10のマイナス8乗）を返し、負の数ごとに違う決まった数になる、とある。本文の段でも、負の引数は同じ引数なら毎回同じ数を返し、主な用途は繰り返せる乱数の列の種を置くことだと書く。-1 のときの値そのものは書かれていない。

BIZ-SIMDESIGN 552行への答え：Lemonade Stand の行2230 の「IF RND(-1) < .5」は、毎回同じ数と比べるので、道路工事の分かれ目は半々ではなく毎回同じ向きに決まる（手引きの記述から）。どちらの向きかは -1 の値で決まり、手引きに値が無いのでエミュレータで確かめるまでは言わない。-3 の例の値は0.5よりずっと小さい。
