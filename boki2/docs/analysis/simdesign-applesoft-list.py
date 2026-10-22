#!/usr/bin/env python3
# BIZ-SIMDESIGN 0.2 用：Apple II の DOS 3.3 ディスクイメージ（.dsk、143,360バイト）から Applesoft BASIC のファイルを取り出して一覧にする。
# 使い方: python3 -I boki2/docs/analysis/simdesign-applesoft-list.py <dsk> [ファイル名の一部]
# 原文（research/raw）は git に入れないので、この道具で手元の原文から毎回取り出す。
import sys
TOK = ["END","FOR","NEXT","DATA","INPUT","DEL","DIM","READ","GR","TEXT","PR#","IN#","CALL","PLOT","HLIN","VLIN","HGR2","HGR","HCOLOR=","HPLOT","DRAW","XDRAW","HTAB","HOME","ROT=","SCALE=","SHLOAD","TRACE","NOTRACE","NORMAL","INVERSE","FLASH","COLOR=","POP","VTAB","HIMEM:","LOMEM:","ONERR","RESUME","RECALL","STORE","SPEED=","LET","GOTO","RUN","IF","RESTORE","&","GOSUB","RETURN","REM","STOP","ON","WAIT","LOAD","SAVE","DEF","POKE","PRINT","CONT","LIST","CLEAR","GET","NEW","TAB(","TO","FN","SPC(","THEN","AT","NOT","STEP","+","-","*","/","^","AND","OR",">","=","<","SGN","INT","ABS","USR","FRE","SCRN(","PDL","POS","SQR","RND","LOG","EXP","COS","SIN","TAN","ATN","PEEK","LEN","STR$","VAL","ASC","CHR$","LEFT$","RIGHT$","MID$"]
d = open(sys.argv[1], 'rb').read()
sec = lambda t, s: d[(t * 16 + s) * 256:(t * 16 + s + 1) * 256]
v = sec(17, 0); t, s = v[1], v[2]; files = []
while t:
    c = sec(t, s)
    for i in range(7):
        e = c[0x0B + i * 35:0x0B + (i + 1) * 35]
        if e[0] in (0, 0xFF): continue
        name = bytes(b & 0x7F for b in e[3:33]).decode('ascii').rstrip()
        files.append((name, e[2] & 0x7F, e[0], e[1]))
    t, s = c[1], c[2]
want = sys.argv[2] if len(sys.argv) > 2 else None
for name, typ, tt, ts in files:
    if want is None: print(f'{typ:02x} {name}'); continue
    if want not in name or typ != 2: continue  # 2 = Applesoft
    data = b''; t, s = tt, ts
    while t:
        tsl = sec(t, s)
        for k in range(122):
            a, b = tsl[0x0C + 2 * k], tsl[0x0D + 2 * k]
            if a == 0 and b == 0: continue
            data += sec(a, b)
        t, s = tsl[1], tsl[2]
    n = data[0] | data[1] << 8; p = data[2:2 + n]; i = 0; base = 0x801
    while i + 4 <= len(p):
        nxt = p[i] | p[i + 1] << 8
        if nxt == 0: break
        ln = p[i + 2] | p[i + 3] << 8; j = i + 4; out = ''
        while j < len(p) and p[j] != 0:
            b = p[j]; out += (' ' + TOK[b - 0x80] + ' ') if 0x80 <= b < 0x80 + len(TOK) else chr(b); j += 1
        print(ln, ' '.join(out.split()))
        i = nxt - base
