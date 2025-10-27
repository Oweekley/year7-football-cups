// ============================================================
//  scrape_all_cardiff_vale.js (Improved Version)
//  Run with: node scrape_all_cardiff_vale.js
//  Purpose: Generate welsh.json, cardiff.json, teams.json
//  Compatible with the Year 7 Cups Dashboard front-end
// ============================================================

const fs = require("fs");
const puppeteer = require("puppeteer");

// ===============================
// HELPERS
// ===============================
const MONTH_MAP = {
  Jan: "January", Feb: "February", Mar: "March", Apr: "April",
  May: "May", Jun: "June", Jul: "July", Aug: "August",
  Sep: "September", Sept: "September", Oct: "October",
  Nov: "November", Dec: "December"
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const log = (msg, symbol = "•") => console.log(`${symbol} ${msg}`);

function safeWriteJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    log(`✅ Wrote ${file} (${Object.keys(data.team_statistics || data).length} teams)`);
  } catch (err) {
    console.error(`❌ Failed to write ${file}:`, err.message);
  }
}

function cleanText(str) {
  return str ? str.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
}

function normalizeTeamName(name) {
  if (!name) return null;
  name = cleanText(name);
  if (/^Game\s*\d+\s*winner$/i.test(name)) return name.replace(/\s+/g, " ");
  return name.replace(/^Game\s*\d+\s*/i, "").replace(/^\d+\s*/, "").trim();
}

function expandDeadline(line) {
  if (!line) return null;
  const m = line.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/i);
  if (m) {
    const day = m[1];
    const month = MONTH_MAP[m[2]] || m[2];
    return `${day} ${month} 2025`;
  }
  return cleanText(line);
}

function ensureTeamStats(stats, team) {
  if (!team || team === "BYE" || team.startsWith("Game ")) return;
  if (!stats[team]) {
    stats[team] = { games_played: 0, wins: 0, goals_for: 0, goals_against: 0, goal_difference: 0 };
  }
}

function recordMatch(stats, { home, away, home_score, away_score }) {
  ensureTeamStats(stats, home);
  ensureTeamStats(stats, away);

  if (away === "BYE") {
    if (home) {
      stats[home].games_played++;
      stats[home].wins++;
    }
    return;
  }

  if (Number.isInteger(home_score) && Number.isInteger(away_score)) {
    stats[home].games_played++;
    stats[away].games_played++;
    stats[home].goals_for += home_score;
    stats[home].goals_against += away_score;
    stats[away].goals_for += away_score;
    stats[away].goals_against += home_score;
    if (home_score > away_score) stats[home].wins++;
    else if (away_score > home_score) stats[away].wins++;
  }
}

// ===============================
// GENERIC PAGE SCRAPER
// ===============================
async function fetchParagraphs(page, selectorOrId, label) {
  try {
    await page.waitForSelector(selectorOrId, { timeout: 15000 });
    const paragraphs = await page.$$eval(`${selectorOrId} p`, ps =>
      ps.map(p => p.innerText.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean)
    );
    log(`✅ Fetched ${paragraphs.length} paragraphs from ${label}`);
    return paragraphs;
  } catch (err) {
    console.error(`⚠️ Failed to fetch ${label} paragraphs:`, err.message);
    return [];
  }
}

// ===============================
// SCRAPER 1: U12 Welsh Schools FA
// ===============================
async function scrapeU12Welsh(browser) {
  const SOURCE_URL = "https://www.welshschoolsfa.co.uk/cardiffandvale25-26";
  const TARGET_DIV_ID = "1235921298";
  const CUP_NAME = "U12 Boys Welsh Cup - Cardiff & Vale";
  const SEASON = "2025-26";

  log(`\n🟦 Starting Welsh Schools FA scrape...`);

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    await page.goto(SOURCE_URL, { waitUntil: "networkidle2" });
    await delay(1500);

    const paragraphs = await page.evaluate((id) => {
      const div = document.querySelector(`[id="${id}"]`);
      if (!div) return [];
      const norm = s => s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
      return Array.from(div.querySelectorAll("p"))
        .map(p => norm(p.innerText || ""))
        .filter(Boolean);
    }, TARGET_DIV_ID);

    const result = { cup_name: CUP_NAME, season: SEASON, rounds: [], team_statistics: {} };

    const parseGameLine = line => {
      line = cleanText(line);
      if (!line || line.length < 3) return null;

      // Handle BYE
      const bye = line.match(/^(.+?)\s+V\s*(BYE|Bye)$/i);
      if (bye) return { home: normalizeTeamName(bye[1]), away: "BYE", home_score: null, away_score: null, winner: normalizeTeamName(bye[1]) };

      // Score line
      const score = line.match(/^(?:Game\s*\d+\s*)?(.+?)\s+(\d+)\s*-\s*(\d+)\s+(.+)$/);
      if (score) {
        const home = normalizeTeamName(score[1]);
        const away = normalizeTeamName(score[4]);
        const hs = parseInt(score[2]);
        const as = parseInt(score[3]);
        const winner = hs > as ? home : as > hs ? away : null;
        return { home, away, home_score: hs, away_score: as, winner };
      }
      return null;
    };

    let i = 0;
    while (i < paragraphs.length) {
      const text = paragraphs[i];
      const roundMatch = text.match(/ROUND\s*(\d+)|ROWND\s*(\d+)/i);
      if (roundMatch) {
        const roundNum = parseInt(roundMatch[1] || roundMatch[2], 10);
        const round = { round_number: roundNum, deadlines: {}, games: [] };

        // Find deadline
        for (let j = i + 1; j < i + 6 && j < paragraphs.length; j++) {
          if (/Deadline:|Dyddiad cau/i.test(paragraphs[j])) {
            const expanded = expandDeadline(paragraphs[j]);
            const clean = cleanText(paragraphs[j])
              .replace(/Deadline:|Dyddiad cau:/i, "Deadline:")
              .replace(/\s+/g, " ")
              .replace(/\b([a-z])/g, c => c.toUpperCase());
            round.deadlines.english = clean;
            round.deadlines.english_expanded = expanded;
          }
        }

        i++;
        while (i < paragraphs.length && !/ROUND\s*\d+|ROWND\s*\d+|U13|U14|U15/i.test(paragraphs[i])) {
          const parsed = parseGameLine(paragraphs[i]);
          if (parsed && parsed.home && parsed.away) {
            const entry = {
              home_team: parsed.home,
              home_score: parsed.home_score,
              away_team: parsed.away,
              away_score: parsed.away_score,
              winner: parsed.winner,
              date: round.deadlines.english_expanded || null
            };
            round.games.push(entry);
            recordMatch(result.team_statistics, parsed);
          }
          i++;
        }
        if (round.games.length) result.rounds.push(round);
        continue;
      }
      i++;
    }

    // Finalise
    for (const t in result.team_statistics) {
      const s = result.team_statistics[t];
      s.goal_difference = s.goals_for - s.goals_against;
    }
    delete result.team_statistics["BYE"];

    safeWriteJSON("welsh.json", result);
  } catch (err) {
    console.error("❌ Welsh scrape failed:", err.message);
  } finally {
    await page.close();
  }
}

// ===============================
// SCRAPER 2: Year 7 Cardiff & Vale
// ===============================
async function scrapeYear7Cardiff(browser) {
  const SOURCE_URL = "https://www.cardiffandvalesfa.cymru/schools-cups";
  const SECTION_ID = "comp-j4emn0fl";
  const CUP_NAME = "Year 7 Boys Cardiff & Vale Cup";
  const SEASON = "2025-26";

  log(`\n🟩 Starting Cardiff & Vale scrape...`);

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    await page.goto(SOURCE_URL, { waitUntil: "networkidle2" });
    await delay(2000);

    const paragraphs = await fetchParagraphs(page, `#${SECTION_ID}`, "Cardiff Cup");
    const result = { cup_name: CUP_NAME, season: SEASON, rounds: [], team_statistics: {} };

    const parseScoreLine = line => {
      const full = line.match(/^(.+?)\s+(\d+)\s*-\s*(\d+)\s+(.+)$/);
      if (!full) return null;
      const home = cleanText(full[1]);
      const away = cleanText(full[4]);
      const hs = parseInt(full[2]);
      const as = parseInt(full[3]);
      const winner = hs > as ? home : as > hs ? away : null;
      return { home, away, home_score: hs, away_score: as, winner };
    };

    let i = 0;
    while (i < paragraphs.length) {
      const text = paragraphs[i];
      const roundMatch = text.match(/(ROUND\s*\d+|QUARTER FINAL|SEMI FINAL|FINAL)/i);
      if (roundMatch) {
        const label = roundMatch[1].toUpperCase();
        const numMatch = label.match(/ROUND\s*(\d+)/i);
        const roundNum = numMatch ? parseInt(numMatch[1]) : label;
        const round = { round_number: roundNum, deadlines: {}, games: [] };

        for (let j = i + 1; j < i + 5 && j < paragraphs.length; j++) {
          if (/deadline/i.test(paragraphs[j])) {
            const expanded = expandDeadline(paragraphs[j]);
            const clean = cleanText(paragraphs[j])
              .replace(/deadline[:\-]?\s*/i, "Deadline: ")
              .replace(/\b([a-z])/g, c => c.toUpperCase());
            round.deadlines.english = clean;
            round.deadlines.english_expanded = expanded;
          }
        }

        i++;
        while (i < paragraphs.length && !paragraphs[i].match(/(ROUND\s*\d+|QUARTER FINAL|SEMI FINAL|FINAL)/i)) {
          const line = paragraphs[i];

          // Handle BYES
          if (/^BYES/i.test(line)) {
            i++;
            while (i < paragraphs.length && paragraphs[i] && !/^(ROUND|QUARTER|SEMI|FINAL)/i.test(paragraphs[i])) {
              const team = cleanText(paragraphs[i]);
              if (!team || team === "." || /^V$/i.test(team)) break;
              round.games.push({
                home_team: team, home_score: null,
                away_team: "BYE", away_score: null,
                winner: team, date: null
              });
              recordMatch(result.team_statistics, { home: team, away: "BYE" });
              i++;
            }
            continue;
          }

          const score = parseScoreLine(line);
          if (score) {
            round.games.push({
              home_team: score.home,
              home_score: score.home_score,
              away_team: score.away,
              away_score: score.away_score,
              winner: score.winner,
              date: round.deadlines.english_expanded || null
            });
            recordMatch(result.team_statistics, score);
          }
          i++;
        }

        if (round.games.length) result.rounds.push(round);
        continue;
      }
      i++;
    }

    for (const t in result.team_statistics) {
      const s = result.team_statistics[t];
      s.goal_difference = s.goals_for - s.goals_against;
    }
    delete result.team_statistics["BYE"];

    safeWriteJSON("cardiff.json", result);
  } catch (err) {
    console.error("❌ Cardiff scrape failed:", err.message);
  } finally {
    await page.close();
  }
}

// ===============================
// MERGE TEAM STATISTICS
// ===============================
function mergeTeamStats() {
  log("\n🟨 Merging team statistics...");
  const welsh = JSON.parse(fs.readFileSync("welsh.json", "utf8"));
  const cardiff = JSON.parse(fs.readFileSync("cardiff.json", "utf8"));

  const merged = {};

  function addStats(source, cupName) {
    for (const [team, data] of Object.entries(source)) {
      if (!merged[team]) {
        merged[team] = {
          cups: [cupName],
          games_played: data.games_played,
          wins: data.wins,
          goals_for: data.goals_for,
          goals_against: data.goals_against,
          goal_difference: data.goal_difference
        };
      } else {
        if (!merged[team].cups.includes(cupName)) merged[team].cups.push(cupName);
        merged[team].games_played += data.games_played;
        merged[team].wins += data.wins;
        merged[team].goals_for += data.goals_for;
        merged[team].goals_against += data.goals_against;
        merged[team].goal_difference = merged[team].goals_for - merged[team].goals_against;
      }
    }
  }

  addStats(welsh.team_statistics, "Welsh Cup");
  addStats(cardiff.team_statistics, "Cardiff & Vale Cup");

  safeWriteJSON("teams.json", merged);
}

// ===============================
// MAIN EXECUTION
// ===============================
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    await scrapeU12Welsh(browser);
    await scrapeYear7Cardiff(browser);
    mergeTeamStats();
    log("\n✅ All scrapes and merges complete successfully!", "🎉");
  } catch (err) {
    console.error("❌ Global scrape error:", err.message);
  } finally {
    await browser.close();
  }
})();