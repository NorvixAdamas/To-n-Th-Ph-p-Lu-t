/* Trang văn bản — metadata, bản lưu trữ và trình đọc toàn văn 2.1 */
(function () {
  'use strict';

  var root = document.getElementById('content');
  var id = TTL.getParam('id');
  var q = TTL.getParam('q');

  if (!id) {
    root.innerHTML = '<p class="error-state">Thiếu mã văn bản cần xem.</p>';
    return;
  }

  var LICENSE_LABELS = {
    PUBLIC_DOMAIN: 'Public domain',
    OPEN_LICENSE: 'Giấy phép mở',
    ATTRIBUTION_REQUIRED: 'Cần ghi công',
    LINK_ONLY: 'Chỉ liên kết',
    RESTRICTED: 'Hạn chế'
  };

  function info(label, value, missing) {
    return '<div class="info-card"><span class="label">' + TTL.escapeHtml(label) + '</span>' +
      '<span class="value' + (missing ? ' muted' : '') + '">' + TTL.escapeHtml(value || 'Chưa có dữ liệu') + '</span></div>';
  }

  function licenseLabel(value) {
    return LICENSE_LABELS[value] || value || 'Chưa xác định';
  }

  function sourceInfo(doc) {
    var full = doc.fullText;
    if (full && full.source) return full.source;
    if (doc.sourceUrl) {
      return {
        name: TTL.host(doc.sourceUrl) || 'Nguồn chính thức',
        url: doc.sourceUrl,
        license: '',
        licenseNote: ''
      };
    }
    return null;
  }

  function sourceLink(source, label) {
    if (!source || !source.url) return '<span class="muted">Chưa có đường dẫn nguồn chính thức trong bộ dữ liệu.</span>';
    return '<a href="' + TTL.escapeHtml(source.url) + '" target="_blank" rel="noopener">' +
      TTL.escapeHtml(label || 'Mở nguồn chính thức') + ' (' + TTL.escapeHtml(TTL.host(source.url)) + ')</a>';
  }

  function versionBlock(version, index, total) {
    var label = version.effectiveDate ? 'Hiệu lực ' + TTL.fmtDate(version.effectiveDate) : 'Không rõ ngày hiệu lực';
    if (version.repealDate) label += ' · Hết hiệu lực ' + TTL.fmtDate(version.repealDate);
    var body = version.text
      ? '<div class="document-body">' + TTL.highlight(version.text, q) + '</div>'
      : '<p class="doc-note">Bản này chưa có nội dung được lưu. Hãy mở nguồn chính thức.</p>';
    return '<details class="version-block"' + (index === 0 ? ' open' : '') + '>' +
      '<summary>' + TTL.escapeHtml(label) + '<span>Bản ' + (index + 1) + ' / ' + total + '</span></summary>' +
      '<div class="version-body">' + body + '</div></details>';
  }

  function escapeText(value) {
    return TTL.escapeHtml(value);
  }

  function normalizeText(value) {
    return TTL.normalize(value || '');
  }

  function matchesQuery(text, query) {
    if (!query) return true;
    var hay = normalizeText(text);
    var tokens = normalizeText(query).trim().split(/\s+/).filter(Boolean);
    return tokens.every(function (token) { return hay.indexOf(token) !== -1; });
  }

  function paragraphsHtml(text, query) {
    if (!text) return '';
    return String(text)
      .split(/\n{2,}/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean)
      .map(function (paragraph) {
        return '<p class="ft-paragraph">' + TTL.highlight(paragraph, query) + '</p>';
      }).join('');
  }

  function articleText(article) {
    return [article.title, article.content, (article.paragraphs || []).join('\n\n')].filter(Boolean).join('\n\n');
  }

  function chapterText(chapter) {
    return [
      chapter.title,
      chapter.content,
      (chapter.articles || []).map(articleText).join('\n\n')
    ].filter(Boolean).join('\n\n');
  }

  function readerLabel(fullText, key, fallback) {
    return fullText.labels && fullText.labels[key] ? fullText.labels[key] : fallback;
  }

  function renderArticle(article, chapterIndex, articleIndex, query) {
    var articleId = 'ft-article-' + chapterIndex + '-' + articleIndex;
    var title = article.title || article.number || '';
    var content = paragraphsHtml(article.content || (article.paragraphs || []).join('\n\n'), query);
    if (!content) return '';
    return '<div class="ft-article" id="' + articleId + '">' +
      (title ? '<h3 class="ft-article-title">' + TTL.escapeHtml(title) + '</h3>' : '') +
      '<div class="ft-text">' + content + '</div></div>';
  }

  function renderChapter(chapter, index, query) {
    var chapterId = 'ft-chapter-' + index;
    var title = chapter.title || (readerLabel({ labels: {} }, 'chapter', 'Chương') + ' ' + (chapter.number || ''));
    var content = paragraphsHtml(chapter.content || '', query);
    var articles = (chapter.articles || [])
      .map(function (article, articleIndex) {
        if (query && !matchesQuery(articleText(article), query) && !matchesQuery(chapterText(chapter), query)) {
          return '';
        }
        return renderArticle(article, index, articleIndex, query);
      })
      .filter(Boolean)
      .join('');
    if (query && !content && !articles) return '';
    return '<section class="ft-chapter" id="' + chapterId + '">' +
      '<h2 class="ft-chapter-title">' + TTL.escapeHtml(title) + '</h2>' +
      content + articles + '</section>';
  }

  function renderReaderToc(fullText) {
    var chapters = fullText.chapters || [];
    var html = '<div class="reader-toc-head"><strong>Mục lục</strong><span>' + chapters.length + ' mục</span></div>';
    html += '<nav class="reader-toc-list" aria-label="Mục lục toàn văn">';
    if (fullText.preamble) {
      html += '<a href="#ft-preamble" class="toc-chapter">Lời mở đầu</a>';
    }
    chapters.forEach(function (chapter, index) {
      html += '<a class="toc-chapter" href="#ft-chapter-' + index + '">' +
        TTL.escapeHtml(chapter.title || ('Mục ' + (chapter.number || index + 1))) + '</a>';
      if (chapter.articles && chapter.articles.length) {
        html += '<div class="toc-articles">' + chapter.articles.map(function (article, articleIndex) {
          return '<a href="#ft-article-' + index + '-' + articleIndex + '">' +
            TTL.escapeHtml(article.title || article.number || ('Điều ' + (articleIndex + 1))) + '</a>';
        }).join('') + '</div>';
      }
    });
    return html + '</nav>';
  }

  function renderReaderBody(fullText, query) {
    var html = '';
    if (fullText.preamble && (!query || matchesQuery(fullText.preamble, query))) {
      html += '<section class="ft-preamble" id="ft-preamble"><h2 class="ft-chapter-title">Lời mở đầu</h2>' +
        '<div class="ft-text">' + paragraphsHtml(fullText.preamble, query) + '</div></section>';
    }
    html += (fullText.chapters || []).map(function (chapter, index) {
      return renderChapter(chapter, index, query);
    }).join('');
    if (!html) {
      html = '<div class="empty-state"><strong>Không tìm thấy đoạn phù hợp trong toàn văn.</strong>' +
        '<p>Hãy thử từ khóa khác hoặc xóa ô tìm kiếm.</p></div>';
    }
    return html;
  }

  function bindReader(doc) {
    var fullText = doc.fullText;
    if (!fullText || !fullText.available) return;
    var search = document.getElementById('ftSearch');
    var body = document.getElementById('ftBody');
    var toc = document.getElementById('ftToc');
    var count = document.getElementById('ftCount');
    var copy = document.getElementById('ftCopy');
    var print = document.getElementById('ftPrint');
    var download = document.getElementById('ftDownload');
    var top = document.getElementById('ftTop');

    function refresh() {
      var query = search ? search.value.trim() : '';
      body.innerHTML = renderReaderBody(fullText, query);
      toc.innerHTML = renderReaderToc(fullText);
      if (count) {
        var chapters = (fullText.chapters || []).filter(function (chapter) {
          return !query || matchesQuery(chapterText(chapter), query);
        }).length;
        count.textContent = query ? (chapters + ' mục phù hợp') : (fullText.charCount || '').toLocaleString('vi-VN') + ' ký tự';
      }
    }

    if (search) {
      search.value = q || '';
      search.addEventListener('input', TTL.debounce(refresh, 140));
    }
    if (copy) {
      copy.addEventListener('click', function () {
        var text = doc.title + '\n' + sourceInfo(doc)?.url + '\n' + window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copy.textContent = 'Đã sao chép';
            setTimeout(function () { copy.textContent = 'Sao chép liên kết'; }, 1800);
          }).catch(function () {
            copy.textContent = 'Không sao chép được';
          });
        } else {
          window.prompt('Sao chép liên kết:', window.location.href);
        }
      });
    }
    if (print) print.addEventListener('click', function () { window.print(); });
    if (download) {
      download.addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(fullText, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'toan-van-' + doc.id + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    refresh();
  }

  function render(doc) {
    var country = doc.country;
    var latest = doc.versions && doc.versions[0];
    var number = doc.fullText && doc.fullText.officialNumber ? doc.fullText.officialNumber : TTL.docNumber(doc.title);
    var source = sourceInfo(doc);
    var fullText = doc.fullText && doc.fullText.available ? doc.fullText : null;
    var hasFullText = Boolean(fullText);
    var fields = (doc.fieldLabels || []).join(', ');
    var versions = doc.versions || [];
    var versionHtml = versions.length
      ? versions.slice(0, 20).map(function (version, index) {
        return versionBlock(version, index, versions.length);
      }).join('')
      : '<p class="empty-state">Chưa có nội dung hoặc phiên bản nào được lưu cho văn bản này.</p>';
    if (versions.length > 20) {
      versionHtml += '<p class="doc-note">Đang hiển thị 20 / ' + TTL.fmtNumber(versions.length) +
        ' phiên bản gần nhất trong bộ dữ liệu. Bản đầy đủ có trong file JSON của văn bản.</p>';
    }

    if (country) {
      document.title = (hasFullText ? 'Toàn văn: ' : '') + doc.title + ' – ' + country.nameVi + ' | Toàn thư luật pháp 2.1';
    }

    var license = source && source.license ? licenseLabel(source.license) : 'Chưa xác định';
    var sourceLine = sourceLink(source, hasFullText ? 'Mở nguồn toàn văn' : 'Mở nguồn chính thức');
    var readerHtml = hasFullText
      ? '<div class="fulltext-toolbar">' +
          '<div class="fulltext-toolbar-title"><span class="badge badge-fulltext">Toàn văn</span>' +
          '<strong>' + TTL.fmtNumber(fullText.charCount || 0) + ' ký tự</strong></div>' +
          '<label class="ft-search"><span class="sr-only">Tìm trong toàn văn</span>' +
          '<input type="search" id="ftSearch" placeholder="Tìm trong toàn văn…" value="' + TTL.escapeHtml(q || '') + '"></label>' +
          '<span id="ftCount" class="ft-count"></span>' +
          '<button type="button" id="ftTop" class="btn btn-small">Về đầu</button>' +
          '<button type="button" id="ftCopy" class="btn btn-small">Sao chép liên kết</button>' +
          '<button type="button" id="ftPrint" class="btn btn-small">In</button>' +
          '<button type="button" id="ftDownload" class="btn btn-small">Tải JSON</button>' +
        '</div>' +
        '<div class="reader-layout">' +
          '<aside class="reader-toc" id="ftToc"></aside>' +
          '<div class="reader-main"><div id="ftBody"></div></div>' +
          '<aside class="reader-meta">' +
            '<div class="reader-meta-card"><span class="label">Nguồn toàn văn</span>' +
            '<strong>' + TTL.escapeHtml(source.name || '') + '</strong>' +
            '<a href="' + TTL.escapeHtml(source.url) + '" target="_blank" rel="noopener">' + TTL.escapeHtml(TTL.host(source.url)) + ' ↗</a>' +
            '<span class="label mt-1">Giấy phép</span><span>' + TTL.escapeHtml(license) + '</span></div>' +
            '<div class="reader-meta-card"><span class="label">Bản ghi</span>' +
            '<span>' + TTL.escapeHtml(fullText.completeness === 'full' ? 'Toàn văn' : 'Trích lược') + '</span>' +
            '<span class="label mt-1">Ngôn ngữ gốc</span><span>' + TTL.escapeHtml(fullText.language || 'Chưa xác định') + '</span>' +
            '<span class="label mt-1">Truy xuất</span><span>' + TTL.escapeHtml(TTL.fmtDate((source.retrievedAt || '').slice(0, 10))) + '</span></div>' +
            (fullText.notes ? '<p class="doc-note">' + TTL.escapeHtml(fullText.notes) + '</p>' : '') +
          '</aside>' +
        '</div>' +
        '<p class="fulltext-license-note"><strong>Nguồn và giấy phép:</strong> ' + TTL.escapeHtml(source.name || '') +
        ' · ' + TTL.escapeHtml(license) + '. ' + TTL.escapeHtml(source.licenseNote || '') + '</p>'
      : '<div class="fulltext-missing"><strong>Chưa có toàn văn được lưu.</strong>' +
        '<p>Bản ghi này hiện chỉ có metadata và/hoặc tóm tắt. Website không gọi phần tóm tắt là toàn văn và không tự tạo nội dung. ' +
        sourceLink(source, 'Đọc tại nguồn chính thức') + '</p></div>';

    root.innerHTML = '<article class="document-page">' +
      '<div class="breadcrumb"><a href="' + TTL.url('/') + '">Trang chủ</a><span>/</span>' +
      (country ? '<a href="' + TTL.countryHref(country.slug) + '">' + TTL.escapeHtml(country.nameVi) + '</a>' : '<a href="' + TTL.url('/countries.html') + '">Quốc gia</a>') +
      '<span>/</span><span>Văn bản</span></div>' +
      '<div class="doc-head"><div class="eyebrow">' + (country ? country.flag + ' ' + TTL.escapeHtml(country.nameVi) : 'Văn bản pháp luật') +
      ' · ' + TTL.escapeHtml(doc.kindLabel) + '</div>' +
      '<h1>' + TTL.escapeHtml(doc.title) + '</h1>' +
      '<div class="doc-badges"><span class="badge">' + TTL.escapeHtml(doc.typeLabel) + '</span>' +
      '<span class="badge badge-soft">' + TTL.escapeHtml(doc.kindLabel) + '</span>' +
      '<span class="badge badge-status ' + TTL.escapeHtml(doc.status) + '">' + TTL.escapeHtml(doc.statusLabel) + '</span>' +
      '<span class="badge ' + (hasFullText ? 'badge-fulltext' : 'badge-soft') + '">' + (hasFullText ? 'Toàn văn' : 'Chưa có toàn văn') + '</span>' +
      (doc.year ? '<span class="badge badge-soft">' + doc.year + '</span>' : '') +
      (fields ? '<span class="badge badge-soft">' + TTL.escapeHtml(fields) + '</span>' : '') +
      '</div></div>' +
      '<div class="doc-source-line"><strong>Nguồn:</strong> ' + sourceLine + '</div>' +
      '<div class="info-grid">' +
      info('Mã lưu trữ', '#' + doc.id) +
      info('Mã nguồn', doc.sourceId) +
      info('Số hiệu', number) +
      info('Quốc gia', country ? country.nameVi : '') +
      info('Cơ quan ban hành', fullText ? fullText.authority : '') +
      info('Ngày ban hành', fullText ? fullText.issuedDate : '') +
      info('Ngày có hiệu lực', fullText && fullText.effectiveDate ? fullText.effectiveDate : (doc.effectiveDate || '')) +
      info('Ngày hết hiệu lực', doc.repealDate ? TTL.fmtDate(doc.repealDate) : '') +
      info('Tình trạng hiệu lực', doc.statusLabel) +
      info('Lĩnh vực pháp luật', fields) +
      info('Ngôn ngữ', fullText ? fullText.language : '') +
      info('Toàn văn', hasFullText ? 'Có — ' + TTL.fmtNumber(fullText.charCount || 0) + ' ký tự' : 'Chưa có') +
      info('Giấy phép', hasFullText ? license : '') +
      info('Cập nhật dữ liệu', doc.updatedAt ? TTL.fmtDate(doc.updatedAt.slice(0, 10)) : '') +
      '</div>' +
      (hasFullText ? readerHtml : '<section class="doc-content"><h2>Nội dung và phiên bản</h2>' + readerHtml +
        (latest ? '<p class="doc-note">Bản mới nhất trong dữ liệu: ' +
          (latest.effectiveDate ? 'hiệu lực từ ' + TTL.fmtDate(latest.effectiveDate) : 'chưa rõ ngày hiệu lực') +
          (latest.repealDate ? ', hết hiệu lực ' + TTL.fmtDate(latest.repealDate) : '') + '.</p>' : '') +
        '<div class="versions">' + versionHtml + '</div></section>') +
      (hasFullText ? '<section class="doc-content"><h2>Phiên bản lưu trữ</h2>' +
        (latest ? '<p class="doc-note">Bản mới nhất trong dữ liệu: ' +
          (latest.effectiveDate ? 'hiệu lực từ ' + TTL.fmtDate(latest.effectiveDate) : 'chưa rõ ngày hiệu lực') +
          (latest.repealDate ? ', hết hiệu lực ' + TTL.fmtDate(latest.repealDate) : '') + '.</p>' : '') +
        '<div class="versions">' + versionHtml + '</div></section>' : '') +
      ((doc.related || []).length ? '<section class="related"><h2>Văn bản liên quan</h2><ul class="related-list">' +
        doc.related.map(function (item) {
          return '<li><a href="' + TTL.docHref(item.id) + '">' + TTL.escapeHtml(item.title) +
            '<span class="small muted"> · ' + TTL.escapeHtml(item.kindLabel) + (item.year ? ' · ' + item.year : '') + '</span></a></li>';
        }).join('') + '</ul></section>' : '') +
      '<p class="disclaimer">Văn bản có thể đã được sửa đổi, bổ sung hoặc hết hiệu lực sau ngày dữ liệu được cập nhật. ' +
      'Website không cung cấp tư vấn pháp lý. <a href="' + (country ? TTL.countryHref(country.slug) : TTL.url('/countries.html')) + '">Quay lại trang quốc gia</a>.</p>' +
      '</article>';

    if (hasFullText) {
      bindReader(doc);
      if (window.location.hash) {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }
  }

  TTL.loadJSON('/data/docs/' + encodeURIComponent(id) + '.json').then(render).catch(function (error) {
    TTL.showError(root, error);
  });
})();
