const L = require('../stationmap-v06-measure/lib6.js');
const P = L.params({});
for (const t of ['office','shogyo','hanka','kojo','jutaku','shoten']) { const a = L.sites.filter((s) => s.type === t).map((s) => L.Lof(s, P)).sort((x, y) => x - y); const n = a.length;
  const lo = a[Math.floor(0.5 * (n - 1))], md = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; const nd = L.sites.filter((s) => s.type === t && !s.dayFilled).map((s) => L.Lof(s, P)).sort((x,y)=>x-y);
  console.log(t, 'n', n, '下の中央(q)', lo.toFixed(3), '中央(平均)', md.toFixed(3), 'day ありだけ', nd.length, L.med(nd).toFixed(3), '25%', a[Math.floor(0.25*(n-1))].toFixed(2), '75%', a[Math.floor(0.75*(n-1))].toFixed(2)); }
