#!/usr/bin/env node
'use strict';
// 撮影済みDOM測定値から、重複を除いた目録・集計・12枚ずつの一覧を作る。
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {stage}=require('./inventory.js');
const OUT=process.env.SCREEN_OUTPUT||path.resolve(__dirname,'../../docs/screens');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function classify(r){
  const m=new Set(r.markers.split(',')),screens=r.classes.split('|');
  if(/^(タブ・|練習室|検定会場|上部の情報|ゲームの設定|ライバル|空き物件|町の地区|考え方の地図|成長の記録|会社の棚)/.test(r.kind))return r.kind;
  if(r.kind==='書類・docScreen'&&r.type==='discover')return '発見・書類と会話';
  if(r.bankrupt)return '倒産';
  if(m.has('data-restart')||r.type==='ending')return '結末';
  if(screens.includes('debrief'))return 'ふりかえり';
  if(screens.includes('fork'))return '分かれ道の図';
  if(screens.includes('intro'))return '月はじめ・開店';
  if(m.has('data-guess')||r.text.includes('考える前に、まず予想してみよう'))return '予想';
  if(m.has('data-o'))return '名前の札';
  if(r.type==='decision'&&!m.has('data-rep-ok')&&!m.has('data-band-next'))return m.has('data-yes')?'判断・結果':'判断・choice/card';
  if(m.has('data-rc'))return '思い出す';
  if(r.type==='doc'){
    if(m.has('data-o'))return '名前の札';
    if(!m.has('data-ok')&&!r.doc)return '書類・答え合わせ／名前';
    return '書類・docScreen';
  }
  if(r.type==='calc')return '計算の作業台';
  if(r.type==='report')return '決算書';
  if(r.type==='close')return '月末の予想・締め';
  if(r.type==='end')return '結末';
  if(r.type==='none')return '月の区切り';
  return r.kind;
}
const required=[
 ['タイトル','タイトル・セーブ枠'],['ゲームの設定','ゲームの設定'],['セーブの枠','タイトル・セーブ枠'],['屋号・名前','屋号・名前'],['受験年度','受験年度'],
 ['プロローグの会話','プロローグ・会話と操作'],['note','プロローグ・note'],['sort/tap','プロローグ・sort/tap|発見・sort/tap'],['月の書類（docScreen）','書類・docScreen'],
 ['choice','判断・choice/card|選択肢'],['card','判断・choice/card|判断・card'],['理由','発見・理由|発見・sort/tap'],['予想','予想|月末の予想・締め'],['名前の札','名前の札'],
 ['作戦の机（値段・人・看板・問屋）','作戦の机|判断・choice/card'],['一杯の組み立て','一杯の組み立て'],['開店','月はじめ・開店|会話'],['月の途中の出来事','判断・choice/card|判断・card'],
 ['月報','月報'],['締め','締め|締めの帯|月末の予想・締め'],['開始記入','開始記入'],['決算','決算書|決算書・精算表'],['ふりかえり','ふりかえり'],
 ['上部の情報','上部の情報'],['お金','タブ・money'],['町','タブ・town'],['店','タブ・shop'],['帳簿','タブ・book'],['日誌','タブ・log'],['ほか','タブ・co'],
 ['町の地図','タブ・town'],['ライバル','ライバル'],['順位・シェアの表','タブ・town|町の地区'],['練習室','練習室'],['検定会場','検定会場・本試験形式'],['成長の記録','成長の記録'],['倒産','倒産'],['結末','結末']
];
async function main(){
 const inv=JSON.parse(fs.readFileSync(path.join(OUT,'inventory.json'),'utf8'));
 const keys=new Set(),rows=[];
 for(const raw of inv.rows){
   const r={...raw,kind:classify(raw)};r.stage=stage(r.kind);
   // 最初の出現を必ず残す。上部・町・月報は指定4時点をそれぞれ残す。
   const timed=/^(上部の情報|タブ・town|町の地区|ライバル|月報|締めの帯)$/.test(r.kind)&&['1-4','1-9','1-3','2-4'].includes(`${r.year}-${r.month}`);
   const key=[r.width,r.color,r.kind,timed?`${r.year}-${r.month}`:'',/^(タブ・|練習室|検定会場|上部の情報|ゲームの設定|ライバル|空き物件|町の地区|考え方の地図|成長の記録|会社の棚)/.test(r.kind)?'':r.markers].join(':');
   if(keys.has(key))continue;keys.add(key);rows.push(r);
 }
 const tmp=path.join(OUT,'.renumber');fs.mkdirSync(tmp,{recursive:true});
 for(let i=0;i<rows.length;i++){
   const r=rows[i],id='S'+String(i+1).padStart(3,'0'),name=`${id}-${r.width}-${r.color}.jpg`;
   fs.copyFileSync(path.join(OUT,r.file),path.join(tmp,name));r.originalId=r.id;r.id=id;r.file='images/'+name;
 }
 fs.rmSync(path.join(OUT,'images'),{recursive:true});fs.renameSync(tmp,path.join(OUT,'images'));
 inv.rows=rows;fs.writeFileSync(path.join(OUT,'inventory.json'),JSON.stringify(inv,null,2)+'\n');
 process.env.XDG_CACHE_HOME=process.env.XDG_CACHE_HOME||path.resolve(__dirname,'../../../work/.cache');fs.mkdirSync(process.env.XDG_CACHE_HOME,{recursive:true});
 const sharp=require('sharp');const sheets=[];fs.mkdirSync(path.join(OUT,'sheets'),{recursive:true});
 const mobile=rows.filter(r=>r.width===390).sort((a,b)=>a.kind.localeCompare(b.kind,'ja')||a.id.localeCompare(b.id));
 for(let i=0;i<mobile.length;i+=12){
   const group=mobile.slice(i,i+12),tiles=[];
   for(let j=0;j<group.length;j++){
     const r=group[j];
     // 長い画面は先頭844px。全文は原寸JPEGにある。
     const meta=await sharp(path.join(OUT,r.file)).metadata();
     const b=await sharp(path.join(OUT,r.file)).extract({left:0,top:0,width:390,height:Math.min(844,meta.height)}).resize(280,606,{fit:'contain',background:'#eeeeee'}).toBuffer();
     const label=Buffer.from(`<svg width="280" height="24"><rect width="280" height="24" fill="white"/><text x="6" y="17" font-size="14" fill="black">${r.id} / ${r.color} / ${r.year}-${r.month}</text></svg>`);
     tiles.push({input:b,left:(j%4)*294+7,top:Math.floor(j/4)*644+30},{input:label,left:(j%4)*294+7,top:Math.floor(j/4)*644+6});
   }
   const file='sheets/sheet-'+String(sheets.length+1).padStart(2,'0')+'.jpg';
   await sharp({create:{width:1176,height:1932,channels:3,background:'#ddd'}}).composite(tiles).jpeg({quality:55}).toFile(path.join(OUT,file));
   sheets.push({file,ids:group.map(r=>r.id)});
 }
 // 前回生成された余りの一覧画像は消す。
 for(const file of fs.readdirSync(path.join(OUT,'sheets')))if(!sheets.some(s=>path.basename(s.file)===file))fs.unlinkSync(path.join(OUT,'sheets',file));
 const photos=rows.reduce((n,r)=>n+fs.statSync(path.join(OUT,r.file)).size,0),sheetBytes=sheets.reduce((n,s)=>n+fs.statSync(path.join(OUT,s.file)).size,0);
 const byKind=Object.fromEntries([...new Set(rows.map(r=>r.kind))].sort().map(k=>[k,rows.filter(r=>r.kind===k).length]));
 const coverageByProfile=required.map(([label,k])=>({label,profiles:Object.fromEntries([[390,'light'],[1280,'light'],[390,'dark']].map(([w,c])=>[w+'-'+c,rows.filter(r=>r.width===w&&r.color===c&&k.split('|').includes(r.kind)).map(r=>r.id)]))}));
 const missing=coverageByProfile.flatMap(x=>['390-light','1280-light'].filter(p=>!x.profiles[p].length).map(p=>x.label+'（'+p+'）'));
 const summary={screens:rows.length,byKind,photosBytes:photos,sheetsBytes:sheetBytes,totalImageBytes:photos+sheetBytes,coverageByProfile,limitBytes:40000000,darkKinds:new Set(rows.filter(r=>r.width===390&&r.color==='dark').map(r=>r.kind)).size,missing,sheets,journeys:inv.journeys,errors:inv.errors};
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 const ids=ks=>rows.filter(r=>ks.split('|').includes(r.kind)).map(r=>r.id).join('、');
 const coverage=coverageByProfile.map(x=>`|${x.label}|${x.profiles["390-light"].join("、")||"見つからなかった"}|${x.profiles["1280-light"].join("、")||"見つからなかった"}|${x.profiles["390-dark"].join("、")||"見つからなかった"}|`).join("\n");
 const fmt=r=>`|${r.id}|[${path.basename(r.file)}](${r.file})|${r.width}×${r.height}|${r.color}|${r.year}年目${r.month==null?'':r.month+'月'}（${r.label}）|${r.kind}|${r.stage}|${r.chars}|${r.controls}|${r.fontKinds}|${r.minFont}|${r.pages}|`;
 const small=rows.filter(r=>r.minFont<12),overflow=rows.filter(r=>r.scrollWidth>r.width+1),long=rows.filter(r=>r.pages>=5);
 const text=`# 現行ラーメン版の画面目録\n\n## 種類の対応表\n\n|依頼書の種類|スマホlight|PC light|スマホdark|\n|---|---|---|---|\n${coverage}\n\n## 取得・測定条件\n\n- 取得元：\`claude/keen-hawking-sfeg6f\` の \`37135cbc99cd4daa78913b9ee59bf1bdd42ea7ce\`。後続の変更は試作仕様のみで、取りまとめ役が固定を了承（PR #8 コメント6619794392）。\n- seed=0、skilled・strategy=1。既存の auto.js を呼ぶ。localStorageへ開始前にseedだけを置く既存ツールの方式。開始後の__sim書き込み・進行位置の直接設定なし。閲覧メニューは取っ手をクリック／SVG地区は地区名の文字をクリック。\n- スマホ390×844（hasTouch・isMobile）、PC1280×800、deviceScaleFactor=1。スマホのlightとdark、PCのlight。外部リクエストはすべて拒否し、ローカルの既存フォントで描画。\n- JPEG品質55。原寸の全縦画面を撮影。一覧は先頭844pxのサムネイル、種類順・12枚ずつ・幅1176px。原寸と一覧の合計${photos+sheetBytes} bytes（上限40,000,000）。\n- 文字数はbody.innerText.length（UTF-16、改行とルビを含む）。非表示要素はinnerTextの挙動に従う。文字サイズは表示されたTextノードと入力欄の計算値。操作部品は表示され、disabledでないbutton/link/input/select/textarea/summary/role=button/tabを数える。画面外でもスクロールで読める要素を含む。\n- 縦画面数はdocumentElement.scrollHeight÷viewport高さ。オーバーレイは背景も画面に見えるため背景の文字・部品も測定に含む。見た目の判定の代用ではない。\n- 数値の原本は[inventory.json](inventory.json)、種類別集計と到達地点は[summary.json](summary.json)。再生成は\`node boki2/tools/screens/inventory.js\`、続いて\`node boki2/tools/screens/catalog.js\`。\n\n## 全画像（1枚1行）\n\n|番号|ファイル名|幅×高さ|配色|時期|画面の種類|作り直しの段|文字数|押せる部品|文字サイズ種類|最小px|縦画面数|\n|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|\n${rows.map(fmt).join('\n')}\n\n## 一覧画像\n\n${sheets.map(s=>`- [${s.file}](${s.file})：${s.ids.join('、')}`).join('\n')}\n\n## 探した範囲と見つからなかったもの\n\n${inv.journeys.map(j=>`- ${j.profile}：${j.final.label}、月位置${j.final.mi}・出来事${j.final.ei}、結果 ${JSON.stringify(j.result)}。`).join('\n')}\n\n- 見つからなかった種類：${missing.join('、')||'なし'}。不足があれば、到達していない枝を撮ったことにはしない。\n- 上部の実装は「お金・町・店・帳簿・日誌・ほか」の6つ。依頼書の「8つ」と一致しない。6つすべてと、ほかから開く地図・成長・練習室・会社の棚を記録した。\n- 順位は町の「町の客の取り合い（シェア・推定）」表として表示される。独立した順位画面の存在は確認していない。\n\n## 気づいたこと\n\n- 最小12px未満の画面：${small.map(r=>`${r.id}（${r.minFont}px）`).join('、')||'なし'}。読みやすさの精査が必要。\n- 横にはみ出した画面（scrollWidth＞幅+1）：${overflow.map(r=>`${r.id}（${r.scrollWidth}px）`).join('、')||'検出なし'}。文字の重なりまで保証する検査ではない。\n- 5画面分以上の長い画面：${long.map(r=>`${r.id}（${r.pages}画面）`).join('、')||'なし'}。全文は原寸画像で確認できる。\n- 町のSVG地区の中央をクリックすると空き物件がポインターを遮る場合がある。地区名の文字を通常クリックして開いた。ゲームは修正していない。\n\n## やっていないこと\n\n- ゲーム・既存playtestの変更、デザイン改修、外部サイト調査、マージ。\n- 全seed・全選択肢の組合せ、全問題714問の個別撮影、実機タッチ・読み上げ検査。全種類の目録であり、すべての取引文面の写しではない。\n- 外部フォントを取得していないため、外部フォントが読み込める環境との厳密な字幅比較は未実施。\n`;
 fs.writeFileSync(path.join(OUT,'INDEX.md'),text);
 console.log(JSON.stringify({screens:rows.length,byKind,totalImageBytes:photos+sheetBytes,darkKinds:summary.darkKinds,missing},null,2));
 if(photos+sheetBytes>40000000)throw Error('画像の合計が40MBを超えた');
 if(summary.darkKinds<10)throw Error('darkの種類が10未満');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
