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
    teamDashboard: "Dangosfwrdd Tîm",
    brackets: "Bracetiau",
    welshCupOverview: "Trosolwg Cwpan Cymru",
    selectTeam: "Dewiswch Dîm:",
    selectData: "Dewiswch Ddata:",
    cardiffCupOverview: "Trosolwg Cwpan Caerdydd",
    friendliesOverview: "Trosolwg Gemau Cyfeillgar",
    stats: "Ystadegau",
    played: "Gemau",
    wins: "Enillodd",
    gf: "Gôl I",
    ga: "Gôl Yn Erbyn",
    gd: "Gwahaniaeth Gôl",
    notes: "Nodiadau:",
    welshMatches: "Gemau Cymru",
    round: "Rownd",
    deadline: "Dyddiad Cau",
    home: "Cartref",
    hScore: "SG Cartref",
    aScore: "SG Allan",
    away: "Allan",
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
// DATA FETCHING + NORMALIZATION
// ============================================================
async function fetchJSON(url) {
  if (state.cache[url]) return state.cache[url];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const json = await res.json();
  state.cache[url] = json;
  return json;
}

async function loadData() {
  try {
    console.log("🔄 Loading data files...");

    const [teamsRaw, welsh, cardiff, friendlies, updated] = await Promise.all([
      fetchJSON("teams.json"),
      fetchJSON("welsh.json"),
      fetchJSON("cardiff.json"),
      fetchJSON("friendlies.json"),
      fetchJSON("last_updated.json").catch(() => ({ lastUpdated: "Unknown" }))
    ]);

    console.log("✅ All JSON files loaded successfully.");

    // Normalize teams.json
    let teams = [];
    if (Array.isArray(teamsRaw?.teams)) {
      teams = teamsRaw.teams.map(t => ({
        name: t.name ?? t.team ?? "",
        notes: t.notes ?? "",
        played: +t.played || 0,
        wins: +t.wins || 0,
        gf: +t.gf || 0,
        ga: +t.ga || 0,
        gd: +t.gd || ((+t.gf || 0) - (+t.ga || 0))
      }));
    } else if (typeof teamsRaw === "object") {
      teams = Object.entries(teamsRaw).map(([name, s]) => ({
        name,
        notes: s.notes ?? "",
        played: +s.played || 0,
        wins: +s.wins || 0,
        gf: +s.gf || 0,
        ga: +s.ga || 0,
        gd: +s.gd || ((+s.gf || 0) - (+s.ga || 0))
      }));
    }

    state.teams = teams;
    state.cups = { Welsh: welsh, Cardiff: cardiff, Friendlies: friendlies };
    state.lastUpdated = updated.lastUpdated || "Unknown";

    calculateStats();
    renderAll();
  } catch (err) {
    console.error("❌ Error loading data:", err);
    showErrorMessage("Error loading data. Please check your JSON files or network connection.");
  }
}

function showErrorMessage(message) {
  document.querySelectorAll(".dynamic-display, .bracket-container, #leaderboard").forEach(el => {
    if (el) el.innerHTML = `<p style="color:crimson;text-align:center;padding:1rem">${message}</p>`;
  });
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

    home.played++; away.played++;
    home.gf += +g.home_score; home.ga += +g.away_score;
    away.gf += +g.away_score; away.ga += +g.home_score;

    if (g.home_score > g.away_score) home.wins++;
    else if (g.away_score > g.home_score) away.wins++;
  };

  Object.values(state.cups).forEach(cup => cup.rounds?.forEach(r => r.games?.forEach(updateStats)));
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
  teamSelect.innerHTML = `<option value="">--${translations[currentLang].selectTeam.replace(":", "")}--</option>`;
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
        .join("<hr style='margin:2rem 0;border:none;border-top:1px solid rgba(0,0,0,0.1)'>");

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
      .map(r => `
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
    <h2>${translations[currentLang].leaderboard}</h2>
    <table>
      <tr><th>#</th><th>Team</th><th>${translations[currentLang].played}</th><th>${translations[currentLang].wins}</th><th>${translations[currentLang].gf}</th><th>${translations[currentLang].ga}</th><th>${translations[currentLang].gd}</th></tr>
      ${sorted
        .map(
          (t, i) =>
            `<tr><td>${i + 1}</td><td>${t.name}</td><td>${t.played}</td><td>${t.wins}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td></tr>`
        )
        .join("")}
    </table>`;
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
  if (elements.lastUpdated)
    elements.lastUpdated.textContent = `${translations[currentLang].lastUpdated} ${state.lastUpdated}`;
}

// ============================================================
// THEME TOGGLE
// ============================================================
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
} else {
  themeToggle.textContent = "🌙";
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// ============================================================
// GLOBAL RENDER + REFRESH HANDLERS
// ============================================================
function renderAll() {
  if (!state.teams?.length) {
    console.warn("⚠️ No teams found — check teams.json");
    return;
  }

  Object.keys(elements.dropdowns).forEach(cupName => {
    if (elements.dropdowns[cupName]) populateDropdowns(cupName);
  });

  renderLeaderboard();
  renderBrackets();
  renderLastUpdated();
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  setTimeout(() => {
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