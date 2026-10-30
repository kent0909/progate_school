/* 出店地図。地理データは変更せず、密集地点だけ画面上でまとめる。 */
(function (g) {
  'use strict';
  const TYPES = { hanka: ['繁華街', '◆'], shogyo: ['店とオフィスが混ざる商業地', '✚'], office: ['オフィス街', '■'], shoten: ['商店街', '●'], jutaku: ['住宅地', '▲'], kojo: ['工場・倉庫の町', '⬟'], other: ['その他', '◇'] };
  const typeKey = s => Object.hasOwn(TYPES,s.type) ? s.type : 'other';
  const type = s => TYPES[typeKey(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const path = (rings, close) => rings.map(r => r.map((p,i) => `${i?'L':'M'}${p[0]},${p[1]}`).join(' ') + (close?'Z':'')).join(' ');
  function mount(el, opts = {}) {
    const d = g.SIMDATA && g.SIMDATA.tokyo23;
    if (!d) throw new Error('SIMDATA.tokyo23 を先に読み込んでください');
    const abort = new AbortController(), signal = abort.signal;
    const on = (node, event, fn, extra = {}) => node.addEventListener(event, fn, {signal, ...extra});
    const operators = [...new Set(d.lines.map(l=>l.op))].sort();
    const lineColor = op => `hsl(${(operators.indexOf(op)*137.508)%360} 36% 43%)`;
    const stations = new Map(d.stations.map(s => [s.id,s]));
    const mine = new Set(opts.mine || []), rivals = new Map((opts.rivals || []).map(r => [r.siteId,r.type]));
    const vacant = s => !mine.has(s.id) && !rivals.has(s.id) && (!opts.vacant || opts.vacant(s.id));
    let scale = 1, minScale = 1, cx = 17, cy = 17, width = 1, height = 1, dead = false, selected = null, sourceButton = null;
    let groupMembers = null, frame = 0;
    const pointers = new Map(), clusterGroups = new WeakMap();
    el.classList.add('stationmap');
    el.innerHTML = `<header class="sm-header"><div><span class="sm-eyebrow">麺や、次の一歩。</span><h1>東京、どの町に店を出そう。</h1></div><span class="sm-edition">TOKYO / 23</span></header>
      <div class="sm-toolbar"><label>駅を探す <select aria-label="駅を探す"><option value="">駅を選ぶ</option>${d.stations.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${esc(s.ward)}</option>`).join('')}</select></label><button type="button" data-action="home">23区全体</button><span class="sm-status" aria-live="polite"></span></div>
      <div class="sm-body"><section class="sm-map" aria-label="東京23区の出店地図"><div class="sm-viewport" tabindex="0" aria-label="地図。矢印キーで移動、プラスとマイナスで拡大縮小"><svg class="sm-svg" aria-hidden="true"><defs><pattern id="sm-grid-${mount.serial++}" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#bfd4ce" stroke-width=".5"/></pattern></defs><g class="sm-geography">${d.wards.map((w,i)=>`<path class="sm-ward" data-ward="${w.code}" d="${path(w.rings,true)}" fill="${['#e7eddd','#e3eadb','#dfe9dc','#ecedde'][i%4]}"/>`).join('')}${d.lines.map((l,i)=>`<path class="sm-line" data-line="${i}" d="${path(l.paths,false)}" data-op="${esc(l.op)}" stroke="${lineColor(l.op)}"><title>${esc(l.op+' '+l.name)}</title></path>`).join('')}</g><g class="sm-entry-leaders"></g><g class="sm-ward-labels"></g><g class="sm-stations"></g><g class="sm-dots"></g></svg><div class="sm-pins"></div><div class="sm-clusters"></div></div>
      <div class="sm-compass" aria-hidden="true">N<br>↑</div><div class="sm-zoom"><button type="button" data-action="plus" aria-label="拡大">＋</button><button type="button" data-action="minus" aria-label="縮小">−</button></div>
      <div class="sm-group" hidden><div class="sm-group-heading"><strong></strong><button type="button" data-action="group-close" aria-label="候補地一覧を閉じる">×</button></div><p>近くにある候補地。町名から選べます。</p><div class="sm-group-list"></div></div>
      <details class="sm-source"><summary>出典：国土数値情報（国土交通省）· 加工 · CC BY 4.0</summary><p>${esc(d.src)}</p><p>国土数値情報を加工。地図の配色・表示を変更。CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）。</p></details></section>
      <aside class="sm-card" aria-label="候補地の情報"><div class="sm-empty"><span class="sm-card-art" aria-hidden="true">⌂</span><span class="sm-eyebrow">一杯の物語は、この町から。</span><h2>気になる駅へ。</h2><p>駅を探して、色と形のピンを選ぼう。</p><p>重なったピンは数字を押すと広がります。</p><p class="sm-note">候補地は地価の調査地点です。実在の空き物件ではありません。</p></div></aside></div>
      <footer class="sm-legend">${Object.entries(TYPES).filter(([k])=>k!=='other'||d.sites.some(s=>typeKey(s)==='other')).map(([k,v])=>`<span><b class="sm-symbol sm-${k}">${v[1]}</b>${v[0]}</span>`).join('')}<span>★ 自分の店</span><span>⚑ ライバル</span><span class="sm-note">薄い印：空きなし</span><details class="sm-operators"><summary>路線の色：事業者ごと</summary>${operators.map(op=>`<span><i style="background:${lineColor(op)}"></i>${esc(op)}</span>`).join('')}</details></footer>`;
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
      const leader=svgNode('line',{class:'sm-label-leader'},n);const t = svgNode('text',{x:11,y:-8,class:'sm-station-label'},n);t.textContent=s.name;t.style.display='none';return {s,n,t,leader};
    });
    const siteNodes = d.sites.map(s => {
      const btn = document.createElement('button');btn.type='button';btn.hidden=true;btn.className=`sm-site sm-${typeKey(s)}`;btn.dataset.site=s.id;
      const mark = mine.has(s.id)?'★':rivals.has(s.id)?'⚑':'';
      btn.classList.toggle('sm-occupied',!vacant(s));btn.setAttribute('aria-label',`${s.town}、${type(s)[0]}、${stations.get(s.st).name}駅${mark?'、'+(mine.has(s.id)?'自分の店':'ライバル '+rivals.get(s.id)):''}${!vacant(s)?'、空きなし':''}`);
      btn.innerHTML=`<span class="sm-symbol" aria-hidden="true">${type(s)[1]}</span><span class="sm-town">${esc(s.town)}</span>${mark?`<span class="sm-owner" title="${esc(mine.has(s.id)?'自分の店':'ライバル '+rivals.get(s.id))}">${mark}</span>`:''}`;
      pins.append(btn);on(btn,'click',()=>openCard(s,btn));
      const dot=svgNode('text',{class:`sm-dot sm-${typeKey(s)}`,'data-pin-dot':s.id},q('.sm-dots'));dot.textContent=mark||type(s)[1];dot.style.opacity=vacant(s)?'1':'.35';dot.style.display='none';return {s,btn,dot,town:btn.querySelector('.sm-town')};
    });
    // 区名だけを最初に実測。駅名・町名は画面に出るときに測って再利用する。
    // 全体表示で隠す1000か所以上の文字を、初期化時にレイアウトしない。
    wardLabels.forEach(p=>{const b=p.n.getBBox();p.labelBox={width:b.width,height:b.height,baseline:b.y};});
    const glyphMetrics=new Map();
    const wardGroups=d.wards.map(w=>{const members=siteNodes.filter(p=>p.s.ward===w.name);return {w,members,x:members.reduce((n,p)=>n+p.s.x,0)/members.length,y:members.reduce((n,p)=>n+p.s.y,0)/members.length};}).filter(w=>w.members.length);
    on(clusters,'click',e=>{const b=e.target.closest('.sm-cluster');if(b){if(b.dataset.wardEntry)focusWard(b.dataset.wardEntry);else showGroup(clusterGroups.get(b));}});
    const project = s => ({x:(s.x-cx)*scale+width/2,y:(s.y-cy)*scale+height/2});
    function closeGroup(restore = false) {
      if (!groupMembers) return;
      groupMembers.forEach(p=>{pins.append(p.btn);p.btn.classList.remove('sm-in-list');});groupMembers=null;group.hidden=true;
      if(restore) viewport.focus();
    }
    function showGroup(members) {
      closeGroup();groupMembers=members;group.hidden=false;q('.sm-group-heading strong').textContent=`このあたりの候補地 · ${members.length}件`;
      members.forEach(p=>{p.btn.hidden=false;p.town.style.display='';p.btn.classList.add('sm-in-list');list.append(p.btn);});members[0].btn.focus();
    }
    // 新基準11：ピンの座標は動かさず、実測した文字矩形を優先順で置く。
    // 駅名は乗降客数順→区名→町名。置けない文字だけを隠す（DOMやピンは残す）。
    function layoutLabels(near, clusterMarks) {
      // 書き込みと実測を分け、レイアウトの強制再計算をまとめる。
      const eligible=stationNodes.filter(p=>{const xy=project(p.s);return (near||p.s.riders>=250000)&&xy.x>=0&&xy.x<=width&&xy.y>=0&&xy.y<=height;});
      const unmeasured=near?siteNodes.filter(p=>!p.btn.hidden&&!p.labelBox):[];
      for(const p of unmeasured)p.town.style.display='';
      for(const p of eligible)if(!p.labelBox){const b=p.t.getBBox();p.labelBox={width:b.width,height:b.height,baseline:b.y-Number(p.t.getAttribute('y'))};}
      for(const p of unmeasured){const b=p.town.getBoundingClientRect(),r=p.btn.getBoundingClientRect(),mark=p.btn.querySelector('.sm-symbol').getBoundingClientRect();p.labelBox={width:b.width,height:b.height};p.symbolBox={x:mark.left-r.left-22,y:mark.top-r.top-22,width:mark.width,height:mark.height};}
      const eligibleIds=new Set(eligible.map(p=>p.s.id));
      const cells=new Map(), step=64;
      const overlaps=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
      function keys(b){const out=[];for(let x=Math.floor(b.x/step);x<=Math.floor((b.x+b.width)/step);x++)for(let y=Math.floor(b.y/step);y<=Math.floor((b.y+b.height)/step);y++)out.push(x+','+y);return out;}
      function insert(b){if(b.x+b.width<0||b.y+b.height<0||b.x>width||b.y>height)return;for(const k of keys(b)){if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b);}}
      function place(b){const padded={x:b.x-2,y:b.y-2,width:b.width+4,height:b.height+4};if(padded.x<0||padded.y<0||padded.x+padded.width>width||padded.y+padded.height>height)return false;for(const k of keys(padded))for(const other of cells.get(k)||[])if(overlaps(padded,other))return false;insert(padded);return true;}
      // 小さな座標上の印も障害物に含める。字形の寸法は形と大きさごとに実測・再利用。
      for(const p of siteNodes){
        if(!near)break;
        if(p.x<-24||p.y<-24||p.x>width+24||p.y>height+24)continue;
        const size=p.s.id===selected?20:near?12:5,key=p.dot.textContent+':'+size;
        if(!glyphMetrics.has(key)){const b=p.dot.getBBox();glyphMetrics.set(key,{x:b.x-p.x,y:b.y-p.y,width:b.width,height:b.height});}
        const b=glyphMetrics.get(key);insert({x:p.x+b.x-2,y:p.y+b.y-2,width:b.width+4,height:b.height+4});
        if(!p.btn.hidden){const m=p.symbolBox;insert({x:p.x+m.x-1,y:p.y+m.y-1,width:m.width+2,height:m.height+2});if(p.btn.querySelector('.sm-owner'))insert({x:p.x+4,y:p.y-24,width:22,height:24});}
      }
      for(const b of clusterMarks)insert(b);
      // 駅の丸・操作ボタン・出典欄にも文字をかぶせない。
      for(const p of stationNodes){const xy=project(p.s),radius=+p.n.firstChild.getAttribute('r')+2;insert({x:xy.x-radius,y:xy.y-radius,width:radius*2,height:radius*2});}
      const origin=viewport.getBoundingClientRect();
      for(const selector of ['.sm-zoom','.sm-source','.sm-compass']){const r=q(selector).getBoundingClientRect();insert({x:r.left-origin.left,y:r.top-origin.top,width:r.width,height:r.height});}
      for(const p of [...stationNodes].sort((a,b)=>b.s.riders-a.s.riders)){
        p.t.style.display='none';p.leader.style.display='none';if(!eligibleIds.has(p.s.id))continue;
        const xy=project(p.s),b=p.labelBox;
        const positions=[[14,-8],[14,22],[-14-b.width,-8],[-14-b.width,22],[28,-8],[28,22],[-28-b.width,-8],[-28-b.width,22]];
        for(const distance of [42,56,70])for(const y of [-8,22,-24,38])positions.push([distance,y],[-distance-b.width,y]);
        for(const [dx,dy] of positions){
          if(place({x:xy.x+dx,y:xy.y+dy+b.baseline,width:b.width,height:b.height})){p.t.setAttribute('x',dx);p.t.setAttribute('y',dy);p.t.style.display='';if(dx>28||dx+b.width< -28){p.leader.setAttribute('x1',dx>0?10:-10);p.leader.setAttribute('y1',0);p.leader.setAttribute('x2',dx>0?dx-3:dx+b.width+3);p.leader.setAttribute('y2',dy+b.baseline+b.height/2);p.leader.style.display='';}break;}
        }
      }
      for(const p of wardLabels){const xy=project(p),b=p.labelBox;p.n.style.display=place({x:xy.x-b.width/2,y:xy.y+b.baseline,width:b.width,height:b.height})?'':'none';}
      for(const p of siteNodes){const b=p.labelBox;p.town.style.display=near&&b&&!p.btn.hidden&&place({x:p.x-b.width/2,y:p.y+18,width:b.width,height:b.height})?'':'none';}
    }
    function focusWard(code){
      const ward=wardGroups.find(w=>w.w.code===code);if(!ward)return;
      if(selected)closeCard(false);selected=null;cx=ward.x;cy=ward.y;
      const xs=ward.members.map(p=>p.s.x),ys=ward.members.map(p=>p.s.y);
      scale=Math.max(minScale*3.2,Math.min(450,width/(Math.max(...xs)-Math.min(...xs)+2),height/(Math.max(...ys)-Math.min(...ys)+2)));
      q('select').value='';el.dataset.focusWard=code;render();pulse();
    }
    // 全体図の入口は区ごと。最寄りの空いている格子に置き、重心へ線を引く。
    function renderWardEntries(){
      const positions=[],marks=[],origin=viewport.getBoundingClientRect();
      const blocked=['.sm-source','.sm-zoom'].map(selector=>{const r=q(selector).getBoundingClientRect();return {x:r.left-origin.left,y:r.top-origin.top,width:r.width,height:r.height};});
      const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
      for(let y=36;y<height-38;y+=52)for(let x=50;x<width-38;x+=80){const rect={x:x-38,y:y-22,width:76,height:44};if(!blocked.some(b=>overlap(rect,b)))positions.push({x,y,rect});}
      for(const ward of [...wardGroups].sort((a,b)=>b.members.length-a.members.length)){
        const anchor=project(ward);positions.sort((a,b)=>(a.x-anchor.x)**2+(a.y-anchor.y)**2-((b.x-anchor.x)**2+(b.y-anchor.y)**2));
        const spot=positions.shift();if(!spot)throw new Error(`区の入口を置くには地図の幅を広げてください（${width}×${height}）`);
        const b=document.createElement('button');b.type='button';b.className='sm-cluster sm-ward-entry';b.dataset.wardEntry=ward.w.code;b.dataset.members=ward.members.map(p=>p.s.id).join(' ');
        b.style.left=spot.rect.x+'px';b.style.top=spot.rect.y+'px';b.setAttribute('aria-label',`${ward.w.name}、候補地${ward.members.length}件。区の地図を開く`);
        const owners=(ward.members.some(p=>mine.has(p.s.id))?'★':'')+(ward.members.some(p=>rivals.has(p.s.id))?'⚑':'');b.innerHTML=`<span class="sm-ward-entry-name">${esc(ward.w.name)}</span><strong>${ward.members.length}</strong>${owners?`<em class="sm-entry-owner" aria-label="この区の店舗の印">${owners}</em>`:''}`;clusters.append(b);marks.push(spot.rect);
        svgNode('line',{x1:anchor.x,y1:anchor.y,x2:spot.x,y2:spot.y,class:'sm-label-leader'},q('.sm-entry-leaders'));
      }
      return marks;
    }
    // 44px の実際のボタン矩形で連結成分を作る。代表点は必ず成分内の点に置く。
    // 成分の外のボタンと重ならず、データ座標にも手を加えない。
    function render() {
      if(dead||!el.isConnected||width<=1||height<=1)return;closeGroup();
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      q('.sm-geography').setAttribute('transform',`translate(${width/2-cx*scale} ${height/2-cy*scale}) scale(${scale})`);
      const near=scale/minScale>=3;el.dataset.level=selected?'3':near?'2':'1';
      wardLabels.forEach(w=>{const p=project(w);w.n.setAttribute('x',p.x);w.n.setAttribute('y',p.y);});
      stationNodes.forEach(({s,n,t})=>{const p=project(s);n.setAttribute('transform',`translate(${p.x} ${p.y})`);t.style.display=(near||s.riders>=250000)&&p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height?'':'none';});
      const visible=[];
      siteNodes.forEach(p=>{const xy=project(p.s);Object.assign(p,xy);p.btn.hidden=true;p.btn.style.left=`${xy.x-22}px`;p.btn.style.top=`${xy.y-22}px`;p.dot.setAttribute('x',xy.x);p.dot.setAttribute('y',xy.y);p.dot.style.display=near?'':'none';p.dot.style.fontSize=p.s.id===selected?'20px':near?'12px':'5px';p.dot.classList.toggle('sm-selected-dot',p.s.id===selected);if(xy.x>=24&&xy.x<=width-24&&xy.y>=24&&xy.y<=height-24)visible.push(p);});
      let clusterMarks=[];q('.sm-entry-leaders').replaceChildren();clusters.replaceChildren();
      if(!near){clusterMarks=renderWardEntries();}else{
      const parents=visible.map((_,i)=>i), root=i=>parents[i]===i?i:(parents[i]=root(parents[i]));
      const cells=new Map();visible.forEach((p,i)=>{const x=Math.floor(p.x/44),y=Math.floor(p.y/44);for(let a=x-1;a<=x+1;a++)for(let b=y-1;b<=y+1;b++)for(const j of cells.get(`${a},${b}`)||[])if(Math.abs(p.x-visible[j].x)<44&&Math.abs(p.y-visible[j].y)<44)parents[root(i)]=root(j);const key=`${x},${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(i);});
      const groups=new Map();visible.forEach((p,i)=>{const k=root(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);});clusters.replaceChildren();

      for(const members of groups.values()) {
        if(members.length===1){members[0].btn.hidden=false;continue;}
        const p=members[0],b=document.createElement('button');b.type='button';b.className='sm-cluster';b.style.left=`${p.x-22}px`;b.style.top=`${p.y-22}px`;b.textContent=members.length;b.setAttribute('aria-label',`${stations.get(p.s.st).name}駅付近、候補地${members.length}件を開く`);b.dataset.members=members.map(m=>m.s.id).join(' ');clusterGroups.set(b,members);clusters.append(b);clusterMarks.push({x:p.x-24,y:p.y-24,width:48,height:48});
      }
      }
      layoutLabels(near,clusterMarks);
      q('.sm-status').textContent=selected?'03 / 候補地を見る':near?'02 / 町を歩く':'01 / 東京を見渡す';
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
    function zoom(factor,x=width/2,y=height/2) {
      const next=Math.max(minScale,Math.min(1300,scale*factor)), ratio=next/scale;
      cx+=(x-width/2)/scale*(1-1/ratio);cy+=(y-height/2)/scale*(1-1/ratio);scale=next;render();pulse();
    }
    function pulse(){viewport.classList.remove('sm-moving');void viewport.offsetWidth;viewport.classList.add('sm-moving');}
    function focus(id) {delete el.dataset.focusWard;const s=stations.get(id);if(!s)return;if(selected)closeCard(false);selected=null;cx=s.x;cy=s.y;scale=Math.max(minScale*4,Math.min(450,width/2.6));q('select').value=id;render();pulse();}
    function tier(n){return n>=1000000?'100万人以上':n>=500000?'50万〜100万人':n>=250000?'25万〜50万人':n>=120000?'12万〜25万人':n>=60000?'6万〜12万人':n>=30000?'3万〜6万人':'3万人未満';}
    function openCard(s,btn) {
      selected=s.id;sourceButton=btn;render();el.dataset.level='3';el.querySelectorAll('.sm-picked').forEach(b=>b.classList.remove('sm-picked'));btn.classList.add('sm-picked');const st=stations.get(s.st);
      card.innerHTML=`<div class="sm-card-content"><button type="button" class="sm-card-close" aria-label="候補地カードを閉じる">×</button><span class="sm-eyebrow">03 / この町で、一杯を。</span><div class="sm-property-art sm-${typeKey(s)}" aria-hidden="true"><span>⌂</span><i>${type(s)[1]}</i></div><p class="sm-type sm-${typeKey(s)}">${type(s)[1]} ${type(s)[0]}</p><h2 tabindex="-1">${esc(s.town)}</h2><p class="sm-address">${esc(s.ward)} / ${esc(st.name)}駅</p><dl><div><dt>駅から歩く距離</dt><dd>${s.walk.toLocaleString()} m</dd></div><div><dt>駅の乗降客数 / 日</dt><dd>${tier(st.riders)}</dd></div><div><dt>地価</dt><dd>${(s.price/10000).toLocaleString()} 万円/㎡</dd></div></dl><p class="sm-description">${esc(s.desc)}</p><div class="sm-estimates"><span>客層 <b>仮</b></span><span>家賃 <b>仮</b></span><span>1日に余計に要る杯数 <b>仮</b></span></div><p class="sm-note">地価の調査地点をもとにした候補地。実在の空き物件ではありません。</p><button type="button" class="sm-pick" ${vacant(s)?'':'disabled'}>${vacant(s)?'ここに出す →':'空きがありません'}</button></div>`;
      on(q('.sm-card-close'),'click',closeCard);on(q('.sm-pick'),'click',()=>{if(vacant(s)&&opts.onPick)opts.onPick(s.id);});
      q('.sm-card h2').focus({preventScroll:true});if(matchMedia('(max-width: 760px)').matches)card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    }
    function closeCard(refocus=true){
      selected=null;el.dataset.level=scale/minScale>=3?'2':'1';
      const reset=()=>{if(!selected)card.innerHTML='<div class="sm-empty"><h2>次の候補地を見てみよう。</h2><p>地図のピンを選んでください。</p></div>';};
      const content=q('.sm-card-content');
      if(refocus&&content&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const animation=content.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(12px)'}],{duration:180});animation.onfinish=reset;}else reset();
      if(refocus){if(sourceButton&&!sourceButton.hidden)sourceButton.focus({preventScroll:true});else viewport.focus();}
    }
    on(q('.sm-source'),'toggle',()=>render());
    on(q('select'),'change',e=>focus(e.target.value));
    el.querySelectorAll('[data-action]').forEach(b=>on(b,'click',()=>{switch(b.dataset.action){case'plus':zoom(1.8);break;case'minus':zoom(1/1.8);break;case'home':delete el.dataset.focusWard;if(selected)closeCard(false);selected=null;cx=17;cy=17;scale=minScale;render();pulse();break;case'group-close':closeGroup(true);render();break;}}));
    on(viewport,'wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
    let gesture=null;
    on(viewport,'pointerdown',e=>{if(e.target.closest('button'))return;viewport.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=null;});
    on(viewport,'pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...pointers.values()];if(ps.length===2){const dist=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);const mx=(ps[0].x+ps[1].x)/2,my=(ps[0].y+ps[1].y)/2,r=viewport.getBoundingClientRect();if(gesture){cx-=(mx-gesture.x)/scale;cy-=(my-gesture.y)/scale;zoom(dist/gesture.dist,mx-r.left,my-r.top);}gesture={dist,x:mx,y:my};}else{cx-=(e.clientX-old.x)/scale;cy-=(e.clientY-old.y)/scale;schedule();}});
    const release=e=>{pointers.delete(e.pointerId);gesture=null;};on(viewport,'pointerup',release);on(viewport,'pointercancel',release);on(viewport,'lostpointercapture',release);
    on(viewport,'keydown',e=>{if(e.target!==viewport)return;const delta=80/scale;if(e.key==='+'||e.key==='=')zoom(1.5);else if(e.key==='-')zoom(1/1.5);else if(e.key==='ArrowLeft')cx-=delta;else if(e.key==='ArrowRight')cx+=delta;else if(e.key==='ArrowUp')cy-=delta;else if(e.key==='ArrowDown')cy+=delta;else return;e.preventDefault();render();});
    on(el,'keydown',e=>{if(e.key==='Escape'){if(!group.hidden){closeGroup(true);render();}else if(selected)closeCard();}});
    function resize(){const nextWidth=viewport.clientWidth,nextHeight=viewport.clientHeight;if(dead||!el.isConnected||nextWidth<=0||nextHeight<=0)return;if(width===nextWidth&&height===nextHeight)return;width=nextWidth;height=nextHeight;const old=minScale;minScale=Math.min(width/36,height/36);if(scale===1||Math.abs(scale-old)<.01)scale=minScale;else scale=Math.max(scale,minScale);render();}
    const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
    return {focus,destroy(){dead=true;abort.abort();observer.disconnect();cancelAnimationFrame(frame);el.replaceChildren();el.classList.remove('stationmap');delete el.dataset.level;delete el.dataset.focusWard;}};
  }
  mount.serial=1;g.RAMENMAP={mount};
})(globalThis);
