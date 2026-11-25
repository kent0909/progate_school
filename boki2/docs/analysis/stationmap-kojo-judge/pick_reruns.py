# 回し直す組を乱数で選ぶ（事実の判定役、2026-11-17）。種 20261117。
# 1本目：run-post.sh の P_ 8本から1つ。2本目：jobs.txt のうち段の比 4.5 か 2.14（_s45・_s214）の24本から1つ（K7hi_s79 は司令塔が回したので候補の外）。
# 3本目（足し）：jobs.txt の残り全部から1つ。
import random, sys, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'stationmap-kojo-draft', 'out')
rng = random.Random(20261117)
post = [l.rstrip('\n') for l in open(os.path.join(D, 'jobs-post.txt')) if l.strip()]
jobs = [l.rstrip('\n') for l in open(os.path.join(D, 'jobs.txt')) if l.strip()]
c2 = [l for l in jobs if l.split(' ')[0].endswith('_s45') or l.split(' ')[0].endswith('_s214')]
a = rng.choice(post)
b = rng.choice(c2)
rest = [l for l in jobs if l != b and not l.startswith('K7hi_s79 ')]
c = rng.choice(rest)
for l in (a, b, c):
    print(l)
