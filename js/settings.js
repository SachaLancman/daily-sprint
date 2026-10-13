/* Settings: sound, vibration, color-blind shapes, theme, profile, instructions, privacy, reset. */
function renderSettings() {
  const sw = (id, on) => { $(id).setAttribute('aria-checked', String(!!on)); };
  sw('setSound', store.sound);
  sw('setVibrate', store.vibrate !== false);
  sw('setCb', store.cb);
  $('vibrateRow').hidden = !navigator.vibrate; // only phones that can vibrate
  const theme = store.theme || 'auto';
  [...$('setTheme').children].forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === theme)));
  $('setProfileNote').textContent = store.player ? store.player.name + ' · ' + countryName(store.player.country) : 'Set your nickname and country';
}
function openSettings() { run++; renderSettings(); show('settings'); }

$('settingsBtn').innerHTML = ICON.gear;
$('settingsBack').innerHTML = ICON.back;
[...$('setTheme').children].forEach(b => b.setAttribute('role', 'radio'));
$('settingsBtn').addEventListener('click', openSettings);
$('settingsBack').addEventListener('click', () => renderHome());
$('setSound').addEventListener('click', () => { store.sound = !store.sound; save(); renderSettings(); beep(660, 0.1); });
$('setVibrate').addEventListener('click', () => { store.vibrate = store.vibrate === false; save(); renderSettings(); buzz(40); });
$('setCb').addEventListener('click', () => { store.cb = !store.cb; save(); renderSettings(); });
$('setTheme').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; store.theme = b.dataset.v; save(); applyTheme(); renderSettings(); });
$('setProfile').addEventListener('click', () => openProfile('settings'));
$('setIntros').addEventListener('click', () => { store.seen = {}; save(); $('setIntros').querySelector('small').textContent = 'Done: each game will explain itself next time'; });
$('setReset').addEventListener('click', () => {
  if (!confirm('Delete all your progress on this device (levels, scores, streak, calendar)? This cannot be undone.')) return;
  try { localStorage.removeItem(KEY); localStorage.removeItem(TEST_BACKUP); } catch (e) {}
  location.reload();
});
