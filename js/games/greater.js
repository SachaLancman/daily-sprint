/* Greater Than (Math): tap the bigger of two values.
   L1: sums. L2: products. L3: fractions. L4: percentages ("25% of 80"). The two values are never equal. */
let gt = null;
// `depth` (levels past 4) makes the numbers bigger, so very close pairs exist.
const GREATER_MAKERS = [
  () => { const a = r(2, 30), b = r(2, 30); return [a + ' + ' + b, a + b]; },
  (depth = 0) => { const a = r(3, 12 + depth), b = r(3, 12 + depth); return [a + ' × ' + b, a * b]; },
  (depth = 0) => { const d = depth ? r(3, Math.min(24, 8 + depth)) : pickOne([2, 3, 4, 5, 6, 8, 10]), n = r(1, d - 1); return [n + '/' + d, n / d]; },
  () => { const p = pickOne([10, 20, 25, 30, 40, 50, 60, 75, 80, 90]), base = 20 * r(1, 15); return [p + '% of ' + base, p * base / 100]; }
];
// Past level 4: products, fractions or percentages that are closer and closer together, against an answer clock.
function nextGreater() {
  const depth = past(gt.tier, GREATER_MAKERS.length);
  const make = depth ? pickOne(GREATER_MAKERS.slice(1)) : GREATER_MAKERS[gt.tier - 1];
  const closeness = Math.max(0.06, 0.3 - 0.02 * depth); // biggest allowed gap, as a share of the bigger value
  const gap = (x, y) => Math.abs(x[1] - y[1]) / Math.max(x[1], y[1]);
  let a, b, best = null;
  for (let tries = 0; tries < 400; tries++) {
    a = make(depth); b = depth ? make(depth) : Math.random() < 0.3 && gt.tier > 1 ? GREATER_MAKERS[gt.tier - 2]() : make();
    if (Math.abs(a[1] - b[1]) < 1e-9 || a[0] === b[0]) continue; // never equal
    if (!best || gap(a, b) < gap(best[0], best[1])) best = [a, b]; // keep the closest pair found
    if (!depth || gap(a, b) <= closeness) break;
  }
  [a, b] = best;
  gt.vals = [a[1], b[1]]; gt.locked = false;
  if (depth) answerClock(gt, 'greaterBoard', clockMs(depth, 4, 0.12, 1.5), () => greaterPick(-1));
  else stopAnswerClock(gt, 'greaterBoard');
  $('greaterBtns').children[0].textContent = a[0];
  $('greaterBtns').children[1].textContent = b[0];
  [...$('greaterBtns').children].forEach(x => x.classList.remove('ok', 'no'));
  setBoard('greaterBoard', null);
}
// side: 0 = left, 1 = right, -1 = the answer clock ran out
function greaterPick(side) {
  if (!alive(gt) || gt.locked) return;
  gt.locked = true;
  stopAnswerClock(gt, 'greaterBoard');
  const best = gt.vals[0] > gt.vals[1] ? 0 : 1, ok = side === best, btns = $('greaterBtns').children;
  if (ok) { right(gt, $('greaterBoard')); btns[side].classList.add('ok'); setBoard('greaterBoard', 'ok'); }
  else { wrong(gt); if (side >= 0) btns[side].classList.add('no'); btns[best].classList.add('ok'); setBoard('greaterBoard', 'no'); }
  later(gt, ok ? 250 : 900, nextGreater);
}
registerGame({
  id: 'greater', name: 'Greater Than', skill: 'Math', colors: ['#73B4FF', '#1565C0'],
  hint: 'Tap the bigger value. Watch out for fractions and percentages! 60 seconds.',
  art: '<g transform="rotate(-8 34 60)"><rect x="8" y="36" width="52" height="48" rx="12" fill="#fff" fill-opacity=".55"/><text x="34" y="68" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="20" fill="currentColor">3/4</text></g>' +
    '<g transform="rotate(8 86 60)"><rect x="60" y="36" width="52" height="48" rx="12" fill="#fff"/><text x="86" y="68" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="20" fill="currentColor">4/5</text></g>' +
    '<path d="M50 16l12 8-12 8" fill="none" stroke="#FFC83D" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="board" id="greaterBoard"><span class="prompt">Which is bigger?</span></div><div class="yn" id="greaterBtns"><button class="opt num"></button><button class="opt num"></button></div>',
  start(my) {
    gt = makeRound('greater', MAX_LEVEL, 4);
    show('greater');
    roundHud(gt);
    nextGreater();
    startClock(gt);
  },
  key(e) { if (e.key === 'ArrowLeft') greaterPick(0); else if (e.key === 'ArrowRight') greaterPick(1); }
});
$('greaterBtns').addEventListener('click', e => { const b = e.target.closest('button'); if (b) greaterPick([...$('greaterBtns').children].indexOf(b)); });
