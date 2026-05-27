const multer = require('multer');
const db = require('../config/db');

// Store file in memory (then save to DB as BLOB)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.txt', '.png', '.jpg', '.jpeg'];
  const ext = require('path').extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File type not allowed. Use PDF, DOC, DOCX, PPT, ZIP, or images.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 52428800 } // 50MB
});

// Upload file - stored in MySQL as BLOB
const uploadFile = async (req, res) => {
  try {
    const group_id = req.params.group_id;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { originalname, mimetype, size, buffer } = req.file;
    const ext = require('path').extname(originalname).toLowerCase();

    // Get next version number for this group
    const [versions] = await db.query(
      'SELECT COALESCE(MAX(version), 0) + 1 as next_v FROM project_files WHERE group_id = ?',
      [group_id]
    );
    const version = versions[0].next_v;

    const [result] = await db.query(
      `INSERT INTO project_files 
       (group_id, file_name, file_type, file_size, file_data, uploaded_by, version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [group_id, originalname, ext, size, buffer, req.user.user_id, version]
    );

    // Notify guide
    const [group] = await db.query('SELECT guide_id, group_name FROM project_groups WHERE group_id = ?', [group_id]);
    if (group.length && group[0].guide_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [group[0].guide_id, `📄 New file uploaded: "${originalname}" by ${req.user.full_name} in group "${group[0].group_name}"`]
      );
    }

    await db.query(
      'INSERT INTO audit_logs (table_name, record_id, action, action_by, details) VALUES (?, ?, ?, ?, ?)',
      ['project_files', result.insertId, 'UPLOAD', req.user.user_id, `File uploaded: ${originalname} (v${version})`]
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file_id: result.insertId,
      version
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get files list for a group (no BLOB - just metadata)
const getFilesByGroup = async (req, res) => {
  try {
    const [files] = await db.query(
      `SELECT f.file_id, f.group_id, f.file_name, f.file_type, f.file_size,
              f.upload_date, f.version, f.status, f.is_verified, f.comment_from_guide,
              u.full_name as uploaded_by_name
       FROM project_files f
       JOIN users u ON f.uploaded_by = u.user_id
       WHERE f.group_id = ?
       ORDER BY f.upload_date DESC`,
      [req.params.group_id]
    );
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Guide reviews a file (approve / reject / revision_needed)
const reviewFile = async (req, res) => {
  try {
    const { status, comment_from_guide } = req.body;
    const file_id = req.params.file_id;
    const validStatuses = ['approved', 'rejected', 'revision_needed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const is_verified = status === 'approved';

    await db.query(
      'UPDATE project_files SET status=?, comment_from_guide=?, is_verified=? WHERE file_id=?',
      [status, comment_from_guide || '', is_verified, file_id]
    );

    // Notify uploader
    const [file] = await db.query(
      `SELECT f.uploaded_by, f.file_name, u.full_name as guide_name
       FROM project_files f
       JOIN users u ON u.user_id = ?
       WHERE f.file_id = ?`,
      [req.user.user_id, file_id]
    );
    if (file.length) {
      const statusMsg = status === 'approved' ? '✅ Approved' : status === 'rejected' ? '❌ Rejected' : '🔁 Revision Needed';
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [file[0].uploaded_by,
         `${statusMsg}: Your file "${file[0].file_name}" was reviewed by ${req.user.full_name}. ${comment_from_guide ? 'Comment: ' + comment_from_guide : ''}`]
      );
    }

    await db.query(
      'INSERT INTO audit_logs (table_name, record_id, action, action_by, details) VALUES (?, ?, ?, ?, ?)',
      ['project_files', file_id, 'REVIEW', req.user.user_id, `Status set to ${status}`]
    );

    res.json({ success: true, message: `File ${status} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download file from DB BLOB
const downloadFile = async (req, res) => {
  try {
    const [files] = await db.query(
      'SELECT file_name, file_type, file_data FROM project_files WHERE file_id = ?',
      [req.params.file_id]
    );
    if (!files.length) return res.status(404).json({ success: false, message: 'File not found' });

    const file = files[0];
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.zip': 'application/zip',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.txt': 'text/plain',
    };

    const mime = mimeTypes[file.file_type] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.send(file.file_data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// View file inline (for PDF preview in browser)
const viewFile = async (req, res) => {
  try {
    const [files] = await db.query(
      'SELECT file_name, file_type, file_data FROM project_files WHERE file_id = ?',
      [req.params.file_id]
    );
    if (!files.length) return res.status(404).json({ success: false, message: 'File not found' });

    const file = files[0];
    res.setHeader('Content-Type', file.file_type === '.pdf' ? 'application/pdf' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
    res.send(file.file_data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all pending files (for guide dashboard)
const getPendingFiles = async (req, res) => {
  try {
    const guide_id = req.user.user_id;
    const [files] = await db.query(
      `SELECT f.file_id, f.file_name, f.file_type, f.file_size, f.upload_date,
              f.version, f.status, f.comment_from_guide,
              u.full_name as uploaded_by_name,
              pg.group_name, pg.project_topic, pg.group_id
       FROM project_files f
       JOIN users u ON f.uploaded_by = u.user_id
       JOIN project_groups pg ON f.group_id = pg.group_id
       WHERE pg.guide_id = ?
       ORDER BY f.upload_date DESC`,
      [guide_id]
    );
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, uploadFile, getFilesByGroup, reviewFile, downloadFile, viewFile, getPendingFiles };
