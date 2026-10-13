/* Achievements: earned once, kept forever (store.badges = { id: day earned }).
   Each test reads only saved progress, so badges can also be awarded to people who played before badges existed. */
const totalGames = () => Object.values(store.days).reduce((a, b) => a + b, 0);
const maxPeak = () => Math.max(0, ...Object.values(store.peak));
const BADGES = [
  { id: 'first', name: 'First steps', desc: 'Finish your first game', icon: 'play', color: '#5B82FF', test: () => store.log.length >= 1 },
  { id: 'session', name: 'Daily habit', desc: 'Finish a full daily session', icon: 'check', color: '#1FC9B6', test: () => store.sessionDays.length >= 1 },
  { id: 'streak3', name: 'On a roll', desc: 'Reach a 3-day streak', icon: 'flame', color: '#FF9A55', test: () => store.bestStreak >= 3 },
  { id: 'streak7', name: 'One week strong', desc: 'Reach a 7-day streak', icon: 'flame', color: '#F2711C', test: () => store.bestStreak >= 7 },
  { id: 'streak30', name: 'Unstoppable', desc: 'Reach a 30-day streak', icon: 'flame', color: '#E5484D', test: () => store.bestStreak >= 30 },
  { id: 'freeze', name: 'Saved by the ice', desc: 'Have a streak freeze save your streak', icon: 'snow', color: '#56C8FA', test: () => store.frozenDays.length >= 1 },
  { id: 'games50', name: 'Dedicated', desc: 'Play 50 games', icon: 'star', color: '#A57BFF', test: () => totalGames() >= 50 },
  { id: 'games250', name: 'Brain athlete', desc: 'Play 250 games', icon: 'star', color: '#5E2FD6', test: () => totalGames() >= 250 },
  { id: 'explorer', name: 'Explorer', desc: 'Play every one of the ' + GAMES.length + ' games', icon: 'grid', color: '#1FC9B6', test: () => GAMES.every(g => store.hist[g.id] && store.hist[g.id].length) },
  { id: 'rounded', name: 'Well-rounded', desc: 'Play all 6 skills in one day', icon: 'grid', color: '#86DE5E', test: () => {
    const byDay = {};
    store.log.forEach(e => { const g = GAMES.find(x => x.id === e.game); if (g) (byDay[e.day] = byDay[e.day] || new Set()).add(g.skill); });
    return Object.values(byDay).some(s => s.size >= SKILLS.length);
  } },
  { id: 'score500', name: 'High scorer', desc: 'Score 500 points in one game', icon: 'trophy', color: '#FFC83D', test: () => Math.max(0, ...Object.values(store.best)) >= 500 },
  { id: 'bronze', name: 'Bronze', desc: 'Reach level 5 in any game', icon: 'medal', color: '#E0A06A', test: () => maxPeak() >= 5 },
  { id: 'silver', name: 'Silver', desc: 'Reach level 10 in any game', icon: 'medal', color: '#A9B3CC', test: () => maxPeak() >= 10 },
  { id: 'gold', name: 'Gold', desc: 'Reach level 15 in any game', icon: 'medal', color: '#FFC83D', test: () => maxPeak() >= 15 },
  { id: 'diamond', name: 'Diamond', desc: 'Reach level 20 in any game', icon: 'medal', color: '#56C8FA', test: () => maxPeak() >= 20 }
];
// The star icon has no color of its own (the results screen colors it with CSS), so give it white here.
const badgeIcon = b => '<i class="badge-dot" style="background:' + b.color + '">' + (b.icon === 'star' ? ICON.star.replace('<svg', '<svg fill="currentColor"') : ICON[b.icon]) + '</i>';
// Awards any newly earned badges and returns them (so the results screen can celebrate).
function checkBadges() {
  const fresh = BADGES.filter(b => !store.badges[b.id] && b.test());
  fresh.forEach(b => { store.badges[b.id] = today(); });
  return fresh;
}
// Players who played before badges existed get theirs quietly at start-up.
if (checkBadges().length) save();
