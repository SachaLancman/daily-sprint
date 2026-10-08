const $ = id => document.getElementById(id);
const KEY = 'dailysprint.v1';
/* Small line icons (24x24) */
const ICON = {
  flame: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c.9 3.6 5.5 5.6 5.5 11.2A5.5 5.5 0 0 1 6.5 13.6c0-2.6 1.3-4.3 2.7-5.3.2 1.9 1.1 3 2.4 3.3C11 8.2 12.3 5.3 12 2z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.6 4.5 4.5 0 0 1 20 9.5c0 6.1-8 11-8 11z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'
};
/* Big illustrations (120x120) for the game cards and countdown. White shapes; currentColor is the game's dark color. */
const GAMES = [
  { id: 'math', name: 'Math Sprint', skill: 'Math', hint: 'Answer as many as you can in 60 seconds.',
    art: '<g transform="rotate(12 86 34)"><rect x="66" y="14" width="40" height="40" rx="11" fill="#fff" fill-opacity=".5"/><path d="M78 26l16 16M94 26L78 42" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>' +
      '<g transform="rotate(8 80 86)"><rect x="60" y="66" width="40" height="40" rx="11" fill="#fff" fill-opacity=".28"/><path d="M70 81h20M70 92h20" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>' +
      '<g transform="rotate(-10 40 46)"><rect x="18" y="24" width="44" height="44" rx="12" fill="#fff"/><path d="M40 35v22M29 46h22" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></g>' },
  { id: 'memory', name: 'Memory Grid', skill: 'Memory', hint: 'Watch the tiles light up, then tap them in the same order.',
    art: '<g transform="rotate(-8 64 60)">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => '<rect x="' + (22 + (i % 3) * 30) + '" y="' + (16 + Math.floor(i / 3) * 30) + '" width="24" height="24" rx="7" fill="#fff" fill-opacity="' + ([0, 4, 5].includes(i) ? 1 : .28) + '"/>').join('') + '</g>' },
  { id: 'words', name: 'Word Match', skill: 'Language', hint: 'Pick the word that means the same. You have 60 seconds.',
    art: '<rect x="52" y="58" width="60" height="40" rx="12" fill="#fff" fill-opacity=".35"/><path d="M96 96l4 14-16-14z" fill="#fff" fill-opacity=".35"/><path d="M64 72h30M64 84h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="12" y="20" width="68" height="50" rx="14" fill="#fff"/><path d="M26 68v16l16-16z" fill="#fff"/><text x="46" y="55" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="28" fill="currentColor">Aa</text>' },
  { id: 'spot', name: 'Spot the Error', skill: 'Language', hint: 'Tap the one word that is wrong. You have 60 seconds.',
    art: '<g transform="rotate(-7 48 58)"><rect x="16" y="14" width="66" height="86" rx="10" fill="#fff"/><path d="M28 32h42M28 46h34M28 74h40M28 88h26" stroke="currentColor" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/><path d="M28 61q5-6 10 0t10 0t10 0" fill="none" stroke="#E5484D" stroke-width="4" stroke-linecap="round"/></g>' +
      '<circle cx="80" cy="66" r="19" fill="#fff" fill-opacity=".25" stroke="#fff" stroke-width="8"/><path d="M94 80l14 14" stroke="#fff" stroke-width="10" stroke-linecap="round"/>' },
  { id: 'colors', name: 'Color Clash', skill: 'Focus', hint: 'Does the word match the color it is written in? Answer fast. 60 seconds.',
    art: '<circle cx="90" cy="26" r="15" fill="#fff" fill-opacity=".45"/><circle cx="98" cy="90" r="11" fill="#FFC83D"/><circle cx="24" cy="98" r="8" fill="#fff" fill-opacity=".35"/>' +
      '<g transform="rotate(-8 56 56)"><rect x="12" y="34" width="88" height="46" rx="14" fill="#fff"/><text x="56" y="66" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="25" fill="#3B6FF5">RED</text></g>' },
  { id: 'hunt', name: 'Number Hunt', skill: 'Speed', hint: 'Tap the numbers in order, starting at 1. Each grid you finish gets bigger.',
    art: '<g transform="rotate(7 60 60)">' + [[22, 22, 3], [62, 22, 1], [22, 62, 4], [62, 62, 2]].map(([x, y, n]) => '<rect x="' + x + '" y="' + y + '" width="36" height="36" rx="10" fill="#fff" fill-opacity="' + (n === 1 ? 1 : .55) + '"/><text x="' + (x + 18) + '" y="' + (y + 26) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="21" fill="currentColor">' + n + '</text>').join('') +
      '<circle cx="80" cy="40" r="26" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="6 6"/></g>' },
  { id: 'pattern', name: 'Next in Line', skill: 'Logic', hint: 'Find the rule in the numbers and pick what comes next. 60 seconds.',
    art: [[24, 46, .5, 2], [54, 46, .75, 4], [84, 46, 1, 6]].map(([x, y, o, n]) => '<circle cx="' + x + '" cy="' + y + '" r="14" fill="#fff" fill-opacity="' + o + '"/><text x="' + x + '" y="' + (y + 7) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="18" fill="currentColor">' + n + '</text>').join('') +
      '<path d="M30 70q30 18 60 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/><g transform="rotate(8 92 92)"><rect x="72" y="74" width="40" height="36" rx="11" fill="#FFC83D"/><text x="92" y="101" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="24" fill="#17153A">?</text></g>' },
  { id: 'anagram', name: 'Unscramble', skill: 'Language', hint: 'Tap the letters in the right order to make a word. 60 seconds.',
    art: [[14, 40, -12, 'W', 1], [44, 22, 8, 'O', .6], [70, 50, -6, 'R', 1], [40, 70, 14, 'D', .6]].map(([x, y, a, ch, o]) => '<g transform="rotate(' + a + ' ' + (x + 17) + ' ' + (y + 17) + ')"><rect x="' + x + '" y="' + y + '" width="34" height="34" rx="9" fill="#fff" fill-opacity="' + o + '"/><text x="' + (x + 17) + '" y="' + (y + 25) + '" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="20" fill="currentColor">' + ch + '</text></g>').join('') }
];
const SESSION = 4; // games in the daily session
const SKILLS = [...new Set(GAMES.map(g => g.skill))];
const artSvg = g => '<svg class="art" viewBox="0 0 120 120" aria-hidden="true">' + g.art + '</svg>';
const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(res => setTimeout(res, ms));
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dayKey(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

let store = { best: { math: 0, memory: 0 }, streak: 0, lastDay: '', done: { date: '', math: false, memory: false }, sound: true };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved) store = Object.assign(store, saved);
  else store.best.math = Number(localStorage.getItem('mathsprint.best')) || 0;
} catch (e) {}
store.skill = Object.assign(Object.fromEntries(GAMES.map(g => [g.id, 1])), store.skill);
store.hist = Object.assign(Object.fromEntries(GAMES.map(g => [g.id, []])), store.hist);
store.log = store.log || [];         // every finished game: { game, score, day } (for the leaderboard)
store.pending = store.pending || []; // results waiting to be sent online
store.bestStreak = Math.max(store.bestStreak || 0, store.streak || 0);
store.player = store.player || null; // { id, secret, name, country } once the profile is set
// Activity calendar: games played per day, and the days the full daily session was finished. Kept forever (small).
// Highest level ever reached per game (for mastery ranks). Older saves start from the remembered level.
store.peak = store.peak || Object.fromEntries(Object.entries(store.skill).filter(([, v]) => v > 1)); // level 1 is just the default
if (!store.days) {
  // First time: rebuild what we can from the game history. A day with 4+ different games counts as a finished session.
  store.days = {}; store.sessionDays = [];
  const kinds = {};
  store.log.forEach(e => { store.days[e.day] = (store.days[e.day] || 0) + 1; (kinds[e.day] = kinds[e.day] || new Set()).add(e.game); });
  store.sessionDays = Object.keys(kinds).filter(d => kinds[d].size >= 4);
  if (store.lastDay && !store.sessionDays.includes(store.lastDay)) store.sessionDays.push(store.lastDay);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
function freshDay() { if (store.done.date !== today()) store.done = { date: today() }; }
// Today's session: SESSION games picked from the date, so everyone gets the same picks on the same day.
// It prefers games that train different skills.
function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}
function pickGames(day, salt) {
  const rnd = seededRandom('daily-sprint ' + day + salt), pool = GAMES.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const pick = [], skills = new Set();
  for (const g of pool) if (pick.length < SESSION && !skills.has(g.skill)) { pick.push(g); skills.add(g.skill); }
  for (const g of pool) if (pick.length < SESSION && !pick.includes(g)) pick.push(g);
  return pick;
}
// Never the same set two days running: compare with yesterday's picks (looking back a few days is plenty).
function todaysGames(day = today(), depth = 0) {
  const d = new Date(day + 'T12:00'); d.setDate(d.getDate() - 1);
  const key = p => p.map(g => g.id).sort().join(), before = depth < 3 ? key(todaysGames(dayKey(d), depth + 1)) : '';
  for (const salt of ['', '+', '++']) { const p = pickGames(day, salt); if (key(p) !== before) return p; }
  return pickGames(day, '+++');
}
function spark(id) {
  const h = store.hist[id];
  if (h.length < 2) return '';
  const max = Math.max(1, ...h);
  return '<div class="spark" aria-hidden="true">' + h.map(v => '<i style="height:' + Math.max(3, Math.round(16 * v / max)) + 'px"></i>').join('') + '</div>';
}

let ac = null;
function beep(freq, dur) {
  if (!store.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) {}
}

/* Feedback helpers */
function floatText(host, text, cls) {
  const el = document.createElement('span');
  el.className = 'float' + (cls ? ' ' + cls : ''); el.textContent = text;
  host.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
function streakChip(id, n) {
  const el = $(id);
  el.innerHTML = ICON.flame + '<b>' + n + '</b>';
  el.classList.toggle('hot', n >= 3);
  el.setAttribute('aria-label', 'Streak ' + n);
}
function countUp(el, to) {
  if (reduced || !to) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / 900);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = to; }, 1000); // in case animation frames are paused (e.g. a background tab)
}
function confetti() {
  if (reduced) return;
  const c = $('fx'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
  const cols = ['#FFC83D', '#5B82FF', '#A57BFF', '#1FC9B6', '#FF9A55', '#FFFFFF'];
  const ps = Array.from({ length: 150 }, () => ({
    x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35,
    vx: (Math.random() - .5) * 18 * dpr, vy: (-Math.random() * 16 - 6) * dpr,
    s: (Math.random() * 6 + 6) * dpr, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cols[r(0, cols.length - 1)]
  }));
  const t0 = performance.now();
  (function frame(now) {
    x.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.vy += .45 * dpr; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); x.restore();
    });
    if (now - t0 < 2800) requestAnimationFrame(frame); else x.clearRect(0, 0, W, H);
  })(t0);
}

let screen = 'home', run = 0, inSession = false, current = null;
const NAV_SCREENS = ['home', 'library', 'board'];
function show(id) {
  screen = id;
  ['home', 'library', 'countdown', 'end', 'board', 'profile', 'calendar'].concat(GAMES.map(g => g.id)).forEach(x => { $(x).hidden = x !== id; });
  const nav = NAV_SCREENS.includes(id);
  $('nav').hidden = !nav;
  document.body.classList.toggle('has-nav', nav);
  [...$('nav').children].forEach(b => b.dataset.nav === id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  window.scrollTo(0, 0);
}
const nextUndone = () => todaysGames().find(g => !store.done[g.id]);
/* Mastery ranks, earned by the highest level ever reached in a game (store.peak). */
const RANKS = [[20, 'Diamond', '#7FE3FF'], [15, 'Gold', '#FFC83D'], [10, 'Silver', '#D5DAEA'], [5, 'Bronze', '#E0A06A']];
const rankOf = level => RANKS.find(([min]) => level >= min) || null;
const rankHtml = level => { const k = rankOf(level); return k ? ' · <i class="medal" style="background:' + k[2] + '"></i>' + k[1] : ''; };
function cardHtml(g, showDone) {
  return '<li><button class="card g-' + g.id + '" data-g="' + g.id + '">' + artSvg(g) +
    (showDone && store.done[g.id] ? '<span class="done" aria-label="Done today">' + ICON.check + '</span>' : '') +
    '<span class="skill">' + g.skill + rankHtml(store.peak[g.id] || 0) + '</span><h3>' + g.name + '</h3><div class="card-meta"><span class="chip">Lvl ' + store.skill[g.id] + ' · Best ' + (store.best[g.id] || '–') + '</span>' + spark(g.id) + '</div></button></li>';
}
let librarySkill = 'All';
function renderLibrary() {
  $('skillFilter').innerHTML = ['All'].concat(SKILLS).map(s => '<button class="tab t-all" role="tab" data-skill="' + s + '" aria-selected="' + (s === librarySkill) + '">' + s + '</button>').join('');
  const bySkill = GAMES.slice().sort((a, b) => SKILLS.indexOf(a.skill) - SKILLS.indexOf(b.skill)); // stable, so file order within a skill
  $('libraryCards').innerHTML = bySkill.filter(g => librarySkill === 'All' || g.skill === librarySkill).map(g => cardHtml(g, false)).join('');
}
function openLibrary() { run++; renderLibrary(); show('library'); }

function ringSvg() {
  const R = 36, C = 2 * Math.PI * R, seg = C / SESSION, gap = 14;
  return todaysGames().map((g, i) => '<circle class="g-' + g.id + (store.done[g.id] ? ' on' : '') + '" cx="44" cy="44" r="' + R + '" stroke-dasharray="' + (seg - gap).toFixed(1) + ' ' + C.toFixed(1) +
    '" stroke-dashoffset="' + (-(i * seg) - gap / 2).toFixed(1) + '" transform="rotate(-90 44 44)"/>').join('');
}
function renderHome() {
  freshDay();
  const live = store.lastDay === today() || store.lastDay === yesterday(), streak = live ? store.streak : 0;
  const h = new Date().getHours(), hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  $('hello').textContent = hello + ' · ' + new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  $('flameSlot').innerHTML = ICON.flame;
  $('streakNum').textContent = streak;
  $('streakPill').className = 'pill' + (streak ? '' : ' cold');
  $('streakPill').setAttribute('aria-label', streak + ' day streak');
  $('streakPill').querySelector('small').textContent = streak === 1 ? 'day' : 'days';
  const picks = todaysGames(), done = picks.filter(g => store.done[g.id]).length, left = SESSION - done;
  $('ring').innerHTML = ringSvg();
  $('ringNum').innerHTML = left === 0 ? ICON.check.replace('<svg', '<svg width="34" height="34"') : done + '/' + SESSION;
  $('sessionBtn').hidden = left === 0;
  $('sessionTitle').textContent = left === 0 ? 'Done for today!' : "Today's session";
  $('sessionNote').textContent = left === 0 ? 'Come back tomorrow for new games and to keep your streak going.'
    : left === SESSION ? NUMBER_WORDS[SESSION] + ' quick games, picked fresh today. Finish all ' + NUMBER_WORDS[SESSION].toLowerCase() + ' to keep your streak.'
    : left === 1 ? 'One game left. Finish it to keep your streak!' : left + ' games left to finish today.';
  if (left) $('sessionBtn').innerHTML = ICON.play + (left === SESSION ? "Start today's session" : 'Continue: ' + nextUndone().name);
  $('games').innerHTML = picks.map(g => cardHtml(g, true)).join('');
  $('moreBtn').innerHTML = ICON.grid + 'See all ' + GAMES.length + ' games';
  $('soundBtn').innerHTML = (store.sound ? ICON.soundOn : ICON.soundOff) + 'Sound ' + (store.sound ? 'on' : 'off');
  show('home');
}

async function launch(id) {
  const my = ++run;
  current = GAMES.find(g => g.id === id);
  $('countdown').className = 'screen full g-' + id;
  $('end').className = 'screen full g-' + id;
  $('countName').textContent = current.name;
  $('countHint').textContent = current.hint;
  $('countArt').innerHTML = current.art;
  document.querySelectorAll('.bar').forEach(b => b.classList.remove('low'));
  document.querySelectorAll('.hud-time').forEach(t => t.classList.remove('low'));
  show('countdown');
  for (let n = 3; n >= 1; n--) {
    const el = $('countNum');
    el.textContent = n; el.classList.remove('count'); void el.offsetWidth; el.classList.add('count');
    beep(440, 0.12);
    await sleep(700);
    if (my !== run) return;
  }
  beep(880, 0.2);
  STARTERS[id](my);
}

// `skill` = the level to remember for next time; `top` = the highest level reached in this round.
function finishGame(score, label, stats, skill, top = skill) {
  run++;
  const id = current.id, prev = store.best[id] || 0, isBest = score > prev;
  const prevPeak = store.peak[id] || 0, newPeak = top > prevPeak;
  if (isBest) store.best[id] = score;
  store.skill[id] = skill;
  if (newPeak) store.peak[id] = top;
  store.hist[id] = store.hist[id].concat(score).slice(-12);
  freshDay();
  store.done[id] = true;
  if (!nextUndone() && store.lastDay !== today()) {
    store.streak = store.lastDay === yesterday() ? store.streak + 1 : 1;
    store.lastDay = today();
    store.bestStreak = Math.max(store.bestStreak, store.streak);
    if (!store.sessionDays.includes(today())) store.sessionDays.push(today());
  }
  store.days[today()] = (store.days[today()] || 0) + 1;
  store.log = store.log.concat({ game: id, score, day: today() }).slice(-500);
  save();
  submitScore({ game: id, score, day: today() });
  const celebrate = isBest && score > 0;
  // Stars: 3 for a new best, 2 for at least 70% of your best, 1 for any points.
  const stars = celebrate ? 3 : score >= 0.7 * prev && score > 0 ? 2 : score > 0 ? 1 : 0;
  $('endLabel').textContent = label;
  $('stars').innerHTML = [0, 1, 2].map(i => ICON.star.replace('<svg', '<svg class="' + (i < stars ? 'on' : '') + '"')).join('');
  $('endBadge').hidden = !celebrate;
  // Level record (not on the very first play) and new mastery ranks
  const newRank = rankOf(top), unlocked = newPeak && newRank && newRank !== rankOf(prevPeak), record = newPeak && prevPeak > 0;
  $('endRecord').hidden = !(unlocked || record);
  $('endRecord').innerHTML = unlocked ? '<i class="medal" style="background:' + newRank[2] + '"></i>' + newRank[1] + ' rank unlocked!' : 'New level record: ' + top;
  countUp($('finalScore'), score);
  $('endNote').textContent = isBest || !prev ? 'points' : 'points · your best is ' + prev;
  $('endStats').innerHTML = stats.map(x => '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
  const nxt = inSession ? nextUndone() : null;
  $('nextBtn').innerHTML = nxt ? ICON.play + 'Next: ' + nxt.name : 'Back to home';
  $('nextBtn').dataset.next = nxt ? nxt.id : '';
  $('homeBtn').hidden = !nxt;
  show('end');
  if (celebrate || !$('endRecord').hidden) {
    setTimeout(() => { beep(784, 0.12); setTimeout(() => beep(1047, 0.2), 120); }, 450);
    setTimeout(confetti, 300);
  }
}

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const accuracy = (ok, total) => (total ? Math.round(100 * ok / total) : 0) + '%';
const pickOne = a => a[r(0, a.length - 1)];

/* Game registry
   STARTERS[id](my) starts a game after the countdown; KEYS[id](event) handles its keyboard. */
const ROUND = 60; // seconds in a timed game
const STARTERS = {}, KEYS = {};
function timer(bar, time, left) {
  $(time).textContent = Math.ceil(left);
  $(bar).style.transform = 'scaleX(' + (left / ROUND) + ')';
  $(bar).parentNode.classList.toggle('low', left <= 10);
  $(time).classList.toggle('low', left <= 10);
}
// A game file calls registerGame({ id, name, skill, hint, art, colors: [light, dark], html, start, key }).
// `html` is the game screen's content; it gets its own <section>, header and color class automatically.
function registerGame(g) {
  // A game's id becomes its screen's HTML id, so it must not clash with any other element (e.g. "countdown", "board").
  if (document.getElementById(g.id)) throw new Error('registerGame: id "' + g.id + '" is already used on the page');
  GAMES.push(g);
  if (!(g.id in store.skill)) store.skill[g.id] = 1;
  if (!(g.id in store.hist)) store.hist[g.id] = [];
  if (g.colors) document.getElementById('gameColors').append('.g-' + g.id + '{--l:' + g.colors[0] + ';--d:' + g.colors[1] + ';--grad:linear-gradient(200deg,var(--l) 0%,var(--d) 72%)}\n');
  if (g.html) $('end').insertAdjacentHTML('beforebegin', '<section class="screen g-' + g.id + '" id="' + g.id + '" hidden>' + hudHtml(g) + g.html + '</section>');
  if (g.start) STARTERS[g.id] = g.start;
  if (g.key) KEYS[g.id] = g.key;
}
// Standard header: quit, name, time (or a custom right-hand value), bar, score/level/streak chips. Ids are <id>Time, <id>Bar, ...
function hudHtml(g) {
  return '<div class="hud"><div class="hud-row"><button class="x quit" aria-label="Quit"></button><span class="hud-name">' + g.name + '</span><span class="hud-time" id="' + g.id + 'Time">60</span></div>' +
    (g.untimed ? '' : '<div class="bar"><i id="' + g.id + 'Bar"></i></div>') +
    '<div class="chips"><span class="chip">Score <b id="' + g.id + 'Score">0</b></span><span class="chip">Level <b id="' + g.id + 'Level">1</b></span>' +
    (g.chips || '<span class="chip" id="' + g.id + 'Streak"></span>') + '</div></div>';
}

/* Open-ended difficulty
   Every game has hand-made early levels, then keeps getting harder up to MAX_LEVEL using formulas.
   past(level, top) = how many levels beyond the hand-made ones (0 while still in them). */
const MAX_LEVEL = 30;
const past = (level, top) => Math.max(0, level - top);
// Answer clock: a bar that empties; if it runs out before an answer, onTimeout() runs (usually counts as a miss).
// Used by expert levels of self-paced games. Call stopAnswerClock when the player answers.
function answerClock(st, hostId, ms, onTimeout) {
  const host = $(hostId);
  let bar = host.querySelector('.qbar');
  if (!bar) { host.insertAdjacentHTML('beforeend', '<div class="qbar" aria-hidden="true"><i></i></div>'); bar = host.querySelector('.qbar'); }
  const fill = bar.firstChild;
  bar.hidden = false;
  if (fill.getAnimations) fill.getAnimations().forEach(a => a.cancel());
  if (fill.animate) fill.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
  const token = st.clock = (st.clock || 0) + 1;
  later(st, ms, () => { if (st.clock === token) onTimeout(); }); // answering calls stopAnswerClock, which cancels this
}
function stopAnswerClock(st, hostId) {
  st.clock = (st.clock || 0) + 1;
  const bar = $(hostId) && $(hostId).querySelector('.qbar');
  if (bar) bar.hidden = true;
}
// Seconds allowed per answer at a given expert depth: starts at `start`, loses `step` per level, never below `min`.
const clockMs = (depth, start, step, min) => Math.round(1000 * Math.max(min, start - step * (depth - 1)));

/* Shared engine for the newer games: one "round" object per play.
   right()/wrong() handle points, streaks and levels (up after `upAfter` correct in a row, down on a mistake). */
function makeRound(id, maxTier, upAfter = 3) {
  const tier = Math.min(maxTier, Math.max(1, store.skill[id] - 1));
  return { id, my: run, score: 0, tier, top: tier, maxTier, upAfter, row: 0, streak: 0, correct: 0, total: 0, locked: false, t0: performance.now() };
}
const alive = st => st && st.my === run && screen === st.id;
function roundHud(st) {
  $(st.id + 'Score').textContent = st.score;
  $(st.id + 'Level').textContent = st.tier;
  if ($(st.id + 'Streak')) streakChip(st.id + 'Streak', st.streak);
}
function right(st, host, pts = 10 * st.tier) {
  st.correct++; st.total++; st.streak++; st.row++;
  st.score += pts;
  floatText(host, '+' + pts);
  if (st.row >= st.upAfter && st.tier < st.maxTier) { st.tier++; st.row = 0; beep(990, 0.18); floatText(host, 'Level up!', 'lvl'); } else beep(660, 0.08);
  st.top = Math.max(st.top, st.tier);
  roundHud(st);
}
function wrong(st, levelDown = true) {
  st.total++; st.streak = 0; st.row = 0;
  if (levelDown && st.tier > 1) st.tier--;
  beep(180, 0.25);
  roundHud(st);
}
const later = (st, ms, fn) => setTimeout(() => { if (st.my === run) fn(); }, ms);
const standardStats = st => [['Correct', st.correct], ['Accuracy', accuracy(st.correct, st.total)], ['Top level', st.top]];
// Runs the 60-second clock and ends the game when it reaches zero.
function startClock(st, stats = standardStats) {
  const loop = () => {
    if (st.my !== run) return;
    const left = Math.max(0, ROUND - (performance.now() - st.t0) / 1000);
    timer(st.id + 'Bar', st.id + 'Time', left);
    if (left <= 0) { beep(520, 0.4); return finishGame(st.score, "Time's up", stats(st), st.tier, st.top); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function setBoard(id, state) { $(id).classList.remove('ok', 'no'); if (state) { void $(id).offsetWidth; $(id).classList.add(state); } }
