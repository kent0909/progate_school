# 判定役：前回の検査書2本の指摘の番号が、直した文書のどの行に〈番号〉で出るかを数える
import re
F={'KOJO':'/home/user/progate_school/boki2/docs/DESIGN-STATIONMAP-KOJO.md','BIZ':'/home/user/progate_school/boki2/docs/BIZ-RAMENCOUNT23.md','ADD1':'/home/user/progate_school/boki2/docs/CODEX-TASK-stationmap-sim-2-ADD1.md'}
tags=['J1-1','J1-2','J1-3','J1-4']+[f'J2-{i}' for i in range(1,9)]+[f'J3-{i}' for i in range(1,11)]+[f'X{i}' for i in range(1,7)]+[f'Y{i}' for i in range(1,5)]+[f'Z{i}' for i in range(1,6)]+[f'B{i}' for i in range(1,14)]+[f'K{i}' for i in range(1,18)]+[f'L{i}' for i in range(1,6)]+['R15','R17','C']
L={k:open(v).read().split('\n') for k,v in F.items()}
for t in tags:
    out=[]
    for k,ls in L.items():
        hits=[i+1 for i,l in enumerate(ls) if re.search('〈'+re.escape(t)+'〉',l)]
        if hits: out.append(f"{k}:{','.join(map(str,hits))}")
    print(t,' '.join(out) or '—')
