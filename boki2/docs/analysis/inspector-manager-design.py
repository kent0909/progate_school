"""公開設計の算術・範囲・機会損失・仕訳を独立検算する。設計や本体は変更しない。"""
import argparse, collections, hashlib, itertools, json
from fractions import Fraction
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('design')
p.add_argument('output')
a = p.parse_args()
source = Path(a.design).read_bytes()
blob = hashlib.sha1(b'blob ' + str(len(source)).encode() + b'\0' + source).hexdigest()
assert blob == '6cd40472800a418ea9104a8f9b64fda8b2cad2f6', '指定したdb0c229の設計と異なる'
text = source.decode()
section = text.split('## 4.')[1].split('## 5.')[0]
ranges = []
def number(s):
    return int(s.replace(',', '').replace('%', '').strip())
for line in section.splitlines():
    if not line.startswith('|'):
        continue
    cells = [x.strip() for x in line.strip('|').split('|')]
    if len(cells) == 5 and cells[1].replace(',', '').replace('%', '').isdigit():
        ranges.append(dict(name=cells[0], value=number(cells[1]), lo=number(cells[2]), hi=number(cells[3])))
assert len(ranges) == 21
assert all(x['lo'] <= x['value'] <= x['hi'] for x in ranges)

def cost(wage, bonus, rate):
    return Fraction(wage * 12 + bonus, 12) * (1 + Fraction(rate, 100))

ce, cj = cost(300000, 120000, 15), cost(220000, 60000, 15)
assert (ce, cj) == (356500, 258750)

def gains(H, k, v, loss, *, ce=ce, cj=cj, qe=2, qj=1,
          months=2, education=1, handover=1, fee_e=80000, fee_j=50000,
          education_cost=40000, training='same-capacity'):
    """全初店枠を使用済み、各やめる手の損失がlossの条件。実測モデルではない。"""
    m = min(H, months)
    train_q = qj if training == 'same-capacity' else min(qj, 1)
    experienced = H * min(k, qe) * v - H * ce - fee_e - handover * loss
    junior = ((H-m)*min(k, qj) + m*min(k, train_q))*v - H*cj - fee_j - m*education_cost - m*education*loss
    self_control = H*k*(v-loss)
    return {'none': Fraction(0), 'self': self_control, 'experienced': experienced, 'junior': junior}

b = gains(6, 2, 250000, 250000)
c = gains(18, 1, 340000, 340000)
assert b['experienced'] == 531000 and b['junior'] == -682500
assert c['junior'] == 652500 and c['experienced'] == -717000
assert 150000-ce == -206500 and 150000-cj == -108750
baseline = {'monthlyExperienced': ce, 'monthlyJunior': cj,
            'A_mature': {'experienced': 150000-ce, 'junior': 150000-cj}, 'B_6months': b, 'C_18months': c}

# 机と追加の手がない条件では、案が定義する委任便益は0。現行ゲームの店長を実装したものではない。
without_desk = {'experiencedMonthly': -ce, 'juniorMatureMonthly': -cj, 'juniorTrainingMonthly': -cj-40000}
opportunity_cases = []
for label, H, k, v, hi in [('B', 6, 2, 250000, 400000), ('C', 18, 1, 340000, 450000)]:
    for loss in sorted({0, v, hi, 200000, 250000}):
        g = gains(H, k, v, loss)
        opportunity_cases.append({'scenario': label, 'lossPerForegoneSlot': loss, 'gains': g,
                                  'best': [x for x,y in g.items() if y == max(g.values())]})

# 機会損失=追加店1枠の利益という元の仮定。回収月と逆転境界を閉形式でも確認する。
recovery = {'B_firstPositiveMonth': next(h for h in range(1,61) if gains(h,2,250000,250000)['experienced']>0),
            'C_firstPositiveMonth': next(h for h in range(1,61) if gains(h,1,340000,340000)['junior']>0),
            'B_experienced_vs_self_loss_threshold': Fraction(2219000,11),
            'C_junior_vs_self_loss_threshold': Fraction(4787500,16)}
assert recovery['B_firstPositiveMonth']==3 and recovery['C_firstPositiveMonth']==10

# Aには比較期間・初店の機会損失の指定がない。期間を作らず、平常月の原価の範囲だけを検査。
a_mature=[]
for we,wj,be,bj,rate,v in itertools.product([250000,400000],[180000,260000],[0,240000],[0,120000],[10,20],[0,150000,300000]):
    a_mature.append({'benefit':v,'experienced':v-cost(we,be,rate),'junior':v-cost(wj,bj,rate)})
assert len(a_mature)==96
a_range={'evaluations':len(a_mature),'period':'平常月のみ。Aの比較月数は未指定なので作らない',
         'experienced':[min(x['experienced'] for x in a_mature),max(x['experienced'] for x in a_mature)],
         'junior':[min(x['junior'] for x in a_mature),max(x['junior'] for x in a_mature)]}
assert a_range['experienced']==[-504000,25000] and a_range['junior']==[-324000,102000]

# 経済側13項目：連続値はlo/hi、教育期間1..4・初月引継ぎ0..2は全整数。
# 便益と機会損失の区間全体での2候補の差は線形。4隅で符号を確かめる。
dimensions = [[250000,400000],[180000,260000],[0,240000],[0,120000],[10,20],
              [1,2],[1,2],[1,2,3,4],[1,2],[0,1,2],[40000,120000],[20000,80000],[20000,60000]]
grid_count=0
counts={}
for scenario,H,k,v,hi in [('B',6,2,250000,400000),('C',18,1,340000,450000)]:
    for training in ['same-capacity','training-capped-at-one']:
        winners=collections.Counter(); dominated=collections.Counter(); n=0
        for we,wj,be,bj,rate,qe,qj,months,education,handover,fe,fj,ec in itertools.product(*dimensions):
            kw=dict(ce=cost(we,be,rate),cj=cost(wj,bj,rate),qe=qe,qj=qj,months=months,
                    education=education,handover=handover,fee_e=fe,fee_j=fj,education_cost=ec,training=training)
            g=gains(H,k,v,v,**kw); best=max(g.values())
            winners['+'.join(x for x,y in g.items() if y==best)]+=1
            differences=[]
            for vv,ll in itertools.product([0,hi],[0,hi]):
                gg=gains(H,k,vv,ll,**kw);differences.append(gg['junior']-gg['experienced'])
            if min(differences)>0:dominated['experiencedStrictlyDominatedOverRectangle']+=1
            if max(differences)<0:dominated['juniorStrictlyDominatedOverRectangle']+=1
            n+=1
        assert n==24576
        grid_count+=n;counts[scenario+'/'+training]={'profiles':n,'bestAtIllustrationValues':dict(winners),
                                                  'dominance':dict(dominated),'benefitAndLossRange':[0,hi]}

# 広い範囲内で一方の候補が全域で劣る、具体的な許容角を2つ示す。
dominance_examples=[]
for label,kw in [
    ('junior-dominates',dict(ce=cost(400000,240000,20),cj=cost(180000,0,10),qe=1,qj=2,months=1,education=1,handover=2,fee_e=120000,fee_j=20000,education_cost=20000)),
    ('experienced-dominates',dict(ce=cost(250000,0,10),cj=cost(260000,120000,20),qe=2,qj=1,months=4,education=2,handover=0,fee_e=40000,fee_j=80000,education_cost=60000))]:
    # 両候補は同じ会社負担率を使う。異なる率を都合よく与えない。
    if label=='junior-dominates':kw['cj']=cost(180000,0,20)
    if label=='experienced-dominates':kw['cj']=cost(260000,120000,10)
    for scenario,H,k,hi in [('B',6,2,400000),('C',18,1,450000)]:
        for training in ['same-capacity','training-capped-at-one']:
            diffs=[]
            for v,loss in itertools.product([0,hi],[0,hi]):
                g=gains(H,k,v,loss,training=training,**kw);diffs.append(g['junior']-g['experienced'])
            if label=='junior-dominates':assert min(diffs)>0
            else:assert max(diffs)<0
            dominance_examples.append({'label':label,'scenario':scenario,'training':training,'parameters':kw,
                                       'minimumJuniorMinusExperienced':min(diffs),'maximumJuniorMinusExperienced':max(diffs)})

entries=[
    {'dr':{'給料':300000},'cr':{'未払費用':300000}},
    {'dr':{'法定福利費':45000},'cr':{'未払費用':45000}},
    {'dr':{'未払費用':300000},'cr':{'普通預金':260000,'預り金':40000}},
    {'dr':{'未払費用':45000,'預り金':35000},'cr':{'普通預金':80000}},
    {'dr':{'預り金':5000},'cr':{'普通預金':5000}}]
balances=collections.Counter()
for e in entries:
    assert sum(e['dr'].values())==sum(e['cr'].values())
    balances.update(e['dr']);balances.subtract(e['cr'])
assert balances['未払費用']==balances['預り金']==0
assert balances['普通預金']==-345000 and balances['給料']+balances['法定福利費']==345000

def encode(o):
    if isinstance(o,Fraction):return int(o) if o.denominator==1 else {'numerator':o.numerator,'denominator':o.denominator,'decimal':float(o)}
    raise TypeError(type(o).__name__)
result={'targetCommit':'db0c2298a97a9ceafffcc175a9886a951bad6126','designBlob':blob,
        'ranges':ranges,'baseline':baseline,'withoutAdditionalDesk':without_desk,
        'opportunitySensitivity':opportunity_cases,'recoveryAndThresholds':recovery,
        'A_matureRange':a_range,'economicProfilesPerMode':24576,'totalEvaluations':grid_count,'grid':counts,
        'dominanceExamples':dominance_examples,'payroll':{'entries':entries,'balances':dict(balances),'expense':345000,'cashOut':345000},
        'limits':['仮の式の検査であり、現行ゲームで店長の効果を測定したものではない',
                  '格子の比率は実在候補の確率ではない。lo/hi内の独立な角点の件数',
                  '育成中の枠の定義が曖昧なため2解釈を別々に評価','現行初店の5枠の機会損失・追加店の利益は未測定']}
Path(a.output).write_text(json.dumps(result,ensure_ascii=False,indent=2,default=encode)+'\n')
print(json.dumps({k:result[k] for k in ['targetCommit','baseline','economicProfilesPerMode','totalEvaluations','grid','recoveryAndThresholds']},ensure_ascii=False,default=encode))
