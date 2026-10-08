# Daily Sprint

A personal brain-training web app in the spirit of apps like Elevate. All games, art and word lists are original; do not copy another product's assets, names or content.

## Current state
- The whole app is one file, `index.html` (HTML, CSS and JavaScript together). Open it in a browser to play. No build step, no dependencies except two Google Fonts.
- Home screen: daily session (one dot per game), day streak, and per-game icon, level, best score and recent-score bars.
- Games:
  - Math Sprint: 60s arithmetic, 8 levels.
  - Memory Grid: repeat a growing tile sequence, 3 lives.
  - Word Match: 60s synonyms, 4 levels, about 45 pairs each, no word repeats within 10 questions.
  - Spot the Error: 60s, tap the wrong word in a sentence, 3 levels of 24 sentences (spelling, confused words, harder grammar).
- Progress is saved in the browser's localStorage under the key `dailysprint.v1`.
- Installable on a phone once hosted online: `manifest.webmanifest`, `sw.js` (offline support, network-first), and icons (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`). Not hosted yet.

## How the code is organised
- `GAMES` lists the games (name, description, countdown hint, SVG icon). Each game has a `start...` function and ends by calling `finishGame(score, label, stats, skill)`. A new game also needs: its `<section>`, an entry in `show()`, `launch()`, `freshDay()`, `store.skill`/`store.hist`, and a `--c-<id>` color.
- `launch(id)` runs the 3-2-1 countdown then starts the game. The `run` counter cancels timers when the player quits.
- Word Match's wrong options are other answers from the same level, so every pair on a level must have a clearly different meaning (otherwise a question has two right answers).
- Spot the Error sentences mark the one wrong word as `[wrong|right]`, with no spaces inside the brackets. Every other word must be correct.

## Design rules (style: bold and colorful)
- Colors and fonts are CSS variables at the top of the `<style>` block, with light and dark themes. Never hard-code a color elsewhere.
- Each game owns a vivid gradient set by a class: `.g-math`, `.g-memory`, `.g-words`, `.g-spot` define `--l` (light end), `--d` (dark end) and `--grad`. Used for its home card, countdown, in-game header, results screen, and session ring segment.
- White text only sits on the dark end of a gradient (contrast 4.5:1 or more). Text on green/red feedback uses `--on-mark`.
- The page around the color stays soft (`--bg`, `--surface`) so the gradients pop. The home "hero" card uses `--hero` (deep indigo). Yellow `--accent` is for the streak, badges, "hot" streak chips and celebrations.
- Fonts: Bricolage Grotesque (700-800, tight letter-spacing) for text and big numbers; DM Mono for timers, math and small uppercase chips.
- Buttons are chunky with a solid "lip" shadow underneath that squashes when pressed.
- Illustrations are 120x120 inline SVGs in `GAMES[].art`: white shapes, with `currentColor` = the game's dark color. Small icons live in `ICON`.
- Motion: screen entrances, card hovers, pops for stars/badges, floating "+points", confetti on a new best. All of it sits inside `prefers-reduced-motion: no-preference`.
- One column, max 440px wide; home games are a 2-column card grid.

## Tools in this folder
- `.claude/serve.ps1` serves the folder at http://localhost:8123 so Claude's browser pane can preview it.
- `.claude/make-icons.ps1` redraws the PNG icons after changing the icon design.
- Claude's browser pane does not run service workers, so offline mode can only be tested once the app is hosted.

## The owner
- Beginner who is learning; explain changes in plain language and keep steps small.
- Test in the browser after each change before moving on.
- The folder uses git. After each change is tested, commit it with a short plain-English message so it can be undone later.

## Ideas for next steps
- Host it online (for example GitHub Pages) so it can be installed on a phone.
- Grow the Spot the Error list (72 sentences).
- Split `index.html` into separate files once it gets hard to work in.
