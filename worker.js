// worker.js
+ // =======================
+ // [LOGGING] Structured console logger (Worker, no files)
+ // =======================
+ const workerOriginal = {
+   log: console.log.bind(console),
+   info: console.info.bind(console),
+   warn: console.warn.bind(console),
+   error: console.error.bind(console),
+   debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
+ };
+ const W_LEVELS = { debug: 10, info: 20, warn: 30, warning: 30, error: 40, critical: 50 };
+ const wLevelName = (typeof LOG_LEVEL !== 'undefined' ? LOG_LEVEL : (globalThis?.LOG_LEVEL)) || 'info';
+ const wThreshold = W_LEVELS[String(wLevelName).toLowerCase()] ?? W_LEVELS.info;
+ function wNow(){ return new Date().toISOString(); }
+ function wShould(level){ return (W_LEVELS[level] ?? 999) >= wThreshold; }
+ function wEmit(level, msg, ctx, err){
+   if (!wShould(level)) return;
+   const entry = {
+     ts: wNow(), level: level.toUpperCase(), module: 'worker',
+     requestId: (crypto && crypto.randomUUID ? crypto.randomUUID() : undefined),
+     msg: String(msg)
+   };
+   if (ctx && typeof ctx === 'object') entry.data = ctx;
+   if (err) entry.err = { message: String(err.message || err), stack: String(err.stack || '') };
+   const line = `[${entry.level}] worker ${entry.msg}`;
+   (workerOriginal[level] || workerOriginal.log)(line, entry);
+ }

const PROD_ORIGINS = new Set([
  "https://oweekley.github.io" // GitHub Pages origin (no trailing slash)
]);

function isLocalOrigin(origin) {
  try {
    const u = new URL(origin);
    return (u.protocol === "http:" || u.protocol === "https:") &&
           (u.hostname === "localhost" || u.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

function corsHeaders(origin) {
  // Allow GitHub Pages OR any localhost/127.0.0.1:* origin (Dreamweaver, local servers)
  const allow = PROD_ORIGINS.has(origin) || isLocalOrigin(origin)
    ? origin
    : "https://oweekley.github.io"; // safe fallback
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function json(body, { status = 200, origin = "*" } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
+    wEmit('info', 'request:start', { path: url.pathname, origin, method: request.method });

    // CORS preflight
    if (request.method === "OPTIONS") {
      wEmit('debug', 'request:preflight', { origin });
+      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only allow POST to /run
    if (url.pathname !== "/run") {
		wEmit('warn', 'request:wrong-path', { path: url.pathname });
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(origin)
      });
    }

    if (request.method !== "POST") {
		wEmit('warn', 'request:wrong-method', { method: request.method });
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(origin)
      });
    }

    // Parse JSON body
    let payload = {};
    try {
      payload = await request.json();
    } catch (_) {
		wEmit('warn', 'request:invalid-json');
      return json({ success: false, error: "Invalid JSON body" }, { status: 400, origin });
    }

    const { password } = payload || {};
    if (!password || password !== env.CF_SECRET_PASSWORD) {
		wEmit('warn', 'auth:unauthorized', { hasPassword: Boolean(password) });
      return json({ success: false, error: "Unauthorized" }, { status: 401, origin });
    }

    // Trigger GitHub workflow
    const ghUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILE}/dispatches`;
	  wEmit('info', 'github:dispatch', { ghUrl: ghUrl.replace(/token=.*$/, 'token=***') });

    const ghResp = await fetch(ghUrl, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${env.GITHUB_PAT}`,
        "User-Agent": "year7-fixtures-dispatch",  // required by GitHub
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!ghResp.ok) {
      const text = await ghResp.text();
		wEmit('error', 'github:dispatch-failed', { status: ghResp.status, text: text && text.slice(0, 200) });
      return json({ success: false, error: text.trim() || `GitHub error ${ghResp.status}` }, { status: 502, origin });
    }
	  
	  wEmit('info', 'github:dispatch-ok');
    return json({ success: true, message: "Scraper started!" }, { status: 200, origin });
  }
};