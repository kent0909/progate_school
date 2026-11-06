import csv,glob,sys
for m in ['station','pin']:
    import os; D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','stationmap-sim')+'/v06-initial-'+m
    rows=[]
    for f in sorted(glob.glob(D+'/sites/part-*.csv')):
        for r in csv.DictReader(open(f)):
            if r['mode']!='monteCarlo': continue
            r['p']=float(r['annualProfit']); r['n0']=0 if r['rivals'] in ('','0') else len(r['rivals'].split('+')); rows.append(r)
    for d in sorted(set(r['draw'] for r in rows)):
        W=[r for r in rows if r['draw']==d]; top=sorted(W,key=lambda r:-r['p'])
        print(m,'draw',d,'候補地',len(W),'0軒',sum(r['n0']==0 for r in W),f"{sum(r['n0']==0 for r in W)/len(W):.4f}",'top10の0軒',sum(r['n0']==0 for r in top[:10]),'top50の0軒',sum(r['n0']==0 for r in top[:50]))
