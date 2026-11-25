# 読了ノート22本から7本を乱数で選ぶ（種 20261119）。
import os, random
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'research', 'notes', 'web', 'ramencount23')
names = sorted(f for f in os.listdir(D) if f.endswith('.md'))
print(len(names))
for n in random.Random(20261119).sample(names, 7):
    print(n)
