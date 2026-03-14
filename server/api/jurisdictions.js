const express = require('express');
const router = express.Router();
const { listJurisdictions } = require('../db/queries');

router.get('/', async (req, res) => {
  try {
    const country = req.query.country || '';
    const list = await listJurisdictions(country || null);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
