// 判定役の目隠しの抜き取り：符号表は読まない。原文から口コミを取り出し、種で100件を選ぶ
const fs=require('fs'),path=require('path');
const RAW='/home/user/progate_school/boki2/research/raw/web/simgames';
const BASE={cinc:'r5-cinc-applion',ramenkan:'r5-fv-applion-ramenkan',zenkoku:'r5-fv-applion-ramenkan-zenkoku',gurume:'r5-fv-applion-gurume',gds:'r5-fv-applion-gamedevstory',pizza:'r5-fv-applion-goodpizza'};
const PAGES={cinc:7,ramenkan:1,zenkoku:10,gurume:2,gds:10,pizza:10};
const strip=(s)=>s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,' ').replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean);
const pf=(w,p)=>path.join(RAW,w==='cinc'?(p===1?'r4-cinc-applion-reviews.html':`r5-cinc-applion-p${p}.html`):`${BASE[w]}${p===1?'':'-p'+p}.html`);
const all=[];const dist={};
for(const w in PAGES)for(let p=1;p<=PAGES[w];p++){const L=strip(fs.readFileSync(pf(w,p),'utf8'));const s=L.findIndex(l=>l.includes('評価とおすすめ口コミ'));const e=L.findIndex(l=>l.includes('このアプリのレビューやランキングの詳細情報'));let b=L.slice(s+1,e);
 if(p===1){const n=[];for(let k=5;k>=1;k--){const j=b.indexOf(`${k}つ星`);n.push(+(b[j+1]||'0').replace(/,/g,''));}dist[w]={avg:b[0],n};b=b.slice(11);}else if(/つ星/.test(b[1]||''))b=b.slice(11);
 let cur=[],i=0;for(const l of b){const m=l.match(/(★[★☆]{4})/);if(m){i++;all.push({w,p,i,star:(m[1].match(/★/g)||[]).length,t:cur.join(' ')});cur=[];}else cur.push(l);}}
console.error('total',all.length,JSON.stringify(dist));
const cnt={};all.forEach(r=>cnt[r.w]=(cnt[r.w]||0)+1);console.error(JSON.stringify(cnt));
let x=20261022;const rnd=()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648;};
const idx=[...all.keys()];for(let k=idx.length-1;k>0;k--){const j=Math.floor(rnd()*(k+1));[idx[k],idx[j]]=[idx[j],idx[k]];}
const pick=idx.slice(0,100).sort((a,b)=>a-b);
fs.writeFileSync(process.env.OUT||'/dev/null',JSON.stringify(pick.map(k=>all[k]),null,0));
pick.forEach((k,n)=>{const r=all[k];console.log(`## ${n+1} ${r.w} ${r.p}-${r.i} ★${r.star}\n${r.t}\n`);});
