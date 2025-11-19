(() => {
  const translations = window.translations || {};
  let currentLang =
    document.documentElement.lang || (translations.en ? "en" : Object.keys(translations)[0] || "en");

  const state = {
    cups: {},
    meta: null,
    dropdownTeams: {
      Welsh: [],
      Cardiff: [],
      Friendlies: [],
    },
    selectedTeams: {
      Welsh: "",
      Cardiff: "",
      Friendlies: "",
    },
    cupStats: {
      Welsh: new Map(),
      Cardiff: new Map(),
      Friendlies: new Map(),
    },
    aggregates: {
      cupsOnly: new Map(),
      withFriendlies: new Map(),
    },
    rankings: {
      base: [],
      withFriendlies: [],
    },
    leaderboardMode: "cups",
    brackets: {
      current: "Welsh",
    },
    comparison: {
      teamsByCup: {
        Welsh: [],
        Cardiff: [],
        Friendlies: [],
      },
      selections: {
        home: {
          cup: "Welsh",
          team: "",
        },
        away: {
          cup: "Cardiff",
          team: "",
        },
      },
      lastProjection: null,
      initialized: false,
    },
  };

  const elements = {
    lastUpdated: document.getElementById("last-updated"),
    leaderboard: {
      container: document.getElementById("leaderboard"),
    },
    leaderboardTable: document.getElementById("combined-standings-table"),
    leaderboardButtons: {
      cups: document.getElementById("leaderboard-mode-cups"),
      all: document.getElementById("leaderboard-mode-all"),
    },
    brackets: {
      display: document.getElementById("bracket-display"),
      select: document.getElementById("bracket-select"),
      title: document.getElementById("bracket-title"),
      card: document.querySelector(".bracket-card"),
    },
    comparison: {
      homeCup: document.getElementById("compare-home-cup"),
      homeTeam: document.getElementById("compare-home-team"),
      homeSummary: document.getElementById("compare-home-summary"),
      awayCup: document.getElementById("compare-away-cup"),
      awayTeam: document.getElementById("compare-away-team"),
      awaySummary: document.getElementById("compare-away-summary"),
      metrics: document.getElementById("compare-advanced"),
      result: document.getElementById("compare-result"),
      runButton: document.getElementById("compare-run"),
    },
    dropdowns: {
      Welsh: {
        select: document.getElementById("welsh-team"),
        display: document.getElementById("welsh-display"),
        section: document.getElementById("welsh-cup"),
      },
      Cardiff: {
        select: document.getElementById("cardiff-team"),
        display: document.getElementById("cardiff-display"),
        section: document.getElementById("cardiff-cup"),
      },
      Friendlies: {
        select: document.getElementById("friendlies-team"),
        display: document.getElementById("friendlies-display"),
        section: document.getElementById("friendlies"),
      },
    },
    heroStats: {
      teams: document.getElementById("stat-teams"),
      games: document.getElementById("stat-games"),
      goals: document.getElementById("stat-goals"),
    },
    snapshots: {
      Welsh: {
        percent: document.getElementById("welsh-progress-percent"),
        count: document.getElementById("welsh-progress-count"),
        bar: document.getElementById("welsh-progress-bar"),
        deadline: document.getElementById("welsh-next-deadline"),
      },
      Cardiff: {
        percent: document.getElementById("cardiff-progress-percent"),
        count: document.getElementById("cardiff-progress-count"),
        bar: document.getElementById("cardiff-progress-bar"),
        deadline: document.getElementById("cardiff-next-deadline"),
      },
    },
    leaders: [
      {
        name: document.getElementById("leader-1-name"),
        record: document.getElementById("leader-1-record"),
        goalDiff: document.getElementById("leader-1-gd"),
      },
      {
        name: document.getElementById("leader-2-name"),
        record: document.getElementById("leader-2-record"),
        goalDiff: document.getElementById("leader-2-gd"),
      },
      {
        name: document.getElementById("leader-3-name"),
        record: document.getElementById("leader-3-record"),
        goalDiff: document.getElementById("leader-3-gd"),
      },
    ],
  };

  const DATA_FILES = {
    Welsh: "welsh.json",
    Cardiff: "cardiff.json",
    Friendlies: "friendlies.json",
    Meta: "last_updated.json",
  };

  const PLACEHOLDER_TOKENS = ["bye", "tbd", "tbc", "tba", "winner of", "loser of"];

  function translate(key) {
    if (!key) return "";
    const langTable = translations[currentLang] || translations.en || {};
    if (langTable[key]) return langTable[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return key;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;
      const value = translate(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", value);
      } else {
        el.textContent = value;
      }
    });
  }

  function updateLanguageButtons() {
    document.querySelectorAll(".lang-switch button").forEach((button) => {
      const lang = button.id ? button.id.replace("lang-", "") : button.dataset.lang;
      const isActive = lang === currentLang;
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setLanguage(lang) {
    if (!translations[lang] && lang !== "en") {
      lang = "en";
    }
    currentLang = lang;
    document.documentElement.lang = lang;
    updateLanguageButtons();
    applyTranslations();
    refreshUI();
  }

  function attachLanguageSwitches() {
    document.querySelectorAll(".lang-switch button").forEach((button) => {
      const lang = button.id ? button.id.replace("lang-", "") : button.dataset.lang;
      button.addEventListener("click", () => setLanguage(lang));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setLanguage(lang);
      });
    });
  }

  async function fetchJSON(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${url} (${response.status})`);
    }
    return response.json();
  }

  function parseScore(value) {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function ensureStats(map, team) {
    if (!team) return null;
    if (!map.has(team)) {
      map.set(team, {
        name: team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      });
    }
    return map.get(team);
  }

  function updateGoalDifference(stats) {
    if (!stats) return;
    stats.gd = stats.gf - stats.ga;
  }

  function computeCupStats(cupData = {}) {
    const map = new Map();
    const rounds = Array.isArray(cupData.rounds) ? cupData.rounds : [];

    rounds.forEach((round) => {
      (round?.games || []).forEach((game) => {
        const home = sanitizeTeamName(game.home_team);
        const away = sanitizeTeamName(game.away_team);
        if (!home || !away) return;

        const homeStats = ensureStats(map, home);
        const awayStats = ensureStats(map, away);
        if (!homeStats || !awayStats) return;

        const homeScore = parseScore(game.home_score);
        const awayScore = parseScore(game.away_score);
        const hasScores = homeScore !== null && awayScore !== null;
        const winner = sanitizeTeamName(game.winner);

        if (hasScores) {
          homeStats.played += 1;
          awayStats.played += 1;
          homeStats.gf += homeScore;
          homeStats.ga += awayScore;
          awayStats.gf += awayScore;
          awayStats.ga += homeScore;

          if (homeScore > awayScore) {
            homeStats.wins += 1;
            awayStats.losses += 1;
          } else if (awayScore > homeScore) {
            awayStats.wins += 1;
            homeStats.losses += 1;
          } else {
            homeStats.draws += 1;
            awayStats.draws += 1;
          }
        } else if (winner) {
          homeStats.played += 1;
          awayStats.played += 1;
          if (winner === home) {
            homeStats.wins += 1;
            awayStats.losses += 1;
          } else if (winner === away) {
            awayStats.wins += 1;
            homeStats.losses += 1;
          } else {
            homeStats.draws += 1;
            awayStats.draws += 1;
          }
        }

        updateGoalDifference(homeStats);
        updateGoalDifference(awayStats);
      });
    });

    return map;
  }

  function mergeStatMaps(maps = []) {
    const merged = new Map();

    maps.forEach((map) => {
      map.forEach((stats, team) => {
        const target = ensureStats(merged, team);
        if (!target) return;
        target.played += stats.played;
        target.wins += stats.wins;
        target.draws += stats.draws;
        target.losses += stats.losses;
        target.gf += stats.gf;
        target.ga += stats.ga;
        updateGoalDifference(target);
      });
    });

    return merged;
  }

  function sortStatsMap(map) {
    return [...map.values()].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      if (b.played !== a.played) return b.played - a.played;
      return a.name.localeCompare(b.name);
    });
  }

  function formatGoalDifference(value) {
    if (value === null || value === undefined) return "0";
    return value > 0 ? `+${value}` : String(value);
  }

  function renderStatsTable(rows, { ranked = false } = {}) {
    if (!rows || !rows.length) {
      return `<p>${translate("noDataAvailable") || "No data available"}</p>`;
    }

    const columns = [];
    if (ranked) {
      columns.push({
        key: "rank",
        label: "#",
        className: "rank",
        numeric: true,
        getValue: (_row, index) => index + 1,
      });
    }

    columns.push(
      {
        key: "team",
        label: translate("teamName") || "Team",
        className: "team-name",
        getValue: (row) => row.name || translate("unknown") || "Unknown",
      },
      {
        key: "played",
        label: translate("played") || "Played",
        numeric: true,
        getValue: (row) => row.played,
      },
      {
        key: "wins",
        label: translate("wins") || "Wins",
        numeric: true,
        getValue: (row) => row.wins,
      },
      {
        key: "draws",
        label: translate("draws") || "Draws",
        numeric: true,
        getValue: (row) => row.draws,
      },
      {
        key: "losses",
        label: translate("losses") || "Losses",
        numeric: true,
        getValue: (row) => row.losses,
      },
      {
        key: "gf",
        label: translate("gf") || "GF",
        numeric: true,
        getValue: (row) => row.gf,
      },
      {
        key: "ga",
        label: translate("ga") || "GA",
        numeric: true,
        getValue: (row) => row.ga,
      },
      {
        key: "gd",
        label: translate("gd") || "GD",
        numeric: true,
        className: "goal-diff",
        getValue: (row) => formatGoalDifference(row.gd),
        getModifier: (row) => (row.gd >= 0 ? "positive" : "negative"),
      }
    );

    const headerRow = columns
      .map((col) => `<th${col.numeric ? ' data-numeric="true"' : ''}>${col.label}</th>`)
      .join("");

    const bodyRows = rows
      .map((row, index) => {
        const cells = columns
          .map((col) => {
            const value = col.getValue(row, index);
            const label = col.label;
            const modifier = col.getModifier ? col.getModifier(row, index) : "";
            const classes = [col.className, modifier].filter(Boolean).join(" ");
            const classAttr = classes ? ` class="${classes}"` : "";
            const numericAttr = col.numeric ? ' data-numeric="true"' : "";
            return `<td${classAttr}${numericAttr} data-label="${label}">${value}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `<table>
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
  }

  function orderTeamsForDropdown(names) {
    const unique = dedupe(names);
    const available = new Set(unique);
    const ordered = [];

    state.rankings.base.forEach((team) => {
      if (available.has(team.name)) {
        ordered.push(team.name);
        available.delete(team.name);
      }
    });

    available.forEach((name) => ordered.push(name));
    return ordered;
  }

  function computeActiveCupTeams(cupData = {}) {
    const rounds = Array.isArray(cupData.rounds) ? cupData.rounds : [];
    const allTeams = new Set();
    const eliminated = new Set();
    const stillIn = new Set();

    rounds.forEach((round) => {
      (round.games || []).forEach((game) => {
        const home = sanitizeTeamName(game.home_team);
        const away = sanitizeTeamName(game.away_team);
        const winner = sanitizeTeamName(game.winner);

        if (home) allTeams.add(home);
        if (away) allTeams.add(away);

        const hasWinner = winner && (winner === home || winner === away);
        const hasResult =
          Number.isFinite(Number(game.home_score)) &&
          Number.isFinite(Number(game.away_score));

        if (hasWinner) {
          stillIn.add(winner);
          [home, away].forEach((team) => {
            if (team && team !== winner) {
              eliminated.add(team);
            }
          });
        } else if (hasResult && home && away) {
          if (game.home_score === game.away_score) {
            stillIn.add(home);
            stillIn.add(away);
          } else if (game.home_score > game.away_score) {
            stillIn.add(home);
            eliminated.add(away);
          } else if (game.away_score > game.home_score) {
            stillIn.add(away);
            eliminated.add(home);
          }
        } else {
          [home, away].forEach((team) => {
            if (team) stillIn.add(team);
          });
        }
      });
    });

    const survivors = [];
    allTeams.forEach((team) => {
      if (team && !eliminated.has(team)) {
        survivors.push(team);
      }
    });

    stillIn.forEach((team) => {
      if (team && !survivors.includes(team)) {
        survivors.push(team);
      }
    });

    return survivors;
  }

  function computeFriendliesTeams(friendlies = {}) {
    const stats = friendlies.team_statistics || {};
    const fromStats = Object.entries(stats)
      .filter(([, data]) => Number(data?.played ?? 0) > 0)
      .map(([name]) => name);

    const rounds = Array.isArray(friendlies.rounds) ? friendlies.rounds : [];
    const fromGames = [];
    rounds.forEach((round) => {
      (round.games || []).forEach((game) => {
        const home = sanitizeTeamName(game.home_team);
        const away = sanitizeTeamName(game.away_team);
        if (home) fromGames.push(home);
        if (away) fromGames.push(away);
      });
    });

    return dedupe([...fromStats, ...fromGames]);
  }

  function sanitizeTeamName(value) {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (PLACEHOLDER_TOKENS.some((token) => lower.startsWith(token))) {
      return null;
    }
    return trimmed;
  }

function dedupe(list = []) {
  const seen = new Set();
  const result = [];
  list.forEach((item) => {
    if (!item || seen.has(item)) return;
      seen.add(item);
      result.push(item);
  });
  return result;
}

function sortTeamsAlphabetically(list = []) {
  return dedupe(list).sort((a, b) => a.localeCompare(b));
}

function showLoadingState() {
  if (elements.leaderboardTable) {
    elements.leaderboardTable.innerHTML = `<p>${translate("loadingData") || "Loading..."}</p>`;
    }
    if (elements.brackets.display) {
      elements.brackets.display.innerHTML = `<p>${translate("loadingBrackets") || "Loading brackets..."}</p>`;
    }
    Object.values(elements.dropdowns).forEach(({ display }) => {
      if (display) {
        display.innerHTML = `<p>${translate("loadingData") || "Loading..."}</p>`;
        display.classList.add("loaded");
      }
    });
  }

  function renderCombinedSnapshots() {
    if (!elements.leaderboardTable) return;

    const hasFriendlies = state.rankings.withFriendlies.length > 0;
    let mode = state.leaderboardMode || "cups";
    if (mode === "all" && !hasFriendlies) {
      mode = "cups";
      state.leaderboardMode = "cups";
    }

    const rows = mode === "all" ? state.rankings.withFriendlies : state.rankings.base;
    const headingKey = mode === "all" ? "allFixturesTitle" : "competitiveCupsTitle";
    const heading = translate(headingKey);
    elements.leaderboardTable.innerHTML = `
      <h3 class="leaderboard-active-title">${heading}</h3>
      ${renderStatsTable(rows, { ranked: true })}
    `;
    updateLeaderboardButtons(mode, hasFriendlies);
  }

  function updateLeaderboardButtons(mode, hasFriendlies) {
    const { cups, all } = elements.leaderboardButtons;
    if (cups) {
      cups.classList.toggle("active", mode === "cups");
      cups.setAttribute("aria-pressed", String(mode === "cups"));
      cups.setAttribute("aria-disabled", "false");
    }
    if (all) {
      all.disabled = !hasFriendlies;
      all.classList.toggle("is-disabled", !hasFriendlies);
      all.classList.toggle("active", mode === "all");
      all.setAttribute("aria-pressed", String(mode === "all"));
      all.setAttribute("aria-disabled", String(!hasFriendlies));
    }
  }

  function renderLastUpdated(meta) {
    const label = translate("lastUpdated") || "Last Updated:";
    if (!elements.lastUpdated) return;
    if (!meta?.last_updated) {
      elements.lastUpdated.textContent = `${label} ${translate("unknown") || "Unknown"}`;
      return;
    }

    const timestamp = new Date(meta.last_updated);
    const formatted = Number.isNaN(timestamp.getTime())
      ? meta.last_updated
      : timestamp.toLocaleString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    elements.lastUpdated.textContent = `${label} ${formatted}`;
  }

  function populateDropdown(cupKey, teams) {
    const config = elements.dropdowns[cupKey];
    if (!config?.select || !config.display) return;

    const selectorWrapper = config.section?.querySelector(".selectors");
    const select = config.select;
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.dataset.i18n = "chooseTeam";
    placeholder.textContent = translate("chooseTeam") || "--Choose a Team--";
    select.appendChild(placeholder);

    if (!teams.length) {
      select.disabled = true;
      if (selectorWrapper && cupKey === "Friendlies") {
        selectorWrapper.hidden = true;
      }
      config.display.innerHTML = `<p>${translate("noMatchData") || "No match data available."}</p>`;
      config.display.classList.add("loaded");
      return;
    }

    if (selectorWrapper) selectorWrapper.hidden = false;
    select.disabled = false;
    const ordered = orderTeamsForDropdown(teams);
    state.dropdownTeams[cupKey] = ordered;

    ordered.forEach((team) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      handleTeamSelection(cupKey, event.target.value);
    });

    select.value = state.selectedTeams[cupKey] || "";
    if (state.selectedTeams[cupKey]) {
      config.display.innerHTML = renderTeamView(cupKey, state.selectedTeams[cupKey]);
      config.display.classList.add("loaded");
    } else {
      showSelectionPlaceholder(config.display);
    }
  }

  function showSelectionPlaceholder(display) {
    if (!display) return;
    display.innerHTML = `<p class="selection-placeholder">${translate("selectTeamsToView") || "Select a team to view fixtures."}</p>`;
    display.classList.add("loaded");
  }

  function calculateHeadlineStats() {
    const summary = {
      teams: 0,
      games: 0,
      goals: 0,
    };
    if (!state?.cups) return summary;

    const teamSet = new Set();
    Object.values(state.cups).forEach((cupData) => {
      (cupData?.rounds || []).forEach((round) => {
        (round?.games || []).forEach((game) => {
          const home = sanitizeTeamName(game.home_team);
          const away = sanitizeTeamName(game.away_team);
          if (home && home !== "BYE") teamSet.add(home);
          if (away && away !== "BYE") teamSet.add(away);

          const homeScore = parseScore(game.home_score);
          const awayScore = parseScore(game.away_score);
          if (homeScore !== null && awayScore !== null) {
            summary.games += 1;
            summary.goals += homeScore + awayScore;
          }
        });
      });
    });

    summary.teams = teamSet.size;
    return summary;
  }

  function computeCupProgress(cupKey) {
    const cupData = state.cups?.[cupKey];
    if (!cupData?.rounds) return { played: 0, total: 0 };

    let total = 0;
    let played = 0;
    cupData.rounds.forEach((round) => {
      (round?.games || []).forEach((game) => {
        const home = sanitizeTeamName(game.home_team);
        const away = sanitizeTeamName(game.away_team);
        if (!home || !away || home === "BYE" || away === "BYE") return;
        total += 1;
        const hs = parseScore(game.home_score);
        const as = parseScore(game.away_score);
        if (hs !== null && as !== null) {
          played += 1;
        }
      });
    });
    return { played, total };
  }

  function findNextDeadline(cupKey) {
    const cupData = state.cups?.[cupKey];
    if (!cupData?.rounds) return null;
    for (const round of cupData.rounds) {
      const openGame = (round?.games || []).some((game) => {
        const home = sanitizeTeamName(game.home_team);
        const away = sanitizeTeamName(game.away_team);
        if (!home || !away || home === "BYE" || away === "BYE") return false;
        const hs = parseScore(game.home_score);
        const as = parseScore(game.away_score);
        return hs === null || as === null;
      });
      if (openGame) {
        return round?.deadlines?.welsh || round?.deadlines?.english;
      }
    }
    return translate("snapshotComplete") || "Wedi'i gwblhau";
  }

  function updateHeroStats() {
    if (!elements.heroStats) return;
    const stats = calculateHeadlineStats();
    if (elements.heroStats.teams) {
      elements.heroStats.teams.textContent = stats.teams || "—";
    }
    if (elements.heroStats.games) {
      elements.heroStats.games.textContent = stats.games || "—";
    }
    if (elements.heroStats.goals) {
      elements.heroStats.goals.textContent = stats.goals || "—";
    }
  }

  function updateCupSnapshots() {
    if (!elements.snapshots || !state.cups) return;
    ["Welsh", "Cardiff"].forEach((cupKey) => {
      const ui = elements.snapshots[cupKey];
      if (!ui) return;
      const { played, total } = computeCupProgress(cupKey);
      const percent = total ? Math.round((played / total) * 100) : 0;
      if (ui.percent) {
        ui.percent.textContent = `${percent}%`;
      }
      if (ui.count) {
        ui.count.textContent = `${played} / ${total} ${translate("games") || "Games"}`;
      }
      if (ui.bar) {
        ui.bar.style.width = `${percent}%`;
      }
      if (ui.deadline) {
        ui.deadline.textContent = findNextDeadline(cupKey) || "—";
      }
    });
  }

  function updateLeaderHighlights() {
    if (!elements.leaders || !state.rankings?.base?.length) return;
    const leaders = state.rankings.base.slice(0, elements.leaders.length);
    elements.leaders.forEach((slot, index) => {
      const info = leaders[index];
      if (!slot || !info) {
        if (slot?.name) slot.name.textContent = "—";
        if (slot?.record) slot.record.textContent = "0-0-0";
        if (slot?.goalDiff) slot.goalDiff.textContent = "GD +0";
        return;
      }
      if (slot.name) slot.name.textContent = info.name;
      if (slot.record) {
        slot.record.textContent = `${info.wins}-${info.draws}-${info.losses}`;
      }
      if (slot.goalDiff) {
        slot.goalDiff.textContent = `${translate("goalDifference") || "Goal Difference"} ${
          info.gd >= 0 ? `+${info.gd}` : info.gd
        }`;
      }
    });
  }

  function calculateHeadlineStats() {
    const summary = {
      teams: 0,
      games: 0,
      goals: 0,
    };
    if (!state?.cups) return summary;

    const uniqueTeams = new Set();
    Object.values(state.cups).forEach((cupData) => {
      (cupData?.rounds || []).forEach((round) => {
        (round?.games || []).forEach((game) => {
          const home = sanitizeTeamName(game.home_team);
          const away = sanitizeTeamName(game.away_team);
          if (home && home !== "BYE") uniqueTeams.add(home);
          if (away && away !== "BYE") uniqueTeams.add(away);

          const homeScore = parseScore(game.home_score);
          const awayScore = parseScore(game.away_score);
          if (homeScore !== null && awayScore !== null) {
            summary.games += 1;
            summary.goals += homeScore + awayScore;
          }
        });
      });
    });

    summary.teams = uniqueTeams.size;
    return summary;
  }

  function updateHeroStats() {
    if (!elements.heroStats) return;
    const stats = calculateHeadlineStats();
    if (elements.heroStats.teams) {
      elements.heroStats.teams.textContent = stats.teams || "—";
    }
    if (elements.heroStats.games) {
      elements.heroStats.games.textContent = stats.games || "—";
    }
    if (elements.heroStats.goals) {
      elements.heroStats.goals.textContent = stats.goals || "—";
    }
  }

  function handleTeamSelection(cupKey, teamName) {
    const config = elements.dropdowns[cupKey];
    if (!config?.display) return;

    state.selectedTeams[cupKey] = teamName || "";
    if (!teamName) {
      showSelectionPlaceholder(config.display);
      return;
    }
    config.display.innerHTML = renderTeamView(cupKey, teamName);
    config.display.classList.add("loaded");
  }

  function getTeamStats(teamName, cupKey) {
    const map =
      cupKey === "Welsh"
        ? state.cupStats.Welsh
        : cupKey === "Cardiff"
        ? state.cupStats.Cardiff
        : state.cupStats.Friendlies;
    const stats = map?.get(teamName);
    if (!stats) return null;
    return {
      name: stats.name,
      played: stats.played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      gf: stats.gf,
      ga: stats.ga,
      gd: stats.gd,
    };
  }

  function renderTeamView(cupKey, teamName) {
    const stats = getTeamStats(teamName, cupKey);
    if (!stats) {
      return `<div class="team-summary"><h3>${teamName}</h3><p>${translate("noDataAvailable") || "No data available"}</p></div>`;
    }
    const matchesHtml = renderTeamMatches(cupKey, teamName);

    return `
      <div class="team-summary">
        <h3>${teamName}</h3>
        <dl class="team-summary__grid">
          <div>
            <dt>${translate("played") || "Played"}</dt>
            <dd>${stats.played}</dd>
          </div>
          <div>
            <dt>${translate("wins") || "Wins"}</dt>
            <dd>${stats.wins}</dd>
          </div>
          <div>
            <dt>${translate("draws") || "Draws"}</dt>
            <dd>${stats.draws}</dd>
          </div>
          <div>
            <dt>${translate("losses") || "Losses"}</dt>
            <dd>${stats.losses}</dd>
          </div>
          <div>
            <dt>${translate("gf") || "GF"}</dt>
            <dd>${stats.gf}</dd>
          </div>
          <div>
            <dt>${translate("ga") || "GA"}</dt>
            <dd>${stats.ga}</dd>
          </div>
          <div>
            <dt>${translate("gd") || "GD"}</dt>
            <dd>${formatGoalDifference(stats.gd)}</dd>
          </div>
        </dl>
      </div>
      ${matchesHtml}`;
  }

  function renderTeamMatches(cupKey, teamName) {
    const cup = state.cups[cupKey];
    if (!cup || !Array.isArray(cup.rounds) || !cup.rounds.length) {
      return `<p>${translate("noMatchData") || "No match data available."}</p>`;
    }

    const sections = cup.rounds
      .map((round) => {
        const games = (round.games || []).filter((game) => {
          const home = sanitizeTeamName(game.home_team);
          const away = sanitizeTeamName(game.away_team);
          return home === teamName || away === teamName;
        });

        if (!games.length) return "";

        const rows = games
          .map((game) => {
            const homeName = game.home_team || translate("unknown") || "Unknown";
            const awayName = game.away_team || translate("unknown") || "Unknown";
            const homeScore = formatScore(game.home_score);
            const awayScore = formatScore(game.away_score);

            const homeValue = parseScore(game.home_score);
            const awayValue = parseScore(game.away_score);
            const winnerClean = sanitizeTeamName(game.winner);

            let winnerText = translate("tbd") || "TBD";
            if (homeValue !== null && awayValue !== null) {
              if (homeValue > awayValue) {
                winnerText = homeName;
              } else if (awayValue > homeValue) {
                winnerText = awayName;
              } else {
                winnerText = translate("draw") || "Draw";
              }
            } else if (winnerClean) {
              winnerText = winnerClean;
            }

            return `
              <tr>
                <td>${homeName}</td>
                <td data-numeric="true">${homeScore}</td>
                <td data-numeric="true">${awayScore}</td>
                <td>${awayName}</td>
                <td>${winnerText}</td>
              </tr>`;
          })
          .join("");

        return `
          <section class="match-section">
            <h4>${formatRoundTitle(round, cupKey)}</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>${translate("home") || "Home"}</th>
                    <th data-numeric="true">${translate("hScore") || "H"}</th>
                    <th data-numeric="true">${translate("aScore") || "A"}</th>
                    <th>${translate("away") || "Away"}</th>
                    <th>${translate("winner") || "Winner"}</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </section>`;
      })
      .filter(Boolean)
      .join("");

    return sections || `<p>${translate("noMatchData") || "No match data available."}</p>`;
  }

  function formatRoundTitle(round, cupKey) {
    if (round.round_name) return round.round_name;
    if (round.stage) return round.stage;
    if (round.label) return round.label;
    if (Number.isFinite(Number(round.round_number))) {
      return `${translate("round") || "Round"} ${round.round_number}`;
    }
    const key = `${cupKey.toLowerCase()}Matches`;
    return translate(key) || `${cupKey} ${translate("matches") || "Matches"}`;
  }

  function formatScore(score) {
    if (score === null || score === undefined || score === "") return "–";
    return score;
  }

  function getCompetitionLabel(cupKey) {
    const labelKeys = {
      Welsh: "welshCup",
      Cardiff: "cardiffCup",
      Friendlies: "friendlies",
    };
    const labelKey = labelKeys[cupKey];
    return labelKey ? translate(labelKey) || cupKey : cupKey;
  }

  function getRecentMatches(cupKey, teamName, limit = 3) {
    if (!teamName) return [];
    const cup = state.cups[cupKey];
    if (!cup || !Array.isArray(cup.rounds)) return [];
    const matches = [];

    cup.rounds.forEach((round, roundIndex) => {
      (round.games || []).forEach((game, gameIndex) => {
        const homeClean = sanitizeTeamName(game.home_team);
        const awayClean = sanitizeTeamName(game.away_team);
        if (homeClean !== teamName && awayClean !== teamName) return;

        const homeScore = parseScore(game.home_score);
        const awayScore = parseScore(game.away_score);
        const outcome = determineComparisonOutcome(teamName, homeScore, awayScore, homeClean === teamName);

        matches.push({
          roundLabel: formatRoundTitle(round, cupKey),
          home: game.home_team || translate("unknown") || "Unknown",
          away: game.away_team || translate("unknown") || "Unknown",
          homeScore: formatScore(game.home_score),
          awayScore: formatScore(game.away_score),
          outcome: outcome.type,
          outcomeLabel: outcome.label,
          order: roundIndex * 100 + gameIndex,
        });
      });
    });

    matches.sort((a, b) => a.order - b.order);
    return matches.slice(-limit).reverse();
  }

  function determineComparisonOutcome(teamName, homeScore, awayScore, isHome) {
    const hasScores = homeScore !== null && awayScore !== null;
    if (!hasScores) {
      return {
        type: "pending",
        label: translate("tbd") || "TBD",
      };
    }
    if (homeScore === awayScore) {
      return {
        type: "draw",
        label: translate("comparisonResultDraw") || translate("draw") || "Draw",
      };
    }
    const didWin = isHome ? homeScore > awayScore : awayScore > homeScore;
    if (didWin) {
      return {
        type: "win",
        label: translate("comparisonResultWin") || translate("wins") || "Win",
      };
    }
    return {
      type: "loss",
      label: translate("comparisonResultLoss") || translate("losses") || "Loss",
    };
  }

  function renderRecentMatchesList(matches) {
    if (!matches.length) {
      return `<p>${translate("comparisonRecentFormEmpty") || translate("noMatchData") || "No recent matches recorded."}</p>`;
    }
    return `<ul class="compare-recent-list">
      ${matches
        .map(
          (match) => `<li>
            <span class="compare-form compare-form--${match.outcome}">${match.outcomeLabel}</span>
            <span class="compare-form__round">${match.roundLabel}</span>
            <span class="compare-form__score">${match.home} ${match.homeScore} - ${match.awayScore} ${match.away}</span>
          </li>`
        )
        .join("")}
    </ul>`;
  }

  function formatPercentage(value) {
    if (!Number.isFinite(value)) return "0%";
    return `${Math.round(value)}%`;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function averageGoalsFor(stats) {
    if (!stats || !stats.played) return 0;
    return stats.gf / stats.played;
  }

  function averageGoalsAgainst(stats) {
    if (!stats || !stats.played) return 0;
    return stats.ga / stats.played;
  }

  function populateComparisonTeamSelect(side) {
    const cmp = elements.comparison;
    const select = side === "home" ? cmp.homeTeam : cmp.awayTeam;
    if (!select) return;
    const selection = state.comparison.selections?.[side];
    if (!selection) return;

    const teams = orderTeamsForDropdown(state.comparison.teamsByCup[selection.cup] || []);
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.dataset.i18n = "chooseTeam";
    placeholder.textContent = translate("chooseTeam") || "--Choose a Team--";
    select.appendChild(placeholder);

    if (!teams.length) {
      select.disabled = true;
      selection.team = "";
      return;
    }

    select.disabled = false;
    teams.forEach((team) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = team;
      select.appendChild(option);
    });

    if (!selection.team || !teams.includes(selection.team)) {
      selection.team = "";
    }

    select.value = selection.team;
  }

  function renderComparisonSummary(side) {
    const cmp = elements.comparison;
    const summaryEl = side === "home" ? cmp.homeSummary : cmp.awaySummary;
    if (!summaryEl) return;
    const selection = state.comparison.selections?.[side];
    if (!selection || !selection.team) {
      summaryEl.innerHTML = `<p>${translate("comparisonSelectPrompt") || "Select a competition and team to see stats."}</p>`;
      return;
    }
    const stats = getTeamStats(selection.team, selection.cup);
    if (!stats || !stats.played) {
      summaryEl.innerHTML = `<div class="compare-summary__empty"><strong>${selection.team}</strong><p>${translate("comparisonNoStats") || "No stats available yet for this team."}</p></div>`;
      return;
    }

    const winRate = stats.played ? (stats.wins / stats.played) * 100 : 0;
    const goalsPerGame = stats.played ? stats.gf / stats.played : 0;
    const concededPerGame = stats.played ? stats.ga / stats.played : 0;
    const recent = getRecentMatches(selection.cup, selection.team, 3);

    summaryEl.innerHTML = `
      <header class="compare-summary__header">
        <div>
          <strong>${selection.team}</strong>
          <p>${getCompetitionLabel(selection.cup)}</p>
        </div>
        <div class="compare-summary__record">
          <span>${stats.wins}-${stats.draws}-${stats.losses}</span>
          <small>${translate("wins") || "Wins"}-${translate("draws") || "Draws"}-${translate("losses") || "Losses"}</small>
        </div>
      </header>
      <dl class="compare-summary__grid">
        <div>
          <dt>${translate("played") || "Played"}</dt>
          <dd>${stats.played}</dd>
        </div>
        <div>
          <dt>${translate("comparisonWinRate") || "Win rate"}</dt>
          <dd>${formatPercentage(winRate)}</dd>
        </div>
        <div>
          <dt>${translate("gf") || "GF"}</dt>
          <dd>${stats.gf}</dd>
        </div>
        <div>
          <dt>${translate("ga") || "GA"}</dt>
          <dd>${stats.ga}</dd>
        </div>
        <div>
          <dt>${translate("comparisonGoalsPerGame") || "Goals per game"}</dt>
          <dd>${goalsPerGame.toFixed(2)}</dd>
        </div>
        <div>
          <dt>${translate("comparisonGoalsAgainstPerGame") || "Goals conceded per game"}</dt>
          <dd>${concededPerGame.toFixed(2)}</dd>
        </div>
      </dl>
      <div class="compare-summary__recent">
        <h4>${translate("comparisonRecentForm") || translate("matchHistory") || "Recent form"}</h4>
        ${renderRecentMatchesList(recent)}
      </div>`;
  }

  function resetComparisonOutputs(messageKey = "comparisonSelectPrompt") {
    const cmp = elements.comparison;
    const message =
      translate(messageKey) || translate("selectTeamsToView") || "Select two teams to compare.";
    if (cmp.metrics) {
      cmp.metrics.innerHTML = "";
    }
    if (cmp.result) {
      cmp.result.innerHTML = `<p>${message}</p>`;
    }
  }

  function updateComparisonButtonState() {
    const cmp = elements.comparison;
    if (!cmp.runButton || !state.comparison.selections) return;
    const { home, away } = state.comparison.selections;
    const bothSelected = Boolean(home?.team && away?.team);
    const differentTeams =
      bothSelected && (home.team !== away.team || home.cup !== away.cup);
    const ready = bothSelected && differentTeams;
    cmp.runButton.disabled = !ready;
    cmp.runButton.setAttribute("aria-disabled", String(!ready));
    if (!ready) {
      const messageKey =
        bothSelected && !differentTeams ? "comparisonSameTeamWarning" : "comparisonSelectPrompt";
      resetComparisonOutputs(messageKey);
    }
  }

  function renderComparisonMetrics(homeStats, awayStats, homeTeam, awayTeam) {
    const rows = [
      {
        label: translate("comparisonWinRate") || "Win rate",
        home: formatPercentage(
          homeStats.played ? (homeStats.wins / homeStats.played) * 100 : 0
        ),
        away: formatPercentage(
          awayStats.played ? (awayStats.wins / awayStats.played) * 100 : 0
        ),
      },
      {
        label: translate("comparisonGoalsPerGame") || "Goals per game",
        home: (homeStats.played ? homeStats.gf / homeStats.played : 0).toFixed(2),
        away: (awayStats.played ? awayStats.gf / awayStats.played : 0).toFixed(2),
      },
      {
        label: translate("comparisonGoalsAgainstPerGame") || "Goals conceded per game",
        home: (homeStats.played ? homeStats.ga / homeStats.played : 0).toFixed(2),
        away: (awayStats.played ? awayStats.ga / awayStats.played : 0).toFixed(2),
      },
      {
        label: translate("goalDifference") || "Goal difference",
        home: formatGoalDifference(homeStats.gd),
        away: formatGoalDifference(awayStats.gd),
      },
    ];

    return `<table class="compare-metrics__table">
      <thead>
        <tr>
          <th>${translate("statistics") || "Statistics"}</th>
          <th scope="col">${homeTeam}</th>
          <th scope="col">${awayTeam}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <th scope="row">${row.label}</th>
              <td data-numeric="true">${row.home}</td>
              <td data-numeric="true">${row.away}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  }

  function renderComparisonResult(homeTeam, awayTeam, projection) {
    if (!projection) return "";
    const scoreLabel = translate("comparisonProjectedScore") || "Projected scoreline";
    const advantageLabel = translate("comparisonAdvantage") || "Advantage";
    const edgeDisplay =
      projection.favourite && Number.isFinite(projection.edgeValue)
        ? `${projection.favourite} (${projection.edgeValue >= 0 ? "+" : ""}${projection.edgeValue.toFixed(1)})`
        : translate("comparisonResultDraw") || translate("draw") || "Draw";

    return `
      <p><strong>${scoreLabel}:</strong> ${homeTeam} ${projection.homeScore} - ${projection.awayScore} ${awayTeam}</p>
      <p><strong>${advantageLabel}:</strong> ${edgeDisplay}</p>
    `;
  }

  function projectScoreline(homeStats, awayStats, homeTeam, awayTeam) {
    const homeAttack = averageGoalsFor(homeStats);
    const awayAttack = averageGoalsFor(awayStats);
    const homeDefense = averageGoalsAgainst(homeStats);
    const awayDefense = averageGoalsAgainst(awayStats);

    const homeExpected = clamp((homeAttack + awayDefense) / 2, 0, 8);
    const awayExpected = clamp((awayAttack + homeDefense) / 2, 0, 8);

    const homeScore = Math.round(homeExpected);
    const awayScore = Math.round(awayExpected);

    const rating = (stats) => stats.wins * 3 + stats.draws - stats.losses + stats.gd * 0.25;
    const edgeValue = rating(homeStats) - rating(awayStats);

    let favourite = null;
    if (homeScore > awayScore && homeTeam) {
      favourite = homeTeam;
    } else if (awayScore > homeScore && awayTeam) {
      favourite = awayTeam;
    } else if (edgeValue > 1 && homeTeam) {
      favourite = homeTeam;
    } else if (edgeValue < -1 && awayTeam) {
      favourite = awayTeam;
    }

    return {
      homeScore,
      awayScore,
      favourite,
      edgeValue,
    };
  }

  function runComparisonPrediction() {
    const selections = state.comparison.selections;
    if (!selections) return;
    const { home, away } = selections;
    if (!home?.team || !away?.team) {
      resetComparisonOutputs();
      return;
    }

    const homeStats = getTeamStats(home.team, home.cup);
    const awayStats = getTeamStats(away.team, away.cup);
    if (!homeStats || !awayStats || !homeStats.played || !awayStats.played) {
      resetComparisonOutputs("comparisonNoStats");
      return;
    }

    if (elements.comparison.metrics) {
      elements.comparison.metrics.innerHTML = renderComparisonMetrics(
        homeStats,
        awayStats,
        home.team,
        away.team
      );
    }
    if (elements.comparison.result) {
      elements.comparison.result.innerHTML = renderComparisonResult(
        home.team,
        away.team,
        projectScoreline(homeStats, awayStats, home.team, away.team)
      );
    }

    state.comparison.lastProjection = {
      homeCup: home.cup,
      homeTeam: home.team,
      awayCup: away.cup,
      awayTeam: away.team,
    };
  }

  function refreshComparisonSection() {
    if (!state.comparison.initialized) return;
    renderComparisonSummary("home");
    renderComparisonSummary("away");
    updateComparisonButtonState();
    const projection = state.comparison.lastProjection;
    if (!projection) return;
    const homeStats = getTeamStats(projection.homeTeam, projection.homeCup);
    const awayStats = getTeamStats(projection.awayTeam, projection.awayCup);
    if (!homeStats || !awayStats) {
      resetComparisonOutputs();
      return;
    }
    if (elements.comparison.metrics) {
      elements.comparison.metrics.innerHTML = renderComparisonMetrics(
        homeStats,
        awayStats,
        projection.homeTeam,
        projection.awayTeam
      );
    }
    if (elements.comparison.result) {
      elements.comparison.result.innerHTML = renderComparisonResult(
        projection.homeTeam,
        projection.awayTeam,
        projectScoreline(homeStats, awayStats, projection.homeTeam, projection.awayTeam)
      );
    }
  }

  function setupComparison() {
    const cmp = elements.comparison;
    if (
      state.comparison.initialized ||
      !cmp.homeCup ||
      !cmp.awayCup ||
      !cmp.homeTeam ||
      !cmp.awayTeam ||
      !cmp.homeSummary ||
      !cmp.awaySummary
    ) {
      return;
    }

    if (!state.comparison.selections) {
      state.comparison.selections = {
        home: { cup: cmp.homeCup.value || "Welsh", team: "" },
        away: { cup: cmp.awayCup.value || "Cardiff", team: "" },
      };
    }

    const { home, away } = state.comparison.selections;
    home.cup = home.cup || cmp.homeCup.value || "Welsh";
    away.cup = away.cup || cmp.awayCup.value || "Cardiff";

    cmp.homeCup.value = home.cup;
    cmp.awayCup.value = away.cup;

    populateComparisonTeamSelect("home");
    populateComparisonTeamSelect("away");
    renderComparisonSummary("home");
    renderComparisonSummary("away");
    updateComparisonButtonState();
    resetComparisonOutputs();

    cmp.homeCup.addEventListener("change", (event) => {
      state.comparison.selections.home.cup = event.target.value;
      state.comparison.selections.home.team = "";
      state.comparison.lastProjection = null;
      populateComparisonTeamSelect("home");
      renderComparisonSummary("home");
      resetComparisonOutputs();
      updateComparisonButtonState();
    });

    cmp.awayCup.addEventListener("change", (event) => {
      state.comparison.selections.away.cup = event.target.value;
      state.comparison.selections.away.team = "";
      state.comparison.lastProjection = null;
      populateComparisonTeamSelect("away");
      renderComparisonSummary("away");
      resetComparisonOutputs();
      updateComparisonButtonState();
    });

    cmp.homeTeam.addEventListener("change", (event) => {
      state.comparison.selections.home.team = event.target.value;
      state.comparison.lastProjection = null;
      renderComparisonSummary("home");
      resetComparisonOutputs();
      updateComparisonButtonState();
    });

    cmp.awayTeam.addEventListener("change", (event) => {
      state.comparison.selections.away.team = event.target.value;
      state.comparison.lastProjection = null;
      renderComparisonSummary("away");
      resetComparisonOutputs();
      updateComparisonButtonState();
    });

    if (cmp.runButton) {
      cmp.runButton.addEventListener("click", (event) => {
        event.preventDefault();
        runComparisonPrediction();
      });
    }

    state.comparison.initialized = true;
  }

  function renderBracket(cupKey, data, container) {
    if (!container) return;
    const rounds = Array.isArray(data?.rounds) ? data.rounds : [];
    if (!rounds.length) {
      container.innerHTML = `<p>${translate("noBracketData") || "No bracket data available"}</p>`;
      return;
    }

    const roundsHtml = rounds
      .map((round, index) => {
        const matches = (round.games || []).map((game) => {
          const homeName = game.home_team || translate("unknown") || "Unknown";
          const awayName = game.away_team || translate("unknown") || "Unknown";
          const homeScore = formatScore(game.home_score);
          const awayScore = formatScore(game.away_score);
          const winnerTeam = sanitizeTeamName(game.winner);
          const homeKey = sanitizeTeamName(game.home_team);
          const awayKey = sanitizeTeamName(game.away_team);
          const homeWinner = winnerTeam && homeKey && winnerTeam === homeKey;
          const awayWinner = winnerTeam && awayKey && winnerTeam === awayKey;

          return `
            <div class="bracket-match">
              <div class="bracket-team ${homeWinner ? "winner" : ""}">
                <span class="bracket-team__name">${homeName}</span>
                <span class="bracket-team__score">${homeScore}</span>
              </div>
              <div class="bracket-team ${awayWinner ? "winner" : ""}">
                <span class="bracket-team__name">${awayName}</span>
                <span class="bracket-team__score">${awayScore}</span>
              </div>
            </div>`;
        }).filter(Boolean);

        if (!matches.length) return "";

        return `
          <div class="bracket-round" data-round="${index + 1}">
            <h4>${formatRoundTitle(round, cupKey)}</h4>
            <div class="bracket-round__matches">${matches.join("")}</div>
          </div>`;
      })
      .join("");

    if (!roundsHtml) {
      container.innerHTML = `<p>${translate("noBracketData") || "No bracket data available"}</p>`;
      return;
    }

    container.innerHTML = `<div class="bracket-flow">${roundsHtml}</div>`;
  }

  function renderBrackets() {
    const select = elements.brackets.select;
    const display = elements.brackets.display;
    if (!display) return;

    const mode = state.brackets.current || select?.value || "Welsh";
    if (select && select.value !== mode) {
      select.value = mode;
    }
    state.brackets.current = mode;

    const lookup = {
      Welsh: state.cups.Welsh,
      Cardiff: state.cups.Cardiff,
      Friendlies: state.cups.Friendlies,
    };

    if (elements.brackets.title) {
      const labelKeys = {
        Welsh: "welshCup",
        Cardiff: "cardiffCup",
        Friendlies: "friendlies",
      };
      elements.brackets.title.textContent = translate(labelKeys[mode]) || mode;
    }

    if (elements.brackets.card) {
      elements.brackets.card.dataset.cup = mode.toLowerCase();
    }

    renderBracket(mode, lookup[mode], display);
  }

  function refreshUI() {
    renderCombinedSnapshots();
    renderBrackets();
    refreshComparisonSection();
    renderLastUpdated(state.meta);
    updateHeroStats();
    updateCupSnapshots();
    updateLeaderHighlights();
    Object.entries(elements.dropdowns).forEach(([cupKey, config]) => {
      if (!config?.display) return;
      const placeholder = config.select?.querySelector("option[value='']");
      if (placeholder) {
        placeholder.textContent = translate("chooseTeam") || "--Choose a Team--";
      }
      const selected = state.selectedTeams[cupKey];
      if (selected) {
        config.display.innerHTML = renderTeamView(cupKey, selected);
        config.display.classList.add("loaded");
      } else {
        showSelectionPlaceholder(config.display);
      }
    });
  }

  function attachLeaderboardModeSwitch() {
    const { cups, all } = elements.leaderboardButtons;
    const hasFriendlies = Array.isArray(state.rankings.withFriendlies)
      ? state.rankings.withFriendlies.length > 0
      : false;
    updateLeaderboardButtons(state.leaderboardMode || "cups", hasFriendlies);
    if (cups) {
      cups.addEventListener("click", () => {
        if (state.leaderboardMode === "cups") return;
        state.leaderboardMode = "cups";
        renderCombinedSnapshots();
      });
    }
    if (all) {
      all.addEventListener("click", () => {
        if (all.disabled || state.leaderboardMode === "all") return;
        state.leaderboardMode = "all";
        renderCombinedSnapshots();
      });
    }
  }

  function attachBracketSelector() {
    const select = elements.brackets.select;
    if (!select) return;
    state.brackets.current = select.value || "Welsh";
    select.addEventListener("change", (event) => {
      state.brackets.current = event.target.value;
      renderBrackets();
    });
  }

  async function init() {
    try {
      const [welsh, cardiff, friendlies, meta] = await Promise.all([
        fetchJSON(DATA_FILES.Welsh),
        fetchJSON(DATA_FILES.Cardiff),
        fetchJSON(DATA_FILES.Friendlies),
        fetchJSON(DATA_FILES.Meta).catch(() => null),
      ]);

      state.cups = {
        Welsh: welsh,
        Cardiff: cardiff,
        Friendlies: friendlies,
      };
      state.meta = meta;

      state.cupStats.Welsh = computeCupStats(welsh);
      state.cupStats.Cardiff = computeCupStats(cardiff);
      state.cupStats.Friendlies = computeCupStats(friendlies);

      state.aggregates.cupsOnly = mergeStatMaps([
        state.cupStats.Welsh,
        state.cupStats.Cardiff,
      ]);
      state.aggregates.withFriendlies = mergeStatMaps([
        state.cupStats.Welsh,
        state.cupStats.Cardiff,
        state.cupStats.Friendlies,
      ]);

      state.rankings.base = sortStatsMap(state.aggregates.cupsOnly);
      state.rankings.withFriendlies = sortStatsMap(
        state.aggregates.withFriendlies
      );

      state.comparison.teamsByCup.Welsh = sortTeamsAlphabetically(
        computeActiveCupTeams(welsh)
      );
      state.comparison.teamsByCup.Cardiff = sortTeamsAlphabetically(
        computeActiveCupTeams(cardiff)
      );
      state.comparison.teamsByCup.Friendlies = sortTeamsAlphabetically(
        computeFriendliesTeams(friendlies)
      );

      const welshTeams = computeActiveCupTeams(welsh);
      const cardiffTeams = computeActiveCupTeams(cardiff);
      const friendlyTeams = computeFriendliesTeams(friendlies);

      populateDropdown("Welsh", welshTeams);
      populateDropdown("Cardiff", cardiffTeams);
      populateDropdown("Friendlies", friendlyTeams);

      setupComparison();
      refreshUI();
    } catch (error) {
      console.error("Failed to initialise dashboard", error);
      if (elements.leaderboardTable) {
        elements.leaderboardTable.innerHTML = `<p>${translate("errorLoadingData") || "Error loading data."}</p>`;
      }
      if (elements.brackets.display) {
        elements.brackets.display.innerHTML = `<p>${translate("errorLoadingData") || "Error loading data."}</p>`;
      }
      Object.values(elements.dropdowns).forEach(({ display }) => {
        if (display) {
          display.innerHTML = `<p>${translate("errorLoadingData") || "Error loading data."}</p>`;
          display.classList.add("loaded");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    updateLanguageButtons();
    attachLanguageSwitches();
    attachLeaderboardModeSwitch();
    attachBracketSelector();
    showLoadingState();
    init();
  });
})();
