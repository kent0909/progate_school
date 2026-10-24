#!/usr/bin/env node
'use strict';
// 集計の欠測・母数・件数・実装ファイルの不変を確認する。合否の線を変更しない。
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const dir=path.resolve(process.argv[2]||path.join(__dirname,'ramen-y1-economy-results'));
const {root}=require('./ramen-y1-economy-load.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'ramen-y1-economy-source.json'),'utf8'));
for(const [file,want]of Object.entries(manifest.files)){const b=fs.readFileSync(path.join(root,'..',file));const actual=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');assert.equal(actual,want,'基準と異なるファイル: '+file);}
const summary=JSON.parse(fs.readFileSync(path.join(dir,'summary.json'),'utf8'));
assert.equal(summary.runs,300);
assert.equal(summary.simRamenSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'tools/sim-ramen.js'))).digest('hex'));
const rows=fs.readFileSync(path.join(dir,'runs.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
let groups=0,months=0;
for(const s of summary.rows){
 const rs=rows.filter(r=>r.variant===s.variant&&r.kind===s.kind);
 assert.equal(rs.length,300);assert.equal(new Set(rs.map(r=>r.seed)).size,300);
 assert.equal(s.firstDistribution.reduce((a,r)=>a+r.k,0),300);
 assert.equal(s.any.k,rs.filter(r=>r.first!==null).length);
 assert.equal(s.any.k,300-s.firstDistribution[12].k);
 assert.equal(s.byOct.k,rs.filter(r=>r.first!==null&&r.first<=6).length);
 assert.equal(s.medianAnnualOp,median(rs.map(r=>r.months.reduce((a,m)=>a+m.op,0))));
 assert.equal(s.minCash.min,Math.min(...rs.map(r=>r.minCash)));
 for(const r of rs){
  const first=r.months.findIndex(m=>m.op>0);assert.equal(r.first,first<0?null:first);
  assert.equal(r.completed,r.months.length===12); assert.deepEqual(r.months.map(m=>m.t),Array.from({length:r.months.length},(_,i)=>i));
  for(const m of r.months)for(const k of ['op','N','cash','R','L'])assert(Number.isFinite(m[k]));
  months+=r.months.length;
 }
 for(const p of [s.any,s.bySep,s.byOct,s.bankrupt,...s.firstDistribution,...s.months.map(m=>m.positive)]){
  assert.equal(p.n,300);assert(p.k>=0&&p.k<=p.n);assert(p.lo<=p.pct+1e-10&&p.hi>=p.pct-1e-10);
 }
 groups++;
}
console.log(`OK：${groups} 条件×方針、${rows.length} 周、${months} 月。初黒字分布・全周の母数・年利益・最低口座・有限値・Wilson区間・正式検査のSHAを照合`);
