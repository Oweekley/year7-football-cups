// ============================================================
//  YEAR 7 CUPS DASHBOARD 2025 - CORE SCRIPT (Optimized & Unified)
//  Improvements:
//  - Cleaner structure, comments, and modular rendering
//  - Improved bilingual support + dark mode consistency
//  - Error handling & data caching for smoother UX
//  - Fully supports teamCard.html dropdowns
//  - Keeps 100% compatibility with existing HTML + JSON
//  - Comprehensive logging system for debugging and monitoring
// ============================================================

// =======================
// COMPREHENSIVE LOGGING SYSTEM
// =======================
class Logger {
  constructor(context = 'APP') {
    this.context = context;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logLevel = this.getLogLevel();
    this.logCount = 0;
    
    // Log system initialization
    this.info('Logger initialized', { 
      context, 
      sessionId: this.sessionId,
      logLevel: this.logLevel,
      timestamp: new Date().toISOString()
    });
  }

  generateSessionId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  getLogLevel() {
    // Check for debug mode in localStorage or URL params
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = localStorage.getItem('debug') === 'true' || urlParams.get('debug') === 'true';
    return debugMode ? 'DEBUG' : 'INFO';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    this.logCount++;
    
    const logEntry = {
      level,
      message,
      context: this.context,
      sessionId: this.sessionId,
      timestamp,
      elapsed: `${elapsed}ms`,
      count: this.logCount,
      data: data || undefined
    };

    // Color coding for different log levels
    const colors = {
      DEBUG: '#6c757d',
      INFO: '#007bff',
      WARN: '#ffc107',
      ERROR: '#dc3545',
      SUCCESS: '#28a745'
    };

    const color = colors[level] || '#000000';
    
    // Console output with styling
    console.log(
      `%c[${level}] %c[${this.context}] %c${message}`,
      `color: ${color}; font-weight: bold;`,
      `color: #6c757d; font-style: italic;`,
      `color: #000;`,
      data ? data : ''
    );

    // Store in session storage for debugging
    if (this.logLevel === 'DEBUG') {
      const logs = JSON.parse(sessionStorage.getItem('appLogs') || '[]');
      logs.push(logEntry);
      // Keep only last 100 logs
      if (logs.length > 100) logs.splice(0, logs.length - 100);
      sessionStorage.setItem('appLogs', JSON.stringify(logs));
    }

    return logEntry;
  }

  debug(message, data = null) {
    if (this.logLevel === 'DEBUG') {
      return this.formatMessage('DEBUG', message, data);
    }
  }

  info(message, data = null) {
    return this.formatMessage('INFO', message, data);
  }

  warn(message, data = null) {
    return this.formatMessage('WARN', message, data);
  }

  error(message, data = null) {
    return this.formatMessage('ERROR', message, data);
  }

  success(message, data = null) {
    return this.formatMessage('SUCCESS', message, data);
  }

  // Performance logging
  time(label) {
    console.time(`[${this.context}] ${label}`);
    return label;
  }

  timeEnd(label) {
    console.timeEnd(`[${this.context}] ${label}`);
  }

  // Group logging for related operations
  group(label) {
    console.group(`[${this.context}] ${label}`);
  }

  groupEnd() {
    console.groupEnd();
  }

  // Log function entry/exit
  functionEntry(functionName, params = {}) {
    this.debug(`Entering ${functionName}`, { params });
  }

  functionExit(functionName, result = null) {
    this.debug(`Exiting ${functionName}`, { result });
  }

  // Log data changes
  dataChange(type, oldValue, newValue) {
    this.info(`Data changed: ${type}`, { 
      oldValue, 
      newValue,
      changed: oldValue !== newValue
    });
  }

  // Log user interactions
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, details);
  }

  // Log API calls
  apiCall(method, url, status, duration = null) {
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    this[level.toLowerCase()](`API ${method} ${url}`, { status, duration });
  }

  // Log errors with stack trace
  errorWithStack(message, error) {
    this.error(message, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }

  // Export logs for debugging
  exportLogs() {
    const logs = JSON.parse(sessionStorage.getItem('appLogs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${this.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear logs
  clearLogs() {
    sessionStorage.removeItem('appLogs');
    this.info('Logs cleared');
  }
}

// Create main logger instance
const logger = new Logger('DASHBOARD');

// =======================
// COMPREHENSIVE TRANSLATIONS
// =======================

// =======================
// COMPREHENSIVE TRANSLATIONS
// =======================
const translations = {
  en: {
    // Main Navigation & Headers
    dashboardTitle: "Year 7 Cups Dashboard 2025",
    dashboard: "Dashboard",
    teamDashboard: "Team Dashboard",
    brackets: "Brackets",
    
    // Page Titles & Descriptions
    welshCupOverview: "Welsh Cup Overview",
    cardiffCupOverview: "Cardiff Cup Overview",
    friendliesOverview: "Friendlies Overview",
    leaderboard: "Leaderboard",
    teamStats: "Team Statistics",
    matchHistory: "Match History",
    
    // Form Labels & Controls
    selectTeam: "Select Team:",
    selectData: "Select Data:",
    selectCompetition: "Select Competition:",
    chooseTeam: "--Choose a Team--",
    chooseData: "--Team Stats / Match History--",
    chooseCompetition: "--Select Competition--",
    
    // Data Headers & Labels
    stats: "Stats",
    statistics: "Statistics",
    played: "Played",
    games: "Games",
    wins: "Wins",
    losses: "Losses",
    draws: "Draws",
    gf: "GF",
    goalsFor: "Goals For",
    ga: "GA",
    goalsAgainst: "Goals Against",
    gd: "GD",
    goalDifference: "Goal Difference",
    points: "Points",
    position: "Position",
    rank: "Rank",
    team: "Team",
    teams: "Teams",
    
    // Match Information
    welshMatches: "Welsh Cup Matches",
    cardiffMatches: "Cardiff Cup Matches",
    friendliesMatches: "Friendlies Matches",
    round: "Round",
    rounds: "Rounds",
    deadline: "Deadline",
    home: "Home",
    away: "Away",
    hScore: "H Score",
    aScore: "A Score",
    homeScore: "Home Score",
    awayScore: "Away Score",
    winner: "Winner",
    date: "Date",
    matchNotes: "Match History",
    game: "Game",
    games: "Games",
    match: "Match",
    matches: "Matches",
    
    // Status & Messages
    loading: "Loading...",
    loadingData: "Loading data...",
    loadingLeaderboard: "Loading leaderboard...",
    loadingBrackets: "Loading brackets...",
    selectTeamsToView: "Select teams to view data...",
    noDataAvailable: "No data available",
    noMatchData: "No match data available",
    noBracketData: "No bracket data available",
    errorLoadingData: "Error loading data. Please check your JSON files or network connection.",
    unexpectedError: "An unexpected error occurred. Please refresh the page.",
    networkError: "A network error occurred. Please check your connection and try again.",
    dataLoadedSuccessfully: "Data loaded successfully!",
    teamsFound: "teams found",
    refreshData: "Refresh Data",
    lastUpdated: "Last Updated:",
    unknown: "Unknown",
    
    // Buttons & Actions
    refresh: "Refresh",
    update: "Update",
    retry: "Try Again",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    remove: "Remove",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    view: "View",
    show: "Show",
    hide: "Hide",
    
    // Language & Theme
    language: "Language",
    theme: "Theme",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    english: "English",
    welsh: "Welsh",
    switchToEnglish: "Switch to English",
    switchToWelsh: "Newid i'r Gymraeg",
    toggleDarkMode: "Toggle dark mode",
    
    // Accessibility
    skipToMainContent: "Skip to main content",
    mainNavigation: "Main navigation",
    languageSwitch: "Language switch",
    selectTeamLabel: "Select Team",
    selectDataLabel: "Select Data Type",
    selectCompetitionLabel: "Select competition to display",
    teamDetailsDisplay: "Team details display",
    welshCupBracket: "Welsh Cup Bracket",
    cardiffCupBracket: "Cardiff Cup Bracket",
    currentStandings: "Current standings table showing team rankings, games played, wins, goals for, goals against, and goal difference",
    selectTeamAndData: "Select a team and data type to view stats or match history for the Welsh Cup",
    selectTeamAndDataCardiff: "Select a team and data type to view stats or match history for the Cardiff Cup",
    selectTeamAndDataFriendlies: "Select a team and data type to view friendlies stats or match history",
    exploreCombinedStats: "Explore combined stats and match history for each team across all competitions",
    viewKnockoutRounds: "View the knockout rounds, results, and progression for each cup",
    
    // Footer & Credits
    copyright: "© 2025",
    builtWith: "Built with",
    love: "love",
    by: "by",
    author: "Ollie",
    
    // Update Modal
    updateFixtures: "Update Fixtures",
    runScraper: "Run scraper and refresh data",
    enterSecret: "Enter the secret to trigger the scraper and refresh the JSON files.",
    password: "Password",
    runUpdate: "Run Update",
    authenticating: "Authenticating…",
    dispatching: "Dispatching GitHub Action…",
    running: "Scraper running on GitHub…",
    committing: "Committing JSON…",
    done: "All done — refresh to see changes.",
    pleaseEnterPassword: "Please enter the admin password.",
    
    // Table Headers
    position: "Pos",
    teamName: "Team",
    gamesPlayed: "P",
    wins: "W",
    losses: "L",
    draws: "D",
    goalsFor: "F",
    goalsAgainst: "A",
    goalDifference: "GD",
    points: "Pts",
    
    // Competition Names
    welshCup: "Welsh Cup",
    cardiffCup: "Cardiff Cup",
    friendlies: "Friendlies",
    welshCupFull: "U12 Boys Welsh Cup - Cardiff & Vale",
    cardiffCupFull: "Year 7 Boys Cardiff & Vale Cup",
    friendliesFull: "Friendlies",
    
    // Season & Dates
    season: "Season",
    currentSeason: "2025-26",
    lastUpdated: "Last Updated",
    
    // Special Values
    bye: "BYE",
    tbd: "TBD",
    tba: "TBA",
    na: "N/A",
    dash: "-",
    
    // Success/Error Messages
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Information",
    successMessage: "Operation completed successfully",
    errorMessage: "An error occurred",
    warningMessage: "Please note",
    infoMessage: "Information",
    
    // Print & Export
    print: "Print",
    export: "Export",
    download: "Download",
    share: "Share",
    
    // Time & Dates
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    nextWeek: "Next Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    nextMonth: "Next Month",
    thisYear: "This Year",
    lastYear: "Last Year",
    nextYear: "Next Year",
    
    // Meta & SEO
    metaDescription: "Interactive bilingual dashboard for the Year 7 Football Cups — Welsh Cup, Cardiff Cup, and Friendlies. Auto-updating stats, live tables, and knockout brackets.",
    teamDashboardDescription: "View detailed stats, match history, and performance for every team in the Year 7 Football Cups.",
    bracketsDescription: "View knockout rounds, results, and progression for each cup competition.",
    
    // Additional UI Elements
    notes: "Notes",
    dash: "-"
  },
  cy: {
    // Main Navigation & Headers
    dashboardTitle: "Dangosfwrdd Cwpanau Blwyddyn 7 2025",
    dashboard: "Dangosfwrdd",
    teamDashboard: "Dangosfwrdd Tim",
    brackets: "Bracetiau",
    
    // Page Titles & Descriptions
    welshCupOverview: "Trosolwg Cwpan Cymru",
    cardiffCupOverview: "Trosolwg Cwpan Caerdydd",
    friendliesOverview: "Trosolwg Gemau Cyfeillgar",
    leaderboard: "Tabl Cynghrair",
    teamStats: "Ystadegau Tim",
    matchHistory: "Hanes Gemau",
    
    // Form Labels & Controls
    selectTeam: "Dewiswch Tim:",
    selectData: "Dewiswch Ddata:",
    selectCompetition: "Dewiswch Gystadleuaeth:",
    chooseTeam: "--Dewiswch Dim--",
    chooseData: "--Ystadegau Tim / Hanes Gemau--",
    chooseCompetition: "--Dewiswch Gystadleuaeth--",
    
    // Data Headers & Labels
    stats: "Ystadegau",
    statistics: "Ystadegau",
    played: "Chwaraeodd",
    games: "Gemau",
    wins: "Enillodd",
    losses: "Collodd",
    draws: "Gêm Gyfartal",
    gf: "Gol I",
    goalsFor: "Goliau I",
    ga: "Gol Yn Erbyn",
    goalsAgainst: "Goliau Yn Erbyn",
    gd: "Gwahaniaeth Gol",
    goalDifference: "Gwahaniaeth Goliau",
    points: "Pwyntiau",
    position: "Safle",
    rank: "Rheng",
    team: "Tim",
    teams: "Timau",
    
    // Match Information
    welshMatches: "Gemau Cwpan Cymru",
    cardiffMatches: "Gemau Cwpan Caerdydd",
    friendliesMatches: "Gemau Cyfeillgar",
    round: "Rownd",
    rounds: "Rhodau",
    deadline: "Dyddiad Cau",
    home: "Cartref",
    away: "Ffwrdd",
    hScore: "SG Cartref",
    aScore: "SG Ffwrdd",
    homeScore: "Sgôr Cartref",
    awayScore: "Sgôr Ffwrdd",
    winner: "Enillydd",
    date: "Dyddiad",
    matchNotes: "Hanes Gemau",
    game: "Gêm",
    games: "Gemau",
    match: "Gêm",
    matches: "Gemau",
    
    // Status & Messages
    loading: "Yn Llwytho...",
    loadingData: "Yn llwytho data...",
    loadingLeaderboard: "Yn llwytho tabl cynghrair...",
    loadingBrackets: "Yn llwytho bracetiau...",
    selectTeamsToView: "Dewiswch dimau i weld data...",
    noDataAvailable: "Dim data ar gael",
    noMatchData: "Dim data gêm ar gael",
    noBracketData: "Dim data bracet ar gael",
    errorLoadingData: "Gwall wrth lwytho data. Gwiriwch eich ffeiliau JSON neu gysylltiad rhwydwaith.",
    unexpectedError: "Digwyddodd gwall annisgwyl. Adnewyddwch y dudalen os gwelwch yn dda.",
    networkError: "Digwyddodd gwall rhwydwaith. Gwiriwch eich cysylltiad a rhoi cynnig arall arni.",
    dataLoadedSuccessfully: "Llwythwyd data yn llwyddiannus!",
    teamsFound: "dimau wedi'u darganfod",
    refreshData: "Adnewyddu Data",
    lastUpdated: "Diweddarwyd Diwethaf:",
    unknown: "Anhysbys",
    
    // Buttons & Actions
    refresh: "Adnewyddu",
    update: "Diweddaru",
    retry: "Rhoi Cynnig Arall",
    close: "Cau",
    cancel: "Canslo",
    confirm: "Cadarnhau",
    save: "Arbed",
    edit: "Golygu",
    delete: "Dileu",
    add: "Ychwanegu",
    remove: "Tynnu",
    search: "Chwilio",
    filter: "Hidlo",
    sort: "Trefnu",
    view: "Gweld",
    show: "Dangos",
    hide: "Cuddio",
    
    // Language & Theme
    language: "Iaith",
    theme: "Thema",
    lightMode: "Modd Golau",
    darkMode: "Modd Tywyll",
    english: "Saesneg",
    welsh: "Cymraeg",
    switchToEnglish: "Newid i'r Saesneg",
    switchToWelsh: "Newid i'r Gymraeg",
    toggleDarkMode: "Toglo modd tywyll",
    
    // Accessibility
    skipToMainContent: "Neidio i'r prif gynnwys",
    mainNavigation: "Prif lwybr",
    languageSwitch: "Newid iaith",
    selectTeamLabel: "Dewis Tim",
    selectDataLabel: "Dewis Math o Ddata",
    selectCompetitionLabel: "Dewis cystadleuaeth i'w harddangos",
    teamDetailsDisplay: "Arddangos manylion tim",
    welshCupBracket: "Bracet Cwpan Cymru",
    cardiffCupBracket: "Bracet Cwpan Caerdydd",
    currentStandings: "Tabl safleoedd cyfredol yn dangos rheng timau, gemau a chwaraeodd, buddugoliaethau, goliau i, goliau yn erbyn, a gwahaniaeth goliau",
    selectTeamAndData: "Dewiswch dim a math o ddata i weld ystadegau neu hanes gemau ar gyfer Cwpan Cymru",
    selectTeamAndDataCardiff: "Dewiswch dim a math o ddata i weld ystadegau neu hanes gemau ar gyfer Cwpan Caerdydd",
    selectTeamAndDataFriendlies: "Dewiswch dim a math o ddata i weld ystadegau cyfeillgar neu hanes gemau",
    exploreCombinedStats: "Archwiliwch ystadegau cyfuno a hanes gemau ar gyfer pob tim ar draws pob cystadleuaeth",
    viewKnockoutRounds: "Gweld y rhodau knockout, canlyniadau, a datblygiad ar gyfer pob cwpan",
    
    // Footer & Credits
    copyright: "© 2025",
    builtWith: "Adeiladwyd gyda",
    love: "cariad",
    by: "gan",
    author: "Ollie",
    
    // Update Modal
    updateFixtures: "Diweddaru Ffixtures",
    runScraper: "Rhedeg scraper ac adnewyddu data",
    enterSecret: "Rhowch y gyfrinach i sbarduno'r scraper ac adnewyddu'r ffeiliau JSON.",
    password: "Cyfrinair",
    runUpdate: "Rhedeg Diweddariad",
    authenticating: "Yn dilysu...",
    dispatching: "Yn anfon GitHub Action...",
    running: "Scraper yn rhedeg ar GitHub...",
    committing: "Yn cyflwyno JSON...",
    done: "Popeth wedi'i wneud — adnewyddwch i weld newidiadau.",
    pleaseEnterPassword: "Rhowch gyfrinair y gweinyddwr os gwelwch yn dda.",
    
    // Table Headers
    position: "Safle",
    teamName: "Tim",
    gamesPlayed: "Chwaraeodd",
    wins: "Enillodd",
    losses: "Collodd",
    draws: "Gêm Gyfartal",
    goalsFor: "Goliau I",
    goalsAgainst: "Goliau Yn Erbyn",
    goalDifference: "Gwahaniaeth Goliau",
    points: "Pwyntiau",
    
    // Competition Names
    welshCup: "Cwpan Cymru",
    cardiffCup: "Cwpan Caerdydd",
    friendlies: "Cyfeillgar",
    welshCupFull: "Cwpan Cymru Bechgyn U12 - Caerdydd a'r Fro",
    cardiffCupFull: "Cwpan Bechgyn Blwyddyn 7 Caerdydd a'r Fro",
    friendliesFull: "Cyfeillgar",
    
    // Season & Dates
    season: "Tymor",
    currentSeason: "2025-26",
    lastUpdated: "Diweddarwyd Diwethaf",
    
    // Special Values
    bye: "BYE",
    tbd: "I'w Benderfynu",
    tba: "I'w Gyhoeddi",
    na: "N/A",
    dash: "-",
    
    // Success/Error Messages
    success: "Llwyddiant",
    error: "Gwall",
    warning: "Rhybudd",
    info: "Gwybodaeth",
    successMessage: "Cwblhawyd y weithred yn llwyddiannus",
    errorMessage: "Digwyddodd gwall",
    warningMessage: "Sylwch os gwelwch yn dda",
    infoMessage: "Gwybodaeth",
    
    // Print & Export
    print: "Argraffu",
    export: "Allforio",
    download: "Lawrlwytho",
    share: "Rhannu",
    
    // Time & Dates
    today: "Heddiw",
    yesterday: "Ddoe",
    tomorrow: "Yfory",
    thisWeek: "Yr Wythnos Hon",
    lastWeek: "Wythnos Diwethaf",
    nextWeek: "Wythnos Nesaf",
    thisMonth: "Y Mis Hwn",
    lastMonth: "Mis Diwethaf",
    nextMonth: "Mis Nesaf",
    thisYear: "Eleni",
    lastYear: "Llynedd",
    nextYear: "Blwyddyn Nesaf",
    
    // Meta & SEO
    metaDescription: "Dangosfwrdd dwyieithog rhyngweithiol ar gyfer Cwpanau Pêl-droed Blwyddyn 7 — Cwpan Cymru, Cwpan Caerdydd, a Chyfeillgar. Ystadegau sy'n adnewyddu'n awtomatig, tablau byw, a bracetiau knockout.",
    teamDashboardDescription: "Gweld ystadegau manwl, hanes gemau, a pherfformiad pob tim yn Cwpanau Pêl-droed Blwyddyn 7.",
    bracketsDescription: "Gweld rhodau knockout, canlyniadau, a datblygiad ar gyfer pob cystadleuaeth cwpan.",
    
    // Additional UI Elements
    notes: "Nodiadau",
    dash: "-"
  }
};

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
// COMPREHENSIVE TRANSLATION SYSTEM
// ============================================================
function switchLanguage(lang) {
  logger.functionEntry("switchLanguage", { lang });
  
  if (!translations[lang]) {
    logger.warn(`Language ${lang} not supported`);
    return;
  }
  
  const oldLang = currentLang;
  currentLang = lang;
  localStorage.setItem("lang", lang);
  
  logger.dataChange("language", oldLang, lang);
  
  // Update document language attribute
  document.documentElement.lang = lang;
  
  // Translate all elements with data-i18n attributes
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const translation = getTranslation(key, lang);
    if (translation) {
      if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password')) {
        el.placeholder = translation;
      } else if (el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', translation);
      } else if (el.hasAttribute('title')) {
        el.setAttribute('title', translation);
      } else {
        el.textContent = translation;
      }
    }
  });
  
  // Update page title
  const titleKey = document.querySelector('title')?.dataset.i18n;
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
  logger.debug("Updating language button display");
  updateLanguageButton();
  
  // Re-render all dynamic content
  logger.debug("Re-rendering all dynamic content");
  renderAll();
  
  // Re-translate any dynamically generated content
  logger.debug("Re-translating dynamically generated content");
  setTimeout(() => {
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    logger.debug(`Found ${elementsToTranslate.length} elements to re-translate`);
    
    elementsToTranslate.forEach(el => {
      const key = el.dataset.i18n;
      const translation = getTranslation(key, lang);
      if (translation) {
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password')) {
          el.placeholder = translation;
        } else if (el.hasAttribute('aria-label')) {
          el.setAttribute('aria-label', translation);
        } else if (el.hasAttribute('title')) {
          el.setAttribute('title', translation);
        } else {
          el.textContent = translation;
        }
      }
    });
    
    logger.functionExit("switchLanguage");
    logger.success(`Language switched to ${lang}`, { 
      elementsTranslated: elementsToTranslate.length 
    });
  }, 100);
}

function getTranslation(key, lang = currentLang) {
  if (!key) return null;
  
  // Handle nested keys (e.g., "cup.welsh.name")
  const keys = key.split('.');
  let translation = translations[lang];
  
  for (const k of keys) {
    if (translation && typeof translation === 'object' && k in translation) {
      translation = translation[k];
    } else {
      return null;
    }
  }
  
  return typeof translation === 'string' ? translation : null;
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
  Object.keys(data).forEach(key => {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, 'g'), data[key] || '');
  });
  
  container.innerHTML = content;
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
  logger.functionEntry("loadData");
  try {
    logger.info("Starting data loading process");
    
    // Show loading states
    showLoadingState(elements.leaderboard, "Loading leaderboard...");
    Object.values(elements.dropdowns).forEach(dropdown => {
      if (dropdown.display) {
        showLoadingState(dropdown.display, "Select teams to view data...");
      }
    });

    // Load the cups first so we can derive teams if needed
    logger.debug("Fetching cup data files");
    const [welsh, cardiff, friendlies] = await Promise.all([
      fetchJSON("welsh.json"),
      fetchJSON("cardiff.json"),
      fetchJSON("friendlies.json")
    ]);
    
    logger.info("Cup data loaded", { 
      welsh: welsh?.rounds?.length || 0, 
      cardiff: cardiff?.rounds?.length || 0, 
      friendlies: friendlies?.rounds?.length || 0 
    });

    // Load teams + updated, but both are optional
    logger.debug("Fetching teams and metadata");
    const [teamsRaw, updated] = await Promise.all([
      fetchJSON("teams.json").catch(() => null),
      fetchJSON("last_updated.json").catch(() => ({ lastUpdated: "Unknown" }))
    ]);

    // Update state
    logger.debug("Updating application state");
    state.cups = { Welsh: welsh || {}, Cardiff: cardiff || {}, Friendlies: friendlies || {} };
    state.teams = normalizeTeams(teamsRaw, state.cups);
    state.lastUpdated = updated?.lastUpdated || "Unknown";

    logger.info("Teams processed", {
      count: state.teams.length,
      sample: state.teams.slice(0, 5).map(t => t.name),
      lastUpdated: state.lastUpdated
    });

    // Compute current season stats from cup rounds (overrides stale numbers)
    logger.debug("Calculating team statistics");
    calculateStats();
    
    logger.debug("Rendering all components");
    renderAll();

    logger.success("Data loading completed", { 
      lastUpdated: state.lastUpdated,
      teamsCount: state.teams.length,
      cupsLoaded: Object.keys(state.cups).length
    });
    
  } catch (err) {
    logger.errorWithStack("Error loading data", err);
    showErrorMessage(
      translate("errorLoadingData"),
      () => {
        logger.info("User retrying data load");
        loadData();
      }
    );
  }
  
  logger.functionExit("loadData");
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
              <span style="font-size: 1.2rem;">⚠</span>
              <span>${message}</span>
            </div>
            ${retryCallback ? `
              <button onclick="(${retryCallback})()" class="cta" style="margin-top: 0.5rem;">
                ↻ ${translate("retry")}
              </button>
            ` : ''}
          </div>`;
      }
    });
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

  team.innerHTML = `<option value="">--${translate("chooseTeam")}--</option>`;
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
    `<option value="">--${translate("chooseTeam")}--</option>`;
  state.teams.forEach(t => {
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

  return `
    <h3>${translate(cupName.toLowerCase() + "Matches")}</h3>
    ${rounds
      .map(
        r => `
        <h4>${translate("round")} ${r.round_number || ""} - ${translate("deadline")}: ${r.deadlines?.english || translate("dash")}</h4>
        <table>
          <tr>
            <th>${translate("home")}</th>
            <th>${translate("hScore")}</th>
            <th>${translate("aScore")}</th>
            <th>${translate("away")}</th>
            <th>${translate("winner")}</th>
            <th>${translate("date")}</th>
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
                  <td data-numeric="true" class="${t.gd >= 0 ? 'positive' : 'negative'}">${t.gd >= 0 ? '+' : ''}${t.gd}</td>
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
  if (!rounds.length) return (container.innerHTML = `<p>${translate("noBracketData")}</p>`);

  container.innerHTML = rounds
    .map(
      r => `
      <div class="round">
        <h3>${translate("round")} ${r.round_number || ""} - ${translate("deadline")}: ${r.deadlines?.english || translate("dash")}</h3>
        <div class="games">
          ${r.games
            ?.map(
              g => `
            <div class="game" title="${g.notes || ""}">
              <span class="team ${g.winner === g.home_team ? "winner" : ""}">${g.home_team}</span>
              <span class="score">${g.home_score ?? translate("dash")}</span> -
              <span class="score">${g.away_score ?? translate("dash")}</span>
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
      `${translate("lastUpdated")} ${state.lastUpdated}`;
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
  themeToggle.textContent = "☾";
} else {
  themeToggle.textContent = "☀";
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☾" : "☀";
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
  logger.errorWithStack("Global JavaScript error", {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error?.message,
    stack: e.error?.stack
  });
  
  // Show user-friendly error message
  showErrorMessage(translate("unexpectedError"));
});

window.addEventListener("unhandledrejection", e => {
  logger.errorWithStack("Unhandled promise rejection", {
    reason: e.reason,
    promise: e.promise
  });
  
  // Show user-friendly error message
  showErrorMessage(translate("networkError"));
});

  // Fetch timing wrapper (transparent; returns the same response)
  const _fetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const started = performance.now();
    const url = args[0];
    logger.debug(`Fetching: ${url}`);
    
    try {
      const res = await _fetch(...args);
      const dur = Math.round(performance.now() - started);
      logger.apiCall("GET", url, res.status, `${dur}ms`);
      return res;
    } catch (err) {
      const dur = Math.round(performance.now() - started);
      logger.errorWithStack(`Fetch failed: ${url}`, err);
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
  logger.functionEntry("renderAll");
  
  if (!state.teams?.length) {
    logger.warn("No teams found — check teams.json");
    return;
  }
  
  logger.debug("Starting render all components", { teamsCount: state.teams.length });

  Object.keys(elements.dropdowns).forEach(cupName => {
    if (elements.dropdowns[cupName]) {
      logger.debug(`Populating dropdown for ${cupName}`);
      populateDropdowns(cupName);
    }
  });

  logger.debug("Rendering leaderboard");
  renderLeaderboard();
  
  logger.debug("Rendering brackets");
  renderBrackets();
  
  logger.debug("Rendering last updated info");
  renderLastUpdated();

  logger.functionExit("renderAll");
  logger.debug("All components rendered successfully");
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
  logger.info("Application starting", { 
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
  
  logger.time("app-initialization");
  
  // Setup performance optimizations
  logger.debug("Setting up performance optimizations");
  setupIntersectionObserver();
  setupScrollOptimizations();
  preloadCriticalResources();
  
  // Setup accessibility features
  logger.debug("Setting up accessibility features");
  setupKeyboardNavigation();
  
  // Set initial language button display
  logger.debug("Initializing language button");
  updateLanguageButton();
  
  // Preload critical resources
  logger.debug("Preloading critical resources");
  const criticalResources = ['style.css', 'script.js'];
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
    logger.debug(`Preloaded resource: ${resource}`);
  });
  
  try {
    logger.time("data-loading");
    await loadData();
    logger.timeEnd("data-loading");
    logger.success("Data loaded successfully");
  } catch (error) {
    logger.errorWithStack("Failed to load data", error);
  }
  
  setTimeout(() => {
    logger.time("render-all");
    renderAll();
    logger.timeEnd("render-all");
    
    logger.time("team-dashboard-init");
    initTeamDashboard(); // Initialize teamCard.html if present
    logger.timeEnd("team-dashboard-init");
    
    // Ensure language button is properly displayed after everything loads
    updateLanguageButton();
    logger.timeEnd("app-initialization");
    logger.success("Application fully initialized");
  }, 300);
});

elements.refresh?.addEventListener("click", async () => {
  logger.userAction("refresh-button-clicked");
  
  elements.refresh.disabled = true;
  const originalText = translate("refresh");
  elements.refresh.textContent = `${originalText}...`;
  
  logger.info("User triggered data refresh");
  logger.time("refresh-data");
  
  try {
    await loadData();
    logger.timeEnd("refresh-data");
    logger.success("Data refresh completed successfully");
  } catch (error) {
    logger.timeEnd("refresh-data");
    logger.errorWithStack("Data refresh failed", error);
  }
  
  elements.refresh.textContent = originalText;
  elements.refresh.disabled = false;
});