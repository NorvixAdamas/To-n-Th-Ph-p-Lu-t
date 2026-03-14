/**
 * Sync US federal regulations from eCFR (Electronic Code of Federal Regulations).
 * API: https://www.ecfr.gov/api/
 * NO API key required — completely open and free.
 *
 * Uses the search API to find regulation sections by title.
 */
const axios = require('axios');
const db = require('./db-adapter');

const TITLES_URL = 'https://www.ecfr.gov/api/versioner/v1/titles';
const SEARCH_URL = 'https://www.ecfr.gov/api/search/v1/results';
const DELAY_MS = 1000;
const USER_AGENT = 'ToanThuLuat/1.0 (Legal reference; +https://github.com/toanthuluat)';

const IMPORTANT_TITLES = [
  { num: 5, name: 'Administrative Personnel', q: 'administrative personnel' },
  { num: 7, name: 'Agriculture', q: 'agriculture' },
  { num: 8, name: 'Aliens and Nationality', q: 'aliens nationality immigration' },
  { num: 10, name: 'Energy', q: 'energy nuclear' },
  { num: 12, name: 'Banks and Banking', q: 'banking financial' },
  { num: 14, name: 'Aeronautics and Space', q: 'aeronautics aviation' },
  { num: 15, name: 'Commerce and Foreign Trade', q: 'commerce trade' },
  { num: 16, name: 'Commercial Practices (FTC)', q: 'commercial practices consumer' },
  { num: 17, name: 'Commodity and Securities Exchanges', q: 'securities commodity exchange' },
  { num: 20, name: 'Employees Benefits', q: 'employee benefits pension' },
  { num: 21, name: 'Food and Drugs (FDA)', q: 'food drug cosmetic' },
  { num: 22, name: 'Foreign Relations', q: 'foreign relations' },
  { num: 24, name: 'Housing and Urban Development', q: 'housing urban development' },
  { num: 26, name: 'Internal Revenue (IRS)', q: 'income tax revenue' },
  { num: 28, name: 'Judicial Administration (DOJ)', q: 'judicial administration' },
  { num: 29, name: 'Labor (DOL)', q: 'labor employment wage' },
  { num: 33, name: 'Navigation and Navigable Waters', q: 'navigation waters' },
  { num: 34, name: 'Education', q: 'education' },
  { num: 37, name: 'Patents, Trademarks, and Copyrights', q: 'patent trademark copyright' },
  { num: 38, name: 'Pensions, Bonuses, and Veterans', q: 'veterans pensions' },
  { num: 40, name: 'Protection of Environment (EPA)', q: 'environment protection' },
  { num: 42, name: 'Public Health', q: 'public health' },
  { num: 45, name: 'Public Welfare', q: 'public welfare' },
  { num: 47, name: 'Telecommunication (FCC)', q: 'telecommunication' },
  { num: 48, name: 'Federal Acquisition Regulations', q: 'acquisition procurement' },
  { num: 49, name: 'Transportation (DOT)', q: 'transportation' },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function detectTaxonomy(titleNum, text) {
  if (titleNum === 26 || /revenue|tax|irs/i.test(text)) return ['thue'];
  return [];
}

async function fetchTitleInfo() {
  try {
    const res = await axios.get(TITLES_URL, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
    });
    return res.data?.titles || [];
  } catch (e) {
    console.log('eCFR titles fetch error:', e.message);
    return [];
  }
}

async function searchTitle(query, page, perPage) {
  const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 20000,
    });
    return res.data;
  } catch (e) {
    if (e.response?.status !== 404) {
      console.log(`  eCFR search error:`, e.response?.status || '', e.message);
    }
    return null;
  }
}

async function syncTitle(titleNum, titleName, searchQuery, titleMeta, jurisdictionId, maxItems, onProgress) {
  let imported = 0;
  let page = 1;
  const perPage = 20;

  while (imported < maxItems) {
    const data = await searchTitle(searchQuery, page, perPage);
    if (!data || !data.results || data.results.length === 0) break;

    for (const item of data.results) {
      if (imported >= maxItems) break;

      const hierarchy = item.hierarchy || {};
      const headings = item.hierarchy_headings || {};
      const section = hierarchy.section || hierarchy.part || `item-${imported}`;
      const sourceId = `ecfr-${titleNum}-${(hierarchy.part || 'p0')}-${section}`.replace(/[^a-zA-Z0-9-_.]/g, '');

      const sectionHeading = headings.section || headings.part || '';
      const partHeading = headings.part || '';
      const subpartHeading = headings.subpart || '';
      const title = `${titleNum} CFR ${sectionHeading || section}`.trim();

      const sourceUrl = `https://www.ecfr.gov/current/title-${titleNum}${hierarchy.part ? '/part-' + hierarchy.part : ''}${hierarchy.section ? '#' + hierarchy.section : ''}`;

      const taxonomy = detectTaxonomy(titleNum, title + ' ' + partHeading);

      const rawText = [
        title,
        `Title ${titleNum}: ${titleName}`,
        partHeading ? `Part: ${partHeading}` : '',
        subpartHeading ? `Subpart: ${subpartHeading}` : '',
        item.headings?.section || '',
        item.headings?.title ? `Title heading: ${item.headings.title}` : '',
        item.full_text_excerpt || '',
        titleMeta?.up_to_date_as_of ? `Up to date as of: ${titleMeta.up_to_date_as_of}` : '',
      ].filter(Boolean).join('\n');

      const docId = await db.upsertDocument(sourceId, title, 'regulation', jurisdictionId, sourceUrl, taxonomy);
      if (docId) {
        const effectiveDate = item.starts_on || titleMeta?.latest_amended_on || null;
        await db.upsertDocumentVersion(docId, effectiveDate, rawText.slice(0, 500000));
      }

      imported++;
      if (onProgress) onProgress(imported, maxItems);
    }

    page++;
    await sleep(DELAY_MS);
  }

  return imported;
}

async function run(opts = {}) {
  const jurisdictionId = await db.getJurisdictionId('US-FED');
  if (!jurisdictionId) throw new Error('Jurisdiction US-FED not found.');

  const allTitlesMeta = await fetchTitleInfo();

  let titles = IMPORTANT_TITLES;
  if (opts.titles) {
    const nums = String(opts.titles).split(',').map(Number).filter(Boolean);
    titles = IMPORTANT_TITLES.filter((t) => nums.includes(t.num));
    if (titles.length === 0) titles = nums.map((n) => ({ num: n, name: `Title ${n}` }));
  }

  const perTitle = Math.max(5, Math.floor((opts.limit || 200) / titles.length));
  let totalImported = 0;

  for (const t of titles) {
    const meta = allTitlesMeta.find((m) => m.number === t.num);
    console.log(`eCFR: syncing Title ${t.num} – ${t.name}...`);
    const count = await syncTitle(t.num, t.name, t.q, meta, jurisdictionId, perTitle, (n, total) => {
      if (n % 5 === 0) process.stdout.write(`  Title ${t.num}: ${n}/${total}\r`);
    });
    totalImported += count;
    console.log(`  Title ${t.num}: ${count} sections imported.`);
    await sleep(DELAY_MS);
  }

  db.saveSqlite();
  console.log(`eCFR sync: ${totalImported} total sections imported.`);
  return { imported: totalImported };
}

module.exports = { run };
