# 版0.4 回帰

{
  "mode": "版0.4回帰・期待値（週の揺れなし）",
  "K": 8,
  "seed": 0,
  "stations": 453,
  "sites": 965,
  "Pref": 230.01542051747947,
  "medianCustomers": 64.72237075148459,
  "overflowSitesPct": 69.53367875647669,
  "overflowDrawsPct": 58.924870466321245,
  "spearmanLegacy": -0.006158793781421958,
  "spearmanMidrank": 0.026745373988640308,
  "dataSha256": "68d421bf46907271c6f52a970f8a1a7910bab1bf0a275330386b1d826ea0866b",
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
      "actual": 64.72237075148459,
      "expected": 64.7,
      "tolerance": 1.294,
      "pass": true
    },
    {
      "metric": "上限越え候補地%",
      "actual": 69.53367875647669,
      "expected": 69.53367875647669,
      "tolerance": 1.3906735751295338,
      "pass": true
    },
    {
      "metric": "順位相関",
      "actual": -0.006158793781421958,
      "expected": -0.006158793781421958,
      "tolerance": 0.00012317587562843917,
      "pass": true
    }
  ]
}
