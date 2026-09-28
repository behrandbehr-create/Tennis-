// REFERENCE COPY ONLY. The live shared data server is a separate Higgsfield-hosted
// app (wednesday-night-tennis.higgsfield.app, repo: app/src/routes/api/state.ts).
// Editing this file changes nothing. It is here so you know the exact protocol.
//
// Shared league state API used by the static league websites (hosted on Netlify).
// Each league has its own slug: /api/state?league=<slug>   (default slug: "default")
// GET  -> { version, updatedAt, data }   (data is null until the first save)
// PUT  <- { baseVersion, data }  -> { version, updatedAt }  or 409 { error:'stale', version, updatedAt, data }
// A save is accepted only when baseVersion matches the stored version (optimistic concurrency).
import { createFileRoute } from '@tanstack/react-router';
import { bindings } from '@/lib/bindings.server';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });
const MAX_BYTES = 600_000;
type Row = { version: number; updated_at: string | null; data: string };

function slugOf(request: Request) {
  const raw = (new URL(request.url).searchParams.get('league') || 'default').toLowerCase().trim();
  return /^[a-z0-9][a-z0-9-]{0,48}$/.test(raw) ? raw : null;
}
async function table() {
  const d = bindings().DB;
  if (!d) throw new Error('Storage unavailable');
  await d.prepare('CREATE TABLE IF NOT EXISTS league_states (slug TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0, updated_at TEXT, data TEXT NOT NULL)').run();
  return d;
}
async function current(d: Awaited<ReturnType<typeof table>>, slug: string) {
  const row = await d.prepare('SELECT version, updated_at, data FROM league_states WHERE slug = ?').bind(slug).first<Row>();
  return row ? { version: row.version, updatedAt: row.updated_at, data: JSON.parse(row.data) as unknown } : { version: 0, updatedAt: null, data: null };
}
function looksLikeLeague(x: unknown): x is { players: unknown[]; matches: unknown[] } {
  return !!x && typeof x === 'object' && Array.isArray((x as { players?: unknown }).players) && Array.isArray((x as { matches?: unknown }).matches);
}

async function getState(request: Request) {
  const slug = slugOf(request); if (!slug) return json({ error: 'Bad league name' }, 400);
  try { const d = await table(); return json(await current(d, slug)); }
  catch (e) { console.error(e); return json({ error: 'Storage unavailable' }, 500); }
}
async function putState(request: Request) {
  const slug = slugOf(request); if (!slug) return json({ error: 'Bad league name' }, 400);
  try {
    const text = await request.text();
    if (text.length > MAX_BYTES) return json({ error: 'Too large' }, 413);
    let body: { baseVersion?: unknown; data?: unknown };
    try { body = JSON.parse(text); } catch { return json({ error: 'Bad JSON' }, 400); }
    if (!looksLikeLeague(body.data)) return json({ error: 'Not league data' }, 400);
    const baseVersion = Number(body.baseVersion ?? -1);
    const d = await table();
    const cur = await current(d, slug);
    if (baseVersion !== cur.version) return json({ error: 'stale', ...cur }, 409);
    const next = cur.version + 1; const now = new Date().toISOString();
    const data = { ...body.data, updatedAt: now };
    const res = await d.prepare('INSERT INTO league_states (slug, version, updated_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET version = excluded.version, updated_at = excluded.updated_at, data = excluded.data WHERE league_states.version = ?').bind(slug, next, now, JSON.stringify(data), cur.version).run();
    if (res.meta && res.meta.changes === 0) { const latest = await current(d, slug); return json({ error: 'stale', ...latest }, 409); }
    return json({ version: next, updatedAt: now });
  } catch (e) { console.error(e); return json({ error: 'Could not save' }, 500); }
}

export const Route = createFileRoute('/api/state')({
  server: {
    handlers: {
      GET: ({ request }) => getState(request),
      PUT: ({ request }) => putState(request),
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
    },
  },
});
