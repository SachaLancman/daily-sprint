/* Cup Shuffle (Speed): the app's first real 3D game, drawn with three.js (js/vendor/three.min.js, r159, MIT),
   loaded only when this game opens. A ball is shown under one cup, the cups shuffle, then tap the cup hiding the ball.
   Levels: more cups (3 to 5), more swaps, faster swaps, and later any two cups can swap, not only neighbours.
   The rules (cupsPlan, cupsPick) work without the 3D scene, so the tests can play rounds directly.
   Game feel: the cup lifts with an ease, swaps arc one cup in front of the other, the right cup makes the ball hop
   out with a burst of sparks; a wrong pick shakes the board and lifts the right cup to show where the ball was. */
let cs = null, cupScene = null;
const CUP_LEVELS = [
  { n: 3, swaps: 3, ms: 620, far: 0 },
  { n: 3, swaps: 5, ms: 520, far: 0 },
  { n: 4, swaps: 6, ms: 460, far: 0.2 },
  { n: 4, swaps: 8, ms: 400, far: 0.35 }
];
// Past level 4: five cups, up to 16 swaps, as fast as 0.2 s each, and more swaps between cups far apart.
function cupLevel(level) {
  if (level <= CUP_LEVELS.length) return CUP_LEVELS[level - 1];
  const d = past(level, CUP_LEVELS.length);
  return { n: Math.min(5, 4 + Math.floor(d / 4)), swaps: Math.min(16, 8 + d), ms: Math.max(200, 400 - 12 * d), far: Math.min(0.6, 0.35 + 0.03 * d) };
}
// A new round: which slot hides the ball, the list of swaps, and where the ball ends up.
function cupsPlan() {
  const L = cupLevel(cs.tier);
  cs.round++; cs.n = L.n; cs.ball = r(0, L.n - 1); cs.swaps = [];
  for (let k = 0; k < L.swaps; k++) {
    let a = r(0, L.n - 2), b = a + 1;
    if (Math.random() < L.far) { a = r(0, L.n - 1); do b = r(0, L.n - 1); while (b === a); }
    cs.swaps.push([Math.min(a, b), Math.max(a, b)]);
  }
  cs.answer = cs.swaps.reduce((s, [a, b]) => s === a ? b : s === b ? a : s, cs.ball);
  cs.phase = 'show';
}
const cupNote = text => { $('cupNote').textContent = text; };
function cupsPick(slot) {
  if (!alive(cs) || cs.phase !== 'pick') return;
  cs.phase = 'result';
  const ok = slot === cs.answer, my = cs.round;
  if (ok) right(cs, $('cupWrap')); else wrong(cs);
  cupNote(ok ? 'Found it' : 'It was here');
  if (cupScene && cupScene.ready === cs.round) cupsReveal(slot, ok, my);
  later(cs, ok ? 1000 : 1500, () => { if (cs.round === my) cupsRound(); });
}


/* ---------- 3D scene (uses the shared toolkit in js/three3d.js) ---------- */
function cupsBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(32, 1, 0.1, 60);
  scene.background = new T.Color('#1A1530'); scene.fog = new T.Fog('#1A1530', 14, 26);
  lights3D(scene);
  // The table: green felt with a wooden edge
  const felt = new T.Mesh(new T.CylinderGeometry(6, 6, 0.3, 72), new T.MeshStandardMaterial({ color: '#1F7A5A', roughness: 0.95 }));
  felt.position.y = -0.15; felt.receiveShadow = true; scene.add(felt);
  const edge = new T.Mesh(new T.TorusGeometry(6, 0.18, 16, 96), new T.MeshStandardMaterial({ color: '#8B5A2B', roughness: 0.55 }));
  edge.rotation.x = Math.PI / 2; edge.position.y = 0.02; scene.add(edge);
  // Cups: a lathe profile (open at the bottom) with a white band and rim
  const prof = [[0.62, 0], [0.6, 0.06], [0.52, 0.6], [0.47, 1.08], [0.42, 1.2], [0.2, 1.25], [0, 1.26]].map(([x, y]) => new T.Vector2(x, y));
  const cupGeo = new T.LatheGeometry(prof, 48), bandGeo = new T.CylinderGeometry(0.535, 0.565, 0.16, 48, 1, true), rimGeo = new T.TorusGeometry(0.6, 0.045, 12, 48);
  const red = new T.MeshPhysicalMaterial({ color: '#E5484D', roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25, side: T.DoubleSide });
  const white = new T.MeshPhysicalMaterial({ color: '#FFF6EA', roughness: 0.4, clearcoat: 0.4 });
  const cups = [];
  for (let i = 0; i < 5; i++) {
    const g = new T.Group(), body = new T.Mesh(cupGeo, red), band = new T.Mesh(bandGeo, white), rim = new T.Mesh(rimGeo, white);
    band.position.y = 0.42; rim.rotation.x = Math.PI / 2; rim.position.y = 0.03;
    [body, band, rim].forEach(m => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
    scene.add(g); cups.push(g);
  }
  const ball = new T.Mesh(new T.SphereGeometry(0.27, 40, 20), new T.MeshPhysicalMaterial({ color: '#FFC83D', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }));
  ball.castShadow = true; scene.add(ball);
  cupScene = { scene, camera, cups, ball, at: [], ready: 0, t0: performance.now() };
}
const cupX = i => (i - (cs.n - 1) / 2) * 1.5;
// How far back the camera sits so every cup (and a swap passing in front) fits across the screen
function cupCamDist() {
  const cam = cupScene.camera, half = (cs.n - 1) / 2 * 1.5 + 1.1, hfov = 2 * Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect);
  return Math.max(6.5, half / Math.tan(hfov / 2) / 1.2);
}
const cupAnim = (ms, my, step) => anim3D(cs, my, ms, step);
async function cupsRound() {
  if (!alive(cs)) return;
  cupsPlan();
  const S = cupScene, my = cs.round;
  if (!S) { cs.phase = 'pick'; return; }
  S.at = S.cups.slice(0, cs.n);
  S.cups.forEach((g, i) => { g.visible = i < cs.n; g.position.set(cupX(i), 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); });
  const ballCup = S.at[cs.ball];
  S.ball.position.set(cupX(cs.ball), 0.27, 0);
  cupNote('Watch the ball');
  // Show the ball: its cup lifts, waits, and drops back down with a little squash
  if (!await cupAnim(380, my, k => { ballCup.position.y = 1.5 * ease3D.back(k); ballCup.rotation.z = -0.15 * Math.sin(Math.PI * k); })) return;
  await wait3D(650);
  if (!await cupAnim(260, my, k => { ballCup.position.y = 1.5 * (1 - k * k); })) return;
  if (!await cupAnim(140, my, k => { const s = Math.sin(Math.PI * k); ballCup.scale.set(1 + 0.1 * s, 1 - 0.12 * s, 1 + 0.1 * s); })) return;
  // Shuffle: each pair swaps along arcs, one cup passing in front of the other; the ball travels with its cup
  cs.phase = 'shuffle'; cupNote('Follow it');
  const ms = cupLevel(cs.tier).ms;
  for (const [a, b] of cs.swaps) {
    const A = S.at[a], B = S.at[b], xa = cupX(a), xb = cupX(b), lift = 0.55 + 0.25 * Math.abs(b - a);
    beep(330 + 40 * (b - a), 0.04);
    if (!await cupAnim(ms, my, k => {
      const e = ease3D.inOut(k), arc = Math.sin(Math.PI * k);
      A.position.set(xa + (xb - xa) * e, 0.12 * arc, lift * arc);
      B.position.set(xb + (xa - xb) * e, 0.12 * arc, -lift * arc);
      if (A === ballCup || B === ballCup) S.ball.position.set(ballCup.position.x, 0.27, ballCup.position.z);
    })) return;
    S.at[a] = B; S.at[b] = A;
  }
  cs.phase = 'pick'; S.ready = my;
  cupNote('Tap the cup with the ball');
}
async function cupsReveal(slot, ok, my) {
  const S = cupScene, cup = S.at[slot], hidden = S.at[cs.answer];
  const lift = g => cupAnim(320, my, k => { g.position.y = 1.5 * ease3D.back(k); g.rotation.z = -0.18 * Math.sin(Math.PI * k); });
  if (!await lift(cup)) return;
  if (ok) {
    juiceBurst(...screen3D(S.ball.position.clone().setY(0.6), S.camera), 14);
    await cupAnim(420, my, k => { S.ball.position.y = 0.27 + 1.1 * Math.sin(Math.PI * k); });
  } else {
    await wait3D(200);
    await lift(hidden);
  }
}
function cupsTap(e) {
  if (!cupScene || cs.phase !== 'pick') return;
  const g = pick3D(e, cupScene.camera, cupScene.at);
  if (g) { e.preventDefault(); cupsPick(cupScene.at.indexOf(g)); }
}
registerGame({
  id: 'cups', name: 'Cup Shuffle', skill: 'Speed', colors: ['#FF8A80', '#B3261E'],
  hint: 'Watch which cup hides the ball, follow it while the cups shuffle, then tap it. 60 seconds.',
  art: '<ellipse cx="60" cy="98" rx="50" ry="10" fill="#fff" fill-opacity=".25"/>' +
    [[22, 0], [60, -14], [98, 0]].map(([x, dy]) => '<g transform="translate(' + x + ' ' + dy + ')"><path d="M-16 92l4-40h24l4 40z" fill="#fff"/><rect x="-14" y="72" width="28" height="6" fill="#B3261E" opacity=".35"/></g>').join('') +
    '<circle cx="60" cy="90" r="8" fill="#FFC83D" stroke="#fff" stroke-width="2"/><path d="M30 34q30-22 60 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/>',
  html: '<div class="hunt-wrap" id="cupWrap" data-fx="own"><div class="stage3d" id="cupStage"></div><p class="note3d" id="cupNote">Watch the ball</p></div>',
  start(my) {
    cs = makeRound('cups', MAX_LEVEL, 2);
    cs.round = 0; cs.n = 3; cs.phase = 'load';
    show('cups');
    roundHud(cs);
    open3D(cs, 'cupStage', 'cupNote', () => { if (!cupScene) cupsBuild(); }, () => {
      stage3D('cupStage', cupScene.camera); onTap3D = cupsTap;
      loop3D(cs, cupScene.scene, cupScene.camera, now => { // a slow, gentle sway so the scene feels alive
        const t = (now - cupScene.t0) / 1000, d = cupCamDist();
        cupScene.camera.position.set(Math.sin(t * 0.5) * 0.18, d * 0.66, d); cupScene.camera.lookAt(0, 0.35, 0);
      });
      cupsRound();
    });
    startClock(cs, st => [['Found', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const n = Number(e.key); if (n >= 1 && n <= cs.n) cupsPick(n - 1); }
});
