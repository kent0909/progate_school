#!/bin/sh
# 設計の案の本文に出る組の名（K で始まる語）が、回した組（out2/jobs2.txt・out/jobs.txt・out/jobs-post.txt の名）にあるかを確かめる。
cd "$(dirname "$0")"
D=../../DESIGN-STATIONMAP-KOJO.md
NAMES=$( (cut -d' ' -f1 out2/jobs2.txt | sed 's/^[ABCDE]_//; s/_s[0-9]*\(_so[0-9]*\)*$//'; cut -d' ' -f1 out/jobs.txt | sed 's/_s[0-9]*\(_so[0-9]*\)*$//'; echo K1hiK3 K1K3) | tr ' ' '\n' | sort -u)
echo "回した組の名：$(echo $NAMES)"
# 〈K4〉などは論証の検査の番号なので除く。ファイル名の _s79 などの後ろは外す。K1m は K1（m_C 1.93）の部品の名で、K123m・K7m に入る
for k in $(sed 's/〈[^〉]*〉//g; s/{L:[^}]*}//g' $D | grep -v '^| K[0-9]* |' | grep -o 'K[0-9][0-9A-Za-z_]*\|K1-R[234]' | sed 's/-//; s/_s[0-9]*\(_so[0-9]*\)*$//; s/_$//; s/^I_//' | sort -u); do
  if echo "$NAMES" | grep -qx "$k"; then echo "あり $k"; else echo "なし $k"; fi
done
echo "読み：「なし」の語は、K12（くじの世界の数 K＝12）・K11・K17（論証の検査の番号。表の中で〈〉の外に出る所）・K1m（K1 を m_C 1.93 にした部品の名。K123m・K7m に入る）・K7hi_daynull1（論証の検査役の組 I_K7hi_daynull1。out2/E_repro_I_K7hi_daynull1 で回してバイト一致）で、回していない組の数ではない（書き手が1語ずつ見た）"
