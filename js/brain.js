/* "You" tab: your brain profile. Skill levels (average best level per skill), points per week,
   key stats and badges. Charts follow simple rules: one color, values written in ink, a table view. */
function skillLevels() {
  return SKILLS.map(s => {
    const games = GAMES.filter(g => g.skill === s), played = games.filter(g => store.peak[g.id] || (store.hist[g.id] || []).length);
    const avg = played.length ? played.reduce((a, g) => a + (store.peak[g.id] || 1), 0) / played.length : 0;
    return { skill: s, level: Math.round(avg * 10) / 10, played: played.length, total: games.length };
  });
}
function weeklyPoints(weeks = 8) {
  const keys = [];
  for (let i = weeks - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - 7 * i); keys.push(weekKey(dayKey(d))); }
  const sums = Object.fromEntries(keys.map(k => [k, 0]));
  store.log.forEach(e => { const k = weekKey(e.day); if (k in sums) sums[k] += e.score; });
  return keys.map(k => ({ week: k, points: sums[k] }));
}
const niceMax = v => { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
const fmt = n => n.toLocaleString();
function skillBars(levels) {
  return '<div class="skill-bars">' + levels.map(x => {
    const pct = Math.max(x.level ? 4 : 0, Math.min(100, x.level / MAX_LEVEL * 100));
    return '<div class="sb-row"><span class="sb-name">' + x.skill + '</span><div class="sb-track"><i style="width:' + pct + '%"></i></div>' +
      '<span class="sb-val">' + (x.level ? 'Lvl ' + x.level : 'Not played') + '</span></div>';
  }).join('') + '</div>';
}
function weekChart(data) {
  const W = 320, H = 150, top = 14, bottom = 22, left = 34, max = niceMax(Math.max(...data.map(d => d.points))), plotH = H - top - bottom;
  const band = (W - left) / data.length, bw = Math.min(24, band - 8);
  const y = v => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max].map(v => '<line x1="' + left + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '" class="wk-grid"/><text x="' + (left - 6) + '" y="' + (y(v) + 4) + '" class="wk-tick" text-anchor="end">' + fmt(v) + '</text>').join('');
  const cols = data.map((d, i) => {
    const x = left + i * band + (band - bw) / 2, h = (d.points / max) * plotH, yy = top + plotH - h, r = Math.min(4, h);
    const shape = h > 0 ? '<path class="wk-col" d="M' + x + ' ' + (top + plotH) + 'V' + (yy + r) + 'Q' + x + ' ' + yy + ' ' + (x + r) + ' ' + yy + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + yy + ' ' + (x + bw) + ' ' + (yy + r) + 'V' + (top + plotH) + 'Z"/>' : '';
    const label = new Date(d.week + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return '<g class="wk-hit" data-tip="Week of ' + label + ': ' + fmt(d.points) + ' points"><rect x="' + (left + i * band) + '" y="' + top + '" width="' + band + '" height="' + plotH + '" fill="transparent"/>' + shape +
      (i === data.length - 1 && d.points ? '<text x="' + (x + bw / 2) + '" y="' + (yy - 4) + '" class="wk-cap" text-anchor="middle">' + fmt(d.points) + '</text>' : '') +
      (i % 2 === data.length % 2 || i === data.length - 1 ? '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" class="wk-tick" text-anchor="middle">' + label + '</text>' : '') + '</g>';
  }).join('');
  return '<div class="wk-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" class="wk-chart" role="img" aria-label="Points per week for the last ' + data.length + ' weeks">' +
    '<line x1="' + left + '" x2="' + W + '" y1="' + (top + plotH) + '" y2="' + (top + plotH) + '" class="wk-base"/>' + ticks + cols + '</svg><div class="wk-tip" id="wkTip" hidden></div></div>' +
    '<details class="wk-table"><summary>Show as a table</summary><table><tr><th>Week of</th><th>Points</th></tr>' +
    data.map(d => '<tr><td>' + new Date(d.week + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</td><td>' + fmt(d.points) + '</td></tr>').join('') + '</table></details>';
}
function renderBrain() {
  const levels = skillLevels(), playedSkills = levels.filter(x => x.level);
  const strong = playedSkills.slice().sort((a, b) => b.level - a.level)[0], weak = playedSkills.slice().sort((a, b) => a.level - b.level)[0];
  const ranks = RANKS.map(([min, name, color]) => ({ name, color, n: Object.values(store.peak).filter(p => rankOf(p) && rankOf(p)[1] === name).length }));
  const earned = BADGES.filter(b => store.badges[b.id]).length;
  $('brain').innerHTML =
    '<div class="topbar"><h1>Your brain</h1></div>' +
    (playedSkills.length
      ? '<div class="brain-hero"><div><small>Strongest skill</small><b>' + strong.skill + '</b></div><div><small>Needs practice</small><b>' + (playedSkills.length > 1 ? weak.skill : '–') + '</b></div></div>'
      : '<div class="note">Play a few games and your brain profile will appear here.</div>') +
    '<section class="brain-card"><h2>Skill levels</h2><p>Your average best level in each skill (up to ' + MAX_LEVEL + ')</p>' + skillBars(levels) + '</section>' +
    '<section class="brain-card"><h2>Points per week</h2><p>All games added up, last 8 weeks</p>' + weekChart(weeklyPoints()) + '</section>' +
    '<div class="cal-stats">' + [[totalGames(), 'Games played'], [Object.keys(store.days).length, 'Days played'], [store.bestStreak || 0, 'Best streak'], [earned + '/' + BADGES.length, 'Badges']]
      .map(([n, l]) => '<div><b>' + n + '</b><span>' + l + '</span></div>').join('') + '</div>' +
    '<section class="brain-card"><h2>Ranks</h2><div class="rank-row">' + ranks.map(r => '<div><i class="medal" style="background:' + r.color + '"></i><b>' + r.n + '</b><span>' + r.name + '</span></div>').join('') + '</div></section>' +
    '<section class="brain-card"><h2>Badges</h2><ul class="badge-grid">' + BADGES.map(b => '<li class="' + (store.badges[b.id] ? 'got' : 'locked') + '">' + badgeIcon(b) +
      '<div><b>' + b.name + '</b><small>' + b.desc + '</small></div></li>').join('') + '</ul></section>' +
    '<button class="toggle more" id="brainCal">' + ICON.flame + 'Open your activity calendar</button>';
  $('brainCal').addEventListener('click', openCalendar);
  // Hover / tap a week to see its exact points
  const tip = $('wkTip');
  $('brain').querySelectorAll('.wk-hit').forEach(g => {
    const showTip = () => { tip.textContent = g.dataset.tip; tip.hidden = false; };
    g.addEventListener('pointerenter', showTip); g.addEventListener('click', showTip);
    g.addEventListener('pointerleave', () => { tip.hidden = true; });
  });
}
function openBrain() { run++; renderBrain(); show('brain'); }
