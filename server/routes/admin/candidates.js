const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Candidate = require('../../models/Candidate');
const Position = require('../../models/Position');
const upload = require('../../middleware/upload');
const { requireAdmin } = require('../../middleware/auth');

router.use(requireAdmin);

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be under 2 MB.' });
    }
    return res.status(400).json({ message: err.message || 'Invalid file.' });
  });
}

function cleanupFile(file) {
  if (file) {
    try { fs.unlinkSync(file.path); } catch {}
  }
}

router.post('/', handleUpload, async (req, res, next) => {
  try {
    const { name, party, platform, electionId, positionId } = req.body;

    if (!name?.trim() || !electionId || !positionId) {
      cleanupFile(req.file);
      return res.status(400).json({ message: 'name, electionId, and positionId are required.' });
    }

    const position = await Position.findOne({ _id: positionId, electionId });
    if (!position) {
      cleanupFile(req.file);
      return res.status(400).json({ message: 'Position does not belong to this election.' });
    }

    const candidate = await Candidate.create({
      electionId,
      positionId,
      name: name.trim(),
      party: party?.trim() || '',
      platform: platform?.trim() || '',
      imagePath: req.file ? `/uploads/candidates/${req.file.filename}` : null,
    });

    res.status(201).json(candidate);
  } catch (err) {
    cleanupFile(req.file);
    next(err);
  }
});

router.put('/:id', handleUpload, async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      cleanupFile(req.file);
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    const { name, party, platform } = req.body;
    if (name !== undefined) candidate.name = name.trim();
    if (party !== undefined) candidate.party = party.trim();
    if (platform !== undefined) candidate.platform = platform.trim();

    if (req.file) {
      if (candidate.imagePath) {
        const old = path.join(__dirname, '../../', candidate.imagePath);
        try { fs.unlinkSync(old); } catch {}
      }
      candidate.imagePath = `/uploads/candidates/${req.file.filename}`;
    }

    await candidate.save();
    res.json(candidate);
  } catch (err) {
    cleanupFile(req.file);
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });

    if (candidate.imagePath) {
      const filePath = path.join(__dirname, '../../', candidate.imagePath);
      try { fs.unlinkSync(filePath); } catch {}
    }

    await candidate.deleteOne();
    res.json({ message: 'Candidate deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
