/* Picture Spell (Language): see a picture, pick the correctly spelled word.
   Level 1 misspellings drop a letter (easy to spot); level 2 double or un-double a letter; level 3 swap letters or vowels. */
let ps = null;
const SPELL_PICS = PIC_NAMES.filter(p => PICS[p].word.length >= 5);
const VOWELS = 'aeiou';
const misspell = {
  1: w => { const i = r(1, w.length - 1); return w.slice(0, i) + w.slice(i + 1); },
  2: w => {
    const doubles = [...w].map((c, i) => i).filter(i => i > 0 && w[i] === w[i - 1]);
    if (doubles.length && Math.random() < 0.5) { const i = pickOne(doubles); return w.slice(0, i) + w.slice(i + 1); }
    const cons = [...w].map((c, i) => i).filter(i => i > 0 && !VOWELS.includes(w[i]) && w[i] !== w[i - 1] && w[i] !== w[i + 1]);
    const i = pickOne(cons.length ? cons : [1]); return w.slice(0, i) + w[i] + w.slice(i);
  },
  3: w => {
    if (Math.random() < 0.5) { const i = r(1, w.length - 2); return w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); }
    const vs = [...w].map((c, i) => i).filter(i => i > 0 && VOWELS.includes(w[i]));
    if (!vs.length) return misspell[2](w);
    const i = pickOne(vs); return w.slice(0, i) + pickOne([...VOWELS].filter(v => v !== w[i])) + w.slice(i + 1);
  }
};
function nextSpell() {
  let pic;
  do { pic = pickOne(SPELL_PICS); } while (ps.recent.includes(pic));
  ps.recent = ps.recent.concat(pic).slice(-8);
  // Past level 3: only the subtle kinds of mistakes, 5 then 6 options, and an answer clock.
  const depth = past(ps.tier, 3), count = depth >= 4 ? 6 : depth ? 5 : 4;
  const word = PICS[pic].word, opts = [word];
  for (let tries = 0; opts.length < count && tries < 80; tries++) {
    const level = tries >= 40 ? r(1, 3) : depth ? r(2, 3) : ps.tier; // fall back to other kinds of mistakes if needed
    const bad = misspell[level](word);
    if (bad !== word && bad.length >= 3 && !opts.includes(bad)) opts.push(bad);
  }
  ps.word = word; ps.locked = false;
  if (depth) answerClock(ps, 'spellBoard', clockMs(depth, 4.5, 0.12, 1.8), () => spellChoose(null)); else stopAnswerClock(ps, 'spellBoard');
  $('spellPic').innerHTML = picSvg(pic);
  $('spellPic').classList.remove('pop-in'); void $('spellPic').offsetWidth; $('spellPic').classList.add('pop-in');
  $('spellOpts').innerHTML = shuffle(opts).map(o => '<button class="opt" data-o="' + o + '">' + o + '</button>').join('');
  setBoard('spellBoard', null);
}
// btn is null when the answer clock runs out
function spellChoose(btn) {
  if (!alive(ps) || ps.locked) return;
  ps.locked = true;
  stopAnswerClock(ps, 'spellBoard');
  const ok = !!btn && btn.dataset.o === ps.word;
  if (ok) { right(ps, $('spellBoard')); btn.classList.add('ok'); setBoard('spellBoard', 'ok'); }
  else {
    wrong(ps); if (btn) btn.classList.add('no'); setBoard('spellBoard', 'no');
    [...$('spellOpts').children].forEach(b => { if (b.dataset.o === ps.word) b.classList.add('ok'); });
  }
  later(ps, ok ? 350 : 1200, nextSpell);
}
registerGame({
  id: 'picspell', name: 'Picture Spell', skill: 'Language', colors: ['#FF7676', '#B71C1C'],
  hint: 'Look at the picture and pick the word that is spelled correctly. 60 seconds.',
  art: '<g transform="rotate(-6 46 46)"><rect x="14" y="14" width="64" height="64" rx="16" fill="#fff"/>' + '<g transform="translate(22 22) scale(.48)" stroke="#2B2350" stroke-width="5" stroke-linejoin="round">' + PICS.balloon.svg + '</g></g>' +
    '<g transform="rotate(5 80 94)"><rect x="46" y="80" width="68" height="28" rx="10" fill="#FFC83D"/><text x="80" y="100" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="16" fill="#17153A">abc</text></g>',
  html: '<div class="board" id="spellBoard"><span class="prompt">Which spelling is right?</span><div class="pic-big" id="spellPic"></div></div><div class="opts" id="spellOpts"></div>',
  start(my) {
    ps = makeRound('picspell', MAX_LEVEL);
    ps.recent = [];
    show('picspell');
    roundHud(ps);
    nextSpell();
    startClock(ps);
  },
  key(e) { if (e.key >= '1' && e.key <= '4') { const b = $('spellOpts').children[Number(e.key) - 1]; if (b) spellChoose(b); } }
});
$('spellOpts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) spellChoose(b); });
