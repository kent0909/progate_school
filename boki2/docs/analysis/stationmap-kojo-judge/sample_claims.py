# 数値の主張を乱数で抜く（事実の判定役、2026-11-17）。自分で好きに選ばないための台本。
# 使い方：python3 -I sample_claims.py <文書> <種> <本数>
# 抜き方：文書の各行から、[[...]]（出典）・`...`（ファイル名）・URL を消したあと、数字を含む語（\d[\d,.]*）を全部拾い、
#         「行番号・語・前後20字」を1つの主張の候補とする。見出し行（#）・表の区切り行（|---）と、
#         見出しに「依頼の対応表」「やっていないこと」「既知の傷」を含む章は除く（事実の主張でなく自己申告なので、別に読む）。
#         同じ行の同じ語は1つにまとめる。候補の全部に番号を振り、random.Random(種).sample で本数ぶん抜く。
import re, sys, random
path, seed, n = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
lines = open(path, encoding='utf-8').read().split('\n')
cands = []
stop = False
for i, l in enumerate(lines, 1):
    if re.match(r'^##\s', l):
        stop = bool(re.search(r'依頼の対応表|やっていないこと|既知の傷', l))
    if stop:
        continue
    if l.startswith('#') or l.startswith('|---') or l.startswith('<!--'):
        continue
    t = re.sub(r'\[\[[^\]]*\]\]', '', l)
    t = re.sub(r'`[^`]*`', '', t)
    seen = set()
    for m in re.finditer(r'[−\-+]?\d[\d,]*(?:\.\d+)?', t):
        tok = m.group(0)
        if tok in seen:
            continue
        seen.add(tok)
        ctx = t[max(0, m.start() - 20):m.end() + 20].replace('\n', ' ')
        cands.append((i, tok, ctx))
rng = random.Random(seed)
pick = rng.sample(range(len(cands)), n)  # 抜いた順のまま（前から順に判定し、番号・参照だけの語は飛ばして飛ばした理由を書く）
print(f'# {path} 候補 {len(cands)}・種 {seed}・抜いた {n}')
for k, j in enumerate(pick, 1):
    i, tok, ctx = cands[j]
    print(f'{k}\t候補#{j}\t行{i}\t{tok}\t{ctx}')
