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
- **Arcade**: League Arcade, a retro tennis game (see below).

## League Arcade (arcade.html)
A retro tennis game built into the site to keep players coming back between
matches.
- Players pick their name once. Progress saves on the phone and to the league's
  shared data server in its own slot (`<league>-arcade`), so it follows them to
  any phone. The real league data is never touched by the game.
- Every opponent is a real league player, with their real name, number and
  racquet. Difficulty comes from their real record. The League Tour runs from
  the weakest real record to the strongest, so the real #1 is the final boss.
- Real results pay out in the game: 300 coins for every real win entered on the
  site and 50 for bringing the balls. A missing score shows up as a reminder.
- Modes: League Tour, Quick Match (Fast4 or tiebreak; hard, clay or grass),
  Daily Challenge (same one for everyone each day, with streaks), Target
  Practice. Pro Shop for training, racquets and shirts. 20 trophies.
- The Home page shows the arcade top three and Standings shows the full arcade
  ladder.

## Backups
Manage → Backup & tools → **Download backup** saves everything to a file.
**Import backup** restores it. Do this once a month or before big roster changes.

## Advanced
- `league-data.js` holds the starting data and the shared data address. Edit it
  only if you are moving the league to a different server.
- `server/` contains an optional self-hosted server for people who want to run
  their own instead of the shared one. Not needed for normal use.
