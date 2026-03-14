/**
 * Sync US federal bills/legislation from Congress.gov API.
 * API docs: https://api.congress.gov/
 * Rate limit: 5,000 req/hour. Free key: https://api.congress.gov/sign-up/
 */
const axios = require('axios');
const db = require('./db-adapter');

const BASE = 'https://api.congress.gov/v3';
const DELAY_MS = 800;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(opts = {}) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) { console.log('Skip Congress (no CONGRESS_API_KEY)'); return { imported: 0 }; }

  const jurisdictionId = await db.getJurisdictionId('US-FED');
  if (!jurisdictionId) throw new Error('Jurisdiction US-FED not found. Run server once to seed DB.');

  const maxItems = opts.limit || 500;
  let imported = 0;
  let offset = 0;
  const pageSize = 100;

  try {
    while (imported < maxItems) {
      const url = `${BASE}/bill/118?limit=${pageSize}&offset=${offset}&api_key=${apiKey}&format=json`;
      const res = await axios.get(url, { timeout: 30000 });
      const bills = res.data?.bills || [];
      if (bills.length === 0) break;

      for (const bill of bills) {
        if (imported >= maxItems) break;
        const sourceId = `congress-${bill.congress || 118}-${bill.type || 'hr'}-${bill.number || imported}`;
        const title = bill.title || bill.shortTitle || `${bill.type} ${bill.number}`;
        const sourceUrl = bill.url || `https://www.congress.gov/bill/${bill.congress}-congress/${bill.type?.toLowerCase()}/${bill.number}`;
        const taxonomy = /tax|revenue|irs/i.test(title) ? ['thue'] : [];

        const docId = await db.upsertDocument(sourceId, title, 'statute', jurisdictionId, sourceUrl, taxonomy);
        if (docId) {
          const effectiveDate = bill.introducedDate || bill.updateDate || null;
          const rawText = [title, bill.latestAction?.text || ''].filter(Boolean).join('\n\n');
          await db.upsertDocumentVersion(docId, effectiveDate, rawText);
        }
        imported++;
      }

      offset += bills.length;
      if (bills.length < pageSize) break;
      await sleep(DELAY_MS);
    }
  } catch (e) {
    console.error('Congress API error:', e.response?.status || '', e.message);
  }

  db.saveSqlite();
  console.log(`Congress.gov sync: ${imported} bills imported.`);
  return { imported };
}

module.exports = { run };
