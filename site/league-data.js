/* =====================================================================
   LEAGUE DATA  -  this is the ONE file you edit to change the league.
   ---------------------------------------------------------------------
   You can edit it two ways:
     1. On the website: open the "Manage" tab, make changes, then press
        "Download league-data.js" and replace this file on your host.
     2. By hand in any text editor (Notepad, TextEdit, VS Code).
   Rules of thumb when editing by hand:
     - Dates are written YYYY-MM-DD (example: 2026-10-07).
     - Times are 24-hour, HH:MM (7:00 pm = "19:00").
     - Every player has a unique "id" number. Lineups refer to ids.
     - Keep the commas and quotes exactly as they are.
   ===================================================================== */
window.LEAGUE = {
  "name": "Men's Wednesday Night League",
  "tagline": "3.0 to 3.5 doubles on the outdoor courts, Wednesdays 7:00 to 8:30 pm",
  "season": "Fall 2026",
  "venue": "Country Club of Colorado",
  "venueAddress": "",
  "dayOfWeek": "Wednesday",
  "startTime": "19:00",
  "endTime": "20:30",
  "timeZone": "America/Denver",
  "phoneCountryCode": "+1",
  "playersPerMatch": 4,
  "editPin": "",
  "syncUrl": "https://wednesday-night-tennis.higgsfield.app/api/state?league=ccc-mens-wednesday",
  "organizer": { "name": "Roger Anderson", "phone": "214-728-8332", "email": "roger.anderson@ccofcolorado.com" },
  "rules": [
      "Matches are doubles, Wednesdays 7:00 to 8:30 pm on the outdoor courts.",
      "Best 2 out of 3 sets with no-ad scoring. A 10-point tiebreaker is played in place of a third set.",
      "The player marked with the tennis ball brings a new can of balls.",
      "If you cannot make your week, it is up to you to find a substitute from the league or the sub list, then update the lineup here. No-shows are charged the court fees for everyone on the court that night.",
      "Court fees are $10 per scheduled doubles match, plus a one-time $13 administration fee for the season.",
      "Enter the score right after the match so standings stay current."
  ],
  "announcements": [
    { "date": "2026-09-14", "text": "Welcome to the fall season. Check the schedule for your weeks and who brings balls." }
  ],
  "players": [
    { "id": 1, "num": "1",  "name": "Seth White",        "email": "seth.t.white@gmail.com",      "phone": "917-200-1812", "role": "player", "avatar": 0, "active": true },
    { "id": 3, "num": "3",  "name": "Nate Bohne",        "email": "nrbohne@gmail.com",           "phone": "719-661-7063", "role": "player", "avatar": 1, "active": true },
    { "id": 4, "num": "4",  "name": "Brandon Behr",      "email": "brandon@behrandbehr.com",     "phone": "719-238-4912", "role": "player", "avatar": 2, "active": true },
    { "id": 5, "num": "5",  "name": "Tom Zingale",       "email": "tom.zingale@icloud.com",      "phone": "831-331-6127", "role": "player", "avatar": 3, "active": true },
    { "id": 6, "num": "6",  "name": "Sam Garcia",        "email": "samgarcia719@gmail.com",      "phone": "719-472-4705", "role": "player", "avatar": 4, "active": true },
    { "id": 7, "num": "7",  "name": "Tyler Orr",         "email": "tylerorrkendall@gmail.com",   "phone": "719-331-5256", "role": "player", "avatar": 5, "active": true },
    { "id": 8, "num": "8",  "name": "Cameron Gallagher", "email": "cameronggallagher@gmail.com", "phone": "305-586-4315", "role": "player", "avatar": 6, "active": true },
    { "id": 9, "num": "S1", "name": "Erich Groezinger",  "email": "erichgroezinger@gmail.com",   "phone": "614-315-5999", "role": "sub",    "avatar": 7, "active": true }
  ],
  /* teamA and teamB hold player ids. "balls" is the id of who brings balls.
     status: scheduled | played | unfinished | canceled | rescheduled
     sets: list of { a, b } games for Team A and Team B. Add "tb": true for a match tiebreak. */
  "matches": [
    { "id": 1,  "date": "2026-09-16", "teamA": [1, 3], "teamB": [5, 8], "balls": 1, "status": "scheduled", "sets": [], "note": "" },
    { "id": 2,  "date": "2026-09-23", "teamA": [5, 4], "teamB": [7, 8], "balls": 5, "status": "scheduled", "sets": [], "note": "" },
    { "id": 3,  "date": "2026-09-30", "teamA": [1, 3], "teamB": [4, 5], "balls": 3, "status": "scheduled", "sets": [], "note": "" },
    { "id": 4,  "date": "2026-10-07", "teamA": [3, 7], "teamB": [5, 8], "balls": 7, "status": "scheduled", "sets": [], "note": "" },
    { "id": 5,  "date": "2026-10-14", "teamA": [1, 8], "teamB": [3, 5], "balls": 8, "status": "scheduled", "sets": [], "note": "" },
    { "id": 6,  "date": "2026-10-21", "teamA": [4, 7], "teamB": [1, 3], "balls": 4, "status": "scheduled", "sets": [], "note": "" },
    { "id": 7,  "date": "2026-10-28", "teamA": [7, 5], "teamB": [3, 4], "balls": 7, "status": "scheduled", "sets": [], "note": "" },
    { "id": 8,  "date": "2026-11-04", "teamA": [5, 6], "teamB": [4, 8], "balls": 5, "status": "scheduled", "sets": [], "note": "" },
    { "id": 9,  "date": "2026-11-11", "teamA": [6, 7], "teamB": [1, 4], "balls": 6, "status": "scheduled", "sets": [], "note": "" },
    { "id": 10, "date": "2026-11-18", "teamA": [5, 6], "teamB": [1, 3], "balls": 5, "status": "scheduled", "sets": [], "note": "" },
    { "id": 11, "date": "2026-12-02", "teamA": [4, 7], "teamB": [6, 8], "balls": 4, "status": "scheduled", "sets": [], "note": "No match Nov 25 (Thanksgiving week)." },
    { "id": 12, "date": "2026-12-09", "teamA": [4, 6], "teamB": [1, 7], "balls": 4, "status": "scheduled", "sets": [], "note": "" },
    { "id": 13, "date": "2026-12-16", "teamA": [1, 6], "teamB": [5, 3], "balls": 1, "status": "scheduled", "sets": [], "note": "Last match of the season." }
  ],
  "updatedAt": "2026-09-21T21:00:00Z"
};
