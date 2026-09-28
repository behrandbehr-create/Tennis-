/* =====================================================================
   League Arcade on the league site: a Home teaser and an arcade ladder
   under Standings. Reads the "<league>-arcade" slot on the same shared
   data server the scores use. Read only; the game itself does the saving.
   ===================================================================== */
(function () {
  'use strict';
  function arcadeUrl(syncUrl) {
    if (!syncUrl) return '';
    try { const x = new URL(syncUrl); x.searchParams.set('league', ((x.searchParams.get('league') || 'default') + '-arcade').slice(0, 49)); return x.toString(); } catch (e) { return ''; }
  }
  function levelOf(xp) { let l = 1, need = 250, acc = 0; while (xp >= acc + need && l < 50) { acc += need; l++; need = 250 + 100 * (l - 1); } return l; }
  let profiles = {};
  async function load() {
    const L = window.League; if (!L || !L.S.data) return;
    const u = arcadeUrl(L.S.data.syncUrl);
    if (u) { try { const r = await fetch(u, { cache: 'no-store' }); const b = await r.json(); profiles = (b.data && b.data.arcade && b.data.arcade.profiles) || {}; } catch (e) { /* offline: keep what we had */ } }
    render();
  }
  function rows() {
    const L = window.League;
    return L.activePlayers().map(p => ({ p, a: profiles[p.id] })).filter(r => r.a).sort((x, y) => (y.a.xp || 0) - (x.a.xp || 0));
  }
  function render() {
    const L = window.League; if (!L || !L.S.data) return; const esc = L.esc;
    const list = rows();
    const home = document.getElementById('arcade-home');
    if (home) {
      const top3 = list.slice(0, 3);
      home.innerHTML = '<div class="card arcade-card"><div class="arcade-copy"><p>Play the league in a retro tennis game. Every opponent is a real league player, and every real win you enter here pays out coins in the game.</p>' +
        (top3.length ? '<ol class="arcade-top">' + top3.map(r => '<li>' + L.avatarHTML(r.p, 'small', r.p.id) + '<span><b>' + esc(r.p.name) + '</b><small>Level ' + levelOf(r.a.xp || 0) + ' · ' + (r.a.w || 0) + '-' + (r.a.l || 0) + ' arcade</small></span></li>').join('') + '</ol>' : '<p class="arcade-empty">Nobody has played yet. First one on the ladder gets bragging rights.</p>') +
        '</div><a class="btn primary" href="arcade.html">Play League Arcade</a></div>';
    }
    const st = document.getElementById('arcade-standings');
    if (st) {
      st.innerHTML = list.length ? '<div style="overflow-x:auto"><table class="table"><thead><tr><th></th><th>Player</th><th>Level</th><th>Arcade W-L</th><th class="hide-m">Tour</th><th class="hide-m">Targets</th></tr></thead><tbody>' +
        list.map((r, i) => '<tr><td><span class="rank">' + (i + 1) + '</span></td><td><span class="player-line">' + L.avatarHTML(r.p, 'small', r.p.id) + '<span class="name">' + esc(r.p.name) + '</span></span></td><td>' + levelOf(r.a.xp || 0) + '</td><td>' + (r.a.w || 0) + '-' + (r.a.l || 0) + '</td><td class="hide-m">' + (r.a.tour && r.a.tour.champs ? 'Champion x' + r.a.tour.champs : 'Stage ' + ((r.a.tour && r.a.tour.stage) || 0)) + '</td><td class="hide-m">' + (r.a.targets || '-') + '</td></tr>').join('') +
        '</tbody></table></div>' : '<div class="card" style="color:var(--muted)">No arcade games yet. <a href="arcade.html">Be the first on the ladder.</a></div>';
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(load, 1500);
    setInterval(() => { if (document.visibilityState === 'visible') load(); }, 90000);
    window.addEventListener('hashchange', render);
  });
})();
