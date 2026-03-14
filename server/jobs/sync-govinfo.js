/**
 * Sync US federal legal documents from GovInfo.gov API.
 * API docs: https://api.govinfo.gov/docs/
 * Free key: https://api.data.gov/signup/ (1,000 req/hour)
 *
 * Collections used:
 *   USCODE  - United States Code
 *   CFR     - Code of Federal Regulations
 *   FR      - Federal Register
 *   PLAW    - Public Laws
 *   BILLS   - Congressional Bills
 */
const axios = require('axios');
const db = require('./db-adapter');

const BASE = 'https://api.govinfo.gov';
const DELAY_MS = 1000;
const USER_AGENT = 'ToanThuLuat/1.0 (Legal reference; +https://github.com/toanthuluat)';

const COLLECTIONS = ['USCODE', 'PLAW', 'CFR', 'FR', 'BILLS'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function detectTaxonomy(title) {
  if (/tax|revenue|irs|internal revenue/i.test(title)) return ['thue'];
  return [];
}

function detectType(collection) {
  switch (collection) {
    case 'USCODE': return 'statute';
    case 'PLAW': return 'statute';
    case 'CFR': return 'regulation';
    case 'FR': return 'regulation';
    case 'BILLS': return 'statute';
    default: return 'statute';
  }
}

async function syncCollection(apiKey, jurisdictionId, collection, maxItems, onProgress) {
  let imported = 0;
  let offset = 0;
  const pageSize = 100;

  while (imported < maxItems) {
    const url = `${BASE}/collections/${collection}/${encodeURIComponent('2024-01-01T00:00:00Z')}?offset=${offset}&pageSize=${pageSize}&api_key=${apiKey}`;
    let res;
    try {
      res = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 30000,
      });
    } catch (e) {
      console.error(`GovInfo ${collection} page error:`, e.response?.status || '', e.message);
      break;
    }

    const packages = res.data?.packages || [];
    if (packages.length === 0) break;

    for (const pkg of packages) {
      if (imported >= maxItems) break;
      const packageId = pkg.packageId || '';
      const title = pkg.title || packageId;
      const sourceUrl = pkg.packageLink || `https://www.govinfo.gov/app/details/${packageId}`;
      const sourceId = `govinfo-${collection.toLowerCase()}-${packageId}`;
      const taxonomy = detectTaxonomy(title);
      const type = detectType(collection);

      const docId = await db.upsertDocument(sourceId, title, type, jurisdictionId, sourceUrl, taxonomy);
      if (docId) {
        const dateIssued = pkg.dateIssued || pkg.lastModified || null;
        let rawText = title;

        if (pkg.packageLink && apiKey) {
          try {
            const summaryUrl = `${pkg.packageLink}/summary?api_key=${apiKey}`;
            const sRes = await axios.get(summaryUrl, {
              headers: { 'User-Agent': USER_AGENT },
              timeout: 15000,
            });
            if (sRes.data) {
              const s = sRes.data;
              rawText = [
                s.title || title,
                s.collectionName ? `Collection: ${s.collectionName}` : '',
                s.category ? `Category: ${s.category}` : '',
                s.dateIssued ? `Date: ${s.dateIssued}` : '',
                s.branch ? `Branch: ${s.branch}` : '',
                s.pages ? `Pages: ${s.pages}` : '',
                s.suDocClassNumber ? `SuDoc: ${s.suDocClassNumber}` : '',
              ].filter(Boolean).join('\n');
            }
            await sleep(300);
          } catch (_) {}
        }

        await db.upsertDocumentVersion(docId, dateIssued, rawText);
      }

      imported++;
      if (onProgress) onProgress(imported);
    }

    offset += packages.length;
    if (packages.length < pageSize) break;
    await sleep(DELAY_MS);
  }

  return imported;
}

async function run(opts = {}) {
  const apiKey = process.env.GOVINFO_API_KEY;
  if (!apiKey) { console.log('Skip GovInfo (no GOVINFO_API_KEY)'); return { imported: 0 }; }

  const jurisdictionId = await db.getJurisdictionId('US-FED');
  if (!jurisdictionId) throw new Error('Jurisdiction US-FED not found.');

  const collections = opts.collection
    ? [opts.collection.toUpperCase()]
    : COLLECTIONS;
  const perCollection = Math.floor((opts.limit || 500) / collections.length);
  let totalImported = 0;

  for (const coll of collections) {
    console.log(`GovInfo: syncing ${coll}...`);
    const count = await syncCollection(apiKey, jurisdictionId, coll, perCollection, (n) => {
      if (n % 25 === 0) process.stdout.write(`  ${coll}: ${n}/${perCollection}\r`);
    });
    totalImported += count;
    console.log(`  ${coll}: ${count} documents.`);
  }

  db.saveSqlite();
  console.log(`GovInfo sync: ${totalImported} total documents imported.`);
  return { imported: totalImported };
}

module.exports = { run };
