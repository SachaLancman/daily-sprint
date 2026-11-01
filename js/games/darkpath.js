/* Dark Path (Memory, 3D): tiles float in the night. A path lights up tile by tile from the green start, then goes dark.
   Tap the tiles in order to walk your little lantern across from memory. A wrong tile drops away.
   Levels: bigger boards (4x4 to 6x6), longer paths (4 to 12 tiles), a faster light show.
   Game feel: tiles glow on like lamps, the lantern hops from tile to tile, a wrong tile falls into the dark. */
let dp = null, dpScene = null;
const DP_LEVELS = [
  { n: 4, len: 4, ms: 460 },
  { n: 4, len: 5, ms: 430 },
  { n: 5, len: 6, ms: 400 },
  { n: 5, len: 7, ms: 380 }
];
function dpLevel(level) {
  if (level <= DP_LEVELS.length) return DP_LEVELS[level - 1];
  const d = past(level, DP_LEVELS.length);
  return { n: Math.min(6, 5 + Math.floor(d / 4)), len: Math.min(12, 7 + Math.floor(d / 2)), ms: Math.max(220, 380 - 10 * d) };
}
// A path from the bottom row going up, left or right (never back down), never crossing itself
function dpPlan() {
  const L = dpLevel(dp.tier), n = L.n;
  let path;
  for (let tries = 0; tries < 200; tries++) {
    path = [[n - 1, r(0, n - 1)]];
    while (path.length <= L.len) {
      const [rr, cc] = path[path.length - 1], steps = [[rr - 1, cc], [rr, cc - 1], [rr, cc + 1]].filter(([a, b]) => a >= 0 && b >= 0 && b < n && !path.some(p => p[0] === a && p[1] === b));
      if (!steps.length) break;
      path.push(pickOne(steps));
    }
    if (path.length === L.len + 1) break;
  }
  dp.round++; dp.n = n; dp.path = path.map(([a, b]) => a * n + b); dp.pos = 1; dp.phase = 'show';
}
const dpNote = t => { $('dpNote').textContent = t; };
function dpTap(i) {
  if (!alive(dp) || dp.phase !== 'walk') return;
  const my = dp.round;
  if (i === dp.path[dp.pos]) {
    dp.pos++; beep(500 + dp.pos * 35, 0.05);
    if (dpScene && dpScene.ready === my) dpHop(i, my);
    if (dp.pos < dp.path.length) return;
    dp.phase = 'result'; right(dp, $('dpWrap'), 3 * (dp.path.length - 1) * dp.tier); dpNote('You made it across');
    if (dpScene && dpScene.ready === my) juiceBurst(...screen3D(dpScene.tiles[i].position.clone().setY(0.6), dpScene.camera), 16);
    later(dp, 1000, () => { if (dp.round === my) dpRound(); });
  } else {
    dp.phase = 'result'; wrong(dp); dpNote('The path went another way');
    if (dpScene && dpScene.ready === my) dpFall(i, my);
    later(dp, 1700, () => { if (dp.round === my) dpRound(); });
  }
}

/* ---------- 3D ---------- */
function dpBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(36, 1, 0.1, 80);
  scene.background = new T.Color('#0C0F24'); scene.fog = new T.Fog('#0C0F24', 12, 30);
  scene.add(new T.HemisphereLight('#B9C4FF', '#0C0F24', 0.55));
  const moon = new T.DirectionalLight('#CFD8FF', 1.1); moon.position.set(-3, 9, 4); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(moon);
  const stars = new T.BufferGeometry(), pts = [];
  for (let i = 0; i < 300; i++) pts.push((Math.random() - 0.5) * 60, (Math.random() - 0.3) * 30, -10 - Math.random() * 25);
  stars.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: '#FFFFFF', size: 0.12 })));
  const orb = new T.Group(), glow = new T.PointLight('#FFD27A', 6, 4, 2);
  const body = new T.Mesh(new T.SphereGeometry(0.28, 32, 20), new T.MeshStandardMaterial({ color: '#FFE9A8', emissive: '#FFB020', emissiveIntensity: 0.9, roughness: 0.4 }));
  body.position.y = 0.3; body.castShadow = true; orb.add(body); glow.position.y = 0.5; orb.add(glow);
  [-1, 1].forEach(s => { const e = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), new T.MeshBasicMaterial({ color: '#2B2350' })); e.position.set(s * 0.1, 0.36, 0.25); orb.add(e); });
  scene.add(orb);
  dpScene = { scene, camera, orb, tile: new T.BoxGeometry(0.9, 0.26, 0.9), tiles: [], ready: 0, t0: performance.now() };
}
const dpXZ = i => [(i % dp.n - (dp.n - 1) / 2) * 1.05, (Math.floor(i / dp.n) - (dp.n - 1) / 2) * 1.05];
function dpLight(m, color, k) { m.material.emissive.set(color); m.material.emissiveIntensity = k; }
async function dpRound() {
  if (!alive(dp)) return;
  dpPlan();
  const S = dpScene, my = dp.round, L = dpLevel(dp.tier), n = dp.n;
  if (!S) { dp.phase = 'walk'; return; }
  S.tiles.forEach(t => S.scene.remove(t));
  S.tiles = [];
  for (let i = 0; i < n * n; i++) {
    const m = new THREE.Mesh(S.tile, new THREE.MeshStandardMaterial({ color: '#3B4268', roughness: 0.6, emissive: '#000000' }));
    const [x, z] = dpXZ(i); m.position.set(x, -0.13, z); m.receiveShadow = true; m.castShadow = true; m.userData.bob = Math.random() * 6;
    S.scene.add(m); S.tiles.push(m);
  }
  const start = S.tiles[dp.path[0]]; dpLight(start, '#3DBE6B', 0.8); start.material.color.set('#3DBE6B');
  S.orb.position.set(start.position.x, 0, start.position.z); S.orb.visible = true; S.orb.scale.setScalar(1);
  const d = n * 1.05; S.camera.position.set(0, d * 1.55, d * 1.18); S.camera.lookAt(0, -0.3, 0.25);
  dpNote('Watch the path');
  await wait3D(450);
  // The path lights up tile by tile, stays lit for a moment, then fades into the dark
  for (let k = 1; k < dp.path.length; k++) {
    const t = S.tiles[dp.path[k]];
    if (!await anim3D(dp, my, L.ms, e => dpLight(t, '#FFC83D', 1.1 * ease3D.out(e)))) return;
    beep(420 + k * 30, 0.03);
  }
  await wait3D(350);
  if (!await anim3D(dp, my, 380, e => dp.path.slice(1).forEach(i => dpLight(S.tiles[i], '#FFC83D', 1.1 * (1 - e))))) return;
  dp.phase = 'walk'; S.ready = my;
  dpNote('Walk the path from memory');
}
function dpHop(i, my) {
  const S = dpScene, from = S.orb.position.clone(), t = S.tiles[i];
  dpLight(t, '#FFC83D', 0.7);
  anim3D(dp, my, 230, k => { S.orb.position.set(from.x + (t.position.x - from.x) * k, Math.sin(Math.PI * k) * 0.7, from.z + (t.position.z - from.z) * k); });
}
async function dpFall(i, my) {
  const S = dpScene, t = S.tiles[i];
  t.material.color.set('#B3261E');
  await anim3D(dp, my, 500, k => { t.position.y = -0.13 - 4 * k * k; t.rotation.x = 1.2 * k; });
  dp.path.slice(dp.pos).forEach(p => dpLight(S.tiles[p], '#FFC83D', 0.9)); // show where it really went
}
function dpTapEvent(e) {
  if (!dpScene || dp.phase !== 'walk') return;
  const t = pick3D(e, dpScene.camera, dpScene.tiles);
  if (t) { e.preventDefault(); dpTap(dpScene.tiles.indexOf(t)); }
}
registerGame({
  id: 'darkpath', name: 'Dark Path', skill: 'Memory', colors: ['#8E9BFF', '#2B2F7A'],
  hint: 'A path lights up across the tiles, then goes dark. Tap the tiles in order to walk it from memory. 60 seconds.',
  art: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<rect x="' + (22 + (i % 3) * 28) + '" y="' + (26 + Math.floor(i / 3) * 28) + '" width="22" height="22" rx="5" fill="' + ([7, 4, 5, 2].includes(i) ? '#FFC83D' : '#fff') + '" fill-opacity="' + ([7, 4, 5, 2].includes(i) ? 1 : 0.35) + '"/>').join('') +
    '<circle cx="47" cy="93" r="8" fill="#FFE9A8" stroke="#2B2350" stroke-width="2.5"/>',
  html: '<div class="hunt-wrap" id="dpWrap" data-fx="own"><div class="stage3d" id="dpStage"></div><p class="note3d" id="dpNote">Watch the path</p></div>',
  start(my) {
    dp = makeRound('darkpath', MAX_LEVEL, 2);
    dp.round = 0; dp.n = 4; dp.phase = 'load';
    show('darkpath');
    roundHud(dp);
    open3D(dp, 'dpStage', 'dpNote', () => { if (!dpScene) dpBuild(); }, () => {
      stage3D('dpStage', dpScene.camera); onTap3D = dpTapEvent;
      loop3D(dp, dpScene.scene, dpScene.camera, now => {
        const t = (now - dpScene.t0) / 1000;
        dpScene.tiles.forEach(m => { if (m.position.y > -0.5) m.position.y = -0.13 + Math.sin(t * 1.2 + m.userData.bob) * 0.03; }); // tiles float gently
      });
      dpRound();
    });
    startClock(dp, st => [['Paths', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  }
});
