'use strict';
// node -r で実装を読み、プロセス内の係数だけ差し替える。本体ファイルは一切書かない。
const path = require('path');
const root = path.resolve(__dirname, '../..');
global.window = global;
const story = require(path.join(root, 'tools/ramen-files.js')).story;
for (const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...story]) require(path.join(root, f));
const D = global.SIMDATA, C = D.coef, Wd = D.world;
const configs = require('./ramen-y1-economy-config.js');
const original = Object.fromEntries(Object.entries(C.table).map(([k,v])=>[k,structuredClone(v.v)]));
const create = Wd.create;
function apply(name) {
  const v = configs[name]; if (!v) throw Error('未知の条件: '+name);
  for (const [k,value] of Object.entries(original)) C.table[k].v=structuredClone(value);
  for (const [k,value] of Object.entries(v.coef)) { if (!C.table[k]) throw Error('未知の係数: '+k); C.table[k].v=structuredClone(value); }
  Wd.create = v.openingPeak == null ? create : (o) => {
    const W=create(o), b=W.stores[0].bowl;
    b.peak=b.peak0=v.openingPeak; b.peakLeft=C('peakMonths');
    return W;
  };
  return {name,...v,rangeErrors:C.check()};
}
if (process.env.RAMEN_Y1_VARIANT) apply(process.env.RAMEN_Y1_VARIANT);
module.exports={root,D,C,Wd,apply,configs,original};
