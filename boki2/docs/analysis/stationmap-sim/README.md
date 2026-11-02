# 出店地図の測定記録（相談中）

PR #11。元はclaude/beautiful-tesla-pfr5q5の4ee866d0fcd6b3185acd7c123be3fb400f09a583。

|実行|出力|状態|
|---|---|---|
|版0.4 K=8 seed=0、当時のデータ|regression-v04/regression.json|元の表示値64.7・69.5%・−0.01を再現|
|同じ回帰をもう1回|checks/self-test.txt、provenance.json|回帰JSONがバイト一致|
|旧機構、現行データ|regression-current/regression.json|データの差を分離。相関は旧値の許容差を外れる|
|版0.5初期値 K=8 N=300 seed=0|initial/pending.json・pending.md|相談の未回答項目を検出して周回前に停止。未測定|
|指定項目で探索を起動|search-request.json・search/search-pending.json|λ倍率の幅が未指定なので0組で停止。解なしとは判定しない|
|道具の自己検査|checks/self-test.txt|通過。架空入力の検査であり、本測定の代用ではない|
|既存ゲームの6検査|checks/|5検査通過。ramen 300周は実行中|

回帰の中央値64.72237075148459、上限越え候補地69.53367875647669%、旧算法の相関−0.006158793781421958。
旧台本の同順位処理を通常の平均順位にすると+0.026745373988640308。
現行データの実数は889候補地（設計書の886と異なる）。旧965候補地と混ぜない。

ゲームの取得元blobとの照合と差分の確認はprovenance.jsonを参照。
使い方、条件付き期待値と乱数込みの区別、未決定の定義は../../../tools/stationmap-sim.mdを参照。
