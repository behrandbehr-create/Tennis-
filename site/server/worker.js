/* Optional "league server" so every phone stays in sync automatically.
   This is a tiny Cloudflare Worker (free tier is plenty) with one KV namespace.
   Setup (about 10 minutes, once):
     1. Sign up at cloudflare.com, open Workers & Pages, create a Worker, paste this file.
     2. In the Worker settings add a KV namespace binding named LEAGUE_KV.
     3. (Optional) add an environment variable WRITE_TOKEN. If set, the site must send it
        as ?token=... on the URL you paste into the site (example: https://xyz.workers.dev/?token=abc123).
     4. Copy the Worker URL into the site: Manage > League info > League server URL.
   The site GETs the latest league data on load and PUTs it after every save. */
export default {
  async fetch(request, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const body = await env.LEAGUE_KV.get('league');
      return new Response(body || '{}', { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (request.method === 'PUT') {
      if (env.WRITE_TOKEN && url.searchParams.get('token') !== env.WRITE_TOKEN) return new Response('forbidden', { status: 403, headers: cors });
      let data; try { data = await request.json(); } catch (e) { return new Response('bad json', { status: 400, headers: cors }); }
      if (!data || !Array.isArray(data.players) || !Array.isArray(data.matches)) return new Response('not league data', { status: 400, headers: cors });
      const current = JSON.parse((await env.LEAGUE_KV.get('league')) || '{}');
      if (current.updatedAt && data.updatedAt && data.updatedAt < current.updatedAt) return new Response('stale', { status: 409, headers: cors });
      await env.LEAGUE_KV.put('league', JSON.stringify(data));
      return new Response('ok', { headers: cors });
    }
    return new Response('method not allowed', { status: 405, headers: cors });
  }
};
