/* KERKO — oldalszintű viselkedés. Keretrendszer nélkül, minden funkció
   csak akkor indul, ha az oldalon ott a hozzá tartozó elem. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* Fejléc: görgetéskor keret + átlátszó hős-fejléc kitöltése */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobilmenü */
  var burger = $('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = d.body.classList.toggle('menu-open');
      root.classList.toggle('menu-lock', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        d.body.classList.remove('menu-open');
        root.classList.remove('menu-lock');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && d.body.classList.contains('menu-open')) burger.click();
    });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (m) {
      if (m.matches && d.body.classList.contains('menu-open')) burger.click();
    });
  }

  /* Hős-diavetítés */
  var slides = $$('.hero__slide'), dots = $$('.hero__dots button');
  if (slides.length > 1) {
    var cur = 0, timer;
    var show = function (i) {
      slides[cur].classList.remove('is-on');
      dots[cur] && dots[cur].setAttribute('aria-current', 'false');
      cur = (i + slides.length) % slides.length;
      var img = slides[cur].querySelector('img');
      if (img && img.dataset.src) { img.src = img.dataset.src; img.srcset = img.dataset.srcset || ''; delete img.dataset.src; }
      slides[cur].classList.add('is-on');
      dots[cur] && dots[cur].setAttribute('aria-current', 'true');
    };
    // a megrendelő kérése: mindig váltakozzon (az áttűnés lágy, ezért mozgás-csökkentésnél is marad)
    var play = function () { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 7000); };
    dots.forEach(function (b, i) { b.addEventListener('click', function () { show(i); play(); }); });
    // a következő kép előtöltése, hogy a váltás ne villanjon
    setTimeout(function () {
      slides.forEach(function (s) { var im = s.querySelector('img[data-src]'); if (im) { im.src = im.dataset.src; im.srcset = im.dataset.srcset || ''; delete im.dataset.src; } });
    }, 2500);
    play();
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearInterval(timer); else play(); });
  }

  /* Megjelenés görgetéskor */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('is-in'); });

  /* Lightbox a galériákhoz */
  var gals = $$('[data-lb]');
  if (gals.length) {
    var lb = d.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Képnézegető');
    lb.innerHTML = '<img alt=""><button class="lb__x" aria-label="Bezárás">×</button><button class="lb__p" aria-label="Előző kép">←</button><button class="lb__n" aria-label="Következő kép">→</button><div class="lb__c"></div>';
    d.body.appendChild(lb);
    var lbImg = $('img', lb), lbC = $('.lb__c', lb), set = [], idx = 0, opener = null;
    var render = function () { var b = set[idx]; lbImg.src = b.dataset.full; lbImg.alt = b.getAttribute('aria-label') || ''; lbC.textContent = (idx + 1) + ' / ' + set.length; };
    var close = function () { lb.classList.remove('is-on'); d.body.style.overflow = ''; if (opener) opener.focus(); };
    gals.forEach(function (g) {
      $$('button[data-full]', g).forEach(function (b, i, arr) {
        b.addEventListener('click', function () { set = arr; idx = i; opener = b; render(); lb.classList.add('is-on'); d.body.style.overflow = 'hidden'; $('.lb__x', lb).focus(); });
      });
    });
    $('.lb__x', lb).addEventListener('click', close);
    $('.lb__p', lb).addEventListener('click', function () { idx = (idx - 1 + set.length) % set.length; render(); });
    $('.lb__n', lb).addEventListener('click', function () { idx = (idx + 1) % set.length; render(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') $('.lb__p', lb).click();
      if (e.key === 'ArrowRight') $('.lb__n', lb).click();
    });
  }

  /* Akciós lista: formátum-szűrő + rendezés */
  var grid = $('#sale-grid');
  if (grid) {
    var items = $$('.prod', grid), fbtns = $$('[data-fmt]'), sortSel = $('#sale-sort'), cnt = $('#sale-count'), fmt = 'all';
    var apply = function () {
      var shown = 0;
      items.forEach(function (it) { var ok = fmt === 'all' || it.dataset.group === fmt; it.hidden = !ok; if (ok) shown++; });
      cnt.textContent = shown + ' termék';
      var s = sortSel.value, arr = items.slice();
      if (s === 'asc') arr.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
      else if (s === 'desc') arr.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
      else if (s === 'name') arr.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name, 'hu'); });
      else arr.sort(function (a, b) { return a.dataset.i - b.dataset.i; });
      arr.forEach(function (el) { grid.appendChild(el); });
    };
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        fmt = b.dataset.fmt;
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        apply();
      });
    });
    sortSel.addEventListener('change', apply);
  }

  /* Viszonteladó-kereső */
  var finder = $('#finder');
  if (finder) {
    var data = JSON.parse($('#rs-data').textContent);
    var list = $('#rs-list'), q = $('#rs-q'), cs = $('#rs-county'), meta = $('#rs-count'), geo = $('#rs-geo'), geoMsg = $('#rs-geomsg');
    var dots = $$('.hu__dot'), tip = $('.hu-tip'), mapBox = $('.finder__map'), me = null;
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var km = function (a, b, c, e) {
      var R = 6371, r = Math.PI / 180, dLa = (c - a) * r, dLo = (e - b) * r;
      var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var tel = function (p) { return p.replace(/[^\d+]/g, ''); };
    var draw = function () {
      var qq = norm(q.value.trim()), cc = cs.value, rows = [];
      data.forEach(function (r, i) {
        if (cc && r.county !== cc) return;
        if (qq && norm(r.name + ' ' + r.address + ' ' + r.county).indexOf(qq) < 0) return;
        rows.push(i);
      });
      if (me) {
        data.forEach(function (r) { r._d = r.lat ? km(me[0], me[1], r.lat, r.lng) : 1e9; });
        rows.sort(function (a, b) { return data[a]._d - data[b]._d; });
      }
      var set = {};
      rows.forEach(function (i) { set[i] = 1; });
      dots.forEach(function (dt) { dt.classList.toggle('is-dim', !set[dt.dataset.i]); dt.classList.remove('is-hot'); });
      meta.textContent = rows.length + ' viszonteladó' + (me ? ' · távolság szerint rendezve' : '');
      if (!rows.length) { list.innerHTML = '<li class="empty">Nincs a keresésnek megfelelő viszonteladó.</li>'; return; }
      list.innerHTML = rows.map(function (i) {
        var r = data[i];
        return '<li class="rs" data-i="' + i + '" tabindex="0">' +
          (me && r._d < 1e9 ? '<span class="rs__d">' + (r._d < 10 ? r._d.toFixed(1).replace('.', ',') : Math.round(r._d)) + ' km</span>' : '') +
          '<span class="rs__county">' + esc(r.county) + '</span>' +
          '<h3>' + esc(r.name) + '</h3><div class="rs__addr">' + esc(r.address) + '</div><div class="rs__c">' +
          (r.phones || []).map(function (p) { return '<a href="tel:' + tel(p) + '">' + esc(p) + '</a>'; }).join('') +
          (r.email ? '<a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' : '') +
          (r.lat ? '<a href="https://www.google.com/maps/dir/?api=1&amp;destination=' + r.lat + ',' + r.lng + '" target="_blank" rel="noopener">Útvonal ↗</a>' : '') +
          '</div></li>';
      }).join('');
    };
    var hot = function (i, scroll) {
      $$('.rs', list).forEach(function (li) { li.classList.toggle('is-hot', li.dataset.i == i); });
      dots.forEach(function (dt) { dt.classList.toggle('is-hot', dt.dataset.i == i); });
      var dt = dots.filter(function (x) { return x.dataset.i == i; })[0];
      if (dt) dt.parentNode.appendChild(dt);
      if (scroll) { var li = $('.rs[data-i="' + i + '"]', list); if (li) li.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }
    };
    list.addEventListener('mouseover', function (e) { var li = e.target.closest('.rs'); if (li) hot(li.dataset.i); });
    list.addEventListener('focusin', function (e) { var li = e.target.closest('.rs'); if (li) hot(li.dataset.i); });
    var showTip = function (dt) {
      var r = data[dt.dataset.i], b = mapBox.getBoundingClientRect(), p = dt.getBoundingClientRect();
      tip.innerHTML = '<strong>' + esc(r.name) + '</strong><br>' + esc(r.address);
      tip.style.left = (p.left + p.width / 2 - b.left) + 'px';
      tip.style.top = (p.top - b.top) + 'px';
      tip.classList.add('is-on');
    };
    dots.forEach(function (dt) {
      dt.addEventListener('mouseenter', function () { showTip(dt); hot(dt.dataset.i); });
      dt.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
      dt.addEventListener('click', function () {
        var r = data[dt.dataset.i];
        if (!$('.rs[data-i="' + dt.dataset.i + '"]', list)) { cs.value = ''; q.value = ''; draw(); }
        hot(dt.dataset.i, true);
        showTip(dt);
      });
    });
    q.addEventListener('input', draw);
    cs.addEventListener('change', draw);
    if (geo) {
      if (!('geolocation' in navigator)) geo.hidden = true;
      geo.addEventListener('click', function () {
        geo.disabled = true; geoMsg.textContent = 'Helymeghatározás…';
        navigator.geolocation.getCurrentPosition(function (pos) {
          me = [pos.coords.latitude, pos.coords.longitude];
          geo.disabled = false; geoMsg.textContent = 'A pozíciója csak ebben a böngészőben marad, sehova nem küldjük.';
          cs.value = ''; q.value = ''; draw(); list.scrollTop = 0;
          var first = $('.rs', list); if (first) hot(first.dataset.i);
        }, function () {
          geo.disabled = false; geoMsg.textContent = 'A helymeghatározás nem sikerült — válasszon vármegyét, vagy keressen településre.';
        }, { timeout: 10000, maximumAge: 600000 });
      });
    }
    var pre = new URLSearchParams(location.search).get('megye');
    if (pre) cs.value = pre;
    draw();
  }

  /* Tervezői üzenet: levelezőprogramba készít piszkozatot (nincs szerveroldal) */
  var mf = $('#mailform');
  if (mf) {
    mf.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = mf.elements.name.value.trim(), m = mf.elements.email.value.trim(), t = mf.elements.text.value.trim();
      var body = t + '\n\n—\n' + n + (m ? '\n' + m : '');
      location.href = 'mailto:' + mf.dataset.to + '?subject=' + encodeURIComponent('Tervezői megkeresés — ' + n) + '&body=' + encodeURIComponent(body);
    });
  }

  /* Gyártók: aktív márka kiemelése a ragadós sávban */
  var mnav = $$('.mfr-nav a');
  if (mnav.length && 'IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        mnav.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-on', on);
          if (on) { var ul = a.closest('ul'); ul.scrollLeft = a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2; }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.mfr').forEach(function (s) { mio.observe(s); });
  }
})();

/* KERKO — élményfunkciók: gyorskereső (Ctrl+K), akciós gyorsnézet + árkalkulátor,
   akció-visszaszámlálás, olvasás-csík, vissza a tetejére. Csak az oldal saját adataira épül.
   A build a site.js végére fűzi. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var ROOT = root.getAttribute('data-root') || '';
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var norm = function (s) { return (s || '').normalize('NFC').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var huf = function (n) { return new Intl.NumberFormat('hu-HU').format(Math.round(n)) + ' Ft'; };
  var SVG = function (paths, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 20) + '" height="' + (s || 20) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'; };
  var I_X = SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
  var I_L = SVG('<path d="m15 18-6-6 6-6"/>'), I_R = SVG('<path d="m9 18 6-6-6-6"/>');
  var I_PIN = SVG('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>', 18);

  /* közös modális kezelés: görgetés-zár, fókusz vissza a nyitóra, Esc */
  var openStack = [];
  var lock = function (on) { root.classList.toggle('modal-lock', on); };
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openStack.length) { e.preventDefault(); openStack[openStack.length - 1].close(); }
  });

  /* ---------------- akció-visszaszámlálás ---------------- */
  $$('.countdown').forEach(function (el) {
    var p = (el.dataset.end || '').split('-');
    if (p.length !== 3) return;
    var end = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date(); var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var diff = Math.round((end - today) / 864e5);
    if (diff < 0) {
      el.textContent = 'Az akció lejárt'; el.classList.add('is-over');
      /* a kezdőlapon a lejárt akció nem jelenik meg (a havi sale.json frissítéséig) */
      var hs = el.closest('[data-hide-expired]'); if (hs) hs.hidden = true;
    }
    else if (diff === 0) el.textContent = 'Ma ér véget az akció';
    else el.textContent = 'Még ' + (diff + 1) + ' napig tart';
  });

  /* ---------------- akciós gyorsnézet + árkalkulátor ---------------- */
  var sd = $('#sale-data');
  if (sd) {
    var SD = JSON.parse(sd.textContent), cur = 0, opener = null, rh = 10;
    var qv = d.createElement('div');
    qv.className = 'qv'; qv.setAttribute('role', 'dialog'); qv.setAttribute('aria-modal', 'true'); qv.setAttribute('aria-labelledby', 'qv-t');
    qv.innerHTML =
      '<div class="qv__panel">' +
        '<button class="qv__x" type="button" aria-label="Bezárás">' + I_X + '</button>' +
        '<div class="qv__media"><img alt="" width="500" height="380"><div class="qv__nav">' +
          '<button type="button" class="qv__prev" aria-label="Előző termék">' + I_L + '</button><span class="qv__pos"></span>' +
          '<button type="button" class="qv__next" aria-label="Következő termék">' + I_R + '</button></div></div>' +
        '<div class="qv__body">' +
          '<span class="qv__tag">Akció</span>' +
          '<h2 id="qv-t" class="qv__name"></h2><p class="qv__fmt"></p>' +
          '<p class="qv__price"><b class="num"></b><span>Ft/m²</span></p>' +
          '<p class="qv__valid"></p>' +
          '<div class="calc"><p class="calc__h">Mennyibe kerül a burkolat?</p>' +
            '<label class="calc__row" for="qv-m2"><span>Burkolandó terület</span><span class="calc__in"><input id="qv-m2" type="number" inputmode="decimal" min="0" max="10000" step="0.5" value="10"><em>m²</em></span></label>' +
            '<div class="calc__row"><span id="qv-rh-l">Ráhagyás (vágás, törés)</span><span class="seg" role="group" aria-labelledby="qv-rh-l">' +
              [0, 5, 10, 15].map(function (v) { return '<button type="button" data-rh="' + v + '" aria-pressed="' + (v === 10) + '">' + v + '%</button>'; }).join('') + '</span></div>' +
            '<div class="calc__res"><span>Becsült anyagár</span><b class="qv__total num"></b><small class="qv__how"></small></div>' +
            '<p class="calc__note">Tájékoztató számítás az ajánlott bruttó fogyasztói árral. A dobozos kiszerelés miatt a vásárolt mennyiség eltérhet.</p>' +
          '</div>' +
          '<div class="qv__cta"><a class="btn" href="' + ROOT + 'viszonteladok.html?kozel=1">' + I_PIN + ' Legközelebbi viszonteladó</a>' +
          '<a class="btn btn--ghost" href="' + ROOT + 'viszonteladok.html">Összes viszonteladó</a></div>' +
        '</div>' +
      '</div>';
    d.body.appendChild(qv);
    var qImg = $('img', qv), m2 = $('#qv-m2', qv);
    var calc = function () {
      var it = SD.items[cur], a = parseFloat(String(m2.value).replace(',', '.')) || 0;
      var need = a * (1 + rh / 100), tot = need * it.p;
      $('.qv__total', qv).textContent = a > 0 ? huf(tot) : '—';
      $('.qv__how', qv).textContent = a > 0 ? (need.toFixed(2).replace('.', ',').replace(/,?0+$/, '') + ' m² × ' + huf(it.p) + '/m²') : 'Adja meg a területet';
    };
    var show = function (i) {
      cur = (i + SD.items.length) % SD.items.length;
      var it = SD.items[cur];
      qImg.src = ROOT + it.i; qImg.alt = it.n + ' ' + it.f;
      $('.qv__name', qv).textContent = it.n;
      $('.qv__fmt', qv).textContent = it.f;
      $('.qv__price b', qv).textContent = new Intl.NumberFormat('hu-HU').format(it.p);
      $('.qv__pos', qv).textContent = (cur + 1) + ' / ' + SD.items.length;
      var cd = $('.countdown');
      $('.qv__valid', qv).textContent = 'Érvényes: ' + SD.valid + (cd && cd.textContent ? ' · ' + cd.textContent : '');
      calc();
    };
    var api = {
      open: function (i, from) {
        opener = from || null; show(i);
        qv.classList.add('is-on'); lock(true); openStack.push(api);
        setTimeout(function () { $('.qv__x', qv).focus(); }, 30);
      },
      close: function () {
        qv.classList.remove('is-on'); openStack.pop(); if (!openStack.length) lock(false);
        if (opener) opener.focus();
        if (/[?&]t=/.test(location.search)) history.replaceState(null, '', location.pathname);
      }
    };
    $$('[data-qv]').forEach(function (b) { b.addEventListener('click', function () { api.open(+b.dataset.qv, b); }); });
    $('.qv__x', qv).addEventListener('click', api.close);
    $('.qv__prev', qv).addEventListener('click', function () { show(cur - 1); });
    $('.qv__next', qv).addEventListener('click', function () { show(cur + 1); });
    qv.addEventListener('click', function (e) { if (e.target === qv) api.close(); });
    qv.addEventListener('keydown', function (e) {
      if (e.target === m2) return;
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    m2.addEventListener('input', calc);
    $$('[data-rh]', qv).forEach(function (b) {
      b.addEventListener('click', function () {
        rh = +b.dataset.rh;
        $$('[data-rh]', qv).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        calc();
      });
    });
    var t = new URLSearchParams(location.search).get('t');
    if (t !== null && SD.items[+t]) api.open(+t);
  }

  /* ---------------- gyorskereső (Ctrl+K) ---------------- */
  var ORDER = ['Gyártó', 'Kollekció', 'Akció', 'Letöltés', 'Kapcsolat', 'Bemutatóterem', 'Viszonteladó', 'Oldal'];
  var pal = null, idx = null, act = 0, hits = [], sOpener = null;
  var buildPal = function () {
    pal = d.createElement('div');
    pal.className = 'pal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Keresés az oldalon');
    pal.innerHTML = '<div class="pal__box"><div class="pal__top">' + SVG('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', 22) +
      '<input class="pal__in" type="search" placeholder="Keresés márka, kollekció vagy termék alapján…" aria-label="Keresés" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="pal-list">' +
      '<button class="pal__x" type="button" aria-label="Bezárás">Esc</button></div>' +
      '<div class="pal__list" id="pal-list" role="listbox"></div>' +
      '<div class="pal__foot"><span><kbd>↑</kbd><kbd>↓</kbd> választás</span><span><kbd>Enter</kbd> megnyitás</span><span><kbd>Esc</kbd> bezárás</span></div></div>';
    d.body.appendChild(pal);
    var inp = $('.pal__in', pal);
    inp.addEventListener('input', function () { act = 0; render(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(act + 1, hits.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(act - 1, 0); mark(); }
      else if (e.key === 'Enter' && hits[act]) { e.preventDefault(); go(hits[act]); }
    });
    $('.pal__x', pal).addEventListener('click', palApi.close);
    pal.addEventListener('click', function (e) { if (e.target === pal) palApi.close(); });
  };
  var url = function (h) { return /^https?:/.test(h.u) ? h.u : ROOT + h.u; };
  var go = function (h) { location.href = url(h); };
  var hl = function (label, q) {
    if (!q) return esc(label);
    var n = norm(label), terms = q.split(/\s+/).filter(Boolean), marks = new Array(label.length + 1).join('0').split('');
    terms.forEach(function (tm) { var i = n.indexOf(tm); if (i >= 0) for (var k = i; k < i + tm.length; k++) marks[k] = '1'; });
    var out = '', open = false;
    for (var i = 0; i < label.length; i++) {
      if (marks[i] === '1' && !open) { out += '<mark>'; open = true; }
      if (marks[i] !== '1' && open) { out += '</mark>'; open = false; }
      out += esc(label[i]);
    }
    return out + (open ? '</mark>' : '');
  };
  var mark = function () {
    $$('.pal__it', pal).forEach(function (a, i) {
      a.classList.toggle('is-act', i === act); a.setAttribute('aria-selected', i === act ? 'true' : 'false');
      if (i === act) a.scrollIntoView({ block: 'nearest' });
    });
  };
  var render = function () {
    var list = $('.pal__list', pal), q = norm($('.pal__in', pal).value.trim());
    if (!idx) { list.innerHTML = '<p class="pal__empty">Betöltés…</p>'; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var res;
    if (!terms.length) {
      res = idx.filter(function (x) { return x.t === 'Oldal'; }).slice(0, 7)
        .concat(idx.filter(function (x) { return x.t === 'Akció'; }).slice(0, 4));
    } else {
      res = idx.filter(function (x) { return terms.every(function (tm) { return x.k.indexOf(tm) >= 0; }); });
      res.forEach(function (x) { var n = norm(x.l); x._s = (n.indexOf(terms[0]) === 0 ? 0 : n.indexOf(terms[0]) > 0 ? 1 : 2); });
      res.sort(function (a, b) { return ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || a._s - b._s; });
      var per = {}; res = res.filter(function (x) { per[x.t] = (per[x.t] || 0) + 1; return per[x.t] <= 6; }).slice(0, 36);
    }
    hits = res;
    if (!res.length) { list.innerHTML = '<p class="pal__empty">Nincs találat erre: „' + esc($('.pal__in', pal).value) + '”</p>'; return; }
    var html = '', last = '';
    res.forEach(function (x, i) {
      if (x.t !== last) { html += '<p class="pal__grp">' + (terms.length ? x.t : (x.t === 'Oldal' ? 'Oldalak' : 'Havi akció')) + '</p>'; last = x.t; }
      html += '<a class="pal__it" role="option" id="pal-o' + i + '" href="' + esc(url(x)) + '"' + (/^https?:/.test(x.u) ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<span class="pal__l">' + hl(x.l, q) + '</span>' + (x.s ? '<span class="pal__s">' + hl(x.s, q) + '</span>' : '') + '</a>';
    });
    list.innerHTML = html;
    $$('.pal__it', list).forEach(function (a, i) { a.addEventListener('mousemove', function () { if (act !== i) { act = i; mark(); } }); });
    mark();
  };
  var palApi = {
    open: function (from) {
      if (!pal) buildPal();
      sOpener = from || d.activeElement;
      pal.classList.add('is-on'); lock(true); openStack.push(palApi);
      var inp = $('.pal__in', pal); inp.value = ''; act = 0;
      setTimeout(function () { inp.focus(); }, 20);
      if (!idx) {
        render();
        fetch(ROOT + 'assets/search.json').then(function (r) { return r.json(); }).then(function (data) {
          idx = data.map(function (x) { x.k = norm(x.l + ' ' + x.s + ' ' + x.t); return x; }); render();
        }).catch(function () { $('.pal__list', pal).innerHTML = '<p class="pal__empty">A kereső csak a weboldal megnyitásakor érhető el (fájlként megnyitva nem).</p>'; });
      } else render();
    },
    close: function () {
      pal.classList.remove('is-on'); openStack.pop(); if (!openStack.length) lock(false);
      if (sOpener && sOpener.focus) sOpener.focus();
    }
  };
  $$('[data-search]').forEach(function (b) { b.addEventListener('click', function () { if (d.body.classList.contains('menu-open')) $('.burger').click(); palApi.open(b); }); });
  d.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '');
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!pal || !pal.classList.contains('is-on')) palApi.open(); }
    else if (e.key === '/' && !typing && !openStack.length) { e.preventDefault(); palApi.open(); }
  });

  /* ---------------- olvasás-csík a blogcikkeken ---------------- */
  var rb = $('.readbar span'), art = $('article .article');
  if (rb && art) {
    var upd = function () {
      var r = art.getBoundingClientRect(), total = r.height - innerHeight * .6;
      var p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      rb.style.transform = 'scaleX(' + p + ')';
    };
    upd(); window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd);
  }

  /* ---------------- vissza a tetejére ---------------- */
  var tt = $('.totop');
  if (tt) {
    var tup = function () { tt.classList.toggle('is-on', window.scrollY > innerHeight * 1.5); };
    tup(); window.addEventListener('scroll', tup, { passive: true });
    tt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  }

  /* ---------------- viszonteladók: ?q= előtöltés, ?kozel=1 helymeghatározás ---------------- */
  var rq = $('#rs-q');
  if (rq) {
    var sp = new URLSearchParams(location.search);
    if (sp.get('q')) { rq.value = sp.get('q'); rq.dispatchEvent(new Event('input')); var f = $('.rs'); if (f) f.classList.add('is-hot'); }
    if (sp.get('kozel') === '1') { var g = $('#rs-geo'); if (g && !g.hidden) setTimeout(function () { g.click(); }, 300); }
  }
})();

/* KERKO — prémium B2B réteg: márka-index előnézet, történet-vonal, kollekció-szűrő.
   A build a site.js + ux.js után fűzi. Csak transform/opacity; mozgás-csökkentésnél statikus. */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- márka-index: hover/fókusz -> a gyártó fotója ---------------- */
  $$('.bix').forEach(function (bx) {
    var figs = $$('.bix__fig', bx), rows = $$('.bix__row', bx);
    var on = function (k) {
      if (!figs.some(function (f) { return f.dataset.k === k; })) return; /* nincs fotó: marad az előző */
      figs.forEach(function (f) { f.classList.toggle('is-on', f.dataset.k === k); });
      rows.forEach(function (r) { r.classList.toggle('is-on', r.dataset.k === k); });
    };
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function () { on(r.dataset.k); });
      r.addEventListener('focus', function () { on(r.dataset.k); });
    });
  });

  /* ---------------- történet: a vonal a görgetéssel rajzolódik ---------------- */
  $$('.story').forEach(function (st) {
    var its = $$('.story__it', st);
    if (reduce || !('IntersectionObserver' in window)) {
      st.style.setProperty('--p', 1);
      its.forEach(function (it) { it.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -30% 0px' });
    its.forEach(function (it) { io.observe(it); });
    var ticking = false;
    var upd = function () {
      ticking = false;
      var r = st.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.7 - r.top) / (r.height || 1);
      st.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    };
    var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
    upd();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
  });

  /* ---------------- kollekciók: szűrés márka szerint (?marka=…) ---------------- */
  var cg = $('#coll-grid');
  if (cg) {
    var posts = $$('.post', cg), bf = $$('[data-bf]'), cnt = $('#coll-count');
    var apply = function (b) {
      var n = 0;
      posts.forEach(function (p) { var ok = !b || p.dataset.brand === b; p.hidden = !ok; if (ok) { n++; p.classList.add('is-in'); } });
      cg.classList.toggle('is-filtered', !!b);
      bf.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.bf === b ? 'true' : 'false'); });
      cnt.textContent = n + ' bejegyzés' + (b ? ' · ' + b : '');
    };
    bf.forEach(function (x) {
      x.addEventListener('click', function () {
        apply(x.dataset.bf);
        var u = new URL(location.href);
        if (x.dataset.bf) u.searchParams.set('marka', x.dataset.bf); else u.searchParams.delete('marka');
        history.replaceState(null, '', u);
      });
    });
    var pre = new URLSearchParams(location.search).get('marka');
    if (pre && bf.some(function (x) { return x.dataset.bf === pre; })) apply(pre);
  }
})();
