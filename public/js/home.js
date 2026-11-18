/* Trang chủ — dữ liệu thật từ data/home.json */
(function () {
  'use strict';

  var els = {
    stats: document.getElementById('home-stats'),
    coverage: document.getElementById('home-coverage'),
    regions: document.getElementById('home-regions'),
    countries: document.getElementById('home-countries'),
    latest: document.getElementById('home-latest'),
    cases: document.getElementById('home-cases'),
    fields: document.getElementById('home-fields'),
    treaties: document.getElementById('home-treaties'),
    updated: document.getElementById('home-updated')
  };

  function statCard(value, label) {
    return '<div class="stat-card"><span class="stat-value">' + TTL.escapeHtml(value) +
      '</span><span class="stat-label">' + TTL.escapeHtml(label) + '</span></div>';
  }

  function render(data) {
    var s = data.stats;
    els.stats.innerHTML =
      statCard(TTL.fmtNumber(s.countries), 'quốc gia trong danh mục') +
      statCard(TTL.fmtNumber(s.documents), 'văn bản pháp luật') +
      statCard(TTL.fmtNumber(s.cases), 'án lệ / bản án') +
      statCard(TTL.fmtNumber(s.withData), 'quốc gia đã có dữ liệu');

    var percent = s.countries ? Math.round((s.withData / s.countries) * 1000) / 10 : 0;
    els.coverage.innerHTML =
      '<div class="coverage-box">' +
      '<strong>Độ phủ: ' + TTL.fmtNumber(s.withData) + ' / ' + TTL.fmtNumber(s.countries) + ' quốc gia</strong>' +
      '<div class="meter"><span style="width:' + percent + '%"></span></div>' +
      '<div>' + percent + '% danh mục đã có dữ liệu. ' +
      '<a href="' + TTL.url('/coverage.html') + '">Xem báo cáo độ phủ →</a></div>' +
      '<div class="small mt-1">' + TTL.fmtNumber(s.fullTextDocuments || 0) + ' văn bản có toàn văn · ' +
      TTL.fmtNumber(s.versions) + ' phiên bản tài liệu · ' + TTL.fmtNumber(s.sources) + ' nguồn được trích dẫn</div>' +
      '</div>';

    if (els.updated) {
      els.updated.textContent = 'Dữ liệu cập nhật gần nhất: ' + TTL.fmtDate((s.updatedAt || '').slice(0, 10));
    }

    els.regions.innerHTML = data.regions.map(function (region) {
      return '<a class="region-card" href="' + TTL.url('/countries.html#region-' + region.key) + '">' +
        '<span class="region-icon">' + region.icon + '</span>' +
        '<span class="region-name">' + TTL.escapeHtml(region.name) + '</span>' +
        '<span class="region-meta">' + TTL.escapeHtml(region.blurb) + '</span>' +
        '<span class="region-counts"><span><strong>' + region.countries + '</strong> quốc gia</span>' +
        '<span><strong>' + region.withData + '</strong> có dữ liệu</span></span>' +
        '</a>';
    }).join('');

    els.countries.innerHTML = data.countries.map(function (c) {
      return '<a class="country-card" href="' + TTL.countryHref(c.slug) + '">' +
        '<span class="country-card-top"><span class="country-flag">' + TTL.flag(c.flag) + '</span>' +
        '<h3>' + TTL.escapeHtml(c.nameVi) + '</h3></span>' +
        '<span class="country-en">' + TTL.escapeHtml(c.legalFamily || '') + '</span>' +
        '<span class="country-counts"><span><strong>' + TTL.fmtNumber(c.documents) + '</strong> văn bản</span>' +
        '<span><strong>' + TTL.fmtNumber(c.cases) + '</strong> vụ án</span></span>' +
        '</a>';
    }).join('') || '<p class="empty-state">Chưa có quốc gia nào có dữ liệu.</p>';

    els.latest.innerHTML = data.latestDocs.map(function (d) {
      return '<li><a class="list-title" href="' + TTL.docHref(d.id) + '">' + TTL.escapeHtml(d.title) + '</a>' +
        '<div class="list-meta"><span class="flag">' + TTL.flag(d.flag) + '</span>' +
        '<a href="' + TTL.countryHref(d.countrySlug) + '">' + TTL.escapeHtml(d.countryName) + '</a>' +
        '<span>' + TTL.escapeHtml(d.kindLabel) + '</span>' +
        (d.hasFullText ? '<span class="badge badge-fulltext">Toàn văn</span>' : '') +
        (d.year ? '<span>' + d.year + '</span>' : '') +
        (d.fields && d.fields.length ? '<span>· ' + TTL.escapeHtml(d.fields.join(', ')) + '</span>' : '') +
        '</div></li>';
    }).join('') || '<li class="empty-state">Chưa có dữ liệu.</li>';

    els.cases.innerHTML = data.featuredCases.map(function (c) {
      return '<li><a class="list-title" href="' + TTL.caseHref(c.id) + '">' + TTL.escapeHtml(c.name) + '</a>' +
        '<div class="list-meta"><span class="flag">' + TTL.flag(c.flag) + '</span>' +
        '<a href="' + TTL.countryHref(c.countrySlug) + '">' + TTL.escapeHtml(c.countryName) + '</a>' +
        (c.court ? '<span>· ' + TTL.escapeHtml(c.court) + '</span>' : '') +
        (c.year ? '<span>· ' + c.year + '</span>' : '') + '</div>' +
        '<p class="snippet">' + TTL.escapeHtml(c.summary) + '…</p></li>';
    }).join('') || '<li class="empty-state">Chưa có dữ liệu.</li>';

    els.fields.innerHTML = data.fields.map(function (f) {
      return '<a class="field-chip" href="' + TTL.url('/search.html?field=' + encodeURIComponent(f.key)) + '">' +
        TTL.escapeHtml(f.name) + '<span>' + TTL.fmtNumber(f.count) + '</span></a>';
    }).join('');

    els.treaties.innerHTML = data.treaties.map(function (t) {
      return '<li><a class="list-title" href="' + TTL.url('/treaties.html#' + t.id) + '">' +
        TTL.escapeHtml(t.nameVi) + '</a>' +
        '<div class="list-meta"><span>' + TTL.escapeHtml(t.place || '') + '</span>' +
        (t.adopted ? '<span>· ' + TTL.escapeHtml(t.adopted) + '</span>' : '') + '</div></li>';
    }).join('') || '<li class="empty-state">Chưa có dữ liệu điều ước.</li>';
  }

  TTL.loadJSON('/data/home.json').then(render).catch(function (error) {
    TTL.showError(els.stats, error);
    [els.regions, els.countries, els.latest, els.cases, els.fields, els.treaties].forEach(function (el) {
      if (el) el.innerHTML = '<p class="error-state">Không tải được dữ liệu trang chủ.</p>';
    });
  });
})();
