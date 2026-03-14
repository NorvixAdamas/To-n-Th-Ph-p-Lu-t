/**
 * Sync US case law from CourtListener (Free Law Project).
 * API v4: https://www.courtlistener.com/api/rest/v4/
 * Free token: create account at https://www.courtlistener.com/sign-in/
 */
const axios = require('axios');
const db = require('./db-adapter');

const BASE = 'https://www.courtlistener.com/api/rest/v4';
const DELAY_MS = 1200;
const USER_AGENT = 'ToanThuLuat/1.0 (Legal reference; +https://github.com/toanthuluat)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run(opts = {}) {
  const token = process.env.COURTLISTENER_TOKEN;
  if (!token) { console.log('Skip CourtListener (no COURTLISTENER_TOKEN)'); return { imported: 0 }; }

  const maxCases = opts.limit || 200;
  let imported = 0;

  try {
    const headers = {
      Authorization: 'Token ' + token,
      'User-Agent': USER_AGENT,
    };
    let next = `${BASE}/clusters/?docket__court__id=scotus&page_size=20&order_by=-date_filed`;

    while (next && imported < maxCases) {
      const res = await axios.get(next, { headers, timeout: 30000 });
      const results = res.data.results || [];

      for (const cluster of results) {
        if (imported >= maxCases) break;
        const caseName = cluster.case_name || cluster.case_name_full || 'Unknown';
        let docketNumber = '';
        let dateDecided = cluster.date_filed || null;

        if (cluster.docket) {
          try {
            const docketRes = await axios.get(cluster.docket, { headers, timeout: 10000 });
            docketNumber = docketRes.data.docket_number || '';
            dateDecided = dateDecided || docketRes.data.date_filed || null;
          } catch (_) {}
          await sleep(300);
        }

        let opinionText = '';
        const subOpinions = cluster.sub_opinions || [];
        if (subOpinions[0]) {
          try {
            const opRes = await axios.get(subOpinions[0], { headers, timeout: 10000 });
            opinionText = opRes.data.plain_text || opRes.data.html || '';
          } catch (_) {}
          await sleep(300);
        }

        const sourceId = 'cl-' + cluster.id;
        const sourceUrl = 'https://www.courtlistener.com' + (cluster.absolute_url || '');
        await db.upsertCase(sourceId, caseName, cluster.court || 'scotus', docketNumber, dateDecided, opinionText, 'US', sourceUrl);
        imported++;
      }

      next = res.data.next;
      await sleep(DELAY_MS);
    }
  } catch (e) {
    console.error('CourtListener error:', e.response?.status || '', e.message);
  }

  db.saveSqlite();
  console.log(`CourtListener sync: ${imported} cases imported.`);
  return { imported };
}

module.exports = { run };
