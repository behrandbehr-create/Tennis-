/* Optional self-hosted league data server.

   You do not need this. The hub already points at a shared data server that is
   set up and running. This file is here for anyone who would rather host the
   data themselves on a free Cloudflare account.

   Setup, about ten minutes, once:
     1. Sign up at cloudflare.com, open Workers & Pages, create a Worker, paste
        this whole file in and deploy it.
     2. In the Worker's settings add a KV namespace binding named LEAGUE_KV.
     3. Optional: add an environment variable WRITE_TOKEN. If it is set, every
        save and delete must carry ?token=... on the address.
     4. In the hub, open js/hub-boot.js and change the one API line to your
        Worker address ending in /api/state, for example
        https://your-worker.workers.dev/api/state

   It answers the same three things the hub asks for:
     GET    /api/state?league=slug          -> { version, updatedAt, data }
     PUT    /api/state?league=slug          -> body { baseVersion, data }
                                               200 { version, updatedAt }
                                               409 { error, version, updatedAt, data }
     DELETE /api/state?league=slug&confirm=slug -> { ok: true, deleted: slug }
     GET    /api/leagues                    -> { leagues: [ ...summaries ] }
   The directory deliberately returns no phone numbers and no scores. */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

/* League names are used as storage keys, so keep them boring on purpose. */
function slugOf(url) {
  const raw = (url.searchParams.get('league') || url.searchParams.get('l') || '').toLowerCase().trim();
  return /^[a-z0-9][a-z0-9-]{0,48}$/.test(raw) ? raw : '';
}

const keyOf = slug => 'league:' + slug;

async function read(env, slug) {
  const stored = await env.LEAGUE_KV.get(keyOf(slug), 'json');
  if (!stored) return { version: 0, updatedAt: null, data: null };
  return { version: stored.version || 0, updatedAt: stored.updatedAt || null, data: stored.data || null };
}

function authed(env, url) {
  return !env.WRITE_TOKEN || url.searchParams.get('token') === env.WRITE_TOKEN;
}

/* What the hub's league list shows. No contact details, no results. */
function summary(slug, stored) {
  const d = (stored && stored.data) || {};
  return {
    slug,
    name: d.name || slug,
    season: d.season || '',
    venue: d.venue || '',
    dayOfWeek: typeof d.dayOfWeek === 'number' ? d.dayOfWeek : null,
    flex: !!d.flex,
    playersPerMatch: d.playersPerMatch || null,
    players: Array.isArray(d.players) ? d.players.length : 0,
    matches: Array.isArray(d.matches) ? d.matches.length : 0,
    updatedAt: (stored && stored.updatedAt) || null
  };
}

async function directory(env) {
  const leagues = [];
  let cursor;
  do {
    const page = await env.LEAGUE_KV.list({ prefix: 'league:', cursor });
    for (const k of page.keys) {
      const slug = k.name.slice('league:'.length);
      const stored = await env.LEAGUE_KV.get(k.name, 'json');
      leagues.push(summary(slug, stored));
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  leagues.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return json({ leagues });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);

    if (url.pathname.endsWith('/leagues')) {
      if (request.method !== 'GET') return json({ error: 'Use GET for the league list' }, 405);
      return directory(env);
    }

    const slug = slugOf(url);
    if (!slug) return json({ error: 'Add ?league=<name> to the address' }, 400);

    if (request.method === 'GET') return json(await read(env, slug));

    if (request.method === 'PUT') {
      if (!authed(env, url)) return json({ error: 'Not allowed to save here' }, 403);
      let sent;
      try { sent = await request.json(); } catch (e) { return json({ error: 'Could not read that save' }, 400); }
      const data = sent && sent.data;
      if (!data || !Array.isArray(data.players) || !Array.isArray(data.matches)) {
        return json({ error: 'That does not look like league data' }, 400);
      }
      const current = await read(env, slug);
      const base = Number(sent.baseVersion || 0);
      /* Somebody else saved since this phone last looked. Hand back the newest
         copy so the site can show it instead of quietly overwriting them. */
      if (current.version !== base) {
        return json({ error: 'stale', version: current.version, updatedAt: current.updatedAt, data: current.data }, 409);
      }
      const version = current.version + 1;
      const updatedAt = new Date().toISOString();
      await env.LEAGUE_KV.put(keyOf(slug), JSON.stringify({ version, updatedAt, data }));
      return json({ version, updatedAt });
    }

    if (request.method === 'DELETE') {
      if (!authed(env, url)) return json({ error: 'Not allowed to delete here' }, 403);
      if (url.searchParams.get('confirm') !== slug) {
        return json({ error: 'Add ?confirm=<league name> to delete a league' }, 400);
      }
      await env.LEAGUE_KV.delete(keyOf(slug));
      return json({ ok: true, deleted: slug });
    }

    return json({ error: 'That method is not supported' }, 405);
  }
};
