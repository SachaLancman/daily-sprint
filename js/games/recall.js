/* Number Recall (Memory): a number flashes, then type it back.
   Each correct answer makes the next number one digit longer; a miss makes it one shorter (never below 3). */
let nr = null;
function nextRecall() {
  let num = String(r(1, 9));
  while (num.length < nr.len) num += r(0, 9);
  nr.num = num; nr.input = ''; nr.locked = true;
  nr.tier = nr.len; nr.top = Math.max(nr.top, nr.tier); // the "level" here is the number of digits
  roundHud(nr);
  $('recallShow').textContent = num;
  $('recallShow').classList.remove('hide');
  $('recallMsg').textContent = 'Remember this number';
  $('recallIn').textContent = '';
  setBoard('recallBoard', null);
  later(nr, 500 + 450 * nr.len, () => {
    $('recallShow').classList.add('hide');
    $('recallMsg').textContent = 'Type it in';
    nr.locked = false;
  });
}
function recallPress(k) {
  if (!alive(nr) || nr.locked) return;
  if (k === 'back') nr.input = nr.input.slice(0, -1);
  else if (k === 'enter') { if (nr.input) recallCheck(); return; }
  else if (nr.input.length < nr.len) nr.input += k;
  $('recallIn').textContent = nr.input;
  if (nr.input.length === nr.len) recallCheck();
}
function recallCheck() {
  nr.locked = true;
  const ok = nr.input === nr.num;
  $('recallShow').classList.remove('hide');
  if (ok) { right(nr, $('recallBoard'), 5 * nr.len); setBoard('recallBoard', 'ok'); nr.len = Math.min(12, nr.len + 1); }
  else { wrong(nr, false); setBoard('recallBoard', 'no'); $('recallMsg').textContent = 'It was'; nr.len = Math.max(3, nr.len - 1); }
  later(nr, ok ? 500 : 1500, nextRecall);
}
registerGame({
  id: 'recall', name: 'Number Recall', skill: 'Memory', colors: ['#D77FB3', '#6A1B4D'],
  hint: 'A number flashes for a moment. Type it back from memory. It grows one digit at a time.',
  art: '<g transform="rotate(-6 60 50)"><rect x="10" y="30" width="100" height="44" rx="14" fill="#fff"/><text x="60" y="61" text-anchor="middle" font-family="DM Mono, monospace" font-weight="500" font-size="24" fill="currentColor">4 8 2 7</text></g>' +
    '<path d="M24 92h14M46 92h14M68 92h14M90 92h10" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-opacity=".6"/>',
  chips: '<span class="chip" id="recallStreak"></span>',
  html: '<div class="board" id="recallBoard"><span class="prompt" id="recallMsg">Remember this number</span><div class="q recall-num" id="recallShow"></div><div class="a" id="recallIn"></div></div>' +
    '<div class="pad" id="recallPad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => '<button data-k="' + n + '">' + n + '</button>').join('') +
    '<button data-k="back" aria-label="Delete">&#9003;</button><button data-k="0">0</button><button data-k="enter" class="go">Enter</button></div>',
  start(my) {
    nr = makeRound('recall', 30, 99);
    nr.len = Math.max(3, Math.min(8, store.skill.recall - 1)); // start a little below your last length
    nr.top = nr.len;
    show('recall');
    $('recallLevel').previousSibling.textContent = 'Digits ';
    nextRecall();
    startClock(nr, st => [['Correct', st.correct], ['Longest', st.top + ' digits'], ['Accuracy', accuracy(st.correct, st.total)]]);
  },
  key(e) {
    if (e.key >= '0' && e.key <= '9') recallPress(e.key);
    else if (e.key === 'Backspace') recallPress('back');
    else if (e.key === 'Enter') { e.preventDefault(); recallPress('enter'); }
  }
});
$('recallPad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) recallPress(b.dataset.k); });
