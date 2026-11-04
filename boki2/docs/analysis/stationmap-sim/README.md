# 出店地図の測定記録

PR #11。版0.6の定義は6570645286、較正Lと費用式切替は6619705662で確定。

- v06-initial: K=2・N=300・seed=0・designの全981候補地。本測定を実行中。
- v06-part-full: 同じ乱数経路の設計書外の参考条件。合格の根拠にしない。
- v06-search-spec.json / v06-search: 幅の中の3組。b=0.25/0.4/0.55を含む。
- tokyo23-v06.js: 元ブランチの981候補地のデータをblobのまま固定。
- v06-verification.json / checks/v06-self-test.txt: 新しい仕組みと出力一致の自己検査。
- checks/: ゲーム本体の6検査はすべてexit0。ramen 300周は1928.5秒。
- regression-v04 / regression-reference.json: 当時の965候補地による旧回帰。未丸め相関まで一致。
- regression-current: 前回の版0.5・889候補地に旧機構を適用した記録。版0.6の結果ではない。
- initial/pending.* / search/search-pending.json: 版0.5当時の回答待ちの記録。今回の測定結果ではない。

較正は商店街274候補地のL中央値を使用し、参入なし・通しの老舗1軒を固定する。
N=300の基準中央値は43.99999541594629人/日、P_refは163.1493804603815。
使い方と各物差しは../../../tools/stationmap-sim.md。
