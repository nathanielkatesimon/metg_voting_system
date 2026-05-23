const express = require('express');
const router = express.Router();
const Election = require('../../models/Election');
const { requireAdmin } = require('../../middleware/auth');

router.use(requireAdmin);

router.post('/', async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required.' });

    const election = await Election.create({
      title: title.trim(),
      description: description?.trim() || '',
      startDate: startDate || null,
      endDate: endDate || null,
      createdBy: req.user._id,
    });
    res.status(201).json(election);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const elections = await Election.find({ deletedAt: null }).sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.id, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });

    const { title, description, startDate, endDate } = req.body;
    if (title !== undefined) election.title = title.trim();
    if (description !== undefined) election.description = description.trim();
    if (startDate !== undefined) election.startDate = startDate || null;
    if (endDate !== undefined) election.endDate = endDate || null;

    await election.save();
    res.json(election);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.id, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status === 'active') {
      return res.status(400).json({ message: 'Cannot delete an active election. Close it first.' });
    }

    election.deletedAt = new Date();
    await election.save();
    res.json({ message: 'Election deleted.' });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/open', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.id, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status !== 'upcoming') {
      return res.status(400).json({ message: `Cannot open an election with status "${election.status}".` });
    }

    election.status = 'active';
    await election.save();
    res.json(election);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/close', async (req, res, next) => {
  try {
    const election = await Election.findOne({ _id: req.params.id, deletedAt: null });
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status !== 'active') {
      return res.status(400).json({ message: `Cannot close an election with status "${election.status}".` });
    }

    election.status = 'closed';
    await election.save();
    res.json(election);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
