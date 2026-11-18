/* Danh sách án lệ / bản án — dữ liệu tĩnh */
(function () {
  'use strict';

  var form = document.getElementById('caseForm');
  var resultsEl = document.getElementById('caseResults');
  var pagerEl = document.getElementById('casePagination');
  var summaryEl = document.getElementById('caseSummary');
  var PAGE_SIZE = 20;
  var entries = [];
  var catalog = null;

  var els = {
    q: document.getElementById('cq'),
    region: document.getElementById('cRegion'),
    country: document.getElementById('cCountry'),
    kind: document.getElementById('cKind'),
    field: document.getElementById('cField'),
    year: document.getElementById('cYear')
  };

  function options(select, items, selected, allLabel) {
    if (!select) return;
    var html = allLabel ? '<option value="">' + TTL.escapeHtml(allLabel) + '</option>' : '';
    html += items.map(function (item) {
      var value = item.value != null ? item.value : item;
      var label = item.label != null ? item.label : item;
      return '<option value="' + TTL.escapeHtml(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' +
        TTL.escapeHtml(label) + '</option>';
    }).join('');
    select.innerHTML = html;
  }

  function state(page) {
    return {
      q: (els.q.value || '').trim(),
      region: els.region.value,
      country: els.country.value,
      kind: els.kind.value,
      field: els.field.value,
      year: els.year.value,
      page: page || 1
    };
  }

  function syncUrl(next) {
    TTL.setParams({
      q: next.q,
      region: next.region,
      country: next.country,
      kind: next.kind,
      field: next.field,
      year: next.year,
      page: next.page > 1 ? next.page : ''
    });
  }

  function apply(page) {
    if (!entries.length) return;
    var next = state(page);
    syncUrl(next);
    var qNorm = TTL.normalize(next.q).trim();
    var tokens = qNorm ? qNorm.split(/\s+/).filter(Boolean) : [];
    var filtered = [];

    entries.forEach(function (entry) {
      if (next.region && entry.r !== next.region) return;
      if (next.country && entry.c !== next.country) return;
      if (next.kind && entry.kind !== next.kind) return;
      if (next.field && (entry.fields || []).indexOf(next.field) === -1) return;
      if (next.year && String(entry.year) !== String(next.year)) return;
      var hay = TTL.normalize((entry.name || '') + ' ' + (entry.court || '') + ' ' + (entry.docket || '') + ' ' + (entry.summary || '') + ' ' + (entry.cn || ''));
      var score = 0;
      if (qNorm) {
        if (hay.indexOf(qNorm) !== -1) score += 30;
        for (var i = 0; i < tokens.length; i += 1) {
          if (hay.indexOf(tokens[i]) === -1) return;
          score += 5;
        }
      }
      filtered.push({ entry: entry, score: score });
    });

    filtered.sort(function (a, b) {
      return b.score - a.score ||
        String(b.entry.dateDecided || '').localeCompare(String(a.entry.dateDecided || '')) ||
        String(a.entry.name).localeCompare(String(b.entry.name), 'vi');
    });

    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    var pageNow = Math.min(Math.max(1, next.page), totalPages);
    var slice = filtered.slice((pageNow - 1) * PAGE_SIZE, pageNow * PAGE_SIZE);

    var country = next.country ? catalog.countries.filter(function (c) { return c.slug === next.country; })[0] : null;
    summaryEl.innerHTML = '<strong>' + TTL.fmtNumber(total) + '</strong> vụ án' +
      (country ? ' · ' + country.flag + ' ' + TTL.escapeHtml(country.nameVi) : '') +
      (next.kind ? ' · ' + TTL.escapeHtml(next.kind === 'precedent' ? 'án lệ' : 'bản án') : '') +
      (next.field ? ' · ' + TTL.escapeHtml(TTL.fieldName(next.field)) : '') +
      (next.year ? ' · năm ' + next.year : '') +
      '<div class="small muted mt-1">Trang ' + pageNow + ' / ' + totalPages + ' · dữ liệu tóm tắt từ bộ dữ liệu tĩnh.</div>';

    if (!slice.length) {
      resultsEl.innerHTML = '<p class="empty-state">Chưa có vụ án phù hợp với bộ lọc. Hãy thử bỏ bớt điều kiện hoặc ' +
        '<a href="' + TTL.url('/cases.html') + '">xem toàn bộ án lệ</a>.</p>';
      pagerEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = '<div class="record-list">' + slice.map(function (item) {
      var entry = item.entry;
      var fields = (entry.fields || []).slice(0, 4).map(function (field) {
        return '<span class="badge badge-soft">' + TTL.escapeHtml(TTL.fieldName(field)) + '</span>';
      }).join('');
      return '<article class="record-card">' +
        '<div class="record-top"><span class="badge badge-case">' + TTL.escapeHtml(entry.kindLabel) + '</span>' +
        '<a href="' + TTL.countryHref(entry.c) + '">' + TTL.escapeHtml(entry.cn) + '</a>' +
        '<span>·</span><span>' + TTL.escapeHtml(TTL.regionName(entry.r)) + '</span>' +
        (entry.dateDecided ? '<span>· ' + TTL.escapeHtml(TTL.fmtDate(entry.dateDecided)) + '</span>' : '') + '</div>' +
        '<h3><a href="' + TTL.escapeHtml(TTL.url(entry.url)) + '">' + TTL.escapeHtml(entry.name) + '</a></h3>' +
        '<div class="record-meta">' +
        (entry.court ? '<span>' + TTL.escapeHtml(entry.court) + '</span>' : '') +
        (entry.docket ? '<span>· ' + TTL.escapeHtml(entry.docket) + '</span>' : '') + fields + '</div>' +
        '<p class="record-snippet">' + TTL.highlight(entry.summary, next.q) + '…</p>' +
        '</article>';
    }).join('') + '</div>';

    TTL.renderPager(pagerEl, pageNow, totalPages, function (target) {
      apply(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function init() {
    form.addEventListener('submit', function (event) { event.preventDefault(); apply(1); });
    [els.region, els.country, els.kind, els.field, els.year].forEach(function (select) {
      if (select) select.addEventListener('change', function () { apply(1); });
    });
    var reset = document.getElementById('caseReset');
    if (reset) reset.addEventListener('click', function () { form.reset(); apply(1); });

    var countryParam = TTL.getParam('country');
    if (countryParam && catalog) {
      var found = catalog.countries.filter(function (c) { return c.code === countryParam || c.slug === countryParam; })[0];
      els.country.value = found ? found.slug : countryParam;
    }
    els.q.value = TTL.getParam('q');
    els.region.value = TTL.getParam('region');
    els.kind.value = TTL.getParam('kind');
    els.field.value = TTL.getParam('field');
    if (TTL.getParam('year')) els.year.value = TTL.getParam('year');
    apply(parseInt(TTL.getParam('page'), 10) || 1);
  }

  Promise.all([
    TTL.loadJSON('/data/cases-index.json'),
    TTL.loadCatalog()
  ]).then(function (values) {
    entries = values[0].entries || [];
    catalog = values[1];
    TTL.fillCountrySelect(els.country, catalog.countries, TTL.getParam('country'), true);
    options(els.region, catalog.regions.map(function (r) { return { value: r.key, label: r.name }; }), TTL.getParam('region'), 'Tất cả khu vực');
    options(els.field, Object.keys(TTL.fieldNames).map(function (key) { return { value: key, label: TTL.fieldNames[key] }; }), TTL.getParam('field'), 'Tất cả lĩnh vực');
    var years = entries.map(function (e) { return e.year; }).filter(Boolean);
    var unique = years.filter(function (y, i) { return years.indexOf(y) === i; }).sort(function (a, b) { return b - a; });
    options(els.year, unique.map(String), TTL.getParam('year'), 'Tất cả năm');
    init();
  }).catch(function (error) {
    TTL.showError(resultsEl, error);
    if (summaryEl) summaryEl.textContent = '';
  });
})();
