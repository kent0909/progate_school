// ラーメン版の絵（DESIGN-RAMEN m.3 の最小・l.2 段7）。SVG の部品の組み合わせで描く（素材の画像は使わない。他の作品の絵・名前・配置は写さない）。
// 絵の約束：線は1本の太さ（2.5）と1色（--r-ink）、角は丸く、塗りは平らな暖色。自店＝朱（--me）、ライバル＝型ごとの寒色、危険＝紅紫（--risk）の1色だけ。
// 店の外観3種（店の形で変わる）・一杯の断面（麺3×スープ4×具4）・湯気・客の顔4種・行列・ライバルの看板3種（＋前の周の自分）・町の地図・小さな印。
// 文字列を返す純粋な関数（DOM なし）。色は CSS（css/ramen.css）の変数で、暗い表示でも同じ意味の色になる。
(function (g) {
  const A = (g.RAMENART = {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const OL = 'class="ol"';

  // ---------- 湯気（周期のずれた3本。動きを減らす設定では止まる） ----------
  A.steam = (x, y, s = 1, n = 3) => `<g class="r-steam" transform="translate(${x} ${y}) scale(${s})" aria-hidden="true">${[...Array(n).keys()].map((i) => `<path class="st st${i}" d="M${(i - (n - 1) / 2) * 14},0 c-7,-8 7,-14 0,-22 c-7,-8 7,-14 0,-22"/>`).join('')}</g>`;

  // ---------- 一杯の断面（麺3×スープ4×具4。選ぶたびに変わる） ----------
  const SOUP = { shoyu: ['#8a4a1c', '#b4672b'], shio: ['#e7cf8e', '#f3e3b5'], miso: ['#c2702f', '#dc9452'], tonkotsu: ['#eedcbc', '#f8eedb'] };
  const NOODLE = { thin: { n: 9, w: 2.2 }, mid: { n: 6, w: 3.6 }, thick: { n: 4, w: 5.6 } };
  const wave = (y, x0, x1, amp, ph) => { let d = `M${x0},${y}`; for (let x = x0; x < x1; x += 12) d += ` q6,${(((x / 12) | 0) + ph) % 2 ? -amp : amp} 12,0`; return d; };
  A.bowl = (spec, o = {}) => {
    const sp = SOUP[spec.soup] || SOUP.shoyu, nd = NOODLE[spec.noodle] || NOODLE.mid, top = spec.top || [], custom = spec.src === 'custom';
    const id = `b${Math.round(Math.random() * 1e6)}`;
    const strands = [...Array(nd.n).keys()].map((i) => { const y = 80 + (i * 32) / Math.max(1, nd.n - 1); return `<path d="${wave(y, 34 + (i % 2) * 6, 166 - (i % 3) * 4, nd.w * 0.9, i)}" class="nd" stroke-width="${nd.w}" stroke="${custom ? '#e6b94c' : '#f2d27a'}"/>`; }).join('');
    const has = (k) => top.includes(k);
    const T = [];
    if (has('nori')) T.push(`<g transform="rotate(-12 64 44)"><rect x="52" y="22" width="26" height="40" rx="2" fill="#1f3a2b" ${OL}/><path d="M57 28v28M64 26v30M71 28v28" stroke="#3f6a50" stroke-width="1.4"/></g>`);
    const surf = `<ellipse cx="100" cy="66" rx="71" ry="15" fill="${sp[1]}"/>${spec.soup === 'tonkotsu' || spec.soup === 'shoyu' ? '<g fill="#f6c552" opacity=".7"><ellipse cx="74" cy="68" rx="4" ry="1.6"/><ellipse cx="128" cy="62" rx="3" ry="1.3"/><ellipse cx="112" cy="72" rx="2.4" ry="1"/></g>' : ''}<path d="${wave(66, 52, 148, 3, 0)}" stroke="${custom ? '#e6b94c' : '#f2d27a'}" stroke-width="${nd.w}" fill="none" stroke-linecap="round" opacity=".95"/>`;
    if (has('yasai')) T.push('<g><path d="M70 64 q30 -30 60 0 z" fill="#dff0c6" class="ol"/><path d="M78 58 l8 -10 M92 54 l4 -12 M106 54 l-2 -12 M118 58 l-6 -10" stroke="#9cc56a" stroke-width="2.4" stroke-linecap="round"/><path d="M84 62 q16 -8 34 0" stroke="#fff" stroke-width="2" fill="none"/></g>');
    if (has('chashu')) T.push(`<g><ellipse cx="${has('yasai') ? 146 : 122}" cy="62" rx="17" ry="9" fill="#c4825f" ${OL}/><ellipse cx="${has('yasai') ? 146 : 122}" cy="61" rx="10" ry="5" fill="#e8b79c"/><path d="M${has('yasai') ? 133 : 109} 62 q13 -6 26 0" stroke="#8d4c2f" stroke-width="1.6" fill="none"/></g>`);
    if (has('ajitama')) T.push(`<g><ellipse cx="${has('yasai') ? 58 : 84}" cy="66" rx="11" ry="7.5" fill="#fbf5e8" ${OL}/><ellipse cx="${has('yasai') ? 58 : 84}" cy="66" rx="6" ry="4.4" fill="#f19a1f"/><ellipse cx="${has('yasai') ? 57 : 83}" cy="65" rx="2.4" ry="1.6" fill="#ffd36b"/></g>`);
    T.push('<g stroke="#5f9a3c" stroke-width="2.4" stroke-linecap="round"><path d="M96 74 l4 -3 M104 73 l3 -3 M90 72 l3 -2"/></g>');
    return `<svg class="r-art r-bowl" viewBox="0 0 200 150" role="img" aria-label="${esc(o.label || '一杯の断面')}">
<defs><clipPath id="${id}"><path d="M29,66 Q36,118 100,120 Q164,118 171,66 Z"/></clipPath></defs>
${o.steam === false ? '' : A.steam(100, 34, 0.9)}
${has('nori') ? T.shift() : ''}
<path d="M20,62 Q26,132 100,134 Q174,132 180,62 Z" class="bw" ${OL}/>
<path d="M22,70 Q26,80 30,82 L170,82 Q174,80 178,70" fill="none" class="rim2"/>
<path d="M24,74 l8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6 8,-6 8,6" fill="none" class="rim" transform="translate(0 4)"/>
<g clip-path="url(#${id})"><rect x="20" y="66" width="160" height="60" fill="${sp[0]}"/>${strands}<rect x="20" y="66" width="160" height="60" fill="${sp[0]}" opacity=".25"/></g>
<path d="M29,66 Q36,118 100,120 Q164,118 171,66" fill="none" ${OL} stroke-dasharray="3 4" opacity=".55"/>
<ellipse cx="100" cy="62" rx="80" ry="20" class="bw" ${OL}/>
${surf}
${T.join('')}
<ellipse cx="100" cy="62" rx="80" ry="20" fill="none" ${OL}/>
</svg>`;
  };

  // ---------- 客の顔4種（勤め人・家族・学生・観光の人）。気分（−1・0・1）で口と眉が変わる ----------
  const SKIN = ['#f6d2b0', '#e9b98f', '#f3c7a2', '#dba882'];
  A.face = (seg, mood = 0, o = {}) => {
    const s = o.size || 40, sk = SKIN[{ office: 0, family: 1, student: 2, tourist: 3 }[seg] || 0];
    const mouth = mood > 0 ? '<path d="M14 25 q6 6 12 0" fill="#c2453b" class="ol" stroke-width="1.6"/>' : mood < 0 ? '<path d="M15 27 q5 -4 10 0" fill="none" class="ol" stroke-width="1.8"/>' : '<path d="M15 25 q5 2.5 10 0" fill="none" class="ol" stroke-width="1.8"/>';
    const brow = mood < 0 ? '<path d="M12 14 l5 2 M28 14 l-5 2" class="ol" stroke-width="1.6"/>' : '<path d="M12 15 q3 -2 5 0 M23 15 q3 -2 5 0" fill="none" class="ol" stroke-width="1.4"/>';
    const blush = mood > 0 ? '<g fill="#f08a8a" opacity=".55"><ellipse cx="11" cy="22" rx="2.6" ry="1.5"/><ellipse cx="29" cy="22" rx="2.6" ry="1.5"/></g>' : '';
    const hair = {
      office: '<path d="M8 17 q0 -12 12 -12 q12 0 12 11 q-6 -6 -14 -5 q-6 1 -10 6z" fill="#2c2420" class="ol" stroke-width="1.6"/><path d="M14 36 l6 -4 6 4" fill="#fff" class="ol" stroke-width="1.4"/><path d="M19 33 l1 5 1 -5z" fill="#3b5ea8"/>',
      family: '<circle cx="20" cy="5" r="4.5" fill="#5a3826" class="ol" stroke-width="1.5"/><path d="M8 19 q-1 -13 12 -13 q13 0 12 13 q-4 -7 -12 -7 q-8 0 -12 7z" fill="#5a3826" class="ol" stroke-width="1.6"/><circle cx="8.5" cy="23" r="1.4" fill="#e7b33f"/><circle cx="31.5" cy="23" r="1.4" fill="#e7b33f"/>',
      student: '<path d="M6 13 q14 -12 28 0 l1 3 h-30z" fill="#1d2433" class="ol" stroke-width="1.6"/><path d="M5 16 h31" class="ol" stroke-width="1.6"/><rect x="17" y="8" width="6" height="3" rx="1" fill="#e7b33f"/><path d="M13 36 l7 -3 7 3" fill="#1d2433" class="ol" stroke-width="1.4"/><circle cx="20" cy="37" r="1.2" fill="#e7b33f"/>',
      tourist: '<ellipse cx="20" cy="11" rx="17" ry="4.5" fill="#e9cf86" class="ol" stroke-width="1.6"/><path d="M11 10 q9 -11 18 0z" fill="#e9cf86" class="ol" stroke-width="1.6"/><path d="M11 9 h18" stroke="#c85a3a" stroke-width="2.2"/><path d="M12 36 l-3 4 M28 36 l3 4" class="ol" stroke-width="1.6"/>',
    }[seg] || '';
    return `<svg class="r-art r-face" viewBox="0 0 40 42" width="${s}" height="${s * 1.05}" role="img" aria-label="${esc(o.label || { office: '勤め人', family: '家族づれ', student: '学生', tourist: '観光の人' }[seg] || '客')}${mood > 0 ? '（よろこんでいる）' : mood < 0 ? '（くもっている）' : ''}"><ellipse cx="20" cy="21" rx="12" ry="13" fill="${sk}" class="ol" stroke-width="1.8"/>${hair}${brow}<circle cx="15.5" cy="19.5" r="1.6" fill="#2a1f1a"/><circle cx="24.5" cy="19.5" r="1.6" fill="#2a1f1a"/>${mouth}${blush}</svg>`;
  };

  // ---------- 行列（店の前に並ぶ人。8人まで描き、あとは「＋n」） ----------
  const SEG_COL = { office: '#3b5ea8', family: '#c0607a', student: '#2f3a52', tourist: '#d39a2c' };
  A.queueG = (n, mix = { office: 0.3, family: 0.5, student: 0.1, tourist: 0.1 }) => {
    const k = Math.max(0, Math.min(8, Math.round(n))), segs = Object.entries(mix).filter(([, w]) => w > 0);
    const pick = (i) => { const x = (i * 0.618) % 1; let acc = 0; for (const [s, w] of segs) { acc += w; if (x <= acc) return s; } return segs.length ? segs[segs.length - 1][0] : 'office'; };
    const ppl = [...Array(k).keys()].map((i) => { const s = pick(i), x = 8 + i * 15, sk = SKIN[i % 4]; return `<g transform="translate(${x} ${i % 2 ? 2 : 0})"><rect x="-6" y="14" width="12" height="18" rx="6" fill="${SEG_COL[s]}" class="ol" stroke-width="1.6"/><circle cx="0" cy="8" r="6.5" fill="${sk}" class="ol" stroke-width="1.6"/>${s === 'tourist' ? '<ellipse cx="0" cy="3" rx="9" ry="2.6" fill="#e9cf86" class="ol" stroke-width="1.3"/>' : s === 'student' ? '<path d="M-6 4 q6 -7 12 0z" fill="#1d2433"/>' : '<path d="M-6 6 q6 -8 12 0" fill="#2c2420"/>'}</g>`; }).join('');
    const more = n > 8.5 ? `<text x="${4 + k * 15}" y="28" class="r-qmore">＋${Math.round(n - 8)}</text>` : '';
    return { g: ppl + more, w: Math.max(40, 16 + k * 15 + (n > 8.5 ? 30 : 0)) };
  };
  A.queue = (n, mix, o = {}) => { const q = A.queueG(n, mix); return `<svg class="r-art r-queue" viewBox="0 0 ${q.w} 36" role="img" aria-label="${esc(o.label || `並んでいる人 ${Math.round(n)}人`)}">${q.g}</svg>`; };

  // ---------- 店の外観3種（店の形：家族で小さく／パート1人／パート2人）。季節の飾り・明かり・行列・湯気 ----------
  const SEASON = {
    spring: '<g fill="#f6b8c8" opacity=".9"><circle cx="40" cy="30" r="3"/><circle cx="90" cy="18" r="2.4"/><circle cx="250" cy="26" r="2.8"/><circle cx="290" cy="44" r="2.2"/><circle cx="180" cy="12" r="2"/></g>',
    summer: '<g><circle cx="292" cy="26" r="13" fill="#ffd25e" class="ol" stroke-width="2"/><path d="M292 5v-4M292 51v-4M271 26h-4M317 26h-4" stroke="#ffd25e" stroke-width="3" stroke-linecap="round"/></g>',
    autumn: '<g fill="#d9622b"><path d="M48 26 l4 -6 4 6 -4 3z"/><path d="M262 34 l4 -6 4 6 -4 3z"/><path d="M196 16 l3 -5 3 5 -3 2z" fill="#e8a33b"/></g>',
    winter: '<g fill="#fff" opacity=".95"><circle cx="40" cy="28" r="2.2"/><circle cx="96" cy="14" r="1.8"/><circle cx="232" cy="22" r="2.4"/><circle cx="300" cy="40" r="2"/><circle cx="160" cy="10" r="1.6"/></g>',
  };
  const norenPanels = (x, y, w, n, txt) => { const pw = w / n; return [...Array(n).keys()].map((i) => `<path d="M${x + i * pw + 1},${y} h${pw - 2} v26 q-${(pw - 2) / 2},4 -${pw - 2},0z" class="noren" ${OL} stroke-width="2"/>${txt && txt[i] ? `<text x="${x + i * pw + pw / 2}" y="${y + 17}" class="r-norent">${esc(txt[i])}</text>` : ''}`).join(''); };
  A.shop = (form, o = {}) => {
    const name = o.name || '麺や ピヨ', season = o.season || 'spring', lit = o.lit !== false, q = o.queue || 0;
    const ch = [...name.replace(/\s/g, '')].slice(-3);
    const glow = lit ? 'win' : 'win off';
    let body;
    if (form === 'family') {
      body = `<path d="M70,70 L160,40 L250,70 Z" class="roof" ${OL}/>${season === 'winter' ? '<path d="M78,67 L160,41 L242,67" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>' : ''}
<rect x="84" y="70" width="152" height="96" class="wood" ${OL}/>
<rect x="96" y="88" width="56" height="78" class="door" ${OL}/><path d="M110 88v78M124 88v78M138 88v78M96 112h56M96 138h56" class="lattice"/>
${norenPanels(94, 80, 60, 2, [ch[0], ch[1]])}
<rect x="168" y="92" width="54" height="36" class="${glow}" ${OL}/><path d="M195 92v36M168 110h54" class="lattice"/>
<rect x="160" y="54" width="0" height="0"/>
<g transform="translate(232 140)"><rect x="-8" y="0" width="16" height="22" rx="3" fill="#c46b3e" ${OL} stroke-width="2"/><circle cx="0" cy="-6" r="10" fill="#5f9a3c" ${OL} stroke-width="2"/></g>
<g transform="translate(60 150)" class="bike"><circle cx="0" cy="10" r="8" fill="none" ${OL} stroke-width="2"/><circle cx="26" cy="10" r="8" fill="none" ${OL} stroke-width="2"/><path d="M0 10 l10 -12 h10 l6 12 M10 -2 l-2 -6" fill="none" ${OL} stroke-width="2"/></g>`;
    } else if (form === 'part2') {
      body = `<rect x="40" y="36" width="240" height="40" class="wall2" ${OL}/><rect x="56" y="44" width="40" height="24" class="${glow}" ${OL}/><rect x="224" y="44" width="40" height="24" class="${glow}" ${OL}/>
<rect x="102" y="40" width="116" height="32" rx="4" class="sign" ${OL}/><text x="160" y="62" class="r-signt">${esc(name)}</text>
<path d="M32,76 h256 l-10,14 h-236z" class="roof" ${OL}/>
<rect x="44" y="90" width="232" height="76" class="wood" ${OL}/>
<rect x="60" y="100" width="64" height="44" class="${glow}" ${OL}/><path d="M92 100v44" class="lattice"/>
<rect x="140" y="98" width="70" height="68" class="door" ${OL}/><path d="M175 98v68" class="lattice"/>
${norenPanels(138, 94, 74, 4, ch.concat([' ']))}
<rect x="222" y="104" width="34" height="50" rx="3" class="kenbai" ${OL}/><rect x="228" y="110" width="22" height="14" class="kb-screen"/><g class="kb-btn"><rect x="228" y="128" width="6" height="5"/><rect x="236" y="128" width="6" height="5"/><rect x="244" y="128" width="6" height="5"/><rect x="228" y="136" width="6" height="5"/><rect x="236" y="136" width="6" height="5"/><rect x="244" y="136" width="6" height="5"/></g>
${['54', '266'].map((x) => `<g transform="translate(${x} 82)"><path d="M0 0 v6" ${OL} stroke-width="2"/><ellipse cx="0" cy="18" rx="9" ry="12" class="lantern${lit ? '' : ' off'}" ${OL} stroke-width="2"/><path d="M-9 18 h18 M-8 12 h16 M-8 24 h16" stroke="#7a2a20" stroke-width="1.2"/></g>`).join('')}
<rect x="60" y="150" width="64" height="8" rx="2" class="bench" ${OL} stroke-width="2"/>`;
    } else {
      body = `<rect x="70" y="40" width="180" height="34" rx="4" class="sign" ${OL}/><text x="160" y="63" class="r-signt">${esc(name)}</text>
<path d="M60,74 h200 l-8,12 h-184z" class="roof" ${OL}/>
<rect x="72" y="86" width="176" height="80" class="wood" ${OL}/>
<rect x="84" y="98" width="56" height="44" class="${glow}" ${OL}/><path d="M112 98v44M84 120h56" class="lattice"/>
<rect x="152" y="96" width="62" height="70" class="door" ${OL}/><path d="M183 96v70" class="lattice"/>
${norenPanels(150, 92, 66, 3, ch)}
<rect x="222" y="100" width="22" height="44" rx="3" class="kenbai" ${OL} stroke-width="2"/><rect x="226" y="105" width="14" height="10" class="kb-screen"/>
<g transform="translate(62 140)"><path d="M0 0 l8 26 M16 0 l-8 26" ${OL} stroke-width="2"/><rect x="-2" y="-18" width="20" height="20" rx="2" class="menuboard" ${OL} stroke-width="2"/></g>`;
    }
    const steam = lit ? A.steam(form === 'family' ? 230 : form === 'part2' ? 250 : 236, form === 'family' ? 64 : 36, 0.7, 2) : '';
    return `<svg class="r-art r-shop r-${season}${lit ? '' : ' r-night'}" viewBox="0 0 320 200" role="img" aria-label="${esc(o.label || `${name}の店の外観`)}">
<rect x="0" y="0" width="320" height="200" class="sky"/>${SEASON[season] || ''}
<rect x="0" y="166" width="320" height="34" class="street"/><path d="M0 166 h320" ${OL} stroke-width="2"/>
${body}${steam}
${q > 0 ? `<g transform="translate(${form === 'part2' ? 300 : 296} 134) scale(-1 1)">${A.queueG(q, o.mix).g.replace(/<text[^>]*>[^<]*<\/text>/, '')}</g>${q > 8.5 ? `<text x="${300 - 8 * 15 - 18}" y="160" class="r-qmore">＋${Math.round(q - 8)}</text>` : ''}` : ''}
</svg>`;
  };

  // ---------- ライバルの看板3種（安売りチェーン・こだわりの個人店・老舗）＋前の周の自分 ----------
  A.rival = (type, name, o = {}) => {
    const n = esc(name || '');
    const sign = {
      cheap: `<rect x="4" y="6" width="112" height="44" rx="6" class="rv-cheap" ${OL}/><rect x="10" y="12" width="100" height="18" rx="3" fill="#fff" opacity=".18"/><text x="46" y="34" class="r-rvt big">${n}</text><g transform="translate(100 18)"><circle r="12" fill="#ffd84a" ${OL} stroke-width="2"/><text y="3.5" class="r-rvp">${esc(o.price ? `${o.price}` : '安')}</text></g>`,
      kodawari: `<rect x="8" y="4" width="104" height="44" rx="2" class="rv-kodawari" ${OL}/><path d="M14 10 h92" stroke="#9fd3cf" stroke-width="1.2" opacity=".6"/><text x="60" y="32" class="r-rvt thin">${n}</text><g transform="translate(108 48)"><ellipse rx="5" ry="7" fill="#9fd3cf" ${OL} stroke-width="1.6"/></g>`,
      shinise: `<path d="M6 6 h108 v34 h-6 v-30 h-12 v30 h-6 v-30 h-12 v30 h-6 v-30 h-12 v30 h-6 v-30 h-12 v30 h-6 v-30 h-12 v30 h-6 v-30 h-6z" class="rv-shinise" ${OL} stroke-width="2"/><rect x="6" y="6" width="108" height="34" class="rv-shinise" ${OL}/><circle cx="18" cy="23" r="8" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 25 q6 -5 12 0" stroke="#fff" stroke-width="2" fill="none"/><text x="70" y="28" class="r-rvt sm">${n}</text>`,
      ghost: `<rect x="6" y="6" width="108" height="40" rx="6" class="rv-ghost" stroke-dasharray="5 4" ${OL}/><text x="60" y="31" class="r-rvt ghost">${n || '前の店主'}</text>`,
    }[type] || '';
    return `<svg class="r-art r-rival${o.closed ? ' closed' : ''}" viewBox="0 0 120 56" role="img" aria-label="${esc(`${name}（${{ cheap: '安売りチェーン', kodawari: 'こだわりの個人店', shinise: '老舗', ghost: '前の周の自分' }[type] || ''}）${o.closed ? '：閉店' : ''}`)}">${sign}${o.closed ? '<path d="M10 10 L110 46 M110 10 L10 46" stroke="var(--risk)" stroke-width="4" stroke-linecap="round"/>' : ''}</svg>`;
  };

  // ---------- 小さな印（言葉の代わり：5つの物差し・棚・要因・天気） ----------
  const IC = {
    price: '<path d="M4 12 L12 4 h7 v7 L11 19z" fill="#ffe0a3" class="ol" stroke-width="1.8"/><circle cx="15.5" cy="7.5" r="1.6" fill="#7a4b20"/>',
    pot: '<path d="M4 9 h16 v8 q0 3 -3 3 h-10 q-3 0 -3 -3z" fill="#9aa7b2" class="ol" stroke-width="1.8"/><path d="M2 9 h20" class="ol" stroke-width="1.8"/><path d="M9 6 q1 -3 0 -4 M14 6 q1 -3 0 -4" stroke="#bbb" stroke-width="1.6" fill="none"/>',
    pin: '<path d="M12 21 q-7 -7 -7 -11 a7 7 0 0 1 14 0 q0 4 -7 11z" fill="var(--me)" class="ol" stroke-width="1.8"/><circle cx="12" cy="10" r="2.6" fill="#fff"/>',
    cloud: '<path d="M6 17 a4 4 0 0 1 1 -8 a5 5 0 0 1 9 -1 a4 4 0 0 1 2 9z" fill="#dfe7ee" class="ol" stroke-width="1.8"/>',
    rain: '<path d="M6 13 a4 4 0 0 1 1 -8 a5 5 0 0 1 9 -1 a4 4 0 0 1 2 9z" fill="#c9d4df" class="ol" stroke-width="1.8"/><path d="M8 16 l-1 4 M12 16 l-1 4 M16 16 l-1 4" stroke="#3b6ea8" stroke-width="1.8" stroke-linecap="round"/>',
    sun: '<circle cx="12" cy="12" r="5" fill="#ffd25e" class="ol" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2 -2M17 7l2 -2" stroke="#e5a91f" stroke-width="1.8" stroke-linecap="round"/>',
    person: '<circle cx="12" cy="8" r="4" fill="#f3c7a2" class="ol" stroke-width="1.8"/><path d="M5 21 q0 -7 7 -7 q7 0 7 7z" fill="#6f8fb8" class="ol" stroke-width="1.8"/>',
    clip: '<rect x="5" y="4" width="14" height="17" rx="2" fill="#fff" class="ol" stroke-width="1.8"/><path d="M8 10 h8 M8 14 h8 M8 18 h5" stroke="#999" stroke-width="1.5"/><rect x="9" y="2" width="6" height="4" rx="1" fill="#c9b07a" class="ol" stroke-width="1.4"/>',
    lens: '<circle cx="10" cy="10" r="6" fill="#e8f2ff" class="ol" stroke-width="1.8"/><path d="M15 15 l6 6" class="ol" stroke-width="2.6"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2.5" fill="#3b3f4a" class="ol" stroke-width="1.8"/><rect x="9" y="5" width="6" height="12" fill="#9fd3ff"/>',
    chat: '<path d="M3 5 h18 v11 h-10 l-5 4 v-4 h-3z" fill="#7bd38a" class="ol" stroke-width="1.8"/>',
    paper: '<path d="M5 3 h10 l4 4 v14 h-14z" fill="#fffaf0" class="ol" stroke-width="1.8"/><path d="M8 10 h8 M8 13 h8 M8 16 h6" stroke="var(--me)" stroke-width="1.6"/>',
    ticket: '<path d="M3 7 h18 v3 a2 2 0 0 0 0 4 v3 h-18 v-3 a2 2 0 0 0 0 -4z" fill="#ffd9a8" class="ol" stroke-width="1.8"/><path d="M14 7 v10" stroke="#b67" stroke-dasharray="2 2" stroke-width="1.4"/>',
    bowl: '<path d="M3 11 h18 q0 8 -9 8 q-9 0 -9 -8z" fill="#f4efe6" class="ol" stroke-width="1.8"/><path d="M4 11 q8 -3 16 0" fill="#b4672b"/><path d="M9 7 q-1 -2 0 -4 M14 7 q-1 -2 0 -4" stroke="#bbb" stroke-width="1.5" fill="none"/>',
    sprout: '<path d="M12 21 v-9" class="ol" stroke-width="2"/><path d="M12 13 q-7 0 -7 -7 q7 0 7 7z M12 11 q6 0 7 -6 q-7 0 -7 6z" fill="#8cc56a" class="ol" stroke-width="1.6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2" fill="#fff" class="ol" stroke-width="1.8"/><path d="M3 9 h18" stroke="var(--me)" stroke-width="3"/><path d="M8 3 v4 M16 3 v4" class="ol" stroke-width="1.8"/>',
    star: '<path d="M12 3 l2.7 5.6 6.1 .8 -4.5 4.2 1.1 6 -5.4 -3 -5.4 3 1.1 -6 -4.5 -4.2 6.1 -.8z" fill="#ffd25e" class="ol" stroke-width="1.7"/>',
    shop: '<path d="M3 10 l2 -6 h14 l2 6z" fill="var(--rv)" class="ol" stroke-width="1.8"/><rect x="4" y="10" width="16" height="11" fill="#fff" class="ol" stroke-width="1.8"/>',
    queue: '<circle cx="6" cy="8" r="3" fill="#f3c7a2" class="ol" stroke-width="1.5"/><circle cx="13" cy="8" r="3" fill="#f3c7a2" class="ol" stroke-width="1.5"/><circle cx="20" cy="8" r="3" fill="#f3c7a2" class="ol" stroke-width="1.5"/><path d="M2 20 q4 -8 8 0 M9 20 q4 -8 8 0 M16 20 q4 -8 7 0" fill="#6f8fb8" class="ol" stroke-width="1.5"/>',
    wallet: '<rect x="3" y="7" width="18" height="13" rx="2" fill="#c98a4a" class="ol" stroke-width="1.8"/><rect x="14" y="11" width="7" height="5" rx="1" fill="#f1d8a8" class="ol" stroke-width="1.4"/>',
    up: '<path d="M4 18 l6 -6 4 4 6 -8" fill="none" stroke="var(--me)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 8 h5 v5" fill="none" stroke="var(--me)" stroke-width="2.6" stroke-linecap="round"/>',
    warn: '<path d="M12 3 l10 18 h-20z" fill="var(--risk-soft)" stroke="var(--risk)" stroke-width="2" stroke-linejoin="round"/><path d="M12 9 v6" stroke="var(--risk)" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="var(--risk)"/>',
    coin: '<circle cx="12" cy="12" r="8" fill="#ffd25e" class="ol" stroke-width="1.8"/><path d="M9 9 l3 4 3 -4 M12 13 v5 M9 14 h6" stroke="#9a6a10" stroke-width="1.6" fill="none"/>',
    debt: '<rect x="4" y="5" width="16" height="15" rx="1.5" fill="#fff" class="ol" stroke-width="1.8"/><path d="M8 9 h8 M8 12 h8 M8 15 h5" stroke="#888" stroke-width="1.4"/><circle cx="16" cy="17" r="3" fill="none" stroke="var(--risk)" stroke-width="1.6"/>',
    flag: '<path d="M6 21 V4" class="ol" stroke-width="2"/><path d="M6 4 h12 l-3 4 3 4 h-12z" fill="var(--me)" class="ol" stroke-width="1.6"/>',
  };
  A.icon = (k, o = {}) => `<svg class="r-ic" viewBox="0 0 24 24" width="${o.size || 22}" height="${o.size || 22}" aria-hidden="true">${IC[k] || IC.flag}</svg>`;

  // ---------- 町の地図（3エリアの平面図。路線図の作法：太い線・角を丸める。印は建物に隠れない） ----------
  // m：RV.mapModel の形。押せる所は data-area・data-lot・data-rival（l.3 の取っ手）
  const ORDER = ['ekimae', 'shotengai', 'jutaku'];
  const boxes = (mine) => { const o = {}; let x = 8; for (const a of ORDER) { const w = a === mine ? 176 : 80; o[a] = [x, 34, w, 186]; x += w + 8; } return o; };
  // 自分のエリア（幅176）の中の場所：自店は真ん中、ライバルは3つの角、予兆は駅の側（左上）、商店会の掲示板は上の真ん中、空き物件は下
  const SLOTS = { me: [96, 104], r0: [36, 58], r1: [150, 62], r2: [150, 146], omen: [34, 140], board: [96, 44], l0: [40, 104], l1: [40, 166], lm: [96, 166] };
  const TINT = { spring: '#f9e9ec', summer: '#eaf5e3', autumn: '#f7eadb', winter: '#eef2f6' };
  A.map = (m, o = {}) => {
    const shopName = o.shopName || '自分の店';
    const parts = [], xEnd = 8 + 176 + 80 + 80 + 16;
    parts.push(`<rect x="0" y="0" width="${xEnd + 8}" height="232" rx="14" class="m-ground" style="fill:${TINT[m.season] || TINT.spring}"/>`);
    // 道と線路（太く、角を丸める）
    parts.push(`<path d="M6 224 H${xEnd}" class="m-road"/><path d="M6 18 H${xEnd}" class="m-rail"/><path d="M6 18 H${xEnd}" class="m-rail-tie"/>`);
    parts.push('<g transform="translate(36 6)"><rect x="0" y="0" width="54" height="22" rx="6" class="m-station" stroke-width="2"/><text x="27" y="15" class="m-lab sm">駅</text></g>');
    const AREA_BOX = boxes(m.area);
    for (const a of m.areas) {
      const [x, y, w, h] = AREA_BOX[a.id];
      parts.push(`<g class="m-area${a.mine ? ' mine' : ''}" data-area="${a.id}" role="button" tabindex="0" aria-label="${esc(a.label)}のエリア${a.mine ? '（自分の店がある）' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" class="m-areabox"/><text x="${x + w / 2}" y="${y + 18}" class="m-lab">${esc(a.label)}</text>`);
      // 町の型の小さな絵（建物は輪郭だけ・印より下に描く）
      if (a.id === 'shotengai') parts.push(`<path d="M${x + 14} ${y + 30} h${w - 28}" stroke="#d9622b" stroke-width="5" stroke-dasharray="10 6" stroke-linecap="round" opacity=".55"/>`);
      if (a.id === 'jutaku') for (let i = 0; i < 4; i++) parts.push(`<path d="M${x + w - 34 - (i % 2) * (w > 100 ? 60 : 0)} ${y + 40 + i * 34} l10 -8 10 8 v12 h-20z" class="m-house"/>`);
      if (a.id === 'ekimae') parts.push(`<rect x="${x + w - 30}" y="${y + 30}" width="22" height="40" rx="4" class="m-house"/><rect x="${x + w - 30}" y="${y + 124}" width="22" height="28" rx="3" class="m-house"/>`);
      parts.push('</g>');
    }
    const at = (area, slot) => { const [x, y] = AREA_BOX[area]; if (area !== m.area) return [x + 40, y + ({ l0: 96, l1: 160 }[slot] || 96)]; const s = SLOTS[slot] || SLOTS.me; return [x + s[0], y + s[1]]; };
    // 空き物件（点線の枠に「空」）。5つの数は押すと出る
    for (const [area, lots] of Object.entries(m.lots)) lots.forEach((l, i) => { const [x, y] = at(area, area === m.area ? 'lm' : i ? 'l1' : 'l0'); parts.push(`<g class="m-lot" data-lot="${l.id}" data-lot-area="${area}" role="button" tabindex="0" aria-label="空き物件 ${esc(SIMLAB[area] || '')}の${esc(l.kind)}"><rect x="${x - 14}" y="${y - 12}" width="28" height="24" rx="4" class="m-lotbox"/><text x="${x}" y="${y + 5}" class="m-lab sm">空</text></g>`); });
    // ライバル（看板の小さな絵：型ごとの寒色）。開いていない店は×
    m.rivals.forEach((r) => { if (r.slot === 'omen' && !r.open) return; const [x, y] = at(m.area, r.slot); parts.push(`<g class="m-rival ${r.type}${r.open ? '' : ' closed'}" data-rival="${r.id}" role="button" tabindex="0" aria-label="${esc(r.name)}（${esc(r.label)}）${r.open ? '' : '：閉店'}"><circle cx="${x}" cy="${y}" r="15" class="m-rvdot"/><path d="M${x - 8} ${y - 1} l2 -6 h12 l2 6z" fill="#fff" opacity=".9"/><rect x="${x - 7}" y="${y - 1}" width="14" height="8" fill="#fff" opacity=".9"/>${r.open ? '' : `<path d="M${x - 10} ${y - 10} L${x + 10} ${y + 10} M${x + 10} ${y - 10} L${x - 10} ${y + 10}" stroke="var(--risk)" stroke-width="3" stroke-linecap="round"/>`}<text x="${x}" y="${y + 27}" class="m-lab xs halo">${esc(r.name.replace(/^(麺処|中華そば)\s*/, ''))}</text></g>`); });
    // 自店（暖色の光の縁。いちばん上に描く）
    { const [x, y] = at(m.area, 'me'); parts.push(`<g class="m-me" data-area="${m.area}" role="button" tabindex="0" aria-label="${esc(shopName)}（自分の店）"><circle cx="${x}" cy="${y}" r="21" class="m-meglow"/><circle cx="${x}" cy="${y}" r="16" class="m-medot"/><path d="M${x - 9} ${y - 2} q9 -9 18 0 v9 h-18z" fill="#fff"/><path d="M${x - 9} ${y - 2} h18" stroke="var(--me)" stroke-width="3"/><text x="${x}" y="${y + 33}" class="m-lab xs me halo">${esc(shopName)}</text></g>`); }
    // 予兆の印（工事・求人・回覧）。印は札と同じ言葉で（data-omen に札の id）
    m.omens.forEach((om, i) => {
      const [x, y] = at(m.area, om.at === 'board' ? 'board' : 'omen');
      const dx = om.kind === 'kyujin' ? 30 : 0;
      const shape = om.kind === 'kouji' ? `<path d="M${x + dx} ${y - 12} l10 20 h-20z" fill="#ffb02e" class="ol" stroke-width="2"/><path d="M${x + dx - 6} ${y + 2} h12 M${x + dx - 4} ${y - 4} h8" stroke="#fff" stroke-width="2.4"/>` : om.kind === 'kyujin' ? `<rect x="${x + dx - 9}" y="${y - 11}" width="18" height="22" rx="2" fill="#fff" class="ol" stroke-width="2"/><path d="M${x + dx - 5} ${y - 4} h10 M${x + dx - 5} ${y} h10 M${x + dx - 5} ${y + 4} h6" stroke="var(--rv)" stroke-width="1.6"/>` : `<rect x="${x + dx - 11}" y="${y - 10}" width="22" height="18" rx="2" fill="#f7e2b5" class="ol" stroke-width="2"/><path d="M${x + dx - 6} ${y + 8} v6 M${x + dx + 6} ${y + 8} v6" class="ol" stroke-width="2"/><path d="M${x + dx - 6} ${y - 4} h12 M${x + dx - 6} ${y} h12" stroke="#a46a2a" stroke-width="1.6"/>`;
      parts.push(`<g class="m-omen ${om.kind}" data-omen="${om.card}" data-omen-kind="${om.kind}" role="img" aria-label="${esc(om.label)}"><circle cx="${x + dx}" cy="${y}" r="17" class="m-omenring"/>${shape}</g>`);
      void i;
    });
    return `<svg class="r-art r-map" viewBox="0 0 ${xEnd + 8} 232" role="group" aria-label="町の地図">${parts.join('')}</svg>`;
  };
  const SIMLAB = { ekimae: '駅前', shotengai: '商店街', jutaku: '住宅地' };

  // ---------- 小さな折れ線（スパークライン。前の周は薄く） ----------
  A.spark = (vals, o = {}) => {
    const v = vals.map((x) => (x == null ? null : x)), ok = v.filter((x) => x != null);
    if (ok.length < 2) return '';
    const w = o.w || 64, h = o.h || 18, lo = Math.min(...ok, o.lo != null ? o.lo : Infinity), hi = Math.max(...ok, o.hi != null ? o.hi : -Infinity), span = hi - lo || 1;
    const pts = v.map((x, i) => (x == null ? null : `${((i / (v.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 2 - ((x - lo) / span) * (h - 4)).toFixed(1)}`)).filter(Boolean).join(' ');
    return `<svg class="r-spark ${o.cls || ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
