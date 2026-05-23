const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const { requireVoter } = require('../middleware/auth');

// POST /api/votes
router.post('/votes', requireVoter, async (req, res, next) => {
  try {
    const { electionId, positionId, candidateId } = req.body;
    if (!electionId || !positionId || !candidateId) {
      return res.status(400).json({ message: 'electionId, positionId, and candidateId are required.' });
    }

    const election = await Election.findOne({ _id: electionId, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status !== 'active') {
      return res.status(400).json({ message: 'Election is not active.' });
    }

    const position = await Position.findOne({ _id: positionId, electionId });
    if (!position) return res.status(400).json({ message: 'Position does not belong to this election.' });

    const candidate = await Candidate.findOne({ _id: candidateId, positionId });
    if (!candidate) return res.status(400).json({ message: 'Candidate does not belong to this position.' });

    const existing = await Vote.exists({ electionId, positionId, voterId: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already voted for this position.' });

    const vote = await Vote.create({ electionId, positionId, candidateId, voterId: req.user._id });
    res.status(201).json(vote);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already voted for this position.' });
    }
    next(err);
  }
});

// GET /api/elections/:electionId/my-votes
router.get('/elections/:electionId/my-votes', requireVoter, async (req, res, next) => {
  try {
    const votes = await Vote.find({
      electionId: req.params.electionId,
      voterId: req.user._id,
    }).select('positionId candidateId');
    res.json(votes.map(v => ({ positionId: v.positionId, candidateId: v.candidateId })));
  } catch (err) {
    next(err);
  }
});

// GET /api/my-votes
router.get('/my-votes', requireVoter, async (req, res, next) => {
  try {
    const votes = await Vote.find({ voterId: req.user._id })
      .populate('electionId', 'title status')
      .populate('positionId', 'name order')
      .populate('candidateId', 'name party imagePath')
      .sort({ timestamp: -1 });

    const grouped = {};
    for (const v of votes) {
      const eId = v.electionId._id.toString();
      if (!grouped[eId]) {
        grouped[eId] = { election: v.electionId, votes: [] };
      }
      grouped[eId].votes.push({
        position: v.positionId,
        candidate: v.candidateId,
        timestamp: v.timestamp,
      });
    }
    res.json(Object.values(grouped));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
