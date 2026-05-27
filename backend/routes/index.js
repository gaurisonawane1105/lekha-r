const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');
const { getAllProjects, getProjectById, createProject, updateProject, addStudentToGroup } = require('../controllers/projectController');
const { upload, uploadFile, getFilesByGroup, reviewFile, downloadFile, viewFile, getPendingFiles } = require('../controllers/fileController');
const { getMeetingsByGroup, createMeeting, reviewMeeting } = require('../controllers/meetingController');
const { getAllUsers, createUser, deleteUser, getGuides, getStudents, getAuditLogs, getDashboardStats, getNotifications, markNotificationsRead } = require('../controllers/adminController');

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);

// Projects
router.get('/projects', authenticate, getAllProjects);
router.post('/projects', authenticate, authorize('admin', 'hod'), createProject);
router.get('/projects/:id', authenticate, getProjectById);
router.put('/projects/:id', authenticate, authorize('admin', 'hod'), updateProject);
router.post('/projects/:id/students', authenticate, authorize('admin', 'hod'), addStudentToGroup);

// Files - stored in DB as BLOB
router.post('/files/upload/:group_id', authenticate, authorize('student'), upload.single('file'), uploadFile);
router.get('/files/pending', authenticate, authorize('guide'), getPendingFiles);
router.get('/files/:group_id', authenticate, getFilesByGroup);
router.put('/files/:file_id/review', authenticate, authorize('guide'), reviewFile);
router.get('/files/download/:file_id', authenticate, downloadFile);
router.get('/files/view/:file_id', authenticate, viewFile);

// Meetings
router.get('/meetings/:group_id', authenticate, getMeetingsByGroup);
router.post('/meetings', authenticate, authorize('student'), createMeeting);
router.put('/meetings/:meet_id/review', authenticate, authorize('guide'), reviewMeeting);

// Users
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.post('/users', authenticate, authorize('admin'), createUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.get('/users/guides', authenticate, getGuides);
router.get('/users/students', authenticate, getStudents);

// Admin / Stats
router.get('/admin/stats', authenticate, authorize('admin', 'hod'), getDashboardStats);
router.get('/admin/logs', authenticate, authorize('admin'), getAuditLogs);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/read', authenticate, markNotificationsRead);

module.exports = router;
