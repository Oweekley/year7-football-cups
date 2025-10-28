// worker.js
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

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Only allow POST to /run
    if (url.pathname !== "/run") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(origin)
      });
    }

    if (request.method !== "POST") {
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
      return json({ success: false, error: "Invalid JSON body" }, { status: 400, origin });
    }

    const { password } = payload || {};
    if (!password || password !== env.CF_SECRET_PASSWORD) {
      return json({ success: false, error: "Unauthorized" }, { status: 401, origin });
    }

    // Trigger GitHub workflow
    const ghUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILE}/dispatches`;

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
      return json({ success: false, error: text.trim() || `GitHub error ${ghResp.status}` }, { status: 502, origin });
    }

    return json({ success: true, message: "Scraper started!" }, { status: 200, origin });
  }
};