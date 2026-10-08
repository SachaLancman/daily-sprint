/* Bubble Pop (Speed): pop the good bubbles (star) before they vanish; never pop a bad one (cross).
   Every 8 good pops is a new level: bubbles come faster, live shorter, and more of them are bad. */
let bp = null;
const BUBBLE_LEVELS = [
  { every: 700, life: 1700, bad: 0.2 },
  { every: 600, life: 1450, bad: 0.25 },
  { every: 500, life: 1250, bad: 0.3 },
  { every: 420, life: 1050, bad: 0.35 },
  { every: 360, life: 900, bad: 0.4 }
];
function spawnBubble() {
  if (!alive(bp)) return;
  const L = BUBBLE_LEVELS[bp.tier - 1], bad = Math.random() < L.bad, id = ++bp.next;
  const size = r(54, 72), field = $('bubbleField');
  const x = r(0, Math.max(0, field.clientWidth - size)), y = r(0, Math.max(0, field.clientHeight - size));
  field.insertAdjacentHTML('beforeend', '<button class="bubble' + (bad ? ' bad' : '') + '" data-id="' + id + '" style="left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px" aria-label="' + (bad ? 'Bad bubble' : 'Good bubble') + '">' +
    (bad ? ICON.x : ICON.star) + '</button>');
  later(bp, L.life, () => { const b = field.querySelector('[data-id="' + id + '"]'); if (b) { b.remove(); if (!bad) bp.missed++; } });
  later(bp, L.every * (0.7 + Math.random() * 0.6), spawnBubble);
}
function popBubble(btn) {
  if (!alive(bp)) return;
  const bad = btn.classList.contains('bad');
  btn.remove();
  if (bad) { wrong(bp); bp.pops = 0; setBoard('bubbleField', 'no'); later(bp, 300, () => setBoard('bubbleField', null)); return; }
  bp.pops++; bp.correct++; bp.total++; bp.streak++;
  const pts = 5 * bp.tier;
  bp.score += pts;
  beep(700 + Math.min(bp.streak, 12) * 25, 0.05);
  if (bp.pops >= 8 && bp.tier < BUBBLE_LEVELS.length) { bp.tier++; bp.pops = 0; beep(990, 0.18); floatText($('bubbleWrap'), 'Level up!', 'lvl'); }
  bp.top = Math.max(bp.top, bp.tier);
  roundHud(bp);
}
registerGame({
  id: 'bubbles', name: 'Bubble Pop', skill: 'Speed', colors: ['#9CE06B', '#33691E'],
  hint: 'Pop the star bubbles before they vanish. Never pop the ones with a cross!',
  art: '<circle cx="40" cy="44" r="24" fill="#fff"/><path d="M40 32l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#FFC83D"/>' +
    '<circle cx="86" cy="80" r="18" fill="#E5484D" stroke="#fff" stroke-width="3"/><path d="M80 74l12 12M92 74L80 86" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
    '<circle cx="90" cy="30" r="10" fill="#fff" fill-opacity=".5"/><circle cx="30" cy="94" r="8" fill="#fff" fill-opacity=".4"/>',
  html: '<div class="hunt-wrap" id="bubbleWrap"><div class="bubble-field board" id="bubbleField"></div></div>',
  start(my) {
    bp = makeRound('bubbles', BUBBLE_LEVELS.length, 99);
    bp.pops = 0; bp.missed = 0; bp.next = 0;
    show('bubbles');
    $('bubbleField').innerHTML = '';
    roundHud(bp);
    later(bp, 300, spawnBubble);
    startClock(bp, st => [['Popped', st.correct], ['Missed', st.missed], ['Top level', st.top]]);
  }
});
// Pop on touch-down for speed; "click" covers keyboard users (Enter/Space on a focused bubble).
$('bubbleField').addEventListener('pointerdown', e => { const b = e.target.closest('.bubble'); if (b) { e.preventDefault(); popBubble(b); } });
$('bubbleField').addEventListener('click', e => { const b = e.target.closest('.bubble'); if (b && b.isConnected) popBubble(b); });
