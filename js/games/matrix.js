/* Missing Piece (Logic): a 3x3 grid follows a pattern by row and by column. Pick the piece that completes it.
   L1: rows = shape, columns = how many. L2: rows = shape, columns = color. L3: shape, count and color all change.
   L4: like L3, but the colors run diagonally. */
let mx = null;
function cellSvg(c) {
  const pos = { 1: [[50, 50]], 2: [[30, 50], [70, 50]], 3: [[50, 28], [28, 70], [72, 70]] }[c.n];
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' + pos.map(([x, y]) => drawShape(c.kind, c.color, x, y, c.n === 1 ? 46 : 32)).join('') + '</svg>';
}
const sameCell = (a, b) => a.kind === b.kind && a.color === b.color && a.n === b.n;
// Past level 4: the gap can be anywhere, counts run diagonally too (from level 7), 6 options (from level 8), and an answer clock.
function nextMatrix() {
  const depth = past(mx.tier, 4), rule = Math.min(mx.tier, 4);
  const kinds = shuffle(SHAPE_KINDS.slice()).slice(0, 3), colors = shuffle(Object.keys(SHAPE_COLORS)).slice(0, 3), counts = shuffle([1, 2, 3]);
  const one = pickOne(colors);
  const cell = (row, col) => ({
    kind: kinds[row],
    n: rule === 2 ? 1 : depth >= 3 ? counts[(col + 2 * row) % 3] : counts[col],
    color: rule === 1 ? one : rule === 4 ? colors[(row + col) % 3] : colors[col]
  });
  const grid = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) grid.push(cell(row, col));
  const gap = depth ? r(0, 8) : 8, answer = grid[gap], optionCount = depth >= 4 ? 6 : 4;
  // Wrong options each break exactly one part of the pattern.
  const opts = [answer], tweaks = shuffle([
    c => ({ ...c, kind: pickOne(kinds.filter(k => k !== c.kind)) }),
    c => ({ ...c, color: pickOne(colors.filter(k => k !== c.color)) }),
    c => ({ ...c, n: pickOne([1, 2, 3].filter(k => k !== c.n)) }),
    c => ({ ...c, kind: pickOne(kinds.filter(k => k !== c.kind)), n: pickOne([1, 2, 3].filter(k => k !== c.n)) })
  ]);
  for (let i = 0; opts.length < optionCount && i < 60; i++) { const o = tweaks[i % tweaks.length](answer); if (!opts.some(x => sameCell(x, o))) opts.push(o); }
  mx.opts = shuffle(opts); mx.answer = answer; mx.locked = false;
  $('matrixGrid').innerHTML = grid.map((c, i) => '<div class="pic static">' + (i === gap ? '<span class="qmark">?</span>' : cellSvg(c)) + '</div>').join('');
  $('matrixOpts').style.setProperty('--n', mx.opts.length > 4 ? 3 : 4);
  $('matrixOpts').innerHTML = mx.opts.map((c, i) => '<button class="pic" data-i="' + i + '" aria-label="Option ' + (i + 1) + '">' + cellSvg(c) + '</button>').join('');
  setBoard('matrixBoard', null);
  if (depth) answerClock(mx, 'matrixBoard', clockMs(depth, 14, 0.4, 6), () => matrixPick(null)); else stopAnswerClock(mx, 'matrixBoard');
}
// btn is null when the answer clock runs out
function matrixPick(btn) {
  if (!alive(mx) || mx.locked) return;
  mx.locked = true;
  stopAnswerClock(mx, 'matrixBoard');
  const ok = !!btn && sameCell(mx.opts[Number(btn.dataset.i)], mx.answer);
  if (ok) { right(mx, $('matrixBoard')); btn.classList.add('ok'); setBoard('matrixBoard', 'ok'); }
  else {
    wrong(mx); if (btn) btn.classList.add('no'); setBoard('matrixBoard', 'no');
    [...$('matrixOpts').children].forEach((b, i) => { if (sameCell(mx.opts[i], mx.answer)) b.classList.add('ok'); });
  }
  later(mx, ok ? 400 : 1400, nextMatrix);
}
registerGame({
  id: 'matrix', name: 'Missing Piece', skill: 'Logic', colors: ['#6EC6FF', '#01579B'],
  hint: 'Each row and column follows a rule. Pick the piece that completes the grid. 60 seconds.',
  art: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const x = 16 + (i % 3) * 32, y = 14 + Math.floor(i / 3) * 32;
    return '<rect x="' + x + '" y="' + y + '" width="26" height="26" rx="7" fill="#fff" fill-opacity="' + (i === 8 ? .35 : 1) + '"/>' +
      (i === 8 ? '<text x="' + (x + 13) + '" y="' + (y + 20) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="18" fill="#fff">?</text>'
        : drawShape(['circle', 'square', 'triangle'][Math.floor(i / 3)], ['red', 'blue', 'yellow'][i % 3], x + 13, y + 13, 14)); }).join(''),
  html: '<div class="board" id="matrixBoard"><span class="prompt">Which piece is missing?</span><div class="pic-grid tight matrix" id="matrixGrid" style="--n:3"></div></div><div class="pic-grid" id="matrixOpts" style="--n:4"></div>',
  start(my) {
    mx = makeRound('matrix', MAX_LEVEL);
    show('matrix');
    roundHud(mx);
    nextMatrix();
    startClock(mx);
  },
  key(e) { if (e.key >= '1' && e.key <= '6') { const b = $('matrixOpts').children[Number(e.key) - 1]; if (b) matrixPick(b); } }
});
$('matrixOpts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) matrixPick(b); });
