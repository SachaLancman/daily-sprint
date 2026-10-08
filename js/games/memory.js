/* Memory Grid */
let m = null;
const NOTES = [392, 440, 494, 523, 587, 659, 698, 784];
function startMemory(my) {
  m = { my, len: Math.max(3, store.skill.memory + 1), lives: 3, score: 0, top: 0, rounds: 0, seq: [], pos: 0, accepting: false, n: 0 };
  show('memory');
  newRound();
}
function memHud() {
  $('mScore').textContent = m.score; $('mLen').textContent = m.len;
  $('mLives').innerHTML = [0, 1, 2].map(i => ICON.heart.replace('<svg', '<svg class="' + (i < m.lives ? '' : 'off') + '"')).join('');
  $('mLives').setAttribute('aria-label', m.lives + ' lives');
}
function memStatus(text, go) { $('mStatus').textContent = text; $('mStatus').classList.toggle('go', !!go); }
function tileEl(i) { return $('tiles').children[i]; }
async function newRound() {
  const my = m.my, n = m.len >= 6 ? 4 : 3;
  if (n !== m.n) {
    m.n = n;
    $('tiles').style.setProperty('--n', n);
    $('tiles').innerHTML = Array.from({ length: n * n }, (_, i) => '<button class="tile" data-i="' + i + '" aria-label="Tile ' + (i + 1) + '"></button>').join('');
  }
  [...$('tiles').children].forEach(t => { t.className = 'tile'; });
  m.seq = []; m.pos = 0; m.accepting = false;
  while (m.seq.length < m.len) { const c = r(0, n * n - 1); if (c !== m.seq[m.seq.length - 1]) m.seq.push(c); }
  memHud();
  memStatus('Watch');
  await sleep(600);
  for (const c of m.seq) {
    if (my !== run) return;
    tileEl(c).classList.add('lit'); beep(NOTES[c % NOTES.length], 0.2);
    await sleep(450);
    if (my !== run) return;
    tileEl(c).classList.remove('lit');
    await sleep(180);
  }
  if (my !== run) return;
  m.accepting = true;
  memStatus('Your turn', true);
}
function tap(i) {
  if (screen !== 'memory' || !m || m.my !== run || !m.accepting) return;
  const my = m.my, t = tileEl(i);
  if (i === m.seq[m.pos]) {
    m.pos++;
    t.classList.add('ok'); beep(NOTES[i % NOTES.length], 0.15);
    setTimeout(() => t.classList.remove('ok'), 200);
    if (m.pos === m.len) {
      m.accepting = false; m.rounds++;
      m.score += 10 * m.len; m.top = Math.max(m.top, m.len);
      floatText($('mStatusWrap'), '+' + 10 * m.len);
      m.len++;
      memStatus('Correct!');
      memHud();
      setTimeout(() => { if (my === run) newRound(); }, 700);
    }
  } else {
    m.accepting = false; m.lives--;
    t.classList.add('no'); tileEl(m.seq[m.pos]).classList.add('lit'); beep(180, 0.3);
    memStatus(m.lives ? 'Missed. Try again' : 'Out of lives');
    memHud();
    setTimeout(() => {
      if (my !== run) return;
      if (m.lives) newRound();
      else finishGame(m.score, 'Game over', [['Rounds', m.rounds], ['Longest', m.top || 0], ['Level', Math.max(1, m.top - 2)]], Math.max(1, m.top - 2));
    }, 900);
  }
}
STARTERS.memory = startMemory;
