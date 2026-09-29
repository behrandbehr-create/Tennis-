/* =====================================================================
   Balanced schedule generator, shared by the league site and the
   "Start a new league" wizard.
   ids   : player id numbers in the rotation
   per   : 4 for doubles, 2 for singles
   weeks : how many match weeks to build
   start : first date, YYYY-MM-DD
   skip  : a Set of YYYY-MM-DD dates to skip (holidays)
   Everyone plays about the same number of times, partners and opponents
   are mixed, and ball duty is spread evenly.
   ===================================================================== */
(function () {
  'use strict';
  function generate(ids, per, weeks, start, skip) {
    skip = skip || new Set();
    const plays = {}, balls = {}; ids.forEach(i => { plays[i] = 0; balls[i] = 0; });
    const key = (a, b) => a < b ? a + '-' + b : b + '-' + a; const pc = {}, oc = {};
    let [y, m, dd] = start.split('-').map(Number); let dt = new Date(Date.UTC(y, m - 1, dd)); const out = []; let made = 0, guard = 0;
    while (made < weeks && guard++ < weeks * 4) {
      const iso = dt.toISOString().slice(0, 10); dt.setUTCDate(dt.getUTCDate() + 7); if (skip.has(iso)) continue;
      const order = ids.slice().sort((a, b) => plays[a] - plays[b] || (made + ids.indexOf(a)) % ids.length - (made + ids.indexOf(b)) % ids.length);
      const pick = order.slice(0, per); pick.forEach(i => plays[i]++);
      let teamA, teamB;
      if (per === 4) {
        const combos = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]; let best = null, bestCost = 1e9;
        combos.forEach(c => { const a = [pick[c[0][0]], pick[c[0][1]]], b2 = [pick[c[1][0]], pick[c[1][1]]]; let cost = (pc[key(a[0], a[1])] || 0) * 3 + (pc[key(b2[0], b2[1])] || 0) * 3; a.forEach(p1 => b2.forEach(p2 => cost += oc[key(p1, p2)] || 0)); if (cost < bestCost) { bestCost = cost; best = [a, b2]; } });
        teamA = best[0]; teamB = best[1];
        pc[key(teamA[0], teamA[1])] = (pc[key(teamA[0], teamA[1])] || 0) + 1; pc[key(teamB[0], teamB[1])] = (pc[key(teamB[0], teamB[1])] || 0) + 1;
        teamA.forEach(p1 => teamB.forEach(p2 => oc[key(p1, p2)] = (oc[key(p1, p2)] || 0) + 1));
      } else { teamA = [pick[0]]; teamB = [pick[1]]; }
      // ball duty goes to whoever is furthest below their fair share
      const bringer = pick.slice().sort((a, b) => (balls[a] / Math.max(1, plays[a])) - (balls[b] / Math.max(1, plays[b])) || balls[a] - balls[b])[0];
      balls[bringer]++;
      out.push({ date: iso, teamA, teamB, balls: bringer, status: 'scheduled', sets: [], note: '' }); made++;
    }
    return out;
  }
  function nextWeekday(name, fromISO) {
    const idx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(name);
    const t = fromISO || new Date().toISOString().slice(0, 10); const [y, m, dd] = t.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, dd));
    if (idx >= 0) { let diff = (idx - dt.getUTCDay() + 7) % 7; if (!diff) diff = 7; dt.setUTCDate(dt.getUTCDate() + diff); }
    return dt.toISOString().slice(0, 10);
  }
  window.LeagueGenerator = { generate, nextWeekday };
})();
