# Optional: live sharing between phones

Out of the box the site works without any server. Edits save on the phone that
made them, and you share them by downloading `league-data.js` (and re-uploading
the folder) or by texting a share link from Manage > Publish & share.

If the league wants scores to appear on everyone's phone automatically, add the
tiny server in `worker.js`. It stores one JSON blob and costs nothing on the
Cloudflare free tier. Step-by-step instructions are at the top of `worker.js`.

Once the URL is pasted into Manage > League info > League server URL, every save
is sent to the server and every visitor loads the newest copy on open.
