const path = require('path');
const fs = require('fs');
async function check() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const dbPath = path.join('d:', 'Code folder', 'toanthuluat', 'data', 'toanthuluat.sqlite');
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const r = db.exec("SELECT country, COUNT(*) FROM jurisdictions j JOIN documents d ON j.id = d.jurisdiction_id GROUP BY country");
  console.log(JSON.stringify(r[0].values, null, 2));
}
check().catch(console.error);
