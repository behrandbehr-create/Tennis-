# Tennis league websites: the whole kit

## Read this part first

There are two ways to hand a league website to somebody.

**The easy way, and the one to use: the hub.** Upload `Tennis-League-Hub-DEPLOY.zip`
once, to one Netlify site. That single site then hosts every league, forever. The
person you hand it to never touches a file, a zip, or a hosting account. They open
the link, press **Start a new league**, answer four short screens, and their league
is live with its own link to send to players.

**The old way, still here if you want it:** one uploaded folder per league
(`Wednesday-Night-Tennis-DEPLOY.zip`, `Flex-Singles-League-DEPLOY.zip`,
`League-Template-DEPLOY.zip`). This needs somebody willing to edit a data file and
run an upload for each new league. The two existing league sites were built this
way and keep working exactly as they are. Nothing has to move.

## Setting up the hub, once, about five minutes

1. Go to app.netlify.com/drop.
2. Drag `Tennis-League-Hub-DEPLOY.zip` onto the page.
3. Netlify hands back a link like `https://something-random.netlify.app`. Rename
   the site in Netlify to something readable, for example
   `https://ccc-tennis-leagues.netlify.app`.
4. That link is the whole handoff. Give it to the tennis pro and you are done.

## What the person you hand it to actually does

They get one link. On it:

- **A list of every league**, so a player who lost their link can find theirs.
- **Start a new league**, the four-step setup:
  1. League name, season, where it is played.
  2. Players, with phone numbers and email. Singles or doubles.
  3. Which night, what time, how many weeks. Or a flex league, where each week is
     a window rather than a fixed night.
  4. The person in charge, with their phone number, so players know who to call.
- It builds the season for them: balanced lineups, different partners and
  opponents week to week, and ball duty spread so everybody brings the same
  number of cans.
- It finishes by handing them their league's link, a button that texts that link
  to every player at once, and a calendar file for the season.

Every league link looks like `https://your-site.netlify.app/?league=mens-wednesday`.
That is the link players save to their phone's home screen.

## The three pages to print

In `hub/print/`, or on the hub itself at the bottom of the league list. Open in a
browser and press Print.

- **quick-start.html** - one page on creating a league. Hand this to an organizer
  along with the hub link.
- **`player-card.html?league=<league name>`** - one page for players. It fills in
  that league's own link and the organizer's phone number automatically, so you can
  print a stack and leave them in the pro shop.
- **troubleshooting.html** - one page on what to do if something looks wrong. Short
  and plain: mostly "pull down to refresh" and "who to call".

## How saving works

Every change on any phone goes to a small shared data server and every other phone
picks it up within about a minute. The green **Live** badge at the top of a league
confirms the connection. A change made with no signal waits and sends itself when
the phone is back online. If two people save within the same few seconds, the
second one is shown the newer version and asked to redo their change, so nothing is
lost silently. Backups download any time from Manage → Backup & tools.

Every league lives in its own space on that server, decided by the `?league=` name
in the link. Nothing one league does can touch another.

## Deleting a league

Inside a league, Manage → Delete this league. It asks for the league's name to be
typed out before it will do it. Use it for test leagues and finished seasons.

## What is in this kit

| | |
|---|---|
| `Tennis-League-Hub-DEPLOY.zip` | **The one to upload.** Hosts every league. |
| `hub/` | The same thing unzipped, if you want to look inside. |
| `Wednesday-Night-Tennis-DEPLOY.zip` | The existing Men's Wednesday Night League site. |
| `Flex-Singles-League-DEPLOY.zip` | The existing Flex Singles League site. |
| `League-Template-DEPLOY.zip` | Blank single-league site, the old one-folder-per-league way. |
| `hub/print/` | The three printable pages. |
| `hub/server/` | Optional, only if you ever want to host the data yourself. |

Each folder is a complete website: open `index.html` or upload the folder. The
`README.md` inside explains day-to-day use, and the site's own **? Help** button
walks players and captains through every feature.

## Uploading anything here

The host needs `index.html` at the top level of what you upload. Use the DEPLOY
zips, or drag the folder itself. Do not zip a folder and upload that, because it
buries `index.html` one level down and the host will show a file listing instead
of the site.

## Artwork and colors

Country Club of Colorado logos and the outdoor-courts photo come from the club
brand gallery. The racquets and the ball were generated with Higgsfield. Brand
colors: forest green #344F2C, olive #728728, paper white, soft gray, charcoal.
