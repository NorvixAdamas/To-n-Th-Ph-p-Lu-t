/**
 * Sync US statutes/regulations from OpenLaws API.
 * Register at https://openlaws.us/api/ for free API key.
 */
const axios = require('axios');
const db = require('./db-adapter');

const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(opts = {}) {
  const apiKey = process.env.OPENLAWS_API_KEY;
  if (!apiKey) { console.log('Skip OpenLaws (no OPENLAWS_API_KEY)'); return { imported: 0 }; }

  const jurisdictionId = await db.getJurisdictionId('US-FED');
  if (!jurisdictionId) throw new Error('Jurisdiction US-FED not found.');

  const maxItems = opts.limit || 100;
  let imported = 0;

  try {
    const baseUrl = 'https://api.openlaws.com';
    const searchUrl = `${baseUrl}/v1/search?q=*&limit=50&api_key=${apiKey}`;
    const res = await axios.get(searchUrl, { timeout: 15000, validateStatus: () => true });

    if (res.status === 200 && Array.isArray(res.data?.results)) {
      for (const item of res.data.results.slice(0, maxItems)) {
        const sourceId = String(item.id || item.section_id || imported);
        const title = item.title || item.name || item.citation || sourceId;
        const sourceUrl = item.url || item.link || '';
        const taxonomy = /tax|irs|revenue/i.test(title) ? ['thue'] : [];

        const docId = await db.upsertDocument(
          'openlaws-' + sourceId, title, item.type || 'statute',
          jurisdictionId, sourceUrl, taxonomy
        );
        if (docId) {
          const text = item.text || item.content || title;
          await db.upsertDocumentVersion(docId, item.effective_date || null, text);
        }
        imported++;
        await sleep(DELAY_MS);
      }
    }
  } catch (e) {
    console.log('OpenLaws API not reachable or format changed:', e.message);
  }

  db.saveSqlite();
  console.log(`OpenLaws sync: ${imported} items imported.`);
  return { imported };
}

module.exports = { run };
