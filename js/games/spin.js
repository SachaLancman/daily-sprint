/* Shape Spin (Logic, 3D): a block shape turns slowly at the top. Which shape below is the same one, only turned?
   The others are its mirror image (the classic "mental rotation" trick) or the same shape with one block moved.
   Sameness is checked exactly: two shapes match if one of the 24 ways to turn a shape makes them identical.
   Levels: more blocks, more options, more mirror decoys, then an answer clock. */
let sp3 = null, spinScene = null;
const SPIN_LEVELS = [
  { k: 4, opts: 3, mirror: 0, flat: true },
  { k: 5, opts: 3, mirror: 1 },
  { k: 5, opts: 4, mirror: 1 },
  { k: 6, opts: 4, mirror: 1 }
];
function spinLevel(level) {
  if (level <= SPIN_LEVELS.length) return SPIN_LEVELS[level - 1];
  const d = past(level, SPIN_LEVELS.length);
  return { k: Math.min(8, 6 + Math.floor(d / 4)), opts: 4, mirror: 1, clock: true };
}
// The 24 ways to turn a shape: all products of quarter turns around x and y
const SPIN_ROTS = (() => {
  const mul = (a, b) => a.map((row, i) => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], X = [[1, 0, 0], [0, 0, -1], [0, 1, 0]], Y = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  const seen = new Map([[JSON.stringify(I), I]]), todo = [I];
  while (todo.length) { const m = todo.pop(); for (const g of [X, Y]) { const n = mul(g, m), key = JSON.stringify(n); if (!seen.has(key)) { seen.set(key, n); todo.push(n); } } }
  return [...seen.values()];
})();
const spinApply = (m, cells) => cells.map(([x, y, z]) => [m[0][0] * x + m[0][1] * y + m[0][2] * z, m[1][0] * x + m[1][1] * y + m[1][2] * z, m[2][0] * x + m[2][1] * y + m[2][2] * z]);
const spinKey = cells => { const mn = [0, 1, 2].map(a => Math.min(...cells.map(c => c[a]))); return cells.map(c => c.map((v, a) => v - mn[a]).join(',')).sort().join(' '); };
const spinCanon = cells => SPIN_ROTS.map(m => spinKey(spinApply(m, cells))).sort()[0];
const spinMirror = cells => cells.map(([x, y, z]) => [-x, y, z]);
const SPIN_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function spinGrow(k, flat) {
  const cells = [[0, 0, 0]], has = c => cells.some(d => d[0] === c[0] && d[1] === c[1] && d[2] === c[2]);
  while (cells.length < k) {
    const base = pickOne(cells), dir = pickOne(flat ? SPIN_DIRS.slice(0, 4) : SPIN_DIRS), c = base.map((v, a) => v + dir[a]);
    if (!has(c)) cells.push(c);
  }
  return cells;
}
const spinConnected = cells => { const seen = [cells[0]], todo = [cells[0]]; while (todo.length) { const c = todo.pop(); for (const d of cells) if (!seen.includes(d) && Math.abs(d[0] - c[0]) + Math.abs(d[1] - c[1]) + Math.abs(d[2] - c[2]) === 1) { seen.push(d); todo.push(d); } } return seen.length === cells.length; };
// The same shape with one block moved somewhere else (still all in one piece)
function spinNudge(cells) {
  for (let tries = 0; tries < 60; tries++) {
    const drop = r(0, cells.length - 1), rest = cells.filter((c, i) => i !== drop);
    if (!spinConnected(rest)) continue;
    const c = pickOne(rest).map((v, a) => v + pickOne(SPIN_DIRS)[a]);
    if (rest.some(d => d.join() === c.join()) || c.join() === cells[drop].join()) continue;
    return rest.concat([c]);
  }
  return spinGrow(cells.length);
}
function spinPlan() {
  const L = spinLevel(sp3.tier);
  let target, canon;
  for (let tries = 0; tries < 80; tries++) { // a mirror decoy needs a shape that differs from its mirror image
    target = spinGrow(L.k, L.flat); canon = spinCanon(target);
    if (!L.mirror || spinCanon(spinMirror(target)) !== canon) break;
  }
  const opts = [{ cells: spinApply(pickOne(SPIN_ROTS.slice(1)), target), same: true }], used = [canon];
  const mirrorOk = spinCanon(spinMirror(target)) !== canon;
  for (let tries = 0; opts.length < L.opts && tries < 400; tries++) { // one mirror image (a shape has only one), the rest have a block moved
    const base = mirrorOk && L.mirror && !opts.some(o => o.mirror) ? spinMirror(target) : spinNudge(Math.random() < 0.5 || !mirrorOk ? target : spinMirror(target));
    const c = spinCanon(base);
    if (used.includes(c)) continue;
    used.push(c); opts.push({ cells: spinApply(pickOne(SPIN_ROTS), base), mirror: c === spinCanon(spinMirror(target)) });
  }
  sp3.round++; sp3.target = target; sp3.opts = shuffle(opts); sp3.answer = sp3.opts.findIndex(o => o.same); sp3.phase = 'show';
}
const spinNote = t => { $('spinNote').textContent = t; };
function spinPick(i) {
  if (!alive(sp3) || sp3.phase !== 'pick') return;
  sp3.phase = 'result';
  stopAnswerClock(sp3, 'spinWrap');
  const ok = i === sp3.answer, my = sp3.round;
  if (ok) right(sp3, $('spinWrap')); else wrong(sp3);
  spinNote(ok ? 'Same shape' : (sp3.opts[i] && sp3.opts[i].mirror ? 'That one is its mirror image' : 'Not quite'));
  if (spinScene && spinScene.ready === my) spinShowResult(i, ok, my);
  later(sp3, ok ? 900 : 1600, () => { if (sp3.round === my) spinRound(); });
}

/* ---------- 3D ---------- */
function spinBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(35, 1, 0.1, 60);
  scene.background = new T.Color('#161B33');
  lights3D(scene, [2, 8, 9], 320);
  camera.position.set(0, 0.6, 12); camera.lookAt(0, -0.2, 0);
  spinScene = { scene, camera, box: new T.BoxGeometry(0.94, 0.94, 0.94), edges: new T.EdgesGeometry(new T.BoxGeometry(0.95, 0.95, 0.95)),
    mat: new T.MeshPhysicalMaterial({ color: '#5B82FF', roughness: 0.35, clearcoat: 0.6 }), line: new T.LineBasicMaterial({ color: '#141A3A' }),
    card: new T.BoxGeometry(1.8, 1.8, 0.12), cardMat: () => new T.MeshStandardMaterial({ color: '#262E57', roughness: 0.8 }),
    groups: [], cards: [], target: null, ready: 0, t0: performance.now() };
}
function spinShape(cells, scale) {
  const T = THREE, S = spinScene, g = new T.Group(), n = cells.length, mid = [0, 1, 2].map(a => cells.reduce((s, c) => s + c[a], 0) / n);
  cells.forEach(c => {
    const m = new T.Mesh(S.box, S.mat); m.castShadow = true; m.receiveShadow = true;
    m.position.set(c[0] - mid[0], c[1] - mid[1], c[2] - mid[2]); g.add(m);
    const e = new T.LineSegments(S.edges, S.line); e.position.copy(m.position); g.add(e);
  });
  g.scale.setScalar(scale);
  return g;
}
async function spinRound() {
  if (!alive(sp3)) return;
  spinPlan();
  const S = spinScene, my = sp3.round, L = spinLevel(sp3.tier);
  if (!S) { sp3.phase = 'pick'; return; }
  [S.target, ...S.groups, ...S.cards].forEach(o => o && S.scene.remove(o));
  S.target = spinShape(sp3.target, 0.72); S.target.position.set(0, 1.75, 0); S.scene.add(S.target);
  const n = sp3.opts.length, gap = n === 4 ? 2 : 2.3, dist = Math.max(11, fit3D(S.camera, n * gap / 2 + 0.3));
  S.camera.position.set(0, 0.6, dist); S.camera.lookAt(0, -0.2, 0); // back up just enough for every card to fit
  S.cards = []; S.groups = [];
  sp3.opts.forEach((o, i) => {
    const x = (i - (n - 1) / 2) * gap, card = new THREE.Mesh(S.card, S.cardMat()), g = spinShape(o.cells, 0.42);
    card.position.set(x, -2.05, -0.5); card.receiveShadow = true;
    g.position.set(x, -2.05, 0.35);
    card.add(g); g.position.set(0, 0, 0.85); // the shape rides on its card, so tapping either works
    S.scene.add(card); S.cards.push(card); S.groups.push(g);
  });
  spinNote('Which one is the same shape, only turned?');
  // Cards pop in one after another
  if (!await anim3D(sp3, my, 420, k => S.cards.forEach((c, i) => { const kk = Math.min(1, Math.max(0, k * 1.6 - i * 0.18)); c.scale.setScalar(Math.max(0.001, ease3D.back(kk))); }))) return;
  sp3.phase = 'pick'; S.ready = my;
  if (L.clock) answerClock(sp3, 'spinWrap', clockMs(past(sp3.tier, SPIN_LEVELS.length), 12, 0.3, 5), () => spinPick(-1));
}
async function spinShowResult(i, ok, my) {
  const S = spinScene, good = S.cards[sp3.answer], bad = S.cards[i];
  good.material.color.set('#1F8A5B'); good.material.emissive.set('#0E4A31');
  if (bad && !ok) { bad.material.color.set('#B3261E'); }
  if (ok) juiceBurst(...screen3D(good.position.clone(), S.camera), 14);
  // the chosen card hops; on a miss the right one turns to face you like the shape above
  const hop = bad || good;
  await anim3D(sp3, my, 380, k => { hop.position.y = -2.05 + 0.4 * Math.sin(Math.PI * k); });
}
function spinTap(e) {
  if (!spinScene || sp3.phase !== 'pick') return;
  const c = pick3D(e, spinScene.camera, spinScene.cards);
  if (c) { e.preventDefault(); spinPick(spinScene.cards.indexOf(c)); }
}
registerGame({
  id: 'spin', name: 'Shape Spin', skill: 'Logic', colors: ['#8EA7FF', '#2F3E9E'],
  hint: 'A block shape turns at the top. Tap the shape below that is the same one, only turned. Watch out for mirror images. 60 seconds.',
  art: '<g fill="#fff" stroke="#2F3E9E" stroke-width="2.5" stroke-linejoin="round"><path d="M36 30l14-8 14 8-14 8z" fill-opacity=".9"/><path d="M36 30v16l14 8V38z" fill-opacity=".55"/><path d="M64 30v16l-14 8V38z" fill-opacity=".75"/>' +
    '<path d="M64 46l14-8 14 8-14 8z" fill-opacity=".9"/><path d="M64 46v16l14 8V54z" fill-opacity=".55"/><path d="M92 46v16l-14 8V54z" fill-opacity=".75"/></g>' +
    '<path d="M28 78a34 14 0 0 0 64 6" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M86 78l8 6-9 5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="hunt-wrap" id="spinWrap" data-fx="own"><div class="stage3d tall" id="spinStage"></div><p class="note3d" id="spinNote">Which one is the same shape?</p></div>',
  start(my) {
    sp3 = makeRound('spin', MAX_LEVEL, 2);
    sp3.round = 0; sp3.phase = 'load';
    show('spin');
    roundHud(sp3);
    open3D(sp3, 'spinStage', 'spinNote', () => { if (!spinScene) spinBuild(); }, () => {
      stage3D('spinStage', spinScene.camera); onTap3D = spinTap;
      loop3D(sp3, spinScene.scene, spinScene.camera, now => {
        const t = (now - spinScene.t0) / 1000;
        if (spinScene.target) spinScene.target.rotation.set(0.45 + Math.sin(t * 0.7) * 0.25, t * 0.9, 0.15); // the shape turns slowly
        spinScene.groups.forEach((g, i) => g.rotation.set(0.35 + Math.sin(t + i) * 0.06, 0.5 + Math.sin(t * 0.8 + i) * 0.1, 0)); // options breathe a little
      });
      spinRound();
    });
    startClock(sp3, st => [['Solved', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const n = Number(e.key); if (n >= 1 && sp3.opts && n <= sp3.opts.length) spinPick(n - 1); }
});
