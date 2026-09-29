/* =====================================================================
   Directory page: the list of leagues shown when no league is in the
   address. Reads the shared server, falls back to a saved copy so the
   page still works on a bad connection.
   ===================================================================== */
(function () {
  'use strict';
  const HUB = window.LEAGUE_HUB; if (!HUB) return;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3G9FnmnAtJVrnrQzzqiZ1NoYfPk/';
  const LOGO = { remote: CDN + 'e8a3764d-4c48-4bf9-b7e8-c1a31ad8b2be.png', local: 'assets/club-logo.png' };
  const CACHE = 'league-directory-v1';

  function card(l) {
    const when = l.updatedAt ? new Date(l.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
    const bits = [l.season, l.playersPerMatch === 2 ? 'Singles' : 'Doubles', l.flex ? 'Flex weeks' : (l.dayOfWeek ? l.dayOfWeek + 's' : '')].filter(Boolean).join(' · ');
    return '<a class="hub-card" href="?league=' + encodeURIComponent(l.slug) + '">' +
      '<span class="hub-card-main"><b>' + esc(l.name || l.slug) + '</b><small>' + esc(bits) + '</small></span>' +
      '<span class="hub-card-meta">' + (l.players ? l.players + ' players' : '') + (when ? '<small>updated ' + esc(when) + '</small>' : '') + '</span></a>';
  }
  function paint(list) {
    const box = $('#hub-list'); if (!box) return;
    if (!list || !list.length) { box.innerHTML = '<div class="hub-empty">No leagues yet. Press <b>Start a new league</b> below and you will have one in a few minutes.</div>'; return; }
    list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    box.innerHTML = list.map(card).join('');
  }
  async function load() {
    const box = $('#hub-list'); if (box) box.innerHTML = '<div class="hub-loading">Loading leagues…</div>';
    try {
      const r = await fetch(HUB.leaguesUrl, { cache: 'no-store' }); if (!r.ok) throw new Error('status ' + r.status);
      const body = await r.json(); const list = (body.leagues || []).filter(l => (l.players || 0) > 0 || (l.matches || 0) > 0);
      try { localStorage.setItem(CACHE, JSON.stringify(list)); } catch (e) { }
      paint(list);
    } catch (e) {
      let saved = null; try { saved = JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch (err) { }
      if (saved && saved.length) { paint(saved); const b = $('#hub-list'); if (b) b.insertAdjacentHTML('afterbegin', '<div class="hub-empty">Showing the list saved on this phone. Pull to refresh when you are back online.</div>'); }
      else if (box) box.innerHTML = '<div class="hub-empty">Could not reach the league server. Check your connection and press Refresh.</div>';
    }
  }
  function render() {
    document.documentElement.classList.add('hub-mode');
    const el = $('#hub-landing'); if (el) el.classList.remove('hidden');
    const img = $('#hub-logo'); if (img && !img.src) { img.src = LOGO.remote; img.onerror = () => { img.onerror = null; img.src = LOGO.local; }; }
    const rb = $('#hub-refresh'); if (rb) rb.onclick = load;
    document.title = 'Tennis Leagues';
    load();
  }
  window.LeagueHub = { render, load };
})();
