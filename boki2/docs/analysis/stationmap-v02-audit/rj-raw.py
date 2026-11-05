import ast,re,json,zipfile,os,collections,sys
R='/home/user/progate_school/boki2/research/raw/geo/geodata'
src=open('/home/user/progate_school/boki2/tools/stations-build.py').read()
m=ast.parse(src); fn=[n for n in m.body if isinstance(n,ast.FunctionDef) and n.name=='classify'][0]
ns={'re':re}; exec(compile(ast.Module([fn],[]),'c','exec'),ns); c=ns['classify']
def zg(name,inner):
  for f in os.listdir(R):
    if f.startswith(name):
      z=zipfile.ZipFile(os.path.join(R,f)); h=sorted([n for n in z.namelist() if n.endswith(inner)],key=lambda n:'Shift' in n); return json.loads(z.read(h[0]).decode('utf-8'))
P=[]
for f in zg('L01-26-13','L01-26_13.geojson')['features']:
  p=f['properties']
  if 13101<=int(p['L01_001'])<=13123: P.append((p['L01_047'] or '',p['L01_002'],p['L01_051'],p['L01_025'],p['L01_050'],'L01'))
for f in zg('L02-26-13','L02-26_13.geojson')['features']:
  p=f['properties']
  if 13101<=int(p['L02_020'])<=13123: P.append((p['L02_044'] or '',p['L02_001'],p['L02_047'],p['L02_022'],p['L02_046'],'L02'))
print('points',len(P))
cnt=collections.Counter(c(d,k,z) for d,k,z,*_ in P); print(cnt)
def show(lbl,cond):
  L=[x for x in P if cond(x)]; print('==',lbl,len(L))
  for x in L[:12]: print('  ',c(x[0],x[1],x[2]),x[1],x[2],x[3],x[0])
show('高度/中心商業 and office-only text -> shogyo', lambda x: c(x[0],x[1],x[2])=='shogyo' and re.search(r'中心商業|高度商業',x[0]) and not re.search(r'店舗|商店|小売|商業ビル|ホテル|劇場|百貨店',x[0]))
show('kubun009 with 住宅地域', lambda x: x[1]=='009' and '住宅地域' in x[0])
show('kojo in 商業 text', lambda x: c(x[0],x[1],x[2])=='kojo' and '商業' in x[0])
show('L01 walk 0', lambda x: x[5]=='L01' and x[4]==0)
