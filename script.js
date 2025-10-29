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
// SIMPLE LOGGING SYSTEM
// =======================
// Prevent duplicate initialization using sessionStorage (survives page reloads)
const INIT_KEY = 'football_app_initialized';
const isInitialized = sessionStorage.getItem(INIT_KEY) === 'true';

// Detect Dreamweaver Live Preview
const isDreamweaverPreview = window.location.protocol === 'file:' && 
  (window.navigator.userAgent.includes('Dreamweaver') || 
   document.referrer.includes('dreamweaver') ||
   window.parent !== window);

class SimpleLogger {
  constructor(context = 'APP') {
    this.context = context;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.logCount = 0;
    const urlLevel = new URLSearchParams(location.search).get('log');
    const storedLevel = (typeof localStorage !== 'undefined' && localStorage.getItem('logLevel')) || '';
    const level = (urlLevel || storedLevel || 'INFO').toUpperCase();
    this.logLevel = ['DEBUG','INFO','WARN','ERROR','SUCCESS'].includes(level) ? level : 'INFO';
    
    // Startup banner is emitted explicitly by the main app to avoid duplicates
  }

  setLevel(level) {
    const up = String(level || '').toUpperCase();
    if (['DEBUG','INFO','WARN','ERROR','SUCCESS'].includes(up)) {
      this.logLevel = up;
      try { localStorage.setItem('logLevel', up); } catch (_) {}
    }
  }

  generateSessionId() {
    return Math.random().toString(36).substr(2, 9);
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

    // Color coding for different log levels (works in both light and dark mode)
    const colors = {
      DEBUG: '#888888',
      INFO: '#4A9EFF',
      WARN: '#FFB800',
      ERROR: '#FF4444',
      SUCCESS: '#00AA44'
    };

    const color = colors[level] || '#888888';
    
    // Console output with styling (dark mode friendly) - simplified
    console.log(
      `%c[${level}] %c[${this.context}] %c${message}`,
      `color: ${color}; font-weight: bold;`,
      `color: #888888; font-style: italic;`,
      `color: #ffffff; background: #333333; padding: 2px 4px; border-radius: 3px;`
    );
    
    // Only show data for errors and warnings to reduce noise
    if (data && (level === 'ERROR' || level === 'WARN')) {
      console.log(data);
    }

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
    if (this.logLevel === 'DEBUG') return this.formatMessage('DEBUG', message, data);
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
const logger = new SimpleLogger('DASHBOARD');
logger.info('🚀 App Started', 'The football dashboard is starting up...');


// =======================
// DATA MONITORING & LOGGING
// =======================
class DataMonitor {
  constructor() {
    this.logger = new SimpleLogger('DATA');
    this.dataFiles = ['teams.json', 'welsh.json', 'cardiff.json', 'friendlies.json', 'last_updated.json'];
    this.loadTimes = {};
    this.fileSizes = {};
    this.loadCounts = {};
    this.errors = {};
    
    this.init();
  }

  init() {
    // this.logger.debug('Data Monitor initialized', { files: this.dataFiles, timestamp: new Date().toISOString() });

    this.monitorDataLoading();
    this.monitorDataChanges();
  }

  monitorDataLoading() {
    // Override fetch to monitor data file loading (errors only)
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      const startTime = Date.now();
      const fileName = this.extractFileName(url);
      
      try {
        const response = await originalFetch(url, options);
        const duration = Date.now() - startTime;
        
        if (this.dataFiles.includes(fileName)) {
          this.loadTimes[fileName] = duration;
          this.loadCounts[fileName] = (this.loadCounts[fileName] || 0) + 1;
          
          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              this.fileSizes[fileName] = parseInt(contentLength);
            }
            // Only log successful loads if there were previous errors
            if (this.errors[fileName] > 0) {
              this.logger.info('Data file loaded successfully', {
                fileName: fileName,
                duration: `${duration}ms`,
                status: response.status,
                size: contentLength ? `${contentLength} bytes` : 'unknown',
                loadCount: this.loadCounts[fileName],
                timestamp: new Date().toISOString()
              });
            }
          } else {
            this.errors[fileName] = (this.errors[fileName] || 0) + 1;
            this.logger.error('Data file load failed', {
              fileName: fileName,
              duration: `${duration}ms`,
              status: response.status,
              statusText: response.statusText,
              errorCount: this.errors[fileName],
              timestamp: new Date().toISOString()
            });
          }
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (this.dataFiles.includes(fileName)) {
          this.errors[fileName] = (this.errors[fileName] || 0) + 1;
          this.logger.error('Data file fetch error', {
            fileName: fileName,
            duration: `${duration}ms`,
            error: error.message,
            errorCount: this.errors[fileName],
            timestamp: new Date().toISOString()
          });
        }
        
        throw error;
      }
    };
  }

  monitorDataChanges() {
    // Monitor when data is processed and used
    const originalLoadData = window.loadData;
    if (originalLoadData) {
      window.loadData = async (...args) => {
        // Reduce noise: do not log start/completion of loadData here
        
        const startTime = Date.now();
        try {
          const result = await originalLoadData.apply(this, args);
          const duration = Date.now() - startTime;
          
          // Completion log suppressed (main flow already logs success)
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          this.logger.error('Data loading process failed', {
            duration: `${duration}ms`,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          throw error;
        }
      };
    }
  }

  extractFileName(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop();
    } catch (e) {
      return url.split('/').pop();
    }
  }

  getDataStats() {
    return {
      loadTimes: this.loadTimes,
      fileSizes: this.fileSizes,
      loadCounts: this.loadCounts,
      errors: this.errors,
      totalFiles: this.dataFiles.length,
      loadedFiles: Object.keys(this.loadTimes).length,
      failedFiles: Object.keys(this.errors).length
    };
  }

  logDataSummary() {
    const stats = this.getDataStats();
    this.logger.info('Data loading summary', {
      ...stats,
      averageLoadTime: Object.values(this.loadTimes).reduce((sum, time) => sum + time, 0) / Object.keys(this.loadTimes).length || 0,
      totalErrors: Object.values(this.errors).reduce((sum, count) => sum + count, 0),
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize data monitoring
const dataMonitor = new DataMonitor();

// =======================
// PWA & MANIFEST MONITORING
// =======================
class PWAMonitor {
  constructor() {
    this.logger = new SimpleLogger('PWA');
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
      if (!manifestLink.href.includes('127.0.0.1') && !manifestLink.href.includes('localhost')) {
        this.logger.info('Manifest link found', {
          href: manifestLink.href,
          timestamp: new Date().toISOString()
        });
      }

      // Skip manifest loading in Dreamweaver Live Preview or local development
      if (manifestLink.href.includes('127.0.0.1:56819') || 
          manifestLink.href.includes('dreamweaver') ||
          manifestLink.href.includes('localhost') ||
          manifestLink.href.includes('127.0.0.1') ||
          manifestLink.href.includes('file://')) {
        // Skip verbose logging in development
        // this.logger.info('Skipping manifest load in development environment', {
        //   href: manifestLink.href,
        //   timestamp: new Date().toISOString()
        // });
        return;
      }

      // Try to load manifest
      fetch(manifestLink.href)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.text();
        })
        .then(text => {
          try {
            const manifest = JSON.parse(text);
            this.manifest = manifest;
            this.logger.info('Manifest loaded successfully', {
              name: manifest.name,
              shortName: manifest.short_name,
              startUrl: manifest.start_url,
              display: manifest.display,
              themeColor: manifest.theme_color,
              backgroundColor: manifest.background_color,
              icons: manifest.icons?.length || 0,
              shortcuts: manifest.shortcuts?.length || 0,
              timestamp: new Date().toISOString()
            });
          } catch (parseError) {
            throw new Error(`Invalid JSON: ${parseError.message}`);
          }
        })
        .catch(error => {
          this.logger.warn('Failed to load manifest', {
            error: error.message,
            href: manifestLink.href,
            timestamp: new Date().toISOString()
          });
        });
    } else {
      this.logger.warn('No manifest link found', {
        timestamp: new Date().toISOString()
      });
    }
  }

  monitorServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Skip verbose SW logging in development
      if (!window.location.href.includes('127.0.0.1') && !window.location.href.includes('localhost')) {
        this.logger.info('Service Worker supported', {
          timestamp: new Date().toISOString()
        });
      }

      // Monitor service worker registration
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.logger.info('Service Worker controller changed', {
          timestamp: new Date().toISOString()
        });
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        this.logger.info('Service Worker message received', {
          data: event.data,
          timestamp: new Date().toISOString()
        });
      });

      // Check if already registered
      navigator.serviceWorker.getRegistrations().then(registrations => {
        // Reduce noise in development: only log in production
        if (!location.href.includes('127.0.0.1') && !location.href.includes('localhost')) {
          this.logger.info('Service Worker registrations found', {
            count: registrations.length
          });
        }
      });
    } else {
      this.logger.warn('Service Worker not supported', {
        timestamp: new Date().toISOString()
      });
    }
  }

  monitorInstallPrompt() {
    // Monitor beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      this.installPrompt = event;
      this.logger.info('Install prompt available', {
        timestamp: new Date().toISOString()
      });
    });

    // Monitor appinstalled event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.logger.info('App installed successfully', {
        timestamp: new Date().toISOString()
      });
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      this.logger.info('App running in standalone mode', {
        timestamp: new Date().toISOString()
      });
    }
  }

  monitorAppState() {
    // Monitor visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logger.info('App visibility changed', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.logger.info('App came online', {
        timestamp: new Date().toISOString()
      });
    });

    window.addEventListener('offline', () => {
      this.logger.info('App went offline', {
        timestamp: new Date().toISOString()
      });
    });

    // Monitor page lifecycle
    window.addEventListener('beforeunload', () => {
      this.logger.info('App is about to unload', {
        timestamp: new Date().toISOString()
      });
    });

    window.addEventListener('pagehide', () => {
      this.logger.info('App page hidden', {
        timestamp: new Date().toISOString()
      });
    });
  }

  getPWAStats() {
    return {
      hasManifest: !!this.manifest,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasInstallPrompt: !!this.installPrompt,
      isInstalled: this.isInstalled,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      isOnline: navigator.onLine,
      visibilityState: document.visibilityState
    };
  }

  logPWASummary() {
    const stats = this.getPWAStats();
    this.logger.info('PWA status summary', {
      ...stats,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize PWA monitoring
const pwaMonitor = new PWAMonitor();

// =======================
// PERFORMANCE MONITORING & MEMORY MANAGEMENT
// =======================
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      apiCallTimes: [],
      userInteractions: 0,
      errors: 0
    };
    this.startTime = performance.now();
    this.observers = new Map();
  }

  startTiming(label) {
    performance.mark(`${label}-start`);
  }

  endTiming(label) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    this.metrics.renderTimes.push({
      label,
      duration: measure.duration,
      timestamp: Date.now()
    });
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  }

  recordMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });
    }
  }

  recordUserInteraction() {
    this.metrics.userInteractions++;
  }

  recordError() {
    this.metrics.errors++;
  }

  getPerformanceReport() {
    const totalTime = performance.now() - this.startTime;
    return {
      totalTime,
      averageRenderTime: this.metrics.renderTimes.reduce((sum, t) => sum + t.duration, 0) / this.metrics.renderTimes.length,
      userInteractions: this.metrics.userInteractions,
      errors: this.metrics.errors,
      memoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1],
      renderCount: this.metrics.renderTimes.length
    };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Create performance monitor instance
const perfMonitor = new PerformanceMonitor();

// =======================
// MEMORY LEAK PREVENTION
// =======================
class MemoryManager {
  constructor() {
    this.eventListeners = new Map();
    this.intervals = new Set();
    this.timeouts = new Set();
    this.observers = new Set();
  }

  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    const key = `${element.constructor.name}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler, options });
  }

  addInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  addTimeout(callback, delay) {
    const id = setTimeout(callback, delay);
    this.timeouts.add(id);
    return id;
  }

  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  cleanup() {
    // Clear all intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();

    // Clear all timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listeners, key) => {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventListeners.clear();

    logger.info('Memory cleanup completed');
  }
}

// Create memory manager instance
const memoryManager = new MemoryManager();

// =======================
// ENHANCED ERROR HANDLING & RETRY MECHANISMS
// =======================
class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  async withRetry(operation, context = 'operation', maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Trying ${context} (try ${attempt} of ${maxRetries})`);
        const result = await operation();
        
        if (attempt > 1) {
          logger.success(`${context} worked on try ${attempt}`);
        }
        
        // Reset retry count on success
        this.retryAttempts.delete(context);
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`${context} didn't work on try ${attempt}`, { error: error.message });
        
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Waiting ${delay}ms before trying again`);
          await this.delay(delay);
        }
      }
    }
    
    logger.error(`${context} didn't work after ${maxRetries} tries`, { error: lastError.message });
    this.retryAttempts.set(context, maxRetries);
    throw lastError;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isRetryable(error) {
    // Network errors, timeouts, and 5xx server errors are retryable
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
    if (error.name === 'AbortError') return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true; // Rate limited
    return false;
  }

  handleError(error, context = 'Unknown') {
    perfMonitor.recordError();
    logger.errorWithStack(`Something went wrong with ${context}`, error);
    
    if (this.isRetryable(error)) {
      logger.info(`We can try ${context} again`);
    }
  }
}

// Create error handler instance
const errorHandler = new ErrorHandler();

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
    dash: "-",
    selectTeamAndData: "Please select a team and data type from the dropdowns above to view details",
    noDataFound: "No data found for",

    // Admin
    admin: "Admin",
    adminPageTitle: "Admin - Manage Notes and Friendlies",
    adminDescription: "Edit team notes or add friendly results.",
    unlockAdmin: "Unlock Admin",
    adminPassword: "Password",
    editNotes: "Edit Notes",
    saveNotes: "Save Notes",
    addFriendly: "Add Friendly Result",
    homeTeam: "Home Team",
    awayTeam: "Away Team",
    homeGoals: "Home Goals",
    awayGoals: "Away Goals",
    submit: "Submit",
    exportTeamsJson: "Export teams.json",
    exportFriendliesJson: "Export friendlies.json",
    saved: "Saved"
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
    dash: "-",
    selectTeamAndData: "Dewiswch dim a math o ddata o'r dropdowns uchod i weld manylion",
    noDataFound: "Dim data wedi'i ganfod ar gyfer",

    // Admin
    admin: "Gweinyddol",
    adminPageTitle: "Gweinyddol - Rheoli Nodiadau a Chyfeillgar",
    adminDescription: "Golygu nodiadau tim neu ychwanegu canlyniadau cyfeillgar.",
    unlockAdmin: "Datgloi Gweinyddol",
    adminPassword: "Cyfrinair",
    editNotes: "Golygu Nodiadau",
    saveNotes: "Arbed Nodiadau",
    addFriendly: "Ychwanegu Canlyniad Cyfeillgar",
    homeTeam: "Tim Cartref",
    awayTeam: "Tim Ffwrdd",
    homeGoals: "Goliau Cartref",
    awayGoals: "Goliau Ffwrdd",
    submit: "Cyflwyno",
    exportTeamsJson: "Allforio teams.json",
    exportFriendliesJson: "Allforio friendlies.json",
    saved: "Wedi Arbed"
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
  logger.debug("Updating language button");
  updateLanguageButton();
  
  // Re-render all dynamic content
  logger.debug("Refreshing page content");
  renderAll();
  
  // Re-translate any dynamically generated content
  logger.debug("Translating page text");
  setTimeout(() => {
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    logger.debug(`Found ${elementsToTranslate.length} text elements to translate`);
    
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
    logger.success(`Page language changed to ${lang}`, { 
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
  // Check cache first
  if (state.cache[url]) {
    logger.debug("Cache hit", { url });
    return state.cache[url];
  }
  
  // Use retry mechanism for network requests
  return await errorHandler.withRetry(async () => {
    const controller = new AbortController();
    const timeoutId = memoryManager.addTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      logger.debug("Fetching JSON", { url });
      perfMonitor.startTiming(`fetch-${url}`);
      
      const res = await fetch(url, { 
        cache: "no-store",
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': navigator.userAgent
        }
      });
      
      perfMonitor.endTiming(`fetch-${url}`);
      
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
        error.status = res.status;
        throw error;
      }
      
  const json = await res.json();
      
      // Validate JSON structure
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid JSON response');
      }
      
      // Cache the result
  state.cache[url] = json;
      logger.debug("JSON cached successfully", { url, size: JSON.stringify(json).length });
      
  return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }, `fetchJSON-${url}`, 3);
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
  perfMonitor.startTiming("loadData");
  
  try {
    logger.info("Loading football data");
    perfMonitor.recordMemoryUsage();
    
    // Show loading states (with safety checks)
    if (typeof elements !== 'undefined' && elements.leaderboard) {
      showLoadingState(elements.leaderboard, "Loading leaderboard...");
    }
    if (typeof elements !== 'undefined' && elements.dropdowns) {
      Object.values(elements.dropdowns).forEach(dropdown => {
        if (dropdown && dropdown.display) {
          showLoadingState(dropdown.display, translate("selectTeamsToView"));
        }
      });
    }

    // Load the cups first so we can derive teams if needed
    logger.debug("Loading tournament data");
    const [welsh, cardiff, friendlies] = await Promise.allSettled([
      fetchJSON("welsh.json"),
      fetchJSON("cardiff.json"),
      fetchJSON("friendlies.json")
    ]).then(results => results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ));
    
    // Defer summary until we also know file list
    const welshCount = welsh?.rounds?.length || 0;
    const cardiffCount = cardiff?.rounds?.length || 0;
    const friendliesCount = friendlies?.rounds?.length || 0;

    // Load teams + updated, but both are optional
    logger.debug("Loading team information");
    const [teamsRaw, updated] = await Promise.allSettled([
      fetchJSON("teams.json"),
      fetchJSON("last_updated.json")
    ]).then(results => [
      results[0].status === 'fulfilled' ? results[0].value : null,
      results[1].status === 'fulfilled' ? results[1].value : { lastUpdated: "Unknown" }
    ]);

    // Summarize all JSON fetches done during this run and emit one combined line
    try {
      const files = (typeof jsonLoads !== 'undefined') ? jsonLoads : [];
      const fileNames = Array.from(new Set(files.map(f => String(f.url).split('/').pop())));
      if (fileNames.length) {
        const key = 'lastLoadedFiles';
        const prev = sessionStorage.getItem(key);
        const current = JSON.stringify(fileNames.sort());
        if (prev !== current) {
          logger.info(`Data loaded (Welsh: ${welshCount}, Cardiff: ${cardiffCount}, Friendlies: ${friendliesCount}) – files: ${fileNames.join(', ')}`);
          sessionStorage.setItem(key, current);
        }
      }
    } catch (_) {}

    // Update state
    logger.debug("Processing team data");
    state.cups = { Welsh: welsh || {}, Cardiff: cardiff || {}, Friendlies: friendlies || {} };
    state.teams = normalizeTeams(teamsRaw, state.cups);
    state.lastUpdated = updated?.lastUpdated || "Unknown";

    logger.info("Team information processed", {
      count: state.teams.length,
      sample: state.teams.slice(0, 5).map(t => t.name),
      lastUpdated: state.lastUpdated
    });

    // Compute current season stats from cup rounds (overrides stale numbers)
    logger.debug("Calculating team stats");
    perfMonitor.startTiming("calculateStats");
    calculateStats();
    perfMonitor.endTiming("calculateStats");
    
    logger.debug("Displaying all content");
    // perfMonitor.startTiming("renderAll");
    renderAll();
    // perfMonitor.endTiming("renderAll");

    perfMonitor.endTiming("loadData");
    perfMonitor.recordMemoryUsage();
    
    logger.success("Football data loaded successfully", { 
      lastUpdated: state.lastUpdated,
      teamsCount: state.teams.length,
      cupsLoaded: Object.keys(state.cups).length,
      performance: perfMonitor.getPerformanceReport()
    });
    
  } catch (err) {
    perfMonitor.endTiming("loadData");
    perfMonitor.recordError();
    
    // Don't show error messages - just log them silently
    logger.warn("Data loading had issues, but continuing", { error: err.message });
  }
  
  logger.functionExit("loadData");
}

function showErrorMessage(message, retryCallback = null) {
  logger.warn("Showing error to user", { message, hasRetry: !!retryCallback });
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

function showNoDataMessage(message, container = null) {
  logger.debug("Showing no data message", { message, scoped: !!container });
  const render = (el) => {
    if (!el) return;
    el.innerHTML = `
      <div class="no-data-message fade-in">
        <span>${message}</span>
      </div>`;
    el.classList.add('loaded');
  };
  if (container) {
    render(container);
  } else {
    document.querySelectorAll('.dynamic-display').forEach(render);
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
  // Re-resolve elements to avoid stale references
  const teamElId = cupName === 'Welsh' ? 'welsh-team' : cupName === 'Cardiff' ? 'cardiff-team' : 'friendlies-team';
  const displayElId = cupName === 'Welsh' ? 'welsh-display' : cupName === 'Cardiff' ? 'cardiff-display' : 'friendlies-display';
  const team = document.getElementById(teamElId) || elements.dropdowns[cupName]?.team;
  const data = elements.dropdowns[cupName]?.data || null;
  const display = document.getElementById(displayElId) || elements.dropdowns[cupName]?.display;
  if (!team) return;

  // Ensure teams list available (fallback derive from cups)
  let teamsList = Array.isArray(state.teams) && state.teams.length ? state.teams : deriveTeamsFromCups(state.cups);

  // Build options
  const placeholder = document.createElement('option');
  placeholder.value = "";
  placeholder.textContent = `--${translate("chooseTeam") || 'Choose a Team'}--`;
  placeholder.selected = true;
  placeholder.disabled = false;
  team.innerHTML = "";
  team.appendChild(placeholder);
  teamsList.forEach(t => {
    if (!t?.name) return;
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = t.name;
    team.appendChild(opt);
  });

  if (data) data.style.display = "none";
  // Bind change with addEventListener to avoid accidental overrides
  team.onchange = null;
  team.addEventListener('change', () => updateCupDisplay(cupName));

  // Reset display area to prompt
  if (display) {
    showNoDataMessage(translate("selectTeamsToView"), display);
  }
}

function updateCupDisplay(cupName) {
  // Re-fetch to avoid stale nodes
  const team = document.getElementById(cupName === 'Welsh' ? 'welsh-team' : cupName === 'Cardiff' ? 'cardiff-team' : 'friendlies-team') || elements.dropdowns[cupName]?.team;
  const display = document.getElementById(cupName === 'Welsh' ? 'welsh-display' : cupName === 'Cardiff' ? 'cardiff-display' : 'friendlies-display') || elements.dropdowns[cupName]?.display;
  const teamName = team?.value || '';
  if (!teamName) {
    if (display) showNoDataMessage(translate("selectTeamsToView"), display);
    return;
  }
  const cupData = state.cups[cupName];
  if (display) {
    display.innerHTML = renderMatchHistory(teamName, cupName, cupData);
    display.classList.add('loaded');
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
      showNoDataMessage(translate("selectTeamAndData"));
      return;
    }

    const team = state.teams.find(t => t.name === teamName);
    if (!team) {
      showNoDataMessage(translate("noDataFound") + ` ${teamName}.`);
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
      body: JSON.stringify({ password })
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
    errorEl.textContent = `Warning: ${err.message || "Error contacting server"}`;
    errorEl.hidden = false;
  }
});

// Simple logging - no complex system needed

  // Global error surfaces
  window.addEventListener("error", e => {
  logger.errorWithStack("Something went wrong in the app", {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error?.message,
    stack: e.error?.stack
  });
  
  // Don't show error messages to users - just log them
  logger.warn("App error caught and logged", { error: e.error?.message });
});

  window.addEventListener("unhandledrejection", e => {
  logger.errorWithStack("App promise error", {
    reason: e.reason,
    promise: e.promise
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
      if (typeof url === 'string' && /\.json(\?|$)/.test(url)) {
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

  logger.debug("Starting to display all content", { teamsCount: state.teams.length });

  // Render dropdowns (with safety checks)
  if (typeof elements !== 'undefined' && elements.dropdowns) {
  Object.keys(elements.dropdowns).forEach(cupName => {
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
    sessionStorage.setItem(INIT_KEY, 'true');
  }
  
  // Special handling for Dreamweaver Live Preview
  if (isDreamweaverPreview) {
    logger.info("Running in Dreamweaver Live Preview - using enhanced duplicate prevention");
    // Add extra delay to prevent Dreamweaver's rapid reloads
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  logger.info("Football app starting", { 
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
    const adminLink = document.getElementById('admin-link');
    if (adminLink) {
      adminLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const pwd = prompt(translate('password'));
        if (!pwd) return;
        try {
          const res = await fetch(workerURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify({ password: pwd })
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.success) {
            sessionStorage.setItem('admin_unlocked', 'true');
            location.href = 'admin.html';
          } else {
            alert(data?.error || `Auth failed (${res.status})`);
          }
        } catch (err) {
          alert(err?.message || 'Network error');
        }
      });
    }
  } catch (_) {}

  // Apply initial translations to any existing elements with data-i18n
  try {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const t = getTranslation(key);
      if (t) {
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password')) {
          el.placeholder = t;
        } else if (el.hasAttribute('aria-label')) {
          el.setAttribute('aria-label', t);
        } else if (el.hasAttribute('title')) {
          el.setAttribute('title', t);
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
  if ('serviceWorker' in navigator) {
    try {
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length === 0) {
        const registration = await navigator.serviceWorker.register('./sw.js', {
          scope: './'
        });
        logger.info('App caching enabled successfully', { 
          scope: registration.scope,
          state: registration.active?.state || 'installing'
        });
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                logger.info('App update available - will take effect on next page load');
                console.log('App update available - will take effect on next page load');
                // Don't auto-reload, let the user continue using the app
                // The update will take effect on the next page load
              }
            });
          }
        });
      } else {
        logger.debug('Service worker already registered');
      }
    } catch (error) {
      logger.warn('App caching setup failed', { error: error.message });
    }
  } else {
    logger.info('App caching not supported in this browser');
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
      load: perf.loadEventEndMs
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
        if (teamDisplay.innerHTML && !teamDisplay.classList.contains('loaded')) {
          teamDisplay.classList.add('loaded');
          if (teamLoading) teamLoading.remove();
        }
      });
      observer.observe(teamDisplay, { childList: true, subtree: true });
    }

    // Brackets page: handle competition selection and loaded fade-in
    const competitionSelect = document.getElementById('competition-select');
    const welshBracket = document.getElementById('welsh-bracket-container');
    const cardiffBracket = document.getElementById('cardiff-bracket-container');
    if (competitionSelect && welshBracket && cardiffBracket) {
      const updateVisibility = () => {
        const value = competitionSelect.value;
        welshBracket.style.display = value === 'Welsh' ? 'block' : 'none';
        cardiffBracket.style.display = value === 'Cardiff' ? 'block' : 'none';
      };
      updateVisibility();
      competitionSelect.addEventListener('change', updateVisibility);

      const wLoad = document.getElementById('welsh-loading');
      const cLoad = document.getElementById('cardiff-loading');
      const brObserver = new MutationObserver(() => {
        if (welshBracket.innerHTML && !welshBracket.classList.contains('loaded')) {
          welshBracket.classList.add('loaded');
          if (wLoad) wLoad.remove();
        }
        if (cardiffBracket.innerHTML && !cardiffBracket.classList.contains('loaded')) {
          cardiffBracket.classList.add('loaded');
          if (cLoad) cLoad.remove();
        }
      });
      brObserver.observe(welshBracket, { childList: true, subtree: true });
      brObserver.observe(cardiffBracket, { childList: true, subtree: true });
    }

    // Admin page logic (moved from inline script in admin.html)
    const adminLocked = document.getElementById('admin-locked');
    const adminBody = document.getElementById('admin-body');
    if (adminLocked || adminBody) {
      const $ = sel => document.querySelector(sel);
      const notesTeam = $('#notes-team');
      const notesTextarea = $('#notes-text');
      const notesSaveBtn = $('#notes-save');
      const notesSaved = $('#notes-saved');
      const frDate = $('#fr-date');
      const frHome = $('#fr-home');
      const frAway = $('#fr-away');
      const frHomeGoals = $('#fr-home-goals');
      const frAwayGoals = $('#fr-away-goals');
      const frNotes = $('#fr-notes');
      const frSubmit = $('#fr-submit');
      const exportTeamsBtn = $('#export-teams');
      const exportFriendliesBtn = $('#export-friendlies');
      const unlockBtn = $('#admin-unlock');
      const passInput = $('#admin-pass');

      async function ensureDataLoaded() {
        try {
          if (!Array.isArray(state.teams) || state.teams.length === 0) {
            if (typeof window.loadData === 'function') {
              await window.loadData();
            }
          }
        } catch (e) {
          console.warn('[ADMIN] ensureDataLoaded failed', e);
        }
      }

      function initAdmin() {
        // Populate selects
        const initTeams = () => {
          if (!Array.isArray(state.teams) || state.teams.length === 0) {
            setTimeout(initTeams, 200);
            return;
          }
          const sorted = [...state.teams].sort((a,b) => a.name.localeCompare(b.name));
          if (notesTeam) notesTeam.innerHTML = `<option value="">--${translate('chooseTeam')}--</option>`;
          if (frHome) frHome.innerHTML = `<option value="">--${translate('chooseTeam')}--</option>`;
          if (frAway) frAway.innerHTML = `<option value="">--${translate('chooseTeam')}--</option>`;
          sorted.forEach(t => {
            if (notesTeam) { const opt = document.createElement('option'); opt.value = t.name; opt.textContent = t.name; notesTeam.appendChild(opt); }
            if (frHome) { const opt = document.createElement('option'); opt.value = t.name; opt.textContent = t.name; frHome.appendChild(opt); }
            if (frAway) { const opt = document.createElement('option'); opt.value = t.name; opt.textContent = t.name; frAway.appendChild(opt); }
          });
          if (notesTeam) notesTeam.removeAttribute('disabled');
          if (frHome) frHome.removeAttribute('disabled');
          if (frAway) frAway.removeAttribute('disabled');

          if (notesTeam && notesTextarea && notesSaved) {
            notesTeam.addEventListener('change', () => {
              const team = state.teams.find(t => t.name === notesTeam.value);
              notesTextarea.value = team?.notes || '';
              notesSaved.textContent = '';
            });
          }
        };
        initTeams();

        // Save notes
        if (notesSaveBtn && notesTeam && notesTextarea && notesSaved) {
          notesSaveBtn.addEventListener('click', () => {
            const name = notesTeam.value;
            if (!name) { notesTeam.focus(); return; }
            const team = state.teams.find(t => t.name === name);
            if (!team) return;
            const oldNotes = team.notes || '';
            team.notes = String(notesTextarea.value || '').trim();
            if (oldNotes !== team.notes) {
              logger?.dataChange?.('team-notes', oldNotes, team.notes);
            }
            notesSaved.textContent = translate('saved');
            setTimeout(() => (notesSaved.textContent = ''), 1500);
          });
        }

        // Friendlies validity + submit
        function updateFriendlyValidity() {
          if (!frHome || !frAway || !frSubmit) return;
          const valid = Boolean(frHome.value && frAway.value && frHome.value !== frAway.value);
          frSubmit.disabled = !valid;
          if (!valid) frSubmit.setAttribute('disabled','disabled'); else frSubmit.removeAttribute('disabled');
        }
        [frDate, frHome, frAway].forEach(el => el && el.addEventListener('input', updateFriendlyValidity));
        [frHome, frAway].forEach(el => el && el.addEventListener('change', updateFriendlyValidity));

        if (frSubmit) {
          frSubmit.addEventListener('click', async () => {
            if (!frDate || !frHome || !frAway) return;
            const date = frDate.value; const home = frHome.value; const away = frAway.value;
            const hs = frHomeGoals ? frHomeGoals.value : '';
            const as = frAwayGoals ? frAwayGoals.value : '';
            if (!date || !home || !away || home === away) return;
            const friendly = { date, home_team: home, away_team: away, home_score: hs !== '' ? Number(hs) : null, away_score: as !== '' ? Number(as) : null, notes: frNotes?.value || '' };
            const cup = state.cups.Friendlies || (state.cups.Friendlies = { rounds: [] });
            if (!Array.isArray(cup.rounds)) cup.rounds = [];
            let round = cup.rounds[0];
            if (!round) { round = { round_number: 1, deadlines: {}, games: [] }; cup.rounds.push(round); }
            round.games = Array.isArray(round.games) ? round.games : [];
            round.games.push(friendly);
            logger?.success?.('Friendly result added');
            if (frDate) frDate.value = '';
            if (frHome) frHome.selectedIndex = 0;
            if (frAway) frAway.selectedIndex = 0;
            if (frHomeGoals) frHomeGoals.value = '';
            if (frAwayGoals) frAwayGoals.value = '';
            if (frNotes) frNotes.value = '';
            updateFriendlyValidity();

            // Auto-commit to GitHub via Worker so data persists
            try {
              if (!commitURL) throw new Error('Commit URL not configured.');
              // Build friendlies payload
              const friendlies = state.cups.Friendlies || { rounds: [] };
              const friendliesPayload = {
                cup_name: 'Friendlies',
                season: state?.currentSeason || translate('currentSeason') || '',
                rounds: friendlies.rounds || [],
                team_statistics: {}
              };
              const lastUpdatedPayload = { lastUpdated: new Date().toISOString() };

              // Get cached password or prompt
              let pwd = sessionStorage.getItem('admin_password') || '';
              if (!pwd) {
                pwd = prompt(translate('password')) || '';
                if (pwd) sessionStorage.setItem('admin_password', pwd);
              }
              if (!pwd) return; // user cancelled

              const res = await fetch(commitURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                mode: 'cors',
                body: JSON.stringify({
                  password: pwd,
                  message: 'Auto-commit friendlies update from Admin UI',
                  files: [
                    { path: 'friendlies.json', content: JSON.stringify(friendliesPayload, null, 2) },
                    { path: 'last_updated.json', content: JSON.stringify(lastUpdatedPayload, null, 2) }
                  ]
                })
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.success) throw new Error(data?.error || 'Commit failed');
              logger?.success?.('Committed friendlies.json to GitHub');
              // Refresh local data so dashboard reflects latest
              try { await loadData(); renderAll(); } catch (_) {}
            } catch (err) {
              logger?.warn?.('Auto-commit failed', { error: err?.message });
            }
          });
        }

        // Export helpers
        function download(filename, dataObj) {
          const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename; a.click();
          URL.revokeObjectURL(url);
        }
        if (exportTeamsBtn) {
          exportTeamsBtn.addEventListener('click', () => {
            const payload = { teams: state.teams.map(t => ({ name: t.name, notes: t.notes || '', played: t.played || 0, wins: t.wins || 0, gf: t.gf || 0, ga: t.ga || 0, gd: t.gd || 0 })) };
            download('teams.json', payload);
          });
        }
        if (exportFriendliesBtn) {
          exportFriendliesBtn.addEventListener('click', () => {
            const friendlies = state.cups.Friendlies || { rounds: [] };
            const payload = { cup_name: 'Friendlies', season: state?.currentSeason || translate('currentSeason') || '', rounds: friendlies.rounds || [], team_statistics: {} };
            download('friendlies.json', payload);
          });
        }

        // Commit to GitHub via Worker /commit
        const commitURL = (typeof workerURL === 'string') ? workerURL.replace('/run', '/commit') : '';
        const commitBtn = document.getElementById('commit-github') || (() => { const b = document.createElement('button'); b.id = 'commit-github'; b.type = 'button'; b.textContent = 'Commit to GitHub'; b.className = 'btn btn-secondary'; const exportActions = document.querySelector('#export-title')?.parentElement?.querySelector('.admin-actions'); if (exportActions) exportActions.appendChild(b); return b; })();
        if (commitBtn) {
          commitBtn.addEventListener('click', async () => {
            try {
              const teamsPayload = { teams: state.teams.map(t => ({ name: t.name, notes: t.notes || '', played: t.played || 0, wins: t.wins || 0, gf: t.gf || 0, ga: t.ga || 0, gd: t.gd || 0 })) };
              const friendlies = state.cups.Friendlies || { rounds: [] };
              const friendliesPayload = { cup_name: 'Friendlies', season: state?.currentSeason || translate('currentSeason') || '', rounds: friendlies.rounds || [], team_statistics: {} };
              const password = prompt(translate('password'));
              if (!password) return;
              if (!commitURL) return alert('Commit URL not configured.');
              commitBtn.disabled = true;
              commitBtn.textContent = 'Committing…';
              const res = await fetch(commitURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, mode: 'cors', body: JSON.stringify({ password, message: 'Update data via admin', files: [ { path: 'teams.json', content: JSON.stringify(teamsPayload, null, 2) }, { path: 'friendlies.json', content: JSON.stringify(friendliesPayload, null, 2) } ] }) });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.success) throw new Error(data?.error || 'Commit failed');
              alert('Committed to GitHub successfully');
            } catch (err) {
              alert(`Commit failed: ${err.message || err}`);
            } finally {
              commitBtn.disabled = false;
              commitBtn.textContent = 'Commit to GitHub';
            }
          });
        }
      }

      // Auto-unlock via session flag
      if (sessionStorage.getItem('admin_unlocked') === 'true') {
        if (adminLocked) adminLocked.hidden = true;
        if (adminBody) adminBody.hidden = false;
        await ensureDataLoaded();
        initAdmin();
      }

      // Unlock button
      if (unlockBtn && adminLocked && adminBody) {
        unlockBtn.addEventListener('click', async () => {
          const val = (passInput?.value || '').trim();
          if (!val) { passInput?.focus(); return; }
          adminLocked.hidden = true;
          adminBody.hidden = false;
          await ensureDataLoaded();
          initAdmin();
        });
      }
    }
  } catch (_) {}
});

// =======================
// CLEANUP ON PAGE UNLOAD
// =======================
window.addEventListener("beforeunload", () => {
  logger.info("Football app shutting down");
  perfMonitor.cleanup();
  memoryManager.cleanup();
});

// =======================
// PERFORMANCE MONITORING
// =======================
window.addEventListener("load", () => {
  // Prevent duplicate initialization using sessionStorage
  if (sessionStorage.getItem(INIT_KEY) === 'true') {
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
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
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