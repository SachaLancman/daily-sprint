/* Rail Switch (Focus): colored carts roll down a branching track. Tap the switches so each cart reaches the station of its color.
   Levels add stations (2, 4, then 8), faster carts and more carts at once.
   Feedback in three sizes (game-feel): a switch snaps over with an overshoot (small), a right delivery makes the
   station bounce with a burst of sparks (medium), a wrong one shakes the board (large). */
let rs = null;
const RAIL_COLORS = [['#E5484D', 'R'], ['#3B6FF5', 'B'], ['#FFC83D', 'Y'], ['#18A058', 'G'], ['#8E5BD8', 'V'], ['#FF8A2B', 'O'], ['#FF6FA8', 'P'], ['#1FC9B6', 'T']];
const RAIL_W = 328, RAIL_TOP = 64, RAIL_BOTTOM = 372;
const RAIL_LEVELS = [
  { depth: 1, speed: 70, every: 3600, max: 1 },
  { depth: 2, speed: 75, every: 3400, max: 1 },
  { depth: 2, speed: 85, every: 2600, max: 2 },
  { depth: 3, speed: 85, every: 2800, max: 2 }
];
// Past level 4: faster carts, closer together, up to 5 on the track at once.
function railLevel(level) {
  if (level <= RAIL_LEVELS.length) return RAIL_LEVELS[level - 1];
  const d = past(level, RAIL_LEVELS.length);
  return { depth: 3, speed: Math.min(170, 85 + 4 * d), every: Math.max(1100, 2800 - 70 * d), max: Math.min(5, 2 + Math.floor(d / 4)) };
}
const railNode = (k, i) => ({ x: (i + 0.5) * RAIL_W / 2 ** k, y: RAIL_TOP + k * (RAIL_BOTTOM - RAIL_TOP) / rs.depth });
const railLetter = (c, x, y) => store.cb ? '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="13" fill="' + (c === 2 ? INK : '#fff') + '">' + RAIL_COLORS[c][1] + '</text>' : '';
// Draw the track for the current level. Switches start pointing at random.
function railBuild() {
  const d = rs.depth = railLevel(rs.tier).depth;
  rs.sw = Array.from({ length: d }, (_, k) => Array.from({ length: 2 ** k }, () => r(0, 1)));
  rs.carts = []; rs.spawnIn = 700; rs.last = 0;
  let tracks = '<line class="track on" x1="' + RAIL_W / 2 + '" y1="-20" x2="' + RAIL_W / 2 + '" y2="' + RAIL_TOP + '"/>', switches = '', stations = '';
  for (let k = 0; k < d; k++) for (let i = 0; i < 2 ** k; i++) {
    const p = railNode(k, i);
    for (const s of [0, 1]) { const c = railNode(k + 1, 2 * i + s); tracks += '<line class="track" data-k="' + k + '" data-i="' + i + '" data-s="' + s + '" x1="' + p.x + '" y1="' + p.y + '" x2="' + c.x + '" y2="' + c.y + '"/>'; }
    switches += '<g class="switch" data-k="' + k + '" data-i="' + i + '" transform="translate(' + p.x + ' ' + p.y + ')" role="button" aria-label="Switch ' + (2 ** k + i) + '">' +
      '<circle class="hit" r="24"/><circle class="knob" r="16"/><g class="arrow"><path d="M-8 0h15M2 -6l6 6-6 6"/></g></g>';
  }
  const w = RAIL_W / 2 ** d;
  for (let i = 0; i < 2 ** d; i++) {
    const x = i * w + 3;
    stations += '<g class="station" data-i="' + i + '"><rect x="' + x + '" y="' + (RAIL_BOTTOM - 4) + '" width="' + (w - 6) + '" height="40" rx="9" fill="' + RAIL_COLORS[i][0] + '"/>' + railLetter(i, x + (w - 6) / 2, RAIL_BOTTOM + 16) + '</g>';
  }
  $('railBoard').innerHTML = '<g>' + tracks + '</g><g>' + stations + '</g><g id="railCarts"></g><g>' + switches + '</g><g id="railFx"></g>';
  railPaint();
}
// Show which way every switch points: its arrow, and the track it sends carts down.
function railPaint() {
  $('railBoard').querySelectorAll('.switch').forEach(g => {
    const k = +g.dataset.k, i = +g.dataset.i; // arrows point clearly down-left or down-right, even where the branches are steep
    g.querySelector('.arrow').style.transform = 'rotate(' + (rs.sw[k][i] ? 45 : 135) + 'deg)';
  });
  $('railBoard').querySelectorAll('.track[data-k]').forEach(t => t.classList.toggle('on', rs.sw[+t.dataset.k][+t.dataset.i] === +t.dataset.s));
}
function railFlip(g) {
  if (!alive(rs)) return;
  const k = +g.dataset.k, i = +g.dataset.i;
  rs.sw[k][i] ^= 1;
  railPaint();
  g.classList.remove('flip'); void g.getBoundingClientRect(); g.classList.add('flip');
  beep(480 + 60 * k, 0.03);
}
// Set every switch on the way to station s (used by the tests), and follow the switches from the top.
function railAim(s) { for (let k = 0; k < rs.depth; k++) rs.sw[k][s >> (rs.depth - k)] = (s >> (rs.depth - k - 1)) & 1; railPaint(); }
function railFollow() { let i = 0; for (let k = 0; k < rs.depth; k++) i = 2 * i + rs.sw[k][i]; return i; }
function railSpawn() {
  const n = 2 ** rs.depth;
  let c = r(0, n - 1);
  if (rs.lastColors[0] === c && rs.lastColors[1] === c) c = (c + r(1, n - 1)) % n; // never three of a color in a row
  rs.lastColors = [c, rs.lastColors[0]];
  const cart = { c, k: 0, i: 0, x: RAIL_W / 2, y: -20, el: document.createElementNS('http://www.w3.org/2000/svg', 'g') };
  cart.el.setAttribute('class', 'cart');
  cart.el.innerHTML = '<rect x="-14" y="-11" width="28" height="22" rx="7" fill="' + RAIL_COLORS[c][0] + '"/>' + railLetter(c, 0, 0);
  $('railCarts').appendChild(cart.el);
  rs.carts.push(cart);
  return cart;
}
function railBurst(x, y, color) {
  if (reduced) return;
  for (let n = 0; n < 8; n++) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'circle'), a = Math.PI * (1.1 + 0.8 * n / 7), d = 22 + Math.random() * 18;
    s.setAttribute('cx', x); s.setAttribute('cy', y); s.setAttribute('r', 4); s.setAttribute('fill', color);
    $('railFx').appendChild(s);
    s.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
  }
}
// A cart arrived at station i
function railDeliver(cart, i) {
  if (!alive(rs)) return;
  if (cart.el) cart.el.remove();
  rs.carts = rs.carts.filter(c => c !== cart);
  const st = $('railBoard').querySelector('.station[data-i="' + i + '"]'), depth = rs.depth;
  if (cart.c === i) {
    right(rs, $('railWrap'));
    if (st) { st.classList.remove('pop'); void st.getBoundingClientRect(); st.classList.add('pop'); }
    railBurst((i + 0.5) * RAIL_W / 2 ** depth, RAIL_BOTTOM - 6, RAIL_COLORS[i][0]);
  } else {
    wrong(rs);
    if (st) { st.classList.add('miss'); later(rs, 500, () => st.classList.remove('miss')); }
    setBoard('railWrap', null); $('railWrap').classList.remove('shake'); void $('railWrap').offsetWidth; $('railWrap').classList.add('shake');
  }
  if (railLevel(rs.tier).depth !== depth) later(rs, 450, railBuild); // more (or fewer) stations: lay a new track
}
function railTick(now) {
  if (!alive(rs)) return;
  const dt = rs.last ? Math.min(0.05, (now - rs.last) / 1000) : 0, L = railLevel(rs.tier);
  rs.last = now;
  rs.spawnIn -= dt * 1000;
  if (rs.spawnIn <= 0 && rs.carts.length < L.max && !rs.carts.some(c => c.y < 40)) { railSpawn(); rs.spawnIn = L.every; }
  for (const cart of rs.carts.slice()) {
    let move = L.speed * dt;
    while (move > 0 && rs.carts.includes(cart)) {
      const t = railNode(cart.k, cart.i), dx = t.x - cart.x, dy = t.y - cart.y, dist = Math.hypot(dx, dy);
      if (dist > move) { cart.x += dx / dist * move; cart.y += dy / dist * move; move = 0; break; }
      cart.x = t.x; cart.y = t.y; move -= dist;
      if (cart.k === rs.depth) { railDeliver(cart, cart.i); break; }
      cart.i = 2 * cart.i + rs.sw[cart.k][cart.i]; cart.k++; // the switch decides the moment the cart passes it
    }
    if (cart.el) cart.el.setAttribute('transform', 'translate(' + cart.x.toFixed(1) + ' ' + cart.y.toFixed(1) + ')');
  }
  requestAnimationFrame(railTick);
}
registerGame({
  id: 'rails', name: 'Rail Switch', skill: 'Focus', colors: ['#7FD1AE', '#1E6B52'],
  hint: 'Tap the switches to send each cart to the station of its color. 60 seconds.',
  art: '<path d="M60 8v26M60 34L30 72M60 34l30 38M30 72v20M90 72v20" stroke="#fff" stroke-opacity=".6" stroke-width="7" stroke-linecap="round" fill="none"/>' +
    '<circle cx="60" cy="34" r="10" fill="#fff"/><path d="M57 29l6 5-6 5" fill="none" stroke="#1E6B52" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="rotate(50 60 34)"/>' +
    '<rect x="16" y="92" width="28" height="18" rx="6" fill="#FFC83D"/><rect x="76" y="92" width="28" height="18" rx="6" fill="#E5484D"/>' +
    '<rect x="68" y="44" width="24" height="18" rx="6" fill="#E5484D" stroke="#fff" stroke-width="3" transform="rotate(50 80 53)"/>',
  html: '<div class="hunt-wrap board rail-board" id="railWrap"><svg id="railBoard" viewBox="0 0 ' + RAIL_W + ' 420" aria-label="Rail track"></svg></div>',
  start(my) {
    rs = makeRound('rails', MAX_LEVEL);
    rs.lastColors = [-1, -1];
    show('rails');
    $('railWrap').classList.remove('shake');
    roundHud(rs);
    railBuild();
    requestAnimationFrame(railTick);
    startClock(rs, st => [['Delivered', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]]);
  },
  key(e) { const n = Number(e.key), g = $('railBoard').querySelectorAll('.switch')[n - 1]; if (g) railFlip(g); }
});
// Flip on touch-down so a fast tap never misses a passing cart
$('railBoard').addEventListener('pointerdown', e => { const g = e.target.closest('.switch'); if (g) { e.preventDefault(); railFlip(g); } });
