/* =====================================================================
   League Arcade: a retro tennis game that lives on the league site.
   - Opponents are the real league players (names, numbers, racquets),
     and their skill comes from their real records.
   - Progress saves on the phone and syncs to the league's shared data
     server in its own "<league>-arcade" slot, so it follows a player
     to any phone and feeds a league-wide arcade ladder.
   No build step, no libraries.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  function todayISO(off) { const d = new Date(); d.setDate(d.getDate() + (off || 0)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const ART = window.ARCADE_ART || { racquet: i => 'assets/racquet-' + (((i % 8) + 8) % 8) + '.webp' };

  /* =====================================================================
     1. LEAGUE DATA (real players, real results)
     ===================================================================== */
  const LG = { data: null, players: [], byId: {}, real: {}, slug: 'league' };
  function loadLeague() {
    let d = JSON.parse(JSON.stringify(window.LEAGUE || { players: [], matches: [] }));
    try { const c = JSON.parse(store.get('league-data-v2') || 'null'); if (c && c.data && Array.isArray(c.data.players)) d = Object.assign(d, c.data, { syncUrl: d.syncUrl }); } catch (e) { /* ignore */ }
    LG.data = d; indexLeague();
  }
  function indexLeague() {
    const d = LG.data; d.players = d.players || []; d.matches = d.matches || [];
    LG.players = d.players.filter(p => p.active !== false);
    LG.byId = {}; d.players.forEach(p => { LG.byId[p.id] = p; });
    try { LG.slug = (new URL(d.syncUrl).searchParams.get('league') || 'league'); } catch (e) { LG.slug = (d.name || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'league'; }
    LG.real = realStats();
  }
  async function refreshLeague() {
    if (!LG.data.syncUrl) return;
    try { const r = await fetch(LG.data.syncUrl, { cache: 'no-store' }); const b = await r.json(); if (b && b.data && Array.isArray(b.data.players)) { LG.data = Object.assign({}, LG.data, b.data, { syncUrl: LG.data.syncUrl }); indexLeague(); } } catch (e) { /* offline: keep cached copy */ }
  }
  const hasResult = m => m.status === 'played' && (m.sets || []).length > 0;
  function matchWinner(m) { let a = 0, b = 0; for (const s of m.sets || []) { if (s.a > s.b) a++; else if (s.b > s.a) b++; } return a === b ? 0 : (a > b ? 1 : 2); }
  function realStats() {
    const rows = {};
    LG.data.players.forEach(p => { rows[p.id] = { id: p.id, played: 0, w: 0, l: 0, gw: 0, gl: 0, balls: 0 }; });
    for (const m of LG.data.matches) {
      if (!hasResult(m)) continue; const res = matchWinner(m); if (!res) continue;
      if (rows[m.balls]) rows[m.balls].balls++;
      m.teamA.concat(m.teamB).forEach(id => {
        const r = rows[id]; if (!r) return; const side = m.teamA.includes(id) ? 1 : 2; r.played++;
        if (side === res) r.w++; else r.l++;
        for (const s of m.sets) if (!s.tb) { r.gw += side === 1 ? s.a : s.b; r.gl += side === 1 ? s.b : s.a; }
      });
    }
    const list = Object.values(rows).filter(r => LG.byId[r.id] && LG.byId[r.id].active !== false);
    list.sort((a, b) => b.w - a.w || (b.played ? b.w / b.played : 0) - (a.played ? a.w / a.played : 0) || (b.gw - b.gl) - (a.gw - a.gl) || String(LG.byId[a.id].name).localeCompare(LG.byId[b.id].name));
    list.forEach((r, i) => { r.rank = i + 1; });
    return rows;
  }
  function myRealMatches(id) {
    const t = todayISO();
    return LG.data.matches.filter(m => m.teamA.concat(m.teamB).includes(id)).map(m => {
      const side = m.teamA.includes(id) ? 1 : 2; const res = hasResult(m) ? matchWinner(m) : 0;
      return { m, won: res && res === side, lost: res && res !== side, pending: !hasResult(m) && m.status !== 'canceled' && m.date < t, balls: m.balls === id && hasResult(m) };
    });
  }
  const pname = id => (LG.byId[id] ? LG.byId[id].name : 'Player');
  const pfirst = id => pname(id).split(' ')[0];
  const plast = id => { const n = pname(id).split(' '); return n.length > 1 ? n[n.length - 1] : n[0]; };
  function realLine(id) { const r = LG.real[id]; if (!r || !r.played) return 'No real matches yet'; return 'Real: ' + r.w + '-' + r.l + ' · #' + r.rank + ' in league'; }

  /* =====================================================================
     2. PROFILE + SAVING
     ===================================================================== */
  const SHIRTS = [
    { c: '#ffffff', n: 'Classic White' }, { c: '#e8413c', n: 'Red' }, { c: '#2f7cff', n: 'Royal' }, { c: '#344f2c', n: 'Club Green' },
    { c: '#ffd23f', n: 'Optic', cost: 300 }, { c: '#ff5c8a', n: 'Hot Pink', cost: 300 }, { c: '#1a1a1a', n: 'Blackout', cost: 400 }, { c: '#45e0ff', n: 'Ice', cost: 400 },
    { c: '#ffb627', n: 'Champion Gold', req: 'tour', rq: 'Win the League Tour' }, { c: 'rainbow', n: 'Prism', req: 'pro', rq: 'Win the Pro Tour' }
  ];
  const PERK = ['pow', 'spd', 'ctl', 'srv'];
  const STAT_NAMES = { pow: 'POWER', spd: 'SPEED', ctl: 'CONTROL', srv: 'SERVE' };
  const ACH = [
    ['first_win', 'First Win', 'Win an arcade match', 100], ['ace', 'Ace!', 'Serve an ace', 50], ['aces10', 'Cannon', 'Serve 10 aces in total', 200],
    ['love', 'Love Hold', 'Hold serve without losing a point', 100], ['bagel', 'Bagel', 'Win a Fast4 set 4-0', 300], ['tb', 'Ice Veins', 'Win a tiebreak', 150],
    ['comeback', 'Comeback', 'Win after trailing by 2 games', 250], ['drop', 'Soft Hands', 'Win a point with a drop shot', 100], ['lob', 'Over the Top', 'Win a point with a lob', 100],
    ['curve', 'Banana Shot', 'Win a point with a curved shot', 100], ['rally20', 'Marathon', 'Play a 20-shot rally', 200], ['rival', 'Grudge Match', 'Beat your rival', 200],
    ['tour', 'Tour Champion', 'Beat everyone on the League Tour', 1000], ['pro', 'Pro Champion', 'Win the Pro Tour', 2500], ['streak3', 'Regular', 'Daily challenge 3 days in a row', 300],
    ['streak7', 'Every Day', 'Daily challenge 7 days in a row', 800], ['targets2k', 'Sharpshooter', 'Score 2,000 in Target Practice', 300], ['real_win', 'Real Deal', 'Claim a real league win', 300],
    ['ball_boy', 'Ball Boy', 'Bring the balls to a real match', 100], ['lvl10', 'Veteran', 'Reach level 10', 500]
  ];
  let ME = null;      // profile
  const SAVE = { url: '', ver: 0, remote: {}, online: null, timer: 0, busy: false, again: false };
  function keyFor(id) { return 'arcade:' + LG.slug + ':' + id; }
  function newProfile(id) {
    const p = LG.byId[id]; const av = p ? (p.avatar || 0) : 0;
    return { id, name: p ? p.name : 'Guest', xp: 0, coins: 250, stats: { pow: 1, spd: 1, ctl: 1, srv: 1 }, racquet: av, owned: [av], shirt: (id || 0) % 4, shirts: [0, 1, 2, 3], tour: { tier: 1, stage: 0, champs: 0 }, rival: 0, w: 0, l: 0, targets: 0, aces: 0, ach: {}, daily: { date: '', streak: 0, last: '' }, claimed: [], updated: 0 };
  }
  function fixProfile(p) { const b = newProfile(p.id); return Object.assign(b, p, { stats: Object.assign(b.stats, p.stats || {}), tour: Object.assign(b.tour, p.tour || {}), daily: Object.assign(b.daily, p.daily || {}), ach: p.ach || {}, claimed: p.claimed || [], owned: p.owned || b.owned, shirts: p.shirts || b.shirts }); }
  function loadMe(id) { let p = null; try { p = JSON.parse(store.get(keyFor(id)) || 'null'); } catch (e) { p = null; } ME = fixProfile(p || newProfile(id)); ME.name = pname(id); store.set('arcade:' + LG.slug + ':me', String(id)); }
  function saveLocal() { if (ME) store.set(keyFor(ME.id), JSON.stringify(ME)); }
  function commit() { if (!ME) return; ME.updated = Date.now(); saveLocal(); clearTimeout(SAVE.timer); SAVE.timer = setTimeout(push, 1200); }
  function arcadeUrl() {
    const u = LG.data.syncUrl; if (!u) return '';
    try { const x = new URL(u); const s = (x.searchParams.get('league') || 'default') + '-arcade'; x.searchParams.set('league', s.slice(0, 49)); return x.toString(); } catch (e) { return ''; }
  }
  function adoptRemote(b) { SAVE.ver = b.version || 0; SAVE.remote = (b.data && b.data.arcade && b.data.arcade.profiles) || {}; }
  function pull() { return Promise.race([pullNow(), new Promise(res => setTimeout(res, 3500))]); }
  async function pullNow() {
    if (!SAVE.url) return;
    try {
      const r = await fetch(SAVE.url, { cache: 'no-store' }); if (!r.ok) throw new Error('status ' + r.status);
      adoptRemote(await r.json()); SAVE.online = true;
      if (ME) { const rp = SAVE.remote[ME.id]; if (rp && (rp.updated || 0) > (ME.updated || 0)) { ME = fixProfile(rp); ME.name = pname(ME.id); saveLocal(); } else if (!rp || (rp.updated || 0) < (ME.updated || 0)) push(); }
    } catch (e) { SAVE.online = false; }
  }
  async function push() {
    if (!SAVE.url || !ME) return;
    if (SAVE.busy) { SAVE.again = true; return; }
    SAVE.busy = true;
    try {
      for (let i = 0; i < 4; i++) {
        const profiles = Object.assign({}, SAVE.remote, { [ME.id]: ME });
        const r = await fetch(SAVE.url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseVersion: SAVE.ver, data: { players: [], matches: [], arcade: { profiles } } }) });
        if (r.status === 409) { adoptRemote(await r.json()); const rp = SAVE.remote[ME.id]; if (rp && (rp.updated || 0) > (ME.updated || 0)) { ME = fixProfile(rp); saveLocal(); break; } continue; }
        if (!r.ok) throw new Error('status ' + r.status);
        const b = await r.json(); SAVE.ver = b.version; SAVE.remote = profiles; SAVE.online = true; break;
      }
    } catch (e) { SAVE.online = false; }
    SAVE.busy = false; if (SAVE.again) { SAVE.again = false; push(); }
  }
  function profileOf(id) { if (ME && ME.id === id) return ME; const r = SAVE.remote[id]; return r ? fixProfile(r) : null; }

  /* ---------- progression ---------- */
  function levelOf(xp) { let l = 1, need = 250, acc = 0; while (xp >= acc + need && l < 50) { acc += need; l++; need = 250 + 100 * (l - 1); } return { l, into: xp - acc, need }; }
  function statVal(k) { const perk = PERK[ME.racquet % 4] === k ? 1 : 0; return Math.min(11, ME.stats[k] + perk); }
  function give(xp, coins) { const before = levelOf(ME.xp).l; ME.xp += xp; ME.coins += coins; const after = levelOf(ME.xp).l; if (after > before) { ME.coins += 100 * (after - before); if (after >= 10) unlock('lvl10'); } return after > before ? after : 0; }
  function unlock(k) { if (!ME || ME.ach[k]) return false; const a = ACH.find(x => x[0] === k); if (!a) return false; ME.ach[k] = Date.now(); ME.coins += a[3]; toast('TROPHY: ' + a[1], a[2] + '  +' + a[3] + ' coins'); sfx.trophy(); return true; }

  /* ---------- tour: the real league, weakest to strongest ---------- */
  function tourList() {
    const others = LG.players.filter(p => !ME || p.id !== ME.id);
    others.sort((a, b) => ((LG.real[b.id] || {}).rank || 99) - ((LG.real[a.id] || {}).rank || 99) || String(a.name).localeCompare(b.name));
    return others;
  }
  function skillFor(id, tier, stageIdx, n) {
    const r = LG.real[id] || {}; const pct = r.played ? r.w / r.played : 0.5; const gd = r.played ? clamp((r.gw - r.gl) / (r.played * 6), -1, 1) : 0;
    const ladder = n > 1 ? stageIdx / (n - 1) : 0.5;
    return clamp((tier === 2 ? 0.42 : 0.08) + 0.4 * ladder + 0.12 * pct + 0.06 * gd, 0.05, 0.98);
  }
  const SURFACES = {
    hard: { n: 'HARD COURT', court: '#2f63b8', court2: '#2a5aa8', out: '#2e6b4a', out2: '#2a6344', rest: 0.72, fr: 0.86 },
    clay: { n: 'CLAY', court: '#c8663a', court2: '#bd5f35', out: '#b75b33', out2: '#ad552f', rest: 0.8, fr: 0.78 },
    grass: { n: 'GRASS', court: '#4f9a3c', court2: '#468c35', out: '#3f8331', out2: '#3a792d', rest: 0.6, fr: 0.93 }
  };
  const SURF_ORDER = ['hard', 'clay', 'grass'];

  /* ---------- daily challenge (same for everyone in the league each day) ---------- */
  const DAILY = [
    { id: 'win', t: 'Beat {o} in a Fast4 match', mode: 'fast4', ok: r => r.won },
    { id: 'aces', t: 'Serve 3 aces against {o}', mode: 'fast4', ok: r => r.aces >= 3 },
    { id: 'tb', t: 'Win a first-to-7 tiebreak against {o}', mode: 'tb', ok: r => r.won },
    { id: 'love', t: 'Hold serve without losing a point vs {o}', mode: 'fast4', ok: r => r.loveHolds >= 1 },
    { id: 'rally', t: 'Win a point after a 10-shot rally vs {o}', mode: 'fast4', ok: r => r.longRallyWon >= 10 },
    { id: 'targets', t: 'Score 1,500 in Target Practice', mode: 'targets', ok: r => r.score >= 1500 }
  ];
  function dailyToday() {
    const day = todayISO(); const h = hash(LG.slug + day); const def = DAILY[h % DAILY.length];
    const opts = LG.players.filter(p => !ME || p.id !== ME.id); const opp = opts.length ? opts[(h >>> 8) % opts.length].id : 0;
    return { day, def, opp, surface: SURF_ORDER[(h >>> 4) % 3], text: def.t.replace('{o}', opp ? pname(opp) : 'the ball machine') };
  }

  /* =====================================================================
     3. RENDERING SETUP (low-res pixel canvas)
     ===================================================================== */
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const stage = $('#stage');
  let LW = 180, LH = 320, W = 0, H = 0, ppm = 13, ky = 8, baseY = 280, CX = 90;
  const CT = { hw: 4.115, dw: 5.485, hl: 11.885, svc: 6.4, net: 0.95 };
  let courtLayer = null, curSurface = 'hard';
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    LW = 180; LH = Math.max(260, Math.round(LW * H / Math.max(1, W)));
    cv.width = LW; cv.height = LH; ctx.imageSmoothingEnabled = false;
    ppm = LW / 13.2; CX = LW / 2;
    const top = 62, bot = 40; ky = Math.min(ppm * 0.64, (LH - top - bot) / (2 * CT.hl + 8));
    baseY = LH - bot - 4 * ky;
    buildCourt(curSurface);
  }
  const scaleAt = y => 1 - 0.17 * (y + CT.hl) / (2 * CT.hl);
  function P(x, y, z) { const s = scaleAt(y); return { x: CX + x * ppm * s, y: baseY - (y + CT.hl) * ky - (z || 0) * ppm * 0.6 * s, s }; }
  function worldYAt(sy) { return (baseY - sy) / ky - CT.hl; }
  function px(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  function buildCourt(surf) {
    curSurface = surf; const S = SURFACES[surf];
    const c = document.createElement('canvas'); c.width = LW; c.height = LH; const g = c.getContext('2d');
    const q = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), h); };
    q('#070a1f', 0, 0, LW, LH);
    const farBack = Math.round(P(0, CT.hl + 4).y);
    // stands and crowd
    let seed = 11; const sr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    q('#141a44', 0, 0, LW, farBack);
    for (let y = 4; y < farBack - 3; y += 4) for (let x = 1; x < LW; x += 3) { if (sr() < 0.85) { const hue = ['#f2c7a5', '#c68a61', '#8d5a3b', '#e9b48f'][Math.floor(sr() * 4)]; q(hue, x, y, 2, 1); q(['#e8413c', '#2f7cff', '#ffd23f', '#fff', '#5cff8a', '#b476ff'][Math.floor(sr() * 6)], x, y + 1, 2, 2); } }
    q('#0b1030', 0, farBack - 3, LW, 3); q('#ffd23f', 0, farBack - 3, LW, 1);
    // surround and court, row by row for crisp perspective
    for (let sy = farBack; sy < LH; sy++) {
      const wy = worldYAt(sy), s = scaleAt(wy);
      const band = Math.floor((wy + 30) / 2.2) % 2 === 0;
      q(band ? S.out : S.out2, 0, sy, LW, 1);
      if (wy >= -CT.hl && wy <= CT.hl) { const hw = CT.dw * ppm * s; q(surf === 'grass' ? (band ? S.court : S.court2) : S.court, CX - hw, sy, hw * 2, 1); }
    }
    // lines
    const white = '#f4f6ff';
    const hline = (y, x0, x1) => { const a = P(x0, y), b = P(x1, y); q(white, a.x, a.y, b.x - a.x + 1, 1); };
    const vline = (x, y0, y1) => { const t = Math.round(P(0, y1).y), b = Math.round(P(0, y0).y); for (let sy = t; sy <= b; sy++) { const wy = worldYAt(sy); q(white, CX + x * ppm * scaleAt(wy), sy, 1, 1); } };
    hline(-CT.hl, -CT.dw, CT.dw); hline(CT.hl, -CT.dw, CT.dw); hline(-CT.svc, -CT.hw, CT.hw); hline(CT.svc, -CT.hw, CT.hw);
    [-CT.dw, CT.dw, -CT.hw, CT.hw].forEach(x => vline(x, -CT.hl, CT.hl));
    vline(0, -CT.svc, CT.svc); vline(0, -CT.hl, -CT.hl + 0.35); vline(0, CT.hl - 0.35, CT.hl);
    // club crest text painted behind the far baseline
    g.fillStyle = 'rgba(255,255,255,.28)'; g.font = '6px monospace'; g.textAlign = 'center'; g.fillText((LG.data && LG.data.venue ? LG.data.venue : 'LEAGUE').toUpperCase().slice(0, 30), CX, P(0, CT.hl + 1.6).y);
    courtLayer = c;
  }

  /* =====================================================================
     4. GAME STATE + PHYSICS
     ===================================================================== */
  const G = {
    on: false, paused: false, mode: 'match', fmt: 'fast4', time: 0, state: 'idle', stateT: 0,
    freeze: 0, shake: 0, flash: 0, parts: [], popups: [],
    opp: 0, sk: 0.4, surf: 'hard', ctxInfo: null,
    score: null, rally: 0, shots: [], stats: null,
    target: null, targets: [], tScore: 0, tCombo: 0, tTime: 60
  };
  const ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ax: 0, gf: 1, live: false, rules: false, lastHit: '', bounces: 0, serve: false, netted: false, type: '', trail: [], visible: false, heat: 0 };
  const mk = side => ({ side, x: 0, y: 0, tx: 0, ty: 0, speed: 6, reach: 1.3, swing: 0, hand: 1, anim: 0, moving: false, contact: null, pending: null, react: 0, isAI: side === 'far', toss: 0 });
  const near = mk('near'), far = mk('far');
  const other = s => (s === 'near' ? 'far' : 'near');
  const who = s => (s === 'near' ? near : far);
  const dirOf = s => (s === 'near' ? 1 : -1);    // direction the side hits toward (+y is away from the camera)

  function stepBall(b, dt, sim) {
    const S = SURFACES[G.surf];
    b.vz -= 9.8 * (b.bounces === 0 ? b.gf : 1) * dt;
    if (b.bounces === 0) b.vx += b.ax * dt;
    const py = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (!b.netted && Math.sign(py) !== Math.sign(b.y) && py !== 0 && b.z < CT.net && Math.abs(b.x) < CT.dw + 0.9) {
      b.netted = true; b.y = Math.sign(py) * 0.06; b.vy *= -0.12; b.vx *= 0.3; b.vz = Math.min(b.vz, 0) * 0.3;
      if (!sim) sfx.net();
    }
    if (b.z <= 0 && b.vz < 0) {
      b.z = 0; b.vz = -b.vz * S.rest; b.vx *= S.fr; b.vy *= S.fr; b.bounces++;
      if (b.type === 'topspin') { b.vy *= 1.08; } else if (b.type === 'slice' || b.type === 'drop') { b.vz *= 0.72; }
      if (!sim) onBounce(b);
    }
  }
  // Where will the receiving side meet this ball? Pure simulation, so AI and assist agree with the physics.
  function predict(side) {
    const s = Object.assign({}, ball); const dir = side === 'near' ? -1 : 1; let t = 0;
    for (let i = 0; i < 540; i++) {
      stepBall(s, 1 / 120, true); t += 1 / 120;
      if (s.netted) return null;
      if (s.bounces === 1 && i >= 0 && s.firstChecked !== true) {
        s.firstChecked = true;
        if (Math.sign(s.y) !== dir) return null;
        if (ball.serve) { if (!inBox(s.x, s.y, ball.serveBox)) return null; }
        else if (Math.abs(s.x) > CT.hw + 0.04 || Math.abs(s.y) > CT.hl + 0.04) return null;
      }
      if (s.bounces >= 1 && Math.sign(s.y) === dir) {
        if ((s.vz < 0 && s.z < 1.25) || Math.abs(s.y) > CT.hl + 2.4) return { x: s.x, y: s.y, z: s.z, t };
      }
      if (s.bounces >= 2) return { x: s.x, y: s.y, z: s.z, t };
    }
    return null;
  }
  function inBox(x, y, box) { return box && x >= box.x0 - 0.04 && x <= box.x1 + 0.04 && y >= box.y0 - 0.04 && y <= box.y1 + 0.04; }

  // Launch the ball from (x0,y0,z0) so it lands on (tx,ty) after T seconds, clearing the net.
  function launch(x0, y0, z0, tx, ty, T, type, curveAx) {
    const gf = type === 'topspin' ? 1.3 : (type === 'slice' || type === 'drop') ? 0.8 : type === 'lob' ? 1.05 : 1;
    const g = 9.8 * gf; let vx, vy, vz;
    for (let i = 0; i < 14; i++) {
      vx = (tx - x0 - 0.5 * curveAx * T * T) / T; vy = (ty - y0) / T; vz = (0.5 * g * T * T - z0) / T;
      const tn = -y0 / vy; const zn = z0 + vz * tn - 0.5 * g * tn * tn;
      if (tn <= 0 || tn >= T || zn > CT.net + 0.14) break;
      T *= 1.08;
    }
    Object.assign(ball, { x: x0, y: y0, z: z0, vx, vy, vz, ax: curveAx, gf, bounces: 0, netted: false, type, live: true, visible: true, firstChecked: false });
  }

  /* ---------- scoring (Fast4: first to 4 games, no-ad, tiebreak at 3-3) ---------- */
  function newScore(fmt, firstServer) { return { fmt, pts: [0, 0], games: [0, 0], tb: fmt === 'tb', server: firstServer, tbFirst: firstServer, tbCount: 0, done: false, winner: -1, trail: [0, 0], faults: 0 }; }
  const IDX = { near: 0, far: 1 };
  const SIDE = ['near', 'far'];
  function serverNow(sc) { if (!sc.tb) return sc.server; const k = sc.tbCount; const flips = Math.floor((k + 1) / 2); return flips % 2 === 0 ? sc.tbFirst : other(sc.tbFirst); }
  function pointLabel(sc, i) { if (sc.tb) return String(sc.pts[i]); return ['0', '15', '30', '40'][Math.min(3, sc.pts[i])]; }
  function awardPoint(winSide) {
    const sc = G.score; const w = IDX[winSide], l = 1 - w; const srv = serverNow(sc);
    const st = G.stats; st.gamePts[w]++;
    if (sc.tb) {
      sc.pts[w]++; sc.tbCount++;
      const target = sc.fmt === 'tb' ? 7 : 5; const winBy = sc.fmt === 'tb' ? 2 : 1;
      if (sc.pts[w] >= target && sc.pts[w] - sc.pts[l] >= winBy) { if (sc.fmt !== 'tb') sc.games[w]++; finishMatch(winSide, true); return 'match'; }
      return 'point';
    }
    sc.pts[w]++;
    if (sc.pts[w] >= 4) {
      sc.games[w]++;
      if (IDX[srv] === w && winSide === 'near' && st.gamePts[1] === 0) { st.loveHolds++; unlock('love'); }
      sc.pts = [0, 0]; st.gamePts = [0, 0]; sc.server = other(sc.server);
      sc.trail[0] = Math.max(sc.trail[0], sc.games[1] - sc.games[0]);
      if (sc.games[w] >= 4) { finishMatch(winSide, false); return 'match'; }
      if (sc.games[0] === 3 && sc.games[1] === 3) { sc.tb = true; sc.tbFirst = sc.server; sc.tbCount = 0; }
      return IDX[srv] === w ? 'hold' : 'break';
    }
    return 'point';
  }
  function situation() {
    const sc = G.score; if (sc.done) return '';
    const srv = serverNow(sc), rcv = other(srv);
    const wouldWinMatch = s => { const i = IDX[s]; return sc.tb ? (sc.pts[i] + 1 >= (sc.fmt === 'tb' ? 7 : 5) && sc.pts[i] + 1 - sc.pts[1 - i] >= (sc.fmt === 'tb' ? 2 : 1)) : (sc.pts[i] === 3 && sc.games[i] === 3); };
    if (wouldWinMatch('near') && wouldWinMatch('far')) return 'MATCH POINT BOTH WAYS';
    if (wouldWinMatch('near') || wouldWinMatch('far')) return 'MATCH POINT';
    if (sc.tb) return '';
    if (sc.pts[0] === 3 && sc.pts[1] === 3) return 'DECIDING POINT';
    if (sc.pts[IDX[rcv]] === 3) return 'BREAK POINT';
    return '';
  }

  /* ---------- starting points ---------- */
  function serveBoxFor(srv) {
    const sc = G.score; const n = sc.tb ? sc.tbCount : (sc.pts[0] + sc.pts[1]);
    const deuce = n % 2 === 0; const recvDir = srv === 'near' ? 1 : -1;
    // deuce court is the receiver's right; from the camera, near server's deuce target is the far box on the left
    const leftBox = (srv === 'near') === deuce;
    const x0 = leftBox ? -CT.hw : 0, x1 = leftBox ? 0 : CT.hw;
    const y0 = recvDir > 0 ? 0 : -CT.svc, y1 = recvDir > 0 ? CT.svc : 0;
    return { x0, x1, y0, y1, deuce, leftBox };
  }
  function setupPoint() {
    const srv = serverNow(G.score), box = serveBoxFor(srv);
    const s = who(srv), r = who(other(srv));
    const sgn = srv === 'near' ? -1 : 1;
    // server stands diagonal from the target box
    s.x = s.tx = (box.leftBox ? 1 : -1) * 0.9; s.y = s.ty = sgn * (CT.hl + 0.4);
    r.x = r.tx = (box.x0 + box.x1) / 2 * 1.25; r.y = r.ty = -sgn * (CT.hl + 0.6);
    near.contact = far.contact = near.pending = far.pending = null; near.swing = far.swing = 0; near.toss = far.toss = 0;
    Object.assign(ball, { live: false, rules: false, visible: true, bounces: 0, netted: false, trail: [], serve: true, serveBox: box, heat: 0 });
    ball.x = s.x + (srv === 'near' ? 0.35 : -0.35); ball.y = s.y; ball.z = 1.0;
    G.rally = 0; G.shots = []; G.serveHold = null; G.state = 'serve'; G.stateT = 0;
    const sit = situation(); if (sit) callout(sit, '', '#ffd23f');
    if (srv === 'near' && !G.servedOnce) hint('HOLD to toss, RELEASE in the <b>green</b> zone. Drag sideways to aim.');
    hud();
  }

  /* ---------- starting / ending a match ---------- */
  function startMatch(opt) {
    G.mode = opt.mode || 'match'; G.fmt = opt.fmt || 'fast4'; G.opp = opt.opp || 0; G.ctxInfo = opt;
    G.surf = opt.surface || 'hard'; buildCourt(G.surf);
    G.sk = opt.skill != null ? opt.skill : 0.4;
    G.stats = { aces: 0, winners: 0, perfects: 0, maxRally: 0, longRallyWon: 0, loveHolds: 0, gamePts: [0, 0], dropWin: 0, lobWin: 0, curveWin: 0 };
    near.speed = 5.0 + 0.36 * statVal('spd'); near.reach = 1.25 + 0.05 * statVal('spd');
    far.speed = 3.9 + 2.9 * G.sk; far.reach = 1.0 + 0.4 * G.sk;
    G.on = true; G.paused = false; G.time = 0; G.parts = [];
    ui(''); $('#hud').hidden = false;
    if (G.mode === 'targets') { startTargets(); return; }
    G.score = newScore(G.fmt, Math.random() < 0.5 ? 'near' : 'far');
    G.servedOnce = false; G.hitOnce = false;
    hint(G.score.server === 'near' ? '' : 'SWIPE UP to hit when the ring closes on the ball.');
    setupPoint();
  }
  function finishMatch(winSide, viaTb) { G.score.done = true; G.score.winner = winSide; G.score.viaTb = viaTb; G.state = 'over'; G.stateT = 0; }

  /* =====================================================================
     5. SHOTS: human input and AI
     ===================================================================== */
  function playerShotParams(sw) {
    // sw: {kind: 'tap'|'drive'|'drop'|'lob', aim: -1.4..1.4, depth01, power01, curveM}
    let tx = sw.aim * 3.9, depth, T, type;
    const pow = 1 + 0.04 * statVal('pow');
    if (sw.kind === 'drop') { depth = rand(2.2, 3.6); type = 'drop'; T = null; }
    else if (sw.kind === 'lob') { depth = rand(9.3, 11.2); type = 'lob'; T = rand(2.1, 2.5); }
    else if (sw.kind === 'tap') { tx = rand(-1.2, 1.2); depth = 8.2; type = 'flat'; }
    else { depth = lerp(7.4, 12.2, sw.depth01); type = sw.power01 > 0.55 ? 'topspin' : 'slice'; }
    const speed = sw.kind === 'drop' ? 8.5 : sw.kind === 'tap' ? 14 : lerp(13.5, 26, sw.power01) * pow;
    return { tx, depth, T, type, speed, curve: sw.curveM || 0 };
  }
  function executeHit(side, prm, grade) {
    const pl = who(side), dir = dirOf(side);
    const ctl = side === 'near' ? statVal('ctl') : 0;
    const errBase = side === 'near' ? { PERFECT: 0, GREAT: 0.3, GOOD: 0.8, EARLY: 1.1, LATE: 1.2 }[grade] * (1 - 0.06 * ctl) : prm.err;
    let tx = prm.tx + rand(-errBase, errBase), ty = dir * (prm.depth + rand(-errBase, errBase) * 0.8);
    let speed = prm.speed * (grade === 'PERFECT' ? 1.1 : 1);
    const netErr = side === 'near' ? ({ GOOD: 0.05, EARLY: 0.08, LATE: 0.1 }[grade] || 0) : prm.netErr || 0;
    if (Math.random() < netErr) ty = -dir * 0.8;
    const z0 = clamp(ball.z, 0.35, 2.6);
    const dist = Math.hypot(tx - ball.x, ty - ball.y);
    let T = prm.T || dist / speed;
    const curveAx = prm.curve ? clamp(-prm.curve * 8 / (T * T), -9, 9) : 0;
    launch(ball.x, ball.y, z0, tx, ty, T, prm.type, curveAx);
    ball.lastHit = side; ball.serve = false; ball.rules = true; ball.heat = grade === 'PERFECT' ? 1 : 0;
    ball.shotKind = prm.kind || prm.type; ball.curved = Math.abs(prm.curve || 0) > 0.8;
    G.rally++; G.stats.maxRally = Math.max(G.stats.maxRally, G.rally); if (G.rally === 20) unlock('rally20');
    pl.swing = 1; pl.pending = null; pl.contact = null;
    if (side === 'near' && G.mode !== 'targets' && !G.hitOnce) { G.hitOnce = true; hint(''); }
    const recv = who(other(side)); recv.contact = null; recv.pending = null;
    // recover toward the middle of the baseline
    pl.tx = clamp(pl.x * 0.3, -1.5, 1.5); pl.ty = -dir * (CT.hl + 0.7);
    // AI reads the new ball after its reaction time
    recv.react = recv.isAI ? lerp(0.34, 0.14, G.sk) + (ball.curved ? 0.12 : 0) : 0;
    planContact(recv);
    // juice
    const p = P(ball.x, ball.y, ball.z);
    const col = grade === 'PERFECT' ? '#ffffff' : side === 'near' ? '#ffd23f' : '#45e0ff';
    burst(p.x, p.y, grade === 'PERFECT' ? 14 : 6, col);
    if (grade === 'PERFECT') { G.freeze = reduced ? 0 : 0.07; kick(2); G.stats.perfects++; buzz(18); }
    else buzz(8);
    sfx.hit(grade);
    if (side === 'near' && grade !== 'GOOD') popup(grade === 'EARLY' ? 'EARLY' : grade === 'LATE' ? 'LATE' : grade, p.x, p.y - 10, col);
    if (side === 'near' && ball.curved) popup('CURVE', p.x, p.y - 18, '#ff5c8a');
    hud();
  }
  function planContact(pl) {
    const c = predict(pl.side);
    if (!c) { pl.contact = null; return; }
    const dir = pl.side === 'near' ? 1 : -1;       // near player's right is +x, far player's right is -x
    const fh = c.x - dir * 0.75, bh = c.x + dir * 0.75;
    const useFh = Math.abs(fh - pl.x) <= Math.abs(bh - pl.x);
    pl.hand = useFh ? dir : -dir;
    pl.contact = { x: c.x, y: c.y, z: c.z, at: G.time + c.t, standX: useFh ? fh : bh, standY: c.y - dir * 0.25 };
    pl.contact.stretch = Math.hypot(pl.x - pl.contact.standX, pl.y - pl.contact.standY) / (pl.speed * Math.max(0.15, c.t - (pl.react || 0)));
  }
  function aiDecide(ai) {
    const sk = G.sk, opp = who(other(ai.side));
    const stretch = clamp((ai.contact.stretch || 0) - 0.4, 0, 1);
    const pressure = clamp(ball.heat * 0.5 + stretch, 0, 1.2);
    // forced and unforced errors: stretched, rushed by a perfect shot, or tired in a long rally
    const pErr = 0.035 + (1 - sk) * 0.07 + stretch * 0.6 + ball.heat * 0.1 + Math.min(0.14, G.rally * 0.005);
    if (Math.random() < pErr) {
      const net = Math.random() < 0.45, wide = Math.random() < 0.5;
      return { kind: 'drive', tx: net ? rand(-2, 2) : (wide ? Math.sign(rand(-1, 1)) * rand(4.35, 5.3) : rand(-3, 3)), depth: net ? 5 : (wide ? rand(8, 10) : rand(12.2, 13.4)), type: 'flat', T: null, speed: lerp(13, 22, sk), err: 0.1, netErr: net ? 1 : 0, curve: 0 };
    }
    let kind = 'drive';
    if (Math.abs(opp.y) > CT.hl + 1.5 && Math.random() < 0.12 + 0.2 * sk) kind = 'drop';
    else if (pressure > 0.8 && Math.random() < 0.25) kind = 'lob';
    const open = -Math.sign(opp.x || rand(-1, 1));
    const tx = kind === 'drop' ? rand(-2, 2) : open * rand(0.6, 1.1 + 2.5 * sk) * (Math.random() < 0.15 ? -1 : 1);
    const depth = kind === 'drop' ? rand(2.4, 3.8) : kind === 'lob' ? rand(9, 11) : stretch > 0.25 ? rand(5.8, 8) : rand(7.2, 9.6 + 1.8 * sk);
    const pace = clamp(0.3 + 0.55 * sk + rand(-0.1, 0.1) - pressure * 0.35, 0.15, 1);
    return {
      kind, tx, depth, type: kind === 'drop' ? 'drop' : kind === 'lob' ? 'lob' : (pace > 0.55 ? 'topspin' : 'flat'),
      T: kind === 'lob' ? rand(2.1, 2.5) : null, speed: kind === 'drop' ? 8.5 : lerp(12.5, 25, pace),
      err: (1 - sk) * 0.9 + pressure * 0.5, netErr: 0,
      curve: Math.random() < 0.12 * sk ? rand(-1.6, 1.6) : 0
    };
  }

  /* ---------- serving ---------- */
  function doServe(side, power, aim, quality) {
    const box = ball.serveBox; const s = who(side);
    const xin = box.leftBox ? lerp(box.x0 + 0.35, box.x1 - 0.35, (aim + 1) / 2) : lerp(box.x0 + 0.35, box.x1 - 0.35, (aim + 1) / 2);
    const dir = dirOf(side);
    let err = quality === 'PERFECT' ? 0.18 : quality === 'OVER' ? 0.4 : 0.32;
    if (side === 'near') err *= (1 - 0.05 * statVal('srv'));
    let tx = xin + rand(-err, err) * 1.4;
    let ty = dir * (CT.svc - rand(0.5, 1.4) + (quality === 'OVER' ? rand(0.3, 1.4) : rand(-err, err)));
    const spd = lerp(15, 30, clamp(power, 0, 1.05)) * (side === 'near' ? 1 + 0.03 * statVal('srv') : 1);
    const z0 = 2.75; const dist = Math.hypot(tx - ball.x, ty - s.y);
    launch(ball.x, s.y, z0, tx, ty, dist / spd, 'flat', 0);
    ball.lastHit = side; ball.serve = true; ball.rules = true; ball.serveBox = box; ball.shotKind = 'serve'; ball.curved = false; ball.heat = quality === 'PERFECT' ? 1 : 0;
    G.rally = 1; s.swing = 1; s.toss = 0;
    const r = who(other(side)); r.react = r.isAI ? lerp(0.3, 0.12, G.sk) : 0; planContact(r);
    sfx.hit(quality === 'PERFECT' ? 'PERFECT' : 'GOOD'); kick(quality === 'PERFECT' ? 2 : 1);
    G.state = 'rally'; G.stateT = 0; $('#serveMeter').hidden = true;
    if (side === 'near') { G.servedOnce = true; hint(G.hitOnce ? '' : 'SWIPE UP to hit when the ring closes on the ball.'); }
  }

  /* ---------- rules on each bounce ---------- */
  function onBounce(b) {
    const p = P(b.x, b.y, 0);
    sfx.bounce(); dust(p.x, p.y);
    if (!b.rules || G.state !== 'rally') return;
    const hitter = b.lastHit, recv = other(hitter), hdir = dirOf(hitter);
    if (b.bounces === 1) {
      if (Math.sign(b.y) !== hdir) return endPoint(recv, b.netted ? 'NET' : 'NET');
      if (b.serve) {
        if (!inBox(b.x, b.y, b.serveBox)) return fault();
      } else if (Math.abs(b.x) > CT.hw + 0.03 || Math.abs(b.y) > CT.hl + 0.03) return endPoint(recv, 'OUT');
      const nearLine = Math.min(Math.abs(Math.abs(b.x) - CT.hw), Math.abs(Math.abs(b.y) - CT.hl)) < 0.12;
      if (nearLine && !b.serve) popup('ON THE LINE', p.x, p.y - 6, '#ffffff');
      if (G.mode === 'targets' && hitter === 'near') hitTargets(b.x, b.y);
      return;
    }
    if (b.bounces === 2) {
      const r = who(recv);
      if (b.serve) { G.stats.aces += hitter === 'near' ? 1 : 0; return endPoint(hitter, 'ACE'); }
      return endPoint(hitter, r.contact ? 'WINNER' : 'WINNER');
    }
  }
  function fault() {
    const sc = G.score; ball.rules = false; sc.faults++;
    if (sc.faults >= 2) { sc.faults = 0; return endPoint(other(serverNow(sc)), 'DOUBLE FAULT'); }
    callout('FAULT', '2ND SERVE', '#ff5c8a'); sfx.fault();
    G.state = 'refault'; G.stateT = 0;
  }
  function endPoint(winSide, why) {
    if (G.state !== 'rally' && G.state !== 'refault') return;
    ball.rules = false; G.state = 'point'; G.stateT = 0; G.score && (G.score.faults = 0);
    if (G.mode === 'targets') { if (why !== 'WINNER' || winSide !== 'near') G.tCombo = 0; G.state = 'tfeed'; G.stateT = 0; hud(); return; }
    const shooter = ball.lastHit; const kind = ball.shotKind;
    if (winSide === 'near' && shooter === 'near' && (why === 'WINNER' || why === 'ACE')) {
      G.stats.winners++;
      if (G.rally >= 10) G.stats.longRallyWon = Math.max(G.stats.longRallyWon, G.rally);
      if (kind === 'drop') { unlock('drop'); why = 'DROP SHOT WINNER'; }
      else if (kind === 'lob') { unlock('lob'); why = 'LOB WINNER'; }
      else if (ball.curved) { unlock('curve'); why = 'CURVE WINNER'; }
      if (why === 'ACE') { unlock('ace'); ME.aces = (ME.aces || 0) + 1; if (ME.aces >= 10) unlock('aces10'); }
    }
    const good = winSide === 'near';
    const r = awardPoint(winSide);
    const col = good ? '#5cff8a' : '#ff5c8a';
    let sub = '';
    if (r === 'hold' || r === 'break') sub = 'GAME ' + (winSide === 'near' ? 'YOU' : pfirst(G.opp).toUpperCase());
    if (r === 'break') sub = winSide === 'near' ? 'BREAK! YOU BROKE SERVE' : 'BROKEN';
    if (G.score.tb && G.score.tbCount === 0 && !G.score.done) sub = 'TIEBREAK';
    callout(why, sub, col);
    if (good) { sfx.cheer(why === 'ACE' || /WINNER/.test(why) ? 1 : 0.5); G.flash = 0.25; } else sfx.groan();
    hud();
  }

  /* ---------- target practice (the mini game) ---------- */
  function startTargets() {
    G.score = null; G.tScore = 0; G.tCombo = 0; G.tTime = 60; G.targets = []; for (let i = 0; i < 3; i++) spawnTarget(i === 2);
    near.x = near.tx = 0; near.y = near.ty = -(CT.hl + 0.6); far.x = 0; far.y = CT.hl + 0.6;
    G.state = 'tfeed'; G.stateT = 0.4; hint('SWIPE UP to hit the <b>ball cans</b>. Gold cans are worth triple.');
    hud();
  }
  function spawnTarget(gold) { G.targets.push({ x: rand(-3.4, 3.4), y: rand(3.2, 10.8), r: gold ? 0.9 : 1.2, gold: !!gold, pop: 0 }); }
  function feedBall() {
    ball.lastHit = 'far'; ball.serve = false; ball.rules = true; ball.shotKind = 'feed'; ball.curved = false;
    const lvl = clamp((60 - G.tTime) / 60, 0, 1);
    const x0 = rand(-1, 1), tx = rand(-3.2, 3.2), ty = -rand(7.5, 10.5);
    launch(x0, CT.hl + 0.5, 1.0, tx, ty, Math.hypot(tx - x0, ty - CT.hl) / lerp(13, 20, lvl), 'flat', 0);
    ball.lastHit = 'far'; ball.rules = true; ball.serve = false;
    G.rally = 0; planContact(near); sfx.hit('cpu');
    G.state = 'rally'; G.stateT = 0;
  }
  function hitTargets(x, y) {
    let hitAny = false;
    G.targets.forEach(t => {
      if (t.pop) return;
      if (Math.hypot(x - t.x, y - t.y) <= t.r) {
        hitAny = true; G.tCombo++; const pts = (t.gold ? 300 : 100) * Math.min(5, G.tCombo); G.tScore += pts; t.pop = 1;
        const p = P(t.x, t.y, 0.3); burst(p.x, p.y, 16, t.gold ? '#ffb627' : '#ffd23f'); popup('+' + pts, p.x, p.y - 8, t.gold ? '#ffb627' : '#ffffff'); sfx.coin(); buzz(15); kick(1.5);
      }
    });
    if (!hitAny) G.tCombo = 0;
    G.targets = G.targets.filter(t => !t.pop); while (G.targets.length < 3) spawnTarget(Math.random() < 0.25);
    hud();
  }

  /* =====================================================================
     6. INPUT
     ===================================================================== */
  let touch = null;
  function humanCanSwing() { return G.on && !G.paused && G.state === 'rally' && ball.lastHit === 'far' && near.contact && !near.pending; }
  cv.addEventListener('pointerdown', e => {
    if (!G.on || G.paused) return; audioInit();
    touch = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), path: [[e.clientX, e.clientY]] };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.state === 'serve' && serverNow(G.score) === 'near' && !G.serveHold) { G.serveHold = { t0: G.time, aim: 0 }; $('#serveMeter').hidden = false; sfx.toss(); }
  });
  cv.addEventListener('pointermove', e => { if (!touch) return; touch.x = e.clientX; touch.y = e.clientY; touch.path.push([e.clientX, e.clientY]); if (G.serveHold) G.serveHold.aim = clamp((e.clientX - touch.x0) / (W * 0.3), -1, 1); });
  cv.addEventListener('pointerup', e => { const t = touch; touch = null; if (!t) return; t.x = e.clientX; t.y = e.clientY; if (G.serveHold) return releaseServe(); readSwipe(t); });
  cv.addEventListener('pointercancel', () => { touch = null; });
  function readSwipe(t) {
    const dx = t.x - t.x0, dy = t.y0 - t.y, L = Math.hypot(dx, dy), dur = Math.max(0.04, (performance.now() - t.t0) / 1000);
    let sw;
    if (L < 16) sw = { kind: 'tap', aim: 0 };
    else if (dy < -24 && Math.abs(dy) > Math.abs(dx) * 0.6) sw = { kind: 'lob', aim: clamp(dx / (W * 0.3), -1.3, 1.3) };
    else if (dy > 10) {
      const aim = clamp(dx / (W * 0.32), -1.45, 1.45);
      if (L < H * 0.085) sw = { kind: 'drop', aim: aim * 0.8 };
      else {
        // curve = how far the middle of the swipe bows away from a straight line
        let dev = 0; const n = t.path.length;
        if (n > 4) { const m = t.path[Math.floor(n / 2)]; const chx = t.x - t.x0, chy = t.y - t.y0; dev = (chx * (m[1] - t.y0) - chy * (m[0] - t.x0)) / (L * L); }
        const curveM = Math.abs(dev) > 0.07 ? clamp(dev * 8, -2.4, 2.4) : 0;
        sw = { kind: 'drive', aim, depth01: clamp((L - H * 0.085) / (H * 0.3), 0, 1.15), power01: clamp((L / dur - 450) / 2100, 0, 1), curveM };
      }
    } else return;
    swingHuman(sw);
  }
  addEventListener('keydown', e => {
    if (!G.on || G.paused || e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { pause(); return; }
    if (G.state === 'serve' && serverNow(G.score) === 'near' && e.code === 'Space') { e.preventDefault(); audioInit(); G.serveHold = { t0: G.time, aim: 0, key: true }; $('#serveMeter').hidden = false; sfx.toss(); return; }
    const map = { ArrowLeft: { kind: 'drive', aim: -0.9, depth01: 0.6, power01: 0.7 }, ArrowRight: { kind: 'drive', aim: 0.9, depth01: 0.6, power01: 0.7 }, ArrowUp: { kind: 'drive', aim: 0, depth01: 0.75, power01: 0.8 }, Space: { kind: 'drive', aim: 0, depth01: 0.6, power01: 0.6 }, ArrowDown: { kind: 'lob', aim: 0 }, KeyZ: { kind: 'drop', aim: 0 } };
    if (map[e.code]) { e.preventDefault(); swingHuman(Object.assign({}, map[e.code])); }
  });
  addEventListener('keyup', e => {
    if (G.serveHold && G.serveHold.key && e.code === 'Space') releaseServe();
    if (G.serveHold && G.serveHold.key && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) G.serveHold.aim = 0;
  });
  addEventListener('keydown', e => { if (G.serveHold && G.serveHold.key) { if (e.code === 'ArrowLeft') G.serveHold.aim = -0.9; if (e.code === 'ArrowRight') G.serveHold.aim = 0.9; } });

  function swingHuman(sw) {
    if (!humanCanSwing()) { if (G.on && G.state === 'rally') near.swing = Math.max(near.swing, 0.5); return; }
    const tts = near.contact.at - G.time;
    if (tts > 0.55) { near.swing = 0.5; return; }
    const ctl = statVal('ctl'); const pw = 0.05 + 0.004 * ctl, gw = 0.11 + 0.004 * ctl;
    let grade = Math.abs(tts) < pw ? 'PERFECT' : Math.abs(tts) < gw ? 'GREAT' : tts > 0.24 ? 'EARLY' : tts < -0.12 ? 'LATE' : 'GOOD';
    if (tts < -0.2) return;
    near.pending = { prm: Object.assign(playerShotParams(sw), { kind: sw.kind }), grade };
  }
  function releaseServe() {
    const h = G.serveHold; G.serveHold = null; if (!h) return;
    const m = serveMeterVal(h), sweet = sweetZone();
    const q = m >= sweet[0] && m <= sweet[1] ? 'PERFECT' : m > sweet[1] ? 'OVER' : 'GOOD';
    const power = q === 'PERFECT' ? 1 : q === 'OVER' ? 1.05 : lerp(0.25, 0.85, m / sweet[0]);
    if (q === 'PERFECT') popup('PERFECT', P(near.x, near.y, 2.8).x, P(near.x, near.y, 2.8).y - 8, '#ffffff');
    doServe('near', G.score.faults ? power * 0.85 : power, h.aim, q);
  }
  function serveMeterVal(h) { const t = (G.time - h.t0) / 1.05; const ph = t % 2; return ph < 1 ? ph : 2 - ph; }
  function sweetZone() { const w = 0.1 + 0.008 * statVal('srv'); return [0.9 - w, 0.93]; }

  /* =====================================================================
     7. MAIN LOOP
     ===================================================================== */
  function update(dt) {
    updateFx(dt);
    if (!G.on || G.paused) return;
    if (G.freeze > 0) { G.freeze -= dt; return; }
    G.time += dt; G.stateT += dt;

    // players move toward their plans
    [near, far].forEach(pl => {
      if (G.mode === 'targets' && pl.isAI) return;
      pl.swing = Math.max(0, pl.swing - dt * 3.4);
      if (pl.contact && (!pl.isAI || pl.react <= 0)) { pl.tx = pl.contact.standX; pl.ty = pl.contact.standY; }
      if (pl.react > 0) pl.react -= dt;
      const dx = pl.tx - pl.x, dy = pl.ty - pl.y, d = Math.hypot(dx, dy), step = pl.speed * dt;
      pl.moving = d > 0.05;
      if (d > 0.001) { const k = Math.min(1, step / d); pl.x += dx * k; pl.y += dy * k; }
      const lim = pl.side === 'near' ? [-(CT.hl + 3.4), -1.2] : [1.2, CT.hl + 3.4];
      pl.y = clamp(pl.y, lim[0], lim[1]); pl.x = clamp(pl.x, -CT.dw - 2, CT.dw + 2);
      if (pl.moving) pl.anim += dt;
    });

    // serving
    if (G.state === 'serve') {
      const srv = serverNow(G.score); const s = who(srv);
      ball.x = s.x + (srv === 'near' ? 0.35 : -0.35); ball.y = s.y; ball.z = 1.0;
      if (srv === 'near') {
        if (G.serveHold) { const m = serveMeterVal(G.serveHold); ball.z = 1 + m * 2.2; s.toss = m; $('#serveFill').style.width = (m * 100) + '%'; const sz = sweetZone(); const b = $('#serveSweet'); b.style.left = (sz[0] * 100) + '%'; b.style.width = ((sz[1] - sz[0]) * 100) + '%'; }
      } else if (G.stateT > 1.0) {
        const sk = G.sk; const second = G.score.faults > 0;
        const power = second ? rand(0.45, 0.7) : rand(0.55, 0.8 + 0.25 * sk);
        const q = Math.random() < (second ? 0.08 : 0.2 * (1 - sk) + 0.06) ? 'OVER' : (Math.random() < 0.3 * sk ? 'PERFECT' : 'GOOD');
        doServe('far', power, rand(-1, 1), q);
      }
    } else if (G.state === 'refault') {
      if (G.stateT > 1.0) { const srv = serverNow(G.score); G.state = 'serve'; G.stateT = 0; ball.serve = true; ball.live = false; ball.trail = []; const s = who(srv); s.x = s.tx; s.y = s.ty; near.contact = far.contact = near.pending = far.pending = null; }
    }

    // ball
    if (ball.live) {
      for (let i = 0; i < 4; i++) stepBall(ball, dt / 4, false);
      const p = P(ball.x, ball.y, ball.z); ball.trail.push([p.x, p.y]); if (ball.trail.length > 7) ball.trail.shift();
      if (Math.abs(ball.y) > 22 || Math.abs(ball.x) > 14) {
        ball.live = false;
        // left the arena before a second bounce: a ball that landed in is a winner, one that never landed is out
        if (ball.rules && G.state === 'rally') { if (ball.bounces >= 1) endPoint(ball.lastHit, ball.serve ? 'ACE' : 'WINNER'); else endPoint(other(ball.lastHit), 'OUT'); }
      }
    }

    // hitting
    if (G.state === 'rally') {
      [near, far].forEach(pl => {
        if (!pl.contact || ball.lastHit === pl.side) return;
        const tts = pl.contact.at - G.time;
        if (pl.isAI) {
          if (G.mode === 'targets') return;
          if (tts <= 0) {
            const d = Math.hypot(pl.x - pl.contact.standX, pl.y - pl.contact.standY);
            if (d <= pl.reach) executeHit(pl.side, aiDecide(pl), 'AI'); else pl.contact = null;
          }
        } else {
          if (pl.pending && tts <= 0) {
            const d = Math.hypot(pl.x - pl.contact.standX, pl.y - pl.contact.standY);
            if (d <= pl.reach) executeHit('near', pl.pending.prm, pl.pending.grade);
            else { pl.pending = null; pl.contact = null; pl.swing = 1; popup('TOO FAR', P(pl.x, pl.y, 2).x, P(pl.x, pl.y, 2).y, '#ff5c8a'); }
          } else if (!pl.pending && tts < -0.2) pl.contact = null;
        }
      });
    }

    // between points
    if (G.state === 'point' && G.stateT > 1.5) { if (G.score && G.score.done) { G.state = 'over'; G.stateT = 0; } else setupPoint(); }
    if (G.state === 'over' && G.stateT > 1.2) { G.on = false; matchResults(); }
    if (G.mode === 'targets') {
      if (G.state === 'rally' || G.state === 'tfeed' || G.state === 'point') { G.tTime -= dt; if (G.tTime <= 0) { G.tTime = 0; G.on = false; targetResults(); return; } }
      if (G.state === 'tfeed' && G.stateT > 0.7) feedBall();
      if (G.state === 'rally' && !ball.live) { G.state = 'tfeed'; G.stateT = 0; }
      if (G.state === 'rally' && ball.lastHit === 'near' && ball.y > CT.hl + 2) { G.state = 'tfeed'; G.stateT = 0; }
      hudTargets();
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sx = G.shake > 0 ? Math.round(rand(-G.shake, G.shake)) : 0, sy = G.shake > 0 ? Math.round(rand(-G.shake, G.shake)) : 0;
    ctx.setTransform(1, 0, 0, 1, sx, sy);
    if (courtLayer) ctx.drawImage(courtLayer, 0, 0);
    if (!G.on && !G.showCourt) return;
    if (G.mode === 'targets') drawTargets();
    drawStrikeZone();
    drawAthlete(far, G.mode === 'targets' ? 'machine' : 'ai');
    if (ball.y > 0) drawBall();
    drawNet();
    if (ball.y <= 0) drawBall();
    drawAthlete(near, 'me');
    drawServeAim();
    for (const q of G.parts) { ctx.globalAlpha = clamp(q.life / q.max, 0, 1); px(q.c, q.x, q.y, q.s, q.s); }
    ctx.globalAlpha = 1;
    for (const t of G.popups) { ctx.globalAlpha = clamp(t.life * 2, 0, 1); ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(t.text, Math.round(t.x) + 1, Math.round(t.y) + 1); ctx.fillStyle = t.c; ctx.fillText(t.text, Math.round(t.x), Math.round(t.y)); }
    ctx.globalAlpha = 1;
    if (G.flash > 0) { ctx.globalAlpha = G.flash * 0.5; px('#ffffff', -4, -4, LW + 8, LH + 8); ctx.globalAlpha = 1; }
  }
  function drawNet() {
    const l = P(-CT.dw - 0.5, 0, 0), r = P(CT.dw + 0.5, 0, 0), top = P(0, 0, CT.net).y, base = Math.round(l.y);
    for (let y = Math.round(top); y < base; y++) for (let x = Math.round(l.x); x <= Math.round(r.x); x++) if ((x + y) % 2 === 0) px('rgba(10,14,40,.75)', x, y, 1, 1);
    px('#f4f6ff', l.x, top, r.x - l.x + 1, 1);
    px('#c9d0f0', l.x - 1, top, 2, base - top + 1); px('#c9d0f0', r.x - 1, top, 2, base - top + 1);
  }
  function drawBall() {
    if (!ball.visible) return;
    const g = P(ball.x, ball.y, 0), p = P(ball.x, ball.y, ball.z);
    if (ball.live) ball.trail.forEach((t, i) => { ctx.globalAlpha = (i + 1) / ball.trail.length * 0.35; px(ball.heat ? '#ffffff' : '#e6ff5a', t[0], t[1], 1, 1); });
    ctx.globalAlpha = 1;
    px('rgba(0,0,0,.45)', g.x - 1, g.y, 3, 1);
    const big = ball.z > 2.2 ? 3 : 2;
    px('#e6ff5a', p.x - 1, p.y - big + 1, big, big); px('#ffffff', p.x - 1, p.y - big + 1, 1, 1);
  }
  function drawStrikeZone() {
    const c = near.contact; if (!c || G.state !== 'rally' || ball.lastHit === 'near') return;
    const tts = c.at - G.time; if (tts > 0.9 || tts < -0.15) return;
    const p = P(c.x, c.y, c.z);
    const r = Math.max(2, Math.round(2 + tts * 22));
    const on = Math.abs(tts) < 0.05 + 0.004 * statVal('ctl');
    ctx.strokeStyle = near.pending ? '#5cff8a' : on ? '#ffffff' : '#ffd23f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(Math.round(p.x) + 0.5, Math.round(p.y) + 0.5, r, 0, 7); ctx.stroke();
    const g = P(c.x, c.y, 0); ctx.globalAlpha = 0.6; px(near.pending ? '#5cff8a' : '#ffd23f', g.x - 3, g.y, 7, 1); ctx.globalAlpha = 1;
  }
  function drawServeAim() {
    if (!(G.state === 'serve' && serverNow(G.score) === 'near')) return;
    const box = ball.serveBox; const aim = G.serveHold ? G.serveHold.aim : 0;
    const tx = lerp(box.x0 + 0.35, box.x1 - 0.35, (aim + 1) / 2), ty = CT.svc - 0.9;
    const p = P(tx, ty, 0); const blink = Math.floor(G.time * 6) % 2;
    px(blink ? '#ffd23f' : '#ffffff', p.x - 2, p.y, 5, 1); px(blink ? '#ffd23f' : '#ffffff', p.x, p.y - 2, 1, 5);
  }
  function drawTargets() {
    G.targets.forEach(t => {
      const p = P(t.x, t.y, 0), rr = Math.round(t.r * ppm * p.s);
      ctx.globalAlpha = 0.35; px(t.gold ? '#ffb627' : '#ffffff', p.x - rr, p.y, rr * 2, 1); ctx.globalAlpha = 1;
      const col = t.gold ? '#ffb627' : '#e8413c';
      px('#1a1a1a', p.x - 3, p.y - 8, 7, 1); px(col, p.x - 3, p.y - 7, 7, 7); px('#ffffff', p.x - 3, p.y - 5, 7, 2); px('rgba(0,0,0,.35)', p.x - 3, p.y, 7, 1);
    });
  }
  const SKIN = ['#f2c7a5', '#e0a986', '#c68a61', '#8d5a3b'];
  function shirtColor(side) {
    if (side === 'near') { const s = SHIRTS[ME ? ME.shirt : 0]; return s.c === 'rainbow' ? 'hsl(' + ((G.time * 120) % 360) + ',90%,60%)' : s.c; }
    if (G.mode === 'targets') return '#6b7394';
    const pr = profileOf(G.opp); const s = pr ? SHIRTS[pr.shirt || 0] : SHIRTS[(G.opp || 1) % 4 + 1]; return !s || s.c === 'rainbow' ? '#ff5c8a' : s.c;
  }
  function drawAthlete(pl, kind) {
    const p = P(pl.x, pl.y, 0); const x = Math.round(p.x), y = Math.round(p.y);
    const idN = pl.side === 'near' ? (ME ? ME.id : 0) : G.opp;
    const skin = SKIN[(idN || 0) % 4], hair = ['#3b2616', '#1a1a1a', '#b77a36', '#5b3a22', '#d9d9d9'][(idN || 0) % 5];
    const shirt = shirtColor(pl.side);
    px('rgba(0,0,0,.4)', x - 4, y, 9, 2);
    if (kind === 'machine') { px('#39406b', x - 5, y - 9, 11, 9); px('#9aa5dc', x - 3, y - 12, 7, 3); px('#e6ff5a', x - 1, y - 6, 3, 3); return; }
    const f = pl.moving ? Math.floor(pl.anim * 12) % 2 : 0;
    px(skin, x - 2, y - 5, 1, 4 - f); px(skin, x + 1, y - 5, 1, 3 + f);
    px('#ffffff', x - 3, y - 1 - f, 2, 1); px('#ffffff', x + 1, y - 2 + f, 2, 1);
    px('#f4f6ff', x - 3, y - 7, 6, 2);
    px(shirt, x - 3, y - 12, 6, 5);
    px(skin, x - 4, y - 11, 1, 3); px(skin, x + 3, y - 11, 1, 3);
    px(skin, x - 2, y - 16, 4, 4);
    if (pl.side === 'near') px(hair, x - 2, y - 16, 4, 3); else { px(hair, x - 2, y - 16, 4, 1); px('#1a1a1a', x - 1, y - 14, 1, 1); px('#1a1a1a', x + 1, y - 14, 1, 1); }
    // racquet
    const h = pl.hand * (pl.side === 'near' ? 1 : 1);
    const sw = pl.swing; let rx, ry;
    if (G.state === 'serve' && pl.toss > 0) { rx = x + 3 * h; ry = y - 17 - Math.round(pl.toss * 2); }
    else if (sw > 0.66) { rx = x + 5 * h; ry = y - 11; }
    else if (sw > 0.33) { rx = x + 3 * h; ry = y - (pl.side === 'near' ? 16 : 9); }
    else if (sw > 0) { rx = x - 4 * h; ry = y - 14; }
    else { rx = x + 4 * h; ry = y - 10; }
    const frame = pl.side === 'near' ? '#ffd23f' : '#45e0ff';
    px('#1a1a1a', rx, ry + 3, 1, 2); px(frame, rx - 1, ry - 1, 3, 1); px(frame, rx - 1, ry + 2, 3, 1); px(frame, rx - 2, ry, 1, 2); px(frame, rx + 2, ry, 1, 2); px('#dfe6ff', rx - 1, ry, 3, 2);
  }

  /* ---------- effects ---------- */
  function kick(m) { if (!reduced) G.shake = Math.max(G.shake, m); }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } }
  function burst(x, y, n, c) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), v = rand(20, 70); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: rand(0.25, 0.55), max: 0.55, c, s: 1 }); } }
  function dust(x, y) { const c = G.surf === 'clay' ? '#e89a70' : G.surf === 'grass' ? '#9fd98a' : '#cfe0ff'; for (let i = 0; i < 4; i++) G.parts.push({ x: x + rand(-1, 1), y, vx: rand(-14, 14), vy: rand(-12, -4), life: 0.3, max: 0.3, c, s: 1 }); }
  function popup(text, x, y, c) { G.popups.push({ text, x, y, c, life: 0.9 }); }
  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 12); G.flash = Math.max(0, G.flash - dt * 2);
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 90 * dt; if (q.life <= 0) G.parts.splice(i, 1); }
    for (let i = G.popups.length - 1; i >= 0; i--) { const t = G.popups[i]; t.life -= dt; t.y -= 14 * dt; if (t.life <= 0) G.popups.splice(i, 1); }
  }
  let calloutTimer = 0;
  function callout(big, small, color) {
    const c = $('#callout'); c.innerHTML = ''; const b = document.createElement('div'); b.textContent = big; b.style.color = color || '#ffd23f';
    c.append(b); if (small) { const s = document.createElement('small'); s.textContent = small; c.append(s); }
    c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
    clearTimeout(calloutTimer); calloutTimer = setTimeout(() => { c.classList.remove('show'); c.innerHTML = ''; }, 1300);
  }
  function hint(html) { $('#hint').innerHTML = html || ''; }
  // one toast at a time, so a burst of trophies never buries the screen
  const toastQ = []; let toastBusy = false;
  function toast(title, text) { toastQ.push([title, text]); if (!toastBusy) nextToast(); }
  function nextToast() {
    const n = toastQ.shift(); if (!n) { toastBusy = false; return; } toastBusy = true;
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = '<div class="ic">★</div><div><b>' + esc(n[0]) + '</b><span>' + esc(n[1]) + '</span></div>';
    $('#toasts').append(t); setTimeout(() => { t.remove(); nextToast(); }, 2300);
  }

  /* ---------- HUD ---------- */
  function hud() {
    if (G.mode === 'targets') return hudTargets();
    const sc = G.score; if (!sc) return;
    const srv = serverNow(sc);
    const row = (side, name, cls) => '<div class="row ' + cls + (srv === side ? ' srv' : '') + '"><span class="dot"></span><span class="nm">' + esc(name) + '</span><span class="g">' + sc.games[IDX[side]] + '</span><span class="p">' + (sc.tb && sc.fmt !== 'tb' ? pointLabel(sc, IDX[side]) : sc.fmt === 'tb' ? sc.pts[IDX[side]] : pointLabel(sc, IDX[side])) + '</span></div>';
    $('#board').innerHTML = row('far', (G.opp ? plast(G.opp) : 'CPU').toUpperCase(), '') + row('near', ME ? plast(ME.id).toUpperCase() : 'YOU', 'me');
    $('#rallyTag').textContent = G.rally >= 3 ? 'RALLY ' + G.rally : '';
  }
  function hudTargets() {
    $('#board').innerHTML = '<div class="row"><span class="dot"></span><span class="nm">TARGETS</span><span class="g">' + Math.ceil(G.tTime) + '</span><span class="p">x' + Math.max(1, Math.min(5, G.tCombo)) + '</span></div><div class="row me"><span class="dot"></span><span class="nm">SCORE</span><span class="g"></span><span class="p">' + G.tScore + '</span></div>';
    $('#rallyTag').textContent = '';
  }

  /* =====================================================================
     8. SOUND (synthesized)
     ===================================================================== */
  let AC = null; let muted = store.get('arcade:muted') === '1';
  function audioInit() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
  function tone(f, d, type, v, to) { if (!AC || muted) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02); }
  function noise(d, v, f, q) { if (!AC || muted) return; const t = AC.currentTime, n = Math.floor(AC.sampleRate * d), buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2); const s = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q || 1; g.gain.value = v; s.buffer = buf; s.connect(bp).connect(g).connect(AC.destination); s.start(t); }
  const sfx = {
    hit(q) { noise(0.06, q === 'cpu' ? 0.3 : 0.6, 1800); tone(q === 'PERFECT' ? 1100 : 480, 0.07, 'square', 0.05, q === 'PERFECT' ? 1650 : null); },
    bounce() { tone(190, 0.05, 'triangle', 0.12); },
    net() { noise(0.15, 0.3, 500); },
    toss() { tone(300, 0.2, 'square', 0.03, 600); },
    fault() { tone(330, 0.12, 'square', 0.05); setTimeout(() => tone(250, 0.18, 'square', 0.05), 120); },
    cheer(k) { noise(0.9 * (0.6 + k * 0.6), 0.25 + 0.2 * k, 1300, 0.4); },
    groan() { noise(0.5, 0.12, 400, 0.6); },
    coin() { tone(988, 0.06, 'square', 0.05); setTimeout(() => tone(1319, 0.12, 'square', 0.05), 60); },
    trophy() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'square', 0.05), i * 90)); },
    win() { [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.06), i * 110)); },
    lose() { [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.06), i * 160)); },
    tick() { tone(1500, 0.02, 'square', 0.03); }
  };

  /* =====================================================================
     9. RESULTS + REWARDS
     ===================================================================== */
  function matchResults() {
    const sc = G.score, won = sc.winner === 'near', info = G.ctxInfo || {};
    $('#hud').hidden = true; G.showCourt = true;
    const st = G.stats; const r = { won, aces: st.aces, loveHolds: st.loveHolds, longRallyWon: st.longRallyWon };
    let xp = won ? 160 : 70, coins = won ? 120 : 40; const lines = [];
    lines.push([won ? 'Match win' : 'Match played', xp, coins]);
    if (st.perfects) { lines.push(['Perfect hits x' + st.perfects, st.perfects * 5, st.perfects * 2]); xp += st.perfects * 5; coins += st.perfects * 2; }
    if (st.aces) { lines.push(['Aces x' + st.aces, st.aces * 10, st.aces * 10]); xp += st.aces * 10; coins += st.aces * 10; }
    if (won) {
      ME.w++; unlock('first_win');
      if (sc.fmt === 'fast4' && sc.games[1] === 0) unlock('bagel');
      if (sc.viaTb || sc.fmt === 'tb') unlock('tb');
      if (sc.trail[0] >= 2) unlock('comeback');
      if (ME.rival && G.opp === ME.rival) { lines.push(['Beat your rival', 100, 150]); xp += 100; coins += 150; unlock('rival'); }
      if (info.tour) {
        const list = tourList(); const t = ME.tour;
        if (info.stage === t.stage) {
          t.stage++; lines.push(['Tour stage cleared', 120, 100]); xp += 120; coins += 100;
          if (t.stage >= list.length) { if (t.tier === 1) { unlock('tour'); t.tier = 2; t.stage = 0; t.champs++; lines.push(['LEAGUE TOUR CHAMPION', 500, 500]); xp += 500; coins += 500; } else { unlock('pro'); t.champs++; t.stage = 0; lines.push(['PRO TOUR CHAMPION', 1000, 1000]); xp += 1000; coins += 1000; } }
        }
      }
    } else ME.l++;
    let dailyDone = false;
    if (info.daily && info.daily.def.ok(r) && ME.daily.date !== info.daily.day) { dailyDone = completeDaily(lines); }
    const lvl = give(xp - 0, 0); ME.coins += coins;
    commit();
    won ? sfx.win() : sfx.lose();
    const oppName = G.opp ? pname(G.opp) : 'CPU';
    const score = sc.fmt === 'tb' ? sc.pts[0] + '-' + sc.pts[1] : sc.games[0] + '-' + sc.games[1] + (sc.viaTb ? ' (TB ' + sc.pts[0] + '-' + sc.pts[1] + ')' : '');
    ui('<div class="scr dim">' +
      '<div class="big-result ' + (won ? 'win' : 'loss') + '">' + (won ? 'VICTORY' : 'GG') + '</div>' +
      '<div class="score-line">' + esc(score) + '</div><p style="text-align:center">' + (won ? 'You beat ' : 'You fell to ') + esc(oppName) + (info.surface ? ' on ' + SURFACES[info.surface].n.toLowerCase() : '') + '</p>' +
      (lvl ? '<div class="lvlup">LEVEL UP! LV ' + lvl + '  +' + 100 + ' COINS</div>' : '') +
      '<div class="panel">' + lines.map(l => '<div class="reward"><span>' + esc(l[0]) + '</span><b>+' + l[1] + ' XP · +' + l[2] + '</b></div>').join('') + '<div class="reward"><span>TOTAL</span><b>+' + xp + ' XP · +' + coins + (dailyDone ? ' + DAILY' : '') + '</b></div></div>' +
      '<div class="panel"><div class="sub">Level ' + levelOf(ME.xp).l + '</div><div class="bar"><i style="width:' + (levelOf(ME.xp).into / levelOf(ME.xp).need * 100) + '%"></i></div><div class="coins">' + ME.coins.toLocaleString() + '</div></div>' +
      (won ? '' : '<p style="text-align:center">Shake hands, then run it back.</p>') +
      '<button class="btn go" data-go="rematch">' + (won && info.tour ? 'NEXT' : 'REMATCH') + '</button>' +
      '<button class="btn" data-go="hub">MAIN MENU</button>' +
      '<a class="btn" href="index.html#standings">SEE REAL STANDINGS<span class="tag ok">LIVE</span></a></div>');
    $('[data-go="rematch"]').onclick = () => { if (won && info.tour) screenTour(); else startMatch(info); };
    $('[data-go="hub"]').onclick = screenHub;
  }
  function targetResults() {
    $('#hud').hidden = true; G.showCourt = true; hint('');
    const s = G.tScore, best = s > (ME.targets || 0); if (best) ME.targets = s; if (s >= 2000) unlock('targets2k');
    const xp = Math.round(s / 8), coins = Math.round(s / 10); const lines = [['Target Practice', xp, coins]];
    let dailyDone = false; const info = G.ctxInfo || {};
    if (info.daily && info.daily.def.ok({ score: s }) && ME.daily.date !== info.daily.day) dailyDone = completeDaily(lines);
    const lvl = give(xp, coins); commit(); sfx.win();
    ui('<div class="scr dim"><div class="big-result win">TIME!</div><div class="score-line">' + s.toLocaleString() + '</div>' + (best ? '<div class="lvlup">NEW PERSONAL BEST</div>' : '<p style="text-align:center">Best: ' + (ME.targets || 0).toLocaleString() + '</p>') + (lvl ? '<div class="lvlup">LEVEL UP! LV ' + lvl + '</div>' : '') +
      '<div class="panel">' + lines.map(l => '<div class="reward"><span>' + esc(l[0]) + '</span><b>+' + l[1] + ' XP · +' + l[2] + '</b></div>').join('') + '</div>' +
      '<button class="btn go" data-go="again">GO AGAIN</button><button class="btn" data-go="hub">MAIN MENU</button></div>');
    $('[data-go="again"]').onclick = () => startMatch({ mode: 'targets', surface: G.surf });
    $('[data-go="hub"]').onclick = screenHub;
  }
  function completeDaily(lines) {
    const d = ME.daily, today = todayISO();
    d.streak = d.last === todayISO(-1) ? d.streak + 1 : 1; d.last = today; d.date = today;
    const bonus = 250 + 50 * Math.min(d.streak, 7);
    lines.push(['Daily challenge (streak ' + d.streak + ')', 150, bonus]); give(150, bonus);
    if (d.streak >= 3) unlock('streak3'); if (d.streak >= 7) unlock('streak7');
    return true;
  }

  /* =====================================================================
     10. MENUS
     ===================================================================== */
  function ui(html) { $('#ui').innerHTML = html; $('#ui').scrollTop = 0; }
  function rimg(i, cls) { return '<img class="' + (cls || '') + '" src="' + ART.racquet(i) + '" alt="" loading="lazy">'; }
  function stars(sk) { const n = Math.max(1, Math.round(sk * 5)); return '<span class="stars">' + '★'.repeat(n) + '<span style="opacity:.3">' + '★'.repeat(5 - n) + '</span></span>'; }
  function top(title, back) { return '<div class="top">' + (back ? '<button class="back" data-back>◀ BACK</button>' : '<span></span>') + '<h1>' + title + '</h1><span class="coins">' + (ME ? ME.coins.toLocaleString() : 0) + '</span></div>'; }
  function wireBack(fn) { const b = $('[data-back]'); if (b) b.onclick = fn || screenHub; }

  function screenWho() {
    G.on = false; $('#hud').hidden = true;
    const ps = LG.players;
    if (!ps.length) { loadMe(0); return screenHub(); }
    ui('<div class="scr"><div class="logo"><span class="a">' + esc((LG.data.name || 'LEAGUE').toUpperCase()) + '</span><span class="b">SUPER<br>LEAGUE<br>TENNIS</span><span class="c">WHO ARE YOU?</span></div>' +
      '<div class="who">' + ps.map(p => '<button data-who="' + p.id + '">' + rimg(p.avatar || 0) + '<span>' + esc(p.name) + '</span><small>' + (p.num ? '#' + esc(p.num) + ' · ' : '') + esc((LG.real[p.id] || {}).played ? LG.real[p.id].w + '-' + LG.real[p.id].l + ' real' : 'Ready to play') + '</small></button>').join('') + '</div>' +
      '<p class="foot">Your arcade progress is saved to your name, so it follows you to any phone.</p></div>');
    document.querySelectorAll('[data-who]').forEach(b => b.onclick = async () => { loadMe(Number(b.dataset.who)); await pull(); screenHub(); if (!store.get('arcade:howto')) screenHowTo(true); });
  }

  function realBonus() {
    const mine = myRealMatches(ME.id);
    const wins = mine.filter(x => x.won && !ME.claimed.includes('w' + x.m.id));
    const balls = mine.filter(x => x.balls && !ME.claimed.includes('b' + x.m.id));
    const pending = mine.filter(x => x.pending);
    return { wins, balls, pending };
  }
  function screenHub() {
    G.on = false; G.showCourt = false; $('#hud').hidden = true; buildCourt('hard');
    if (!ME) return screenWho();
    const lv = levelOf(ME.xp), me = LG.byId[ME.id] || {}, dly = dailyToday(), done = ME.daily.date === dly.day;
    const rb = realBonus(); const tl = tourList(); const t = ME.tour;
    const claimable = rb.wins.length * 300 + rb.balls.length * 50;
    ui('<div class="scr">' +
      '<div class="logo"><span class="a">' + esc((LG.data.name || '').toUpperCase()) + '</span><span class="b">SUPER LEAGUE TENNIS</span></div>' +
      '<div class="panel"><div class="card">' + rimg(ME.racquet) + '<div><div class="nm-big">' + esc(pname(ME.id)) + (me.num ? ' <span style="color:var(--muted)">#' + esc(me.num) + '</span>' : '') + '</div><div class="sub">' + esc(realLine(ME.id)) + '</div></div></div>' +
      '<div class="top"><span class="sub">LV ' + lv.l + ' · Arcade ' + ME.w + '-' + ME.l + '</span><span class="coins">' + ME.coins.toLocaleString() + '</span></div><div class="bar"><i style="width:' + (lv.into / lv.need * 100) + '%"></i></div>' +
      '<div class="stats4">' + PERK.map(k => '<div><b>' + statVal(k) + '</b>' + STAT_NAMES[k] + '</div>').join('') + '</div></div>' +
      (claimable ? '<div class="banner"><h3>REAL LEAGUE BONUS</h3><p>' + (rb.wins.length ? 'You won ' + rb.wins.length + ' real match' + (rb.wins.length > 1 ? 'es' : '') + '. ' : '') + (rb.balls.length ? 'You brought the balls ' + rb.balls.length + ' time' + (rb.balls.length > 1 ? 's' : '') + '. ' : '') + '</p><button class="btn go" id="claim">CLAIM ' + claimable + ' COINS</button></div>' : '') +
      (rb.pending.length ? '<div class="banner"><h3>SCORE MISSING</h3><p>Your match on ' + esc(rb.pending[0].m.date) + ' has no score yet. Enter it on the league site. If you won, a 300 coin bonus is waiting.</p><a class="btn" href="index.html#schedule">ENTER THE SCORE</a></div>' : '') +
      '<button class="btn go" id="b-tour">LEAGUE TOUR<small>' + (t.tier === 2 ? 'PRO TOUR · ' : '') + 'Stage ' + Math.min(t.stage + 1, tl.length) + ' of ' + tl.length + (tl[t.stage] ? ': ' + esc(pname(tl[t.stage].id)) : '') + '</small></button>' +
      '<button class="btn" id="b-daily"><span>DAILY CHALLENGE<small>' + esc(dly.text) + '</small></span><span class="tag ' + (done ? 'ok' : '') + '">' + (done ? 'DONE' : 'NEW') + '</span></button>' +
      '<div class="grid2"><button class="btn" id="b-quick">QUICK MATCH</button><button class="btn" id="b-targets">TARGETS<small>Best ' + (ME.targets || 0).toLocaleString() + '</small></button>' +
      '<button class="btn" id="b-shop">PRO SHOP</button><button class="btn" id="b-ach">TROPHIES<small>' + Object.keys(ME.ach).length + ' / ' + ACH.length + '</small></button>' +
      '<button class="btn" id="b-ladder">LADDER</button><button class="btn" id="b-howto">HOW TO PLAY</button></div>' +
      '<a class="btn" href="index.html#standings">REAL STANDINGS<span class="tag ok">LIVE</span></a>' +
      '<div class="sync ' + (SAVE.online ? 'on' : '') + '">' + (SAVE.url ? (SAVE.online ? 'PROGRESS SAVED TO THE LEAGUE SERVER' : SAVE.online === false ? 'OFFLINE · SAVED ON THIS PHONE' : 'CONNECTING…') : 'SAVED ON THIS PHONE') + '</div>' +
      '<p class="foot"><a href="index.html">Back to the league site</a> · <a href="#" id="b-switch">Not ' + esc(pfirst(ME.id)) + '?</a> · <a href="#" id="b-mute">' + (muted ? 'Sound off' : 'Sound on') + '</a></p></div>');
    const c = $('#claim'); if (c) c.onclick = () => {
      rb.wins.forEach(x => ME.claimed.push('w' + x.m.id)); rb.balls.forEach(x => ME.claimed.push('b' + x.m.id));
      const lv2 = give(rb.wins.length * 150, claimable); if (rb.wins.length) unlock('real_win'); if (rb.balls.length) unlock('ball_boy');
      commit(); audioInit(); sfx.coin(); toast('REAL LEAGUE BONUS', '+' + claimable + ' coins' + (lv2 ? ' · LEVEL ' + lv2 : '')); screenHub();
    };
    $('#b-tour').onclick = screenTour;
    $('#b-daily').onclick = () => { const d = dailyToday(); if (d.def.mode === 'targets') startMatch({ mode: 'targets', surface: d.surface, daily: d }); else startMatch({ mode: 'match', fmt: d.def.mode, opp: d.opp, skill: skillFor(d.opp, ME.tour.tier, Math.floor(tl.length / 2), tl.length), surface: d.surface, daily: d }); };
    $('#b-quick').onclick = screenQuick;
    $('#b-targets').onclick = () => startMatch({ mode: 'targets', surface: 'hard' });
    $('#b-shop').onclick = screenShop; $('#b-ach').onclick = screenAch; $('#b-ladder').onclick = screenLadder; $('#b-howto').onclick = () => screenHowTo(false);
    $('#b-switch').onclick = e => { e.preventDefault(); ME = null; screenWho(); };
    $('#b-mute').onclick = e => { e.preventDefault(); muted = !muted; store.set('arcade:muted', muted ? '1' : '0'); screenHub(); };
  }

  function oppRow(p, i, opts) {
    const r = LG.real[p.id] || {}; const pr = profileOf(p.id);
    return '<button class="opp ' + (opts.cls || '') + '" data-opp="' + p.id + '" data-i="' + i + '"' + (opts.locked ? ' disabled' : '') + '><span class="rk">' + (opts.rank || (i + 1)) + '</span>' + rimg(p.avatar || 0) +
      '<span><span class="n">' + esc(p.name) + (ME.rival === p.id ? ' <span class="pill r">RIVAL</span>' : '') + '</span><br><span class="s">' + (r.played ? 'Real ' + r.w + '-' + r.l + ' · #' + r.rank : 'No real results yet') + (pr ? ' · LV ' + levelOf(pr.xp).l : '') + '</span><br>' + stars(opts.sk) + '</span>' +
      '<span>' + (opts.tag || '') + '</span></button>';
  }
  function screenTour() {
    G.on = false; $('#hud').hidden = true;
    const list = tourList(), t = ME.tour, n = list.length;
    ui('<div class="scr">' + top(t.tier === 2 ? 'PRO TOUR' : 'LEAGUE TOUR', true) +
      '<p>Climb the real league, weakest record to strongest. The real #1 is the final boss. Stage surfaces rotate hard, clay, grass.' + (t.champs ? ' Tour titles: ' + t.champs + '.' : '') + '</p>' +
      '<div class="list">' + list.map((p, i) => { const sk = skillFor(p.id, t.tier, i, n); const st = i < t.stage ? 'done' : i === t.stage ? '' : 'locked'; return oppRow(p, i, { cls: st, locked: i > t.stage, sk, rank: i + 1, tag: i < t.stage ? '<span class="pill w">WON</span>' : i === t.stage ? '<span class="pill g">' + SURFACES[SURF_ORDER[i % 3]].n.split(' ')[0] + '</span>' : '<span class="pill">LOCKED</span>' }); }).join('') + '</div>' +
      '<div class="panel"><h3>PICK A RIVAL</h3><p>Beat your rival in any mode for +150 coins and bragging rights.</p><div class="swatches">' + list.map(p => '<button class="back" data-rival="' + p.id + '" style="' + (ME.rival === p.id ? 'border-color:var(--pink)' : '') + '">' + esc(pfirst(p.id).toUpperCase()) + '</button>').join('') + '</div></div></div>');
    wireBack();
    document.querySelectorAll('[data-opp]').forEach(b => b.onclick = () => { const i = Number(b.dataset.i); const id = Number(b.dataset.opp); startMatch({ mode: 'match', fmt: 'fast4', opp: id, skill: skillFor(id, t.tier, i, n), surface: SURF_ORDER[i % 3], tour: true, stage: i }); });
    document.querySelectorAll('[data-rival]').forEach(b => b.onclick = () => { const id = Number(b.dataset.rival); ME.rival = ME.rival === id ? 0 : id; commit(); screenTour(); });
  }
  function screenQuick() {
    const list = tourList(); const n = list.length;
    let surf = store.get('arcade:surf') || 'hard', fmt = store.get('arcade:fmt') || 'fast4';
    const draw = () => {
      ui('<div class="scr">' + top('QUICK MATCH', true) +
        '<div class="panel"><h3>FORMAT</h3><div class="grid2"><button class="btn' + (fmt === 'fast4' ? ' go' : '') + '" data-fmt="fast4">FAST4<small>First to 4 games</small></button><button class="btn' + (fmt === 'tb' ? ' go' : '') + '" data-fmt="tb">TIEBREAK<small>First to 7</small></button></div>' +
        '<h3>SURFACE</h3><div class="grid2">' + SURF_ORDER.map(s => '<button class="btn' + (surf === s ? ' go' : '') + '" data-surf="' + s + '">' + SURFACES[s].n + '</button>').join('') + '</div></div>' +
        '<div class="list">' + list.map((p, i) => oppRow(p, i, { sk: skillFor(p.id, ME.tour.tier, i, n), rank: (LG.real[p.id] || {}).played ? LG.real[p.id].rank : '-' })).join('') + '</div></div>');
      wireBack();
      document.querySelectorAll('[data-fmt]').forEach(b => b.onclick = () => { fmt = b.dataset.fmt; store.set('arcade:fmt', fmt); draw(); });
      document.querySelectorAll('[data-surf]').forEach(b => b.onclick = () => { surf = b.dataset.surf; store.set('arcade:surf', surf); draw(); });
      document.querySelectorAll('[data-opp]').forEach(b => b.onclick = () => { const i = Number(b.dataset.i), id = Number(b.dataset.opp); startMatch({ mode: 'match', fmt, opp: id, skill: skillFor(id, ME.tour.tier, i, n), surface: surf }); });
    };
    draw();
  }
  function screenShop() {
    const cost = k => 150 * ME.stats[k];
    const rackCost = i => 450 + 150 * i;
    const perkName = i => STAT_NAMES[PERK[i % 4]];
    const myAv = (LG.byId[ME.id] || {}).avatar || 0;
    ui('<div class="scr">' + top('PRO SHOP', true) +
      '<div class="panel"><h3>TRAINING</h3>' + PERK.map(k => '<div class="shop-item"><div><div class="nm-big" style="font-size:10px">' + STAT_NAMES[k] + ' ' + ME.stats[k] + '/10</div><div class="pips">' + Array.from({ length: 10 }, (_, i) => '<i class="' + (i < ME.stats[k] ? 'on' : '') + '"></i>').join('') + '</div><div class="sub">' + { pow: 'Faster groundstrokes', spd: 'Run faster, reach wider', ctl: 'Tighter aim, bigger perfect window', srv: 'Bigger serve, wider sweet zone' }[k] + '</div></div>' +
        (ME.stats[k] >= 10 ? '<button class="buy" disabled>MAX</button>' : '<button class="buy" data-train="' + k + '"' + (ME.coins < cost(k) ? ' disabled' : '') + '>' + cost(k) + '</button>') + '</div>').join('') + '</div>' +
      '<div class="panel"><h3>RACQUETS</h3><p>Each racquet adds +1 to one stat. Your league racquet is your signature.</p><div class="rack-grid">' + Array.from({ length: 8 }, (_, i) => {
        const own = ME.owned.includes(i), on = ME.racquet === i;
        return '<button class="rack' + (on ? ' on' : '') + '" data-rack="' + i + '">' + rimg(i) + '<span class="t">' + (i === myAv ? 'SIGNATURE' : 'MODEL ' + (i + 1)) + '<br>+1 ' + perkName(i) + '</span><span class="t" style="color:' + (on ? 'var(--yellow)' : own ? 'var(--green)' : 'var(--gold)') + '">' + (on ? 'EQUIPPED' : own ? 'EQUIP' : rackCost(i) + ' COINS') + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="panel"><h3>SHIRTS</h3><div class="swatches">' + SHIRTS.map((s, i) => { const own = ME.shirts.includes(i) || (s.req && ME.ach[s.req]); const bg = s.c === 'rainbow' ? 'linear-gradient(135deg,#ff5c8a,#ffd23f,#5cff8a,#45e0ff,#b476ff)' : s.c; return '<button class="sw' + (ME.shirt === i ? ' on' : '') + (own ? '' : ' lock') + '" data-shirt="' + i + '" title="' + esc(s.n + (own ? '' : s.req ? ' · ' + s.rq : ' · ' + s.cost + ' coins')) + '" style="background:' + bg + '"></button>'; }).join('') + '</div><p id="shirt-note">Tap a color. Locked ones show what they cost.</p></div></div>');
    wireBack();
    document.querySelectorAll('[data-train]').forEach(b => b.onclick = () => { const k = b.dataset.train; if (ME.coins < cost(k)) return; ME.coins -= cost(k); ME.stats[k]++; commit(); sfx.coin(); screenShop(); });
    document.querySelectorAll('[data-rack]').forEach(b => b.onclick = () => { const i = Number(b.dataset.rack); if (!ME.owned.includes(i)) { if (ME.coins < rackCost(i)) { toast('NOT ENOUGH COINS', 'Need ' + rackCost(i) + '. Win matches or claim real league bonuses.'); return; } ME.coins -= rackCost(i); ME.owned.push(i); sfx.coin(); } ME.racquet = i; commit(); screenShop(); });
    document.querySelectorAll('[data-shirt]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.shirt), s = SHIRTS[i]; const own = ME.shirts.includes(i) || (s.req && ME.ach[s.req]);
      if (!own) { if (s.req) { $('#shirt-note').textContent = s.n + ': ' + s.rq + ' to unlock.'; return; } if (ME.coins < s.cost) { $('#shirt-note').textContent = s.n + ' costs ' + s.cost + ' coins.'; return; } ME.coins -= s.cost; ME.shirts.push(i); sfx.coin(); }
      ME.shirt = i; commit(); screenShop();
    });
  }
  function screenAch() {
    ui('<div class="scr">' + top('TROPHIES', true) + '<div class="list">' + ACH.map(a => { const got = ME.ach[a[0]]; return '<div class="ach' + (got ? ' got' : '') + '"><span class="ic">' + (got ? '★' : '?') + '</span><span><span class="n">' + esc(got ? a[1] : '???') + '</span><br><span class="d">' + esc(a[2]) + '</span></span><span class="coins">' + a[3] + '</span></div>'; }).join('') + '</div></div>');
    wireBack();
  }
  async function screenLadder() {
    ui('<div class="scr">' + top('LADDER', true) + '<p>Loading the league ladder…</p></div>'); wireBack();
    await pull();
    const rows = LG.players.map(p => { const pr = profileOf(p.id); return { p, pr, lv: pr ? levelOf(pr.xp).l : 0, xp: pr ? pr.xp : 0 }; }).sort((a, b) => b.xp - a.xp);
    ui('<div class="scr">' + top('LADDER', true) +
      '<p>Everyone in the league, ranked by arcade XP. Real league rank shown for bragging rights.</p>' +
      '<div class="panel" style="overflow-x:auto"><table class="table"><thead><tr><th>#</th><th>PLAYER</th><th>LV</th><th>W-L</th><th>TOUR</th><th>TGT</th><th>REAL</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr class="' + (ME && r.p.id === ME.id ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(pfirst(r.p.id) + ' ' + plast(r.p.id).charAt(0) + '.') + '</td><td>' + (r.pr ? r.lv : '-') + '</td><td>' + (r.pr ? r.pr.w + '-' + r.pr.l : '-') + '</td><td>' + (r.pr ? (r.pr.tour.champs ? '★' + r.pr.tour.champs : r.pr.tour.stage) : '-') + '</td><td>' + (r.pr && r.pr.targets ? r.pr.targets : '-') + '</td><td>' + ((LG.real[r.p.id] || {}).played ? LG.real[r.p.id].rank : '-') + '</td></tr>').join('') +
      '</tbody></table></div><a class="btn" href="index.html#standings">REAL STANDINGS<span class="tag ok">LIVE</span></a></div>');
    wireBack();
  }
  function screenHowTo(first) {
    store.set('arcade:howto', '1');
    ui('<div class="scr">' + top('HOW TO PLAY', !first) +
      '<div class="panel howto">' +
      '<div><b>SERVE</b><span>Hold anywhere. Let go when the bar is in the green zone. Drag sideways while holding to aim wide or down the T.</span></div>' +
      '<div><b>HIT</b><span>Your player runs to the ball. Swipe up when the ring closes on the ball. Perfect timing hits harder and cleaner.</span></div>' +
      '<div><b>AIM</b><span>Swipe left or right to aim. A longer swipe goes deeper, but too long lands out.</span></div>' +
      '<div><b>POWER</b><span>A fast swipe is topspin. A slow swipe is slice.</span></div>' +
      '<div><b>DROP SHOT</b><span>A short flick up.</span></div>' +
      '<div><b>LOB</b><span>Swipe down.</span></div>' +
      '<div><b>CURVE</b><span>Swipe in an arc and the ball bends in the air.</span></div>' +
      '<div><b>SCORING</b><span>Fast4: first to 4 games, deciding point at deuce, tiebreak at 3-3. Same no-ad spirit as the league.</span></div>' +
      '<div><b>KEYBOARD</b><span>Space serve (hold). Arrows hit, Down lob, Z drop.</span></div></div>' +
      '<div class="panel"><h3>EARN MORE</h3><p>Win real league matches and enter the score on the site. Each real win pays 300 coins here. Bringing the balls pays 50.</p></div>' +
      '<button class="btn go" data-ok>' + (first ? 'LET\'S PLAY' : 'GOT IT') + '</button></div>');
    wireBack(); $('[data-ok]').onclick = screenHub;
  }
  function pause() {
    if (!G.on) return; G.paused = true;
    ui('<div class="scr dim"><h2 style="text-align:center;margin-top:30%">PAUSED</h2><button class="btn go" id="p-res">RESUME</button><button class="btn" id="p-how">HOW TO PLAY</button><button class="btn" id="p-quit">QUIT MATCH</button></div>');
    $('#p-res').onclick = () => { ui(''); G.paused = false; };
    $('#p-how').onclick = () => { screenHowTo(false); $('[data-ok]').onclick = () => { ui(''); G.paused = false; }; const b = $('[data-back]'); if (b) b.onclick = () => { ui(''); G.paused = false; }; };
    $('#p-quit').onclick = () => { G.on = false; G.paused = false; screenHub(); };
  }
  $('#pauseBtn').addEventListener('click', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.on && !G.paused) pause(); });

  /* =====================================================================
     11. BOOT
     ===================================================================== */
  let last = performance.now();
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(frame); }
  async function boot() {
    loadLeague(); resize(); addEventListener('resize', resize);
    SAVE.url = arcadeUrl();
    const meId = store.get('arcade:' + LG.slug + ':me');
    if (meId && LG.byId[Number(meId)]) loadMe(Number(meId));
    ME ? screenHub() : screenWho();
    requestAnimationFrame(frame);
    await refreshLeague(); await pull();
    if (ME) ME.name = pname(ME.id);
    if (!G.on && $('#ui').innerHTML && ME && document.querySelector('#b-tour')) screenHub();
  }
  window.__arcade = { update, G, ball, near, far, LG, SAVE, get ME() { return ME; }, startMatch, swingHuman, releaseServe, serveMeterVal, sweetZone, screenHub };
  boot();
})();
