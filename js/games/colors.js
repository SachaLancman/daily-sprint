/* Color Clash: is the color word written in its own color? Each level adds one more color. */
const INKS = [['Red', '#E5484D'], ['Blue', '#3B6FF5'], ['Green', '#18A058'], ['Yellow', '#E0A100'], ['Purple', '#8B5CF6'], ['Orange', '#F2711C']];
let cc = null;
function startColors(my) {
  const lv = Math.min(4, Math.max(1, store.skill.colors - 1));
  cc = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, match: false, last: '', locked: false, t0: performance.now() };
  show('colors');
  nextColor();
  requestAnimationFrame(cTick);
}
function cHud() { $('cScore').textContent = cc.score; $('cLevel').textContent = cc.tier; streakChip('cStreak', cc.streak); }
function nextColor() {
  const set = INKS.slice(0, 2 + cc.tier);
  let word;
  do { word = set[r(0, set.length - 1)]; } while (word[0] === cc.last);
  cc.last = word[0];
  cc.match = Math.random() < 0.5;
  let ink = word;
  if (!cc.match) do { ink = set[r(0, set.length - 1)]; } while (ink === word);
  $('cWord').textContent = word[0];
  $('cWord').style.color = ink[1];
  // From level 3 the card is tinted with yet another color, to make it harder.
  $('cBoard').style.background = cc.tier >= 3 ? 'color-mix(in srgb, ' + set[r(0, set.length - 1)][1] + ' 14%, var(--surface))' : '';
  $('cBoard').className = 'board';
  cc.locked = false;
  cHud();
}
function colorAnswer(yes) {
  if (screen !== 'colors' || !cc || cc.my !== run || cc.locked) return;
  cc.locked = true; cc.total++;
  const correct = yes === cc.match;
  if (correct) {
    cc.correct++; cc.streak++; cc.row++;
    cc.score += 10 * cc.tier;
    floatText($('cBoard'), '+' + 10 * cc.tier);
    if (cc.row >= 4 && cc.tier < 4) { cc.tier++; cc.row = 0; beep(990, 0.18); floatText($('cBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
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
    return finishGame(cc.score, "Time's up", [['Correct', cc.correct], ['Accuracy', accuracy(cc.correct, cc.total)], ['Top level', cc.top]], cc.tier);
  }
  requestAnimationFrame(cTick);
}
STARTERS.colors = startColors;
