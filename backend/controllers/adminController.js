const db = require('../config/db');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.user_id, u.full_name, u.email, u.created_at, r.role_name
       FROM users u JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { full_name, email, password, role_id, roll_no, department, academic_year } = req.body;
    const [exists] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(400).json({ success: false, message: 'Email already exists' });

    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, SHA2(?,256), ?)',
      [full_name, email, password, role_id]
    );
    if (parseInt(role_id) === 1) {
      await db.query(
        'INSERT INTO student_profiles (user_id, roll_no, department, academic_year) VALUES (?, ?, ?, ?)',
        [result.insertId, roll_no, department, academic_year]
      );
    }
    res.status(201).json({ success: true, message: 'User created', user_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getGuides = async (req, res) => {
  try {
    const [guides] = await db.query(
      `SELECT u.user_id, u.full_name, u.email FROM users u
       JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'guide'`
    );
    res.json({ success: true, data: guides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT u.user_id, u.full_name, u.email, sp.roll_no, sp.department, sp.academic_year, sp.group_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
       WHERE r.role_name = 'student'`
    );
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT al.*, u.full_name FROM audit_logs al
       LEFT JOIN users u ON al.action_by = u.user_id
       ORDER BY al.action_date DESC LIMIT 200`
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [[students]] = await db.query(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id=r.role_id WHERE r.role_name='student'`);
    const [[guides]] = await db.query(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id=r.role_id WHERE r.role_name='guide'`);
    const [[projects]] = await db.query(`SELECT COUNT(*) as count FROM project_groups`);
    const [[files]] = await db.query(`SELECT COUNT(*) as count FROM project_files`);
    const [[pending]] = await db.query(`SELECT COUNT(*) as count FROM project_files WHERE status='pending'`);
    const [[approved]] = await db.query(`SELECT COUNT(*) as count FROM project_files WHERE status='approved'`);
    const [[meetings]] = await db.query(`SELECT COUNT(*) as count FROM meeting_logs`);
    res.json({ success: true, data: { students: students.count, guides: guides.count, projects: projects.count, files: files.count, pending: pending.count, approved: approved.count, meetings: meetings.count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const [notifs] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.user_id]
    );
    res.json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.user_id]);
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllUsers, createUser, deleteUser, getGuides, getStudents, getAuditLogs, getDashboardStats, getNotifications, markNotificationsRead };