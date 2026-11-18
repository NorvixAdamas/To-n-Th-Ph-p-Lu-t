/* Báo cáo độ phủ dữ liệu — 195 quốc gia */
(function () {
  'use strict';

  var statsEl = document.getElementById('coverageStats');
  var tableEl = document.getElementById('coverageTable');
  var countEl = document.getElementById('coverageCount');
  var statusFilter = document.getElementById('coverageStatus');
  var regionFilter = document.getElementById('coverageRegion');
  var search = document.getElementById('coverageSearch');
  var download = document.getElementById('downloadCsv');
  var catalog = null;

  function esc(value) {
    return TTL.escapeHtml(value);
  }

  function filtered() {
    var status = statusFilter.value;
    var region = regionFilter.value;
    var q = TTL.normalize(search.value).trim();
    return catalog.countries.filter(function (c) {
      if (status === 'with' && !c.hasData) return false;
      if (status === 'without' && c.hasData) return false;
      if (status === 'fulltext' && !(c.fullTextDocuments > 0)) return false;
      if (region && c.region !== region) return false;
      if (q && TTL.normalize(c.nameVi + ' ' + c.nameEn + ' ' + c.code).indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) {
      return a.nameVi.localeCompare(b.nameVi, 'vi');
    });
  }

  function renderStats() {
    var s = catalog.stats;
    var without = s.countries - s.withData;
    statsEl.innerHTML =
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(s.countries) + '</span><span class="stat-label">quốc gia trong danh mục</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(s.withData) + '</span><span class="stat-label">có dữ liệu</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(without) + '</span><span class="stat-label">chưa có dữ liệu</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(s.documents) + '</span><span class="stat-label">văn bản</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(s.cases) + '</span><span class="stat-label">án lệ / bản án</span></div>' +
      '<div class="stat-card"><span class="stat-value">' + TTL.fmtNumber(s.fullTextDocuments || 0) + '</span><span class="stat-label">văn bản toàn văn</span></div>';
  }

  function renderTable() {
    var list = filtered();
    countEl.innerHTML = '<strong>' + list.length + '</strong> quốc gia được hiển thị · ' +
      '<strong>' + list.filter(function (c) { return c.hasData; }).length + '</strong> có dữ liệu · ' +
      '<strong>' + list.filter(function (c) { return c.fullTextDocuments > 0; }).length + '</strong> có toàn văn';
    tableEl.innerHTML = '<thead><tr><th>Quốc gia</th><th>Khu vực</th><th class="num">Văn bản</th>' +
      '<th class="num">Vụ án</th><th class="num">Toàn văn</th><th>Trạng thái</th></tr></thead><tbody>' +
      list.map(function (c) {
        return '<tr><td><a href="' + TTL.countryHref(c.slug) + '">' + TTL.flag(c.flag) + ' ' + esc(c.nameVi) + '</a>' +
          '<div class="small muted">' + esc(c.nameEn) + ' · ' + esc(c.code) + '</div></td>' +
          '<td>' + esc(c.regionName) + '</td>' +
          '<td class="num">' + TTL.fmtNumber(c.documents) + '</td>' +
          '<td class="num">' + TTL.fmtNumber(c.cases) + '</td>' +
          '<td class="num">' + (c.fullTextDocuments ? '<span class="badge badge-fulltext">' + TTL.fmtNumber(c.fullTextDocuments) + '</span>' : '0') + '</td>' +
          '<td><span class="coverage-pill ' + (c.hasData ? '' : 'no-data') + '">' +
          (c.hasData ? 'Có dữ liệu' : 'Chưa có dữ liệu') + '</span></td></tr>';
      }).join('') + '</tbody>';
    if (!list.length) {
      tableEl.innerHTML = '<tbody><tr><td colspan="6"><p class="empty-state">Không có quốc gia phù hợp bộ lọc.</p></td></tr></tbody>';
    }
  }

  function exportCsv() {
    var list = filtered();
    var lines = [['Mã ISO', 'Quốc gia', 'Tên tiếng Anh', 'Khu vực', 'Văn bản', 'Vụ án', 'Văn bản toàn văn', 'Có dữ liệu']];
    list.forEach(function (c) {
      lines.push([c.code, c.nameVi, c.nameEn, c.regionName, c.documents, c.cases, c.fullTextDocuments || 0, c.hasData ? 'Có' : 'Chưa có']);
    });
    var csv = lines.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'toan-thu-luat-phap-do-phu-du-lieu.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  TTL.loadCatalog().then(function (data) {
    catalog = data;
    renderStats();
    statusFilter.addEventListener('change', renderTable);
    search.addEventListener('input', TTL.debounce(renderTable, 120));
    regionFilter.innerHTML = '<option value="">Tất cả khu vực</option>' + data.regions.map(function (r) {
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join('');
    regionFilter.addEventListener('change', renderTable);
    download.addEventListener('click', exportCsv);
    renderTable();
  }).catch(function (error) {
    TTL.showError(statsEl, error);
    if (countEl) countEl.textContent = '';
  });
})();
