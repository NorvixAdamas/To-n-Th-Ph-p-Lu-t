(function () {
  'use strict';

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var countryNames = {
    VN: 'Việt Nam',
    US: 'Hoa Kỳ',
    UK: 'Anh Quốc',
    FR: 'Pháp',
    SG: 'Singapore',
    DE: 'Đức',
    JP: 'Nhật Bản',
    AU: 'Úc',
    CN: 'Trung Quốc',
    CA: 'Canada',
    KR: 'Hàn Quốc',
    IN: 'Ấn Độ',
    CH: 'Thụy Sĩ'
  };

  window.ToanThuLuat = {
    get: function (path, params) {
      var url = new URL(path, window.location.origin);
      if (params) {
        Object.keys(params).forEach(function (k) {
          if (params[k] !== '' && params[k] != null) url.searchParams.set(k, params[k]);
        });
      }
      return fetch(url.toString()).then(function (r) {
        if (!r.ok) throw new Error(r.statusText || 'Request failed');
        return r.json();
      });
    },
    escapeHtml: escapeHtml,
    getCountryName: function (code) {
      return countryNames[code] || code || 'Chưa rõ quốc gia';
    }
  };
})();
