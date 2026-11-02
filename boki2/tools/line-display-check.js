#!/usr/bin/env node
// 路線表示の表を検査する。外部通信なし。元データ未再生成でも投影を検査し、生成済みなら付加項目も一致照合。
// node boki2/tools/line-display-check.js [--data file.js] [--table file.json] [--require-generated]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const unique = xs => [...new Set(xs)];
const key = l => `${l.op} ${l.name}`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function project(data, table) {
  const errors = [], rows = new Map(), used = new Set(), usage = new Map();
  const fail = s => errors.push(s);
  const services = table.services || {};
  if (table.version !== 1) fail('表のversionは1が必要');
  for (const [id, s] of Object.entries(services)) {
    if (!s.display || typeof s.display !== 'string') fail(`呼称なし：${id}`);
    if (!/^#[0-9a-f]{6}$/i.test(s.color)) fail(`16進色でない：${id} ${s.color}`);
  }
  if (new Set(Object.values(services).map(s => s.display)).size !== Object.keys(services).length) fail('異なるserviceに同じ呼称');
  function ids(list, where, op) {
    if (!Array.isArray(list) || !list.length) { fail(`呼称なし：${where}`); return []; }
    if (unique(list).length !== list.length) fail(`呼称重複：${where}`);
    for (const id of list) {
      if (!services[id]) fail(`未定義service：${where} ${id}`);
      else { used.add(id); if (!usage.has(op)) usage.set(op, new Set()); usage.get(op).add(id); }
    }
    return list.filter(id => services[id]);
  }
  for (const row of table.lines || []) {
    if (rows.has(key(row))) fail(`表の組重複：${key(row)}`);
    rows.set(key(row), row);
    ids(row.services, key(row), row.op);
  }
  const needed = new Set([...data.lines.map(key), ...data.stations.flatMap(s => s.lines)]);
  for (const k of needed) if (!rows.has(k)) fail(`表の組不足：${k}`);
  for (const k of rows.keys()) if (!needed.has(k)) fail(`表に未知の組：${k}`);
  const named = list => list.map(id => ({display: services[id].display, color: services[id].color}));
  const summary = list => ({display: list.map(s => s.display).join('・'), color: list[0].color});
  const lineResult = [];
  for (const line of data.lines) {
    const row = rows.get(key(line)); if (!row) continue;
    let rules;
    if (row.pathRules) {
      if (row.pathRules.length !== line.paths.length) fail(`区間数不一致：${key(line)}`);
      const indices = new Set();
      for (const rule of row.pathRules) {
        if (!Number.isInteger(rule.pathIndex) || indices.has(rule.pathIndex)) fail(`区間番号不正・重複：${key(line)} ${rule.pathIndex}`);
        indices.add(rule.pathIndex);
        if (!same(rule.points, line.paths[rule.pathIndex])) fail(`区間座標不一致：${key(line)} ${rule.pathIndex}`);
        if (!rule.via) fail(`区間の根拠なし：${key(line)} ${rule.pathIndex}`);
        ids(rule.services, `${key(line)} paths[${rule.pathIndex}]`, row.op);
        for (const id of rule.services || []) if (!row.services.includes(id)) fail(`区間の呼称が路線要約にない：${key(line)} ${id}`);
      }
      for (let i=0; i<line.paths.length; i++) if (!indices.has(i)) fail(`区間不足：${key(line)} ${i}`);
      const union = unique(row.pathRules.flatMap(r => r.services));
      if (!same([...union].sort(), [...row.services].sort())) fail(`路線要約と区間の呼称集合不一致：${key(line)}`);
      rules = line.paths.map((p, i) => row.pathRules.find(r => r.pathIndex === i)?.services || []);
    } else {
      if (row.services.length > 1) fail(`複数呼称に区間表なし：${key(line)}`);
      rules = line.paths.map(() => row.services);
    }
    if (rules.some(x => !x.length || x.some(id => !services[id])) || row.services.some(id => !services[id])) continue;
    const displayPaths = rules.map((list, pathIndex) => {
      const ss = named(list); return {pathIndex, ...summary(ss), services: ss};
    });
    lineResult.push({...summary(named(row.services)), displayPaths});
  }
  const stationResult = [];
  for (const station of data.stations) {
    const all = [];
    for (const k of station.lines) {
      const row = rows.get(k); if (!row) continue;
      let list = row.services;
      if (row.services.length > 1 && !row.stationRules) fail(`複数呼称に駅の表なし：${k}`);
      if (row.stationRules) {
        const matches = row.stationRules.filter(r => r.station === station.name);
        if (matches.length !== 1) { fail(`駅の対応が1行でない：${station.name} ${k}`); continue; }
        list = matches[0].services;
      }
      all.push(...ids(list, `${station.name} ${k}`, row.op));
    }
    stationResult.push(unique(all).map(id => services[id].display));
  }
  for (const row of rows.values()) {
    for (const rule of row.stationRules || []) {
      if (!data.stations.some(s => s.name === rule.station && s.lines.includes(key(row)))) fail(`存在しない駅の対応：${key(row)} ${rule.station}`);
    }
  }
  // 同一事業者で異なる呼称が同色なら、色と呼称の集合を指定した理由が必要。未登録の路線を免除しない。
  for (const [op, set] of usage) {
    const list = [...set];
    for (let i=0; i<list.length; i++) for (let j=i+1; j<list.length; j++) {
      const a=services[list[i]], b=services[list[j]];
      if (a.color.toUpperCase() === b.color.toUpperCase() && !(table.sharedColors || []).some(r => r.op === op && r.color.toUpperCase() === a.color.toUpperCase() && r.reason?.trim() && r.services.includes(list[i]) && r.services.includes(list[j]))) fail(`理由のない同色：${op} ${a.display}／${b.display} ${a.color}`);
    }
  }
  for (const reason of table.sharedColors || []) {
    if (!reason.reason?.trim() || !/^#[0-9a-f]{6}$/i.test(reason.color) || reason.services.length < 2) fail('同色理由の定義不正');
    for (const id of reason.services) if (!services[id] || !usage.get(reason.op)?.has(id) || services[id].color.toUpperCase() !== reason.color.toUpperCase()) fail(`同色理由の参照不正：${reason.op} ${id}`);
  }
  for (const id of Object.keys(services)) if (!used.has(id)) fail(`未使用の呼称：${id}`);
  if (errors.length) throw new Error(unique(errors).join('\n'));
  return {lines:lineResult, stations:stationResult};
}
function main(args) {
  const opts = {};
  for (let i=0; i<args.length; i++) {
    if (args[i] === '--require-generated') opts.requireGenerated = true;
    else if (['--data','--table'].includes(args[i]) && args[i+1]) opts[args[i++].slice(2)] = args[i];
    else throw new Error(`知らない引数・値不足：${args[i]}`);
  }
  const context = {}; vm.createContext(context);
  vm.runInContext(fs.readFileSync(opts.data || path.join(__dirname,'../js/data/tokyo23.js'),'utf8'), context);
  const data=context.SIMDATA.tokyo23, table=JSON.parse(fs.readFileSync(opts.table || path.join(__dirname,'data/line-display.json'),'utf8'));
  const result=project(data, table), generated=data.lines.some(l => 'display' in l || 'color' in l || 'displayPaths' in l) || data.stations.some(s => 'displayLines' in s);
  if (opts.requireGenerated && !generated) throw new Error('未再生成：生成済みデータが必要');
  if (generated) {
    data.lines.forEach((l,i) => { const want=result.lines[i]; if (!same({display:l.display,color:l.color,displayPaths:l.displayPaths},want)) throw new Error(`生成結果不一致：${key(l)}`); });
    data.stations.forEach((s,i) => { if (!same(s.displayLines,result.stations[i])) throw new Error(`生成結果不一致：${s.name}`); });
  }
  console.log(`OK：路線 ${data.lines.length}・区間 ${data.lines.reduce((n,l)=>n+l.paths.length,0)}・駅 ${data.stations.length}・駅の組 ${data.stations.reduce((n,s)=>n+s.lines.length,0)}／表の組 ${table.lines.length}／抜け0／16進色・同色の理由OK`);
  console.log(generated ? '生成済み項目：全路線・全駅が表の投影と一致' : '未再生成：表の投影を検査（tokyo23.js の更新・検査は取りまとめ役に依頼）');
  console.log('|駅|正式線名|displayLines（投影）|\n|---|---|---|');
  for (const name of ['新宿','渋谷','池袋','東京','上野','品川','北千住','下北沢','三軒茶屋','中目黒']) {
    const i=data.stations.findIndex(s=>s.name===name); if(i<0) throw new Error(`主要駅がない：${name}`);
    console.log(`|${name}|${data.stations[i].lines.join('・')}|${result.stations[i].join('・')}|`);
  }
  console.log('要確認（呼称・色）：');
  for (const [id,s] of Object.entries(table.services)) if(s.review) console.log(`${id} ${s.color}：${s.review}`);
  console.log('要確認（区間）：');
  for (const l of table.lines) if(l.review) console.log(`${key(l)}：${l.review}`);
}
module.exports={project};
if(require.main===module) { try { main(process.argv.slice(2)); } catch(e) { console.error(e.message); process.exitCode=1; } }
