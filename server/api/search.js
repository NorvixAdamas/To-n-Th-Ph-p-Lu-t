const express = require('express');
const router = express.Router();
const { searchDocuments } = require('../db/queries');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const country = req.query.country || '';
    const type = req.query.type || '';
    const effective2026 = req.query.effective2026 === '1';
    const taxOnly = req.query.tax === '1';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const results = await searchDocuments({ q, country, type, effective2026, taxOnly, limit, offset });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
