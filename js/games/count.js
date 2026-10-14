/* Quick Count (Math): pictures flash on screen; then say how many there were of one kind.
   Level 1: one kind, told in advance. Level 2+: two or three kinds, and the question comes after. Less time each level. */
let qc = null;
const COUNT_LEVELS = [
  { kinds: 1, min: 2, max: 6, others: 0, ms: 2600 },
  { kinds: 2, min: 3, max: 7, others: 5, ms: 2400 },
  { kinds: 3, min: 4, max: 9, others: 5, ms: 2200 },
  { kinds: 3, min: 5, max: 11, others: 6, ms: 1900 }
];
// Past level 4: more to count and less time to look (the field holds at most 30 pictures).
function countLevel(level) {
  if (level <= COUNT_LEVELS.length) return COUNT_LEVELS[level - 1];
  const b = past(level, COUNT_LEVELS.length);
  return { kinds: 3, min: 5 + Math.floor(b / 3), max: Math.min(14, 11 + Math.floor(b / 2)), others: 6, ms: Math.max(800, 1900 - 70 * b) };
}
const COUNT_PICS = ['apple', 'cherry', 'star', 'heart', 'fish', 'leaf', 'balloon', 'mushroom', 'lemon', 'bell', 'kite', 'cupcake', 'donut', 'cookie', 'ladybug', 'gift', 'orange', 'octopus'];
function nextCount() {
  const L = countLevel(qc.tier), kinds = samplePics(L.kinds, COUNT_PICS), target = kinds[0];
  const n = r(L.min, L.max), items = Array(n).fill(target);
  kinds.slice(1).forEach(k => { for (let i = r(1, L.others); i > 0; i--) items.push(k); });
  // Place pictures in a 6x5 grid of cells (with a little jitter) so they never overlap.
  const cells = shuffle(Array.from({ length: 30 }, (_, i) => i)).slice(0, items.length);
  $('countField').innerHTML = items.map((k, i) => {
    const c = cells[i], x = (c % 6) * 16.66 + r(1, 3), y = Math.floor(c / 6) * 20 + r(1, 4);
    return picSvg(k, ' style="left:' + x + '%;top:' + y + '%;transform:rotate(' + r(-20, 20) + 'deg)"');
  }).join('');
  qc.answer = n; qc.target = target; qc.locked = true;
  $('countAsk').innerHTML = qc.tier === 1 ? 'Count the <span class="pic static">' + picSvg(target) + '</span>' : 'Count everything!';
  $('countOpts').innerHTML = '';
  setBoard('countBoard', null);
  later(qc, L.ms, () => {
    $('countField').insertAdjacentHTML('beforeend', '<div class="cover">?</div>');
    $('countAsk').innerHTML = 'How many <span class="pic static">' + picSvg(target) + '</span>?';
    const opts = [n];
    for (const c of shuffle([n - 2, n - 1, n + 1, n + 2, n + 3])) if (opts.length < 4 && c >= 1) opts.push(c);
    $('countOpts').innerHTML = opts.sort((a, b) => a - b).map(o => '<button class="opt num" data-o="' + o + '">' + o + '</button>').join('');
    qc.locked = false;
  });
}
function countChoose(btn) {
  if (!alive(qc) || qc.locked) return;
  qc.locked = true;
  const ok = Number(btn.dataset.o) === qc.answer;
  if (ok) { right(qc, $('countBoard')); btn.classList.add('ok'); setBoard('countBoard', 'ok'); }
  else {
    wrong(qc); btn.classList.add('no'); setBoard('countBoard', 'no');
    [...$('countOpts').children].forEach(b => { if (Number(b.dataset.o) === qc.answer) b.classList.add('ok'); });
  }
  const cover = $('countField').querySelector('.cover'); if (cover) cover.remove(); // show the pictures again
  later(qc, ok ? 700 : 1500, nextCount);
}
registerGame({
  id: 'count', name: 'Quick Count', skill: 'Math', colors: ['#FF8A7A', '#C0392B'],
  hint: 'Pictures flash for a moment. Count them before they disappear!',
  art: '<rect x="10" y="20" width="100" height="84" rx="16" fill="#fff"/>' +
    [[22, 32], [58, 28], [36, 62], [76, 58]].map(([x, y]) => '<circle cx="' + (x + 10) + '" cy="' + (y + 10) + '" r="11" fill="#E5484D"/>').join('') +
    '<g transform="rotate(10 96 30)"><rect x="78" y="10" width="34" height="34" rx="10" fill="#FFC83D"/><text x="95" y="35" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="22" fill="#17153A">4</text></g>',
  html: '<div class="board" id="countBoard"><div class="ask" id="countAsk"></div><div class="count-field" id="countField"></div></div><div class="opts" id="countOpts"></div>',
  start(my) {
    qc = makeRound('count', MAX_LEVEL);
    show('count');
    roundHud(qc);
    nextCount();
    startClock(qc);
  },
  key(e) { if (e.key >= '1' && e.key <= '4') { const b = $('countOpts').children[Number(e.key) - 1]; if (b) countChoose(b); } }
});
$('countOpts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) countChoose(b); });
