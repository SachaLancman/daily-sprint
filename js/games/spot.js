/* Spot the Error
   Each sentence has exactly one wrong word, written as [wrong|right]. Keep every other word correct,
   and don't put spaces inside the brackets (the sentence is split on spaces). */
const SENTENCES = [
  [
    'I [recieved|received] a letter from my aunt.', 'We [was|were] late for the bus this morning.', "She [dont|doesn't] like cold coffee.",
    'The children [is|are] playing in the garden.', 'He [goed|went] to the shop after lunch.', 'My brother is [tallest|taller] than me.',
    'They [has|have] two cats and a dog.', 'I will see you [tommorow|tomorrow] at noon.', 'The [libary|library] closes at six on Fridays.',
    'She [runned|ran] all the way home.', 'We need to buy some [bred|bread] and milk.', 'He [writed|wrote] a long email to his boss.',
    'Please [wright|write] your name at the top.', 'I [seen|saw] a fox in the park yesterday.', 'There are three [peoples|people] waiting outside.',
    'My [freind|friend] lives next door.', 'It was a [realy|really] good film.', 'We [goes|go] swimming every Sunday.',
    'The [wheather|weather] was sunny all week.', 'He [catched|caught] the ball with one hand.', 'I am [hungrey|hungry] after the long walk.',
    'Our teacher [give|gave] us homework yesterday.', 'The shop [sell|sells] fresh fruit every day.', 'I [beleive|believe] you are right.'
  ],
  [
    "The dog wagged [it's|its] tail happily.", '[Their|There] is a new bakery on the corner.', "I think [your|you're] going to love this book.",
    'She ate [to|too] much cake at the party.', 'We parked [are|our] car near the station.', 'I always [loose|lose] my keys.',
    'The rain will not [effect|affect] our plans.', 'He is taller [then|than] his father.', "[Who's|Whose] jacket is this on the chair?",
    'Please [except|accept] my apology.', 'I could [of|have] helped if you had asked.', 'They left [there|their] bags at the door.',
    "I think [its|it's] going to rain.", 'We walked [passed|past] the old church.', 'The [principle|principal] of the school gave a speech.',
    'Can I [borrow|lend] you my pen?', 'She gave the book to Sam and [I|me].', "[Your|You're] welcome to stay for dinner.",
    'Each of the students [have|has] a locker.', 'The team played [good|well] last night.', 'I need some [advise|advice] about my new job.',
    'He [lead|led] the group up the mountain yesterday.', 'The milk smells [badly|bad] today.', 'We [where|were] at home all evening.'
  ],
  [
    'There were [less|fewer] people at the match than last year.', '[Whom|Who] do you think will win the race?', 'I need to [lay|lie] down for a few minutes.',
    'Neither of the answers [are|is] correct.', 'The new manager hopes to [affect|effect] real change.', 'Between you and [I|me], the plan will not work.',
    'She [complemented|complimented] him on his cooking.', 'The medicine had no [affect|effect] on my cold.', 'He was [laying|lying] on the beach all afternoon.',
    'The [stationary|stationery] cupboard is full of pens.', 'My brother and [myself|I] will join you later.', "Let's [breath|breathe] deeply and relax.",
    'The council approved the plan [irregardless|regardless] of the protests.', 'Please be [discrete|discreet] about the surprise party.', 'Every one of the players [were|was] tired.',
    'She [past|passed] the exam with top marks.', 'The hotel was [quiet|quite] expensive.', 'He [rode|rowed] the boat across the lake.',
    'If I [was|were] you, I would call her.', 'The [canon|cannon] fired at dawn.', 'The two colors [compliment|complement] each other well.',
    'She [poured|pored] over the old maps for hours.', 'The old [led|lead] pipes were replaced last year.', 'The news [were|was] shocking.'
  ]
].map(level => level.map(text => text.split(' ').map(tok => {
  const m = tok.match(/^(.*)\[([^|\]]+)\|([^\]]+)\](.*)$/);
  return m ? { text: m[1] + m[2] + m[4], fix: m[1] + m[3] + m[4], wrong: m[2], right: m[3] } : { text: tok };
})));
let sp = null;
function startSpot(my) {
  const lv = Math.min(MAX_LEVEL, Math.max(1, store.skill.spot - 1));
  sp = { my, score: 0, tier: lv, top: lv, row: 0, streak: 0, correct: 0, total: 0, recent: [], words: null, locked: false, t0: performance.now() };
  show('spot');
  nextSentence();
  requestAnimationFrame(sTick);
}
function sHud() { $('sScore').textContent = sp.score; $('sLevel').textContent = sp.tier; streakChip('sStreak', sp.streak); }
// Past level 3: sentences from the two hardest lists and an answer clock.
// From level 6 a quarter of the sentences are already correct: then the right answer is "No mistake".
function nextSentence() {
  const depth = past(sp.tier, SENTENCES.length);
  const set = depth ? SENTENCES[pickOne([1, 2])] : SENTENCES[sp.tier - 1];
  let words;
  do { words = set[r(0, set.length - 1)]; } while (sp.recent.includes(words));
  sp.recent = sp.recent.concat([words]).slice(-10);
  sp.words = words; sp.locked = false;
  sp.clean = depth >= 3 && Math.random() < 0.25;
  $('sBoard').className = 'board';
  $('sSentence').innerHTML = words.map((t, i) => '<button class="word-btn" data-i="' + i + '">' + (sp.clean && t.fix ? t.fix : t.text) + '</button>').join('');
  $('sNone').hidden = depth < 3;
  $('sNone').classList.remove('ok', 'no');
  $('sFix').textContent = '';
  if (depth) answerClock(sp, 'sBoard', clockMs(depth, 7, 0.2, 2.5), () => spotTap(null)); else stopAnswerClock(sp, 'sBoard');
  sHud();
}
// btn: a word button, the "No mistake" button, or null when the answer clock runs out
function spotTap(btn) {
  if (screen !== 'spot' || !sp || sp.my !== run || sp.locked) return;
  sp.locked = true; sp.total++;
  stopAnswerClock(sp, 'sBoard');
  const i = sp.words.findIndex(t => t.fix), err = sp.words[i], errBtn = $('sSentence').children[i];
  const saidNone = !!btn && btn.id === 'sNone';
  const correct = sp.clean ? saidNone : !!btn && !saidNone && Number(btn.dataset.i) === i;
  if (correct) {
    sp.correct++; sp.streak++; sp.row++;
    sp.score += 10 * sp.tier;
    floatText($('sBoard'), '+' + 10 * sp.tier);
    if (sp.row >= 3 && sp.tier < MAX_LEVEL) { sp.tier++; sp.row = 0; beep(990, 0.18); floatText($('sBoard'), 'Level up!', 'lvl'); } else beep(660, 0.08);
    sp.top = Math.max(sp.top, sp.tier);
    $('sBoard').className = 'board ok';
  } else {
    sp.streak = 0; sp.row = 0;
    if (sp.tier > 1) sp.tier--;
    if (btn) btn.classList.add('no');
    $('sBoard').className = 'board no';
    beep(180, 0.25);
  }
  if (sp.clean) { $('sNone').classList.add('ok'); $('sFix').textContent = 'This sentence had no mistake'; }
  else {
    errBtn.classList.add('ok');
    errBtn.innerHTML = '<s>' + err.wrong + '</s>' + err.fix;
    $('sFix').textContent = '“' + err.wrong + '” should be “' + err.right + '”';
  }
  sHud();
  const my = sp.my;
  setTimeout(() => { if (my === run) nextSentence(); }, correct ? 900 : 1800);
}
function sTick() {
  if (!sp || sp.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - sp.t0) / 1000);
  timer('sBar', 'sTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(sp.score, "Time's up", [['Correct', sp.correct], ['Accuracy', (sp.total ? Math.round(100 * sp.correct / sp.total) : 0) + '%'], ['Top level', sp.top]], sp.tier, sp.top);
  }
  requestAnimationFrame(sTick);
}
STARTERS.spot = startSpot;
$('sNone').addEventListener('click', e => spotTap(e.currentTarget));
