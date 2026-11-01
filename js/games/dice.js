/* Letter Dice (Language, 3D): letter dice tumble onto the table. Tap them in order to spell the hidden word.
   Every word's letters spell only that one common word (the list comes from the old Unscramble game).
   Tap a filled slot to take the last letter back. Levels: 4 to 8 letters, then extra decoy dice and an answer clock.
   Game feel: dice drop in spinning, bounce and settle; a tapped die hops off the table; a right word flies up with sparks. */
let dc = null, diceScene = null;
const DICE_WORDS = [
  'jump frog milk fish gold duck mask king sock bell kite zero quiz bulk hand desk lazy glow gift film jury navy hawk cozy',
  'plant magic quick candy beach honey pizza tiger chair crown giant globe juice knife laugh novel piano robot sugar voice storm happy jelly puppy',
  'jungle rocket pencil puzzle guitar window frozen bridge carpet dragon hockey mirror ladder pirate bucket jacket wizard yellow summer kitten rabbit island zipper muffin',
  'balloon captain dolphin journey kitchen monster pyramid rainbow blanket compass diamond freedom harvest lantern mustard octopus penguin quarter vampire whistle popcorn cabbage network trumpet',
  'sandwich elephant mountain treasure dinosaur umbrella football kangaroo necklace pancakes backpack airplane birthday hospital mushroom princess squirrel vacation skeleton tomorrow campfire starfish goldfish blizzard'
].map(t => t.split(' '));
function diceLevel(level) {
  if (level <= 4) return { set: level - 1, decoys: 0, clock: 0 };
  const d = past(level, 4);
  return { set: Math.min(4, 3 + Math.floor(d / 3)), decoys: Math.min(3, 1 + Math.floor(d / 4)), clock: Math.max(8, 16 - 0.4 * d) };
}
function dicePlan() {
  const L = diceLevel(dc.tier), set = DICE_WORDS[L.set];
  let word; do word = pickOne(set); while (dc.recent.includes(word) && set.length > 10);
  dc.recent = dc.recent.concat(word).slice(-10);
  const letters = [...word.toUpperCase()];
  for (let i = 0; i < L.decoys; i++) letters.push('BCDFGHKLMNPRSTVW'[r(0, 15)]);
  let mix; do mix = shuffle(letters.slice()); while (mix.join('').startsWith(word.toUpperCase()));
  dc.round++; dc.word = word.toUpperCase(); dc.dice = mix; dc.picked = []; dc.phase = 'show';
  $('diceSlots').innerHTML = [...dc.word].map(() => '<span class="fish-slot"></span>').join('');
}
const diceNote = t => { $('diceNote').textContent = t; };
function diceSlots() { [...$('diceSlots').children].forEach((s, i) => { const k = dc.picked[i]; s.textContent = k === undefined ? '' : dc.dice[k]; s.classList.toggle('on', k !== undefined); }); }
function dicePick(i) {
  if (!alive(dc) || dc.phase !== 'pick' || dc.picked.includes(i) || i < 0 || i >= dc.dice.length) return;
  dc.picked.push(i); diceSlots(); beep(520 + dc.picked.length * 40, 0.05);
  const slot = $('diceSlots').children[dc.picked.length - 1];
  juiceMove(slot, [{ transform: 'scale(1.35) translateY(-6px)' }, { transform: 'none' }], 300, 'cubic-bezier(.34,1.56,.64,1)');
  if (diceScene && diceScene.ready === dc.round) diceLift(i, true);
  if (dc.picked.length < dc.word.length) return;
  const guess = dc.picked.map(k => dc.dice[k]).join(''), ok = guess === dc.word, my = dc.round;
  dc.phase = 'result'; stopAnswerClock(dc, 'diceWrap');
  if (ok) { right(dc, $('diceWrap'), (4 + 2 * dc.word.length) * dc.tier); diceNote('Yes: ' + dc.word.toLowerCase()); }
  else { wrong(dc); diceNote('It was ' + dc.word.toLowerCase()); }
  if (diceScene && diceScene.ready === my) diceFinish(ok, my);
  later(dc, ok ? 900 : 1500, () => { if (dc.round === my) diceRound(); });
}
function diceUndo() {
  if (!alive(dc) || dc.phase !== 'pick' || !dc.picked.length) return;
  const i = dc.picked.pop(); diceSlots();
  if (diceScene && diceScene.ready === dc.round) diceLift(i, false);
}

/* ---------- 3D ---------- */
function diceBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
  scene.background = new T.Color('#2A1F17'); scene.fog = new T.Fog('#2A1F17', 14, 28);
  lights3D(scene, [1, 10, 4], 340);
  const table = new T.Mesh(new T.BoxGeometry(14, 0.4, 10), new T.MeshStandardMaterial({ color: '#B97A45', roughness: 0.7 }));
  table.position.y = -0.2; table.receiveShadow = true; scene.add(table);
  for (let i = -6; i <= 6; i += 1.1) { // wood grain stripes
    const s = new T.Mesh(new T.BoxGeometry(14, 0.002, 0.04), new T.MeshStandardMaterial({ color: '#A66A39', roughness: 0.8 }));
    s.position.set(0, 0.001, i * 0.8); scene.add(s);
  }
  diceScene = { scene, camera, box: new T.BoxGeometry(0.9, 0.9, 0.9), mats: {}, dice: [], home: [], ready: 0, t0: performance.now() };
}
function diceMat(letter) { // one material per letter, reused: the letter on every face
  const S = diceScene;
  return S.mats[letter] = S.mats[letter] || new THREE.MeshPhysicalMaterial({ map: label3D(letter, '#FFF6EA'), roughness: 0.4, clearcoat: 0.5 });
}
function diceLayout(n) {
  const cols = Math.min(5, n), rows = Math.ceil(n / cols), out = [];
  for (let i = 0; i < n; i++) { const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - row * cols : cols, col = i - row * cols; out.push([(col - (inRow - 1) / 2) * 1.3, 0.45, (row - (rows - 1) / 2) * 1.6 + 0.3]); }
  return out;
}
async function diceRound() {
  if (!alive(dc)) return;
  dicePlan();
  const S = diceScene, my = dc.round, L = diceLevel(dc.tier);
  if (!S) { dc.phase = 'pick'; return; }
  S.dice.forEach(d => S.scene.remove(d));
  S.home = diceLayout(dc.dice.length);
  S.dice = dc.dice.map((ch, i) => {
    const m = new THREE.Mesh(S.box, diceMat(ch)); m.castShadow = true; m.receiveShadow = true;
    m.userData.spin = [Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4];
    m.position.set(S.home[i][0] + (Math.random() - 0.5) * 2, 4 + Math.random() * 2, S.home[i][2] - 2); S.scene.add(m); return m;
  });
  const cols = Math.min(5, dc.dice.length), dist = Math.max(7.5, fit3D(S.camera, cols * 0.65 + 0.4) / 1.03 + 0.8); // every die fits across
  S.camera.position.set(0, dist * 0.82, dist * 0.62); S.camera.lookAt(0, 0, 0.35);
  diceNote('Spell the word');
  // Roll: each die falls in spinning, bounces twice and settles square, a little after the one before it
  if (!await anim3D(dc, my, 900, k => S.dice.forEach((m, i) => {
    const kk = Math.min(1, Math.max(0, (k - i * 0.05) / 0.75)), h = S.home[i], fall = 1 - kk;
    const bounce = Math.abs(Math.sin(kk * Math.PI * 2.5)) * Math.pow(1 - kk, 2) * 1.6;
    m.position.set(h[0] + (m.position.x - h[0]) * fall * 0.2, h[1] + 4 * fall * fall + bounce, h[2] - 2 * fall);
    const sp = m.userData.spin; m.rotation.set(sp[0] * fall * fall, sp[1] * fall * fall, sp[2] * fall * fall);
  }))) return;
  S.dice.forEach((m, i) => { m.position.set(...S.home[i]); m.rotation.set(0, 0, 0); });
  beep(220, 0.05);
  dc.phase = 'pick'; S.ready = my;
  if (L.clock) answerClock(dc, 'diceWrap', L.clock * 1000, () => { if (dc.phase === 'pick') diceTimeUp(); });
}
function diceTimeUp() { // the clock ran out: counts as a miss
  const my = dc.round; dc.phase = 'result'; wrong(dc); diceNote('It was ' + dc.word.toLowerCase());
  later(dc, 1500, () => { if (dc.round === my) diceRound(); });
}
function diceLift(i, up) { // a picked die hops off the table; an undone one drops back
  const S = diceScene, m = S.dice[i], h = S.home[i], my = dc.round, y0 = m.position.y;
  anim3D(dc, my, 220, k => { m.position.y = up ? y0 + 2.6 * ease3D.out(k) : y0 + (h[1] - y0) * ease3D.out(k); m.scale.setScalar(up ? 1 - 0.7 * k : 0.3 + 0.7 * k); m.rotation.x = up ? -0.8 * k : 0; })
    .then(done => { if (done && up) m.visible = false; });
  if (!up) m.visible = true;
}
async function diceFinish(ok, my) {
  const S = diceScene;
  if (ok) { juiceBurst(...screen3D(new THREE.Vector3(0, 1, 0), S.camera), 16); return; }
  S.dice.forEach((m, i) => { m.visible = true; }); // the dice come back so you can see them again
  await anim3D(dc, my, 350, k => S.dice.forEach((m, i) => { m.scale.setScalar(Math.min(1, 0.3 + k)); m.position.y = S.home[i][1] + 0.4 * Math.sin(Math.PI * k); }));
}
function diceTap(e) {
  if (!diceScene || dc.phase !== 'pick') return;
  const m = pick3D(e, diceScene.camera, diceScene.dice.filter(d => d.visible));
  if (m) { e.preventDefault(); dicePick(diceScene.dice.indexOf(m)); }
}
registerGame({
  id: 'dice', name: 'Letter Dice', skill: 'Language', colors: ['#F2B36B', '#8A4B12'],
  hint: 'Letter dice roll onto the table. Tap them in order to spell the hidden word. Tap a slot to take a letter back. 60 seconds.',
  art: [[24, 40, -12, 'W'], [58, 28, 8, 'O'], [86, 50, -6, 'R'], [48, 70, 14, 'D']].map(([x, y, a, ch]) => '<g transform="rotate(' + a + ' ' + (x + 15) + ' ' + (y + 15) + ')"><rect x="' + x + '" y="' + y + '" width="30" height="30" rx="7" fill="#FFF6EA" stroke="#8A4B12" stroke-width="2.5"/><text x="' + (x + 15) + '" y="' + (y + 22) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="18" fill="#2B2350">' + ch + '</text></g>').join(''),
  html: '<div class="hunt-wrap" id="diceWrap" data-fx="own"><div class="fish-slots dice-slots" id="diceSlots" role="status" aria-label="Your word"></div><div class="stage3d" id="diceStage"></div><p class="note3d" id="diceNote">Spell the word</p></div>',
  start(my) {
    dc = makeRound('dice', MAX_LEVEL, 2);
    dc.round = 0; dc.recent = []; dc.dice = []; dc.picked = []; dc.phase = 'load';
    show('dice');
    roundHud(dc);
    open3D(dc, 'diceStage', 'diceNote', () => { if (!diceScene) diceBuild(); }, () => {
      stage3D('diceStage', diceScene.camera); onTap3D = diceTap;
      loop3D(dc, diceScene.scene, diceScene.camera);
      diceRound();
    });
    startClock(dc, st => [['Words', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) {
    if (e.key === 'Backspace') return diceUndo();
    if (!/^[a-z]$/i.test(e.key) || !dc.dice) return;
    const i = dc.dice.findIndex((c, k) => c === e.key.toUpperCase() && !dc.picked.includes(k));
    if (i >= 0) dicePick(i);
  }
});
$('diceSlots').addEventListener('click', diceUndo);
