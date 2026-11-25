---
src: web
coll: ramencount23
doc: osm-overpass-kumi-eat23
file: osm-overpass-kumi-eat23.html
sha256: 460204bab4a2a672aec34a57fd842ae3f1b6e47a28391a09339503259c6a07f4
read: partial
pages: 全34,772行を台本で集計した。人の目では店名だけで拾った点の抜き取り40本と、各所の数十行だけ
anchors: ["スターバックス", "らあめん花月", "japanese;ramen一蘭Ichiran", "noodle;ramenがらがら", "上等カレーJotoCurry", "小料理や野里たけ", "western;japaneseデニーズDenny's"]
---
OpenStreetMap のデータを Overpass API（公開の写し overpass.kumi.systems）で問い合わせた結果（2026-11-17）。23区を囲む四角（北緯35.50〜35.83、東経139.56〜139.93）の中の amenity が restaurant・fast_food・cafe・bar・pub・food_court の点の、種類・番号・緯度経度・amenity・cuisine・店名・英語の店名を、タブ区切りで34,772行。全行を台本（count.py）で読んだ。

- 23区の中（N03 の区の形で判定）は29,597点、うちラーメン店に数えたのは1,613（cuisine に ramen を含む1,330、店名の語で拾った283）。
- 店名だけで拾った点を決まった乱数で40本抜くと、ほぼすべてがラーメン店（タイのラーメンを名乗る店が1本）。cuisine が noodle・chinese でラーメンの語のない2,354点は数えていない。
- 経済センサス2021の76B（中華料理店＋ラーメン店）5,821に対し28%、OSM の飲食の点は76 飲食店の54%。網羅は区で大きく違う（ラーメンで0.12〜0.46）。

データは ODbL（© OpenStreetMap contributors）。誰でも書き込める地図なので、網羅は人の多い所・観光地で高い見込み（確かめは区の単位まで）。
