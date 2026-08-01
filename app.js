/* ============ STORAGE ============ */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

const state = {
  sessions: store.get("sessions", []),
  settings: store.get("settings", { waterIntervalMin: 120 }),
  waterNext: store.get("waterNext", null),
};

/* ============ SON / VIBRATION ============ */
let audioCtx = null;
function beep(freq = 880, duration = 150) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    o.stop(audioCtx.currentTime + duration / 1000);
  } catch (e) { /* silence si non supporté */ }
  if (navigator.vibrate) navigator.vibrate(80);
}

/* ============ NOTIFICATIONS ============ */
function askNotifPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}
function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      navigator.serviceWorker?.getRegistration().then((reg) => {
        if (reg) reg.showNotification(title, { body, icon: "icon-192.png" });
        else new Notification(title, { body });
      });
    } catch { new Notification(title, { body }); }
  }
  showBanner(`${title} — ${body}`);
}

function showBanner(text) {
  const b = document.getElementById("banner");
  b.textContent = text;
  b.classList.add("show");
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove("show"), 5000);
}

/* ============ RAPPEL HYDRATATION (toutes les X min) ============ */
function scheduleWater() {
  const intervalMs = state.settings.waterIntervalMin * 60 * 1000;
  const now = Date.now();
  if (!state.waterNext || state.waterNext < now - intervalMs) {
    state.waterNext = now + intervalMs;
    store.set("waterNext", state.waterNext);
  }
  checkWaterLoop();
}
function checkWaterLoop() {
  setInterval(() => {
    if (Date.now() >= state.waterNext) {
      notify("💧 Hydratation", "C'est l'heure de boire de l'eau.");
      state.waterNext = Date.now() + state.settings.waterIntervalMin * 60 * 1000;
      store.set("waterNext", state.waterNext);
      renderWaterCountdown();
    }
  }, 15000);
  renderWaterCountdown();
  setInterval(renderWaterCountdown, 15000);
}
function renderWaterCountdown() {
  const el = document.getElementById("waterCountdown");
  if (!el || !state.waterNext) return;
  const diff = Math.max(0, state.waterNext - Date.now());
  const m = Math.floor(diff / 60000);
  el.textContent = `prochain rappel dans ${m} min`;
}
function mixtureReminder() {
  notify("🥤 Mixture", "Séance terminée — pense à prendre ta préparation nutritionnelle.");
}

/* ============ NAVIGATION ============ */
const views = ["home", "program", "session", "journal", "nutrition"];
function showView(id) {
  views.forEach((v) => document.getElementById("view-" + v).classList.toggle("active", v === id));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === id));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => showView(t.dataset.view));
});

/* ============ ACCUEIL ============ */
function todayDay() {
  const idx = new Date().getDay(); // 0=dim..6=sam
  const order = [6, 0, 1, 2, 3, 4, 5]; // lundi=j1 ... dimanche=j7
  return PROGRAM.days[order[idx]];
}
function renderHome() {
  const day = todayDay();
  document.getElementById("todayTitle").textContent = day.title;
  document.getElementById("todayMeta").textContent =
    day.type === "circuit" ? day.circuitInfo :
    day.type === "emom" ? day.emomInfo :
    day.type === "rest" ? "Journée de récupération" : "Séance en séries";

  const doneToday = state.sessions.some(s => s.date === new Date().toDateString() && s.dayId === day.id);
  document.getElementById("todayStatus").textContent = doneToday ? "✅ Séance déjà enregistrée aujourd'hui" : "";

  document.getElementById("streakCount").textContent = computeStreak();
  document.getElementById("weekCount").textContent = sessionsThisWeek();

  document.getElementById("goToTodayBtn").onclick = () => openDay(day.id);
}
function computeStreak() {
  let streak = 0;
  let d = new Date();
  const dates = new Set(state.sessions.map(s => s.date));
  while (dates.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function sessionsThisWeek() {
  const now = new Date();
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  return state.sessions.filter(s => new Date(s.date) >= start).length;
}

/* ============ PROGRAMME (liste + détail) ============ */
function renderProgramList() {
  const el = document.getElementById("programList");
  el.innerHTML = "";
  PROGRAM.days.forEach((day) => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `<div class="day-card-title">${day.title}</div>
      <div class="day-card-sub">${day.type === "rest" ? "Récupération" : (day.exercises.length || day.cycle.length) + " exercices"}</div>`;
    card.onclick = () => openDay(day.id);
    el.appendChild(card);
  });
}

function openDay(dayId) {
  const day = PROGRAM.days.find(d => d.id === dayId);
  currentDay = day;
  const el = document.getElementById("programDetail");
  const list = document.getElementById("programList");
  list.style.display = "none";
  el.style.display = "block";
  el.innerHTML = `
    <button class="back-btn" id="backToList">← Retour</button>
    <h2>${day.title}</h2>
    <p class="muted">${day.circuitInfo || day.emomInfo || (day.type === "sets" ? "3 séries par exercice, ~60 sec repos entre séries" : "")}</p>
    <div class="exo-grid" id="exoGrid"></div>
    ${day.type !== "rest" ? `<button class="cta" id="startSessionBtn">▶ Démarrer la séance</button>` : `<button class="cta" id="startSessionBtn">✓ Marquer comme fait</button>`}
  `;
  const grid = document.getElementById("exoGrid");
  const list_ex = day.exercises || day.cycle;
  list_ex.forEach((ex) => {
    const card = document.createElement("div");
    card.className = "exo-card";
    card.innerHTML = `
      <div class="exo-img">${pose(ex.pose)}</div>
      <div class="exo-info">
        <div class="exo-name">${ex.name}</div>
        <div class="exo-meta">${ex.masse !== "—" ? "Masse : " + ex.masse + " · " : ""}${ex.detail}</div>
      </div>`;
    grid.appendChild(card);
  });
  document.getElementById("backToList").onclick = () => { el.style.display = "none"; list.style.display = "grid"; };
  document.getElementById("startSessionBtn").onclick = () => startSession(day);
  showView("program");
}

/* ============ SEANCE / TIMER ============ */
let currentDay = null;
let sessionTimer = { steps: [], index: 0, remaining: 0, running: false, startedAt: null, wakeLock: null };

function buildSteps(day) {
  const steps = [];
  if (day.type === "circuit") {
    for (let r = 0; r < day.rounds; r++) {
      day.exercises.forEach((ex, i) => {
        steps.push({ kind: "work", label: ex.name, sub: ex.masse !== "—" ? "Masse : " + ex.masse : "", duration: day.work, pose: ex.pose });
        if (i < day.exercises.length - 1) steps.push({ kind: "rest", label: "Repos", duration: day.rest });
      });
      if (r < day.rounds - 1) steps.push({ kind: "roundrest", label: `Repos entre tours (tour ${r + 1}/${day.rounds} terminé)`, duration: day.roundRest });
    }
  } else if (day.type === "emom") {
    for (let c = 0; c < day.repeats; c++) {
      day.cycle.forEach((ex) => {
        steps.push({ kind: "work", label: ex.name, sub: `${ex.detail}${ex.masse !== "—" ? " · " + ex.masse : ""}`, duration: 60, pose: ex.pose });
      });
    }
  }
  return steps;
}

function startSession(day) {
  if (day.type === "rest") {
    logSession(day, 0, "Journée de repos actif");
    showBanner("Journée de repos enregistrée. Bonne récupération 🌿");
    return;
  }
  currentDay = day;
  sessionTimer.startedAt = Date.now();

  const el = document.getElementById("view-session");
  if (day.type === "sets") {
    renderSetsSession(day, el);
  } else {
    sessionTimer.steps = buildSteps(day);
    sessionTimer.index = 0;
    renderTimerSession(day, el);
    runStep();
  }
  requestWakeLock();
  showView("session");
}

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) sessionTimer.wakeLock = await navigator.wakeLock.request("screen");
  } catch (e) { /* pas supporté, tant pis */ }
}
function releaseWakeLock() {
  if (sessionTimer.wakeLock) { sessionTimer.wakeLock.release().catch(()=>{}); sessionTimer.wakeLock = null; }
}

function renderTimerSession(day, el) {
  el.innerHTML = `
    <div class="session-header">
      <button class="back-btn" id="stopSessionBtn">✕ Arrêter</button>
      <div class="session-title">${day.title}</div>
    </div>
    <div class="timer-box" id="timerBox">
      <div class="timer-img" id="timerImg"></div>
      <div class="timer-label" id="timerLabel">—</div>
      <div class="timer-sub" id="timerSub"></div>
      <div class="timer-clock" id="timerClock">--</div>
      <div class="timer-progress"><div class="timer-progress-bar" id="timerBar"></div></div>
      <button class="cta secondary" id="skipStepBtn">Passer ⏭</button>
    </div>`;
  document.getElementById("stopSessionBtn").onclick = () => endSession(true);
  document.getElementById("skipStepBtn").onclick = () => nextStep(true);
}

let stepInterval = null;
function runStep() {
  clearInterval(stepInterval);
  const step = sessionTimer.steps[sessionTimer.index];
  if (!step) { endSession(false); return; }

  document.getElementById("timerLabel").textContent = step.label;
  document.getElementById("timerSub").textContent = step.sub || (step.kind === "rest" || step.kind === "roundrest" ? "Récupère..." : "");
  document.getElementById("timerImg").innerHTML = step.pose ? pose(step.pose) : "";
  document.getElementById("timerImg").style.display = step.pose ? "block" : "none";
  document.getElementById("timerBox")?.classList.toggle("resting", step.kind !== "work");

  let remaining = step.duration;
  updateClock(remaining, step.duration);
  beep(step.kind === "work" ? 660 : 990, 120);

  stepInterval = setInterval(() => {
    remaining--;
    updateClock(remaining, step.duration);
    if (remaining <= 3 && remaining > 0) beep(500, 90);
    if (remaining <= 0) {
      clearInterval(stepInterval);
      nextStep(false);
    }
  }, 1000);
}
function updateClock(remaining, total) {
  document.getElementById("timerClock").textContent = remaining;
  document.getElementById("timerBar").style.width = `${100 - (remaining / total) * 100}%`;
}
function nextStep(manual) {
  clearInterval(stepInterval);
  sessionTimer.index++;
  if (sessionTimer.index >= sessionTimer.steps.length) { endSession(false); return; }
  runStep();
}

function renderSetsSession(day, el) {
  const progress = day.exercises.map(() => 0);
  el.innerHTML = `
    <div class="session-header">
      <button class="back-btn" id="stopSessionBtn">✕ Arrêter</button>
      <div class="session-title">${day.title}</div>
    </div>
    <div class="sets-list" id="setsList"></div>
    <button class="cta" id="finishSetsBtn">✓ Terminer la séance</button>`;
  document.getElementById("stopSessionBtn").onclick = () => endSession(true);
  document.getElementById("finishSetsBtn").onclick = () => endSession(false);

  const list = document.getElementById("setsList");
  day.exercises.forEach((ex, i) => {
    const target = (ex.detail.match(/^(\d+)/) || [, "3"])[1];
    const card = document.createElement("div");
    card.className = "exo-card set-card";
    card.innerHTML = `
      <div class="exo-img">${pose(ex.pose)}</div>
      <div class="exo-info">
        <div class="exo-name">${ex.name}</div>
        <div class="exo-meta">${ex.masse !== "—" ? "Masse : " + ex.masse + " · " : ""}${ex.detail}</div>
        <div class="set-controls">
          <button class="mini-btn minus">−</button>
          <span class="set-count" id="count-${i}">0 / ${target}</span>
          <button class="mini-btn plus">+</button>
        </div>
      </div>`;
    const countEl = () => card.querySelector(`#count-${i}`);
    card.querySelector(".plus").onclick = () => {
      progress[i] = Math.min(Number(target) + 5, progress[i] + 1);
      countEl().textContent = `${progress[i]} / ${target}`;
      beep(700, 100);
    };
    card.querySelector(".minus").onclick = () => {
      progress[i] = Math.max(0, progress[i] - 1);
      countEl().textContent = `${progress[i]} / ${target}`;
    };
    list.appendChild(card);
  });
}

function endSession(aborted) {
  clearInterval(stepInterval);
  releaseWakeLock();
  const durationSec = Math.round((Date.now() - sessionTimer.startedAt) / 1000);
  if (!aborted) {
    logSession(currentDay, durationSec);
    mixtureReminder();
    showBanner("Séance enregistrée 💪");
  } else {
    showBanner("Séance arrêtée (non enregistrée)");
  }
  sessionTimer = { steps: [], index: 0, remaining: 0, running: false, startedAt: null, wakeLock: null };
  showView("program");
  document.getElementById("programDetail").style.display = "none";
  document.getElementById("programList").style.display = "grid";
}

function logSession(day, durationSec, note) {
  state.sessions.unshift({
    date: new Date().toDateString(),
    dayId: day.id,
    dayTitle: day.title,
    durationSec,
    note: note || "",
  });
  store.set("sessions", state.sessions);
  renderJournal();
  renderHome();
}

/* ============ JOURNAL ============ */
function renderJournal() {
  const el = document.getElementById("journalList");
  el.innerHTML = "";
  if (state.sessions.length === 0) {
    el.innerHTML = `<p class="muted">Aucune séance enregistrée pour l'instant.</p>`;
    return;
  }
  state.sessions.forEach((s) => {
    const row = document.createElement("div");
    row.className = "journal-row";
    const mins = Math.round(s.durationSec / 60);
    row.innerHTML = `
      <div>
        <div class="journal-day">${s.dayTitle}</div>
        <div class="journal-date">${s.date}${mins ? " · " + mins + " min" : ""}</div>
      </div>`;
    el.appendChild(row);
  });
}

/* ============ NUTRITION ============ */
function renderNutrition() {
  const p = document.getElementById("nutriPrincipes");
  p.innerHTML = NUTRITION.principes.map(t => `<li>${t}</li>`).join("");

  const j = document.getElementById("nutriJournee");
  j.innerHTML = NUTRITION.journee.map(m => `
    <div class="nutri-row"><strong>${m.moment}</strong><span>${m.detail}</span></div>`).join("");

  const a = document.getElementById("nutriAliments");
  a.innerHTML = NUTRITION.aliments.map(x => `
    <div class="nutri-row"><strong>${x.cat}</strong><span>${x.ex}</span></div>`).join("");
}

/* ============ INIT ============ */
window.addEventListener("load", () => {
  document.getElementById("waterIntervalSelect").value = state.settings.waterIntervalMin;
  document.getElementById("waterIntervalSelect").onchange = (e) => {
    state.settings.waterIntervalMin = Number(e.target.value);
    store.set("settings", state.settings);
    state.waterNext = Date.now() + state.settings.waterIntervalMin * 60 * 1000;
    store.set("waterNext", state.waterNext);
    renderWaterCountdown();
  };
  document.getElementById("enableNotifBtn").onclick = askNotifPermission;

  renderHome();
  renderProgramList();
  renderJournal();
  renderNutrition();
  scheduleWater();
  showView("home");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
