/* Welcome screens shown once to new players (not to people who already played). */
const WELCOME = [
  { title: 'Train your brain in 5 minutes a day', text: 'Each day brings a fresh session of 4 quick games. Each game lasts about a minute.', art: () => ringArt() },
  { title: '24 games, 6 skills', text: 'Math, Memory, Language, Focus, Speed and Logic. Every game adapts to you and keeps getting harder as you improve.', art: () => skillsArt() },
  { title: 'Build your streak', text: 'Finish your daily session to grow your streak. Miss a day? A weekly streak freeze has your back.', art: () => '<div class="welcome-flame">' + ICON.flame + '</div>' }
];
let welcomeStep = 0;
function ringArt() {
  const colors = ['#5B82FF', '#A57BFF', '#1FC9B6', '#FF9A55'];
  return '<svg viewBox="0 0 120 120" class="welcome-art" aria-hidden="true">' + colors.map((c, i) =>
    '<circle cx="60" cy="60" r="44" fill="none" stroke="' + c + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="52 276.5" stroke-dashoffset="' + (-i * 69.1) + '" transform="rotate(-90 60 60)"/>').join('') +
    '<text x="60" y="70" text-anchor="middle" font-family="Bricolage Grotesque, system-ui, sans-serif" font-weight="800" font-size="28" fill="currentColor">4</text></svg>';
}
function skillsArt() {
  return '<div class="welcome-cards">' + SKILLS.map(s => { const g = GAMES.find(x => x.skill === s); return '<div class="welcome-card g-' + g.id + '">' + artSvg(g) + '<span>' + s + '</span></div>'; }).join('') + '</div>';
}
function renderWelcome() {
  const w = WELCOME[welcomeStep];
  $('welcomeSlide').innerHTML = w.art() + '<h1>' + w.title + '</h1><p>' + w.text + '</p>';
  $('welcomeDots').innerHTML = WELCOME.map((_, i) => '<i class="' + (i === welcomeStep ? 'on' : '') + '"></i>').join('');
  $('welcomeNext').textContent = welcomeStep === WELCOME.length - 1 ? "Let's go!" : 'Next';
  $('welcomeSkip').hidden = welcomeStep === WELCOME.length - 1;
}
function finishWelcome() { store.onboarded = true; save(); renderHome(); }
// Called at start-up: only brand-new players see it.
function maybeWelcome() {
  if (store.onboarded) return;
  if (store.log.length) { store.onboarded = true; save(); return; } // already played before this screen existed
  welcomeStep = 0; renderWelcome(); show('welcome');
}
$('welcomeNext').addEventListener('click', () => { if (welcomeStep < WELCOME.length - 1) { welcomeStep++; renderWelcome(); } else finishWelcome(); });
$('welcomeSkip').addEventListener('click', finishWelcome);
