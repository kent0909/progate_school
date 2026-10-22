# 決まりを外れた取得の記録

取得記録（ledger）に載らない取得や、規約に反する取得が起きたときに書く。消さない。

| 日時（UTC） | 担当 | 何が起きたか | 原因 | 直したこと |
|---|---|---|---|---|
| 2026-10-22（SIMDESIGN 0.2 の作業中） | 調べ直し：経営シムの作り方 | 作品の番号を調べるため、Steam の検索 API に9回問い合わせた（research-fetch を通さず、取得記録にない）。Steam は利用者規約 4.C で bot を禁止（site-policy.json で no-automation と判定済み）。中身は保存も使用もしていないと本人が申告 | 判定済みの記録（site-policy.json）を見る前に、research-fetch の外で直接問い合わせた。research-fetch を通さない通信を止める仕組みがなかった | README と依頼文の型に「外部への通信は research-fetch だけ（curl・WebFetch・API の直接呼び出しを禁止。検索は WebSearch か、規約を確かめた検索窓口を research-fetch で）」を足した。担当は本人の申告で見つかった |
