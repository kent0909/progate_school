# 出店地図の測定記録

PR #11、版0.6。参入場所は未確定のため6620053704/6620188403のstation/pin両端を測った。最終合否・採用候補ではない。

- v06-results.md: 両端の初期値10検査、費用式参考比較、探索120組ずつと追加確認の結果。
- v06-initial-station/pin: K2/N300/seed0、全981候補地のreport.json/mdと分割CSV3924行ずつ。
- v06-part-full-station/pin: 設計書の外の費用式。合格に使わない。
- v06-search-station/pin: K2/N3、各120組、全report.jsonとsearch.md。search.jsonはarchiveから復元できる。
- v06-followup-rule.md / v06-followup-archive: 通過組と全数値目標の逸脱10%以内をN300再確認する選択理由。対象0組。
- v06-cache-migration.json / v06-verification.json: 計算再利用・独立試運転・N300再出力の一致。
- v06-provenance.json / tokyo23-v06.js: ゲーム本体を変えず981候補地のblobを固定。
- v06-comparison.md: 別検査役との条件差。
- checks/: ゲーム本体6検査と道具の自己検査、すべてexit0。
- regression-v04: 当時の965候補地の旧回帰。未丸め相関まで再現。
- regression-current / initial/pending.* / search/search-pending.json: 版0.5当時の履歴で、今回の測定結果ではない。

使い方は../../../tools/stationmap-sim.md。archiveの復元方法はjoin-archives.jsの冒頭を参照。
