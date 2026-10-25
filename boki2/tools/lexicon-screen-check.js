#!/usr/bin/env node
'use strict';
const assert=require('assert/strict'),path=require('path'),{spawnSync}=require('child_process');
const {AccountScreens,scanner,readOnly,projectEvent}=require('./lexicon-screen-accounts');
for(const [file,expected]of [['three',1],['two',0],['month-three',0]]){
  const r=spawnSync(process.execPath,[path.join(__dirname,'lexicon-screen-accounts.js'),'--fixture',path.join(__dirname,'fixtures/lexicon-screens',file+'.json')],{encoding:'utf8'});
  assert.ifError(r.error);assert.equal(r.status,expected,r.stderr);if(file==='month-three')assert.match(r.stdout,/注意（月の目安）.*新しい科目3/);if(file==='three')assert.match(r.stderr,/three.*3科目/);
  console.log(`OK：${file} 終了コード${r.status}`);
}
const accounts={現金:{},売掛金:{},借入金:{},損益:{},売上:{}},scan=scanner(accounts,{concepts:['損益計算書'],docWords:{}}),a=new AccountScreens(scan);
a.show('4月','first','現金');a.show('5月','teach','', ['売掛金']);assert.equal(a.show('5月','after','現金 売掛金 借入金').newCount,1);
assert.deepEqual(scan('損益計算書・売上げる・損益'),['損益']);
const state={nested:{x:1},T:[],L:[],mi:0},ro=readOnly(state);assert.throws(()=>{ro.nested.x=2;},/書き換え/);assert.throws(()=>ro.T.push({}),/書き換え/);assert.equal(state.nested.x,1);
// 書類だけに限定しない。机・計算・決算書で3科目を同時に初出にした変異も落とす。
for(const type of ['calc','desk','report','sheet','ss']){
 const audit=new AccountScreens(scan),D={y2books:{balance:()=>1},months:[{seg:'desk'}]},B={accounts},m={label:'4月',m:4,events:[]};
 const e={id:type,t:type,kubun:type==='report',title:'現金 売掛金 借入金',talk:[],rows:[],q:'',unit:'',items:[{title:'現金 売掛金 借入金',line:'',why:''}]};
 const live={...state,T:[{dr:[['現金',1],['売掛金',1],['借入金',1]],cr:[]}],L:[{mi:0,dr:[['現金',1],['売掛金',1],['借入金',1]],cr:[]}]};
 if(type==='ss'){B.accounts={資本金:{},資本準備金:{},利益準備金:{},繰越利益剰余金:{}};audit.scan=scanner(B.accounts,{});}
 projectEvent(audit,D,B,live,e,m);assert.ok(audit.result().failures.length,`${type}も3科目で失敗する`);
}
console.log('OK：前の画面の表示／teach、長い語の優先、読み取り専用、計算・作業台・決算書・精算表・変動計算書');
// 名前と折りたたみの試験文は同じ画面。別画面として数えて負荷を消さない。
{
 const audit=new AccountScreens(scan),m={m:4,label:'4月',events:[]},e={id:'discover-exam',t:'discover',title:'問い',b1:{talk:[]},b2:{q:'',targets:[],reasons:[]},b3:{ok:''},b4:{name:'現金 売掛金',line:'',exam:'借入金',teaches:['現金','売掛金']}};
 projectEvent(audit,{}, {accounts},state,e,m);assert.ok(audit.result().failures.some(s=>s.id.endsWith('/名前')&&s.newCount===3));
}
// 無効な選択肢も画面には出る。選べないからといって科目数から除かない。
{
 const audit=new AccountScreens(scan),m={m:4,label:'4月',events:[]},e={id:'disabled-choice',t:'decision',q:'',talk:[],options:[{id:'a',label:'現金 売掛金',desc:''},{id:'b',label:'借入金',desc:'',disabled:true}]};
 projectEvent(audit,{}, {accounts},state,e,m);assert.equal(audit.result().failures.length,1);
}
console.log('OK：名前と試験文は同一画面、無効な選択肢も表示として数える');
