# League website: how it works

This folder is the whole website. Upload it to Netlify (or any static host) and
send players the link. Nothing to install.

## Live sharing (already on for this league)
Every change made on the site, from any phone, is stored on the league's shared
data server and shows up for everyone within about a minute. The green **Live**
badge at the top confirms the connection. If a phone is offline, its change waits
and is sent automatically when it is back online.

## Everyday use
- **Home**: next match with countdown, who brings balls, nights still waiting for
  a score, recent results, announcements, leaderboard.
- **Schedule**: every night with lineups and ball duty. Enter score, change
  lineup, text the four players, add to calendar.
- **Players**: text, call, email, save contact, text everyone.
- **Standings**: automatic.
- **Manage**: add or drop players, edit any night, post announcements, backups.
- **? Help** (top right): a short walkthrough of all of the above.

## Backups
Manage → Backup & tools → **Download backup** saves everything to a file.
**Import backup** restores it. Do this once a month or before big roster changes.

## Advanced
- `league-data.js` holds the starting data and the shared data address. Edit it
  only if you are moving the league to a different server.
- `server/` contains an optional self-hosted server for people who want to run
  their own instead of the shared one. Not needed for normal use.
