/* Picture Pairs (Memory): flip two cards at a time to find matching pictures.
   Clearing a board gives a bonus and a bigger board: 12, then 16, then 20 cards. */
let pp = null;
const PAIR_BOARDS = [{ cards: 12, cols: 4 }, { cards: 16, cols: 4 }, { cards: 20, cols: 5 }, { cards: 24, cols: 6 }, { cards: 30, cols: 6 }];
// Past the biggest board, a wrong pair stays visible for less time each level.
const pairBoard = level => PAIR_BOARDS[Math.min(level, PAIR_BOARDS.length) - 1];
const pairPeek = level => Math.max(300, 750 - 45 * past(level, PAIR_BOARDS.length));
function newPairsBoard() {
  const B = pairBoard(pp.tier), pics = samplePics(B.cards / 2);
  pp.cards = shuffle(pics.concat(pics)); pp.up = []; pp.found = 0; pp.locked = false;
  $('pairsGrid').style.setProperty('--n', B.cols);
  $('pairsGrid').innerHTML = pp.cards.map((_, i) => '<button class="mcard" data-i="' + i + '" aria-label="Card ' + (i + 1) + '">' + ICON.star.replace('<svg', '<svg class="back" fill="#fff"') + '</button>').join('');
  roundHud(pp);
}
function flipCard(i) {
  if (!alive(pp) || pp.locked) return;
  const el = $('pairsGrid').children[i];
  if (el.classList.contains('up') || el.classList.contains('gone')) return;
  el.classList.add('up'); el.innerHTML = picSvg(pp.cards[i]); el.classList.add('pop-in');
  beep(520, 0.05);
  pp.up.push(i);
  if (pp.up.length < 2) return;
  const [a, b] = pp.up, A = $('pairsGrid').children[a], Bc = $('pairsGrid').children[b];
  pp.up = []; pp.total++;
  if (pp.cards[a] === pp.cards[b]) {
    pp.correct++; pp.streak++; pp.found++;
    pp.score += 10 * pp.tier;
    floatText($('pairsWrap'), '+' + 10 * pp.tier);
    beep(760, 0.1);
    later(pp, 300, () => { A.classList.add('gone'); Bc.classList.add('gone'); });
    if (pp.found === pp.cards.length / 2) {
      pp.boards++;
      pp.score += 30 * pp.tier;
      later(pp, 400, () => floatText($('pairsWrap'), '+' + 30 * pp.tier + ' bonus'));
      if (pp.tier < MAX_LEVEL) { pp.tier++; later(pp, 400, () => floatText($('pairsWrap'), 'Level up!', 'lvl')); }
      pp.top = Math.max(pp.top, pp.tier);
      beep(990, 0.18);
      pp.locked = true;
      later(pp, 900, newPairsBoard);
    }
  } else {
    pp.streak = 0;
    pp.locked = true;
    later(pp, pairPeek(pp.tier), () => {
      [A, Bc].forEach(c => { c.classList.remove('up', 'pop-in'); c.innerHTML = ICON.star.replace('<svg', '<svg class="back" fill="#fff"'); });
      pp.locked = false;
    });
  }
  roundHud(pp);
}
registerGame({
  id: 'pairs', name: 'Picture Pairs', skill: 'Memory', colors: ['#E08CFF', '#8E24AA'],
  hint: 'Flip two cards at a time and find all the matching pairs. 60 seconds.',
  art: '<g transform="rotate(-10 40 60)"><rect x="14" y="26" width="46" height="58" rx="10" fill="#fff"/><circle cx="37" cy="55" r="13" fill="#FF4D6D"/></g>' +
    '<g transform="rotate(10 82 60)"><rect x="60" y="26" width="46" height="58" rx="10" fill="#fff"/><circle cx="83" cy="55" r="13" fill="#FF4D6D"/></g>' +
    '<rect x="38" y="80" width="40" height="30" rx="8" fill="#fff" fill-opacity=".4"/>',
  html: '<div class="hunt-wrap" id="pairsWrap"><div class="pic-grid tight" id="pairsGrid"></div></div>',
  start(my) {
    pp = makeRound('pairs', MAX_LEVEL);
    pp.boards = 0;
    show('pairs');
    newPairsBoard();
    startClock(pp, st => [['Pairs', st.correct], ['Boards', st.boards], ['Accuracy', accuracy(st.correct, st.total)]]);
  }
});
$('pairsGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) flipCard(Number(b.dataset.i)); });
