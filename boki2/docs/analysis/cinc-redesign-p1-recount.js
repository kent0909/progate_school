#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.2）：J-B の判断の数の3通りの分け方（J-B 3.2）を、自分で走らせて確かめる。
// 手順：node boki2/docs/audit/cinc-rebuild-B-fact-count.js > 一時.json （B の生の出力 41 本から数え直す J-B の道具）
//       node boki2/docs/analysis/cinc-redesign-p1-recount.js 一時.json > cinc-redesign-p1-recount.out.txt
// 列：B＝お金の手7＋お金の違う札、A＝開いた手の全部＋判断の画面、Bt＝押せる選択肢のボタンの数、C＝1回で口座が10万円以上動きうる札、doc/dec＝判断1つあたりの書類。年は y1〜y4。
const j=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
for(const [k,v] of Object.entries(j.summary)){if(!v.P1)continue;const r=['y1','y2','y3','y4'].map(y=>v.P1[y]);
console.log(k,'runs',v.runs,'| B',r.map(x=>x.B_same_money.toFixed(2)).join(' '),'| A',r.map(x=>x.A_allScenes.toFixed(2)).join(' '),'| Bt',r.map(x=>x.Bt_buttons.toFixed(2)).join(' '),'| C',r.map(x=>x.C_bigCards.toFixed(3)).join(' '),'| doc/dec',r.map(x=>x.docPerDecision.toFixed(2)).join(' '));}
