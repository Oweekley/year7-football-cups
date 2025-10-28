export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { password } = await request.json().catch(() => ({}));
    if (!password || password !== env.CF_SECRET_PASSWORD) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Trigger GitHub Action workflow
    const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILE}/dispatches`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${env.GITHUB_PAT}`,
      },
      body: JSON.stringify({ ref: "main" }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ success: false, error: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Scraper started!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};