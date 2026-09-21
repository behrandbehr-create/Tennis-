# Set up a new league site in 15 minutes

No coding. Everything happens in the browser.

1. **Copy this folder** and rename it for the league (example: `mens-3-5-thursday`).
2. **Open `index.html`** in Chrome or Safari.
3. Go to the **Manage** tab.
4. **League info**: league name, tagline, season, club, day, start and end time,
   time zone, and the organizer's contact info. Optional: a captain PIN so only
   people with the code can edit.
5. **Players**: rename the placeholder players, add phones and emails, add subs,
   remove extras. Pick a racquet for each player.
6. **Backup & tools → Season generator**: pick the first night, number of weeks,
   dates to skip, and the players in the rotation. Press **Replace whole
   schedule**. Adjust any night afterwards on Schedule & scores.
7. **Turn on live sharing** so every phone stays in sync automatically:
   Manage → League info → **Advanced settings** → Shared data address. Paste

       https://wednesday-night-tennis.higgsfield.app/api/state?league=YOUR-LEAGUE-NAME

   and replace YOUR-LEAGUE-NAME with a short name using only lowercase letters,
   numbers and dashes (example: `thursday-35-doubles`). Each different name is
   its own separate league.
8. **Backup & tools → Download backup**. Move the downloaded file into the
   folder, replacing `league-data.js`. This makes your setup the starting point
   for everyone who opens the site.
9. **Upload the folder** to Netlify (app.netlify.com/drop takes a folder
   drag-and-drop) and send the link to the players.

Players can enter scores themselves from the Schedule tab or the home page.
The **? Help** button on the site explains everything to them.
