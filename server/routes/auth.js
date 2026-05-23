const express = require('express');
const passport = require('passport');
const User = require('../models/User');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, voterId, password } = req.body;

    if (!fullName || !voterId || !password) {
      return res.status(400).json({ message: 'fullName, voterId, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ voterId: voterId.trim() });
    if (existing) {
      return res.status(409).json({ message: 'A voter with this ID already exists.' });
    }

    const user = await User.create({ fullName, voterId: voterId.trim(), password, role: 'voter' });

    return res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      voterId: user.voterId,
      role: user.role,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Invalid email or password.' });

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        voterId: user.voterId,
        role: user.role,
      });
    });
  })(req, res, next);
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out.' });
    });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  const { _id, fullName, voterId, role } = req.user;
  return res.status(200).json({ _id, fullName, voterId, role });
});

module.exports = router;
