
const adminAuth = (req, res, next) => {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers['x-admin-key'];

  if (!adminKey) {
    return res.status(500).json({ error: 'Admin key not configured' });
  }

  if (!providedKey || providedKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
  }

  next();
};

module.exports = adminAuth;