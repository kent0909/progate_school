import json,re,sys,collections
S=json.load(open(sys.argv[1]))
def br(s,zone):
  if re.search(r'繁華|歓楽|遊興|遊技|娯楽|ホテル等が集まる', s): return 'hanka:繁華語'
  if re.search(r'飲食', s) and not re.search(r'小売|日用品|店舗併用|一般住宅|近隣商業', s) and zone != '近商': return 'hanka:飲食'
  if re.search(r'工業地域|流通業務', s): return 'kojo:語'
  if '住宅地域' in s: return 'jutaku:住宅地域'
  if re.search(r'工場|倉庫|作業所', s) and not re.search(r'店舗', s): return 'kojo:工場語'
  if re.search(r'大規模ビル|特定街区|業務|本社', s): return 'office:業務語'
  office = re.search(r'事務所|オフィス', s)
  shop = re.search(r'店舗|商店|小売|商業ビル|ホテル|劇場|百貨店', s)
  if office and shop: return 'office:事務所が先' if re.search(r'事務所(ビル)?[、等]', s[:shop.start()]) and not re.search(r'店舗', s[:office.start()]) else 'shogyo:両方'
  if re.search(r'中心商業|高度商業', s): return 'shogyo:中心商業'
  if office: return 'office:事務所だけ'
  if shop: return 'shoten:店の語'
  if '商業地域' in s: return 'shoten:商業地域'
  return 'jutaku:既定'
c=collections.defaultdict(list)
for x in S:
  b=br(x['desc'] or '',x['zone']); 
  if b.split(':')[0]!=x['type']: print('MISMATCH',x['id'],b,x['type'])
  c[b].append(x)
for b in sorted(c): print(b,len(c[b]))
for b in sys.argv[2:]:
  print('=====',b)
  for x in c[b]: print(x['id'],x['stn'],x['town'],x['zone'],x['price'],x['desc'],sep='|')
