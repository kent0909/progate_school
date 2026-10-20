// 遊びの検査（プレイテスト）の記録係。検査する人は、ゲームをこの道具を通してだけ操作する。
// すべての操作（押した所・ねらい・その前後のゲームの状態・画面写真の sha256）と、その場の気持ちを log.jsonl に1行ずつ残す。
// 各行は1つ前の行の sha256 を持つ（あとから書き換えると鎖が切れる）。persona.md（人物像）と knowledge.md（前提知識の棚卸し）は最初に開いた時点で固定され、あとから変えると開けない。
// 検証は verify.js（ログの鎖・ペルソナ・画面写真・報告の引用・会話記録の時刻との突き合わせ）。
//
// 使い方（検査する人のスクリプトの中で）：
//   const H = require('/home/user/progate_school/boki2/tools/playtest/harness.js');
//   const s = await H.open('<作業フォルダ>', { viewport: { width: 375, height: 760 } });
//   await s.read();                          // 画面の文字を読む（戻り値は文字。ログには sha256）
//   await s.click('[data-go]', 'ねらい');     // 押す。ねらい（なぜ押すか）は必ず書く
//   await s.fill('input[data-s="dr"]', '1000', 'ねらい'); await s.select('select…', '普通預金', 'ねらい');
//   await s.feel('いま、ここで分からなくなった');  // その場の気持ち（あとで書かない）
//   await s.shot('名前');                      // 画面写真（操作のたびにも自動で撮る）
//   await s.auto({ months: 2 }, 'ねらい');     // 長い区間を自動で進める（自動の区間もログに残る）
//   await s.close();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const autoRun = require('./auto.js');

const GAME = '/tmp/claude-0/-home-user-progate-school/0f5c124a-6604-5e69-b554-2beafc4f2038/scratchpad/review/game.html';
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const fileSha = (f) => sha(fs.readFileSync(f));

exports.GAME = GAME;
exports.open = async function open(dir, { viewport = { width: 375, height: 760 }, colorScheme = 'light', reset = false } = {}) {
  dir = path.resolve(dir);
  const persona = path.join(dir, 'persona.md');
  if (!fs.existsSync(persona)) throw new Error('persona.md がない。遊ぶ前に、人物像を書いて固定すること');
  const knowledge = path.join(dir, 'knowledge.md');
  if (!fs.existsSync(knowledge)) throw new Error('knowledge.md がない。遊ぶ前に、前提知識の棚卸しを書いて固定すること');
  const logFile = path.join(dir, 'log.jsonl');
  const shots = path.join(dir, 'shots');
  fs.mkdirSync(shots, { recursive: true });
  const lines = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean) : [];
  const personaSha = fileSha(persona), knowledgeSha = fileSha(knowledge);
  const first = lines.length ? JSON.parse(lines[0]) : null;
  if (first && first.persona_sha !== personaSha) throw new Error('persona.md が、最初に遊んだときから変わっている。人物像は遊ぶ前に固定する（変えたいときは、遊んだあとの気づきを report.md に書く）');
  if (first && first.knowledge_sha !== knowledgeSha) throw new Error('knowledge.md が、最初に遊んだときから変わっている。前提知識は遊ぶ前に固定する');
  let prev = lines.length ? sha(lines[lines.length - 1]) : '0';
  let n = lines.length;
  const sid = crypto.randomBytes(6).toString('hex');
  const write = (o) => {
    const line = JSON.stringify(Object.assign({ n: n++, t: new Date().toISOString(), sid, prev }, o));
    fs.appendFileSync(logFile, line + '\n');
    prev = sha(line);
    return n - 1;
  };
  const ctx = await chromium.launchPersistentContext(path.join(dir, 'profile'), { executablePath: '/opt/pw-browsers/chromium', viewport, colorScheme });
  const p = ctx.pages()[0] || (await ctx.newPage());
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + GAME);
  if (reset) { await p.evaluate(() => localStorage.clear()); await p.reload(); }
  write({ kind: 'session', game_sha: fileSha(GAME), harness_sha: fileSha(__filename), auto_sha: fileSha(path.join(__dirname, 'auto.js')), persona_sha: personaSha, knowledge_sha: knowledgeSha, viewport, colorScheme, reset });
  const state = () => p.evaluate(() => { try { const S = window.__sim.S; const ev = (window.__sim.events() || [])[S.ei]; return { mi: S.mi, ei: S.ei, phase: S.phase, ev: ev ? `${ev.t}:${ev.id || ''}` : null, label: (document.querySelector('.s-month b') || document.querySelector('.s-head b') || {}).textContent || '' }; } catch (e) { return { err: String(e).slice(0, 80) }; } });
  let shotN = fs.readdirSync(shots).length;
  const shoot = async (label) => {
    const f = path.join(shots, `${String(++shotN).padStart(4, '0')}-${String(label || '').replace(/[^\w぀-ヿ一-鿿-]+/g, '_').slice(0, 40)}.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 55 });
    return { file: path.relative(dir, f), sha: fileSha(f) };
  };
  const act = async (kind, sel, why, fn) => {
    if (!why || String(why).trim().length < 4) throw new Error('ねらい（なぜその操作をするか）を4字以上で書くこと');
    const before = await state();
    await fn();
    await p.waitForTimeout(120);
    const after = await state();
    const shot = await shoot(kind);
    return write({ kind, sel, why, before, after, shot, errs: errs.splice(0) });
  };
  return {
    page: p,
    async read() { const txt = await p.evaluate(() => document.body.innerText); write({ kind: 'read', state: await state(), text_sha: sha(txt), chars: txt.length }); return txt; },
    click: (sel, why) => act('click', sel, why, () => p.click(sel)),
    fill: (sel, v, why) => act('fill', sel, why, () => p.fill(sel, String(v))),
    select: (sel, v, why) => act('select', sel, why, () => p.selectOption(sel, v)),
    press: (key, why) => act('press', key, why, () => p.keyboard.press(key)),
    async feel(text) { if (!text || text.length < 6) throw new Error('気持ちは6字以上で'); return write({ kind: 'feel', text, state: await state() }); },
    async shot(label) { return write({ kind: 'shot', label, state: await state(), shot: await shoot(label) }); },
    async auto(opts = {}, why) {
      if (!why) throw new Error('自動で進めるねらいを書くこと');
      const start = await state();
      const startMi = start.mi;
      const stopWhen = opts.until ? opts.until : opts.months ? async (pg) => (await pg.evaluate(() => window.__sim.S.mi)) >= startMi + opts.months : null;
      const id = write({ kind: 'auto-start', why, opts: { months: opts.months || null, choose: opts.choose || {}, broad: !!opts.broad, maxSteps: opts.maxSteps || 400 }, state: start });
      let k = 0;
      const r = await autoRun(p, { choose: opts.choose || {}, broad: !!opts.broad, maxSteps: opts.maxSteps || 400, stopWhen, onStep: async () => { if (++k % 20 === 0) write({ kind: 'auto-step', of: id, state: await state() }); }, shot: async (nm) => { write({ kind: 'auto-shot', of: id, shot: await shoot(nm) }); } });
      write({ kind: 'auto-end', of: id, result: { steps: r.steps, stopped: !!r.stopped, end: !!r.end, stuck: r.stuck || null }, state: await state(), shot: await shoot('auto-end') });
      return r;
    },
    async close() { write({ kind: 'close', state: await state(), errs: errs.splice(0) }); await ctx.close(); },
  };
};
