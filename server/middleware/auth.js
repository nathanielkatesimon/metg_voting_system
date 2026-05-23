function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

function requireVoter(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (req.user.role !== 'voter') {
    return res.status(403).json({ message: 'Voter access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireVoter };
