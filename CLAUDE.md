# Daily Sprint

A personal brain-training web app in the spirit of apps like Elevate, heading for the Google Play Store. All games, art and word lists are original; do not copy another product's assets, names or content.

## Current state
- The whole app is one file, `index.html` (HTML, CSS and JavaScript together). Open it in a browser to play. No build step, no dependencies except Google Fonts.
- Bottom menu with three tabs: **Today** (home), **Games** (library of all games, filter by skill), **Ranks** (leaderboard).
- Home: greeting, streak badge, "Today's session" card with a progress ring, and today's 4 game cards.
- Daily session: 4 of the 8 games, picked from the date (same for everyone on a given day), always 4 different skills, never the same set two days running (`todaysGames()`). Finishing all 4 keeps the streak.
- 8 games (all 60 seconds except Memory Grid, which uses 3 lives):

| id | Name | Skill | Notes |
|---|---|---|---|
| math | Math Sprint | Math | 8 levels |
| memory | Memory Grid | Memory | grows from 3x3 to 4x4 |
| words | Word Match | Language | synonyms, 4 levels of about 45 pairs |
| spot | Spot the Error | Language | 3 levels of 24 sentences |
| colors | Color Clash | Focus | does the word match its ink? 4 levels = 3 to 6 colors |
| hunt | Number Hunt | Speed | tap 1..n in order, grids 3x3 / 4x4 / 5x5 |
| pattern | Next in Line | Logic | number sequences, 4 levels of rules |
| anagram | Unscramble | Language | 4 levels = 4 to 7-letter words, 24 each |

- Results screen: 1-3 stars, count-up score, confetti on a new best.
- Leaderboard: player profile (nickname + self-chosen country), tabs Daily / Weekly / Streak / one per game, country filter. Offline it ranks your own results; online it uses Supabase (see below).
- Progress is saved in the browser's localStorage under the key `dailysprint.v1` (`store`: best, skill, hist, log, done, streak, bestStreak, player, pending, sound).
- Installable on a phone once hosted: `manifest.webmanifest`, `sw.js` (offline, network-first), icons. Not hosted yet; see `LAUNCH.md`.

## How the code is organised
- `GAMES` lists the games (id, name, skill, countdown hint, 120x120 `art` SVG). Each game has a `start<Name>(my)` function, its own `<section id="<id>">` with class `g-<id>`, and ends by calling `finishGame(score, label, stats, skill)`.
- Adding a game: entry in `GAMES`, a `.g-<id>` color pair in CSS (white text must reach 4.5:1 on `--d`), its section, its start function in the `launch()` map, and add the id to `supabase/schema.sql` (game check + `max_score`).
- `launch(id)` runs the 3-2-1 countdown then starts the game. The `run` counter cancels timers when the player quits.
- `show(id)` switches screens and shows the bottom menu only on home/library/board.
- Word Match's wrong options are other answers from the same level, so every pair on a level must have a clearly different meaning.
- Spot the Error sentences mark the one wrong word as `[wrong|right]`, with no spaces inside the brackets.
- Unscramble words must have only one common English anagram (no "listen/silent").
- Leaderboard: `ONLINE = { url, key }` near the "Leaderboard" section. Empty = offline mode. Writes go through the `submit_score` / `delete_player` database functions; reads through the `board_*` views. Results queue in `store.pending` when offline. Names from the server are untrusted: always pass them through `esc()`.

## Design rules (style: bold and colorful)
- Colors and fonts are CSS variables at the top of the `<style>` block, with light and dark themes. Never hard-code a color elsewhere (game content like Color Clash inks is the exception).
- Each game owns a vivid gradient set by its `.g-<id>` class: `--l` (light end), `--d` (dark end), `--grad`. Used for its card, countdown, in-game header, results screen and session ring segment.
- White text only sits on the dark end of a gradient (contrast 4.5:1 or more). Text on green/red feedback uses `--on-mark`.
- The page around the color stays soft (`--bg`, `--surface`). The home "hero" card uses `--hero` (deep indigo). Yellow `--accent` is for the streak, badges, "hot" chips, the active menu tab and celebrations.
- Fonts: Bricolage Grotesque (700-800, tight letter-spacing) for text and big numbers; DM Mono for timers, math and small uppercase chips.
- Buttons are chunky with a solid "lip" shadow underneath that squashes when pressed.
- Illustrations: white shapes with `currentColor` = the game's dark color. Small icons live in `ICON`.
- Motion only inside `prefers-reduced-motion: no-preference`.
- One column, max 440px wide; game cards in a 2-column grid. Must not overflow at 360px wide.

## Tools in this folder
- `.claude/serve.ps1` serves the folder at http://localhost:8123 so Claude's browser pane can preview it.
- `.claude/make-icons.ps1` redraws the PNG icons after changing the icon design.
- Claude's browser pane does not run service workers, and screenshots fail while the pane is hidden: verify layout by measuring with JavaScript instead.
- `supabase/schema.sql`: the leaderboard database. `LAUNCH.md`: hosting, Supabase and Play Store steps. `privacy.html`: privacy policy (contact email still to fill in).

## The owner
- Beginner who is learning; explain changes in plain language and keep steps small.
- Test in the browser after each change before moving on.
- The folder uses git. After each change is tested, commit it with a short plain-English message so it can be undone later.

## Ideas for next steps
- Follow `LAUNCH.md`: GitHub Pages, Supabase, Play Store.
- More content per game (Spot the Error sentences, Unscramble words).
- Split `index.html` into separate files once it gets hard to work in.
