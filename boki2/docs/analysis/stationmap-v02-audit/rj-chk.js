const f=process.argv[2]; require(f); const T=globalThis.SIMDATA.tokyo23;
const med=a=>{a=[...a].sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2};
const by={};for(const s of T.sites){(by[s.type]=by[s.type]||[]).push(s.price)}
for(const k in by)console.log(k,by[k].length,'median',med(by[k]));
console.log('all median',med(T.sites.map(s=>s.price)),'n',T.sites.length,'stations',T.stations.length,'pins',T.stations.reduce((a,s)=>a+s.pins,0));
const tiers={};for(const s of T.stations)tiers[s.pins]=(tiers[s.pins]||0)+1;console.log('tiers',tiers);
const st={};for(const s of T.sites){(st[s.st]=st[s.st]||[]).push(s)}
let one=0,one1=0,zero=[];const oneList=[];
for(const s of T.stations){const L=st[s.id]||[];if(!L.length){zero.push(s.name+'('+s.pins+')');continue}const ty=new Set(L.map(x=>x.type));if(ty.size==1){one++;if(s.pins==1)one1++;else oneList.push(s.name+'('+L.length+':'+[...ty]+')')}}
console.log('single-type',one,'of which pin1',one1,oneList.join(' '));console.log('zero',zero.join(' '));
const short=T.stations.filter(s=>(st[s.id]||[]).length<s.pins).map(s=>s.name+' '+(st[s.id]||[]).length+'/'+s.pins);console.log('short',short.length,short.join(' '));
const w={};for(const s of T.stations)w[s.ward]=(w[s.ward]||0)+1;console.log('wards',JSON.stringify(w));
const sh=T.stations.find(s=>s.name=='渋谷');console.log('shibuya',sh.id,sh.pins);for(const x of st[sh.id])console.log(' ',x.id,x.town,x.type,x.walk,x.price,x.desc);
console.log('lines',T.lines.length);
// walk dist
const wk=T.sites.map(s=>s.walk);console.log('walk<=200',wk.filter(x=>x<=200).length,'<=500',wk.filter(x=>x>200&&x<=500).length,'>500',wk.filter(x=>x>500).length,'walk30',wk.filter(x=>x==30).length);
