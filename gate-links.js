/*
 * Link gate, hides or neutralises any anchor pointing at a mockup that
 * Mission Control has marked as not finalised. Driven by window.MOCKUP_STATUS
 * (set by mockup-status.js, loaded before this file on every page).
 *
 * On the root archive hub, a gated link's whole list row disappears, since
 * that page is a curated list and a hidden entry should read as "not there",
 * not "there but broken". On every other page (nav bars, version switchers),
 * the link stays visible but is disabled with a tooltip, since removing nav
 * items live would shift layout unpredictably depending on where the link sits.
 *
 * Re-runs via MutationObserver so anything rendered after load stays gated.
 */
(function(){
  var STATUS = window.MOCKUP_STATUS || {};
  var hasStatus = Object.keys(STATUS).length > 0;
  if (!hasStatus) return;

  // Resolve an href to the same "path relative to repo root" shape used as
  // keys in mockup-status.js, e.g. "site/index.html", "reports/foo.html".
  var here = location.pathname;
  var prefix = '';
  if (/\/site\/[^/]*$/.test(here)) prefix = 'site/';
  else if (/\/reports\/[^/]*$/.test(here)) prefix = 'reports/';

  function keyFromHref(href){
    if (!href) return null;
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) return null;
    if (href.charAt(0) === '#') return null;
    var clean = href.split('#')[0].split('?')[0];
    if (clean.indexOf('://') >= 0) return null;
    clean = clean.replace(/^\.\//, '');
    if (!clean || clean.indexOf('.html') < 0) return null;
    if (clean.indexOf('/') >= 0) return clean; // already qualified, e.g. "site/index.html"
    return prefix + clean; // bare filename, qualify with the current page's directory
  }

  function showToast(msg){
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#212529;color:#fff;padding:10px 16px;border-radius:9999px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:99999;opacity:0;transition:opacity .2s;pointer-events:none;';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; });
    setTimeout(function(){ t.style.opacity = '0'; setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 220); }, 2200);
  }

  // The root archive hub's page-list rows: hide the whole row, not just the link.
  var isArchiveHub = /\/(index\.html)?$/.test(here) && prefix === '';

  function gateAnchor(a){
    if (!a || a.dataset.gated === '1' || a.dataset.gated === 'ok') return;
    var key = keyFromHref(a.getAttribute('href'));
    if (!key) return;
    if (!(key in STATUS)) return;
    if (STATUS[key] === 'finalised'){ a.dataset.gated = 'ok'; return; }
    a.dataset.gated = '1';

    if (isArchiveHub && a.closest('.page-list')){
      a.style.display = 'none';
      return;
    }

    a.setAttribute('aria-disabled', 'true');
    a.style.opacity = '.45';
    a.style.pointerEvents = 'auto';
    a.style.cursor = 'not-allowed';
    if (!a.getAttribute('title')) a.setAttribute('title', 'Not shown on this build');
    a.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      showToast('Not shown on this build.');
    }, true);
  }

  function gateAll(root){
    var anchors = (root || document).querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) gateAnchor(anchors[i]);
  }

  function start(){
    gateAll(document);
    if (typeof MutationObserver === 'function'){
      var obs = new MutationObserver(function(muts){
        for (var i = 0; i < muts.length; i++){
          var added = muts[i].addedNodes;
          for (var j = 0; j < added.length; j++){
            var n = added[j];
            if (!n || n.nodeType !== 1) continue;
            if (n.matches && n.matches('a[href]')) gateAnchor(n);
            if (n.querySelectorAll) gateAll(n);
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.applyLinkGates = gateAll;
})();
