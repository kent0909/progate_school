#!/bin/bash
# まとめ役が、検査者の返事を受けたとき・検査者に話しかけたときに、その場で1回写しを取る。あわせてループと見張り役が動いているかを確かめ、止まっていれば動かす。
# 使い方：bash archive-now.sh <playtest.json>
DIR="$(cd "$(dirname "$0")" && pwd)"
node "$DIR/archive.js" "$1" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s);const add=a.filter(x=>x.added);console.log(`写した：${add.length ? add.map(x=>x.name+"+"+x.added).join(" ") : "新しい行なし"}`)})'
bash "$DIR/archive-loop.sh" "$1" > /dev/null
bash "$DIR/archive-loop.sh" "$1" status
