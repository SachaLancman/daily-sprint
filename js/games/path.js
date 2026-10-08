/* Follow the Arrows (Logic): start on the dot, follow the moves in your head, tap where you end up.
   L1: 3 moves on 4x4. L2: 4 moves on 4x4. L3: 5 moves on 5x5. L4: 6 moves on 5x5, shown only briefly. */
let fa = null;
const PATH_LEVELS = [{ n: 4, moves: 3 }, { n: 4, moves: 4 }, { n: 5, moves: 5 }, { n: 5, moves: 6, hideAfter: 2500 }];
const STEP = { '↑': [0, -1], '↓': [0, 1], '←': [-1, 0], '→': [1, 0] };
function nextPath() {
  const L = PATH_LEVELS[fa.tier - 1];
  let x = r(0, L.n - 1), y = r(0, L.n - 1);
  const start = [x, y], moves = [];
  while (moves.length < L.moves) {
    // Only moves that stay on the grid; avoid undoing the previous move straight away.
    const last = moves[moves.length - 1], undo = { '↑': '↓', '↓': '↑', '←': '→', '→': '←' }[last];
    const ok = Object.keys(STEP).filter(m => m !== undo && x + STEP[m][0] >= 0 && x + STEP[m][0] < L.n && y + STEP[m][1] >= 0 && y + STEP[m][1] < L.n);
    const m = pickOne(ok);
    moves.push(m); x += STEP[m][0]; y += STEP[m][1];
  }
  fa.end = y * L.n + x; fa.locked = false;
  $('pathMoves').innerHTML = moves.map(m => '<span>' + m + '</span>').join('');
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
    fa = makeRound('path', PATH_LEVELS.length);
    show('path');
    roundHud(fa);
    nextPath();
    startClock(fa);
  }
});
$('pathGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pathTap(b); });
