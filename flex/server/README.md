# Optional: run your own data server

Normally you do not need anything in this folder. The league uses a shared data
server that is already set up, and every league gets its own space on it by
using a different `?league=name` in the shared data address (see the setup
guide).

`worker.js` is a self-contained alternative for anyone who prefers to host the
data server themselves on a free Cloudflare account. Instructions are at the top
of the file. After deploying it, paste its URL into Manage → League info →
Advanced settings → Shared data address.
