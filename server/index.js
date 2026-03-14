/**
 * Toàn thư luật pháp - Server
 * HTML/CSS/JS frontend served as static; REST API for data.
 * Nếu không kết nối được PostgreSQL thì tự dùng SQLite (file data/toanthuluat.sqlite).
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const dbInit = require('./db/init');
const { initDb } = dbInit;

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');

async function main() {
  try {
    await initDb();
  } catch (err) {
    console.error('Database:', err.message);
    console.error('Sửa .env (DATABASE_URL) hoặc dùng SQLite (tự tạo khi PG lỗi).\n');
  }

  const app = express();
  const api = require('./api');
  app.use(cors());
  app.use(compression());
  app.use(express.json());

  // Static HTML/CSS/JS
  app.use(express.static(PUBLIC, { maxAge: '1d' }));

  // REST API (503 nếu chưa kết nối DB)
  app.use('/api', (req, res, next) => {
    if (!dbInit.dbReady) {
      return res.status(503).json({
        error: 'Chưa kết nối database. Sửa .env (DATABASE_URL) rồi khởi động lại server.',
      });
    }
    next();
  });
  app.use('/api', api);

  if (process.env.ENABLE_CRON === '1') {
    require('./cron').scheduleSync();
  }

  // SPA fallback: all non-file routes serve index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const ext = path.extname(req.path);
    if (ext) return next();
    res.sendFile(path.join(PUBLIC, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log('Toàn thư luật pháp running at http://localhost:' + PORT);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
