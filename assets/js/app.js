/* Left & Right cosy apartments — site logic (no build step, no dependencies besides Leaflet). */
(() => {
  'use strict';

  const LANGS = ['el', 'en', 'de', 'fr', 'it'];
  const LISTINGS = {
    left: { url: 'https://www.airbnb.com/rooms/33269659', photos: 21, cover: 2 },
    right: { url: 'https://www.airbnb.com/rooms/33290360', photos: 24, cover: 1 },
  };
  const HOSTING_SINCE = 2018;
  const CATS = {
    eat: '#b5562b', coffee: '#7a5a3a', drinks: '#1f3a5f',
    sights: '#b8892f', beach: '#2f8f9d', practical: '#5f6b66',
  };
  const AMENITIES = [
    ['wifi', 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01'],
    ['ac', 'M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5'],
    ['tv', 'M3 5h18v12H3zM8 21h8'],
    ['kitchen', 'M6 3v8a2 2 0 0 0 2 2v8M10 3v8M8 3v6M17 3c-2 2-2 8 0 9v9'],
    ['coffee', 'M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3'],
    ['washer', 'M5 3h14v18H5zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 6h.01M11 6h.01'],
    ['shower', 'M5 21V8a4 4 0 0 1 8 0M9 10h8l-1-3h-6zM11 14v.01M13 17v.01M15 14v.01M11 20v.01M15 20v.01'],
    ['linen', 'M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M6 9V6h12v3M3 18v2M21 18v2'],
    ['hair', 'M4 5h10a4 4 0 0 1 0 8H4zM8 13l1 8h3l-1-8M18 9h3'],
    ['iron', 'M3 17h18l-2-7a4 4 0 0 0-4-3H9M3 17c0-3 2-5 6-5h10.5M9 7V5'],
    ['parking', 'M5 3h14v18H5zM10 17V8h3a2.5 2.5 0 0 1 0 5h-3'],
    ['clean', 'M9 3h6l-1 6h-4zM7 21l1-10h8l1 10zM10 15h4'],
  ];
  const ICONS = {
    plane: 'M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4v2l-7-2v4.5l2 1.5v1.5l-3.5-1-3.5 1V19l2-1.5V13l-7 2v-2l7-4z',
    ship: 'M3 17c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M5 14l-1-4h16l-1 4M7 10V6h10v4M12 3v3',
    bus: 'M5 4h14v12H5zM5 11h14M8 19v-3M16 19v-3M8 14h.01M16 14h.01',
    city: 'M3 21h18M5 21V9l5-3v15M10 21V4l9 4v13M13 10h3M13 14h3M7 12h1M7 16h1',
    taxi: 'M5 16V12l2-5h10l2 5v4M5 16h14M5 16v2M19 16v2M8 13h.01M16 13h.01M10 7V5h4v2',
    walk: 'M13 4a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M8 12l2-4h3l2 4 3 1M10 8l-1 5',
    car: 'M5 16V12l2-5h10l2 5v4M5 16h14M5 16v2M19 16v2M8 13h.01M16 13h.01',
    map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  };
  const ARRIVALS = [
    { id: 'airport', icon: 'plane', how: [['taxi', 'taxi'], ['bus', 'bus'], ['car', 'car']] },
    { id: 'port', icon: 'ship', how: [['walk', 'walk'], ['taxi', 'taxi']] },
    { id: 'ktel', icon: 'bus', how: [['walk', 'walk'], ['map', 'trips']] },
    { id: 'centre', icon: 'city', how: [['walk', 'walk'], ['bus', 'bus'], ['taxi', 'taxi']] },
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html = '') => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) v != null && n.setAttribute(k, v);
    n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const getJSON = (path) => fetch(path, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  /* ---------- i18n ---------- */
  let lang = 'en';
  const t = (key, vars) => {
    let s = (window.I18N[lang] && window.I18N[lang][key]) ?? window.I18N.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };
  const pickLang = () => {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    let saved = null;
    try { saved = localStorage.getItem('lang'); } catch {}
    const nav = (navigator.languages || [navigator.language || 'en']).map((l) => l.slice(0, 2));
    return [fromUrl, saved, ...nav, 'en'].find((l) => LANGS.includes(l));
  };
  const rerender = [];
  function setLang(next, save) {
    lang = next;
    if (save) { try { localStorage.setItem('lang', lang); } catch {} }
    document.documentElement.lang = lang;
    document.title = t('meta.title');
    // each language has its own address (?lang=xx) so search engines can index every version
    const url = `https://left-and-right-apartments.github.io/${lang === 'en' ? '' : `?lang=${lang}`}`;
    $('link[rel="canonical"]').href = url;
    $('meta[property="og:url"]').content = url;
    $('meta[property="og:title"]').content = t('meta.title');
    $('meta[property="og:description"]').content = t('meta.desc');
    $('meta[property="og:locale"]').content = { en: 'en_GB', el: 'el_GR', de: 'de_DE', fr: 'fr_FR', it: 'it_IT' }[lang];
    $('meta[name="description"]').setAttribute('content', t('meta.desc'));
    $$('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $$('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); }); // our own static strings only
    $$('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
    $$('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); n.setAttribute('aria-label', n.title); });
    $('#langCur').textContent = lang.toUpperCase();
    $$('#langMenu li').forEach((li) => li.setAttribute('aria-selected', li.dataset.lang === lang));
    rerender.forEach((fn) => fn());
  }
  const fmtDate = (iso, opts) => new Intl.DateTimeFormat(lang, opts).format(new Date(iso));
  const fmtKm = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(m / 1000)} km`);
  const mins = (s) => Math.max(1, Math.round(s / 60));

  /* ---------- header ---------- */
  function initHeader() {
    const header = $('.site-header');
    const onScroll = () => header.classList.toggle('is-solid', scrollY > innerHeight * 0.7 || $('#nav').classList.contains('is-open'));
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const btn = $('#langBtn'), menu = $('#langMenu');
    const toggle = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(menu.hidden); });
    menu.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) { setLang(li.dataset.lang, true); toggle(false); } });
    document.addEventListener('click', () => toggle(false));

    // logo: always back to the top of the home page
    $('#brandHome').addEventListener('click', (e) => {
      e.preventDefault();
      if ($('#guideGrid').classList.contains('is-full')) $('#btnFull').click();
      $('#nav').classList.remove('is-open'); $('#burger').setAttribute('aria-expanded', false);
      history.replaceState(null, '', location.pathname + location.search);
      scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
    const burger = $('#burger'), nav = $('#nav');
    const setNav = (open) => { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); onScroll(); };
    burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (e) => e.target.closest('a') && setNav(false));
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------- galleries + lightbox ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const photo = (apt, i, small) => `assets/img/${apt}/${pad(i)}${small ? '-sm' : ''}.jpg`;
  const lb = { apt: 'left', i: 1 };
  function showLb() {
    $('#lbImg').src = photo(lb.apt, lb.i);
    $('#lbCap').textContent = `${lb.apt === 'left' ? 'Left' : 'Right'} · ${lb.i} / ${LISTINGS[lb.apt].photos}`;
  }
  function stepLb(d) { const n = LISTINGS[lb.apt].photos; lb.i = ((lb.i - 1 + d + n) % n) + 1; showLb(); }
  function initGalleries() {
    $$('.apt').forEach((sec) => {
      const apt = sec.dataset.apt, cfg = LISTINGS[apt];
      const main = $('.apt-main', sec), mainImg = $('img', main), thumbs = $('.apt-thumbs', sec);
      let cur = cfg.cover;
      const order = [cfg.cover, ...Array.from({ length: cfg.photos }, (_, k) => k + 1).filter((k) => k !== cfg.cover)];
      order.forEach((i) => {
        const b = el('button', { 'aria-label': `Photo ${i}`, role: 'listitem' }, `<img src="${photo(apt, i, true)}" alt="" loading="lazy">`);
        if (i === cur) b.classList.add('is-on');
        b.addEventListener('click', () => {
          cur = i;
          mainImg.style.opacity = 0;
          setTimeout(() => { mainImg.src = photo(apt, i); mainImg.onload = () => { mainImg.style.opacity = 1; }; }, 180);
          $$('button', thumbs).forEach((x) => x.classList.toggle('is-on', x === b));
        });
        thumbs.append(b);
      });
      main.addEventListener('click', () => { lb.apt = apt; lb.i = cur; showLb(); $('#lightbox').hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus(); });
    });
    const close = () => { $('#lightbox').hidden = true; document.body.style.overflow = ''; };
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => stepLb(-1));
    $('#lbNext').addEventListener('click', () => stepLb(1));
    $('#lightbox').addEventListener('click', (e) => e.target.id === 'lightbox' && close());
    addEventListener('keydown', (e) => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') stepLb(-1);
      if (e.key === 'ArrowRight') stepLb(1);
    });
  }

  /* ---------- floor plan ---------- */
  // Schematic layouts worked out from the photos, drawn the way you walk through the home:
  // the front door is at the bottom, and left/right are as you see them coming in.
  // Each room: position in the drawing, label position (lx, ly), its photos, and a furniture sketch (f).
  const SEATS = '<circle cx="160" cy="596" r="9"/><rect x="128" y="590" width="16" height="12" rx="3"/><rect x="176" y="590" width="16" height="12" rx="3"/>';
  const BED = '<rect x="110" y="22" width="100" height="100" rx="6"/><rect x="118" y="30" width="38" height="20" rx="5"/><rect x="164" y="30" width="38" height="20" rx="5"/>';
  const PLAN = {
    left: { rooms: [
      { id: 'bedroom', x: 10, y: 10, w: 300, h: 150, ly: 146, photos: [12, 13, 14], f: BED + '<rect x="18" y="60" width="9" height="90" rx="2"/>' },
      { id: 'bath', x: 10, y: 164, w: 186, h: 96, ly: 246, photos: [16, 17, 18, 19], f: '<rect x="18" y="172" width="46" height="40" rx="3"/><path d="M18 212 64 172"/><circle cx="104" cy="186" r="9"/><rect x="150" y="172" width="22" height="32" rx="6"/>' },
      { id: 'hall', x: 200, y: 164, w: 110, h: 96, ly: 246, lx: 248, photos: [15], f: '<rect x="295" y="172" width="9" height="80" rx="2"/>' },
      { id: 'kitchen', x: 10, y: 264, w: 300, h: 130, lx: 255, ly: 334, photos: [5, 6, 7, 8, 11, 9, 10], f: '<path d="M20 274h132v14H34v54h118v14H20z"/><circle cx="62" cy="368" r="4.5"/><circle cx="86" cy="368" r="4.5"/><circle cx="110" cy="368" r="4.5"/><circle cx="134" cy="368" r="4.5"/>' },
      { id: 'living', x: 10, y: 398, w: 300, h: 170, lx: 190, ly: 500, photos: [2, 3, 4, 21, 1], f: '<path d="M20 412h32v110h70v32H20z"/><rect x="78" y="450" width="36" height="48" rx="4"/><rect x="298" y="440" width="7" height="84" rx="2"/><rect x="266" y="406" width="26" height="26" rx="8"/>' },
      { id: 'patio', x: 60, y: 572, w: 200, h: 58, ly: 624, out: true, photos: [20], f: SEATS },
    ] },
    right: { rooms: [
      { id: 'bedroom', x: 10, y: 10, w: 196, h: 150, ly: 146, photos: [9, 10, 11, 12, 13], f: '<rect x="60" y="22" width="96" height="100" rx="6"/><rect x="68" y="30" width="36" height="20" rx="5"/><rect x="112" y="30" width="36" height="20" rx="5"/><rect x="18" y="60" width="9" height="90" rx="2"/>' },
      { id: 'yard', x: 210, y: 10, w: 100, h: 250, ly: 246, out: true, photos: [24], f: '<circle cx="260" cy="110" r="10"/><rect x="252" y="78" width="16" height="12" rx="3"/><rect x="252" y="130" width="16" height="12" rx="3"/>' },
      { id: 'hall', x: 10, y: 164, w: 80, h: 96, ly: 246, photos: [8], f: '<rect x="16" y="172" width="8" height="60" rx="2"/>' },
      { id: 'bath', x: 94, y: 164, w: 112, h: 96, ly: 246, photos: [14, 15], f: '<rect x="102" y="172" width="40" height="40" rx="3"/><path d="M102 212 142 172"/><circle cx="166" cy="186" r="9"/><rect x="178" y="210" width="20" height="30" rx="6"/>' },
      { id: 'living', x: 10, y: 264, w: 300, h: 170, lx: 110, ly: 418, photos: [1, 5, 7, 6], f: '<path d="M300 424H186v-32h82v-82h32z"/><rect x="204" y="328" width="44" height="42" rx="4"/><circle cx="170" cy="340" r="10"/><circle cx="178" cy="368" r="10"/><rect x="15" y="306" width="7" height="84" rx="2"/><rect x="128" y="272" width="28" height="28" rx="9"/>' },
      { id: 'kitchen', x: 10, y: 438, w: 300, h: 130, ly: 524, photos: [4, 2, 3, 19], f: '<rect x="16" y="472" width="22" height="90" rx="3"/><rect x="282" y="470" width="22" height="92" rx="3"/><rect x="212" y="446" width="92" height="22" rx="3"/><circle cx="226" cy="482" r="6"/><circle cx="252" cy="482" r="6"/>' },
      { id: 'patio', x: 60, y: 572, w: 200, h: 58, ly: 624, out: true, photos: [16], f: SEATS },
    ] },
  };
  let planApt = 'left', planRoom = 'living', planDim = '3d', tourTimer = null, tourStep = -1;
  const TOUR_MS = 2400;
  const planRooms = () => PLAN[planApt].rooms;
  const tourOrder = () => [...planRooms()].sort((r1, r2) => (r2.y + r2.h) - (r1.y + r1.h) || r1.x - r2.x); // from the front door inwards
  /** Draws the rooms once per apartment/language. Each room is its own element so it can rise in 3D. */
  function renderPlan() {
    $('#floorplan').dataset.apt = planApt;
    $('#planSvg').innerHTML = `<div class="plan-stage" role="group" aria-label="${esc(t('plan.kicker'))}">${planRooms().map((r) => {
      const name = t('plan.' + r.id);
      const layers = [0, 1, 2, 3, 4].map((z) => `<svg class="fl${z === 4 ? ' top' : ''}" style="--z:${z}" viewBox="${r.x} ${r.y} ${r.w} ${r.h}" aria-hidden="true"><g class="pr-f">${r.f}</g></svg>`).join('');
      return `<button type="button" class="plan-room${r.out ? ' out' : ''}" data-room="${r.id}" aria-label="${esc(name)}" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">
        <i class="w wt"></i><i class="w wl"></i>${layers}<i class="w wb"></i><i class="w wr"></i>
        <span class="plan-label" style="left:${(r.lx || r.x + r.w / 2) - r.x}px;top:${r.ly - r.y - 4}px">${esc(name)}</span>
      </button>`;
    }).join('')}</div>`;
    fitPlan();
    showRoom();
  }
  function fitPlan() {
    const view = $('#planSvg'), stage = $('.plan-stage', view);
    if (!stage || !view.clientHeight) return;
    stage.style.setProperty('--k', Math.min(view.clientHeight / 640, view.clientWidth / 330).toFixed(3));
    // tilted, the model is wider than it is tall, so it needs its own scale to fit
    stage.style.setProperty('--k3', Math.min(view.clientHeight / 470, view.clientWidth / 600).toFixed(3));
  }
  /** Highlights the chosen room, moves the "camera" towards it and fills the side panel. */
  function showRoom() {
    const rooms = planRooms(), room = rooms.find((r) => r.id === planRoom) || rooms[0];
    const stage = $('.plan-stage');
    $('#floorplan').classList.toggle('is-3d', planDim === '3d');
    $$('.plan-room').forEach((n) => { const on = n.dataset.room === room.id; n.classList.toggle('is-on', on); n.setAttribute('aria-pressed', on); });
    if (stage) {
      const touring = tourStep >= 0;
      stage.style.setProperty('--tx', `${touring ? (160 - (room.x + room.w / 2)) * 0.55 : 0}px`);
      stage.style.setProperty('--ty', `${touring ? (320 - (room.y + room.h / 2)) * 0.55 : 0}px`);
      stage.style.setProperty('--zoom', touring ? 1.12 : 1);
      stage.style.setProperty('--rz', `${touring ? (tourStep % 2 ? -20 : -34) : -28}deg`);
    }
    $('#planPanel').innerHTML = `<p class="kicker">${planApt === 'left' ? 'Left' : 'Right'}</p><h3>${esc(t('plan.' + room.id))}</h3><p>${esc(t(`plan.${room.id}.d`))}</p>
      <div class="plan-photos">${room.photos.map((i) => `<button data-photo="${i}" aria-label="Photo ${i}"><img src="${photo(planApt, i, true)}" alt="" loading="lazy"></button>`).join('')}</div>`;
  }
  function tourStop() {
    clearTimeout(tourTimer); tourTimer = null; tourStep = -1;
    const b = $('#planTour'); if (!b) return;
    b.classList.remove('is-playing'); $('span', b).textContent = t('plan.tour');
    $('#planProg').innerHTML = '';
    showRoom();
  }
  function tourPlay() {
    const order = tourOrder();
    const next = () => {
      tourStep += 1;
      if (tourStep >= order.length) { planRoom = 'living'; return tourStop(); }
      planRoom = order[tourStep].id;
      $$('#planProg i').forEach((n, k) => { n.className = k < tourStep ? 'done' : k === tourStep ? 'now' : ''; });
      showRoom();
      tourTimer = setTimeout(next, TOUR_MS);
    };
    tourStep = -1;
    $('#planTour').classList.add('is-playing'); $('#planTour span').textContent = t('plan.pause');
    $('#planProg').innerHTML = order.map(() => '<i></i>').join('');
    $('#planProg').style.setProperty('--ms', `${TOUR_MS}ms`);
    next();
  }
  function initPlan() {
    $('#planSvg').insertAdjacentHTML('beforebegin', `<div class="plan-ctrl">
      <button type="button" class="btn btn-ink btn-sm" id="planTour"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="ic-play" d="M8 5v14l11-7z"/><path class="ic-pause" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg><span data-i18n="plan.tour">Play tour</span></button>
      <div class="seg seg-sm" id="planDimSeg"><button type="button" class="is-on" data-dim="3d">3D</button><button type="button" data-dim="2d">2D</button></div>
    </div>`);
    $('#planSvg').insertAdjacentHTML('afterend', '<div class="plan-progress" id="planProg"></div>');
    const pick = (g) => { if (!g) return; if (tourTimer) tourStop(); planRoom = g.dataset.room; showRoom(); };
    $('#planSvg').addEventListener('click', (e) => pick(e.target.closest('.plan-room')));
    $('#planTour').addEventListener('click', () => (tourTimer ? tourStop() : tourPlay()));
    $('#planDimSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      planDim = b.dataset.dim;
      $$('#planDimSeg button').forEach((x) => x.classList.toggle('is-on', x === b));
      showRoom();
    });
    addEventListener('resize', fitPlan);
    const setApt = (apt) => {
      if (tourTimer) tourStop();
      planApt = apt;
      if (!PLAN[apt].rooms.some((r) => r.id === planRoom)) planRoom = 'living';
      $$('#planSeg button').forEach((x) => x.classList.toggle('is-on', x.dataset.apt === apt));
      renderPlan();
    };
    $('#planSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setApt(b.dataset.apt); });
    $('#planPanel').addEventListener('click', (e) => {
      const b = e.target.closest('[data-photo]'); if (!b) return;
      if (tourTimer) tourStop();
      lb.apt = planApt; lb.i = +b.dataset.photo; showLb();
      $('#lightbox').hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus();
    });
    // "Floor plan" button in each apartment card opens the popup
    const modal = $('#floorplan');
    let opener = null;
    const close = () => {
      if (modal.hidden) return;
      tourStop();
      modal.classList.remove('is-open'); setTimeout(() => { modal.hidden = true; }, 250);
      document.body.classList.remove('no-scroll'); if (opener) opener.focus();
    };
    $$('.apt').forEach((sec) => {
      const b = el('button', { class: 'btn btn-ghost plan-link', type: 'button' }, `${svg('M3 4h18v16H3zM3 12h7M10 4v5M10 15v5M15 20v-8h6')}<span data-i18n="plan.open">Floor plan</span>`);
      b.addEventListener('click', () => {
        opener = b; planRoom = 'living'; setApt(sec.dataset.apt);
        modal.hidden = false; document.body.classList.add('no-scroll');
        void modal.offsetWidth; modal.classList.add('is-open'); fitPlan(); // reflow so the fade-in runs
        $('#planClose').focus();
      });
      $('.apt-specs', sec).after($('.apt-rating', sec)); // rating sits with the specs, so the two buttons stay together
      $('.apt-cta', sec).append(b);
    });
    $('#planClose').addEventListener('click', close);
    modal.addEventListener('click', (e) => e.target === modal && close());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden && $('#lightbox').hidden) close(); });
  }

  /* ---------- amenities ---------- */
  function renderAmenities() {
    $('#amenGrid').innerHTML = AMENITIES.map(([key, d]) => `<li>${svg(d)}<span>${esc(t('amen.' + key))}</span></li>`).join('');
  }

  /* ---------- stats ---------- */
  let stats = null, statsApt = 'left';
  function renderStats() {
    if (!stats) return;
    const L = stats.left, R = stats.right, total = L.reviews + R.reviews;
    const avg = (L.rating * L.reviews + R.rating * R.reviews) / total;
    const values = {
      rating: avg.toFixed(2), reviews: total, years: new Date().getFullYear() - HOSTING_SINCE,
      five: Math.round((L.fiveStarPct * L.reviews + R.fiveStarPct * R.reviews) / total),
      'left.rating': L.rating.toFixed(2), 'left.reviews': L.reviews, 'right.rating': R.rating.toFixed(2), 'right.reviews': R.reviews,
    };
    $$('[data-stat]').forEach((n) => { n.textContent = values[n.dataset.stat]; });
    $$('[data-count]').forEach((n) => { n.dataset.to = values[n.dataset.count]; if (n.dataset.done) n.textContent = values[n.dataset.count] + (n.dataset.suffix || ''); });

    const s = stats[statsApt];
    $('#reviews').dataset.apt = statsApt;
    $('#catBars').innerHTML = Object.entries(s.categories).map(([k, v]) =>
      `<li><span>${esc(t('cat.' + k))}</span><b>${v.toFixed(1)}</b><i style="--w:0%" data-w="${(v / 5) * 100}"></i></li>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => $$('#catBars i').forEach((i) => i.style.setProperty('--w', i.dataset.w + '%'))));
    $('#mentions').innerHTML = Object.entries(s.mentions).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<li>${esc(t('m.' + k))}<b>${v}</b></li>`).join('');
    $('#readAll').href = LISTINGS[statsApt].url + '/reviews';
    $('#statsUpdated').textContent = stats.updated ? t('updated', { date: fmtDate(stats.updated, { day: 'numeric', month: 'long', year: 'numeric' }) }) : '';
  }
  function initStats() {
    $('#statsSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      statsApt = b.dataset.apt;
      $$('#statsSeg button').forEach((x) => x.classList.toggle('is-on', x === b));
      renderStats();
    });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const n = en.target, to = parseFloat(n.dataset.to || n.textContent), dec = +(n.dataset.dec || 0), suf = n.dataset.suffix || '';
      if (reducedMotion) { n.dataset.done = 1; return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        n.textContent = (to * e).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick); else { n.textContent = parseFloat(n.dataset.to || to).toFixed(dec) + suf; n.dataset.done = 1; }
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    $$('[data-count]').forEach((n) => io.observe(n));
  }

  /* ---------- review texts ---------- */
  let reviews = [], voicesApt = 'all', voicesTimer = null, voicesPaused = false;
  function renderVoices() {
    const list = reviews.filter((r) => voicesApt === 'all' || r.apt === voicesApt);
    $('#voicesTrack').innerHTML = list.map((r) => {
      const when = r.month ? fmtDate(r.month + '-15', { month: 'long', year: 'numeric' }) : '';
      const sub = [r.from, when].filter(Boolean).map(esc).join(' · ');
      return `<article class="voice" data-apt="${r.apt}"><span class="stars" aria-label="5/5">★★★★★</span><blockquote>${esc(r.text)}</blockquote><footer><span class="avatar">${esc(r.name.charAt(0))}</span><div><b>${esc(r.name)}</b><span>${sub}</span></div><span class="apt-pill">${r.apt === 'left' ? 'Left' : 'Right'}</span></footer></article>`;
    }).join('');
    $('#voicesTrack').scrollLeft = 0;
  }
  function stepVoices(dir) {
    const track = $('#voicesTrack'), card = $('.voice', track);
    if (!card) return;
    const w = card.getBoundingClientRect().width + 18;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
    if (dir > 0 && atEnd) track.scrollTo({ left: 0 });
    else track.scrollBy({ left: dir * w });
  }
  function initVoices() {
    $('#voicesPrev').addEventListener('click', () => stepVoices(-1));
    $('#voicesNext').addEventListener('click', () => stepVoices(1));
    $('#voicesSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      voicesApt = b.dataset.apt;
      $$('#voicesSeg button').forEach((x) => x.classList.toggle('is-on', x === b));
      renderVoices();
    });
    const track = $('#voicesTrack');
    ['mouseenter', 'focusin', 'touchstart'].forEach((ev) => track.addEventListener(ev, () => { voicesPaused = true; }, { passive: true }));
    ['mouseleave', 'focusout'].forEach((ev) => track.addEventListener(ev, () => { voicesPaused = false; }));
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') stepVoices(1); if (e.key === 'ArrowLeft') stepVoices(-1); });
    if (reducedMotion) return;
    new IntersectionObserver(([en]) => {
      clearInterval(voicesTimer);
      if (en.isIntersecting) voicesTimer = setInterval(() => !voicesPaused && !document.hidden && stepVoices(1), 6000);
    }, { threshold: 0.4 }).observe(track);
  }

  /* ---------- availability calendar ---------- */
  let avail = null, calOffset = 0;
  const CAL_MAX = 11;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function monthHTML(year, month, ranges) {
    const first = new Date(year, month, 1), days = new Date(year, month + 1, 0).getDate();
    const todayIso = iso(new Date());
    const lead = (first.getDay() + 6) % 7; // Monday first
    const dow = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
    let cells = dow.map((d) => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      const booked = ranges.some(([a, b]) => key >= a && key < b);
      const cls = ['day', key < todayIso ? 'past' : booked ? 'booked' : '', key === todayIso ? 'today' : ''].join(' ');
      cells += `<span class="${cls}"${booked ? ` title="${esc(t('avail.booked'))}"` : ''}>${d}</span>`;
    }
    const title = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(first);
    return `<div class="cal-month"><h4>${title}</h4><div class="cal-grid">${cells}</div></div>`;
  }
  function renderCalendar() {
    const now = new Date(), pending = !avail || !avail.updated;
    $('#availability').classList.toggle('is-pending', pending);
    $('#availNote').hidden = !pending;
    $('#availUpdated').textContent = pending ? '' : t('updated', { date: fmtDate(avail.updated, { day: 'numeric', month: 'long' }) });
    $$('.cal-card').forEach((card) => {
      const ranges = (avail && avail[card.dataset.apt]) || [];
      $('.cal-months', card).innerHTML = [0, 1].map((k) => {
        const d = new Date(now.getFullYear(), now.getMonth() + calOffset + k, 1);
        return monthHTML(d.getFullYear(), d.getMonth(), ranges);
      }).join('');
    });
    $('#calPrev').disabled = calOffset <= 0;
    $('#calNext').disabled = calOffset >= CAL_MAX;
  }
  function initCalendar() {
    $('#calPrev').addEventListener('click', () => { calOffset = Math.max(0, calOffset - 1); renderCalendar(); });
    $('#calNext').addEventListener('click', () => { calOffset = Math.min(CAL_MAX, calOffset + 1); renderCalendar(); });
  }

  /* ---------- shared map helpers ---------- */
  let routes = null, guide = null;
  function decodePolyline(str) {
    const pts = []; let i = 0, lat = 0, lng = 0;
    while (i < str.length) {
      for (const k of [0, 1]) {
        let b, shift = 0, result = 0;
        do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);
        const d = result & 1 ? ~(result >> 1) : result >> 1;
        if (k === 0) lat += d; else lng += d;
      }
      pts.push([lat / 1e5, lng / 1e5]);
    }
    return pts;
  }
  function baseMap(id, opts = {}) {
    const L = window.L;
    const m = L.map(id, { scrollWheelZoom: false, zoomControl: false, ...opts });
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    m.on('click', () => m.scrollWheelZoom.enable());
    m.on('mouseout', () => m.scrollWheelZoom.disable());
    return m;
  }
  const homeIcon = () => window.L.divIcon({ className: '', iconSize: [40, 40], iconAnchor: [20, 20], html: '<div class="mk-home"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/></svg></div>' });
  /** Draws a route that "writes itself" onto the map. Returns the layer group. */
  function drawRoute(map, latlngs, color, dashed) {
    const L = window.L;
    const group = L.layerGroup().addTo(map);
    L.polyline(latlngs, { color: '#ffffff', weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(group);
    const line = L.polyline(latlngs, { color, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round', interactive: false, dashArray: dashed ? '1 10' : null }).addTo(group);
    const path = line.getElement();
    if (path && !dashed && !reducedMotion) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      path.style.setProperty('--len', len);
      path.classList.add('route-draw');
      path.addEventListener('animationend', () => { path.style.strokeDasharray = ''; path.classList.remove('route-draw'); }, { once: true });
    }
    return group;
  }
  function lazyMap(node, init) {
    let wanted = false;
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { io.disconnect(); wanted = true; init(); } }, { rootMargin: '400px' });
    io.observe(node);
    return () => wanted && init();
  }

  /* ---------- getting here ---------- */
  let arriveMap = null, arriveSel = 'airport', arriveLayer = null;
  const arrivalPoint = (id) => (guide && guide.arrivals || []).find((a) => a.id === id);
  function renderArrivals() {
    $('#arriveList').innerHTML = ARRIVALS.map((a) => {
      const r = routes && routes.arrivals[a.id];
      const dist = r ? fmtKm(r.m) : '';
      const small = r ? (r.mode === 'car' ? t('arrive.drive') : t('arrive.walk', { n: mins(r.s) })) : '';
      const how = a.how.map(([ic, key]) => `<li>${svg(ICONS[ic])}<span>${t(`arr.${a.id}.${key}`)}</span></li>`).join('');
      return `<button class="arrive-card${a.id === arriveSel ? ' is-on' : ''}" role="tab" aria-selected="${a.id === arriveSel}" data-id="${a.id}">
        <span class="ic">${svg(ICONS[a.icon])}</span><h3>${esc(t('arr.' + a.id))}</h3>
        <span class="dist">${dist}<small>${esc(small)}</small></span><span class="sum">${esc(t(`arr.${a.id}.sum`))}</span>
        <ul class="how">${how}</ul></button>`;
    }).join('');
    showArrival(false);
  }
  function showArrival(animate = true) {
    const r = routes && routes.arrivals[arriveSel];
    $('#arriveBadge').innerHTML = r ? `<b>${fmtKm(r.m)}</b><span>${esc(t('arr.' + arriveSel))} → Left &amp; Right</span>` : '';
    if (!arriveMap || !r) return;
    const L = window.L;
    if (arriveLayer) arriveMap.removeLayer(arriveLayer);
    const pts = decodePolyline(r.line);
    arriveLayer = L.layerGroup().addTo(arriveMap);
    const a = ARRIVALS.find((x) => x.id === arriveSel), p = arrivalPoint(arriveSel) || { lat: pts[0][0], lng: pts[0][1] };
    const layer = arriveLayer;
    const go = () => {
      if (layer !== arriveLayer) return; // another arrival was picked while the map was moving
      drawRoute(arriveLayer, pts, r.mode === 'car' ? '#1c1b19' : '#b5562b');
      L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 17], html: `<div class="mk-pt">${svg(ICONS[a.icon])}</div>` }) }).addTo(arriveLayer);
    };
    const bounds = L.latLngBounds(pts).pad(0.15);
    if (animate) { arriveMap.flyToBounds(bounds, { duration: 0.8 }); arriveMap.once('moveend', go); } else { arriveMap.fitBounds(bounds); go(); }
  }
  function initArrivals() {
    $('#arriveList').addEventListener('click', (e) => {
      const b = e.target.closest('.arrive-card'); if (!b || b.dataset.id === arriveSel) return;
      arriveSel = b.dataset.id;
      $$('.arrive-card').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
      showArrival(true);
    });
    const init = () => {
      if (arriveMap || !window.L || !guide || !routes) return;
      arriveMap = baseMap('arriveMap');
      window.L.marker([guide.home.lat, guide.home.lng], { icon: homeIcon(), zIndexOffset: 1000 }).addTo(arriveMap);
      showArrival(false);
    };
    return lazyMap($('#arriveMap'), init);
  }

  /* ---------- guide map ---------- */
  let map = null, activeCat = 'all', query = '', markers = [], routeLayer = null, ringLayer = null, meLayer = null, selected = -1;
  const placeName = (p) => (typeof p.name === 'string' ? p.name : p.name[lang] || p.name.en);
  const placeKey = (p) => (typeof p.name === 'string' ? p.name : p.name.en);
  const placeRoute = (p) => routes && routes.places[placeKey(p)];
  const km = (a, b) => {
    const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const distLabel = (p) => {
    const r = placeRoute(p);
    if (r) return r.mode === 'car' ? t('guide.drive', { n: new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(r.m / 1000) }) : t('guide.walk', { n: mins(r.s) });
    const d = km(guide.home, p) * 1.3;
    return d > 3 ? t('guide.drive', { n: d.toFixed(1) }) : t('guide.walk', { n: Math.max(2, Math.round((d * 1000) / 80)) });
  };
  const tagsLabel = (p) => p.tags.map((x) => t('t.' + x)).join(' · ');
  const mapsQuery = (p) => (p.query || `${placeKey(p)} Heraklion`);
  const mapsUrl = (p) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapsQuery(p));
  const dirUrl = (p, car) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(p))}&travelmode=${car ? 'driving' : 'walking'}`;
  const badges = (p) => (p.fav ? `<span class="badge">${esc(t('guide.fav'))}</span>` : '') + (p.near ? `<span class="badge near">${esc(t('guide.near'))}</span>` : '');
  const matches = (p) => {
    if (activeCat !== 'all' && p.cat !== activeCat) return false;
    if (!query) return true;
    return fold(`${placeName(p)} ${placeKey(p)} ${tagsLabel(p)} ${t('c.' + p.cat)}`).includes(query);
  };

  function renderGuide() {
    if (!guide) return;
    const counts = guide.places.reduce((m, p) => ((m[p.cat] = (m[p.cat] || 0) + 1), m), {});
    $('#chips').innerHTML = ['all', ...Object.keys(CATS)].map((c) =>
      `<button role="tab" data-cat="${c}" class="${c === activeCat ? 'is-on' : ''}" style="--c:${CATS[c] || 'var(--wood)'}"><i></i>${esc(t('c.' + c))} <small>${c === 'all' ? guide.places.length : counts[c] || 0}</small></button>`).join('');
    renderList();
    if (!map) return;
    markers.forEach((m, i) => m.setTooltipContent(esc(placeName(guide.places[i]))));
    if (map._home) map._home.setPopupContent(`<div class="pop"><b>${esc(t('guide.home'))}</b><span class="tags">${esc(t('guide.homeNote'))}</span></div>`);
    renderRings();
    if (selected >= 0) showRouteCard(selected);
  }
  function renderList() {
    const shown = guide.places.map((p, i) => ({ p, i })).filter(({ p }) => matches(p))
      .sort((a, b) => (b.p.fav ? 1 : 0) - (a.p.fav ? 1 : 0) || (b.p.near ? 1 : 0) - (a.p.near ? 1 : 0) || ((placeRoute(a.p) || {}).m || 0) - ((placeRoute(b.p) || {}).m || 0));
    $('#placeList').innerHTML = shown.length ? shown.map(({ p, i }) =>
      `<li><button data-i="${i}" class="${i === selected ? 'is-on' : ''}" style="--c:${CATS[p.cat]}"><i class="pin"></i><b>${esc(placeName(p))}${badges(p)}</b><span class="walk">${esc(distLabel(p))}</span><span class="tags">${esc(tagsLabel(p))}</span></button></li>`).join('')
      : `<li class="empty">${esc(t('guide.none'))}</li>`;
  }
  function syncMarkers(stagger) {
    if (!map) return;
    let k = 0;
    markers.forEach((m, i) => {
      const on = matches(guide.places[i]);
      if (on && !map.hasLayer(m)) {
        m.options.icon.options.html = m.options.icon.options.html.replace(/--d:[\d.]+s/, `--d:${stagger ? (k++ * 0.025).toFixed(3) : 0}s`);
        m.setIcon(m.options.icon);
        m.addTo(map);
      }
      if (!on && map.hasLayer(m)) map.removeLayer(m);
    });
  }
  function fitMap() {
    const pts = guide.places.filter((p) => matches(p) && (activeCat !== 'all' || query || !p.far)).map((p) => [p.lat, p.lng]);
    pts.push([guide.home.lat, guide.home.lng]);
    map.flyToBounds(pts, { padding: [70, 50], maxZoom: 16, duration: 0.9 });
  }
  function renderRings() {
    if (!map) return;
    if (ringLayer) map.removeLayer(ringLayer);
    if ($('#btnRings').getAttribute('aria-pressed') !== 'true') return;
    const L = window.L, h = guide.home;
    ringLayer = L.layerGroup().addTo(map);
    [[5, 300], [10, 620], [15, 940]].forEach(([n, r], k) => {
      L.circle([h.lat, h.lng], { radius: r, color: '#1c1b19', weight: 1.2, opacity: 0.45 - k * 0.1, dashArray: '4 6', fill: k === 0, fillColor: '#c9a47a', fillOpacity: 0.16, interactive: false }).addTo(ringLayer);
      const top = [h.lat + r / 111320, h.lng];
      L.marker(top, { interactive: false, icon: L.divIcon({ className: '', iconSize: null, iconAnchor: [28, 10], html: `<span class="ring-label">${esc(t('guide.ring', { n }))}</span>` }) }).addTo(ringLayer);
    });
  }
  function showRouteCard(i) {
    const p = guide.places[i], r = placeRoute(p), car = r && r.mode === 'car';
    const card = $('#routeCard');
    card.style.setProperty('--c', CATS[p.cat]);
    card.innerHTML = `<b>${esc(placeName(p))}${badges(p)}</b>
      <span class="rc-time">${r ? (car ? fmtKm(r.m) : `${mins(r.s)}′`) : ''}<small>${esc(car ? t('guide.rdrive') : t('guide.rwalk'))}</small></span>
      <span class="rc-meta">${esc(tagsLabel(p))}</span>
      <span class="rc-meta">${r && !car ? `${fmtKm(r.m)} · ` : ''}${esc(t('guide.from'))}</span>
      <span class="rc-actions"><a target="_blank" rel="noopener" href="${dirUrl(p, car)}">${esc(t('guide.open'))} →</a><button type="button" data-close>${esc(t('guide.close'))}</button></span>`;
    card.hidden = false;
  }
  function select(i, { fly = true } = {}) {
    const L = window.L, p = guide.places[i], r = placeRoute(p);
    selected = i;
    $$('#placeList button').forEach((b) => b.classList.toggle('is-on', +b.dataset.i === i));
    markers.forEach((m, k) => m.getElement() && m.getElement().firstChild.classList.toggle('is-on', k === i));
    const b = $(`#placeList button[data-i="${i}"]`);
    if (b) { const list = $('#placeList'); list.scrollTo({ top: b.offsetTop - list.offsetTop - 60, behavior: 'smooth' }); }
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    showRouteCard(i);
    const draw = () => {
      if (selected !== i) return;
      if (r) routeLayer = drawRoute(map, decodePolyline(r.line), CATS[p.cat]);
    };
    if (!fly) return draw();
    const pts = r ? decodePolyline(r.line) : [[guide.home.lat, guide.home.lng], [p.lat, p.lng]];
    map.closePopup();
    map.flyToBounds(L.latLngBounds(pts), { padding: innerWidth < 640 ? [60, 30] : [90, 90], maxZoom: 17, duration: 0.9 });
    map.once('moveend', draw);
  }
  function clearSelection() {
    selected = -1;
    if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    $('#routeCard').hidden = true;
    $$('#placeList button').forEach((b) => b.classList.remove('is-on'));
    markers.forEach((m) => m.getElement() && m.getElement().firstChild.classList.remove('is-on'));
    map.closePopup();
  }
  function hoverSync(i, on) {
    const m = markers[i]; if (m && m.getElement()) m.getElement().firstChild.classList.toggle('is-on', on || i === selected);
    const b = $(`#placeList button[data-i="${i}"]`); if (b) b.classList.toggle('is-hover', on);
  }
  function initMap() {
    if (!guide || !window.L || map) return;
    const L = window.L, home = guide.home;
    map = baseMap('map');
    map.setView([35.3392, 25.1385], 15);
    map._home = L.marker([home.lat, home.lng], { zIndexOffset: 1000, icon: homeIcon() }).addTo(map).bindPopup('');
    markers = guide.places.map((p, i) => {
      const m = L.marker([p.lat, p.lng], {
        riseOnHover: true,
        icon: L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -8], html: `<div class="mk${p.fav ? ' fav' : ''}" style="--c:${CATS[p.cat]};--d:0s"></div>` }),
      }).bindTooltip('', { direction: 'top', offset: [0, -12], className: 'mk-tip' });
      m.on('click', () => select(i));
      m.on('mouseover', () => hoverSync(i, true));
      m.on('mouseout', () => hoverSync(i, false));
      return m;
    });
    syncMarkers(true);
    renderGuide();
    fitMap();
  }
  function toggleFull(force) {
    const grid = $('#guideGrid'), on = force ?? !grid.classList.contains('is-full');
    grid.classList.toggle('is-full', on);
    document.body.classList.toggle('no-scroll', on);
    $('#btnFull').setAttribute('aria-pressed', on);
    setTimeout(() => map && map.invalidateSize(), 60);
  }
  function initGuide() {
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      activeCat = b.dataset.cat;
      $$('#chips button').forEach((x) => x.classList.toggle('is-on', x === b));
      if (map) clearSelection();
      renderList(); syncMarkers(true);
      if (map) fitMap();
    });
    let searchTimer;
    $('#placeSearch').addEventListener('input', (e) => {
      query = fold(e.target.value.trim());
      renderList(); syncMarkers(false);
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => map && guide.places.some(matches) && fitMap(), 450);
    });
    const list = $('#placeList');
    list.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !map) return;
      select(+b.dataset.i);
      if (innerWidth < 980 && !$('#guideGrid').classList.contains('is-full')) $('#map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    list.addEventListener('mouseover', (e) => { const b = e.target.closest('button[data-i]'); if (b) hoverSync(+b.dataset.i, true); });
    list.addEventListener('mouseout', (e) => { const b = e.target.closest('button[data-i]'); if (b) hoverSync(+b.dataset.i, false); });
    $('#routeCard').addEventListener('click', (e) => e.target.closest('[data-close]') && (clearSelection(), fitMap()));

    $('#btnSurprise').addEventListener('click', (e) => {
      if (!map) return;
      const pool = guide.places.map((p, i) => i).filter((i) => matches(guide.places[i]) && !guide.places[i].far && i !== selected);
      if (!pool.length) return;
      const btn = e.currentTarget; btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
      select(pool[Math.floor(Math.random() * pool.length)]);
    });
    $('#btnRings').addEventListener('click', (e) => {
      const b = e.currentTarget; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); renderRings();
    });
    $('#btnFull').addEventListener('click', () => toggleFull());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#guideGrid').classList.contains('is-full')) toggleFull(false); });
    $('#btnLocate').addEventListener('click', () => {
      if (!map || !navigator.geolocation) return;
      const L = window.L;
      navigator.geolocation.getCurrentPosition((pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (meLayer) map.removeLayer(meLayer);
        meLayer = L.marker([me.lat, me.lng], { icon: L.divIcon({ className: '', iconSize: [18, 18], iconAnchor: [9, 9], html: '<div class="mk-me"></div>' }) })
          .addTo(map).bindPopup(`<div class="pop"><b>${esc(t('guide.you'))}</b><span class="tags">${esc(t('guide.youDist', { d: fmtKm(km(me, guide.home) * 1000) }))}</span></div>`);
        map.flyToBounds([[me.lat, me.lng], [guide.home.lat, guide.home.lng]], { padding: [80, 80], maxZoom: 16, duration: 0.9 });
        map.once('moveend', () => meLayer.openPopup());
      }, () => {
        const card = $('#routeCard'); card.innerHTML = `<b>${esc(t('guide.locErr'))}</b><span class="rc-actions"><button type="button" data-close>${esc(t('guide.close'))}</button></span>`; card.hidden = false;
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
    return lazyMap($('#map'), initMap);
  }

  /* ---------- booking request ---------- */
  const EMAIL = 'ekvardava@gmail.com';
  function bookingCheck() {
    const f = $('#bookForm'), hint = $('#bookHint');
    const ci = f.checkin.value, co = f.checkout.value, apt = f.apartment.value;
    hint.className = 'book-hint'; hint.textContent = '';
    $('#bookAirbnb').href = LISTINGS[apt === 'Right' ? 'right' : 'left'].url + (ci && co ? `?check_in=${ci}&check_out=${co}&adults=${f.guests.value}` : '');
    if (!ci || !co) return true;
    if (co <= ci) { hint.classList.add('warn'); hint.textContent = t('book.badDates'); return false; }
    const nights = Math.round((new Date(co) - new Date(ci)) / 864e5);
    const overlaps = (k) => ((avail && avail[k]) || []).some(([a, b]) => ci < b && co > a);
    const known = avail && avail.updated;
    const busy = apt === 'Either' ? overlaps('left') && overlaps('right') : overlaps(apt.toLowerCase());
    hint.classList.add(known && busy ? 'warn' : 'ok');
    hint.textContent = t(known && busy ? 'book.busy' : 'book.nights', { n: nights });
    return true;
  }
  function bookingDone(ok) {
    const st = $('#bookStatus');
    st.innerHTML = ok
      ? `<span class="check"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><h3>${esc(t('book.thanks'))}</h3><p>${esc(t('book.thanksBody'))}</p><button type="button" data-reset>${esc(t('book.again'))}</button>`
      : `<h3>${esc(t('book.error'))}</h3><p>${esc(t('book.errorBody'))}</p><p><a class="link-arrow" href="tel:+306906199884">+30 690 619 9884</a></p><button type="button" data-reset>${esc(t('book.back'))}</button>`;
    st.hidden = false;
  }
  /* Date-range picker: two months side by side (one on phones), booked nights greyed out. */
  const dp = { start: '', end: '', hover: '', view: 0 };
  const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
  function bookedNights() {
    const apt = $('#bookForm').apartment.value;
    const r = (k) => (avail && avail[k]) || [];
    const inR = (day, k) => r(k).some(([a, b]) => day >= a && day < b);
    if (apt === 'Either') return (day) => inR(day, 'left') && inR(day, 'right');
    const k = apt === 'Right' ? 'right' : 'left';
    return (day) => inR(day, k);
  }
  function rangeFree(a, b, isBooked) { for (let d = a; d < b; d = addDays(d, 1)) if (isBooked(d)) return false; return true; }
  function dpMonth(year, month, isBooked, today) {
    const first = new Date(year, month, 1), days = new Date(year, month + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
    const dow = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));
    const end = dp.end || (dp.start && dp.hover > dp.start ? dp.hover : '');
    let cells = dow.map((d) => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${pad(month + 1)}-${pad(d)}`;
      // a booked night can still be a check-out day
      const disabled = key < today || (isBooked(key) && !(dp.start && !dp.end && key > dp.start && rangeFree(dp.start, key, isBooked)));
      const cls = ['dp-day',
        disabled ? 'off' : '', isBooked(key) && key >= today ? 'booked' : '', key === today ? 'today' : '',
        key === dp.start ? 'start' : '', key === dp.start && end ? 'range' : '', key === end ? 'end' : '', dp.start && end && key > dp.start && key < end ? 'mid' : ''].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cls}" data-d="${key}"${disabled ? ' disabled' : ''}><span>${d}</span></button>`;
    }
    const title = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(first);
    return `<div class="dp-month"><h4>${title}</h4><div class="dp-grid">${cells}</div></div>`;
  }
  function dpRender() {
    const now = new Date(), today = iso(now), isBooked = bookedNights();
    const count = innerWidth < 700 ? 1 : 2;
    $('#dpMonths').innerHTML = Array.from({ length: count }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() + dp.view + k, 1);
      return dpMonth(d.getFullYear(), d.getMonth(), isBooked, today);
    }).join('');
    $('#dpPrev').disabled = dp.view <= 0;
    $('#dpNext').disabled = dp.view >= 15;
    $('#dpStep').textContent = t(!dp.start || dp.end ? 'book.stepIn' : 'book.stepOut');
    const nights = dp.start && dp.end ? Math.round((new Date(dp.end) - new Date(dp.start)) / 864e5) : 0;
    $('#dpSum').textContent = nights ? t('book.nights', { n: nights }) : '';
    $('#dpDone').disabled = !(dp.start && dp.end);
  }
  function dpSync() {
    const f = $('#bookForm'), fmt = (v) => fmtDate(v + 'T12:00', { weekday: 'short', day: 'numeric', month: 'short' });
    f.checkin.value = dp.start; f.checkout.value = dp.end;
    $('#dIn').textContent = dp.start ? fmt(dp.start) : t('book.pick');
    $('#dOut').textContent = dp.end ? fmt(dp.end) : t('book.pick');
    $('#dateBtn').classList.toggle('has-value', !!dp.start);
    if (dp.start && dp.end) $('#dateField').classList.remove('invalid');
    bookingCheck();
  }
  function dpOpen(open) {
    const box = $('#dp'), btn = $('#dateBtn');
    if (open === !box.hidden) return;
    if (open) {
      if (dp.start) { const s = new Date(dp.start), n = new Date(); dp.view = Math.max(0, (s.getFullYear() - n.getFullYear()) * 12 + s.getMonth() - n.getMonth()); }
      dpRender(); box.hidden = false; box.style.left = '';
      if (innerWidth >= 700) { // keep the popover inside the window
        const r = box.getBoundingClientRect(), over = r.right - (innerWidth - 16);
        if (over > 0) box.style.left = `${-over}px`;
      }
      requestAnimationFrame(() => box.classList.add('is-open'));
      if (innerWidth < 700) document.body.classList.add('no-scroll');
    } else {
      box.classList.remove('is-open'); setTimeout(() => { box.hidden = true; }, 220);
      document.body.classList.remove('no-scroll');
    }
    btn.setAttribute('aria-expanded', open);
  }
  function initDatePicker() {
    const box = $('#dp');
    $('#dateBtn').addEventListener('click', (e) => { e.stopPropagation(); dpOpen(box.hidden); });
    box.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => dpOpen(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) { dpOpen(false); $('#dateBtn').focus(); } });
    $('#dpPrev').addEventListener('click', () => { dp.view = Math.max(0, dp.view - 1); dpRender(); });
    $('#dpNext').addEventListener('click', () => { dp.view = Math.min(15, dp.view + 1); dpRender(); });
    $('#dpClear').addEventListener('click', () => { dp.start = dp.end = dp.hover = ''; dpRender(); dpSync(); });
    $('#dpDone').addEventListener('click', () => dpOpen(false));
    $('#dpMonths').addEventListener('click', (e) => {
      const b = e.target.closest('.dp-day'); if (!b || b.disabled) return;
      const d = b.dataset.d, isBooked = bookedNights();
      if (!dp.start || dp.end || d <= dp.start || !rangeFree(dp.start, d, isBooked)) { dp.start = d; dp.end = ''; }
      else { dp.end = d; setTimeout(() => dpOpen(false), 450); }
      dpRender(); dpSync();
    });
    $('#dpMonths').addEventListener('mouseover', (e) => {
      const b = e.target.closest('.dp-day'); if (!b || !dp.start || dp.end || b.dataset.d === dp.hover) return;
      dp.hover = b.dataset.d; dpRender();
    });
    $('#bookForm').addEventListener('change', (e) => {
      if (e.target.name !== 'apartment') return;
      if (dp.start && dp.end && !rangeFree(dp.start, dp.end, bookedNights())) { dp.end = ''; dpSync(); }
      if (!box.hidden) dpRender();
    });
    rerender.push(() => { dpSync(); if (!box.hidden) dpRender(); });
  }

  function initBooking() {
    const f = $('#bookForm');
    initDatePicker();
    f.addEventListener('change', () => bookingCheck());
    f.addEventListener('reset', () => setTimeout(() => { dp.start = dp.end = ''; dpSync(); }));
    $('#bookStatus').addEventListener('click', (e) => {
      if (!e.target.closest('[data-reset]')) return;
      $('#bookStatus').hidden = true;
      if ($('#bookStatus').dataset.ok) { f.reset(); $('#bookStatus').dataset.ok = ''; bookingCheck(); }
    });
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = bookingCheck();
      $$('.field:not(.date-field)', f).forEach((l) => { const i = $('input,select,textarea', l); const bad = i && !i.checkValidity(); l.classList.toggle('invalid', bad); if (bad) valid = false; });
      const noDates = !(f.checkin.value && f.checkout.value);
      $('#dateField').classList.toggle('invalid', noDates);
      if (noDates) valid = false;
      if (!valid) { if (noDates) { $('#dateBtn').focus(); dpOpen(true); } else ($('.field.invalid input', f) || $('#dateBtn')).focus(); return; }
      if (f._gotcha.value) return; // bot
      const d = Object.fromEntries(new FormData(f));
      const fmt = (v) => fmtDate(v, { day: 'numeric', month: 'short', year: 'numeric' });
      const subject = `Booking request · ${d.apartment} · ${fmt(d.checkin)} – ${fmt(d.checkout)}`;
      const body = [
        `Apartment: ${d.apartment}`, `Check-in: ${d.checkin}`, `Check-out: ${d.checkout}`, `Guests: ${d.guests}`,
        `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone || '-'}`, `Language: ${lang}`, '', d.message || '',
      ].join('\n');
      const endpoint = f.dataset.endpoint;
      if (!endpoint) {
        location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        return;
      }
      const btn = $('button[type=submit]', f); btn.disabled = true;
      try {
        const fd = new FormData(f); fd.append('_subject', subject); fd.append('_replyto', d.email); fd.append('language', lang);
        const res = await fetch(endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(res.status);
        $('#bookStatus').dataset.ok = '1';
        bookingDone(true);
      } catch { bookingDone(false); }
      btn.disabled = false;
    });
  }

  /* ---------- run & ride ---------- */
  const SPORT_ICONS = {
    run: 'M13 4a1.5 1.5 0 1 0 0-.01M7 21l3-6 3 2v4M6 12l3-4h4l2 3 3 1M10 8l-1.5 5',
    ride: 'M6 17m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0M18 17m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0M6 17l4-8h5l3 8M10 9 8 5H5M14 9l1-3h3',
    gym: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
    yoga: 'M12 5.5a1.5 1.5 0 1 0 0-.01M12 8v5M6 10l6 3 6-3M8 20l4-7 4 7M5 20h14',
    wellness: 'M12 21c-4-2-7-5.5-7-10 3 0 5.5 1.5 7 4 1.5-2.5 4-4 7-4 0 4.5-3 8-7 10zM12 15V9M9.5 6.5C10 5 11 4 12 3c1 1 2 2 2.5 3.5',
  };
  const SPORT_COLORS = { run: '#b5562b', ride: '#4f7259', gym: '#1c1b19', yoga: '#b8892f', wellness: '#2f8f9d' };
  const isSpot = (s) => !['run', 'ride'].includes(s.mode);
  let sportMap = null, sportSel = 'koules', sportMode = 'all', sportLayer = null;
  const sportDef = (id) => (guide && guide.sport || []).find((s) => s.id === id);
  const sportMins = (r) => Math.round(r.mode === 'ride' ? (r.m / 1000) / 16 * 60 : (r.m / 1000) * 6); // ~16 km/h, ~6 min/km
  function sportDirUrl(s) {
    if (isSpot(s)) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.query || s.name)}`;
    const w = s.waypoints, f = ([a, b]) => `${a},${b}`;
    const mid = w.slice(1, -1).map(f).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${f(w[0])}&destination=${f(w[w.length - 1])}&waypoints=${encodeURIComponent(mid)}&travelmode=${s.mode === 'ride' ? 'bicycling' : 'walking'}`;
  }
  function renderSport() {
    if (!guide || !guide.sport) return;
    // within each kind, the places we recommend come first
    const list = guide.sport.filter((s) => sportMode === 'all' || s.mode === sportMode)
      .map((s, i) => ({ s, i })).sort((a, b) => (a.s.mode === b.s.mode ? (b.s.fav ? 1 : 0) - (a.s.fav ? 1 : 0) : 0) || a.i - b.i).map((x) => x.s);
    if (!list.some((s) => s.id === sportSel) && list[0]) sportSel = list[0].id;
    $('#sportList').innerHTML = list.map((s) => {
      const r = routes && routes.sport && routes.sport[s.id], spot = isSpot(s);
      const title = spot ? s.name : t(`sport.${s.id}`);
      const sub = spot ? esc(t(`sport.kind.${s.mode}`)) : `${esc(t(s.mode === 'ride' ? 'sport.ride' : 'sport.run'))} · <span class="lvl lvl-${s.level}">${esc(t('sport.' + s.level))}</span>`;
      const dist = !r ? '' : spot ? (r.m < 250 ? `<span class="near-txt">${esc(t('sport.corner'))}</span>` : `${mins(r.m / 1000 * 12 * 60)}′<small>${esc(t('sport.onFoot'))}</small>`) : `${fmtKm(r.m)}<small>≈ ${sportMins(r)}′</small>`;
      const desc = spot ? t('sport.spotDesc', { d: r ? fmtKm(r.m) : '' }) : t(`sport.${s.id}.desc`);
      const links = [`<a class="link-arrow" target="_blank" rel="noopener" href="${sportDirUrl(s)}">${esc(t('guide.open'))}</a>`];
      if (!spot && s.strava) links.push(`<a class="chip-link strava" target="_blank" rel="noopener" href="${esc(s.strava)}">${svg('M10 3 4 15h4l2-4 2 4h4zM15 15l-2 4-2-4')}<span>${esc(t('sport.strava'))}</span></a>`);
      if (!spot && r) links.push(`<a class="chip-link" href="#" data-gpx="${s.id}">${svg('M12 4v11M7 10l5 5 5-5M5 20h14')}<span>${esc(t('sport.gpx'))}</span></a>`);
      return `<button class="sport-card${s.id === sportSel ? ' is-on' : ''}" role="tab" aria-selected="${s.id === sportSel}" data-id="${s.id}" data-mode="${s.mode}">
        <span class="ic">${svg(SPORT_ICONS[s.mode])}</span>
        <span class="sc-main"><b>${esc(title)}${s.fav ? `<span class="badge">${esc(t('guide.fav'))}</span>` : ''}</b><small>${sub}</small></span>
        <span class="sc-dist">${dist}</span>
        <span class="sc-more"><span>${esc(desc)}</span><span class="sc-links">${links.join('')}</span></span>
      </button>`;
    }).join('');
    showSport(false);
  }
  /** Builds a GPX file of the route in the browser, ready to import into Strava, Garmin, Komoot… */
  function downloadGpx(id) {
    const s = sportDef(id), r = routes && routes.sport && routes.sport[id];
    if (!s || !r) return;
    const name = `Left & Right – ${t(`sport.${id}`)}`;
    const xml = (v) => String(v).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
    const pts = decodePolyline(r.line).map(([la, ln]) => `<trkpt lat="${la.toFixed(6)}" lon="${ln.toFixed(6)}"/>`).join('');
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Left &amp; Right cosy apartments" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${xml(name)}</name></metadata><trk><name>${xml(name)}</name><type>${s.mode === 'ride' ? 'cycling' : 'running'}</type><trkseg>${pts}</trkseg></trk></gpx>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
    a.download = `left-right-${id}.gpx`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function kmMarkers(pts, step) {
    const out = []; let acc = 0, next = step;
    for (let i = 1; i < pts.length; i++) {
      const a = { lat: pts[i - 1][0], lng: pts[i - 1][1] }, b = { lat: pts[i][0], lng: pts[i][1] };
      const d = km(a, b); if (!d) continue;
      while (acc + d >= next) {
        const f = (next - acc) / d;
        out.push({ at: next, ll: [a.lat + (b.lat - a.lat) * f, a.lng + (b.lng - a.lng) * f] });
        next += step;
      }
      acc += d;
    }
    return out;
  }
  function showSport(animate = true) {
    const s = sportDef(sportSel), r = s && routes && routes.sport && routes.sport[s.id];
    const spot = s && isSpot(s);
    $('#sportBadge').innerHTML = !r ? '' : spot
      ? `<b>${r.m < 300 ? esc(t('sport.corner')) : fmtKm(r.m)}</b><span>${esc(s.name)} · ${esc(t('guide.from'))}</span>`
      : `<b>${fmtKm(r.m)}</b><span>${esc(t(`sport.${s.id}`))} · ${esc(t('sport.loop'))}</span>`;
    if (!sportMap || !r) return;
    const L = window.L, pts = decodePolyline(r.line);
    if (sportLayer) sportMap.removeLayer(sportLayer);
    const layer = sportLayer = L.layerGroup().addTo(sportMap);
    const color = SPORT_COLORS[s.mode];
    const go = () => {
      if (layer !== sportLayer) return; // another route was picked while the map was moving
      if (pts.length > 1) drawRoute(layer, pts, color);
      const turn = spot ? s.waypoints[s.waypoints.length - 1] : s.waypoints[Math.floor(s.waypoints.length / 2)];
      L.marker(turn, { zIndexOffset: 1100, icon: L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15], html: `<div class="mk-flag" style="--c:${color}">${svg(spot ? SPORT_ICONS[s.mode] : 'M6 21V4M6 4h11l-2 4 2 4H6')}</div>` }) }).addTo(sportLayer);
      if (spot) return;
      // km markers, but only along the way out so they don't overlap on out-and-back routes
      const half = r.m / 1000 / 2, step = s.mode === 'ride' ? 2 : 1;
      kmMarkers(pts, step).filter((k) => k.at < half + 0.01 || s.id === 'walls').forEach((k, i) => {
        L.marker(k.ll, { interactive: false, icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], html: `<span class="km-dot" style="--c:${color};--d:${(0.9 + i * 0.08).toFixed(2)}s">${k.at}</span>` }) }).addTo(sportLayer);
      });
    };
    const bounds = L.latLngBounds(pts).pad(0.12), fit = { maxZoom: 16 };
    if (animate) { sportMap.flyToBounds(bounds, { ...fit, duration: 0.8 }); sportMap.once('moveend', go); } else { sportMap.fitBounds(bounds, fit); go(); }
  }
  function initSport() {
    $('#sportList').addEventListener('click', (e) => {
      const gpx = e.target.closest('[data-gpx]');
      if (gpx) { e.preventDefault(); downloadGpx(gpx.dataset.gpx); return; }
      if (e.target.closest('a')) return;
      const b = e.target.closest('.sport-card'); if (!b || b.dataset.id === sportSel) return;
      sportSel = b.dataset.id;
      $$('.sport-card').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
      showSport(true);
    });
    $('#sportSeg').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      sportMode = b.dataset.mode;
      $$('#sportSeg button').forEach((x) => x.classList.toggle('is-on', x === b));
      const prev = sportSel; renderSport(); if (prev !== sportSel) showSport(true);
    });
    const init = () => {
      if (sportMap || !window.L || !guide || !routes) return;
      sportMap = baseMap('sportMap');
      window.L.marker([guide.home.lat, guide.home.lng], { icon: homeIcon(), zIndexOffset: 1000 }).addTo(sportMap);
      showSport(false);
    };
    return lazyMap($('#sportMap'), init);
  }

  /* ---------- small facts ---------- */
  function renderFacts() {
    const r = routes && routes.arrivals.centre;
    const n = $('[data-fact="centre"]'); if (r && n) n.textContent = fmtKm(r.m);
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((n) => io.observe(n));
  }

  /* ---------- boot ---------- */
  async function boot() {
    initHeader(); initGalleries(); initStats(); initVoices(); initCalendar(); initBooking(); initPlan(); initReveal();
    const retryArrive = initArrivals(), retryGuide = initGuide(), retrySport = initSport();
    rerender.push(renderAmenities, renderStats, renderVoices, renderCalendar, renderArrivals, renderGuide, renderFacts, bookingCheck, renderSport, renderPlan);
    setLang(pickLang(), false);
    let rev;
    [stats, avail, guide, routes, rev] = await Promise.all(['stats', 'availability', 'places', 'routes', 'reviews'].map((f) => getJSON(`data/${f}.json`)));
    reviews = (rev && rev.reviews) || [];
    renderStats(); renderVoices(); renderCalendar(); renderArrivals(); renderGuide(); renderFacts(); bookingCheck(); renderSport();
    retryArrive(); retryGuide(); retrySport(); // maps that scrolled into view before their data arrived
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
