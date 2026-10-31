/* Number Defense (Math): little monsters march down toward the castle, each holding a sum.
   Tap the answer to zap a monster with lightning before it reaches the wall.
   Levels bring bigger numbers, minus and times, faster monsters, more at once, and from level 4 a boss
   with a two-step sum every 10 monsters. Drawn on a canvas with its own game loop (defTick).
   Game feel: monsters drop in with a bounce and waddle; a zap freezes time for a blink (hit-stop), flashes the
   monster white and bursts it into confetti; a monster reaching the wall shakes the screen and flashes the wall. */
let df = null;
const DEF_W = 328, DEF_H = 380, DEF_WALL = 300, DEF_LANES = [66, 164, 262];
const DEF_COLORS = ['#7BD389', '#FF9A55', '#A57BFF', '#56C8FA', '#FF6FA8', '#FFC83D'];
const DEF_LEVELS = [
  { ops: '+', max: 9, speed: 20, every: 2600, count: 2 },
  { ops: '+', max: 20, speed: 24, every: 2400, count: 3 },
  { ops: '+-', max: 20, speed: 28, every: 2200, count: 3 },
  { ops: '+-', max: 50, speed: 30, every: 2000, count: 3, boss: true },
  { ops: '+-x', max: 50, speed: 32, every: 2000, count: 4, boss: true, times: 5 }
];
// Past level 5: bigger numbers and times tables, faster monsters, closer together.
function defLevel(level) {
  if (level <= DEF_LEVELS.length) return DEF_LEVELS[level - 1];
  const d = past(level, DEF_LEVELS.length);
  return { ops: '+-x', max: Math.min(200, 50 + 10 * d), speed: Math.min(70, 32 + 2 * d), every: Math.max(1000, 2000 - 50 * d), count: 4, boss: true, times: Math.min(12, 6 + Math.floor(d / 2)) };
}
function defSum(L, boss) {
  const op = pickOne([...L.ops]), t = L.times || 5;
  let text, ans;
  if (op === 'x') { const a = r(2, t), b = r(2, Math.min(t, 9)); text = a + ' × ' + b; ans = a * b; }
  else if (op === '-') { const a = r(Math.max(4, Math.floor(L.max / 4)), L.max), b = r(1, a - 1); text = a + ' − ' + b; ans = a - b; }
  else { const a = r(1, Math.max(1, L.max - 1)), b = r(1, Math.max(1, L.max - a)); text = a + ' + ' + b; ans = a + b; }
  if (boss) { const c = r(2, 9); text += ' + ' + c; ans += c; }
  return { text, ans };
}
const easeOutBack = k => { const c = 1.70158, m = k - 1; return 1 + (c + 1) * m * m * m + c * m * m; };

function defSpawn() {
  const L = defLevel(df.tier), live = df.mons.filter(m => !m.dying);
  const boss = L.boss && df.spawned > 0 && df.spawned % 10 === 9;
  let s = defSum(L, boss);
  for (let n = 0; n < 12 && live.some(m => m.ans === s.ans); n++) s = defSum(L, boss); // every monster on screen has its own answer
  const free = DEF_LANES.filter(x => !live.some(m => m.x === x && m.y < 70));
  const m = { x: pickOne(free.length ? free : DEF_LANES), y: -8, r: boss ? 30 : 22, boss, color: boss ? '#E5484D' : pickOne(DEF_COLORS), text: s.text, ans: s.ans,
    seed: Math.random() * 6, born: df.t, blink: df.t + 1 + Math.random() * 3, hit: 0, dying: 0 };
  df.mons.push(m); df.spawned++;
  defPad();
  return m;
}
// Four answer buttons: the answer of every monster on screen, plus look-alike decoys. Buttons keep their place while still needed.
function defPad() {
  const need = df.mons.filter(m => !m.dying).map(m => m.ans), slots = df.pad.slice(0, 4);
  while (slots.length < 4) slots.push(null);
  const keep = slots.map(v => (v !== null && need.includes(v)) ? v : null);
  need.filter(a => !keep.includes(a)).forEach(a => { const i = keep.indexOf(null); if (i >= 0) keep[i] = a; });
  for (let i = 0; i < 4; i++) if (keep[i] === null) {
    const base = need.length ? pickOne(need) : r(2, 20);
    let v = slots[i];
    if (v === null || need.includes(v) || keep.includes(v)) { let tries = 0; do { v = Math.max(0, base + pickOne([-10, -2, -1, 1, 2, 10])); } while (keep.includes(v) && ++tries < 20); }
    keep[i] = v;
  }
  df.pad = keep;
  [...$('defPad').children].forEach((b, i) => { if (b.dataset.v !== String(keep[i])) { b.dataset.v = keep[i]; b.textContent = keep[i]; } });
}
function defTap(btn) {
  if (!alive(df)) return;
  const v = Number(btn.dataset.v), target = df.mons.filter(m => !m.dying && m.ans === v).sort((a, b) => b.y - a.y)[0];
  if (!target) { df.fizzle = 0.25; wrong(df); return; }
  target.dying = 0.001; target.hit = 0.09;
  df.bolts.push({ x: target.x, y: target.y, life: 0.16 });
  df.freezeUntil = performance.now() + (target.boss ? 130 : 60);   // hit-stop
  df.trauma = Math.min(1, df.trauma + (target.boss ? 0.55 : 0.18));
  df.glow = 1;
  defBurst(target.x, target.y, target.color, target.boss ? 30 : 14);
  right(df, $('defWrap'), (target.boss ? 30 : 10) * df.tier);
  defPad();
}
function defBurst(x, y, color, n) {
  if (reduced) return;
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 140;
    df.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.5 + Math.random() * 0.3, size: 3 + Math.random() * 4, color: k % 3 ? color : pickOne(['#FFC83D', '#FFFFFF', '#56C8FA']), sq: k % 2 });
  }
}
function defTick(now) {
  if (!alive(df)) return;
  const dt = df.last ? Math.max(0, Math.min(0.05, (now - df.last) / 1000)) : 0, L = defLevel(df.tier); // never backwards, never a big jump
  df.last = now;
  if (now >= df.freezeUntil) {
    df.t += dt;
    const live = df.mons.filter(m => !m.dying);
    if (!live.length) df.spawnIn = Math.min(df.spawnIn, 400);
    df.spawnIn -= dt * 1000;
    if (df.spawnIn <= 0 && live.length < L.count) { defSpawn(); df.spawnIn = L.every; }
    for (const m of df.mons.slice()) {
      if (m.dying) { m.dying += dt; if (m.dying > 0.22) df.mons.splice(df.mons.indexOf(m), 1); continue; }
      m.y += L.speed * (m.boss ? 0.7 : 1) * dt;
      if (m.y + m.r >= DEF_WALL) { // it reached the castle
        df.mons.splice(df.mons.indexOf(m), 1);
        df.trauma = Math.min(1, df.trauma + 0.6); df.wallFlash = 0.35;
        defBurst(m.x, DEF_WALL - 6, '#8A94A8', 12);
        wrong(df); defPad();
      }
    }
    for (const p of df.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt; p.life -= dt; }
    df.parts = df.parts.filter(p => p.life > 0);
    for (const b of df.bolts) b.life -= dt;
    df.bolts = df.bolts.filter(b => b.life > 0);
    df.mons.forEach(m => { if (m.hit > 0) m.hit -= dt; });
  }
  df.trauma = Math.max(0, df.trauma - 1.4 * dt);
  df.wallFlash = Math.max(0, df.wallFlash - dt); df.fizzle = Math.max(0, df.fizzle - dt); df.glow = Math.max(0, df.glow - 2.5 * dt);
  defDraw();
  requestAnimationFrame(defTick);
}

/* ---------- Drawing ---------- */
function defScene(c) {
  if (df.bg && df.bg.complete && df.bg.naturalWidth) { // painted background, when there is one
    const s = Math.max(DEF_W / df.bg.naturalWidth, DEF_H / df.bg.naturalHeight), w = df.bg.naturalWidth * s, h = df.bg.naturalHeight * s;
    c.drawImage(df.bg, (DEF_W - w) / 2, (DEF_H - h) / 2, w, h);
  } else { // drawn in code until the picture has loaded (or if it is missing)
    const sky = c.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, '#9ED8FF'); sky.addColorStop(1, '#DDF2FF');
    c.fillStyle = sky; c.fillRect(0, 0, DEF_W, DEF_H);
    c.fillStyle = '#FFFFFF'; [[60, 30, 1], [250, 50, .8]].forEach(([x, y, s]) => { c.beginPath(); c.ellipse(x, y, 26 * s, 10 * s, 0, 0, 7); c.ellipse(x + 16 * s, y - 6 * s, 16 * s, 10 * s, 0, 0, 7); c.fill(); });
    c.fillStyle = '#8FD694'; c.beginPath(); c.moveTo(0, 96); c.quadraticCurveTo(90, 60, 170, 92); c.quadraticCurveTo(250, 120, DEF_W, 84); c.lineTo(DEF_W, DEF_H); c.lineTo(0, DEF_H); c.fill();
    c.fillStyle = '#7CC985'; c.beginPath(); c.moveTo(0, 140); c.quadraticCurveTo(160, 110, DEF_W, 150); c.lineTo(DEF_W, DEF_H); c.lineTo(0, DEF_H); c.fill();
  }
  // Three dirt paths from the hills to the wall, fading in at the far end
  DEF_LANES.forEach(x => {
    const g = c.createLinearGradient(0, 120, 0, 190); g.addColorStop(0, 'rgba(236,206,150,0)'); g.addColorStop(1, 'rgba(236,206,150,.8)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 9, 120); c.lineTo(x + 9, 120); c.lineTo(x + 26, DEF_WALL); c.lineTo(x - 26, DEF_WALL); c.fill();
  });
}
function defCastle(c) {
  const y = DEF_WALL;
  c.fillStyle = '#D9CBB8'; c.fillRect(0, y, DEF_W, DEF_H - y);
  c.fillStyle = '#C6B49D'; for (let row = 0; row < 5; row++) for (let i = -1; i < 12; i++) c.fillRect(i * 32 + (row % 2) * 16 + 2, y + 10 + row * 16, 28, 2);
  c.fillStyle = '#D9CBB8'; for (let i = 0; i < 11; i++) c.fillRect(i * 32 + 4, y - 12, 18, 14); // battlements
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, y + 1.5); c.lineTo(DEF_W, y + 1.5); c.stroke();
  if (df.wallFlash) { c.fillStyle = 'rgba(229,72,77,' + df.wallFlash * 1.6 + ')'; c.fillRect(0, y - 12, DEF_W, DEF_H - y + 12); }
  // the gate tower with its crystal
  const tx = 164;
  c.fillStyle = '#E8DCCB'; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); c.roundRect(tx - 34, y - 26, 68, 90, 10); c.fill(); c.stroke();
  c.fillStyle = '#8B5A2B'; c.beginPath(); c.roundRect(tx - 14, y + 26, 28, 40, [14, 14, 0, 0]); c.fill(); c.stroke();
  const pulse = 0.5 + 0.5 * Math.sin(df.t * 3);
  c.fillStyle = 'rgba(127,209,255,' + (0.25 + 0.25 * pulse + 0.5 * df.glow) + ')'; c.beginPath(); c.arc(tx, y - 4, 20 + 10 * df.glow, 0, 7); c.fill();
  c.fillStyle = df.fizzle ? '#A9B3C2' : '#7FD1FF';
  c.beginPath(); c.moveTo(tx, y - 20); c.lineTo(tx + 11, y - 4); c.lineTo(tx, y + 12); c.lineTo(tx - 11, y - 4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx - 4, y - 10); c.lineTo(tx - 1, y - 14); c.stroke();
}
function defMonster(c, m) {
  const age = df.t - m.born, drop = Math.min(1, age / 0.35), grow = reduced ? 1 : easeOutBack(drop);
  const wob = Math.sin(df.t * 9 + m.seed), sq = 1 + wob * 0.05, pop = m.dying ? 1 + m.dying * 2.2 : 1;
  c.save();
  c.translate(m.x, m.y + (m.dying ? 0 : Math.abs(wob) * -3));
  c.globalAlpha = m.dying ? Math.max(0, 1 - m.dying / 0.22) : 1;
  c.scale(grow * sq * pop, grow * (2 - sq) * pop);
  const R = m.r;
  c.strokeStyle = INK; c.lineWidth = 3;
  // feet, waddling
  c.fillStyle = INK; c.beginPath(); c.ellipse(-R * 0.45, R * 0.92 + wob * 2, R * 0.28, R * 0.16, 0, 0, 7); c.ellipse(R * 0.45, R * 0.92 - wob * 2, R * 0.28, R * 0.16, 0, 0, 7); c.fill();
  // body
  c.fillStyle = m.hit > 0 ? '#FFFFFF' : m.color; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.stroke();
  if (m.boss) { c.fillStyle = '#FFC83D'; c.beginPath(); c.moveTo(-R * .5, -R * .8); c.lineTo(-R * .3, -R * 1.25); c.lineTo(0, -R * .95); c.lineTo(R * .3, -R * 1.25); c.lineTo(R * .5, -R * .8); c.closePath(); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-R * 0.35, -R * 0.45, R * 0.28, R * 0.16, -0.5, 0, 7); c.fill();
  // eyes look at the castle, and blink now and then
  const blink = df.t > m.blink && df.t < m.blink + 0.12;
  if (df.t > m.blink + 0.12) m.blink = df.t + 2 + Math.random() * 3;
  [-1, 1].forEach(s => {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s * R * 0.36, -R * 0.12, R * 0.26, blink ? R * 0.04 : R * 0.3, 0, 0, 7); c.fill(); c.lineWidth = 2; c.stroke();
    if (!blink) { c.fillStyle = INK; c.beginPath(); c.arc(s * R * 0.32, -R * 0.02, R * 0.12, 0, 7); c.fill(); }
  });
  c.lineWidth = 2.5; c.beginPath(); c.arc(0, R * 0.3, R * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.restore();
  if (m.dying) return;
  // the sum on a placard the monster carries in front of it (always on screen, even as it walks in)
  c.save();
  c.font = '800 ' + (m.boss ? 15 : 16) + 'px "Bricolage Grotesque", system-ui, sans-serif';
  const w = c.measureText(m.text).width + 18, sy = m.y + m.r * 0.15 + Math.abs(wob) * -3, sx = Math.min(DEF_W - w / 2 - 2, Math.max(w / 2 + 2, m.x));
  c.globalAlpha = Math.min(1, age / 0.25);
  c.strokeStyle = INK; c.lineWidth = 2.5;
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.roundRect(sx - w / 2, sy, w, 26, 8); c.fill(); c.stroke();
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.text, sx, sy + 13.5);
  c.restore();
}
function defBolt(c, b) {
  const x0 = 164, y0 = DEF_WALL - 6, n = 7, a = Math.min(1, b.life / 0.1);
  c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
  const pts = [[x0, y0]];
  for (let i = 1; i < n; i++) { const k = i / n; pts.push([x0 + (b.x - x0) * k + (Math.random() - 0.5) * 18, y0 + (b.y - y0) * k + (Math.random() - 0.5) * 8]); }
  pts.push([b.x, b.y]);
  [['#FFE066', 9], ['#FFFFFF', 3.5]].forEach(([col, w]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
  c.restore();
}
function defDraw() {
  const c = df.ctx, sh = reduced || store.shake === false ? 0 : df.trauma * df.trauma;
  c.setTransform(df.dpr, 0, 0, df.dpr, 0, 0);
  c.clearRect(0, 0, DEF_W, DEF_H);
  c.save();
  c.translate(10 * sh * Math.sin(df.t * 47), 7 * sh * Math.sin(df.t * 39 + 1));
  defScene(c);
  df.mons.slice().sort((a, b) => a.y - b.y).forEach(m => defMonster(c, m));
  defCastle(c);
  df.bolts.forEach(b => defBolt(c, b));
  df.parts.forEach(p => { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.color; if (p.sq) c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6); else { c.beginPath(); c.arc(p.x, p.y, p.size / 2, 0, 7); c.fill(); } });
  c.globalAlpha = 1;
  c.restore();
}
// Fresh round state for a level (also used by the tests)
function defSetup() {
  df.mons = []; df.parts = []; df.bolts = []; df.pad = []; df.spawned = 0;
  df.spawnIn = 500; df.t = 0; df.last = 0; df.freezeUntil = 0; df.trauma = 0; df.wallFlash = 0; df.fizzle = 0; df.glow = 0;
}
registerGame({
  id: 'defense', name: 'Number Defense', skill: 'Math', colors: ['#8FD694', '#2E7D32'],
  hint: 'Monsters march at your castle holding sums. Tap the answer to zap one before it reaches the wall. 60 seconds.',
  art: '<path d="M18 104h84v12H18z" fill="#fff" fill-opacity=".5"/><path d="M50 104V86l10-12 10 12v18z" fill="#fff"/><path d="M60 74l6-8-6-8-6 8z" fill="#7FD1FF" stroke="#fff" stroke-width="2"/>' +
    '<path d="M60 58L74 40l-6 0 10-14" fill="none" stroke="#FFE066" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="86" cy="30" r="15" fill="#FF9A55" stroke="#2B2350" stroke-width="3"/><circle cx="81" cy="27" r="4" fill="#fff"/><circle cx="91" cy="27" r="4" fill="#fff"/><circle cx="81" cy="28" r="1.8" fill="#2B2350"/><circle cx="91" cy="28" r="1.8" fill="#2B2350"/>' +
    '<rect x="14" y="20" width="42" height="20" rx="6" fill="#fff"/><text x="35" y="35" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="13" fill="#2E7D32">7 + 5</text>',
  html: '<div class="hunt-wrap def-wrap" id="defWrap"><canvas class="def-canvas" id="defCanvas" aria-label="Monsters marching toward the castle"></canvas>' +
    '<div class="def-pad" id="defPad"><button class="opt" data-v=""></button><button class="opt" data-v=""></button><button class="opt" data-v=""></button><button class="opt" data-v=""></button></div></div>',
  start(my) {
    df = makeRound('defense', MAX_LEVEL);
    const cv = $('defCanvas');
    df.dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = DEF_W * df.dpr; cv.height = DEF_H * df.dpr;
    df.ctx = cv.getContext('2d');
    df.bg = new Image(); df.bg.src = 'img/defense-bg.jpg'; df.bg.onerror = () => { df.bg = null; }; // optional painted background
    defSetup();
    show('defense');
    roundHud(df);
    defPad();
    requestAnimationFrame(defTick);
    startClock(df, st => [['Zapped', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const b = $('defPad').children[Number(e.key) - 1]; if (b) defTap(b); }
});
$('defPad').addEventListener('pointerdown', e => { const b = e.target.closest('button'); if (b) { e.preventDefault(); defTap(b); } });
$('defPad').addEventListener('click', e => { const b = e.target.closest('button'); if (b && e.detail === 0) defTap(b); }); // keyboard Enter/Space
