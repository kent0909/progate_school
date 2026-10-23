// 一杯（DESIGN-RAMEN 版0.4 d.8・e.8）：組み立て（麺・スープ・具・値段・名づけ）、型、客層との相性、原価、魅力 F の話題の山と減衰。純粋関数。
// F ＝ 基準 Fbase ＋ 話題の山 peak。山は新作・限定・手直しで立ち、4か月で元へ。基準は13か月目から落ちる（1年目は落ちない）。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const C = (k) => SIM.coef(k);
  // 要素：原価（1杯の円）・品質の足し・客層の好み（+1 好き／−1 合わない）・型の寄り。原価の数は置き値（原価率30〜40%に収まるように：e.8）
  const NOODLE = {
    thin: { label: '細麺', cost: 40, q: 0.05, fit: { office: 1, student: -1 } },
    mid: { label: '中太麺', cost: 45, q: 0, fit: {} },
    thick: { label: '太麺', cost: 55, q: 0.05, fit: { student: 1, office: -1 } },
  };
  const SRC = { ready: { label: '既製の麺', cost: 0, q: 0 }, custom: { label: '製麺所の特注', cost: 15, q: 0.3 } };
  const SOUP = {
    shoyu: { label: 'しょうゆ', cost: 110, q: 0, fit: { family: 1, tourist: 1 }, lean: 'normal' },
    shio: { label: 'しお', cost: 105, q: 0.05, fit: { family: 1, office: 1 }, lean: 'normal' },
    miso: { label: 'みそ', cost: 120, q: 0, fit: { student: 1, family: 1 }, lean: 'normal' },
    tonkotsu: { label: 'とんこつ', cost: 145, q: 0.25, fit: { student: 1, office: 1, family: -1 }, lean: 'kodawari' },
  };
  const TOP = {
    chashu: { label: 'チャーシュー', cost: 60, q: 0.2, fit: { student: 1 } },
    ajitama: { label: '味玉', cost: 30, q: 0.1, fit: {} },
    yasai: { label: '野菜', cost: 25, q: 0, fit: { family: 1 } },
    nori: { label: '海苔', cost: 10, q: 0, fit: { tourist: 1 } },
  };
  const BASE_COST = 45, BASE_Q = 2.7; // ねぎ・器・割りばしなど／何も足さない一杯の品質
  const parts = (spec) => [NOODLE[spec.noodle], SRC[spec.src || 'ready'], SOUP[spec.soup], ...(spec.top || []).map((k) => TOP[k])].filter(Boolean);
  const cost = (b) => BASE_COST + parts(b.spec).reduce((t, x) => t + x.cost, 0);
  const Qb = (b) => BASE_Q + parts(b.spec).reduce((t, x) => t + (x.q || 0), 0);
  // 客層との相性（d.2 fit）：好きが2つ以上で ◎ +0.10、合わないが好きより多ければ △ −0.05、ほかは ○ 0
  const fitScore = (b, seg) => parts(b.spec).reduce((t, x) => t + ((x.fit || {})[seg] || 0), 0);
  const fit = (b, seg) => { const s = fitScore(b, seg); return s >= 2 ? C('fitGood') : s < 0 ? C('fitBad') : 0; };
  const fitMark = (b, seg) => { const s = fitScore(b, seg); return s >= 2 ? '◎' : s < 0 ? '△' : '○'; };
  // 社長の案3つ（X28：1周目は社長の案から直す）
  const presets = [
    { id: 'shoyu', name: '中華そば', spec: { noodle: 'mid', src: 'ready', soup: 'shoyu', top: ['chashu', 'ajitama', 'nori'] }, say: '昔ながらのしょうゆ。だれにでも合う' },
    { id: 'tonkotsu', name: '濃厚とんこつ', spec: { noodle: 'thin', src: 'custom', soup: 'tonkotsu', top: ['chashu', 'nori'] }, say: '特注の細麺で、こだわりの一杯。材料の値段は高い' },
    { id: 'miso', name: 'みそ大盛り', spec: { noodle: 'thick', src: 'ready', soup: 'miso', top: ['yasai', 'chashu'] }, say: '野菜たっぷりの太麺。学生と家族向け' },
  ];
  const create = (spec, name) => ({ spec: JSON.parse(JSON.stringify(spec)), name: name || '', Fbase: 1, peak: 0, peak0: 0, peakLeft: 0, age: 0, tweakAt: null, limitedN: 0 });
  const F = (b) => Math.max(0.3, (b.Fbase || 1) + (b.peak || 0));
  // Q は一杯の品質（店の人の余裕などは engine の外で足す余地）。s は店（ライバルは Q を持つ）
  const Q = (b, s) => (s && s.Q != null ? s.Q : Qb(b));
  // 話題の山：当たり20・普通50・外れ30（d.8）。kind：tweak（手直し。3か月に1回）・limited（限定）・new（新しい一杯：基準を1.0に戻す）
  function apply(b0, kind, rng, t) {
    const b = JSON.parse(JSON.stringify(b0));
    const [w1, w2] = C('peakW'), x = rng() * 100;
    const h = x < w1 ? C('peakHit') : x < w1 + w2 ? C('peakMid') : C('peakMiss');
    if (kind === 'new') { b.Fbase = 1; b.age = 0; }
    if (kind === 'tweak') b.tweakAt = t;
    if (kind === 'limited') b.limitedN = (b.limitedN || 0) + 1;
    b.peak = h; b.peak0 = h; b.peakLeft = C('peakMonths');
    b.lastPeak = { kind, h: x < w1 ? 'hit' : x < w1 + w2 ? 'mid' : 'miss' };
    return b;
  }
  // 1か月：山は差の1/4ずつ元へ。基準は13か月目から −1.5%/月（段0は半分、常連が3割以上の店も半分）、下限0.6
  function step(b0, o = {}) {
    const b = JSON.parse(JSON.stringify(b0));
    b.age = (b.age || 0) + 1;
    if (b.peakLeft > 0) { b.peak = Math.max(0, b.peak - b.peak0 / C('peakMonths')); b.peakLeft -= 1; if (!b.peakLeft) b.peak = 0; }
    if (b.age >= C('decayStart')) {
      let r = C('decay');
      if (o.tier === 0) r *= C('decayTier0');
      if ((o.regShare || 0) >= 0.3) r *= 0.5;
      b.Fbase = Math.max(C('decayFloor'), b.Fbase * (1 - r));
    }
    return b;
  }
  const label = (spec) => `${SOUP[spec.soup].label}・${NOODLE[spec.noodle].label}（${SRC[spec.src || 'ready'].label}）・${(spec.top || []).map((k) => TOP[k].label).join('・') || '具なし'}`;
  SIM.bowl = { NOODLE, SRC, SOUP, TOP, presets, create, cost, Q, Qb, fit, fitMark, fitScore, F, apply, step, label };
})(typeof window !== 'undefined' ? window : globalThis);
