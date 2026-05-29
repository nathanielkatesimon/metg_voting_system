const express = require('express');
const multer = require('multer');
const { Readable } = require('stream');
const csvParser = require('csv-parser');
const User = require('../../models/User');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  },
  limits: { fileSize: 1 * 1024 * 1024 },
});

// POST /api/admin/users/import — bulk import voters from CSV
router.post('/import', csvUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded.' });

    const rows = await new Promise((resolve, reject) => {
      const results = [];
      Readable.from(req.file.buffer)
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', row => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    if (rows.length === 0) return res.status(400).json({ message: 'CSV file is empty.' });

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-based + header row
      const row = rows[i];
      const fullName = row.fullname?.trim();
      const voterId = row.voterid?.trim();
      const password = row.password?.trim();

      if (!fullName || !voterId || !password) {
        errors.push({ row: rowNum, reason: 'fullName, voterId, and password are required.' });
        continue;
      }
      if (password.length < 8) {
        errors.push({ row: rowNum, reason: 'Password must be at least 8 characters.' });
        continue;
      }

      const existing = await User.findOne({ voterId });
      if (existing) {
        skipped++;
        continue;
      }

      await User.create({ fullName, voterId, password, role: 'voter' });
      created++;
    }

    res.json({ created, skipped, errors });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users — create a new voter account
router.post('/', async (req, res, next) => {
  try {
    const { fullName, voterId, password } = req.body;
    if (!fullName?.trim() || !voterId?.trim() || !password) {
      return res.status(400).json({ message: 'fullName, voterId, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ voterId: voterId.trim() });
    if (existing) return res.status(409).json({ message: 'Voter ID already exists.' });

    const user = await User.create({
      fullName: fullName.trim(),
      voterId: voterId.trim(),
      password,
      role: 'voter',
    });

    const { password: _, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users?page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role: 'voter' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ role: 'voter' }),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id — update voter's name, voterId, or password
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot edit an admin account.' });

    const { fullName, voterId, password } = req.body;
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (voterId !== undefined) {
      const conflict = await User.findOne({ voterId: voterId.trim(), _id: { $ne: user._id } });
      if (conflict) return res.status(409).json({ message: 'Voter ID already in use.' });
      user.voterId = voterId.trim();
    }
    if (password) {
      if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      user.password = password;
    }

    await user.save();
    const { password: _, ...safe } = user.toObject();
    res.json(safe);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin account.' });

    await user.deleteOne();
    res.json({ message: 'Voter deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
