#!/usr/bin/env node
'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { initDb } = require('../db/init');
const dbInit = require('../db/init');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTaxonomy(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function getSourceId(entry, fallbackKey) {
  return entry.source_id || entry.id || entry[fallbackKey];
}

function getJurisdictionCode(entry) {
  return entry.jurisdiction_code || (entry.country ? entry.country + '-FED' : '');
}

function validateEntry(entry, type) {
  if (!entry.country) throw new Error(type + ' thiếu country');
  if (type === 'document' && !entry.title) throw new Error('document thiếu title');
  if (type === 'case' && !entry.case_name) throw new Error('case thiếu case_name');
}

function saveSqlite() {
  const dbPath = path.join(__dirname, '..', '..', 'data', 'toanthuluat.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(dbInit.sqliteDb.export()));
}

async function importSqlite(data) {
  const db = dbInit.sqliteDb;
  let importedDocuments = 0;
  let importedCases = 0;

  ensureArray(data.jurisdictions).forEach(function (jur) {
    db.run(
      'INSERT OR IGNORE INTO jurisdictions (code, name, country, level) VALUES (?,?,?,?)',
      [jur.code, jur.name || jur.code, jur.country, jur.level || 'federal']
    );
  });

  ensureArray(data.documents).forEach(function (doc) {
    validateEntry(doc, 'document');
    var jurisdictionCode = getJurisdictionCode(doc);
    var sourceId = getSourceId(doc, 'title');
    db.run(
      'INSERT OR IGNORE INTO jurisdictions (code, name, country, level) VALUES (?,?,?,?)',
      [jurisdictionCode, doc.jurisdiction_name || jurisdictionCode, doc.country, doc.level || 'federal']
    );
    db.run(
      `INSERT OR REPLACE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy, updated_at)
       SELECT ?, ?, ?, j.id, ?, ?, datetime('now')
       FROM jurisdictions j WHERE j.code = ?`,
      [
        sourceId,
        doc.title,
        doc.type || 'article',
        doc.source_url || '',
        normalizeTaxonomy(doc.taxonomy),
        jurisdictionCode
      ]
    );
    db.run(
      `INSERT OR IGNORE INTO document_versions (document_id, effective_date, repeal_date, raw_text, html)
       SELECT d.id, ?, ?, ?, ?
       FROM documents d
       JOIN jurisdictions j ON d.jurisdiction_id = j.id
       WHERE d.source_id = ? AND j.code = ?`,
      [
        doc.effective_date || null,
        doc.repeal_date || null,
        doc.summary || doc.raw_text || '',
        doc.html || null,
        sourceId,
        jurisdictionCode
      ]
    );
    importedDocuments++;
  });

  ensureArray(data.cases).forEach(function (item) {
    validateEntry(item, 'case');
    db.run(
      `INSERT OR REPLACE INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url, updated_at)
       VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      [
        getSourceId(item, 'case_name'),
        item.case_name,
        item.court || '',
        item.docket_number || '',
        item.date_decided || null,
        item.summary || item.opinion_text || '',
        item.country,
        item.source_url || ''
      ]
    );
    importedCases++;
  });

  saveSqlite();
  return { imported: importedDocuments + importedCases, documents: importedDocuments, cases: importedCases };
}

async function importPostgres(data) {
  const pool = dbInit.pool;
  let importedDocuments = 0;
  let importedCases = 0;

  for (const jur of ensureArray(data.jurisdictions)) {
    await pool.query(
      `INSERT INTO jurisdictions (code, name, country, level)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (code) DO NOTHING`,
      [jur.code, jur.name || jur.code, jur.country, jur.level || 'federal']
    );
  }

  for (const doc of ensureArray(data.documents)) {
    validateEntry(doc, 'document');
    const jurisdictionCode = getJurisdictionCode(doc);
    const sourceId = getSourceId(doc, 'title');
    await pool.query(
      `INSERT INTO jurisdictions (code, name, country, level)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (code) DO NOTHING`,
      [jurisdictionCode, doc.jurisdiction_name || jurisdictionCode, doc.country, doc.level || 'federal']
    );
    await pool.query(
      `INSERT INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy, updated_at)
       SELECT $1, $2, $3, j.id, $4, $5, NOW()
       FROM jurisdictions j WHERE j.code = $6
       ON CONFLICT (jurisdiction_id, source_id)
       DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, source_url = EXCLUDED.source_url, taxonomy = EXCLUDED.taxonomy, updated_at = NOW()`,
      [sourceId, doc.title, doc.type || 'article', doc.source_url || '', normalizeTaxonomy(doc.taxonomy), jurisdictionCode]
    );
    await pool.query(
      `INSERT INTO document_versions (document_id, effective_date, repeal_date, raw_text, html)
       SELECT d.id, $1, $2, $3, $4
       FROM documents d
       JOIN jurisdictions j ON d.jurisdiction_id = j.id
       WHERE d.source_id = $5 AND j.code = $6
       AND NOT EXISTS (
         SELECT 1 FROM document_versions dv
         WHERE dv.document_id = d.id
           AND COALESCE(dv.effective_date::text, '') = COALESCE($1::text, '')
           AND COALESCE(dv.raw_text, '') = COALESCE($3, '')
       )`,
      [doc.effective_date || null, doc.repeal_date || null, doc.summary || doc.raw_text || '', doc.html || null, sourceId, jurisdictionCode]
    );
    importedDocuments++;
  }

  for (const item of ensureArray(data.cases)) {
    validateEntry(item, 'case');
    await pool.query(
      `INSERT INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (country, source_id)
       DO UPDATE SET case_name = EXCLUDED.case_name, court = EXCLUDED.court, docket_number = EXCLUDED.docket_number, date_decided = EXCLUDED.date_decided, opinion_text = EXCLUDED.opinion_text, source_url = EXCLUDED.source_url, updated_at = NOW()`,
      [getSourceId(item, 'case_name'), item.case_name, item.court || '', item.docket_number || '', item.date_decided || null, item.summary || item.opinion_text || '', item.country, item.source_url || '']
    );
    importedCases++;
  }

  return { imported: importedDocuments + importedCases, documents: importedDocuments, cases: importedCases };
}

async function run(opts) {
  const filePath = path.resolve(opts.file || path.join(__dirname, '..', '..', 'data', 'manual-content.json'));
  if (!fs.existsSync(filePath)) {
    throw new Error('Khong tim thay file du lieu: ' + filePath);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const result = dbInit.useSqlite ? await importSqlite(data) : await importPostgres(data);
  console.log('Source file:', filePath);
  console.log('Imported documents:', result.documents);
  console.log('Imported cases:', result.cases);
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  await initDb();
  await run(args);
}

if (require.main === module) {
  main().catch(function (err) {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { run };
