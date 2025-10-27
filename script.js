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
    friendliesOverview: "Trosolwg Cyfeillgarwch",
    stats: "Ystadegau",
    played: "Chwaraeodd",
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
  cups: {
    Welsh: {},
    Cardiff: {},
    Friendlies: {}
  },
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
      display: document.getElementById("welsh-display"),
      left: document.getElementById("welsh-left")
    },
    Cardiff: {
      team: document.getElementById("cardiff-team"),
      data: document.getElementById("cardiff-data"),
      display: document.getElementById("cardiff-display"),
      left: document.getElementById("cardiff-left")
    },
    Friendlies: {
      team: document.getElementById("friendlies-team"),
      data: document.getElementById("friendlies-data"),
      display: document.getElementById("friendlies-display")
    }
  },
  teamCard: {
    select: document.getElementById("team-select"),
    dataSelect: document.getElementById("data-select"),
    display: document.getElementById("team-display")
  },
  matches: {
    select: document.getElementById("competition-select"),
    display: document.getElementById("matches-display")
  },
  brackets: {
    welsh: document.getElementById("welsh-bracket-container"),
    cardiff: document.getElementById("cardiff-bracket-container")
  },
  leaderboard: document.getElementById("leaderboard"),
  lastUpdated: document.getElementById("last-updated"),
  refresh: document.getElementById("refresh-btn")
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
// DATA LOADING
// =======================
async function loadData() {
  try {
    const [teams, welsh, cardiff, friendlies, updated] = await Promise.all([
      fetch("teams.json").then(r => r.json()),
      fetch("welsh.json").then(r => r.json()),
      fetch("cardiff.json").then(r => r.json()),
      fetch("friendlies.json").then(r => r.json()),
      fetch("last_updated.json").then(r => r.json()).catch(() => ({ lastUpdated: "Unknown" }))
    ]);

    state.teams = teams.teams || [];
    state.cups.Welsh = welsh;
    state.cups.Cardiff = cardiff;
    state.cups.Friendlies = friendlies;
    state.lastUpdated = updated.lastUpdated || "Unknown";

    calculateStats();
    renderAll();
  } catch (err) {
    console.error("Error loading data:", err);
  }
}

// =======================
// CALCULATE TEAM STATS
// =======================
function calculateStats() {
  state.teams.forEach(t => Object.assign(t, { played: 0, wins: 0, gf: 0, ga: 0, gd: 0 }));

  const updateStats = g => {
    if (!g.home || !g.away || g.away === "BYE" || g.h_score == null || g.a_score == null) return;
    const home = state.teams.find(t => t.name === g.home);
    const away = state.teams.find(t => t.name === g.away);
    if (!home || !away) return;

    home.played++; away.played++;
    home.gf += g.h_score; home.ga += g.a_score;
    away.gf += g.a_score; away.ga += g.h_score;

    if (g.h_score > g.a_score) home.wins++;
    else if (g.a_score > g.h_score) away.wins++;
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

  team.addEventListener("change", () => updateCupDisplay(cupName));
  data.addEventListener("change", () => updateCupDisplay(cupName));
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
  return `
    <h3>${translations[currentLang][cupName.toLowerCase() + "Matches"] || cupName + " Matches"}</h3>
    ${data.rounds
      ?.map(
        r => `
      <h4>${translations[currentLang].round} ${r.round || ""} - ${translations[currentLang].deadline}: ${r.deadline || "-"}</h4>
      <table>
        <tr><th>${translations[currentLang].home}</th><th>${translations[currentLang].hScore}</th><th>${translations[currentLang].aScore}</th><th>${translations[currentLang].away}</th><th>${translations[currentLang].winner}</th><th>${translations[currentLang].date}</th><th>${translations[currentLang].matchNotes}</th></tr>
        ${r.games
          ?.filter(g => g.home === teamName || g.away === teamName)
          .map(
            g => `<tr>
              <td>${g.home}</td>
              <td>${g.h_score ?? "-"}</td>
              <td>${g.a_score ?? "-"}</td>
              <td>${g.away}</td>
              <td>${g.winner ?? "-"}</td>
              <td>${g.date ?? "-"}</td>
              <td>${g.notes ?? ""}</td>
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

function renderBrackets() {
  const { welsh, cardiff } = elements.brackets;
  renderBracket("Welsh", state.cups.Welsh, welsh);
  renderBracket("Cardiff", state.cups.Cardiff, cardiff);
}

function renderBracket(cupName, data, container) {
  if (!container) return;
  container.innerHTML = data.rounds
    ?.map(
      r => `
      <div class="round">
        <h3>${translations[currentLang].round} ${r.round} - ${translations[currentLang].deadline}: ${r.deadline || "-"}</h3>
        <div class="games">
          ${r.games
            ?.map(
              g => `
            <div class="game" title="${g.notes || ""}">
              <span class="team ${g.winner === g.home ? "winner" : ""}">${g.home}</span>
              <span class="score">${g.h_score ?? "-"}</span> -
              <span class="score">${g.a_score ?? "-"}</span>
              <span class="team ${g.winner === g.away ? "winner" : ""}">${g.away}</span>
            </div>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

// =======================
// DARK MODE TOGGLE
// =======================
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
} else {
  document.body.classList.remove("dark");
  themeToggle.textContent = "🌙";
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
		  
function renderLastUpdated() {
  if (elements.lastUpdated)
    elements.lastUpdated.textContent = `${translations[currentLang].lastUpdated} ${state.lastUpdated}`;
}

// =======================
// REFRESH + FULL RENDER
// =======================
function renderAll() {
  Object.keys(elements.dropdowns).forEach(populateDropdowns);
  renderLeaderboard();
  renderBrackets();
  renderLastUpdated();
}

elements.refresh?.addEventListener("click", async () => {
  elements.refresh.disabled = true;
  elements.refresh.textContent = `${translations[currentLang].refresh}...`;
  await loadData();
  elements.refresh.textContent = translations[currentLang].refresh;
  elements.refresh.disabled = false;
});

// =======================
// INIT
// =======================
loadData();