/* Balance (Logic): read the balanced scales, then work out how many shapes make another shape's weight.
   L1: one scale. L2: two scales to chain (circle -> squares -> triangles). L3: subtract. L4: share out. */
let bl = null;
const SHAPE = {
  c: (x, y, s) => '<circle cx="' + x + '" cy="' + y + '" r="' + s / 2 + '" fill="#E5484D"/>',
  s: (x, y, s) => '<rect x="' + (x - s / 2) + '" y="' + (y - s / 2) + '" width="' + s + '" height="' + s + '" rx="3" fill="#3B6FF5"/>',
  t: (x, y, s) => '<path d="M' + x + ' ' + (y - s / 2) + 'l' + s / 2 + ' ' + s + 'h-' + s + 'z" fill="#FFC83D"/>'
};
const SHAPE_NAME = { c: 'circle', s: 'square', t: 'triangle' };
// Draws a balanced scale with the given shapes on each pan, e.g. ['c'] vs ['s','s'].
function scaleSvg(left, right) {
  const pan = (items, cx) => {
    const per = 4, size = 16, gap = 3, cols = Math.min(per, items.length);
    return items.map((k, i) => SHAPE[k](cx + ((i % per) - (cols - 1) / 2) * (size + gap), 82 - Math.floor(i / per) * (size + gap) - size / 2, size)).join('');
  };
  // The frame uses the theme's muted color (set in CSS on .beam), the shapes have their own colors.
  return '<svg viewBox="0 0 300 120" aria-hidden="true"><g stroke="#2B2350" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
    '<path class="beam" d="M150 30v74M118 106h64M40 30h220M6 84h68M226 84h68" fill="none" stroke-width="6"/>' +
    '<path class="beam" d="M40 30l-26 54M40 30l26 54M260 30l-26 54M260 30l26 54" fill="none" stroke-width="2"/>' +
    pan(left, 40) + pan(right, 260) + '</g></svg>';
}
const many = (k, n) => Array(n).fill(k);
const shapeIcon = (k, size = 26) => '<svg viewBox="0 0 30 30" width="' + size + '" height="' + size + '" style="display:inline-block;vertical-align:middle"><g stroke="#2B2350" stroke-width="2.5" stroke-linejoin="round">' + SHAPE[k](15, 15, 22) + '</g></svg>';
function makeBalance() {
  switch (bl.tier) {
    case 1: { const k = r(2, 4), n = r(2, 3); return { scales: [[['c'], many('s', k)]], ask: [many('c', n), 's'], ans: n * k }; }
    case 2: { const a = r(2, 3), b = r(2, 3); return { scales: [[['c'], many('s', a)], [['s'], many('t', b)]], ask: [['c'], 't'], ans: a * b }; }
    case 3: { const b = r(1, 3), c = r(b + 2, 8); return { scales: [[['c', 's'], many('t', c)], [['s'], many('t', b)]], ask: [['c'], 't'], ans: c - b }; }
    default: { const x = r(2, 3), per = r(2, 3), b = r(1, 2); return { scales: [[many('c', x), many('s', x * per)], [['s'], many('t', b)]], ask: [['c'], 't'], ans: per * b }; }
  }
}
function nextBalance() {
  const p = makeBalance();
  bl.ans = p.ans; bl.locked = false;
  $('balScales').innerHTML = p.scales.map(([a, b]) => scaleSvg(a, b)).join('');
  $('balAsk').innerHTML = p.ask[0].map(k => shapeIcon(k)).join('') + ' = ? ' + shapeIcon(p.ask[1]);
  const opts = [p.ans];
  for (const c of shuffle([p.ans - 1, p.ans + 1, p.ans + 2, p.ans * 2, p.ans - 2, p.ans + 3])) if (opts.length < 4 && c >= 1 && !opts.includes(c)) opts.push(c);
  $('balOpts').innerHTML = opts.sort((a, b) => a - b).map(o => '<button class="opt" data-o="' + o + '">' + o + ' ' + shapeIcon(p.ask[1], 20) + '</button>').join('');
  setBoard('balBoard', null);
}
function balanceChoose(btn) {
  if (!alive(bl) || bl.locked) return;
  bl.locked = true;
  const ok = Number(btn.dataset.o) === bl.ans;
  if (ok) { right(bl, $('balBoard')); btn.classList.add('ok'); setBoard('balBoard', 'ok'); }
  else {
    wrong(bl); btn.classList.add('no'); setBoard('balBoard', 'no');
    [...$('balOpts').children].forEach(b => { if (Number(b.dataset.o) === bl.ans) b.classList.add('ok'); });
  }
  later(bl, ok ? 400 : 1500, nextBalance);
}
registerGame({
  id: 'balance', name: 'Balance', skill: 'Logic', colors: ['#A7C0CC', '#455A64'],
  hint: 'The scales are balanced. Work out how many shapes weigh the same. 60 seconds.',
  art: '<path d="M60 22v74M40 98h40M18 34h84" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M18 34l-12 28M18 34l12 28M102 34l-12 28M102 34l12 28" stroke="#fff" stroke-width="2"/>' +
    '<path d="M2 62h32M86 62h32" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="51" r="10" fill="#E5484D" stroke="currentColor" stroke-width="2"/>' +
    '<rect x="88" y="46" width="12" height="12" rx="2" fill="#3B6FF5" stroke="currentColor" stroke-width="2"/><rect x="104" y="46" width="12" height="12" rx="2" fill="#3B6FF5" stroke="currentColor" stroke-width="2"/>',
  html: '<div class="board" id="balBoard"><span class="prompt">These scales are balanced</span><div class="scales" id="balScales"></div><div class="ask" id="balAsk"></div></div><div class="opts" id="balOpts"></div>',
  start(my) {
    bl = makeRound('balance', 4);
    show('balance');
    roundHud(bl);
    nextBalance();
    startClock(bl);
  },
  key(e) { if (e.key >= '1' && e.key <= '4') { const b = $('balOpts').children[Number(e.key) - 1]; if (b) balanceChoose(b); } }
});
$('balOpts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) balanceChoose(b); });
