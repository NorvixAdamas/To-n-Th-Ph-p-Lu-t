/* Toàn thư luật pháp 2.1 — tiện ích dùng chung, không gọi API */
(function () {
  'use strict';

  var TTL = window.TTL = window.TTL || {};

  TTL.regionNames = {
    asia: 'Châu Á',
    europe: 'Châu Âu',
    africa: 'Châu Phi',
    'north-america': 'Bắc Mỹ',
    'south-america': 'Nam Mỹ',
    oceania: 'Châu Đại Dương',
    'middle-east': 'Trung Đông'
  };

  TTL.fieldNames = {
    tax: 'Luật thuế',
    civil: 'Luật dân sự',
    criminal: 'Luật hình sự',
    commercial: 'Luật thương mại',
    labor: 'Luật lao động',
    land: 'Luật đất đai & nhà ở',
    enterprise: 'Luật doanh nghiệp & đầu tư',
    ip: 'Sở hữu trí tuệ',
    tech: 'Công nghệ & dữ liệu',
    constitution: 'Hiến pháp',
    family: 'Gia đình',
    administrative: 'Hành chính',
    immigration: 'Di trú & quốc tịch',
    environment: 'Môi trường',
    health: 'Y tế',
    education: 'Giáo dục',
    defense: 'Quốc phòng & an ninh',
    other: 'Lĩnh vực khác'
  };

  TTL.statusNames = {
    in_force: 'Còn hiệu lực',
    expired: 'Hết hiệu lực',
    pending: 'Chưa có hiệu lực',
    unknown: 'Chưa rõ',
    decided: 'Đã xét xử'
  };

  TTL.escapeHtml = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  TTL.normalize = function (value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // Gốc của site, suy ra từ chính vị trí js/core.js. GitHub Pages project site chạy tại
  // /<repo>/ nên không thể dùng đường dẫn bắt đầu bằng "/"; mọi href/fetch nội bộ đi qua TTL.url.
  TTL.siteRoot = (function () {
    var script = document.currentScript;
    var src = script && script.src ? script.src : '';
    var marker = src.indexOf('/js/core.js');
    if (marker !== -1) return src.slice(0, marker + 1);
    return new URL('./', document.baseURI).href;
  })();

  TTL.url = function (target) {
    var value = String(target == null ? '' : target);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value;
    return TTL.siteRoot + value.replace(/^\/+/, '');
  };

  TTL.loadJSON = function (url) {
    var target = TTL.url(url);
    return fetch(target, { cache: 'no-cache' }).then(function (response) {
      if (!response.ok) throw new Error('Không tải được ' + target + ' (' + response.status + ')');
      return response.json();
    });
  };

  var catalogPromise = null;
  TTL.loadCatalog = function () {
    if (!catalogPromise) catalogPromise = TTL.loadJSON('/data/catalog.json');
    return catalogPromise;
  };

  TTL.getParam = function (name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  };

  TTL.setParams = function (values) {
    var url = new URL(window.location.href);
    Object.keys(values).forEach(function (key) {
      var value = values[key];
      if (value === '' || value == null || value === '0') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    window.history.replaceState({}, '', url.toString());
  };

  TTL.fmtNumber = function (value) {
    var n = Number(value);
    if (!isFinite(n)) return '0';
    return n.toLocaleString('vi-VN');
  };

  TTL.fmtDate = function (value) {
    if (!value) return 'Chưa có dữ liệu';
    var m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    return String(value);
  };

  TTL.fmtYear = function (value) {
    return value ? String(value) : 'Chưa rõ năm';
  };

  TTL.regionName = function (key) {
    return TTL.regionNames[key] || key || 'Chưa rõ khu vực';
  };

  TTL.fieldName = function (key) {
    return TTL.fieldNames[key] || key || 'Lĩnh vực khác';
  };

  TTL.statusName = function (key) {
    return TTL.statusNames[key] || key || 'Chưa rõ';
  };

  TTL.countryHref = function (slug) {
    return TTL.url('/countries/' + encodeURIComponent(slug) + '/');
  };

  TTL.docHref = function (id) {
    return TTL.url('/document.html?id=' + encodeURIComponent(id));
  };

  TTL.caseHref = function (id) {
    return TTL.url('/case.html?id=' + encodeURIComponent(id));
  };

  TTL.flag = function (value) {
    return value || '🏳️';
  };

  TTL.docNumber = function (title) {
    var m = String(title || '').match(/(?:Luật số|Nghị định|Thông tư|Quyết định|Chỉ thị|số)\s+([0-9][0-9A-Za-z\/\.\-]*)/i);
    return m ? m[1].replace(/[.,;:]$/, '') : '';
  };

  TTL.host = function (url) {
    if (!url) return '';
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  };

  TTL.highlight = function (text, query) {
    var escaped = TTL.escapeHtml(text || '');
    var q = String(query || '').trim();
    if (!q) return escaped;
    var tokens = q.split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!tokens.length) return escaped;
    var pattern = tokens.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|');
    try {
      return escaped.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) {
      return escaped;
    }
  };

  TTL.debounce = function (fn, wait) {
    var timer;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait || 150);
    };
  };

  TTL.showError = function (container, error) {
    if (!container) return;
    container.innerHTML = '<p class="error-state">Không tải được dữ liệu: ' +
      TTL.escapeHtml(error && error.message ? error.message : String(error)) + '</p>';
  };

  TTL.fillCountrySelect = function (select, countries, selected, includeAll) {
    if (!select) return;
    var groups = {};
    countries.forEach(function (c) {
      if (!groups[c.region]) groups[c.region] = [];
      groups[c.region].push(c);
    });
    var html = includeAll ? '<option value="">Tất cả quốc gia</option>' : '';
    Object.keys(groups).forEach(function (region) {
      html += '<optgroup label="' + TTL.escapeHtml(TTL.regionName(region)) + '">';
      groups[region].sort(function (a, b) { return a.nameVi.localeCompare(b.nameVi, 'vi'); }).forEach(function (c) {
        var value = c.slug || c.code;
        var selectedAttr = value === selected || c.code === selected ? ' selected' : '';
        html += '<option value="' + TTL.escapeHtml(value) + '"' + selectedAttr + '>' +
          TTL.escapeHtml(c.flag + ' ' + c.nameVi) + '</option>';
      });
      html += '</optgroup>';
    });
    select.innerHTML = html;
  };

  TTL.renderPager = function (container, page, totalPages, onPage) {
    if (!container) return;
    if (!totalPages || totalPages <= 1) {
      container.innerHTML = totalPages === 1 ? '<span class="page-info">Trang 1 / 1</span>' : '';
      return;
    }
    var html = '<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>← Trước</button>';
    var start = Math.max(1, page - 2);
    var end = Math.min(totalPages, page + 2);
    if (start > 1) {
      html += '<button type="button" data-page="1">1</button>';
      if (start > 2) html += '<span class="muted">…</span>';
    }
    for (var i = start; i <= end; i += 1) {
      html += '<button type="button" data-page="' + i + '"' + (i === page ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    if (end < totalPages) {
      if (end < totalPages - 1) html += '<span class="muted">…</span>';
      html += '<button type="button" data-page="' + totalPages + '">' + totalPages + '</button>';
    }
    html += '<button type="button" data-page="' + (page + 1) + '"' + (page >= totalPages ? ' disabled' : '') + '>Sau →</button>';
    html += '<span class="page-info">Trang ' + page + ' / ' + totalPages + '</span>';
    container.innerHTML = html;
    container.querySelectorAll('button[data-page]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = Number(button.getAttribute('data-page'));
        if (next >= 1 && next <= totalPages && next !== page) onPage(next);
      });
    });
  };

  // Tương thích ngược cho trang cũ (nếu còn được mở).
  window.ToanThuLuat = TTL;
})();
