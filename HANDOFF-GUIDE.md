# Tennis league website kit

Two folders are in this zip:

- **wednesday-night-tennis/**  the finished Men's Wednesday Night League site
  with the fall 2026 roster, contacts and schedule already loaded.
- **league-template/**  the same site with blank data, for building sites for
  other leagues. Start with `league-template/SETUP-GUIDE.md`.

Each folder is a complete website: open `index.html` or upload the folder to any
static host. No installs, no accounts required. `README.md` inside each folder
explains day-to-day editing (players, schedule, scores) and publishing.

## What players get
- Home: next match, countdown, who brings balls (spinning ball), announcements,
  leaderboard, rules, add-season-to-calendar.
- Schedule: every night with lineups, ball duty, scores, list or calendar view,
  filter by player or month, text the four players in one tap, per-match calendar
  file, enter score right there.
- Players: contact cards with Text, Call, Email and Save contact buttons, text
  or email the whole group, sub list.
- Standings: auto-computed from played matches with form dots and stat tiles.
- Manage: everything is editable, changes save on the device, publish by
  downloading `league-data.js` or texting a share link. Optional live sync
  server in `server/`.

## Artwork
The spinning racquets, tennis ball, crest and night-court hero video were
generated with Higgsfield and are hosted in your Higgsfield library. The site
loads those hosted copies when online and falls back to the local files in
`assets/` when opened offline or from a folder.
