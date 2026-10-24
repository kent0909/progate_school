#!/usr/bin/env node
'use strict';
// 集計JSONから表を再生成。率は全て整数の分子/分母＋Wilson95%を表示。
const fs=require('fs'),path=require('path');
const input=path.resolve(process.argv[2]||path.join(__dirname,'ramen-y1-economy-results'));
const output=path.resolve(process.argv[3]||input);
fs.mkdirSync(output,{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(input,'summary.json'),'utf8'));
const configs=require('./ramen-y1-economy-config.js');
const months=['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月','年度内なし'];
const kind={idle:'放置（正式検査）',policy0:'policy0（衛生あり）',smart0:'上手：常連と地図',smart1:'上手：一杯と衛生',smart2:'上手：集客と席'};
const num=x=>x===null?'—':x.toFixed(1),man=x=>num(x/10000);
const pct=x=>x.n?`${x.k}/${x.n} = ${num(x.pct)}% [${num(x.lo)}, ${num(x.hi)}]`:'—';
const write=(name,lines)=>fs.writeFileSync(path.join(output,name),lines.join('\n')+'\n');
const baseline=Object.fromEntries(data.rows.filter(r=>r.variant==='base').map(r=>[r.kind,r]));
const cause=['# 原因別の比較（実装のsim）','','全条件 seed 0〜'+(data.runs-1)+'。初黒字＝res.op>0。初黒字中央値は年度内なしを末尾に置く（半数が未到達なら「年度内なし」）。営業利益は各周の4〜3月の合計の中央値。月の中央値は別表。金額は万円。割合の [] は Wilson95%。','','|条件|方針|初黒字中央値|年度内に黒字がある周|基準からの差（ポイント）|年間営業利益中央値|基準との差（万円）|3年目平均客数中央値（参考）|','|---|---|---|---|---:|---:|---:|---:|'];
for(const r of data.rows){const b=baseline[r.kind];cause.push(`|${r.label}|${kind[r.kind]}|${months[r.firstMedian]}|${pct(r.any)}|${num(r.any.pct-b.any.pct)}|${man(r.medianAnnualOp)}|${man(r.medianAnnualOp-b.medianAnnualOp)}|${num(r.year3N)}|`);}
write('causes.md',cause);
const monthly=['# 月ごとの客数・営業利益・黒字率','','各月の中央値。客数=人/日、営業利益=万円。黒字率の分母は全300周（倒産後も分母に残す）。観測数は表の末尾。','','|条件|方針|月|客数|営業利益|口座|評判|常連（杯/日）|月次黒字率 [Wilson95%]|観測数|','|---|---|---|---:|---:|---:|---:|---:|---|---:|'];
for(const r of data.rows)for(const m of r.months)monthly.push(`|${r.variant}|${kind[r.kind]}|${months[m.t]}|${num(m.N)}|${man(m.op)}|${man(m.cash)}|${num(m.R)}|${num(m.L)}|${pct(m.positive)}|${m.observed}|`);
write('monthly.md',monthly);
const proposals=['base','potential','ramp','fixed','combined'];
const a=['# (a) 改善案ごとの1年目の手ごたえ','','金額は万円。最低口座は開店直後と各月末の現金（借入を差し引かない）。「全周最小／下位10%／中央値」を併記。未到達を除いた中央値は「到達周のみ」と区別する。','','|条件|方針|初黒字中央値（全周／到達周のみ）|9月まで|10月まで|年度内|最低口座（全周最小／下位10%／中央値）|年度内倒産|','|---|---|---|---|---|---|---|---|'];
for(const r of data.rows.filter(r=>proposals.includes(r.variant)))a.push(`|${r.label}|${kind[r.kind]}|${months[r.firstMedian]}／${r.firstConditionalMedian===null?'—':months[r.firstConditionalMedian]}|${pct(r.bySep)}|${pct(r.byOct)}|${pct(r.any)}|${man(r.minCash.min)}／${man(r.minCash.p10)}／${man(r.minCash.median)}|${pct(r.bankrupt)}|`);
write('proposals-a.md',a);
const dist=['# 初黒字の月の分布','','年度内なしには黒字前の倒産も含む。各行の13区分の件数の合計は周数と一致。各セル=件数/全周・率 [Wilson95%]。','','|条件|方針|'+months.join('|')+'|','|---|---|'+months.map(()=>'---').join('|')+'|'];
for(const r of data.rows.filter(r=>proposals.includes(r.variant)))dist.push(`|${r.variant}|${kind[r.kind]}|${r.firstDistribution.map(pct).join('|')}|`);
write('first-black-distribution.md',dist);
const coeff=['# 実験条件と正式な範囲との関係','','本体の係数表と合否の線は変更していない。範囲外の実験は正式検査で失敗する。','','|ID|説明|差し替え|出どころ/扱い|既存範囲との不一致|','|---|---|---|---|---|'];
for(const [id,c]of Object.entries(configs)){const r=data.rows.find(r=>r.variant===id);if(r)coeff.push(`|${id}|${c.label}|\`${JSON.stringify(c.coef)}\`${c.openingPeak?' 開店peak='+c.openingPeak:''}|${c.source||'元の係数'}|${r.rangeErrors.join('、')||'なし'}|`);}
write('variants.md',coeff);
console.log(`表5本を生成: ${data.rows.length}条件×方針、${data.rows.length*12}月行`);
