const express = require('express');
const router = express.Router();
const { getCaseById, searchCases } = require('../db/queries');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const country = req.query.country || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const results = await searchCases({ q, country, limit, offset });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const c = await getCaseById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
