# Making the league site something players want to open

A strategy for the Men's Wednesday Night League site (ccc-mens-doubles-fall).
Goal: scores get entered the night of the match, and all eight guys check the
standings every week because they want to, not because they're told to.

---

## 1. First, what we're actually designing for

This isn't an app with thousands of users. It's **8 guys, 13 Wednesdays, one
court.** That changes everything:

- Each week **4 players are on court and 4 are not.** Right now the site only
  gives the 4 players a reason to visit, and really only one of them (whoever
  enters the score). The other 4 have almost no reason to open it that week.
- Each player plays roughly **6 or 7 matches all season.** Every single result
  is a big deal to that player. We don't need to invent drama; we need to show
  it.
- Partners rotate, so standings are individual. That creates natural stories
  (best partner, rivalries, upsets) the site currently doesn't tell.
- The group text is already the real hub. The site should **feed the group
  text**, not compete with it.
- There's no login. Anyone can edit. That's a feature (zero friction), and
  anything we add should keep it that way.

So the whole strategy boils down to one loop:

> **Match ends → score entered in under 15 seconds → something satisfying
> happens → it lands in the group text → the other 4 tap the link → they see a
> story, not just a table → they come back next Wednesday.**

Every idea below strengthens one link in that loop.

---

## 2. What the research says actually works (and what doesn't)

These are patterns that games and apps keep coming back to because they
keep working. Picking the ones that fit a classy club site:

| Pattern | Where it comes from | How it shows up here |
|---|---|---|
| **Instant, proportional feedback** | Every good game. The "juice" of a button press. | Standings visibly re-sort the moment you save a score. |
| **Visible progress / collections** | Apple Watch rings, Strava trophies, Pokémon | Win balls filling a ball can under your name. |
| **Unfinished business (Zeigarnik effect)** | Progress bars, LinkedIn profile meter | Empty ball slots for matches you haven't played yet. |
| **Variable, surprising rewards** | Loot drops, Duolingo chests | Hidden badges you discover by doing something notable. |
| **Stakes before the event** | Fantasy sports, March Madness brackets | "Win tonight and you move into 1st." |
| **Social reciprocity** | Strava kudos, Instagram likes | One-tap reactions on results. |
| **Shareable results** | Wordle's emoji grid, Strava's activity cards | A clean result card to drop in the group text. |
| **Participation for spectators** | Pick'em games, prediction markets | The 4 guys not playing pick tonight's winner. |
| **Peak-end rule** | Kahneman's research on memory | Nail the moment right after saving, and the season finale. |
| **Year-in-review** | Spotify Wrapped, Strava Year in Sport | A personal season recap card in December. |

**What to avoid** (this is where "cheesy" comes from):

- Fake currencies, XP, points for opening the app. Grown men in a club league
  will roll their eyes.
- Confetti for everything. Celebration loses meaning when it's constant.
- Nagging. One well-timed reminder beats five.
- Anything that punishes. Losing streaks, "you missed a day" guilt, public
  shaming for late scores.
- Sound effects. Nobody wants their phone to go "ding-ding-ding" in the
  locker room.

---

## 3. Design rules so it stays classy

1. **Tennis-native, not game-native.** Use balls, cans, scoreboards,
   trophies, the club greens. Never stars, coins, gems or generic confetti.
2. **Reward size matches the event.** Saving a score gets a small, crisp
   moment. Taking 1st place gets a bigger one. Winning the season gets the
   biggest. Nothing else gets celebrated.
3. **One moment per action.** Motion lasts under a second and then gets out of
   the way.
4. **Everything is derived from scores.** Badges, streaks, stats all compute
   from the match data that already exists. No extra chores for Roger.
5. **Respect "reduce motion"** on phones and keep the page fast.
6. **Winners get highlighted, losers never get singled out.**

---

## 4. The ideas

Ranked roughly by impact for effort. Each one says what it is, why it works,
and how it fits the current code.

### Idea 1. "Who are you?" one-tap identity (the foundation)

**What:** The first time someone opens the site, a row of the 8 racquet
avatars appears: "Tap your name." Stored on that phone. No password, no
account. There's a small "Not you?" link to switch.

**Why:** Almost every idea below gets 10x better when the site knows who's
looking. "Your match tonight." "You're 2-0 with Seth." "You moved up to 3rd."
Personal beats generic every time.

**Fits the code:** Store the player id in `localStorage` next to the existing
cache. Nothing on the server changes. Keep it honor-system, same as the rest
of the site.

---

### Idea 2. Make entering a score take 10 seconds

**What:** Rebuild the score dialog around thumbs, not keyboards.
- Opening the site on match night after 8:15 pm shows **one big card at the
  top**: "Enter tonight's score" with the four faces.
- Tap which team won. Then each set is **one tap on a common score**: `6-0`
  `6-1` `6-2` `6-3` `6-4` `7-5` `7-6`, plus "other" for oddballs. Losing set
  and match tiebreak work the same way.
- A single **Save** button. Done.

**Why:** Every second of friction is a chance for "I'll do it later," and
later means never. The easiest reward you can give someone is not wasting
their time. Duolingo, Strava and every successful habit app obsess over the
first 10 seconds.

**Fits the code:** `scoreDialog` in `js/manage.js` already handles sets and
tiebreaks. This is a new front end on the same data (`sets: [{a, b, tb}]`).
The number inputs stay available under "Enter exact games."

---

### Idea 3. The payoff moment: watch the standings move

**What:** Right after saving, instead of just a toast, the site slides to a
mini standings view and **the rows physically re-sort**. Players who moved up
get a small green `▲2`; the new leader's row gets a short gold shimmer. On
phones, one short vibration tap. Then it settles and stays still.

A line of copy tells the story: *"Brandon and Tom take it 6-4, 7-5. Brandon
moves into 2nd."*

**Why:** This is the peak-end rule in action. The moment right after an
action is the one people remember and want to feel again. Seeing your name
jump two spots is *far* more satisfying than confetti, and it's actually
information, so it never feels cheesy.

**Fits the code:** `standings()` already produces the ordered list. Take a
snapshot before save, one after, and animate the difference (the standard
"FLIP" animation technique, no library needed). `navigator.vibrate(15)` for
the tap on Android; iOS just skips it.

---

### Idea 4. Win balls and the ball can (your idea, refined)

**What:** Every win adds a tennis ball next to the player's name. Three balls
fill a **ball can**. When a can fills, it gets its lid and turns into a small
solid can icon, and the next ball starts a fresh can.

- On the standings and player pages, **empty ghost slots** show the matches
  you still have left this season. So Tyler sees `🎾🎾○○○○` and knows there are
  four more chances to fill it.
- When you win, your new ball **drops in** with a small bounce during the
  payoff moment from Idea 3.

**Why:** It turns a number ("W: 2") into a *collection*, which people care
about far more. The ghost slots are the unfinished business that pulls you
back. And the can is tennis-native, a little witty, and completely on brand.

**Important catch:** the site already uses a tennis ball to mean **"this guy
brings balls."** Two meanings for one icon will confuse people. Fix: switch
the ball-duty marker to a small **can with a "NEW" label**, and let the loose
ball mean a win. Or keep the ball for duty and use the can for wins. Either
works, just not both as balls.

**Fits the code:** `standings()` already counts `w` and `scheduled` per
player, so this is pure rendering. The ball art is already in `assets/`.

---

### Idea 5. Racquet avatars that react to how you're playing

**What:** The spinning racquet avatars are already the site's signature. Let
them reflect form, subtly:
- **Hot hand:** win 2 or more in a row and the little orbiting ball glows
  and moves a bit faster.
- **Leader:** whoever is in 1st gets a thin gold ring around their avatar,
  everywhere they appear on the site.
- **Unbeaten:** still undefeated deep into the season? A small "unbeaten"
  tag.

Losses change nothing. Streaks just quietly fade.

**Why:** Status that follows you around the site is a strong motivator (think
Reddit flair, Xbox gamerscore). And it makes the current leader a visible
target, which makes everyone else want to check.

**Fits the code:** `avatarHTML()` already has the ring, disc and orb pieces.
Add a class based on the player's `form` array from `standings()`.

---

### Idea 6. Stakes on every match card

**What:** Before each match, the card says what's on the line:
- *"Winners move into 1st place."*
- *"Seth and Nate are 3-0 together. Can Tom and Cam break it?"*
- *"Rematch: Tyler beat Brandon on Sept 23."*

After the match, the same spot turns into the headline.

**Why:** This is the fantasy sports hook. People check results when they care
about the outcome *before* it happens. It gives the 4 players a reason to look
beforehand, and the other 4 a reason to find out what happened.

**Fits the code:** Run `standings()` twice with a pretend result for each
side and compare ranks. Partner and head-to-head history comes from looping
`matches`. A handful of sentence templates, no AI needed.

---

### Idea 7. The result card for the group text

**What:** After saving a score, a button: **"Send to the group."** It opens a
text to all 8 players with something like:

```
🎾 Wed Night League, Sept 23
Behr / Zingale def. Orr / Gallagher
6-4  7-5
Behr moves up to 2nd.
Standings: ccc-mens-doubles-fall.netlify.app
```

A nicer version later: generate a clean image card in club colors (the
scoreboard look) that people can save and share.

**Why:** The group text is where these guys already live. Wordle went viral
because sharing the result was one tap and looked good. This is the single
best way to get the 4 non-players onto the site that night.

**Fits the code:** `smsLink()` already builds multi-recipient texts. The image
version uses a `<canvas>` and the share sheet (`navigator.share`), which works
on iPhones.

---

### Idea 8. Pick'em for the guys sitting out

**What:** On match day, the 4 players *not* playing tonight see: **"Who takes
it tonight?"** with two buttons. One tap. Picks lock at 7:00 pm. After the
score is in, there's a quiet "Picks" column: who called it. A small season-long
**Pick'em leaderboard** sits under the main standings.

**Why:** This fixes the biggest hole in the current design: half the league
has no reason to visit on any given week. Now they have a stake in a match
they're not even playing, and a reason to check the result the moment it's
in. It's the same reason people care about brackets for teams they don't
follow.

**Fits the code:** Add a `picks` object to each match, like
`{ "6": "A", "9": "B" }`. It saves through the existing shared sync. Only
works with Idea 1 (identity).

---

### Idea 9. Hidden badges worth talking about

**What:** A short list of tennis-native achievements that unlock
automatically from scores. They show as **locked silhouettes** until someone
earns one, so the first person to get each one gets a little moment and a
mention in the next result text.

| Badge | How you earn it |
|---|---|
| **Bagel** | Win a set 6-0 |
| **Breadstick** | Win a set 6-1 |
| **Clutch** | Win a match tiebreak |
| **Comeback** | Lose the first set, win the match |
| **Iron Man** | Play every scheduled week, no subs |
| **Ball Boy** | Bring the balls every time it's your turn |
| **Reporter** | Enter a score within 30 minutes of the match ending, 3 times |
| **Giant Killer** | Beat a team that includes the current 1st place player |
| **Perfect Partner** | Win with 4 different partners |
| **Season Champ** | Finish 1st |

Keep it to about ten. Scarcity is what makes them mean something.

**Why:** Unknown rewards drive curiosity (it's why loot boxes work, used
here in a harmless way). Badges also turn a loss into a story ("lost, but
got my Clutch badge in the tiebreak").

**Fits the code:** All but "Reporter" come straight from `matches` data.
"Reporter" needs Idea 11.

---

### Idea 10. Player pages with partner and rival stats

**What:** Tapping any player opens their page:
- Win balls and badges (Ideas 4 and 9)
- A small **rank-over-time line** across the season
- **Best partner:** "4-0 with Nate"
- **Toughest opponent:** "0-2 against Cam"
- Upcoming matches and who brings balls

**Why:** Partners rotate, so the most interesting stats in this league are
about *pairings*. That's the stuff guys will bring up over beers. Depth gives
people a reason to poke around instead of glancing and leaving.

**Fits the code:** The Players tab exists; this extends each player's card or
opens it in the existing modal.

---

### Idea 11. "Reported by" credit

**What:** Under each final score: *"Reported by Brandon, 9 minutes after the
match."* Feeds the Reporter badge. No shaming for late or missing scores,
just credit for fast ones.

**Why:** Recognition is cheap and powerful. It quietly makes entering the
score a small point of pride instead of a chore.

**Fits the code:** When a score is saved, store `reportedBy` (from Idea 1)
and `reportedAt` on the match.

---

### Idea 12. One smart reminder, through the calendar

**What:** The site's "Calendar" button already exports match events. Add a
built-in alert to each event at 8:35 pm: *"Enter tonight's score"* with the
link. It fires on the phone automatically, no app needed.

**Why:** The right reminder at the right moment beats everything else on this
list for getting scores in on time. And it's one reminder, once, when it's
actually useful. No nagging.

**Fits the code:** Add a `VALARM` block to `icsFor()`. About 5 lines. Later,
if the site becomes a home-screen app, real push notifications are possible
(iPhones support them for home-screen web apps).

---

### Idea 13. Reactions on results

**What:** Under each result, three small buttons: 🎾 👏 🔥. Tap one, it
counts. Shows the faces of who reacted.

**Why:** Strava's "kudos" is one of the most effective retention features
ever built. People come back to see who reacted, and they react back.
Reciprocity is powerful in small groups where everyone knows each other.

**Fits the code:** A `reactions` object on each match keyed by player id.
Uses the existing sync.

---

### Idea 14. The Wednesday Wire (auto recap)

**What:** A short auto-written recap at the top of Home each Thursday, styled
like a club newsletter clipping:
- **Result of the week** and the score
- **Upset alert** when a lower-ranked side wins
- **Closest match** (tiebreaks, 7-6 sets)
- **Race for 1st:** "Two wins separate the top four with 5 weeks left."

**Why:** Stories beat tables. This gives the site a "what's new" every
single week, even for the guy who wasn't there.

**Fits the code:** Plain templates filled from the data. Same engine as
Idea 6.

---

### Idea 15. Season Wrapped (the finale)

**What:** After the last match (Dec 16), each player gets a personal
swipeable recap: record, win balls and cans, badges, best partner, biggest
win, rank journey, how many of their picks they got right. The champion gets
a trophy card the club could even print.

**Why:** Spotify Wrapped proves people love a personal story and love sharing
it. It ends the season on a high (peak-end rule again), and that feeling is
what gets people to sign up for spring.

---

## 5. Suggested rollout

**Phase 1: the core loop (biggest bang, a weekend of work)**
1. Who are you? (Idea 1)
2. 10-second score entry (Idea 2)
3. Standings move after saving (Idea 3)
4. Win balls and cans, with the ball-duty icon fixed (Idea 4)
5. Send to the group (Idea 7, text version)
6. Calendar reminder at 8:35 pm (Idea 12)

**Phase 2: stories and status**
7. Stakes on match cards (Idea 6)
8. Avatars react to form (Idea 5)
9. Badges (Idea 9)
10. Player pages (Idea 10)
11. Reported by (Idea 11)

**Phase 3: the social layer**
12. Pick'em (Idea 8)
13. Reactions (Idea 13)
14. Wednesday Wire (Idea 14)
15. Season Wrapped (Idea 15), built in time for December

---

## 6. How to know it's working

Keep it simple. Three things to watch:

1. **Time to score.** How long between the match ending and the score being
   entered. Goal: same night, every week.
2. **Who's visiting.** How many of the 8 open the site each week. A tiny
   counter on the sync server, keyed by the "Who are you?" id, is enough.
3. **Non-player visits.** Of the 4 who didn't play, how many checked the
   result that night. This is the number Pick'em and the group text should
   move.

If Phase 1 gets scores in on time and all 8 guys looking weekly, the rest is
a bonus.
