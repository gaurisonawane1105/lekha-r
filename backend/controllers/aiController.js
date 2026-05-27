/**
 * aiController.js
 * Handles keyword extraction requests.
 * Forwards uploaded file to Python AI service, saves results to DB.
 */

const axios = require('axios');
const FormData = require('form-data');
const db = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/ai/extract-keywords
 * Accepts a file upload, sends to AI service, saves keywords, returns result.
 */
const extractKeywords = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;

    // ── Forward file to Python AI service ──────────────────────────────
    const form = new FormData();
    form.append('file', buffer, {
      filename: originalname,
      contentType: mimetype,
    });

    let aiResponse;
    try {
      aiResponse = await axios.post(`${AI_SERVICE_URL}/extract-keywords`, form, {
        headers: { ...form.getHeaders() },
        timeout: 60000, // 60s timeout — model can be slow on first run
      });
    } catch (aiErr) {
      const detail = aiErr.response?.data?.detail || aiErr.message;
      console.error('AI service error:', detail);
      return res.status(502).json({
        success: false,
        message: `AI service error: ${detail}`,
      });
    }

    const { keywords } = aiResponse.data;

    // ── Save to database ────────────────────────────────────────────────
    const keywordsJson = JSON.stringify(keywords);
    const [result] = await db.query(
      `INSERT INTO keyword_extractions (user_id, file_name, keywords)
       VALUES (?, ?, ?)`,
      [req.user.user_id, originalname, keywordsJson]
    );

    // ── Audit log ───────────────────────────────────────────────────────
    await db.query(
      `INSERT INTO audit_logs (table_name, record_id, action, action_by, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        'keyword_extractions',
        result.insertId,
        'EXTRACT',
        req.user.user_id,
        `Extracted ${keywords.length} keywords from "${originalname}"`,
      ]
    );

    return res.status(200).json({
      success: true,
      extraction_id: result.insertId,
      file_name: originalname,
      keywords,
    });
  } catch (err) {
    console.error('extractKeywords error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/ai/extractions
 * Returns the logged-in user's keyword extraction history.
 */
const getExtractionHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, file_name, keywords, uploaded_at
       FROM keyword_extractions
       WHERE user_id = ?
       ORDER BY uploaded_at DESC
       LIMIT 20`,
      [req.user.user_id]
    );

    // Parse stored JSON strings back to arrays
    const data = rows.map((row) => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { extractKeywords, getExtractionHistory };
