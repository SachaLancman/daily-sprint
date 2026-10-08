/* Follow the Arrows (Logic): start on the dot, follow the moves in your head, tap where you end up.
   L1: 3 moves on 4x4. L2: 4 moves on 4x4. L3: 5 moves on 5x5. L4: 6 moves on 5x5, shown only briefly. */
let fa = null;
const PATH_LEVELS = [{ n: 4, moves: 3 }, { n: 4, moves: 4 }, { n: 5, moves: 5 }, { n: 5, moves: 6, hideAfter: 2500 }];
const STEP = { '↑': [0, -1], '↓': [0, 1], '←': [-1, 0], '→': [1, 0] };
// Past level 4: longer paths, a 6x6 grid (from level 8), moves hidden sooner, and double steps (from level 10).
function pathLevel(level) {
  if (level <= PATH_LEVELS.length) return Object.assign({ doubles: 0 }, PATH_LEVELS[level - 1]);
  const d = past(level, PATH_LEVELS.length);
  return { n: d >= 4 ? 6 : 5, moves: Math.min(12, 6 + Math.floor(d / 2)), hideAfter: Math.max(1200, 2500 - 100 * d), doubles: d >= 6 ? Math.min(0.4, 0.15 + 0.02 * d) : 0 };
}
function nextPath() {
  const L = pathLevel(fa.tier);
  let x = r(0, L.n - 1), y = r(0, L.n - 1);
  const start = [x, y], moves = [];
  while (moves.length < L.moves) {
    // Only moves that stay on the grid; avoid undoing the previous move straight away. k = 2 for a double step.
    const last = moves.length ? moves[moves.length - 1].m : null, undo = { '↑': '↓', '↓': '↑', '←': '→', '→': '←' }[last];
    const k = Math.random() < L.doubles ? 2 : 1, fits = m => x + STEP[m][0] * k >= 0 && x + STEP[m][0] * k < L.n && y + STEP[m][1] * k >= 0 && y + STEP[m][1] * k < L.n;
    const ok = Object.keys(STEP).filter(m => m !== undo && fits(m));
    if (!ok.length) continue; // try again (a single step always fits)
    const m = pickOne(ok);
    moves.push({ m, k }); x += STEP[m][0] * k; y += STEP[m][1] * k;
  }
  fa.end = y * L.n + x; fa.locked = false;
  const dir = { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right' };
  $('pathMoves').innerHTML = moves.map(({ m, k }) => '<span aria-label="' + dir[m] + (k > 1 ? ' twice' : '') + '">' + arrowSvg(dir[m]) + (k > 1 ? '<b class="times">×2</b>' : '') + '</span>').join('');
  $('pathMoves').setAttribute('aria-label', moves.map(({ m, k }) => dir[m] + (k > 1 ? ' twice' : '')).join(', '));
  $('pathMoves').classList.remove('hide');
  $('pathGrid').style.setProperty('--n', L.n);
  $('pathGrid').innerHTML = Array.from({ length: L.n * L.n }, (_, i) => '<button class="tile path-cell' + (i === start[1] * L.n + start[0] ? ' start' : '') + '" data-i="' + i + '" aria-label="Square ' + (i + 1) + '"></button>').join('');
  setBoard('pathBoard', null);
  if (L.hideAfter) later(fa, L.hideAfter, () => { if (!fa.locked) $('pathMoves').classList.add('hide'); });
}
function pathTap(btn) {
  if (!alive(fa) || fa.locked) return;
  fa.locked = true;
  $('pathMoves').classList.remove('hide');
  const ok = Number(btn.dataset.i) === fa.end;
  if (ok) { btn.classList.add('ok'); right(fa, $('pathBoard')); setBoard('pathBoard', 'ok'); }
  else { btn.classList.add('no'); $('pathGrid').children[fa.end].classList.add('ok'); wrong(fa); setBoard('pathBoard', 'no'); }
  later(fa, ok ? 450 : 1400, nextPath);
}
registerGame({
  id: 'path', name: 'Follow the Arrows', skill: 'Logic', colors: ['#7BDC86', '#1B5E20'],
  hint: 'Start on the dot and follow the arrows in your head. Tap the square where you finish.',
  art: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<rect x="' + (16 + (i % 3) * 32) + '" y="' + (16 + Math.floor(i / 3) * 32) + '" width="26" height="26" rx="6" fill="#fff" fill-opacity="' + (i === 2 ? 1 : .4) + '"/>').join('') +
    '<circle cx="29" cy="93" r="7" fill="#FFC83D"/><path d="M29 84V36h58" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="5 6" stroke-linecap="round"/>' +
    '<path d="M80 22l9 7-9 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="board" id="pathBoard"><span class="prompt">From the dot, follow</span><div class="path-moves" id="pathMoves"></div></div><div class="tiles" id="pathGrid"></div>',
  start(my) {
    fa = makeRound('path', MAX_LEVEL);
    show('path');
    roundHud(fa);
    nextPath();
    startClock(fa);
  }
});
$('pathGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pathTap(b); });
