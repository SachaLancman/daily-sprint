/* Number Hunt: tap 1, 2, 3... in order. Level 1 is a 3x3 grid, level 2 is 4x4, level 3 is 5x5. */
let nh = null;
function startHunt(my) {
  const lv = Math.min(3, Math.max(1, store.skill.hunt - 1));
  nh = { my, score: 0, tier: lv, top: lv, grids: 0, next: 1, size: 0, taps: 0, misses: 0, t0: performance.now() };
  show('hunt');
  newHuntGrid();
  requestAnimationFrame(hTick);
}
function hHud() { $('hScore').textContent = nh.score; $('hLevel').textContent = nh.tier; $('hNext').textContent = nh.next; }
function newHuntGrid() {
  const n = nh.tier + 2;
  nh.size = n * n; nh.next = 1;
  $('hGrid').style.setProperty('--n', n);
  $('hGrid').classList.toggle('n5', n === 5);
  $('hGrid').innerHTML = shuffle(Array.from({ length: nh.size }, (_, i) => i + 1)).map(v => '<button class="tile num-tile" data-v="' + v + '">' + v + '</button>').join('');
  hHud();
}
function huntTap(btn) {
  if (screen !== 'hunt' || !nh || nh.my !== run || btn.disabled) return;
  const v = Number(btn.dataset.v), my = nh.my;
  nh.taps++;
  if (v === nh.next) {
    btn.classList.add('found'); btn.disabled = true;
    nh.score += 2 * nh.tier;
    beep(500 + nh.next * 15, 0.05);
    nh.next++;
    if (nh.next > nh.size) {
      nh.grids++;
      nh.score += 20 * nh.tier;
      floatText($('hWrap'), '+' + 20 * nh.tier + ' bonus');
      if (nh.tier < 3) { nh.tier++; floatText($('hWrap'), 'Level up!', 'lvl'); }
      nh.top = Math.max(nh.top, nh.tier);
      beep(990, 0.18);
      setTimeout(() => { if (my === run) newHuntGrid(); }, 350);
    }
  } else {
    nh.misses++;
    btn.classList.add('no'); setTimeout(() => btn.classList.remove('no'), 250);
    beep(180, 0.15);
  }
  hHud();
}
function hTick() {
  if (!nh || nh.my !== run) return;
  const left = Math.max(0, ROUND - (performance.now() - nh.t0) / 1000);
  timer('hBar', 'hTime', left);
  if (left <= 0) {
    beep(520, 0.4);
    return finishGame(nh.score, "Time's up", [['Grids', nh.grids], ['Accuracy', accuracy(nh.taps - nh.misses, nh.taps)], ['Top level', nh.top]], nh.tier);
  }
  requestAnimationFrame(hTick);
}
STARTERS.hunt = startHunt;
