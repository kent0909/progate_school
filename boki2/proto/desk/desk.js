'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const choose = (key, values) => values.includes(params.get(key)) ? params.get(key) : values[0];
  const config = {band:choose('band',['diff','scale','none']),shelf:choose('shelf',['on','off']),input:choose('input',['swipe','drag'])};
  document.body.dataset.input=config.input;
  const names = {asset:'もっているもの',liability:'返すお金',equity:'返さないお金',revenue:'収益',expense:'費用'};
  const accounts = {現金:'asset',備品:'asset',減価償却累計額:'asset',売掛金:'asset',借入金:'liability',買掛金:'liability',資本金:'equity',売上:'revenue',固定資産売却益:'revenue',仕入:'expense',消耗品費:'expense',固定資産売却損:'expense'};
  const txs = [
    {type:'借用書',speech:'親方「この1万円、おつり用に貸すから。月末に返してくれ」',amounts:[10000],cards:['現金','借入金','売上','資本金'],answer:[['left','現金',10000],['right','借入金',10000]],reply:'親方「確かに。月末に返してな」',note:'小銭が増えた'},
    {type:'領収書',speech:'道具屋「寸胴鍋、5,000円ね。現金で」',amounts:[5000],cards:['備品','現金','消耗品費','買掛金'],answer:[['left','備品',5000],['right','現金',5000]],reply:'道具屋「確かに。鍋、使ってくれよ」',note:'小銭が減って、鍋が増えた'},
    {type:'納品書',speech:'問屋「食材 30,000円分。今日 10,000 もらって、残りは月末払いで」',amounts:[30000,10000,20000],cards:['仕入','現金','買掛金','売掛金'],answer:[['left','仕入',30000],['right','現金',10000],['right','買掛金',20000]],reply:'問屋「確かに。残りは月末にな」',note:'小銭が減って、月末に払うお金が増えた'},
    {type:'引取書・台帳の写し',speech:'業者「この券売機、60,000円で引き取るよ」',amounts:[60000,120000,50000],amountLabels:['引取額','取得原価','減価償却累計額'],cards:['減価償却累計額','現金','備品','固定資産売却損','固定資産売却益'],answer:[['left','減価償却累計額',50000],['left','現金',60000],['left','固定資産売却損',10000],['right','備品',120000]],reply:'業者「確かに。券売機を引き取ったよ」',note:'券売機がなくなり、小銭を受け取った'}
  ];
  // 取引4の5枚と棚の増減の口：仕様2・3章、PR #13 承認6619763389。
  // 資産は控除前、評価勘定は直下に△で示す：取りまとめ役の指示6620110518。
  let index=0, rows=[], selected=null, selectedSide=null, picked=null, calcValue=null, expression='', solved=false;
  const session=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const ledger=[], balances={asset:220000,liability:50000,equity:120000,revenue:0,expense:0,contra:50000};
  names.contra='もっているもののマイナス';
  accounts.減価償却累計額='contra';
  const key='boki2.proto.desk.v1';
  let records=[];
  try { const saved=JSON.parse(localStorage.getItem(key)||'[]'); if(Array.isArray(saved)) records=saved; }
  catch { $('storage-status').textContent='端末に保存できません。記録を書き出して保管してください。'; }
  let record, started;
  const yen = n => n.toLocaleString('ja-JP')+'円';
  const button = (label, attrs={}) => {const b=document.createElement('button');b.textContent=label;for(const [k,v] of Object.entries(attrs)) b.setAttribute(k,v);return b;};
  function persist(){
    const n=records.findIndex(r=>r.id===record.id); if(n<0)records.push(record);else records[n]=record;
    try{localStorage.setItem(key,JSON.stringify(records));}catch{$('storage-status').textContent='端末に保存できません。記録を書き出して保管してください。';}
  }
  function start(){
    rows=[];selected=null;selectedSide=null;picked=null;calcValue=null;solved=false;expression='';started=performance.now();
    record={id:session+'-'+(index+1),session,config:{...config},transaction:index+1,firstConfirmMs:null,confirmCount:0,firstCorrect:null,wrongRows:[],fixes:0,inputs:{tap:0,swipe:0,drag:0,key:0},cancelled:{swipe:0,drag:0},wrongColumnDrops:0,calculatorOpened:false,attempts:[],completed:false};
    $('feedback').textContent='';$('feedback').removeAttribute('data-result');$('answer').hidden=true;$('answer').textContent='';
    $('progress').textContent=`書類 ${index+1} / 4`;$('doc-type').textContent=txs[index].type;$('speech').textContent=txs[index].speech;
    $('amounts').replaceChildren();
    txs[index].amounts.forEach((n,i)=>{const b=button((txs[index].amountLabels?.[i]||'')+' '+yen(n),{'data-amount':n,'aria-pressed':'false'});b.onclick=()=>pick(n);$('amounts').append(b);});
    if(index===3){const b=button('計算パッド',{'id':'calc-open'});b.onclick=()=>{record.calculatorOpened=true;persist();$('calculator').showModal();};$('amounts').append(b);}
    $('shop').hidden=config.shelf==='on';$('shop-note').textContent='';$('next').hidden=true;$('confirm').hidden=false;
    renderShelf();render();persist();
  }
  function pick(n){picked=n;$('picked').textContent='拾った額：'+yen(n);document.querySelectorAll('[data-amount]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.amount)===n)));if(selected?.kind==='row'){const r=rows.find(r=>r.account===selected.account);if(r&&r.amount!==n){r.amount=n;record.fixes++;persist();render();}}}
  function card(account, all=false){
    const b=button(account,{'data-account':account,'aria-label':account+'、科目の棚'});
    b.disabled=solved||rows.some(r=>r.account===account);if(selected?.account===account)b.classList.add('selected');
    b.onclick=()=>{if(all)$('all').close();select({kind:'card',account});};attachGesture(b,account,'card');return b;
  }
  function select(value){if(solved)return;selected=value;selectedSide=null;renderActions();renderSelection();}
  function renderSelection(){document.querySelectorAll('[data-account]').forEach(el=>el.classList.toggle('selected',selected?.account===el.dataset.account));}
  function renderActions(){
    $('actions').hidden=!selected||solved;
    if(selected){$('selection').textContent=selected.account+'：'+(selected.kind==='row'?'1枚だけ直す。金額は書類から選び直せます。':'左右を選ぶ');$('return').hidden=selected.kind!=='row';}
    document.querySelectorAll('[data-drop]').forEach(b=>b.classList.toggle('active',b.dataset.drop===selectedSide));
  }
  function place(side, method){
    if(!selected||solved)return;
    const account=selected.account;let r=rows.find(r=>r.account===account);
    if(r){if(r.side!==side){r.side=side;record.fixes++;}else{selected=null;renderActions();return;}}
    else {if(picked===null){$('feedback').textContent='まず書類の金額を押して拾ってください。';return;}r={side,account,amount:picked};rows.push(r);}
    record.inputs[method]++;if(method==='drag'){const answer=txs[index].answer.find(a=>a[1]===account);if(answer&&answer[0]!==side)record.wrongColumnDrops++;}
    selected=null;selectedSide=null;persist();render();
    const el=document.querySelector(`.row[data-account="${account}"]`);el?.focus({preventScroll:true});
  }
  function remove(method='tap'){
    if(selected?.kind!=='row')return;rows=rows.filter(r=>r.account!==selected.account);record.fixes++;record.inputs[method]++;selected=null;persist();render();
  }
  function render(){
    for(const side of ['left','right']){
      $(side+'-rows').replaceChildren();rows.filter(r=>r.side===side).forEach((r,i)=>{
        const b=button('',{'class':'row','data-account':r.account,'data-row-side':side,'aria-label':`${side==='left'?'左':'右'}${i+1}行目 ${r.account} ${yen(r.amount)}`});
        const title=document.createElement('strong');title.textContent=r.account;const amount=document.createElement('span');amount.textContent=yen(r.amount);b.append(title,amount);
        if(config.shelf==='on'){const preview=document.createElement('span');preview.className='preview';preview.textContent='→ '+names[accounts[r.account]];b.append(preview);}
        b.disabled=solved;b.onclick=()=>select({kind:'row',account:r.account});attachGesture(b,r.account,'row');$(side+'-rows').append(b);
      });
    }
    $('cards').replaceChildren(...txs[index].cards.map(a=>card(a)));$('all-cards').replaceChildren(...Object.keys(accounts).map(a=>card(a,true)));
    renderBand();renderActions();renderSelection();
  }
  function totals(){return ['left','right'].map(side=>rows.filter(r=>r.side===side).reduce((s,r)=>s+r.amount,0));}
  function renderBand(){
    const [left,right]=totals();$('band').replaceChildren();
    if(config.band==='diff')$('band').textContent='左右の差 '+yen(Math.abs(left-right));
    if(config.band==='scale'){
      const text=document.createElement('span');text.textContent=left===right?'そろった':'そろわない';const bars=document.createElement('span');bars.className='scale-bars';bars.setAttribute('aria-hidden','true');
      const max=Math.max(left,right,1);for(const n of [left,right]){const i=document.createElement('i');i.style.width=(n/max*100)+'%';bars.append(i);}$('band').append(text,bars);
    }
    $('confirm').disabled=solved||(config.band==='diff'&&left!==right);
  }
  function renderShelf(){
    $('shelf').hidden=config.shelf==='off';if(config.shelf==='off')return;
    if(!$('shelf').children.length){for(const category of ['asset','contra','liability','equity','revenue','expense']){const name=names[category];const div=document.createElement('div');div.className='shelf-band';div.dataset.category=category;div.setAttribute('aria-label',name);const title=document.createElement('span');title.textContent=name;const track=document.createElement('div');track.className='shelf-track';const fill=document.createElement('div');fill.className='shelf-fill';track.append(fill);const balance=document.createElement('span');balance.className='balance';const mouths=document.createElement('div');mouths.className='mouths';mouths.dataset.title=name;for(const change of ['increase','decrease']){if(['revenue','expense'].includes(category)&&change==='decrease')continue;const side=(['asset','expense'].includes(category)?change==='increase':change==='decrease')?'left':'right';const mouth=button(change==='increase'?'増えた':'減った',{'data-mouth':category+'-'+change,'data-drop':side,'aria-label':name+'・'+(change==='increase'?'増えた':'減った')});mouths.append(mouth);}div.append(title,track,balance,mouths);$('shelf').append(div);}}
    for(const div of $('shelf').children){const cat=div.dataset.category;div.hidden=index<3&&['revenue','expense','contra'].includes(cat);div.querySelector('.shelf-fill').style.width=Math.max(0,Math.min(100,balances[cat]/250000*100))+'%';div.querySelector('.balance').textContent=(cat==='contra'?'△':'')+yen(balances[cat]);}
  }
  function confirm(){
    if(solved||$('confirm').disabled)return;
    const expected=txs[index].answer;const matches=(r,a)=>r.side===a[0]&&r.account===a[1]&&r.amount===a[2];
    const wrong=[];for(const side of ['left','right']){let n=0;rows.filter(r=>r.side===side).forEach(r=>{n++;if(!expected.some(a=>matches(r,a)))wrong.push({side,row:n,account:r.account,amount:r.amount,kind:'placed'});});expected.filter(a=>a[0]===side).forEach((a,i)=>{if(!rows.some(r=>matches(r,a)))wrong.push({side,row:i+1,kind:'missing'});});}
    const ok=wrong.length===0;record.confirmCount++;if(record.firstConfirmMs===null){record.firstConfirmMs=Math.round(performance.now()-started);record.firstCorrect=ok;}record.wrongRows.push(...wrong.map(r=>({...r,attempt:record.confirmCount})));record.attempts.push({number:record.confirmCount,correct:ok,rows:rows.map(r=>({...r})),wrongRows:wrong,elapsedMs:Math.round(performance.now()-started)});
    $('feedback').dataset.result=ok?'correct':'incorrect';
    if(ok){
      solved=true;record.completed=true;$('feedback').textContent='正しい。'+txs[index].reply;
      for(const r of rows){const cat=accounts[r.account],sign=(['asset','expense'].includes(cat)?r.side==='left':r.side==='right')?1:-1;balances[cat]+=sign*r.amount;}
      ledger.push({transaction:index+1,rows:rows.map(r=>({...r}))});renderShelf();
      if(config.shelf==='off'){$('shop-note').textContent=txs[index].note;$('ledger-dot').hidden=false;}
      $('confirm').hidden=true;$('next').hidden=false;$('next').textContent=index===3?'4枚おしまい・記録を見る':'次の書類へ';render();
    }else{
      const bad=wrong[0];$('feedback').textContent=`誤り。先輩「${bad.side==='left'?'左':'右'}の${bad.row}行目を見直そう」`;
      document.querySelectorAll('.row').forEach(b=>b.classList.toggle('error',wrong.some(r=>r.account===b.dataset.account)));
      if(record.confirmCount>=2){$('answer').hidden=false;$('answer').textContent='正解：'+expected.map(a=>(a[0]==='left'?'左 ':'右 ')+a[1]+' '+yen(a[2])).join(' ／ ');}
    }persist();
  }
  // しきい値は DESIGN-JOURNAL-UX 4.1/4.4 の置き値。
  // Pointer Events でマウス・タッチを同じ経路にし、縦スクロールは pan-y に渡す。
  function attachGesture(b,account,kind){
    let gesture=null,suppress=false;
    b.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();suppress=false;}},true);
    b.addEventListener('pointerdown',e=>{
      if(solved||e.button!==0)return;gesture={x:e.clientX,y:e.clientY,time:performance.now(),moved:false,ghost:null,clientY:e.clientY,frame:null};b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove',e=>{
      if(!gesture)return;gesture.clientY=e.clientY;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      if(Math.hypot(dx,dy)<3)return;gesture.moved=true;
      if(config.input==='swipe'&&kind==='card'&&Math.abs(dy)>Math.abs(dx)*1.5){gesture.vertical=true;return;}
      if(!gesture.ghost){const g=document.createElement('div');g.className='ghost';g.textContent=account;document.body.append(g);gesture.ghost=g;}
      gesture.ghost.style.left=(e.clientX+10)+'px';gesture.ghost.style.top=(e.clientY-25)+'px';
      if(config.input==='drag'){if(!gesture.frame){const tick=()=>{if(!gesture)return;const edge=gesture.clientY<48?-10:gesture.clientY>innerHeight-48?10:0;if(edge)scrollBy(0,edge);gesture.frame=requestAnimationFrame(tick);};gesture.frame=requestAnimationFrame(tick);}document.body.classList.add('dragging');const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');document.querySelectorAll('[data-drop]').forEach(t=>t.classList.toggle('active',t===target));if(target)gesture.ghost.textContent=account+' → '+(target.getAttribute('aria-label')||target.textContent);}
      else if(Math.abs(dx)>b.offsetWidth*.35){document.querySelectorAll('[data-drop]').forEach(t=>t.classList.toggle('active',t.dataset.drop===(dx<0?'left':'right')));gesture.ghost.textContent=account+' → '+(dx<0?'左の列':'右の列');}
    });
    const cleanup=()=>{if(gesture?.frame)cancelAnimationFrame(gesture.frame);gesture?.ghost?.remove();document.body.classList.remove('dragging');document.querySelectorAll('.active,.drag-target').forEach(t=>t.classList.remove('active','drag-target'));};
    b.addEventListener('pointercancel',()=>{if(gesture?.moved&&!gesture.vertical){record.cancelled[config.input]++;persist();}cleanup();gesture=null;});
    b.addEventListener('pointerup',e=>{
      if(!gesture)return;const g=gesture,dx=e.clientX-g.x,dy=e.clientY-g.y;const dropTarget=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');cleanup();gesture=null;if(!g.moved)return;suppress=true;
      if(g.vertical)return;selected={account,kind};
      if(config.input==='drag'){
        const target=dropTarget;
        if(target)place(target.dataset.drop,'drag');else if(kind==='row'&&document.elementFromPoint(e.clientX,e.clientY)?.closest('#hand'))remove('drag');else if(Math.abs(dx)>=b.offsetWidth*.35&&Math.abs(dx)>Math.abs(dy)*1.5)place(dx<0?'left':'right','swipe');else{record.cancelled.drag++;persist();selected=null;renderActions();}
      }else if(kind==='row'&&dy>44&&Math.abs(dy)>Math.abs(dx)*1.5)remove('swipe');
      else if(Math.abs(dx)>=b.offsetWidth*.35||(Math.abs(dx)>=12&&Math.abs(dx)/(performance.now()-g.time)>=.3))place(dx<0?'left':'right','swipe');
      else {record.cancelled.swipe++;selected=null;persist();renderActions();}
    });
    b.addEventListener('keydown',e=>{
      if(solved)return;
      if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();if(!selected)selected={account,kind};selectedSide=e.key==='ArrowLeft'?'left':'right';renderActions();}
      else if(e.key==='Enter'&&selected&&selectedSide){e.preventDefault();place(selectedSide,'key');}
      else if(e.key==='Backspace'&&kind==='row'){e.preventDefault();selected={account,kind};remove('key');}
      else if(e.key==='Escape'){e.preventDefault();selected=null;selectedSide=null;renderActions();}
    });
  }
  document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>place(b.dataset.place,'tap'));
  document.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>place(b.dataset.drop,'tap'));
  $('return').onclick=()=>remove();$('cancel').onclick=()=>{selected=null;renderActions();};$('confirm').onclick=confirm;
  $('all-open').onclick=()=>$('all').showModal();
  $('next').onclick=()=>{if(index<3){index++;start();}else exportRecords();};
  $('settings-open').hidden=params.get('lock')==='1';$('settings-open').onclick=()=>$('settings').showModal();
  for(const k of Object.keys(config))$(k+'-setting').value=config[k];
  $('settings-apply').onclick=()=>{const q=new URLSearchParams(location.search);for(const k of Object.keys(config))q.set(k,$(k+'-setting').value);location.search=q.toString();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $('ledger-open').onclick=()=>{$('ledger-entries').replaceChildren();ledger.forEach(entry=>{const p=document.createElement('p');p.textContent=`書類${entry.transaction}：`+entry.rows.map(r=>(r.side==='left'?'左 ':'右 ')+r.account+' '+yen(r.amount)).join(' ／ ');$('ledger-entries').append(p);});$('ledger-dot').hidden=true;$('ledger').showModal();};
  function exportRecords(){persist();$('export-json').value=JSON.stringify({version:1,records},null,2);$('export').showModal();}
  $('export-open').onclick=exportRecords;$('copy').onclick=async()=>{$('export-json').select();try{await navigator.clipboard.writeText($('export-json').value);$('copy-status').textContent='コピーしました';}catch{$('copy-status').textContent='全選択しました。コピー操作で保存してください。';}};
  for(const key of ['7','8','9','−','4','5','6','+','1','2','3','×','0','C','=','÷']){const b=button(key,{'data-calc':key});b.onclick=()=>{
    if(key==='C'){expression='';calcValue=null;}
    else if(key==='='){
      try{const tokens=expression.match(/\d+|[+−×÷]/g)||[];if(tokens.join('')!==expression||tokens.length%2===0)throw Error();let values=[Number(tokens[0])],ops=[];for(let i=1;i<tokens.length;i+=2){const n=Number(tokens[i+1]);if(tokens[i]==='×')values[values.length-1]*=n;else if(tokens[i]==='÷')values[values.length-1]/=n;else{ops.push(tokens[i]);values.push(n);}}let result=values[0];ops.forEach((op,i)=>result+=op==='+'?values[i+1]:-values[i+1]);if(!Number.isSafeInteger(result)||result<0)throw Error();calcValue=result;expression=String(result);}catch{calcValue=null;expression='';$('calculation').textContent='式を見直してください';return;}
    }else{expression+=key;calcValue=null;}
    $('calculation').textContent=expression||'0';
  };$('pad').append(b);}
  $('use-result').onclick=()=>{if(calcValue===null){$('calculation').textContent='まず ＝ を押してください';return;}pick(calcValue);$('calculator').close();};
  start();
})();
