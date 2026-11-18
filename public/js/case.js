/* Trang vụ án — đọc /data/cases/<id>.json */
(function () {
  'use strict';

  var root = document.getElementById('content');
  var id = TTL.getParam('id');

  if (!id) {
    root.innerHTML = '<p class="error-state">Thiếu mã vụ án cần xem.</p>';
    return;
  }

  function info(label, value) {
    return '<div class="info-card"><span class="label">' + TTL.escapeHtml(label) + '</span>' +
      '<span class="value' + (value ? '' : ' muted') + '">' + TTL.escapeHtml(value || 'Chưa có dữ liệu') + '</span></div>';
  }

  function render(item) {
    var country = item.country;
    var fields = (item.fieldLabels || []).join(', ');
    if (country) {
      document.title = item.name + ' – ' + country.nameVi + ' | Toàn thư luật pháp 2.1';
    }
    var related = item.related || [];
    var source = item.sourceUrl
      ? '<a href="' + TTL.escapeHtml(item.sourceUrl) + '" target="_blank" rel="noopener">Mở bản án / nguồn chính thức (' +
        TTL.escapeHtml(TTL.host(item.sourceUrl)) + ')</a>'
      : '<span class="muted">Chưa có đường dẫn nguồn trong bộ dữ liệu.</span>';

    root.innerHTML = '<article class="document-page">' +
      '<div class="breadcrumb"><a href="' + TTL.url('/') + '">Trang chủ</a><span>/</span>' +
      (country ? '<a href="' + TTL.countryHref(country.slug) + '">' + TTL.escapeHtml(country.nameVi) + '</a>' : '<a href="' + TTL.url('/countries.html') + '">Quốc gia</a>') +
      '<span>/</span><a href="' + TTL.url('/cases.html' + (country ? '?country=' + encodeURIComponent(country.slug) : '')) + '">Án lệ</a><span>/</span><span>Vụ án</span></div>' +
      '<div class="doc-head"><div class="eyebrow">' + (country ? country.flag + ' ' + TTL.escapeHtml(country.nameVi) : 'Vụ án') +
      ' · ' + TTL.escapeHtml(item.kindLabel) + '</div>' +
      '<h1>' + TTL.escapeHtml(item.name) + '</h1>' +
      '<div class="doc-badges"><span class="badge badge-case">' + TTL.escapeHtml(item.kindLabel) + '</span>' +
      (item.year ? '<span class="badge badge-soft">' + item.year + '</span>' : '') +
      (fields ? '<span class="badge badge-soft">' + TTL.escapeHtml(fields) + '</span>' : '') + '</div></div>' +
      '<div class="doc-source-line"><strong>Nguồn:</strong> ' + source + '</div>' +
      '<div class="info-grid">' +
      info('Mã lưu trữ', '#' + item.id) +
      info('Mã nguồn', item.sourceId) +
      info('Tên vụ án', item.name) +
      info('Số vụ án', item.docket) +
      info('Quốc gia', country ? country.nameVi : '') +
      info('Tòa án', item.court) +
      info('Ngày xét xử', item.dateDecided ? TTL.fmtDate(item.dateDecided) : '') +
      info('Lĩnh vực pháp luật', fields) +
      info('Ngôn ngữ', '') +
      info('Cập nhật dữ liệu', item.updatedAt ? TTL.fmtDate(item.updatedAt.slice(0, 10)) : '') +
      '</div>' +
      '<section class="doc-content"><h2>Tóm tắt vụ án</h2>' +
      '<p class="doc-note">Phần dưới là nội dung tóm tắt được lưu trong bộ dữ liệu, không phải toàn văn bản án. ' +
      'Bản án gốc có thể dài hơn và chứa các lập luận đầy đủ.</p>' +
      '<div class="case-summary">' + TTL.escapeHtml(item.summary || 'Chưa có nội dung tóm tắt.') + '</div></section>' +
      '<section class="case-missing"><strong>Vấn đề pháp lý:</strong> Chưa có dữ liệu riêng trong bộ dữ liệu.' +
      '<strong>Quyết định của tòa:</strong> Chưa có dữ liệu riêng trong bộ dữ liệu.' +
      '<strong>Căn cứ pháp luật:</strong> Chưa có dữ liệu riêng trong bộ dữ liệu.' +
      '<strong>Văn bản liên quan:</strong> Chưa có liên kết được xác minh trong bộ dữ liệu.</section>' +
      (related.length ? '<section class="related"><h2>Các vụ án liên quan</h2><ul class="related-list">' +
        related.map(function (r) {
          return '<li><a href="' + TTL.caseHref(r.id) + '">' + TTL.escapeHtml(r.name) +
            '<span class="small muted"> · ' + TTL.escapeHtml(r.court || '') + (r.year ? ' · ' + r.year : '') + '</span></a></li>';
        }).join('') + '</ul></section>' : '') +
      '<p class="disclaimer">Tóm tắt có thể không phản ánh đầy đủ nội dung bản án và không thay thế việc đọc bản gốc. ' +
      '<a href="' + TTL.url('/cases.html' + (country ? '?country=' + encodeURIComponent(country.slug) : '')) + '">Xem thêm án lệ</a>.</p>' +
      '</article>';
  }

  TTL.loadJSON('/data/cases/' + encodeURIComponent(id) + '.json').then(render).catch(function (error) {
    TTL.showError(root, error);
  });
})();
