/* Odd One Out (Focus): a grid of the same picture, with one copy slightly different. Tap it.
   Grids grow and the difference gets subtler: color change, upside down, mirrored or smaller, then a small tilt or tint. */
let oo = null;
const ODD_LEVELS = [{ n: 3 }, { n: 4 }, { n: 4 }, { n: 5 }];
const ODD_PICS = PIC_NAMES.filter(p => p !== 'sun'); // the sun looks the same when turned
// Past level 4 the difference shrinks every level (smaller tilt, fainter tint, nearer size), down to a hard floor.
function oddChange(pic) {
  const depth = past(oo.tier, 4);
  switch (Math.min(oo.tier, 4)) {
    case 1: return 'filter:hue-rotate(' + r(130, 200) + 'deg)';
    case 2: return 'transform:rotate(180deg)';
    case 3: return PICS[pic].asym && Math.random() < 0.6 ? 'transform:scaleX(-1)' : 'transform:scale(.72)';
    default: {
      const tilt = Math.max(8, 22 - 1.5 * depth), tint = Math.max(22, 55 - 4 * depth), size = Math.min(0.88, 0.78 + 0.01 * depth);
      return pickOne(['transform:rotate(' + pickOne([-tilt, tilt]) + 'deg)', 'filter:hue-rotate(' + pickOne([-tint, tint]) + 'deg)', 'transform:scale(' + size + ')']);
    }
  }
}
const oddSize = level => level <= ODD_LEVELS.length ? ODD_LEVELS[level - 1].n : Math.min(6, 5 + Math.floor(past(level, 4) / 3));
function nextOdd() {
  const n = oddSize(oo.tier), pic = pickOne(ODD_PICS), depth = past(oo.tier, 11);
  oo.odd = r(0, n * n - 1); oo.locked = false;
  const change = oddChange(pic);
  $('oddGrid').style.setProperty('--n', n);
  $('oddGrid').classList.toggle('tight', n >= 5);
  $('oddGrid').innerHTML = Array.from({ length: n * n }, (_, i) => '<button class="pic" data-i="' + i + '" aria-label="Picture ' + (i + 1) + '">' +
    picSvg(pic, i === oo.odd ? ' style="' + change + '"' : '') + '</button>').join('');
  if (depth) answerClock(oo, 'oddWrap', clockMs(depth, 6, 0.2, 2.5), () => oddTap(null)); else stopAnswerClock(oo, 'oddWrap');
}
// btn is null when the answer clock runs out
function oddTap(btn) {
  if (!alive(oo) || oo.locked) return;
  oo.locked = true;
  stopAnswerClock(oo, 'oddWrap');
  const ok = !!btn && Number(btn.dataset.i) === oo.odd;
  if (ok) { btn.classList.add('ok'); right(oo, $('oddWrap')); }
  else { if (btn) btn.classList.add('no'); $('oddGrid').children[oo.odd].classList.add('ok'); wrong(oo); }
  later(oo, ok ? 300 : 1100, nextOdd);
}
registerGame({
  id: 'oddone', name: 'Odd One Out', skill: 'Focus', colors: ['#C6E86B', '#5A7D10'],
  hint: 'All the pictures are the same except one. Find it fast! 60 seconds.',
  art: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<g transform="translate(' + (16 + (i % 3) * 32) + ' ' + (14 + Math.floor(i / 3) * 32) + ')"><rect width="26" height="26" rx="7" fill="#fff"/>' +
    '<circle cx="13" cy="13" r="7" fill="' + (i === 5 ? '#FFC83D' : '#E5484D') + '"/></g>').join(''),
  html: '<div class="hunt-wrap" id="oddWrap"><div class="pic-grid" id="oddGrid"></div></div>',
  start(my) {
    oo = makeRound('oddone', MAX_LEVEL);
    show('oddone');
    roundHud(oo);
    nextOdd();
    startClock(oo);
  }
});
$('oddGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) oddTap(b); });
