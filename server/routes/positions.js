const express = require('express');
const router = express.Router();
const Position = require('../models/Position');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/elections/:electionId/positions
router.get('/:electionId/positions', async (req, res, next) => {
  try {
    const positions = await Position.find({ electionId: req.params.electionId }).sort({ order: 1, createdAt: 1 });
    res.json(positions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
