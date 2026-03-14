/**
 * Sync all sources: Congress.gov, GovInfo, eCFR, OpenLaws, CourtListener (US), MOJ/VBPL (VN).
 * Run: node server/jobs/sync-all.js
 *      npm run sync
 */
require('dotenv').config();

async function run() {
  const { initDb } = require('../db/init');
  await initDb();

  const results = {};

  // US sources
  if (process.env.CONGRESS_API_KEY) {
    const syncCongress = require('./sync-congress');
    results.congress = await syncCongress.run().catch((e) => { console.error('Congress sync error:', e.message); return { imported: 0 }; });
  } else {
    console.log('Skip Congress (no CONGRESS_API_KEY)');
  }

  if (process.env.GOVINFO_API_KEY) {
    const syncGovInfo = require('./sync-govinfo');
    results.govinfo = await syncGovInfo.run().catch((e) => { console.error('GovInfo sync error:', e.message); return { imported: 0 }; });
  } else {
    console.log('Skip GovInfo (no GOVINFO_API_KEY)');
  }

  // eCFR: no API key needed
  const syncEcfr = require('./sync-ecfr');
  results.ecfr = await syncEcfr.run().catch((e) => { console.error('eCFR sync error:', e.message); return { imported: 0 }; });

  if (process.env.OPENLAWS_API_KEY) {
    const syncOpenLaws = require('./sync-openlaws');
    results.openlaws = await syncOpenLaws.run().catch((e) => { console.error('OpenLaws sync error:', e.message); return { imported: 0 }; });
  } else {
    console.log('Skip OpenLaws (no OPENLAWS_API_KEY)');
  }

  if (process.env.COURTLISTENER_TOKEN) {
    const syncCourtListener = require('./sync-courtlistener');
    results.courtlistener = await syncCourtListener.run().catch((e) => { console.error('CourtListener sync error:', e.message); return { imported: 0 }; });
  } else {
    console.log('Skip CourtListener (no COURTLISTENER_TOKEN)');
  }

  // VN sources: no API key needed
  const syncVN = require('./sync-vn');
  results.vn = await syncVN.run().catch((e) => { console.error('VN sync error:', e.message); return { imported: 0 }; });

  const crawlVnCase = require('./crawl-vn-caselaw');
  results.vnCaselaw = await crawlVnCase.run().catch((e) => { console.error('VN case crawl error:', e.message); return { imported: 0 }; });

  console.log('\nSync complete. Results:');
  for (const [source, r] of Object.entries(results)) {
    console.log(`  ${source}: ${r?.imported || 0} imported`);
  }

  return results;
}

if (require.main === module) {
  run().catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
