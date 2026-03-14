const express = require('express');
const router = express.Router();

const search = require('./search');
const documents = require('./documents');
const cases = require('./cases');
const jurisdictions = require('./jurisdictions');

router.use('/search', search);
router.use('/documents', documents);
router.use('/cases', cases);
router.use('/jurisdictions', jurisdictions);

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'toanthuluat' });
});

module.exports = router;
