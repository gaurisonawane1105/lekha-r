const db = require('../config/db');

const getAllProjects = async (req, res) => {
  try {
    const { role_name, user_id } = req.user;
    let query = `
      SELECT pg.*, u.full_name as guide_name,
        COUNT(DISTINCT sp.student_id) as student_count,
        COUNT(DISTINCT pf.file_id) as file_count
      FROM project_groups pg
      LEFT JOIN users u ON pg.guide_id = u.user_id
      LEFT JOIN student_profiles sp ON pg.group_id = sp.group_id
      LEFT JOIN project_files pf ON pg.group_id = pf.group_id
    `;
    let params = [];

    if (role_name === 'guide') {
      query += ' WHERE pg.guide_id = ?';
      params.push(user_id);
    } else if (role_name === 'student') {
      query += ' WHERE pg.group_id IN (SELECT group_id FROM student_profiles WHERE user_id = ?)';
      params.push(user_id);
    }
    query += ' GROUP BY pg.group_id ORDER BY pg.created_at DESC';

    const [groups] = await db.query(query, params);
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const [groups] = await db.query(
      `SELECT pg.*, u.full_name as guide_name, u.email as guide_email
       FROM project_groups pg
       LEFT JOIN users u ON pg.guide_id = u.user_id
       WHERE pg.group_id = ?`,
      [req.params.id]
    );
    if (!groups.length) return res.status(404).json({ success: false, message: 'Project not found' });

    const [students] = await db.query(
      `SELECT sp.*, u.full_name, u.email FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id WHERE sp.group_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...groups[0], students } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { group_name, project_topic, guide_id, academic_year, department } = req.body;
    const [result] = await db.query(
      'INSERT INTO project_groups (group_name, project_topic, guide_id, academic_year, department) VALUES (?, ?, ?, ?, ?)',
      [group_name, project_topic, guide_id, academic_year, department]
    );
    await db.query(
      'INSERT INTO audit_logs (table_name, record_id, action, action_by, details) VALUES (?, ?, ?, ?, ?)',
      ['project_groups', result.insertId, 'CREATE', req.user.user_id, `Project created: ${group_name}`]
    );
    res.status(201).json({ success: true, message: 'Project group created', group_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { group_name, project_topic, guide_id, status, academic_year, department } = req.body;
    await db.query(
      'UPDATE project_groups SET group_name=?, project_topic=?, guide_id=?, status=?, academic_year=?, department=? WHERE group_id=?',
      [group_name, project_topic, guide_id, status, academic_year, department, req.params.id]
    );
    res.json({ success: true, message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addStudentToGroup = async (req, res) => {
  try {
    const { user_id } = req.body;
    const group_id = req.params.id;
    await db.query('UPDATE student_profiles SET group_id = ? WHERE user_id = ?', [group_id, user_id]);
    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [user_id, `You have been added to project group ${group_id}`]
    );
    res.json({ success: true, message: 'Student added to group' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllProjects, getProjectById, createProject, updateProject, addStudentToGroup };
