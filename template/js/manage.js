/* =====================================================================
   Manage tab: players, schedule, scores, league info, publishing.
   Everything here edits League.S.data and calls League.save().
   ===================================================================== */
(function () {
  'use strict';
  const L = window.League; const { $, $$, esc } = L;
  const M = { tab: 'players', unlocked: false };
  const STATUSES = [['scheduled', 'Scheduled'], ['played', 'Played · final'], ['unfinished', 'Unfinished'], ['rescheduled', 'Rescheduled'], ['canceled', 'Canceled']];
  const d = () => L.S.data;
  const nextId = list => list.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  const opt = (v, label, sel) => '<option value="' + esc(v) + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + esc(label) + '</option>';
  const playerOptions = (sel, includeEmpty) => (includeEmpty ? opt('', 'Open slot', sel) : '') + d().players.filter(p => p.active !== false || p.id === sel).map(p => opt(p.id, p.name + (p.num ? ' #' + p.num : '') + (p.role === 'sub' ? ' (sub)' : ''), sel)).join('');

  /* ---------- gate ---------- */
  function unlocked() {
    if (!d().editPin) return true;
    if (M.unlocked) return true;
    try { if (sessionStorage.getItem('league-unlocked') === d().editPin) { M.unlocked = true; return true; } } catch (e) { }
    return false;
  }

  /* ---------- render ---------- */
  function render() {
    const root = $('#manage-root'); if (!root) return;
    if (!unlocked()) {
      root.innerHTML = '<div class="card" style="max-width:420px"><h3>Captain PIN</h3><p style="color:var(--muted)">This league uses a PIN for edits. Ask your captain or the pro.</p><label class="f">PIN<input id="pin" type="password" inputmode="numeric" autocomplete="off"></label><div style="margin-top:12px"><button class="btn court" id="pin-go">Unlock</button></div></div>';
      $('#pin-go').onclick = () => { if ($('#pin').value === d().editPin) { M.unlocked = true; try { sessionStorage.setItem('league-unlocked', d().editPin); } catch (e) { } render(); } else L.toast('Wrong PIN'); };
      return;
    }
    root.innerHTML = '<div class="manage-tabs">' + [['players', 'Players'], ['schedule', 'Schedule & scores'], ['league', 'League info'], ['publish', 'Backup & tools']].map(t => '<button class="chip' + (M.tab === t[0] ? ' on' : '') + '" data-mtab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div id="manage-body"></div>' + savebar();
    $$('[data-mtab]', root).forEach(b => b.onclick = () => { M.tab = b.dataset.mtab; render(); });
    ({ players: renderPlayers, schedule: renderSchedule, league: renderLeague, generate: renderGenerator, publish: renderPublish })[M.tab] ? ({ players: renderPlayers, schedule: renderSchedule, league: renderLeague, generate: renderGenerator, publish: renderPublish })[M.tab]() : renderPlayers();
    wireSavebar();
  }
  function savebar() {
    if (d().syncUrl) return '<div class="savebar"><span class="status" id="sb-status">Changes save automatically and are shared with everyone.</span><button class="btn primary small" id="sb-save">Save changes</button><button class="btn ghost small" id="sb-help" data-help>How this works</button></div>';
    return '<div class="savebar"><span class="status">' + (L.S.source === 'file' ? 'Showing the data from league-data.js.' : 'Changes are saved on this device only.') + '</span><button class="btn primary small" id="sb-download">Download league-data.js</button><button class="btn ghost small" id="sb-share">Copy share link</button></div>';
  }
  function wireSavebar() {
    const dl = $('#sb-download'); if (dl) dl.onclick = downloadData; const sh = $('#sb-share'); if (sh) sh.onclick = copyShare;
    const sv = $('#sb-save'); if (sv) sv.onclick = async () => { sv.disabled = true; sv.textContent = 'Saving…'; L.S.dirty = true; const ok = await L.pushSync(); sv.disabled = false; sv.textContent = 'Save changes'; const st = $('#sb-status'); if (st) st.textContent = ok ? 'Saved. Everyone in the league now sees this version.' : 'Could not reach the league server. Your changes are kept on this phone and will be sent when you are back online.'; L.toast(ok ? 'Saved for everyone' : 'Offline, will retry'); };
    const hb = $('#sb-help'); if (hb) hb.onclick = e => { e.preventDefault(); const h = $('#help'); if (!h.open) h.showModal(); };
  }

  /* ---------- players ---------- */
  function renderPlayers() {
    const b = $('#manage-body'); const ps = d().players;
    b.innerHTML = '<p style="color:var(--muted)">Edit anything inline. Use <b>Replace everywhere</b> when someone drops out and another player or sub takes their spot for the rest of the season.</p>' +
      ps.map(p => '<div class="row-edit" data-pid="' + p.id + '">' + L.avatarHTML(p, '', p.id) + '<div class="fields">' +
        '<label class="f">Name<input data-f="name" value="' + esc(p.name) + '"></label>' +
        '<label class="f">Number<input data-f="num" value="' + esc(p.num) + '" placeholder="1"></label>' +
        '<label class="f">Phone<input data-f="phone" type="tel" value="' + esc(p.phone) + '" placeholder="719-555-0100"></label>' +
        '<label class="f">Email<input data-f="email" type="email" value="' + esc(p.email) + '"></label>' +
        '<label class="f">Role<select data-f="role">' + opt('player', 'Player', p.role) + opt('sub', 'Substitute', p.role) + '</select></label>' +
        '<label class="f">Status<select data-f="active">' + opt('true', 'Active', String(p.active !== false)) + opt('false', 'Inactive (dropped)', String(p.active !== false)) + '</select></label>' +
        '</div><div class="tools"><span class="avatar-picker" data-pick="' + p.id + '">' + L.ART.racquets.map((a, i) => '<button type="button" title="Racquet ' + (i + 1) + '" class="' + (p.avatar === i ? 'on' : '') + '" data-av="' + i + '"><img src="' + L.artSrc(a) + '" data-fallback="' + a.local + '" alt=""></button>').join('') + '</span><button class="btn soft small" data-replace="' + p.id + '">Replace everywhere</button><button class="btn danger small" data-del="' + p.id + '">Remove</button></div></div>').join('') +
      '<div class="card" style="margin-top:16px"><h3>Add a player or sub</h3><div class="form-grid" style="margin-top:10px"><label class="f">Name<input id="np-name"></label><label class="f">Number<input id="np-num" placeholder="' + esc(suggestNum()) + '"></label><label class="f">Phone<input id="np-phone" type="tel"></label><label class="f">Email<input id="np-email" type="email"></label><label class="f">Role<select id="np-role"><option value="player">Player</option><option value="sub">Substitute</option></select></label></div><div style="margin-top:12px"><button class="btn court" id="np-add">Add to roster</button></div></div>';
    $$('.row-edit', b).forEach(row => {
      const p = L.player(Number(row.dataset.pid));
      $$('[data-f]', row).forEach(inp => inp.onchange = () => { let v = inp.value; if (inp.dataset.f === 'active') v = v === 'true'; p[inp.dataset.f] = typeof v === 'string' ? v.trim() : v; L.save(); });
      $$('[data-av]', row).forEach(bt => bt.onclick = () => { p.avatar = Number(bt.dataset.av); L.save('Racquet updated'); });
    });
    $$('[data-del]', b).forEach(bt => bt.onclick = () => removePlayer(Number(bt.dataset.del)));
    $$('[data-replace]', b).forEach(bt => bt.onclick = () => replaceDialog(Number(bt.dataset.replace)));
    $('#np-add').onclick = () => { const name = $('#np-name').value.trim(); if (!name) return L.toast('Enter a name'); const role = $('#np-role').value; const used = new Set(d().players.map(p => p.avatar)); let av = 0; while (used.has(av) && av < L.ART.racquets.length - 1) av++; d().players.push({ id: nextId(d().players), num: $('#np-num').value.trim() || suggestNum(role), name, phone: $('#np-phone').value.trim(), email: $('#np-email').value.trim(), role, avatar: av, active: true }); L.save(name + ' added'); };
  }
  function suggestNum(role) { const ps = d().players; if (role === 'sub') { const n = ps.filter(p => p.role === 'sub').length + 1; return 'S' + n; } const nums = ps.map(p => parseInt(p.num, 10)).filter(n => !isNaN(n)); return String((nums.length ? Math.max(...nums) : 0) + 1); }
  function removePlayer(id) {
    const p = L.player(id); const inMatches = d().matches.filter(m => L.lineup(m).includes(id) || m.balls === id);
    if (inMatches.length) { L.openModal('Remove ' + p.name, '<p>' + esc(p.name) + ' is in <b>' + inMatches.length + '</b> match lineups. Pick what to do:</p><div style="display:grid;gap:8px"><button class="btn court" id="rm-replace">Replace them in every lineup first</button><button class="btn soft" id="rm-inactive">Mark inactive but keep history</button><button class="btn danger" id="rm-force">Remove anyway (leaves open slots)</button></div>'); $('#rm-replace').onclick = () => { L.closeModal(); replaceDialog(id); }; $('#rm-inactive').onclick = () => { p.active = false; L.closeModal(); L.save(p.name + ' marked inactive'); }; $('#rm-force').onclick = () => { d().matches.forEach(m => { m.teamA = m.teamA.map(x => x === id ? 0 : x); m.teamB = m.teamB.map(x => x === id ? 0 : x); if (m.balls === id) m.balls = L.lineup(m).find(x => x) || 0; }); d().players = d().players.filter(x => x.id !== id); L.closeModal(); L.save(p.name + ' removed'); }; return; }
    if (confirm('Remove ' + p.name + ' from the roster?')) { d().players = d().players.filter(x => x.id !== id); L.save(p.name + ' removed'); }
  }
  function replaceDialog(oldId) {
    const p = L.player(oldId); const today = L.todayISO();
    L.openModal('Replace ' + p.name, '<p style="color:var(--muted)">Every lineup (and ball duty) that has ' + esc(p.name) + ' will switch to the player you choose.</p><label class="f">Replace with<select id="rp-new">' + playerOptions(0, true) + '</select></label><label class="f" style="margin-top:10px">Which matches<select id="rp-scope"><option value="future">Only matches from today on</option><option value="all">Every match, including played ones</option></select></label><label class="f inline" style="margin-top:10px"><input type="checkbox" id="rp-inactive" checked> Mark ' + esc(p.name) + ' inactive afterwards</label><div style="margin-top:14px;display:flex;gap:8px"><button class="btn court" id="rp-go">Replace</button><button class="btn soft" id="rp-cancel">Cancel</button></div>');
    $('#rp-cancel').onclick = L.closeModal;
    $('#rp-go').onclick = () => { const nid = Number($('#rp-new').value) || 0; if (nid === oldId) return L.toast('Pick a different player'); const scope = $('#rp-scope').value; let n = 0; d().matches.forEach(m => { if (scope === 'future' && m.date < today) return; let hit = false; m.teamA = m.teamA.map(x => { if (x === oldId) { hit = true; return nid; } return x; }); m.teamB = m.teamB.map(x => { if (x === oldId) { hit = true; return nid; } return x; }); if (m.balls === oldId) { m.balls = nid; hit = true; } if (hit) n++; }); if ($('#rp-inactive').checked) p.active = false; L.closeModal(); L.save('Updated ' + n + ' match' + (n === 1 ? '' : 'es')); };
  }

  /* ---------- schedule ---------- */
  function renderSchedule() {
    const b = $('#manage-body'); const ms = d().matches;
    b.innerHTML = '<p style="color:var(--muted)">Tap <b>Score</b> after a match, <b>Edit</b> to change who plays, who brings balls, or the date.</p>' +
      ms.map(m => '<div class="row-edit" data-mid="' + m.id + '"><div style="text-align:center;min-width:64px"><div style="font-family:var(--display);font-size:1.6rem;font-weight:800;line-height:1">' + L.fmtDate(m.date, { day: 'numeric' }) + '</div><div style="font-size:.7rem;color:var(--muted);font-weight:700;text-transform:uppercase">' + L.fmtDate(m.date, { month: 'short' }) + ' · ' + L.dow(m.date) + '</div></div><div><div><span class="pill ' + m.status + '">' + L.statusLabel(m) + '</span> <b>' + esc(L.pshort(m.teamA[0])) + ' & ' + esc(L.pshort(m.teamA[1])) + '</b> vs <b>' + esc(L.pshort(m.teamB[0])) + ' & ' + esc(L.pshort(m.teamB[1])) + '</b></div><div style="font-size:.85rem;color:var(--muted)">' + L.ballHTML() + ' ' + esc(L.pshort(m.balls)) + (m.sets && m.sets.length ? ' · ' + m.sets.map(s => s.a + '-' + s.b + (s.tb ? ' TB' : '')).join(', ') : '') + (m.note ? ' · ' + esc(m.note) : '') + '</div></div><div class="tools"><button class="btn court small" data-score="' + m.id + '">Score</button><button class="btn soft small" data-edit="' + m.id + '">Edit</button><button class="btn danger small" data-delm="' + m.id + '">Delete</button></div></div>').join('') +
      '<div class="card" style="margin-top:16px"><h3>Add a match night</h3><div class="form-grid" style="margin-top:10px"><label class="f">Date<input type="date" id="nm-date" value="' + esc(suggestDate()) + '"></label><label class="f">Start<input type="time" id="nm-start" value="' + esc(d().startTime) + '"></label><label class="f">End<input type="time" id="nm-end" value="' + esc(d().endTime) + '"></label></div><div class="form-grid" style="margin-top:10px"><label class="f">Team A<select id="nm-a1">' + playerOptions(0, true) + '</select></label><label class="f">&nbsp;<select id="nm-a2">' + playerOptions(0, true) + '</select></label><label class="f">Team B<select id="nm-b1">' + playerOptions(0, true) + '</select></label><label class="f">&nbsp;<select id="nm-b2">' + playerOptions(0, true) + '</select></label></div><div style="margin-top:12px"><button class="btn court" id="nm-add">Add match</button></div></div>';
    $$('[data-score]', b).forEach(bt => bt.onclick = () => scoreDialog(d().matches.find(m => m.id === Number(bt.dataset.score))));
    $$('[data-edit]', b).forEach(bt => bt.onclick = () => lineupDialog(d().matches.find(m => m.id === Number(bt.dataset.edit))));
    $$('[data-delm]', b).forEach(bt => bt.onclick = () => { const m = d().matches.find(x => x.id === Number(bt.dataset.delm)); if (confirm('Delete the match on ' + L.fmtDate(m.date) + '?')) { d().matches = d().matches.filter(x => x !== m); L.save('Match deleted'); } });
    $('#nm-add').onclick = () => { const date = $('#nm-date').value; if (!date) return L.toast('Pick a date'); const ids = ['a1', 'a2', 'b1', 'b2'].map(k => Number($('#nm-' + k).value) || 0); const m = { id: nextId(d().matches), date, startTime: $('#nm-start').value, endTime: $('#nm-end').value, teamA: ids.slice(0, 2), teamB: ids.slice(2), balls: ids.find(x => x) || 0, status: 'scheduled', sets: [], note: '' }; if (new Set(ids.filter(x => x)).size !== ids.filter(x => x).length) return L.toast('A player is listed twice'); d().matches.push(m); L.save('Match added'); };
  }
  function suggestDate() { const ms = d().matches; if (!ms.length) return L.todayISO(); const last = ms[ms.length - 1].date; const [y, m, dd] = last.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + 7)).toISOString().slice(0, 10); }

  /* ---------- score dialog (shared with the Schedule page) ---------- */
  function scoreDialog(m) {
    const sets = L.deep(m.sets && m.sets.length ? m.sets : [{ a: 0, b: 0 }]); let status = m.status === 'scheduled' || m.status === 'rescheduled' ? 'played' : m.status;
    const draw = () => {
      $('#modal-body').innerHTML = '<p style="margin:0 0 10px;color:var(--muted)">' + L.fmtDate(m.date) + ' · Team A: <b>' + esc(L.pshort(m.teamA[0])) + ' & ' + esc(L.pshort(m.teamA[1])) + '</b> · Team B: <b>' + esc(L.pshort(m.teamB[0])) + ' & ' + esc(L.pshort(m.teamB[1])) + '</b></p>' +
        '<div class="status-choice">' + STATUSES.map(s => '<button type="button" data-st="' + s[0] + '" aria-pressed="' + (status === s[0]) + '">' + s[1] + '</button>').join('') + '</div>' +
        (status === 'played' || status === 'unfinished' ? '<div class="set-rows" style="margin-top:14px">' + sets.map((s, i) => '<div class="set-row"><select data-tb="' + i + '" class="chip" style="padding:8px 28px 8px 12px">' + opt('0', 'Set ' + (i + 1), s.tb ? '1' : '0') + opt('1', 'Match tiebreak', s.tb ? '1' : '0') + '</select><input type="number" min="0" max="30" inputmode="numeric" data-a="' + i + '" value="' + s.a + '" aria-label="Team A games"><span style="text-align:center;font-weight:800">:</span><input type="number" min="0" max="30" inputmode="numeric" data-b="' + i + '" value="' + s.b + '" aria-label="Team B games"><button type="button" class="btn soft small" data-rm="' + i + '" aria-label="Remove set">×</button></div>').join('') + '</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' + (sets.length < 5 ? '<button type="button" class="btn soft small" id="add-set">+ Add set</button>' : '') + '<span style="font-size:.8rem;color:var(--muted);align-self:center">Left number is Team A.</span></div><div id="score-warn"></div>' : '<p class="warn">' + ({ scheduled: 'Scores will be cleared and the match shows as scheduled.', rescheduled: 'Use "Edit" on the Manage tab to set the new date.', canceled: 'The match will not count toward standings.' }[status] || '') + '</p>') +
        '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn court" id="score-save">Save</button><button type="button" class="btn soft" id="score-cancel">Cancel</button></div>';
      $$('[data-st]').forEach(bt => bt.onclick = () => { status = bt.dataset.st; draw(); });
      $$('[data-a]').forEach(i => i.oninput = () => { sets[i.dataset.a].a = Number(i.value) || 0; warn(); });
      $$('[data-b]').forEach(i => i.oninput = () => { sets[i.dataset.b].b = Number(i.value) || 0; warn(); });
      $$('[data-tb]').forEach(s => s.onchange = () => { if (s.value === '1') sets[s.dataset.tb].tb = true; else delete sets[s.dataset.tb].tb; warn(); });
      $$('[data-rm]').forEach(bt => bt.onclick = () => { sets.splice(Number(bt.dataset.rm), 1); if (!sets.length) sets.push({ a: 0, b: 0 }); draw(); });
      const add = $('#add-set'); if (add) add.onclick = () => { sets.push({ a: 0, b: 0 }); draw(); };
      $('#score-cancel').onclick = L.closeModal;
      $('#score-save').onclick = () => { const w = L.validateSets(sets, status); if (status === 'played' && w.length && !confirm('Some scores look unusual:\n\n' + w.join('\n') + '\n\nSave anyway?')) return; m.status = status; m.sets = (status === 'played' || status === 'unfinished') ? sets.filter(s => s.a || s.b || sets.length === 1) : []; L.closeModal(); L.save(status === 'played' ? 'Score saved. Standings updated.' : 'Match updated'); };
      warn();
    };
    const warn = () => { const el = $('#score-warn'); if (!el) return; const w = L.validateSets(sets, status); const res = L.matchResult({ sets }); el.innerHTML = (w.length ? '<div class="warn">' + w.map(esc).join('<br>') + '</div>' : (status === 'played' && sets.length ? '<div class="ok">' + (res === 1 ? 'Team A' : 'Team B') + ' wins ' + sets.map(s => s.a + '-' + s.b).join(', ') + '.</div>' : '')); };
    L.openModal('Match result', ''); draw();
  }

  /* ---------- lineup / date dialog ---------- */
  function lineupDialog(m) {
    L.openModal('Edit match', '<div class="form-grid"><label class="f">Date<input type="date" id="lm-date" value="' + esc(m.date) + '"></label><label class="f">Start<input type="time" id="lm-start" value="' + esc(m.startTime || d().startTime) + '"></label><label class="f">End<input type="time" id="lm-end" value="' + esc(m.endTime || d().endTime) + '"></label></div>' +
      '<div class="form-grid" style="margin-top:10px"><label class="f">Team A<select id="lm-a1">' + playerOptions(m.teamA[0], true) + '</select></label><label class="f">&nbsp;<select id="lm-a2">' + playerOptions(m.teamA[1], true) + '</select></label><label class="f">Team B<select id="lm-b1">' + playerOptions(m.teamB[0], true) + '</select></label><label class="f">&nbsp;<select id="lm-b2">' + playerOptions(m.teamB[1], true) + '</select></label></div>' +
      '<div class="form-grid" style="margin-top:10px"><label class="f">Brings balls<select id="lm-balls"></select></label><label class="f">Status<select id="lm-status">' + STATUSES.map(s => opt(s[0], s[1], m.status)).join('') + '</select></label></div>' +
      '<label class="f" style="margin-top:10px">Note (optional)<input id="lm-note" value="' + esc(m.note || '') + '" placeholder="Court 3, rain check, etc."></label>' +
      '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn court" id="lm-save">Save</button><button class="btn soft" id="lm-cancel">Cancel</button></div>');
    const ballSel = () => { const ids = ['a1', 'a2', 'b1', 'b2'].map(k => Number($('#lm-' + k).value) || 0).filter(x => x); const cur = Number($('#lm-balls').value) || m.balls; $('#lm-balls').innerHTML = ids.map(id => opt(id, L.pname(id), ids.includes(cur) ? cur : ids[0])).join(''); };
    ['a1', 'a2', 'b1', 'b2'].forEach(k => $('#lm-' + k).onchange = ballSel); ballSel();
    $('#lm-cancel').onclick = L.closeModal;
    $('#lm-save').onclick = () => {
      const ids = ['a1', 'a2', 'b1', 'b2'].map(k => Number($('#lm-' + k).value) || 0); const real = ids.filter(x => x); if (new Set(real).size !== real.length) return L.toast('A player is listed twice');
      const date = $('#lm-date').value; if (!date) return L.toast('Pick a date');
      if (date !== m.date) { m.originalDate = m.originalDate || m.date; if ($('#lm-status').value === 'scheduled') $('#lm-status').value = 'rescheduled'; }
      m.date = date; m.startTime = $('#lm-start').value; m.endTime = $('#lm-end').value; m.teamA = ids.slice(0, 2); m.teamB = ids.slice(2); m.balls = Number($('#lm-balls').value) || real[0] || 0; m.status = $('#lm-status').value; m.note = $('#lm-note').value.trim();
      if (m.status !== 'played' && m.status !== 'unfinished') m.sets = [];
      L.closeModal(); L.save('Match updated');
    };
  }

  /* ---------- league info ---------- */
  function renderLeague() {
    const b = $('#manage-body'); const x = d(); const o = x.organizer || {};
    const tzs = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Australia/Sydney'];
    b.innerHTML = '<div class="card"><div class="form-grid"><label class="f">League name<input data-l="name" value="' + esc(x.name) + '"></label><label class="f">Tagline<input data-l="tagline" value="' + esc(x.tagline || '') + '"></label><label class="f">Season<input data-l="season" value="' + esc(x.season || '') + '"></label><label class="f">Venue / club<input data-l="venue" value="' + esc(x.venue || '') + '"></label><label class="f">Address<input data-l="venueAddress" value="' + esc(x.venueAddress || '') + '"></label><label class="f">Day of week<select data-l="dayOfWeek">' + ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(w => opt(w, w, x.dayOfWeek)).join('') + '</select></label><label class="f">Start<input type="time" data-l="startTime" value="' + esc(x.startTime) + '"></label><label class="f">End<input type="time" data-l="endTime" value="' + esc(x.endTime) + '"></label><label class="f">Time zone<select data-l="timeZone">' + tzs.concat(tzs.includes(x.timeZone) ? [] : [x.timeZone]).map(t => opt(t, t.replace(/_/g, ' '), x.timeZone)).join('') + '</select></label><label class="f">Phone country code<input data-l="phoneCountryCode" value="' + esc(x.phoneCountryCode || '+1') + '"></label></div>' +
      '<h3 style="margin:18px 0 8px">Organizer</h3><div class="form-grid"><label class="f">Name<input data-o="name" value="' + esc(o.name || '') + '"></label><label class="f">Phone<input data-o="phone" value="' + esc(o.phone || '') + '"></label><label class="f">Email<input data-o="email" value="' + esc(o.email || '') + '"></label></div>' +
      '<h3 style="margin:18px 0 8px">Rules (one per line)</h3><label class="f"><textarea data-l="rules" rows="5">' + esc((x.rules || []).join('\n')) + '</textarea></label>' +
      '<h3 style="margin:18px 0 8px">Announcements</h3><div id="ann-list">' + (x.announcements || []).map((a, i) => '<div class="announce" style="display:flex;gap:10px;align-items:center"><div style="flex:1"><small>' + esc(a.date || '') + '</small><div>' + esc(a.text) + '</div></div><button class="btn danger small" data-ann-del="' + i + '">Remove</button></div>').join('') + '</div><div class="form-grid" style="margin-top:8px"><label class="f">Date<input type="date" id="ann-date" value="' + L.todayISO() + '"></label><label class="f" style="grid-column:span 2">Message<input id="ann-text" placeholder="Courts 5 and 6 this week"></label></div><div style="margin-top:10px"><button class="btn court small" id="ann-add">Post announcement</button></div>' +
      '<details class="advanced"><summary>Advanced settings</summary><div class="form-grid" style="margin-top:10px"><label class="f">Captain PIN (optional)<input data-l="editPin" value="' + esc(x.editPin || '') + '" placeholder="blank = anyone can edit"></label><label class="f">Shared data address<input data-l="syncUrl" value="' + esc(x.syncUrl || '') + '" placeholder="https://..."></label></div><p style="color:var(--muted);font-size:.85rem;margin:8px 0 0">A PIN makes the Manage tab ask for a code before editing. The shared data address is where everyone\'s changes are stored; leave it as it is unless you are moving the league to a new server.</p></div></details></div>';
    $$('[data-l]', b).forEach(i => i.onchange = () => { const k = i.dataset.l; x[k] = k === 'rules' ? i.value.split('\n').map(s => s.trim()).filter(Boolean) : i.value.trim(); L.save(); });
    $$('[data-o]', b).forEach(i => i.onchange = () => { x.organizer = x.organizer || {}; x.organizer[i.dataset.o] = i.value.trim(); L.save(); });
    $$('[data-ann-del]', b).forEach(bt => bt.onclick = () => { x.announcements.splice(Number(bt.dataset.annDel), 1); L.save('Announcement removed'); });
    $('#ann-add').onclick = () => { const t = $('#ann-text').value.trim(); if (!t) return; x.announcements = x.announcements || []; x.announcements.push({ date: $('#ann-date').value, text: t }); L.save('Announcement posted'); };
  }

  /* ---------- schedule generator ---------- */
  function renderGenerator() {
    const b = $('#manage-body'); const x = d();
    b.innerHTML = '<p><a href="#manage" id="gen-back">← Back to Backup &amp; tools</a></p><div class="card"><h3>Build a season in one click</h3><p style="color:var(--muted)">Pick the players, the first night and how many weeks. The generator rotates everyone evenly, mixes partners, and spreads ball duty. You can fine-tune any match afterwards.</p>' +
      '<div class="form-grid"><label class="f">First match date<input type="date" id="g-start" value="' + esc(nextWeekday(x.dayOfWeek)) + '"></label><label class="f">Number of weeks<input type="number" id="g-weeks" min="1" max="40" value="12"></label><label class="f">Players per night<select id="g-per">' + opt(4, '4 (doubles)', x.playersPerMatch) + opt(2, '2 (singles)', x.playersPerMatch) + '</select></label><label class="f">Skip these dates (comma separated)<input id="g-skip" placeholder="2026-11-25, 2026-12-23"></label></div>' +
      '<div style="margin-top:12px"><span class="eyebrow">Players in the rotation</span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">' + x.players.filter(p => p.active !== false).map(p => '<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-gp="' + p.id + '"' + (p.role !== 'sub' ? ' checked' : '') + '> ' + esc(p.name) + '</label>').join('') + '</div></div>' +
      '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn court" id="g-append">Add to schedule</button><button class="btn danger" id="g-replace">Replace whole schedule</button></div><div id="g-preview" style="margin-top:12px"></div></div>';
    const run = replace => {
      const ids = $$('[data-gp]:checked', b).map(c => Number(c.dataset.gp)); const per = Number($('#g-per').value); if (ids.length < per) return L.toast('Pick at least ' + per + ' players');
      const skip = new Set($('#g-skip').value.split(',').map(s => s.trim()).filter(Boolean)); const weeks = Number($('#g-weeks').value) || 1; let date = $('#g-start').value; if (!date) return L.toast('Pick a start date');
      if (replace && !confirm('Replace all ' + x.matches.length + ' existing matches? Scores will be lost.')) return;
      const gen = generate(ids, per, weeks, date, skip); if (replace) x.matches = []; let id = nextId(x.matches); gen.forEach(m => { m.id = id++; x.matches.push(m); });
      L.save(gen.length + ' match nights generated'); M.tab = 'schedule'; render();
    };
    $('#g-append').onclick = () => run(false); $('#g-replace').onclick = () => run(true); $('#gen-back').onclick = e => { e.preventDefault(); M.tab = 'publish'; render(); };
  }
  function nextWeekday(name) { const idx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(name); const t = L.todayISO(); const [y, m, dd] = t.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, dd)); if (idx >= 0) { let diff = (idx - dt.getUTCDay() + 7) % 7; if (!diff) diff = 7; dt.setUTCDate(dt.getUTCDate() + diff); } return dt.toISOString().slice(0, 10); }
  function generate(ids, per, weeks, start, skip) {
    const plays = {}, balls = {}, partner = {}, opp = {}; ids.forEach(i => { plays[i] = 0; balls[i] = 0; partner[i] = {}; opp[i] = {}; });
    const key = (a, b) => a < b ? a + '-' + b : b + '-' + a; const pc = {}, oc = {};
    let [y, m, dd] = start.split('-').map(Number); let dt = new Date(Date.UTC(y, m - 1, dd)); const out = []; let made = 0, guard = 0;
    while (made < weeks && guard++ < weeks * 4) {
      const iso = dt.toISOString().slice(0, 10); dt.setUTCDate(dt.getUTCDate() + 7); if (skip.has(iso)) continue;
      // choose players with the fewest appearances; break ties by who played longest ago (index rotation)
      const order = ids.slice().sort((a, b) => plays[a] - plays[b] || (made + ids.indexOf(a)) % ids.length - (made + ids.indexOf(b)) % ids.length);
      const pick = order.slice(0, per); pick.forEach(i => plays[i]++);
      let teamA, teamB;
      if (per === 4) {
        // choose the pairing with the least-used partners and opponents
        const combos = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]]; let best = null, bestCost = 1e9;
        combos.forEach(c => { const a = [pick[c[0][0]], pick[c[0][1]]], b2 = [pick[c[1][0]], pick[c[1][1]]]; let cost = (pc[key(a[0], a[1])] || 0) * 3 + (pc[key(b2[0], b2[1])] || 0) * 3; a.forEach(p1 => b2.forEach(p2 => cost += oc[key(p1, p2)] || 0)); if (cost < bestCost) { bestCost = cost; best = [a, b2]; } });
        teamA = best[0]; teamB = best[1]; pc[key(teamA[0], teamA[1])] = (pc[key(teamA[0], teamA[1])] || 0) + 1; pc[key(teamB[0], teamB[1])] = (pc[key(teamB[0], teamB[1])] || 0) + 1; teamA.forEach(p1 => teamB.forEach(p2 => oc[key(p1, p2)] = (oc[key(p1, p2)] || 0) + 1));
      } else { teamA = [pick[0]]; teamB = [pick[1]]; }
      const bringer = pick.slice().sort((a, b) => balls[a] - balls[b])[0]; balls[bringer]++;
      out.push({ date: iso, teamA, teamB, balls: bringer, status: 'scheduled', sets: [], note: '' }); made++;
    }
    return out;
  }

  /* ---------- publish ---------- */
  function renderPublish() {
    const b = $('#manage-body'); const live = !!d().syncUrl;
    b.innerHTML = '<div class="grid cols-2">' +
      (live ? '<div class="card"><h3>Sharing status</h3><p style="color:var(--muted)">This league is <b>live</b>: every change on this tab is stored on the league server and shown to everyone within about a minute. Nothing else to do.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn court" id="pub-pull">Refresh from server</button><button class="btn soft" id="pub-push">Send my copy now</button></div></div>' : '<div class="card"><h3>Publish your changes</h3><p style="color:var(--muted)">Download <b>league-data.js</b> and replace the file in the website folder, then re-upload the folder to your host.</p><button class="btn primary" id="pub-download">Download league-data.js</button></div>') +
      '<div class="card"><h3>Backup</h3><p style="color:var(--muted)">Save a copy of every player, match and score to a file on your device. Restore it later with Import if anything ever goes wrong.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn soft" id="pub-backup">Download backup</button><label class="btn soft" style="cursor:pointer">Import backup<input type="file" id="pub-import" accept=".js,.json" hidden></label></div></div>' +
      '<div class="card"><h3>Season generator</h3><p style="color:var(--muted)">Starting a new season? Build a balanced rotation for any group of players in one click, then fine-tune nights on the Schedule tab.</p><button class="btn soft" id="pub-gen">Open the generator</button></div>' +
      '<div class="card"><h3>Share link</h3><p style="color:var(--muted)">Copies a link that carries a snapshot of the whole league. Handy for sending someone the current state by text when they are offline.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn soft" id="pub-share">Copy share link</button></div></div>' +
      '<div class="card"><h3>Reset this phone</h3><p style="color:var(--muted)">Throws away the copy stored on this device and reloads from the league server. Use it if this phone ever looks out of date.</p><button class="btn danger" id="pub-reset">Reset this device</button></div></div>';
    const dl = $('#pub-download'); if (dl) dl.onclick = downloadData; $('#pub-backup').onclick = downloadData; $('#pub-share').onclick = copyShare;
    const pull = $('#pub-pull'); if (pull) pull.onclick = async () => { const ok = await L.pullSync({ force: true, announce: true }); L.toast(ok ? 'Up to date' : 'Could not reach the server'); render(); };
    const push = $('#pub-push'); if (push) push.onclick = async () => { L.S.dirty = true; const ok = await L.pushSync(); L.toast(ok ? 'Sent. Everyone now sees this copy.' : 'Could not reach the server'); };
    $('#pub-gen').onclick = () => { M.tab = 'generate'; render(); };
    $('#pub-import').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { let txt = r.result; const i = txt.indexOf('{'); const j = txt.lastIndexOf('}'); const obj = JSON.parse(txt.slice(i, j + 1)); if (!Array.isArray(obj.players) || !Array.isArray(obj.matches)) throw new Error('shape'); const keepUrl = d().syncUrl; L.S.data = L.normalize(obj); if (keepUrl) L.S.data.syncUrl = keepUrl; L.save('Imported ' + f.name); render(); } catch (err) { L.toast('That file is not a league backup'); } }; r.readAsText(f); };
    $('#pub-reset').onclick = () => { if (confirm('Discard the copy on this device and reload the shared league data?')) { try { localStorage.removeItem(L.STORE_KEY); } catch (e) { } location.reload(); } };
  }
  function dataFileText() {
    const x = L.deep(d()); x.updatedAt = new Date().toISOString();
    return '/* League data. Edit on the website (Manage tab) and download, or edit by hand.\n   Dates are YYYY-MM-DD, times are 24-hour HH:MM. Lineups use player ids. */\nwindow.LEAGUE = ' + JSON.stringify(x, null, 2) + ';\n';
  }
  function downloadData() { L.download('league-data.js', dataFileText(), 'text/javascript'); L.toast(d().syncUrl ? 'Backup downloaded' : 'Downloaded. Replace the old league-data.js on your host.'); }
  async function copyShare() { const url = await L.shareURL(); if (url.length > 8000) L.toast('Link is long; texting may split it. Prefer the download.'); try { await navigator.clipboard.writeText(url); L.toast('Share link copied'); } catch (e) { L.openModal('Share link', '<p style="color:var(--muted)">Copy this link and text it to the group.</p><textarea style="width:100%;height:120px;font-size:.75rem">' + esc(url) + '</textarea>'); } }

  window.LeagueManage = { render, scoreDialog, lineupDialog, generate };
})();
