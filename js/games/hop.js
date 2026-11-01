/* Sky Hop (Speed, 3D): a little blob climbs a tower in the sky. Every step shows a rule (a color, a shape, or
   "not this color"); tap the one platform that matches and the blob hops up to it. A wrong platform crumbles.
   From level 2 the platforms wait only so long (an answer clock). More platforms and trickier rules as you climb.
   Game feel: squash before the jump, an arcing hop, a bounce on landing, the whole tower sliding down as you climb. */
let hs = null, hopScene = null;
const HOP_COLORS = Object.keys(SHAPE_COLORS), HOP_RULES = { color: 'Hop on', shape: 'Hop on a', not: 'Hop on anything but' };
const HOP_LEVELS = [
  { n: 2, rules: ['color'], clock: 0 },
  { n: 3, rules: ['color'], clock: 4.5 },
  { n: 3, rules: ['color', 'shape'], clock: 4 },
  { n: 3, rules: ['color', 'shape', 'not'], clock: 3.6 }
];
function hopLevel(level) {
  if (level <= HOP_LEVELS.length) return HOP_LEVELS[level - 1];
  const d = past(level, HOP_LEVELS.length);
  return { n: Math.min(4, 3 + Math.floor(d / 3)), rules: ['color', 'shape', 'not'], clock: Math.max(1.4, 3.6 - 0.1 * d) };
}
const hopMatch = (rule, o) => rule.type === 'color' ? o.color === rule.v : rule.type === 'shape' ? o.kind === rule.v : o.color !== rule.v;
function hopPlan() {
  const L = hopLevel(hs.tier), type = pickOne(L.rules), others = list => shuffle(list.slice());
  const rule = { type, v: type === 'shape' ? pickOne(SHAPE_KINDS) : pickOne(HOP_COLORS) };
  const opts = [];
  if (type === 'not') { // every platform is that color except one
    const kinds = others(SHAPE_KINDS);
    for (let i = 0; i < L.n - 1; i++) opts.push({ color: rule.v, kind: kinds[i % kinds.length] });
    opts.push({ color: pickOne(HOP_COLORS.filter(c => c !== rule.v)), kind: pickOne(SHAPE_KINDS) });
  } else {
    const key = type === 'color' ? 'color' : 'kind', pool = type === 'color' ? HOP_COLORS : SHAPE_KINDS, rest = others(pool.filter(v => v !== rule.v));
    opts.push(type === 'color' ? { color: rule.v, kind: pickOne(SHAPE_KINDS) } : { color: pickOne(HOP_COLORS), kind: rule.v });
    for (let i = 0; i < L.n - 1; i++) { const o = { color: pickOne(HOP_COLORS), kind: pickOne(SHAPE_KINDS) }; o[key] = rest[i % rest.length]; opts.push(o); }
  }
  hs.round++; hs.rule = rule; hs.opts = shuffle(opts); hs.answer = hs.opts.findIndex(o => hopMatch(rule, o)); hs.phase = 'show';
  $('hopRule').innerHTML = HOP_RULES[type] + ' <span class="pic static">' + (type === 'shape' ? shapeTile(rule.v, '#FFFFFF') : shapeTile('circle', rule.v)) + '</span> <b>' + (type === 'shape' ? rule.v : rule.v) + '</b>';
}
function hopPick(i) {
  if (!alive(hs) || hs.phase !== 'pick') return;
  hs.phase = 'result';
  stopAnswerClock(hs, 'hopWrap');
  const ok = i === hs.answer, my = hs.round;
  if (ok) { right(hs, $('hopWrap')); hs.height++; } else wrong(hs);
  if (hopScene && hopScene.ready === my) hopAnimate(i, ok, my);
  later(hs, ok ? 560 : 900, () => { if (hs.round === my) hopRound(); });
}

/* ---------- 3D ---------- */
function hopShapeTex(kind, color) { // the platform top: its color with a white shape on it
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.fillStyle = SHAPE_COLORS[color]; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#FFFFFF'; x.strokeStyle = '#2B2350'; x.lineWidth = 6; x.beginPath();
  if (kind === 'circle') x.arc(64, 64, 30, 0, 7);
  else if (kind === 'square') x.rect(36, 36, 56, 56);
  else if (kind === 'triangle') { x.moveTo(64, 30); x.lineTo(98, 94); x.lineTo(30, 94); x.closePath(); }
  else { x.moveTo(64, 26); x.lineTo(100, 64); x.lineTo(64, 102); x.lineTo(28, 64); x.closePath(); }
  x.fill(); x.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function hopBuild() {
  const T = THREE, scene = new T.Scene(), camera = new T.PerspectiveCamera(42, 1, 0.1, 80);
  scene.background = new T.Color('#8ED2FF'); scene.fog = new T.Fog('#8ED2FF', 12, 34);
  lights3D(scene, [3, 14, 8], 520);
  const world = new T.Group(); scene.add(world);
  const tower = new T.Mesh(new T.CylinderGeometry(1.05, 1.15, 60, 32), new T.MeshStandardMaterial({ color: '#E7D9C3', roughness: 0.9 }));
  tower.position.set(0, 0, -1.4); tower.receiveShadow = true; tower.castShadow = true; scene.add(tower);
  for (let i = 0; i < 9; i++) { // soft clouds drifting in the distance
    const cl = new T.Mesh(new T.SphereGeometry(1 + Math.random(), 16, 12), new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1 }));
    cl.scale.set(2.2, 0.8, 1); cl.position.set((i % 2 ? 1 : -1) * (6 + Math.random() * 6), -6 + i * 3, -9 - Math.random() * 6); scene.add(cl);
  }
  const blob = new T.Group(), skin = new T.MeshPhysicalMaterial({ color: '#FFC83D', roughness: 0.35, clearcoat: 0.6 });
  const body = new T.Mesh(new T.SphereGeometry(0.36, 32, 20), skin); body.castShadow = true; body.position.y = 0.36; blob.add(body);
  [-1, 1].forEach(s => {
    const eye = new T.Mesh(new T.SphereGeometry(0.1, 16, 12), new T.MeshStandardMaterial({ color: '#FFFFFF' })); eye.position.set(s * 0.13, 0.46, 0.3); blob.add(eye);
    const pupil = new T.Mesh(new T.SphereGeometry(0.05, 12, 8), new T.MeshStandardMaterial({ color: '#2B2350' })); pupil.position.set(s * 0.13, 0.46, 0.39); blob.add(pupil);
    const foot = new T.Mesh(new T.SphereGeometry(0.12, 12, 8), new T.MeshStandardMaterial({ color: '#E0A010' })); foot.scale.set(1, 0.6, 1.3); foot.position.set(s * 0.17, 0.05, 0.08); blob.add(foot);
  });
  world.add(blob);
  hopScene = { scene, camera, world, blob, plat: new T.CylinderGeometry(0.62, 0.62, 0.22, 40), side: new T.MeshStandardMaterial({ color: '#B9A98F', roughness: 0.8 }),
    now: [], next: [], base: null, y: 0, ready: 0, t0: performance.now() };
  hopScene.base = hopPlatform(null); hopScene.base.position.set(0, 0, 0.6); world.add(hopScene.base);
}
function hopPlatform(o) {
  const S = hopScene, tops = o ? new THREE.MeshStandardMaterial({ map: hopShapeTex(o.kind, o.color), roughness: 0.6 }) : new THREE.MeshStandardMaterial({ color: '#F4EBDC', roughness: 0.7 });
  const m = new THREE.Mesh(S.plat, [S.side, tops, S.side]); m.castShadow = true; m.receiveShadow = true; m.position.y = -0.11;
  const g = new THREE.Group(); g.add(m); return g;
}
const hopSpot = (i, n, y) => { const a = (i - (n - 1) / 2) * (n === 4 ? 0.62 : n === 3 ? 0.78 : 1.05); return new THREE.Vector3(Math.sin(a) * 2.25, y, -1.4 + Math.cos(a) * 2.25); };
async function hopRound() {
  if (!alive(hs)) return;
  hopPlan();
  const S = hopScene, my = hs.round, L = hopLevel(hs.tier);
  if (!S) { hs.phase = 'pick'; return; }
  S.next.forEach(p => S.world.remove(p));
  const y = (hs.height + 1) * 1.5;
  S.next = hs.opts.map((o, i) => { const p = hopPlatform(o), v = hopSpot(i, hs.opts.length, y); p.position.copy(v); p.scale.setScalar(0.001); S.world.add(p); return p; });
  if (!await anim3D(hs, my, 300, k => S.next.forEach((p, i) => p.scale.setScalar(Math.max(0.001, ease3D.back(Math.min(1, k * 1.4 - i * 0.12)))))) ) return;
  S.next.forEach(p => p.scale.setScalar(1));
  hs.phase = 'pick'; S.ready = my;
  if (L.clock) answerClock(hs, 'hopWrap', L.clock * 1000, () => hopPick(-1));
}
async function hopAnimate(i, ok, my) {
  const S = hopScene, B = S.blob, from = B.position.clone();
  if (!ok) { // the wrong platform cracks and drops; the blob wobbles where it is
    const p = S.next[i];
    if (p) await anim3D(hs, my, 420, k => { p.position.y -= 0.12 * k; p.rotation.z = 0.5 * k; p.scale.setScalar(1 - 0.6 * k); });
    else await anim3D(hs, my, 300, k => { B.rotation.z = 0.25 * Math.sin(k * Math.PI * 3); });
    return;
  }
  const to = S.next[i].position.clone();
  await anim3D(hs, my, 90, k => B.scale.set(1 + 0.18 * k, 1 - 0.25 * k, 1 + 0.18 * k)); // squash before the jump
  await anim3D(hs, my, 300, k => { B.position.lerpVectors(from, to, k); B.position.y += 1.2 * Math.sin(Math.PI * k); B.scale.set(1 - 0.1 * Math.sin(Math.PI * k), 1 + 0.15 * Math.sin(Math.PI * k), 1); B.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) * 0.4; });
  juiceBurst(...screen3D(to.clone().add(S.world.position), S.camera), 10);
  S.now.forEach(p => S.world.remove(p)); S.now = [S.next[i]]; S.next.splice(i, 1); S.next.forEach(p => S.world.remove(p)); S.next = [];
  if (S.base) { S.world.remove(S.base); S.base = null; }
  await anim3D(hs, my, 160, k => { const s = Math.sin(Math.PI * k); B.scale.set(1 + 0.15 * s, 1 - 0.2 * s, 1 + 0.15 * s); });
}
function hopTap(e) {
  if (!hopScene || hs.phase !== 'pick') return;
  const p = pick3D(e, hopScene.camera, hopScene.next);
  if (p) { e.preventDefault(); hopPick(hopScene.next.indexOf(p)); }
}
registerGame({
  id: 'hop', name: 'Sky Hop', skill: 'Speed', colors: ['#7FD3FF', '#0B5FA5'],
  hint: 'Climb the tower: tap the one platform that matches the rule, and be quick before it crumbles. 60 seconds.',
  art: '<rect x="50" y="10" width="20" height="104" rx="6" fill="#fff" fill-opacity=".5"/>' +
    '<ellipse cx="34" cy="86" rx="16" ry="6" fill="#E5484D" stroke="#fff" stroke-width="2"/><ellipse cx="86" cy="62" rx="16" ry="6" fill="#3B6FF5" stroke="#fff" stroke-width="2"/><ellipse cx="38" cy="38" rx="16" ry="6" fill="#FFC83D" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="86" cy="50" r="10" fill="#FFC83D" stroke="#2B2350" stroke-width="2.5"/><circle cx="83" cy="48" r="2" fill="#2B2350"/><circle cx="89" cy="48" r="2" fill="#2B2350"/>',
  html: '<div class="hunt-wrap" id="hopWrap" data-fx="own"><p class="hop-rule" id="hopRule">Hop on</p><div class="stage3d tall" id="hopStage"></div><p class="note3d" id="hopNote">Tap a platform</p></div>',
  start(my) {
    hs = makeRound('hop', MAX_LEVEL, 3);
    hs.round = 0; hs.height = 0; hs.phase = 'load';
    show('hop');
    roundHud(hs);
    open3D(hs, 'hopStage', 'hopNote', () => { if (!hopScene) hopBuild(); }, () => {
      const S = hopScene;
      S.world.position.y = 0; S.blob.position.set(0, 0, 0.6); S.blob.scale.set(1, 1, 1);
      [...S.now, ...S.next].forEach(p => S.world.remove(p)); S.now = []; S.next = [];
      if (!S.base) { S.base = hopPlatform(null); S.base.position.set(0, 0, 0.6); S.world.add(S.base); }
      stage3D('hopStage', S.camera); onTap3D = hopTap;
      $('hopNote').textContent = 'Tap the platform that matches';
      loop3D(hs, S.scene, S.camera, now => {
        const t = (now - S.t0) / 1000, goal = -hs.height * 1.5;
        S.world.position.y += (goal - S.world.position.y) * 0.12; // the tower slides down as you climb
        S.camera.position.set(Math.sin(t * 0.4) * 0.3, 3.1, 7.4); S.camera.lookAt(0, 1.4, -0.6);
        S.blob.children[0].scale.y = 1 + Math.sin(t * 5) * 0.03; // breathing
      });
      hopRound();
    });
    startClock(hs, st => [['Height', st.height], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const n = Number(e.key); if (n >= 1 && hs.opts && n <= hs.opts.length) hopPick(n - 1); }
});
