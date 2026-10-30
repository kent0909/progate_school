// 4.5 の置き値での「昼だけ」と「通し」の月の差の簡易計算（実装していない式。1客の限界利益 581円・26日・上限70を0.45/0.55）
const out=JSON.parse(require('fs').readFileSync(process.argv[2]));
const L={office:0.75,kojo:0.85,shogyo:0.55,shoten:0.5,jutaku:0.35,hanka:0.3};
const K=26*581, save=200000*0.4+50000*0.35;
for(const t of Object.keys(L)){const a=out.filter(o=>o.type===t);let win=0;for(const o of a){const N=o.rel*44, d=N*L[t], n=N*(1-L[t]);const thru=Math.min(d,70*0.45)+Math.min(n,70*0.55);const lunch=Math.min(d,70*0.45);if((lunch-thru)*K+save>0)win++}console.log(t,a.length,'昼だけが通しより得',win,(win/a.length*100).toFixed(0)+'%')}
