---
src: web
coll: simgames
doc: r5-fv-gd-juice
file: r5-fv-gd-juice.html
sha256: 38ab33dfbea5c675564d0dc2ac17ec923714bbf3b0ccf32029447b65e24e0919
read: partial
pages: 記事本文（ジュースの定義・補間と緩急・遊びに合わせる・音・効果音・環境音・粒子・止め・軌跡・周期関数の揺れ・作品の例・まとめ）。サイトのナビと他記事の一覧は読んでいない
anchors: ["Vlambeer is considered to be the master of screen shake", "linear interpolations produce tasteless results", "You will generally want an appearing animation to ease out", "should always echo your core gameplay", "Audio is often overlooked", "Pausing the game for a split second", "layer multiple sinuses of varying amplitudes and phase", "out of a tasteless fruit"]
---
Game Developer のブログ「ゲームの設計からもっとジュースを絞る」（開発者の寄稿、査読なし）。手ざわり（ゲームフィール）の技法の整理。

要点（自分の言葉で）：
- ジュース＝動く遊びの土台の上に、気持ちよい動きと音の層を足すこと。UX が客観的な原則に従うのに対し、ジュースは個人的で感情に基づく。
- **補間（トゥイーン）と緩急（イージング）**：直線の補間は味気ない。現実の物は加速・減速する。画面の部品は「出てくるときは最後にゆっくり止まる（ease-out）」を基本に。急な動きは指数、柔らかい動きは二次の緩急。
- **ジュースは遊びの芯を強めるものでなければならない**：画面の揺れ・伸び縮み・跳ねは動きの速いゲームでだけ意味がある。物語や恐怖のゲームでは控えめに。
- **音**：少ない予算の個人開発で見落とされがちだが、安く手ざわりを上げられる。操作のすべてに、はっきりした音の返りを。操作の音は低音と中音を厚く、他の音より大きく。曲は気分を作る最も効く道具。小さな環境音（川・暖炉のぱちぱち）で世界に根を張る。
- **見た目の効果**：着地の土ぼこり、ぶつかった瞬間に一瞬止める（ホールド）、軌跡（ただし動きを遅く見せる）、周期関数で植物を揺らす（複数の正弦を重ねる）。
- 例：背景を真っ白にして主役を彩度高く目立たせる、動き＋粒子＋地面に残る跡の3つの組み合わせ、地面が着地で波打ち木々が伸び縮みする世界の「呼吸」。
- 結び：まず土台。味のない果物からは良い汁は絞れない。やりすぎは時間の無駄で、遊ぶ人を苛立たせる。

ピヨ商店への示唆（ブラウザで作る形）：CSS の transition/animation の緩急（cubic-bezier）、数字が入るときの小さな跳ね、仕訳が合ったときの一瞬の止め＋音（Web Audio の短い音）、湯気の周期的な揺れ（複数の sin を重ねる SVG のパス）。経営シムの「芯」は判断と帳簿なので、ジュースは「仕訳が合った」「売上が入った」「月を締めた」の瞬間に集める。
