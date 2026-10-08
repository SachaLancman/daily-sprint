/* Math Sprint */
const add = (lo, hi) => () => { const a = r(lo, hi), b = r(lo, hi); return [a + ' + ' + b, a + b]; };
const sub = (lo, hi) => () => { let a = r(lo, hi), b = r(lo, hi); if (b > a) [a, b] = [b, a]; return [a + ' − ' + b, a - b]; };
const mul = (al, ah, bl, bh) => () => { const a = r(al, ah), b = r(bl, bh); return [a + ' × ' + b, a * b]; };
const div = (dl, dh, ql, qh) => () => { const d = r(dl, dh), q = r(ql, qh); return [d * q + ' ÷ ' + d, q]; };
const LEVELS = [
  [add(1, 9), sub(1, 9)],
  [add(5, 20), sub(5, 20)],
  [add(10, 50), sub(10, 50), mul(2, 5, 2, 9)],
  [mul(3, 9, 3, 9), add(20, 99), sub(20, 99)],
  [div(2, 9, 2, 12), mul(6, 12, 3, 12)],
  [add(50, 199), sub(50, 199), mul(11, 25, 3, 9), div(3, 12, 5, 15)],
  [add(100, 999), sub(100, 999), mul(12, 49, 4, 9)],
  [mul(11, 19, 11, 19), div(6, 15, 11, 25), sub(200, 999)]
];
let s = null;

function startMath(my) {
  const lv = Math.max(1, store.skill.math - 1);
  s = { my, score: 0, level: lv, top: lv, streak: 0, row: 0, correct: 0, total: 0, text: '', answer: 0, input: '', locked: false, t0: performance.now() };
  show('math');
  nextQuestion();
  requestAnimationFrame(tick);
}
function nextQuestion() {
  const set = LEVELS[s.level - 1];
  let q;
  do { q = set[r(0, set.length - 1)](); } while (q[0] === s.text);
  s.text = q[0]; s.answer = q[1]; s.input = ''; s.locked = false;
  $('board').className = 'board';
  $('q').textContent = s.text; $('a').textContent = '';
  mathHud();
}
function mathHud() {
  $('score').textContent = s.score; $('level').textContent = s.level; streakChip('streak', s.streak);
}
function settle(correct) {
  s.locked = true; s.total++;
  if (correct) {
    s.correct++; s.streak++; s.row++;
    s.score += 10 * s.level;
    floatText($('board'), '+' + 10 * s.level);
    if (s.row >= 3 && s.level < LEVELS.length) { s.level++; s.row = 0; beep(990, 0.18); floatText($('board'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    s.top = Math.max(s.top, s.level);
    $('board').className = 'board ok';
  } else {
    s.streak = 0; s.row = 0;
    if (s.level > 1) s.level--;
    $('a').textContent = s.answer;
    $('board').className = 'board no';
    beep(180, 0.25);
  }
  mathHud();
  const my = s.my;
  setTimeout(() => { if (my === run) nextQuestion(); }, correct ? 140 : 650);
}
function press(k) {
  if (screen !== 'math' || !s || s.my !== run || s.locked) return;
  if (k === 'back') s.input = s.input.slice(0, -1);
  else if (k === 'enter') { if (s.input !== '') settle(Number(s.input) === s.answer); return; }
  else if (s.input.length < 6) s.input += k;
  $('a').textContent = s.input;
  if (s.input !== '' && Number(s.input) === s.answer) settle(true);
}
function tick() {
  if (!s || s.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - s.t0) / 1000);
  timer('barFill', 'time', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(s.score, "Time's up", [['Correct', s.correct], ['Accuracy', (s.total ? Math.round(100 * s.correct / s.total) : 0) + '%'], ['Top level', s.top]], s.level);
  }
  requestAnimationFrame(tick);
}
STARTERS.math = startMath;
