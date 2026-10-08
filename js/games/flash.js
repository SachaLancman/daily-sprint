/* Flash Match (Speed): pictures appear one after another. Is this the same picture as the one just before?
   Higher levels draw from more pictures, including look-alikes, so you have to really look. */
let fm = null;
const FLASH_POOLS = [
  ['apple', 'star', 'fish'],
  ['apple', 'cherry', 'star', 'moon', 'fish'],
  ['apple', 'cherry', 'heart', 'star', 'moon', 'lemon', 'balloon'],
  ['apple', 'cherry', 'heart', 'mushroom', 'star', 'crown', 'moon', 'lemon', 'banana', 'bell']
];
function flashShow(pic, msg) {
  fm.prev = fm.cur; fm.cur = pic;
  $('flashPic').innerHTML = picSvg(pic);
  $('flashPic').classList.remove('pop-in'); void $('flashPic').offsetWidth; $('flashPic').classList.add('pop-in');
  $('flashMsg').textContent = msg;
  setBoard('flashBoard', null);
}
function nextFlash() {
  const pool = FLASH_POOLS[fm.tier - 1];
  const pic = Math.random() < 0.4 ? fm.cur : pickOne(pool.filter(p => p !== fm.cur));
  flashShow(pic, 'Same as the one before?');
  fm.locked = false;
}
function flashAnswer(same) {
  if (!alive(fm) || fm.locked) return;
  fm.locked = true;
  const ok = same === (fm.cur === fm.prev);
  if (ok) { right(fm, $('flashBoard')); setBoard('flashBoard', 'ok'); }
  else { wrong(fm); setBoard('flashBoard', 'no'); }
  later(fm, ok ? 220 : 650, nextFlash);
}
registerGame({
  id: 'flash', name: 'Flash Match', skill: 'Speed', colors: ['#FFCF5C', '#8D5A00'],
  hint: 'Is each picture the same as the one just before it? Answer as fast as you can.',
  art: '<g transform="rotate(-10 40 54)"><rect x="12" y="26" width="52" height="60" rx="12" fill="#fff" fill-opacity=".5"/></g>' +
    '<g transform="rotate(6 72 58)"><rect x="44" y="24" width="56" height="66" rx="12" fill="#fff"/><path d="M72 36l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#FFC83D" stroke="currentColor" stroke-width="2"/></g>' +
    '<path d="M98 10l-8 16h8l-6 14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="board" id="flashBoard"><span class="prompt" id="flashMsg">Remember this one</span><div class="pic-big" id="flashPic"></div></div>' +
    '<div class="yn" id="flashBtns"><button class="opt" data-a="0" aria-label="Different (left arrow)"></button><button class="opt" data-a="1" aria-label="Same (right arrow)"></button></div>',
  start(my) {
    fm = makeRound('flash', FLASH_POOLS.length, 4);
    fm.cur = null; fm.locked = true;
    show('flash');
    roundHud(fm);
    flashShow(pickOne(FLASH_POOLS[fm.tier - 1]), 'Remember this one');
    later(fm, 1000, nextFlash);
    startClock(fm);
  },
  key(e) { if (e.key === 'ArrowLeft' || e.key === 'n') flashAnswer(false); else if (e.key === 'ArrowRight' || e.key === 'y') flashAnswer(true); }
});
$('flashBtns').children[0].innerHTML = ICON.x + 'Different';
$('flashBtns').children[1].innerHTML = ICON.check + 'Same';
$('flashBtns').addEventListener('click', e => { const b = e.target.closest('button'); if (b) flashAnswer(b.dataset.a === '1'); });
