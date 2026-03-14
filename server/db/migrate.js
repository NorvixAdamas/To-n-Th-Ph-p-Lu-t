/**
 * Run migrations: jurisdictions, documents, document_versions, cases.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toanthuluat',
});

const SQL = `
-- Jurisdictions: country, level (federal/state/province/district), code
CREATE TABLE IF NOT EXISTS jurisdictions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  country CHAR(2) NOT NULL,
  level VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jurisdictions_country ON jurisdictions(country);

-- Documents: statute, regulation, case, tax_ruling
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  source_id VARCHAR(255),
  title TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  jurisdiction_id INTEGER NOT NULL REFERENCES jurisdictions(id),
  source_url TEXT,
  taxonomy TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jurisdiction_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_documents_jurisdiction ON documents(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_source_id ON documents(source_id);
CREATE INDEX IF NOT EXISTS idx_documents_taxonomy ON documents USING GIN(taxonomy);

-- Document versions: effective_date, repeal_date, raw_text, html
CREATE TABLE IF NOT EXISTS document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  effective_date DATE,
  repeal_date DATE,
  raw_text TEXT,
  html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_effective ON document_versions(effective_date);

-- Full-text search on documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS title_tsv tsvector;
CREATE INDEX IF NOT EXISTS idx_documents_title_tsv ON documents USING GIN(title_tsv);
CREATE OR REPLACE FUNCTION documents_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.title_tsv := to_tsvector('simple', COALESCE(NEW.title, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS documents_tsv_update ON documents;
CREATE TRIGGER documents_tsv_update BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW EXECUTE PROCEDURE documents_tsv_trigger();
UPDATE documents SET title_tsv = to_tsvector('simple', COALESCE(title, '')) WHERE title_tsv IS NULL;

-- Cases (án lệ)
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  source_id VARCHAR(255) NOT NULL,
  case_name TEXT,
  court VARCHAR(255),
  docket_number VARCHAR(128),
  date_decided DATE,
  opinion_text TEXT,
  country CHAR(2) NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, source_id)
);

CREATE INDEX IF NOT EXISTS idx_cases_country ON cases(country);
CREATE INDEX IF NOT EXISTS idx_cases_date ON cases(date_decided);

-- Seed jurisdictions US & VN
INSERT INTO jurisdictions (code, name, country, level) VALUES
  ('US-FED', 'Liên bang Hoa Kỳ', 'US', 'federal'),
  ('VN-TW', 'Trung ương Việt Nam', 'VN', 'federal')
ON CONFLICT (code) DO NOTHING;
`;

async function run() {
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log('Migrations OK.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
