# The high school playbook

**Edition: Kids (high school).** The adult edition is quiet and classy on
purpose. This one isn't. Teenagers grew up on Fortnite, Call of Duty, FIFA
Ultimate Team, Clash Royale and Rocket League. They already understand ranks,
rarity, season passes and victory screens. So we speak that language, but
point all of it at three things:

1. **Play real tennis** (the main quest)
2. **Report and track real results** (the standings)
3. **Be a good sport** (worth as much as winning)

A playable prototype of the phone mini game is in `kids/rally-rush/`. Open
`index.html` on a phone to try it.

---

## 1. The rules that keep this healthy

Before any shiny stuff, these are the guardrails. Everything else follows them.

1. **Real tennis always pays the most.** You can't grind the mini game to the
   top. Real matches, real practice and real sportsmanship earn most of the
   XP. The game is dessert.
2. **Sportsmanship is a stat, and it unlocks the rarest stuff.** The coolest
   item in the whole system should be impossible to get by winning alone.
3. **Nobody pays for anything. No loot boxes, ever.** Everything is earned and
   the path to earn it is visible. Paid random rewards are regulated as
   gambling in some countries, and parents rightly hate them.
4. **No free-text chat, no DMs.** Kids talk using preset quick-chat lines,
   like Rocket League's "What a save!" All of them are positive.
5. **Losing still moves you forward.** Every match earns XP. A tough loss to
   a stronger player barely dents your rank.
6. **Honest scores.** Both sides confirm every score. The coach settles
   disputes.
7. **Short sessions.** Daily limits and weekly resets instead of endless
   grinding. We want them on the court, not glued to the phone.

---

## 2. The core loop

```
Play a real match
   → both players confirm the score ("the handshake")
   → VICTORY or GG screen, XP bar fills, rank moves
   → rewards drop, player card levels up
   → result card shared to the team
   → teammates react, predict next matches, play Rally Rush between
   → back on court
```

The adult version was about removing friction. The kids version is about
turning every step into a moment.

---

## 3. The systems (borrowed from AAA games, retuned for tennis)

### 3.1 The Player Card (from FIFA Ultimate Team and COD calling cards)

Every player gets a collectible-style card. It's their identity on the site,
and it's what they'll screenshot.

- **OVR rating** from real results (see Ranked below)
- Three stats, recalculated from real data:
  - **SERVE**: aces and holds recorded by the scorekeeper (optional detail)
  - **CLUTCH**: tiebreaks and deciding sets won
  - **SPORT**: sportsmanship rating (section 4)
- **Rarity frame** that upgrades through the season
- **Holographic foil** that shifts as you tilt the phone or drag a finger
  across it. The prototype's title screen already does this.
- Equipped cosmetics: racquet skin, ball trail, banner, title ("The Wall",
  "Tiebreak Menace", "Mr. Consistent")

### 3.2 Rarity tiers (the Fortnite color ladder)

Kids already read these colors as status without being told. Each tier gets
**more motion**, not just a new color:

| Tier | Color | What it looks like |
|---|---|---|
| Common | Gray | Flat frame, no motion |
| Uncommon | Green | Slow shimmer sweep |
| Rare | Blue | Shimmer and edge glow |
| Epic | Purple | Particle sparks around the frame |
| Legendary | Gold | Rotating gold border, full holo foil, glowing avatar |
| Mythic | Iridescent | Animated color shift, reacts to the phone's tilt, its own entrance animation |

**Mythic items only come from sportsmanship** (see 4.3). That one rule tells
every kid what the program actually values.

### 3.3 Ranked (from COD Ranked, Valorant, Rocket League)

Replace "standings" with **Ranked**:

**Bronze → Silver → Gold → Platinum → Diamond → Champion → Legend**

Each tier has three divisions (Gold I, II, III) and a visible progress bar.

- Under the hood it's an **Elo-style rating**, like chess ratings. Beat
  someone ranked above you and you jump. Lose to someone above you and you
  barely drop. This makes kids *want* to challenge up instead of dodging
  stronger players.
- **Promotion moments are huge.** Full-screen rank-up animation: the old
  emblem shatters, the new one slams in with light rays and a bass hit.
  That's the "Victory Royale" moment of this whole system.
- **Demotion protection:** you can't drop out of a tier on one bad match.
- The old W/L table still exists under a "Full standings" tab for coaches
  and parents.

### 3.4 The Court Pass (a free season pass)

A 50-tier track that runs the whole season. Everyone gets it free.

**XP sources, weighted so real tennis wins:**

| Action | XP |
|---|---|
| Play a match (win or lose) | 400 |
| Win a match | +200 |
| Confirm a score within 2 hours | 50 |
| Give GG props to your opponent | 50 |
| Receive a sportsmanship vote | 150 |
| Coach check-in at practice (QR code on the fence) | 150 |
| Complete a weekly challenge | 100 to 300 |
| Correct match prediction | 25 |
| Rally Rush (mini game) | up to 100 per day, then capped |

Rewards every few tiers: racquet skins, ball trails, card banners, victory
poses, titles, profile emblems. Tier 50 is a Legendary racquet skin with its
own ball trail.

### 3.5 Challenges (the Fortnite quest board)

Three daily, five weekly, refreshed on a schedule. Mix real tennis with site
actions:

- "Win a set 6-2 or better"
- "Win a match tiebreak"
- "Give GG props after 2 matches"
- "Predict 3 matches correctly"
- "Hit a 25-ball rally in Rally Rush"
- "Show up to 3 practices this week" (coach QR check-in)
- "Play a teammate you've never played"

### 3.6 Victory and GG screens (the post-game cinematic)

The moment a score is confirmed, both players get a full-screen sequence:

- **Winner:** "VICTORY" slams in, player card flips in, XP bar fills tick by
  tick with sound, rank bar moves, any unlocked items fly into view.
- **Other player:** "GG" screen. Still gets XP and still sees their bar move.
  Shows one real positive stat ("You won 9 games, your most this season") and
  a "Rematch?" challenge button.

Both screens end with the same button: **Give props to your opponent.**

### 3.7 Highlight cards for Instagram and Snapchat

A vertical 9:16 image made for stories: both player cards, the score, rank
movement, club logo. One tap to save. This is where it spreads beyond the
team, and it only shows positive stuff (no "L" stamped on anyone).

---

## 4. Sportsmanship, built into the mechanics

This is the part most apps get wrong. They reward winning and then post a
"be nice" message. We make being a good sport part of the game itself.

### 4.1 The Handshake (score confirmation)

- The winner enters the score. The opponent gets a card: **"Confirm the
  score?"** One tap to confirm. That tap *is* the handshake.
- Unconfirmed scores stay "pending" and don't count toward rank.
- Disputes go to the coach, not the comments.
- Fast confirmations earn XP on both sides. So honesty is rewarded, and fake
  scores basically can't happen.

### 4.2 GG Props

After confirming, each player can give their opponent **props**. One tap.
Private, positive only, no "down-vote" exists. Props add to your **SPORT**
stat.

### 4.3 The Honor system (from League of Legends)

Once a week, every player votes for one teammate who showed great
sportsmanship: fair line calls, encouraging a partner, helping a younger
player. Votes are secret. They add to the SPORT stat and unlock the **Honor
track**:

- Honor 1 to 5, shown as a small emblem on the card
- Honor 5 unlocks the **Golden Handshake**, a Mythic card frame
- The coach can award a **Captain's Spotlight** that unlocks a unique title

The rarest, best-looking item in the whole game goes to the best teammate,
not the best player. That's the entire message of the system, told without
a lecture.

### 4.4 Quick chat only

Preset lines kids can send on a result or in a match thread:

"GG" · "Nice shot!" · "Rematch?" · "Great match" · "Good luck today" ·
"That tiebreak though" · "Let's go partner"

No taunts and no free text. Everything a kid can say is something a coach
would be happy to hear.

### 4.5 Encouragement that's built in

- **Comeback XP**: lose the first set and win the match, or take a set off
  someone two tiers above you.
- **Personal bests** celebrated privately ("Most games you've ever won
  against a Diamond").
- **Underdog bonus**: extra XP for playing up a level.
- **No public loss streaks.** Win streaks glow; losses just fade.

---

## 5. Hidden nuggets and easter eggs

Hidden stuff makes kids talk about the site at lunch. What we want is for a
rumor to go around, someone to test it, and it to turn out true. Everything
should be discoverable by poking around or by word of mouth.

1. **Golden Ball hunt.** Once a week a small golden tennis ball hides
   somewhere on the site (a player page, the schedule, behind the net on
   the standings). Tap it for a collectible. Collect all season's balls for a
   hidden card back.
2. **Konami code.** Type ↑ ↑ ↓ ↓ ← → ← → B A (or swipe it) on the logo and
   the site flips into an 8-bit retro skin for 24 hours.
3. **Net cord secret.** Tap the net in the site header 7 times and a ball
   trickles over. Unlocks the "Let" emblem.
4. **Coach's code.** The coach writes a secret word on the whiteboard at
   practice. Enter it on the site for a practice-only cosmetic. It bridges
   real life and the site, and it rewards kids who actually showed up.
5. **Midnight mode.** Open the site between 11 pm and 5 am and the court is
   dark with one flickering light and a "Go to sleep, champ" line. Nothing
   to unlock, just a wink.
6. **Rally Rush secrets.** Hit the net post three times in one game for a
   hidden trail. Score exactly 1,234 for the "Sequence" title.
7. **Locked achievement silhouettes.** Show "???" badges with one-line hints
   ("Win a match without losing a game"). Seeing a locked badge makes kids
   curious enough to go after it.
8. **Birthday drop.** On a player's birthday their card gets confetti
   borders for the day and teammates see a "Send a GG" prompt.
9. **Legend lore.** Past season champions get a permanent plaque in a
   hidden Hall of Fame reached by tapping the trophy icon.
10. **Seasonal events** tied to the real calendar: a Halloween "haunted
    court" skin in October, a spring "Grass Court" event, a playoffs mode with
    its own bracket skin.

---

## 6. Making it fun to watch and follow

Half the team isn't playing on any given day. Give them things to do.

### 6.1 Predictions (Pick'em)

Before every match, teammates pick a winner. Correct picks earn XP and build
an **Oracle** rank with its own leaderboard. Picks lock at match start.

### 6.2 Live match mode

A teammate on the bench runs the scoreboard point by point from their phone.
Everyone else sees:

- A live scoreboard with a **momentum bar** that swings with each point
- A **hype meter** fed by spectators tapping reactions (like Twitch chat, but
  only emotes: 🔥 🎾 👏 💪)
- Push alert for "Set point", "Match point" and "Tiebreak"

### 6.3 Brackets and fantasy

- **Tournament brackets** everyone fills out before playoffs. Best bracket
  wins a Legendary banner.
- **Fantasy Doubles**: once a month, each kid drafts a doubles pair from the
  team. Points come from that pair's real results.

### 6.4 Squads (from COD clans and school houses)

Split the team into 3 or 4 squads with a banner and color. Squad points come
from matches played, practice check-ins, sportsmanship votes and challenge
completions, not just wins. The squad race keeps the bottom half of the
roster just as invested as the top.

### 6.5 Spectator XP

Watching earns a little: making picks, reacting to live matches, viewing a
teammate's victory screen. Capped daily so it rewards showing up, not
refreshing.

---

## 7. Rally Rush: the phone mini game

**Prototype built: `kids/rally-rush/index.html`.** One file, no install, works
in any phone browser.

### What's in the prototype

- **Controls built for one thumb** (the Tennis Clash approach): swipe up to
  swing, the sideways angle aims, swipe speed sets power. A tap is a safe
  block. Footwork is automatic so kids only focus on timing and aim.
- **Timing ring** (rhythm-game mechanic): a ring closes on the ball. Swing
  as it touches the ball for **PERFECT**, then GREAT, then GOOD. Sloppy
  timing makes your aim wobble, so going for the lines is a real risk.
- **Aim preview**: while dragging, a dotted arc shows where the ball will
  land. It turns red and says OUT if you're aiming wide.
- **Input buffering**: swipe a little early and the game catches it instead
  of ignoring it (a trick fighting games use so controls feel tight).
- **ACE meter** (like Mario Tennis Aces' energy): 4 perfects charge it. When
  it's ready, the next incoming ball goes into **slow motion** with a gold
  tint, and your shot becomes an unreturnable Ace Shot with a flame trail.
- **Combo multiplier**: every 5 returns in a row adds x1, up to x8.
  Callouts at 10, 20, 30 and 50 ("HEATING UP", "ON FIRE", "UNSTOPPABLE",
  "LEGENDARY").
- **Game feel**, taken from the famous "Juice it or lose it" and "Art of
  Screenshake" talks: hit-stop freeze frames on contact, screen shake scaled
  to the shot, particle bursts, shockwave rings, ball trails, phone
  vibration, and synthesized sound effects (no audio files).
- **Night-session stadium**: blue hard court, light towers, a crowd in the
  stands.
- **Legendary holo player card** on the title screen that tilts and shines
  under your finger.
- **GG screen** instead of "Game Over", with a rotating "Court Code"
  sportsmanship tip and a "Run it back" button.
- Honors the phone's reduce-motion setting.

### Where it goes next

1. **Tie it to the real season.** Cosmetics earned on the real court show up
   in the game. Your racquet skin, your ball trail, your card.
2. **Daily Challenge** (the Wordle model): everyone gets the same seeded
   rally once per day. One official attempt. Team leaderboard resets daily.
   Scarcity keeps it special and keeps screen time short.
3. **Ghost rallies**: race against a replay of a teammate's best run.
4. **Boss of the Week**: a special opponent (the "Coach Bot") with a
   signature shot. Beat it for a weekly emblem.
5. **More modes**: Serve Speed (swipe for a radar-gun reading), Target
   Practice (hit cones), Reaction Volleys at the net.
6. **Cheat-proof leaderboards**: since each game runs from a seed, the
   phone sends the seed plus the list of swipes, and the server replays it
   to verify the score. Nobody can post a fake 9,999,999.
7. **Home-screen app** (PWA) so it launches like a real game and works
   offline.

### Open-source references

These are on GitHub and are good references for building out the full game:

- **Court Champion Tennis** (github.com/itsparthmerai/TennisGame): vanilla
  canvas tennis with a joystick, four shot types, perspective projection,
  WebAudio sounds, slow-motion, and offline play. No license is listed, so
  use it for ideas, not code.
- **Phaser 3**: the most popular open-source HTML5 game engine, if the game
  grows beyond one file.
- **PixiJS**: fast WebGL rendering for heavier particle effects.
- **GSAP** (now free): for the victory screens, rank-up and card-flip
  animations on the site.
- **Lottie / Rive**: designer-made animations (rank emblems, avatar poses)
  that play smoothly on phones.
- **vanilla-tilt.js**: drop-in tilt and glare for player cards.
- **three.js**: if we ever want a 3D trophy room.

---

## 8. Avatars and visual language (the AAA feel)

The adult site uses slowly spinning racquets. The kids site pushes that much
further:

- **Animated racquet skins** with rarity: carbon fiber, molten gold,
  holographic, "neon night", a flame-grip Mythic.
- **Ball trails** equipped like Rocket League boost trails: sparks, comet
  tail, pixel trail, lightning.
- **Victory poses**: a short animation on your card after wins (racquet
  twirl, ball bounce juggle, fist pump).
- **Status auras**: rank-colored glow around your avatar everywhere it
  appears. Champions get a subtle crown flare. On a 3-match win streak your
  avatar gets a flame outline ("on fire" like NBA Jam).
- **Screen transitions** borrowed from COD menus: quick slides, glitch cuts
  on rank-up, light sweeps across cards.
- **Sound**: short, punchy UI sounds (card flip, XP tick, rank-up hit),
  off by default until they tap the speaker. Nobody's phone should blast
  in class.
- **Low FX mode** for older phones, and it switches on automatically when the
  phone asks for reduced motion.

---

## 9. Safety and privacy (non-negotiable with minors)

- **First name and last initial only.** No phone numbers or emails visible
  on the kids site (the adult site shows them; this one can't).
- **Coach-controlled roster.** Kids join with a team code from the coach
  plus a personal PIN. The adult site's "anyone can edit" model does not
  work here, because kids will impersonate each other.
- **No free chat, no DMs, no uploads of photos by kids.** Quick chat only.
- **Coach dashboard** to approve names, resolve score disputes, and hide
  anything.
- **Parent view**: a read-only link parents can open to follow their kid's
  matches and results.
- **No ads, no purchases, no third-party trackers.**
- Under-13 players bring federal privacy rules (COPPA) into play. Keep it to
  high schoolers or get the school's sign-off.

---

## 10. What changes technically

The adult site is a static page plus a small shared data file anyone can
write to. The kids version needs a bit more backbone:

| Need | Why | How |
|---|---|---|
| Real logins | Stop impersonation, track XP per kid | Team code + PIN, stored on the server |
| Server-side rules | Scores only count once both sides confirm | Expand the existing small server, or move to Supabase or Firebase |
| XP and rank engine | Calculated the same way for everyone | Runs on the server from confirmed matches |
| Game score check | No fake leaderboard scores | Seed + swipe replay check |
| Notifications | Match point alerts, confirm requests | Web push once installed to the home screen |

---

## 11. Rollout

**Phase 1: identity and the handshake**
Team code logins, player cards with rarity frames, score confirmation, GG
props, Ranked tiers with rank-up animation, victory and GG screens.

**Phase 2: the season**
Court Pass with XP, challenges, Honor votes, Rally Rush linked to accounts
with a daily challenge and team leaderboard.

**Phase 3: the spectators**
Predictions, live match mode with momentum and hype meter, squads, highlight
cards for stories, hidden nuggets and seasonal events.

**Phase 4: the finale**
Playoff bracket challenge, Season Wrapped with a personal highlight reel, a
Hall of Fame plaque for champions and Golden Handshake winners.

---

## 12. How we'll know it's working

1. **Score confirmation rate**: percent of matches confirmed by both players
   within 24 hours.
2. **Weekly active players**: how many kids open it each week, and how many
   non-playing teammates check results.
3. **Sportsmanship participation**: percent of matches where props were
   given, and Honor votes cast per week.
4. **Healthy use**: average daily minutes in Rally Rush should stay small.
   If it climbs too high, tighten the daily caps. The goal is more tennis,
   not more screen time.

---

## Adults vs. kids at a glance

| | Adults | Kids |
|---|---|---|
| Tone | Classy, quiet | Loud, cinematic, AAA |
| Identity | Tap your name | Team code + PIN, player card |
| Standings | W/L table with win balls | Ranked tiers, Elo, rank-up animations |
| Rewards | Win balls, a few badges | Court Pass, rarity cosmetics, titles |
| Social | Reactions, group text | Quick chat, props, squads, predictions |
| Sportsmanship | Implied | Core stat, Handshake, Honor, Mythic rewards |
| Mini game | None | Rally Rush |
| Privacy | Contacts shared | No contact info, coach controls |
