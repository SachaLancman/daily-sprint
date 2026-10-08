/* Leaderboard
   Works offline today: it ranks your own results. To make it worldwide, create the free Supabase
   project described in LAUNCH.md (database setup in supabase/schema.sql) and fill in ONLINE below.
   The "key" is Supabase's public "anon" key, which is safe to put in the app. */
const ONLINE = { url: '', key: '' };
const isOnline = () => !!(ONLINE.url && ONLINE.key);
// "By game" shows a game picker; the other tabs are overall rankings.
const CATS = [{ id: 'daily', name: 'Daily' }, { id: 'weekly', name: 'Weekly' }, { id: 'streak', name: 'Streak' }, { id: 'game', name: 'By game' }];
let boardGame = 'math';
const COUNTRY_CODES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ ' +
  'DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ ' +
  'OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
  'UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' ');
const regionNames = (() => { try { return new Intl.DisplayNames(undefined, { type: 'region' }); } catch (e) { return null; } })();
const countryName = c => (regionNames && regionNames.of(c)) || c;
const COUNTRIES = COUNTRY_CODES.map(c => [c, countryName(c)]).sort((a, b) => a[1].localeCompare(b[1]));
const flagEmoji = c => String.fromCodePoint(...[...c].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
// Some systems (e.g. Windows) show flag emoji as two letters, so check once and fall back to a code badge.
const flagsWork = (() => {
  try { const x = document.createElement('canvas').getContext('2d'); x.font = '32px sans-serif'; return x.measureText(flagEmoji('FR')).width < x.measureText('FR').width * 1.5 && x.measureText(flagEmoji('FR')).width > 20; } catch (e) { return false; }
})();
const flagHtml = c => flagsWork ? '<span class="flag" title="' + countryName(c) + '">' + flagEmoji(c) + '</span>' : '<span class="cc" title="' + countryName(c) + '">' + c + '</span>';
const esc = t => String(t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
const weekKey = day => { const d = new Date(day + 'T12:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); };
const fmtDay = day => new Date(day + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
let boardCat = 'daily', boardCountry = 'ALL', boardReq = 0, afterProfile = 'home';

async function rpc(name, body) {
  const res = await fetch(ONLINE.url + '/rest/v1/rpc/' + name, {
    method: 'POST', body: JSON.stringify(body),
    headers: { apikey: ONLINE.key, Authorization: 'Bearer ' + ONLINE.key, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('rpc ' + name + ' ' + res.status);
}
function submitScore(entry) {
  if (!isOnline() || !store.player) return;
  store.pending = store.pending.concat(entry).slice(-100);
  save();
  flushScores();
}
let flushing = false;
async function flushScores() {
  if (flushing || !isOnline() || !store.player) return;
  flushing = true;
  try {
    while (store.pending.length) {
      const e = store.pending[0], p = store.player;
      await rpc('submit_score', { p_id: p.id, p_secret: p.secret, p_name: p.name, p_country: p.country, p_game: e.game, p_score: e.score, p_day: e.day, p_streak: store.bestStreak });
      store.pending = store.pending.slice(1); save();
    }
  } catch (e) { /* offline or refused: try again next time */ }
  flushing = false;
}
function localBoard(cat) {
  const me = store.player, row = (score, note) => ({ name: me.name, country: me.country, score, note });
  if (GAMES.some(g => g.id === cat)) return store.log.filter(e => e.game === cat).sort((a, b) => b.score - a.score).slice(0, 20).map(e => row(e.score, fmtDay(e.day)));
  if (cat === 'streak') return store.bestStreak ? [row(store.bestStreak, 'Longest run of days')] : [];
  const byDay = {}; // day -> best score per game that day; a day's total is the sum of those
  store.log.forEach(e => { const d = byDay[e.day] = byDay[e.day] || {}; d[e.game] = Math.max(d[e.game] || 0, e.score); });
  const days = Object.entries(byDay).map(([day, g]) => [day, Object.values(g).reduce((a, b) => a + b, 0)]);
  if (cat === 'daily') return days.sort((a, b) => b[1] - a[1]).slice(0, 20).map(([d, t]) => row(t, fmtDay(d)));
  const byWeek = {};
  days.forEach(([d, t]) => { const k = weekKey(d); byWeek[k] = (byWeek[k] || 0) + t; });
  return Object.entries(byWeek).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, t]) => row(t, 'Week of ' + fmtDay(k)));
}
async function remoteBoard(cat, country) {
  const game = GAMES.some(g => g.id === cat), view = game ? 'board_game' : 'board_' + cat;
  const q = new URLSearchParams({ select: 'player_id,name,country,score', order: 'score.desc', limit: '50' });
  if (game) q.set('game', 'eq.' + cat);
  if (cat === 'daily') q.set('day', 'eq.' + today());
  if (cat === 'weekly') q.set('week', 'eq.' + weekKey(today()));
  if (country !== 'ALL') q.set('country', 'eq.' + country);
  const res = await fetch(ONLINE.url + '/rest/v1/' + view + '?' + q, { headers: { apikey: ONLINE.key, Authorization: 'Bearer ' + ONLINE.key } });
  if (!res.ok) throw new Error('board ' + res.status);
  return (await res.json()).map(x => ({ name: x.name, country: x.country, score: x.score, you: x.player_id === store.player.id,
    note: cat === 'daily' ? 'Today' : cat === 'weekly' ? 'This week' : '' }));
}
function countryOptions(sel, withWorld, value) {
  sel.innerHTML = (withWorld ? '<option value="ALL">' + (flagsWork ? '🌍 ' : '') + 'All countries</option>' : '') +
    COUNTRIES.map(([c, n]) => '<option value="' + c + '">' + (flagsWork ? flagEmoji(c) + ' ' : '') + esc(n) + '</option>').join('');
  sel.value = value;
}
async function renderBoard() {
  const my = ++boardReq;
  $('boardTabs').innerHTML = CATS.map(c => '<button class="tab ' + (c.id === 'game' ? 'g-' + boardGame : 't-all') + '" role="tab" data-cat="' + c.id + '" aria-selected="' + (c.id === boardCat) + '">' + c.name + '</button>').join('');
  $('gameFilter').hidden = boardCat !== 'game';
  if ($('gameFilter').options.length !== GAMES.length) $('gameFilter').innerHTML = GAMES.map(g => '<option value="' + g.id + '">' + g.name + ' · ' + g.skill + '</option>').join('');
  $('gameFilter').value = boardGame;
  const cat = boardCat === 'game' ? boardGame : boardCat;
  $('meBtn').innerHTML = flagHtml(store.player.country) + esc(store.player.name);
  if ($('countryFilter').options.length < 2) countryOptions($('countryFilter'), true, boardCountry);
  $('boardNote').hidden = isOnline();
  $('boardNote').textContent = 'Just you for now: these are your best results. Once Daily Sprint is online, you will compete with players around the world.';
  $('boardRows').innerHTML = '<li class="empty">Loading…</li>';
  let rows;
  try {
    if (isOnline()) { await flushScores(); rows = await remoteBoard(cat, boardCountry); }
    else rows = boardCountry === 'ALL' || boardCountry === store.player.country ? localBoard(cat) : [];
  } catch (e) {
    if (my === boardReq) $('boardRows').innerHTML = '<li class="empty">Couldn’t load the leaderboard. Check your internet connection and try again.</li>';
    return;
  }
  if (my !== boardReq) return; // a newer tab or filter was picked meanwhile
  const unit = boardCat === 'streak' ? ' days' : '';
  $('boardRows').innerHTML = rows.length ? rows.map((x, i) =>
    '<li class="lb-row' + (x.you ? ' you' : '') + '"><span class="rank r' + (i + 1) + '">' + (i + 1) + '</span>' + flagHtml(x.country) +
    '<div class="who"><b>' + esc(x.name) + (x.you ? ' (you)' : '') + '</b>' + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</div>' +
    '<span class="pts">' + x.score + unit + '</span></li>').join('')
    : '<li class="empty">' + (boardCountry !== 'ALL' && (isOnline() || boardCountry !== store.player.country) ? 'No players from ' + esc(countryName(boardCountry)) + ' yet.'
      : boardCat === 'streak' ? 'Finish a full daily session to start your streak.' : 'No results yet. Finish a game to get on the board!') + '</li>';
}
function openBoard() {
  if (!store.player) return openProfile('board');
  run++;
  show('board');
  renderBoard();
}
function openProfile(next) {
  afterProfile = next;
  const p = store.player, guess = (navigator.language.split('-')[1] || '').toUpperCase();
  $('nameInput').value = p ? p.name : '';
  countryOptions($('countryInput'), false, p ? p.country : COUNTRY_CODES.includes(guess) ? guess : 'US');
  $('profileErr').hidden = true;
  $('deleteData').hidden = !p;
  show('profile');
  if (!p) $('nameInput').focus();
}
function saveProfile() {
  const name = $('nameInput').value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { $('profileErr').textContent = 'Pick a nickname of at least 2 characters.'; $('profileErr').hidden = false; return; }
  store.player = Object.assign(store.player || { id: uuid(), secret: uuid() }, { name, country: $('countryInput').value });
  if (isOnline() && !store.pending.length) store.pending = store.log.slice(-20).filter(e => e.day >= weekKey(today())); // share this week's results
  save();
  flushScores();
  afterProfile === 'board' ? openBoard() : renderHome();
}
async function deleteData() {
  if (!confirm('Delete your nickname, country and leaderboard results? Your game levels and best scores stay.')) return;
  try { if (isOnline()) await rpc('delete_player', { p_id: store.player.id, p_secret: store.player.secret }); }
  catch (e) { alert('Couldn’t reach the leaderboard to delete your data. Check your internet connection and try again.'); return; }
  store.player = null; store.log = []; store.pending = [];
  save();
  renderHome();
}
