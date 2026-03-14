/**
 * Query implementations for SQLite (sql.js) when PostgreSQL unavailable.
 */
const dbInit = require('./init');

function getDb() {
  return dbInit.sqliteDb;
}

function runSelect(db, sql, params) {
  const stmt = db.prepare(sql);
  if (params && params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function runGet(db, sql, params) {
  const rows = runSelect(db, sql, params);
  return rows[0] || null;
}

function buildSnippet(rawText, q, maxLen) {
  if (!rawText || !q || q.length === 0) return rawText ? String(rawText).slice(0, maxLen) : '';
  const text = String(rawText);
  const lower = text.toLowerCase();
  const pos = lower.indexOf(q.toLowerCase());
  if (pos < 0) return text.slice(0, maxLen);
  const start = Math.max(0, pos - 90);
  const end = Math.min(text.length, start + 260);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function searchDocuments(opts) {
  const db = getDb();
  const { q, country, type, effective2026, taxOnly, limit, offset } = opts;
  const where = [];
  const params = [];
  if (q) {
    where.push('(d.title LIKE ? OR v.raw_text LIKE ?)');
    params.push('%' + q + '%', '%' + q + '%');
  }
  if (country) {
    where.push('j.country = ?');
    params.push(country);
  }
  if (type) {
    where.push('d.type = ?');
    params.push(type);
  }
  if (effective2026) {
    where.push("((v.effective_date IS NULL OR v.effective_date <= '2026-12-31') AND (v.repeal_date IS NULL OR v.repeal_date > '2026-01-01'))");
  }
  if (taxOnly) {
    where.push("d.taxonomy LIKE '%thue%'");
  }
  const whereClause = where.length ? 'AND ' + where.join(' AND ') : '';
  const latestVer = `(SELECT document_id, effective_date, repeal_date, raw_text FROM document_versions WHERE id IN (SELECT MAX(id) FROM document_versions GROUP BY document_id)) v ON v.document_id = d.id`;
  const countSql = `
    SELECT COUNT(*) AS total FROM documents d
    JOIN jurisdictions j ON d.jurisdiction_id = j.id
    LEFT JOIN ${latestVer}
    WHERE 1=1 ${whereClause}
  `;
  const countRow = runGet(db, countSql, params);
  const total = countRow ? countRow.total : 0;
  const orderBy = q
    ? 'ORDER BY (CASE WHEN d.title LIKE \'%\' || ? || \'%\' THEN 0 ELSE 1 END), d.title'
    : 'ORDER BY d.title';
  const orderParams = q ? [...params, q, limit, offset] : [...params, limit, offset];
  const sql = `
    SELECT d.id, d.source_id, d.title, d.type, d.source_url, j.code AS jurisdiction_code, j.country, j.name AS jurisdiction_name,
           v.effective_date, v.repeal_date, v.raw_text
    FROM documents d
    JOIN jurisdictions j ON d.jurisdiction_id = j.id
    LEFT JOIN ${latestVer}
    WHERE 1=1 ${whereClause}
    ${orderBy} LIMIT ? OFFSET ?
  `;
  const rows = runSelect(db, sql, orderParams);
  const items = rows.map((r) => {
    const rawText = r.raw_text;
    const snippet = q && rawText ? buildSnippet(rawText, q, 250) : (rawText ? String(rawText).slice(0, 250) : '');
    return {
      id: r.id,
      source_id: r.source_id,
      title: r.title,
      type: r.type,
      source_url: r.source_url,
      jurisdiction_code: r.jurisdiction_code,
      country: r.country,
      jurisdiction_name: r.jurisdiction_name,
      effective_date: r.effective_date,
      repeal_date: r.repeal_date,
      snippet,
    };
  });
  return Promise.resolve({ items, total });
}

function getDocumentById(id) {
  const db = getDb();
  const doc = runGet(
    db,
    `SELECT d.*, j.code AS jurisdiction_code, j.country, j.name AS jurisdiction_name
     FROM documents d JOIN jurisdictions j ON d.jurisdiction_id = j.id WHERE d.id = ?`,
    [id]
  );
  if (!doc) return Promise.resolve(null);
  const versions = runSelect(db, 'SELECT id, effective_date, repeal_date, raw_text, html FROM document_versions WHERE document_id = ? ORDER BY effective_date DESC', [id]);
  doc.versions = versions;
  return Promise.resolve(doc);
}

function searchCases(opts) {
  const db = getDb();
  const { q, country, limit, offset } = opts;
  const where = [];
  const params = [];
  if (q) {
    where.push('(case_name LIKE ? OR opinion_text LIKE ?)');
    params.push('%' + q + '%', '%' + q + '%');
  }
  if (country) {
    where.push('country = ?');
    params.push(country);
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const countSql = `SELECT COUNT(*) AS total FROM cases ${whereClause}`;
  const countRow = runGet(db, countSql, params);
  const total = countRow ? countRow.total : 0;
  const sql = `SELECT id, case_name, court, docket_number, date_decided, country, source_url FROM cases ${whereClause} ORDER BY date_decided DESC LIMIT ? OFFSET ?`;
  const rows = runSelect(db, sql, [...params, limit, offset]);
  return Promise.resolve({ items: rows, total });
}

function getCaseById(id) {
  const db = getDb();
  const row = runGet(db, 'SELECT * FROM cases WHERE id = ?', [id]);
  return Promise.resolve(row || null);
}

function listJurisdictions(country) {
  const db = getDb();
  const sql = country
    ? 'SELECT id, code, name, country, level FROM jurisdictions WHERE country = ? ORDER BY level, name'
    : 'SELECT id, code, name, country, level FROM jurisdictions ORDER BY country, level, name';
  const params = country ? [country] : [];
  const rows = runSelect(db, sql, params);
  return Promise.resolve(rows);
}

module.exports = {
  searchDocuments,
  getDocumentById,
  searchCases,
  getCaseById,
  listJurisdictions,
};
