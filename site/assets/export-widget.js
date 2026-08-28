// MTN SME Hub — self-contained "Export as PDF / PPT" widget.
// Include on document-style pages only (strategy report, brand CI).
// Injects its own styles, derives the PptxGenJS path from its own URL,
// and builds a branded, editable deck from the page's headings and text.
(function () {
  if (window.__mtnExportInit) return;
  window.__mtnExportInit = true;

  var thisScript = document.currentScript || (function () {
    var s = document.getElementsByTagName('script'); return s[s.length - 1];
  })();
  var base = (thisScript && thisScript.src) ? thisScript.src.replace(/[^/]*$/, '') : '';
  var PPTX_SRC = base + 'vendor/pptxgen.bundle.js';

  var CSS = [
    ".export-fab{position:fixed;left:24px;bottom:24px;z-index:9000;display:flex;flex-direction:column;align-items:flex-start;gap:10px;font-family:'Inter',system-ui,-apple-system,Segoe UI,sans-serif;}",
    ".export-toggle{position:relative;display:inline-flex;align-items:center;gap:9px;background:#212529;color:#fff;border:none;border-radius:999px;padding:12px 18px 12px 15px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);}",
    ".export-toggle svg{color:#FFC502;flex-shrink:0;}",
    ".export-toggle::before{content:'';position:absolute;inset:0;border-radius:999px;animation:mtnExportPulse 2.4s ease-out infinite;pointer-events:none;}",
    "@keyframes mtnExportPulse{0%{box-shadow:0 0 0 0 rgba(255,197,2,.5);}70%{box-shadow:0 0 0 14px rgba(255,197,2,0);}100%{box-shadow:0 0 0 0 rgba(255,197,2,0);}}",
    ".export-fab.open .export-toggle::before{animation:none;}",
    ".export-menu{display:none;flex-direction:column;gap:4px;background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:8px;box-shadow:0 12px 30px rgba(0,0,0,.18);min-width:220px;}",
    ".export-fab.open .export-menu{display:flex;}",
    ".export-menu .eh{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9AA0A6;padding:6px 10px 4px;}",
    ".export-opt{display:flex;align-items:center;gap:11px;background:none;border:none;border-radius:8px;padding:9px 10px;font-family:inherit;font-size:13px;font-weight:700;color:#212529;cursor:pointer;text-align:left;width:100%;}",
    ".export-opt:hover{background:#F7F7F8;}",
    ".export-opt .ei{width:34px;height:34px;border-radius:8px;background:#FFFAE6;color:#CC9E00;display:grid;place-items:center;flex-shrink:0;}",
    ".export-opt small{display:block;font-weight:500;color:#6B7280;font-size:11px;}",
    ".export-opt[disabled]{opacity:.6;cursor:default;}",
    "@media(max-width:640px){.export-fab{left:16px;bottom:16px;}.export-toggle .export-label{display:none;}.export-toggle{padding:13px;}}",
    "@media print{.export-fab{display:none !important;}}"
  ].join('');

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    if (document.querySelector('.export-fab')) return;

    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var fab = document.createElement('div');
    fab.className = 'export-fab';
    fab.innerHTML =
      '<div class="export-menu">' +
        '<div class="eh">Download this document</div>' +
        '<button class="export-opt" data-export="pdf" type="button">' +
          '<span class="ei"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h4"/></svg></span>' +
          '<span>PDF document<small>Opens your Save as PDF dialog</small></span>' +
        '</button>' +
        '<button class="export-opt" data-export="ppt" type="button">' +
          '<span class="ei"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg></span>' +
          '<span class="lbl">PowerPoint deck<small>Downloads an editable .pptx</small></span>' +
        '</button>' +
      '</div>' +
      '<button class="export-toggle" type="button" aria-label="Download this document">' +
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
    pptBtn.addEventListener('click', function () { fab.classList.remove('open'); runPptExport(pptBtn); });
  });

  var pptxLoader = null;
  function ensurePptx() {
    if (window.PptxGenJS) return Promise.resolve();
    if (pptxLoader) return pptxLoader;
    pptxLoader = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PPTX_SRC;
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

  var CHROME = 'nav, .docnav, header, footer, .docfoot, .footer, .export-fab, script, style';

  function firstMainH1() {
    var hs = document.querySelectorAll('h1');
    for (var i = 0; i < hs.length; i++) {
      if (!hs[i].closest('nav, .docnav, footer, .docfoot')) return clean(hs[i].textContent);
    }
    return '';
  }

  function leadText() {
    var ps = document.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].closest(CHROME)) continue;
      var t = clean(ps[i].textContent);
      if (t.length > 40) return t.length > 240 ? t.slice(0, 237) + '…' : t;
    }
    return '';
  }

  function collectSections() {
    var nodes = document.querySelectorAll('h2, h3, p, li');
    var out = [], cur = null;
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest(CHROME)) return;
      var t = clean(el.textContent);
      if (!t) return;
      var tag = el.tagName.toLowerCase();
      if (tag === 'h2' || tag === 'h3') {
        cur = { title: t, bullets: [] };
        out.push(cur);
      } else if (cur && t.length > 3 && cur.bullets.length < 7 && cur.bullets.indexOf(t) === -1) {
        cur.bullets.push(t.length > 200 ? t.slice(0, 197) + '…' : t);
      }
    });
    return out.filter(function (s) { return s.bullets.length || s.title; });
  }

  function generateDeck() {
    var INK = '212529', YELLOW = 'FFC502', GREY = '8A8F98', FONT = 'Calibri';
    var W = 13.333;
    var title = firstMainH1() || pageName();
    var lead = leadText();
    var sections = collectSections().slice(0, 16);

    var pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'MTN SME Hub';
    pptx.company = 'MTN SME Hub';
    pptx.title = title;
    var RECT = (pptx.ShapeType && pptx.ShapeType.rect) || 'rect';

    var s = pptx.addSlide();
    s.background = { color: INK };
    s.addShape(RECT, { x: 0, y: 0, w: W, h: 0.28, fill: { color: YELLOW } });
    s.addText('MTN SME HUB', { x: 0.9, y: 1.6, w: 11, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: YELLOW, charSpacing: 3 });
    s.addText(title, { x: 0.9, y: 2.2, w: 11.6, h: 2.3, fontFace: FONT, fontSize: 38, bold: true, color: 'FFFFFF', valign: 'top' });
    if (lead) s.addText(lead, { x: 0.9, y: 4.7, w: 10.6, h: 1.5, fontFace: FONT, fontSize: 15, color: 'C9CDD2', valign: 'top', lineSpacingMultiple: 1.15 });
    s.addText('2026 Redesign', { x: 0.9, y: 6.75, w: 8, h: 0.4, fontFace: FONT, fontSize: 12, color: GREY });

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
      cs.addText('MTN SME Hub  ·  2026 Redesign', { x: 0.9, y: 7.02, w: 9, h: 0.35, fontFace: FONT, fontSize: 9, color: GREY });
      cs.addText(String(i + 2), { x: 12.3, y: 7.02, w: 0.7, h: 0.35, fontFace: FONT, fontSize: 9, color: GREY, align: 'right' });
    });

    var cl = pptx.addSlide();
    cl.background = { color: INK };
    cl.addShape(RECT, { x: 0, y: 0, w: W, h: 0.28, fill: { color: YELLOW } });
    cl.addText('Talk to MTN Business', { x: 0.9, y: 2.9, w: 11.6, h: 1, fontFace: FONT, fontSize: 34, bold: true, color: 'FFFFFF' });
    cl.addText('www.mtnsmehub.co.za', { x: 0.9, y: 3.95, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 16, color: YELLOW });

    var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'document';
    return pptx.writeFile({ fileName: 'MTN-SME-Hub-' + slug + '.pptx' });
  }
})();
