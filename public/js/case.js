(function () {
  'use strict';

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  var id = getParam('id');
  if (!id) {
    document.getElementById('content').innerHTML = '<p class="error">Thiếu id bản án.</p>';
    return;
  }

  window.ToanThuLuat.get('/api/cases/' + id)
    .then(function (c) {
      var html = '<article class="document-detail">';
      html += '<h1>' + escapeHtml(c.case_name || 'Không có tên') + '</h1>';
      html += '<div class="document-meta">';
      html += escapeHtml(c.court || '') + (c.docket_number ? ' · Số ' + escapeHtml(c.docket_number) : '');
      if (c.date_decided) html += ' · Ngày ' + escapeHtml(c.date_decided);
      if (c.source_url) html += ' · <a href="' + escapeHtml(c.source_url) + '" target="_blank" rel="noopener">Xem tại nguồn</a>';
      html += '</div>';
      html += '<div class="document-body">' + escapeHtml(c.opinion_text || 'Chưa có nội dung.') + '</div>';
      html += '</article>';
      document.getElementById('content').innerHTML = html;
    })
    .catch(function (err) {
      document.getElementById('content').innerHTML = '<p class="error">Không tìm thấy bản án hoặc lỗi: ' + escapeHtml(err.message) + '</p>';
    });
})();
