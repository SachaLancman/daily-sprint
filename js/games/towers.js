/* Block Towers (Math, 3D): towers of numbered blocks drop in. Tap the tower whose numbers add up to the most,
   which is often not the tallest one. Levels: more blocks, bigger numbers, a third tower, then red minus blocks
   and an answer clock. Game feel: blocks drop in one by one with a bounce; the winner tower jumps and sparkles,
   a wrong pick wobbles. */
let tw3 = null, twScene = null;
const TOWER_LEVELS = [
  { towers: 2, blocks: [2, 3], max: 9, minus: 0 },
  { towers: 2, blocks: [2, 4], max: 9, minus: 0 },
  { towers: 2, blocks: [3, 5], max: 20, minus: 0 },
  { towers: 3, blocks: [2, 4], max: 20, minus: 0 }
];
function towerLevel(level) {
  if (level <= TOWER_LEVELS.length) return TOWER_LEVELS[level - 1];
  const d = past(level, TOWER_LEVELS.length);
  return { towers: 3, blocks: [3, Math.min(6, 4 + Math.floor(d / 3))], max: Math.min(60, 20 + 4 * d), minus: Math.min(0.35, 0.15 + 0.02 * d), clock: Math.max(3, 7 - 0.15 * d) };
}
const towerSum = t => t.reduce((s, v) => s + v, 0);
function towerPlan() {
  const L = towerLevel(tw3.tier);
  let towers;
  for (let tries = 0; tries < 200; tries++) {
    towers = Array.from({ length: L.towers }, () => Array.from({ length: r(L.blocks[0], L.blocks[1]) }, () => (Math.random() < L.minus ? -1 : 1) * r(1, L.max)));
    const sums = towers.map(towerSum), best = Math.max(...sums);
    if (sums.filter(s => s === best).length !== 1) continue; // exactly one winner
    const tallest = towers.reduce((a, t, i) => t.length > towers[a].length ? i : a, 0);
    if (tries < 150 && L.towers > 1 && sums.indexOf(best) === tallest && Math.random() < 0.55) continue; // often the tallest is NOT the biggest
    break;
  }
  tw3.round++; tw3.towers = towers; tw3.answer = towers.map(towerSum).indexOf(Math.max(...towers.map(towerSum))); tw3.phase = 'show';
}
const towerNote = t => { $('towerNote').textContent = t; };
function towerPick(i) {
  if (!alive(tw3) || tw3.phase !== 'pick') return;
  tw3.phase = 'result'; stopAnswerClock(tw3, 'towerWrap');
  const ok = i === tw3.answer, my = tw3.round, sums = tw3.towers.map(towerSum);
  if (ok) right(tw3, $('towerWrap')); else wrong(tw3);
  towerNote(sums.join('  ·  '));
  if (twScene && twScene.ready === my) towerResult(i, ok, my);
  later(tw3, ok ? 900 : 1500, () => { if (tw3.round === my) towerRound(); });
}

/* ---------- 3D ---------- */
const TOWER_TINTS = ['#7FD1FF', '#FFB36B', '#A98BFF'];
function towerBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, 0.1, 80);
  scene.background = new T.Color('#FFE8C7'); scene.fog = new T.Fog('#FFE8C7', 16, 34);
  lights3D(scene, [3, 12, 7], 420);
  const ground = new T.Mesh(new T.CylinderGeometry(7, 7.4, 0.6, 64), new T.MeshStandardMaterial({ color: '#7BC96F', roughness: 0.9 }));
  ground.position.y = -0.3; ground.receiveShadow = true; scene.add(ground);
  twScene = { scene, camera, block: new T.BoxGeometry(1.15, 0.72, 1.15), mats: {}, groups: [], ready: 0, t0: performance.now() };
}
function towerMat(v, tint) { // the number on the four sides, white top and bottom; minus blocks are red
  const S = twScene, key = v + tint;
  if (!S.mats[key]) {
    const face = new THREE.MeshPhysicalMaterial({ map: label3D(v < 0 ? '−' + -v : String(v), v < 0 ? '#E5484D' : tint, v < 0 ? '#FFFFFF' : '#2B2350'), roughness: 0.45, clearcoat: 0.4 });
    const plain = new THREE.MeshPhysicalMaterial({ color: v < 0 ? '#E5484D' : tint, roughness: 0.45, clearcoat: 0.4 });
    S.mats[key] = [face, face, plain, plain, face, face];
  }
  return S.mats[key];
}
async function towerRound() {
  if (!alive(tw3)) return;
  towerPlan();
  const S = twScene, my = tw3.round, L = towerLevel(tw3.tier), n = tw3.towers.length;
  if (!S) { tw3.phase = 'pick'; return; }
  S.groups.forEach(g => S.scene.remove(g));
  S.groups = tw3.towers.map((t, i) => {
    const g = new THREE.Group(); g.position.set((i - (n - 1) / 2) * (n === 3 ? 2.1 : 2.6), 0, 0);
    t.forEach((v, k) => { const b = new THREE.Mesh(S.block, towerMat(v, TOWER_TINTS[i])); b.castShadow = true; b.receiveShadow = true; b.position.y = 30; b.userData.k = k; g.add(b); });
    S.scene.add(g); return g;
  });
  const tallest = Math.max(...tw3.towers.map(t => t.length)), d = 7 + tallest * 0.55 + (n === 3 ? 1.2 : 0);
  S.camera.position.set(0, 1.2 + tallest * 0.45, d); S.camera.lookAt(0, tallest * 0.33, 0);
  towerNote('Which tower adds up to the most?');
  // Blocks drop in, one row at a time across the towers, each with a little bounce
  const total = Math.max(...tw3.towers.map(t => t.length)), step = 130;
  if (!await anim3D(tw3, my, total * step + 380, ms => {
    const now = ms * (total * step + 380);
    S.groups.forEach(g => g.children.forEach(b => {
      const k = Math.min(1, Math.max(0, (now - b.userData.k * step) / 380)), rest = 0.36 + b.userData.k * 0.74;
      b.position.y = rest + (1 - k) * (1 - k) * 6 + Math.abs(Math.sin(k * Math.PI * 2)) * (1 - k) * 0.5;
    }));
  })) return;
  tw3.phase = 'pick'; S.ready = my;
  if (L.clock) answerClock(tw3, 'towerWrap', L.clock * 1000, () => towerPick(-1));
}
async function towerResult(i, ok, my) {
  const S = twScene, win = S.groups[tw3.answer], picked = S.groups[i];
  if (ok) {
    juiceBurst(...screen3D(new THREE.Vector3(win.position.x, win.children.length * 0.74 + 0.5, 0), S.camera), 16);
    await anim3D(tw3, my, 420, k => { win.position.y = 0.6 * Math.sin(Math.PI * k); });
  } else {
    if (picked) await anim3D(tw3, my, 420, k => { picked.rotation.z = 0.12 * Math.sin(k * Math.PI * 4) * (1 - k); });
    await anim3D(tw3, my, 380, k => { win.position.y = 0.45 * Math.sin(Math.PI * k); });
  }
}
function towerTap(e) {
  if (!twScene || tw3.phase !== 'pick') return;
  const g = pick3D(e, twScene.camera, twScene.groups);
  if (g) { e.preventDefault(); towerPick(twScene.groups.indexOf(g)); }
}
registerGame({
  id: 'towers', name: 'Block Towers', skill: 'Math', colors: ['#FFC27A', '#A0480B'],
  hint: 'Tap the tower whose blocks add up to the most. The tallest tower is not always the biggest! 60 seconds.',
  art: [[24, [3, 4, 2]], [64, [9, 8]]].map(([x, nums]) => nums.map((v, k) => '<rect x="' + x + '" y="' + (90 - k * 22) + '" width="32" height="20" rx="4" fill="#fff" fill-opacity="' + (x > 40 ? 1 : 0.6) + '"/><text x="' + (x + 16) + '" y="' + (105 - k * 22) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="14" fill="#A0480B">' + v + '</text>').join('')).join(''),
  html: '<div class="hunt-wrap" id="towerWrap" data-fx="own"><div class="stage3d" id="towerStage"></div><p class="note3d" id="towerNote">Which tower adds up to the most?</p></div>',
  start(my) {
    tw3 = makeRound('towers', MAX_LEVEL, 3);
    tw3.round = 0; tw3.phase = 'load';
    show('towers');
    roundHud(tw3);
    open3D(tw3, 'towerStage', 'towerNote', () => { if (!twScene) towerBuild(); }, () => {
      stage3D('towerStage', twScene.camera); onTap3D = towerTap;
      loop3D(tw3, twScene.scene, twScene.camera);
      towerRound();
    });
    startClock(tw3, st => [['Correct', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const k = Number(e.key); if (k >= 1 && tw3.towers && k <= tw3.towers.length) towerPick(k - 1); }
});
