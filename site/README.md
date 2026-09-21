# League website: how to run it

This folder is the whole website. There is no build step and nothing to install.

## Open it
- Double-click `index.html` to view it on a computer.
- To share it with the league, upload this folder to any static web host and send
  players the link. Free options that take a drag-and-drop folder: Netlify Drop
  (app.netlify.com/drop), Cloudflare Pages, GitHub Pages, or your club's website.
  Higgsfield websites also work: upload the folder as static files.
- Players should "Add to Home Screen" on their phone so it opens like an app.

## Edit players, schedule and scores
Open the **Manage** tab on the site.
- **Players**: change names, numbers, phones, emails, pick a racquet, add a player
  or sub, mark someone inactive, or **Replace everywhere** when someone drops out
  and another player takes their remaining weeks.
- **Schedule & scores**: enter set scores, change who plays, who brings balls,
  move a date, cancel a night, add a night.
- **League info**: name, season, venue, times, time zone, rules, announcements,
  optional PIN, optional live-sync server.
- **Schedule generator**: builds a balanced rotation for any number of weeks.
- **Publish & share**: two ways to get your edits to everyone.
  1. **Download league-data.js** and replace the file in this folder on your host.
  2. **Copy share link** and text it. Opening the link offers to apply the update.

Scores can also be entered straight from the Schedule tab (Enter score button).

## Edit by hand instead
Everything lives in `league-data.js`. Open it in any text editor. Dates are
`YYYY-MM-DD`, times are 24-hour (`19:00`), lineups use player `id` numbers.

## Standings rules
Only matches marked **Played** count. Rank is by match wins, then win
percentage, then set difference, then game difference. Match tiebreaks count as
a set but not toward games. Unfinished, canceled and scheduled matches do not
count.

## Files
- `index.html`, `css/`, `js/`  the site itself (no need to touch)
- `league-data.js`  all league content
- `assets/`  racquet, ball and court artwork (local copies; the site prefers the
  hosted high-resolution versions when online)
- `server/`  optional live-sync server, see server/README.md

## Uploading to Netlify (or any host)
The host needs `index.html` at the top level of what you upload. Drag the **folder itself** (or a zip made from the *contents* of the folder, not the folder wrapped in another folder) onto app.netlify.com/drop. A ready-made deploy zip is included in the kit for each site.
