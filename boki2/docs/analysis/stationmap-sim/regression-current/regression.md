# 版0.4 回帰

{
  "mode": "版0.4回帰・期待値（週の揺れなし）",
  "K": 8,
  "seed": 0,
  "stations": 452,
  "sites": 889,
  "Pref": 230.01542051747947,
  "medianCustomers": 65.51966255727397,
  "overflowSitesPct": 69.06636670416198,
  "overflowDrawsPct": 59.4206974128234,
  "spearmanLegacy": 0.02185185400261044,
  "spearmanMidrank": 0.05717543703445137,
  "dataSha256": "569b5378bd4faf7f097ac519652b3d80f0b51f427a075a156e2107e82e486d16",
  "reference": {
    "source": "stationmap-v04-reasoning/i_all.js の未変更の再実行とSAVE出力。旧データを読み込んだ後はrequireキャッシュで現行データへの置換を防いだ",
    "originalScriptBlob": "0e3282c7cc89e1f1dc0d1c1a909368c077477f6b",
    "dataBlob": "130bc3bfe640014e81ae7098fe62b298c94cfb0d",
    "K": 8,
    "seed": 0,
    "sites": 965,
    "medianDisplay": 64.7,
    "overflowSitesPct": 69.53367875647669,
    "spearmanLegacy": -0.006158793781421958
  },
  "comparison": [
    {
      "metric": "客数中央値",
      "actual": 65.51966255727397,
      "expected": 64.7,
      "tolerance": 1.294,
      "pass": true
    },
    {
      "metric": "上限越え候補地%",
      "actual": 69.06636670416198,
      "expected": 69.53367875647669,
      "tolerance": 1.3906735751295338,
      "pass": true
    },
    {
      "metric": "順位相関",
      "actual": 0.02185185400261044,
      "expected": -0.006158793781421958,
      "tolerance": 0.00012317587562843917,
      "pass": false
    }
  ]
}
