// ============================================================
//  YEAR 7 CUPS DASHBOARD 2025 - CORE SCRIPT
//  Features: Bilingual UI, Auto Data Loading, Leaderboards,
//  Match History, Refresh Button, Last Updated, Brackets.
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
    matchNotes: "Notes",
    leaderboard: "Leaderboard",
    refresh: "Refresh Data",
    lastUpdated: "Last Updated:"
  },
  cy: {
    dashboardTitle: "Dangosfwrdd Cwpanau Blwyddyn 7 2025",
    dashboard: "Dangosfwrdd",
    teamDashboard: "Dangosfwrdd Tîm",
    brackets: "Braketiau",
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
    matchNotes: "Nodiadau",
    leaderboard: "Tabl Cynghrair",
    refresh: "Adnewyddu Data",
    lastUpdated: "Diweddarwyd Diwethaf:"
  }
};

let currentLang = "en";

// =======================
// GLOBAL STATE
// =======================
const state = {
  teams: [],
  cups: { Welsh: {}, Cardiff: {}, Friendlies: {} },
  lastUpdated: "Unknown"
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

// =======================
// LANGUAGE SWITCHER
// =======================
function switchLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  renderAll();
}

document.getElementById("lang-en")?.addEventListener("click", () => switchLanguage("en"));
document.getElementById("lang-cy")?.addEventListener("click", () => switchLanguage("cy"));

// =======================
// DATA LOADING + NORMALIZATION
// =======================
async function loadData() {
  try {
    const safeFetch = async (file) => {
      console.log(" Fetching:", file);
      const res = await fetch(file);
      if (!res.ok) throw new Error(`${file} - ${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        console.error(` JSON parse error in ${file}:`, err.message);
        console.log("First 200 chars of file:", text.slice(0, 200));
        throw err;
      }
    };

    async function loadData() {
  try {
    const urls = ["teams.json", "welsh.json", "cardiff.json", "friendlies.json", "last_updated.json"];
    for (const url of urls) {
      console.log(" Trying to load:", url);
      const res = await fetch(url);
      const text = await res.text();
      try {
        JSON.parse(text);
        console.log(" Parsed successfully:", url);
      } catch (e) {
        console.error(" JSON error in", url, e.message);
        console.log(" First 200 chars:", text.slice(0, 200));
        throw e;
      }
    }
  } catch (err) {
    console.error(" Error loading data:", err);
  }
}

    console.log(" All JSON files fetched successfully!");

    // Normalize team data
    let teams = [];
    if (Array.isArray(teamsRaw?.teams)) {
      teams = teamsRaw.teams.map(t => ({
        name: t.name ?? t.team ?? "",
        notes: t.notes ?? "",
        played: t.games_played ?? t.played ?? 0,
        wins: t.wins ?? 0,
        gf: t.goals_for ?? t.gf ?? 0,
        ga: t.goals_against ?? t.ga ?? 0,
        gd: t.goal_difference ?? t.gd ?? ((t.goals_for ?? 0) - (t.goals_against ?? 0))
      }));
    } else if (typeof teamsRaw === "object") {
      teams = Object.entries(teamsRaw).map(([name, s]) => ({
        name,
        notes: s.notes ?? "",
        played: s.games_played ?? s.played ?? 0,
        wins: s.wins ?? 0,
        gf: s.goals_for ?? s.gf ?? 0,
        ga: s.goals_against ?? s.ga ?? 0,
        gd: s.goal_difference ?? s.gd ?? ((s.goals_for ?? 0) - (s.goals_against ?? 0))
      }));
    }

    state.teams = teams;
    state.cups.Welsh = welsh;
    state.cups.Cardiff = cardiff;
    state.cups.Friendlies = friendlies;
    state.lastUpdated = updated.lastUpdated || "Unknown";

    calculateStats();
    renderAll();

  } catch (err) {
    console.error(" Error loading data:", err);
  }
}

// =======================
// CALCULATE TEAM STATS
// =======================
function calculateStats() {
  state.teams.forEach(t => Object.assign(t, { played: 0, wins: 0, gf: 0, ga: 0, gd: 0 }));

  const updateStats = g => {
    const home = state.teams.find(t => t.name === g.home_team);
    const away = state.teams.find(t => t.name === g.away_team);
    if (!home || !away || g.away_team === "BYE" || g.home_score == null || g.away_score == null) return;

    home.played++; away.played++;
    home.gf += g.home_score; home.ga += g.away_score;
    away.gf += g.away_score; away.ga += g.home_score;

    if (g.home_score > g.away_score) home.wins++;
    else if (g.away_score > g.home_score) away.wins++;
  };

  Object.values(state.cups).forEach(cup =>
    cup.rounds?.forEach(r => r.games?.forEach(updateStats))
  );

  state.teams.forEach(t => (t.gd = t.gf - t.ga));
}

// =======================
// UI RENDERING HELPERS
// =======================
function populateDropdowns(cupName) {
  const { team, data } = elements.dropdowns[cupName];
  if (!team || !data) return;

  team.innerHTML = `<option value="">--Choose a Team--</option>`;
  data.innerHTML = `<option value="">--Team Stats / Match History--</option>`;

  state.teams.forEach(t => (team.innerHTML += `<option value="${t.name}">${t.name}</option>`));
  ["Team Stats", "Match History"].forEach(d => (data.innerHTML += `<option value="${d}">${d}</option>`));

  team.onchange = () => updateCupDisplay(cupName);
  data.onchange = () => updateCupDisplay(cupName);
}

function updateCupDisplay(cupName) {
  const { team, data, display } = elements.dropdowns[cupName];
  const teamName = team.value;
  const dataType = data.value;
  if (!teamName || !dataType) return (display.innerHTML = "");

  const teamData = state.teams.find(t => t.name === teamName);
  const cupData = state.cups[cupName];

  display.innerHTML =
    dataType === "Team Stats"
      ? renderTeamStats(teamData)
      : renderMatchHistory(teamName, cupName, cupData);
}

function renderTeamStats(team) {
  return `
    <h3>${team.name} - ${translations[currentLang].stats}</h3>
    <table>
      <tr><th>${translations[currentLang].played}</th><th>${translations[currentLang].wins}</th><th>${translations[currentLang].gf}</th><th>${translations[currentLang].ga}</th><th>${translations[currentLang].gd}</th></tr>
      <tr><td>${team.played}</td><td>${team.wins}</td><td>${team.gf}</td><td>${team.ga}</td><td>${team.gd}</td></tr>
    </table>
    <p>${translations[currentLang].notes} ${team.notes || "-"}</p>
  `;
}

function renderMatchHistory(teamName, cupName, data) {
  const rounds = data.rounds || [];
  return `
    <h3>${translations[currentLang][cupName.toLowerCase() + "Matches"] || cupName + " Matches"}</h3>
    ${rounds.map(r => `
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
          .map(g => `
            <tr>
              <td>${g.home_team}</td>
              <td>${g.home_score ?? "-"}</td>
              <td>${g.away_score ?? "-"}</td>
              <td>${g.away_team}</td>
              <td>${g.winner ?? "-"}</td>
              <td>${g.date ?? "-"}</td>
            </tr>
          `).join("")}
      </table>
    `).join("")}
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
      ${sorted.map((t, i) =>
        `<tr><td>${i + 1}</td><td>${t.name}</td><td>${t.played}</td><td>${t.wins}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td></tr>`
      ).join("")}
    </table>`;
}

function renderBracket(cupName, data, container) {
  if (!container) return;
  const rounds = data.rounds || [];
  container.innerHTML = rounds.map(r => `
    <div class="round">
      <h3>${translations[currentLang].round} ${r.round_number || ""} - ${translations[currentLang].deadline}: ${r.deadlines?.english || "-"}</h3>
      <div class="games">
        ${r.games?.map(g => `
          <div class="game" title="${g.notes || ""}">
            <span class="team ${g.winner === g.home_team ? "winner" : ""}">${g.home_team}</span>
            <span class="score">${g.home_score ?? "-"}</span> -
            <span class="score">${g.away_score ?? "-"}</span>
            <span class="team ${g.winner === g.away_team ? "winner" : ""}">${g.away_team}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function renderBrackets() {
  renderBracket("Welsh", state.cups.Welsh, elements.brackets.welsh);
  renderBracket("Cardiff", state.cups.Cardiff, elements.brackets.cardiff);
}

function renderLastUpdated() {
  if (elements.lastUpdated)
    elements.lastUpdated.textContent = `${translations[currentLang].lastUpdated} ${state.lastUpdated}`;
}

// =======================
// DARK MODE TOGGLE
// =======================
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.body.classList.add("dark");
  themeToggle.textContent = "Sun";
} else {
  document.body.classList.remove("dark");
  themeToggle.textContent = "Moon";
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "Sun" : "Moon";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// =======================
// REFRESH + RENDER
// =======================
function renderAll() {
  // Make sure teams actually exist before rendering dropdowns
  if (!state.teams || !state.teams.length) {
    console.warn(" No teams found — check teams.json");
    return;
  }

  Object.keys(elements.dropdowns).forEach(cupName => {
    if (elements.dropdowns[cupName]) populateDropdowns(cupName);
  });

  renderLeaderboard();
  renderBrackets();
  renderLastUpdated();
}

// Run only after DOM fully loads
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  // In case loadData() finishes before dropdowns are ready
  setTimeout(() => {
    renderAll();
  }, 300);
});

elements.refresh?.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  elements.refresh.textContent = `${translations[currentLang].refresh}...`;
  await loadData();
  elements.refresh.textContent = translations[currentLang].refresh;
  elements.refresh.disabled = false;
});