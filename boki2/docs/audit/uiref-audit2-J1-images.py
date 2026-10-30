#!/usr/bin/env python3
# 事実の判定 2回目（J1）：research/raw/web/uiref/ の uA-・uB- の画像（png・jpg・webp）から、
# 1回目の判定役が開いた20枚（判定書 3章の A・B の行）を除き、無作為に20枚を抜く（seed 20261102）。
# 抜いた画像ごとに、読了ノートの image_seen のうちその画像に当たる記述と、BIZ-UIREF.md でその文書が出る行番号を出す。
# 画像と記述が合うかは、判定役が Read で1枚ずつ開いて決める（このスクリプトは決めない）。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J1-images.py
import os, re, random
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', '..', 'research', 'raw', 'web', 'uiref')
notes = os.path.join(here, '..', '..', 'research', 'notes', 'web', 'uiref')
biz = open(os.path.join(here, '..', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')
done = {  # 1回目の判定役が開いた画像（BIZ-UIREF-audit.md 3章。crops/minna-1.jpg は raw の外なので母数に入らない）
    'uA-uip-minna-no-ginko_s2.webp', 'uA-uip-d-payment_s1.webp', 'uA-uip-d-payment_s3.webp', 'uA-uip-smbc_s2.webp',
    'uA-uip-bloomo_s3.webp', 'uA-uip-sugojika_s2.webp', 'uA-gp-zaim_s1.png', 'uA-gp-zaim_s3.png', 'uA-dads-spacing_shot.png',
    'uB-applion-coffeeinc2_shot1.png', 'uB-applion-coffeeinc2_shot7.png', 'uB-applion-royalmatch_shot2.jpg',
    'uB-applion-gakumas_shot1.png', 'uB-applion-cultist_shot1.png', 'uB-applion-cultist_shot2.png',
    'uB-applion-umamusume_shot1.jpg', 'uB-applion-monopolygo_shot3.jpg', 'uB-applion-dragonbox_shot2.jpg',
    'uB-applion-meowbistro_shot3.jpg'}
imgs = sorted(f for f in os.listdir(raw) if re.match(r'u[AB]-.*\.(png|jpe?g|webp)$', f))
pool = [f for f in imgs if f not in done]
print('uA・uB の画像', len(imgs), '／1回目に開いた物を除いた母数', len(pool))
r = random.Random(20261102)
pick = sorted(r.sample(pool, 20))
for n, f in enumerate(pick, 1):
    doc = re.sub(r'_(shot\d*|s\d+|img\d+)\.(png|jpe?g|webp)$', '', f)
    key = re.search(r'_(shot\d*|s\d+|img\d+)\.', f).group(1)
    nt = os.path.join(notes, doc + '.md')
    seen = ''
    if os.path.exists(nt):
        m = re.search(r'^image_seen:\s*(.*)$', open(nt, encoding='utf-8').read(), re.M)
        seen = m.group(1) if m else '（image_seen なし）'
    else:
        seen = '（読了ノートなし）'
    # その画像に当たる部分（"shot2:" "s1：" "img1:" などの区切り）を取り出す
    part = ''
    for seg in re.split(r'\s*/\s*', seen):
        if re.match(r'(shape_)?' + re.escape(key.replace('shot', 'shot')) + r'\b', seg) or seg.startswith(key) or ('_' + key) in seg[:20]:
            part = seg
    lines = [i + 1 for i, l in enumerate(biz) if doc in l]
    print(f'\n{n}. {f}\n  ノート: {doc}.md\n  その画像の記述: {part or "（区切りで見つからない。下の全文を見る）"}\n  image_seen 全文の頭: {seen[:300]}\n  BIZ の行: {lines}')
