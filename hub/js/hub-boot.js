/* =====================================================================
   Hub boot. One website serves every league.
   The address decides which league is shown:
       .../?league=thursday-35-doubles
   With no league in the address, the directory page is shown instead.
   ===================================================================== */
(function () {
  'use strict';
  const API = 'https://wednesday-night-tennis.higgsfield.app/api/state';
  const params = new URLSearchParams(location.search);
  const raw = (params.get('league') || params.get('l') || '').toLowerCase().trim();
  const slug = /^[a-z0-9][a-z0-9-]{0,48}$/.test(raw) ? raw : '';
  window.LEAGUE_HUB = { api: API, slug, leaguesUrl: API.replace(/\/state$/, '/leagues') };
  window.LEAGUE = {
    name: slug ? 'Loading…' : 'Tennis Leagues', tagline: '', season: '', venue: '', venueAddress: '',
    dayOfWeek: '', startTime: '19:00', endTime: '20:30', timeZone: 'America/Denver',
    phoneCountryCode: '+1', playersPerMatch: 4, editPin: '', organizer: {},
    syncUrl: slug ? API + '?league=' + slug : '',
    rules: [], announcements: [], players: [], matches: [], updatedAt: ''
  };
  if (!slug) document.documentElement.classList.add('hub-mode');
})();
