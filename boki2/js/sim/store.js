// 保存の層。端末の中（localStorage）には毎回すぐ保存し、claude.ai の公開ページとして開かれているときは
// ページの保存機能（Artifact の db）にも少し遅らせて保存する。別の端末で開くと、新しいほうの続きを読み込む。
// 遊ぶ人（プロフィール）ごとに保存を分ける。確認テストの結果は testlogs/<id>/ に残し、オーナーだけが読める。
// 仕組みと手順は docs/STORAGE.md。
(function (g) {
  const B = (g.BOKI = g.BOKI || {});
  const ST = (B.store = {});
  const PKEY = 'boki2sim.profiles';
  const CHUNK = 180000; // db の1文書は 256KiB まで。保存データは文字列にして分けて置く
  let db = null, uid = null, mode = 'local', lastErr = '';
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
  ST.status = () => ({ mode, error: lastErr, profile: profiles.list.find((p) => p.id === profiles.current) || profiles.list[0], profiles: profiles.list });

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
  ST.save = (base, state) => {
    state.savedAt = Date.now();
    const json = JSON.stringify(state);
    local.set(keyOf(base), json);
    if (mode !== 'cloud') return;
    pending = { base, json, slot: profiles.current };
    clearTimeout(timer);
    timer = setTimeout(flush, 4000);
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
  ST.importText = (base, text) => { const st = JSON.parse(text); if (!st || typeof st !== 'object' || !('mi' in st)) throw new Error('bad'); local.set(keyOf(base), JSON.stringify(st)); return st; };
  ST.download = async (filename, text) => {
    try { const dl = g.claude && g.claude.use ? await g.claude.use('downloads') : null; if (dl) { await dl.save({ filename, data: text }); return true; } } catch (e) { /* 断られたら下の方法 */ }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = filename; a.click(); return true; } catch (e) { return false; }
  };

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
