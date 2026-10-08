/* Next in Line: number sequences. Each maker returns [the numbers shown, the next number]. */
const seqArith = (a, d, n = 4) => [Array.from({ length: n }, (_, i) => a + i * d), a + n * d];
const seqGeo = (a, k) => [[a, a * k, a * k * k, a * k ** 3], a * k ** 4];
const seqAlt = (a, x, y) => { const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? x : -y)); return [s.slice(0, 5), s[5]]; };
const seqGrow = (a, d) => { const s = [a]; for (let i = 0; i < 4; i++) s.push(s[i] + d + i); return [s.slice(0, 4), s[4]]; };
const seqSquares = k => [[k * k, (k + 1) ** 2, (k + 2) ** 2, (k + 3) ** 2], (k + 4) ** 2];
const seqFib = (a, b) => { const s = [a, b]; for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); return [s.slice(0, 5), s[5]]; };
const seqTwin = (a, d, b, e) => [[a, b, a + d, b + e, a + 2 * d, b + 2 * e], a + 3 * d];
const seqDouble = (a, c) => { const s = [a]; for (let i = 0; i < 4; i++) s.push(s[i] * 2 + c); return [s.slice(0, 4), s[4]]; };
const PATTERNS = [
  [() => seqArith(r(1, 20), r(2, 6)), () => { const d = r(2, 5); return seqArith(r(5 * d, 60), -d); }],
  [() => seqArith(r(3, 40), r(7, 15)), () => seqGeo(r(1, 5), 2), () => seqAlt(r(1, 10), r(4, 8), r(1, 3))],
  [() => seqGeo(r(1, 3), 3), () => seqGrow(r(1, 15), r(1, 4)), () => seqSquares(r(1, 6)), () => { const d = r(6, 12); return seqArith(r(6 * d, 120), -d); }],
  [() => seqFib(r(1, 5), r(2, 7)), () => seqTwin(r(1, 9), r(2, 5), r(20, 40), r(-3, -1)), () => seqDouble(r(1, 4), r(1, 3)), () => seqAlt(r(20, 40), r(5, 9), r(2, 4))]
];
// Past level 4: harder kinds of sequence, with numbers that grow with depth `b`.
const seqAccel = (a, d) => { const s = [a]; for (let i = 0; i < 4; i++) s.push(s[i] + d + 2 * i); return [s.slice(0, 4), s[4]]; };
const seqTimesPlus = (a, k) => { const s = [a]; for (let i = 1; i < 6; i++) s.push(i % 2 ? s[i - 1] * 2 : s[i - 1] + k); return [s.slice(0, 5), s[5]]; };
const seqSquarePlus = (k, c) => [[k * k + c, (k + 1) ** 2 + c, (k + 2) ** 2 + c, (k + 3) ** 2 + c], (k + 4) ** 2 + c];
const expertPatterns = b => [
  () => seqFib(r(2, 5 + b), r(3, 9 + b)),
  () => seqDouble(r(2, 4 + Math.floor(b / 2)), r(1, 3 + Math.floor(b / 2))),
  () => seqTwin(r(1, 9 + b), r(2, 5 + Math.floor(b / 2)), r(30, 60 + 2 * b), -r(1, 3 + Math.floor(b / 3))),
  () => seqAccel(r(1, 10 + b), r(2, 4 + Math.floor(b / 2))),
  () => seqTimesPlus(r(1, 3 + Math.floor(b / 3)), r(1, 4 + Math.floor(b / 2))),
  () => seqSquarePlus(r(2, 6 + Math.floor(b / 2)), r(-3, 5 + b)),
  () => seqAlt(r(20, 40 + 2 * b), r(5, 9 + b), r(2, 4 + Math.floor(b / 2)))
];
let pt = null;
function startPattern(my) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, store.skill.pattern - 1));
  pt = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, ans: 0, text: '', locked: false, t0: performance.now() };
  show('pattern');
  nextPattern();
  requestAnimationFrame(pTick);
}
function pHud() { $('pScore').textContent = pt.score; $('pLevel').textContent = pt.tier; streakChip('pStreak', pt.streak); }
function nextPattern() {
  const depth = past(pt.tier, PATTERNS.length), set = depth ? expertPatterns(depth) : PATTERNS[pt.tier - 1];
  let seq, ans, text;
  do { [seq, ans] = set[r(0, set.length - 1)](); text = seq.join(', ') + ', ?'; } while (text === pt.text || ans < 0);
  pt.text = text; pt.ans = ans; pt.locked = false;
  // Wrong options are believable: off by one, off by the last step, or "just repeat the last step".
  const last = seq[seq.length - 1], step = last - seq[seq.length - 2];
  const opts = [ans];
  for (const c of shuffle([ans + 1, ans - 1, ans + step, ans - step, last + step, ans + 2, ans - 2, ans * 2, ans + 10])) {
    if (opts.length < 4 && c >= 0 && !opts.includes(c)) opts.push(c);
  }
  $('pSeq').textContent = text;
  $('pBoard').className = 'board';
  $('pOpts').innerHTML = shuffle(opts).map(o => '<button class="opt num" data-o="' + o + '">' + o + '</button>').join('');
  if (depth) answerClock(pt, 'pBoard', clockMs(depth, 9, 0.2, 3.5), () => patternChoose(null)); else stopAnswerClock(pt, 'pBoard');
  pHud();
}
// btn is null when the answer clock runs out
function patternChoose(btn) {
  if (screen !== 'pattern' || !pt || pt.my !== run || pt.locked) return;
  pt.locked = true; pt.total++;
  stopAnswerClock(pt, 'pBoard');
  const correct = !!btn && Number(btn.dataset.o) === pt.ans;
  if (correct) {
    pt.correct++; pt.streak++; pt.row++;
    pt.score += 10 * pt.tier;
    floatText($('pBoard'), '+' + 10 * pt.tier);
    if (pt.row >= 3 && pt.tier < MAX_LEVEL) { pt.tier++; pt.row = 0; beep(990, 0.18); floatText($('pBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    pt.top = Math.max(pt.top, pt.tier);
    btn.classList.add('ok');
    $('pBoard').className = 'board ok';
  } else {
    pt.streak = 0; pt.row = 0;
    if (pt.tier > 1) pt.tier--;
    if (btn) btn.classList.add('no');
    const right = [...$('pOpts').children].find(b => Number(b.dataset.o) === pt.ans);
    if (right) right.classList.add('ok');
    $('pBoard').className = 'board no';
    beep(180, 0.25);
  }
  pHud();
  const my = pt.my;
  setTimeout(() => { if (my === run) nextPattern(); }, correct ? 300 : 1100);
}
function pTick() {
  if (!pt || pt.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - pt.t0) / 1000);
  timer('pBar', 'pTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(pt.score, "Time's up", [['Correct', pt.correct], ['Accuracy', accuracy(pt.correct, pt.total)], ['Top level', pt.top]], pt.tier, pt.top);
  }
  requestAnimationFrame(pTick);
}
STARTERS.pattern = startPattern;
