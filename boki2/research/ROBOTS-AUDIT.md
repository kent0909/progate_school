# 過去の取得を robots.txt で照らした結果（ROBOTS-AUDIT）

生成：2026-10-23T01:31:28.446Z（`node boki2/tools/robots-audit.js --write`。走らせ直せば作り直せる）

research-fetch はパスごとの robots.txt を 2026-10-22 夕まで確かめていなかった。それより前の取得も含め、取得記録（`ledger.jsonl` と `ledger-pending/*.jsonl`）の skipped 以外の全取得を、research-fetch の robotsGate と同じ決め方で照らした。

- 決め方：`User-agent: *` と `boki2-quest-research`（前方一致）の組の Allow/Disallow を集め、パス（＋クエリ）にいちばん長く合う行で決める。同じ長さなら Allow。`*` は任意の文字列、末尾の `$` は終わり。`tools/robots-audit.js` の parseRules・decide は research-fetch.js の robotsGate からそのまま写した
- robots.txt は「いま」のもの（2026-10-22〜23 に取ったもの）。取得した当時の robots.txt ではない
- robots.txt が 404・403 などで取れないホストは、依頼どおり「制限なし」とみなした。0（つながらない）・5xx・429 は「不確か」と分けて下に並べた（これも制限なしとして数えている）
- robots.txt 自体の取得は数えない。`via` が backfill・curl・crawl_bp.py・refetch・relocate の記録も「取得」として数えた（relocate は取得済みの原文を移した記録）
- 判断（原文や報告をどうするか）は取りまとめ役とオーナーがする。この文書は事実だけを並べる。raw の削除・報告の書き換えはしていない

## 数

| 項目 | 数 |
|---|---|
| 取得（skipped と robots.txt 自体を除く） | 3501 |
| URL の読めない記録 | 0 |
| ホスト | 449 |
| robots.txt が決まったホスト | 430（本文あり 341、4xx で制限なし 89） |
| robots.txt が不確か・取れないホスト（制限なしとして数えた） | 19 |
| 禁じるパスに当たった取得 | 54（8 組、ホスト 6） |
| 当たった取得の doc | 54 |
| その doc を引く報告 | 4 本、引用 23 個 |

## 禁じるパスに当たった取得

| ホスト | 禁じるパス | 件数 | 取得方法・状態 | doc の一覧 | その doc を引いている報告（引用の数） |
|---|---|---|---|---|---|
| dl.ndl.go.jp | `/api/` | 1 | research-fetch 1／200:1 | `web:bizgrowth:r5-growth-ndl-dl-3525239-info` | （引用なし） |
| dl.ndl.go.jp | `/search/` | 1 | research-fetch 1／200:1 | `web:ramen:r7-rmn-ndldl-hayamizu` | （引用なし） |
| irdb.nii.ac.jp | `/search` | 1 | research-fetch 1／403:1 | `web:ramen:r8-rmn-irdb-q-ramen` | （引用なし） |
| ndlsearch.ndl.go.jp | `/api` | 20 | research-fetch 20／200:15 429:5 | `web:ramen:r5-rmn-ndl-subject`<br>`web:ramen:r5-rmn-ndl-sru-subject`<br>`web:bizgrowth:r5-growth-ndl-q-fc-kameiten`<br>`web:bizgrowth:r5-growth-ndl-q-fc-inshoku`<br>`web:bizgrowth:r5-growth-ndl-q-fc-inshoku2`<br>`web:bizgrowth:r5-growth-ndl-q-fc-kameisha`<br>`web:ramen:r7-rmn-ndl-q-hayamizu`<br>`web:ramen:r7-rmn-ndl-q-digital-ramen`<br>`web:ramen:r7-rmn-ndl-q-ramen-manzoku`<br>`web:ramen:r7-rmn-ndl-q-irdb-ramen`<br>`web:ramen:r7-rmn-ndl-q-digital-ramen2`<br>`web:ramen:r7-fill-q-ndl-gyoretsu-shinri`<br>`web:ramen:r7-fill-q-ndl-inshoku-risk`<br>`web:ramen:r7-fill-q-ndl-joren-kakaku`<br>`web:ramen:r7-fill-q-ndl-repeater-gaishoku`<br>`web:ramen:r7-fill-q-ndl-dm-jittai`<br>`web:ramen:r7-fill-q-ndl-ramen-boom`<br>`web:ramen:r7-fill-q-ndl-repeater-gaishoku2`<br>`web:bizmgmt:r7-fc-q-ndl-gaishoku-kakaku-juyo`<br>`web:bizmgmt:r7-fc-q-ndl-pan-keiei` | docs/BIZ-RAMEN.md（1） |
| ntnu.no | `/wiki/download/` | 1 | research-fetch 1／200:1 | `web:learnsci:theory-gameflow-sweetser2005` | （引用なし） |
| warp.ndl.go.jp | `/web/` | 6 | research-fetch 6／200:6 | `web:bizmgmt:r6-fc-warp-jfc-try1`<br>`web:bizmgmt:r6-fc-warp-jfc-try2`<br>`web:bizmgmt:r6-fc-warp-jfc-idx-20200101000000`<br>`web:bizmgmt:r6-fc-warp-jfc-idx-20221001000000`<br>`web:bizmgmt:r6-fc-warp-jfc-kekka-try`<br>`web:bizmgmt:r6-fc-warp-jfc-kekka-try2` | （引用なし） |
| warp.ndl.go.jp | `/20` | 11 | research-fetch 11／200:10 403:1 | `web:bizmgmt:r6-fc-warp-jfc-2024-08a`<br>`web:bizmgmt:r6-fc-warp-jfc-2024-08c`<br>`web:bizmgmt:r6-fc-warp-jfc-2024-07a`<br>`web:bizmgmt:r6-fc-warp-jfc-idx-2022`<br>`web:bizmgmt:r6-fc-warp-jfc-kekka-2022`<br>`web:bizmgmt:r6-fc-warp-jfc-kekka-2025`<br>`web:bizmgmt:r6-fc-warp-jfc-kekka-2023`<br>`web:bizmgmt:r6-fc-warp-jfc-202302-08a`<br>`web:bizmgmt:r6-fc-warp-jfc-202302-08c`<br>`web:bizmgmt:r6-fc-warp-jfc-202302-07a`<br>`web:bizmgmt:r6-fc-warp-jfc-202302-01` | docs/BIZ-CALIB.md（5）<br>docs/BIZ-FILL-CALIB.md（3） |
| www.jstage.jst.go.jp | `/*_pdf` | 13 | research-fetch 13／200:13 | `web:bizgrowth:r5-growth-js-fc-haigyou2006`<br>`web:bizgrowth:r5-growth-js-fc-manzoku2025`<br>`web:bizgrowth:r5-growth-js-fc-fukusuten2014`<br>`web:bizgrowth:r5-growth-js-cvs-part2024`<br>`web:bizgrowth:r5-growth-js-gaishoku-kozo2000`<br>`web:bizgrowth:r5-growth-js-fc-royalty2009`<br>`web:bizgrowth:r5-growth-js-fc-shoukei2024`<br>`web:bizgrowth:r5-growth-js-gaishoku-genchika2018`<br>`web:bizgrowth:r5-growth-js-china-kyoso2020`<br>`web:bizgrowth:r5-growth-js-fc-hou2015`<br>`web:bizgrowth:r5-growth-js-fc-ranyo2015`<br>`web:bizgrowth:r5-growth-js-gaishoku-jumyo2015`<br>`web:bizgrowth:r5-growth-js-gaishoku-senryaku2012` | docs/BIZ-GROWTH.md（14） |

### 報告ごとの引用（当たった doc すべてについて）

| 報告 | 引用の数 | 引いている doc |
|---|---|---|
| docs/BIZ-GROWTH.md | 14 | `web:bizgrowth:r5-growth-js-fc-haigyou2006`、`web:bizgrowth:r5-growth-js-fc-royalty2009`、`web:bizgrowth:r5-growth-js-fc-ranyo2015`、`web:bizgrowth:r5-growth-js-cvs-part2024`、`web:bizgrowth:r5-growth-js-fc-manzoku2025`、`web:bizgrowth:r5-growth-js-fc-fukusuten2014`、`web:bizgrowth:r5-growth-js-fc-shoukei2024`、`web:bizgrowth:r5-growth-js-gaishoku-jumyo2015`、`web:bizgrowth:r5-growth-js-gaishoku-kozo2000`、`web:bizgrowth:r5-growth-js-fc-hou2015`、`web:bizgrowth:r5-growth-js-gaishoku-genchika2018` |
| docs/BIZ-CALIB.md | 5 | `web:bizmgmt:r6-fc-warp-jfc-202302-08a`、`web:bizmgmt:r6-fc-warp-jfc-2024-08a`、`web:bizmgmt:r6-fc-warp-jfc-202302-08c` |
| docs/BIZ-FILL-CALIB.md | 3 | `web:bizmgmt:r6-fc-warp-jfc-202302-08a`、`web:bizmgmt:r6-fc-warp-jfc-202302-08c`、`web:bizmgmt:r6-fc-warp-jfc-2024-08a` |
| docs/BIZ-RAMEN.md | 1 | `web:ramen:r5-rmn-ndl-sru-subject` |

### 取得ごとの一覧

| ホスト | 禁じるパス | 時刻 | doc | 状態 | via | 照らしたパス |
|---|---|---|---|---|---|---|
| dl.ndl.go.jp | `/api/` | 2026-10-22T08:17:10.636Z | `web:bizgrowth:r5-growth-ndl-dl-3525239-info` | 200 | research-fetch | `/api/item/search/info:ndljp/pid/3525239` |
| dl.ndl.go.jp | `/search/` | 2026-10-22T08:42:43.994Z | `web:ramen:r7-rmn-ndldl-hayamizu` | 200 | research-fetch | `/search/searchResult?keyword=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E3%81%A8%E6%84%9B%E5%9B%BD` |
| irdb.nii.ac.jp | `/search` | 2026-10-22T09:24:30.020Z | `web:ramen:r8-rmn-irdb-q-ramen` | 403 | research-fetch | `/search?kywd=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E5%BA%97&lang=0` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T05:21:25.896Z | `web:ramen:r5-rmn-ndl-subject` | 200 | research-fetch | `/api/opensearch?subject=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3&cnt=1` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T05:22:20.550Z | `web:ramen:r5-rmn-ndl-sru-subject` | 200 | research-fetch | `/api/sru?operation=searchRetrieve&maximumRecords=5&query=subject%3D%22%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%22%20AND%20dp` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:16:26.260Z | `web:bizgrowth:r5-growth-ndl-q-fc-kameiten` | 200 | research-fetch | `/api/opensearch?any=%E3%83%95%E3%83%A9%E3%83%B3%E3%83%81%E3%83%A3%E3%82%A4%E3%82%BA%20%E5%8A%A0%E7%9B%9F%E5%BA%97%20%E8%` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:19:27.449Z | `web:bizgrowth:r5-growth-ndl-q-fc-inshoku` | 429 | research-fetch | `/api/opensearch?any=%E3%83%95%E3%83%A9%E3%83%B3%E3%83%81%E3%83%A3%E3%82%A4%E3%82%BA%20%E9%A3%B2%E9%A3%9F%20%E5%8A%A0%E7%` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:22:08.611Z | `web:bizgrowth:r5-growth-ndl-q-fc-inshoku2` | 200 | research-fetch | `/api/opensearch?any=%E3%83%95%E3%83%A9%E3%83%B3%E3%83%81%E3%83%A3%E3%82%A4%E3%82%BA%20%E9%A3%B2%E9%A3%9F%20%E5%8A%A0%E7%` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:22:14.629Z | `web:bizgrowth:r5-growth-ndl-q-fc-kameisha` | 429 | research-fetch | `/api/opensearch?any=%E3%83%95%E3%83%A9%E3%83%B3%E3%83%81%E3%83%A3%E3%82%A4%E3%82%BA%20%E5%8A%A0%E7%9B%9F%E8%80%85&cnt=10` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:37:06.886Z | `web:ramen:r7-rmn-ndl-q-hayamizu` | 200 | research-fetch | `/api/opensearch?title=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E3%81%A8%E6%84%9B%E5%9B%BD` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:37:11.431Z | `web:ramen:r7-rmn-ndl-q-digital-ramen` | 429 | research-fetch | `/api/opensearch?title=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3&dpid=iss-ndl-dl-online&cnt=100` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:38:29.348Z | `web:ramen:r7-rmn-ndl-q-ramen-manzoku` | 200 | research-fetch | `/api/opensearch?any=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%E5%BA%97%20%E9%A1%A7%E5%AE%A2%E6%BA%80%E8%B6%B3&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:38:54.535Z | `web:ramen:r7-rmn-ndl-q-irdb-ramen` | 429 | research-fetch | `/api/opensearch?any=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3&dpid=irdb&cnt=200` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:42:43.034Z | `web:ramen:r7-rmn-ndl-q-digital-ramen2` | 200 | research-fetch | `/api/opensearch?title=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3&dpid=iss-ndl-dl-online&cnt=100` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:46:37.996Z | `web:ramen:r7-fill-q-ndl-gyoretsu-shinri` | 200 | research-fetch | `/api/opensearch?any=%E8%A1%8C%E5%88%97%20%E5%BF%83%E7%90%86%20%E5%BE%85%E3%81%A1&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:46:48.233Z | `web:ramen:r7-fill-q-ndl-inshoku-risk` | 200 | research-fetch | `/api/opensearch?any=%E9%A3%B2%E9%A3%9F%E5%BA%97%20%E7%B5%8C%E5%96%B6%20%E3%83%AA%E3%82%B9%E3%82%AF&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:47:31.989Z | `web:ramen:r7-fill-q-ndl-joren-kakaku` | 200 | research-fetch | `/api/opensearch?any=%E5%B8%B8%E9%80%A3%E5%AE%A2%20%E4%BE%A1%E6%A0%BC&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:47:48.944Z | `web:ramen:r7-fill-q-ndl-repeater-gaishoku` | 429 | research-fetch | `/api/opensearch?any=%E5%A4%96%E9%A3%9F%20%E3%83%AA%E3%83%94%E3%83%BC%E3%82%BF%E3%83%BC&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:48:10.803Z | `web:ramen:r7-fill-q-ndl-dm-jittai` | 200 | research-fetch | `/api/opensearch?any=DM%E3%83%A1%E3%83%87%E3%82%A3%E3%82%A2%E5%AE%9F%E6%85%8B%E8%AA%BF%E6%9F%BB&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:48:50.237Z | `web:ramen:r7-fill-q-ndl-ramen-boom` | 200 | research-fetch | `/api/opensearch?any=%E3%83%A9%E3%83%BC%E3%83%A1%E3%83%B3%20%E3%83%96%E3%83%BC%E3%83%A0&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T08:51:14.209Z | `web:ramen:r7-fill-q-ndl-repeater-gaishoku2` | 200 | research-fetch | `/api/opensearch?any=%E5%A4%96%E9%A3%9F%20%E3%83%AA%E3%83%94%E3%83%BC%E3%82%BF%E3%83%BC&cnt=50` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T09:32:01.495Z | `web:bizmgmt:r7-fc-q-ndl-gaishoku-kakaku-juyo` | 200 | research-fetch | `/api/opensearch?any=%E5%A4%96%E9%A3%9F%20%E4%BE%A1%E6%A0%BC%20%E9%9C%80%E8%A6%81&cnt=20` |
| ndlsearch.ndl.go.jp | `/api` | 2026-10-22T09:32:18.450Z | `web:bizmgmt:r7-fc-q-ndl-pan-keiei` | 200 | research-fetch | `/api/opensearch?any=%E3%83%91%E3%83%B3%E5%B1%8B%20%E7%B5%8C%E5%96%B6%20%E5%8E%9F%E4%BE%A1&cnt=20` |
| ntnu.no | `/wiki/download/` | 2026-10-20T16:56:13.383Z | `web:learnsci:theory-gameflow-sweetser2005` | 200 | research-fetch | `/wiki/download/attachments/112986425/GameFlow.pdf?api=v2` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:56:26.990Z | `web:bizmgmt:r6-fc-warp-jfc-try1` | 200 | research-fetch | `/web/20240401000000/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_08a.pdf` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:57:48.296Z | `web:bizmgmt:r6-fc-warp-jfc-try2` | 200 | research-fetch | `/web/20230401000000/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_08a.pdf` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:57:55.220Z | `web:bizmgmt:r6-fc-warp-jfc-idx-20200101000000` | 200 | research-fetch | `/web/20200101000000/https://www.jfc.go.jp/n/findings/sme_findings2.html` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:58:00.623Z | `web:bizmgmt:r6-fc-warp-jfc-idx-20221001000000` | 200 | research-fetch | `/web/20221001000000/https://www.jfc.go.jp/n/findings/sme_findings2.html` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:58:37.173Z | `web:bizmgmt:r6-fc-warp-jfc-kekka-try` | 200 | research-fetch | `/web/20241101000000/https://www.jfc.go.jp/n/findings/shihyou_kekka_m_index.html` |
| warp.ndl.go.jp | `/web/` | 2026-10-22T07:58:42.242Z | `web:bizmgmt:r6-fc-warp-jfc-kekka-try2` | 200 | research-fetch | `/web/20230601000000/https://www.jfc.go.jp/n/findings/shihyou_kekka_m_index.html` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:56:54.092Z | `web:bizmgmt:r6-fc-warp-jfc-2024-08a` | 200 | research-fetch | `/20241008/20241007095656/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_08a.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:57:00.360Z | `web:bizmgmt:r6-fc-warp-jfc-2024-08c` | 200 | research-fetch | `/20241008/20241007095656/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_08c.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:57:06.724Z | `web:bizmgmt:r6-fc-warp-jfc-2024-07a` | 200 | research-fetch | `/20241008/20241007095656/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_07a.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:58:09.871Z | `web:bizmgmt:r6-fc-warp-jfc-idx-2022` | 200 | research-fetch | `/20221009/20221008103933/https://www.jfc.go.jp/n/findings/sme_findings2.html` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:58:24.763Z | `web:bizmgmt:r6-fc-warp-jfc-kekka-2022` | 200 | research-fetch | `/20221009/20221008103933/https://www.jfc.go.jp/n/findings/shihyou_kekka_m_index.html` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:58:50.214Z | `web:bizmgmt:r6-fc-warp-jfc-kekka-2025` | 200 | research-fetch | `/20250113/20250113021352/https://www.jfc.go.jp/n/findings/shihyou_kekka_m_index.html` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:58:55.731Z | `web:bizmgmt:r6-fc-warp-jfc-kekka-2023` | 200 | research-fetch | `/20230709/20230708190717/https://www.jfc.go.jp/n/findings/shihyou_kekka_m_index.html` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:59:06.936Z | `web:bizmgmt:r6-fc-warp-jfc-202302-08a` | 200 | research-fetch | `/20230709/20230708190717/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_202302_08a.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:59:12.017Z | `web:bizmgmt:r6-fc-warp-jfc-202302-08c` | 200 | research-fetch | `/20230709/20230708190717/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_202302_08c.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T07:59:17.506Z | `web:bizmgmt:r6-fc-warp-jfc-202302-07a` | 200 | research-fetch | `/20230709/20230708190717/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_202302_07a.pdf` |
| warp.ndl.go.jp | `/20` | 2026-10-22T08:01:40.905Z | `web:bizmgmt:r6-fc-warp-jfc-202302-01` | 403 | research-fetch | `/20230709/20230708190717/https://www.jfc.go.jp/n/findings/pdf/sme_findings2_202302_01.pdf` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:16.325Z | `web:bizgrowth:r5-growth-js-fc-haigyou2006` | 200 | research-fetch | `/article/jsmd1998/8/3/8_3_1/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:22.677Z | `web:bizgrowth:r5-growth-js-fc-manzoku2025` | 200 | research-fetch | `/article/jsds/2025/57/2025_33/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:30.601Z | `web:bizgrowth:r5-growth-js-fc-fukusuten2014` | 200 | research-fetch | `/article/jsds/2014/34/2014_31/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:37.423Z | `web:bizgrowth:r5-growth-js-cvs-part2024` | 200 | research-fetch | `/article/spls/15/3/15_100/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:48.733Z | `web:bizgrowth:r5-growth-js-gaishoku-kozo2000` | 200 | research-fetch | `/article/jfsr1994/7/2/7_2_104/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:23:55.427Z | `web:bizgrowth:r5-growth-js-fc-royalty2009` | 200 | research-fetch | `/article/jsmd/12/3/12_3_3_1/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:24:01.590Z | `web:bizgrowth:r5-growth-js-fc-shoukei2024` | 200 | research-fetch | `/article/ajg/2024s/0/2024s_250/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:28:24.396Z | `web:bizgrowth:r5-growth-js-gaishoku-genchika2018` | 200 | research-fetch | `/article/gbj/4/1/4_26/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:28:32.551Z | `web:bizgrowth:r5-growth-js-china-kyoso2020` | 200 | research-fetch | `/article/kansaiv/12/0/12_22/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:28:41.087Z | `web:bizgrowth:r5-growth-js-fc-hou2015` | 200 | research-fetch | `/article/jalps/51/2/51_KJ00010074093/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:28:54.018Z | `web:bizgrowth:r5-growth-js-fc-ranyo2015` | 200 | research-fetch | `/article/jael/36/0/36_117/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:29:59.962Z | `web:bizgrowth:r5-growth-js-gaishoku-jumyo2015` | 200 | research-fetch | `/article/nbukiyou/15/0/15_KJ00009859879/_pdf/-char/ja` |
| www.jstage.jst.go.jp | `/*_pdf` | 2026-10-22T08:30:06.669Z | `web:bizgrowth:r5-growth-js-gaishoku-senryaku2012` | 200 | research-fetch | `/article/kaihatsukogaku/32/1/32_59/_pdf/-char/ja` |

## 参考：Claude を名指しした組でだけ禁じられる取得（判定には入れていない）

robotsGate は `*` と `boki2-quest-research` の組しか見ない。取得は Claude が動かしているので、ClaudeBot・Claude-User・Claude-SearchBot・Claude-Web・anthropic-ai を名指しした組が禁じるパスも別に数えた（上の表と重なるものは除く）。判定に入れるかは取りまとめ役とオーナーが決める。

| ホスト | 件数 | 禁じるパス | doc の一覧 | その doc を引いている報告（引用の数） |
|---|---|---|---|---|
| crowdworks.jp | 1 | `/` | `web:bizmkt:r4-mkt-crowdworks-posting` | docs/BIZ-MKT-RAMEN.md（11）<br>docs/BIZ-MKT.md（9） |
| gendai.media | 7 | `/` | `web:bizlaw:r5-blr-gendai-gisou`<br>`web:bizgrowth:r5-growth-creator-pepper-gendai57252`<br>`web:bizgrowth:r5-growth-oppose-gendai168226`<br>`web:bizgrowth:r5-growth-oppose-gendai69815`<br>`web:bizgrowth:r5-growth-oppose-gendai70771`<br>`web:ramen:r6-cal-gendai-144647`<br>`web:ramen:r6-cal-gendai-143126` | docs/BIZ-GROWTH.md（5）<br>docs/BIZ-LAW-RAMEN.md（5） |
| link.springer.com | 10 | `/` | `web:learnsci:sweller2019-clt-20years`<br>`web:learnsci:mayer2024-ctml-past-future`<br>`web:learnsci:sailer2020-gamification-meta`<br>`web:learnsci:kokkonen2021-cf-conceptual`<br>`web:learnsci:r2-theory-sailer2020`<br>`web:learnsci:r2-theory-sweller2019`<br>`web:learnsci:r2-theory-pan2023`<br>`web:learnsci:r2-theory-latimier2021`<br>`web:learnsci:r2-theory-agarwal2021`<br>`web:learnsci:r6-rp-latimier2021-full` | docs/BIZ-REPLAY.md（1）<br>docs/DESIGN-REVISION.md（7）<br>docs/YEAR2.md（1）<br>docs/analysis/learning-science.md（20） |
| lostgarden.com | 1 | `/` | `web:learnsci:designer-cook-loopsarcs2012` | （引用なし） |
| mpra.ub.uni-muenchen.de | 2 | `/` | `web:bizmgmt:r5-cal-mpra-entry-prices`<br>`web:simgames:r7-sd-mpra-54716` | docs/BIZ-CALIB.md（3）<br>docs/BIZ-SIMDESIGN.md（1） |
| news.livedoor.com | 1 | `/` | `web:bizlaw:r5-blr-livedoor-gmap` | （引用なし） |
| peer.asee.org | 1 | `/` | `web:learnsci:theory-transfer-asee-barnettceci` | （引用なし） |
| rpgamer.com | 1 | `/` | `web:simgames:r6-rp-rpgamer-nier` | （引用なし） |
| www.anderson.ucla.edu | 2 | `/` | `web:simgames:r7-fc-cooper-nakanishi-mci-book`<br>`web:simgames:r7-fc-cooper-mci-index` | （引用なし） |
| www.gamedeveloper.com | 22 | `/` | `web:learnsci:designer-church-fadt1999`<br>`web:simgames:designer-papersplease-gd2014`<br>`web:learnsci:designer-cook-chemistry2007`<br>`web:simgames:designer-recettear-gd2010`<br>`web:simgames:r4-sim-gd-rimworld`<br>`web:simgames:r4-sim-gd-intothebreach`<br>`web:simgames:r4-sim-gd-80days-postmortem`<br>`web:simgames:r4-sim-gd-thiswarofmine`<br>`web:simgames:r4-sim-gd-meier2012`<br>`web:simgames:r4-sim-gd-pdg`<br>`web:simgames:r5-fv-gd-gamedevstory`<br>`web:simgames:r5-fv-gd-juice`<br>`web:simgames:r5-fv-gd-idlemath1`<br>`web:simgames:r5-fv-gd-idlemath3`<br>`web:simgames:r5-fv-gd-mgmtdepth`<br>`web:simgames:r5-fv-gd-minimetro-gdc`<br>`web:simgames:r6-sd-gd-glassbox2012`<br>`web:simgames:r6-rp-gd-igf-slaythespire`<br>`web:simgames:r6-rp-gd-igf-outerwilds`<br>`web:simgames:r6-rp-gd-balatro-signposting`<br>`web:simgames:r6-sd-pecorella-idle1`<br>`web:simgames:r6-rp-gd-hades-devprocess` | docs/BIZ-FUNVISUAL.md（15）<br>docs/BIZ-REPLAY.md（44）<br>docs/BIZ-SIMDESIGN.md（72）<br>docs/DESIGN-RAMEN.md（5）<br>docs/DESIGN-ROUND2.md（5） |
| www.gpb.org | 1 | `/` | `web:simgames:r6-rp-gpb-hades-stop` | docs/BIZ-REPLAY.md（3） |
| www.kodansha.co.jp | 2 | `/` | `web:ramen:r5-rmn-book-hayamizu-kodansha`<br>`web:ramen:r8-rmn-hayamizu-kodansha2` | （引用なし） |
| www.nature.com | 2 | `/` | `web:learnsci:kestin2025-ai-tutor-rct`<br>`web:learnsci:wangfan2026-retraction-notice` | docs/analysis/learning-science.md（8） |

## robots.txt が不確か・取れなかったホスト

最後の状態が 0（つながらない）・5xx・429、または research-fetch の自動の確かめが空のファイルだけを残したホスト、取りに行けなかったホスト。依頼どおり「制限なし」として数えたが、本当に制限がないかは分からない。

| ホスト | 取得の数 | 最後の状態 | 記録 | 取りに行けない理由 |
|---|---|---|---|---|
| appfollow.io | 2 | none |   | web：site-policy.json で自動取得が禁止（AppFollow Terms 4.4 がスクレイピング・収集を書面の同意なしに禁止、4.2 が機械学習への利用を禁止（） |
| chosa.nifty.com | 2 | 0 | web:ramen:r9-robots-chosa.nifty.com 2026-10-23T01:08:42.809Z |  |
| deepblue.lib.umich.edu | 1 | none |   | web：site-policy.json で自動取得が禁止（Deep Blue（ミシガン大学）：robots.txt に Content-Signal（ai-train=no、us） |
| jtuc-rengo.or.jp | 1 | 0 | web:bizlaw:r9-robots-jtuc-rengo.or.jp 2026-10-23T01:09:55.454Z |  |
| khoury.northeastern.edu | 1 | 0 | web:learnsci:r9-robots-khoury.northeastern.edu 2026-10-23T01:10:00.675Z |  |
| opus.bibliothek.uni-augsburg.de | 1 | 0 | web:learnsci:r9-robots-opus.bibliothek.uni-augsburg.de 2026-10-23T01:10:35.123Z |  |
| psychnet.wustl.edu | 1 | 0 | web:learnsci:r9-robots-psychnet.wustl.edu 2026-10-23T01:10:57.197Z |  |
| redditinc.com | 1 | none |   | web：site-policy.json で自動取得が禁止（Reddit User Agreement（redditinc.com/policies/user-agreement）） |
| shashi.pitt.edu | 1 | 0 | web:ramen:r9-robots-shashi.pitt.edu 2026-10-23T01:11:15.006Z |  |
| web.archive.org | 3 | 0 | web:bizmgmt:r9-robots-web.archive.org 2026-10-23T01:11:39.674Z |  |
| work-holiday.mhlw.go.jp | 1 | 0 | web:bizlaw:r9-robots-work-holiday.mhlw.go.jp 2026-10-23T01:11:48.386Z |  |
| www.athome.co.jp | 1 | 503 | web:ramen:r9-robots-www.athome.co.jp 2026-10-23T01:11:58.236Z |  |
| www.cit.nihon-u.ac.jp | 1 | 503 | web:ramen:r9-robots-www.cit.nihon-u.ac.jp 2026-10-23T01:12:08.731Z |  |
| www.crex-data.com | 1 | 429 | web:bizlaw:r9-robots-www.crex-data.com 2026-10-23T01:12:14.704Z |  |
| www.densai.net | 3 | 502 | law:primary:r9-robots-www.densai.net 2026-10-23T01:12:21.395Z |  |
| www.evullab.org | 3 | 0 | web:learnsci:r9-robots-www.evullab.org 2026-10-23T01:12:35.771Z |  |
| www.pref.kagawa.lg.jp | 1 | 0 | web:ramen:r9-robots-www.pref.kagawa.lg.jp 2026-10-23T01:13:56.371Z |  |
| www.unh.edu | 1 | 0 | web:learnsci:r9-robots-www.unh.edu 2026-10-23T01:14:24.633Z |  |
| www.zb.em-net.ne.jp | 1 | 0 | web:simgames:r9-robots-www.zb.em-net.ne.jp 2026-10-23T01:14:31.298Z |  |

## 全ホストの一覧

| ホスト | 取得の数 | robots.txt | どこから | 規則の数（*・boki2） | 禁じるパスに当たった数 |
|---|---|---|---|---|---|
| 1.bp.blogspot.com | 1 | 400 | web:simgames:r9-robots-1.bp.blogspot.com 2026-10-23T01:08 | 0 | 0 |
| 2.bp.blogspot.com | 1 | 400 | web:simgames:r9-robots-2.bp.blogspot.com 2026-10-23T01:08 | 0 | 0 |
| 2018.cedec.cesa.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| 5harad.com | 2 | 404 | web:ramen:r9-robots-5harad.com 2026-10-23T01:08 | 0 | 0 |
| ageconsearch.umn.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| agora-web.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| aichiu.repo.nii.ac.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 17 | 0 |
| amamatsusae.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 4 | 0 |
| api.cpa-learning.com | 25 | 403 | cpa-learning:courses2:r9-robots-api.cpa-learning.com 2026-10-23T01:08 | 0 | 0 |
| api.jstage.jst.go.jp | 138 | 404 | web:bizmgmt:r9-robots-api.jstage.jst.go.jp 2026-10-23T01:08 | 0 | 0 |
| appfollow.io | 2 | 不確か:none |   | 0 | 0 |
| appget.com | 1 | 200 | web:simgames:r4-cinc-robots-appget-com 2026-10-22T03:17 | 1 | 0 |
| appgoblin.info | 4 | 200 | web:simgames:r5-cinc-robots-appgoblin-info 2026-10-22T04:33 | 19 | 0 |
| applion.jp | 68 | 200 | web:simgames:r4-cinc-robots-applion-jp 2026-10-22T03:17 | 0 | 0 |
| applizm.com | 15 | 200 | web:simgames:r4-cinc-robots-applizm-com 2026-10-22T03:18 | 2 | 0 |
| appreview.jp | 1 | 200 | web:simgames:r4-cinc-robots-appreview-jp 2026-10-22T03:17 | 0 | 0 |
| archive.org | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:03 | 2 | 0 |
| are.berkeley.edu | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 70 | 0 |
| arte-life.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 4 | 0 |
| article.ejinzai.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| arxiv.org | 8 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 35 | 0 |
| ascii.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 1 | 0 |
| athome-inc.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| automaton-media.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 37 | 0 |
| ayusawa-partners.jp | 1 | 200 | web:bizlaw:r5-blr-robots-ayusawa-partners-jp 2026-10-22T05:35 | 3 | 0 |
| batonz.jp | 3 | 200 | web:bizlaw:r5-blr-robots-batonz-jp 2026-10-22T05:35 | 0 | 0 |
| biz.moneyforward.com | 6 | 200 | web:bizlaw:r5-blr-robots-biz-moneyforward-com 2026-10-22T05:22 | 12 | 0 |
| bizstorm.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| blog.duolingo.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 6 | 0 |
| blogs.ubc.ca | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 26 | 0 |
| bokipedia.jp | 391 | 404 | bokipedia:sets:r9-robots-bokipedia.jp 2026-10-23T01:08 | 0 | 0 |
| bunshun.jp | 16 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 7 | 0 |
| business-games.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| butwhytho.net | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| canaeru.usen.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 11 | 0 |
| cdn.aaai.org | 1 | 403 | web:simgames:r9-robots-cdn.aaai.org 2026-10-23T01:08 | 0 | 0 |
| cedec.cesa.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| celemi.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| cgu.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 17 | 0 |
| chi-tara.com | 1 | 200 | web:simgames:r4-cinc-robots-chi-tara-com 2026-10-22T03:18 | 3 | 0 |
| chikumashobo.co.jp | 1 | 404 | web:ramen:r9-robots-chikumashobo.co.jp 2026-10-23T01:08 | 0 | 0 |
| chosa.nifty.com | 2 | 不確か:0 | web:ramen:r9-robots-chosa.nifty.com 2026-10-23T01:08 | 0 | 0 |
| coffeelovers101.com | 1 | 200 | web:simgames:r5-cinc-robots-coffeelovers101-com 2026-10-22T04:35 | 2 | 0 |
| comchama.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 4 | 0 |
| conyblog.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 4 | 0 |
| corp.cfy.jp | 1 | 404 | web:simgames:r5-cinc-robots-corp-cfy-jp 2026-10-22T04:35 | 0 | 0 |
| corporate.kakaku.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 1 | 0 |
| cpa-learning-content-prod.s3.ap-northeast-1.amazonaws.com | 14 | 403 | cpa-learning:texts2:r9-robots-cpa-learning-content-prod.s3.ap-northeast-1.amazonaws.com 2026-10-23T01:08 | 0 | 0 |
| crowdworks.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 13 | 0 |
| cuc.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 17 | 0 |
| data-max.co.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 1 | 0 |
| deepblue.lib.umich.edu | 1 | 不確か:none |   | 0 | 0 |
| deepnight.net | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| design-system.service.gov.uk | 1 | 404 | web:uiux:r9-robots-design-system.service.gov.uk 2026-10-23T01:08 | 0 | 0 |
| design.digital.go.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 0 | 0 |
| designer-notes.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 2 | 0 |
| developer.apple.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 13 | 0 |
| digitalpr.jp | 2 | 404 | web:bizmkt:r9-robots-digitalpr.jp 2026-10-23T01:08 | 0 | 0 |
| dime.jp | 3 | 200 | web:simgames:r4-cinc-robots-dime-jp 2026-10-22T03:17 | 8 | 0 |
| disclosure2dl.edinet-fsa.go.jp | 34 | 403 | web:bizgrowth:r9-robots-disclosure2dl.edinet-fsa.go.jp 2026-10-23T01:08 | 0 | 0 |
| dl.digra.org | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 1 | 0 |
| dl.ndl.go.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 35 | 2 |
| documents.worldbank.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 8 | 0 |
| documents1.worldbank.org | 1 | 404 | web:learnsci:r9-robots-documents1.worldbank.org 2026-10-23T01:08 | 0 | 0 |
| dokuboki.hateblo.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 4 | 0 |
| doshisha.repo.nii.ac.jp | 5 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:08 | 17 | 0 |
| ds.data.jma.go.jp | 1 | 404 | web:bizmgmt:r9-robots-ds.data.jma.go.jp 2026-10-23T01:09 | 0 | 0 |
| dxmagazine.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| economicsnetwork.ac.uk | 1 | 200 | web:bizlaw:r5-blr-robots-economicsnetwork-ac-uk 2026-10-22T05:22 | 33 | 0 |
| education.mit.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 13 | 0 |
| elaws.e-gov.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| eml.berkeley.edu | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 1 | 0 |
| emshort.blog | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 11 | 0 |
| en.wikipedia.org | 29 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 432 | 0 |
| eprints.soton.ac.uk | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 1 | 0 |
| epub.uni-regensburg.de | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 1 | 0 |
| escholarship.org | 1 | 403 | web:ramen:r9-robots-escholarship.org 2026-10-23T01:09 | 0 | 0 |
| escp.eu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| extralenin444.itch.io | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 4 | 0 |
| faculty.engineering.asu.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 40 | 0 |
| fc-g.jfa-fc.or.jp | 1 | 401 | web:bizmgmt:r9-robots-fc-g.jfa-fc.or.jp 2026-10-23T01:09 | 0 | 0 |
| fenix.tecnico.ulisboa.pt | 1 | 404 | web:simgames:r9-robots-fenix.tecnico.ulisboa.pt 2026-10-23T01:09 | 0 | 0 |
| files.eric.ed.gov | 27 | 404 | web:acctedu:r9-robots-files.eric.ed.gov 2026-10-23T01:09 | 0 | 0 |
| find-model.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| foodethics.univie.ac.at | 1 | 404 | web:bizmgmt:r9-robots-foodethics.univie.ac.at 2026-10-23T01:09 | 0 | 0 |
| forbesjapan.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| game.watch.impress.co.jp | 1 | 200 | web:simgames:r4-cinc-robots-game-watch-impress-co-jp 2026-10-22T03:13 | 0 | 0 |
| gameaccessibilityguidelines.com | 5 | 200 | web:uiux:r9-robots-gameaccessibilityguidelines.com 2026-10-23T01:09 | 0 | 0 |
| gamemaker.io | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| games.appmatch.jp | 2 | 200 | web:simgames:r4-cinc-robots-games-appmatch-jp 2026-10-22T03:15 | 2 | 0 |
| gamesfuze.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| gamingnexus.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 8 | 0 |
| gamingroute.com | 1 | 200 | web:simgames:r4-cinc-robots-gamingroute-com 2026-10-22T03:15 | 2 | 0 |
| gamingtrend.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 6 | 0 |
| gendai.media | 7 | 200 | web:bizlaw:r5-blr-robots-gendai-media 2026-10-22T05:40 | 3 | 0 |
| glim-re.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| goldhead.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 4 | 0 |
| gradfoodstudies.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 11 | 0 |
| guide.news.nissyoku.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| gutefabrik.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| hachinohe-hachitan.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| hakodate-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| hcm-jinjer.com | 1 | 200 | web:bizlaw:r5-blr-robots-hcm-jinjer-com 2026-10-22T05:22 | 5 | 0 |
| hd.kourakuen.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| hirosaki.repo.nii.ac.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| hitorijikan-nico2.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 4 | 0 |
| honichi.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| hovgaardgames.com | 3 | 404 | web:simgames:r9-robots-hovgaardgames.com 2026-10-23T01:09 | 0 | 0 |
| hrmars.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| hue.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| human.hirosaki-u.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| ichioshi.smt.docomo.ne.jp | 1 | 403 | web:ramen:r9-robots-ichioshi.smt.docomo.ne.jp 2026-10-23T01:09 | 0 | 0 |
| ideas.repec.org | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 1 | 0 |
| ies.ed.gov | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 52 | 0 |
| igcn.hateblo.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 4 | 0 |
| imitsu.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 196 | 0 |
| indieranger.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| ipu.repo.nii.ac.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| irdb.nii.ac.jp | 1 | 200 | web:ramen:r8-rmn-irdb-robots 2026-10-22T09:24 | 50 | 1 |
| is1-ssl.mzstatic.com | 22 | 403 | web:simgames:r9-robots-is1-ssl.mzstatic.com 2026-10-23T01:09 | 0 | 0 |
| j-net21.smrj.go.jp | 13 | 404 | web:bizmkt:r9-robots-j-net21.smrj.go.jp 2026-10-23T01:09 | 0 | 0 |
| ja.wikibooks.org | 15 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 204 | 0 |
| ja.wikipedia.org | 7 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 310 | 0 |
| jesperjuul.net | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| jfnet.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 2 | 0 |
| jicpa.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 25 | 0 |
| jigyou-saikouchiku.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 0 | 0 |
| jiro26.hatenablog.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 4 | 0 |
| journals.plos.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 3 | 0 |
| jp.gdfreak.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 29 | 0 |
| jtuc-rengo.or.jp | 1 | 不確か:0 | web:bizlaw:r9-robots-jtuc-rengo.or.jp 2026-10-23T01:09 | 0 | 0 |
| jumonji-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| k-kentan.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| kanagawa-u.repo.nii.ac.jp | 5 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| keiho.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:09 | 17 | 0 |
| keiri.hatenablog.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 4 | 0 |
| keiyaku-watch.jp | 1 | 200 | web:bizlaw:r5-blr-robots-keiyaku-watch-jp 2026-10-22T05:19 | 0 | 0 |
| khoury.northeastern.edu | 1 | 不確か:0 | web:learnsci:r9-robots-khoury.northeastern.edu 2026-10-23T01:10 | 0 | 0 |
| kkawano.com | 1 | 404 | web:simgames:r9-robots-kkawano.com 2026-10-23T01:10 | 0 | 0 |
| kokkai.ndl.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:55 | 0 | 0 |
| komazawa-u.repo.nii.ac.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| kurume.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| kwansei.repo.nii.ac.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| kyodonewsprwire.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 1 | 0 |
| laws.e-gov.go.jp | 193 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 0 | 0 |
| lawsofux.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 0 | 0 |
| learn.microsoft.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 19 | 0 |
| learninglab.psych.purdue.edu | 5 | 404 | web:learnsci:r9-robots-learninglab.psych.purdue.edu 2026-10-23T01:10 | 0 | 0 |
| lex.juris.hokudai.ac.jp | 1 | 404 | web:bizlaw:r5-blr-robots-lex-juris-hokudai-ac-jp 2026-10-22T05:22 | 0 | 0 |
| link.springer.com | 10 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 65 | 0 |
| lostgarden.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| lp.raksul.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| m3.material.io | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 4 | 0 |
| mag.smarthr.jp | 1 | 200 | web:bizlaw:r5-blr-robots-mag-smarthr-jp 2026-10-22T05:19 | 1 | 0 |
| magic.wizards.com | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 0 | 0 |
| maitake-blog.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 4 | 0 |
| maruchiyo.yamaokaya.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| maruoka88.hateblo.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 4 | 0 |
| masouken.com | 1 | 200 | web:bizlaw:r5-blr-robots-masouken-com 2026-10-22T05:22 | 3 | 0 |
| matsumoto-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| mcvuk.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 13 | 0 |
| minnano-rakuraku.com | 1 | 404 | web:simgames:r4-cinc-robots-minnano-rakuraku-com 2026-10-22T03:13 | 0 | 0 |
| mirasapo-plus.go.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:48 | 2 | 0 |
| mkremins.github.io | 1 | 404 | web:simgames:r9-robots-mkremins.github.io 2026-10-23T01:10 | 0 | 0 |
| mohawkgames.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| monolith.law | 1 | 200 | web:bizlaw:r5-blr-robots-monolith-law 2026-10-22T05:35 | 4 | 0 |
| mpra.ub.uni-muenchen.de | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 1 | 0 |
| mud.co.uk | 1 | 404 | web:learnsci:r9-robots-mud.co.uk 2026-10-23T01:10 | 0 | 0 |
| mugazine.info | 1 | 200 | web:simgames:r5-cinc-robots-mugazine-info 2026-10-22T04:36 | 2 | 0 |
| myweb.fsu.edu | 1 | 404 | web:learnsci:r9-robots-myweb.fsu.edu 2026-10-23T01:10 | 0 | 0 |
| nakamura-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| ndlsearch.ndl.go.jp | 21 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:33 | 30 | 20 |
| ndownloader.figshare.com | 2 | 404 | web:learnsci:r9-robots-ndownloader.figshare.com 2026-10-23T01:10 | 0 | 0 |
| netshop.impress.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 57 | 0 |
| news.cornell.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 61 | 0 |
| news.denfaminicogamer.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| news.livedoor.com | 1 | 200 | web:bizlaw:r5-blr-robots-news-livedoor-com 2026-10-22T05:40 | 1 | 0 |
| news.mynavi.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 9 | 0 |
| news.nissyoku.co.jp | 1 | 200 | web:bizgrowth:r5-growth-robots-nissyoku 2026-10-22T08:57 | 12 | 0 |
| newsletter.gamediscover.co | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 14 | 0 |
| ngu.repo.nii.ac.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| note.com | 16 | 200 | web:simgames:r4-cinc-robots-note-com 2026-10-22T03:13 | 19 | 0 |
| nozomi-tax.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| ntnu.no | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 70 | 1 |
| ocw.metu.edu.tr | 1 | 404 | web:learnsci:r9-robots-ocw.metu.edu.tr 2026-10-23T01:10 | 0 | 0 |
| opus.bibliothek.uni-augsburg.de | 1 | 不確か:0 | web:learnsci:r9-robots-opus.bibliothek.uni-augsburg.de 2026-10-23T01:10 | 0 | 0 |
| otaru-uc.ac.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| our.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 17 | 0 |
| pacificaffairs.ubc.ca | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 5 | 0 |
| panasonic.co.jp | 1 | 404 | web:simgames:r9-robots-panasonic.co.jp 2026-10-23T01:10 | 0 | 0 |
| pboki.com | 14 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 3 | 0 |
| pdf.poojaagarwal.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 8 | 0 |
| peer.asee.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 3 | 0 |
| pesaagora.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 2 | 0 |
| play.google.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 103 | 0 |
| pmc.ncbi.nlm.nih.gov | 20 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 9 | 0 |
| portal.monodukuri-hojo.jp | 2 | 404 | web:bizmgmt:r9-robots-portal.monodukuri-hojo.jp 2026-10-23T01:10 | 0 | 0 |
| president.jp | 66 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 5 | 0 |
| prtimes.jp | 8 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 4 | 0 |
| psychnet.wustl.edu | 1 | 不確か:0 | web:learnsci:r9-robots-psychnet.wustl.edu 2026-10-23T01:10 | 0 | 0 |
| public.websites.umich.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:10 | 0 | 0 |
| pweb.cc.sophia.ac.jp | 1 | 404 | web:ramen:r9-robots-pweb.cc.sophia.ac.jp 2026-10-23T01:10 | 0 | 0 |
| r6.jizokukahojokin.info | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| raco.cat | 1 | 403 | web:learnsci:r9-robots-raco.cat 2026-10-23T01:11 | 0 | 0 |
| ramendiet.hatenablog.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 4 | 0 |
| raw.githubusercontent.com | 13 | 404 | web:simgames:r9-robots-raw.githubusercontent.com 2026-10-23T01:11 | 0 | 0 |
| rawg.io | 1 | 200 | web:simgames:r5-cinc-robots-rawg-io 2026-10-22T04:33 | 22 | 0 |
| redditinc.com | 1 | 不確か:none |   | 0 | 0 |
| remix.berklee.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 63 | 0 |
| repositorio.iscte-iul.pt | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 10 | 0 |
| repositorio.uac.pt | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 7 | 0 |
| repository.essex.ac.uk | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 1 | 0 |
| research.ou.nl | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| rogueliker.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| rpgamer.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 3 | 0 |
| s23.jizokukahojokin.info | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| saijo.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| sakushin-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| sasanopan.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 4 | 0 |
| scholars.duke.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 3 | 0 |
| scholarworks.lib.csusb.edu | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 63 | 0 |
| search.r-project.org | 1 | 404 | web:simgames:r9-robots-search.r-project.org 2026-10-23T01:11 | 0 | 0 |
| sehensucht.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 4 | 0 |
| seijiyama.jp | 2 | 200 | web:bizlaw:r5-blr-robots-seijiyama-jp 2026-10-22T05:19 | 5 | 0 |
| seinan-gu.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| selfdeterminationtheory.org | 5 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| shashi.pitt.edu | 1 | 不確か:0 | web:ramen:r9-robots-shashi.pitt.edu 2026-10-23T01:11 | 0 | 0 |
| shinjigyou-shinshutsu.smrj.go.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 1 | 0 |
| shiodome.co.jp | 1 | 200 | web:bizlaw:r5-blr-robots-shiodome-co-jp 2026-10-22T05:22 | 2 | 0 |
| shura.shu.ac.uk | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 1 | 0 |
| sogyotecho.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| soranews24.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| store.steampowered.com | 1 | 200 | web:simgames:r5-cinc-robots-store-steampowered-com 2026-10-22T04:33 | 9 | 0 |
| substack.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 14 | 0 |
| summit.sfu.ca | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| support.google.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 7 | 0 |
| tabelog.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:05 | 7 | 0 |
| takushoku-u.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| tcbmag.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| thedailytexan.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 3 | 0 |
| timexsinclair.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| tkc.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 32 | 0 |
| tmstudies.net | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 1 | 0 |
| tonecchi.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 4 | 0 |
| toucharcade.com | 2 | 403 | web:simgames:r4-cinc-robots-toucharcade-com 2026-10-22T03:13 | 0 | 0 |
| toyokeizai.net | 1 | 200 | web:simgames:r5-cinc-robots-toyokeizai-net 2026-10-22T04:33 | 6 | 0 |
| twistedvoxel.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| tynansylvester.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| u-gakugei.repo.nii.ac.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| uconnruddcenter.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| upload.wikimedia.org | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 1 | 0 |
| users.cs.northwestern.edu | 3 | 404 | web:learnsci:r9-robots-users.cs.northwestern.edu 2026-10-23T01:11 | 0 | 0 |
| waic.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| wakabame.hatenablog.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 4 | 0 |
| warp.ndl.go.jp | 19 | 200 | web:bizmgmt:r4-calib-warp-robots 2026-10-22T03:22 | 6 | 17 |
| web.archive.org | 3 | 不確か:0 | web:bizmgmt:r9-robots-web.archive.org 2026-10-23T01:11 | 0 | 0 |
| webaim.org | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 3 | 0 |
| webtan.impress.co.jp | 2 | 403 | web:bizmkt:r9-robots-webtan.impress.co.jp 2026-10-23T01:11 | 0 | 0 |
| wesleyan.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 17 | 0 |
| wikiwiki.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 3 | 0 |
| work-holiday.mhlw.go.jp | 1 | 不確か:0 | web:bizlaw:r9-robots-work-holiday.mhlw.go.jp 2026-10-23T01:11 | 0 | 0 |
| www.4gamer.net | 3 | 200 | web:simgames:r4-cinc-robots-www-4gamer-net 2026-10-22T03:13 | 0 | 0 |
| www.advertimes.com | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 8 | 0 |
| www.aft.org | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 52 | 0 |
| www.aizu-cci.or.jp | 1 | 200 | web:ramen:r6-cal-aizu-robots 2026-10-22T09:07 | 2 | 0 |
| www.anderson.ucla.edu | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:39 | 52 | 0 |
| www.andrewwillmott.com | 1 | 404 | web:simgames:r9-robots-www.andrewwillmott.com 2026-10-23T01:11 | 0 | 0 |
| www.appbank.net | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 15 | 0 |
| www.apple.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 5 | 0 |
| www.appunwrapper.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 2 | 0 |
| www.asb-j.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 0 | 0 |
| www.askul.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:11 | 6 | 0 |
| www.athome.co.jp | 1 | 不確か:503 | web:ramen:r9-robots-www.athome.co.jp 2026-10-23T01:11 | 0 | 0 |
| www.bdadyslexia.org.uk | 1 | 404 | web:uiux:r9-robots-www.bdadyslexia.org.uk 2026-10-23T01:11 | 0 | 0 |
| www.bengo4.com | 1 | 200 | web:bizlaw:r5-blr-robots-www-bengo4-com 2026-10-22T05:35 | 23 | 0 |
| www.biznavi.jp | 11 | 404 | biznavi:_tos:robots.txt 2026-10-20T02:21 | 0 | 0 |
| www.boj.or.jp | 5 | 404 | web:bizmgmt:r9-robots-www.boj.or.jp 2026-10-23T01:12 | 0 | 0 |
| www.bugin-eri.co.jp | 1 | 404 | web:simgames:r9-robots-www.bugin-eri.co.jp 2026-10-23T01:12 | 0 | 0 |
| www.caa.go.jp | 22 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.capitalismlab.com | 18 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.capsim.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 10 | 0 |
| www.cas.go.jp | 1 | 404 | web:bizlaw:r5-blr-robots-www-cas-go-jp 2026-10-22T05:10 | 0 | 0 |
| www.cgmagonline.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.chugoku.meti.go.jp | 2 | 403 | web:bizmgmt:r9-robots-www.chugoku.meti.go.jp 2026-10-23T01:12 | 0 | 0 |
| www.chusho.meti.go.jp | 6 | 403 | web:bizlaw:r5-blr-robots-www-chusho-meti-go-jp 2026-10-22T09:44 | 0 | 0 |
| www.cit.nihon-u.ac.jp | 1 | 不確か:503 | web:ramen:r9-robots-www.cit.nihon-u.ac.jp 2026-10-23T01:12 | 0 | 0 |
| www.city.fukuoka.lg.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 751 | 0 |
| www.city.tomakomai.hokkaido.jp | 1 | 404 | web:acctedu:r9-robots-www.city.tomakomai.hokkaido.jp 2026-10-23T01:12 | 0 | 0 |
| www.codecks.io | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.courts.go.jp | 9 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:55 | 63 | 0 |
| www.cpa-learning.com | 701 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.crear-ac.co.jp | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.crex-data.com | 1 | 不確か:429 | web:bizlaw:r9-robots-www.crex-data.com 2026-10-23T01:12 | 0 | 0 |
| www.cst.nihon-u.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.cuc.ac.jp | 1 | 404 | web:simgames:r9-robots-www.cuc.ac.jp 2026-10-23T01:12 | 0 | 0 |
| www.daily.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.data.jma.go.jp | 2 | 404 | web:bizmgmt:r9-robots-www.data.jma.go.jp 2026-10-23T01:12 | 0 | 0 |
| www.davidlewisphd.com | 2 | 404 | web:learnsci:r9-robots-www.davidlewisphd.com 2026-10-23T01:12 | 0 | 0 |
| www.densai.net | 3 | 不確か:502 | law:primary:r9-robots-www.densai.net 2026-10-23T01:12 | 0 | 0 |
| www.designer-notes.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.digitallydownloaded.net | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.e-stat.go.jp | 70 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 52 | 0 |
| www.ebi.ac.uk | 8 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 170 | 0 |
| www.edu.hokudai.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 2 | 0 |
| www.edwardtufte.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 9 | 0 |
| www.env.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.evullab.org | 3 | 不確か:0 | web:learnsci:r9-robots-www.evullab.org 2026-10-23T01:12 | 0 | 0 |
| www.factorio.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.failbettergames.com | 2 | 404 | web:simgames:r9-robots-www.failbettergames.com 2026-10-23T01:12 | 0 | 0 |
| www.family.co.jp | 1 | 404 | web:bizmkt:r9-robots-www.family.co.jp 2026-10-23T01:12 | 0 | 0 |
| www.famitsu.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 23 | 0 |
| www.fashionsnap.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 4 | 0 |
| www.fdma.go.jp | 1 | 404 | web:bizmgmt:r9-robots-www.fdma.go.jp 2026-10-23T01:12 | 0 | 0 |
| www.freee.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 4 | 0 |
| www.frontiersin.org | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 12 | 0 |
| www.fsa.go.jp | 19 | 404 | web:bizlaw:r5-blr-robots-www-fsa-go-jp 2026-10-22T09:44 | 0 | 0 |
| www.gamedeveloper.com | 22 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 6 | 0 |
| www.gamesasylum.com | 1 | 200 | web:simgames:r9-robots-www.gamesasylum.com 2026-10-23T01:12 | 0 | 0 |
| www.gamespark.jp | 8 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.gankaikai.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.googleapis.com | 3 | 404 | web:ramen:r9-robots-www.googleapis.com 2026-10-23T01:12 | 0 | 0 |
| www.gpb.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 44 | 0 |
| www.greenheartgames.com | 1 | 404 | web:simgames:r9-robots-www.greenheartgames.com 2026-10-23T01:12 | 0 | 0 |
| www.gwern.net | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 12 | 0 |
| www.hotpepper.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:03 | 5 | 0 |
| www.inklestudios.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.inshokuten.com | 13 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.insource.co.jp | 3 | 404 | web:simgames:r9-robots-www.insource.co.jp 2026-10-23T01:12 | 0 | 0 |
| www.instantramen.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.intangiblecapital.org | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.invenglobal.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.irrodl.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.issoh.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 1 | 0 |
| www.itmedia.co.jp | 7 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.j-cast.com | 4 | 200 | web:bizlaw:r5-blr-robots-www-j-cast-com 2026-10-22T05:33 | 7 | 0 |
| www.jasso.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:12 | 0 | 0 |
| www.jenovachen.com | 2 | 404 | web:learnsci:r9-robots-www.jenovachen.com 2026-10-23T01:12 | 0 | 0 |
| www.jesperjuul.net | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 0 | 0 |
| www.jetro.go.jp | 2 | 403 | web:ramen:r9-robots-www.jetro.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.jfa-fc.or.jp | 63 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 0 | 0 |
| www.jfc.go.jp | 32 | 404 | web:bizmgmt:r9-robots-www.jfc.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.jfnet.or.jp | 14 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.jftc.go.jp | 5 | 403 | law:primary:r9-robots-www.jftc.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.jma.go.jp | 2 | 404 | web:bizmgmt:r9-robots-www.jma.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.jpo.go.jp | 1 | 403 | web:bizlaw:r5-blr-robots-www-jpo-go-jp 2026-10-22T09:44 | 0 | 0 |
| www.jprime.jp | 14 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:05 | 4 | 0 |
| www.jpx.co.jp | 14 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 0 | 0 |
| www.jsise.org | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.jstage.jst.go.jp | 78 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:35 | 1 | 13 |
| www.kankyo.metro.tokyo.lg.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 24 | 0 |
| www.keidanren.or.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:44 | 2 | 0 |
| www.kent.edu | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 52 | 0 |
| www.kentei.ne.jp | 276 | 200 | kentei:_tos:robots.txt 2026-10-20T02:21 | 1 | 0 |
| www.kinokuniya.co.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 9 | 0 |
| www.kobe-np.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 0 | 0 |
| www.kodansha.co.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 13 | 0 |
| www.kyushu.meti.go.jp | 1 | 403 | web:bizgrowth:r9-robots-www.kyushu.meti.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.lec-jp.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.levelwinner.com | 1 | 200 | web:simgames:r4-cinc-robots-www-levelwinner-com 2026-10-22T03:15 | 7 | 0 |
| www.lycbiz.com | 4 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 59 | 0 |
| www.macstories.net | 1 | 200 | web:simgames:r4-cinc-robots-www-macstories-net 2026-10-22T03:15 | 2 | 0 |
| www.maff.go.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 1 | 0 |
| www.maruha-nichiro.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 8 | 0 |
| www.matchstickeyes.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 8 | 0 |
| www.mc-law.jp | 1 | 200 | web:bizlaw:r5-blr-robots-www-mc-law-jp 2026-10-22T05:19 | 1 | 0 |
| www.mcvuk.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 13 | 0 |
| www.meiji.ac.jp | 1 | 404 | web:bizmgmt:r9-robots-www.meiji.ac.jp 2026-10-23T01:13 | 0 | 0 |
| www.meti.go.jp | 6 | 403 | web:bizgrowth:r9-robots-www.meti.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.mext.go.jp | 28 | 404 | law:primary:mext-robots 2026-10-20T17:35 | 0 | 0 |
| www.mgtco.co.jp | 7 | 404 | web:simgames:r9-robots-www.mgtco.co.jp 2026-10-23T01:13 | 0 | 0 |
| www.mhlw.go.jp | 36 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 3 | 0 |
| www.mlit.go.jp | 6 | 404 | web:bizmgmt:r9-robots-www.mlit.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.mof.go.jp | 1 | 404 | law:primary:r9-robots-www.mof.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.moguravr.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 6 | 0 |
| www.mohawkgames.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.moj.go.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 1 | 0 |
| www.moneypost.jp | 11 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 3 | 0 |
| www.nature.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 48 | 0 |
| www.nber.org | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 40 | 0 |
| www.nenkin.go.jp | 3 | 200 | web:bizlaw:r5-blr-robots-www-nenkin-go-jp 2026-10-22T08:33 | 1 | 0 |
| www.net-school.co.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.nippon.com | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:03 | 4 | 0 |
| www.nishiken.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.nli-research.co.jp | 2 | 403 | web:bizlaw:r5-blr-robots-www-nli-research-co-jp 2026-10-22T05:19 | 0 | 0 |
| www.nngroup.com | 5 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 6 | 0 |
| www.no-trouble.caa.go.jp | 1 | 404 | web:bizmkt:r9-robots-www.no-trouble.caa.go.jp 2026-10-23T01:13 | 0 | 0 |
| www.nse.or.jp | 1 | 404 | web:bizgrowth:r9-robots-www.nse.or.jp 2026-10-23T01:13 | 0 | 0 |
| www.nta.go.jp | 29 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 13 | 0 |
| www.onamae.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 42 | 0 |
| www.oreilly.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 19 | 0 |
| www.ownly.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 5 | 0 |
| www.pcgamesinsider.biz | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.pmq.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 0 | 0 |
| www.pocketgamer.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 1 | 0 |
| www.post.japanpost.jp | 3 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 4 | 0 |
| www.ppc.go.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 5 | 0 |
| www.pref.chiba.lg.jp | 1 | 404 | web:ramen:r9-robots-www.pref.chiba.lg.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.fukushima.lg.jp | 1 | 404 | web:ramen:r9-robots-www.pref.fukushima.lg.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.gifu.lg.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 2 | 0 |
| www.pref.ishikawa.lg.jp | 1 | 404 | web:bizmgmt:r9-robots-www.pref.ishikawa.lg.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.kagawa.lg.jp | 1 | 不確か:0 | web:ramen:r9-robots-www.pref.kagawa.lg.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.miyagi.jp | 1 | 404 | web:learnsci:r9-robots-www.pref.miyagi.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.miyazaki.lg.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:13 | 12 | 0 |
| www.pref.yamaguchi.lg.jp | 1 | 404 | web:ramen:r9-robots-www.pref.yamaguchi.lg.jp 2026-10-23T01:13 | 0 | 0 |
| www.pref.yamanashi.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.psychologie.uni-wuerzburg.de | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 2 | 0 |
| www.raphkoster.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 6 | 0 |
| www.rehab.go.jp | 2 | 404 | web:learnsci:r9-robots-www.rehab.go.jp 2026-10-23T01:14 | 0 | 0 |
| www.reinet.or.jp | 4 | 200 | web:ramen:r6-cal-reinet-robots 2026-10-22T09:08 | 7 | 0 |
| www.reishokukyo.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 1 | 0 |
| www.rikenvitamin.jp | 1 | 404 | web:ramen:r9-robots-www.rikenvitamin.jp 2026-10-23T01:14 | 0 | 0 |
| www.rodo.co.jp | 5 | 200 | web:bizlaw:r5-blr-robots-www-rodo-co-jp 2026-10-22T05:31 | 5 | 0 |
| www.sangiin.go.jp | 1 | 404 | web:bizlaw:r9-robots-www.sangiin.go.jp 2026-10-23T01:14 | 0 | 0 |
| www.sangyo-rodo.metro.tokyo.lg.jp | 3 | 200 | web:ramen:r6-cal-tokyo-sangyo-robots 2026-10-22T09:04 | 24 | 0 |
| www.sbbit.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.scielo.br | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 2 | 0 |
| www.sendaicci.or.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 5 | 0 |
| www.shopowner-support.net | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:04 | 2 | 0 |
| www.sidelabs.com | 2 | 404 | web:simgames:r4-cinc-robots-www-sidelabs-com 2026-10-22T03:13 | 0 | 0 |
| www.smg-gr.jp | 5 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 4 | 0 |
| www.soumu.go.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.sri.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.st.nanzan-u.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.stat-search.boj.or.jp | 1 | 404 | web:bizmgmt:r9-robots-www.stat-search.boj.or.jp 2026-10-23T01:14 | 0 | 0 |
| www.stat.go.jp | 28 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 1 | 0 |
| www.stratxsimulations.com | 7 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 14 | 0 |
| www.superjumpmagazine.com | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 6 | 0 |
| www.tdb.co.jp | 5 | 400 | web:ramen:r9-robots-www.tdb.co.jp 2026-10-23T01:14 | 0 | 0 |
| www.tfd.metro.tokyo.lg.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 0 | 0 |
| www.thesixthaxis.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 5 | 0 |
| www.tomsguide.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 22 | 0 |
| www.toy-people.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 11 | 0 |
| www.tsr-net.co.jp | 24 | 200 | raw/.robots（自動の確かめ） 2026-10-22T09:42 | 0 | 0 |
| www.ucpress.edu | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 1 | 0 |
| www.unh.edu | 1 | 不確か:0 | web:learnsci:r9-robots-www.unh.edu 2026-10-23T01:14 | 0 | 0 |
| www.utupub.fi | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 10 | 0 |
| www.value-press.com | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 11 | 0 |
| www.vsnews.fr | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 16 | 0 |
| www.w3.org | 32 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 112 | 0 |
| www.zaikei.co.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 2 | 0 |
| www.zb.em-net.ne.jp | 1 | 不確か:0 | web:simgames:r9-robots-www.zb.em-net.ne.jp 2026-10-23T01:14 | 0 | 0 |
| www.zeiken.co.jp | 1 | 200 | web:bizlaw:r5-blr-robots-www-zeiken-co-jp 2026-10-22T05:35 | 6 | 0 |
| www.zenginkyo.or.jp | 6 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 1 | 0 |
| www.zenshoren.or.jp | 1 | 200 | web:bizlaw:r5-blr-robots-www-zenshoren-or-jp 2026-10-22T05:31 | 0 | 0 |
| www2.jpx.co.jp | 3 | 404 | web:ramen:r9-robots-www2.jpx.co.jp 2026-10-23T01:14 | 0 | 0 |
| yamanashi.repo.nii.ac.jp | 1 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 17 | 0 |
| ynu.repo.nii.ac.jp | 2 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 17 | 0 |
| zenn.dev | 2 | 200 | web:simgames:r4-cinc-robots-zenn-dev 2026-10-22T03:13 | 1 | 0 |
| zensho.or.jp | 12 | 200 | raw/.robots（自動の確かめ） 2026-10-23T01:14 | 2 | 0 |
