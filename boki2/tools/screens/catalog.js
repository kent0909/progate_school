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
  if(m.has('data-again')&&!m.has('data-n'))return '結末・全体のふりかえり';
  if(r.text.includes('締めの前に')&&r.text.includes('見直しの前に予想'))return '月末の予想・締め';
  if(r.text.includes('町の中の位置：客数で'))return 'ふりかえり・順位';
  if(r.phase==='monthIntro')return '月はじめ・開店';
  if(r.phase==='recall')return '思い出す';
  if(r.text.includes('\n新しい札\n'))return '名前の札';
  if(r.kind==='desk')return '決算の作業台';
  if(r.kind==='ss')return '決算・株主資本等変動計算書';
  if(r.kind==='bank')return '銀行の審査';
  if(r.kind!=='発見・理由'&&r.doc&&!r.classes.includes('s-docscreen')&&r.type==='discover')return '発見・書類と会話';
  if(r.bankrupt&&r.classes.includes('s-ending'))return '倒産';
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
 ['月報','月報'],['締め','締め|締めの帯|月末の予想・締め'],['開始記入','開始記入'],['決算','決算書|決算書・精算表'],['ふりかえり','ふりかえり|ふりかえり・順位'],
 ['上部の情報','上部の情報'],['お金','タブ・money'],['町','タブ・town'],['店','タブ・shop'],['帳簿','タブ・book'],['日誌','タブ・log'],['ほか','タブ・co'],
 ['町の地図','タブ・town'],['ライバル','ライバル'],['順位','ふりかえり・順位'],['練習室','練習室'],['検定会場','検定会場・本試験形式'],['成長の記録','成長の記録'],['倒産','倒産'],['結末','結末|結末・全体のふりかえり']
];
async function main(){
 const inv=JSON.parse(fs.readFileSync(path.join(OUT,'inventory.json'),'utf8'));
 const keys=new Set(),rows=[];
 for(const raw of inv.rows){
   const r={...raw,kind:classify(raw)};r.stage=stage(r.kind);
   if(r.type==='ending'&&!r.endingStep)r.endingStep=['原因','数字','届いた書類','そして','現実では','学び'].find(k=>r.text.includes('\n'+k+'\n'))||null;
   if(r.label==='翌年4月')r.year=2;
   if(r.month==null&&r.worldT>0&&r.markers.split(',').includes('data-again')){r.year=Math.floor((r.worldT-1)/12)+1;r.month=((r.worldT-1+3)%12)+1;r.label=`${r.year}年目${r.month}月の終端`;}
   // 最初の出現を必ず残す。上部・町・月報は指定4時点をそれぞれ残す。
   const timed=/^(上部の情報|タブ・town|町の地区|ライバル|月報|締めの帯)$/.test(r.kind)&&['1-4','1-9','1-3','2-4'].includes(`${r.year}-${r.month}`);
   const key=[r.width,r.color,r.kind,timed?`${r.year}-${r.month}`:'',/^(タブ・|練習室|検定会場|上部の情報|ゲームの設定|ライバル|空き物件|町の地区|考え方の地図|成長の記録|会社の棚)/.test(r.kind)?'':r.markers,r.endingStep||'',r.captureNote||''].join(':');
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
 const timeCoverage=[390,1280].flatMap(width=>['上部の情報','月報','タブ・town'].flatMap(kind=>[[1,4],[1,9],[1,3],[2,4]].map(([year,month])=>({width,kind,year,month,ids:rows.filter(r=>r.width===width&&r.color==='light'&&r.kind===kind&&r.year===year&&r.month===month).map(r=>r.id)}))));
 const missingTimes=timeCoverage.filter(x=>!x.ids.length);
 const darkNotCaptured=coverageByProfile.filter(x=>!x.profiles['390-dark'].length).map(x=>x.label);
 const typography={under14:rows.filter(r=>r.minFont<14).length,under12:rows.filter(r=>r.minFont<12).length,byViewport:Object.fromEntries([[390,'light'],[1280,'light'],[390,'dark']].map(([w,c])=>[w+'-'+c,rows.filter(r=>r.width===w&&r.color===c&&r.minFont<14).length]))};
 const summary={typography,darkNotCaptured,missingLight:missing,timeCoverage,missingTimes,screens:rows.length,byKind,photosBytes:photos,sheetsBytes:sheetBytes,totalImageBytes:photos+sheetBytes,coverageByProfile,limitBytes:40000000,darkKinds:new Set(rows.filter(r=>r.width===390&&r.color==='dark').map(r=>r.kind)).size,missing,sheets,journeys:inv.journeys,errors:inv.errors};
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 const ids=ks=>rows.filter(r=>ks.split('|').includes(r.kind)).map(r=>r.id).join('、');
 const coverage=coverageByProfile.map(x=>`|${x.label}|${x.profiles["390-light"].join("、")||"見つからなかった"}|${x.profiles["1280-light"].join("、")||"見つからなかった"}|${x.profiles["390-dark"].join("、")||"未撮影"}|`).join("\n");
 const fmt=r=>`|${r.id}|[${path.basename(r.file)}](${r.file})|${r.width}×${r.height}|${r.color}|${r.month===0?'開始前':r.year+'年目'+(r.month==null?'':r.month+'月')}（${r.label}）|${r.kind}${r.endingStep?'（'+r.endingStep+'）':''}${r.captureNote?'（'+r.captureNote+'）':''}|${r.stage}|${r.chars}|${r.controls}|${r.fontKinds}|${r.minFont}|${r.pages}|`;
 const small=rows.filter(r=>r.minFont<12),overflow=rows.filter(r=>r.scrollWidth>r.width+1),long=rows.filter(r=>r.pages>=5);
 const text=`# 現行ラーメン版の画面目録\n\n## 種類の対応表\n\n|依頼書の種類|スマホlight|PC light|スマホdark|\n|---|---|---|---|\n${coverage}\n\n## 取得・測定条件\n\n- 取得元：\`claude/keen-hawking-sfeg6f\` の \`37135cbc99cd4daa78913b9ee59bf1bdd42ea7ce\`。後続の変更は試作仕様のみで、取りまとめ役が固定を了承（PR #8 コメント6619794392）。\n- seed=0、通常はskilled・strategy=1。倒産の探索はidle（駅前・パート2人・大きい看板・高い問屋、その後は前月のまま）。さらに4年目4月から、画面で毎月パートを1人増やし・値段を100円下げ・仕込み多め・高い問屋・チラシ10万円・クーポンを選んだ（上限・無効な手は画面の制約どおり）。既存の auto.js を呼ぶ。localStorageへ開始前にseedだけを置く既存ツールの方式。開始後の__sim書き込み・進行位置の直接設定なし。閲覧メニューは取っ手をクリック／SVG地区は地区名の文字をクリック。\n- スマホ390×844（hasTouch・isMobile）、PC1280×800、deviceScaleFactor=1。スマホのlightとdark、PCのlight。外部リクエストはすべて拒否し、ローカルの既存フォントで描画。\n- JPEG品質55。原寸の全縦画面を撮影。一覧は先頭844pxのサムネイル、種類順・12枚ずつ・幅1176px。結末の各段階は、実プレイの標準保存を画面から開き直した写真も併記。スマホの通常終端1枚はPCで完走した同一seedの保存を標準入力から読み込んだ。原寸と一覧の合計${photos+sheetBytes} bytes（上限40,000,000）。\n- 文字数はbody.innerText.length（UTF-16、改行とルビを含む）。非表示要素はinnerTextの挙動に従う。文字サイズは表示されたTextノードと入力欄の計算値。操作部品は表示され、disabledでないbutton/link/input/select/textarea/summary/role=button/tabを数える。画面外でもスクロールで読める要素を含む。\n- 縦画面数はdocumentElement.scrollHeight÷viewport高さ。オーバーレイは背景も画面に見えるため背景の文字・部品も測定に含む。見た目の判定の代用ではない。\n- 時期は画面の月表示を優先（翌年4月は2年目4月、実装の終端は直前の営業月）。数値の原本は[inventory.json](inventory.json)、種類別集計と到達地点は[summary.json](summary.json)。再生成は\`node boki2/tools/screens/inventory.js\`、続いて\`node boki2/tools/screens/catalog.js\`。\n\n## 全画像（1枚1行）\n\n|番号|ファイル名|幅×高さ|配色|時期|画面の種類|作り直しの段|文字数|押せる部品|文字サイズ種類|最小px|縦画面数|\n|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|\n${rows.map(fmt).join('\n')}\n\n## 一覧画像\n\n${sheets.map(s=>`- [${s.file}](${s.file})：${s.ids.join('、')}`).join('\n')}\n\n## 探した範囲と見つからなかったもの\n\n${inv.journeys.map(j=>`- ${j.profile}：${j.final.label}、月位置${j.final.mi}・出来事${j.final.ei}、結果 ${JSON.stringify(j.result)}。`).join('\n')}\n\n- light（スマホ・PC）の未発見種類：${missing.join('、')||'なし'}。darkの未撮影：${darkNotCaptured.join('、')||'なし'}（darkは10種類以上の条件に対し${summary.darkKinds}種類を掲載）。到達していない枝を撮ったことにはしない。\n- 上部の実装はスマホでは「お金・町・店・帳簿・日誌・ほか」の6つ。PCは右側に5つの常設タブ、左側にお金の一覧がある。依頼書の「8つ」と一致しない。6つすべてと、ほかから開く地図・成長・練習室・会社の棚を記録した。\n- 順位は四半期のふりかえりの最後「今の位置」で表示される（客数・評判の順位）。該当写真：${rows.filter(r=>r.kind==='ふりかえり・順位').map(r=>r.id).join('、')}。町には別にシェアの推定表がある。\n\n## 気づいたこと\n\n- 最小pxが14未満の画面：**${typography.under14} / ${rows.length}枚**（${Object.entries(typography.byViewport).map(([k,v])=>k+'：'+v).join('、')}）。1箇所でも14未満なら1画面と数え、本文全体が14未満という意味ではない。12未満は${typography.under12}枚。\n- 最小12px未満の画面：${small.map(r=>`${r.id}（${r.minFont}px）`).join('、')||'なし'}。読みやすさの精査が必要。\n- 横にはみ出した画面（scrollWidth＞幅+1）：${overflow.map(r=>`${r.id}（${r.scrollWidth}px）`).join('、')||'検出なし'}。文字の重なりまで保証する検査ではない。\n- 5画面分以上の長い画面：${long.map(r=>`${r.id}（${r.pages}画面）`).join('、')||'なし'}。全文は原寸画像で確認できる。\n- 町のSVG地区の中央をクリックすると空き物件がポインターを遮る場合がある。地区名の文字を通常クリックして開いた。関連する町の写真：${rows.filter(r=>r.kind==='タブ・town').map(r=>r.id).join('、')}。ゲームは修正していない。\n\n## 撮影停止と中断の補足\n\n- S338はmobile-darkの2年目11月の書類sale19。貸方2行目へのfillが12秒待ちで終了した記録。手で何を押しても進めないという確認ではなく、ゲーム原因かは未切り分け。\n- mobile-lightの中断した同一skilled枝は丸ごと撮り直していない。画面分類はPCと一致し不足0だが、その枝の3年目決算〜4年目6月の各取引の全撮影・通し操作は未実施。\n- 再現設定、停止写真、後から補った撮影、未確認事項は[撮影の停止・中断と掲載範囲](checks/capture-review.md)に記載。\n\n## やっていないこと\n\n- ゲーム・既存playtestの変更、デザイン改修、外部サイト調査、マージ。\n- 全seed・全選択肢の組合せ、全問題714問の個別撮影、実機タッチ・読み上げ検査。全種類の目録であり、すべての取引文面の写しではない。\n- 外部フォントを取得していないため、外部フォントが読み込める環境との厳密な字幅比較は未実施。\n`;
 let extra='\n## 時期別の確認\n\n|幅|種類|年・月|画面番号|\n|---|---|---|---|\n'+timeCoverage.map(x=>`|${x.width}|${x.kind}|${x.year}年目${x.month}月|${x.ids.join('、')||'見つからなかった'}|`).join('\n')+'\n';
 const checks=path.join(OUT,'checks/results.json');
 if(fs.existsSync(checks)){const c=JSON.parse(fs.readFileSync(checks,'utf8'));extra+='\n## 指定6検査\n\n|コマンド|結果|出力の最後の行|\n|---|---|---|\n'+c.map(x=>`|${x.command}|${x.status}|${x.lastLine}|`).join('\n')+'\n';}
 const reproduction=path.join(OUT,'checks/reproducibility.json');
 if(fs.existsSync(reproduction)){const r=JSON.parse(fs.readFileSync(reproduction,'utf8'));extra+=`\nPC撮り直し：${r.firstScreens}枚と${r.repeatScreens}枚。目録の数値・本文・並びの相違${r.measuredDifferences.length}件。写真の差は別に${r.pixelDifferences}枚（目録の数値とは分けて記録）。\n`;}
 fs.writeFileSync(path.join(OUT,'INDEX.md'),text+extra);
 console.log(JSON.stringify({screens:rows.length,byKind,totalImageBytes:photos+sheetBytes,darkKinds:summary.darkKinds,missing},null,2));
 if(photos+sheetBytes>40000000)throw Error('画像の合計が40MBを超えた');
 if(summary.darkKinds<10)throw Error('darkの種類が10未満');
}
module.exports={classify,required};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
