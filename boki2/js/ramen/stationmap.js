/* 出店地図。地理データは変更せず、密集地点だけ画面上でまとめる。 */
(function (g) {
  'use strict';
  const TYPES = { hanka: ['繁華街', '◆'], office: ['オフィス街', '■'], shoten: ['商店街', '●'], jutaku: ['住宅地', '▲'], kojo: ['工場・倉庫の町', '⬟'] };
  const COLORS = ['#df6754','#c28f35','#5684ae','#ae739e','#66a485','#8479bc','#43a6aa','#dc8275','#8e9d55','#568d77'];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const path = (rings, close) => rings.map(r => r.map((p,i) => `${i?'L':'M'}${p[0]},${p[1]}`).join(' ') + (close?'Z':'')).join(' ');
  function mount(el, opts = {}) {
    const d = g.SIMDATA && g.SIMDATA.tokyo23;
    if (!d) throw new Error('SIMDATA.tokyo23 を先に読み込んでください');
    const abort = new AbortController(), signal = abort.signal;
    const on = (node, event, fn, extra = {}) => node.addEventListener(event, fn, {signal, ...extra});
    const stations = new Map(d.stations.map(s => [s.id,s]));
    const mine = new Set(opts.mine || []), rivals = new Map((opts.rivals || []).map(r => [r.siteId,r.type]));
    const vacant = s => !mine.has(s.id) && !rivals.has(s.id) && (!opts.vacant || opts.vacant(s.id));
    let scale = 1, minScale = 1, cx = 17, cy = 17, width = 1, height = 1, dead = false, selected = null, sourceButton = null;
    let groupMembers = null, frame = 0, openingFocus = false;
    const pointers = new Map();
    el.classList.add('stationmap');
    el.innerHTML = `<header class="sm-header"><div><span class="sm-eyebrow">麺や、次の一歩。</span><h1>東京、どの町に店を出そう。</h1></div><span class="sm-edition">TOKYO / 23</span></header>
      <div class="sm-toolbar"><label>駅を探す <select aria-label="駅を探す"><option value="">駅を選ぶ</option>${d.stations.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.ward)}</option>`).join('')}</select></label><button type="button" data-action="home">23区全体</button><span class="sm-status" aria-live="polite"></span></div>
      <div class="sm-body"><section class="sm-map" aria-label="東京23区の出店地図"><div class="sm-viewport" tabindex="0" aria-label="地図。矢印キーで移動、プラスとマイナスで拡大縮小"><svg class="sm-svg" aria-hidden="true"><defs><pattern id="sm-grid-${mount.serial++}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#bfd4ce" stroke-width=".5"/></pattern></defs><g class="sm-geography">${d.wards.map((w,i)=>`<path class="sm-ward" data-ward="${w.code}" d="${path(w.rings,true)}" fill="${['#e7eddd','#e3eadb','#dfe9dc','#ecedde'][i%4]}"/>`).join('')}${d.lines.map((l,i)=>`<path class="sm-line" data-line="${i}" d="${path(l.paths,false)}" stroke="${COLORS[i%COLORS.length]}" class="sm-line"><title>${esc(l.op+' '+l.name)}</title></path>`).join('')}</g><g class="sm-ward-labels"></g><g class="sm-stations"></g><g class="sm-dots"></g></svg><div class="sm-pins"></div><div class="sm-clusters"></div></div>
      <div class="sm-compass" aria-hidden="true">N<br>↑</div><div class="sm-zoom"><button type="button" data-action="plus" aria-label="拡大">＋</button><button type="button" data-action="minus" aria-label="縮小">−</button></div>
      <div class="sm-group" hidden><div class="sm-group-heading"><strong></strong><button type="button" data-action="group-close" aria-label="候補地一覧を閉じる">×</button></div><p>近くにある候補地。町名から選べます。</p><div class="sm-group-list"></div></div>
      <details class="sm-source"><summary>地図の出典 · CC BY 4.0</summary><p>${esc(d.src)}</p><p>国土数値情報を加工。地図の配色・表示を変更。CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）。</p></details></section>
      <aside class="sm-card" aria-label="候補地の情報"><div class="sm-empty"><span class="sm-card-art" aria-hidden="true">⌂</span><span class="sm-eyebrow">一杯の物語は、この町から。</span><h2>気になる駅へ。</h2><p>駅を探して、色と形のピンを選ぼう。</p><p>重なったピンは数字を押すと広がります。</p><p class="sm-note">候補地は地価の調査地点です。実在の空き物件ではありません。</p></div></aside></div>
      <footer class="sm-legend">${Object.entries(TYPES).map(([k,v])=>`<span><b class="sm-symbol sm-${k}">${v[1]}</b>${v[0]}</span>`).join('')}<span>★ 自分の店</span><span>⚑ ライバル</span><span class="sm-note">薄い印：空きなし</span></footer>`;
    const q = s => el.querySelector(s), viewport = q('.sm-viewport'), svg = q('.sm-svg'), pins = q('.sm-pins'), clusters = q('.sm-clusters'), group = q('.sm-group'), list = q('.sm-group-list'), card = q('.sm-card');
    const ns = 'http://www.w3.org/2000/svg';
    function svgNode(tag, attrs, parent) { const n = document.createElementNS(ns,tag); Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); parent.append(n); return n; }
    const wardLabels = d.wards.map(w => {
      const r = w.rings.reduce((a,b)=>a.length>b.length?a:b), x = r.reduce((a,p)=>a+p[0],0)/r.length, y = r.reduce((a,p)=>a+p[1],0)/r.length;
      const n = svgNode('text', {class:'sm-ward-label'},q('.sm-ward-labels')); n.textContent=w.name; return {x,y,n};
    });
    const stationNodes = d.stations.map(s => {
      const n = svgNode('g',{'data-station':s.id},q('.sm-stations'));
      svgNode('circle',{r:Math.max(2.2,Math.min(9,2+Math.sqrt(s.riders)/230)),class:'sm-station'},n);
      const t = svgNode('text',{x:11,y:-8,class:'sm-station-label'},n);t.textContent=s.name;return {s,n,t};
    });
    const siteNodes = d.sites.map(s => {
      const btn = document.createElement('button');btn.type='button';btn.className=`sm-site sm-${s.type}`;btn.dataset.site=s.id;
      const mark = mine.has(s.id)?'★':rivals.has(s.id)?'⚑':'';
      btn.classList.toggle('sm-occupied',!vacant(s));btn.setAttribute('aria-label',`${s.town}、${TYPES[s.type][0]}、${stations.get(s.st).name}駅${mark?'、'+(mine.has(s.id)?'自分の店':'ライバル '+rivals.get(s.id)):''}${!vacant(s)?'、空きなし':''}`);
      btn.innerHTML=`<span class="sm-symbol" aria-hidden="true">${TYPES[s.type][1]}</span><span class="sm-town">${esc(s.town)}</span>${mark?`<span class="sm-owner" title="${esc(mine.has(s.id)?'自分の店':'ライバル '+rivals.get(s.id))}">${mark}</span>`:''}`;
      pins.append(btn);on(btn,'click',()=>openCard(s,btn));
      const dot=svgNode('text',{class:`sm-dot sm-${s.type}`,'data-pin-dot':s.id},q('.sm-dots'));dot.textContent=mark||TYPES[s.type][1];dot.style.opacity=vacant(s)?'1':'.35';return {s,btn,dot};
    });
    const project = s => ({x:(s.x-cx)*scale+width/2,y:(s.y-cy)*scale+height/2});
    function closeGroup(restore = false) {
      if (!groupMembers) return;
      groupMembers.forEach(p=>{pins.append(p.btn);p.btn.classList.remove('sm-in-list');});groupMembers=null;group.hidden=true;
      if(restore) viewport.focus();
    }
    function showGroup(members) {
      closeGroup();groupMembers=members;group.hidden=false;q('.sm-group-heading strong').textContent=`このあたりの候補地 · ${members.length}件`;
      members.forEach(p=>{p.btn.hidden=false;p.btn.classList.add('sm-in-list');list.append(p.btn);});members[0].btn.focus();
    }
    // 44px の実際のボタン矩形で連結成分を作る。代表点は必ず成分内の点に置く。
    // 成分の外のボタンと重ならず、データ座標にも手を加えない。
    function render() {
      if(dead)return;closeGroup();
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      q('.sm-geography').setAttribute('transform',`translate(${width/2-cx*scale} ${height/2-cy*scale}) scale(${scale})`);
      const near=scale/minScale>=3;el.dataset.level=selected?'3':near?'2':'1';
      wardLabels.forEach(w=>{const p=project(w);w.n.setAttribute('x',p.x);w.n.setAttribute('y',p.y);});
      stationNodes.forEach(({s,n,t})=>{const p=project(s);n.setAttribute('transform',`translate(${p.x} ${p.y})`);t.style.display=near||s.riders>=250000?'':'none';});
      const visible=[];
      siteNodes.forEach(p=>{const xy=project(p.s);Object.assign(p,xy);p.btn.hidden=true;p.btn.style.left=`${xy.x-22}px`;p.btn.style.top=`${xy.y-22}px`;p.dot.setAttribute('x',xy.x);p.dot.setAttribute('y',xy.y);p.dot.style.fontSize=near?'12px':'5px';if(xy.x>=24&&xy.x<=width-24&&xy.y>=24&&xy.y<=height-24)visible.push(p);});
      const parents=visible.map((_,i)=>i), root=i=>parents[i]===i?i:(parents[i]=root(parents[i]));
      const cells=new Map();visible.forEach((p,i)=>{const x=Math.floor(p.x/44),y=Math.floor(p.y/44);for(let a=x-1;a<=x+1;a++)for(let b=y-1;b<=y+1;b++)for(const j of cells.get(`${a},${b}`)||[])if(Math.abs(p.x-visible[j].x)<44&&Math.abs(p.y-visible[j].y)<44)parents[root(i)]=root(j);const key=`${x},${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);});
      const groups=new Map();visible.forEach((p,i)=>{const k=root(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);});clusters.replaceChildren();
      for(const members of groups.values()) {
        if(members.length===1){members[0].btn.hidden=false;continue;}
        const p=members[0],b=document.createElement('button');b.type='button';b.className='sm-cluster';b.style.left=`${p.x-22}px`;b.style.top=`${p.y-22}px`;b.textContent=members.length;b.setAttribute('aria-label',`${stations.get(p.s.st).name}駅付近、候補地${members.length}件を開く`);b.dataset.members=members.map(m=>m.s.id).join(' ');on(b,'click',()=>showGroup(members));clusters.append(b);
      }
      q('.sm-status').textContent=near?'02 / 町を歩く':'01 / 東京を見渡す';
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
    function zoom(factor,x=width/2,y=height/2) {
      const next=Math.max(minScale,Math.min(1300,scale*factor)), ratio=next/scale;
      cx+=(x-width/2)/scale*(1-1/ratio);cy+=(y-height/2)/scale*(1-1/ratio);scale=next;render();pulse();
    }
    function pulse(){viewport.classList.remove('sm-moving');void viewport.offsetWidth;viewport.classList.add('sm-moving');}
    function focus(id) {const s=stations.get(id);if(!s)return;selected=null;cx=s.x;cy=s.y;scale=Math.max(minScale*4,Math.min(450,width/2.6));q('select').value=id;render();pulse();}
    function tier(n){return n>=1000000?'100万人以上':n>=500000?'50万〜100万人':n>=250000?'25万〜50万人':n>=120000?'12万〜25万人':n>=60000?'6万〜12万人':n>=30000?'3万〜6万人':'3万人未満';}
    function openCard(s,btn) {
      selected=s.id;sourceButton=btn;el.dataset.level='3';const st=stations.get(s.st);
      card.innerHTML=`<div class="sm-card-content"><button type="button" class="sm-card-close" aria-label="候補地カードを閉じる">×</button><span class="sm-eyebrow">03 / この町で、一杯を。</span><div class="sm-property-art sm-${s.type}" aria-hidden="true"><span>⌂</span><i>${TYPES[s.type][1]}</i></div><p class="sm-type sm-${s.type}">${TYPES[s.type][1]} ${TYPES[s.type][0]}</p><h2 tabindex="-1">${esc(s.town)}</h2><p class="sm-address">${esc(s.ward)} / ${esc(st.name)}駅</p><dl><div><dt>駅から歩く距離</dt><dd>${s.walk.toLocaleString()} m</dd></div><div><dt>駅の乗降客数 / 日</dt><dd>${tier(st.riders)}</dd></div><div><dt>地価</dt><dd>${(s.price/10000).toLocaleString()} 万円/㎡</dd></div></dl><p class="sm-description">${esc(s.desc)}</p><div class="sm-estimates"><span>客層 <b>仮</b></span><span>家賃 <b>仮</b></span><span>1日に余計に要る杯数 <b>仮</b></span></div><p class="sm-note">地価の調査地点をもとにした候補地。実在の空き物件ではありません。</p><button type="button" class="sm-pick" ${vacant(s)?'':'disabled'}>${vacant(s)?'ここに出す →':'空きがありません'}</button></div>`;
      on(q('.sm-card-close'),'click',closeCard);on(q('.sm-pick'),'click',()=>{if(vacant(s)&&opts.onPick)opts.onPick(s.id);});
      q('.sm-card h2').focus({preventScroll:true});if(matchMedia('(max-width: 760px)').matches)card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
    function closeCard(){selected=null;el.dataset.level=scale/minScale>=3?'2':'1';card.innerHTML='<div class="sm-empty"><h2>次の候補地を見てみよう。</h2><p>地図のピンを選んでください。</p></div>';if(sourceButton&&!sourceButton.hidden)sourceButton.focus({preventScroll:true});else viewport.focus();}
    on(q('select'),'change',e=>focus(e.target.value));
    el.querySelectorAll('[data-action]').forEach(b=>on(b,'click',()=>{switch(b.dataset.action){case'plus':zoom(1.8);break;case'minus':zoom(1/1.8);break;case'home':selected=null;cx=17;cy=17;scale=minScale;render();pulse();break;case'group-close':closeGroup(true);render();break;}}));
    on(viewport,'wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
    let gesture=null, moved=false;
    on(viewport,'pointerdown',e=>{if(e.target.closest('button'))return;viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=null;moved=false;});
    on(viewport,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length===2){const dist=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);const mx=(ps[0].x+ps[1].x)/2,my=(ps[0].y+ps[1].y)/2,r=viewport.getBoundingClientRect();if(gesture){cx-=(mx-gesture.x)/scale;cy-=(my-gesture.y)/scale;zoom(dist/gesture.dist,mx-r.left,my-r.top);}gesture={dist,x:mx,y:my};}else{cx-=(e.clientX-old.x)/scale;cy-=(e.clientY-old.y)/scale;schedule();}moved=true;});
    const release=e=>{pointers.delete(e.pointerId);gesture=null;};on(viewport,'pointerup',release);on(viewport,'pointercancel',release);on(viewport,'lostpointercapture',release);
    on(viewport,'keydown',e=>{if(e.target!==viewport)return;const delta=80/scale;if(e.key==='+'||e.key==='=')zoom(1.5);else if(e.key==='-')zoom(1/1.5);else if(e.key==='ArrowLeft')cx-=delta;else if(e.key==='ArrowRight')cx+=delta;else if(e.key==='ArrowUp')cy-=delta;else if(e.key==='ArrowDown')cy+=delta;else return;e.preventDefault();render();});
    on(el,'keydown',e=>{if(e.key==='Escape'){if(!group.hidden){closeGroup(true);render();}else if(selected)closeCard();}});
    function resize(){width=viewport.clientWidth;height=viewport.clientHeight;const old=minScale;minScale=Math.min(width/36,height/36);if(scale===1||Math.abs(scale-old)<.01)scale=minScale;else scale=Math.max(scale,minScale);render();}
    const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
    return {focus,destroy(){dead=true;abort.abort();observer.disconnect();cancelAnimationFrame(frame);el.replaceChildren();el.classList.remove('stationmap');delete el.dataset.level;}};
  }
  mount.serial=1;g.RAMENMAP={mount};
})(globalThis);
