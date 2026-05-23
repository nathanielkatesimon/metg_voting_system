const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

async function fetchResultsData(electionId) {
  const [positions, candidates, voteCounts] = await Promise.all([
    Position.find({ electionId }).sort({ order: 1, createdAt: 1 }),
    Candidate.find({ electionId }),
    Vote.aggregate([
      { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: { positionId: '$positionId', candidateId: '$candidateId' }, count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = {};
  for (const vc of voteCounts) {
    const key = `${vc._id.positionId}-${vc._id.candidateId}`;
    countMap[key] = vc.count;
  }

  const candidatesByPosition = {};
  for (const c of candidates) {
    const pid = c.positionId.toString();
    if (!candidatesByPosition[pid]) candidatesByPosition[pid] = [];
    candidatesByPosition[pid].push(c);
  }

  return positions.map(pos => {
    const pid = pos._id.toString();
    const positionCandidates = (candidatesByPosition[pid] || [])
      .map(c => ({
        candidateId: c._id,
        name: c.name,
        party: c.party,
        imagePath: c.imagePath,
        voteCount: countMap[`${pid}-${c._id.toString()}`] || 0,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    return {
      positionId: pos._id,
      positionName: pos.name,
      seats: pos.seats ?? 1,
      candidates: positionCandidates,
    };
  });
}

// GET /api/elections/:id/results
router.get('/:id/results', requireAuth, async (req, res, next) => {
  try {
    const results = await fetchResultsData(req.params.id);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/elections/:id/stats
router.get('/:id/stats', requireAdmin, async (req, res, next) => {
  try {
    const [totalVoters, voterIds] = await Promise.all([
      User.countDocuments({ role: 'voter' }),
      Vote.distinct('voterId', { electionId: req.params.id }),
    ]);
    const participatingVoters = voterIds.length;
    const turnout = totalVoters > 0
      ? ((participatingVoters / totalVoters) * 100).toFixed(1)
      : '0.0';

    res.json({ totalVoters, participatingVoters, turnout });
  } catch (err) {
    next(err);
  }
});

// GET /api/elections/:id/export/results
router.get('/:id/export/results', requireAdmin, async (req, res, next) => {
  try {
    const results = await fetchResultsData(req.params.id);

    const rows = ['Position,Candidate,Party,Votes,Percentage'];
    for (const pos of results) {
      const totalVotes = pos.candidates.reduce((sum, c) => sum + c.voteCount, 0);
      for (const c of pos.candidates) {
        const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0';
        const escape = str => `"${String(str).replace(/"/g, '""')}"`;
        rows.push(`${escape(pos.positionName)},${escape(c.name)},${escape(c.party || '')},${c.voteCount},${pct}%`);
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="election-results-${req.params.id}.csv"`);
    res.send(rows.join('\n'));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
