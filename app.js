(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = h => h.replace(/<[^>]+>/g, '');
const I = {
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  mark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  home: '<path d="M4 5.5C7 4 10 4 12 6c2-2 5-2 8-.5v14c-3-1.500-6-1.500-8 .5-2-2-5-2-8-.5zM12 6v14"/>',
  lib: '<path d="M5 4h4v16H5zM10 4h4v16h-4zM16 5l3.500 1 -3 14.500-3.500-1"/>',
  search: '<circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M8.500 11V8a3.500 3.500 0 017 0v3"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  moon: '<path d="M20 14.500A8.500 8.500 0 019.500 4 8.500 8.500 0 1020 14.500z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600L7 7M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400"/>',
  note: '<path d="M5 4h14v12l-4 4H5zM15 20v-4h4"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M5 16V5a1 1 0 011-1h9"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const COLORS = { yellow: '#F1B12B', green: '#2BB985', blue: '#66CCFF', pink: '#F87B5C' };
const THEMES = {
  original: ['מקורי', '#fff', '#001540'], paper: ['פלדה', '#F7F7F7', '#001540'], calm: ['צהוב', '#FFF1CD', '#001540'],
  bold: ['מודגש', '#fff', '#001540'], focus: ['מערך', '#1C2956', '#8FD6FF'], quiet: ['לילה', '#000000', '#D4D4D4'],
};
const FONTS = {
  david: ['דוד', '"David Libre",serif'], frank: ['פרנק-רוהל', '"Frank Ruhl Libre",serif'],
  heebo: ['היבו', 'Heebo,sans-serif'], system: ['מערכת', 'var(--ui)'],
};
const CHAPTERS = [
  ['פרק 2', 'מערכות בקרה במצב מתמיד', 39], ['פרק 3', 'מדידות והתמרות של גדלים פיסיקליים במערכות בקרה', 87],
  ['פרק 4', 'חיישנים ומתמרים במערכות בקרה', 115], ['פרק 5', 'מפעילים ושילובם במערכות בקרה', 185],
  ['פרק 6', 'התגובה הדינמית של מערכות בקרה', 235], ['פרק 7', 'סוגי בקרים ושילובם במערכות בקרה', 279],
  ['פרק 8', 'תגובת התדר של מערכות בקרה', 321], ['נספח', 'ניתוח תגובת המעבר של מעגל RLC', 387], ['', 'תשובות לשאלות נבחרות', 399],
];

/* ---------- state ---------- */
const KEY = 'bakara-book-v3';
const defaults = { theme: 'original', font: 'david', size: 20, lh: 1.6, justify: false, turn: 'slide',
  anchor: null, ratio: 0, progress: 0, started: false, marks: [], hls: [], answers: {}, done: {}, minutes: {} };
let S = { ...defaults };
try { S = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- book index ---------- */
const { blocks, toc } = window.BOOK;
const flat = [];
(function walk(a, q) { a.forEach(b => { b.q = q; flat.push(b); if (b.k === 'q') walk(b.items, b); }); })(blocks, null);
const byId = Object.fromEntries(flat.map(b => [b.id, b]));
const figs = {};
flat.filter(b => b.k === 'fig' && b.cap).forEach(b => { const m = strip(b.cap).match(/איור\s+(\d+\.\d+)/); if (m) figs[m[1]] = b; });
const questions = flat.filter(b => b.k === 'q');
const xrefs = h => h.replace(/איור\s+(\d+\.\d+)/g, (m, n) => figs[n] ? `<a class="xref" data-fig="${n}">${m}</a>` : m);
const blockText = b => strip(b.k === 'fig' ? (b.cap || '') : b.k === 'q' ? b.title : b.h || '');
const sectionOf = b => { let s = toc[0]; for (const t of toc) { if (flat.indexOf(byId[t.id]) <= flat.indexOf(b)) s = t; } return s; };

/* ---------- render flow ---------- */
const src = {};
function blockHtml(b) {
  switch (b.k) {
    case 'h1': return `<div class="bk-h1" data-b="${b.id}">${b.label ? `<small>${esc(b.label)}</small>` : ''}<h1>${b.h}</h1></div>`;
    case 'h2': return `<h2 class="bk-h2" data-b="${b.id}">${b.h}</h2>`;
    case 'ex': return `<div class="bk-ex" data-b="${b.id}">${b.h}</div>`;
    case 'sol': return `<div class="bk-sol" data-b="${b.id}">${b.h}</div>`;
    case 'note': src[b.id] = xrefs(b.h); return `<div class="bk-note" data-b="${b.id}" data-t>${src[b.id]}</div>`;
    case 'li': src[b.id] = xrefs(b.h); return `<div class="bk-li" data-b="${b.id}" data-t>${src[b.id]}</div>`;
    case 'p': src[b.id] = xrefs(b.h); return `<p data-b="${b.id}" data-t>${src[b.id]}</p>`;
    case 'eq': return `<div class="bk-eq" data-b="${b.id}"><img src="${b.src}" alt="משוואה" style="width:${(b.w / 11).toFixed(2)}em;aspect-ratio:${b.w}/${b.h}"></div>`;
    case 'fig': {
      const pct = Math.min(100, Math.round(b.w / 370 * 108));
      return `<figure class="bk-fig" data-b="${b.id}"><button data-zoom="${b.id}" aria-label="הגדלת איור" style="width:${pct}%"><img src="${b.src}" alt="${esc(strip(b.cap || 'איור'))}" style="width:100%;aspect-ratio:${b.w}/${b.h}"></button>${b.cap ? `<figcaption>${b.cap}</figcaption>` : ''}</figure>`;
    }
    case 'q': {
      const d = !!S.done[b.id];
      return `<section class="bk-q" data-b="${b.id}" data-q="${b.id}"><header><span>${esc(b.title)}</span><button class="q-done" data-done="${b.id}" aria-pressed="${d}">${d ? 'נענתה ✓' : 'סימון כנענתה'}</button></header>${b.items.map(blockHtml).join('')}<button class="q-ans-btn" data-ans="${b.id}">${S.answers[b.id] ? 'התשובה שלי' : '+ כתיבת תשובה'}</button></section>`;
    }
  }
  return '';
}
/* ---------- front matter: the book opens on its own title page and contents ---------- */
function frontHtml() {
  const toRows = toc.map(t => `<a class="${t.lv === 1 ? 'l1' : 'l2'}" data-toc="${t.id}"><span>${t.lv === 1 && t.l ? t.l + ' · ' : ''}${esc(t.t)}</span><i>${t.page}</i></a>`).join('');
  const locked = CHAPTERS.map(c => `<span class="lk l1" data-lock="1"><span>${c[0] ? c[0] + ' · ' : ''}${esc(c[1])}</span><i>${c[2]}</i></span>`).join('');
  byId.front1 = { k: 'front', page: 3 }; byId.front2 = { k: 'front', page: 4 };
  return `<section class="bk-front" data-b="front1"><img src="logo.svg" alt="סמל מערך הבקרה ופיקוח טיסה"><h1>מערכות בקרה</h1><p class="auth">ד״ר רפי יהל, זאב בהיר</p><p class="sub">מערכות מחשוב ובקרה</p>
    <dl><dt>קריאה והערות</dt><dd>צבי אזיה, ישראל זילברשטיין, שמעון זיסק, אבי כהן, אבי לופו, שלום קאופמן ז״ל, משה קלרטג</dd>
    <dt>ייעוץ דידקטי</dt><dd>יעקב שינבוים, ד״ר דוד ברלה</dd><dt>עריכה לשונית</dt><dd>תלמה מוקדי</dd><dt>הפקה</dt><dd>אביבה אבידן</dd><dt>איורים</dt><dd>אירית אשר, בתיה חלף</dd><dt>עיצוב עטיפה</dt><dd>ירמי לז׳ה</dd></dl>
    <p class="legal">מהדורת ניסוי, תשס״ו – 2006. כל הזכויות שמורות למשרד החינוך, התרבות והספורט. בית ההוצאה לאור של המרכז לטכנולוגיה חינוכית.<br>הדמיה: פתח דבר ופרק 1.</p></section>
  <section class="bk-toc" data-b="front2"><h1>תוכן העניינים</h1>${toRows}${locked}</section>`;
}
const flow = $('#flow'), pager = $('#pager'), reader = $('#reader');
flow.innerHTML = frontHtml() + blocks.map(blockHtml).join('') + '<div id="end" style="height:1px"></div>';

/* ---------- highlights ---------- */
function paintBlock(id) {
  const el = flow.querySelector(`[data-b="${id}"]`);
  if (!el || src[id] == null) return;
  el.innerHTML = src[id];
  S.hls.filter(h => h.block === id).sort((a, b) => a.start - b.start).forEach(h => wrap(el, h.start, h.end, 'hl', h));
}
function wrap(el, start, end, cls, h) {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = []; let pos = 0, n;
  while ((n = tw.nextNode())) { const len = n.nodeValue.length; if (pos + len > start && pos < end) nodes.push([n, Math.max(0, start - pos), Math.min(len, end - pos)]); pos += len; }
  nodes.forEach(([node, a, b]) => {
    const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b);
    const m = document.createElement('mark'); m.className = cls + (h && h.note ? ' has-note' : '');
    if (h) { m.dataset.c = h.color; m.dataset.h = h.id; }
    r.surroundContents(m);
  });
}
function clearFind() { flow.querySelectorAll('mark.find').forEach(m => { const id = m.closest('[data-b]').dataset.b; paintBlock(id); }); }
const paintAll = () => [...new Set(S.hls.map(h => h.block))].forEach(paintBlock);
paintAll();

/* ---------- pagination ---------- */
let W = 0, pages = 1, page = 0, flowR = 0;
function firstRight(el) { const rs = el.getClientRects(); return rs.length ? rs[0].right : el.getBoundingClientRect().right; }
function pageOf(el) { return Math.max(0, Math.floor((flow.getBoundingClientRect().right - firstRight(el) + 2) / W)); }
function lastPageOf(el) { const rs = el.getClientRects(); const r = rs.length ? rs[rs.length - 1] : el.getBoundingClientRect(); return Math.max(0, Math.floor((flow.getBoundingClientRect().right - r.right + 2) / W)); }
const isDark = () => ['focus', 'quiet'].includes(S.theme);
function applyMode() {
  document.documentElement.dataset.mode = isDark() ? 'dark' : 'light';
  document.documentElement.toggleAttribute('data-night', S.theme === 'quiet');
  document.documentElement.toggleAttribute('data-yellow', S.theme === 'calm');
  document.querySelector('meta[name=theme-color]').content = S.theme === 'quiet' ? '#000000' : S.theme === 'calm' ? '#FFF1CD' : isDark() ? '#1C2956' : '#ffffff';
}
function applyPrefs() {
  reader.dataset.theme = S.theme; applyMode();
  const st = flow.style, f = FONTS[S.font][1];
  reader.style.setProperty('--rfont', f); reader.style.setProperty('--rlh', S.lh);
  flow.classList.toggle('justify', S.justify);
}
function anchorNow() {
  const els = flow.querySelectorAll('[data-b]');
  for (const el of els) {
    if (el.matches('.bk-q')) continue;
    if (lastPageOf(el) >= page) {
      const a = pageOf(el), b = lastPageOf(el);
      return { id: el.dataset.b, ratio: b > a ? (Math.max(page, a) - a) / (b - a + 1) : 0 };
    }
  }
  return { id: null, ratio: 0 };
}
function pageFromAnchor(id, ratio) {
  const el = id && flow.querySelector(`[data-b="${id}"]`);
  if (!el) return 0;
  const a = pageOf(el), b = lastPageOf(el);
  return a + Math.round((b - a + 1) * (ratio || 0));
}
function layout() {
  if (reader.hidden) return;
  W = pager.clientWidth; if (!W) return;
  const H = pager.clientHeight;
  // Two-page spread once a landscape window has room for two comfortable columns
  const spread = (W >= 960 && W / H > 1.15) || (W >= 640 && W / H > 1.5);
  reader.classList.toggle('spread', spread);
  reader.style.setProperty('--rsize', Math.round(S.size * (W < 360 ? .9 : 1)) + 'px');
  const mx = spread ? (W < 960 ? 26 : Math.max(44, Math.round((W - 2 * 520) / 4))) : W >= 700 ? Math.round((W - 620) / 2) : W < 360 ? 20 : 28;
  reader.style.setProperty('--mx', mx + 'px');
  flow.style.columnWidth = (spread ? (W - 4 * mx) / 2 : W - 2 * mx) + 'px';
  flow.style.columnCount = spread ? 2 : 'auto';
  reader.style.setProperty('--colh', flow.clientHeight + 'px');
  place(0);
  pages = pageOf($('#end')) + 1;
  toc.forEach(t => { t.p = pageOf(flow.querySelector(`[data-b="${t.id}"]`)); });
  $('#scrubber').max = pages - 1;
  page = Math.min(pages - 1, pageFromAnchor(S.anchor, S.ratio));
  place(page); updateHud();
}
function place(p, dx = 0) { flow.style.transform = `translateX(${p * W + dx}px)`; }
function currentSection() { let s = toc[0]; toc.forEach(t => { if (t.p <= page) s = t; }); return s; }
function updateHud() {
  const sec = currentSection();
  $('#runhead').textContent = sec && page >= sec.p ? sec.t : 'מערכות בקרה';
  $('#runfoot').textContent = `${page + 1} מתוך ${pages}`;
  $('#scrubber').value = page;
  const a = anchorNow();
  const b = a.id && byId[a.id];
  $('#scrub-label').textContent = `${page + 1}/${pages}` + (b ? ` · עמ׳ ${b.page}` : '');
  const marked = S.marks.some(m => { const el = flow.querySelector(`[data-b="${m.id}"]`); return el && pageOf(el) <= page && lastPageOf(el) >= page; });
  $('#r-mark').setAttribute('aria-pressed', marked);
  S.anchor = a.id; S.ratio = a.ratio; S.progress = pages > 1 ? page / (pages - 1) : 1; S.started = true; save();
}

/* ---------- page turns ---------- */
let animating = false;
function setPage(p) { clearFind(); page = Math.max(0, Math.min(pages - 1, p)); flow.style.transition = ''; place(page); updateHud(); }
function makeLeaf(p) {
  const leaf = document.createElement('div'); leaf.className = 'leaf';
  const c = flow.cloneNode(true); c.removeAttribute('id'); c.className = 'leaf-flow' + (S.justify ? ' justify' : ''); c.style.columnWidth = flow.style.columnWidth;
  c.style.transform = `translateX(${p * W}px)`;
  leaf.append(c); leaf.insertAdjacentHTML('beforeend', '<div class="shade"></div>');
  pager.append(leaf); return leaf;
}
function turn(dir) {
  const t = page + dir;
  if (animating || t < 0 || t >= pages) return;
  hidePop();
  if (S.turn === 'fade') {
    animating = true; flow.style.transition = 'opacity .16s'; flow.style.opacity = 0;
    setTimeout(() => { setPage(t); flow.style.transition = 'opacity .2s'; flow.style.opacity = 1; setTimeout(() => { flow.style.transition = ''; animating = false; }, 200); }, 160);
  } else if (S.turn === 'flip') {
    animating = true;
    const leaf = makeLeaf(dir > 0 ? page : t);
    const from = dir > 0 ? 0 : 118, to = dir > 0 ? 118 : 0;
    if (dir > 0) setPage(t);
    leaf.style.transform = `rotateY(${from}deg)`;
    leaf.getBoundingClientRect();
    leaf.style.transition = 'transform .5s cubic-bezier(.3,.7,.3,1)';
    leaf.style.transform = `rotateY(${to}deg)`;
    setTimeout(() => { if (dir < 0) setPage(t); leaf.remove(); animating = false; }, 500);
  } else {
    animating = true;
    flow.style.transition = 'transform .32s cubic-bezier(.25,.8,.3,1)'; page = t; place(page);
    setTimeout(() => { flow.style.transition = ''; clearFind(); updateHud(); animating = false; }, 320);
  }
}

/* ---------- gestures ---------- */
let P = null, holdTimer = null;
const chrome = $('#chrome');
const toggleChrome = force => { const off = force != null ? !force : !chrome.classList.contains('off'); chrome.classList.toggle('off', off); $('#runhead').style.opacity = off ? 1 : 0; $('#runfoot').style.opacity = off ? 1 : 0; if (off) hidePop(); };
const interactive = t => t.closest('button,textarea,a,input,select');
pager.addEventListener('pointerdown', e => {
  if (animating || e.button) return;
  if (interactive(e.target) && !e.target.closest('[data-zoom]')) { return; }
  const hadSel = !$('#selbar').hidden;
  P = { x: e.clientX, y: e.clientY, t: e.target, id: e.pointerId, dx: 0, mode: 'tap', hadSel };
  try { pager.setPointerCapture(e.pointerId); } catch (err) {}
  holdTimer = setTimeout(() => { if (P && P.mode === 'tap') beginSelect(P.x, P.y); }, 340);
});
pager.addEventListener('pointermove', e => {
  if (!P || e.pointerId !== P.id) return;
  const dx = e.clientX - P.x, dy = e.clientY - P.y;
  if (P.mode === 'select') { extendSelect(e.clientX, e.clientY); return; }
  if (P.mode === 'tap' && Math.hypot(dx, dy) > 9) {
    clearTimeout(holdTimer);
    if (Math.abs(dx) > Math.abs(dy)) { P.mode = 'drag'; hidePop(); hideSel(); flow.style.transition = ''; } else P.mode = 'none';
  }
  if (P.mode === 'drag') dragTo(dx);
});
const finish = e => {
  clearTimeout(holdTimer);
  if (!P) return;
  const p = P; P = null;
  if (p.mode === 'select') { endSelect(); return; }
  if (p.mode === 'drag') { endDrag(e.clientX - p.x, e); return; }
  if (p.mode === 'tap') tap(e.clientX, e.clientY, p);
};
pager.addEventListener('pointerup', finish);
pager.addEventListener('pointercancel', () => { clearTimeout(holdTimer); if (P && P.mode === 'drag') endDrag(0); P = null; });
let leafDrag = null;
function dragTo(dx) {
  const dir = dx > 0 ? 1 : -1, canGo = page + dir >= 0 && page + dir < pages;
  if (S.turn === 'slide') { place(page, canGo ? dx : dx * .22); return; }
  if (S.turn === 'flip' && canGo) {
    if (!leafDrag || leafDrag.dir !== dir) {
      if (leafDrag) { leafDrag.leaf.remove(); place(page); }
      const leaf = makeLeaf(dir > 0 ? page : page - 1);
      if (dir > 0) place(page + 1);
      leafDrag = { leaf, dir };
    }
    const f = Math.min(1, Math.abs(dx) / (W * .9));
    leafDrag.leaf.style.transition = '';
    leafDrag.leaf.style.transform = `rotateY(${(dir > 0 ? f : 1 - f) * 118}deg)`;
  } else if (S.turn === 'fade' && canGo) flow.style.opacity = 1 - Math.min(.6, Math.abs(dx) / W);
}
function endDrag(dx) {
  const dir = dx > 0 ? 1 : -1, canGo = Math.abs(dx) > W * .14 && page + dir >= 0 && page + dir < pages;
  if (S.turn === 'slide') {
    animating = true; if (canGo) page += dir;
    flow.style.transition = 'transform .28s cubic-bezier(.25,.8,.3,1)'; place(page);
    setTimeout(() => { flow.style.transition = ''; if (canGo) { clearFind(); updateHud(); } animating = false; }, 280);
  } else if (S.turn === 'flip' && leafDrag) {
    const { leaf, dir: d } = leafDrag; leafDrag = null; animating = true;
    const go = canGo && d === dir; const finalAngle = d > 0 ? (go ? 118 : 0) : (go ? 0 : 118);
    leaf.style.transition = 'transform .32s cubic-bezier(.3,.7,.3,1)'; leaf.style.transform = `rotateY(${finalAngle}deg)`;
    setTimeout(() => { leaf.remove(); page = go ? page + d : page; place(page); updateHud(); animating = false; }, 320);
  } else { flow.style.opacity = 1; if (canGo) turn(dir); }
}
function tap(x, y, p) {
  if (p.hadSel) { hideSel(); return; }
  const mk = p.t.closest && p.t.closest('mark.hl');
  if (mk) { showHlBar(mk); return; }
  const z = p.t.closest && p.t.closest('[data-zoom]');
  if (z) { openFigure(byId[z.dataset.zoom]); return; }
  const r = pager.getBoundingClientRect(), fx = (x - r.left) / r.width;
  if (!$('#popmenu').hidden) { hidePop(); return; }
  if (fx < .28) turn(1); else if (fx > .72) turn(-1); else toggleChrome();
}
pager.addEventListener('click', e => {
  const tl = e.target.closest('[data-toc]'); if (tl) { e.preventDefault(); goBlock(tl.dataset.toc); return; }
  if (e.target.closest('[data-lock]')) { toast('הפרק לא כלול בהדמיה'); return; }
  const x = e.target.closest('a.xref'); if (x) { e.preventDefault(); openFigure(figs[x.dataset.fig], true); return; }
  const d = e.target.closest('[data-done]');
  if (d) { const id = d.dataset.done; S.done[id] = !S.done[id]; if (!S.done[id]) delete S.done[id]; d.setAttribute('aria-pressed', !!S.done[id]); d.textContent = S.done[id] ? 'נענתה ✓' : 'סימון כנענתה'; save(); return; }
  const a = e.target.closest('[data-ans]'); if (a) openAnswer(a.dataset.ans);
});
pager.addEventListener('wheel', e => {
  e.preventDefault();
  if (animating || wheelLock) return;
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : e.deltaY;
  if (Math.abs(d) < 14) return;
  wheelLock = true; setTimeout(() => { wheelLock = false; }, 420); turn(d > 0 ? 1 : -1);
}, { passive: false });
let wheelLock = false;
document.addEventListener('keydown', e => {
  if (reader.hidden || !$('#sheet').hidden || /TEXTAREA|INPUT/.test(document.activeElement.tagName)) { if (e.key === 'Escape') closeSheet(); return; }
  if (e.key === 'ArrowLeft' || e.key === ' ') { e.preventDefault(); turn(1); }
  if (e.key === 'ArrowRight') turn(-1);
  if (e.key === 'Escape') closeReader();
});

/* ---------- selection ---------- */
function caretAt(x, y) {
  if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
  const c = document.caretPositionFromPoint && document.caretPositionFromPoint(x, y);
  if (!c) return null; const r = document.createRange(); r.setStart(c.offsetNode, c.offset); return r;
}
let selBase = null;
function wordRange(node, off) {
  const t = node.nodeValue || '';
  let a = off, b = off;
  while (a > 0 && !/\s/.test(t[a - 1])) a--;
  while (b < t.length && !/[\s.,:;?!()]/.test(t[b])) b++;
  const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b);
  return r;
}
function selectWord(x, y) {
  const c = caretAt(x, y);
  if (!c || c.startContainer.nodeType !== 3 || !flow.contains(c.startContainer) || !c.startContainer.parentElement.closest('[data-t]')) return null;
  flow.classList.add('selecting');
  const r = wordRange(c.startContainer, c.startOffset);
  if (r.collapsed) return null;
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  return r;
}
function beginSelect(x, y) {
  hideSel();
  const r = selectWord(x, y); if (!r) return;
  P.mode = 'select'; selBase = r.cloneRange();
}
function extendSelect(x, y) {
  const r = caretAt(x, y); if (!r || !selBase || r.startContainer.nodeType !== 3 || !flow.contains(r.startContainer) || !r.startContainer.parentElement.closest('[data-t]')) return;
  const s = getSelection();
  const before = r.compareBoundaryPoints(Range.START_TO_START, selBase) < 0;
  try { before ? s.setBaseAndExtent(selBase.endContainer, selBase.endOffset, r.startContainer, r.startOffset) : s.setBaseAndExtent(selBase.startContainer, selBase.startOffset, r.startContainer, r.startOffset); } catch (e) {}
}
function endSelect() {
  const s = getSelection();
  if (!s.rangeCount || s.isCollapsed) { hideSel(); return; }
  showSelBar(s.getRangeAt(0));
}
function placeBar(rect) {
  const bar = $('#selbar'), R = reader.getBoundingClientRect(); bar.hidden = false;
  const bw = bar.offsetWidth, bh = bar.offsetHeight;
  const x = Math.max(8, Math.min(R.width - bw - 8, rect.left - R.left + rect.width / 2 - bw / 2));
  let y = rect.top - R.top - bh - 10; if (y < 60) y = rect.bottom - R.top + 10;
  bar.style.left = x + 'px'; bar.style.top = y + 'px';
}
const swatches = cur => Object.keys(COLORS).map(c => `<button data-c="${c}" aria-label="צבע"><span class="sw" style="background:${COLORS[c]};${cur === c ? 'outline:2px solid currentColor;outline-offset:1px' : ''}"></span></button>`).join('');
function showSelBar(range) {
  const bar = $('#selbar');
  const pieces = selectionPieces(range);
  bar.innerHTML = swatches() + `<span class="sep"></span><button data-a="note" aria-label="הערה">${icon('note')}</button><button data-a="copy" aria-label="העתקה">${icon('copy')}</button>`;
  bar.onclick = e => {
    const c = e.target.closest('[data-c]'), a = e.target.closest('[data-a]');
    if (c) { const made = addHighlights(pieces, c.dataset.c); hideSel(); toast('הודגש'); return made; }
    if (a && a.dataset.a === 'copy') { const t = range.toString(); navigator.clipboard && navigator.clipboard.writeText(t).catch(() => {}); hideSel(); toast('הועתק'); }
    if (a && a.dataset.a === 'note') { const made = addHighlights(pieces, 'yellow'); hideSel(); if (made[0]) openNote(made[0]); }
  };
  placeBar(range.getBoundingClientRect());
}
function selectionPieces(range) {
  const out = [];
  flow.querySelectorAll('[data-t]').forEach(el => {
    if (!range.intersectsNode(el)) return;
    const r = document.createRange(); r.selectNodeContents(el);
    if (range.compareBoundaryPoints(Range.START_TO_START, r) > 0) r.setStart(range.startContainer, range.startOffset);
    if (range.compareBoundaryPoints(Range.END_TO_END, r) < 0) r.setEnd(range.endContainer, range.endOffset);
    const pre = document.createRange(); pre.selectNodeContents(el); pre.setEnd(r.startContainer, r.startOffset);
    const start = pre.toString().length, text = r.toString();
    if (text.trim()) out.push({ block: el.dataset.b, start, end: start + text.length, text });
  });
  return out;
}
function addHighlights(pieces, color) {
  const made = pieces.map(p => ({ ...p, id: 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), color, note: '' }));
  S.hls.push(...made); save();
  [...new Set(pieces.map(p => p.block))].forEach(paintBlock);
  return made;
}
function showHlBar(m) {
  const h = S.hls.find(x => x.id === m.dataset.h); if (!h) return;
  const bar = $('#selbar');
  bar.innerHTML = swatches(h.color) + `<span class="sep"></span><button data-a="note" aria-label="הערה">${icon('note')}</button><button data-a="del" aria-label="מחיקה">${icon('trash')}</button>`;
  bar.onclick = e => {
    const c = e.target.closest('[data-c]'), a = e.target.closest('[data-a]');
    if (c) { h.color = c.dataset.c; save(); paintBlock(h.block); hideSel(); }
    if (a && a.dataset.a === 'del') { S.hls = S.hls.filter(x => x !== h); save(); paintBlock(h.block); hideSel(); }
    if (a && a.dataset.a === 'note') { hideSel(); openNote(h); }
  };
  placeBar(m.getBoundingClientRect());
}
function hideSel() { $('#selbar').hidden = true; const s = getSelection(); if (s) s.removeAllRanges(); flow.classList.remove('selecting'); }
flow.addEventListener('dblclick', e => {
  if (e.target.closest('button,a,img')) return;
  const r = selectWord(e.clientX, e.clientY); if (r) showSelBar(r);
});

/* ---------- popover + sheets ---------- */
const hidePop = () => { $('#popmenu').hidden = true; };
function openSheet(html, tall) {
  const sh = $('#sheet'); sh.innerHTML = html; sh.hidden = false; sh.classList.toggle('tall', !!tall);
  $('#scrim').hidden = false;
  const x = sh.querySelector('.sh-x'); if (x) x.onclick = closeSheet;
  return sh;
}
function closeSheet() { $('#sheet').hidden = true; $('#scrim').hidden = true; }
$('#scrim').onclick = closeSheet;
const head = t => `<div class="sh-head"><h3>${t}</h3><button class="sh-x" aria-label="סגירה">${icon('x')}</button></div>`;

function openMenu() {
  const m = $('#popmenu');
  if (!m.hidden) { hidePop(); return; }
  m.innerHTML = [['toc', 'תוכן עניינים', 'menu'], ['search', 'חיפוש בספר', 'search'], ['themes', 'תצוגה', null], ['scan', 'העמוד המקורי בספר', 'copy']]
    .map(([k, t, ic]) => `<button data-m="${k}"><span>${t}</span>${ic ? icon(ic) : '<b style="font:700 19px \'Frank Ruhl Libre\',serif">Aa</b>'}</button>`).join('');
  m.hidden = false;
  m.onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return; hidePop();
    ({ toc: () => openToc('toc'), search: () => openSearchSheet(), themes: openThemes, scan: () => { const a = anchorNow(); openScan(Math.max(7, Math.min(38, a.id && byId[a.id] ? byId[a.id].page : 7))); } })[b.dataset.m]();
  };
}
function openThemes() {
  const sh = openSheet(head('תצוגה') + `<div class="sh-body">
    <div class="seg" style="margin-bottom:10px"><button data-mode-set="light" aria-pressed="${!isDark() && S.theme !== 'calm'}">בהיר</button><button data-mode-set="yellow" aria-pressed="${S.theme === 'calm'}">צהוב</button><button data-mode-set="dark" aria-pressed="${isDark()}">כהה</button></div>
    <div class="size-row"><button id="t-dn" aria-label="הקטנה" style="font-size:16px">א</button><i></i><button id="t-up" aria-label="הגדלה" style="font-size:25px">א</button></div>
    <div class="themes">${Object.entries(THEMES).map(([k, [n, bg, fg]]) => `<button class="theme-c" data-t="${k}" aria-pressed="${S.theme === k}" style="background:${bg};color:${fg}"><b ${k === 'bold' ? 'style="font-weight:900"' : ''}>אב</b><span>${n}</span></button>`).join('')}</div>
    <div class="list">
      <div class="row"><span class="grow">גופן</span><select id="t-font" aria-label="גופן">${Object.entries(FONTS).map(([k, [n]]) => `<option value="${k}" ${S.font === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="row"><span class="grow">מרווח שורות</span><select id="t-lh" aria-label="מרווח שורות">${[[1.4, 'צפוף'], [1.6, 'רגיל'], [1.85, 'מרווח']].map(([v, n]) => `<option value="${v}" ${S.lh === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="row"><span class="grow">יישור לשני הצדדים</span><button class="toggle" id="t-just" aria-pressed="${S.justify}" aria-label="יישור"></button></div>
    </div>
    <div class="lab" style="margin-top:12px">אופן הדפדוף</div>
    <div class="seg">${[['slide', 'החלקה'], ['flip', 'דף מתהפך'], ['fade', 'עמעום']].map(([k, n]) => `<button data-turn="${k}" aria-pressed="${S.turn === k}">${n}</button>`).join('')}</div>
  </div>`);
  const refresh = () => { applyPrefs(); layout(); save(); };
  sh.querySelectorAll('[data-mode-set]').forEach(b => b.onclick = () => { S.theme = { light: 'original', yellow: 'calm', dark: 'focus' }[b.dataset.modeSet]; refresh(); openThemes(); });
  $('#t-dn', sh).onclick = () => { S.size = Math.max(15, S.size - 1); refresh(); };
  $('#t-up', sh).onclick = () => { S.size = Math.min(30, S.size + 1); refresh(); };
  sh.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { S.theme = b.dataset.t; sh.querySelectorAll('[data-t]').forEach(x => x.setAttribute('aria-pressed', x === b)); refresh(); openThemes(); });
  $('#t-font', sh).onchange = e => { S.font = e.target.value; refresh(); };
  $('#t-lh', sh).onchange = e => { S.lh = +e.target.value; refresh(); };
  $('#t-just', sh).onclick = e => { S.justify = !S.justify; e.target.setAttribute('aria-pressed', S.justify); refresh(); };
  sh.querySelectorAll('[data-turn]').forEach(b => b.onclick = () => { S.turn = b.dataset.turn; sh.querySelectorAll('[data-turn]').forEach(x => x.setAttribute('aria-pressed', x === b)); save(); });
}
function goBlock(id, findText) {
  const q = byId[id] && byId[id].q ? byId[id].q : null;
  closeSheet(); openReader();
  const el = flow.querySelector(`[data-b="${id}"]`) || (q && flow.querySelector(`[data-b="${q.id}"]`));
  if (!el) return;
  let target = pageOf(el);
  if (findText && el.hasAttribute('data-t')) {
    const at = el.textContent.indexOf(findText);
    if (at >= 0) {
      wrap(el, at, at + findText.length, 'find');
      const mk = el.querySelector('mark.find'); if (mk) target = pageOf(mk);
      page = Math.max(0, Math.min(pages - 1, target)); place(page); updateHud(); toggleChrome(false); return;
    }
  }
  setPage(target); toggleChrome(false);
}
function openToc(tab) {
  const tabs = [['toc', 'תוכן'], ['q', `שאלות`], ['hl', 'הדגשות'], ['mk', 'סימניות']];
  const sh = openSheet(head('מערכות בקרה') + `<div class="sh-body"><div class="seg">${tabs.map(([k, n]) => `<button data-tb="${k}" aria-pressed="${k === tab}">${n}</button>`).join('')}</div><div id="tb"></div></div>`, true);
  sh.querySelectorAll('[data-tb]').forEach(b => b.onclick = () => openToc(b.dataset.tb));
  const tb = $('#tb', sh);
  if (tab === 'toc') {
    const cur = currentSection();
    tb.innerHTML = `<div class="list">${toc.map(t => `<button class="row ${t.lv === 2 ? 'sub' : ''}" data-go="${t.id}"><span class="grow" style="${t === cur ? 'color:var(--accent);font-weight:600' : t.lv === 1 ? 'font-weight:600' : ''}">${t.lv === 1 && t.l ? t.l + ' · ' : ''}${esc(t.t)}</span><span class="pg">${t.page}</span></button>`).join('')}
      ${CHAPTERS.map(c => `<button class="row locked" data-locked="1"><span class="grow">${c[0] ? c[0] + ' · ' : ''}${esc(c[1])}</span>${icon('lock')}</button>`).join('')}</div>`;
  } else if (tab === 'q') {
    const n = Object.keys(S.done).length;
    tb.innerHTML = `<div class="lab">${n} מתוך ${questions.length} נענו · בספר אין תשובות לשאלות של פרק 1</div><div class="list">${questions.map(q => {
      const first = q.items.find(i => i.k === 'p' || i.k === 'li');
      return `<button class="row" data-go="${q.id}"><span class="grow">${esc(q.title)}<small>${esc(first ? strip(first.h).slice(0, 62) + '…' : '')}</small></span>${S.done[q.id] ? `<span style="color:var(--ok)">${icon('check')}</span>` : ''}</button>`;
    }).join('')}</div>`;
  } else if (tab === 'hl') {
    tb.innerHTML = S.hls.length ? `<div class="list">${S.hls.map(h => `<button class="row" data-go="${h.block}"><span class="dot" style="background:${COLORS[h.color]}"></span><span class="grow">${esc(h.text.slice(0, 90))}<small>${h.note ? esc(h.note) + ' · ' : ''}עמ׳ ${byId[h.block].page}</small></span></button>`).join('')}</div>` : `<div class="empty">אין עדיין הדגשות.<br>לחיצה ארוכה על מילה בטקסט מסמנת אותה.</div>`;
  } else {
    tb.innerHTML = S.marks.length ? `<div class="list">${S.marks.map(m => `<button class="row" data-go="${m.id}"><span class="grow">${esc(sectionOf(byId[m.id]).t)}<small>${esc(blockText(byId[m.id]).slice(0, 70))}</small></span><span class="pg">${byId[m.id].page}</span></button>`).join('')}</div>` : `<div class="empty">אין עדיין סימניות.<br>הסימנייה נמצאת בפינה העליונה של העמוד.</div>`;
  }
  tb.onclick = e => {
    const g = e.target.closest('[data-go]'); if (g) { goBlock(g.dataset.go); return; }
    if (e.target.closest('[data-locked]')) toast('הפרק לא כלול בהדמיה');
  };
}
function searchIndex(q) {
  const out = []; if (q.length < 2) return out;
  flat.forEach(b => {
    if (!['p', 'li', 'note', 'h1', 'h2'].includes(b.k) && !(b.k === 'fig' && b.cap)) return;
    const t = blockText(b); let i = t.indexOf(q);
    if (i >= 0) out.push({ b, i, t });
  });
  return out;
}
function resultsHtml(q) {
  const rs = searchIndex(q);
  if (q.length < 2) return '<div class="empty">אפשר לחפש מושג, איור או מילה בפתח הדבר ובפרק 1.</div>';
  if (!rs.length) return `<div class="empty">לא נמצאו תוצאות עבור "${esc(q)}"</div>`;
  return `<div class="lab">${rs.length} תוצאות</div><div class="list">${rs.slice(0, 60).map(r => {
    const a = Math.max(0, r.i - 28), snippet = esc(r.t.slice(a, r.i)) + `<mark class="s">${esc(q)}</mark>` + esc(r.t.slice(r.i + q.length, r.i + q.length + 42));
    return `<button class="row" data-go="${r.b.id}"><span class="grow"><span style="font-size:15px;line-height:1.4">${a ? '…' : ''}${snippet}…</span><small>${esc(sectionOf(r.b).t)}</small></span><span class="pg">${r.b.page}</span></button>`;
  }).join('')}</div>`;
}
function wireSearch(root, input, res) {
  input.oninput = () => { res.innerHTML = resultsHtml(input.value.trim()); };
  res.onclick = e => { const g = e.target.closest('[data-go]'); if (g) goBlock(g.dataset.go, input.value.trim()); };
  res.innerHTML = resultsHtml(input.value.trim());
}
function openSearchSheet() {
  const sh = openSheet(head('חיפוש בספר') + `<div class="sh-body"><label class="field">${icon('search')}<input id="sq" placeholder="חיפוש" enterkeyhint="search" aria-label="חיפוש"></label><div id="sr" style="margin-top:10px"></div></div>`, true);
  wireSearch(sh, $('#sq', sh), $('#sr', sh)); $('#sq', sh).focus();
}
function openFigure(b, sheet) {
  if (!b) return;
  if (sheet) {
    const sh = openSheet(head(esc((strip(b.cap).match(/איור\s+\d+\.\d+/) || ['איור'])[0])) + `<div class="sh-body"><div class="sh-fig"><img src="${b.src}" alt=""></div><div class="sh-cap">${esc(strip(b.cap).replace(/^איור\s+\d+\.\d+\s*/, ''))}</div><button class="btn2" id="f-go">מעבר לאיור בספר</button></div>`);
    $('#f-go', sh).onclick = () => goBlock(b.id);
    return;
  }
  const lb = $('#lightbox'); lb.hidden = false; lb.className = 'lb-fig';
  lb.innerHTML = `<div class="lb-top"><span>${b.cap ? esc(strip(b.cap)) : 'איור'}</span><button class="round" id="lb-x" aria-label="סגירה">${icon('x')}</button></div><div class="lb-img"><img src="${b.src}" alt=""></div><div class="lb-bot" style="justify-content:center"><span class="lb-note">לחיצה על האיור מגדילה אותו</span></div>`;
  $('#lb-x', lb).onclick = () => { lb.hidden = true; };
  $('img', lb).onclick = () => lb.classList.toggle('zoom');
}
function openScan(n) {
  const lb = $('#lightbox'); lb.hidden = false; lb.className = '';
  const FIRST = 7, LAST = 38;
  const paint = () => {
    lb.innerHTML = `<div class="lb-top"><span>העמוד המקורי · עמ׳ ${n}</span><button class="round" id="lb-x" aria-label="סגירה">${icon('x')}</button></div><div class="lb-img"><img src="scan/${n}.jpg" alt="עמוד ${n}"></div><div class="lb-bot"><button id="lb-p" ${n <= FIRST ? 'disabled' : ''}>הקודם</button><span>${n}</span><button id="lb-n" ${n >= LAST ? 'disabled' : ''}>הבא</button></div>`;
    $('#lb-x', lb).onclick = () => { lb.hidden = true; };
    $('img', lb).onclick = () => lb.classList.toggle('zoom');
    $('#lb-p', lb).onclick = () => { n--; paint(); };
    $('#lb-n', lb).onclick = () => { n++; paint(); };
  };
  paint();
}
function openNote(h) {
  const sh = openSheet(head('הערה') + `<div class="sh-body"><p class="quote">${esc(h.text.slice(0, 140))}</p><textarea class="note-area" id="n-t" placeholder="כתיבת הערה" aria-label="הערה">${esc(h.note || '')}</textarea><button class="btn2" id="n-s">שמירה</button></div>`);
  $('#n-s', sh).onclick = () => { h.note = $('#n-t', sh).value.trim(); save(); paintBlock(h.block); closeSheet(); };
}
function openAnswer(id) {
  const q = byId[id];
  const sh = openSheet(head(esc(q.title)) + `<div class="sh-body"><textarea class="note-area" id="a-t" placeholder="התשובה שלי" aria-label="התשובה שלי">${esc(S.answers[id] || '')}</textarea><button class="btn2" id="a-s">שמירה</button></div>`);
  $('#a-s', sh).onclick = () => {
    const v = $('#a-t', sh).value.trim();
    if (v) S.answers[id] = v; else delete S.answers[id];
    const btn = flow.querySelector(`[data-ans="${id}"]`); if (btn) btn.textContent = v ? 'התשובה שלי' : '+ כתיבת תשובה';
    save(); closeSheet();
  };
}
let toastT; function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 1500); }

/* ---------- reader open/close ---------- */
function openReader() {
  if (reader.hidden) {
    reader.hidden = false; $('#cover-screen').hidden = true; $('#brand').classList.add('small'); $('#brand').setAttribute('aria-label', 'סגירת הספר'); applyPrefs(); layout(); toggleChrome(false);
  }
}
function closeReader() { reader.hidden = true; $('#brand').classList.remove('small'); $('#brand').setAttribute('aria-label', 'מערך הבקרה ופיקוח טיסה'); const cs = $('#cover-screen'); cs.hidden = false; cs.classList.remove('opening'); cs.classList.add('enter'); hideSel(); renderCover(); }
$('#r-mark').innerHTML = icon('mark'); $('#r-menu').innerHTML = icon('menu');
$('#brand').onclick = () => { if (!reader.hidden) closeReader(); };
$('#r-menu').onclick = openMenu;
$('#r-mark').onclick = () => {
  const a = anchorNow(); if (!a.id) return;
  const on = S.marks.filter(m => { const el = flow.querySelector(`[data-b="${m.id}"]`); return el && pageOf(el) <= page && lastPageOf(el) >= page; });
  if (on.length) S.marks = S.marks.filter(m => !on.includes(m)); else S.marks.push({ id: a.id });
  save(); updateHud();
};
$('#scrubber').oninput = e => setPage(+e.target.value);
let lastH = 0;
new ResizeObserver(() => { if (!reader.hidden && (pager.clientWidth !== W || pager.clientHeight !== lastH)) { lastH = pager.clientHeight; layout(); } }).observe(pager);
if (document.fonts) {
  // Reader fonts load lazily; a late swap reflows the columns, so re-paginate from the saved anchor
  document.fonts.addEventListener('loadingdone', () => layout());
  ['"David Libre"', '"Frank Ruhl Libre"'].forEach(f => ['400', '700'].forEach(w => document.fonts.load(`${w} 20px ${f}`, 'אב').catch(() => {})));
}

/* ---------- closed book ---------- */
function renderCover() {
  const pct = Math.round(S.progress * 100), a = S.anchor && byId[S.anchor], sec = a && a.k !== 'front' ? sectionOf(a) : null;
  const el = $('#cover-screen');
  el.innerHTML = `<button class="mode-btn" id="c-mode" aria-label="${isDark() ? 'מעבר למראה בהיר' : 'מעבר למראה כהה'}">${icon(isDark() ? 'sun' : 'moon')}</button>
    <div class="book" id="c-book"><div class="book-inner" id="c-cover"><img class="cover" src="cover.jpg" alt="כריכת הספר מערכות בקרה"></div></div>
    <div class="cover-info"><h1>מערכות בקרה</h1><p>ד״ר רפי יהל, זאב בהיר</p>
      ${S.started ? `<div class="progress"><i style="width:${pct}%"></i></div><p style="font-size:13px">${pct}%${sec ? ' · ' + esc(sec.t) : ''}</p>` : ''}
      <button class="cta" id="c-go">${S.started ? 'המשך קריאה' : 'פתיחת הספר'}</button>
      <button class="cta2" id="c-toc">תוכן העניינים</button></div>`;
  $('#c-cover').onclick = $('#c-go').onclick = openBook;
  $('#c-mode').onclick = () => { S.theme = isDark() ? 'original' : 'focus'; save(); applyPrefs(); renderCover(); };
  $('#c-toc').onclick = () => { openReader(); toggleChrome(true); openToc('toc'); };
}
applyMode();
renderCover();
$('#cover-screen').classList.add('pre');

/* The closed book tilts toward the pointer */
const cs = $('#cover-screen');
cs.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' || cs.classList.contains('opening')) return;
  const r = cs.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  cs.style.setProperty('--ry', (-9 + x * 18).toFixed(1) + 'deg');
  cs.style.setProperty('--rx', (-y * 10).toFixed(1) + 'deg');
  cs.style.setProperty('--sh', (x * 40).toFixed(1) + 'deg');
});
function openBook() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) { openReader(); return; }
  cs.getBoundingClientRect();
  openReader();
  cs.hidden = false; cs.classList.remove('enter'); cs.classList.add('opening');
  setTimeout(() => { cs.hidden = true; cs.classList.remove('opening'); }, 950);
}

/* Entrance. A returning reader lands back on their page; everyone can tap to skip */
const splash = $('#splash');
let splashDone = false;
function endSplash() {
  if (splashDone) return; splashDone = true;
  splash.classList.add('out');
  cs.classList.remove('pre');
  if (S.started) openReader(); else cs.classList.add('enter');
  setTimeout(() => { splash.hidden = true; }, 650);
}
splash.addEventListener('click', endSplash);
setTimeout(endSplash, matchMedia('(prefers-reduced-motion:reduce)').matches ? 300 : 1700);
})();
