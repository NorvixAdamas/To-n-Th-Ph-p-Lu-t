(function () {
  'use strict';

  const API_BASE = '/api';

  window.ToanThuLuat = {
    get: function (path, params) {
      const url = new URL(path, window.location.origin);
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
  };
})();
