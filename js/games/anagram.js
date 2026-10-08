/* Unscramble: levels are 4, 5, 6, 7 and 8-letter words; past level 5, long words against an answer clock.
   Every word was chosen so its letters spell only that one common word (no "listen/silent" pairs). */
const ANAGRAMS = [
  'jump frog milk fish gold duck mask king sock bell kite zero quiz bulk hand desk lazy glow gift film jury navy hawk cozy',
  'plant magic quick candy beach honey pizza tiger chair crown giant globe juice knife laugh novel piano robot sugar voice storm happy jelly puppy',
  'jungle rocket pencil puzzle guitar window frozen bridge carpet dragon hockey mirror ladder pirate bucket jacket wizard yellow summer kitten rabbit island zipper muffin',
  'balloon captain dolphin journey kitchen monster pyramid rainbow blanket compass diamond freedom harvest lantern mustard octopus penguin quarter vampire whistle popcorn cabbage network trumpet',
  'sandwich elephant mountain treasure dinosaur umbrella football kangaroo necklace pancakes backpack airplane birthday hospital mushroom princess squirrel vacation skeleton tomorrow campfire starfish goldfish blizzard'
].map(t => t.split(' '));
let an = null;
function startAnagram(my) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, store.skill.anagram - 1));
  an = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, recent: [], word: '', letters: [], picked: [], locked: false, t0: performance.now() };
  show('anagram');
  nextAnagram();
  requestAnimationFrame(aTick);
}
function aHud() { $('aScore').textContent = an.score; $('aLevel').textContent = an.tier; streakChip('aStreak', an.streak); }
function nextAnagram() {
  const depth = past(an.tier, ANAGRAMS.length);
  const set = depth ? ANAGRAMS[pickOne([3, 4])] : ANAGRAMS[an.tier - 1];
  let word;
  do { word = set[r(0, set.length - 1)]; } while (an.recent.includes(word));
  an.recent = an.recent.concat(word).slice(-10);
  let mix;
  do { mix = shuffle([...word]); } while (mix.join('') === word);
  an.word = word; an.letters = mix; an.picked = []; an.locked = false;
  $('aBoard').className = 'board';
  $('aSlots').style.setProperty('--n', word.length);
  $('aLetters').style.setProperty('--n', word.length);
  renderAnagram();
  if (depth) answerClock(an, 'aBoard', clockMs(depth, 14, 0.4, 6), () => skipAnagram(true)); else stopAnswerClock(an, 'aBoard');
  aHud();
}
function renderAnagram() {
  $('aSlots').innerHTML = [...an.word].map((_, i) => '<span class="slot' + (i < an.picked.length ? ' full' : '') + '">' + (i < an.picked.length ? an.letters[an.picked[i]] : '') + '</span>').join('');
  $('aLetters').innerHTML = an.letters.map((ch, i) => '<button class="letter" data-i="' + i + '"' + (an.picked.includes(i) ? ' disabled' : '') + '>' + ch + '</button>').join('');
}
function pickLetter(i) {
  if (screen !== 'anagram' || !an || an.my !== run || an.locked || an.picked.includes(i)) return;
  an.picked.push(i);
  beep(600, 0.04);
  renderAnagram();
  if (an.picked.length === an.word.length) checkAnagram();
}
function typeLetter(ch) { const i = an.letters.findIndex((c, k) => c === ch && !an.picked.includes(k)); if (i >= 0) pickLetter(i); }
function undoLetter() { if (screen === 'anagram' && an && !an.locked && an.picked.length) { an.picked.pop(); renderAnagram(); } }
function checkAnagram() {
  an.locked = true; an.total++;
  const my = an.my, correct = an.picked.map(i => an.letters[i]).join('') === an.word;
  if (correct) {
    stopAnswerClock(an, 'aBoard');
    an.correct++; an.streak++; an.row++;
    an.score += 10 * an.tier;
    floatText($('aBoard'), '+' + 10 * an.tier);
    if (an.row >= 2 && an.tier < MAX_LEVEL) { an.tier++; an.row = 0; beep(990, 0.18); floatText($('aBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    an.top = Math.max(an.top, an.tier);
    $('aBoard').className = 'board ok';
    setTimeout(() => { if (my === run) nextAnagram(); }, 450);
  } else {
    // A wrong guess just clears the letters so you can try again.
    an.streak = 0; an.row = 0;
    $('aBoard').className = 'board no';
    beep(180, 0.25);
    setTimeout(() => { if (my !== run) return; an.picked = []; an.locked = false; $('aBoard').className = 'board'; renderAnagram(); }, 600);
  }
  aHud();
}
// Skip button, or the answer clock running out (fromClock). The clock may run out during a wrong-guess pause,
// so only the clock may skip while the letters are locked; a correct answer stops the clock first.
function skipAnagram(fromClock) {
  if (screen !== 'anagram' || !an || an.my !== run || (an.locked && !fromClock)) return;
  stopAnswerClock(an, 'aBoard');
  an.locked = true; an.total++; an.streak = 0; an.row = 0;
  if (an.tier > 1) an.tier--;
  // Reveal the answer in the slots
  const used = [];
  an.picked = [...an.word].map(ch => { const i = an.letters.findIndex((c, k) => c === ch && !used.includes(k)); used.push(i); return i; });
  renderAnagram();
  $('aBoard').className = 'board no';
  aHud();
  const my = an.my;
  setTimeout(() => { if (my === run) nextAnagram(); }, 1200);
}
function aTick() {
  if (!an || an.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - an.t0) / 1000);
  timer('aBar', 'aTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(an.score, "Time's up", [['Words', an.correct], ['Accuracy', accuracy(an.correct, an.total)], ['Top level', an.top]], an.tier, an.top);
  }
  requestAnimationFrame(aTick);
}
STARTERS.anagram = startAnagram;
