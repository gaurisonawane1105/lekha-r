const jwt = require('jsonwebtoken');
const db = require('../config/db');

const register = async (req, res) => {
  try {
    const { full_name, email, password, role_id, roll_no } = req.body;
    const [exists] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ success: false, message: 'Email already registered' });

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, SHA2(?,256), ?)',
      [full_name, email, password, role_id]
    );
    const userId = result.insertId;

    if (parseInt(role_id) === 1) {
      await db.query(
        'INSERT INTO student_profiles (user_id, roll_no) VALUES (?, ?)',
        [userId, roll_no || '']
      );
    }

    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      `SELECT u.*, LOWER(r.role_name) as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ?
       AND (u.password_hash = SHA2(?,256) OR u.password_hash = ?)`,
      [email, password, password]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password_hash, ...userData } = user;
    res.json({ success: true, token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, LOWER(r.role_name) as role_name
       FROM users u JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const { password_hash, ...userData } = rows[0];
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe };
