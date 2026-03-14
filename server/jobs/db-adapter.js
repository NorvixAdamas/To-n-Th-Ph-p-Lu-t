/**
 * Database adapter for sync jobs — works with both PostgreSQL and SQLite.
 * All sync jobs use this instead of directly calling pool.connect().
 */
const path = require('path');
const fs = require('fs');
const dbInit = require('../db/init');

const SQLITE_DB_PATH = path.join(__dirname, '..', '..', 'data', 'toanthuluat.sqlite');

let _batchCount = 0;
const SAVE_EVERY = 50;

function saveSqlite() {
  if (!dbInit.useSqlite || !dbInit.sqliteDb) return;
  fs.mkdirSync(path.dirname(SQLITE_DB_PATH), { recursive: true });
  fs.writeFileSync(SQLITE_DB_PATH, Buffer.from(dbInit.sqliteDb.export()));
}

function maybeSave() {
  _batchCount++;
  if (_batchCount % SAVE_EVERY === 0) saveSqlite();
}

function resetBatch() {
  _batchCount = 0;
}

// --- SQLite helpers ---

function sqliteRun(sql, params) {
  const db = dbInit.sqliteDb;
  if (!params || params.length === 0) {
    db.run(sql);
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  }
}

function sqliteGet(sql, params) {
  const db = dbInit.sqliteDb;
  const stmt = db.prepare(sql);
  if (params && params.length) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

// --- Unified API ---

async function getJurisdictionId(code) {
  if (dbInit.useSqlite) {
    const row = sqliteGet('SELECT id FROM jurisdictions WHERE code = ?', [code]);
    return row?.id || null;
  }
  const client = await dbInit.pool.connect();
  try {
    const r = await client.query('SELECT id FROM jurisdictions WHERE code = $1', [code]);
    return r.rows[0]?.id || null;
  } finally {
    client.release();
  }
}

async function upsertDocument(sourceId, title, type, jurisdictionId, sourceUrl, taxonomy) {
  const taxJson = Array.isArray(taxonomy) ? JSON.stringify(taxonomy) : (taxonomy || '[]');
  const titleTrunc = String(title).slice(0, 2000);

  if (dbInit.useSqlite) {
    sqliteRun(
      `INSERT OR REPLACE INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [sourceId, titleTrunc, type, jurisdictionId, sourceUrl || '', taxJson]
    );
    const row = sqliteGet(
      'SELECT id FROM documents WHERE jurisdiction_id = ? AND source_id = ?',
      [jurisdictionId, sourceId]
    );
    maybeSave();
    return row?.id || null;
  }

  const client = await dbInit.pool.connect();
  try {
    await client.query(
      `INSERT INTO documents (source_id, title, type, jurisdiction_id, source_url, taxonomy, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (jurisdiction_id, source_id) DO UPDATE
       SET title = $2, type = $3, source_url = $5, taxonomy = $6, updated_at = NOW()`,
      [sourceId, titleTrunc, type, jurisdictionId, sourceUrl || '', taxJson]
    );
    const r = await client.query(
      'SELECT id FROM documents WHERE jurisdiction_id = $1 AND source_id = $2',
      [jurisdictionId, sourceId]
    );
    return r.rows[0]?.id || null;
  } finally {
    client.release();
  }
}

async function upsertDocumentVersion(documentId, effectiveDate, rawText) {
  const textTrunc = rawText ? String(rawText).slice(0, 500000) : '';

  if (dbInit.useSqlite) {
    const existing = sqliteGet(
      'SELECT id FROM document_versions WHERE document_id = ? AND effective_date = ?',
      [documentId, effectiveDate || null]
    );
    if (existing) {
      sqliteRun(
        'UPDATE document_versions SET raw_text = ? WHERE id = ?',
        [textTrunc, existing.id]
      );
    } else {
      sqliteRun(
        'INSERT INTO document_versions (document_id, effective_date, raw_text) VALUES (?, ?, ?)',
        [documentId, effectiveDate || null, textTrunc]
      );
    }
    maybeSave();
    return;
  }

  const client = await dbInit.pool.connect();
  try {
    await client.query(
      `INSERT INTO document_versions (document_id, effective_date, raw_text)
       SELECT $1, $2::date, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM document_versions
         WHERE document_id = $1
         AND (effective_date = $2::date OR ($2 IS NULL AND effective_date IS NULL))
       )`,
      [documentId, effectiveDate || null, textTrunc]
    );
  } finally {
    client.release();
  }
}

async function upsertCase(sourceId, caseName, court, docketNumber, dateDecided, opinionText, country, sourceUrl) {
  const textTrunc = opinionText ? String(opinionText).slice(0, 500000) : '';
  const nameTrunc = caseName ? String(caseName).slice(0, 1000) : '';

  if (dbInit.useSqlite) {
    sqliteRun(
      `INSERT OR REPLACE INTO cases
       (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [sourceId, nameTrunc, court || '', docketNumber || '', dateDecided || null, textTrunc, country, sourceUrl || '']
    );
    maybeSave();
    return;
  }

  const client = await dbInit.pool.connect();
  try {
    await client.query(
      `INSERT INTO cases (source_id, case_name, court, docket_number, date_decided, opinion_text, country, source_url, updated_at)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, NOW())
       ON CONFLICT (country, source_id) DO UPDATE
       SET case_name = $2, court = $3, docket_number = $4, date_decided = $5::date,
           opinion_text = LEFT($6, 500000), source_url = $8, updated_at = NOW()`,
      [sourceId, nameTrunc, court || '', docketNumber || '', dateDecided || null, textTrunc, country, sourceUrl || '']
    );
  } finally {
    client.release();
  }
}

module.exports = {
  getJurisdictionId,
  upsertDocument,
  upsertDocumentVersion,
  upsertCase,
  saveSqlite,
  resetBatch,
};
