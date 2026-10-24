// 保存の層。端末の中（localStorage）には毎回すぐ保存し、claude.ai の公開ページとして開かれているときは
// ページの保存機能（Artifact の db）にも少し遅らせて保存する。別の端末で開くと、新しいほうの続きを読み込む。
// 遊ぶ人（プロフィール）ごとに保存を分ける。確認テストの結果は testlogs/<id>/ に残し、オーナーだけが読める。
// 仕組みと手順は docs/STORAGE.md。
(function (g) {
  const B = (g.BOKI = g.BOKI || {});
  const ST = (B.store = {});
  const PKEY = 'boki2sim.profiles';
  const CHUNK = 180000; // db の1文書は 256KiB まで。保存データは文字列にして分けて置く
  let db = null, uid = null, mode = 'local', lastErr = '', localError = '', bookmarkTrimmed = 0;
  let profiles = { list: [{ id: 'p1', name: '' }], current: 'p1' };
  const listeners = [];
  const local = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  };
  try { const raw = local.get(PKEY); if (raw) profiles = Object.assign(profiles, JSON.parse(raw)); } catch (e) { /* 既定のまま */ }
  const keyOf = (base) => (profiles.current === 'p1' ? base : `${base}.${profiles.current}`); // 最初の人は以前の保存をそのまま使う
  const emit = () => listeners.forEach((f) => { try { f(ST.status()); } catch (e) { /* ignore */ } });

  ST.onStatus = (f) => listeners.push(f);
  ST.status = () => ({ mode, error: lastErr, localError, bookmarkTrimmed, profile: profiles.list.find((p) => p.id === profiles.current) || profiles.list[0], profiles: profiles.list });

  // ---------- プロフィール（同じ端末・同じアカウントで、何人かが遊ぶとき） ----------
  ST.profiles = () => profiles.list.slice();
  ST.currentProfile = () => profiles.current;
  ST.addProfile = (name) => {
    const id = 'p' + (Math.max(0, ...profiles.list.map((p) => Number(p.id.slice(1)) || 0)) + 1);
    profiles.list.push({ id, name: String(name || '').slice(0, 20) });
    profiles.current = id;
    local.set(PKEY, JSON.stringify(profiles));
    syncProfiles();
    return id;
  };
  ST.renameProfile = (id, name) => { const p = profiles.list.find((x) => x.id === id); if (p) { p.name = String(name || '').slice(0, 20); local.set(PKEY, JSON.stringify(profiles)); syncProfiles(); } };
  ST.switchProfile = (id) => { if (profiles.list.some((p) => p.id === id)) { profiles.current = id; local.set(PKEY, JSON.stringify(profiles)); } };

  // ---------- 遊びの保存 ----------
  ST.loadLocal = (base) => { const raw = local.get(keyOf(base)); if (!raw) return null; try { return JSON.parse(raw); } catch (e) { return null; } };
  let pending = null, timer = null, lastSent = '';
  const localSaveNotice = failed => {
    if(!g.document || !g.document.body)return;
    let el=g.document.getElementById('boki-save-error');
    if(failed&&!el){el=g.document.createElement('div');el.id='boki-save-error';el.setAttribute('role','alert');el.style.cssText='position:sticky;top:0;z-index:10000;padding:12px;background:#fff1bd;color:#6b1a00;font-weight:bold;text-align:center';g.document.body.prepend(el);}
    if(el){el.textContent=failed?'保存できませんでした（容量がいっぱいです）':'';el.hidden=!failed;}
  };
  ST.save = (base, state) => {
    state.savedAt = Date.now();
    const json = JSON.stringify(state);
    const ok=local.set(keyOf(base), json);
    localError=ok?'':'保存できませんでした（容量がいっぱいです）';localSaveNotice(!ok);emit();
    if (mode !== 'cloud') return ok;
    pending = { base, json, slot: profiles.current };
    clearTimeout(timer);
    timer = setTimeout(flush, 4000);
    return ok;
  };
  async function flush() {
    if (!pending || !db || !uid) return;
    const { base, json, slot } = pending;
    pending = null;
    if (json === lastSent) return;
    try {
      const n = Math.ceil(json.length / CHUNK);
      for (let i = 0; i < n; i++) await db.doc(`data/users/${uid}/${docName(base, slot)}_${i}`).set({ part: i, data: json.slice(i * CHUNK, (i + 1) * CHUNK) });
      await db.doc(`data/users/${uid}/${docName(base, slot)}`).set({ n, savedAt: JSON.parse(json).savedAt, v: 1 });
      lastSent = json; lastErr = ''; mode = 'cloud';
    } catch (e) { lastErr = (e && e.code) || 'error'; mode = 'cloud-error'; }
    emit();
  }
  const body = (snap) => (snap && snap.exists ? snap.data() || null : null);
  const docName = (base, slot) => `save_${base.replace(/[^\w]/g, '_')}_${slot}`;
  if (g.addEventListener) g.addEventListener('pagehide', () => { if (pending) flush(); });

  // 公開ページの保存機能につなぐ。新しいほうの続きがクラウドにあれば onNewer(state) を呼ぶ
  ST.connect = async (base, onNewer) => {
    if (!(g.claude && g.claude.use)) return;
    try {
      const [d, u] = await Promise.all([g.claude.use('db'), g.claude.use('user')]);
      if (!d || !u) return;
      const id = await u.id();
      if (!id) return;
      db = d; uid = id; mode = 'cloud'; emit();
      await pullProfiles();
      const meta = await db.doc(`data/users/${uid}/${docName(base, profiles.current)}`).get();
      const m = body(meta);
      const here = ST.loadLocal(base);
      if (m && m.n && (!here || (m.savedAt || 0) > (here.savedAt || 0))) {
        let json = '';
        for (let i = 0; i < m.n; i++) { const cd = body(await db.doc(`data/users/${uid}/${docName(base, profiles.current)}_${i}`).get()); json += (cd && cd.data) || ''; }
        try { const st = JSON.parse(json); local.set(keyOf(base), json); onNewer(st); } catch (e) { /* 壊れていたら端末の保存を使う */ }
      }
    } catch (e) { lastErr = (e && e.code) || 'error'; mode = 'cloud-error'; emit(); }
  };
  async function pullProfiles() {
    try {
      const d = body(await db.doc(`data/users/${uid}/profiles`).get());
      if (d && Array.isArray(d.list)) {
        for (const p of d.list) if (!profiles.list.some((x) => x.id === p.id)) profiles.list.push(p);
        local.set(PKEY, JSON.stringify(profiles));
      } else syncProfiles();
    } catch (e) { /* ignore */ }
  }
  function syncProfiles() { if (db && uid) db.doc(`data/users/${uid}/profiles`).set({ list: profiles.list }).catch(() => {}); }

  // ---------- 端末をまたぐ手動の引っ越し（アカウントなしでも使える） ----------
  ST.exportText = (base) => local.get(keyOf(base)) || '';
  ST.importText = (base, text) => { const st = JSON.parse(text); if (!st || typeof st !== 'object' || !('mi' in st || (st.v === 4 && st.meta && Array.isArray(st.slots)))) throw new Error('bad'); local.set(keyOf(base), JSON.stringify(st)); return st; };
  ST.download = async (filename, text) => {
    try { const dl = g.claude && g.claude.use ? await g.claude.use('downloads') : null; if (dl) { await dl.save({ filename, data: text }); return true; } } catch (e) { /* 断られたら下の方法 */ }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = filename; a.click(); return true; } catch (e) { return false; }
  };

  // ---------- 保存の v4（ラーメン版。DESIGN-ROUND2 3.10・DESIGN-RAMEN k.3・k.6）----------
  // 形：{ v:4, meta:{…全スロットで共有：学びの記録・成長・検定会場・条件A・周の記録・屋号と名前・受験日…}, slots:[{ id, label, savedAt, run:{…その周の状態：帳簿・月・判断・choices・seed・W…} }], cur }
  // engine は今までどおり1枚の S で動き、保存のときに meta と run に分ける（split）・読むときに合わせる（compose）。
  // セーブスロットは3つ以上（n.15）。meta（examLog・成長・S.plan など）はスロットをまたいで共有、run はスロットごと。
  // v3（ピヨ商店・レモネード）の保存はそのまま残し（index.html が読む）、v4 を初めて作るとき学びの記録だけ meta に写す（fromV3）
  const V4 = (ST.v4 = {});
  V4.SLOTS = 3;
  V4.META = ['examLog', 'growth', 'speedLog', 'speedRuns', 'plan', 'hall', 'profile', 'profileOk', 'mode', 'modeOk', 'furigana', 'textScale', 'examExtra', 'examDate', 'scopeMet', 'runs'];
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  // 6386215737：ラーメンv4だけ、直近3件と結末が必要とする戻り先を保持する。
  V4.bookmarkLimit=3;
  V4.pruneBookmarks = bm => {
    const entries=Object.entries(bm||{}).filter(([,v])=>v&&typeof v==='object');
    const pinned=new Set(Object.values(g.SIMDATA?.endings||{}).map(e=>e.back).filter(Boolean));
    const recent=entries.filter(([id])=>!pinned.has(id)).sort((a,b)=>(a[1].mi||0)-(b[1].mi||0)||(a[1].ei||0)-(b[1].ei||0)).slice(-V4.bookmarkLimit);
    return Object.fromEntries(entries.filter(([id])=>pinned.has(id)).concat(recent).map(([id,v])=>{const {drafts,...snapshot}=v;return [id,snapshot];}));
  };
  V4.SAVE_BUDGET=2*1024*1024;
  V4.encodedBytes=x=>JSON.stringify(x).length*2; // localStorage向けの保守的なUTF-16換算
  const bookmarkNotice=n=>{
    bookmarkTrimmed+=n;
    if(!g.document?.body)return;
    let el=g.document.getElementById('boki-bookmark-note');
    if(!el){el=g.document.createElement('div');el.id='boki-bookmark-note';el.setAttribute('role','status');el.style.cssText='padding:10px;background:#edf5fa;color:#183c50;text-align:center';g.document.body.prepend(el);}
    el.textContent='保存の容量を空けるため、古い栞を減らしました。必要な戻り先は残っています。';
  };
  V4.compactDoc = d => {
    for(const slot of d.slots||[])if(slot.run)slot.run={...slot.run,bm:V4.pruneBookmarks(slot.run.bm)};
    const pinned=new Set(Object.values(g.SIMDATA?.endings||{}).map(e=>e.back).filter(Boolean));
    const optional=(d.slots||[]).flatMap(slot=>Object.entries(slot.run?.bm||{}).filter(([id])=>!pinned.has(id)).map(([id,snap])=>({slot,id,snap}))).sort((a,b)=>(a.snap.mi||0)-(b.snap.mi||0)||(a.snap.ei||0)-(b.snap.ei||0));
    let removed=0;
    while(V4.encodedBytes(d)>V4.SAVE_BUDGET&&optional.length){const x=optional.shift();delete x.slot.run.bm[x.id];removed++;}
    if(removed)bookmarkNotice(removed);
    return d;
  };
  V4.empty = () => ({ v: 4, meta: { examLog: [], growth: [], runs: [], scopeMet: {}, examDate: null }, slots: [...Array(V4.SLOTS).keys()].map((i) => ({ id: `s${i + 1}`, label: '', savedAt: 0, run: null })), cur: 's1' });
  // v3 の保存から学びの記録（成長・検定会場・examLog・予定表・設定）だけを meta に。レモネードの会社（run）は写さない（n.9：レモネードを開く入口は作らない）
  V4.fromV3 = (v3) => {
    const d = V4.empty();
    if (!v3 || typeof v3 !== 'object') return d;
    for (const k of V4.META) if (v3[k] !== undefined && k !== 'profile' && k !== 'profileOk') d.meta[k] = clone(v3[k]);
    d.meta.examLog = (v3.examLog || []).map((x) => ({ ...x, src: x.src || 'v3' }));
    d.meta.fromV3 = { at: Date.now(), mi: v3.mi || 0, examLog: (v3.examLog || []).length, growth: (v3.growth || []).length };
    return d;
  };
  V4.isV4 = (d) => !!(d && d.v === 4 && d.meta && Array.isArray(d.slots));
  // 読む：v4 があればそれ、なければ v3 から作る（v3 は消さない）
  V4.load = (base, v3base) => {
    const raw = ST.loadLocal(base);
    if (V4.isV4(raw)) { while (raw.slots.length < V4.SLOTS) raw.slots.push({ id: `s${raw.slots.length + 1}`, label: '', savedAt: 0, run: null }); return V4.compactDoc(raw); }
    return V4.fromV3(v3base ? ST.loadLocal(v3base) : null);
  };
  // 1枚の S（engine の形）に合わせる。slot が空なら run は {}
  V4.compose = (d, slotId) => {
    V4.compactDoc(d);
    const sl = d.slots.find((x) => x.id === (slotId || d.cur)) || d.slots[0];
    return Object.assign({}, clone(sl.run) || {}, clone(d.meta), { __slot: sl.id });
  };
  // 1枚の S を meta と run に分けて d に書き戻す（新しい d を返す）
  V4.split = (d, S, label) => {
    const out = clone(d) || V4.empty();
    const meta = {}, run = {};
    for (const [k, v] of Object.entries(S)) { if (k === '__slot' || k === 'savedAt') continue; if (V4.META.includes(k)) meta[k] = v; else run[k] = v; }
    out.meta = Object.assign(out.meta || {}, clone(meta));
    const id = S.__slot || out.cur, sl = out.slots.find((x) => x.id === id) || out.slots[0];
    run.bm=V4.pruneBookmarks(run.bm);
    sl.run = clone(run); sl.savedAt = Date.now(); if (label != null) sl.label = label;
    out.cur = sl.id;
    return V4.compactDoc(out);
  };
  V4.clearSlot = (d, id) => { const out = clone(d); const sl = out.slots.find((x) => x.id === id); if (sl) { sl.run = null; sl.label = ''; sl.savedAt = 0; } return out; };
  // 判断の履歴（S.run.choices）。前の周の自分（f.1）と周のふりかえりに使う
  V4.choice = (S, c) => { (S.choices = S.choices || []).push(Object.assign({ t: Date.now() }, c)); };

  // ---------- 確認テストの記録 ----------
  const TKEY = 'boki2sim.testlogs';
  ST.testLogs = () => { try { return JSON.parse(local.get(TKEY) || '[]'); } catch (e) { return []; } };
  ST.saveTest = async (run) => {
    const all = ST.testLogs().filter((r) => r.id !== run.id).concat([run]);
    local.set(TKEY, JSON.stringify(all));
    if (!db || !uid) return 'local';
    try { await db.doc(`testlogs/${uid}/runs/${run.id}`).set(run); return 'cloud'; } catch (e) { lastErr = (e && e.code) || 'error'; return 'local'; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
