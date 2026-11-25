# 判定役（11/25）：工場の候補地25か所＋s395-1 の zone・desc・walk を、地価公示 L01-26・地価調査 L02-26 の raw の zip から引き直す
import json,zipfile,sys
RAW='/home/user/progate_school/boki2/research/raw/geo/geodata/'
def load(f,inner):
    z=zipfile.ZipFile(RAW+f); n=sorted([n for n in z.namelist() if n.endswith(inner)],key=lambda n:'Shift' in n)[0]
    return json.loads(z.read(n).decode('utf-8'))['features']
l01=load('L01-26-13.xlsx','L01-26_13.geojson'); l02=load('L02-26-13.xlsx','L02-26_13.geojson')
idx={}
for f in l01:
    p=f['properties']; idx[('公示',p['L01_001']+'-'+str(p['L01_002']).zfill(3)+'-'+str(p['L01_003']).zfill(3))]=('L01',p.get('L01_051'),p.get('L01_047'),p.get('L01_048'),p.get('L01_050'),p.get('L01_025'))
for f in l02:
    p=f['properties']; idx[('調査',str(p['L02_020'])+'-'+str(p['L02_001']).zfill(3)+'-'+str(p['L02_002']).zfill(3))]=('L02',p.get('L02_047'),p.get('L02_044'),p.get('L02_045'),p.get('L02_046'),p.get('L02_022'))
S=json.load(open('kojo-sites.json'))
for s in S:
    k,no=s['l01'].split(' ')
    r=idx.get((k,no))
    if not r:
        print(s['id'],s['town'],'NOT FOUND',s['l01']); continue
    print(s['id'],s['town'],s['st'],'| tokyo23 zone',s['zone'],'raw zone',r[1],'| walk',s['walk'],'raw near',r[3],'raw walk',r[4],'| desc same' if r[2]==s['desc'] else '| desc DIFF '+str(r[2]),'| addr',r[5])
