/* Word Fishing (Language): a sticker picture shows the word to spell. Fish swim across the pond, each carrying a letter.
   Tap the fish in the right order to spell the word; a wrong fish darts away. Longer words, faster fish, more decoys
   and look-alike letters as you level up. Drawn on a canvas with its own game loop (fishTick).
   Game feel: fish swim with a tail wiggle and bob; a caught fish leaps up to its slot and the letter pops in;
   a wrong one flashes and bolts; bubbles drift up all the time. */
let wf = null;
const FISH_W = 328, FISH_H = 380, FISH_ROWS = [96, 142, 188, 234, 280, 326];
const FISH_COLORS = ['#FF9A55', '#FFC83D', '#56C8FA', '#FF6FA8', '#7BD389', '#A57BFF'];
const FISH_LOOKALIKE = { B: 'DPR', D: 'BOP', E: 'FB', F: 'EP', G: 'CO', I: 'LJT', M: 'NW', N: 'MH', O: 'QCD', P: 'RB', Q: 'O', U: 'V', V: 'UY', W: 'M', C: 'GO', H: 'N', L: 'I', R: 'P' };
const FISH_LEVELS = [
  { len: [3, 4], speed: 34, count: 3, decoy: 0.3, every: 1500 },
  { len: [4, 5], speed: 40, count: 4, decoy: 0.4, every: 1300 },
  { len: [5, 6], speed: 46, count: 4, decoy: 0.5, every: 1200 },
  { len: [5, 7], speed: 52, count: 5, decoy: 0.55, every: 1100 }
];
// Past level 4: any word, faster fish, more of them and more look-alike letters.
function fishLevel(level) {
  if (level <= FISH_LEVELS.length) return FISH_LEVELS[level - 1];
  const d = past(level, FISH_LEVELS.length);
  return { len: [5, 10], speed: Math.min(120, 52 + 4 * d), count: Math.min(6, 5 + Math.floor(d / 6)), decoy: Math.min(0.75, 0.55 + 0.02 * d), every: Math.max(650, 1100 - 25 * d) };
}
const FISH_WORDS = () => PIC_NAMES.filter(p => /^[a-z]+$/.test(PICS[p].word));
function fishNewWord() {
  const L = fishLevel(wf.tier), pool = FISH_WORDS().filter(p => PICS[p].word.length >= L.len[0] && PICS[p].word.length <= L.len[1] && !wf.recent.includes(p));
  const pic = pickOne(pool.length ? pool : FISH_WORDS());
  wf.recent = wf.recent.concat(pic).slice(-12);
  wf.pic = pic; wf.word = PICS[pic].word.toUpperCase(); wf.pos = 0; wf.locked = false;
  $('fishPic').innerHTML = picSvg(pic);
  $('fishPic').classList.remove('pop-in'); void $('fishPic').offsetWidth; $('fishPic').classList.add('pop-in');
  $('fishSlots').innerHTML = [...wf.word].map(() => '<span class="fish-slot"></span>').join('');
  $('fishSlots').setAttribute('aria-label', 'Spell the word for ' + picLabel(pic) + ', ' + wf.word.length + ' letters');
}
const fishSwimming = () => wf.fish.filter(f => !f.caught && !f.flee);
function fishLetter() {
  const L = fishLevel(wf.tier), need = wf.word[wf.pos];
  if (!fishSwimming().some(f => f.letter === need)) return need; // the next letter is always somewhere in the pond
  if (Math.random() > L.decoy) return wf.word[r(wf.pos, wf.word.length - 1)];
  const alike = FISH_LOOKALIKE[need];
  const onScreen = l => fishSwimming().filter(f => f.letter === l).length;
  for (let n = 0; n < 6; n++) { // decoys: a look-alike of the needed letter or any letter, but never three of the same in the pond
    const l = alike && Math.random() < 0.4 ? alike[r(0, alike.length - 1)] : 'ABCDEFGHIJKLMNOPRSTUVWY'[r(0, 22)];
    if (onScreen(l) < 2 && l !== need) return l;
  }
  return 'ABCDEFGHIJKLMNOPRSTUVWY'[r(0, 22)];
}
function fishSpawn(letter = fishLetter()) {
  const L = fishLevel(wf.tier), busy = fishSwimming().filter(f => f.x > -30 && f.x < 70 || f.x > FISH_W - 70 && f.x < FISH_W + 30).map(f => f.row);
  const rows = FISH_ROWS.map((y, i) => i).filter(i => !busy.includes(i)), row = rows.length ? pickOne(rows) : r(0, FISH_ROWS.length - 1), dir = Math.random() < 0.5 ? 1 : -1;
  const f = { letter, row, dir, x: dir > 0 ? -36 : FISH_W + 36, y: FISH_ROWS[row], speed: L.speed * (0.8 + Math.random() * 0.4), color: pickOne(FISH_COLORS), seed: Math.random() * 6, caught: 0, flee: 0, born: wf.t };
  wf.fish.push(f);
  return f;
}
function fishCatch(f) {
  if (!alive(wf) || wf.locked || f.caught || f.flee) return;
  if (f.letter === wf.word[wf.pos]) {
    f.caught = 0.001; f.from = [f.x, f.y];
    const slot = $('fishSlots').children[wf.pos];
    slot.textContent = f.letter; slot.classList.add('on');
    juiceMove(slot, [{ transform: 'scale(1.4) translateY(-6px)' }, { transform: 'none' }], 320, 'cubic-bezier(.34,1.56,.64,1)');
    fishBubbles(f.x, f.y, 10);
    wf.pos++;
    beep(560 + wf.pos * 45, 0.06);
    if (wf.pos === wf.word.length) {
      wf.locked = true;
      right(wf, $('fishWrap'), (4 + 2 * wf.word.length) * wf.tier);
      [...$('fishSlots').children].forEach((s, i) => juiceMove(s, [{ transform: 'none' }, { transform: 'translateY(-8px)' }, { transform: 'none' }], 360 + i * 40, 'ease-out'));
      later(wf, 650, fishNewWord);
    }
  } else {
    f.flee = 0.001; f.dir = f.x < FISH_W / 2 ? -1 : 1; // swims off the near edge, fast
    wrong(wf);
  }
}
function fishBubbles(x, y, n) {
  if (reduced) return;
  for (let k = 0; k < n; k++) wf.bubbles.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 16, r: 2 + Math.random() * 4, v: 40 + Math.random() * 60, life: 0.8 + Math.random() * 0.6 });
}
function fishTick(now) {
  if (!alive(wf)) return;
  const dt = wf.last ? Math.max(0, Math.min(0.05, (now - wf.last) / 1000)) : 0, L = fishLevel(wf.tier);
  wf.last = now; wf.t += dt;
  const missing = !wf.locked && !fishSwimming().some(f => f.letter === wf.word[wf.pos]);
  if (missing) wf.spawnIn = Math.min(wf.spawnIn, 250); // the needed letter comes quickly, even into a full pond
  wf.spawnIn -= dt * 1000;
  if (wf.spawnIn <= 0 && (fishSwimming().length < L.count || missing && fishSwimming().length < L.count + 2)) { fishSpawn(); wf.spawnIn = L.every * (0.7 + Math.random() * 0.6) * (fishSwimming().length < L.count / 2 ? 0.4 : 1); }
  for (const f of wf.fish) {
    if (f.caught) { f.caught += dt; continue; }
    f.x += f.dir * f.speed * (f.flee ? 4 : 1) * dt;
    if (f.flee) f.flee += dt;
  }
  wf.fish = wf.fish.filter(f => (f.caught ? f.caught < 0.4 : f.x > -60 && f.x < FISH_W + 60));
  if (Math.random() < dt * 1.5) fishBubbles(r(20, FISH_W - 20), FISH_H - 20, 1); // a bubble now and then
  wf.bubbles.forEach(b => { b.y -= b.v * dt; b.x += Math.sin(wf.t * 3 + b.r) * 10 * dt; b.life -= dt; });
  wf.bubbles = wf.bubbles.filter(b => b.life > 0 && b.y > 30);
  fishDraw();
  requestAnimationFrame(fishTick);
}

/* ---------- Drawing ---------- */
function fishScene(c) {
  if (wf.bg && wf.bg.complete && wf.bg.naturalWidth) {
    const s = Math.max(FISH_W / wf.bg.naturalWidth, FISH_H / wf.bg.naturalHeight), w = wf.bg.naturalWidth * s, h = wf.bg.naturalHeight * s;
    c.drawImage(wf.bg, (FISH_W - w) / 2, (FISH_H - h) / 2, w, h);
    return;
  }
  const g = c.createLinearGradient(0, 0, 0, FISH_H); g.addColorStop(0, '#7FE0E8'); g.addColorStop(1, '#2A9DB0');
  c.fillStyle = g; c.fillRect(0, 0, FISH_W, FISH_H);
  c.fillStyle = '#E9D6A8'; c.beginPath(); c.moveTo(0, FISH_H - 22); c.quadraticCurveTo(FISH_W / 2, FISH_H - 40, FISH_W, FISH_H - 20); c.lineTo(FISH_W, FISH_H); c.lineTo(0, FISH_H); c.fill();
}
function fishOne(c, f) {
  const wig = Math.sin(wf.t * 10 + f.seed), bob = Math.sin(wf.t * 2.4 + f.seed) * 4;
  let x = f.x, y = f.y + bob, s = Math.min(1, (wf.t - f.born) / 0.3), a = 1;
  if (f.caught) { const k = Math.min(1, f.caught / 0.35); x = f.from[0]; y = f.from[1] - 120 * k + 60 * k * k; s = 1 - 0.5 * k; a = 1 - k; } // a leap up out of the pond
  if (f.flee) a = Math.max(0, 1 - f.flee * 2);
  c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(s, s);
  c.save(); c.scale(f.dir, 1);
  c.strokeStyle = INK; c.lineWidth = 3; c.lineJoin = 'round';
  c.fillStyle = f.flee ? '#FFFFFF' : f.color;
  c.beginPath(); c.moveTo(-22, 0); c.lineTo(-40, -14 + wig * 4); c.lineTo(-40, 14 + wig * 4); c.closePath(); c.fill(); c.stroke(); // tail
  c.beginPath(); c.moveTo(-4, -15); c.quadraticCurveTo(6, -28, 14, -14); c.fill(); c.stroke(); // top fin
  c.beginPath(); c.ellipse(0, 0, 28, 18, 0, 0, 7); c.fill(); c.stroke(); // body
  c.fillStyle = '#fff'; c.beginPath(); c.arc(18, -5, 5.5, 0, 7); c.fill(); c.lineWidth = 2; c.stroke();
  c.fillStyle = INK; c.beginPath(); c.arc(19.5, -5, 2.6, 0, 7); c.fill();
  c.restore();
  // the letter, never mirrored
  c.fillStyle = '#FFFFFF'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(-3 * f.dir, 2, 13, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.font = '800 17px "Bricolage Grotesque", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(f.letter, -3 * f.dir, 3);
  c.restore();
}
function fishDraw() {
  const c = wf.ctx;
  c.setTransform(wf.dpr, 0, 0, wf.dpr, 0, 0);
  c.clearRect(0, 0, FISH_W, FISH_H);
  fishScene(c);
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5;
  wf.bubbles.forEach(b => { c.globalAlpha = Math.min(1, b.life * 2); c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.stroke(); });
  c.globalAlpha = 1;
  wf.fish.slice().sort((a, b) => a.y - b.y).forEach(f => fishOne(c, f));
}
// Fresh state (also used by the tests)
function fishSetup() { wf.fish = []; wf.bubbles = []; wf.spawnIn = 300; wf.t = 0; wf.last = 0; }
// Start with a pond already full of fish, spread across the water
function fishFill() { const n = fishLevel(wf.tier).count; for (let k = 0; k < n; k++) fishSpawn().x = 40 + (k + 0.5) * (FISH_W - 80) / n; }
function fishAt(px, py) { // the swimming fish under a tap, nearest first (generous hit area for small fingers)
  return fishSwimming().map(f => ({ f, d: Math.hypot(f.x - px, f.y - py) })).filter(o => o.d < 36).sort((a, b) => a.d - b.d).map(o => o.f)[0];
}
registerGame({
  id: 'fishing', name: 'Word Fishing', skill: 'Language', colors: ['#5FD3E0', '#0B6B7A'],
  hint: 'Spell the word for the picture: tap the fish with the letters, in order. A wrong fish swims away. 60 seconds.',
  art: '<path d="M10 70q25-10 50 0t50 0V112H10z" fill="#fff" fill-opacity=".25"/>' +
    '<g transform="translate(62 62)"><path d="M-20 0l-16-12v24z" fill="#FFC83D" stroke="#2B2350" stroke-width="3" stroke-linejoin="round"/><ellipse rx="24" ry="16" fill="#FFC83D" stroke="#2B2350" stroke-width="3"/><circle cx="14" cy="-4" r="4" fill="#fff"/><circle cx="15" cy="-4" r="2" fill="#2B2350"/>' +
    '<circle cx="-4" cy="2" r="10" fill="#fff" stroke="#2B2350" stroke-width="2.5"/><text x="-4" y="7" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="14" fill="#2B2350">A</text></g>' +
    '<circle cx="96" cy="34" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="88" cy="20" r="3" fill="none" stroke="#fff" stroke-width="2"/>',
  html: '<div class="hunt-wrap fish-wrap" id="fishWrap"><div class="fish-clue"><span class="pic static" id="fishPic"></span><div class="fish-slots" id="fishSlots" role="status"></div></div>' +
    '<canvas class="def-canvas" id="fishCanvas" aria-label="Fish carrying letters swim across the pond"></canvas></div>',
  start(my) {
    wf = makeRound('fishing', MAX_LEVEL);
    wf.recent = [];
    const cv = $('fishCanvas');
    wf.dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = FISH_W * wf.dpr; cv.height = FISH_H * wf.dpr;
    wf.ctx = cv.getContext('2d');
    wf.bg = new Image(); wf.bg.src = 'img/fishing-bg.jpg'; wf.bg.onerror = () => { wf.bg = null; };
    fishSetup();
    show('fishing');
    roundHud(wf);
    fishNewWord();
    fishFill();
    requestAnimationFrame(fishTick);
    startClock(wf, st => [['Words', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  // Keyboard: type the letter, and the nearest fish carrying it is caught
  key(e) {
    if (!/^[a-z]$/i.test(e.key)) return;
    const f = fishSwimming().filter(x => x.letter === e.key.toUpperCase()).sort((a, b) => Math.abs(a.x - FISH_W / 2) - Math.abs(b.x - FISH_W / 2))[0];
    if (f) fishCatch(f);
  }
});
$('fishCanvas').addEventListener('pointerdown', e => {
  const b = $('fishCanvas').getBoundingClientRect(), f = fishAt((e.clientX - b.left) * FISH_W / b.width, (e.clientY - b.top) * FISH_H / b.height);
  if (f) { e.preventDefault(); fishCatch(f); }
});
