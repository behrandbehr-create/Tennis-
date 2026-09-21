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
  "name": "Flex Singles League",
  "tagline": "Fall singles at the Country Club of Colorado. One opponent a week, play any day that suits you both",
  "season": "Fall 2026",
  "venue": "Country Club of Colorado",
  "venueAddress": "",
  "dayOfWeek": "Any day",
  "startTime": "08:00",
  "endTime": "21:00",
  "timeZone": "America/Denver",
  "phoneCountryCode": "+1",
  "playersPerMatch": 2,
  "flex": true,
  "heroArt": "courts",
  "editPin": "",
  "syncUrl": "https://wednesday-night-tennis.higgsfield.app/api/state?league=ccc-flex-singles",
  "organizer": {
    "name": "Roger Anderson",
    "phone": "214-728-8332",
    "email": "roger.anderson@ccofcolorado.com"
  },
  "rules": [
    "Flex format: you and your opponent pick any day that week that works for both of you. Text them early in the week.",
    "Once you agree on a day and time, email Roger Anderson to have a court blocked for your match.",
    "Matches are best 2 out of 3 sets with no-ad scoring. A 10-point tiebreaker is played in place of a third set.",
    "The player marked with the tennis ball brings a new can of balls.",
    "If you cannot play, it is up to you to find a substitute from the league. No-shows are charged the court fees for the match.",
    "Court fees are $20 per scheduled singles match, plus a one-time $13 administration fee for the season.",
    "Enter your score right after the match so standings stay current."
  ],
  "announcements": [
    {
      "date": "2026-09-14",
      "text": "Welcome to the fall flex singles league. Each week has one match per pairing. Text your opponent, pick a day, then email Roger to block a court. The tennis ball marks who brings balls."
    }
  ],
  "players": [
    {
      "id": 1,
      "num": "1",
      "name": "Seth White",
      "email": "seth.t.white@gmail.com",
      "phone": "917-200-1812",
      "role": "player",
      "avatar": 0,
      "active": true
    },
    {
      "id": 2,
      "num": "2",
      "name": "Kelly Sung",
      "email": "kellysung10@yahoo.com",
      "phone": "719-492-6059",
      "role": "player",
      "avatar": 8,
      "active": true
    },
    {
      "id": 3,
      "num": "3",
      "name": "Brandon Behr",
      "email": "brandon@behrandbehr.com",
      "phone": "719-238-4912",
      "role": "player",
      "avatar": 2,
      "active": true
    },
    {
      "id": 4,
      "num": "4",
      "name": "Nicole Hurt",
      "email": "e.nicolehurt@gmail.com",
      "phone": "256-529-2880",
      "role": "player",
      "avatar": 3,
      "active": true
    },
    {
      "id": 5,
      "num": "5",
      "name": "Caroline Sullivan",
      "email": "carojo475@gmail.com",
      "phone": "719-659-7373",
      "role": "player",
      "avatar": 4,
      "active": true
    },
    {
      "id": 6,
      "num": "6",
      "name": "Alegra Alanis",
      "email": "alegramalanis@yahoo.com",
      "phone": "719-375-9016",
      "role": "player",
      "avatar": 9,
      "active": true
    }
  ],
  "matches": [
    {
      "id": 1,
      "date": "2026-09-14",
      "teamA": [
        1
      ],
      "teamB": [
        6
      ],
      "balls": 1,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 2,
      "date": "2026-09-21",
      "teamA": [
        3
      ],
      "teamB": [
        4
      ],
      "balls": 3,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 3,
      "date": "2026-09-28",
      "teamA": [
        1
      ],
      "teamB": [
        5
      ],
      "balls": 5,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 4,
      "date": "2026-10-05",
      "teamA": [
        2
      ],
      "teamB": [
        4
      ],
      "balls": 4,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 5,
      "date": "2026-10-12",
      "teamA": [
        2
      ],
      "teamB": [
        3
      ],
      "balls": 3,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 6,
      "date": "2026-10-19",
      "teamA": [
        3
      ],
      "teamB": [
        5
      ],
      "balls": 5,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 7,
      "date": "2026-10-26",
      "teamA": [
        2
      ],
      "teamB": [
        5
      ],
      "balls": 2,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 8,
      "date": "2026-11-02",
      "teamA": [
        5
      ],
      "teamB": [
        6
      ],
      "balls": 6,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 9,
      "date": "2026-11-09",
      "teamA": [
        1
      ],
      "teamB": [
        3
      ],
      "balls": 1,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 10,
      "date": "2026-11-16",
      "teamA": [
        2
      ],
      "teamB": [
        4
      ],
      "balls": 4,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 11,
      "date": "2026-11-30",
      "teamA": [
        1
      ],
      "teamB": [
        2
      ],
      "balls": 2,
      "status": "scheduled",
      "sets": [],
      "note": "No match the week of Nov 23 (Thanksgiving)."
    },
    {
      "id": 12,
      "date": "2026-12-07",
      "teamA": [
        3
      ],
      "teamB": [
        6
      ],
      "balls": 3,
      "status": "scheduled",
      "sets": [],
      "note": ""
    },
    {
      "id": 13,
      "date": "2026-12-14",
      "teamA": [
        2
      ],
      "teamB": [
        3
      ],
      "balls": 2,
      "status": "scheduled",
      "sets": [],
      "note": ""
    }
  ],
  "updatedAt": "2026-09-21T23:00:00Z"
};
