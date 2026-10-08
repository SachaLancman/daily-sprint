/* Shape Seeker (Focus): tap every shape that matches the target (e.g. every blue circle).
   Look-alikes share either the color or the shape. Grids grow and more colors and shapes join. */
let sk = null;
const SEEK_LEVELS = [
  { n: 4, kinds: 3, colors: 3, targets: [2, 3] },
  { n: 5, kinds: 3, colors: 3, targets: [3, 4] },
  { n: 5, kinds: 4, colors: 4, targets: [3, 5] },
  { n: 6, kinds: 4, colors: 4, targets: [4, 6] }
];
function nextSeek() {
  const L = SEEK_LEVELS[sk.tier - 1], kinds = shuffle(SHAPE_KINDS.slice()).slice(0, L.kinds), colors = shuffle(Object.keys(SHAPE_COLORS)).slice(0, L.colors);
  const want = { kind: kinds[0], color: colors[0] }, total = L.n * L.n, count = r(L.targets[0], L.targets[1]);
  const cells = [];
  for (let i = 0; i < count; i++) cells.push(want);
  while (cells.length < total) {
    // Mostly near-misses (same color or same shape), so you have to check both.
    const c = Math.random() < 0.7
      ? (Math.random() < 0.5 ? { kind: want.kind, color: pickOne(colors.slice(1)) } : { kind: pickOne(kinds.slice(1)), color: want.color })
      : { kind: pickOne(kinds), color: pickOne(colors) };
    if (c.kind !== want.kind || c.color !== want.color) cells.push(c);
  }
  sk.cells = shuffle(cells); sk.want = want; sk.left = count; sk.locked = false;
  $('seekAsk').innerHTML = 'Tap every <span class="pic static">' + shapeTile(want.kind, want.color) + '</span> ' + want.color + ' ' + want.kind;
  $('seekGrid').style.setProperty('--n', L.n);
  $('seekGrid').classList.toggle('tight', L.n >= 5);
  $('seekGrid').innerHTML = sk.cells.map((c, i) => '<button class="pic" data-i="' + i + '" aria-label="' + c.color + ' ' + c.kind + '">' + shapeTile(c.kind, c.color) + '</button>').join('');
  $('seekLeft').textContent = count;
}
function seekTap(btn) {
  if (!alive(sk) || sk.locked || btn.classList.contains('ok')) return;
  const c = sk.cells[Number(btn.dataset.i)];
  if (c.kind === sk.want.kind && c.color === sk.want.color) {
    btn.classList.add('ok'); beep(600 + (10 - sk.left) * 30, 0.05);
    sk.left--; $('seekLeft').textContent = sk.left;
    if (!sk.left) { sk.locked = true; right(sk, $('seekWrap')); later(sk, 350, nextSeek); }
  } else {
    btn.classList.add('no'); sk.locked = true;
    [...$('seekGrid').children].forEach((b, i) => { const x = sk.cells[i]; if (x.kind === sk.want.kind && x.color === sk.want.color) b.classList.add('ok'); });
    wrong(sk);
    later(sk, 1100, nextSeek);
  }
}
registerGame({
  id: 'seeker', name: 'Shape Seeker', skill: 'Focus', colors: ['#FF8FB8', '#AD1457'],
  hint: 'Tap every shape that matches the target, and only those. 60 seconds.',
  art: '<rect x="10" y="14" width="100" height="92" rx="16" fill="#fff" fill-opacity=".35"/>' +
    [[30, 34, 'circle', 'blue'], [60, 34, 'square', 'blue'], [90, 34, 'circle', 'red'], [30, 64, 'triangle', 'yellow'], [60, 64, 'circle', 'blue'], [90, 64, 'square', 'red'], [30, 92, 'circle', 'red'], [60, 92, 'diamond', 'blue'], [90, 92, 'circle', 'blue']]
      .map(([x, y, k, c]) => drawShape(k, c, x, y, 20)).join('') +
    '<circle cx="60" cy="64" r="17" fill="none" stroke="#fff" stroke-width="4"/>',
  chips: '<span class="chip hot">Left <b id="seekLeft">0</b></span>',
  html: '<div class="ask" id="seekAsk"></div><div class="hunt-wrap" id="seekWrap"><div class="pic-grid" id="seekGrid"></div></div>',
  start(my) {
    sk = makeRound('seeker', SEEK_LEVELS.length, 2);
    show('seeker');
    roundHud(sk);
    nextSeek();
    startClock(sk, st => [['Grids', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  }
});
$('seekGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) seekTap(b); });
