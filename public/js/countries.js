/* Danh mục 195 quốc gia */
(function () {
  'use strict';

  var content = document.getElementById('countriesContent');
  var summary = document.getElementById('countryCount');
  var filterBar = document.getElementById('regionFilter');
  var searchInput = document.getElementById('countrySearch');
  var state = { q: '', region: 'all' };
  var catalog = null;

  function matches(c) {
    if (state.region !== 'all' && c.region !== state.region) return false;
    var q = TTL.normalize(state.q).trim();
    if (!q) return true;
    return TTL.normalize(c.nameVi + ' ' + c.nameEn + ' ' + c.code + ' ' + (c.legalFamily || '')).indexOf(q) !== -1;
  }

  function card(c) {
    return '<a class="country-card" href="' + TTL.countryHref(c.slug) + '">' +
      '<span class="country-card-top"><span class="country-flag">' + TTL.flag(c.flag) + '</span>' +
      '<h3>' + TTL.escapeHtml(c.nameVi) + '</h3></span>' +
      '<span class="country-en">' + TTL.escapeHtml(c.nameEn) + ' · ' + TTL.escapeHtml(c.code) + '</span>' +
      '<span class="country-counts"><span><strong>' + TTL.fmtNumber(c.documents) + '</strong> văn bản</span>' +
      '<span><strong>' + TTL.fmtNumber(c.cases) + '</strong> vụ án</span></span>' +
      '<span class="coverage-pill ' + (c.hasData ? '' : 'no-data') + '">' +
      (c.hasData ? 'Có dữ liệu' : 'Chưa có dữ liệu') + '</span>' +
      '</a>';
  }

  function render() {
    if (!catalog) return;
    var list = catalog.countries.filter(matches);
    var regions = catalog.regions.filter(function (r) {
      return state.region === 'all' || r.key === state.region;
    });
    var html = '';
    regions.forEach(function (region) {
      var items = list.filter(function (c) { return c.region === region.key; });
      if (!items.length) return;
      html += '<section class="country-section" id="region-' + TTL.escapeHtml(region.key) + '">' +
        '<div class="section-head"><div><div class="eyebrow">' + region.icon + ' ' +
        TTL.escapeHtml(region.name) + '</div><h2>' + items.length + ' quốc gia</h2></div>' +
        '<span class="muted small">' + region.withData + ' quốc gia có dữ liệu</span></div>' +
        '<div class="country-grid">' + items.map(card).join('') + '</div></section>';
    });
    content.innerHTML = html || '<p class="empty-state">Không tìm thấy quốc gia phù hợp. Hãy thử từ khóa khác.</p>';
    summary.innerHTML = '<strong>' + list.length + '</strong> / ' + catalog.countries.length +
      ' quốc gia · <strong>' + catalog.stats.withData + '</strong> có dữ liệu · ' +
      TTL.fmtNumber(catalog.stats.documents) + ' văn bản · ' + TTL.fmtNumber(catalog.stats.cases) + ' vụ án';
  }

  function setRegion(region) {
    state.region = region || 'all';
    filterBar.querySelectorAll('button[data-region]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-region') === state.region);
      button.setAttribute('aria-pressed', button.getAttribute('data-region') === state.region ? 'true' : 'false');
    });
    render();
  }

  TTL.loadCatalog().then(function (data) {
    catalog = data;
    filterBar.innerHTML = '<button type="button" class="filter-chip active" data-region="all" aria-pressed="true">Tất cả</button>' +
      data.regions.map(function (r) {
        return '<button type="button" class="filter-chip" data-region="' + TTL.escapeHtml(r.key) + '" aria-pressed="false">' +
          r.icon + ' ' + TTL.escapeHtml(r.name) + '</button>';
      }).join('');
    filterBar.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-region]');
      if (button) setRegion(button.getAttribute('data-region'));
    });
    searchInput.addEventListener('input', TTL.debounce(function () {
      state.q = searchInput.value;
      render();
    }, 120));
    var hash = (window.location.hash || '').replace('#region-', '');
    if (hash && data.regions.some(function (r) { return r.key === hash; })) setRegion(hash);
    else render();
  }).catch(function (error) {
    TTL.showError(content, error);
    if (summary) summary.textContent = '';
  });
})();
