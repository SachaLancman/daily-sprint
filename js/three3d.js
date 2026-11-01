/* Shared toolkit for the 3D games (Cup Shuffle, Shape Spin, Sky Hop, Letter Dice, Dark Path, Block Towers).
   three.js (js/vendor/three.min.js) loads the first time a 3D game opens. There is ONE WebGL renderer for the whole app:
   phones only allow a few 3D canvases, so the same canvas moves into whichever game's stage is open.
   Each game keeps its own scene and camera, sets onTap3D for taps, and checks its own round token in anim3D. */
let gl3 = null, onTap3D = null;
function load3D() {
  if (window.THREE) return Promise.resolve();
  return load3D.p = load3D.p || new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/three.min.js'; s.onload = res; s.onerror = () => { load3D.p = null; rej(); }; document.head.appendChild(s); });
}
// Put the renderer into a stage element, sized to it, and return it
function stage3D(stageId, camera) {
  if (!gl3) {
    gl3 = new THREE.WebGLRenderer({ antialias: true });
    gl3.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    gl3.shadowMap.enabled = true; gl3.shadowMap.type = THREE.PCFSoftShadowMap;
    gl3.outputColorSpace = THREE.SRGBColorSpace;
    gl3.domElement.style.touchAction = 'none';
    gl3.domElement.addEventListener('pointerdown', e => { if (onTap3D) onTap3D(e); });
  }
  const host = $(stageId), w = host.clientWidth || 328, h = host.clientHeight || 300;
  if (gl3.domElement.parentNode !== host) host.appendChild(gl3.domElement);
  gl3.setSize(w, h, false);
  if (camera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  return gl3;
}
// The house lighting: warm spotlight with soft shadows, sky light, cool fill from the front
function lights3D(scene, spotAt = [0, 9, 3], power = 260) {
  scene.add(new THREE.HemisphereLight('#FFF4E0', '#20183F', 0.9));
  const spot = new THREE.SpotLight('#FFF1D6', power, 0, 0.62, 0.55, 2);
  spot.position.set(...spotAt); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004;
  scene.add(spot); scene.add(spot.target);
  const fill = new THREE.DirectionalLight('#9DB6FF', 0.7); fill.position.set(-4, 3, 6); scene.add(fill);
  return spot;
}
// What a tap hit: the first object (or its tagged parent) among `objects`
function pick3D(e, camera, objects) {
  const box = gl3.domElement.getBoundingClientRect(), ray = pick3D.ray = pick3D.ray || new THREE.Raycaster();
  ray.setFromCamera({ x: (e.clientX - box.left) / box.width * 2 - 1, y: -((e.clientY - box.top) / box.height) * 2 + 1 }, camera);
  const hit = ray.intersectObjects(objects, true)[0];
  if (!hit) return null;
  let o = hit.object; while (o && !objects.includes(o)) o = o.parent;
  return o;
}
// Animate over ms; resolves false early if the game was left or a new round started (st.round changed)
function anim3D(st, my, ms, step) {
  return new Promise(res => {
    const t0 = performance.now();
    const f = now => {
      if (!alive(st) || st.round !== my) return res(false);
      const k = Math.min(1, (now - t0) / ms); step(k);
      if (k < 1) requestAnimationFrame(f); else res(true);
    };
    requestAnimationFrame(f);
  });
}
const wait3D = ms => new Promise(res => setTimeout(res, ms));
const ease3D = { inOut: k => 0.5 - 0.5 * Math.cos(Math.PI * k), out: k => 1 - (1 - k) * (1 - k), back: k => { const c = 1.70158, m = k - 1; return 1 + (c + 1) * m * m * m + c * m * m; } };
// Screen position of a 3D point, for sparks (juiceBurst)
function screen3D(v, camera) {
  const p = v.clone().project(camera), box = gl3.domElement.getBoundingClientRect();
  return [box.left + (p.x + 1) / 2 * box.width, box.top + (1 - p.y) / 2 * box.height];
}
// A square texture with a big letter, number or symbol, for dice, blocks and platforms
function label3D(text, bg, ink = '#2B2350', size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, size, size);
  x.fillStyle = ink; x.font = '800 ' + Math.round(size * (text.length > 2 ? 0.42 : 0.6)) + 'px "Bricolage Grotesque", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, size / 2, size * 0.54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// The render loop for the open 3D game: draws every frame while that game is on screen
function loop3D(st, scene, camera, each) {
  const f = now => { if (!alive(st)) return; if (each) each(now); gl3.render(scene, camera); requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
// Start a 3D game: load three.js, build the scene once (build returns it), then go
function open3D(st, stageId, noteId, build, go) {
  $(noteId).textContent = 'Loading the 3D scene';
  load3D().then(() => {
    if (!alive(st)) return;
    try { build(); } catch (err) { $(noteId).textContent = 'This phone cannot show 3D games'; return; }
    go();
  }).catch(() => { $(noteId).textContent = 'Could not load the 3D game'; });
}
// How far back a camera must sit so a row `half` units either side of the middle fits across the screen
function fit3D(camera, half) { return half / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect); }
