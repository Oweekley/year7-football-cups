// ============================================================
//  YEAR 7 CUPS DASHBOARD 2025 - CORE SCRIPT (Optimized & Unified)
//  Version: 2.0.0
//  Last Updated: 2025-01-29
//
//  Features:
//  - Cleaner structure, comments, and modular rendering
//  - Improved bilingual support + dark mode consistency
//  - Error handling & data caching for smoother UX
//  - Fully supports teamCard.html dropdowns
//  - Keeps 100% compatibility with existing HTML + JSON
//  - Comprehensive logging system for debugging and monitoring
//  - Advanced performance optimizations
//  - Enhanced accessibility features
//  - Robust error recovery mechanisms
//  - Memory leak prevention
//  - Advanced caching strategies
// ============================================================

// =======================
// LIGHTWEIGHT UTILITIES
// =======================
// Prevent duplicate initialization using sessionStorage (survives page reloads)
const INIT_KEY = "football_app_initialized";
const isInitialized = sessionStorage.getItem(INIT_KEY) === "true";

// Detect Dreamweaver Live Preview
const isDreamweaverPreview =
  window.location.protocol === "file:" &&
  (window.navigator.userAgent.includes("Dreamweaver") ||
    document.referrer.includes("dreamweaver") ||
    window.parent !== window);

const debugEnabled =
  new URLSearchParams(location.search).get("debug") === "true" ||
  localStorage.getItem("logLevel") === "DEBUG";

const logger = {
  debug(message, data) {
    if (debugEnabled) console.debug("[DEBUG]", message, data ?? "");
  },
  info(message, data) {
    console.info("[INFO]", message, data ?? "");
  },
  warn(message, data) {
    console.warn("[WARN]", message, data ?? "");
  },
  error(message, data) {
    console.error("[ERROR]", message, data ?? "");
  },
  success(message, data) {
    console.info("[SUCCESS]", message, data ?? "");
  },
  errorWithStack(message, err) {
    console.error("[ERROR]", message, err);
  },
  functionEntry(name, params) {
    this.debug(`→ ${name}`, params);
  },
  functionExit(name, result) {
    this.debug(`← ${name}`, result);
  },
  dataChange(type, oldValue, newValue) {
    this.debug(`change:${type}`, { oldValue, newValue });
  },
  userAction(action, details) {
    this.info(`action:${action}`, details);
  },
  apiCall(method, url, status, duration) {
    const payload = { method, url, status, duration };
    const level = status >= 400 ? "warn" : "info";
    this[level](`api:${method}`, payload);
  },
  time(label) {
    if (debugEnabled) console.time(label);
  },
  timeEnd(label) {
    if (debugEnabled) console.timeEnd(label);
  },
};

// Initialize basic console logging
logger.info("Football dashboard starting…");

// =======================
// PWA & MANIFEST MONITORING
// =======================
class PWAMonitor {
  constructor() {
    this.logger = logger;
    this.manifest = null;
    this.serviceWorker = null;
    this.installPrompt = null;
    this.isInstalled = false;

    this.init();
  }

  init() {
    // Reduce noise in development: move to debug
    // this.logger.debug('PWA Monitor initialized');

    this.monitorManifest();
    this.monitorServiceWorker();
    this.monitorInstallPrompt();
    this.monitorAppState();
  }

  monitorManifest() {
    // Check if manifest is loaded
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      // Skip verbose manifest logging in development
      if (
        !manifestLink.href.includes("127.0.0.1") &&
        !manifestLink.href.includes("localhost")
      ) {
        this.logger.info("Manifest link found", {
          href: manifestLink.href,
          timestamp: new Date().toISOString(),
        });
      }

      // Skip manifest loading in Dreamweaver Live Preview or local development
      if (
        manifestLink.href.includes("127.0.0.1:56819") ||
        manifestLink.href.includes("dreamweaver") ||
        manifestLink.href.includes("localhost") ||
        manifestLink.href.includes("127.0.0.1") ||
        manifestLink.href.includes("file://")
      ) {
        // Skip verbose logging in development
        // this.logger.info('Skipping manifest load in development environment', {
        //   href: manifestLink.href,
        //   timestamp: new Date().toISOString()
        // });
        return;
      }

      // Try to load manifest
      fetch(manifestLink.href)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.text();
        })
        .then((text) => {
          try {
            const manifest = JSON.parse(text);
            this.manifest = manifest;
            this.logger.info("Manifest loaded successfully", {
              name: manifest.name,
              shortName: manifest.short_name,
              startUrl: manifest.start_url,
              display: manifest.display,
              themeColor: manifest.theme_color,
              backgroundColor: manifest.background_color,
              icons: manifest.icons?.length || 0,
              shortcuts: manifest.shortcuts?.length || 0,
              timestamp: new Date().toISOString(),
            });
          } catch (parseError) {
            throw new Error(`Invalid JSON: ${parseError.message}`);
          }
        })
        .catch((error) => {
          this.logger.warn("Failed to load manifest", {
            error: error.message,
            href: manifestLink.href,
            timestamp: new Date().toISOString(),
          });
        });
    } else {
      this.logger.warn("No manifest link found", {
        timestamp: new Date().toISOString(),
      });
    }
  }

  monitorServiceWorker() {
    if ("serviceWorker" in navigator) {
      // Skip verbose SW logging in development
      if (
        !window.location.href.includes("127.0.0.1") &&
        !window.location.href.includes("localhost")
      ) {
        this.logger.info("Service Worker supported", {
          timestamp: new Date().toISOString(),
        });
      }

      // Monitor service worker registration
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        this.logger.info("Service Worker controller changed", {
          timestamp: new Date().toISOString(),
        });
      });

      navigator.serviceWorker.addEventListener("message", (event) => {
        this.logger.info("Service Worker message received", {
          data: event.data,
          timestamp: new Date().toISOString(),
        });
      });

      // Check if already registered
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        // Reduce noise in development: only log in production
        if (
          !location.href.includes("127.0.0.1") &&
          !location.href.includes("localhost")
        ) {
          this.logger.info("Service Worker registrations found", {
            count: registrations.length,
          });
        }
      });
    } else {
      this.logger.warn("Service Worker not supported", {
        timestamp: new Date().toISOString(),
      });
    }
  }

  monitorInstallPrompt() {
    // Monitor beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (event) => {
      this.installPrompt = event;
      this.logger.info("Install prompt available", {
        timestamp: new Date().toISOString(),
      });
    });

    // Monitor appinstalled event
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.logger.info("App installed successfully", {
        timestamp: new Date().toISOString(),
      });
    });

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      this.isInstalled = true;
      this.logger.info("App running in standalone mode", {
        timestamp: new Date().toISOString(),
      });
    }
  }

  monitorAppState() {
    // Monitor visibility changes
    document.addEventListener("visibilitychange", () => {
      this.logger.info("App visibility changed", {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString(),
      });
    });

    // Monitor online/offline status
    window.addEventListener("online", () => {
      this.logger.info("App came online", {
        timestamp: new Date().toISOString(),
      });
    });

    window.addEventListener("offline", () => {
      this.logger.info("App went offline", {
        timestamp: new Date().toISOString(),
      });
    });

    // Monitor page lifecycle
    window.addEventListener("beforeunload", () => {
      this.logger.info("App is about to unload", {
        timestamp: new Date().toISOString(),
      });
    });

    window.addEventListener("pagehide", () => {
      this.logger.info("App page hidden", {
        timestamp: new Date().toISOString(),
      });
    });
  }

  getPWAStats() {
    return {
      hasManifest: !!this.manifest,
      hasServiceWorker: "serviceWorker" in navigator,
      hasInstallPrompt: !!this.installPrompt,
      isInstalled: this.isInstalled,
      isStandalone: window.matchMedia("(display-mode: standalone)").matches,
      isOnline: navigator.onLine,
      visibilityState: document.visibilityState,
    };
  }

  logPWASummary() {
    const stats = this.getPWAStats();
    this.logger.info("PWA status summary", {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  }
}

// Initialize PWA monitoring
const pwaMonitor = new PWAMonitor();

// =======================
// PERFORMANCE MONITORING & MEMORY MANAGEMENT
// =======================
const perfMonitor = {
  startTiming() {},
  endTiming() {},
  recordMemoryUsage() {},
  recordUserInteraction() {},
  recordError() {},
  getPerformanceReport() {
    return {};
  },
  cleanup() {},
};

const pendingTimeouts = new Set();
const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function trackTimeout(callback, ms) {
  const id = window.setTimeout(() => {
    pendingTimeouts.delete(id);
    callback();
  }, ms);
  pendingTimeouts.add(id);
  return id;
}

function clearTrackedTimeout(id) {
  if (!id) return;
  pendingTimeouts.delete(id);
  window.clearTimeout(id);
}

function cleanupPendingTimeouts() {
  pendingTimeouts.forEach((id) => window.clearTimeout(id));
  pendingTimeouts.clear();
}

// =======================
// COMPREHENSIVE TRANSLATIONS
// =======================
const translations = window.translations || {};
if (!window.translations) {
  logger.warn(
    "translations.js not loaded — using translation keys as fallback text"
  );
}

let currentLang = localStorage.getItem("lang") || "en";

// ============================================================
// LANGUAGE BUTTON MANAGEMENT
// ============================================================
function updateLanguageButton() {
  const enButton = document.getElementById("lang-en");
  const cyButton = document.getElementById("lang-cy");

  if (!enButton || !cyButton) return;

  // Hide both buttons first
  enButton.style.display = "none";
  cyButton.style.display = "none";

  // Show the button for the OTHER language (the one you can switch TO)
  if (currentLang === "en") {
    cyButton.style.display = "block";
    cyButton.textContent = "CY";
    cyButton.setAttribute("aria-label", "Switch to Welsh");
  } else {
    enButton.style.display = "block";
    enButton.textContent = "EN";
    enButton.setAttribute("aria-label", "Switch to English");
  }
}

// =======================
// GLOBAL STATE
// =======================
const state = {
  teams: [],
  cups: { Welsh: {}, Cardiff: {}, Friendlies: {} },
  lastUpdated: "Unknown",
  cache: {},
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
    },
    Cardiff: {
      team: document.getElementById("cardiff-team"),
      data: document.getElementById("cardiff-data"),
      display: document.getElementById("cardiff-display"),
    },
    Friendlies: {
      team: document.getElementById("friendlies-team"),
      data: document.getElementById("friendlies-data"),
      display: document.getElementById("friendlies-display"),
    },
  },
  leaderboard: document.getElementById("leaderboard"),
  lastUpdated: document.getElementById("last-updated"),
  refresh: document.getElementById("refresh-btn"),
  brackets: {
    welsh: document.getElementById("welsh-bracket-container"),
    cardiff: document.getElementById("cardiff-bracket-container"),
    friendlies: document.getElementById("friendlies-bracket-container"),
  },
};

// ============================================================
// COMPREHENSIVE TRANSLATION SYSTEM
// ============================================================
function switchLanguage(lang) {
  logger.functionEntry("switchLanguage", { lang });

  if (!translations[lang]) {
    logger.warn(`Language ${lang} is not available`);
    return;
  }

  const oldLang = currentLang;
  currentLang = lang;
  localStorage.setItem("lang", lang);

  logger.dataChange("language", oldLang, lang);

  // Update document language attribute
  document.documentElement.lang = lang;

  // Translate all elements with data-i18n attributes
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const translation = getTranslation(key, lang);
    if (translation) {
      if (
        el.tagName === "INPUT" &&
        (el.type === "text" || el.type === "password")
      ) {
        el.placeholder = translation;
      } else if (el.hasAttribute("aria-label")) {
        el.setAttribute("aria-label", translation);
      } else if (el.hasAttribute("title")) {
        el.setAttribute("title", translation);
      } else {
        el.textContent = translation;
      }
    }
  });

  // Update page title
  const titleKey = document.querySelector("title")?.dataset.i18n;
  if (titleKey) {
    document.title = getTranslation(titleKey, lang) || document.title;
  }

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    const descKey = metaDesc.dataset.i18n;
    if (descKey) {
      metaDesc.content = getTranslation(descKey, lang) || metaDesc.content;
    }
  }

  // Update language button display
  logger.debug("Updating language button");
  updateLanguageButton();

  const savedSelectValues = captureSelectValues();

  // Re-render all dynamic content
  logger.debug("Refreshing page content");
  renderAll();

  restoreSelectValues(savedSelectValues);

  // Re-translate any dynamically generated content
  logger.debug("Translating page text");
  setTimeout(() => {
    const elementsToTranslate = document.querySelectorAll("[data-i18n]");
    logger.debug(
      `Found ${elementsToTranslate.length} text elements to translate`
    );

    elementsToTranslate.forEach((el) => {
      const key = el.dataset.i18n;
      const translation = getTranslation(key, lang);
      if (translation) {
        if (
          el.tagName === "INPUT" &&
          (el.type === "text" || el.type === "password")
        ) {
          el.placeholder = translation;
        } else if (el.hasAttribute("aria-label")) {
          el.setAttribute("aria-label", translation);
        } else if (el.hasAttribute("title")) {
          el.setAttribute("title", translation);
        } else {
          el.textContent = translation;
        }
      }
    });

    logger.functionExit("switchLanguage");
    logger.success(`Page language changed to ${lang}`, {
      elementsTranslated: elementsToTranslate.length,
    });
  }, 100);
}

function getTranslation(key, lang = currentLang) {
  if (!key) return null;

  // Handle nested keys (e.g., "cup.welsh.name")
  const keys = key.split(".");
  let translation = translations[lang];

  for (const k of keys) {
    if (translation && typeof translation === "object" && k in translation) {
      translation = translation[k];
    } else {
      return null;
    }
  }

  return typeof translation === "string" ? translation : null;
}

function translate(key, ...args) {
  const translation = getTranslation(key);
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }

  // Handle string interpolation
  if (args.length > 0) {
    return translation.replace(/\{(\d+)\}/g, (match, index) => {
      return args[parseInt(index)] || match;
    });
  }

  return translation;
}

// Enhanced translation for dynamic content
function translateDynamicContent(container, contentKey, data = {}) {
  if (!container) return;

  const template = getTranslation(contentKey);
  if (!template) {
    console.warn(`Translation template missing for: ${contentKey}`);
    return;
  }

  // Replace placeholders with data
  let content = template;
  Object.keys(data).forEach((key) => {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, "g"), data[key] || "");
  });

  container.innerHTML = content;
}

function captureSelectValues() {
  const values = {};
  document
    .querySelectorAll("select[id]")
    .forEach((select) => (values[select.id] = select.value));
  return values;
}

function restoreSelectValues(savedValues) {
  if (!savedValues) return;
  Object.entries(savedValues).forEach(([id, value]) => {
    if (value === "" || value == null) return;
    const select = document.getElementById(id);
    if (!select) return;
    const optionExists = Array.from(select.options).some(
      (opt) => opt.value === value
    );
    if (!optionExists) return;
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

// Language toggle event listeners
document.getElementById("lang-en")?.addEventListener("click", () => {
  if (currentLang === "cy") {
    switchLanguage("en");
  }
});

document.getElementById("lang-cy")?.addEventListener("click", () => {
  if (currentLang === "en") {
    switchLanguage("cy");
  }
});

// ============================================================
// DATA FETCHING + NORMALIZATION (robust to any team schema)
// ============================================================
async function fetchWithRetry(
  url,
  { retries = 2, timeout = 10000, fetchOptions = {} } = {}
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timerId = trackTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(fetchOptions.headers || {}),
        },
      });
      clearTrackedTimeout(timerId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      return response;
    } catch (error) {
      clearTrackedTimeout(timerId);
      lastError = error;
      const retryable =
        error.name === "AbortError" ||
        error.name === "TypeError" ||
        error.status === 429 ||
        (typeof error.status === "number" && error.status >= 500);
      if (attempt === retries || !retryable) {
        throw error;
      }
      await delay(500 * (attempt + 1));
    }
  }
  throw lastError;
}

async function fetchJSON(url) {
  if (state.cache[url]) {
    logger.debug("Cache hit", { url });
    return state.cache[url];
  }

  logger.debug("Fetching JSON", { url });
  const response = await fetchWithRetry(url);
  const json = await response.json();

  if (!json || typeof json !== "object") {
    throw new Error("Invalid JSON response");
  }

  state.cache[url] = json;
  return json;
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
    gd,
  };
}

// build list of unique teams from the rounds if teams.json is missing or empty
function deriveTeamsFromCups(cups) {
  const set = new Set();
  Object.values(cups).forEach((cup) => {
    (cup?.rounds || []).forEach((r) => {
      (r?.games || []).forEach((g) => {
        if (g.home_team && g.home_team !== "BYE") set.add(g.home_team);
        if (g.away_team && g.away_team !== "BYE") set.add(g.away_team);
      });
    });
  });
  return [...set].map((name) => ({
    name,
    notes: "",
    played: 0,
    wins: 0,
    gf: 0,
    ga: 0,
    gd: 0,
  }));
}

function normalizeTeams(teamsRaw, cups) {
  // 1) If it's an array like { teams: [...] }
  if (Array.isArray(teamsRaw?.teams)) {
    return teamsRaw.teams
      .map((t) => mapTeamRecord(t.name ?? t.team ?? "", t))
      .filter((t) => t.name);
  }

  // 2) If it's a map { "Team": { games_played, goals_for, ... }, ... }
  if (teamsRaw && typeof teamsRaw === "object" && !Array.isArray(teamsRaw)) {
    return Object.entries(teamsRaw).map(([name, rec]) =>
      mapTeamRecord(name, rec)
    );
  }

  // 3) Fallback: derive from cups
  return deriveTeamsFromCups(cups);
}

async function loadData() {
  logger.functionEntry("loadData");
  perfMonitor.startTiming("loadData");

  try {
    logger.info("Loading football data");
    perfMonitor.recordMemoryUsage();

    // Show loading states (with safety checks)
    if (typeof elements !== "undefined" && elements.leaderboard) {
      showLoadingState(elements.leaderboard, "Loading leaderboard...");
    }
    if (typeof elements !== "undefined" && elements.dropdowns) {
      Object.values(elements.dropdowns).forEach((dropdown) => {
        if (dropdown && dropdown.display) {
          showLoadingState(dropdown.display, translate("selectTeamsToView"));
        }
      });
    }

    // Load the cups first so we can derive teams if needed
    const cupResults = await Promise.allSettled([
      fetchJSON("welsh.json"),
      fetchJSON("cardiff.json"),
      fetchJSON("friendlies.json"),
    ]);
    const [welsh, cardiff, friendlies] = cupResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return null;
    });

    // Defer summary until we also know file list
    const welshCount = welsh?.rounds?.length || 0;
    const cardiffCount = cardiff?.rounds?.length || 0;
    const friendliesCount = friendlies?.rounds?.length || 0;

    // Load teams + updated, but both are optional
    const [teamsResult, updatedResult] = await Promise.allSettled([
      fetchJSON("teams.json"),
      fetchJSON("last_updated.json"),
    ]);
    const teamsRaw =
      teamsResult.status === "fulfilled" ? teamsResult.value : null;
    const updated =
      updatedResult.status === "fulfilled"
        ? updatedResult.value
        : { lastUpdated: "Unknown" };

    // Summarize all JSON fetches done during this run and emit one combined line
    try {
      const files = typeof jsonLoads !== "undefined" ? jsonLoads : [];
      const fileNames = Array.from(
        new Set(files.map((f) => String(f.url).split("/").pop()))
      );
      if (fileNames.length) {
        const key = "lastLoadedFiles";
        const prev = sessionStorage.getItem(key);
        const current = JSON.stringify(fileNames.sort());
        if (prev !== current) {
          logger.info(
            `Data loaded (Welsh: ${welshCount}, Cardiff: ${cardiffCount}, Friendlies: ${friendliesCount}) – files: ${fileNames.join(
              ", "
            )}`
          );
          sessionStorage.setItem(key, current);
        }
      }
    } catch (_) {}

    // Update state
    logger.debug("Processing team data");
    state.cups = {
      Welsh: welsh || {},
      Cardiff: cardiff || {},
      Friendlies: friendlies || {},
    };
    if (state.cups.Friendlies) {
      state.cups.Friendlies.team_statistics = buildTeamStatistics(
        state.cups.Friendlies.rounds || []
      );
    }
    state.teams = normalizeTeams(teamsRaw, state.cups);
    state.lastUpdated = updated?.lastUpdated || "Unknown";

    logger.info("Team information processed", {
      count: state.teams.length,
      sample: state.teams.slice(0, 5).map((t) => t.name),
      lastUpdated: state.lastUpdated,
    });

    // Compute current season stats from cup rounds (overrides stale numbers)
    perfMonitor.startTiming("calculateStats");
    calculateStats();
    perfMonitor.endTiming("calculateStats");

    // perfMonitor.startTiming("renderAll");
    renderAll();
    // perfMonitor.endTiming("renderAll");

    perfMonitor.endTiming("loadData");
    perfMonitor.recordMemoryUsage();

    logger.success("Football data loaded successfully", {
      lastUpdated: state.lastUpdated,
      teamsCount: state.teams.length,
      cupsLoaded: Object.keys(state.cups).length,
      performance: perfMonitor.getPerformanceReport(),
    });
  } catch (err) {
    perfMonitor.endTiming("loadData");
    perfMonitor.recordError();

    // Don't show error messages - just log them silently
    logger.warn("Data loading had issues, but continuing", {
      error: err.message,
    });
  }

  logger.functionExit("loadData");
}

function showErrorMessage(message, retryCallback = null) {
  logger.warn("Showing error to user", { message, hasRetry: !!retryCallback });
  document
    .querySelectorAll(".dynamic-display, .bracket-container, #leaderboard")
    .forEach((el) => {
      if (el) {
        el.innerHTML = `
          <div class="error-message fade-in">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
              <span style="font-size: 1.2rem;">⚠</span>
              <span>${message}</span>
            </div>
            ${
              retryCallback
                ? `
              <button onclick="(${retryCallback})()" class="cta" style="margin-top: 0.5rem;">
                ↻ ${translate("retry")}
              </button>
            `
                : ""
            }
          </div>`;
      }
    });
}

function showNoDataMessage(message, container = null) {
  logger.debug("Showing no data message", { message, scoped: !!container });
  const render = (el) => {
    if (!el) return;
    el.innerHTML = `
      <div class="no-data-message fade-in">
        <span>${message}</span>
      </div>`;
    el.classList.add("loaded");
  };
  if (container) {
    render(container);
  } else {
    document.querySelectorAll(".dynamic-display").forEach(render);
  }
}

function showLoadingState(container, message = null) {
  if (!container) return;
  const loadingMessage = message || translate("loading");
  container.innerHTML = `
    <div class="loading-placeholder fade-in" style="text-align: center; padding: 2rem;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 1rem; color: #666;">${loadingMessage}</p>
    </div>`;
}

// ============================================================
// STATS CALCULATION
// ============================================================
function calculateStats() {
  state.teams.forEach((t) =>
    Object.assign(t, { played: 0, wins: 0, gf: 0, ga: 0, gd: 0 })
  );

  const updateStats = (g) => {
    const home = state.teams.find((t) => t.name === g.home_team);
    const away = state.teams.find((t) => t.name === g.away_team);
    if (
      !home ||
      !away ||
      g.away_team === "BYE" ||
      g.home_score == null ||
      g.away_score == null
    )
      return;

    home.played++;
    away.played++;
    home.gf += +g.home_score;
    home.ga += +g.away_score;
    away.gf += +g.away_score;
    away.ga += +g.home_score;

    if (g.home_score > g.away_score) home.wins++;
    else if (g.away_score > g.home_score) away.wins++;
  };

  Object.values(state.cups).forEach((cup) =>
    cup.rounds?.forEach((r) => r.games?.forEach(updateStats))
  );
  state.teams.forEach((t) => (t.gd = t.gf - t.ga));
}

function parseScore(score) {
  if (score == null || score === "") return null;
  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveWinner(game) {
  if (!game) {
    return { label: null, isDraw: false, winnerTeam: null };
  }

  const explicit =
    typeof game.winner === "string" && game.winner.trim().length
      ? game.winner.trim()
      : null;

  if (explicit) {
    const normalized =
      explicit === game.home_team || explicit === game.away_team
        ? explicit
        : null;
    return {
      label: explicit,
      isDraw: false,
      winnerTeam: normalized,
    };
  }

  const homeScore = parseScore(game.home_score);
  const awayScore = parseScore(game.away_score);
  if (homeScore == null || awayScore == null) {
    return { label: null, isDraw: false, winnerTeam: null };
  }

  if (homeScore > awayScore) {
    return {
      label: game.home_team ?? null,
      isDraw: false,
      winnerTeam: game.home_team ?? null,
    };
  }

  if (awayScore > homeScore) {
    return {
      label: game.away_team ?? null,
      isDraw: false,
      winnerTeam: game.away_team ?? null,
    };
  }

  return { label: null, isDraw: true, winnerTeam: null };
}

const MONTH_NAMES = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  cy: [
    "Ionawr",
    "Chwefror",
    "Mawrth",
    "Ebrill",
    "Mai",
    "Mehefin",
    "Gorffennaf",
    "Awst",
    "Medi",
    "Hydref",
    "Tachwedd",
    "Rhagfyr",
  ],
};

function getOrdinal(day, lang = currentLang) {
  if (lang === "cy") {
    if (day === 1) return `${day}af`;
    if (day === 2) return `${day}il`;
    if (day === 3 || day === 4) return `${day}ydd`;
    return `${day}ain`;
  }
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
}

function formatDisplayDate(dateValue, lang = currentLang) {
  if (!dateValue) return translate("dash");

  if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
    const day = dateValue.getUTCDate();
    const month = dateValue.getUTCMonth();
    const year = dateValue.getUTCFullYear();
    const months = MONTH_NAMES[lang] || MONTH_NAMES.en;
    return `${getOrdinal(day, lang)} ${months[month]} ${year}`;
  }

  const raw = String(dateValue).trim();
  if (!raw) return translate("dash");

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year;
  let monthIndex;
  let day;

  if (isoMatch) {
    year = Number(isoMatch[1]);
    monthIndex = Number(isoMatch[2]) - 1;
    day = Number(isoMatch[3]);
  } else {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }
    year = parsed.getUTCFullYear();
    monthIndex = parsed.getUTCMonth();
    day = parsed.getUTCDate();
  }

  if (
    typeof year !== "number" ||
    typeof monthIndex !== "number" ||
    typeof day !== "number"
  ) {
    return raw;
  }

  const months = MONTH_NAMES[lang] || MONTH_NAMES.en;
  const monthName = months[monthIndex] || months[0];
  return `${getOrdinal(day, lang)} ${monthName} ${year}`;
}

function formatMatchDate(cupName, dateValue) {
  if (!dateValue) return translate("dash");
  if (cupName === "Friendlies") {
    return formatDisplayDate(dateValue);
  }
  const raw = String(dateValue).trim();
  return raw || translate("dash");
}

function formatDeadline(deadlines) {
  const label = translate("deadline");
  if (!deadlines) return `${label}: ${translate("dash")}`;
  const text = String(deadlines.english ?? "").trim();
  if (!text) return `${label}: ${translate("dash")}`;
  const normalized = text.toLowerCase();
  if (
    normalized.startsWith(label.toLowerCase()) ||
    normalized.startsWith("deadline")
  ) {
    return text;
  }
  return `${label}: ${text}`;
}

function resolveRoundHeading(cupName, roundNumber, deadlines) {
  if (cupName === "Friendlies") {
    return translate("friendliesMatches");
  }
  const base =
    roundNumber != null && String(roundNumber).trim() !== ""
      ? `${translate("round")} ${roundNumber}`
      : translate("round");
  const deadlineText = formatDeadline(deadlines);
  return deadlineText ? `${base} - ${deadlineText}` : base;
}

function buildTeamStatistics(rounds = []) {
  const stats = new Map();

  const ensureTeam = (name) => {
    if (!stats.has(name)) {
      stats.set(name, {
        played: 0,
        wins: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      });
    }
    return stats.get(name);
  };

  rounds.forEach((round) => {
    (round?.games || []).forEach((game) => {
      const home = game?.home_team;
      const away = game?.away_team;
      if (!home || !away) return;
      const homeStats = ensureTeam(home);
      const awayStats = ensureTeam(away);
      homeStats.played += 1;
      awayStats.played += 1;

      const homeScore = parseScore(game.home_score);
      const awayScore = parseScore(game.away_score);

      if (homeScore != null) {
        homeStats.gf += homeScore;
        awayStats.ga += homeScore;
      }
      if (awayScore != null) {
        awayStats.gf += awayScore;
        homeStats.ga += awayScore;
      }

      if (homeScore != null && awayScore != null) {
        if (homeScore > awayScore) homeStats.wins += 1;
        else if (awayScore > homeScore) awayStats.wins += 1;
      }

      homeStats.gd = homeStats.gf - homeStats.ga;
      awayStats.gd = awayStats.gf - awayStats.ga;
    });
  });

  return Object.fromEntries(stats.entries());
}

// ============================================================
// DROPDOWN POPULATION + DASHBOARD DISPLAYS
// ============================================================
function populateDropdowns(cupName) {
  // Re-resolve elements to avoid stale references
  const teamElId =
    cupName === "Welsh"
      ? "welsh-team"
      : cupName === "Cardiff"
      ? "cardiff-team"
      : "friendlies-team";
  const displayElId =
    cupName === "Welsh"
      ? "welsh-display"
      : cupName === "Cardiff"
      ? "cardiff-display"
      : "friendlies-display";
  const team =
    document.getElementById(teamElId) || elements.dropdowns[cupName]?.team;
  const data = elements.dropdowns[cupName]?.data || null;
  const display =
    document.getElementById(displayElId) ||
    elements.dropdowns[cupName]?.display;
  if (!team) return;

  // Ensure teams list available (fallback derive from cups)
  let teamsList =
    Array.isArray(state.teams) && state.teams.length
      ? state.teams
      : deriveTeamsFromCups(state.cups);

  // Build options
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = `--${translate("chooseTeam") || "Choose a Team"}--`;
  placeholder.selected = true;
  placeholder.disabled = false;
  team.innerHTML = "";
  team.appendChild(placeholder);
  teamsList.forEach((t) => {
    if (!t?.name) return;
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    team.appendChild(opt);
  });

  if (data) data.style.display = "none";
  // Bind change with addEventListener to avoid accidental overrides
  team.onchange = null;
  team.addEventListener("change", () => updateCupDisplay(cupName));

  // Reset display area to prompt
  if (display) {
    showNoDataMessage(translate("selectTeamsToView"), display);
  }
}

function updateCupDisplay(cupName) {
  // Re-fetch to avoid stale nodes
  const team =
    document.getElementById(
      cupName === "Welsh"
        ? "welsh-team"
        : cupName === "Cardiff"
        ? "cardiff-team"
        : "friendlies-team"
    ) || elements.dropdowns[cupName]?.team;
  const display =
    document.getElementById(
      cupName === "Welsh"
        ? "welsh-display"
        : cupName === "Cardiff"
        ? "cardiff-display"
        : "friendlies-display"
    ) || elements.dropdowns[cupName]?.display;
  const teamName = team?.value || "";
  if (!teamName) {
    if (display) showNoDataMessage(translate("selectTeamsToView"), display);
    return;
  }
  const cupData = state.cups[cupName];
  if (display) {
    display.innerHTML = renderMatchHistory(teamName, cupName, cupData);
    display.classList.add("loaded");
  }
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
  teamSelect.innerHTML = `<option value="">--${translate(
    "chooseTeam"
  )}--</option>`;
  state.teams.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    teamSelect.appendChild(opt);
  });

  dataSelect.innerHTML = `
    <option value="">--${translate("chooseData")}--</option>
    <option value="stats">${translate("stats")}</option>
    <option value="history">${translate("matchHistory")}</option>
  `;

  // Handle dropdown changes
  const renderTeamData = () => {
    const teamName = teamSelect.value;
    const viewType = dataSelect.value;

    if (!teamName || !viewType) {
      showNoDataMessage(translate("selectTeamAndData"));
      return;
    }

    const team = state.teams.find((t) => t.name === teamName);
    if (!team) {
      showNoDataMessage(translate("noDataFound") + ` ${teamName}.`);
      return;
    }

    if (viewType === "stats") {
      display.innerHTML = renderTeamStats(team);
    } else if (viewType === "history") {
      const matchSections = Object.entries(state.cups)
        .map(([cupName, data]) => {
          const sectionHtml = renderMatchHistory(teamName, cupName, data);
          if (!sectionHtml.includes("<tr>")) return "";
          const slug = cupName.toLowerCase();
          return `<section class="team-cup team-cup--${slug}">
            ${sectionHtml}
          </section>`;
        })
        .filter(Boolean)
        .join("");

      display.innerHTML =
        matchSections || `<p>No match data available for ${teamName}.</p>`;
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
    <h3>${team.name} - ${translate("stats")}</h3>
    <table>
      <tr>
        <th>${translate("played")}</th>
        <th>${translate("wins")}</th>
        <th>${translate("gf")}</th>
        <th>${translate("ga")}</th>
        <th>${translate("gd")}</th>
      </tr>
      <tr>
        <td>${team.played}</td>
        <td>${team.wins}</td>
        <td>${team.gf}</td>
        <td>${team.ga}</td>
        <td>${team.gd}</td>
      </tr>
    </table>
    <p>${translate("notes")} ${team.notes || translate("dash")}</p>
  `;
}

function renderMatchHistory(teamName, cupName, data) {
  const rounds = data.rounds || [];
  if (!rounds.length) return `<p>${translate("noMatchData")}</p>`;
  const includeDateColumn = cupName === "Friendlies";

  return `
    <h3>${translate(cupName.toLowerCase() + "Matches")}</h3>
    ${rounds
      .map(
        (r) => `
        <h4>${resolveRoundHeading(cupName, r.round_number, r.deadlines)}</h4>
        <table>
          <tr>
            <th>${translate("home")}</th>
            <th>${translate("hScore")}</th>
            <th>${translate("aScore")}</th>
            <th>${translate("away")}</th>
            <th>${translate("winner")}</th>
            ${includeDateColumn ? `<th>${translate("date")}</th>` : ""}
          </tr>
          ${r.games
            ?.filter(
              (g) => g.home_team === teamName || g.away_team === teamName
            )
            .map((g) => {
              const winnerMeta = deriveWinner(g);
              const winnerText =
                winnerMeta.label ||
                (winnerMeta.isDraw ? translate("draw") : translate("dash"));
              return `
              <tr>
                <td>${g.home_team}</td>
                <td>${g.home_score ?? "-"}</td>
                <td>${g.away_score ?? "-"}</td>
                <td>${g.away_team}</td>
                <td>${winnerText}</td>
                ${includeDateColumn ? `<td>${formatMatchDate(cupName, g.date)}</td>` : ""}
              </tr>`;
            })
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

  // Debug: Check what translate function returns
  const htmlContent = `
    <h2 class="fade-in">${translate("leaderboard")}</h2>
    <div class="table-container fade-in">
    <table>
        <thead>
      <tr>
        <th>#</th>
            <th>${translate("teamName")}</th>
            <th data-numeric="true">${translate("played")}</th>
            <th data-numeric="true">${translate("wins")}</th>
            <th data-numeric="true">${translate("gf")}</th>
            <th data-numeric="true">${translate("ga")}</th>
            <th data-numeric="true">${translate("gd")}</th>
      </tr>
        </thead>
        <tbody>
      ${sorted
        .map(
          (t, i) =>
            `<tr class="slide-in-left" style="animation-delay: ${i * 0.1}s">
                  <td class="rank">${i + 1}</td>
                  <td class="team-name">${t.name || translate("unknown")}</td>
                  <td data-numeric="true">${t.played}</td>
                  <td data-numeric="true">${t.wins}</td>
                  <td data-numeric="true">${t.gf}</td>
                  <td data-numeric="true">${t.ga}</td>
                  <td data-numeric="true" class="${
                    t.gd >= 0 ? "positive" : "negative"
                  }">${t.gd >= 0 ? "+" : ""}${t.gd}</td>
            </tr>`
        )
        .join("")}
        </tbody>
      </table>
    </div>`;

  el.innerHTML = htmlContent;
}

function renderBracket(cupName, data, container) {
  if (!container) return;
  const rounds = data.rounds || [];
  if (!rounds.length)
    return (container.innerHTML = `<p>${translate("noBracketData")}</p>`);

  container.innerHTML = rounds
    .map(
      (r) => `
      <div class="round">
        <h3>${resolveRoundHeading(cupName, r.round_number, r.deadlines)}</h3>
        <div class="games">
          ${
            r.games
              ?.map((g) => {
                const winnerMeta = deriveWinner(g);
                const winnerTeam = winnerMeta.winnerTeam;
                return `
            <div class="game" title="${g.notes || ""}">
              <span class="team ${
                winnerTeam && winnerTeam === g.home_team ? "winner" : ""
              }">${g.home_team}</span>
              <span class="score">${g.home_score ?? translate("dash")}</span> -
              <span class="score">${g.away_score ?? translate("dash")}</span>
              <span class="team ${
                winnerTeam && winnerTeam === g.away_team ? "winner" : ""
              }">${g.away_team}</span>
            </div>`;
              })
              .join("") || ""
          }
        </div>
      </div>`
    )
    .join("");
}

function renderBrackets() {
  renderBracket("Welsh", state.cups.Welsh, elements.brackets.welsh);
  renderBracket("Cardiff", state.cups.Cardiff, elements.brackets.cardiff);
  renderBracket(
    "Friendlies",
    state.cups.Friendlies,
    elements.brackets.friendlies
  );
}

function renderLastUpdated() {
  if (elements.lastUpdated) {
    elements.lastUpdated.textContent = `${translate("lastUpdated")} ${
      state.lastUpdated
    }`;
  }
}

// ============================================================
// ADMIN ACCESS + UPDATE FIXTURES MODAL
// ============================================================

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
const adminAccessModal = document.getElementById("admin-access-modal");
const adminAccessClose = document.getElementById("admin-access-close");
const adminAccessPass = document.getElementById("admin-access-pass");
const adminAccessSubmit = document.getElementById("admin-access-submit");
const adminAccessError = document.getElementById("admin-access-error");
const adminAccessResolvers = [];
let isAdminAccessOpen = false;

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
  stepsList?.querySelectorAll("li").forEach((li) => {
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

function openAdminAccessModal() {
  if (!adminAccessModal) return;
  adminAccessModal.setAttribute("aria-hidden", "false");
  if (adminAccessError) adminAccessError.hidden = true;
  isAdminAccessOpen = true;
  if (adminAccessPass) {
    const storedPwd = sessionStorage.getItem("admin_password") || "";
    adminAccessPass.value = storedPwd;
    setTimeout(() => {
      try {
        adminAccessPass.focus({ preventScroll: true });
        if (storedPwd) adminAccessPass.select();
      } catch (_) {}
    }, 0);
  }
}

function closeAdminAccessModal() {
  if (!adminAccessModal) return;
  adminAccessModal.setAttribute("aria-hidden", "true");
  isAdminAccessOpen = false;
  if (sessionStorage.getItem("admin_unlocked") !== "true") {
    while (adminAccessResolvers.length) {
      const resolver = adminAccessResolvers.shift();
      resolver(null);
    }
  }
}

async function handleAdminAccessSubmit(event) {
  event?.preventDefault?.();
  if (!adminAccessSubmit || !adminAccessPass) return;

  if (adminAccessError) adminAccessError.hidden = true;

  const password = adminAccessPass.value.trim();
  if (!password) {
    if (adminAccessError) {
      adminAccessError.textContent = translate("pleaseEnterPassword");
      adminAccessError.hidden = false;
    }
    adminAccessPass.focus();
    return;
  }

  const originalText = adminAccessSubmit.textContent;
  adminAccessSubmit.disabled = true;
  adminAccessSubmit.textContent = `${originalText}...`;

  try {
    const res = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "cors",
      body: JSON.stringify({ password, intent: "verify" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.success) {
      const msg =
        res.status === 401
          ? translate("invalidPassword")
          : data?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    sessionStorage.setItem("admin_unlocked", "true");
    sessionStorage.setItem("admin_password", password);
    closeAdminAccessModal();
    while (adminAccessResolvers.length) {
      const resolver = adminAccessResolvers.shift();
      resolver(password);
    }
  } catch (err) {
    if (adminAccessError) {
      adminAccessError.textContent =
        err?.message || translate("networkError");
      adminAccessError.hidden = false;
    }
    adminAccessPass.focus();
  } finally {
    adminAccessSubmit.disabled = false;
    adminAccessSubmit.textContent = originalText;
  }
}

adminAccessClose?.addEventListener("click", () => closeAdminAccessModal());
adminAccessModal?.addEventListener("click", (event) => {
  if (event.target === adminAccessModal) closeAdminAccessModal();
});
adminAccessSubmit?.addEventListener("click", handleAdminAccessSubmit);
adminAccessPass?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleAdminAccessSubmit(event);
});
adminAccessPass?.addEventListener("input", () => {
  if (adminAccessError) adminAccessError.hidden = true;
});

function requestAdminPassword() {
  const stored = sessionStorage.getItem("admin_password");
  if (stored) {
    sessionStorage.setItem("admin_unlocked", "true");
    return Promise.resolve(stored);
  }
  openAdminAccessModal();
  return new Promise((resolve) => {
    adminAccessResolvers.push(resolve);
  });
}

updateBtn?.addEventListener("click", openModal);
closeBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal(); // click backdrop to close
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (modal?.getAttribute("aria-hidden") === "false") closeModal();
  if (isAdminAccessOpen) closeAdminAccessModal();
});

startBtn?.addEventListener("click", async () => {
  errorEl.hidden = true;
  console.info("User clicked update button");

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
      body: JSON.stringify({ password }),
    });

    // Move steps regardless of outcome so user sees progress
    setStep("auth", "done");
    setStep("dispatch", "active");

    // Parse response
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      const msg = data?.error || `Request failed (${res.status})`;
      console.warn("Server returned an error", { status: res.status, msg });
      throw new Error(msg);
    }
    console.info("Server accepted the request", { status: res.status });

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
    console.error("Update failed", err);
    errorEl.textContent = `Warning: ${
      err.message || "Error contacting server"
    }`;
    errorEl.hidden = false;
  }
});

// Simple logging - no complex system needed

// Global error surfaces
window.addEventListener("error", (e) => {
  logger.errorWithStack("Something went wrong in the app", {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error?.message,
    stack: e.error?.stack,
  });

  // Don't show error messages to users - just log them
  logger.warn("App error caught and logged", { error: e.error?.message });
});

window.addEventListener("unhandledrejection", (e) => {
  logger.errorWithStack("App promise error", {
    reason: e.reason,
    promise: e.promise,
  });

  // Don't show error messages to users - just log them
  logger.warn("App promise error caught and logged", { reason: e.reason });
});

// Fetch timing wrapper (transparent; returns the same response)
const _fetch = window.fetch.bind(window);
const jsonLoads = [];
window.fetch = async (...args) => {
  const started = performance.now();
  const url = args[0];
  logger.debug(`Loading: ${url}`);

  try {
    const res = await _fetch(...args);
    const dur = Math.round(performance.now() - started);
    // Collect JSON file loads for a concise summary later
    if (typeof url === "string" && /\.json(\?|$)/.test(url)) {
      jsonLoads.push({ url, status: res.status, durationMs: dur });
    } else {
      logger.apiCall("GET", url, res.status, `${dur}ms`);
    }
    return res;
  } catch (err) {
    const dur = Math.round(performance.now() - started);
    logger.errorWithStack(`Loading failed: ${url}`, err);
    throw err;
  }
};

// Simple logging - no complex system needed

// ============================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================
// Preload critical resources
function preloadCriticalResources() {
  // No critical resources to preload
  // logger.debug("No important files to preload");
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

  window.addEventListener("scroll", requestTick, { passive: true });
}
function setupIntersectionObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  // Observe all sections for lazy loading
  document
    .querySelectorAll(".dashboard-overview, .cup-section, .bracket-container")
    .forEach((el) => {
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
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================
// KEYBOARD NAVIGATION & ACCESSIBILITY
// ============================================================
function setupKeyboardNavigation() {
  // Add keyboard support for language buttons
  document.querySelectorAll(".lang-switch button").forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Add keyboard support for navigation
  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        link.click();
      }
    });
  });

  // Add keyboard support for buttons
  document.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Add keyboard support for selects
  document.querySelectorAll("select").forEach((select) => {
    select.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const options = Array.from(select.options);
        const currentIndex = options.findIndex((opt) => opt.selected);
        let newIndex = currentIndex;

        if (e.key === "ArrowUp") {
          newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        } else {
          newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        }

        select.selectedIndex = newIndex;
        select.dispatchEvent(new Event("change"));
      }
    });
  });
}

// ============================================================
// GLOBAL RENDER + REFRESH HANDLERS
// ============================================================
function renderAll() {
  logger.functionEntry("renderAll");

  // Only start timing if not already started
  if (!performance.getEntriesByName("renderAll-start").length) {
    perfMonitor.startTiming("renderAll");
  }

  if (!state.teams?.length) {
    logger.warn("No teams found — check teams.json file");
    if (performance.getEntriesByName("renderAll-start").length) {
      perfMonitor.endTiming("renderAll");
    }
    return;
  }

  logger.debug("Starting to display all content", {
    teamsCount: state.teams.length,
  });

  // Render dropdowns (with safety checks)
  if (typeof elements !== "undefined" && elements.dropdowns) {
    Object.keys(elements.dropdowns).forEach((cupName) => {
      if (elements.dropdowns[cupName]) {
        logger.debug(`Setting up dropdown for ${cupName}`);
        perfMonitor.startTiming(`dropdown-${cupName}`);
        populateDropdowns(cupName);
        perfMonitor.endTiming(`dropdown-${cupName}`);
      }
    });
  }

  // Render main components
  logger.debug("Displaying leaderboard");
  perfMonitor.startTiming("renderLeaderboard");
  renderLeaderboard();
  perfMonitor.endTiming("renderLeaderboard");

  logger.debug("Displaying brackets");
  perfMonitor.startTiming("renderBrackets");
  renderBrackets();
  perfMonitor.endTiming("renderBrackets");

  logger.debug("Displaying last updated info");
  perfMonitor.startTiming("renderLastUpdated");
  renderLastUpdated();
  perfMonitor.endTiming("renderLastUpdated");

  if (performance.getEntriesByName("renderAll-start").length) {
    perfMonitor.endTiming("renderAll");
  }
  perfMonitor.recordMemoryUsage();

  logger.functionExit("renderAll");
  logger.debug("All content displayed successfully");
}

// Expose core utilities for auxiliary modules (e.g., admin.js)
window.App = {
  workerURL,
  translate,
  logger,
  loadData,
  renderAll,
  state,
};

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
// Service worker registration moved to DOMContentLoaded event to avoid duplication

window.addEventListener("DOMContentLoaded", async () => {
  // Prevent duplicate initialization using sessionStorage
  if (isInitialized) {
    logger.debug("App already initialized – running light init for this page");
    // Do not return: allow this page to load data and initialize its UI
  } else {
    // Mark as initialized in sessionStorage (survives page reloads)
    sessionStorage.setItem(INIT_KEY, "true");
  }

  // Special handling for Dreamweaver Live Preview
  if (isDreamweaverPreview) {
    logger.info(
      "Running in Dreamweaver Live Preview - using enhanced duplicate prevention"
    );
    // Add extra delay to prevent Dreamweaver's rapid reloads
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  logger.info("Football app starting", {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });

  // logger.time("app-initialization");

  // Setup performance optimizations
  // logger.debug("Setting up performance features");
  setupIntersectionObserver();
  setupScrollOptimizations();
  preloadCriticalResources();

  // Setup accessibility features
  // logger.debug("Setting up accessibility features");
  setupKeyboardNavigation();

  // Protect Admin link using the same password check as refresh (Cloudflare Worker)
  try {
    const adminLink = document.getElementById("admin-link");
    if (adminLink) {
      adminLink.addEventListener("click", (e) => {
        e.preventDefault();
        requestAdminPassword().then((pwd) => {
          if (!pwd) return;
          window.location.href = "admin.html";
        });
      });
    }

    const adminLocked = document.getElementById("admin-locked");
    const adminBody = document.getElementById("admin-body");

    const ensureDataLoaded = async () => {
      try {
        if (!Array.isArray(state.teams) || state.teams.length === 0) {
          if (typeof window.loadData === "function") {
            await window.loadData();
            renderAll();
          }
        }
      } catch (e) {
        console.warn("[ADMIN] ensureDataLoaded failed", e);
      }
    };
    window.ensureDataLoaded = ensureDataLoaded;

    if (adminLocked || adminBody) {
      const $ = (sel) => document.querySelector(sel);
      const notesTeam = $("#notes-team");
      const notesTextarea = $("#notes-text");
      const notesSaveBtn = $("#notes-save");
      const notesSaved = $("#notes-saved");
      const frDate = $("#fr-date");
      const frHome = $("#fr-home");
      const frAway = $("#fr-away");
      const frHomeGoals = $("#fr-home-goals");
      const frAwayGoals = $("#fr-away-goals");
      const frNotes = $("#fr-notes");
      const frSubmit = $("#fr-submit");
      const unlockBtn = $("#admin-unlock");
      const passInput = $("#admin-pass");

      const initAdmin = () => {
        const initTeams = () => {
          if (!Array.isArray(state.teams) || state.teams.length === 0) {
            setTimeout(initTeams, 200);
            return;
          }
          const sorted = [...state.teams].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          if (notesTeam)
            notesTeam.innerHTML = `<option value="">--${translate(
              "chooseTeam"
            )}--</option>`;
          if (frHome)
            frHome.innerHTML = `<option value="">--${translate(
              "chooseTeam"
            )}--</option>`;
          if (frAway)
            frAway.innerHTML = `<option value="">--${translate(
              "chooseTeam"
            )}--</option>`;
          sorted.forEach((t) => {
            if (notesTeam) {
              const opt = document.createElement("option");
              opt.value = t.name;
              opt.textContent = t.name;
              notesTeam.appendChild(opt);
            }
            if (frHome) {
              const opt = document.createElement("option");
              opt.value = t.name;
              opt.textContent = t.name;
              frHome.appendChild(opt);
            }
            if (frAway) {
              const opt = document.createElement("option");
              opt.value = t.name;
              opt.textContent = t.name;
              frAway.appendChild(opt);
            }
          });
          if (notesTeam) notesTeam.removeAttribute("disabled");
          if (frHome) frHome.removeAttribute("disabled");
          if (frAway) frAway.removeAttribute("disabled");

          if (notesTeam && notesTextarea && notesSaved) {
            notesTeam.addEventListener("change", () => {
              const team = state.teams.find((t) => t.name === notesTeam.value);
              notesTextarea.value = team?.notes || "";
              notesSaved.textContent = "";
            });
          }
        };
        initTeams();

        if (notesSaveBtn && notesTeam && notesTextarea && notesSaved) {
          notesSaveBtn.addEventListener("click", () => {
            const name = notesTeam.value;
            if (!name) {
              notesTeam.focus();
              return;
            }
            const team = state.teams.find((t) => t.name === name);
            if (!team) return;
            const oldNotes = team.notes || "";
            team.notes = String(notesTextarea.value || "").trim();
            if (oldNotes !== team.notes) {
              logger?.dataChange?.("team-notes", oldNotes, team.notes);
            }
            notesSaved.textContent = translate("saved");
            setTimeout(() => (notesSaved.textContent = ""), 1500);
          });
        }

        const updateFriendlyValidity = () => {
          if (!frHome || !frAway || !frSubmit) return;
          const valid = Boolean(
            frHome.value && frAway.value && frHome.value !== frAway.value
          );
          frSubmit.disabled = !valid;
          if (!valid) frSubmit.setAttribute("disabled", "disabled");
          else frSubmit.removeAttribute("disabled");
        };
        [frDate, frHome, frAway].forEach(
          (el) => el && el.addEventListener("input", updateFriendlyValidity)
        );
        [frHome, frAway].forEach(
          (el) => el && el.addEventListener("change", updateFriendlyValidity)
        );

        if (frSubmit) {
          frSubmit.addEventListener("click", async () => {
            if (!frDate || !frHome || !frAway) return;
            const date = frDate.value;
            const home = frHome.value;
            const away = frAway.value;
            const hs = frHomeGoals ? frHomeGoals.value : "";
            const as = frAwayGoals ? frAwayGoals.value : "";
            if (!date || !home || !away || home === away) return;
            const friendly = {
              date,
              home_team: home,
              away_team: away,
              home_score: hs !== "" ? Number(hs) : null,
              away_score: as !== "" ? Number(as) : null,
              notes: frNotes?.value || "",
            };
            const cup =
              state.cups.Friendlies ||
              (state.cups.Friendlies = { rounds: [] });
            if (!Array.isArray(cup.rounds)) cup.rounds = [];
            let round = cup.rounds[0];
            if (!round) {
              round = { round_number: 1, deadlines: {}, games: [] };
              cup.rounds.push(round);
            }
            round.games = Array.isArray(round.games) ? round.games : [];
            round.games.push(friendly);
            logger?.success?.("Friendly result added");
            if (frDate) frDate.value = "";
            if (frHome) frHome.selectedIndex = 0;
            if (frAway) frAway.selectedIndex = 0;
            if (frHomeGoals) frHomeGoals.value = "";
            if (frAwayGoals) frAwayGoals.value = "";
            if (frNotes) frNotes.value = "";
            updateFriendlyValidity();

            try {
              const commitURL = workerURL.replace("/run", "/commit");
              if (!commitURL) throw new Error("Commit URL not configured.");

              let pwd = sessionStorage.getItem("admin_password") || "";
              if (!pwd) {
                pwd = await requestAdminPassword();
              }
              if (!pwd) return;

              const friendlies = state.cups.Friendlies || { rounds: [] };
              const rounds = friendlies.rounds || [];
              const friendliesPayload = {
                cup_name: "Friendlies",
                season:
                  state?.currentSeason || translate("currentSeason") || "",
                rounds,
                team_statistics: buildTeamStatistics(rounds),
              };
              const lastUpdatedPayload = {
                lastUpdated: new Date().toISOString(),
              };

              const res = await fetch(commitURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                mode: "cors",
                body: JSON.stringify({
                  password: pwd,
                  message: "Auto-commit friendlies update from Admin UI",
                  files: [
                    {
                      path: "friendlies.json",
                      content: JSON.stringify(friendliesPayload, null, 2),
                    },
                    {
                      path: "last_updated.json",
                      content: JSON.stringify(lastUpdatedPayload, null, 2),
                    },
                  ],
                }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.success)
                throw new Error(data?.error || "Commit failed");
              logger?.success?.("Committed friendlies.json to GitHub");
              try {
                await loadData();
                renderAll();
              } catch (_) {}
            } catch (err) {
              logger?.warn?.("Auto-commit failed", { error: err?.message });
            }
          });
        }

        if (sessionStorage.getItem("admin_unlocked") === "true") {
          if (adminLocked) adminLocked.hidden = true;
          if (adminBody) adminBody.hidden = false;
          ensureDataLoaded().finally(() => initAdmin());
        }

        if (unlockBtn && adminLocked && adminBody) {
          unlockBtn.addEventListener("click", async () => {
            const val = (passInput?.value || "").trim();
            if (!val) {
              passInput?.focus();
              return;
            }
            adminLocked.hidden = true;
            adminBody.hidden = false;
            sessionStorage.setItem("admin_unlocked", "true");
            sessionStorage.setItem("admin_password", val);
            ensureDataLoaded().finally(() => initAdmin());
          });
        }
      }
    }
  } catch (_) {}

  // Apply initial translations to any existing elements with data-i18n
  try {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const t = getTranslation(key);
      if (t) {
        if (
          el.tagName === "INPUT" &&
          (el.type === "text" || el.type === "password")
        ) {
          el.placeholder = t;
        } else if (el.hasAttribute("aria-label")) {
          el.setAttribute("aria-label", t);
        } else if (el.hasAttribute("title")) {
          el.setAttribute("title", t);
        } else {
          el.textContent = t;
        }
      }
    });
  } catch (_) {}

  // Set initial language button display
  // logger.debug("Setting up language button");
  updateLanguageButton();

  // Preload critical resources (handled by preloadCriticalResources function)
  // logger.debug("Preloading important files");

  // Register service worker early to avoid duplication
  if ("serviceWorker" in navigator) {
    try {
      const existingRegistrations =
        await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length === 0) {
        const registration = await navigator.serviceWorker.register("./sw.js", {
          scope: "./",
        });
        logger.info("App caching enabled successfully", {
          scope: registration.scope,
          state: registration.active?.state || "installing",
        });

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                logger.info(
                  "App update available - will take effect on next page load"
                );
                console.log(
                  "App update available - will take effect on next page load"
                );
                // Don't auto-reload, let the user continue using the app
                // The update will take effect on the next page load
              }
            });
          }
        });
      } else {
        logger.debug("Service worker already registered");
      }
    } catch (error) {
      logger.warn("App caching setup failed", { error: error.message });
    }
  } else {
    logger.info("App caching not supported in this browser");
  }

  try {
    // logger.time("data-loading");
    await loadData();
    // logger.timeEnd("data-loading");
    // Duplicate overall success removed (already logged in loadData)
  } catch (error) {
    logger.errorWithStack("Failed to load football data", error);
  }

  setTimeout(() => {
    // logger.time("render-all");
    renderAll();
    // logger.timeEnd("render-all");

    // logger.time("team-dashboard-init");
    initTeamDashboard(); // Initialize teamCard.html if present
    // logger.timeEnd("team-dashboard-init");

    // Ensure language button is properly displayed after everything loads
    updateLanguageButton();
    // logger.timeEnd("app-initialization");
    logger.success("Football app fully ready");

    // Log concise performance summary
    const perf = perfMonitor.getPerformanceReport() || {};
    const summary = {
      fcp: perf.firstContentfulPaintMs,
      dom: perf.domContentLoadedMs,
      load: perf.loadEventEndMs,
    };
    logger.info("Performance", summary);
  }, 300);

  // Page-specific initializers (moved from inline scripts)
  try {
    // Team Dashboard page: ensure placeholder removal + loaded class
    const teamDisplay = document.getElementById("team-display");
    if (teamDisplay) {
      const teamLoading = document.getElementById("team-loading");
      const observer = new MutationObserver(() => {
        if (
          teamDisplay.innerHTML &&
          !teamDisplay.classList.contains("loaded")
        ) {
          teamDisplay.classList.add("loaded");
          if (teamLoading) teamLoading.remove();
        }
      });
      observer.observe(teamDisplay, { childList: true, subtree: true });
    }

    // Brackets page: handle competition selection and loaded fade-in
    const competitionSelect = document.getElementById("competition-select");
    const welshBracket = document.getElementById("welsh-bracket-container");
    const cardiffBracket = document.getElementById("cardiff-bracket-container");
    const friendliesBracket = document.getElementById(
      "friendlies-bracket-container"
    );
    if (
      competitionSelect &&
      (welshBracket || cardiffBracket || friendliesBracket)
    ) {
      const brackets = {
        Welsh: welshBracket,
        Cardiff: cardiffBracket,
        Friendlies: friendliesBracket,
      };
      const loaders = {
        Welsh: document.getElementById("welsh-loading"),
        Cardiff: document.getElementById("cardiff-loading"),
        Friendlies: document.getElementById("friendlies-loading"),
      };

      const updateVisibility = () => {
        const selected = competitionSelect.value || "Welsh";
        Object.entries(brackets).forEach(([key, container]) => {
          if (!container) return;
          const isVisible = key === selected;
          container.hidden = !isVisible;
          container.setAttribute("aria-hidden", (!isVisible).toString());
        });
      };

      updateVisibility();
      competitionSelect.addEventListener("change", updateVisibility);

      const brObserver = new MutationObserver(() => {
        Object.entries(brackets).forEach(([key, container]) => {
          if (!container || container.classList.contains("loaded")) return;
          if (!container.innerHTML.trim()) return;
          container.classList.add("loaded");
          const loader = loaders[key];
          if (loader) loader.remove();
        });
      });

      Object.values(brackets)
        .filter(Boolean)
        .forEach((container) =>
          brObserver.observe(container, { childList: true, subtree: true })
        );
    }

  } catch (_) {}
});


// =======================
// CLEANUP ON PAGE UNLOAD
// =======================
window.addEventListener("beforeunload", () => {
  logger.info("Football app shutting down");
  perfMonitor.cleanup();
  cleanupPendingTimeouts();
});

// =======================
// PERFORMANCE MONITORING
// =======================
window.addEventListener("load", () => {
  // Prevent duplicate initialization using sessionStorage
  if (sessionStorage.getItem(INIT_KEY) === "true") {
    // logger.info("App already initialized, skipping load event");
    return;
  }

  // Log performance metrics after page load
  setTimeout(() => {
    const perfReport = perfMonitor.getPerformanceReport();
    logger.info("Page load performance report", perfReport);

    // Log memory usage if available
    if (performance.memory) {
      logger.info("Memory usage", {
        used:
          Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + "MB",
        total:
          Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + "MB",
        limit:
          Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + "MB",
      });
    }
  }, 1000);
});

elements.refresh?.addEventListener("click", async () => {
  logger.userAction("refresh-button-clicked");

  elements.refresh.disabled = true;
  const originalText = translate("refresh");
  elements.refresh.textContent = `${originalText}...`;

  logger.info("User requested data refresh");
  logger.time("refresh-data");

  try {
    await loadData();
    logger.timeEnd("refresh-data");
    logger.success("Football data refreshed successfully");
  } catch (error) {
    logger.timeEnd("refresh-data");
    logger.errorWithStack("Data refresh failed", error);
  }

  elements.refresh.textContent = originalText;
  elements.refresh.disabled = false;
});
