/* Arrow Focus (Focus): which way does the MIDDLE arrow point? The arrows around it try to fool you.
   Higher levels mislead more often, and at level 4 the question sometimes switches to the outer arrows. */
let af = null;
const ARROW_MISLEAD = [0.3, 0.5, 0.65, 0.65];
function nextArrows() {
  const mid = Math.random() < 0.5 ? 'left' : 'right', other = mid === 'left' ? 'right' : 'left';
  const side = Math.random() < ARROW_MISLEAD[af.tier - 1] ? other : mid;
  af.askOuter = af.tier >= 4 && Math.random() < 0.35;
  af.answer = af.askOuter ? side : mid;
  const ch = d => d === 'left' ? '←' : '→';
  $('arrowRow').innerHTML = [side, side, mid, side, side].map((d, i) => '<span' + (i === 2 ? ' class="mid"' : '') + '>' + ch(d) + '</span>').join('');
  $('arrowAsk').textContent = af.askOuter ? 'Which way do the OUTER arrows point?' : 'Which way does the MIDDLE arrow point?';
  $('arrowAsk').classList.toggle('flip', af.askOuter);
  af.locked = false;
  setBoard('arrowBoard', null);
}
function arrowPick(dir) {
  if (!alive(af) || af.locked) return;
  af.locked = true;
  const ok = dir === af.answer;
  if (ok) { right(af, $('arrowBoard')); setBoard('arrowBoard', 'ok'); } else { wrong(af); setBoard('arrowBoard', 'no'); }
  later(af, ok ? 200 : 650, nextArrows);
}
registerGame({
  id: 'arrows', name: 'Arrow Focus', skill: 'Focus', colors: ['#4DD0B8', '#00695C'],
  hint: 'Which way does the middle arrow point? Ignore the others. Use the buttons or ← → keys.',
  art: '<rect x="8" y="38" width="104" height="44" rx="14" fill="#fff" fill-opacity=".4"/>' +
    [14, 34, 74, 94].map(x => '<path d="M' + (x + 14) + ' 60H' + x + 'm6-7l-6 7 6 7" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>').join('') +
    '<rect x="48" y="40" width="24" height="40" rx="8" fill="#fff"/><path d="M52 60h16m-6-7l6 7-6 7" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  html: '<div class="board" id="arrowBoard"><span class="prompt" id="arrowAsk">Which way does the middle arrow point?</span><div class="arrow-row" id="arrowRow"></div></div>' +
    '<div class="yn" id="arrowBtns"><button class="opt" data-d="left" aria-label="Left">←</button><button class="opt" data-d="right" aria-label="Right">→</button></div>',
  start(my) {
    af = makeRound('arrows', 4, 4);
    show('arrows');
    roundHud(af);
    nextArrows();
    startClock(af);
  },
  key(e) { if (e.key === 'ArrowLeft') arrowPick('left'); else if (e.key === 'ArrowRight') arrowPick('right'); }
});
$('arrowBtns').addEventListener('click', e => { const b = e.target.closest('button'); if (b) arrowPick(b.dataset.d); });
