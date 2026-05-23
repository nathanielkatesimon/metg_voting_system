const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/elections/:electionId/candidates?positionId=...
router.get('/:electionId/candidates', async (req, res, next) => {
  try {
    const filter = { electionId: req.params.electionId };
    if (req.query.positionId) filter.positionId = req.query.positionId;

    const candidates = await Candidate.find(filter);
    res.json(candidates);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
