# 版0.7 の試しの出力（../stationmap-v07-draft/out/*.txt）から、属性ごとの「いちばん得」の割合と、全くじの昼だけ・夜だけの割合を数える（判定役）
import re,sys,json,glob,os
for f in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','stationmap-v07-draft','out','*.txt'))):
    t=open(f).read(); out=[]; tot={'昼だけ':0,'通し':0,'夜だけ':0}; n=0
    for m in re.finditer(r'   (\w+)（L の中央 ([\d.]+)・幅[^）]*）くじ(\d+)：いちばん得 (\{[^}]*\})',t):
        a,k,d=m.group(1),int(m.group(3)),json.loads(m.group(4))
        for x in tot: tot[x]+=d.get(x,0)
        n+=k; out.append(f"{a}:L{m.group(2)}/夜{100*d.get('夜だけ',0)/k:.1f}/昼{100*d.get('昼だけ',0)/k:.1f}")
    c7=re.search(r'⑦ オフィスで昼だけ＞通し (\d+)%.*繁華街で夜だけ＞通し (\d+)%',t)
    if c7: print(os.path.basename(f),'⑦',c7.group(1),c7.group(2),' '.join(out),f"全体 昼だけ{100*tot['昼だけ']/n:.1f} 夜だけ{100*tot['夜だけ']/n:.1f}")
