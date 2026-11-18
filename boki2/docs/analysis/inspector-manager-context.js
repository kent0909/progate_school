// 設計の初期条件、既存の語の定義、2級への接続先を公開本体から読み出す検査専用。
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');global.window=global;
const root=path.resolve(process.argv[2]);
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(root+'/tools/ramen-files.js').story])require(path.join(root,f));
const D=SIMDATA,out={budgets:[],namings:{},questions:[]};
out.currentEntry=[];
for(const form of ['part1','part2']){
 const S={seed:0,decisions:{form},profile:{}};D.ramen.world(S);
 out.currentEntry.push({form,tier:S.W.tier,budget:D.world.timeBudget(S.W,{})});assert.equal(S.W.tier,0);
}
const W=D.world.create({seed:0});W.t=17;W.y=2;W.m=9;
out.storeGuard={oneStore:D.cards.byId.site2.when(W)};W.stores.push({...W.stores[0],id:'fixture-second'});
out.storeGuard.twoStores=D.cards.byId.site2.when(W);assert(out.storeGuard.oneStore&&!out.storeGuard.twoStores);
const quality=fs.readFileSync(root+'/docs/QUALITY.md','utf8');
assert(quality.includes('正しさ（会計・法令）'));assert(quality.includes('robots.txt・利用規約'));
out.classification={correctness:'正しさ（会計・法令）',terms:'robots.txt・利用規約'};
for(const tier of [0,1])for(const parts of [1,2]){
 const W=D.world.create({seed:0,form:'part2'});W.tier=tier;W.last={cardTime:0};
 out.budgets.push({tier,parts,budget:D.world.timeBudget(W,{parts,family:0})});
}
assert.equal(out.budgets.find(x=>x.tier===1&&x.parts===2).budget,5);
for(const name of ['給料','未払費用','法定福利費','預り金','賞与引当金繰入','賞与引当金','本店','支店'])out.namings[name]={account:!!BOKI.accounts[name],naming:!!D.namings[name]};
const questions=[],originalRegister=BOKI.exam;BOKI.exam=q=>questions.push(q);
for(const f of ['exam2c3c.js','exam6a.js','exam3b.js'])require(root+'/js/data/'+f);
BOKI.exam=originalRegister;
out.questions=questions.filter(q=>['x3u2','x3e'].includes(q.id)||q.title.includes('本支店会計の勘定記入'));
const bonus=out.questions.find(q=>q.id==='x3u2');assert(bonus);assert.equal(bonus.blanks[12],42000);
const branch=out.questions.find(q=>q.title.includes('本支店会計の勘定記入'));assert(branch);assert.equal(branch.blanks[5],775000);
out.examVerification={bonus:372000-330000,branch:600000+450000+90000-200000-120000-45000};
assert.equal(out.examVerification.bonus,bonus.blanks[12]);assert.equal(out.examVerification.branch,branch.blanks[5]);
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({...out,questions:out.questions.map(q=>({id:q.id,title:q.title,scope:q.scope}))}));
