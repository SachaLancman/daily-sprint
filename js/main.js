/* Wiring */
document.querySelectorAll('.x').forEach(b => { b.innerHTML = ICON.x; });
$('boardBack').innerHTML = ICON.back;
$('profileBack').innerHTML = ICON.back;
[...$('nav').children].forEach(b => { b.insertAdjacentHTML('afterbegin', ICON[{ home: 'home', library: 'grid', board: 'trophy' }[b.dataset.nav]]); });
$('nav').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) ({ home: () => renderHome(), library: openLibrary, board: openBoard })[b.dataset.nav]();
});
$('moreBtn').addEventListener('click', openLibrary);
$('libraryCards').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { inSession = false; launch(b.dataset.g); } });
$('skillFilter').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { librarySkill = b.dataset.skill; renderLibrary(); } });
$('cButtons').children[0].innerHTML = ICON.x + 'No';
$('cButtons').children[1].innerHTML = ICON.check + 'Yes';
$('cButtons').addEventListener('click', e => { const b = e.target.closest('button'); if (b) colorAnswer(b.dataset.a === '1'); });
$('hGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) huntTap(b); });
$('pOpts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) patternChoose(b); });
$('aLetters').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickLetter(Number(b.dataset.i)); });
$('aUndo').addEventListener('click', undoLetter);
$('aSkip').addEventListener('click', () => skipAnagram(false));
$('endBoard').addEventListener('click', openBoard);
$('boardBack').addEventListener('click', () => renderHome());
$('profileBack').addEventListener('click', () => afterProfile === 'settings' ? openSettings() : store.player && afterProfile === 'board' ? openBoard() : renderHome());
$('meBtn').addEventListener('click', () => openProfile('board'));
$('profileSave').addEventListener('click', saveProfile);
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveProfile(); });
$('deleteData').addEventListener('click', deleteData);
$('boardTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { boardCat = b.dataset.cat; renderBoard(); } });
$('countryFilter').addEventListener('change', e => { boardCountry = e.target.value; renderBoard(); });
$('gameFilter').addEventListener('change', e => { boardGame = e.target.value; renderBoard(); });
$('sSentence').addEventListener('click', e => { const b = e.target.closest('button'); if (b) spotTap(b); });
$('opts').addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(b); });
$('pad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.k); });
$('tiles').addEventListener('click', e => { const b = e.target.closest('button'); if (b) tap(Number(b.dataset.i)); });
$('games').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { inSession = false; launch(b.dataset.g); } });
$('sessionBtn').addEventListener('click', () => { const g = nextUndone(); if (g) { inSession = true; launch(g.id); } });
$('nextBtn').addEventListener('click', () => { const n = $('nextBtn').dataset.next; if (n) launch(n); else renderHome(); });
$('againBtn').addEventListener('click', () => { inSession = false; launch(current.id); });
$('homeBtn').addEventListener('click', () => renderHome());
document.querySelectorAll('.quit').forEach(b => b.addEventListener('click', () => { run++; renderHome(); }));
document.addEventListener('keydown', e => {
  if (KEYS[screen]) return KEYS[screen](e);
  if (screen === 'words' && e.key >= '1' && e.key <= '4') { const b = $('opts').children[Number(e.key) - 1]; if (b) choose(b); return; }
  if (screen === 'pattern' && e.key >= '1' && e.key <= '4') { const b = $('pOpts').children[Number(e.key) - 1]; if (b) patternChoose(b); return; }
  if (screen === 'colors') { if (e.key === 'ArrowLeft' || e.key === 'n') colorAnswer(false); else if (e.key === 'ArrowRight' || e.key === 'y') colorAnswer(true); return; }
  if (screen === 'anagram') { if (e.key === 'Backspace') undoLetter(); else if (/^[a-z]$/i.test(e.key)) typeLetter(e.key.toLowerCase()); return; }
  if (screen !== 'math') return;
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === 'Backspace') press('back');
  else if (e.key === 'Enter') { e.preventDefault(); press('enter'); }
});
renderHome();
if (!TEST_MODE) maybeWelcome();
flushScores();
// test.html opens the app as index.html?test, which loads the automatic tests.
if (TEST_MODE) { const t = document.createElement('script'); t.src = 'js/tests.js'; document.body.appendChild(t); }
// Offline support only works when the app is served from a website, not when opened as a file.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
