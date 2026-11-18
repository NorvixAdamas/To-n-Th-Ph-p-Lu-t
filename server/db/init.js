const path = require('path');
const { Pool } = require('pg');

let _pool = null;
let dbReady = false;
let useSqlite = false;
let sqliteDb = null;

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toanthuluat',
    max: 10,
  });
}

async function initSqlite() {
  const initSqlJs = require('sql.js');
  const fs = require('fs');
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', '..', 'data', 'toanthuluat.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) {
    sqliteDb = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    sqliteDb = new SQL.Database();
  }
  const { runSchema } = require('./sqlite-schema');
  runSchema(sqliteDb);
  fs.writeFileSync(dbPath, Buffer.from(sqliteDb.export()));
  useSqlite = true;
  dbReady = true;
  _pool = null;
  console.log('Dang dung SQLite: ' + dbPath);
  return null;
}

async function initDb() {
  if (process.env.SQLITE_ONLY === '1') {
    return initSqlite();
  }

  try {
    _pool = createPool();
    const client = await _pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
    dbReady = true;
    useSqlite = false;
    return _pool;
  } catch (err) {
    try {
      return initSqlite();
    } catch (sqliteErr) {
      dbReady = false;
      throw err;
    }
  }
}

module.exports = {
  get pool() {
    return _pool;
  },
  initDb,
  get dbReady() {
    return dbReady;
  },
  get useSqlite() {
    return useSqlite;
  },
  get sqliteDb() {
    return sqliteDb;
  },
};
