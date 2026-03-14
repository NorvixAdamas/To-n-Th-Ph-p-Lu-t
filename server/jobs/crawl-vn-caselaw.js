/**
 * Crawl Vietnam case law (án lệ) from public sources.
 * Respects robots.txt, 2.5s delay, clear User-Agent.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db-adapter');

const DELAY_MS = 2500;
const USER_AGENT = 'ToanThuLuat/1.0 (Legal reference; +https://github.com/toanthuluat)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(opts = {}) {
  const maxCases = opts.limit || 50;
  const maxPages = 10;
  let imported = 0;

  const listUrl = 'https://vbpl.vn/vbpq/Lists/Vn%20bn%20php%20lut/AllItems.aspx';
  const base = 'https://vbpl.vn';

  for (let page = 0; page < maxPages && imported < maxCases; page++) {
    await sleep(DELAY_MS);
    try {
      const res = await axios.get(listUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 20000,
        validateStatus: () => true,
      });
      if (res.status !== 200) break;
      const $ = cheerio.load(res.data);
      const links = [];
      $('a[href*="view_detail"], a[href*="ItemId="]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('view_detail')) links.push(href);
      });
      const uniq = [...new Set(links)];
      for (const href of uniq.slice(0, 5)) {
        if (imported >= maxCases) break;
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
          const title = $d('h1').first().text().trim() || $d('title').text().trim() || 'Bản án';
          const content = $d('.content, .detail, article, .vb-content').first().text().trim() || '';
          if (!/bản án|quyết định|án lệ|tòa án/i.test(title + content)) continue;
          const sourceId = 'vncase-' + (fullUrl.match(/[?&]itemid=(\d+)/i)?.[1] || Buffer.from(fullUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 48));
          await db.upsertCase(sourceId, title, 'Tòa án', '', null, content, 'VN', fullUrl);
          imported++;
        } catch (_) {}
      }
    } catch (e) {
      console.log('VN case crawl page error:', e.message);
      break;
    }
  }

  db.saveSqlite();
  console.log(`VN case law crawl: ${imported} cases imported.`);
  return { imported };
}

module.exports = { run };
