const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const elections = await Election.find({ deletedAt: null }).sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.id, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    res.json(election);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
