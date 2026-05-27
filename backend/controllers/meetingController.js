const db = require('../config/db');

const getMeetingsByGroup = async (req, res) => {
  try {
    const [meetings] = await db.query(
      `SELECT ml.*, u.full_name as created_by_name
       FROM meeting_logs ml
       LEFT JOIN users u ON ml.created_by = u.user_id
       WHERE ml.group_id = ?
       ORDER BY ml.meet_date DESC`,
      [req.params.group_id]
    );
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { group_id, meet_date, topic, suggestions } = req.body;
    const [result] = await db.query(
      'INSERT INTO meeting_logs (group_id, meet_date, topic, suggestions, created_by) VALUES (?, ?, ?, ?, ?)',
      [group_id, meet_date, topic, suggestions, req.user.user_id]
    );

    const [group] = await db.query('SELECT guide_id FROM project_groups WHERE group_id = ?', [group_id]);
    if (group.length && group[0].guide_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [group[0].guide_id, `New meeting log added by ${req.user.full_name} for group ${group_id}`]
      );
    }

    res.status(201).json({ success: true, message: 'Meeting log created', meet_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const reviewMeeting = async (req, res) => {
  try {
    const { comment_from_guide, is_verified } = req.body;
    await db.query(
      'UPDATE meeting_logs SET comment_from_guide = ?, is_verified = ? WHERE meet_id = ?',
      [comment_from_guide, is_verified, req.params.meet_id]
    );

    const [meet] = await db.query(
      `SELECT ml.created_by, ml.topic FROM meeting_logs ml WHERE ml.meet_id = ?`,
      [req.params.meet_id]
    );
    if (meet.length) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [meet[0].created_by, `Your meeting log "${meet[0].topic}" has been reviewed by your guide.`]
      );
    }

    res.json({ success: true, message: 'Meeting log reviewed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMeetingsByGroup, createMeeting, reviewMeeting };
