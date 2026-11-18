/* Trang quốc gia — 19 nhóm nội dung, dữ liệu JSON tĩnh */
(function () {
  'use strict';

  var slug = document.body.getAttribute('data-country');
  var root = document.getElementById('country-content');

  var SECTION_INDEX = [
    [2, 'Hiến pháp'], [3, 'Bộ luật'], [4, 'Đạo luật'], [5, 'Nghị định'],
    [6, 'Thông tư & văn bản dưới luật'], [7, 'Án lệ'], [8, 'Bản án'], [9, 'Tòa án'],
    [10, 'Luật thuế'], [11, 'Luật dân sự'], [12, 'Luật hình sự'], [13, 'Luật thương mại'],
    [14, 'Luật lao động'], [15, 'Luật đất đai'], [16, 'Luật doanh nghiệp'],
    [17, 'Sở hữu trí tuệ'], [18, 'Công nghệ & dữ liệu'], [19, 'Lĩnh vực khác']
  ];

  if (!slug) {
    root.innerHTML = '<p class="error-state">Thiếu mã quốc gia.</p>';
    return;
  }

  function docLink(d) {
    return '<li class="law-item"><a class="law-title" href="' + TTL.docHref(d.id) + '">' +
      TTL.escapeHtml(d.title) + '</a><div class="law-meta">' +
      '<span class="badge">' + TTL.escapeHtml(d.kindLabel) + '</span>' +
      (d.year ? '<span>' + d.year + '</span>' : '') +
      (d.fullTextAvailable ? '<span class="badge badge-fulltext">Toàn văn</span>' : '') +
      '<span class="badge badge-status ' + TTL.escapeHtml(d.status) + '">' + TTL.escapeHtml(d.statusLabel) + '</span>' +
      (d.fields && d.fields.length ? '<span>· ' + TTL.escapeHtml(d.fieldLabels.join(', ')) + '</span>' : '') +
      '</div></li>';
  }

  function caseLink(c) {
    return '<li class="law-item"><a class="law-title" href="' + TTL.caseHref(c.id) + '">' +
      TTL.escapeHtml(c.name) + '</a><div class="law-meta">' +
      '<span class="badge badge-case">' + TTL.escapeHtml(c.kindLabel) + '</span>' +
      (c.court ? '<span>' + TTL.escapeHtml(c.court) + '</span>' : '') +
      (c.dateDecided ? '<span>· ' + TTL.escapeHtml(TTL.fmtDate(c.dateDecided)) + '</span>' : '') +
      '</div><p class="snippet">' + TTL.escapeHtml(c.summary) + '…</p></li>';
  }

  function sortDocs(list) {
    return list.slice().sort(function (a, b) {
      return (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title, 'vi');
    });
  }

  function sectionHtml(def) {
    var count = def.items.length;
    var shown = def.items.slice(0, def.limit || 5);
    var body;
    if (!count) {
      body = '<p class="empty-state small mb-1">' + TTL.escapeHtml(def.empty || 'Chưa có dữ liệu trong bộ dữ liệu hiện tại.') + '</p>';
    } else if (def.type === 'court') {
      body = '<ul class="court-list">' + def.items.map(function (court) {
        return '<li><strong>' + TTL.escapeHtml(court.name) + '</strong> · ' + court.count + ' vụ</li>';
      }).join('') + '</ul>';
    } else {
      body = '<ul class="law-list">' + shown.map(def.type === 'case' ? caseLink : docLink).join('') + '</ul>';
    }
    var more = '';
    if (count > shown.length) {
      more = '<a class="law-more" href="' + TTL.url(def.allLink) + '">Xem tất cả ' + TTL.fmtNumber(count) +
        (def.type === 'case' ? ' vụ án' : ' mục') + ' →</a>';
    } else if (count && def.allLink) {
      more = '<a class="law-more" href="' + TTL.url(def.allLink) + '">Mở trong trang tra cứu →</a>';
    }
    return '<section class="law-section" id="muc-' + def.num + '">' +
      '<div class="law-section-head"><span class="law-num">' + def.num + '</span>' +
      '<h2>' + TTL.escapeHtml(def.title) + '</h2>' +
      '<span class="count">' + TTL.fmtNumber(count) + '</span></div>' +
      body + more + '</section>';
  }

  function renderHero(meta) {
    var stats = meta.stats || {};
    var badges = [
      '<span class="badge">' + TTL.escapeHtml(meta.regionName || '') + '</span>',
      meta.code ? '<span class="badge badge-soft">' + TTL.escapeHtml(meta.code) + '</span>' : '',
      meta.legalFamily ? '<span class="badge badge-soft">' + TTL.escapeHtml(meta.legalFamily) + '</span>' : '',
      meta.hasData ? '<span class="badge badge-status">Có dữ liệu</span>' : '<span class="badge badge-soft">Chưa có dữ liệu</span>'
    ].join('');
    return '<section class="country-hero">' +
      '<div class="country-flag" aria-hidden="true">' + TTL.flag(meta.flag) + '</div>' +
      '<div><div class="eyebrow">' + TTL.escapeHtml(meta.regionName || '') +
      (meta.subregion ? ' · ' + TTL.escapeHtml(meta.subregion) : '') + '</div>' +
      '<h1>' + TTL.escapeHtml(meta.nameVi) + '</h1>' +
      '<p class="country-sub">' + TTL.escapeHtml(meta.nameEn || '') +
      (meta.capital ? ' · Thủ đô: ' + TTL.escapeHtml(meta.capital) : '') + '</p>' +
      '<div class="country-badges">' + badges + '</div>' +
      '<p class="country-overview">' + TTL.escapeHtml(meta.overview || 'Chưa có dữ liệu tổng quan pháp luật được xác minh cho quốc gia này.') + '</p>' +
      '<form class="country-search" action="/search.html" method="get" role="search">' +
      '<input type="hidden" name="country" value="' + TTL.escapeHtml(slug) + '">' +
      '<input type="search" name="q" placeholder="Tìm trong dữ liệu ' + TTL.escapeHtml(meta.nameVi) + '…" aria-label="Tìm trong quốc gia">' +
      '<button class="btn btn-primary btn-small" type="submit">Tìm</button></form>' +
      '<div class="country-stats">' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(stats.documents || 0) + '</span><span class="stat-label">văn bản</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(stats.cases || 0) + '</span><span class="stat-label">án lệ / bản án</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(stats.courts || 0) + '</span><span class="stat-label">tòa án</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(stats.fields || 0) + '</span><span class="stat-label">lĩnh vực</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(stats.fullTextDocuments || 0) + '</span><span class="stat-label">văn bản toàn văn</span></div>' +
      '</div></div></section>';
  }

  function renderSources(meta) {
    if (!meta.sources || !meta.sources.length) return '';
    return '<section class="country-sources"><h2>Nguồn pháp luật chính thức</h2>' +
      '<ul class="source-list">' + meta.sources.map(function (source) {
        return '<li><a href="' + TTL.escapeHtml(source.url) + '" target="_blank" rel="noopener">' +
          TTL.escapeHtml(source.name) + '<span>' + TTL.escapeHtml(TTL.host(source.url)) + '</span></a></li>';
      }).join('') + '</ul></section>';
  }

  function renderTopics(topics) {
    if (!topics || !topics.length) return '';
    return '<section class="country-sources"><h2>Chủ đề tra cứu gợi ý</h2>' +
      '<div class="topic-chips">' + topics.map(function (topic) {
        var params = 'country=' + encodeURIComponent(slug) + '&q=' + encodeURIComponent(topic.q);
        if (topic.tax) params += '&field=tax';
        return '<a class="topic-chip" href="' + TTL.url('/search.html?' + params) + '">' + TTL.escapeHtml(topic.name) + '</a>';
      }).join('') + '</div></section>';
  }

  function renderNoData(meta) {
    var checklist = SECTION_INDEX.map(function (item) {
      return '<span>' + item[1] + '<span>Chưa có dữ liệu</span></span>';
    }).join('');
    return renderHero(meta) +
      '<section class="empty-state mt-2"><h2>Chưa có văn bản cho ' + TTL.escapeHtml(meta.nameVi) + '</h2>' +
      '<p>Quốc gia này đã có trang riêng trong danh mục 195 quốc gia, nhưng bộ dữ liệu hiện tại chưa có văn bản hay án lệ nào. ' +
      'Website không tự tạo dữ liệu pháp luật để lấp chỗ trống.</p>' +
      '<p class="small">Bạn có thể tra cứu trên <a href="https://www.worldlii.org/" target="_blank" rel="noopener">WorldLII</a>, ' +
      'xem <a href="' + TTL.url('/coverage.html') + '">báo cáo độ phủ</a> hoặc đóng góp dữ liệu theo hướng dẫn trong README.</p>' +
      '<h3 class="mt-2">Các nhóm nội dung của một trang quốc gia</h3>' +
      '<div class="section-grid">' + checklist + '</div></section>' +
      renderSources(meta) +
      '<p class="disclaimer">Trang này chỉ hiển thị dữ liệu đã được nhập vào bộ dữ liệu tĩnh. Việc chưa có dữ liệu không có nghĩa là quốc gia không có hệ thống pháp luật.</p>';
  }

  function renderCountry(meta, payload) {
    var docs = payload.documents || [];
    var cases = payload.cases || [];
    var courts = meta.courts || [];
    var defs = [
      { num: 2, title: 'Hiến pháp', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.kind === 'constitution'; })), allLink: '/search.html?country=' + slug + '&kind=constitution' },
      { num: 3, title: 'Bộ luật', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.kind === 'code'; })), allLink: '/search.html?country=' + slug + '&kind=code' },
      { num: 4, title: 'Đạo luật', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.kind === 'statute'; })), allLink: '/search.html?country=' + slug + '&kind=statute' },
      { num: 5, title: 'Nghị định', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.kind === 'decree'; })), allLink: '/search.html?country=' + slug + '&kind=decree', empty: 'Chưa có nghị định trong bộ dữ liệu hiện tại.' },
      { num: 6, title: 'Thông tư & văn bản dưới luật', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.kind === 'circular' || d.kind === 'regulation'; })), allLink: '/search.html?country=' + slug + '&kind=regulation' },
      { num: 7, title: 'Án lệ', type: 'case', items: cases.filter(function (c) { return c.kind === 'precedent'; }), allLink: '/cases.html?country=' + slug + '&kind=precedent', empty: 'Chưa có án lệ được phân loại trong bộ dữ liệu hiện tại.' },
      { num: 8, title: 'Bản án', type: 'case', items: cases.filter(function (c) { return c.kind === 'judgment'; }), allLink: '/cases.html?country=' + slug + '&kind=judgment', empty: 'Chưa có bản án trong bộ dữ liệu hiện tại.' },
      { num: 9, title: 'Tòa án', type: 'court', items: courts, allLink: '/cases.html?country=' + slug, empty: 'Chưa có thông tin tòa án trong bộ dữ liệu hiện tại.' },
      { num: 10, title: 'Luật thuế', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('tax') !== -1; })), allLink: '/search.html?country=' + slug + '&field=tax' },
      { num: 11, title: 'Luật dân sự', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('civil') !== -1; })), allLink: '/search.html?country=' + slug + '&field=civil' },
      { num: 12, title: 'Luật hình sự', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('criminal') !== -1; })), allLink: '/search.html?country=' + slug + '&field=criminal' },
      { num: 13, title: 'Luật thương mại', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('commercial') !== -1; })), allLink: '/search.html?country=' + slug + '&field=commercial' },
      { num: 14, title: 'Luật lao động', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('labor') !== -1; })), allLink: '/search.html?country=' + slug + '&field=labor' },
      { num: 15, title: 'Luật đất đai', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('land') !== -1; })), allLink: '/search.html?country=' + slug + '&field=land' },
      { num: 16, title: 'Luật doanh nghiệp', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('enterprise') !== -1; })), allLink: '/search.html?country=' + slug + '&field=enterprise' },
      { num: 17, title: 'Sở hữu trí tuệ', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('ip') !== -1; })), allLink: '/search.html?country=' + slug + '&field=ip' },
      { num: 18, title: 'Công nghệ & dữ liệu', type: 'doc', items: sortDocs(docs.filter(function (d) { return d.fields.indexOf('tech') !== -1; })), allLink: '/search.html?country=' + slug + '&field=tech' },
      { num: 19, title: 'Lĩnh vực khác', type: 'doc', items: sortDocs(docs.filter(function (d) {
        var core = ['tax', 'civil', 'criminal', 'commercial', 'labor', 'land', 'enterprise', 'ip', 'tech', 'constitution'];
        return d.fields.some(function (f) { return core.indexOf(f) === -1; });
      })), allLink: '/search.html?country=' + slug + '&type=doc', empty: 'Chưa có văn bản thuộc các lĩnh vực khác trong bộ dữ liệu hiện tại.' }
    ];

    var nav = defs.map(function (def) {
      return '<a href="#muc-' + def.num + '">' + def.num + '. ' + TTL.escapeHtml(def.title) + '</a>';
    }).join('');

    var sections = defs.map(sectionHtml).join('');

    return renderHero(meta) +
      '<nav class="section-nav" aria-label="Mục lục quốc gia">' + nav + '</nav>' +
      sections +
      renderSources(meta) +
      renderTopics(payload.topics) +
      '<p class="disclaimer">Dữ liệu được phân loại tự động từ tiêu đề và nội dung lưu trữ, có thể chưa đầy đủ hoặc chưa chính xác tuyệt đối. ' +
      'Số liệu chỉ phản ánh bộ dữ liệu tĩnh hiện có, không đại diện cho toàn bộ hệ thống pháp luật của ' + TTL.escapeHtml(meta.nameVi) + '. ' +
      'Khi áp dụng thực tế, hãy đối chiếu văn bản gốc tại nguồn chính thức. ' +
      '<a href="' + TTL.url('/data/countries/' + encodeURIComponent(slug) + '.json') + '">Tải dữ liệu quốc gia (JSON)</a>.</p>';
  }

  Promise.all([
    TTL.loadCatalog(),
    TTL.loadJSON('/data/countries/' + encodeURIComponent(slug) + '.json')
  ]).then(function (values) {
    var payload = values[1];
    var meta = payload.country;
    document.title = meta.flag + ' ' + meta.nameVi + ' – Văn bản pháp luật & án lệ | Toàn thư luật pháp 2.1';
    root.innerHTML = meta.hasData ? renderCountry(meta, payload) : renderNoData(meta);
  }).catch(function (error) {
    TTL.showError(root, error);
  });
})();
