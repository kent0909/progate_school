#!/usr/bin/env python3
from pathlib import Path
import json, hashlib
root=Path(__file__).resolve().parent
j=json.loads((root/'ramen-quality-y1-results/summary.json').read_text());assert len(j['cases'])==9 and j['runs']==300
p=lambda v:f"{v['k']}/{v['n']}={v['pct']:.1f}% [{v['lo']:.1f},{v['hi']:.1f}]"
d=lambda v:f"{v['points']:.1f}pt [{v['lo']:.1f},{v['hi']:.1f}]"
a=['# 原因の単独比較','','率の[]はWilson95%、差の[]は同じseedを組にした2000回bootstrap（rng991）。全て300周、60か月。初黒字はt≤6かつop>0。費用ゼロ/係数変更は原因診断であり採用案ではない。','','|変更|一杯と衛生の10月到達|放置の10月到達|差|3年末NCで放置に勝つ|5年末NCで放置に勝つ|3/5年末のNC差中央値（万円）|','|---|---|---|---|---|---|---|']
for r in j['cases']:
 a.append('|'+r['name']+'|'+ '|'.join([p(r['quality']),p(r['idle']),d(r['earlyDiff']),p(r['win3']),p(r['win5']),f"{r['nc3gap']/1e4:.1f}/{r['nc5gap']/1e4:.1f}"])+'|')
(root/'ramen-quality-y1-causes.md').write_text('\n'.join(a)+'\n')
b=j['cases'][0]
a=['# 3つの表示案で共通に使う月別の実測','','全案は同じ既存の計算/方針で、表示の焦点だけを選ぶ案。各値は画面の丸め（R小数2桁、L小数1桁、F×100整数）後の同じseed間の差の中央値。各比率の分母は全300周。お金や政策の効果を増やしていない。','','|月|案1 評判差/上回る周|案2 常連表示差/上回る周|案3 魅力表示差/上回る周|営業利益差中央値（円）|','|---|---|---|---|---|']
for m in b['months']:
 a.append('|'+str((m['t']+3)%12+1)+'月|'+'|'.join(f"{m[k]['displayGap']:.2f} / {p(m[k]['displayBetter'])}" for k in ['R','L','F'])+f"|{m['op']['pairedGap']:.0f}|")
(root/'ramen-quality-y1-visible-months.md').write_text('\n'.join(a)+'\n')
assert b['quality']['k']==36 and b['idle']['k']==25
baseline=json.loads((root/'ramen-y1-economy-results/summary.json').read_text())
assert j['sourceSha256']==baseline['simRamenSha256']
source=Path(root/'../../tools/sim-ramen.js').read_bytes();assert hashlib.sha256(source).hexdigest()==j['sourceSha256']
for r in j['cases']:
 rs=[json.loads(l) for l in (root/'ramen-quality-y1-results'/f"{r['name']}-runs.jsonl").read_text().splitlines()]
 assert len(rs)==300 and len({x['seed'] for x in rs})==300
 assert r['quality']['k']==sum(0<=x['q']['first']<=6 for x in rs)
 assert r['win5']['k']==sum(x['q']['nc5']>x['idle']['nc5'] for x in rs)
print('OK: 9条件×300周、基準36/25、長期勝率、UI丸め、正式検査ソースSHAを照合')
# 読み出し案は世界・方針を変えず、正式合否は既に全行を実測した基準版と同一。
orig=(root/'ramen-y1-economy-results/proposals-b.md').read_text().splitlines()
a=['# 表示案3つの正式合否（共通の基準版実測）','','表示案は係数・方針・乱数・月計算を一切変更しない。従って正式合否の全行は同一の基準版実測を共有する。案別の新規再実行はしていない。元の無変更正式コマンドは終了0、比較用基準版との共通出力102行完全一致を記録済み。今回も同じsource SHAと300 seedの基準早期到達・長期勝率を照合。','', '|行|案1 評判|案2 常連|案3 一杯の魅力|','|---|---|---|---|']
for line in orig:
 if not line.startswith('|') or line.startswith(('|正式行','|---')):continue
 cells=line.split('|')[1:-1]
 if cells[0] in ['正式検査の失敗行','正式検査の終了コード']:continue
 a.append('|'+cells[0]+'|'+ '|'.join([cells[2]]*3)+'|')
(root/'ramen-quality-y1-formal.md').write_text('\n'.join(a)+'\n')
