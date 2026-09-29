# Tennis League Hub

One website that hosts every league. Upload this folder once. After that, nobody
needs a computer person again: new leagues are created from inside the site.

## How it works

- **The hub link** (for example `https://your-site.netlify.app/`) shows a list of
  every league and a **Start a new league** button.
- **Each league gets its own link**: `https://your-site.netlify.app/?league=mens-wednesday`.
  That is the link you send to players. It opens straight to that league's home
  page with the schedule, contacts, standings and the Manage tab.
- All of the leagues share the same shared data server, so a score entered on a
  phone shows up for everyone else within about a minute. The green **Live**
  badge at the top confirms the connection.

## Starting a league (what the organizer does)

1. Open the hub link and press **Start a new league**.
2. Four short steps: league name and season, the players and their phone
   numbers, the night and how many weeks, then the person in charge.
3. The site builds the whole schedule: balanced lineups, different partners and
   opponents each week, and ball duty spread evenly so everyone brings the same
   number of cans.
4. Press **Create the league**. It hands back the league's link, a button to
   text the link to all of the players, and a calendar file for the season.

Nothing is installed and nothing is downloaded. The league is live the moment
it is created.

## Everyday use inside a league

- **Home**: next match with a countdown, who brings balls, nights still waiting
  for a score, recent results, announcements, leaderboard.
- **Schedule**: every week with lineups and ball duty. Enter a score, change the
  lineup, text the players, add to calendar. Past weeks stay reachable so a
  score can still be entered days later.
- **Players**: text, call, email, save a contact, text everyone at once.
- **Standings**: automatic from the scores.
- **Manage**: add or drop players, edit any week, post an announcement, download
  a backup, delete the league.
- **? Help** (top right): a walkthrough of all of the above, built into the site.

## Printable handouts

In `print/`, ready to print from a browser:

- `quick-start.html` - one page on creating a league. Give this to an organizer.
- `player-card.html?league=<league-name>` - one page for players, with the
  league's own link and the organizer's phone number filled in.
- `troubleshooting.html` - one page on what to do when something looks wrong.

## Uploading

Any static host works. On Netlify, drag this folder (or the deploy zip) onto
app.netlify.com/drop. The host needs `index.html` at the top level of what you
upload, so drop the folder itself, not a zip that wraps it in another folder.

## Advanced, only if you are moving servers

- `js/hub-boot.js` holds the one line naming the shared data server (`API`).
  Change it only if the league data is moving somewhere else.
- `server/` is an optional self-hosted version of that server, for anyone who
  wants to run their own instead of the shared one. Not needed for normal use.
