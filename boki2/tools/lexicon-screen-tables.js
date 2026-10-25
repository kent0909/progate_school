#!/usr/bin/env node
// lexicon-check --account-report の結果を、人が読める全画面・全月の表にする。
'use strict';
const fs=require('fs'),path=require('path');
const [input,out]=process.argv.slice(2);if(!input||!out)throw Error('使い方：node lexicon-screen-tables.js report.json output-directory');
const result=JSON.parse(fs.readFileSync(input,'utf8'));
function tables(r,out){fs.mkdirSync(out,{recursive:true});
const cell=x=>String(x??'').replace(/[\t\r\n]/g,' '),write=(name,rows)=>{fs.writeFileSync(path.join(out,name),rows.map(row=>row.map(cell).join('\t')).join('\n')+'\n');console.log(`${name}：${rows.length-1}行`);};
write('screens.tsv',[['月','画面id','初出科目数（検査経路の最大）','初出科目','その経路','表示された科目'],...r.screens.map(s=>[s.month,s.id,s.newCount,s.newNames.join('・'),s.witness,s.shownNames.join('・')])]);
write('months.tsv',[['月','初出科目数（1経路の最大）','初出科目','画面ごとの内訳','その経路'],...r.months.map(m=>[m.month,m.newCount,m.newNames.join('・'),m.screens.map(s=>s.id+'＝'+s.newNames.join('・')).join(' / '),m.witness])]);
write('receivables.tsv',[['月','画面id','区分（初teach／teach前の表示）','その経路'],...(r.receivables||[]).map(s=>[s.month,s.id,s.kind,s.witness])]);
write('outcomes.tsv',[['札','選択肢','結果','到達'],...r.outcomes.map(o=>[o.card,o.option,o.outcome,o.reached])]);
console.log(JSON.stringify({runs:r.runs,eventCount:r.eventCount,screens:r.screens.length,months:r.months.length,types:r.types,outcomes:r.outcomes.length,screenErrors:r.screenErrors.length,monthWarnings:r.monthWarnings.length,coverageFailures:r.failures},null,2));

}
tables(result,out);if(result.shortcut)tables(result.shortcut,path.join(out,'shortcut'));
