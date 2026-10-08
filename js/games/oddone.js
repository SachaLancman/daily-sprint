/* Odd One Out (Focus): a grid of the same picture, with one copy slightly different. Tap it.
   Grids grow and the difference gets subtler: color change, upside down, mirrored or smaller, then a small tilt or tint. */
let oo = null;
const ODD_LEVELS = [{ n: 3 }, { n: 4 }, { n: 4 }, { n: 5 }];
const ODD_PICS = PIC_NAMES.filter(p => p !== 'sun'); // the sun looks the same when turned
function oddChange(pic) {
  switch (oo.tier) {
    case 1: return 'filter:hue-rotate(' + r(130, 200) + 'deg)';
    case 2: return 'transform:rotate(180deg)';
    case 3: return PICS[pic].asym && Math.random() < 0.6 ? 'transform:scaleX(-1)' : 'transform:scale(.72)';
    default: return Math.random() < 0.5 ? 'transform:rotate(' + pickOne([-22, 22]) + 'deg)' : 'filter:hue-rotate(' + pickOne([-55, 55]) + 'deg)';
  }
}
function nextOdd() {
  const n = ODD_LEVELS[oo.tier - 1].n, pic = pickOne(ODD_PICS);
  oo.odd = r(0, n * n - 1); oo.locked = false;
  const change = oddChange(pic);
  $('oddGrid').style.setProperty('--n', n);
  $('oddGrid').classList.toggle('tight', n >= 5);
  $('oddGrid').innerHTML = Array.from({ length: n * n }, (_, i) => '<button class="pic" data-i="' + i + '" aria-label="Picture ' + (i + 1) + '">' +
    picSvg(pic, i === oo.odd ? ' style="' + change + '"' : '') + '</button>').join('');
}
function oddTap(btn) {
  if (!alive(oo) || oo.locked) return;
  oo.locked = true;
  const ok = Number(btn.dataset.i) === oo.odd;
  if (ok) { btn.classList.add('ok'); right(oo, $('oddWrap')); }
  else { btn.classList.add('no'); $('oddGrid').children[oo.odd].classList.add('ok'); wrong(oo); }
  later(oo, ok ? 300 : 1100, nextOdd);
}
registerGame({
  id: 'oddone', name: 'Odd One Out', skill: 'Focus', colors: ['#C6E86B', '#5A7D10'],
  hint: 'All the pictures are the same except one. Find it fast! 60 seconds.',
  art: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<g transform="translate(' + (16 + (i % 3) * 32) + ' ' + (14 + Math.floor(i / 3) * 32) + ')"><rect width="26" height="26" rx="7" fill="#fff"/>' +
    '<circle cx="13" cy="13" r="7" fill="' + (i === 5 ? '#FFC83D' : '#E5484D') + '"/></g>').join(''),
  html: '<div class="hunt-wrap" id="oddWrap"><div class="pic-grid" id="oddGrid"></div></div>',
  start(my) {
    oo = makeRound('oddone', ODD_LEVELS.length);
    show('oddone');
    roundHud(oo);
    nextOdd();
    startClock(oo);
  }
});
$('oddGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) oddTap(b); });
