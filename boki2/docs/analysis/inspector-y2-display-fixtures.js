// 1年基準の表示は実行経路とは分け、支払予定から独立に作った残高資料で検算する。
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');global.window=global;
const root=path.resolve(process.argv[2]);
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(root+'/tools/ramen-files.js').story])require(path.join(root,f));
const D=SIMDATA,rows=[];
for(const cost of [600000,1200000])for(const paid of [0,9,12,13,23,24]){
 const total=cost*1.1,payment=total/24,interest=cost/10,monthlyInterest=interest/24;
 const unpaid=total-payment*paid,prepaid=interest-monthlyInterest*paid;
 const S={W:{t:27+paid,flags:{y2Equipment:{cost,at:26,method:'installment'}}},T:[]},b={'長期未払金':-unpaid,'前払利息':prepaid};
 let currentUnpaid=0,currentInterest=0;
 for(let month=paid;month<Math.min(paid+12,24);month++){currentUnpaid+=payment;currentInterest+=monthlyInterest;}
 const before=JSON.stringify([S,b]),q=D.y2.maturity.quote(S,b,26+paid),display=D.y2.maturity.display(S,b,26+paid);
 assert.equal(JSON.stringify([S,b]),before);assert.equal(q.currentUnpaid,currentUnpaid);assert.equal(q.longUnpaid,unpaid-currentUnpaid);
 assert.equal(q.currentInterest,currentInterest);assert.equal(q.longInterest,prepaid-currentInterest);
 assert.equal((display['未払金']||0)+(display['長期未払金']||0),-unpaid);
 assert.equal((display['前払費用']||0)+(display['長期前払費用']||0)+(display['前払利息']||0),prepaid);
 rows.push({cost,paid,unpaid,prepaid,currentUnpaid,longUnpaid:q.longUnpaid,currentInterest,longInterest:q.longInterest,difference:0});
}
const name=D.namings['貸倒引当金戻入'];assert(name&&name.q&&name.line&&name.opts.some(o=>o.ok)&&name.teaches.includes('貸倒引当金戻入'));
const result={head:'8defe7edb35317cf9e4ed907e5538555ad4aec9f',fixtures:rows.length,maxDifference:0,returnNaming:true,rows};
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
