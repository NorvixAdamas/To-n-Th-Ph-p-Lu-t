/* Điều ước quốc tế và tòa án quốc tế */
(function () {
  'use strict';

  var treatiesEl = document.getElementById('treatiesContent');
  var courtsEl = document.getElementById('courtsContent');
  var treatyCount = document.getElementById('treatyCount');
  var courtCount = document.getElementById('courtCount');

  function renderTreaties(data) {
    var list = data.treaties || [];
    if (treatyCount) treatyCount.textContent = list.length + ' điều ước';
    treatiesEl.innerHTML = list.map(function (t) {
      return '<article class="treaty-card" id="' + TTL.escapeHtml(t.id) + '">' +
        '<div class="doc-badges"><span class="badge">' + TTL.escapeHtml(t.place || 'Quốc tế') + '</span>' +
        (t.adopted ? '<span class="badge badge-soft">' + TTL.escapeHtml(t.adopted) + '</span>' : '') + '</div>' +
        '<h3>' + TTL.escapeHtml(t.nameVi) + '</h3>' +
        '<p class="en">' + TTL.escapeHtml(t.nameEn) + '</p>' +
        '<p class="summary">' + TTL.escapeHtml(t.summary) + '</p>' +
        '<div class="meta">' + (t.tags || []).map(function (tag) {
          return '<span class="badge badge-soft">' + TTL.escapeHtml(tag) + '</span> ';
        }).join('') +
        '<a href="' + TTL.escapeHtml(t.sourceUrl) + '" target="_blank" rel="noopener">Nguồn chính thức →</a></div>' +
        '</article>';
    }).join('') || '<p class="empty-state">Chưa có dữ liệu điều ước.</p>';
  }

  function renderCourts(data) {
    var list = data.courts || [];
    if (courtCount) courtCount.textContent = list.length + ' cơ chế tài phán';
    courtsEl.innerHTML = list.map(function (c) {
      return '<article class="treaty-card">' +
        '<div class="doc-badges"><span class="badge badge-case">' + TTL.escapeHtml(c.seat) + '</span></div>' +
        '<h3>' + TTL.escapeHtml(c.nameVi) + '</h3>' +
        '<p class="en">' + TTL.escapeHtml(c.nameEn) + '</p>' +
        '<p class="summary">' + TTL.escapeHtml(c.scope) + '</p>' +
        '<div class="meta"><a href="' + TTL.escapeHtml(c.url) + '" target="_blank" rel="noopener">Trang chính thức →</a></div>' +
        '</article>';
    }).join('') || '<p class="empty-state">Chưa có dữ liệu tòa án.</p>';
  }

  Promise.all([
    TTL.loadJSON('/data/international/treaties.json'),
    TTL.loadJSON('/data/international/courts.json')
  ]).then(function (values) {
    renderTreaties(values[0]);
    renderCourts(values[1]);
  }).catch(function (error) {
    TTL.showError(treatiesEl, error);
    TTL.showError(courtsEl, error);
  });
})();
