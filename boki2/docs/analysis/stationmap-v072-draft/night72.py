# 版0.7.2 の試し：⑦案A の2つの読み（除く・移す）で繁華街の L の中央（κ0.6）。データだけ、sim は回さない。
# 実行：python3 -I night72.py ../../../js/data/tokyo23.js
import json,statistics as st,sys
t=open(sys.argv[1],encoding='utf8').read(); d,_=json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ')+len('SIM.tokyo23 = '):])
H=[s for s in d['sites'] if s['type']=='hanka' and s.get('day') is not None]
def L(dd,f,nu,mode,kap=0.6,fm=0.0708):
  d2=dd*(1-nu*f)/(dd*(1-nu*f)+(1-dd)); m=(dd-d2) if mode=='move' else 0
  Nt=max(0.05,(1-d2)+m+kap*(f/fm-1)); return d2/(d2+Nt)
print('ν 除く 移す（繁華街36本の L の中央）')
for nu in (0,0.3,0.5,0.8,1.0): print(nu, round(st.median([L(s['day'],s['food'],nu,'remove') for s in H]),3), round(st.median([L(s['day'],s['food'],nu,'move') for s in H]),3))
