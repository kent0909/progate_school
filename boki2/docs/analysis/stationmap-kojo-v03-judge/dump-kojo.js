// 判定役：tokyo23.js の工場の候補地25か所（と規則の町に当たる全候補地）を JSON で出す
global.window = global; require('/home/user/progate_school/boki2/js/data/tokyo23.js'); const T = SIMDATA.tokyo23;
const ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
const out = T.sites.filter((s) => s.type === 'kojo' || /平和島|臨海町|高島平[67]|入谷[1567]丁目/.test(s.town)).map((s) => ({ id: s.id, town: s.town, ward: s.ward, type: s.type, zone: s.zone, walk: s.walk, desc: s.desc, l01: s.l01, st: ST[s.st].name, day: s.day }));
console.log(JSON.stringify(out));
