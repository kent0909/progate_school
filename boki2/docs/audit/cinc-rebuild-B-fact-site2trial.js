#!/usr/bin/env node
// J-B：2号店の札（cards-y2.js:84〜88）で、画面が選ぶ前に出す試算（c.trial：engine.js:1673 が描く表）と、
// B の run-full.js が記録した「すぐ動くお金」（decide.trial の cashMin/cashMax）を並べる。B は後者だけを見て「9つとも−165万で同じに見える」とした。
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, c = D.cards.byId.site2, W = D.world.create({ seed: 0 });
for (const o of c.options) console.log(o.id, '\t画面の試算:', JSON.stringify(c.trial({ W, seed: 0 }, o.id)), '\tdecide.trial:', D.decide.trial(c, o.id, W).cashMin);
