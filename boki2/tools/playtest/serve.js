#!/usr/bin/env node
// 記録係（harness.js）を開いたままにする窓口。1回の Bash ごとにブラウザを開き直すと、打ちかけの金額やプロローグの途中が消えるため。
// ログは記録係が書く（このファイルは書かない）。ログの行は、検査する人のコマンド（do）が待っている間にだけ書かれる。
// 開いたまま30分なにもしないと、ログを書かずにブラウザを閉じる（次は start からやり直す。ゲームの保存は残る）。
//
// 使い方（検査する人の Bash で）：
//   node serve.js start <作業フォルダ> '{"viewport":{"width":390,"height":844},"reset":true}'   … 開く（reset は最初の1回だけ）
//   node serve.js do <作業フォルダ> read                                  … 引数のない操作
//   node serve.js do <作業フォルダ> click '[data-go]' 'ねらい'             … 引数はそのまま並べる（harness の関数と同じ順）
//   node serve.js do <作業フォルダ> feel 'いま分からなくなった'
//   node serve.js do <作業フォルダ> auto '{"months":1}' 'ねらい'           … JSON に見える引数は JSON として渡す
//   node serve.js stop <作業フォルダ>                                     … 閉じる（close がログに残る）
// 結果は1行の JSON で返る（{ok:true, value} か {ok:false, error}）。read・glance・a11y の value は画面の文字。
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const crypto = require('crypto');

const [, , cmd, dirArg, ...rest] = process.argv;
if (!cmd || !dirArg) { console.error('Usage: node serve.js start|do|stop <作業フォルダ> ...'); process.exit(1); }
const dir = path.resolve(dirArg);
// unix の socket の名前は108字までなので、短い場所に置く
const sockDir = '/tmp/piyo-socks';
const sock = path.join(sockDir, crypto.createHash('sha256').update(dir).digest('hex').slice(0, 16) + '.sock');
const IDLE_MS = 30 * 60 * 1000;

const send = (msg) => new Promise((resolve, reject) => {
  const c = net.connect(sock);
  let buf = '';
  c.on('connect', () => c.write(JSON.stringify(msg) + '\n'));
  c.on('data', (d) => { buf += d; if (buf.includes('\n')) { c.end(); resolve(JSON.parse(buf.split('\n')[0])); } });
  c.on('error', reject);
});

async function daemon(opts) {
  const H = require('./harness.js');
  let s;
  try { s = await H.open(dir, opts); } catch (e) { fs.writeFileSync(sock + '.ready', JSON.stringify({ ok: false, error: e.message })); process.exit(1); }
  let timer;
  const idle = () => { clearTimeout(timer); timer = setTimeout(() => process.exit(0), IDLE_MS); };
  let queue = Promise.resolve();
  const server = net.createServer((c) => {
    let buf = '';
    c.on('data', (d) => {
      buf += d; if (!buf.includes('\n')) return;
      const msg = JSON.parse(buf.split('\n')[0]);
      // 1つずつ順に動かす（同時に押したことにならないように）
      queue = queue.then(async () => {
        idle();
        let out;
        try {
          if (msg.op === 'close') { await s.close(); out = { ok: true, value: 'closed' }; }
          else if (typeof s[msg.op] !== 'function') out = { ok: false, error: `そんな操作はない：${msg.op}` };
          else out = { ok: true, value: await s[msg.op](...(msg.args || [])) };
        } catch (e) { out = { ok: false, error: String(e.message || e).slice(0, 500) }; }
        c.end(JSON.stringify(out) + '\n');
        if (msg.op === 'close') { server.close(); try { fs.unlinkSync(sock); } catch (e) {} process.exit(0); }
      });
    });
  });
  server.listen(sock, () => { idle(); fs.writeFileSync(sock + '.ready', JSON.stringify({ ok: true })); });
}

(async () => {
  if (cmd === '_daemon') return daemon(JSON.parse(rest[0] || '{}'));
  if (cmd === 'start') {
    fs.mkdirSync(sockDir, { recursive: true });
    if (fs.existsSync(sock)) { try { await send({ op: 'shot', args: ['生きているか'] }); console.log(JSON.stringify({ ok: false, error: 'もう開いている。stop してから start する' })); process.exit(1); } catch (e) { fs.unlinkSync(sock); } }
    try { fs.unlinkSync(sock + '.ready'); } catch (e) {}
    const ch = spawn(process.execPath, [__filename, '_daemon', dir, rest[0] || '{}'], { detached: true, stdio: 'ignore', env: process.env });
    ch.unref();
    // session の行が書かれる（＝開き終わる）まで待つ。これで session の行は、この Bash の呼び出しの中に入る
    for (let i = 0; i < 600; i++) {
      if (fs.existsSync(sock + '.ready')) { const r = fs.readFileSync(sock + '.ready', 'utf8'); console.log(r); process.exit(JSON.parse(r).ok ? 0 : 1); }
      await new Promise((r) => setTimeout(r, 100));
    }
    console.log(JSON.stringify({ ok: false, error: '開くのに時間がかかりすぎた' })); process.exit(1);
  }
  if (!fs.existsSync(sock)) { console.log(JSON.stringify({ ok: false, error: '開いていない。start から' })); process.exit(1); }
  const args = rest.slice(1).map((a) => { if (/^[\[{]/.test(a) || /^-?\d+(\.\d+)?$/.test(a)) { try { return JSON.parse(a); } catch (e) { /* セレクタ（[data-go] など）はそのまま */ } } return a; });
  const msg = cmd === 'stop' ? { op: 'close' } : cmd === 'do' ? { op: rest[0], args } : null;
  if (!msg) { console.error('start|do|stop のどれか'); process.exit(1); }
  const r = await send(msg);
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
})();
