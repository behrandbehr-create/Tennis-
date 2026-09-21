/* =====================================================================
   League site app. No build step, no framework. Works from a folder
   (double-click index.html) or from any static web host.
   ===================================================================== */
(function () {
  'use strict';

  /* ---------- artwork (hosted copies first, local fallbacks second) ---------- */
  const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3G9FnmnAtJVrnrQzzqiZ1NoYfPk/';
  const ART = {
    racquets: [
      ['50f68d68-b8d1-4731-98c7-483a0bf4178e.webp', 'assets/racquet-0.webp'],
      ['112df760-8bb0-4f86-a795-4e8f3a52f54e.webp', 'assets/racquet-1.webp'],
      ['33c56a14-4fb1-4572-ad1b-6737b7161422.webp', 'assets/racquet-2.webp'],
      ['85e22277-c571-44e2-ad4f-ed86a1f15e9c.webp', 'assets/racquet-3.webp'],
      ['2cb8fe9e-5cc4-42e3-9b30-e6e2c82ac155.webp', 'assets/racquet-4.webp'],
      ['23fcc97b-9cac-4e17-b924-acf9c7f9b83e.webp', 'assets/racquet-5.webp'],
      ['3bb96e1e-4fbb-4e57-8709-bf9bb3c16017.webp', 'assets/racquet-6.webp'],
      ['aa29571f-d2e9-4265-a7a7-2056b175932c.webp', 'assets/racquet-7.webp'],
      ['04177571-ff75-40df-8a28-81e6d26ee8d4.webp', 'assets/racquet-0.webp'],
      ['fba6cac9-2556-466f-87c7-2c3734ff60dd.webp', 'assets/racquet-1.webp']
    ].map(([r, l]) => ({ remote: CDN + r, local: l })),
    ball: { remote: CDN + 'a01e0a84-f620-4702-932d-e5829e9dc60d.webp', local: 'assets/ball-fallback.webp' },
    crest: { remote: CDN + 'f3704c93-f42f-4197-8bb3-e2dac3bcd4bd.webp', local: 'assets/crest-fallback.webp' },
    hero: { remote: CDN + '66b584c6-68c9-49f5-84ef-333d82161a80.webp', local: 'assets/court-poster.jpg' },
    heroVideo: { remote: 'https://d8j0ntlcm91z4.cloudfront.net/user_3G9FnmnAtJVrnrQzzqiZ1NoYfPk/hf_20260920_235839_24a91b09-114a-4d69-982a-45be16f01a5b.mp4', local: 'assets/court-loop.mp4' }
  };
  const isFile = location.protocol === 'file:';
  function artSrc(a) { return isFile && a.local ? a.local : (a.remote || a.local); }
  function artImg(img, a, alt) {
    img.alt = alt || '';
    img.src = artSrc(a);
    if (a.local && img.src.indexOf(a.local) < 0) img.onerror = () => { img.onerror = null; img.src = a.local; };
  }
  function racquetArt(i) { const n = ART.racquets.length; return ART.racquets[((i % n) + n) % n]; }

  /* ---------- state ---------- */
  const STORE_KEY = 'league-data-v1';
  const S = { data: null, source: 'file', page: 'home', view: 'list', filterPlayer: 0, filterMonth: '' };

  function deep(o) { return JSON.parse(JSON.stringify(o)); }
  function loadData() {
    const base = deep(window.LEAGUE || {});
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // local edits win only when they are newer than the shipped file
        if (!base.updatedAt || !saved.updatedAt || saved.updatedAt >= base.updatedAt) { S.data = saved; S.source = 'device'; return; }
      }
    } catch (e) { /* ignore */ }
    S.data = base; S.source = 'file';
  }
  function normalize(d) {
    d.players = (d.players || []).map(p => Object.assign({ role: 'player', active: true, avatar: 0, phone: '', email: '', num: '' }, p));
    d.matches = (d.matches || []).map(m => Object.assign({ teamA: [], teamB: [], sets: [], status: 'scheduled', note: '' }, m));
    d.matches.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    d.announcements = d.announcements || []; d.rules = d.rules || [];
    d.playersPerMatch = d.playersPerMatch || 4; d.timeZone = d.timeZone || 'America/Denver';
    d.startTime = d.startTime || '19:00'; d.endTime = d.endTime || '20:30';
    return d;
  }
  function save(note) {
    S.data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S.data)); S.source = 'device'; } catch (e) { toast('Could not save on this device'); }
    if (note !== false) toast(note || 'Saved on this device');
    renderAll();
    if (S.data.syncUrl) pushSync();
  }

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const player = id => S.data.players.find(p => p.id === id);
  const pname = id => { const p = player(id); return p ? p.name : 'Open slot'; };
  const pshort = id => { const p = player(id); if (!p) return 'Open'; const first = p.name.split(' ')[0]; const clash = S.data.players.some(q => q.id !== p.id && q.active !== false && q.name.split(' ')[0] === first); return clash && p.name.split(' ')[1] ? first + ' ' + p.name.split(' ')[1][0] + '.' : first; };
  const activePlayers = () => S.data.players.filter(p => p.active !== false);
  function todayISO() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: S.data.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function dateParts(iso) { const [y, m, d] = iso.split('-').map(Number); return { y, m, d, dt: new Date(Date.UTC(y, m - 1, d, 12)) }; }
  function fmtDate(iso, opt) { const { dt } = dateParts(iso); return dt.toLocaleDateString('en-US', Object.assign({ timeZone: 'UTC' }, opt || { weekday: 'long', month: 'long', day: 'numeric' })); }
  function dow(iso) { return dateParts(iso).dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }); }
  function time12(t) { if (!t) return ''; const [h, m] = t.split(':').map(Number); return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h >= 12 ? ' pm' : ' am'); }
  function digits(ph) { return String(ph || '').replace(/[^\d+]/g, ''); }
  function telNum(ph) { let d = digits(ph); if (!d) return ''; if (d[0] !== '+') { const cc = S.data.phoneCountryCode || '+1'; if (cc === '+1' && d.length === 10) d = cc + d; else if (cc && d.length <= 10) d = cc + d; } return d; }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function smsLink(nums, body) {
    const list = nums.map(telNum).filter(Boolean); if (!list.length) return '';
    const b = body ? encodeURIComponent(body) : '';
    if (list.length === 1) return 'sms:' + list[0] + (b ? (isIOS ? '&' : '?') + 'body=' + b : '');
    return isIOS ? 'sms:/open?addresses=' + list.join(',') + (b ? '&body=' + b : '') : 'sms:' + list.join(',') + (b ? '?body=' + b : '');
  }
  function mailLink(emails, subject, body) { const l = emails.filter(Boolean); if (!l.length) return ''; return 'mailto:' + l.join(',') + '?subject=' + encodeURIComponent(subject || S.data.name) + (body ? '&body=' + encodeURIComponent(body) : ''); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600); }
  function download(name, content, type) { const url = URL.createObjectURL(new Blob([content], { type: type || 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  function statusLabel(m) { return { scheduled: 'Scheduled', played: 'Final', unfinished: 'Unfinished', canceled: 'Canceled', rescheduled: 'Rescheduled' }[m.status] || m.status; }
  function lineup(m) { return m.teamA.concat(m.teamB); }

  /* ---------- scoring ---------- */
  function setWinner(s) { if (s.a === s.b) return 0; return s.a > s.b ? 1 : 2; }
  function matchResult(m) { let a = 0, b = 0; for (const s of m.sets || []) { const w = setWinner(s); if (w === 1) a++; else if (w === 2) b++; } return a === b ? 0 : (a > b ? 1 : 2); }
  function scoreText(m) { return (m.sets || []).map(s => s.a + '-' + s.b + (s.tb ? ' (TB)' : '')).join(', '); }
  function validateSets(sets, status) {
    const warn = [];
    sets.forEach((s, i) => {
      if (s.a < 0 || s.b < 0) warn.push('Set ' + (i + 1) + ': scores cannot be negative.');
      if (s.tb) { const hi = Math.max(s.a, s.b), lo = Math.min(s.a, s.b); if (status === 'played' && (hi < 7 || hi - lo < 2)) warn.push('Set ' + (i + 1) + ': a match tiebreak normally ends at 7 or 10 points with a 2-point margin.'); }
      else { const hi = Math.max(s.a, s.b), lo = Math.min(s.a, s.b); const ok = (hi === 6 && lo <= 4) || (hi === 7 && (lo === 5 || lo === 6)); if (status === 'played' && !ok) warn.push('Set ' + (i + 1) + ' (' + s.a + '-' + s.b + '): a finished set is usually 6-0 to 6-4, 7-5 or 7-6. Use "Unfinished" if time ran out.'); if (hi > 9) warn.push('Set ' + (i + 1) + ': more than 9 games in a set looks like a typo.'); }
    });
    if (status === 'played' && sets.length && matchResult({ sets }) === 0) warn.push('Sets are tied, so nobody wins this match. Add a tiebreak set or mark it Unfinished.');
    if (status === 'played' && !sets.length) warn.push('Enter at least one set before marking the match Played.');
    return warn;
  }
  function standings() {
    const rows = {};
    S.data.players.forEach(p => rows[p.id] = { p, played: 0, w: 0, l: 0, setsW: 0, setsL: 0, gamesW: 0, gamesL: 0, balls: 0, form: [], scheduled: 0 });
    for (const m of S.data.matches) {
      lineup(m).forEach(id => { if (rows[id] && m.status !== 'canceled') rows[id].scheduled++; });
      if (rows[m.balls] && m.status !== 'canceled') rows[m.balls].balls++;
      if (m.status !== 'played') continue;
      const res = matchResult(m); if (!res) continue;
      const side = id => (m.teamA.includes(id) ? 1 : (m.teamB.includes(id) ? 2 : 0));
      lineup(m).forEach(id => {
        const r = rows[id]; if (!r) return; const sd = side(id); r.played++;
        const won = sd === res; if (won) r.w++; else r.l++; r.form.push(won ? 'w' : 'l');
        for (const s of m.sets) { const w = setWinner(s); if (w) { if (w === sd) r.setsW++; else r.setsL++; } if (!s.tb) { r.gamesW += sd === 1 ? s.a : s.b; r.gamesL += sd === 1 ? s.b : s.a; } }
      });
    }
    const list = Object.values(rows).filter(r => r.p.active !== false || r.played);
    list.forEach(r => { r.pct = r.played ? r.w / r.played : 0; r.setDiff = r.setsW - r.setsL; r.gameDiff = r.gamesW - r.gamesL; });
    list.sort((a, b) => b.w - a.w || b.pct - a.pct || b.setDiff - a.setDiff || b.gameDiff - a.gameDiff || a.p.name.localeCompare(b.p.name));
    return list;
  }

  /* ---------- components ---------- */
  function avatarHTML(p, cls, seed) {
    const idx = p ? p.avatar : 0; const a = racquetArt(idx); const d = ((seed != null ? seed : (p ? p.id : 0)) % 7) * -0.9;
    return '<span class="avatar ' + (cls || '') + '" style="--delay:' + d + 's;--spin-time:' + (6 + ((p ? p.id : 0) % 4)) + 's" data-avatar="' + (p ? p.id : 0) + '">' +
      '<span class="ring two"></span><span class="disc"></span><span class="ring"></span>' +
      '<span class="spin"><img src="' + artSrc(a) + '" data-fallback="' + a.local + '" alt="" loading="lazy"></span>' +
      '<span class="orb"><i style="background-image:url(' + artSrc(ART.ball) + ')"></i></span></span>';
  }
  function ballHTML(cls) { return '<span class="ball ' + (cls || '') + '"><img src="' + artSrc(ART.ball) + '" data-fallback="' + ART.ball.local + '" alt=""></span>'; }
  function playerLine(id, m) {
    const p = player(id); const isBall = m && m.balls === id;
    return '<span class="player-line">' + avatarHTML(p, 'small', id) + '<span class="name">' + esc(pname(id)) + (p && p.num ? ' <span class="num">#' + esc(p.num) + '</span>' : '') + '</span>' + (isBall ? ballHTML() : '') + '</span>';
  }
  function scoreHTML(m) {
    if (!(m.sets && m.sets.length)) return '';
    const res = matchResult(m);
    return '<div class="score">' + m.sets.map(s => { const w = setWinner(s); return '<span class="set' + (w && w === res ? ' won' : '') + '">' + s.a + '<span style="opacity:.4">:</span>' + s.b + (s.tb ? '<span class="tb">TB</span>' : '') + '</span>'; }).join('') + (res ? '<span style="font-size:.9rem;font-family:var(--body);font-weight:700;color:var(--muted)">' + (res === 1 ? 'Team A' : 'Team B') + ' wins</span>' : '') + '</div>';
  }
  function matchCard(m, opts) {
    opts = opts || {}; const today = todayISO(); const isToday = m.date === today;
    const status = m.status; const pill = isToday && status !== 'canceled' && status !== 'played' ? '<span class="pill today">Tonight</span>' : (opts.next ? '<span class="pill next">Up next</span>' : '<span class="pill ' + status + '">' + statusLabel(m) + '</span>');
    const nums = lineup(m).map(id => player(id)).filter(Boolean).map(p => p.phone).filter(Boolean);
    const body = 'Hey all, reminder: ' + (S.data.name) + ' ' + fmtDate(m.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + time12(m.startTime || S.data.startTime) + '. ' + pname(m.teamA[0]) + ' & ' + pname(m.teamA[1]) + ' vs ' + pname(m.teamB[0]) + ' & ' + pname(m.teamB[1]) + '. Balls: ' + pname(m.balls) + '.';
    return '<article class="card tilt match' + (opts.next ? ' next' : '') + '" data-match="' + m.id + '">' +
      '<div class="date"><div class="mon">' + fmtDate(m.date, { month: 'short' }) + '</div><div class="day">' + dateParts(m.date).d + '</div><div class="dow">' + dow(m.date) + '</div><div class="time">' + time12(m.startTime || S.data.startTime) + '</div></div>' +
      '<div><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">' + pill + (m.originalDate && m.originalDate !== m.date ? '<span class="pill rescheduled">moved from ' + fmtDate(m.originalDate, { month: 'short', day: 'numeric' }) + '</span>' : '') + '</div>' +
      '<div class="teams"><div class="team">' + m.teamA.map(id => playerLine(id, m)).join('') + '</div><div class="vs">vs</div><div class="team">' + m.teamB.map(id => playerLine(id, m)).join('') + '</div></div>' +
      scoreHTML(m) +
      '<div class="match-meta"><span class="balls-chip">' + ballHTML() + ' Balls: ' + esc(pshort(m.balls)) + '</span>' + (m.note ? '<span>' + esc(m.note) + '</span>' : '') + '</div>' +
      (opts.compact ? '' : '<div class="match-actions"><button class="btn court small" data-act="score" data-id="' + m.id + '">' + (m.sets && m.sets.length ? 'Edit score' : 'Enter score') + '</button><button class="btn soft small" data-act="lineup" data-id="' + m.id + '">Change lineup</button>' + (nums.length ? '<a class="btn soft small" href="' + smsLink(nums, body) + '">Text the four</a>' : '') + '<button class="btn soft small" data-act="ics" data-id="' + m.id + '">Calendar</button></div>') +
      '</div></article>';
  }

  /* ---------- calendar (.ics) ---------- */
  function tzOffsetMinutes(iso, time, tz) {
    try { const [h, mi] = time.split(':').map(Number); const { y, m, d } = dateParts(iso); const guess = new Date(Date.UTC(y, m - 1, d, h, mi)); const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(guess); const off = (parts.find(p => p.type === 'timeZoneName') || {}).value || 'GMT'; const mm = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(off); if (!mm) return 0; return (mm[1] === '-' ? -1 : 1) * (Number(mm[2]) * 60 + Number(mm[3] || 0)); } catch (e) { return 0; }
  }
  function icsStamp(iso, time) { const off = tzOffsetMinutes(iso, time, S.data.timeZone); const [h, mi] = time.split(':').map(Number); const { y, m, d } = dateParts(iso); const dt = new Date(Date.UTC(y, m - 1, d, h, mi) - off * 60000); return dt.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'; }
  function icsFor(matches) {
    const escT = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;');
    const ev = matches.filter(m => m.status !== 'canceled').map(m => ['BEGIN:VEVENT', 'UID:league-' + m.id + '-' + m.date + '@' + (location.host || 'tennis-league'), 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', 'DTSTART:' + icsStamp(m.date, m.startTime || S.data.startTime), 'DTEND:' + icsStamp(m.date, m.endTime || S.data.endTime), 'SUMMARY:' + escT(S.data.name + ': ' + pshort(m.teamA[0]) + ' & ' + pshort(m.teamA[1]) + ' vs ' + pshort(m.teamB[0]) + ' & ' + pshort(m.teamB[1])), 'DESCRIPTION:' + escT('Balls: ' + pname(m.balls) + (m.note ? '. ' + m.note : '') + '. Check the league site for changes.'), S.data.venue ? 'LOCATION:' + escT(S.data.venue + (S.data.venueAddress ? ', ' + S.data.venueAddress : '')) : '', 'END:VEVENT'].filter(Boolean).join('\r\n'));
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//League Site//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + escT(S.data.name)].concat(ev, ['END:VCALENDAR']).join('\r\n');
    return out.split('\r\n').map(l => l.length > 72 ? l.match(/.{1,72}/g).join('\r\n ') : l).join('\r\n');
  }
  function icsBlobURL(matches) { return URL.createObjectURL(new Blob([icsFor(matches)], { type: 'text/calendar;charset=utf-8' })); }

  /* ---------- vCard ---------- */
  function vcard(p) { return ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + p.name.split(' ').slice(1).join(' ') + ';' + p.name.split(' ')[0] + ';;;', 'FN:' + p.name, p.phone ? 'TEL;TYPE=CELL:' + telNum(p.phone) : '', p.email ? 'EMAIL:' + p.email : '', 'NOTE:' + S.data.name + (p.num ? ' #' + p.num : ''), 'END:VCARD'].filter(Boolean).join('\r\n'); }

  /* ---------- rendering: home ---------- */
  function nextMatch() { const t = todayISO(); return S.data.matches.find(m => m.date >= t && m.status !== 'canceled' && m.status !== 'played'); }
  function renderHome() {
    const d = S.data;
    $('#hero-eyebrow').textContent = (d.season ? d.season + ' · ' : '') + (d.dayOfWeek ? d.dayOfWeek + 's ' : '') + time12(d.startTime) + ' to ' + time12(d.endTime);
    const words = d.name.split(' '); const last = words.length > 2 ? words.splice(-2).join(' ') : words.splice(-1).join(' ');
    $('#hero-title').innerHTML = esc(words.join(' ')) + ' <span>' + esc(last) + '</span>';
    $('#hero-lead').textContent = d.tagline + (d.venue ? ' at ' + d.venue : '') + '. Lineups, ball duty, scores and contacts all in one place.';
    const nm = nextMatch(); const spot = $('#spotlight'); const cnt = $('#next-count');
    if (nm) {
      const isToday = nm.date === todayISO();
      $('#next-title').textContent = isToday ? 'Tonight' : 'Next match';
      spot.innerHTML = matchCard(nm, { next: true }) + '<div class="card reveal in" style="display:flex;flex-direction:column;gap:12px;justify-content:center;align-items:center;text-align:center"><span class="eyebrow">Who brings the balls</span>' + ballHTML('lg bounce') + avatarHTML(player(nm.balls), 'large', 3) + '<h3>' + esc(pname(nm.balls)) + '</h3><p style="margin:0;color:var(--muted);font-size:.9rem">Bring a new can. Everyone else, bring your A game.</p>' + (player(nm.balls) && player(nm.balls).phone ? '<a class="btn soft small" href="' + smsLink([player(nm.balls).phone], 'Hey ' + pshort(nm.balls) + ', you have balls this week. See you ' + fmtDate(nm.date, { weekday: 'long' }) + '!') + '">Text a reminder</a>' : '') + '</div>';
      cnt.innerHTML = ''; tickCountdown(nm);
    } else {
      $('#next-title').textContent = 'Season complete'; cnt.innerHTML = '';
      spot.innerHTML = '<div class="card"><h3>No upcoming matches</h3><p style="color:var(--muted)">Add matches on the Manage tab or check the standings for the final table.</p></div>';
    }
    const ann = $('#home-announce'); const list = (d.announcements || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    $('#home-announce-block').classList.toggle('hidden', !list.length);
    ann.innerHTML = list.map(a => '<div class="announce"><small>' + (a.date ? fmtDate(a.date, { month: 'short', day: 'numeric' }) : '') + '</small><div>' + esc(a.text) + '</div></div>').join('');
    const st = standings().slice(0, 3);
    $('#home-standings').innerHTML = st.every(r => !r.played) ? '<div class="card" style="color:var(--muted)">No results yet. The leaderboard fills in as scores are entered on the Schedule tab.</div>' : '<div class="grid cols-3">' + st.map((r, i) => '<div class="card tilt" style="display:flex;gap:12px;align-items:center"><span class="rank" style="font-size:2rem;color:' + ['#b8860b', '#8a8a8a', '#a0522d'][i] + '">' + (i + 1) + '</span>' + avatarHTML(r.p, '', i) + '<div><b style="font-family:var(--display);font-size:1.3rem;text-transform:uppercase">' + esc(r.p.name) + '</b><div style="color:var(--muted);font-size:.85rem">' + r.w + ' W · ' + r.l + ' L · sets ' + r.setsW + '-' + r.setsL + '</div></div></div>').join('') + '</div>';
    $('#home-rules').innerHTML = '<ol style="margin:0;padding-left:20px;display:grid;gap:8px">' + (d.rules || []).map(r => '<li>' + esc(r) + '</li>').join('') + '</ol>' + (d.organizer && d.organizer.name ? '<p style="margin:14px 0 0;color:var(--muted)">Questions? ' + esc(d.organizer.name) + (d.organizer.phone ? ' · <a href="' + smsLink([d.organizer.phone]) + '">text</a> · <a href="tel:' + telNum(d.organizer.phone) + '">call</a>' : '') + (d.organizer.email ? ' · <a href="mailto:' + esc(d.organizer.email) + '">email</a>' : '') + '</p>' : '');
    const ics = $('#hero-ics'); ics.href = icsBlobURL(d.matches); ics.download = (d.name.replace(/[^\w]+/g, '-') + '-' + (d.season || 'season') + '.ics').replace(/-+/g, '-');
  }
  let cdTimer = null;
  function tickCountdown(m) {
    clearInterval(cdTimer);
    const box = $('#next-count');
    const upd = () => {
      const off = tzOffsetMinutes(m.date, m.startTime || S.data.startTime, S.data.timeZone); const [h, mi] = (m.startTime || S.data.startTime).split(':').map(Number); const { y, mo, d } = (() => { const p = dateParts(m.date); return { y: p.y, mo: p.m, d: p.d }; })();
      const start = Date.UTC(y, mo - 1, d, h, mi) - off * 60000; let diff = start - Date.now();
      if (diff < -90 * 60000) { box.innerHTML = ''; return; }
      if (diff < 0) { box.innerHTML = '<div><b>ON</b><span>court now</span></div>'; return; }
      const dd = Math.floor(diff / 864e5); diff -= dd * 864e5; const hh = Math.floor(diff / 36e5); diff -= hh * 36e5; const mm = Math.floor(diff / 6e4);
      box.innerHTML = (dd ? '<div><b>' + dd + '</b><span>day' + (dd === 1 ? '' : 's') + '</span></div>' : '') + '<div><b>' + hh + '</b><span>hrs</span></div><div><b>' + mm + '</b><span>min</span></div>';
    };
    upd(); cdTimer = setInterval(upd, 30000);
  }

  /* ---------- rendering: schedule ---------- */
  function renderSchedule() {
    const d = S.data; $('#sched-eyebrow').textContent = (d.season || '') + ' · ' + d.matches.length + ' match nights';
    const months = Array.from(new Set(d.matches.map(m => m.date.slice(0, 7))));
    const f = $('#sched-filters');
    f.innerHTML = '<button class="chip' + (S.view === 'list' ? ' on' : '') + '" data-view="list">List</button><button class="chip' + (S.view === 'cal' ? ' on' : '') + '" data-view="cal">Calendar</button>' +
      '<select class="chip" id="f-player"><option value="0">All players</option>' + activePlayers().map(p => '<option value="' + p.id + '"' + (S.filterPlayer === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select>' +
      '<select class="chip" id="f-month"><option value="">All months</option>' + months.map(mo => '<option value="' + mo + '"' + (S.filterMonth === mo ? ' selected' : '') + '>' + fmtDate(mo + '-01', { month: 'long', year: 'numeric' }) + '</option>').join('') + '</select>';
    $$('[data-view]', f).forEach(b => b.onclick = () => { S.view = b.dataset.view; renderSchedule(); });
    $('#f-player', f).onchange = e => { S.filterPlayer = Number(e.target.value); renderSchedule(); };
    $('#f-month', f).onchange = e => { S.filterMonth = e.target.value; renderSchedule(); };
    const vis = d.matches.filter(m => (!S.filterPlayer || lineup(m).includes(S.filterPlayer)) && (!S.filterMonth || m.date.startsWith(S.filterMonth)));
    const nm = nextMatch(); const list = $('#sched-list'); const cal = $('#sched-cal');
    list.classList.toggle('hidden', S.view !== 'list'); cal.classList.toggle('hidden', S.view !== 'cal');
    if (S.view === 'list') {
      let html = '', lastMo = '';
      vis.forEach(m => { const mo = m.date.slice(0, 7); if (mo !== lastMo) { html += '<div class="month-label">' + fmtDate(m.date, { month: 'long', year: 'numeric' }) + '</div>'; lastMo = mo; } html += '<div class="reveal" style="margin-bottom:14px">' + matchCard(m, { next: nm && nm.id === m.id }) + '</div>'; });
      list.innerHTML = html || '<div class="card">No matches match this filter.</div>';
    } else {
      const t = todayISO(); const byDate = {}; vis.forEach(m => (byDate[m.date] = byDate[m.date] || []).push(m));
      const mos = Array.from(new Set(vis.map(m => m.date.slice(0, 7))));
      cal.innerHTML = mos.map(mo => {
        const [y, mth] = mo.split('-').map(Number); const first = new Date(Date.UTC(y, mth - 1, 1)); const days = new Date(Date.UTC(y, mth, 0)).getUTCDate(); const start = first.getUTCDay();
        let cells = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => '<div class="dow">' + x + '</div>').join('');
        for (let i = 0; i < start; i++) cells += '<div class="d blank"></div>';
        for (let dd = 1; dd <= days; dd++) { const iso = mo + '-' + String(dd).padStart(2, '0'); const ms = byDate[iso]; const m = ms && ms[0]; cells += '<div class="d' + (m ? ' has ' + m.status : '') + (iso === t ? ' today' : '') + '"' + (m ? ' data-open="' + m.id + '" title="' + esc(pname(m.teamA[0]) + ' & ' + pname(m.teamA[1]) + ' vs ' + pname(m.teamB[0]) + ' & ' + pname(m.teamB[1])) + '"' : '') + '>' + dd + (m && nm && nm.id === m.id ? '<i></i>' : '') + '</div>'; }
        return '<div class="cal-month card"><h3>' + fmtDate(mo + '-01', { month: 'long', year: 'numeric' }) + '</h3><div class="cal">' + cells + '</div></div>';
      }).join('') + '<div id="cal-detail"></div>';
      $$('[data-open]', cal).forEach(el => el.onclick = () => { const m = d.matches.find(x => x.id === Number(el.dataset.open)); $('#cal-detail').innerHTML = matchCard(m, { next: nm && nm.id === m.id }); wireMatchActions($('#cal-detail')); $('#cal-detail').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    }
    wireMatchActions(list); wireMatchActions(cal);
    const ics = $('#sched-ics'); ics.href = icsBlobURL(d.matches); ics.download = (d.name.replace(/[^\w]+/g, '-') + '-schedule.ics');
    $('#sched-print').onclick = () => window.print();
    observeReveal();
  }
  function wireMatchActions(root) {
    $$('[data-act]', root).forEach(b => b.onclick = () => {
      const m = S.data.matches.find(x => x.id === Number(b.dataset.id)); if (!m) return;
      if (b.dataset.act === 'score') window.LeagueManage.scoreDialog(m);
      else if (b.dataset.act === 'lineup') window.LeagueManage.lineupDialog(m);
      else if (b.dataset.act === 'ics') { const a = document.createElement('a'); a.href = icsBlobURL([m]); a.download = 'match-' + m.date + '.ics'; document.body.appendChild(a); a.click(); a.remove(); }
    });
  }

  /* ---------- rendering: players ---------- */
  function renderPlayers() {
    const d = S.data; const st = standings(); const byId = {}; st.forEach(r => byId[r.p.id] = r);
    const ps = activePlayers().filter(p => p.role !== 'sub'); const subs = activePlayers().filter(p => p.role === 'sub');
    const phones = activePlayers().map(p => p.phone).filter(Boolean); const emails = activePlayers().map(p => p.email).filter(Boolean);
    $('#group-actions').innerHTML = (phones.length ? '<a class="btn court" href="' + smsLink(phones, '') + '">Text everyone</a>' : '') + (emails.length ? '<a class="btn soft" href="' + mailLink(emails, d.name) + '">Email everyone</a>' : '') + '<button class="btn soft" id="copy-roster">Copy roster</button>';
    $('#copy-roster').onclick = () => { const txt = activePlayers().map(p => p.name + (p.num ? ' #' + p.num : '') + ' · ' + (p.phone || '') + ' · ' + (p.email || '')).join('\n'); navigator.clipboard && navigator.clipboard.writeText(txt).then(() => toast('Roster copied'), () => toast('Copy failed')); };
    const card = (p, i) => { const r = byId[p.id] || { played: 0, w: 0, l: 0, balls: 0, scheduled: 0 }; const weeks = d.matches.filter(m => m.status !== 'canceled' && lineup(m).includes(p.id) && m.date >= todayISO()).map(m => fmtDate(m.date, { month: 'short', day: 'numeric' }));
      return '<article class="card tilt player-card reveal" data-player="' + p.id + '">' + (p.role === 'sub' ? '<span class="pill sub-badge">Sub</span>' : '') + avatarHTML(p, 'large', i) + '<div><h3>' + esc(p.name) + '</h3><div class="num-badge">' + (p.num ? '#' + esc(p.num) + ' · ' : '') + (p.role === 'sub' ? 'Substitute' : 'Player') + '</div></div>' +
        '<div class="contact">' + (p.phone ? '<a class="btn primary" href="' + smsLink([p.phone]) + '">Text</a><a class="btn soft" href="tel:' + telNum(p.phone) + '">Call</a>' : '') + (p.email ? '<a class="btn soft" href="mailto:' + esc(p.email) + '">Email</a>' : '') + '<button class="btn soft" data-vcard="' + p.id + '">Save contact</button></div>' +
        '<div style="font-size:.85rem;color:var(--muted)">' + (p.phone ? '<a href="tel:' + telNum(p.phone) + '" style="text-decoration:none">' + esc(p.phone) + '</a>' : '') + (p.phone && p.email ? ' · ' : '') + (p.email ? '<a href="mailto:' + esc(p.email) + '" style="text-decoration:none">' + esc(p.email) + '</a>' : '') + '</div>' +
        '<div class="stat-row"><div><b>' + r.w + '-' + r.l + '</b>record</div><div><b>' + r.scheduled + '</b>nights</div><div><b>' + r.balls + '</b>ball duty</div></div>' +
        (weeks.length ? '<div class="weeks">Upcoming: ' + weeks.slice(0, 5).join(', ') + (weeks.length > 5 ? ' +' + (weeks.length - 5) : '') + '</div>' : '<div class="weeks">No upcoming nights scheduled</div>') + '</article>'; };
    $('#players-grid').innerHTML = ps.map(card).join('');
    $('#subs-block').innerHTML = subs.length ? '<div class="section-head" style="margin-top:30px"><div><span class="eyebrow">Bench</span><h2>Sub list</h2><p>Need a night off? Text a sub, then update the lineup on the schedule.</p></div></div><div class="grid cols-3">' + subs.map(card).join('') + '</div>' : '';
    $$('[data-vcard]').forEach(b => b.onclick = () => { const p = player(Number(b.dataset.vcard)); download(p.name.replace(/\s+/g, '-') + '.vcf', vcard(p), 'text/vcard'); });
    observeReveal();
  }

  /* ---------- rendering: standings ---------- */
  function renderStandings() {
    const st = standings(); const played = S.data.matches.filter(m => m.status === 'played').length; const total = S.data.matches.filter(m => m.status !== 'canceled').length;
    const games = S.data.matches.filter(m => m.status === 'played').reduce((n, m) => n + m.sets.filter(s => !s.tb).reduce((g, s) => g + s.a + s.b, 0), 0);
    $('#standings-note').textContent = played ? played + ' of ' + total + ' match nights played.' : 'No scores yet. The table fills in as matches are played.';
    $('#standings-tiles').innerHTML = [['Played', played], ['Remaining', total - played], ['Games so far', games], ['Players', activePlayers().length]].map(t => '<div class="tile reveal"><b data-count="' + t[1] + '">0</b><span>' + t[0] + '</span></div>').join('');
    const maxW = Math.max(1, ...st.map(r => r.w));
    $('#standings-table').innerHTML = '<thead><tr><th></th><th>Player</th><th>W</th><th>L</th><th class="hide-m">Win %</th><th class="hide-m">Sets</th><th class="hide-m">Games</th><th>Form</th></tr></thead><tbody>' +
      st.map((r, i) => '<tr class="rank-' + (i + 1) + '"><td class="rank">' + (i + 1) + '</td><td><div class="who">' + avatarHTML(r.p, 'small', i) + '<span>' + esc(r.p.name) + (r.p.num ? ' <span style="color:var(--muted);font-weight:600">#' + esc(r.p.num) + '</span>' : '') + (r.p.role === 'sub' ? ' <span class="pill">sub</span>' : '') + '</span></div><div class="bar" style="margin-top:6px"><i data-w="' + Math.round(r.w / maxW * 100) + '"></i></div></td><td class="num-cell">' + r.w + '</td><td class="num-cell">' + r.l + '</td><td class="hide-m num-cell">' + (r.played ? Math.round(r.pct * 100) + '%' : '–') + '</td><td class="hide-m">' + r.setsW + '-' + r.setsL + '</td><td class="hide-m">' + r.gamesW + '-' + r.gamesL + '</td><td><div class="form">' + (r.form.length ? r.form.slice(-6).map(f => '<i class="' + f + '"></i>').join('') : '<i></i><i></i><i></i>') + '</div></td></tr>').join('') + '</tbody>';
    observeReveal();
    requestAnimationFrame(() => { $$('.bar i').forEach(b => b.style.width = b.dataset.w + '%'); $$('[data-count]').forEach(countUp); });
  }
  function countUp(el) { const end = Number(el.dataset.count); const t0 = performance.now(); const dur = 900; const step = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

  /* ---------- modal ---------- */
  function openModal(title, html) { const m = $('#modal'); $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; if (!m.open) m.showModal(); return m; }
  function closeModal() { const m = $('#modal'); if (m.open) m.close(); }

  /* ---------- share link: encode the whole league into a URL ---------- */
  function b64url(bytes) { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  async function encodeShare(data) {
    const json = JSON.stringify(data); const bytes = new TextEncoder().encode(json);
    if (typeof CompressionStream !== 'undefined') { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(bytes); w.close(); const buf = await new Response(cs.readable).arrayBuffer(); return 'z' + b64url(new Uint8Array(buf)); }
    return 'p' + b64url(bytes);
  }
  async function decodeShare(str) {
    const kind = str[0], body = str.slice(1); const bytes = unb64url(body);
    if (kind === 'z') { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(bytes); w.close(); const buf = await new Response(ds.readable).arrayBuffer(); return JSON.parse(new TextDecoder().decode(buf)); }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  async function shareURL() { const base = location.href.split('#')[0]; return base + '#u=' + await encodeShare(S.data); }
  async function handleIncoming() {
    const h = location.hash; if (!h.startsWith('#u=')) return false;
    try {
      const incoming = normalize(await decodeShare(h.slice(3)));
      history.replaceState(null, '', location.pathname + location.search + '#home');
      const mine = S.data.updatedAt || ''; const theirs = incoming.updatedAt || '';
      if (theirs && theirs === mine) { toast('You already have this update'); return true; }
      const b = $('#banner'); b.classList.remove('hidden');
      b.innerHTML = '<span>Update received (' + (incoming.updatedAt ? new Date(incoming.updatedAt).toLocaleString() : 'shared link') + '). Apply it to this device?</span><button class="btn court small" id="apply-yes">Apply update</button><button class="btn soft small" id="apply-no">Keep mine</button>';
      $('#apply-yes').onclick = () => { S.data = incoming; save('Update applied'); b.classList.add('hidden'); };
      $('#apply-no').onclick = () => b.classList.add('hidden');
    } catch (e) { toast('That link could not be read'); }
    return true;
  }

  /* ---------- optional cloud sync (see server/worker.js) ---------- */
  async function pullSync() {
    if (!S.data.syncUrl) return;
    try { const r = await fetch(S.data.syncUrl, { cache: 'no-store' }); if (!r.ok) return; const remote = normalize(await r.json()); if (remote.updatedAt && (!S.data.updatedAt || remote.updatedAt > S.data.updatedAt)) { S.data = remote; try { localStorage.setItem(STORE_KEY, JSON.stringify(S.data)); } catch (e) { } S.source = 'cloud'; renderAll(); toast('Updated from the league server'); } } catch (e) { /* offline */ }
  }
  async function pushSync() { try { const r = await fetch(S.data.syncUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S.data) }); toast(r.ok ? 'Shared with everyone' : 'Server refused the update'); } catch (e) { toast('Saved here, will retry when online'); } }

  /* ---------- motion ---------- */
  let revealObs = null;
  function observeReveal() {
    if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(e => e.classList.add('in')); return; }
    revealObs = revealObs || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal:not(.in)').forEach((e, i) => { e.style.transitionDelay = Math.min(i, 8) * 60 + 'ms'; revealObs.observe(e); });
  }
  function wireMotion() {
    document.addEventListener('pointermove', e => { if (window.matchMedia('(hover:none)').matches) return; const c = e.target.closest && e.target.closest('.card.tilt'); $$('.card.tilt').forEach(el => { if (el !== c) el.style.transform = ''; }); if (!c) return; const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = 'perspective(900px) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-2px)'; });
    document.addEventListener('pointerleave', () => $$('.card.tilt').forEach(el => el.style.transform = ''));
    document.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('.btn'); if (b) { const r = b.getBoundingClientRect(); const s = document.createElement('span'); s.className = 'ripple'; const size = Math.max(r.width, r.height); s.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px'; b.appendChild(s); setTimeout(() => s.remove(), 700); }
      const av = e.target.closest && e.target.closest('.avatar'); if (av) { av.classList.add('burst'); setTimeout(() => av.classList.remove('burst'), 1800); }
    });
    document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.dataset.fallback && t.src.indexOf(t.dataset.fallback) < 0) t.src = t.dataset.fallback; }, true);
    const hero = $('#hero'); window.addEventListener('scroll', () => { const y = window.scrollY; if (y < 900) { const m = $('.hero-media', hero); if (m) m.style.transform = 'translateY(' + y * .28 + 'px)'; $$('.float-ball', hero).forEach((b, i) => b.style.marginTop = (y * (.12 + i * .08)) + 'px'); } }, { passive: true });
  }
  function wireHero() {
    artImg($('#hero-img'), ART.hero, '');
    const v = $('#hero-video'); const hero = $('#hero');
    const saveData = navigator.connection && navigator.connection.saveData; const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (saveData || reduce || window.innerWidth < 640) return;
    v.innerHTML = '<source src="' + artSrc(ART.heroVideo) + '" type="video/mp4">' + (ART.heroVideo.local && artSrc(ART.heroVideo) !== ART.heroVideo.local ? '<source src="' + ART.heroVideo.local + '" type="video/mp4">' : '');
    v.addEventListener('canplay', () => hero.classList.add('has-video'), { once: true });
    v.addEventListener('error', () => hero.classList.remove('has-video'));
    v.load(); const p = v.play(); if (p && p.catch) p.catch(() => { });
  }

  /* ---------- routing & shell ---------- */
  function route() {
    let h = (location.hash || '#home').slice(1); if (h.startsWith('u=')) return;
    if (!['home', 'schedule', 'players', 'standings', 'manage'].includes(h)) h = 'home';
    S.page = h; $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + h)); $$('[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === h));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (h === 'manage') window.LeagueManage.render();
    observeReveal();
  }
  function renderAll() {
    const d = S.data; document.title = d.name + (d.season ? ' · ' + d.season : '');
    $('#brand-name').textContent = d.name; $('#brand-season').textContent = d.season || '';
    artImg($('#crest'), ART.crest, '');
    $$('[data-art="ball"]').forEach(i => artImg(i, ART.ball, ''));
    renderHome(); renderSchedule(); renderPlayers(); renderStandings();
    if (S.page === 'manage') window.LeagueManage.render();
    $('#foot-text').textContent = d.name + (d.venue ? ' · ' + d.venue : '') + ' · times shown in ' + d.timeZone.replace(/_/g, ' ');
    $('#foot-updated').textContent = 'Data last updated ' + (d.updatedAt ? new Date(d.updatedAt).toLocaleString() : 'n/a') + ' · source: ' + (S.source === 'file' ? 'league-data.js' : S.source === 'cloud' ? 'league server' : 'edits saved on this device');
  }

  async function init() {
    loadData(); S.data = normalize(S.data);
    $('#modal-close').onclick = closeModal; $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
    wireMotion(); wireHero(); renderAll();
    await handleIncoming(); route(); window.addEventListener('hashchange', route);
    pullSync();
  }

  window.League = { S, save, normalize, player, pname, pshort, activePlayers, standings, matchResult, validateSets, avatarHTML, ballHTML, artSrc, racquetArt, ART, esc, $, $$, todayISO, fmtDate, dow, time12, openModal, closeModal, toast, download, shareURL, encodeShare, telNum, smsLink, mailLink, renderAll, deep, STORE_KEY, lineup, statusLabel, matchCard, wireMatchActions, pullSync };
  document.addEventListener('DOMContentLoaded', init);
})();
