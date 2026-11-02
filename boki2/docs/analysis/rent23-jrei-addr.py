# 日本不動産研究所・BAC「店舗賃料トレンド」の PDF（pdftotext -layout の出力）から、
# 「住所別平均賃料／募集件数（１F）」の表と「公募賃料推移表」の 1F・1F以外の行を抜き出す。
# 使い方: python3 -I rent23-jrei-addr.py <txt>   出力: TSV（エリア, 住所, 3年平均, 3年件数, 直近半期平均, 直近件数）
import re, sys
t = open(sys.argv[1], encoding='utf8').read().split('\n')
area = None
rowre = re.compile(r'((?:千代田|中央|港|新宿|渋谷|豊島|文京|台東)区\S+?)\s+¥([\d,]+)\s+(\d+)\s+(¥[\d,]+|-)\s+(\d+|-)')
for l in t:
    m = re.match(r'^\s*(\S+)エリア\s*$', l)
    if m: area = m.group(1)
    m = re.match(r'^(GINZA|SHINJUKU|OMOTESANDO|SHIBUYA|IKEBUKURO|YOKOHAMA|SHINSAIBASHI)\s*$', l)
    if m: area = {'GINZA':'銀座','SHINJUKU':'新宿','OMOTESANDO':'表参道','SHIBUYA':'渋谷','IKEBUKURO':'池袋','YOKOHAMA':'横浜','SHINSAIBASHI':'心斎橋'}[m.group(1)]
    m = rowre.search(l)
    if m:
        print('\t'.join([area or '?', m.group(1), m.group(2).replace(',', ''), m.group(3), m.group(4).replace('¥', '').replace(',', ''), m.group(5)]))
    m = re.match(r'^\s*(\S*)\s+(１Ｆ|１Ｆ以外|全フロア)\s+¥?([\d,]+)\s+¥?([\d,]+)\s+¥?([\d,]+)\s+¥?([\d,]+)\s+¥?([\d,]+)\s+¥?([\d,]+)', l)
    if m:
        print('\t'.join(['TREND', area or '?', m.group(2)] + [x.replace(',', '') for x in m.groups()[2:]]))
