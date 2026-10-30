require(process.argv[2]); const T=globalThis.SIMDATA.tokyo23;
const st=T.stations, si=T.sites; const byId=Object.fromEntries(st.map(s=>[s.id,s]));
console.log('stations',st.length,'sites',si.length,'pins req',st.reduce((a,s)=>a+s.pins,0));
const tiers={}; st.forEach(s=>{tiers[s.pins]=(tiers[s.pins]||0)+1}); console.log('tiers',tiers);
const med=a=>{a=[...a].sort((x,y)=>x-y);const n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2};
const ty={}; si.forEach(x=>{(ty[x.type]=ty[x.type]||[]).push(x.price)}); for(const k in ty) console.log(k,ty[k].length,'median 万/㎡',med(ty[k])/1e4);
const cnt={}; si.forEach(x=>cnt[x.st]=(cnt[x.st]||0)+1);
const short=st.filter(s=>(cnt[s.id]||0)<s.pins); console.log('short stations',short.length,'sum',short.reduce((a,s)=>a+s.pins-(cnt[s.id]||0),0),'zero',short.filter(s=>!cnt[s.id]).length); short.forEach(s=>console.log('  ',s.name,s.pins,cnt[s.id]||0,s.aliases.join('/')));
const wards={}; st.forEach(s=>wards[s.ward]=(wards[s.ward]||0)+1); console.log('setagaya',wards['世田谷区'],'ota',wards['大田区'],'minato',wards['港区'],'meguro',wards['目黒区'],'nwards',Object.keys(wards).length);
for(const n of ['渋谷','下北沢','三軒茶屋','二子玉川','新宿','池袋','東京','北千住','品川']){const s=st.find(s=>s.name===n); if(!s){console.log(n,'NONE');continue} console.log(n,s.pins,s.riders,'aliases',s.aliases, si.filter(x=>x.st===s.id).map(x=>x.town+':'+x.type+':'+x.walk+'m:'+x.price/1e4).join(' | '))}
const p300=si.filter(x=>x.price<3000000).length; console.log('price<300万',p300,(p300/si.length*100).toFixed(1)+'%','price<=300万',si.filter(x=>x.price<=3000000).length);
const big=st.filter(s=>s.pins===8).map(s=>s.name+':'+s.riders); console.log('pin8',big);
