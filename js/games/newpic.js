/* Spot the New (Memory): every step adds one picture to the group and shuffles them.
   Tap the picture that wasn't there before. The group keeps growing until you miss; then it starts over. */
let sn = null;
function newpicStart() {
  sn.set = samplePics(2); sn.fresh = null; sn.locked = true; sn.tier = 2;
  newpicDraw('Remember these');
  later(sn, 1600, newpicAdd);
}
function newpicAdd() {
  const unused = PIC_NAMES.filter(p => !sn.set.includes(p));
  if (!unused.length) { // every picture is in the group: big bonus, then start a fresh group
    sn.score += 200; floatText($('newpicWrap'), '+200 all pictures!'); roundHud(sn);
    return newpicStart();
  }
  sn.fresh = pickOne(unused);
  sn.set = shuffle(sn.set.concat(sn.fresh));
  sn.tier = sn.set.length; sn.top = Math.max(sn.top, sn.tier); // the "level" here is the size of the group
  newpicDraw('Tap the new one');
  sn.locked = false;
}
function newpicDraw(msg) {
  const n = sn.set.length;
  $('newpicMsg').textContent = msg;
  $('newpicGrid').style.setProperty('--n', n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : n <= 25 ? 5 : 6);
  $('newpicGrid').classList.toggle('tight', n > 16);
  $('newpicGrid').innerHTML = sn.set.map(p => '<button class="pic pop-in" data-p="' + p + '">' + picSvg(p) + '</button>').join('');
  roundHud(sn);
}
function newpicTap(btn) {
  if (!alive(sn) || sn.locked) return;
  sn.locked = true;
  if (btn.dataset.p === sn.fresh) {
    btn.classList.add('ok');
    right(sn, $('newpicWrap'), 5 * sn.set.length);
    later(sn, 450, newpicAdd);
  } else {
    btn.classList.add('no');
    [...$('newpicGrid').children].forEach(b => { if (b.dataset.p === sn.fresh) b.classList.add('ok'); });
    wrong(sn, false);
    $('newpicMsg').textContent = 'That one was new';
    later(sn, 1400, newpicStart);
  }
}
registerGame({
  id: 'newpic', name: 'Spot the New', skill: 'Memory', colors: ['#6FE3F0', '#00838F'],
  hint: 'Each turn one new picture joins the group. Tap the new one. How big can the group get?',
  art: '<rect x="14" y="20" width="38" height="38" rx="10" fill="#fff" fill-opacity=".55"/><rect x="58" y="20" width="38" height="38" rx="10" fill="#fff" fill-opacity=".55"/><rect x="14" y="64" width="38" height="38" rx="10" fill="#fff" fill-opacity=".55"/>' +
    '<g transform="rotate(8 77 83)"><rect x="58" y="64" width="38" height="38" rx="10" fill="#fff"/><path d="M77 72v22M66 83h22" stroke="currentColor" stroke-width="6" stroke-linecap="round"/></g><circle cx="100" cy="64" r="8" fill="#FFC83D"/>',
  chips: '<span class="chip" id="newpicStreak"></span>',
  html: '<div class="status-wrap" id="newpicWrap"><div class="status" id="newpicMsg">Remember these</div></div><div class="pic-grid" id="newpicGrid"></div>',
  start(my) {
    sn = makeRound('newpic', 30, 99);
    sn.tier = 2; sn.top = 2;
    show('newpic');
    $('newpicLevel').previousSibling.textContent = 'Group '; // the "Level" chip shows the group size here
    newpicStart();
    startClock(sn, st => [['Correct', st.correct], ['Biggest group', st.top], ['Accuracy', accuracy(st.correct, st.total)]]);
  }
});
$('newpicGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (b) newpicTap(b); });
