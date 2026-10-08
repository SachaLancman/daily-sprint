/* Color Clash: is the color word written in its own color? Each level adds one more color. */
const INKS = [['Red', '#E5484D'], ['Blue', '#3B6FF5'], ['Green', '#18A058'], ['Yellow', '#E0A100'], ['Purple', '#8B5CF6'], ['Orange', '#F2711C']];
let cc = null;
function startColors(my) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, store.skill.colors - 1));
  cc = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, match: false, last: '', locked: false, t0: performance.now() };
  show('colors');
  nextColor();
  requestAnimationFrame(cTick);
}
function cHud() { $('cScore').textContent = cc.score; $('cLevel').textContent = cc.tier; streakChip('cStreak', cc.streak); }
// Past level 4: all 6 colors, a stronger tint, an answer clock, and from level 9 the question sometimes flips.
function nextColor() {
  const depth = past(cc.tier, 4), set = INKS.slice(0, Math.min(6, 2 + cc.tier));
  let word;
  do { word = set[r(0, set.length - 1)]; } while (word[0] === cc.last);
  cc.last = word[0];
  cc.match = Math.random() < 0.5;
  let ink = word;
  if (!cc.match) do { ink = set[r(0, set.length - 1)]; } while (ink === word);
  $('cWord').textContent = word[0];
  $('cWord').style.color = ink[1];
  // From level 3 the card is tinted with yet another color, to make it harder.
  $('cBoard').style.background = cc.tier >= 3 ? 'color-mix(in srgb, ' + set[r(0, set.length - 1)][1] + ' ' + Math.min(30, 14 + 2 * depth) + '%, var(--surface))' : '';
  $('cBoard').className = 'board';
  cc.reverse = depth >= 5 && Math.random() < 0.3;
  $('cAsk').textContent = cc.reverse ? 'Does the word NOT match its ink color?' : 'Does the word match its ink color?';
  $('cAsk').classList.toggle('flip', cc.reverse);
  cc.locked = false;
  if (depth) answerClock(cc, 'cBoard', clockMs(depth, 2.4, 0.06, 0.9), () => colorAnswer(null)); else stopAnswerClock(cc, 'cBoard');
  cHud();
}
// yes: true/false from the buttons, null when the answer clock runs out
function colorAnswer(yes) {
  if (screen !== 'colors' || !cc || cc.my !== run || cc.locked) return;
  cc.locked = true; cc.total++;
  stopAnswerClock(cc, 'cBoard');
  const correct = yes !== null && yes === (cc.reverse ? !cc.match : cc.match);
  if (correct) {
    cc.correct++; cc.streak++; cc.row++;
    cc.score += 10 * cc.tier;
    floatText($('cBoard'), '+' + 10 * cc.tier);
    if (cc.row >= 4 && cc.tier < MAX_LEVEL) { cc.tier++; cc.row = 0; beep(990, 0.18); floatText($('cBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    cc.top = Math.max(cc.top, cc.tier);
    $('cBoard').className = 'board ok';
  } else {
    cc.streak = 0; cc.row = 0;
    if (cc.tier > 1) cc.tier--;
    $('cBoard').className = 'board no';
    beep(180, 0.25);
  }
  cHud();
  const my = cc.my;
  setTimeout(() => { if (my === run) nextColor(); }, correct ? 180 : 600);
}
function cTick() {
  if (!cc || cc.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - cc.t0) / 1000);
  timer('cBar', 'cTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(cc.score, "Time's up", [['Correct', cc.correct], ['Accuracy', accuracy(cc.correct, cc.total)], ['Top level', cc.top]], cc.tier, cc.top);
  }
  requestAnimationFrame(cTick);
}
STARTERS.colors = startColors;
