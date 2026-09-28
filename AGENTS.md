# AGENTS.md

Briefing for coding agents (Codex, Claude Code, etc.) working on this repo.
Read this first.

## What this is

Websites for Country Club of Colorado tennis leagues, plus a retro tennis game
(League Arcade) built into the live league site.

- Live site: https://ccc-mens-doubles-fall.netlify.app (Men's Wednesday Night
  League, fall 2026, 8 players, doubles with rotating partners).
- Owner: Brandon Behr. Organizer: Roger Anderson.
- Players are adults. Keep the league site classy and quiet. The arcade is
  where the loud, gamey stuff lives.

## Layout

| Path | What it is |
|---|---|
| `site/` | **The live Wednesday league site.** This is where most work happens. |
| `site/index.html`, `site/js/app.js`, `site/js/manage.js`, `site/css/style.css` | League site: schedule, scores, standings, players, captain tools. |
| `site/league-data.js` | Starting data + `syncUrl` (the shared server address). |
| `site/arcade.html`, `site/js/arcade.js`, `site/css/arcade.css` | **League Arcade**, the retro tennis game. |
| `site/js/arcade-widget.js` | Arcade teaser on Home and arcade ladder under Standings. |
| `site/assets/` | Club logos, court photo, racquet avatar art (`racquet-0..7.webp`). |
| `flex/` | Flex Singles League site (same code, singles + flex weeks). No arcade yet. |
| `template/` | Blank copy of the site for new leagues. No arcade yet. |
| `kids/rally-rush/` | Early one-file game prototype for a high school version. Not linked from the site. |
| `ENGAGEMENT-STRATEGY-ADULTS.md`, `ENGAGEMENT-STRATEGY-KIDS.md` | Product strategy docs. |
| `docs/server-api-state.ts` | Reference copy of the shared server's API (see below). |
| `tools/test-arcade.js` | Headless smoke test for the site and the game. |
| `*-DEPLOY.zip` | Ready-to-upload Netlify bundles. **Rebuild after changing `site/`** (see Deploy). |

## Hard rules

1. **No build step, no frameworks, no npm dependencies in the sites.** Plain
   HTML, CSS and vanilla JS in IIFEs. Everything must work by double-clicking
   `index.html` and on any static host.
2. **Never write test data to the live server.** Always mock
   `https://wednesday-night-tennis.higgsfield.app/**` in tests (see
   `tools/test-arcade.js`).
3. **The game must never write to the real league slot.** The arcade only
   writes to `<league>-arcade` (for example `ccc-mens-wednesday-arcade`). The
   real slot (`ccc-mens-wednesday`) holds scores and is written only by the
   league site's own save flow.
4. **Privacy:** player phones and emails are in `league-data.js` for the
   league site. Never put them in anything published outside the site.
5. **Writing style for all user-facing copy and docs: no em dashes.** Plain,
   friendly, human wording.
6. Keep changes in `site/` mirrored to `flex/` and `template/` only when asked.
   The three have diverged slightly.

## Shared data server (how saving works)

A small API hosted separately on Higgsfield. It is not in this repo; a
read-only copy of its code is in `docs/server-api-state.ts`.

- `GET  /api/state?league=<slug>` returns `{ version, updatedAt, data }`
  (`data` is `null` until the first save).
- `PUT  /api/state?league=<slug>` with `{ baseVersion, data }` returns
  `{ version, updatedAt }`, or **409** `{ error: 'stale', version, data }`
  when `baseVersion` is not the current version (optimistic concurrency).
- `data` **must** contain `players` and `matches` arrays or the PUT is
  rejected. Max 600 KB. Slug: `^[a-z0-9][a-z0-9-]{0,48}$`.
- League site: `site/js/app.js` `pullSync` / `pushSync`, polls every 45 s.
- Arcade: `site/js/arcade.js` section 2. Stores
  `{ players: [], matches: [], arcade: { profiles: { <playerId>: profile } } }`
  in the `-arcade` slot. On 409 it re-reads, merges its own profile in, and
  retries. Per-profile conflicts resolve by newest `updated` timestamp.

## League data model (`league-data.js`)

- `players[]`: `{ id, num, name, email, phone, role: 'player'|'sub', avatar (0-7 racquet art), active }`
- `matches[]`: `{ id, date 'YYYY-MM-DD', teamA [ids], teamB [ids], balls (id who brings balls), status 'scheduled'|'played'|'unfinished'|'canceled'|'rescheduled', sets [{a, b, tb?}], note }`
- A match counts only when `status === 'played'` and it has sets.
- Standings: wins, then win %, then set diff, then game diff. Match tiebreak
  sets count as sets, not games.

## League Arcade (`site/js/arcade.js`)

Sections are numbered in the file:

1. **League data**: loads `window.LEAGUE`, the site's cached copy
   (`localStorage['league-data-v2']`), then the live server. Computes real
   records and ranks (`realStats`).
2. **Profile + saving**: profile shape in `newProfile()`. Local key
   `arcade:<slug>:<playerId>`, current player `arcade:<slug>:me`.
   Progression (`levelOf`, `give`, `unlock`), tour order (`tourList`, weakest
   real record first), AI skill from real record (`skillFor`), surfaces, daily
   challenge (seeded by league slug + date, same for everyone).
3. **Rendering setup**: 180 px wide low-res canvas scaled up with
   `image-rendering: pixelated`. World units are meters: x across (singles
   sideline 4.115, doubles 5.485), y down the court (near baseline -11.885,
   far +11.885, net at 0), z height. `P(x, y, z)` projects to screen with mild
   perspective. The court is pre-rendered per surface in `buildCourt`.
4. **Game state + physics**: `stepBall` (gravity, spin, bounce, net),
   `predict(side)` simulates ahead to find the contact point (used by both the
   AI and the auto-run assist), `launch` solves initial velocity to land on a
   target while clearing the net. Scoring is Fast4 (first to 4 games, no-ad,
   tiebreak to 5 at 3-3) or a first-to-7 tiebreak.
5. **Shots**: human swipe to shot params (`playerShotParams`), `executeHit`,
   AI shot choice and error model (`aiDecide`), serving (`doServe`), bounce
   rules (`onBounce`), point ends (`endPoint`), Target Practice.
6. **Input**: swipe classification in `readSwipe` (tap, drive, drop, lob,
   curve). Timing grades PERFECT / GREAT / GOOD / EARLY / LATE come from time to
   contact when the swipe lands. Early swipes are buffered and fire at contact.
   Keyboard is supported for desktop.
7. **Main loop**: `update(dt)` and `draw()`.
8. **Sound**: WebAudio synth, no audio files.
9. **Results + rewards**.
10. **Menus**: DOM screens rendered into `#ui`.
11. **Boot**.

`window.__arcade` exposes internals (`update`, `G`, `ball`, `near`, `far`,
`startMatch`, `swingHuman`, `releaseServe`, `serveMeterVal`, `sweetZone`) for
tests. `window.ARCADE_ART` can override racquet image URLs (used for
single-file previews).

### Tuning knobs (most likely things to change)

- AI speed and reach: `startMatch` (`far.speed`, `far.reach`).
- AI error rates: top of `aiDecide` (`pErr`).
- Timing windows: `swingHuman` (`pw`, `gw`).
- Shot pace and depth: `playerShotParams`.
- Serve sweet zone: `sweetZone`.
- Rewards: `matchResults`, `completeDaily`, and the real-league bonus in
  `screenHub` (300 coins per real win, 50 per ball duty).

## Testing

```bash
npm i -D playwright && npx playwright install chromium   # once
node tools/test-arcade.js
```

It mocks the server, plays a full match and a Target Practice round with a
bot in fast-forward, checks the profile saved to the `-arcade` slot, and writes
screenshots to `tools/out/`. Prints PASS or FAIL.

Also check `node -e "new Function(require('fs').readFileSync('site/js/arcade.js','utf8'))"`
for syntax after edits.

## Deploy

The site is a static folder on Netlify. The zip must have `index.html` at its
top level:

```bash
rm -f Wednesday-Night-Tennis-DEPLOY.zip
(cd site && zip -qr ../Wednesday-Night-Tennis-DEPLOY.zip README.md arcade.html index.html league-data.js assets css js server)
```

Then drag the zip onto the site in app.netlify.com (Deploys tab).

## Known gaps and good next tasks

- Nobody has hand-tested the arcade on a real phone yet. Expect timing and
  difficulty tuning.
- Arcade is not yet in `flex/` or `template/`.
- The arcade uses the honor system (anyone can pick any name), same as the
  league site.
- Ideas in the strategy docs not built yet: identity picker and faster score
  entry on the league site itself, win balls under names, reactions, pick'em,
  weekly recap, season wrapped.
