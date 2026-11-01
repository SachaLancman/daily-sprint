# Daily Sprint

A personal brain-training web app in the spirit of apps like Elevate, heading for the Google Play Store. All games, art and word lists are original; do not copy another product's assets, names or content.

## Current state
- Open `index.html` in a browser to play. No build step, no dependencies except Google Fonts and one exception: three.js r159 (`js/vendor/three.min.js`, MIT, last version with a plain-script build), loaded only when a 3D game opens (`load3D`). Plain `<script>` tags (not modules) so it also works when opened as a file.
- Bottom menu with four tabs: **Today** (home), **Games** (library of all 24 games, grouped and filterable by skill), **Ranks** (leaderboard), **You** (brain profile: skill-level bars, points-per-week chart with table view, stats, ranks, badges).
- Home: greeting, streak badge (tap it for the activity calendar), settings gear, "Today's session" card with a progress ring (+ "Share today's result" once done), and today's 4 game cards.
- Studio: **Atelier Sacha**. A ~2s studio opening (`#splash` + `js/splash.js`, wordmark in the Fredoka font: the tile drops and bounces, a little workshop draws itself, its big paned window flickers on, a spark pops from the chimney, the letters hop in; exit = a "boing", the logo spins away, the background closes like a cartoon iris; 4-note chime) shows once per fresh start (sessionStorage), tap to skip, skipped in test mode; browsers may keep the chime silent until the first tap. Then the app opens straight on the Today screen (no welcome slides). Each game shows a "How to play" step before its first countdown (`store.seen`; skipped in test mode).
- Settings (`js/settings.js`): sound, vibration (`buzz()`, triggered from `beep()` for wrong/level-up sounds), screen shake (`store.shake`), color-blind letters inside shapes (`store.cb`, in `drawShape`), theme auto/light/dark (`store.theme`, `applyTheme()`), profile, show instructions again, privacy, reset progress.
- Streak freeze: one missed day per week is forgiven (`freezeReady()`, `store.freezeWeek`, `store.frozenDays`; `liveStreak()` is the streak to display). Calendar marks saved days with a snowflake.
- 15 achievement badges (`js/badges.js`, `BADGES`, `store.badges`), checked in `finishGame` and celebrated on the results screen.
- Share today's result as text (`js/share.js`, Wordle-style, share sheet or clipboard). Log entries store `stars`.
- Daily session: 4 of the 24 games, picked from the date (same for everyone on a given day), always 4 different skills, never the same set two days running (`todaysGames()`). Finishing all 4 keeps the streak and is celebrated on that results screen (`#endSession` badge "Daily session complete! N-day streak", confetti, 4-note fanfare).
- Activity calendar: month view of days played / full sessions, plus current streak, best streak, days and games played (`store.days`, `store.sessionDays`).
- 29 games for now (2026-10-31): the 6 skills have 4 or 5 each. The owner asked to keep the 5 older games next to the 3D games that were meant to replace them, and will say later which to remove: Unscramble (anagram), Spot the New (newpic), Greater Than (greater), Sort Rush (sort), Missing Piece (matrix). All 60 seconds except Memory Grid (3 lives). 🖼 = uses the picture library.

| Skill | id: Name |
|---|---|
| Math | math: Math Sprint · defense: Number Defense · target: Target Total · greater: Greater Than · towers: Block Towers (3D) |
| Memory | memory: Memory Grid · pairs: Picture Pairs 🖼 · newpic: Spot the New 🖼 · darkpath: Dark Path (3D) · recall: Number Recall |
| Language | words: Word Match · spot: Spot the Error · anagram: Unscramble · dice: Letter Dice (3D) · fishing: Word Fishing 🖼 |
| Focus | colors: Color Clash · rails: Rail Switch · arrows: Arrow Focus · seeker: Shape Seeker |
| Speed | hunt: Number Hunt · cups: Cup Shuffle (3D) · bubbles: Bubble Pop · hop: Sky Hop (3D) · sort: Sort Rush |
| Logic | pattern: Next in Line · balance: Balance · spin: Shape Spin (3D) · matrix: Missing Piece · path: Follow the Arrows |
- Rail Switch (replaced Find the Twins on 2026-10-31, which had replaced Odd One Out): colored carts roll down a branching track (2, 4, then 8 stations); tap switches to route each cart to its color. SVG + requestAnimationFrame (`railTick`); feedback in three sizes following the installed `game-feel` skill (switch snap, station pop + sparks, board shake on a miss).- Number Defense (replaced Quick Count on 2026-10-31): the first "real game". Monsters carrying sums march toward a castle; tap the answer to zap them with lightning; a crowned boss with a two-step sum every 10 monsters from level 4. Plain canvas + its own loop (`defTick`, no engine, to keep the app dependency-free); characters, castle and effects drawn in code; the meadow background `img/defense-bg.jpg` was painted with Kie GPT Image 2 (6 credits) and the game falls back to a code-drawn scene without it. Game feel: drop-in bounce, waddle and blink, hit-stop on zaps, white flash, confetti burst, trauma screen shake, wall flash.
- Word Fishing (replaced Picture Spell on 2026-10-31): a sticker picture is the clue; fish carrying letters swim across a pond; tap them in order to spell the word (wrong fish bolt away). The next needed letter always joins the pond within a moment (`fishLetter`, `missing` in `fishTick`); decoys include look-alike letters (`FISH_LOOKALIKE`), never 3 of one letter. Canvas like Number Defense; pond background `img/fishing-bg.jpg` from Kie GPT Image 2.
- **3D games** (2026-10-31), all with three.js: Cup Shuffle (replaced Flash Match), Shape Spin (replaced Missing Piece), Sky Hop (replaced Sort Rush), Letter Dice (replaced Unscramble, same one-answer word list), Dark Path (replaced Spot the New), Block Towers (replaced Greater Than). The owner disliked the old picture games, which are all gone.
  - Shared toolkit `js/three3d.js` (loaded before the games): `load3D`; ONE shared WebGL renderer `gl3` that moves into the open game's `.stage3d` (`stage3D`); `lights3D`; `pick3D` (raycast taps, set `onTap3D`); `anim3D(st, round, ms, step)` (stops if the game or round changed); `loop3D`; `open3D`; `label3D` (letter/number textures); `fit3D` (camera distance so a row fits); `screen3D` (3D point to screen, for `juiceBurst`).
  - Each 3D game keeps its rules apart from the scene (a `...Plan()` plus a pick function gated by `st.phase`), so the tests play rounds without WebGL. Shape Spin compares shapes exactly with the 24 cube rotations (`spinCanon`) and uses only one mirror decoy (a shape has one mirror image).
  - More "real game" ideas: Box Push, Number Drop, Pipe Flow, Shop Run, Rail Switch 2 with trains.

- **Game feel** (core.js, from the installed `game-feel` skill): hooks in `floatText()` ("+points" means a right answer, class `lvl` a level-up) and `beep()` (freq <= 200 means a mistake) give every game the same feedback: the tapped element pops and sparks burst (`juiceBurst`, layer `#juice` outside the game screens), every 5 in a row shows a "N in a row" banner under the header with a chord (`juiceRow`, reset in `show()`), a mistake shakes the board (`juiceWrong`, off when `store.shake === false`), a level-up flashes the header (`juiceLevel`). Points are unchanged. Motion only without prefers-reduced-motion. A game drawing its own effects sets `data-fx="own"` on its board (Rail Switch). Right answers in `right()` rise in pitch with the streak; the last 10 seconds tick.
- Results screen: 1-3 stars, count-up score, confetti on a new best or a new level record / rank.
- Open-ended difficulty: every game has hand-made early levels, then formulas keep raising difficulty up to `MAX_LEVEL` (30): bigger numbers/grids, subtler differences, faster pace, and an **answer clock** (`answerClock` / `stopAnswerClock`, a shrinking bar; running out counts as a miss). Some games add twists at depth (Color Clash "NOT" question, Spot the Error "No mistake", Number Hunt shuffles/count-down, Follow the Arrows ×2 steps). Human limits are capped (e.g. grids ≤ 7×7, Number Recall ≤ 18 digits, bubbles ≥ 40px).
- Mastery ranks from the highest level ever reached (`store.peak`): Bronze 5, Silver 10, Gold 15, Diamond 20 (`RANKS`), shown on game cards; "New level record" / "rank unlocked" on the results screen.
- Leaderboard: player profile (nickname + self-chosen country), tabs Daily / Weekly / Streak / By game (with a game picker), country filter. Offline it ranks your own results; online it uses Supabase.
- Progress is saved in localStorage under `dailysprint.v1` (`store`: best, skill, hist, log, days, sessionDays, done, streak, bestStreak, player, pending, sound).
- **Live at https://sachalancman.github.io/daily-sprint/** (GitHub Pages, public repo https://github.com/SachaLancman/daily-sprint, branch `main`, root folder). Installable on a phone from there: `manifest.webmanifest`, `sw.js` (offline, network-first), icons.
- **Publishing an update:** run the tests, commit, then `git push`. GitHub rebuilds the site in about a minute. Git and the GitHub CLI (`gh`, logged in as SachaLancman) live in `C:\Program Files\Git\cmd` and `C:\Program Files\GitHub CLI`; add them to PATH in a shell if `git`/`gh` aren't found.
- Commits use the owner's private GitHub noreply email (`124744881+SachaLancman@users.noreply.github.com`); never commit the owner's personal email or other private data, since the repo is public.

## How the code is organised
- `index.html`: the fixed screens (home, library, countdown, results, calendar, leaderboard, profile) and the first 8 games' markup. Script order matters: core → pictures → games → leaderboard → calendar → main.
- `css/app.css`: all styles. Game colors for the first 8 games are here (`.g-<id>`); newer games pass their colors to `registerGame`.
- `js/core.js`: storage, helpers, home, library, daily rotation, countdown (`launch`), results (`finishGame`), and the **shared game engine**.
- `js/pictures.js`: 68 original sticker drawings (`asym` = looks different mirrored) (`PICS`, `picSvg`) and colored shapes (`drawShape`, `shapeTile`).
- `js/games/<id>.js`: one file per game. `js/three3d.js`: shared 3D toolkit, loaded before the games. `js/leaderboard.js`, `js/calendar.js`, `js/settings.js`, `js/badges.js`, `js/share.js`, `js/brain.js`, `js/main.js` (wiring and start-up). Script order: core → pictures → games → leaderboard → calendar → settings → badges → share → brain → main.
- A new screen needs a `<section>` in index.html and its id in the list inside `show()`; add it to `NAV_SCREENS` if the bottom menu should show.
- **Adding a game** (see any newer file, e.g. `js/games/greater.js`): call `registerGame({ id, name, skill, hint, art, colors: [light, dark], html, start, key })`. It creates the screen with a standard header (ids `<id>Time`, `<id>Bar`, `<id>Score`, `<id>Level`, `<id>Streak`). In `start`, use `makeRound(id, MAX_LEVEL, upAfter)`; give the game a `xxxLevel(level)` function that returns hand-made settings for early levels and formula-based ones after (`past(level, top)` = how far beyond); then then `right(st, host)` / `wrong(st)`, `later(st, ms, fn)` for timers, `startClock(st)` for the 60 seconds. Add a `<script>` tag in `index.html` and the id to `max_score()` in `supabase/schema.sql`. Dark color must give white text 4.5:1 contrast.
- HTML ids must be unique across the whole page: a game's id becomes its screen's id, and screens like `countdown`, `board` (leaderboard), `end`, `home` are taken. `registerGame` now throws if an id is already used. Tests must also check that game parts are *visible*, not just generated.
- All scripts share one global scope: never reuse a top-level name (a clash silently replaces the earlier one). Check with a duplicate-name scan after adding files.
- `run` counter: every timer checks it so quitting a game stops everything.
- Content rules: Word Match pairs on one level must all mean different things; Spot the Error marks the one wrong word as `[wrong|right]` (no spaces inside); Unscramble words must have only one common anagram.
- Leaderboard: `ONLINE = { url, key }` in `js/leaderboard.js`. Empty = offline mode. Names from the server are untrusted: always pass them through `esc()`.

## Design rules (style: bold and colorful)
- Colors and fonts are CSS variables at the top of `css/app.css`, with light and dark themes. Never hard-code a UI color elsewhere (game content like inks, shapes and pictures is the exception).
- Each game owns a vivid gradient: `--l` (light end), `--d` (dark end), `--grad`. Used for its card, countdown, header, results screen and session ring segment.
- White text only sits on the dark end of a gradient (4.5:1 or more). Text on green/red feedback uses `--on-mark`.
- Pictures sit on a light "sticker" background (`.pic`, `#FBFAFF`) in both themes, with a dark ink outline.
- The page around the color stays soft (`--bg`, `--surface`). `--hero` (deep indigo) for the session card and full-session calendar days. Yellow `--accent` for streaks, badges, "hot" chips and celebrations.
- Fonts: Bricolage Grotesque (700-800) for text and big numbers; DM Mono for timers, math and small uppercase chips.
- Buttons are chunky with a solid "lip" shadow underneath that squashes when pressed. Tap targets at least about 44px.
- Motion only inside `prefers-reduced-motion: no-preference`.
- One column, max 440px wide; must not overflow at 360px wide.
- Don't use text arrows (← → ↑ ↓) or other symbols the fonts lack: fallback fonts draw them in mismatched weights. Use `arrowSvg(dir)` or an SVG icon.
- Class name `full` is reserved for full-screen screens (countdown/results); don't reuse it.

## Automatic tests
- Open `test.html` (it opens `index.html?test`, which loads `js/tests.js`) and press **Run** (levels 1–10) or **Full run** (1–30). Keep the tab visible so the end-of-game check runs too.
- Each game: launches through the real countdown and checks every part of its screen is visible; per level makes a question, checks it is valid and fits a 360px phone, answers right (score must go up) and wrong (streak must reset); then lets the clock run out. Also checks unique page ids, the daily session/streak/calendar, library and leaderboard.
- Player progress is backed up to `dailysprint.v1.testBackup` before a run and restored on "Close tests", or automatically on the next normal load if the tab was closed mid-run (see `TEST_BACKUP` in core.js). Scores are not sent online during tests.
- **Adding a game: add its playbook to `T` in `js/tests.js`** (state, gen, check, solve, miss), or the run reports "no test playbook". Run the tests after every change.

## Tools in this folder
- `.claude/serve.ps1` serves the folder at http://localhost:8123 for Claude's browser pane.
- `.claude/make-icons.ps1` redraws the PNG icons after changing the icon design.
- Claude's browser pane does not run service workers, and screenshots are unreliable while the pane is hidden: verify layout by measuring with JavaScript; long test scripts must stay under 45 seconds per call.
- `supabase/schema.sql`: the leaderboard database. `LAUNCH.md`: hosting, Supabase and Play Store steps. `privacy.html`: privacy policy (contact email still to fill in).

## The owner
- Beginner who is learning; explain changes in plain language and keep steps small.
- Test in the browser after each change before moving on.
- The folder uses git. After each change is tested, commit it with a short plain-English message so it can be undone later.

## Ideas for next steps
- Follow `LAUNCH.md`: Supabase (worldwide leaderboard), Play Store.
- French version (UI + French content for the 4 Language games).
- Daily reminders (notifications need a server or the Android wrapper).
- Grow toward 8 games per skill, starting with the skills the owner enjoys most.
- Tune expert-level speeds and answer clocks from real playtesting (they are formula guesses).
- More content per game (Spot the Error sentences, Unscramble words, more pictures).
- Move the first 8 games' markup out of `index.html` into `registerGame` like the newer ones.
