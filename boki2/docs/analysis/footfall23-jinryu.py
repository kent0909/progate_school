# -*- coding: utf-8 -*-
# 国交省「全国の人流オープンデータ」（1kmメッシュ、monthly_mdp_mesh1km_13＝東京都）から、23区の駅ごとの昼と深夜の滞在人口と比を出す。
# 【未実行】データ本体はG空間情報センターの登録とログインが条件で、まだ手元にない（research/WANTED.md）。合成のデータで動くことだけ確かめてある（--selftest）。
# 列は定義書（[[web:footfall23:jinryu-definition]]）のとおり：mesh1kmid, prefcode, citycode, year, month, dayflag(0休日 1平日 2全日), timezone(0昼 1深夜 2終日), population
# 時間帯：昼＝11時台〜14時台の平均、深夜＝1時台〜4時台の平均、終日＝0時台〜23時台の平均。夕方〜夜（18〜22時）はない。
# 実行：python3 -I boki2/docs/analysis/footfall23-jinryu.py <monthly_mdp_mesh1km_13 の zip> boki2/js/data/tokyo23.js > boki2/docs/analysis/footfall23-jinryu.out.txt
import csv, io, json, math, sys, zipfile, collections, statistics

def mesh3(lat, lon):
  p = int(lat * 1.5); a = lat * 60 - p * 40
  u = int(lon - 100); f = lon - 100 - u
  q = int(a / 5); v = int(f * 60 / 7.5)
  r = int((a - q * 5) * 60 / 30); w = int((f * 60 - v * 7.5) * 60 / 45)
  return f'{p:02d}{u:02d}{q}{v}{r}{w}'

def rows_from_zip(path):
  # zip の中の CSV（入れ子の zip も開く）を順に読む。文字コードは utf-8 か cp932
  def walk(z):
    for n in z.namelist():
      b = z.read(n)
      if n.lower().endswith('.zip'): yield from walk(zipfile.ZipFile(io.BytesIO(b)))
      elif n.lower().endswith('.csv'):
        for enc in ('utf-8-sig', 'cp932'):
          try: t = b.decode(enc); break
          except UnicodeDecodeError: continue
        yield from csv.DictReader(io.StringIO(t))
  yield from walk(zipfile.ZipFile(path))

def stations(t23):
  t = open(t23, encoding='utf8').read()
  d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
  KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95; O = d['origin']
  return [(s['name'], s['ward'], mesh3(O[0] - s['y'] / KY, O[1] + s['x'] / KX)) for s in d['stations']]

def run(rows, sts, out=print):
  want = {m for _, _, m in sts}
  # (mesh, year, dayflag, timezone) → 月の値のリスト
  V = collections.defaultdict(list)
  for r in rows:
    m = r['mesh1kmid']
    if m in want: V[(m, r['year'], r['dayflag'], r['timezone'])].append(int(r['population']))
  avg = lambda k: statistics.mean(V[k]) if V.get(k) else None
  out('| 駅 | 区 | 1km メッシュ | 2019 平日 昼 | 2019 平日 深夜 | 昼÷深夜 | 2019 休日 昼 | 2019 休日 深夜 | 昼÷深夜 | 2020 平日 昼 ÷ 2019 平日 昼 |')
  out('|---|---|---|---|---|---|---|---|---|---|')
  res = []
  for nm, wd, m in sts:
    a, b = avg((m, '2019', '1', '0')), avg((m, '2019', '1', '1'))
    c, e = avg((m, '2019', '0', '0')), avg((m, '2019', '0', '1'))
    g = avg((m, '2020', '1', '0'))
    f = lambda x: '—' if x is None else f'{x:,.0f}'
    rt = lambda x, y: '—' if not x or not y else f'{x / y:.2f}'
    out(f'| {nm} | {wd} | {m} | {f(a)} | {f(b)} | {rt(a, b)} | {f(c)} | {f(e)} | {rt(c, e)} | {rt(g, a)} |')
    res.append((nm, a, b))
  return res

if __name__ == '__main__':
  if sys.argv[1] == '--selftest':
    # 合成のデータ：2つのメッシュ、2019年の平日・休日、昼と深夜。値は作り物（動作の確かめだけ）
    sts = [('テスト駅A', '架空区', '53394525'), ('テスト駅B', '架空区', '53394694')]
    rows = []
    for m, day, night in (('53394525', 300000, 20000), ('53394694', 60000, 40000)):
      for mo in ('01', '02'):
        for df in ('1', '0'):
          rows += [dict(mesh1kmid=m, year='2019', month=mo, dayflag=df, timezone='0', population=str(day)),
                   dict(mesh1kmid=m, year='2019', month=mo, dayflag=df, timezone='1', population=str(night)),
                   dict(mesh1kmid=m, year='2020', month=mo, dayflag=df, timezone='0', population=str(day // 2))]
    res = run(rows, sts)
    assert abs(res[0][1] / res[0][2] - 15) < 1e-9 and abs(res[1][1] / res[1][2] - 1.5) < 1e-9
    print('selftest ok')
  else:
    run(rows_from_zip(sys.argv[1]), stations(sys.argv[2]))
