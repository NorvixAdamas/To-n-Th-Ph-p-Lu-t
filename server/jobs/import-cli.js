#!/usr/bin/env node
require('dotenv').config();

const SOURCES = {
  congress: { file: './sync-congress', key: 'CONGRESS_API_KEY', label: 'Congress.gov (US Bills)' },
  govinfo: { file: './sync-govinfo', key: 'GOVINFO_API_KEY', label: 'GovInfo (USC, CFR, FR, PLAW)' },
  ecfr: { file: './sync-ecfr', key: null, label: 'eCFR (Federal Regulations)' },
  openlaws: { file: './sync-openlaws', key: 'OPENLAWS_API_KEY', label: 'OpenLaws (US Statutes)' },
  courtlistener: { file: './sync-courtlistener', key: 'COURTLISTENER_TOKEN', label: 'CourtListener (US Case Law)' },
  vbpl: { file: './sync-vn', key: null, label: 'VBPL.vn (Vietnam Legal Docs)' },
  'vn-caselaw': { file: './crawl-vn-caselaw', key: null, label: 'VN Case Law Crawler' },
  manual: { file: './import-manual', key: null, label: 'Manual JSON import (official links, summaries, many countries)' },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--all') args.all = true;
    else if (item === '--list') args.list = true;
    else if (item === '--status') args.status = true;
    else if (item.startsWith('--')) {
      const key = item.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function printSources() {
  console.log('\nAvailable sources:\n');
  Object.keys(SOURCES).forEach(function (name) {
    const info = SOURCES[name];
    const status = info.key ? (process.env[info.key] ? 'key-set' : 'key-missing') : 'no-key';
    console.log(' - ' + name + ' [' + status + '] ' + info.label);
  });
  console.log('\nUsage: node server/jobs/import-cli.js --source <name> [--limit N] [--file data/manual-content.json]\n');
}

async function printStatus() {
  const { initDb } = require('../db/init');
  await initDb();
  const dbInit = require('../db/init');

  if (dbInit.useSqlite) {
    const db = dbInit.sqliteDb;
    const stmt = function (sql) {
      const s = db.prepare(sql);
      s.step();
      const row = s.getAsObject();
      s.free();
      return row;
    };
    console.log('\nDatabase: SQLite');
    console.log('Documents:', stmt('SELECT COUNT(*) AS c FROM documents').c);
    console.log('Versions:', stmt('SELECT COUNT(*) AS c FROM document_versions').c);
    console.log('Cases:', stmt('SELECT COUNT(*) AS c FROM cases').c);
  } else {
    const pool = dbInit.pool;
    const one = async function (sql) { return (await pool.query(sql)).rows[0]; };
    console.log('\nDatabase: PostgreSQL');
    console.log('Documents:', (await one('SELECT COUNT(*) AS c FROM documents')).c);
    console.log('Versions:', (await one('SELECT COUNT(*) AS c FROM document_versions')).c);
    console.log('Cases:', (await one('SELECT COUNT(*) AS c FROM cases')).c);
    await pool.end();
  }
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
}

async function runSource(name, opts) {
  const info = SOURCES[name];
  if (!info) {
    console.error('Unknown source:', name);
    return;
  }
  if (info.key && !process.env[info.key]) {
    console.log('Skip', name + ':', info.key, 'not set');
    return;
  }

  const mod = require(info.file);
  const passOpts = {};
  if (opts.limit) passOpts.limit = parseInt(opts.limit, 10);
  if (opts.collection) passOpts.collection = opts.collection;
  if (opts.titles) passOpts.titles = opts.titles;
  if (opts.file) passOpts.file = opts.file;

  console.log('\nStarting:', info.label);
  const start = Date.now();
  const result = await mod.run(passOpts);
  console.log('Done:', result && typeof result.imported !== 'undefined' ? result.imported : 0, 'imported in', formatDuration(Date.now() - start));
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
    printSources();
    return;
  }

  const { initDb } = require('../db/init');
  await initDb();

  if (args.all) {
    for (const name of Object.keys(SOURCES)) {
      await runSource(name, args);
    }
  } else {
    await runSource(args.source, args);
  }
}

main().catch(function (err) {
  console.error('Fatal:', err.message);
  process.exit(1);
});
