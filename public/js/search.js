(function () {
  'use strict';

  var limit = 20;
  var offset = 0;

  function getParams() {
    return {
      q: document.getElementById('q').value.trim(),
      country: document.getElementById('country').value,
      type: document.getElementById('type').value,
      effective2026: document.getElementById('effective2026').checked ? '1' : '',
      tax: document.getElementById('taxOnly').checked ? '1' : '',
      limit: limit,
      offset: offset,
    };
  }

  function renderItem(item) {
    var effective = item.effective_date ? ' Hiệu lực: ' + item.effective_date : '';
    var meta = (item.jurisdiction_name || item.country) + (item.type ? ' · ' + item.type : '') + effective;
    var docUrl = '/document.html?id=' + item.id;
    var q = document.getElementById('q').value.trim();
    if (q) docUrl += '&q=' + encodeURIComponent(q);
    var snippetHtml = item.snippet ? '<div class="result-snippet">' + escapeHtml(item.snippet) + '</div>' : '';
    var sourceLink = item.source_url ? ' <a href="' + escapeHtml(item.source_url) + '" target="_blank" rel="noopener" class="result-source">Xem tại nguồn</a>' : '';
    return (
      '<li class="result-item">' +
      '<a href="' + docUrl + '">' + escapeHtml(item.title || 'Không có tiêu đề') + '</a>' +
      '<div class="result-meta">' + escapeHtml(meta) + sourceLink + '</div>' +
      snippetHtml +
      '</li>'
    );
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function render(results) {
    var el = document.getElementById('results');
    var paginationEl = document.getElementById('pagination');
    if (!results.items || results.items.length === 0) {
      el.innerHTML = '<p class="loading">Không tìm thấy kết quả.</p>';
      paginationEl.innerHTML = '';
      return;
    }
    el.innerHTML = '<ul class="result-list">' + results.items.map(renderItem).join('') + '</ul>';
    var total = results.total || 0;
    var page = Math.floor(offset / limit) + 1;
    var totalPages = Math.ceil(total / limit) || 1;
    var html = '';
    if (page > 1) {
      html += '<button type="button" data-offset="' + (offset - limit) + '">Trước</button>';
    }
    html += '<span> Trang ' + page + ' / ' + totalPages + ' (' + total + ' kết quả) </span>';
    if (offset + results.items.length < total) {
      html += '<button type="button" data-offset="' + (offset + limit) + '">Sau</button>';
    }
    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        offset = parseInt(btn.getAttribute('data-offset'), 10);
        doSearch();
      });
    });
  }

  function doSearch() {
    var el = document.getElementById('results');
    el.innerHTML = '<p class="loading">Đang tải...</p>';
    window.ToanThuLuat.get('/api/search', getParams())
      .then(render)
      .catch(function (err) {
        el.innerHTML = '<p class="error">Lỗi: ' + escapeHtml(err.message) + '</p>';
      });
  }

  document.getElementById('btnSearch').addEventListener('click', function () {
    offset = 0;
    doSearch();
  });
  document.getElementById('q').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      offset = 0;
      doSearch();
    }
  });

  if (window.location.search.indexOf('tax=1') !== -1) {
    document.getElementById('taxOnly').checked = true;
  }
  var params = new URLSearchParams(window.location.search);
  if (params.get('effective2026') === '1') {
    document.getElementById('effective2026').checked = true;
  }
  if (params.get('country')) {
    document.getElementById('country').value = params.get('country');
  }
  if (params.get('type')) {
    document.getElementById('type').value = params.get('type');
  }
  doSearch();
})();
