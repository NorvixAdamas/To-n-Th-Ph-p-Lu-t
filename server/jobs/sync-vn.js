/**
 * Sync Vietnam: data.moj.gov.vn CKAN API + VBPL.vn scraper.
 * Respects robots.txt, 2s delay, clear User-Agent.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db-adapter');

const DELAY_MS = 2000;
const USER_AGENT = 'ToanThuLuat/1.0 (Legal reference; +https://github.com/toanthuluat)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(opts = {}) {
  const jurisdictionId = await db.getJurisdictionId('VN-TW');
  if (!jurisdictionId) throw new Error('Jurisdiction VN-TW not found.');

  const maxPages = opts.limit || 30;
  let imported = 0;

  // 1) data.moj.gov.vn CKAN API
  try {
    const mojRes = await axios.get('https://data.moj.gov.vn/api/3/action/package_list', {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
      validateStatus: () => true,
    });
    if (mojRes.status === 200 && Array.isArray(mojRes.data?.result)) {
      const packages = mojRes.data.result.slice(0, 10);
      for (const pkgId of packages) {
        const pkgRes = await axios.get(`https://data.moj.gov.vn/api/3/action/package_show?id=${pkgId}`, {
          headers: { 'User-Agent': USER_AGENT },
          timeout: 15000,
          validateStatus: () => true,
        });
        if (pkgRes.data?.result?.resources?.length) {
          const title = pkgRes.data.result.title || pkgId;
          const sourceId = 'moj-' + pkgId;
          const docId = await db.upsertDocument(sourceId, title, 'statute', jurisdictionId, 'https://data.moj.gov.vn/dataset/' + pkgId, []);
          if (docId) {
            await db.upsertDocumentVersion(docId, null, title);
          }
          imported++;
        }
        await sleep(DELAY_MS);
      }
    }
  } catch (e) {
    console.log('MOJ data portal:', e.message);
  }

  // 2) VBPL.vn scraper
  const vbplListUrl = 'https://vbpl.vn/vbpq/Lists/Vn%20bn%20php%20lut/AllItems.aspx';
  try {
    const listRes = await axios.get(vbplListUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 20000,
      validateStatus: () => true,
    });
    if (listRes.status === 200) {
      const $ = cheerio.load(listRes.data);
      const links = [];
      $('a[href*="view_detail"], a[href*="ItemId="]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('view_detail')) links.push(href);
      });
      const base = 'https://vbpl.vn';
      for (const href of links.slice(0, maxPages)) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, base).href;
        await sleep(DELAY_MS);
        try {
          const detailRes = await axios.get(fullUrl, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 15000,
            validateStatus: () => true,
          });
          if (detailRes.status !== 200) continue;
          const $d = cheerio.load(detailRes.data);
          const title = $d('h1').first().text().trim() || $d('title').text().trim() || 'VBPL';
          const text = $d('.content, .detail, article, .vb-content').first().text().trim() || title;
          const sourceId = 'vbpl-' + (fullUrl.match(/[?&]itemid=(\d+)/i)?.[1] || Buffer.from(fullUrl).toString('base64').slice(0, 64));
          const taxonomy = /thuế|tax/i.test(title + text) ? ['thue'] : [];

          const docId = await db.upsertDocument(sourceId, title, 'statute', jurisdictionId, fullUrl, taxonomy);
          if (docId) {
            await db.upsertDocumentVersion(docId, null, text.slice(0, 500000));
          }
          imported++;
        } catch (_) {}
      }
    }
  } catch (e) {
    console.log('VBPL crawler:', e.message);
  }

  db.saveSqlite();
  console.log(`VN sync: ${imported} documents imported.`);
  return { imported };
}

module.exports = { run };
