'use strict';
// 正式な合否の計算はそのまま実行する。合否に使わない2つの参考全探索だけを外す。
// ①1年目10円刻み（41×7×7） ②他店価格を固定した診断（7×7×7）。
// 合否で使う通常の7×7×7・150周は残す。需要・方針・係数・閾値は変えない。
// 本体ファイルは書き換えず、Nodeの読み込み時に下の明示した行だけを除く。
const Module=require('module'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const target=path.resolve(__dirname,'../../tools/sim-ramen.js');
const expected=require('./ramen-y1-economy-source.json').files['boki2/tools/sim-ramen.js'];
const compile=Module.prototype._compile;
Module.prototype._compile=function(source,filename){
 if(path.resolve(filename)===target){
  const bytes=Buffer.from(source),hash=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
  if(hash!==expected)throw Error('正式検査の基準ソースが変わった。参考探索の除外を再確認すること');
  const patterns=[
   /^    const fine = pricePlan\(W,strategy,0,null,Array\.from\(\{length:41\}.*\n/m,
   /^    if\(fine\)\{fineP\.push.*\n/m,
   /^    const fixed = pricePlan\(W,strategy,0,fixedPrices\);\n/m,
   /^    if\(fixed && fixed\.prices\[0\]<850.*\n/m,
   /^    if\(fixed && fixed\.prices\[0\]===YEAR_PRICES\[0\]\).*\n/m,
   /^  info\.push\(`診断（合否なし.*\n/m,
   /^  const ff=\{\};fineP\.forEach.*\n/m,
   /^  info\.push\(`1年目10円刻み.*\n/m,
  ];
  for(const re of patterns){const matches=source.match(new RegExp(re.source,'gm'));if(!matches||matches.length!==1)throw Error('除外箇所が一意でない: '+re);source=source.replace(re,'');}
  if(!source.includes('const best = pricePlan(W, strategy);')||!source.includes('if (pct(swap, runs) <= 50)'))throw Error('正式な価格探索がない');
  console.log('参考探索だけ除外：10円刻みと他店価格固定。正式な全合否行・300周（長期価格150周）は無変更。');
 }
 return compile.call(this,source,filename);
};
