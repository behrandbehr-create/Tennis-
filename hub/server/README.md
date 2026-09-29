# Optional: run your own data server

You almost certainly do not need anything in this folder. The hub already points
at a shared data server that is set up and running, and every league gets its own
space on it automatically from the `?league=name` in its link.

`worker.js` is a self-contained replacement for that server, for anyone who would
rather host the data on their own free Cloudflare account. It handles every league
on one Worker, exactly the way the shared server does: the league list, reading a
league, saving with a version check so two people cannot silently overwrite each
other, and deleting a league.

Instructions are at the top of the file. Once it is deployed, open `js/hub-boot.js`
in the hub and change the single `API` line to your Worker address ending in
`/api/state`.
