/* Sort Rush (Speed): send each shape left or right as fast as you can.
   L1 sorts by shape, L2 by color, L3 switches rule every few items, L4 can switch on any item. The current rule is always shown. */
let sr = null;
function newSortRule() {
  const byShape = sr.tier === 1 ? true : sr.tier === 2 ? false : Math.random() < 0.5;
  const pair = byShape ? shuffle(['circle', 'square', 'triangle', 'diamond']).slice(0, 2) : shuffle(Object.keys(SHAPE_COLORS)).slice(0, 2);
  sr.rule = { byShape, left: pair[0], right: pair[1] };
  sr.ruleLeft = sr.tier >= 8 ? r(1, 2) : sr.tier >= 4 ? r(1, 3) : r(4, 6); // items until the rule may change
  const icon = v => byShape ? shapeTile(v, '#B8B4D4') : shapeTile('circle', v);
  $('sortBtns').children[0].innerHTML = '<span class="pic static">' + icon(pair[0]) + '</span>' + pair[0];
  $('sortBtns').children[1].innerHTML = pair[1] + '<span class="pic static">' + icon(pair[1]) + '</span>';
  $('sortRule').textContent = 'Sort by ' + (byShape ? 'SHAPE' : 'COLOR');
  $('sortRule').classList.remove('pop-in'); void $('sortRule').offsetWidth; $('sortRule').classList.add('pop-in');
}
function nextSort() {
  if (sr.tier >= 3 && --sr.ruleLeft <= 0) newSortRule();
  const R = sr.rule, side = Math.random() < 0.5 ? 'left' : 'right', key = R[side];
  // The other property is random, so color can't give away a shape answer (and the other way round).
  const kind = R.byShape ? key : pickOne(SHAPE_KINDS), color = R.byShape ? pickOne(Object.keys(SHAPE_COLORS)) : key;
  sr.answer = side; sr.locked = false;
  $('sortItem').innerHTML = shapeTile(kind, color);
  $('sortItem').classList.remove('pop-in'); void $('sortItem').offsetWidth; $('sortItem').classList.add('pop-in');
  setBoard('sortBoard', null);
  // Past level 4: an answer clock that keeps shortening.
  const depth = past(sr.tier, 4);
  if (depth) answerClock(sr, 'sortBoard', clockMs(depth, 2.2, 0.05, 0.75), () => sortPick(null)); else stopAnswerClock(sr, 'sortBoard');
}
// side is null when the answer clock runs out
function sortPick(side) {
  if (!alive(sr) || sr.locked) return;
  sr.locked = true;
  stopAnswerClock(sr, 'sortBoard');
  const ok = side === sr.answer, before = sr.tier;
  if (ok) { right(sr, $('sortBoard')); setBoard('sortBoard', 'ok'); } else { wrong(sr); setBoard('sortBoard', 'no'); }
  if (sr.tier !== before && sr.tier <= 2) newSortRule(); // levels 1 and 2 have fixed rules, so set the new one
  later(sr, ok ? 150 : 600, nextSort);
}
registerGame({
  id: 'sort', name: 'Sort Rush', skill: 'Speed', colors: ['#FF9F6E', '#A33D12'],
  hint: 'Send each shape to the left or right side by the rule shown. The rule can change!',
  art: '<path d="M60 18v84" stroke="#fff" stroke-width="4" stroke-dasharray="6 7" stroke-linecap="round"/>' +
    drawShape('circle', 'blue', 30, 40, 26) + drawShape('circle', 'red', 30, 80, 26) + drawShape('square', 'yellow', 90, 40, 26) + drawShape('square', 'green', 90, 80, 26) +
    '<path d="M46 60h-10m5-6l-6 6 6 6M74 60h10m-5-6l6 6-6 6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="board" id="sortBoard"><span class="status go" id="sortRule">Sort by SHAPE</span><div class="pic-big" id="sortItem"></div></div>' +
    '<div class="yn sort-btns" id="sortBtns"><button class="opt" data-s="left"></button><button class="opt" data-s="right"></button></div>',
  start(my) {
    sr = makeRound('sort', MAX_LEVEL, 5);
    show('sort');
    roundHud(sr);
    newSortRule();
    nextSort();
    startClock(sr);
  },
  key(e) { if (e.key === 'ArrowLeft') sortPick('left'); else if (e.key === 'ArrowRight') sortPick('right'); }
});
$('sortBtns').addEventListener('click', e => { const b = e.target.closest('button'); if (b) sortPick(b.dataset.s); });
