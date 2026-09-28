/* Headless smoke test for the league site + League Arcade.
   Run from the repo root:  node tools/test-arcade.js
   Needs Playwright (npm i -D playwright && npx playwright install chromium).
   The shared data server is mocked, so nothing real is read or written.
   Screenshots go to tools/out/. Exits non-zero on page errors. */
const path = require('path'), fs = require('fs');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Install Playwright first: npm i -D playwright && npx playwright install chromium'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const url = f => 'file://' + path.join(ROOT, 'site', f);

async function mockServer(page, db, puts) {
  await page.route('https://wednesday-night-tennis.higgsfield.app/**', async route => {
    const slug = new URL(route.request().url()).searchParams.get('league');
    if (route.request().method() === 'GET') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(db[slug] || { version: 0, updatedAt: null, data: null }) });
    const body = JSON.parse(route.request().postData()); const cur = db[slug] || { version: 0 };
    if (body.baseVersion !== cur.version) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'stale', ...cur }) });
    db[slug] = { version: cur.version + 1, updatedAt: new Date().toISOString(), data: body.data }; puts.push(slug);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: db[slug].version }) });
  });
}
// Bot: serves in the sweet zone and swings near the contact moment, with some timing noise.
function runBot(page, steps) {
  return page.evaluate(steps => {
    const A = window.__arcade; let i = 0;
    const srvNear = G => { const sc = G.score; if (!sc) return false; if (!sc.tb) return sc.server === 'near'; const f = Math.floor((sc.tbCount + 1) / 2); return (f % 2 === 0 ? sc.tbFirst : (sc.tbFirst === 'near' ? 'far' : 'near')) === 'near'; };
    for (; i < steps && A.G.on; i++) {
      const G = A.G;
      if (G.state === 'serve' && srvNear(G)) {
        if (!G.serveHold && G.stateT > 0.3) G.serveHold = { t0: G.time, aim: Math.random() * 2 - 1 };
        if (G.serveHold) { const m = A.serveMeterVal(G.serveHold), sz = A.sweetZone(); if (m >= sz[0] + 0.01 && m <= sz[1] - 0.01) A.releaseServe(); }
      }
      if (G.state === 'rally' && A.ball.lastHit === 'far' && A.near.contact && !A.near.pending) {
        if (A.__off == null) A.__off = -0.1 + Math.random() * 0.3;
        if (A.near.contact.at - G.time < A.__off) { const tg = G.mode === 'targets' && G.targets[0]; A.swingHuman({ kind: 'drive', aim: tg ? tg.x / 3.9 : (Math.random() - 0.5) * 2.1, depth01: tg ? (tg.y - 7.4) / 4.8 : 0.35 + Math.random() * 0.5, power01: Math.random() }); A.__off = null; }
      }
      A.update(1 / 60);
    }
    return { steps: i, on: A.G.on, score: A.G.score && { games: A.G.score.games, winner: A.G.score.winner }, targets: A.G.tScore };
  }, steps);
}

(async () => {
  const b = await chromium.launch(); const errs = [];
  const page = await b.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, hasTouch: true });
  page.on('pageerror', e => errs.push(e.message));
  const db = {}, puts = []; await mockServer(page, db, puts);
  await page.goto(url('arcade.html')); await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '1-who.png') });
  await page.click('[data-who="4"]'); await page.waitForTimeout(800);
  const ok = await page.$('[data-ok]'); if (ok) await ok.click();
  await page.screenshot({ path: path.join(OUT, '2-hub.png') });
  await page.click('#b-quick'); await page.click('[data-opp="7"]');
  const match = await runBot(page, 60 * 60 * 15); console.log('match', JSON.stringify(match));
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, '3-result.png') });
  await page.click('[data-go="hub"]'); await page.click('#b-targets');
  const tgt = await runBot(page, 60 * 90); console.log('targets', JSON.stringify(tgt));
  await page.waitForTimeout(2500);
  const saved = db['ccc-mens-wednesday-arcade'];
  console.log('arcade saves', puts.filter(s => s.endsWith('-arcade')).length, 'league writes', puts.filter(s => !s.endsWith('-arcade')).length);
  await page.goto(url('index.html#standings')); await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '4-site-standings.png'), fullPage: true });
  const problems = [];
  if (errs.length) problems.push('page errors: ' + errs.join(' | '));
  if (match.on) problems.push('match did not finish');
  if (!saved || !saved.data.arcade.profiles[4]) problems.push('arcade profile was not saved to the server');
  console.log(problems.length ? 'FAIL\n' + problems.join('\n') : 'PASS');
  await b.close(); process.exit(problems.length ? 1 : 0);
})();
