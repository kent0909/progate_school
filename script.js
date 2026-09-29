// ============================================================
// EigoBit - シャドーイング / 瞬間英作文 / シナリオ英会話
// ============================================================

const app = document.getElementById("app");
const STORAGE_KEY = "eigobit-v1";

// ------------------------------------------------------------
// 保存データ
// ------------------------------------------------------------
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { history: data.history || [], best: data.best || {} };
    }
  } catch (e) {
    // 読み込めない場合は初期状態で始める
  }
  return { history: [], best: {} };
}

let store = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // 保存できない環境（プライベートモード等）では記録なしで動作
  }
}

function recordPractice(type, id, title, score) {
  store.history.push({ date: todayKey(), ts: Date.now(), type, id, title, score });
  if (!(id in store.best) || score > store.best[id]) {
    store.best[id] = score;
  }
  saveData();
  updateHeader();
}

function dateKey(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function todayKey() {
  return dateKey(new Date());
}

function calcStreak() {
  const days = new Set(store.history.map((h) => h.date));
  const d = new Date();
  if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function average(nums) {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function updateHeader() {
  document.getElementById("header-streak").textContent = `🔥 ${calcStreak()}日`;
}

// ------------------------------------------------------------
// 共通ユーティリティ
// ------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreClass(score) {
  if (score >= 80) return "score-good";
  if (score >= 50) return "score-mid";
  return "score-bad";
}

function scoreComment(score) {
  if (score >= 90) return "Excellent! 完璧です！";
  if (score >= 80) return "Great! とても良いです";
  if (score >= 60) return "Good! あと一歩です";
  if (score >= 40) return "Nice try! 赤い単語を意識しましょう";
  return "もう一度お手本を聞いてみましょう";
}

// 画面切り替え時に後片付けする処理（タイマー・録音など）
let cleanups = [];

function addCleanup(fn) {
  cleanups.push(fn);
}

function runCleanups() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  stopSpeaking();
  stopListening();
}

// ------------------------------------------------------------
// テキストの正規化と採点
// ------------------------------------------------------------
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberToWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
  return String(n);
}

const CONTRACTIONS = [
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bwon't\b/g, "will not"],
  [/\bshan't\b/g, "shall not"],
  [/\blet's\b/g, "let us"],
  [/\bi'm\b/g, "i am"],
  [/\b(it|that|what|there|here|he|she)'s\b/g, "$1 is"],
  [/n't\b/g, " not"],
  [/'re\b/g, " are"],
  [/'ve\b/g, " have"],
  [/'ll\b/g, " will"],
  [/'d\b/g, " would"]
];

// 比較用に単語の配列へ変換する
function tokenize(text) {
  let t = text.toLowerCase().replace(/[’‘`]/g, "'");
  t = t.replace(/(\d+)\s*%/g, "$1 percent");
  CONTRACTIONS.forEach(([re, rep]) => {
    t = t.replace(re, rep);
  });
  t = t.replace(/\d+/g, (m) => numberToWords(parseInt(m, 10)));
  t = t.replace(/\bokay\b/g, "ok");
  return t.split(/[^a-z0-9']+/).map((w) => w.replace(/^'+|'+$/g, "")).filter(Boolean);
}

// 最長共通部分列（LCS）で、お手本のどの単語が言えたかを求める
function lcsMatch(ref, hyp) {
  const n = ref.length;
  const m = hyp.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = ref[i] === hyp[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matched = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ref[i] === hyp[j]) {
      matched[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { count: dp[0][0], matched };
}

// お手本と発話を比べて点数と単語ごとの判定を返す
function evaluate(reference, spoken) {
  const words = reference.split(/\s+/).filter(Boolean);
  const refTokens = [];
  const owner = [];
  words.forEach((w, idx) => {
    tokenize(w).forEach((tok) => {
      refTokens.push(tok);
      owner.push(idx);
    });
  });
  const hypTokens = tokenize(spoken);
  const { count, matched } = lcsMatch(refTokens, hypTokens);

  const wordOk = words.map(() => true);
  matched.forEach((ok, k) => {
    if (!ok) wordOk[owner[k]] = false;
  });

  const total = refTokens.length + hypTokens.length;
  const score = total === 0 ? 0 : Math.round((200 * count) / total);
  return { score, words, wordOk };
}

function diffHtml(result) {
  return result.words
    .map((w, i) => `<span class="${result.wordOk[i] ? "w-ok" : "w-miss"}">${escapeHtml(w)}</span>`)
    .join(" ");
}

function resultHtml(result, spoken) {
  return `
    <div class="result">
      <div class="score-circle ${scoreClass(result.score)}">
        <span class="num">${result.score}</span><span class="unit">点</span>
      </div>
      <p><strong>${scoreComment(result.score)}</strong></p>
      <div class="word-diff">${diffHtml(result)}</div>
      <p class="legend">緑: 言えた単語 / 赤: 言えなかった・聞き取れなかった単語</p>
      <div class="heard">あなたの発話: 「${escapeHtml(spoken || "（聞き取れませんでした）")}」</div>
    </div>`;
}

// ------------------------------------------------------------
// 音声（読み上げ・音声認識）
// ------------------------------------------------------------
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canListen = Boolean(Recognition);
const canSpeak = "speechSynthesis" in window;
let englishVoice = null;

function pickVoice() {
  if (!canSpeak) return;
  const voices = speechSynthesis.getVoices();
  englishVoice =
    voices.find((v) => v.lang === "en-US" && /Google|Samantha|Natural/i.test(v.name)) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null;
}

if (canSpeak) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function speak(text, rate = 1, onEnd) {
  if (!canSpeak) {
    if (onEnd) onEnd();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  if (englishVoice) u.voice = englishVoice;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
}

function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

let activeRecognizer = null;

// 音声認識を開始。onInterim(途中結果) / onDone(最終テキスト) を呼ぶ
function listen({ onInterim, onDone }) {
  stopListening();
  const rec = new Recognition();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let finalText = "";
  let latest = "";
  let finished = false;

  rec.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += t + " ";
      else interim += t;
    }
    latest = (finalText + interim).trim();
    if (onInterim) onInterim(latest);
  };

  rec.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      alert("マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。");
    }
  };

  rec.onend = () => {
    if (finished) return;
    finished = true;
    if (activeRecognizer === rec) activeRecognizer = null;
    onDone((finalText.trim() || latest).trim());
  };

  activeRecognizer = rec;
  rec.start();
  return rec;
}

function stopListening() {
  if (activeRecognizer) {
    const rec = activeRecognizer;
    activeRecognizer = null;
    rec.onend = null;
    rec.abort();
  }
}

// マイクボタン（または音声認識非対応時の入力欄）の共通部品
// 返り値の HTML を置いたあと bindAnswerInput で動作を付ける
function answerInputHtml(placeholder) {
  if (canListen) {
    return `
      <div class="mic-area">
        <button class="mic-btn" id="mic-btn" aria-label="録音">🎤</button>
        <div class="muted" id="mic-status">タップして話す</div>
        <div class="heard" id="interim"></div>
      </div>`;
  }
  return `
    <p class="notice">このブラウザは音声認識に対応していないため、キーボード入力モードです。音声で練習するには Google Chrome をお使いください。</p>
    <div class="input-row">
      <input class="text-input" id="answer-input" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
      <button class="btn" id="answer-submit">回答</button>
    </div>`;
}

function bindAnswerInput({ onStart, onAnswer }) {
  if (canListen) {
    const btn = document.getElementById("mic-btn");
    const status = document.getElementById("mic-status");
    const interim = document.getElementById("interim");
    let recording = false;

    btn.addEventListener("click", () => {
      if (recording) {
        // 停止ボタン: 認識を終えて結果を確定させる
        if (activeRecognizer) activeRecognizer.stop();
        return;
      }
      recording = true;
      btn.classList.add("recording");
      btn.textContent = "■";
      status.textContent = "聞き取り中…（話し終えたら自動で止まります）";
      interim.textContent = "";
      if (onStart) onStart();
      listen({
        onInterim: (t) => {
          interim.textContent = t;
        },
        onDone: (text) => {
          recording = false;
          btn.classList.remove("recording");
          btn.textContent = "🎤";
          status.textContent = "タップして話す";
          onAnswer(text);
        }
      });
    });
  } else {
    const input = document.getElementById("answer-input");
    const submit = document.getElementById("answer-submit");
    const send = () => {
      onAnswer(input.value.trim());
      input.value = "";
    };
    submit.addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) send();
    });
    input.focus();
  }
}

function isRecording() {
  return activeRecognizer !== null;
}

// ------------------------------------------------------------
// ルーティング
// ------------------------------------------------------------
const views = {
  home: renderHome,
  shadowing: renderShadowingList,
  composition: renderCompositionList,
  conversation: renderConversationList,
  records: renderRecords
};

function go(view) {
  runCleanups();
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.view === view);
  });
  window.scrollTo(0, 0);
  views[view]();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => go(tab.dataset.view));
});

function openScreen(renderFn) {
  runCleanups();
  window.scrollTo(0, 0);
  renderFn();
}

function levelBadge(level) {
  return `<span class="badge badge-${level}">${level}</span>`;
}

function bestText(id) {
  return id in store.best ? `ベスト ${store.best[id]}点` : "未挑戦";
}

// ------------------------------------------------------------
// ホーム
// ------------------------------------------------------------
function renderHome() {
  const today = store.history.filter((h) => h.date === todayKey());
  const next =
    SHADOWING_LESSONS.find((l) => !(l.id in store.best)) ||
    SHADOWING_LESSONS.slice().sort((a, b) => store.best[a.id] - store.best[b.id])[0];

  app.innerHTML = `
    <section class="card hero">
      <h2>今日も英語を話そう！</h2>
      <p class="muted">聞く・話す・組み立てるの3ステップで、ビジネス英語を鍛えます。</p>
      <div class="stat-row">
        <div class="stat"><div class="stat-value">${today.length}</div><div class="stat-label">今日の練習</div></div>
        <div class="stat"><div class="stat-value">${calcStreak()}</div><div class="stat-label">連続日数</div></div>
        <div class="stat"><div class="stat-value">${average(today.map((h) => h.score))}</div><div class="stat-label">今日の平均点</div></div>
      </div>
    </section>

    <button class="card menu-card" data-go="shadowing">
      <div class="menu-icon">🎧</div>
      <div><h3>AIシャドーイング</h3><div class="muted">お手本の後について発話。単語ごとに自動採点します。</div></div>
    </button>
    <button class="card menu-card" data-go="composition">
      <div class="menu-icon">⚡</div>
      <div><h3>瞬間英作文</h3><div class="muted">日本語を見て、制限時間内に英語で言ってみよう。</div></div>
    </button>
    <button class="card menu-card" data-go="conversation">
      <div class="menu-icon">💬</div>
      <div><h3>シナリオ英会話</h3><div class="muted">ホテル・雑談・面接など、場面ごとに会話を練習。</div></div>
    </button>

    <section class="card">
      <h3>今日のおすすめ</h3>
      <button class="card lesson-item" id="recommend" style="margin:0;box-shadow:none;border:2px solid var(--border)">
        <span>${levelBadge(next.level)}シャドーイング「${escapeHtml(next.title)}」</span>
        <span class="best-score">${bestText(next.id)}</span>
      </button>
    </section>`;

  app.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => go(el.dataset.go));
  });
  document.getElementById("recommend").addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === "shadowing"));
    openScreen(() => renderShadowingLesson(next));
  });
}

// ------------------------------------------------------------
// シャドーイング
// ------------------------------------------------------------
function renderShadowingList() {
  app.innerHTML = `
    <h2>🎧 AIシャドーイング</h2>
    <p class="muted">お手本の音声を聞き、すぐ後に続けて同じように発話します。発音・リズムを単語単位で採点します。</p>
    ${SHADOWING_LESSONS.map(
      (l) => `
      <button class="card lesson-item" data-id="${l.id}">
        <span>${levelBadge(l.level)}<strong>${escapeHtml(l.title)}</strong><br><span class="muted">${l.sentences.length}文</span></span>
        <span class="best-score">${bestText(l.id)}</span>
      </button>`
    ).join("")}`;

  app.querySelectorAll("[data-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const lesson = SHADOWING_LESSONS.find((l) => l.id === el.dataset.id);
      openScreen(() => renderShadowingLesson(lesson));
    });
  });
}

const shadowSettings = { rate: 1, hideText: false, withAudio: false };

function renderShadowingLesson(lesson) {
  const state = { index: 0, scores: lesson.sentences.map(() => null) };

  function draw() {
    const s = lesson.sentences[state.index];
    const last = state.index === lesson.sentences.length - 1;
    const score = state.scores[state.index];

    app.innerHTML = `
      <button class="back-btn" id="back">← レッスン一覧</button>
      <h2>${escapeHtml(lesson.title)}</h2>
      <div class="progress-dots">
        ${lesson.sentences
          .map((_, i) => `<div class="dot ${i === state.index ? "current" : state.scores[i] !== null ? "done" : ""}"></div>`)
          .join("")}
      </div>

      <section class="card">
        <div class="muted">${state.index + 1} / ${lesson.sentences.length}</div>
        <div class="sentence-en ${shadowSettings.hideText ? "hidden-text" : ""}" id="sentence">${escapeHtml(s.en)}</div>
        <div class="sentence-ja">${escapeHtml(s.ja)}</div>
        <div class="toolbar">
          <button class="btn btn-small" id="play">▶ お手本を再生</button>
          <div class="speed-group">
            ${[0.75, 1, 1.25]
              .map((r) => `<button data-rate="${r}" class="${shadowSettings.rate === r ? "active" : ""}">×${r}</button>`)
              .join("")}
          </div>
        </div>
        <div class="toolbar">
          <label class="toggle"><input type="checkbox" id="hide" ${shadowSettings.hideText ? "checked" : ""}> 英文を隠す</label>
          ${canListen ? `<label class="toggle"><input type="checkbox" id="with-audio" ${shadowSettings.withAudio ? "checked" : ""}> お手本と同時に録音（イヤホン推奨）</label>` : ""}
        </div>
      </section>

      <section class="card">
        ${answerInputHtml("聞こえた英文を入力（ディクテーション）")}
        <div id="result"></div>
        <div class="btn-row" style="justify-content:flex-end">
          <button class="btn ${last ? "" : "btn-outline"}" id="next">${last ? "結果を見る" : "次の文へ →"}</button>
        </div>
      </section>`;

    document.getElementById("back").addEventListener("click", () => openScreen(renderShadowingList));
    document.getElementById("play").addEventListener("click", () => speak(s.en, shadowSettings.rate));
    app.querySelectorAll("[data-rate]").forEach((b) => {
      b.addEventListener("click", () => {
        shadowSettings.rate = parseFloat(b.dataset.rate);
        app.querySelectorAll("[data-rate]").forEach((x) => x.classList.toggle("active", x === b));
      });
    });
    document.getElementById("hide").addEventListener("change", (e) => {
      shadowSettings.hideText = e.target.checked;
      document.getElementById("sentence").classList.toggle("hidden-text", e.target.checked);
    });
    const withAudio = document.getElementById("with-audio");
    if (withAudio) {
      withAudio.addEventListener("change", (e) => {
        shadowSettings.withAudio = e.target.checked;
      });
    }

    bindAnswerInput({
      onStart: () => {
        if (shadowSettings.withAudio) speak(s.en, shadowSettings.rate);
        else stopSpeaking();
      },
      onAnswer: (text) => {
        const result = evaluate(s.en, text);
        state.scores[state.index] = result.score;
        document.getElementById("result").innerHTML = resultHtml(result, text);
        document.getElementById("sentence").classList.remove("hidden-text");
        document.querySelectorAll(".dot")[state.index].classList.add("done");
      }
    });

    if (score !== null) {
      document.getElementById("result").innerHTML = `<p class="muted" style="text-align:center">前回: ${score}点</p>`;
    }

    document.getElementById("next").addEventListener("click", () => {
      stopListening();
      stopSpeaking();
      if (last) {
        finish();
      } else {
        state.index++;
        draw();
        window.scrollTo(0, 0);
      }
    });
  }

  function finish() {
    const done = state.scores.filter((x) => x !== null);
    const total = average(done);
    if (done.length > 0) recordPractice("シャドーイング", lesson.id, lesson.title, total);

    app.innerHTML = `
      <h2>${escapeHtml(lesson.title)} - 結果</h2>
      <section class="card result">
        <div class="score-circle ${scoreClass(total)}"><span class="num">${total}</span><span class="unit">平均点</span></div>
        <p><strong>${done.length > 0 ? scoreComment(total) : "採点された文がありません"}</strong></p>
      </section>
      <section class="card">
        ${lesson.sentences
          .map(
            (s, i) => `
          <div class="history-item">
            <span>${escapeHtml(s.en)}</span>
            <span class="best-score">${state.scores[i] === null ? "-" : state.scores[i] + "点"}</span>
          </div>`
          )
          .join("")}
      </section>
      <div class="btn-row">
        <button class="btn" id="retry">もう一度</button>
        <button class="btn btn-outline" id="list">レッスン一覧へ</button>
      </div>`;
    document.getElementById("retry").addEventListener("click", () => openScreen(() => renderShadowingLesson(lesson)));
    document.getElementById("list").addEventListener("click", () => openScreen(renderShadowingList));
  }

  draw();
}

// ------------------------------------------------------------
// 瞬間英作文
// ------------------------------------------------------------
const compositionSettings = { seconds: 5 };

function renderCompositionList() {
  app.innerHTML = `
    <h2>⚡ 瞬間英作文</h2>
    <p class="muted">日本語を見て、すぐに英語で言ってみましょう。考える前に口から出るようになるまで繰り返すのがコツです。</p>
    <section class="card">
      <h3>考える時間</h3>
      <div class="speed-group" style="display:inline-flex">
        ${[3, 5, 10]
          .map((s) => `<button data-sec="${s}" class="${compositionSettings.seconds === s ? "active" : ""}">${s}秒</button>`)
          .join("")}
      </div>
    </section>
    ${COMPOSITION_SETS.map(
      (set) => `
      <button class="card lesson-item" data-id="${set.id}">
        <span>${levelBadge(set.level)}<strong>${escapeHtml(set.title)}</strong><br><span class="muted">${set.questions.length}問</span></span>
        <span class="best-score">${bestText(set.id)}</span>
      </button>`
    ).join("")}`;

  app.querySelectorAll("[data-sec]").forEach((b) => {
    b.addEventListener("click", () => {
      compositionSettings.seconds = parseInt(b.dataset.sec, 10);
      app.querySelectorAll("[data-sec]").forEach((x) => x.classList.toggle("active", x === b));
    });
  });
  app.querySelectorAll("[data-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const set = COMPOSITION_SETS.find((s) => s.id === el.dataset.id);
      openScreen(() => renderCompositionSession(set));
    });
  });
}

function renderCompositionSession(set) {
  const questions = shuffle(set.questions);
  const state = { index: 0, scores: [], answers: [] };
  let timerId = null;

  addCleanup(() => clearInterval(timerId));

  function draw() {
    const q = questions[state.index];
    let revealed = false;
    let timeUp = false;

    app.innerHTML = `
      <button class="back-btn" id="back">← セット一覧</button>
      <h2>${escapeHtml(set.title)}</h2>
      <section class="card">
        <div class="muted">第${state.index + 1}問 / ${questions.length}問</div>
        <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
        <div class="question-ja">${escapeHtml(q.ja)}</div>
        <div id="answer-area">${answerInputHtml("英語で入力")}</div>
        <div id="reveal"></div>
      </section>`;

    document.getElementById("back").addEventListener("click", () => openScreen(renderCompositionList));

    // 制限時間のバー
    const fill = document.getElementById("timer-fill");
    const start = Date.now();
    const limit = compositionSettings.seconds * 1000;
    clearInterval(timerId);
    timerId = setInterval(() => {
      const rest = Math.max(0, 1 - (Date.now() - start) / limit);
      fill.style.width = `${rest * 100}%`;
      if (rest === 0) {
        clearInterval(timerId);
        timeUp = true;
        fill.style.background = "var(--bad)";
        // 録音中なら結果が出るまで待つ
        if (!isRecording()) reveal("");
      }
    }, 50);

    bindAnswerInput({
      onAnswer: (text) => reveal(text)
    });

    function reveal(text) {
      if (revealed) return;
      revealed = true;
      clearInterval(timerId);
      stopListening();

      const result = text ? evaluate(q.en, text) : { score: 0, words: q.en.split(" "), wordOk: q.en.split(" ").map(() => false) };
      state.scores.push(result.score);
      state.answers.push(text);

      document.getElementById("answer-area").innerHTML = "";
      document.getElementById("reveal").innerHTML = `
        ${text ? resultHtml(result, text) : `<p class="notice">${timeUp ? "時間切れ！" : ""} 模範解答を声に出して確認しましょう。</p>`}
        <div class="answer-box">
          <div class="muted">模範解答</div>
          <div class="answer-en">${escapeHtml(q.en)} <button class="play-link" id="play-answer" aria-label="再生">🔊</button></div>
        </div>
        <div class="btn-row" style="justify-content:flex-end">
          <button class="btn" id="next">${state.index === questions.length - 1 ? "結果を見る" : "次の問題 →"}</button>
        </div>`;

      speak(q.en);
      document.getElementById("play-answer").addEventListener("click", () => speak(q.en));
      document.getElementById("next").addEventListener("click", () => {
        stopSpeaking();
        if (state.index === questions.length - 1) {
          finish();
        } else {
          state.index++;
          draw();
        }
      });
    }
  }

  function finish() {
    const total = average(state.scores);
    recordPractice("瞬間英作文", set.id, set.title, total);

    app.innerHTML = `
      <h2>${escapeHtml(set.title)} - 結果</h2>
      <section class="card result">
        <div class="score-circle ${scoreClass(total)}"><span class="num">${total}</span><span class="unit">平均点</span></div>
        <p><strong>${scoreComment(total)}</strong></p>
      </section>
      <section class="card">
        ${questions
          .map(
            (q, i) => `
          <div class="history-item">
            <span>${escapeHtml(q.ja)}<br><span class="muted">${escapeHtml(q.en)}</span></span>
            <span class="best-score">${state.scores[i]}点</span>
          </div>`
          )
          .join("")}
      </section>
      <div class="btn-row">
        <button class="btn" id="retry">もう一度</button>
        <button class="btn btn-outline" id="list">セット一覧へ</button>
      </div>`;
    document.getElementById("retry").addEventListener("click", () => openScreen(() => renderCompositionSession(set)));
    document.getElementById("list").addEventListener("click", () => openScreen(renderCompositionList));
  }

  draw();
}

// ------------------------------------------------------------
// シナリオ英会話
// ------------------------------------------------------------
function renderConversationList() {
  app.innerHTML = `
    <h2>💬 シナリオ英会話</h2>
    <p class="muted">相手のセリフに英語で返答しましょう。返答ごとにフィードバックと言い換え例が表示されます。</p>
    ${CONVERSATION_SCENARIOS.map(
      (sc) => `
      <button class="card lesson-item" data-id="${sc.id}">
        <span>${levelBadge(sc.level)}<strong>${escapeHtml(sc.title)}</strong><br><span class="muted">相手: ${escapeHtml(sc.role)}</span></span>
        <span class="best-score">${bestText(sc.id)}</span>
      </button>`
    ).join("")}`;

  app.querySelectorAll("[data-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const sc = CONVERSATION_SCENARIOS.find((s) => s.id === el.dataset.id);
      openScreen(() => renderConversation(sc));
    });
  });
}

// 返答の採点: キーワードを含むか・文の長さ・模範例との近さ
function judgeReply(turn, text) {
  const tokens = tokenize(text);
  const keywordTokens = turn.keywords.flatMap((k) => tokenize(k));
  const hit = keywordTokens.some((k) => tokens.includes(k));
  const similarity = evaluate(turn.sample, text).score;
  let score = (hit ? 50 : 20) + Math.min(30, tokens.length * 5) + Math.round(similarity * 0.2);
  score = Math.min(100, score);

  let message;
  if (tokens.length === 0) {
    message = "聞き取れませんでした。もう少しはっきり話してみましょう。";
  } else if (hit && tokens.length >= 4) {
    message = "👍 Great! 状況に合った返答です。";
  } else if (hit) {
    message = "🙂 Good! もう少し文を長くすると、より自然になります。";
  } else {
    message = "💡 相手の質問に答えられているか確認してみましょう。";
  }
  return { score, message };
}

function renderConversation(scenario) {
  const state = { turn: 0, scores: [], messages: [], waiting: false };
  let delayId = null;
  addCleanup(() => clearTimeout(delayId));

  function draw() {
    const done = state.turn >= scenario.turns.length;
    const turn = scenario.turns[state.turn];

    app.innerHTML = `
      <button class="back-btn" id="back">← シナリオ一覧</button>
      <h2>${escapeHtml(scenario.title)}</h2>
      <p class="muted">相手: ${escapeHtml(scenario.role)}</p>
      <div class="chat" id="chat">
        ${state.messages.map(messageHtml).join("")}
      </div>
      ${
        done
          ? ""
          : `<section class="card" id="reply-card">
              <div class="btn-row" style="margin-top:0">
                <button class="btn btn-outline btn-small" id="hint">💡 ヒント</button>
                <button class="btn btn-outline btn-small" id="replay">🔊 もう一度聞く</button>
              </div>
              <div id="hint-text" class="muted" style="margin-top:8px"></div>
              ${replyInputHtml()}
            </section>`
      }`;

    document.getElementById("back").addEventListener("click", () => openScreen(renderConversationList));
    app.querySelectorAll("[data-say]").forEach((b) => {
      b.addEventListener("click", () => speak(b.dataset.say));
    });

    if (done) {
      finish();
      return;
    }

    document.getElementById("hint").addEventListener("click", () => {
      document.getElementById("hint-text").textContent = `ヒント: ${turn.hint}`;
    });
    document.getElementById("replay").addEventListener("click", () => speak(turn.ai));
    bindReplyInput(turn);
    document.getElementById("reply-card").scrollIntoView({ block: "end" });
  }

  function messageHtml(m) {
    if (m.type === "ai") {
      return `<div class="bubble bubble-ai"><div class="speaker">${escapeHtml(scenario.role)}</div>${escapeHtml(m.text)}
        <button class="play-link" data-say="${escapeHtml(m.text)}" aria-label="再生">🔊</button></div>`;
    }
    if (m.type === "user") {
      return `<div class="bubble bubble-user">${escapeHtml(m.text || "（無回答）")}</div>`;
    }
    return `<div class="bubble bubble-feedback">
      <strong>${escapeHtml(m.message)}</strong>（${m.score}点）<br>
      こんな言い方も: <em>${escapeHtml(m.sample)}</em>
      <button class="play-link" data-say="${escapeHtml(m.sample)}" aria-label="再生">🔊</button></div>`;
  }

  function replyInputHtml() {
    return `
      <div class="input-row" style="margin-top:12px">
        <input class="text-input" id="reply-input" placeholder="英語で返答（入力 or マイク）" autocomplete="off">
        ${canListen ? `<button class="mic-btn mic-small" id="reply-mic" aria-label="録音">🎤</button>` : ""}
        <button class="btn" id="reply-send">送信</button>
      </div>`;
  }

  function bindReplyInput(turn) {
    const input = document.getElementById("reply-input");
    const send = () => submit(turn, input.value.trim());
    document.getElementById("reply-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.isComposing) send();
    });

    const mic = document.getElementById("reply-mic");
    if (mic) {
      mic.addEventListener("click", () => {
        if (isRecording()) {
          activeRecognizer.stop();
          return;
        }
        stopSpeaking();
        mic.classList.add("recording");
        mic.textContent = "■";
        listen({
          onInterim: (t) => {
            input.value = t;
          },
          onDone: (text) => {
            mic.classList.remove("recording");
            mic.textContent = "🎤";
            input.value = text;
            if (text) submit(turn, text);
          }
        });
      });
    }
  }

  function submit(turn, text) {
    if (state.waiting || !text) return;
    state.waiting = true;
    stopListening();
    const judged = judgeReply(turn, text);
    state.scores.push(judged.score);
    state.messages.push({ type: "user", text });
    state.messages.push({ type: "feedback", message: judged.message, score: judged.score, sample: turn.sample });
    state.turn++;
    draw();
    if (state.turn >= scenario.turns.length) return;

    // 少し間をおいて相手が話す
    delayId = setTimeout(() => {
      state.waiting = false;
      const next = scenario.turns[state.turn];
      state.messages.push({ type: "ai", text: next.ai });
      draw();
      speak(next.ai);
    }, 900);
  }

  function finish() {
    if (state.finished) return;
    state.finished = true;
    const total = average(state.scores);
    recordPractice("英会話", scenario.id, scenario.title, total);
    const box = document.createElement("section");
    box.className = "card result";
    box.innerHTML = `
      <h3>会話終了！</h3>
      <div class="score-circle ${scoreClass(total)}"><span class="num">${total}</span><span class="unit">平均点</span></div>
      <p class="muted">「こんな言い方も」の表現を声に出して練習しておきましょう。</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn" id="retry">もう一度</button>
        <button class="btn btn-outline" id="list">シナリオ一覧へ</button>
      </div>`;
    app.appendChild(box);
    document.getElementById("retry").addEventListener("click", () => openScreen(() => renderConversation(scenario)));
    document.getElementById("list").addEventListener("click", () => openScreen(renderConversationList));
    box.scrollIntoView({ block: "end" });
  }

  // 最初のセリフ
  state.messages.push({ type: "ai", text: scenario.turns[0].ai });
  draw();
  speak(scenario.turns[0].ai);
}

// ------------------------------------------------------------
// 記録
// ------------------------------------------------------------
function renderRecords() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    days.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: store.history.filter((h) => h.date === key).length
    });
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const recent = store.history.slice(-15).reverse();

  const byType = ["シャドーイング", "瞬間英作文", "英会話"].map((type) => {
    const items = store.history.filter((h) => h.type === type);
    return { type, count: items.length, avg: average(items.map((h) => h.score)) };
  });

  app.innerHTML = `
    <h2>📊 学習記録</h2>
    <section class="card hero">
      <div class="stat-row" style="margin-top:0">
        <div class="stat"><div class="stat-value">${calcStreak()}</div><div class="stat-label">連続日数</div></div>
        <div class="stat"><div class="stat-value">${store.history.length}</div><div class="stat-label">累計練習</div></div>
        <div class="stat"><div class="stat-value">${average(store.history.map((h) => h.score))}</div><div class="stat-label">平均点</div></div>
      </div>
    </section>

    <section class="card">
      <h3>直近7日間の練習回数</h3>
      <div class="chart">
        ${days
          .map(
            (d) => `
          <div class="bar-col">
            <div class="bar-value">${d.count || ""}</div>
            <div class="bar" style="height:${(d.count / maxCount) * 100}%"></div>
            <div class="bar-label">${d.label}</div>
          </div>`
          )
          .join("")}
      </div>
    </section>

    <section class="card">
      <h3>機能別</h3>
      ${byType
        .map(
          (t) => `
        <div class="history-item">
          <span>${t.type}</span>
          <span>${t.count}回 / 平均 <strong>${t.avg}</strong>点</span>
        </div>`
        )
        .join("")}
    </section>

    <section class="card">
      <h3>最近の練習</h3>
      ${
        recent.length === 0
          ? `<p class="muted">まだ記録がありません。まずはシャドーイングから始めてみましょう！</p>`
          : recent
              .map((h) => {
                const d = new Date(h.ts);
                return `
            <div class="history-item">
              <span>${escapeHtml(h.type)}「${escapeHtml(h.title)}」<br><span class="muted">${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}</span></span>
              <span class="best-score">${h.score}点</span>
            </div>`;
              })
              .join("")
      }
    </section>

    <button class="btn btn-outline btn-small" id="reset">記録をリセット</button>`;

  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("学習記録をすべて削除します。よろしいですか？")) {
      store = { history: [], best: {} };
      saveData();
      updateHeader();
      renderRecords();
    }
  });
}

// ------------------------------------------------------------
// 起動
// ------------------------------------------------------------
updateHeader();
go("home");
