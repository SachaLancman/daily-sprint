/* Picture library: original sticker-style drawings used by the picture games.
   Each drawing is SVG content for a 100x100 box. `word` is the name used by Picture Spell,
   `asym` marks drawings that look different when mirrored (Odd One Out uses that). */
const INK = '#2B2350';
const PICS = {
  apple: { word: 'apple', asym: true, svg: '<path d="M50 30c-8-8-30-6-30 18 0 20 14 36 24 36 3 0 4-2 6-2s3 2 6 2c10 0 24-16 24-36 0-24-22-26-30-18z" fill="#E5484D"/><path d="M50 30c0-8 2-14 6-18" fill="none"/><path d="M54 22c6-8 16-8 20-4-4 6-14 8-20 4z" fill="#3DBE6B"/>' },
  banana: { word: 'banana', asym: true, svg: '<path d="M22 28c4 32 26 52 58 46 4-1 4-7 0-7-26 2-42-14-48-40-1-5-11-5-10 1z" fill="#FFD43B"/><path d="M21 26l-3-8" fill="none"/>' },
  cherry: { word: 'cherry', asym: true, svg: '<path d="M36 62c4-18 10-32 22-44M64 64c-2-18-2-32-6-46" fill="none" stroke="#3B7A2B"/><circle cx="34" cy="70" r="14" fill="#D7263D"/><circle cx="66" cy="72" r="14" fill="#D7263D"/><path d="M58 18c8-6 20-4 24 2-8 6-18 4-24-2z" fill="#3DBE6B"/>' },
  carrot: { word: 'carrot', asym: true, svg: '<path d="M46 32c-4-10-2-18 2-22 4 6 4 14 2 22M52 32c2-10 8-16 14-16-2 8-8 14-14 16" fill="#3DBE6B"/><path d="M34 36c8-6 22-6 30 2L42 88c-1 3-4 3-5 0z" fill="#FF8A2B"/><path d="M42 52l7 2M40 66l6 2" fill="none"/>' },
  lemon: { word: 'lemon', asym: true, svg: '<ellipse cx="50" cy="54" rx="32" ry="24" fill="#FFE14D" transform="rotate(-20 50 54)"/><path d="M78 38l6-4M22 72l-6 4" fill="none"/><path d="M64 26c4-10 14-12 20-10-4 8-12 12-20 10z" fill="#3DBE6B"/>' },
  mushroom: { word: 'mushroom', svg: '<path d="M38 52h24l-2 30c0 3-2 4-4 4H44c-2 0-4-1-4-4z" fill="#FFF3DD"/><path d="M14 54c0-22 16-36 36-36s36 14 36 36z" fill="#E5484D"/><g stroke="none" fill="#fff"><circle cx="34" cy="38" r="6"/><circle cx="56" cy="30" r="6"/><circle cx="70" cy="44" r="5"/></g>' },
  cactus: { word: 'cactus', asym: true, svg: '<path d="M42 72V30c0-10 16-10 16 0v42z" fill="#3DBE6B"/><path d="M42 56h-8c-4 0-6-3-6-6v-8c0-6 8-6 8 0v6h6M58 50h8V38c0-6 8-6 8 0v14c0 4-3 6-6 6H58" fill="#3DBE6B"/><path d="M30 72h40l-5 18H35z" fill="#E07A3F"/>' },
  tulip: { word: 'tulip', asym: true, svg: '<path d="M50 58v32" fill="none" stroke="#3B7A2B"/><path d="M50 82c-10-2-16-10-16-18 10 2 16 8 16 18z" fill="#3DBE6B"/><path d="M32 24l9 10 9-14 9 14 9-10v24c0 10-8 16-18 16s-18-6-18-16z" fill="#FF6FA8"/>' },
  tree: { word: 'tree', svg: '<rect x="44" y="62" width="12" height="26" rx="2" fill="#8B5A2B"/><path d="M30 66c-10 0-16-8-14-16 1-6 6-10 12-10 0-12 10-22 22-22s22 10 22 22c6 0 11 4 12 10 2 8-4 16-14 16z" fill="#3DBE6B"/>' },
  house: { word: 'house', asym: true, svg: '<path d="M24 48h52v40H24z" fill="#FFD9A8"/><path d="M14 50L50 16l36 34z" fill="#E5484D"/><rect x="48" y="64" width="14" height="24" fill="#8B5A2B"/><rect x="30" y="58" width="11" height="11" fill="#7FD1FF"/>' },
  rocket: { word: 'rocket', svg: '<path d="M42 68l8 22 8-22z" fill="#FFB020"/><path d="M36 52l-12 18 14-2zM64 52l12 18-14-2z" fill="#E5484D"/><path d="M50 10c14 12 18 30 14 56H36c-4-26 0-44 14-56z" fill="#F2F2F7"/><circle cx="50" cy="38" r="8" fill="#56C8FA"/>' },
  balloon: { word: 'balloon', svg: '<path d="M50 74c-6 6 6 10 0 18" fill="none"/><path d="M46 68h8l-4 6z" fill="#A57BFF"/><ellipse cx="50" cy="40" rx="24" ry="28" fill="#A57BFF"/><path d="M38 28c2-4 6-6 10-7" fill="none" stroke="#fff" stroke-width="4"/>' },
  umbrella: { word: 'umbrella', asym: true, svg: '<path d="M50 50v30c0 7-11 7-11 0" fill="none"/><path d="M14 52c0-20 16-34 36-34s36 14 36 34c-6-6-12-6-18 0-6-6-12-6-18 0-6-6-12-6-18 0-6-6-12-6-18 0z" fill="#56C8FA"/>' },
  anchor: { word: 'anchor', svg: '<g fill="none" stroke="#3B4A6B" stroke-width="7"><circle cx="50" cy="20" r="7"/><path d="M50 27v58M36 40h28M22 64c4 14 16 22 28 22s24-8 28-22"/></g><path d="M14 68l10-8 4 10zM86 68l-10-8-4 10z" fill="#3B4A6B" stroke="#3B4A6B"/>' },
  candle: { word: 'candle', svg: '<rect x="38" y="40" width="24" height="48" rx="3" fill="#FFF3DD"/><path d="M50 36v4" fill="none"/><path d="M50 12c8 10 8 18 0 22-8-4-8-12 0-22z" fill="#FFB020"/>' },
  crown: { word: 'crown', svg: '<path d="M18 72l-4-40 20 18 16-26 16 26 20-18-4 40z" fill="#FFC83D"/><rect x="18" y="72" width="64" height="12" rx="2" fill="#FFB020"/><circle cx="50" cy="60" r="5" fill="#E5484D"/>' },
  key: { word: 'key', asym: true, svg: '<path d="M44 50h42v12M74 50v9" fill="none" stroke="#C9921A" stroke-width="7"/><circle cx="30" cy="50" r="16" fill="#FFC83D"/><circle cx="30" cy="50" r="6" fill="#fff"/>' },
  star: { word: 'star', svg: '<path d="M50 12l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z" fill="#FFC83D"/>' },
  moon: { word: 'moon', asym: true, svg: '<path d="M62 14a36 36 0 1 0 22 52A30 30 0 0 1 62 14z" fill="#FFE14D"/>' },
  sun: { word: 'sun', svg: '<path d="M50 10v12M50 78v12M10 50h12M78 50h12M22 22l8 8M70 70l8 8M78 22l-8 8M30 70l-8 8" fill="none" stroke="#FFB020" stroke-width="6"/><circle cx="50" cy="50" r="18" fill="#FFC83D"/>' },
  cloud: { word: 'cloud', svg: '<path d="M28 72c-10 0-16-7-16-15 0-7 6-14 14-14 2-12 12-20 24-20 11 0 20 7 23 17 9 0 15 7 15 16s-7 16-16 16z" fill="#DDEEFF"/>' },
  heart: { word: 'heart', svg: '<path d="M50 84S14 62 14 38c0-12 9-20 19-20 8 0 14 5 17 12 3-7 9-12 17-12 10 0 19 8 19 20 0 24-36 46-36 46z" fill="#FF4D6D"/>' },
  fish: { word: 'fish', asym: true, svg: '<path d="M14 50c10-16 34-22 52-10l18-12v44L66 60C48 72 24 66 14 50z" fill="#FF9A55"/><circle cx="30" cy="46" r="4" fill="#2B2350"/>' },
  kite: { word: 'kite', svg: '<path d="M50 80c-6 4 6 8 0 12" fill="none"/><path d="M50 10l26 30-26 40-26-40z" fill="#56C8FA"/><path d="M50 10v70M24 40h52" fill="none"/>' },
  bell: { word: 'bell', svg: '<path d="M50 28v-8" fill="none"/><circle cx="50" cy="80" r="6" fill="#C9921A"/><path d="M24 74c6-6 8-12 8-26 0-10 8-20 18-20s18 10 18 20c0 14 2 20 8 26z" fill="#FFC83D"/>' },
  leaf: { word: 'leaf', asym: true, svg: '<path d="M18 82C18 42 44 18 84 16c0 40-26 66-66 66z" fill="#3DBE6B"/><path d="M18 82L64 36" fill="none"/>' },
  cupcake: { word: 'cupcake', svg: '<path d="M26 56h48l-7 30H33z" fill="#FF8FB8"/><path d="M22 58c-6-10 4-18 10-14 0-12 18-16 22-6 6-8 22-4 20 8 8 0 10 8 4 12z" fill="#FFF3DD"/><circle cx="56" cy="24" r="6" fill="#E5484D"/>' },
  pumpkin: { word: 'pumpkin', svg: '<ellipse cx="50" cy="58" rx="34" ry="26" fill="#FF8A2B"/><path d="M50 32v52M34 36c-8 12-8 32 0 46M66 36c8 12 8 32 0 46" fill="none"/><path d="M48 32c0-8 2-12 8-16" fill="none" stroke="#3B7A2B" stroke-width="6"/>' },
  snowman: { word: 'snowman', asym: true, svg: '<circle cx="50" cy="66" r="22" fill="#fff"/><circle cx="50" cy="32" r="15" fill="#fff"/><path d="M50 32l13 3-13 3z" fill="#FF8A2B"/><path d="M38 46h24v6H38z" fill="#E5484D"/><g stroke="none" fill="#2B2350"><circle cx="45" cy="27" r="2.5"/><circle cx="55" cy="27" r="2.5"/></g>' },
  sailboat: { word: 'sailboat', asym: true, svg: '<path d="M50 66V12" fill="none"/><path d="M54 16l28 44H54z" fill="#fff"/><path d="M46 24L24 60h22z" fill="#56C8FA"/><path d="M12 66h76l-12 18H24z" fill="#E5484D"/>' }
};
const PIC_NAMES = Object.keys(PICS);
// Returns an <svg> for a picture. `extra` can add a class or style, e.g. for Odd One Out's altered copy.
const picSvg = (name, extra = '') => '<svg viewBox="0 0 100 100" aria-hidden="true"' + extra + '><g stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + PICS[name].svg + '</g></svg>';
const picLabel = name => PICS[name].word[0].toUpperCase() + PICS[name].word.slice(1);
const samplePics = (n, pool = PIC_NAMES) => shuffle(pool.slice()).slice(0, n);
