/* Activity calendar: opened by tapping the streak badge on the home screen.
   Shows streak stats and a month view: each day is empty, "played" (shade grows with games played) or a finished session. */
let calMonth = null; // first day of the month on screen
function longestRun(days) {
  // Longest run of consecutive days in a sorted list of 'YYYY-MM-DD' strings
  let best = 0, run = 0, prev = null;
  days.slice().sort().forEach(d => {
    const t = new Date(d + 'T12:00').getTime();
    run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = t;
  });
  return best;
}
function renderCalendar() {
  const live = store.lastDay === today() || store.lastDay === yesterday();
  const played = Object.keys(store.days), games = Object.values(store.days).reduce((a, b) => a + b, 0);
  const best = Math.max(store.bestStreak || 0, longestRun(store.sessionDays));
  $('calStats').innerHTML = [
    [ICON.flame, live ? store.streak : 0, 'Current streak'],
    ['', best, 'Best streak'],
    ['', played.length, 'Days played'],
    ['', games, 'Games played']
  ].map(([icon, n, label]) => '<div><b>' + icon + n + '</b><span>' + label + '</span></div>').join('');

  const y = calMonth.getFullYear(), mo = calMonth.getMonth(), first = new Date(y, mo, 1), days = new Date(y, mo + 1, 0).getDate();
  $('calMonth').textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' })); // Jan 1 2024 was a Monday
  const t = today();
  let cells = weekdays.map(w => '<span class="cal-wd" aria-hidden="true">' + w + '</span>').join('') + '<span></span>'.repeat(lead);
  let monthGames = 0, monthSessions = 0;
  for (let d = 1; d <= days; d++) {
    const key = dayKey(new Date(y, mo, d)), n = store.days[key] || 0, full = store.sessionDays.includes(key);
    monthGames += n; if (full) monthSessions++;
    const cls = full ? 'complete' : n ? 'played' : '', shade = full ? '' : n ? ' style="--a:' + Math.min(1, 0.3 + n * 0.15) + '"' : '';
    const label = new Date(y, mo, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ': ' +
      (full ? 'full session, ' : '') + (n ? n + ' game' + (n > 1 ? 's' : '') : 'no games');
    cells += '<span class="cal-day ' + cls + (key === t ? ' today' : '') + (key > t ? ' future' : '') + '"' + shade + ' role="gridcell" aria-label="' + label + '" title="' + label + '">' +
      (full ? ICON.flame : d) + '</span>';
  }
  $('calGrid').innerHTML = cells;
  $('calNext').disabled = y > new Date().getFullYear() || (y === new Date().getFullYear() && mo >= new Date().getMonth());
  $('calNote').textContent = monthGames
    ? 'This month: ' + monthGames + ' game' + (monthGames > 1 ? 's' : '') + ' played, ' + monthSessions + ' full session' + (monthSessions === 1 ? '' : 's') + '.'
    : 'No games played this month.';
}
function openCalendar() {
  run++;
  const now = new Date();
  calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  renderCalendar();
  show('calendar');
}
$('calBack').innerHTML = ICON.back;
$('calPrev').innerHTML = ICON.back;
$('calNext').innerHTML = ICON.back.replace('<svg', '<svg style="transform:scaleX(-1)"');
$('streakPill').addEventListener('click', openCalendar);
$('calBack').addEventListener('click', () => renderHome());
$('calPrev').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); });
$('calNext').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); });
