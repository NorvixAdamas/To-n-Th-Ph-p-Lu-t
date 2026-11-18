#!/usr/bin/env node
/**
 * Import / validate full-text sources for Toàn thư luật pháp 2.1.
 *
 * Usage:
 *   node scripts/import-fulltext.js --archives
 *   node scripts/import-fulltext.js --validate
 *
 * Full-text files live in scripts/data/fulltext/<document-id>.json and are
 * merged into public/data/docs/<id>.json by scripts/build-static.js.
 *
 * Only public-domain or explicitly licensed texts may be stored. A source with
 * license LINK_ONLY or RESTRICTED must not be copied into this directory.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'data', 'fulltext');
const TODAY = new Date().toISOString().slice(0, 10);
const ALLOWED_LICENSES = new Set([
  'PUBLIC_DOMAIN',
  'OPEN_LICENSE',
  'ATTRIBUTION_REQUIRED'
]);
const LINK_ONLY_LICENSES = new Set(['LINK_ONLY', 'RESTRICTED']);

const ARCHIVES_SOURCES = [
  {
    id: 2,
    countryCode: 'US',
    title: 'Bill of Rights – 10 Tu chính án đầu tiên',
    officialNumber: '',
    language: 'en',
    issuedDate: '1789-09-25',
    effectiveDate: '1791-12-15',
    legalStatus: 'in_force',
    authority: 'First Congress of the United States',
    url: 'https://www.archives.gov/founding-docs/bill-of-rights-transcript',
    license: 'PUBLIC_DOMAIN',
    licenseNote: 'U.S. federal government transcription; public domain in the United States.',
    labels: { chapter: 'Amendment', article: 'Amendment' },
    kind: 'bill-of-rights'
  },
  {
    id: 222,
    countryCode: 'US',
    title: 'Constitution of the United States (Hiến pháp Hoa Kỳ)',
    officialNumber: '',
    language: 'en',
    issuedDate: '1787-09-17',
    effectiveDate: '1789-03-04',
    legalStatus: 'in_force',
    authority: 'Constitutional Convention of the United States',
    url: 'https://www.archives.gov/founding-docs/constitution-transcript',
    license: 'PUBLIC_DOMAIN',
    licenseNote: 'U.S. federal government transcription; public domain in the United States.',
    labels: { chapter: 'Article', article: 'Section' },
    kind: 'constitution'
  }
];

function clean(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function paragraphsFrom(nodes, $) {
  return nodes
    .map((node) => clean($(node).text()))
    .filter(Boolean)
    .filter((text) => !/^print this page$/i.test(text))
    .join('\n\n');
}

function romanFrom(text) {
  const m = String(text || '').match(/\b([IVXLCDM]+)\b/i);
  return m ? m[1].toUpperCase() : '';
}

function validateSource(source, file) {
  const errors = [];
  if (!source || typeof source !== 'object') errors.push('JSON gốc không phải object');
  const id = Number(source.documentId);
  if (!Number.isInteger(id) || id <= 0) errors.push('documentId phải là số nguyên dương');
  if (!source.countryCode) errors.push('thiếu countryCode');
  if (!source.source || !source.source.url) errors.push('thiếu source.url');
  if (!source.source || !source.source.name) errors.push('thiếu source.name');
  if (!source.source || !source.source.license) errors.push('thiếu source.license');
  if (source.source && LINK_ONLY_LICENSES.has(source.source.license)) {
    errors.push('license ' + source.source.license + ' không được phép lưu toàn văn');
  }
  if (source.source && !ALLOWED_LICENSES.has(source.source.license)) {
    errors.push('license không nằm trong danh sách cho phép');
  }
  if (!Array.isArray(source.chapters) || source.chapters.length === 0) {
    errors.push('chapters phải là mảng không rỗng');
  }
  if (source.completeness !== 'full') errors.push('completeness phải là "full" đối với bản lưu toàn văn');
  const chars = flattenText(source).length;
  if (chars < 500) errors.push('nội dung quá ngắn (' + chars + ' ký tự) để coi là toàn văn');
  if (errors.length) {
    throw new Error((file ? file + ': ' : '') + errors.join('; '));
  }
  return { id, chars };
}

function flattenText(source) {
  const parts = [];
  if (source.preamble) parts.push(source.preamble);
  (source.chapters || []).forEach((chapter) => {
    if (chapter.title) parts.push(chapter.title);
    if (chapter.content) parts.push(chapter.content);
    (chapter.articles || []).forEach((article) => {
      if (article.title) parts.push(article.title);
      if (article.content) parts.push(article.content);
      (article.paragraphs || []).forEach((paragraph) => parts.push(paragraph));
    });
  });
  return parts.filter(Boolean).join('\n\n');
}

async function fetchArchives(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'ToanThuLuat/2.1 full-text importer (research; static library)' }
  });
  if (!response.ok) throw new Error('HTTP ' + response.status + ' khi tải ' + url);
  return response.text();
}

function contentRoot($) {
  const root = $('#block-system-main, .block-system-main, .main-col .region-content').first();
  if (!root.length) throw new Error('Không tìm thấy container transcript trên trang Archives');
  return root;
}

function parseBillOfRights(html, meta) {
  const $ = cheerio.load(html);
  const root = contentRoot($);
  const headings = root.find('h3').filter((i, el) => /^Amendment\s+[IVXLCDM]+$/i.test(clean($(el).text())));
  if (!headings.length) throw new Error('Không tìm thấy 10 tu chính án trên trang Bill of Rights');

  const chapters = [];
  headings.each((i, heading) => {
    const title = clean($(heading).text());
    const number = romanFrom(title);
    const nodes = [];
    let next = $(heading).next();
    while (next.length && !next.is('h2') && !next.is('h3')) {
      if (next.is('p')) {
        const text = clean(next.text());
        if (/^(Amendments?\s+11|Note:\s+The capitalization|Back to Main)/i.test(text)) break;
        nodes.push(next);
      }
      next = next.next();
    }
    const content = paragraphsFrom(nodes, $);
    if (content) chapters.push({ number, title, content });
  });
  if (chapters.length < 10) throw new Error('Chỉ lấy được ' + chapters.length + ' tu chính án');

  return {
    documentId: meta.id,
    countryCode: meta.countryCode,
    schemaVersion: '2.1',
    title: meta.title,
    officialNumber: meta.officialNumber,
    language: meta.language,
    issuedDate: meta.issuedDate,
    effectiveDate: meta.effectiveDate,
    legalStatus: meta.legalStatus,
    authority: meta.authority,
    completeness: 'full',
    source: {
      name: 'U.S. National Archives and Records Administration',
      url: meta.url,
      license: meta.license,
      licenseNote: meta.licenseNote,
      retrievedAt: TODAY
    },
    labels: meta.labels,
    notes: 'Bản ghi nguyên văn 10 tu chính án đầu tiên; chính tả và dấu câu theo bản transcription của National Archives.',
    chapters
  };
}

function parseConstitution(html, meta) {
  const $ = cheerio.load(html);
  const root = contentRoot($);
  const articleHeadings = root.find('h2').filter((i, el) => /^Article\.?\s+[IVXLCDM]+\.?$/i.test(clean($(el).text())));
  if (!articleHeadings.length) throw new Error('Không tìm thấy các Article trên trang Constitution');

  const preambleNode = root.find('p').filter((i, el) => /We the People/i.test($(el).text())).first();
  const preamble = preambleNode.length ? clean(preambleNode.text()) : '';
  const chapters = [];

  articleHeadings.each((i, heading) => {
    const headingText = clean($(heading).text());
    const number = romanFrom(headingText);
    const chapter = { number, title: 'Article ' + number, articles: [] };
    const chapterParagraphs = [];
    let currentSection = null;
    let next = $(heading).next();
    while (next.length && !next.is('h2')) {
      if (next.is('h3')) {
        const sectionText = clean(next.text());
        currentSection = { number: sectionText.replace(/\.$/, ''), title: sectionText, paragraphs: [] };
        chapter.articles.push(currentSection);
      } else if (next.is('p')) {
        const text = clean(next.text());
        if (/^Attest William Jackson/i.test(text) || /^done in Convention/i.test(text)) break;
        if (text) {
          if (currentSection) currentSection.paragraphs.push(text);
          else chapterParagraphs.push(text);
        }
      }
      next = next.next();
    }
    chapter.articles = chapter.articles
      .map((section) => ({
        number: section.number,
        title: section.title,
        content: section.paragraphs.join('\n\n')
      }))
      .filter((section) => section.content);
    if (chapterParagraphs.length) chapter.content = chapterParagraphs.join('\n\n');
    if (chapter.articles.length || chapter.content) chapters.push(chapter);
  });
  if (chapters.length < 7) throw new Error('Chỉ lấy được ' + chapters.length + ' Article');

  return {
    documentId: meta.id,
    countryCode: meta.countryCode,
    schemaVersion: '2.1',
    title: meta.title,
    officialNumber: meta.officialNumber,
    language: meta.language,
    issuedDate: meta.issuedDate,
    effectiveDate: meta.effectiveDate,
    legalStatus: meta.legalStatus,
    authority: meta.authority,
    completeness: 'full',
    source: {
      name: 'U.S. National Archives and Records Administration',
      url: meta.url,
      license: meta.license,
      licenseNote: meta.licenseNote,
      retrievedAt: TODAY
    },
    labels: meta.labels,
    notes: 'Bản ghi nguyên văn Hiến pháp Hoa Kỳ, không gồm 27 tu chính án (được lưu riêng ở văn bản Bill of Rights và các nguồn bổ sung).',
    preamble,
    chapters
  };
}

async function importArchives() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const meta of ARCHIVES_SOURCES) {
    const html = await fetchArchives(meta.url);
    const source = meta.kind === 'bill-of-rights'
      ? parseBillOfRights(html, meta)
      : parseConstitution(html, meta);
    const info = validateSource(source);
    const file = path.join(OUT_DIR, String(meta.id) + '.json');
    fs.writeFileSync(file, JSON.stringify(source, null, 1) + '\n');
    console.log('WROTE', file, '-', info.chars, 'chars,', source.chapters.length, 'chapters');
  }
}

function readSources() {
  if (!fs.existsSync(OUT_DIR)) return [];
  return fs.readdirSync(OUT_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const file = path.join(OUT_DIR, name);
      const source = JSON.parse(fs.readFileSync(file, 'utf8'));
      const info = validateSource(source, name);
      return { name, file, source, info };
    });
}

function validateAll() {
  const sources = readSources();
  const seen = new Set();
  for (const item of sources) {
    if (seen.has(item.info.id)) throw new Error('Trùng documentId: ' + item.info.id);
    seen.add(item.info.id);
  }
  const total = sources.reduce((sum, item) => sum + item.info.chars, 0);
  console.log('FULLTEXT OK:', sources.length, 'file(s),', total, 'chars');
  sources.forEach((item) => console.log(' -', item.info.id, item.source.countryCode, item.info.chars, 'chars', item.source.source.license, item.source.source.url));
  return sources;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--archives')) {
    await importArchives();
    validateAll();
    return;
  }
  if (args.includes('--validate')) {
    validateAll();
    return;
  }
  console.log('Usage: node scripts/import-fulltext.js --archives | --validate');
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error('FULLTEXT ERROR:', error.message);
    process.exit(1);
  });
}

module.exports = { flattenText, validateSource, readSources };
