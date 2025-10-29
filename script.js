// ============================================================
//  YEAR 7 CUPS DASHBOARD 2025 - CORE SCRIPT (Optimized & Unified)
//  Improvements:
//  - Cleaner structure, comments, and modular rendering
//  - Improved bilingual support + dark mode consistency
//  - Error handling & data caching for smoother UX
//  - Fully supports teamCard.html dropdowns
//  - Keeps 100% compatibility with existing HTML + JSON
// ============================================================

// =======================
// TRANSLATIONS
// =======================
const translations = {
  en: {
    dashboardTitle: "Year 7 Cups Dashboard 2025",
    dashboard: "Dashboard",
    teamDashboard: "Team Dashboard",
    brackets: "Brackets",
    welshCupOverview: "Welsh Cup Overview",
    selectTeam: "Select Team:",
    selectData: "Select Data:",
    cardiffCupOverview: "Cardiff Cup Overview",
    friendliesOverview: "Friendlies Overview",
    stats: "Stats",
    played: "Played",
    wins: "Wins",
    gf: "GF",
    ga: "GA",
    gd: "GD",
    notes: "Notes:",
    welshMatches: "Welsh Matches",
    round: "Round",
    deadline: "Deadline",
    home: "Home",
    hScore: "H Score",
    aScore: "A Score",
    away: "Away",
    winner: "Winner",
    date: "Date",
    matchNotes: "Match History",
    leaderboard: "Leaderboard",
    refresh: "Refresh Data",
    lastUpdated: "Last Updated:"
  },
  cy: {
    dashboardTitle: "Dangosfwrdd Cwpanau Blwyddyn 7 2025",
    dashboard: "Dangosfwrdd",
    teamDashboard: "Dangosfwrdd Tim",
    brackets: "Bracetiau",
    welshCupOverview: "Trosolwg Cwpan Cymru",
    selectTeam: "Dewiswch Tim:",
    selectData: "Dewiswch Ddata:",
    cardiffCupOverview: "Trosolwg Cwpan Caerdydd",
    friendliesOverview: "Trosolwg Gemau Cyfeillgar",
    stats: "Ystadegau",
    played: "Gemau",
    wins: "Enillodd",
    gf: "Gol I",
    ga: "Gol Yn Erbyn",
    gd: "Gwahaniaeth Gol",
    notes: "Nodiadau:",
    welshMatches: "Gemau Cymru",
    round: "Rownd",
    deadline: "Dyddiad Cau",
    home: "Cartref",
    hScore: "SG Cartref",
    aScore: "SG Ffwrdd",
    away: "Ffwrdd",
    winner: "Enillydd",
    date: "Dyddiad",
    matchNotes: "Hanes Gemau",
    leaderboard: "Tabl Cynghrair",
    refresh: "Adnewyddu Data",
    lastUpdated: "Diweddarwyd Diwethaf:"
  }
};

let currentLang = localStorage.getItem("lang") || "en";

// =======================
// GLOBAL STATE
// =======================
const state = {
  teams: [],
  cups: { Welsh: {}, Cardiff: {}, Friendlies: {} },
  lastUpdated: "Unknown",
  cache: {}
};

// =======================
// DOM REFERENCES
// =======================
const elements = {
  dropdowns: {
    Welsh: {
      team: document.getElementById("welsh-team"),
      data: document.getElementById("welsh-data"),
      display: document.getElementById("welsh-display")
    },
    Cardiff: {
      team: document.getElementById("cardiff-team"),
      data: document.getElementById("cardiff-data"),
      display: document.getElementById("cardiff-display")
    },
    Friendlies: {
      team: document.getElementById("friendlies-team"),
      data: document.getElementById("friendlies-data"),
      display: document.getElementById("friendlies-display")
    }
  },
  leaderboard: document.getElementById("leaderboard"),
  lastUpdated: document.getElementById("last-updated"),
  refresh: document.getElementById("refresh-btn"),
  brackets: {
    welsh: document.getElementById("welsh-bracket-container"),
    cardiff: document.getElementById("cardiff-bracket-container")
  }
};

// ============================================================
// LANGUAGE SWITCHER
// ============================================================
function switchLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });

  renderAll();
}

document.getElementById("lang-en")?.addEventListener("click", () => switchLanguage("en"));
document.getElementById("lang-cy")?.addEventListener("click", () => switchLanguage("cy"));

// ============================================================
// DATA FETCHING + NORMALIZATION (robust to any team schema)
// ============================================================
async function fetchJSON(url) {
  if (state.cache[url]) {
    console.debug("Cache hit:", url);
    return state.cache[url];
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const res = await fetch(url, { 
      cache: "no-store",
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    state.cache[url] = json;
    console.debug("Cached:", url);
    return json;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for ${url}`);
    }
    throw error;
  }
}

// helper: get the first numeric value from a list of possible keys
function pickNumber(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !isNaN(+v)) return +v;
  }
  return 0;
}

function mapTeamRecord(name, rec = {}) {
  const gf = pickNumber(rec, "gf", "goals_for");
  const ga = pickNumber(rec, "ga", "goals_against");
  const gd = pickNumber(rec, "gd", "goal_difference", "goal_diff") || gf - ga;
  return {
    name,
    notes: rec.notes || "",
    played: pickNumber(rec, "played", "games", "games_played"),
    wins: pickNumber(rec, "wins"),
    gf,
    ga,
    gd
  };
}

// build list of unique teams from the rounds if teams.json is missing or empty
function deriveTeamsFromCups(cups) {
  const set = new Set();
  Object.values(cups).forEach(cup => {
    (cup?.rounds || []).forEach(r => {
      (r?.games || []).forEach(g => {
        if (g.home_team && g.home_team !== "BYE") set.add(g.home_team);
        if (g.away_team && g.away_team !== "BYE") set.add(g.away_team);
      });
    });
  });
  return [...set].map(name => ({ name, notes: "", played: 0, wins: 0, gf: 0, ga: 0, gd: 0 }));
}

function normalizeTeams(teamsRaw, cups) {
  // 1) If it's an array like { teams: [...] }
  if (Array.isArray(teamsRaw?.teams)) {
    return teamsRaw.teams
      .map(t => mapTeamRecord(t.name ?? t.team ?? "", t))
      .filter(t => t.name);
  }

  // 2) If it's a map { "Team": { games_played, goals_for, ... }, ... }
  if (teamsRaw && typeof teamsRaw === "object" && !Array.isArray(teamsRaw)) {
    return Object.entries(teamsRaw).map(([name, rec]) => mapTeamRecord(name, rec));
  }

  // 3) Fallback: derive from cups
  return deriveTeamsFromCups(cups);
}

async function loadData() {
  try {
    console.info("Loading: start");
    
    // Show loading states
    showLoadingState(elements.leaderboard, "Loading leaderboard...");
    Object.values(elements.dropdowns).forEach(dropdown => {
      if (dropdown.display) {
        showLoadingState(dropdown.display, "Select teams to view data...");
      }
    });

    // Load the cups first so we can derive teams if needed
    const [welsh, cardiff, friendlies] = await Promise.all([
      fetchJSON("welsh.json"),
      fetchJSON("cardiff.json"),
      fetchJSON("friendlies.json")
    ]);

    // Load teams + updated, but both are optional
    const [teamsRaw, updated] = await Promise.all([
      fetchJSON("teams.json").catch(() => null),
      fetchJSON("last_updated.json").catch(() => ({ lastUpdated: "Unknown" }))
    ]);

    // Update state
    state.cups = { Welsh: welsh || {}, Cardiff: cardiff || {}, Friendlies: friendlies || {} };
    state.teams = normalizeTeams(teamsRaw, state.cups);
    state.lastUpdated = updated?.lastUpdated || "Unknown";

    // Compute current season stats from cup rounds (overrides stale numbers)
    calculateStats();
    renderAll();

    // [LOGGING]
    console.debug("teams ready", {
      count: state.teams.length,
      sample: state.teams.slice(0, 5).map(t => t.name)
    });
    console.info("Loading: done", { lastUpdated: state.lastUpdated });
    
  } catch (err) {
    console.error("Error loading data", err);
    showErrorMessage(
      "Error loading data. Please check your JSON files or network connection.",
      () => {
        console.info("Retrying data load...");
        loadData();
      }
    );
  }
}

function showErrorMessage(message, retryCallback = null) {
  console.warn("ui: showErrorMessage", { message });
  document
    .querySelectorAll(".dynamic-display, .bracket-container, #leaderboard")
    .forEach(el => {
      if (el) {
        el.innerHTML = `
          <div class="error-message fade-in">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
              <span style="font-size: 1.2rem;">⚠️</span>
              <span>${message}</span>
            </div>
            ${retryCallback ? `
              <button onclick="(${retryCallback})()" class="cta" style="margin-top: 0.5rem;">
                🔄 Try Again
              </button>
            ` : ''}
          </div>`;
      }
    });
}

function showLoadingState(container, message = "Loading...") {
  if (!container) return;
  container.innerHTML = `
    <div class="loading-placeholder fade-in" style="text-align: center; padding: 2rem;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 1rem; color: #666;">${message}</p>
    </div>`;
}

// ============================================================
// STATS CALCULATION
// ============================================================
function calculateStats() {
  state.teams.forEach(t => Object.assign(t, { played: 0, wins: 0, gf: 0, ga: 0, gd: 0 }));

  const updateStats = g => {
    const home = state.teams.find(t => t.name === g.home_team);
    const away = state.teams.find(t => t.name === g.away_team);
    if (!home || !away || g.away_team === "BYE" || g.home_score == null || g.away_score == null) return;

    home.played++;
    away.played++;
    home.gf += +g.home_score;
    home.ga += +g.away_score;
    away.gf += +g.away_score;
    away.ga += +g.home_score;

    if (g.home_score > g.away_score) home.wins++;
    else if (g.away_score > g.home_score) away.wins++;
  };

  Object.values(state.cups).forEach(cup =>
    cup.rounds?.forEach(r => r.games?.forEach(updateStats))
  );
  state.teams.forEach(t => (t.gd = t.gf - t.ga));
}

// ============================================================
// DROPDOWN POPULATION + DASHBOARD DISPLAYS
// ============================================================
function populateDropdowns(cupName) {
  const { team, data } = elements.dropdowns[cupName];
  if (!team) return;

  team.innerHTML = `<option value="">--${translations[currentLang].selectTeam.replace(":", "")}--</option>`;
  state.teams.forEach(t => (team.innerHTML += `<option value="${t.name}">${t.name}</option>`));

  if (data) data.style.display = "none";
  team.onchange = () => updateCupDisplay(cupName);
}

function updateCupDisplay(cupName) {
  const { team, display } = elements.dropdowns[cupName];
  const teamName = team.value;
  if (!teamName) return (display.innerHTML = "");
  const cupData = state.cups[cupName];
  display.innerHTML = renderMatchHistory(teamName, cupName, cupData);
}

// ============================================================
// TEAM DASHBOARD (teamCard.html) LOGIC
// ============================================================
function initTeamDashboard() {
  const teamSelect = document.getElementById("team-select");
  const dataSelect = document.getElementById("data-select");
  const display = document.getElementById("team-display");

  if (!teamSelect || !dataSelect || !display) return;

  // Populate dropdowns
  teamSelect.innerHTML =
    `<option value="">--${translations[currentLang].selectTeam.replace(":", "")}--</option>`;
  state.teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    teamSelect.appendChild(opt);
  });

  dataSelect.innerHTML = `
    <option value="">--${translations[currentLang].selectData.replace(":", "")}--</option>
    <option value="stats">${translations[currentLang].stats}</option>
    <option value="history">${translations[currentLang].matchNotes || "Match History"}</option>
  `;

  // Handle dropdown changes
  const renderTeamData = () => {
    const teamName = teamSelect.value;
    const viewType = dataSelect.value;

    if (!teamName || !viewType) {
      display.innerHTML = `<p>Select a team and data type to view details...</p>`;
      return;
    }

    const team = state.teams.find(t => t.name === teamName);
    if (!team) {
      display.innerHTML = `<p>No data found for ${teamName}.</p>`;
      return;
    }

    if (viewType === "stats") {
      display.innerHTML = renderTeamStats(team);
    } else if (viewType === "history") {
      const matchSections = Object.entries(state.cups)
        .map(([cupName, data]) => renderMatchHistory(teamName, cupName, data))
        .filter(html => html.includes("<tr>"))
        .join(
          "<hr style='margin:2rem 0;border:none;border-top:1px solid rgba(0,0,0,0.1)'>"
        );

      display.innerHTML = matchSections || `<p>No match data available for ${teamName}.</p>`;
    }

    display.classList.add("loaded");
  };

  teamSelect.addEventListener("change", renderTeamData);
  dataSelect.addEventListener("change", renderTeamData);
}

// ============================================================
// RENDER HELPERS
// ============================================================
function renderTeamStats(team) {
  return `
    <h3>${team.name} - ${translations[currentLang].stats}</h3>
    <table>
      <tr>
        <th>${translations[currentLang].played}</th>
        <th>${translations[currentLang].wins}</th>
        <th>${translations[currentLang].gf}</th>
        <th>${translations[currentLang].ga}</th>
        <th>${translations[currentLang].gd}</th>
      </tr>
      <tr>
        <td>${team.played}</td>
        <td>${team.wins}</td>
        <td>${team.gf}</td>
        <td>${team.ga}</td>
        <td>${team.gd}</td>
      </tr>
    </table>
    <p>${translations[currentLang].notes} ${team.notes || "-"}</p>
  `;
}

function renderMatchHistory(teamName, cupName, data) {
  const rounds = data.rounds || [];
  if (!rounds.length) return `<p>No match data available.</p>`;

  return `
    <h3>${translations[currentLang][cupName.toLowerCase() + "Matches"] || cupName + " Matches"}</h3>
    ${rounds
      .map(
        r => `
        <h4>${translations[currentLang].round} ${r.round_number || ""} - ${translations[currentLang].deadline}: ${r.deadlines?.english || "-"}</h4>
        <table>
          <tr>
            <th>${translations[currentLang].home}</th>
            <th>${translations[currentLang].hScore}</th>
            <th>${translations[currentLang].aScore}</th>
            <th>${translations[currentLang].away}</th>
            <th>${translations[currentLang].winner}</th>
            <th>${translations[currentLang].date}</th>
          </tr>
          ${r.games
            ?.filter(g => g.home_team === teamName || g.away_team === teamName)
            .map(
              g => `
              <tr>
                <td>${g.home_team}</td>
                <td>${g.home_score ?? "-"}</td>
                <td>${g.away_score ?? "-"}</td>
                <td>${g.away_team}</td>
                <td>${g.winner ?? "-"}</td>
                <td>${g.date ?? "-"}</td>
              </tr>`
            )
            .join("")}
        </table>`
      )
      .join("")}
  `;
}

function renderLeaderboard() {
  const el = elements.leaderboard;
  if (!el) return;

  const sorted = [...state.teams].sort(
    (a, b) => b.wins - a.wins || b.gd - a.gd || b.gf - a.gf
  );

  el.innerHTML = `
    <h2 class="fade-in">${translations[currentLang].leaderboard}</h2>
    <div class="table-container fade-in">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th data-numeric="true">${translations[currentLang].played}</th>
            <th data-numeric="true">${translations[currentLang].wins}</th>
            <th data-numeric="true">${translations[currentLang].gf}</th>
            <th data-numeric="true">${translations[currentLang].ga}</th>
            <th data-numeric="true">${translations[currentLang].gd}</th>
          </tr>
        </thead>
        <tbody>
          ${sorted
            .map(
              (t, i) =>
                `<tr class="slide-in-left" style="animation-delay: ${i * 0.1}s">
                  <td class="rank">${i + 1}</td>
                  <td class="team-name">${t.name}</td>
                  <td data-numeric="true">${t.played}</td>
                  <td data-numeric="true">${t.wins}</td>
                  <td data-numeric="true">${t.gf}</td>
                  <td data-numeric="true">${t.ga}</td>
                  <td data-numeric="true" class="${t.gd >= 0 ? 'positive' : 'negative'}">${t.gd >= 0 ? '+' : ''}${t.gd}</td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderBracket(cupName, data, container) {
  if (!container) return;
  const rounds = data.rounds || [];
  if (!rounds.length) return (container.innerHTML = `<p>No bracket data available.</p>`);

  container.innerHTML = rounds
    .map(
      r => `
      <div class="round">
        <h3>${translations[currentLang].round} ${r.round_number || ""} - ${translations[currentLang].deadline}: ${r.deadlines?.english || "-"}</h3>
        <div class="games">
          ${r.games
            ?.map(
              g => `
            <div class="game" title="${g.notes || ""}">
              <span class="team ${g.winner === g.home_team ? "winner" : ""}">${g.home_team}</span>
              <span class="score">${g.home_score ?? "-"}</span> -
              <span class="score">${g.away_score ?? "-"}</span>
              <span class="team ${g.winner === g.away_team ? "winner" : ""}">${g.away_team}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

function renderBrackets() {
  renderBracket("Welsh", state.cups.Welsh, elements.brackets.welsh);
  renderBracket("Cardiff", state.cups.Cardiff, elements.brackets.cardiff);
}

function renderLastUpdated() {
  if (elements.lastUpdated) {
    elements.lastUpdated.textContent =
      `${translations[currentLang].lastUpdated} ${state.lastUpdated}`;
  }
}

// ============================================================
// THEME TOGGLE
// ============================================================
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.body.classList.add("dark");
  themeToggle.textContent = "🌙";
} else {
  themeToggle.textContent = "🌞";
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "🌙" : "🌞";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ===== UPDATE FIXTURES MODAL + CALL TO CLOUDFLARE WORKER =====

// If you change the Worker subdomain, update this:
const workerURL = "https://year7-fixtures-dispatch.oweekley.workers.dev/run";

// Modal elements (match the HTML above)
const updateBtn = document.getElementById("update-fixtures-btn");
const modal = document.getElementById("update-modal");
const closeBtn = document.getElementById("update-close");
const startBtn = document.getElementById("update-start");
const passInput = document.getElementById("update-pass");
const stepsList = document.getElementById("update-steps");
const errorEl = document.getElementById("update-error");

function openModal() {
  modal?.setAttribute("aria-hidden", "false");
  errorEl.hidden = true;
  passInput.value = "";
  resetSteps();
  passInput.focus({ preventScroll: true });
}

function closeModal() {
  modal?.setAttribute("aria-hidden", "true");
}

function resetSteps() {
  stepsList?.querySelectorAll("li").forEach(li => {
    li.classList.remove("is-active", "is-done");
  });
}

function setStep(name, state) {
  const li = stepsList?.querySelector(`li[data-step="${name}"]`);
  if (!li) return;
  if (state === "active") {
    li.classList.add("is-active");
  } else if (state === "done") {
    li.classList.remove("is-active");
    li.classList.add("is-done");
  } else if (state === "reset") {
    li.classList.remove("is-active", "is-done");
  }
}

updateBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", e => {
  if (e.target === modal) closeModal(); // click backdrop to close
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal?.getAttribute("aria-hidden") === "false") closeModal();
});

startBtn?.addEventListener("click", async () => {
  errorEl.hidden = true;
  console.info("update: start click");

  const password = passInput.value.trim();
  if (!password) {
    errorEl.textContent = "Please enter the admin password.";
    errorEl.hidden = false;
    passInput.focus();
    return;
  }

  // Stepper UI
  resetSteps();
  setStep("auth", "active");

  try {
    // Call the Cloudflare Worker
    const res = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({ password })
    });

    // Move steps regardless of outcome so user sees progress
    setStep("auth", "done");
    setStep("dispatch", "active");

    // Parse response
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      const msg = data?.error || `Request failed (${res.status})`;
      console.warn("update: worker returned error", { status: res.status, msg });
      throw new Error(msg);
    }
    console.info("update: worker accepted", { status: res.status });

    // Fake progress steps (we can’t watch GitHub live from here)
    setStep("dispatch", "done");
    setStep("run", "active");
    setTimeout(() => {
      setStep("run", "done");
      setStep("commit", "active");
      setTimeout(() => {
        setStep("commit", "done");
        setStep("done", "active");
      }, 600);
    }, 600);
  } catch (err) {
    // Show error
    setStep("dispatch", "done"); // where it likely failed
    console.error("update: failed", err);
    errorEl.textContent = `Warning: ${err.message || "Error contacting server"}`;
    errorEl.hidden = false;
  }
});

// =======================
// [LOGGING] Structured console logger (browser, no files)
// =======================
(function setupBrowserLogger() {
  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console)
  };

  const LEVELS = { debug: 10, info: 20, warn: 30, warning: 30, error: 40, critical: 50 };
  const qs = new URLSearchParams(location.search);
  const hintedDebug = qs.has("debug") || qs.get("logLevel") === "debug";
  const stored = (localStorage.getItem("logLevel") || "").toLowerCase();
  const envLevel = hintedDebug ? "debug" : stored || "info";
  const threshold = LEVELS[envLevel] ?? LEVELS.info;
  const sessionId =
    (crypto && crypto.randomUUID ? crypto.randomUUID() : `sess-${Math.random().toString(36).slice(2)}`);
  const moduleName = "frontend";

  function now() {
    return new Date().toISOString();
  }
  function should(level) {
    return (LEVELS[level] ?? 999) >= threshold;
  }
  function asEntry(level, msg, data, err) {
    const entry = {
      ts: now(),
      level: level.toUpperCase(),
      module: moduleName,
      sessionId,
      msg: String(msg)
    };
    if (data && typeof data === "object") entry.data = data;
    if (err) entry.err = { message: String(err.message || err), stack: String(err.stack || "") };
    return entry;
  }
  const emit = (level, msg, data, err) => {
    if (!should(level)) return;
    const e = asEntry(level, msg, data, err);
    const line = `[${e.level}] ${e.module} ${e.msg}`;
    (original[level] || original.log)(line, e);
  };

  // Patch console.* (non-intrusive; preserves original output + adds structure)
  console.log = (...a) => emit("info", a[0], a[1]);
  console.info = (...a) => emit("info", a[0], a[1]);
  console.warn = (...a) => emit("warn", a[0], a[1]);
  console.error = (...a) => {
    const [msg, maybeErrOrData] = a;
    if (maybeErrOrData instanceof Error) emit("error", msg, null, maybeErrOrData);
    else emit("error", msg, maybeErrOrData);
  };
  console.debug = (...a) => emit("debug", a[0], a[1]);

// Global error surfaces
window.addEventListener("error", e => {
  emit(
    "critical",
    "window.onerror",
    { filename: e.filename, lineno: e.lineno, colno: e.colno },
    e.error || e.message
  );
  
  // Show user-friendly error message
  showErrorMessage("An unexpected error occurred. Please refresh the page.");
});

window.addEventListener("unhandledrejection", e => {
  emit("error", "unhandledrejection", null, e.reason || "Promise rejection");
  
  // Show user-friendly error message
  showErrorMessage("A network error occurred. Please check your connection and try again.");
});

  // Fetch timing wrapper (transparent; returns the same response)
  const _fetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const started = performance.now();
    const url = args[0];
    try {
      const res = await _fetch(...args);
      const dur = Math.round(performance.now() - started);
      emit("debug", "fetch", { url, status: res.status, ms: dur });
      return res;
    } catch (err) {
      const dur = Math.round(performance.now() - started);
      emit("error", "fetch error", { url, ms: dur }, err);
      throw err;
    }
  };

  // Lifecycle hints (non-functional)
  emit("info", "frontend init", { level: envLevel });
})();

// ============================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================
// Preload critical resources
function preloadCriticalResources() {
  const criticalImages = [
    'icons/icon-192.png',
    'icons/icon-512.png'
  ];
  
  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  });
}

// Optimize scroll performance
function setupScrollOptimizations() {
  let ticking = false;
  
  function updateScrollElements() {
    // Add any scroll-based optimizations here
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollElements);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}
function setupIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Observe all sections for lazy loading
  document.querySelectorAll('.dashboard-overview, .cup-section, .bracket-container').forEach(el => {
    observer.observe(el);
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ============================================================
// KEYBOARD NAVIGATION & ACCESSIBILITY
// ============================================================
function setupKeyboardNavigation() {
  // Add keyboard support for theme toggle
  document.getElementById('theme-toggle')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('theme-toggle')?.click();
    }
  });

  // Add keyboard support for language buttons
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Add keyboard support for navigation
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        link.click();
      }
    });
  });

  // Add keyboard support for buttons
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Add keyboard support for selects
  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const options = Array.from(select.options);
        const currentIndex = options.findIndex(opt => opt.selected);
        let newIndex = currentIndex;
        
        if (e.key === 'ArrowUp') {
          newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        } else {
          newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        }
        
        select.selectedIndex = newIndex;
        select.dispatchEvent(new Event('change'));
      }
    });
  });
}

// ============================================================
// GLOBAL RENDER + REFRESH HANDLERS
// ============================================================
function renderAll() {
  if (!state.teams?.length) {
    console.warn("No teams found — check teams.json");
    return;
  }
  console.debug("renderAll: start");

  Object.keys(elements.dropdowns).forEach(cupName => {
    if (elements.dropdowns[cupName]) populateDropdowns(cupName);
  });

  renderLeaderboard();
  renderBrackets();
  renderLastUpdated();

  console.debug("renderAll: done");
}

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.info('SW registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            if (confirm('A new version is available. Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
      
    } catch (error) {
      console.warn('SW registration failed:', error);
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  console.info("app: DOMContentLoaded");
  
  // Setup performance optimizations
  setupIntersectionObserver();
  setupScrollOptimizations();
  preloadCriticalResources();
  
  // Setup accessibility features
  setupKeyboardNavigation();
  
  // Preload critical resources
  const criticalResources = ['style.css', 'script.js'];
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
  
  await loadData();
  setTimeout(() => {
    console.debug("app: post-load renderAll+initTeamDashboard");
    renderAll();
    initTeamDashboard(); // Initialize teamCard.html if present
  }, 300);
});

elements.refresh?.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  const originalText = translations[currentLang].refresh;
  elements.refresh.textContent = `${originalText}...`;
  await loadData();
  elements.refresh.textContent = originalText;
  elements.refresh.disabled = false;
});