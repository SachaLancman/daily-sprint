/* Atelier Sacha opening: a ~2 second logo animation with a short chime.
   Shown once per fresh start of the app (not when switching back to it), skipped by a tap and by the tests.
   Runs before the rest of the app loads, so it reads the Sound setting straight from saved progress. */
(function () {
  const el = document.getElementById('splash');
  let seen = false;
  try { seen = sessionStorage.getItem('splashSeen') === '1'; sessionStorage.setItem('splashSeen', '1'); } catch (e) {}
  if (seen || /[?&]test\b/.test(location.search)) { el.remove(); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let soundOn = true;
  try { const saved = JSON.parse(localStorage.getItem('dailysprint.v1') || 'null'); if (saved && saved.sound === false) soundOn = false; } catch (e) {}
  // Four rising notes (C E G C). Browsers may keep this silent until the person has tapped the page once.
  function chime() {
    if (!soundOn) return;
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      [[523.25, 0], [659.25, 0.09], [783.99, 0.18], [1046.5, 0.27]].forEach(([freq, t]) => {
        const o = ac.createOscillator(), g = ac.createGain(), at = ac.currentTime + t;
        o.type = 'triangle'; o.frequency.value = freq; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.09, at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
        o.start(at); o.stop(at + 0.5);
      });
    } catch (e) {}
  }
  let closed = false;
  const close = () => { if (closed) return; closed = true; el.classList.add('out'); setTimeout(() => el.remove(), 320); };
  setTimeout(chime, reduced ? 0 : 380);
  setTimeout(close, reduced ? 1200 : 1750); // + 0.3s fade = about 2 seconds
  el.addEventListener('pointerdown', close);
})();
