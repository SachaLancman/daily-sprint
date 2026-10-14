/* Find the Twins (Focus): a grid of different pictures where exactly two are identical. Tap both twins.
   Grids grow, and look-alikes join in: the twins' picture in another color or mirrored, and other pictures
   that appear twice but not quite the same. Colors get closer as you go deeper. */
let tw = null;
const TWIN_LEVELS = [
  { n: 3, look: 0, near: 0 },
  { n: 4, look: 0, near: 0 },
  { n: 4, look: 1, near: 1 },
  { n: 5, look: 2, near: 2 }
];
// Pictures that are mostly white or gray look the same in another color, so they never get a color change.
const TWIN_NO_TINT = ['dice', 'cloud', 'snowman', 'rocket', 'glasses', 'penguin', 'anchor', 'camera', 'hammer', 'candle'];
// Past level 4: up to a 6x6 grid, more look-alikes, and closer colors; a time limit per grid from level 9.
function twinLevel(level) {
  if (level <= TWIN_LEVELS.length) return Object.assign({ tint: 150 }, TWIN_LEVELS[level - 1]);
  const d = past(level, TWIN_LEVELS.length);
  return { n: Math.min(6, 5 + Math.floor(d / 3)), look: Math.min(3, 2 + Math.floor(d / 4)), near: Math.min(6, 2 + Math.floor(d / 2)), tint: Math.max(40, 150 - 12 * d) };
}
// The ways a picture can be changed: '' (as drawn), 'h+' / 'h-' (other colors), 'm' (mirrored).
const twinVariants = pic => [''].concat(TWIN_NO_TINT.includes(pic) ? [] : ['h+', 'h-'], PICS[pic].asym ? ['m'] : []);
const twinStyle = (v, tint) => v === 'm' ? ' style="transform:scaleX(-1)"' : v ? ' style="filter:hue-rotate(' + (v === 'h+' ? tint : -tint) + 'deg)"' : '';
function nextTwins() {
  const L = twinLevel(tw.tier), depth = past(tw.tier, 8), total = L.n * L.n;
  const pics = shuffle(PIC_NAMES.slice()), twin = pics.pop();
  // The twins themselves can be the changed version, with the plain picture as a look-alike.
  const vars = shuffle(twinVariants(twin)), twinVar = L.look ? vars.pop() : '';
  const cells = [{ pic: twin, v: twinVar }, { pic: twin, v: twinVar }];
  vars.filter(v => v !== twinVar).slice(0, L.look).forEach(v => cells.push({ pic: twin, v }));
  // Near pairs: another picture twice, but one copy changed.
  for (let k = 0; k < L.near; k++) {
    const p = pics.pop(), pv = shuffle(twinVariants(p));
    if (pv.length > 1) cells.push({ pic: p, v: pv[0] }, { pic: p, v: pv[1] }); else cells.push({ pic: p, v: '' });
  }
  while (cells.length < total) cells.push({ pic: pics.pop(), v: '' });
  tw.cells = shuffle(cells.slice(0, total));
  tw.twins = tw.cells.map((c, i) => i).filter(i => tw.cells[i].pic === twin && tw.cells[i].v === twinVar);
  tw.found = 0; tw.locked = false;
  $('twinGrid').style.setProperty('--n', L.n);
  $('twinGrid').classList.toggle('tight', L.n >= 5);
  $('twinGrid').innerHTML = tw.cells.map((c, i) => '<button class="pic" data-i="' + i + '" aria-label="' + picLabel(c.pic) + '">' + picSvg(c.pic, twinStyle(c.v, L.tint)) + '</button>').join('');
  if (depth) answerClock(tw, 'twinWrap', clockMs(depth, 9, 0.25, 4), () => twinMiss(null)); else stopAnswerClock(tw, 'twinWrap');
}
// btn is null when the answer clock runs out
function twinMiss(btn) {
  if (!alive(tw) || tw.locked) return;
  tw.locked = true;
  stopAnswerClock(tw, 'twinWrap');
  if (btn) btn.classList.add('no');
  tw.twins.forEach(i => $('twinGrid').children[i].classList.add('ok')); // show where they were
  wrong(tw);
  later(tw, 1200, nextTwins);
}
function twinTap(btn) {
  if (!alive(tw) || tw.locked || btn.classList.contains('ok')) return;
  if (!tw.twins.includes(Number(btn.dataset.i))) return twinMiss(btn);
  btn.classList.add('ok');
  if (++tw.found < 2) { beep(600, 0.05); return; }
  tw.locked = true;
  stopAnswerClock(tw, 'twinWrap');
  right(tw, $('twinWrap'));
  later(tw, 350, nextTwins);
}
registerGame({
  id: 'twins', name: 'Find the Twins', skill: 'Focus', colors: ['#C6E86B', '#5A7D10'],
  hint: 'Every picture is different except two twins. Find them and tap both! 60 seconds.',
  art: [['circle', 'red'], ['diamond', 'blue'], ['square', 'yellow'], ['triangle', 'green'], ['square', 'red'], ['circle', 'blue'], ['diamond', 'yellow'], ['triangle', 'red'], ['diamond', 'blue']]
    .map(([k, c], i) => '<g transform="translate(' + (16 + (i % 3) * 32) + ' ' + (14 + Math.floor(i / 3) * 32) + ')"><rect width="26" height="26" rx="7" fill="#fff"' +
      (i === 1 || i === 8 ? ' stroke="#FFC83D" stroke-width="3"' : '') + '/>' + drawShape(k, c, 13, 13, 15) + '</g>').join(''),
  html: '<div class="hunt-wrap" id="twinWrap"><div class="pic-grid" id="twinGrid"></div></div>',
  start(my) {
    tw = makeRound('twins', MAX_LEVEL, 2);
    show('twins');
    roundHud(tw);
    nextTwins();
    startClock(tw, st => [['Twins found', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  }
});
$('twinGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) twinTap(b); });
