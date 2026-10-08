/* Word Match
   Wrong options are taken from other answers on the same level, so every pair on a level
   must have a clearly different meaning. Otherwise a question can have two right answers. */
const BANK = [
  'happy:glad big:large small:tiny fast:quick begin:start end:finish angry:mad smart:clever quiet:silent rich:wealthy hard:difficult easy:simple sad:unhappy shout:yell gift:present ' +
  'close:shut jump:leap scared:afraid sick:ill talk:speak cold:chilly wet:damp pretty:lovely dirty:filthy home:house pick:choose fix:repair below:under middle:center rock:stone ' +
  'road:street sleepy:drowsy sofa:couch kid:child hurry:rush bucket:pail story:tale correct:right shiny:gleaming rip:tear grin:smile throw:toss loud:noisy kind:caring',
  'brave:courageous ancient:old assist:help purchase:buy error:mistake rapid:swift fragile:delicate vacant:empty weary:tired humorous:funny peril:danger conceal:hide eager:keen feeble:weak vast:huge ' +
  'reply:answer depart:leave obtain:get inquire:ask construct:build permit:allow accurate:exact brief:short odd:strange foe:enemy journey:trip gather:collect aroma:scent glance:peek sturdy:strong ' +
  'recall:remember reveal:show annual:yearly grumpy:cranky timid:shy tidy:neat decline:refuse imitate:copy rude:impolite fortunate:lucky sorrow:grief tremble:shake famous:well-known boast:brag halt:stop',
  'candid:frank frugal:thrifty lucid:clear obstinate:stubborn scarce:rare abundant:plentiful hostile:unfriendly lethargic:sluggish meticulous:thorough novice:beginner prudent:wise tranquil:calm diligent:hardworking elated:overjoyed futile:pointless ' +
  'apprehensive:uneasy benevolent:kind concise:brief durable:long-lasting imminent:approaching vivid:colorful reluctant:unwilling replenish:refill commence:begin hinder:obstruct inept:clumsy ponder:consider rigid:stiff dwindle:shrink feasible:possible ' +
  'genuine:authentic integrity:honesty mundane:ordinary eloquent:well-spoken vigilant:watchful deceive:trick coerce:force lament:mourn opulent:luxurious brittle:breakable famished:starving ascend:climb hazardous:risky banish:expel',
  'ephemeral:fleeting laconic:terse ubiquitous:everywhere garrulous:talkative mendacious:dishonest pernicious:harmful intrepid:fearless capricious:fickle ostentatious:showy fastidious:fussy sagacious:shrewd magnanimous:generous truculent:aggressive perfunctory:cursory obsequious:fawning ' +
  'recalcitrant:unruly ameliorate:improve enervate:weaken equanimity:composure esoteric:obscure insipid:bland obfuscate:confuse parsimonious:stingy sanguine:optimistic lugubrious:mournful indolent:lazy cogent:convincing exacerbate:worsen fortuitous:lucky impecunious:poor ' +
  'pusillanimous:cowardly zealous:passionate venerate:revere ebullient:exuberant alacrity:eagerness cacophony:din diatribe:tirade frivolous:silly mollify:soothe nascent:emerging surreptitious:secret tenacious:persistent vindicate:justify querulous:whiny ineffable:indescribable'
].map(t => t.split(' ').map(p => p.split(':')));
let w = null;
function startWords(my) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, store.skill.words - 1));
  w = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, recent: [], answer: '', locked: false, t0: performance.now() };
  show('words');
  nextWord();
  requestAnimationFrame(wTick);
}
function wHud() { $('wScore').textContent = w.score; $('wLevel').textContent = w.tier; streakChip('wStreak', w.streak); }
// Past level 4: the hardest words, more options to choose from, and an answer clock.
function nextWord() {
  const set = BANK[Math.min(w.tier, BANK.length) - 1], depth = past(w.tier, BANK.length), count = depth >= 4 ? 6 : depth ? 5 : 4;
  let p;
  do { p = set[r(0, set.length - 1)]; } while (w.recent.includes(p[0]));
  w.recent = w.recent.concat(p[0]).slice(-10); // skip the last 10 words shown, across all levels
  w.answer = p[1]; w.locked = false;
  const opts = [p[1]];
  while (opts.length < count) { const c = set[r(0, set.length - 1)][1]; if (!opts.includes(c)) opts.push(c); }
  for (let i = opts.length - 1; i > 0; i--) { const j = r(0, i); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  $('wWord').textContent = p[0];
  $('wBoard').className = 'board';
  $('opts').innerHTML = opts.map(o => '<button class="opt" data-o="' + o + '">' + o + '</button>').join('');
  if (depth) answerClock(w, 'wBoard', clockMs(depth, 5, 0.15, 1.8), () => choose(null)); else stopAnswerClock(w, 'wBoard');
  wHud();
}
// btn is null when the answer clock runs out
function choose(btn) {
  if (screen !== 'words' || !w || w.my !== run || w.locked) return;
  w.locked = true; w.total++;
  stopAnswerClock(w, 'wBoard');
  const correct = !!btn && btn.dataset.o === w.answer;
  if (correct) {
    w.correct++; w.streak++; w.row++;
    w.score += 10 * w.tier;
    floatText($('wBoard'), '+' + 10 * w.tier);
    if (w.row >= 3 && w.tier < MAX_LEVEL) { w.tier++; w.row = 0; beep(990, 0.18); floatText($('wBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    w.top = Math.max(w.top, w.tier);
    btn.classList.add('ok');
    $('wBoard').className = 'board ok';
  } else {
    w.streak = 0; w.row = 0;
    if (w.tier > 1) w.tier--;
    if (btn) btn.classList.add('no');
    const right = [...$('opts').children].find(b => b.dataset.o === w.answer);
    if (right) right.classList.add('ok');
    $('wBoard').className = 'board no';
    beep(180, 0.25);
  }
  wHud();
  const my = w.my;
  setTimeout(() => { if (my === run) nextWord(); }, correct ? 250 : 900);
}
function wTick() {
  if (!w || w.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - w.t0) / 1000);
  timer('wBar', 'wTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(w.score, "Time's up", [['Correct', w.correct], ['Accuracy', (w.total ? Math.round(100 * w.correct / w.total) : 0) + '%'], ['Top level', w.top]], w.tier, w.top);
  }
  requestAnimationFrame(wTick);
}
STARTERS.words = startWords;
