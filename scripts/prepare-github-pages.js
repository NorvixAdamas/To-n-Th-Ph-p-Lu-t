#!/usr/bin/env node
/**
 * Chuẩn hoá đường dẫn trong `public/` cho GitHub Pages project site.
 *
 * GitHub Pages phục vụ project site tại `https://<user>.github.io/<repo>/`, nên mọi
 * đường dẫn tuyệt đối kiểu `/css/style.css` sẽ trỏ sai sang gốc tên miền. Script này
 * đổi chúng thành đường dẫn tương đối theo độ sâu thư mục:
 *
 *   public/index.html                    -> css/style.css
 *   public/countries/vietnam/index.html  -> ../../css/style.css
 *
 * Nhờ vậy site chạy được cả ở gốc tên miền (Netlify) và ở thư mục con (GitHub Pages)
 * mà không cần biết trước tên repository. Script idempotent: chạy lại không đổi gì.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  });
  return out;
}

function prefixFor(file) {
  const depth = path.relative(PUBLIC_DIR, path.dirname(file)).split(path.sep).filter(Boolean).length;
  return depth === 0 ? '' : '../'.repeat(depth);
}

function toRelative(url, prefix) {
  if (url.charAt(0) !== '/' || url.charAt(1) === '/') return null;
  const rest = url.slice(1);
  if (rest === '') return prefix === '' ? './' : prefix;
  return prefix + rest;
}

let files = 0;
let attrs = 0;
let scripts = 0;

walk(PUBLIC_DIR, []).forEach(function (file) {
  const source = fs.readFileSync(file, 'utf8');
  const prefix = prefixFor(file);
  let changed = false;

  const next = source
    .replace(/\b(href|src|action)="(\/[^"]*)"/g, function (match, attr, url) {
      const value = toRelative(url, prefix);
      if (value === null) return match;
      attrs += 1;
      changed = true;
      return attr + '="' + value + '"';
    })
    .replace(/location\.replace\('(\/[^']*)'\)/g, function (match, url) {
      const value = toRelative(url, prefix);
      if (value === null) return match;
      scripts += 1;
      changed = true;
      return "location.replace('" + value + "')";
    });

  if (changed) {
    fs.writeFileSync(file, next, 'utf8');
    files += 1;
  }
});

console.log('prepare-github-pages: ' + files + ' file HTML, ' + attrs + ' thuộc tính, ' + scripts + ' redirect.');
