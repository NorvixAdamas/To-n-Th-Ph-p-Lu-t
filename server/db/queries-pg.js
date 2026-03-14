const { pool } = require('./init');

function buildSnippet(rawText, q, maxLen) {
  if (!rawText || !q || q.length === 0) return rawText ? rawText.slice(0, maxLen) : '';
  const text = String(rawText);
  const lower = text.toLowerCase();
  const pos = lower.indexOf(q.toLowerCase());
  if (pos < 0) return text.slice(0, maxLen);
  const start = Math.max(0, pos - 90);
  const end = Math.min(text.length, start + 260);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

async function searchDocuments({ q, country, type, effective2026, taxOnly, limit, offset }) {
  const client = await pool.connect();
  try {
    const where = [];
    const params = [];
    let i = 1;
    if (q) {
      const qEsc = q.replace(/'/g, "''");
      where.push(`(d.title ILIKE $${i} OR v.raw_text ILIKE $${i} OR d.title_tsv @@ plainto_tsquery('simple', $${i + 1}))`);
      params.push('%' + q + '%', qEsc);
      i += 2;
    }
    if (country) {
      where.push(`j.country = $${i}`);
      params.push(country);
      i++;
    }
    if (type) {
      where.push(`d.type = $${i}`);
      params.push(type);
      i++;
    }
    if (effective2026) {
      where.push(`((v.effective_date IS NULL OR v.effective_date <= '2026-12-31') AND (v.repeal_date IS NULL OR v.repeal_date > '2026-01-01'))`);
    }
    if (taxOnly) {
      where.push(`d.taxonomy && ARRAY['thue']`);
    }
    const whereClause = where.length ? 'AND ' + where.join(' AND ') : '';
    params.push(limit, offset);
    const orderByClause = q
      ? 'ORDER BY (CASE WHEN title ILIKE \'%\' || $2 || \'%\' THEN 0 ELSE 1 END), ts_rank(title_tsv, plainto_tsquery(\'simple\', $2)) DESC NULLS LAST, title'
      : 'ORDER BY title';
    const r = await client.query(
      `WITH base AS (
         SELECT d.id, d.source_id, d.title, d.type, d.source_url, j.code as jurisdiction_code, j.country, j.name as jurisdiction_name,
                v.effective_date, v.repeal_date, v.raw_text, d.title_tsv,
                COUNT(*) OVER() AS total
         FROM documents d
         JOIN jurisdictions j ON d.jurisdiction_id = j.id
         LEFT JOIN LATERAL (
           SELECT effective_date, repeal_date, raw_text FROM document_versions v2
           WHERE v2.document_id = d.id ORDER BY v2.effective_date DESC NULLS LAST LIMIT 1
         ) v ON true
         WHERE 1=1 ${whereClause}
       )
       SELECT id, source_id, title, type, source_url, jurisdiction_code, country, jurisdiction_name, effective_date, repeal_date, total, raw_text
       FROM base ${orderByClause} LIMIT $${i} OFFSET $${i + 1}`,
      params
    );
    const total = r.rows.length ? parseInt(r.rows[0].total, 10) : 0;
    const items = r.rows.map((row) => {
      const { total: _t, raw_text: rawText, ...rest } = row;
      rest.snippet = q && rawText ? buildSnippet(rawText, q, 250) : (rawText ? rawText.slice(0, 250) : '');
      return rest;
    });
    return { items, total };
  } finally {
    client.release();
  }
}

async function getDocumentById(id) {
  const client = await pool.connect();
  try {
    const r = await client.query(
      `SELECT d.*, j.code as jurisdiction_code, j.country, j.name as jurisdiction_name
       FROM documents d JOIN jurisdictions j ON d.jurisdiction_id = j.id WHERE d.id = $1`,
      [id]
    );
    if (r.rows.length === 0) return null;
    const doc = r.rows[0];
    const v = await client.query(
      'SELECT id, effective_date, repeal_date, raw_text, html FROM document_versions WHERE document_id = $1 ORDER BY effective_date DESC NULLS LAST',
      [id]
    );
    doc.versions = v.rows;
    return doc;
  } finally {
    client.release();
  }
}

async function searchCases({ q, country, limit, offset }) {
  const client = await pool.connect();
  try {
    const where = [];
    const params = [];
    let i = 1;
    if (q) {
      where.push(`(c.case_name ILIKE $${i} OR c.opinion_text ILIKE $${i})`);
      params.push('%' + q + '%');
      i++;
    }
    if (country) {
      where.push(`c.country = $${i}`);
      params.push(country);
      i++;
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(limit, offset);
    const r = await client.query(
      `WITH base AS (
         SELECT id, case_name, court, docket_number, date_decided, country, source_url,
                COUNT(*) OVER() AS total
         FROM cases c ${whereClause}
       )
       SELECT * FROM base ORDER BY date_decided DESC NULLS LAST LIMIT $${i} OFFSET $${i + 1}`,
      params
    );
    const total = r.rows.length ? parseInt(r.rows[0].total, 10) : 0;
    const items = r.rows.map((row) => {
      const { total: _t, ...rest } = row;
      return rest;
    });
    return { items, total };
  } finally {
    client.release();
  }
}

async function getCaseById(id) {
  const client = await pool.connect();
  try {
    const r = await client.query('SELECT * FROM cases WHERE id = $1', [id]);
    return r.rows[0] || null;
  } finally {
    client.release();
  }
}

async function listJurisdictions(country) {
  const client = await pool.connect();
  try {
    const query = country
      ? 'SELECT id, code, name, country, level FROM jurisdictions WHERE country = $1 ORDER BY level, name'
      : 'SELECT id, code, name, country, level FROM jurisdictions ORDER BY country, level, name';
    const params = country ? [country] : [];
    const r = await client.query(query, params);
    return r.rows;
  } finally {
    client.release();
  }
}

module.exports = {
  searchDocuments,
  getDocumentById,
  searchCases,
  getCaseById,
  listJurisdictions,
};
