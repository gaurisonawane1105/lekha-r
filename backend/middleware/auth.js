const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      `SELECT u.*, LOWER(r.role_name) as role_name
       FROM users u JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [decoded.user_id]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  // Support both lowercase and uppercase role comparison
  const userRole = (req.user.role_name || '').toLowerCase();
  const allowedRoles = roles.map(r => r.toLowerCase());
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

module.exports = { authenticate, authorize };
