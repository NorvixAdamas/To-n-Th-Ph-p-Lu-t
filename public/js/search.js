/* Tra cứu tĩnh — tìm kiếm, lọc, phân trang, không backend */
(function () {
  'use strict';

  var form = document.getElementById('searchForm');
  var resultsEl = document.getElementById('results');
  var pagerEl = document.getElementById('pagination');
  var summaryEl = document.getElementById('searchSummary');
  var PAGE_SIZE = 20;
  var entries = [];
  var fullTextEntries = {};
  var catalog = null;
  var state = { page: 1 };

  var els = {
    q: document.getElementById('q'),
    region: document.getElementById('fRegion'),
    country: document.getElementById('fCountry'),
    type: document.getElementById('fType'),
    kind: document.getElementById('fKind'),
    field: document.getElementById('fField'),
    year: document.getElementById('fYear'),
    status: document.getElementById('fStatus')
  };

  function setOptions(select, items, selected, allLabel) {
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

  function readState(page) {
    return {
      q: (els.q.value || '').trim(),
      region: els.region.value,
      country: els.country.value,
      type: els.type.value,
      kind: els.kind.value,
      field: els.field.value,
      year: els.year.value,
      status: els.status.value,
      page: page || 1
    };
  }

  function syncUrl(next) {
    TTL.setParams({
      q: next.q,
      region: next.region,
      country: next.country,
      type: next.type,
      kind: next.kind,
      field: next.field,
      year: next.year,
      status: next.status,
      page: next.page > 1 ? next.page : ''
    });
  }

  function fullTextFor(entry) {
    return entry && entry.t === 'doc' ? fullTextEntries[String(entry.id)] : null;
  }

  function fullTextExcerpt(entry, query) {
    var source = fullTextFor(entry);
    if (!source || !source.text) return entry.snippet || '';
    var text = String(source.text).replace(/\s+/g, ' ').trim();
    var lower = text.toLocaleLowerCase('vi');
    var needle = String(query || '').toLocaleLowerCase('vi').trim();
    var index = needle ? lower.indexOf(needle) : -1;
    if (index < 0 && needle) {
      var tokens = needle.split(/\s+/).filter(Boolean);
      for (var i = 0; i < tokens.length; i += 1) {
        index = lower.indexOf(tokens[i]);
        if (index !== -1) break;
      }
    }
    if (index < 0) return source.text.replace(/\s+/g, ' ').slice(0, 240) + '…';
    var start = Math.max(0, index - 90);
    var end = Math.min(text.length, index + 230);
    return (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
  }

  function scoreEntry(entry, qNorm, tokens) {
    if (!qNorm) return 0;
    var title = TTL.normalize((entry.title || '') + ' ' + (entry.cn || '') + ' ' + (entry.court || '') + ' ' + (entry.docket || '') + ' ' + (entry.kindLabel || ''));
    var body = TTL.normalize(entry.snippet || '');
    var fullText = fullTextFor(entry) ? fullTextFor(entry).norm : '';
    var score = 0;
    if (title.indexOf(qNorm) !== -1) score += 50;
    if (fullText.indexOf(qNorm) !== -1) score += 8;
    for (var i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      var inTitle = title.indexOf(token) !== -1;
      var inBody = body.indexOf(token) !== -1;
      var inFullText = fullText.indexOf(token) !== -1;
      if (!inTitle && !inBody && !inFullText) return -1;
      if (inTitle) score += 10;
      if (inBody) score += 3;
      if (inFullText) score += 4;
    }
    return score;
  }

  function apply(page) {
    if (!entries.length) return;
    var next = readState(page);
    state = next;
    syncUrl(next);

    var qNorm = TTL.normalize(next.q).trim();
    var tokens = qNorm ? qNorm.split(/\s+/).filter(Boolean) : [];
    var filtered = [];

    entries.forEach(function (entry) {
      if (next.type && entry.t !== next.type) return;
      if (next.region && entry.r !== next.region) return;
      if (next.country && entry.c !== next.country) return;
      if (next.kind && entry.kind !== next.kind) return;
      if (next.field && (entry.fields || []).indexOf(next.field) === -1) return;
      if (next.year && String(entry.year) !== String(next.year)) return;
      if (next.status && entry.status !== next.status) return;
      var score = scoreEntry(entry, qNorm, tokens);
      if (score < 0) return;
      var fullText = fullTextFor(entry);
      filtered.push({
        entry: entry,
        score: score,
        fullTextHit: !!(qNorm && fullText && fullText.norm.indexOf(qNorm) !== -1)
      });
    });

    filtered.sort(function (a, b) {
      return b.score - a.score ||
        (b.entry.year || 0) - (a.entry.year || 0) ||
        String(a.entry.title).localeCompare(String(b.entry.title), 'vi');
    });

    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    var pageNow = Math.min(Math.max(1, next.page), totalPages);
    var slice = filtered.slice((pageNow - 1) * PAGE_SIZE, pageNow * PAGE_SIZE);

    var filterBits = [];
    if (next.country) {
      var c = catalog.countries.filter(function (x) { return x.slug === next.country; })[0];
      if (c) filterBits.push(c.flag + ' ' + c.nameVi);
    }
    if (next.region) filterBits.push(TTL.regionName(next.region));
    if (next.type) filterBits.push(next.type === 'doc' ? 'văn bản' : 'án lệ / bản án');
    if (next.field) filterBits.push(TTL.fieldName(next.field));
    if (next.year) filterBits.push('năm ' + next.year);
    if (next.status) filterBits.push(TTL.statusName(next.status));

    summaryEl.innerHTML = '<strong>' + TTL.fmtNumber(total) + '</strong> kết quả' +
      (next.q ? ' cho “' + TTL.escapeHtml(next.q) + '”' : '') +
      (filterBits.length ? ' · ' + TTL.escapeHtml(filterBits.join(' · ')) : '') +
      '<div class="small muted mt-1">Trang ' + pageNow + ' / ' + totalPages + ' · dữ liệu tĩnh, tìm trong tiêu đề, tóm tắt và toàn văn đã lưu.</div>';

    if (!slice.length) {
      resultsEl.innerHTML = '<p class="empty-state">Chưa tìm thấy kết quả phù hợp. Hãy thử bỏ bớt bộ lọc, đổi từ khóa hoặc ' +
        '<a href="' + TTL.url('/countries.html') + '">chọn quốc gia khác</a>.</p>';
      pagerEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = '<div class="record-list">' + slice.map(function (item) {
      var entry = item.entry;
      var isCase = entry.t === 'case';
      var resultHref = TTL.url(entry.url) + (next.q ? (entry.url.indexOf('?') === -1 ? '?' : '&') + 'q=' + encodeURIComponent(next.q) : '');
      var snippet = item.fullTextHit ? fullTextExcerpt(entry, next.q) : (entry.snippet || '');
      var fields = (entry.fields || []).slice(0, 4).map(function (field) {
        return '<span class="badge badge-soft">' + TTL.escapeHtml(TTL.fieldName(field)) + '</span>';
      }).join('');
      var metaBits = [
        '<span>' + TTL.escapeHtml(entry.kindLabel || '') + '</span>',
        entry.year ? '<span>· ' + entry.year + '</span>' : '',
        isCase && entry.court ? '<span>· ' + TTL.escapeHtml(entry.court) + '</span>' : '',
        isCase && entry.docket ? '<span>· ' + TTL.escapeHtml(entry.docket) + '</span>' : '',
        !isCase ? '<span class="badge badge-status ' + TTL.escapeHtml(entry.status) + '">' + TTL.escapeHtml(TTL.statusName(entry.status)) + '</span>' : ''
      ].join('');
      return '<article class="record-card">' +
        '<div class="record-top"><span class="badge ' + (isCase ? 'badge-case' : '') + '">' +
        (isCase ? 'Án lệ / bản án' : 'Văn bản') + '</span>' +
        '<a href="' + TTL.countryHref(entry.c) + '">' + TTL.escapeHtml(entry.cn) + '</a>' +
        '<span>·</span><span>' + TTL.escapeHtml(TTL.regionName(entry.r)) + '</span></div>' +
        '<h3><a href="' + TTL.escapeHtml(resultHref) + '">' + TTL.escapeHtml(entry.title) + '</a></h3>' +
        '<div class="record-meta">' + metaBits + fields +
        (entry.hasFullText ? '<span class="badge badge-fulltext">Toàn văn</span>' : '') + '</div>' +
        (snippet ? '<p class="record-snippet">' + (item.fullTextHit ? '<span class="small muted">Trích từ toàn văn · </span>' : '') + TTL.highlight(snippet, next.q) + '</p>' : '') +
        '</article>';
    }).join('') + '</div>';

    TTL.renderPager(pagerEl, pageNow, totalPages, function (target) {
      apply(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function reset() {
    form.reset();
    apply(1);
  }

  function init() {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      apply(1);
    });
    [els.region, els.country, els.type, els.kind, els.field, els.year, els.status].forEach(function (select) {
      if (select) select.addEventListener('change', function () { apply(1); });
    });
    var resetButton = document.getElementById('btnReset');
    if (resetButton) resetButton.addEventListener('click', reset);

    var initialCountry = TTL.getParam('country');
    if (initialCountry && catalog) {
      var found = catalog.countries.filter(function (c) { return c.code === initialCountry || c.slug === initialCountry; })[0];
      if (found) initialCountry = found.slug;
      els.country.value = initialCountry;
    }
    els.q.value = TTL.getParam('q');
    els.region.value = TTL.getParam('region');
    els.type.value = TTL.getParam('type');
    els.kind.value = TTL.getParam('kind');
    els.field.value = TTL.getParam('field');
    els.status.value = TTL.getParam('status');
    var yearParam = TTL.getParam('year');
    if (yearParam) els.year.value = yearParam;
    var page = parseInt(TTL.getParam('page'), 10) || 1;

    apply(page);
  }

  Promise.all([
    TTL.loadJSON('/data/search-index.json'),
    TTL.loadCatalog(),
    TTL.loadJSON('/data/fulltext-index.json').catch(function () { return { entries: [] }; })
  ]).then(function (values) {
    entries = values[0].entries || [];
    catalog = values[1];
    (values[2].entries || []).forEach(function (entry) {
      if (entry.t && entry.t !== 'doc') return;
      fullTextEntries[String(entry.id)] = { text: entry.text || '', norm: TTL.normalize(entry.text || '') };
    });
    TTL.fillCountrySelect(els.country, catalog.countries, TTL.getParam('country'), true);
    setOptions(els.region, catalog.regions.map(function (r) { return { value: r.key, label: r.name }; }), TTL.getParam('region'), 'Tất cả khu vực');
    setOptions(els.field, Object.keys(TTL.fieldNames).map(function (key) { return { value: key, label: TTL.fieldNames[key] }; }), TTL.getParam('field'), 'Tất cả lĩnh vực');
    var years = entries.map(function (e) { return e.year; }).filter(Boolean);
    var uniqueYears = years.filter(function (y, i) { return years.indexOf(y) === i; }).sort(function (a, b) { return b - a; });
    setOptions(els.year, uniqueYears.map(String), TTL.getParam('year'), 'Tất cả năm');
    init();
  }).catch(function (error) {
    TTL.showError(resultsEl, error);
    if (summaryEl) summaryEl.textContent = '';
  });
})();
