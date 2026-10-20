---
src: web
coll: uiux
doc: access-wcag22-pronunciation
file: access-wcag22-pronunciation.html
sha256: cbdc1386975f0f615e4b2dfc3d21fc23a3258011180568b1efc5c07bfe902938
read: full
anchors: [Users can identify the pronunciation of ambiguous words, characters like Han characters (kanji), screen readers will speak the word twice, Showing the reading of the words by ruby element, Using standard diacritical marks that can be turned off, "text-to-speech software, which is used by some people", Updated 17 November 2025]
---
W3C の WCAG 2.2 解説文書のうち、基準 3.1.6 の解説（WCAG 2.2 の達成基準 3.1.6「発音」の解説。レベル AAA）。

要点（自分の言葉で）
- 読み方が分からないと意味が決まらない語には、読み方を知る手段を用意する、という基準。目の見えない人・弱視の人に加え、読みに障害のある人を対象に挙げている。
- 日本語の漢字は1字に複数の読みがあり、読み上げソフトが誤って読むことがある、と日本語を名指しで例に出している。誤読されると内容が通じなくなる。
- 手段の例：語のすぐ後ろに括弧でかなを書く（ただし読み上げソフトは漢字とかなの両方を読むので、同じ語を2回聞くことになる、と注意書きがある）。ruby 要素で字の上にかなを振る。音声ファイルへのリンク。読み方を載せた用語集。
- 日本語では ruby は「発音」というより「読み」を示すもの、と補足している。
- 支援技術の説明の中で、読み上げソフト（文字を合成音声にする）は認知・言語・学習障害のある人の一部が使う、と書く。

このゲームの評価にどう使うか
- ふりがなの有無だけでなく、付け方を見る。ruby で振ってあるか、括弧で後ろに書いてあるか。括弧書きなら、読み上げで同じ語が2回読まれて文が長くなる（read() で取れた文字に「漢字（かんじ）」の形が出るかで見分ける）。ruby なら、読み上げソフトによっては親字とルビが続けて読まれることもあるので、これも read() の結果の形で記録する。
- 簿記の語の中で、読み方が分からないと意味まで迷う語（「借方」を「しゃっかた」と読むか「かりかた」と読むか等）を、この基準の言う「あいまいな語」として重く見る。
- 限界：AAA は高い水準で、多くのサイトは満たしていない。満たしていないこと自体を「致命的」とはせず、この人物が実際に読めたかで重さを決める。
