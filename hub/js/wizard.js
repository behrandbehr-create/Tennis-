/* =====================================================================
   "Start a new league" wizard. Collects the league, the players and the
   schedule, then creates the league on the shared server and hands back
   a link to send out. No files, no uploads, no settings.
   ===================================================================== */
(function () {
  'use strict';
  const HUB = window.LEAGUE_HUB; const GEN = window.LeagueGenerator;
  const $ = s => document.querySelector(s); const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3G9FnmnAtJVrnrQzzqiZ1NoYfPk/';
  const W = { step: 1, matches: [], slug: '', created: null };
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000); }
  function digits(p) { return String(p || '').replace(/[^\d+]/g, ''); }
  function tel(p) { let d = digits(p); if (!d) return ''; if (d[0] !== '+' && d.length === 10) d = '+1' + d; return d; }
  function slugify(s) { return String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, ''); }
  const flex = () => $('#f-flex').value === 'true';
  const per = () => Number($('#f-type').value);

  /* ---------- step movement ---------- */
  function show(n) {
    W.step = n;
    ['step1', 'step2', 'step3', 'step4', 'done'].forEach((id, i) => $('#' + id).classList.toggle('hidden', i + 1 !== n));
    [1, 2, 3, 4].forEach(i => { const el = $('#s' + i); el.className = i < n ? 'done' : (i === n ? 'on' : ''); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (n === 4) summarize();
  }
  function showDone() { ['step1', 'step2', 'step3', 'step4'].forEach(id => $('#' + id).classList.add('hidden')); $('#done').classList.remove('hidden'); [1, 2, 3, 4].forEach(i => $('#s' + i).className = 'done'); window.scrollTo({ top: 0 }); }

  /* ---------- players ---------- */
  function playerRow(v) {
    v = v || {};
    const row = document.createElement('div'); row.className = 'prow';
    row.innerHTML = '<input class="p-name" placeholder="Full name" autocomplete="off" value="' + esc(v.name || '') + '">' +
      '<input class="p-phone" type="tel" placeholder="Phone" autocomplete="off" value="' + esc(v.phone || '') + '">' +
      '<input class="p-email" type="email" placeholder="Email" autocomplete="off" value="' + esc(v.email || '') + '">' +
      '<select class="p-role"><option value="player">Player</option><option value="sub"' + (v.role === 'sub' ? ' selected' : '') + '>Sub</option></select>' +
      '<button class="rm" type="button" title="Remove this person">×</button>';
    row.querySelector('.rm').onclick = () => { row.remove(); if (!$$('#players .prow').length) addRow(); };
    return row;
  }
  function addRow(v) { $('#players').appendChild(playerRow(v)); }
  function readPlayers() {
    const out = []; let id = 1, subs = 0;
    $$('#players .prow').forEach(r => {
      const name = r.querySelector('.p-name').value.trim(); if (!name) return;
      const role = r.querySelector('.p-role').value;
      if (role === 'sub') subs++;
      out.push({ id: id, num: role === 'sub' ? 'S' + subs : String(out.filter(p => p.role !== 'sub').length + 1), name: name, phone: r.querySelector('.p-phone').value.trim(), email: r.querySelector('.p-email').value.trim(), role: role, avatar: (id - 1) % 10, active: true });
      id++;
    });
    return out;
  }

  /* ---------- schedule ---------- */
  function build() {
    const players = readPlayers().filter(p => p.role !== 'sub');
    const first = $('#f-first').value, weeks = Number($('#f-weeks').value) || 1;
    if (!first) return toast('Pick the first match date');
    if (players.length < per()) return toast('You need at least ' + per() + ' players for ' + (per() === 2 ? 'singles' : 'doubles'));
    const skip = new Set($('#f-skip').value.split(',').map(s => s.trim()).filter(Boolean));
    W.matches = GEN.generate(players.map(p => p.id), per(), weeks, first, skip).map((m, i) => Object.assign({ id: i + 1 }, m));
    const byId = {}; players.forEach(p => byId[p.id] = p.name.split(' ')[0]);
    const counts = {}; W.matches.forEach(m => m.teamA.concat(m.teamB).forEach(x => counts[x] = (counts[x] || 0) + 1));
    const balls = {}; W.matches.forEach(m => balls[m.balls] = (balls[m.balls] || 0) + 1);
    const fmt = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
    $('#preview').classList.remove('hidden');
    $('#preview').innerHTML = W.matches.map(m => '<div><b>' + (flex() ? 'wk of ' : '') + esc(fmt(m.date)) + '</b><span>' + esc(m.teamA.map(x => byId[x]).join(' & ')) + ' vs ' + esc(m.teamB.map(x => byId[x]).join(' & ')) + ' · balls: ' + esc(byId[m.balls]) + '</span></div>').join('');
    $('#hint3').textContent = W.matches.length + ' weeks built. Matches per player: ' + players.map(p => p.name.split(' ')[0] + ' ' + (counts[p.id] || 0)).join(', ') + '.';
    $('#to4').classList.remove('hidden');
  }

  /* ---------- summary and creation ---------- */
  function leagueObject() {
    const players = readPlayers(); const name = $('#f-name').value.trim();
    const singles = per() === 2; const fx = flex();
    const rules = singles && fx ? [
      'Flex format: you and your opponent pick any day that week that works for both of you. Text them early in the week.',
      'Once you agree on a day and time, contact the organizer to have a court reserved.',
      'The player marked with the tennis ball brings a new can of balls.',
      'If you cannot play, it is up to you to find a substitute from the league.',
      'Enter your score right after the match so standings stay current.'
    ] : [
      'Matches are ' + (singles ? 'singles' : 'doubles') + (fx ? ', played any day that week' : ', ' + $('#f-day').value + 's') + '.',
      'The player marked with the tennis ball brings a new can of balls.',
      'If you cannot make your week, find a substitute and update the lineup here.',
      'Enter the score right after the match so standings stay current.'
    ];
    return {
      name: name, tagline: (singles ? 'Singles' : 'Doubles') + ' at ' + ($('#f-venue').value.trim() || 'the club') + (fx ? '. One opponent a week, play any day that suits you both' : ''),
      season: $('#f-season').value.trim(), venue: $('#f-venue').value.trim(), venueAddress: '',
      dayOfWeek: fx ? 'Any day' : $('#f-day').value, startTime: $('#f-start').value || '19:00', endTime: $('#f-end').value || '20:30',
      timeZone: $('#f-tz').value, phoneCountryCode: '+1', playersPerMatch: per(), flex: fx,
      editPin: $('#f-pin').value.trim(), syncUrl: HUB.api + '?league=' + W.slug,
      organizer: { name: $('#f-org').value.trim(), phone: $('#f-orgphone').value.trim(), email: $('#f-orgemail').value.trim() },
      rules: rules,
      announcements: [{ date: new Date().toISOString().slice(0, 10), text: 'Welcome to ' + name + '. Check the schedule for your weeks and who brings balls. Enter your score right after each match.' }],
      players: players, matches: W.matches, updatedAt: new Date().toISOString()
    };
  }
  function summarize() {
    const players = readPlayers(); const singles = per() === 2;
    const row = (k, v) => '<div><b>' + esc(k) + '</b><span>' + esc(v) + '</span></div>';
    $('#summary').innerHTML =
      row('League', $('#f-name').value.trim() || '(no name yet)') +
      row('Season', $('#f-season').value.trim() || '—') +
      row('Format', (singles ? 'Singles' : 'Doubles') + (flex() ? ', flex weeks' : ', ' + $('#f-day').value + 's ' + $('#f-start').value)) +
      row('Players', players.filter(p => p.role !== 'sub').length + (players.some(p => p.role === 'sub') ? ' plus ' + players.filter(p => p.role === 'sub').length + ' sub' : '')) +
      row('Weeks', W.matches.length) +
      row('Organizer', $('#f-org').value.trim() || '—');
  }
  async function slugFree(slug) {
    try { const r = await fetch(HUB.api + '?league=' + slug, { cache: 'no-store' }); if (!r.ok) return true; const b = await r.json(); return !b.data; } catch (e) { return true; }
  }
  async function pickSlug(name) {
    const base = slugify(name) || 'league'; if (await slugFree(base)) return base;
    for (let i = 2; i < 40; i++) { const t = base + '-' + i; if (await slugFree(t)) return t; }
    return base + '-' + Date.now().toString(36).slice(-4);
  }
  async function create() {
    const btn = $('#create'); const name = $('#f-name').value.trim();
    if (!name) { show(1); return toast('Your league needs a name'); }
    if (!W.matches.length) { show(3); return toast('Build the schedule first'); }
    btn.disabled = true; btn.textContent = 'Creating…'; $('#hint4').textContent = '';
    try {
      W.slug = await pickSlug(name);
      const data = leagueObject();
      const r = await fetch(HUB.api + '?league=' + W.slug, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseVersion: 0, data: data }) });
      if (!r.ok) throw new Error('server said ' + r.status);
      W.created = data;
      const url = location.href.replace(/start\.html.*$/, '') + '?league=' + W.slug;
      $('#done-link').textContent = url; $('#open-league').href = url;
      const msg = name + ' is online: ' + url + '\n\nYou can see the schedule, who you play, who brings balls, and everyone\'s phone and email. Enter your score right after each match. Tip: add it to your phone\'s home screen.';
      $('#msg-preview').textContent = msg;
      const nums = readPlayers().map(p => tel(p.phone)).filter(Boolean);
      $('#text-players').href = nums.length ? (isIOS ? 'sms:/open?addresses=' + nums.join(',') + '&body=' + encodeURIComponent(msg) : 'sms:' + nums.join(',') + '?body=' + encodeURIComponent(msg)) : '#';
      if (!nums.length) { $('#text-players').classList.add('hidden'); }
      const pc = $('#print-card'); if (pc) pc.href = 'print/player-card.html?league=' + encodeURIComponent(W.slug);
      $('#copy-link').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { toast('Press and hold the link to copy it'); } };
      showDone();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Create my league';
      $('#hint4').textContent = 'Could not reach the league server (' + e.message + '). Check your connection and try again. Nothing was lost.';
    }
  }

  /* ---------- validation ---------- */
  function guard(n) {
    if (n >= 2 && !$('#f-name').value.trim()) { $('#hint1').textContent = 'Give the league a name first.'; return false; }
    $('#hint1').textContent = '';
    if (n >= 3) {
      const ps = readPlayers().filter(p => p.role !== 'sub');
      if (ps.length < per()) { $('#hint2').textContent = 'Add at least ' + per() + ' players for ' + (per() === 2 ? 'singles' : 'doubles') + '.'; return false; }
      $('#hint2').textContent = '';
      if (!$('#f-first').value) $('#f-first').value = GEN.nextWeekday(flex() ? 'Monday' : $('#f-day').value);
    }
    if (n >= 4 && !W.matches.length) { toast('Build the schedule first'); return false; }
    return true;
  }

  /* ---------- wire up ---------- */
  function init() {
    const logo = $('#wiz-logo'); logo.src = CDN + 'e8a3764d-4c48-4bf9-b7e8-c1a31ad8b2be.png'; logo.onerror = () => { logo.onerror = null; logo.src = 'assets/club-logo.png'; };
    for (let i = 0; i < 4; i++) addRow();
    $('#add-player').onclick = e => { e.preventDefault(); addRow(); };
    $('#add-sub').onclick = e => { e.preventDefault(); addRow({ role: 'sub' }); };
    $$('[data-next]').forEach(b => b.onclick = () => { const n = Number(b.dataset.next); if (guard(n)) show(n); });
    $$('[data-back]').forEach(b => b.onclick = () => show(Number(b.dataset.back)));
    $('#build').onclick = e => { e.preventDefault(); build(); };
    $('#to4').onclick = () => { if (guard(4)) show(4); };
    $('#create').onclick = e => { e.preventDefault(); create(); };
    const syncFlex = () => { const fx = flex(); ['wrap-day', 'wrap-start', 'wrap-end'].forEach(id => $('#' + id).classList.toggle('hidden', fx)); $('#wrap-first').childNodes[0].nodeValue = fx ? 'First week starts (Monday)' : 'First match date'; };
    $('#f-flex').onchange = () => { syncFlex(); $('#f-first').value = GEN.nextWeekday(flex() ? 'Monday' : $('#f-day').value); };
    $('#f-day').onchange = () => { if (!flex()) $('#f-first').value = GEN.nextWeekday($('#f-day').value); };
    syncFlex();
    $('#f-first').value = GEN.nextWeekday('Wednesday');
    show(1);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
