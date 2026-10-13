/* Automatic tests. Open test.html (it opens index.html?test) and press Run.
   For every game: launch it through the real countdown, check the screen shows, then for each level
   make a question, check it's valid and fits a phone screen, answer it right (score must go up) and wrong
   (streak must reset), and finally let the clock run out. Also checks the daily session, calendar and leaderboard.
   The player's real progress is backed up first and restored at the end (see TEST_BACKUP in core.js). */
(function () {
  const PHONE_WIDTH = 328; // a 360px phone minus the page's side padding
  let errors = [];        // page errors caught while testing
  const wait = ms => new Promise(res => setTimeout(res, ms));
  const kids = id => [...$(id).children];
  const btnWith = (id, attr, value) => kids(id).find(b => b.dataset[attr] === String(value));

  // ---------- Per-game playbooks ----------
  // state(): the game's live state object. gen(L): make a level-L question. check(L): return a problem or null.
  // solve(): answer correctly. miss(): answer wrongly. Games marked `genOnly` are only generated per level
  // (their answers need real waiting) and get one full play-through in `play` instead.
  const findCombo = (nums, k, goal, want) => { // tiles adding (or not adding) up to goal
    const f = (i, pick) => { if (pick.length === k) return (pick.reduce((s, j) => s + nums[j], 0) === goal) === want ? pick : null; if (i >= nums.length) return null; return f(i + 1, pick.concat(i)) || f(i + 1, pick); };
    return f(0, []);
  };
  const T = {
    math: { state: () => s, gen: L => { s.level = L; s.text = ''; nextQuestion(); },
      check: () => !Number.isInteger(s.answer) || s.answer < 0 ? 'bad answer ' + s.answer : String(s.answer).length > 6 ? 'answer too long to type' : null,
      solve: () => { for (const ch of String(s.answer)) press(ch); }, miss: () => { for (const ch of String(s.answer + 1)) press(ch); press('enter'); } },
    memory: { state: () => m, genOnly: true, gen: L => { m.len = L + 2; m.my = run; newRound(); },
      check: () => $('tiles').children.length !== m.n * m.n ? 'grid size wrong' : null,
      play: async () => { while (!m.accepting) await wait(100); m.seq.forEach(i => tap(i)); await wait(50); return m.score > 0 ? null : 'correct sequence not scored'; } },
    words: { state: () => w, gen: L => { w.tier = L; w.locked = false; nextWord(); },
      check: () => !btnWith('opts', 'o', w.answer) ? 'answer not offered' : null,
      solve: () => choose(btnWith('opts', 'o', w.answer)), miss: () => choose(kids('opts').find(b => b.dataset.o !== w.answer)) },
    spot: { state: () => sp, gen: L => { sp.tier = L; sp.locked = false; nextSentence(); },
      check: () => sp.words.filter(t => t.fix).length !== 1 ? 'sentence must have exactly one mistake' : null,
      solve: () => spotTap(sp.clean ? $('sNone') : kids('sSentence')[sp.words.findIndex(t => t.fix)]),
      miss: () => spotTap(kids('sSentence')[sp.words.findIndex(t => !t.fix)]) },
    colors: { state: () => cc, gen: L => { cc.tier = L; cc.locked = false; nextColor(); },
      check: () => null, solve: () => colorAnswer(cc.reverse ? !cc.match : cc.match), miss: () => colorAnswer(cc.reverse ? cc.match : !cc.match) },
    hunt: { state: () => nh, gen: L => { nh.tier = L; nh.grids = 0; newHuntGrid(); },
      check: () => $('hGrid').children.length !== nh.size ? 'grid size wrong' : null,
      solve: () => huntTap(btnWith('hGrid', 'v', nh.next)), miss: () => huntTap(kids('hGrid').find(b => Number(b.dataset.v) !== nh.next && !b.disabled)),
      missCheck: st => st.misses > 0 ? null : 'wrong tap not counted' },
    pattern: { state: () => pt, gen: L => { pt.tier = L; pt.locked = false; pt.text = ''; nextPattern(); },
      check: () => !Number.isInteger(pt.ans) || pt.ans < 0 ? 'bad answer' : !kids('pOpts').some(b => Number(b.dataset.o) === pt.ans) ? 'answer not offered' : null,
      solve: () => patternChoose(kids('pOpts').find(b => Number(b.dataset.o) === pt.ans)), miss: () => patternChoose(kids('pOpts').find(b => Number(b.dataset.o) !== pt.ans)) },
    anagram: { state: () => an, gen: L => { an.tier = L; an.locked = false; nextAnagram(); },
      check: () => an.letters.join('') === an.word ? 'letters not scrambled' : null,
      solve: () => { for (const ch of an.word) typeLetter(ch); }, miss: () => skipAnagram(false) },
    count: { state: () => qc, genOnly: true, gen: L => { qc.tier = L; nextCount(); },
      check: () => $('countField').children.length > 30 ? 'too many pictures' : qc.answer < 1 ? 'nothing to count' : null,
      play: async () => { await wait(countLevel(qc.tier).ms + 150); const b = kids('countOpts').find(x => Number(x.dataset.o) === qc.answer); if (!b) return 'answer not offered'; countChoose(b); return qc.score > 0 ? null : 'correct answer not scored'; } },
    pairs: { state: () => pp, gen: L => { pp.tier = L; newPairsBoard(); },
      check: () => { const c = {}; pp.cards.forEach(x => c[x] = (c[x] || 0) + 1); return Object.values(c).some(v => v !== 2) ? 'cards not in pairs' : null; },
      solve: () => { flipCard(0); flipCard(pp.cards.indexOf(pp.cards[0], 1)); }, miss: () => { flipCard(0); flipCard(pp.cards.findIndex(c => c !== pp.cards[0])); } },
    newpic: { state: () => sn, gen: L => { sn.set = samplePics(2); while (sn.set.length < Math.min(30, L + 2)) newpicAdd(); },
      check: () => new Set(sn.set).size !== sn.set.length || sn.set.some(p => !PICS[p]) ? 'bad picture group' : null,
      solve: () => newpicTap(btnWith('newpicGrid', 'p', sn.fresh)), miss: () => newpicTap(kids('newpicGrid').find(b => b.dataset.p !== sn.fresh)) },
    picspell: { state: () => ps, gen: L => { ps.tier = L; ps.locked = false; nextSpell(); },
      check: () => kids('spellOpts').filter(b => b.dataset.o === ps.word).length !== 1 ? 'correct spelling missing or repeated' : null,
      solve: () => spellChoose(btnWith('spellOpts', 'o', ps.word)), miss: () => spellChoose(kids('spellOpts').find(b => b.dataset.o !== ps.word)) },
    oddone: { state: () => oo, gen: L => { oo.tier = L; oo.locked = false; nextOdd(); },
      check: () => !kids('oddGrid')[oo.odd].querySelector('svg').getAttribute('style') ? 'odd picture is not different' : null,
      solve: () => oddTap(kids('oddGrid')[oo.odd]), miss: () => oddTap(kids('oddGrid')[oo.odd === 0 ? 1 : 0]) },
    flash: { state: () => fm, gen: L => { fm.tier = L; fm.hist = ['apple', 'star', 'fish']; fm.locked = false; nextFlash(); },
      check: () => typeof fm.answer !== 'boolean' ? 'no answer' : null, solve: () => flashAnswer(fm.answer), miss: () => flashAnswer(!fm.answer) },
    balance: { state: () => bl, gen: L => { bl.tier = L; bl.locked = false; nextBalance(); },
      check: () => !Number.isInteger(bl.ans) || bl.ans < 1 ? 'bad answer' : !btnWith('balOpts', 'o', bl.ans) ? 'answer not offered' : null,
      solve: () => balanceChoose(btnWith('balOpts', 'o', bl.ans)), miss: () => balanceChoose(kids('balOpts').find(b => Number(b.dataset.o) !== bl.ans)) },
    target: { state: () => tt, gen: L => { tt.tier = L; nextTarget(); },
      check: () => findCombo(tt.nums, tt.pick, tt.goal, true) ? null : 'no solution',
      solve: () => findCombo(tt.nums, tt.pick, tt.goal, true).forEach(i => targetTap(kids('targetGrid')[i])),
      miss: () => (findCombo(tt.nums, tt.pick, tt.goal, false) || []).forEach(i => targetTap(kids('targetGrid')[i])) },
    greater: { state: () => gt, gen: L => { gt.tier = L; gt.locked = false; nextGreater(); },
      check: () => gt.vals[0] === gt.vals[1] ? 'values are equal' : null,
      solve: () => greaterPick(gt.vals[0] > gt.vals[1] ? 0 : 1), miss: () => greaterPick(gt.vals[0] > gt.vals[1] ? 1 : 0) },
    recall: { state: () => nr, gen: L => { nr.len = Math.min(18, L + 2); nextRecall(); nr.locked = false; },
      check: () => nr.num.length !== nr.len ? 'number length wrong' : null,
      solve: () => { for (const ch of nr.num) recallPress(ch); }, miss: () => { for (let i = 0; i < nr.len; i++) recallPress(nr.num[0] === '1' ? '2' : '1'); } },
    arrows: { state: () => af, gen: L => { af.tier = L; af.locked = false; nextArrows(); },
      check: () => !['left', 'right'].includes(af.answer) ? 'no answer' : null,
      solve: () => arrowPick(af.answer), miss: () => arrowPick(af.answer === 'left' ? 'right' : 'left') },
    seeker: { state: () => sk, gen: L => { sk.tier = L; sk.locked = false; nextSeek(); },
      check: () => sk.cells.filter(c => c.kind === sk.want.kind && c.color === sk.want.color).length !== sk.left ? 'target count mismatch' : null,
      solve: () => kids('seekGrid').forEach((b, i) => { const c = sk.cells[i]; if (c.kind === sk.want.kind && c.color === sk.want.color) seekTap(b); }),
      miss: () => seekTap(kids('seekGrid').find((b, i) => sk.cells[i].kind !== sk.want.kind || sk.cells[i].color !== sk.want.color)) },
    bubbles: { state: () => bp, gen: L => { bp.tier = L; $('bubbleField').innerHTML = ''; },
      check: L => { const b = bubbleLevel(L); return b.every > 0 && b.life > 0 && b.min >= 40 && b.bad < 1 ? null : 'bad bubble settings'; },
      solve: () => { let g; for (let i = 0; i < 40 && !g; i++) { spawnBubble(); g = $('bubbleField').querySelector('.bubble:not(.bad)'); } if (g) popBubble(g); },
      miss: () => { let b; for (let i = 0; i < 40 && !b; i++) { spawnBubble(); b = $('bubbleField').querySelector('.bubble.bad'); } if (b) popBubble(b); } },
    sort: { state: () => sr, gen: L => { sr.tier = L; sr.locked = false; newSortRule(); nextSort(); },
      check: () => !['left', 'right'].includes(sr.answer) ? 'no answer' : null,
      solve: () => sortPick(sr.answer), miss: () => sortPick(sr.answer === 'left' ? 'right' : 'left') },
    matrix: { state: () => mx, gen: L => { mx.tier = L; mx.locked = false; nextMatrix(); },
      check: () => mx.opts.filter(o => sameCell(o, mx.answer)).length !== 1 ? 'answer not unique' : null,
      solve: () => matrixPick(kids('matrixOpts')[mx.opts.findIndex(o => sameCell(o, mx.answer))]),
      miss: () => matrixPick(kids('matrixOpts')[mx.opts.findIndex(o => !sameCell(o, mx.answer))]) },
    path: { state: () => fa, gen: L => { fa.tier = L; fa.locked = false; nextPath(); },
      check: () => {
        const n = pathLevel(fa.tier).n, start = kids('pathGrid').findIndex(b => b.classList.contains('start')), d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        let x = start % n, y = Math.floor(start / n);
        for (const sEl of kids('pathMoves')) { const [dir, twice] = sEl.getAttribute('aria-label').split(' '), k = twice ? 2 : 1; x += d[dir][0] * k; y += d[dir][1] * k; if (x < 0 || y < 0 || x >= n || y >= n) return 'path leaves the grid'; }
        return y * n + x === fa.end ? null : 'answer square is wrong';
      },
      solve: () => pathTap(kids('pathGrid')[fa.end]), miss: () => pathTap(kids('pathGrid')[fa.end === 0 ? 1 : 0]) }
  };

  // ---------- Helpers ----------
  // Does the browser draw frames right now? (Not when the tab is hidden; then the game clocks are paused.)
  const framesRun = () => new Promise(res => { let done = false; requestAnimationFrame(() => { done = true; res(true); }); setTimeout(() => { if (!done) res(false); }, 300); });
  const startDirect = id => { run++; current = GAMES.find(g => g.id === id); show(id); STARTERS[id](run); };
  // Parts of a game screen that are allowed to be empty right after it starts
  const EMPTY_OK = { count: ['countOpts'] };
  function screenProblems(id) {
    const sec = $(id);
    if (screen !== id || sec.hidden) return 'game screen not shown (showing "' + screen + '")';
    const empty = [...sec.children].filter(el => !el.classList.contains('qbar') && !(EMPTY_OK[id] || []).includes(el.id))
      .filter(el => el.hidden || el.getBoundingClientRect().height === 0).map(el => el.id || el.className);
    return empty.length ? 'invisible part: ' + empty.join(', ') : null;
  }
  function overflow(id) {
    const box = document.querySelector('main').getBoundingClientRect();
    // Pictures can be tilted on purpose (Odd One Out): measure their tiles, not the drawing's invisible corners.
    // A board that is shaking after a mistake (.board.no) moves sideways for a moment, which is fine.
    const out = [...$(id).querySelectorAll('*')].filter(el => !el.closest('.float,.bubble,.pic svg,.mcard svg,.board.no')).filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.right > box.right + 1 || b.left < box.left - 1); });
    if (!out.length) return null;
    const el = out[0], b = el.getBoundingClientRect(), name = el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : '');
    return out.length + ' element(s) spill off a phone screen (e.g. ' + name + ' by ' + Math.round(Math.max(b.right - box.right, box.left - b.left)) + 'px)';
  }

  async function testGame(g, levels, log) {
    const t = T[g.id], problems = [];
    if (!t) return ['no test playbook for this game'];
    // 1. Launch through the real countdown
    launch(g.id);
    await wait(2350);
    const p = screenProblems(g.id); if (p) problems.push('launch: ' + p);
    // 2. Every level: make a question, check it, check it fits, answer right and wrong
    let answers = 0;
    for (let L = 1; L <= levels; L++) {
      for (const mode of t.genOnly ? ['gen'] : ['solve', 'miss']) {
        try {
          startDirect(g.id);
          t.gen(L);
          if (g.id === 'memory') await wait(30);
          const bad = t.check(L) || overflow(g.id); if (bad) { problems.push('level ' + L + ': ' + bad); continue; }
          if (mode === 'gen') continue;
          const st = t.state(), before = { score: st.score, streak: st.streak };
          t[mode](); answers++;
          // Nothing in a game may break out and cover the screen (a reused "full" class once did this to Unscramble's letters).
          const loose = [...$(g.id).querySelectorAll('*')].filter(el => getComputedStyle(el).position === 'fixed');
          if (loose.length) problems.push('level ' + L + ' (' + mode + '): ' + loose.length + ' element(s) cover the screen after answering (e.g. ' + (loose[0].className || loose[0].tagName) + ')');
          if (mode === 'solve' && !(st.score > before.score)) problems.push('level ' + L + ': correct answer did not score');
          if (mode === 'miss') { const m2 = t.missCheck ? t.missCheck(st) : st.streak === 0 ? null : 'mistake did not reset the streak'; if (m2) problems.push('level ' + L + ': ' + m2); }
        } catch (e) { problems.push('level ' + L + ' (' + mode + '): crashed: ' + e.message); }
        if (problems.length > 4) break;
      }
      if (problems.length > 4) break;
    }
    // 3. One real play-through for games whose answers need waiting
    if (t.play) { startDirect(g.id); try { const bad = await t.play(); if (bad) problems.push('play: ' + bad); } catch (e) { problems.push('play crashed: ' + e.message); } }
    // 4. Let the 60-second clock run out (timed games) and check the results screen.
    // The clocks only tick while the page is on screen, so this step is skipped when the tab is hidden.
    let note = '';
    startDirect(g.id);
    const st = t.state();
    if (st && st.t0) {
      if (await framesRun()) {
        st.t0 -= 61000; await wait(400);
        if (screen !== 'end') problems.push('game did not end when time ran out'); else if ($('finalScore').textContent === '') problems.push('results screen empty');
      } else note = ' (end-of-game check skipped: keep the tab visible)';
    }
    run++;
    log(g, problems, answers, note);
    return problems;
  }

  async function testApp(add) {
    const fail = (name, msg) => add(name, [msg]), pass = name => add(name, []);
    // Unique ids: a clash broke Math Sprint and Quick Count once
    const ids = {}; document.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; });
    const dups = Object.keys(ids).filter(k => ids[k] > 1);
    dups.length ? fail('Page ids', 'used twice: ' + dups.join(', ')) : pass('Page ids are unique');
    // Daily session from a clean slate
    Object.assign(store, { done: { date: '' }, streak: 0, lastDay: '', days: {}, sessionDays: [], log: [], bestStreak: 0 });
    renderHome();
    const picks = todaysGames();
    picks.length === SESSION && new Set(picks.map(g => g.skill)).size === SESSION ? pass("Today's session picks " + SESSION + ' different skills') : fail("Today's session", 'picks are wrong: ' + picks.map(g => g.id).join(', '));
    inSession = true;
    for (const g of picks) { current = g; finishGame(10, "Time's up", [['a', 1], ['b', 2], ['c', 3]], 1, 1); }
    inSession = false; renderHome();
    store.streak === 1 && $('sessionTitle').textContent.startsWith('Done') && store.sessionDays.includes(today())
      ? pass('Finishing the session updates the streak and calendar') : fail('Session', 'streak/calendar not updated after finishing all games');
    // Calendar, library, leaderboard
    try { openCalendar(); $('calGrid').children.length > 28 ? pass('Activity calendar opens') : fail('Calendar', 'month not drawn'); } catch (e) { fail('Calendar', 'crashed: ' + e.message); }
    try { openLibrary(); document.querySelectorAll('#libraryCards .card').length === GAMES.length ? pass('Games library lists all ' + GAMES.length + ' games') : fail('Library', 'missing games'); } catch (e) { fail('Library', 'crashed: ' + e.message); }
    try {
      store.player = { id: 'test', secret: 'test', name: 'Tester', country: 'FR' };
      openBoard();
      for (const c of CATS) { boardCat = c.id; await renderBoard(); }
      boardCat = 'daily';
      pass('Leaderboard opens every tab');
    } catch (e) { fail('Leaderboard', 'crashed: ' + e.message); }
  }

  // ---------- Runner and report ----------
  async function runAll(levels) {
    const panel = $('testPanel'), list = $('testList'), bar = $('testBar');
    $('testRun').disabled = $('testFull').disabled = true;
    list.innerHTML = ''; errors = [];
    // Protect the player's progress (restored in finish(), or by core.js if the tab is closed)
    if (localStorage.getItem(TEST_BACKUP) === null) localStorage.setItem(TEST_BACKUP, localStorage.getItem(KEY) ?? '__none__');
    const onlineBefore = { url: ONLINE.url, key: ONLINE.key };
    ONLINE.url = ''; ONLINE.key = ''; store.sound = false;
    // Lay the app out at exactly a small phone's width, whatever the size of this window.
    Object.assign(document.querySelector('main').style, { width: PHONE_WIDTH + 'px', maxWidth: 'none' });
    let failed = 0, done = 0;
    const total = GAMES.length + 1;
    const add = (name, problems) => {
      if (problems.length) failed++;
      list.insertAdjacentHTML('beforeend', '<li class="' + (problems.length ? 'bad' : 'good') + '">' + (problems.length ? '✗ ' : '✓ ') + name +
        (problems.length ? '<ul>' + problems.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' : '') + '</li>');
    };
    for (const g of GAMES) {
      $('testNow').textContent = 'Testing ' + g.name + '…';
      await testGame(g, levels, (game, problems, answers, note) => add(game.name + ' — ' + levels + ' levels' + (answers ? ', ' + answers + ' answers' : '') + note, problems));
      bar.style.width = (++done / total * 100) + '%';
    }
    $('testNow').textContent = 'Testing the home screen, session, calendar and leaderboard…';
    await testApp(add);
    if (errors.length) add('Page errors during the run', errors.slice(0, 8));
    bar.style.width = '100%';
    ONLINE.url = onlineBefore.url; ONLINE.key = onlineBefore.key;
    Object.assign(document.querySelector('main').style, { width: '', maxWidth: '' });
    run++; show('home'); $('nav').hidden = true; document.body.classList.remove('has-nav');
    const ok = !failed;
    $('testNow').textContent = ok ? 'All tests passed ✓' : failed + ' test' + (failed > 1 ? 's' : '') + ' found problems ✗';
    panel.classList.toggle('ok', ok); panel.classList.toggle('ko', !ok);
    $('testRun').disabled = $('testFull').disabled = false;
  }
  function finish() {
    // Put the player's real progress back and reopen the normal app
    const backup = localStorage.getItem(TEST_BACKUP);
    if (backup !== null) { if (backup === '__none__') localStorage.removeItem(KEY); else localStorage.setItem(KEY, backup); localStorage.removeItem(TEST_BACKUP); }
    location.href = 'index.html';
  }

  window.addEventListener('error', e => errors.push(e.message));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason && e.reason.message || e.reason)));
  const css = document.createElement('style');
  css.textContent = '#testPanel{position:fixed;inset:0;z-index:50;overflow:auto;background:var(--bg);padding:24px 16px;font-family:var(--display)}' +
    '#testPanel .wrap{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:14px}' +
    '#testPanel h1{font-size:28px}#testPanel p{color:var(--muted)}#testPanel .row{display:flex;gap:10px;flex-wrap:wrap}#testPanel .btn{width:auto;padding:12px 18px}' +
    '#testPanel .track{height:10px;background:var(--line);border-radius:5px;overflow:hidden}#testBar{height:100%;width:0;background:var(--hero);transition:width .2s}' +
    '#testNow{font-weight:700}#testPanel.ok #testNow{color:var(--good)}#testPanel.ko #testNow{color:var(--bad)}' +
    '#testList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}#testList>li{background:var(--surface);border-radius:12px;padding:10px 14px;box-shadow:var(--shadow)}' +
    '#testList li.good{color:var(--good)}#testList li.bad{color:var(--bad)}#testList ul{margin:6px 0 0;padding-left:20px;color:var(--ink);font-size:14px}';
  document.head.appendChild(css);
  document.body.insertAdjacentHTML('beforeend',
    '<div id="testPanel"><div class="wrap"><h1>Automatic tests</h1>' +
    '<p>Plays every game level by level, answering right and wrong, then checks the session, calendar and leaderboard. ' +
    'Your real progress is saved first and put back when you close the tests. Takes about 2 minutes; keep this tab in front.</p>' +
    '<div class="row"><button class="btn" id="testRun">Run (levels 1–10)</button><button class="btn white" id="testFull">Full run (levels 1–30)</button>' +
    '<button class="btn glass" id="testClose" style="color:var(--ink);background:var(--surface)">Close tests</button></div>' +
    '<div class="track"><div id="testBar"></div></div><div id="testNow">Ready.</div><ul id="testList"></ul></div></div>');
  $('testRun').addEventListener('click', () => runAll(10));
  $('testFull').addEventListener('click', () => runAll(30));
  $('testClose').addEventListener('click', finish);
})();
