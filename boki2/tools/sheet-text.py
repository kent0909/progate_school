#!/usr/bin/env python3
# 表計算のファイル（xlsx、旧形式の xls）の中身を文字にする。research-check.js が読了ノートの anchors を照合するのに使う。
# 出力：シートごとに「# シート名」の行、続けてセルの値をタブで区切った行（空のセルは空）。数字は表に出る形に近づける（整数は小数点なし）。
# 旧形式の xls は LibreOffice（soffice --headless --convert-to xlsx）で一時ディレクトリに変換してから読む。
# 使い方: python3 -I boki2/tools/sheet-text.py <ファイル>   （拡張子は問わない。中身の先頭の印で形式を見分ける）
import sys, os, tempfile, subprocess, shutil, zipfile

def cell(v):
    if v is None: return ''
    if isinstance(v, float):
        return str(int(v)) if v.is_integer() else repr(v)
    return str(v)

def dump_xlsx(p):
    import openpyxl
    wb = openpyxl.load_workbook(p, read_only=True, data_only=True)
    out = []
    for ws in wb.worksheets:
        out.append('# ' + ws.title)
        for row in ws.iter_rows(values_only=True):
            r = [cell(v) for v in row]
            while r and r[-1] == '': r.pop()
            if r: out.append('\t'.join(r))
    return '\n'.join(out)

def main(f):
    head = open(f, 'rb').read(8)
    tmp = tempfile.mkdtemp()
    try:
        if head[:2] == b'PK':
            q = os.path.join(tmp, 'a.xlsx'); shutil.copy(f, q)
            if not zipfile.is_zipfile(q): return ''
            return dump_xlsx(q)
        if head == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':
            q = os.path.join(tmp, 'a.xls'); shutil.copy(f, q)
            subprocess.run(['soffice', '--headless', '-env:UserInstallation=file://' + os.path.join(tmp, 'lo'), '--convert-to', 'xlsx', '--outdir', tmp, q], capture_output=True, timeout=180)
            x = os.path.join(tmp, 'a.xlsx')
            return dump_xlsx(x) if os.path.exists(x) else ''
        return ''
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == '__main__':
    sys.stdout.write(main(sys.argv[1]))
