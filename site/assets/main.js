// MTN SME Hub — Redesign Mockup — shared behaviour (mobile nav, accordions)
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var drawer = document.querySelector('.mobile-drawer');
  if (burger && drawer) {
    var closeBtn = drawer.querySelector('.close');
    var scrim = drawer.querySelector('.scrim');
    var open = function () { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; };
    var close = function () { drawer.classList.remove('open'); document.body.style.overflow = ''; };
    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (scrim) scrim.addEventListener('click', close);
  }

  document.querySelectorAll('.mdrawer-group').forEach(function (group) {
    var label = group.querySelector('.mlabel');
    var sub = group.querySelector('.mdrawer-sub');
    if (!label || !sub) return;
    label.addEventListener('click', function () {
      group.classList.toggle('open');
      sub.classList.toggle('open');
    });
  });

  document.querySelectorAll('.tab-btn[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var group = btn.closest('.tab-row');
      group.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      var grid = document.querySelector(btn.getAttribute('data-target') || '.card-grid');
      if (!grid) return;
      grid.querySelectorAll('[data-cat]').forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-cat').indexOf(filter) !== -1;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // Checkbox category filters (e.g. business-solutions.html sidebar)
  document.querySelectorAll('.filter-box input[type="checkbox"][data-filter]').forEach(function (box) {
    box.addEventListener('change', function () {
      var scope = document.querySelector(box.getAttribute('data-target') || 'body');
      if (!scope) return;
      var checked = Array.prototype.slice.call(
        document.querySelectorAll('.filter-box input[type="checkbox"][data-filter]:checked')
      ).map(function (b) { return b.getAttribute('data-filter'); });
      var showAll = checked.length === 0 || checked.indexOf('all') !== -1;
      scope.querySelectorAll('[data-cat]').forEach(function (card) {
        var cat = card.getAttribute('data-cat');
        var show = showAll || checked.some(function (f) { return cat.indexOf(f) !== -1; });
        card.style.display = show ? '' : 'none';
      });
      document.querySelectorAll('.filter-box .opt').forEach(function (opt) {
        var input = opt.querySelector('input[data-filter]');
        if (input) opt.classList.toggle('active', input.checked);
      });
    });
  });

  // Newsletter subscribe: swap form for a confirmation message
  document.querySelectorAll('.nl-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      if (email && !email.value.trim()) { email.focus(); return; }
      var success = form.parentElement.querySelector('.nl-success');
      form.classList.add('hide');
      if (success) success.classList.add('show');
    });
  });

  // ===== Export widget: download this mockup as PDF or PPT =====
  initExportWidget();
});

function initExportWidget() {
  if (document.querySelector('.export-fab')) return;

  var fab = document.createElement('div');
  fab.className = 'export-fab';
  fab.innerHTML =
    '<div class="export-menu">' +
      '<div class="eh">Download this mockup</div>' +
      '<button class="export-opt" data-export="pdf" type="button">' +
        '<span class="ei"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h4"/></svg></span>' +
        '<span>PDF document<small>Opens your Save as PDF dialog</small></span>' +
      '</button>' +
      '<button class="export-opt" data-export="ppt" type="button">' +
        '<span class="ei"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg></span>' +
        '<span class="lbl">PowerPoint deck<small>Downloads an editable .pptx</small></span>' +
      '</button>' +
    '</div>' +
    '<button class="export-toggle" type="button" aria-label="Download this mockup">' +
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14"/></svg>' +
      '<span class="export-label">Export</span>' +
    '</button>';
  document.body.appendChild(fab);

  var toggle = fab.querySelector('.export-toggle');
  toggle.addEventListener('click', function (e) { e.stopPropagation(); fab.classList.toggle('open'); });
  document.addEventListener('click', function (e) { if (!fab.contains(e.target)) fab.classList.remove('open'); });

  fab.querySelector('[data-export="pdf"]').addEventListener('click', function () {
    fab.classList.remove('open');
    window.print();
  });

  var pptBtn = fab.querySelector('[data-export="ppt"]');
  pptBtn.addEventListener('click', function () {
    fab.classList.remove('open');
    runPptExport(pptBtn);
  });

  var pptxLoader = null;
  function ensurePptx() {
    if (window.PptxGenJS) return Promise.resolve();
    if (pptxLoader) return pptxLoader;
    pptxLoader = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'assets/vendor/pptxgen.bundle.js';
      s.onload = function () { window.PptxGenJS ? resolve() : reject(new Error('PowerPoint library failed to initialise.')); };
      s.onerror = function () { reject(new Error('Could not load the PowerPoint library.')); };
      document.head.appendChild(s);
    });
    return pptxLoader;
  }

  function runPptExport(btn) {
    var label = btn.querySelector('.lbl');
    var original = label.innerHTML;
    btn.setAttribute('disabled', '');
    label.innerHTML = 'Building deck…<small>One moment</small>';
    ensurePptx()
      .then(function () { return generateDeck(); })
      .then(function () { btn.removeAttribute('disabled'); label.innerHTML = original; })
      .catch(function (err) {
        btn.removeAttribute('disabled'); label.innerHTML = original;
        alert(err && err.message ? err.message : 'Sorry, the PowerPoint export could not be completed.');
      });
  }

  function clean(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  function pageName() { return (document.title || 'MTN SME Hub').split('|')[0].trim(); }

  function firstMainH1() {
    var hs = document.querySelectorAll('h1');
    for (var i = 0; i < hs.length; i++) {
      if (!hs[i].closest('header.site, footer.site, .mobile-drawer')) return clean(hs[i].textContent);
    }
    return '';
  }

  function leadText() {
    var sel = ['.page-head p', '.guide-hero .gh-sub', '.gh-sub', '.post-body p', 'section p'];
    for (var i = 0; i < sel.length; i++) {
      var e = document.querySelector(sel[i]);
      if (e && !e.closest('header.site, footer.site, .newsletter, .export-fab')) {
        var t = clean(e.textContent);
        if (t) return t.length > 240 ? t.slice(0, 237) + '…' : t;
      }
    }
    return '';
  }

  function collectSections() {
    var SKIP = 'header.site, footer.site, .mobile-drawer, .newsletter, .export-fab, aside, .toc, script, style';
    var nodes = document.querySelectorAll('h2, h3, p, li, .article-card h4, .dl-card h4, .service-card h4, .plan-card h4');
    var out = [], cur = null;
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest(SKIP)) return;
      var t = clean(el.textContent);
      if (!t) return;
      var tag = el.tagName.toLowerCase();
      if (tag === 'h2' || tag === 'h3') {
        cur = { title: t, bullets: [] };
        out.push(cur);
      } else if (cur && t.length > 3 && cur.bullets.length < 7 && cur.bullets.indexOf(t) === -1) {
        cur.bullets.push(t.length > 160 ? t.slice(0, 157) + '…' : t);
      }
    });
    out = out.filter(function (s) { return s.bullets.length || s.title; });
    if (!out.length) {
      var titles = [];
      document.querySelectorAll('.article-card h4, .dl-card h4, .service-card h4').forEach(function (h) {
        if (!h.closest(SKIP)) { var t = clean(h.textContent); if (t && titles.indexOf(t) === -1) titles.push(t); }
      });
      if (titles.length) out.push({ title: 'Highlights', bullets: titles.slice(0, 7) });
    }
    return out;
  }

  function generateDeck() {
    var INK = '212529', YELLOW = 'FFC502', GREY = '8A8F98', FONT = 'Calibri';
    var W = 13.333;
    var title = firstMainH1() || pageName();
    var lead = leadText();
    var sections = collectSections().slice(0, 14);

    var pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'MTN SME Hub';
    pptx.company = 'MTN SME Hub';
    pptx.title = title;
    var RECT = (pptx.ShapeType && pptx.ShapeType.rect) || 'rect';

    var s = pptx.addSlide();
    s.background = { color: INK };
    s.addShape(RECT, { x: 0, y: 0, w: W, h: 0.28, fill: { color: YELLOW } });
    s.addText('MTN SME HUB', { x: 0.9, y: 1.65, w: 11, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: YELLOW, charSpacing: 3 });
    s.addText(title, { x: 0.9, y: 2.25, w: 11.6, h: 2.2, fontFace: FONT, fontSize: 40, bold: true, color: 'FFFFFF', valign: 'top' });
    if (lead) s.addText(lead, { x: 0.9, y: 4.55, w: 10.6, h: 1.5, fontFace: FONT, fontSize: 15, color: 'C9CDD2', valign: 'top', lineSpacingMultiple: 1.15 });
    s.addText('2026 Redesign Mockup', { x: 0.9, y: 6.75, w: 8, h: 0.4, fontFace: FONT, fontSize: 12, color: GREY });

    sections.forEach(function (sec, i) {
      var cs = pptx.addSlide();
      cs.background = { color: 'FFFFFF' };
      cs.addShape(RECT, { x: 0, y: 0, w: W, h: 0.22, fill: { color: YELLOW } });
      cs.addText(sec.title || 'Details', { x: 0.9, y: 0.6, w: 11.6, h: 1, fontFace: FONT, fontSize: 26, bold: true, color: INK, valign: 'top' });
      if (sec.bullets.length) {
        var body = sec.bullets.map(function (b) {
          return { text: b, options: { bullet: { code: '2022', indent: 18 }, paraSpaceAfter: 8 } };
        });
        cs.addText(body, { x: 0.9, y: 1.75, w: 11.6, h: 4.95, fontFace: FONT, fontSize: 15, color: '374151', valign: 'top', lineSpacingMultiple: 1.1 });
      }
      cs.addText('MTN SME Hub  ·  2026 Redesign Mockup', { x: 0.9, y: 7.02, w: 9, h: 0.35, fontFace: FONT, fontSize: 9, color: GREY });
      cs.addText(String(i + 2), { x: 12.3, y: 7.02, w: 0.7, h: 0.35, fontFace: FONT, fontSize: 9, color: GREY, align: 'right' });
    });

    var cl = pptx.addSlide();
    cl.background = { color: INK };
    cl.addShape(RECT, { x: 0, y: 0, w: W, h: 0.28, fill: { color: YELLOW } });
    cl.addText('Talk to MTN Business', { x: 0.9, y: 2.9, w: 11.6, h: 1, fontFace: FONT, fontSize: 34, bold: true, color: 'FFFFFF' });
    cl.addText('www.mtnsmehub.co.za', { x: 0.9, y: 3.95, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 16, color: YELLOW });

    var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'mockup';
    return pptx.writeFile({ fileName: 'MTN-SME-Hub-' + slug + '.pptx' });
  }
}
