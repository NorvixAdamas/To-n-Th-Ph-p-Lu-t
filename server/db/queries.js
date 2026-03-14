/**
 * Load PG or SQLite queries depending on init result (useSqlite set after initDb()).
 */
const init = require('./init');

const queries = init.useSqlite ? require('./queries-sqlite') : require('./queries-pg');
module.exports = queries;
