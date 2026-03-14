(function () {
  'use strict';

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeRegex(s) {
    if (!s) return '';
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  var id = getParam('id');
  if (!id) {
    document.getElementById('content').innerHTML = '<p class="error">Thiếu id văn bản.</p>';
    return;
  }

  var q = getParam('q');

  window.ToanThuLuat.get('/api/documents/' + id)
    .then(function (doc) {
      var html = '<article class="document-detail">';
      html += '<h1>' + escapeHtml(doc.title || 'Không có tiêu đề') + '</h1>';
      html += '<div class="document-meta">';
      html += escapeHtml(doc.jurisdiction_name || doc.country || '') + ' · ' + escapeHtml(doc.type || '');
      html += '</div>';
      if (doc.source_url) {
        html += '<p class="document-source"><strong>Văn bản gốc:</strong> <a href="' + escapeHtml(doc.source_url) + '" target="_blank" rel="noopener">Xem tại nguồn chính thức</a></p>';
      }
      var version = doc.versions && doc.versions[0];
      if (version) {
        html += '<p class="document-dates">';
        if (version.effective_date) html += '<strong>Hiệu lực từ:</strong> ' + escapeHtml(version.effective_date) + ' ';
        if (version.repeal_date) html += '<strong>Hết hiệu lực:</strong> ' + escapeHtml(version.repeal_date);
        html += '</p>';
        if (doc.source_url) {
          html += '<p class="document-disclaimer">Nội dung dưới đây chỉ mang tính tham khảo. Để chắc chắn chính xác, hãy đối chiếu với văn bản gốc tại <a href="' + escapeHtml(doc.source_url) + '" target="_blank" rel="noopener">nguồn chính thức</a>.</p>';
        }
        var body = version.html || version.raw_text || '';
        if (!version.html && body && q) {
          var re = new RegExp('(' + escapeRegex(q) + ')', 'gi');
          body = escapeHtml(body).replace(re, '<mark>$1</mark>');
        } else if (!version.html) {
          body = escapeHtml(body);
        }
        html += '<div class="document-body">' + body + '</div>';
      } else {
        html += '<p class="loading">Chưa có nội dung.</p>';
      }
      html += '</article>';
      document.getElementById('content').innerHTML = html;
    })
    .catch(function (err) {
      document.getElementById('content').innerHTML = '<p class="error">Không tìm thấy văn bản hoặc lỗi: ' + escapeHtml(err.message) + '</p>';
    });
})();
