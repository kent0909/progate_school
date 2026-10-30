const load=f=>{delete globalThis.SIMDATA;delete require.cache[require.resolve(f)];require(f);return globalThis.SIMDATA.tokyo23};
const A=load(process.argv[2]),B=load(process.argv[3]);
const med=a=>{a=[...a].sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2};
for(const [n,T] of [['A',A],['B',B]]){const w=T.sites.map(s=>s.walk);console.log(n,'walk median',med(w),'mean',Math.round(w.reduce((a,b)=>a+b)/w.length),'<=200',w.filter(x=>x<=200).length,'201-500',w.filter(x=>x>200&&x<=500).length,'>500',w.filter(x=>x>500).length,'>800',w.filter(x=>x>800).length)}
const key=s=>s.l01;const ka=new Set(A.sites.map(key)),kb=new Set(B.sites.map(key));
console.log('same points',[...ka].filter(x=>kb.has(x)).length,'onlyA',[...ka].filter(x=>!kb.has(x)).length);
// per station distinct types
const nt=T=>{const m={};for(const s of T.sites)(m[s.st]=m[s.st]||new Set()).add(s.type);return m};
const ma=nt(A),mb=nt(B);let sa=0,sb=0;for(const s of A.stations){sa+=ma[s.id]?ma[s.id].size:0}for(const s of B.stations){sb+=mb[s.id]?mb[s.id].size:0}console.log('sum distinct types A',sa,'B',sb);
