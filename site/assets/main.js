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
});
