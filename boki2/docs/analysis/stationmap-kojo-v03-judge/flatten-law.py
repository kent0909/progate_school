# 判定役（11/25）：e-Gov API v2 の JSON（research/raw/law/primary/*.html）の本文の文字を、木の順に1行ずつ出す。
import json,sys
def walk(n,out):
    if isinstance(n,str): out.append(n); return
    if isinstance(n,dict):
        for k in ('tag','attr'):
            pass
        ch=n.get('children')
        if ch is not None:
            tag=n.get('tag','')
            buf=[]
            for c in ch:
                if isinstance(c,str): buf.append(c)
                else:
                    if buf: out.append(''.join(buf)); buf=[]
                    if c.get('tag') in ('Sentence','ItemTitle','ArticleTitle','ParagraphNum','TableColumn','Column','ArticleCaption','AppdxTableTitle','TableHeaderColumn'):
                        s=[]; flat(c,s); out.append('['+c.get('tag')+'] '+''.join(s))
                    else: walk(c,out)
            if buf: out.append(''.join(buf))
        else:
            for v in n.values():
                if isinstance(v,(dict,list)): walk(v,out)
    elif isinstance(n,list):
        for c in n: walk(c,out)
def flat(n,s):
    if isinstance(n,str): s.append(n)
    elif isinstance(n,dict):
        for c in n.get('children',[]): flat(c,s)
    elif isinstance(n,list):
        for c in n: flat(c,s)
j=json.load(open(sys.argv[1]))
out=[]; walk(j.get('law_full_text',j),out)
for l in out:
    if l.strip(): print(l)
