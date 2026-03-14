#!/usr/bin/env node
/**
 * CLI tool for importing legal data from external sources.
 *
 * Usage:
 *   node server/jobs/import-cli.js --source ecfr --limit 100
 *   node server/jobs/import-cli.js --source govinfo --collection USCODE --limit 200
 *   node server/jobs/import-cli.js --source congress --limit 500
 *   node server/jobs/import-cli.js --source courtlistener --limit 100
 *   node server/jobs/import-cli.js --source vbpl --limit 30
 *   node server/jobs/import-cli.js --source vn-caselaw --limit 20
 *   node server/jobs/import-cli.js --all --limit 100
 *   node server/jobs/import-cli.js --list       (show available sources)
 *   node server/jobs/import-cli.js --status      (show DB stats)
 */
require('dotenv').config();

const SOURCES = {
  congress:        { file: './sync-congress',      key: 'CONGRESS_API_KEY', label: 'Congress.gov (US Bills)' },
  govinfo:         { file: './sync-govinfo',       key: 'GOVINFO_API_KEY',  label: 'GovInfo (USC, CFR, FR, PLAW)' },
  ecfr:            { file: './sync-ecfr',          key: null,               label: 'eCFR (Federal Regulations) — NO KEY NEEDED' },
  openlaws:        { file: './sync-openlaws',      key: 'OPENLAWS_API_KEY', label: 'OpenLaws (US Statutes)' },
  courtlistener:   { file: './sync-courtlistener', key: 'COURTLISTENER_TOKEN', label: 'CourtListener (US Case Law)' },
  vbpl:            { file: './sync-vn',            key: null,               label: 'VBPL.vn (Vietnam Legal Docs) — NO KEY NEEDED' },
  'vn-caselaw':    { file: './crawl-vn-caselaw',   key: null,               label: 'VN Case Law Crawler — NO KEY NEEDED' },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--list') args.list = true;
    else if (a === '--status') args.status = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    }
  }
  return args;
}

function printSources() {
  console.log('\n  Available sources:\n');
  console.log('  Source            Key needed?      Description');
  console.log('  ──────────────────────────────────────────────────────────────────');
  for (const [name, info] of Object.entries(SOURCES)) {
    const keyStatus = info.key ? (process.env[info.key] ? '  YES (set)  ' : '  YES (EMPTY)') : '  No         ';
    console.log(`  ${name.padEnd(18)}${keyStatus}  ${info.label}`);
  }
  console.log('\n  Usage: node server/jobs/import-cli.js --source <name> [--limit N] [--collection X] [--titles 26,29]\n');
}

async function printStatus() {
  const { initDb } = require('../db/init');
  await initDb();
  const dbInit = require('../db/init');

  if (dbInit.useSqlite) {
    const db = dbInit.sqliteDb;
    const stmt = (sql) => { const s = db.prepare(sql); s.step(); const r = s.getAsObject(); s.free(); return r; };
    const docs = stmt('SELECT COUNT(*) AS c FROM documents');
    const vers = stmt('SELECT COUNT(*) AS c FROM document_versions');
    const cases = stmt('SELECT COUNT(*) AS c FROM cases');
    const usDoc = stmt("SELECT COUNT(*) AS c FROM documents d JOIN jurisdictions j ON d.jurisdiction_id=j.id WHERE j.country='US'");
    const vnDoc = stmt("SELECT COUNT(*) AS c FROM documents d JOIN jurisdictions j ON d.jurisdiction_id=j.id WHERE j.country='VN'");
    const usCase = stmt("SELECT COUNT(*) AS c FROM cases WHERE country='US'");
    const vnCase = stmt("SELECT COUNT(*) AS c FROM cases WHERE country='VN'");

    console.log('\n  Database: SQLite');
    console.log('  ─────────────────────────────');
    console.log(`  Documents total:    ${docs.c}`);
    console.log(`    US documents:     ${usDoc.c}`);
    console.log(`    VN documents:     ${vnDoc.c}`);
    console.log(`  Document versions:  ${vers.c}`);
    console.log(`  Cases total:        ${cases.c}`);
    console.log(`    US cases:         ${usCase.c}`);
    console.log(`    VN cases:         ${vnCase.c}`);
    console.log('');
  } else {
    const pool = dbInit.pool;
    const q = async (sql) => (await pool.query(sql)).rows[0];
    const docs = await q('SELECT COUNT(*) AS c FROM documents');
    const vers = await q('SELECT COUNT(*) AS c FROM document_versions');
    const cases = await q('SELECT COUNT(*) AS c FROM cases');
    console.log('\n  Database: PostgreSQL');
    console.log('  ─────────────────────────────');
    console.log(`  Documents total:    ${docs.c}`);
    console.log(`  Document versions:  ${vers.c}`);
    console.log(`  Cases total:        ${cases.c}`);
    console.log('');
    pool.end();
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

async function runSource(name, opts) {
  const info = SOURCES[name];
  if (!info) {
    console.error(`Unknown source: ${name}. Use --list to see available sources.`);
    return;
  }
  if (info.key && !process.env[info.key]) {
    console.log(`  SKIP ${name}: ${info.key} not set in .env`);
    return;
  }

  console.log(`\n  Starting: ${info.label}`);
  console.log(`  Limit: ${opts.limit || 'default'}`);
  const start = Date.now();

  try {
    const mod = require(info.file);
    const passOpts = { limit: opts.limit ? parseInt(opts.limit, 10) : undefined };
    if (opts.collection) passOpts.collection = opts.collection;
    if (opts.titles) passOpts.titles = opts.titles;
    const result = await mod.run(passOpts);
    const elapsed = Date.now() - start;
    console.log(`  Done: ${result?.imported || 0} imported in ${formatDuration(elapsed)}`);
  } catch (e) {
    console.error(`  ERROR in ${name}:`, e.message);
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.list) {
    printSources();
    return;
  }

  if (args.status) {
    await printStatus();
    return;
  }

  if (!args.source && !args.all) {
    console.log('\n  Toàn thư luật pháp — Data Import CLI\n');
    console.log('  Usage:');
    console.log('    node server/jobs/import-cli.js --source <name> [--limit N]');
    console.log('    node server/jobs/import-cli.js --all [--limit N]');
    console.log('    node server/jobs/import-cli.js --list');
    console.log('    node server/jobs/import-cli.js --status\n');
    printSources();
    return;
  }

  const { initDb } = require('../db/init');
  await initDb();

  console.log('\n  ════════════════════════════════════════════');
  console.log('  Toàn thư luật pháp — Data Import');
  console.log('  ════════════════════════════════════════════');

  const totalStart = Date.now();

  if (args.all) {
    for (const name of Object.keys(SOURCES)) {
      await runSource(name, args);
    }
  } else {
    await runSource(args.source, args);
  }

  console.log(`\n  Total time: ${formatDuration(Date.now() - totalStart)}`);
  console.log('  ════════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
