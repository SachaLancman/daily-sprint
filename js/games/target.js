/* Target Total (Math): tap numbers that add up exactly to the target.
   L1: two numbers up to 9. L2: two numbers up to 20. L3: three numbers up to 15. L4: three numbers up to 25. */
let tt = null;
const TARGET_LEVELS = [{ pick: 2, max: 9 }, { pick: 2, max: 20 }, { pick: 3, max: 15 }, { pick: 3, max: 25 }];
// Past level 4: bigger numbers, and from level 8 four numbers to combine.
function targetLevel(level) {
  if (level <= TARGET_LEVELS.length) return TARGET_LEVELS[level - 1];
  const b = past(level, TARGET_LEVELS.length);
  return { pick: b >= 4 ? 4 : 3, max: Math.min(99, 25 + 6 * b) };
}
function nextTarget() {
  const L = targetLevel(tt.tier);
  const nums = Array.from({ length: 9 }, () => r(1, L.max));
  const answer = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, L.pick); // these tiles are one sure solution
  tt.goal = answer.reduce((s, i) => s + nums[i], 0);
  tt.pick = L.pick; tt.sel = []; tt.nums = nums; tt.locked = false;
  $('targetGoal').textContent = tt.goal;
  $('targetHint').textContent = 'Pick ' + L.pick + ' numbers';
  $('targetGrid').innerHTML = nums.map((v, i) => '<button class="tile num-tile" data-i="' + i + '">' + v + '</button>').join('');
  setBoard('targetBoard', null);
}
function targetTap(btn) {
  if (!alive(tt) || tt.locked) return;
  const i = Number(btn.dataset.i), k = tt.sel.indexOf(i);
  if (k >= 0) { tt.sel.splice(k, 1); btn.classList.remove('lit'); } else { tt.sel.push(i); btn.classList.add('lit'); beep(560, 0.04); }
  const sum = tt.sel.reduce((s, j) => s + tt.nums[j], 0);
  $('targetHint').textContent = tt.sel.length ? 'So far: ' + sum : 'Pick ' + tt.pick + ' numbers';
  if (tt.sel.length < tt.pick) return;
  tt.locked = true;
  // Any set of tiles with the right total counts, not just the one the game had in mind.
  if (sum === tt.goal) { right(tt, $('targetBoard')); setBoard('targetBoard', 'ok'); later(tt, 400, nextTarget); }
  else {
    wrong(tt); setBoard('targetBoard', 'no');
    $('targetHint').textContent = sum + ' is not ' + tt.goal;
    later(tt, 900, nextTarget);
  }
}
registerGame({
  id: 'target', name: 'Target Total', skill: 'Math', colors: ['#A08CFF', '#4527A0'],
  hint: 'Tap the numbers that add up exactly to the target. 60 seconds.',
  art: '<circle cx="60" cy="56" r="40" fill="#fff" fill-opacity=".3"/><circle cx="60" cy="56" r="27" fill="#fff" fill-opacity=".5"/><circle cx="60" cy="56" r="14" fill="#fff"/>' +
    '<text x="60" y="63" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="18" fill="currentColor">12</text>' +
    '<g transform="rotate(-8 22 98)"><rect x="6" y="84" width="30" height="28" rx="8" fill="#FFC83D"/><text x="21" y="104" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="16" fill="#17153A">5</text></g>' +
    '<g transform="rotate(8 98 98)"><rect x="84" y="84" width="30" height="28" rx="8" fill="#FFC83D"/><text x="99" y="104" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="16" fill="#17153A">7</text></g>',
  html: '<div class="board" id="targetBoard"><span class="prompt">Make exactly</span><div class="q" id="targetGoal">10</div><span class="fix" id="targetHint"></span></div><div class="tiles" id="targetGrid"></div>',
  start(my) {
    tt = makeRound('target', MAX_LEVEL);
    show('target');
    roundHud(tt);
    nextTarget();
    startClock(tt);
  }
});
$('targetGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) targetTap(b); });
