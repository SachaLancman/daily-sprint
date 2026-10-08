# Daily Sprint

A personal brain-training web app in the spirit of apps like Elevate. All games, art and word lists are original; do not copy another product's assets, names or content.

## Current state
- The whole app is one file, `index.html` (HTML, CSS and JavaScript together). Open it in a browser to play. No build step, no dependencies except two Google Fonts.
- Home screen: daily session, day streak, and per-game level, best score and recent-score bars.
- Games: Math Sprint (60s arithmetic, 8 levels), Memory Grid (repeat a growing tile sequence, 3 lives), Word Match (60s synonyms, 4 levels, about 45 pairs each, no word repeats within 10 questions).
- Progress is saved in the browser's localStorage under the key `dailysprint.v1`.

## How the code is organised
- `GAMES` lists the games. Each game has a `start...` function and ends by calling `finishGame(score, label, stats, skill)`.
- `launch(id)` runs the 3-2-1 countdown then starts the game. The `run` counter cancels timers when the player quits.
- Word Match's wrong options are other answers from the same level, so every pair on a level must have a clearly different meaning (otherwise a question has two right answers).
- To preview in Claude's browser pane: run `.claude/serve.ps1` (serves the folder at http://localhost:8123).
- Colors and fonts are CSS variables at the top of the `<style>` block, with light and dark themes.

## The owner
- Beginner who is learning; explain changes in plain language and keep steps small.
- Test in the browser after each change before moving on.
- The folder uses git. After each change is tested, commit it with a short plain-English message so it can be undone later.

## Ideas for next steps
- Add a fourth game (for example reading speed or spot-the-grammar-error).
- Split `index.html` into separate files once it gets hard to work in.
- Make it installable on a phone home screen.
