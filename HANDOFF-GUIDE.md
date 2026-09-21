# Tennis league website kit

Folders in this kit:

- **wednesday-night-tennis/**  the live Men's Wednesday Night League site
  (Country Club of Colorado, fall 2026). Already connected to the shared data
  server, so scores and lineup changes appear for everyone automatically.
- **league-template/**  the same site with blank data, for other leagues.
  Start with `league-template/SETUP-GUIDE.md`.
- **Wednesday-Night-Tennis-DEPLOY.zip** and **League-Template-DEPLOY.zip**
  ready to drop straight onto app.netlify.com/drop.

Each folder is a complete website: open `index.html` or upload the folder to a
static host. `README.md` inside explains day-to-day use, and the site's own
**? Help** button walks players and captains through every feature.

## How saving works
Every change on any phone goes to a small shared server (hosted on the
league's Higgsfield account) and every other phone picks it up within about a
minute. Offline changes wait and send later. If two people save within the same
few seconds, the second one is asked to redo their change so nothing is lost
silently. Backups can be downloaded any time from Manage → Backup & tools.

## Uploading to Netlify (or any host)
The host needs `index.html` at the top level of what you upload. Use the
DEPLOY zips, or drag the folder itself, not a zip that wraps the folder in
another folder.

## Artwork and colors
Country Club of Colorado logos and the outdoor-courts photo come from the club
brand gallery; the racquets and ball were generated with Higgsfield. Brand
colors: forest green #344F2C, olive #728728, paper white, soft gray, charcoal.
