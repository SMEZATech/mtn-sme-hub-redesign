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
});
