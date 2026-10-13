/* Share today's result as a short text (Wordle-style), via the phone's share sheet or the clipboard. */
const SKILL_EMOJI = { Math: '🧮', Memory: '🧠', Language: '📚', Focus: '🎯', Speed: '⚡', Logic: '🧩' };
const APP_URL = 'https://sachalancman.github.io/daily-sprint/';
function shareText() {
  const day = today(), lines = ['Daily Sprint · ' + new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })];
  const streak = liveStreak();
  if (streak) lines.push('🔥 ' + streak + '-day streak');
  for (const g of todaysGames()) {
    const plays = store.log.filter(e => e.day === day && e.game === g.id);
    if (!plays.length) continue;
    const best = plays.reduce((a, b) => (b.score > a.score ? b : a));
    const stars = best.stars ?? 1;
    lines.push(SKILL_EMOJI[g.skill] + ' ' + g.name + ' ' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + ' ' + best.score);
  }
  lines.push('', 'Play today\'s games: ' + APP_URL);
  return lines.join('\n');
}
function toast(msg) {
  let t = $('toast');
  if (!t) { document.body.insertAdjacentHTML('beforeend', '<div id="toast" role="status"></div>'); t = $('toast'); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('on'), 2400);
}
async function shareResult() {
  const text = shareText();
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; } // the person closed the share sheet
  try { await navigator.clipboard.writeText(text); toast('Copied! Paste it to your friends.'); }
  catch (e) { prompt('Copy your result:', text); }
}
$('endShare').innerHTML = ICON.share + 'Share today\'s result';
$('homeShare').innerHTML = ICON.share + 'Share today\'s result';
$('endShare').addEventListener('click', shareResult);
$('homeShare').addEventListener('click', shareResult);
