import csv,glob,sys,statistics as st
D=sys.argv[1]
rows=[]
for f in sorted(glob.glob(D+'/sites/part-*.csv')):
    for r in csv.DictReader(open(f)):
        if r['mode']!='monteCarlo': continue
        r['p']=float(r['annualProfit']); r['n0']=0 if r['rivals'] in ('','0') else len(r['rivals'].split('+'))
        r['rent']=float(r['monthlyRent']); r['tier']=int(r['tier']); rows.append(r)
print('rows',len(rows))
for draw in sorted(set(r['draw'] for r in rows)):
    W=[r for r in rows if r['draw']==draw]
    top=sorted(W,key=lambda r:-r['p'])
    t50=top[:50]; t10=sum(r['p'] for r in top[:10])/10
    print(f"draw {draw}: top50 pre-open 0軒={sum(r['n0']==0 for r in t50)}, 全体の0軒割合={sum(r['n0']==0 for r in W)/len(W):.0%}, top10平均利益={t10/1e4:.0f}万")
    def rule(name,cand,key):
        c=sorted(cand,key=key)[:10]; v=sum(r['p'] for r in c)/10
        print(f"   {name}: {v/t10:.0%}  (0軒{sum(r['n0']==0 for r in c)}/10)")
    z=[r for r in W if r['n0']==0]
    rule('0軒→段の高い順',z,lambda r:(-r['tier'],r['rent']))
    rule('0軒→家賃の安い順',z,lambda r:r['rent'])
    rule('0軒→段÷家賃',z,lambda r:-r['tier']/r['rent'])
    rule('0軒→段の高い順・商店街か住宅地',[r for r in z if r['attribute'] in('shoten','jutaku','shogyo')],lambda r:(-r['tier'],r['rent']))
    rule('全体→段÷家賃',W,lambda r:-r['tier']/r['rent'])
    rule('軒数÷段の小さい順',W,lambda r:(r['n0']/r['tier'],r['rent']))
