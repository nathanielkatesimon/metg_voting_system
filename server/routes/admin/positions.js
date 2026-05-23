const express = require('express');
const router = express.Router();
const Position = require('../../models/Position');
const Election = require('../../models/Election');
const Vote = require('../../models/Vote');
const { requireAdmin } = require('../../middleware/auth');

router.use(requireAdmin);

// POST /api/admin/elections/:electionId/positions
router.post('/elections/:electionId/positions', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.electionId, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status === 'closed') {
      return res.status(400).json({ message: 'Cannot add positions to a closed election.' });
    }

    const { name, order, seats } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Position name is required.' });
    if (seats !== undefined && (typeof seats !== 'number' || seats < 1 || !Number.isInteger(seats))) {
      return res.status(400).json({ message: 'Seats must be a positive integer.' });
    }

    const position = await Position.create({
      electionId: req.params.electionId,
      name: name.trim(),
      order: order ?? 0,
      seats: seats ?? 1,
    });
    res.status(201).json(position);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/positions/:id
router.put('/positions/:id', async (req, res, next) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found.' });

    const { name, order, seats } = req.body;
    if (name !== undefined) position.name = name.trim();
    if (order !== undefined) position.order = order;
    if (seats !== undefined) {
      if (typeof seats !== 'number' || seats < 1 || !Number.isInteger(seats)) {
        return res.status(400).json({ message: 'Seats must be a positive integer.' });
      }
      position.seats = seats;
    }

    await position.save();
    res.json(position);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/positions/:id
router.delete('/positions/:id', async (req, res, next) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found.' });

    const hasVotes = await Vote.exists({ positionId: req.params.id });
    if (hasVotes) {
      return res.status(400).json({ message: 'Cannot delete a position that has votes cast.' });
    }

    await position.deleteOne();
    res.json({ message: 'Position deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
