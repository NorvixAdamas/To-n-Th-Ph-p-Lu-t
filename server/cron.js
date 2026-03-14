/**
 * Cron: run sync daily at 02:00 (Asia/Ho_Chi_Minh).
 * Load this from server/index.js if ENABLE_CRON=1.
 */
const cron = require('node-cron');

function scheduleSync() {
  cron.schedule('0 2 * * *', function () {
    const { run } = require('./jobs/sync-all');
    run().catch((e) => console.error('Cron sync error:', e));
  }, { timezone: 'Asia/Ho_Chi_Minh' });
  console.log('Cron: sync scheduled daily at 02:00 (Asia/Ho_Chi_Minh).');
}

module.exports = { scheduleSync };
