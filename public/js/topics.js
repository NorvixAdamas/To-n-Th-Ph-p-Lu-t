/* Chủ đề pháp luật — lĩnh vực và 192 chủ đề theo quốc gia */
(function () {
  'use strict';

  var content = document.getElementById('topicsContent');
  var search = document.getElementById('topicSearch');
  var countEl = document.getElementById('topicCount');

  function esc(value) {
    return TTL.escapeHtml(value);
  }

  function render(data) {
    var fields = data.fields || [];
    var countries = data.countries || [];
    var totalTopics = countries.reduce(function (sum, c) { return sum + c.topics.length; }, 0);

    var fieldHtml = fields.filter(function (field) { return field.count > 0; }).map(function (field) {
      var top = (field.countries || []).slice(0, 4);
      return '<a class="topic-field-card" href="' + TTL.url('/search.html?field=' + encodeURIComponent(field.key)) + '">' +
        '<span class="field-count">' + TTL.fmtNumber(field.count) + '</span>' +
        '<strong>' + esc(field.name) + '</strong>' +
        '<span class="topic-field-countries">' + top.map(function (c) {
          return esc(c.nameVi) + ' (' + c.count + ')';
        }).join(' · ') + (field.countries.length > 4 ? ' …' : '') + '</span></a>';
    }).join('');

    var countryHtml = countries.map(function (country) {
      return '<details class="topic-country">' +
        '<summary><span class="flag">' + TTL.flag(country.flag) + '</span> ' + esc(country.nameVi) +
        '<span>· ' + country.topics.length + ' chủ đề · ' + esc(country.regionName) + '</span></summary>' +
        '<ul class="topic-list">' + country.topics.map(function (topic) {
          var url = TTL.url('/search.html?country=' + encodeURIComponent(country.slug) + '&q=' + encodeURIComponent(topic.q));
          if (topic.tax) url += '&field=tax';
          return '<li data-topic="' + esc((topic.name + ' ' + topic.nameEn + ' ' + topic.desc).toLowerCase()) + '">' +
            '<a href="' + url + '"><strong>' + esc(topic.name) + '</strong>' +
            (topic.nameEn ? '<span class="topic-en">' + esc(topic.nameEn) + '</span>' : '') +
            '<span>' + esc(topic.desc) + '</span></a></li>';
        }).join('') + '</ul></details>';
    }).join('');

    content.innerHTML =
      '<section class="section-block mt-0">' +
      '<div class="section-head"><div><div class="eyebrow">Lĩnh vực</div>' +
      '<h2>18 nhóm pháp luật đang có dữ liệu</h2></div>' +
      '<span class="muted small">Số văn bản được gắn thẻ tự động</span></div>' +
      '<div class="topic-field-grid">' + fieldHtml + '</div></section>' +
      '<section class="section-block">' +
      '<div class="section-head"><div><div class="eyebrow">Mục từ theo quốc gia</div>' +
      '<h2>' + TTL.fmtNumber(totalTopics) + ' chủ đề tra cứu</h2></div>' +
      '<span class="muted small">' + countries.length + ' quốc gia có bộ chủ đề</span></div>' +
      '<p class="lead">Mỗi chủ đề là một gợi ý tra cứu đã lọc theo quốc gia. Bấm vào để mở kết quả tương ứng trong thư viện.</p>' +
      '<div id="countryTopicList">' + countryHtml + '</div></section>';

    if (countEl) countEl.textContent = TTL.fmtNumber(totalTopics) + ' chủ đề / ' + countries.length + ' quốc gia';
  }

  if (search) {
    search.addEventListener('input', TTL.debounce(function () {
      var q = TTL.normalize(search.value).trim();
      var shown = 0;
      document.querySelectorAll('#countryTopicList .topic-country').forEach(function (details) {
        var items = details.querySelectorAll('li[data-topic]');
        var visible = 0;
        items.forEach(function (item) {
          var match = !q || TTL.normalize(item.getAttribute('data-topic')).indexOf(q) !== -1;
          item.classList.toggle('hidden', !match);
          if (match) visible += 1;
        });
        details.classList.toggle('hidden', q && visible === 0);
        if (q && visible) details.open = true;
        shown += visible;
      });
      if (countEl) countEl.textContent = q ? ('Tìm thấy ' + shown + ' chủ đề') : (countEl.getAttribute('data-default') || countEl.textContent);
    }, 120));
  }

  TTL.loadJSON('/data/topics.json').then(function (data) {
    render(data);
    if (countEl && !countEl.getAttribute('data-default')) {
      countEl.setAttribute('data-default', countEl.textContent);
    }
  }).catch(function (error) {
    TTL.showError(content, error);
  });
})();
