const express = require('express');
const { getDailyAnalytics, getPerformanceMetrics, getDocumentTypeStats, getSystemHealth, updateDailyAnalytics } = require('../controllers/analytics.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Analytics routes
router.get('/daily', verifyToken, getDailyAnalytics);
router.get('/performance', verifyToken, getPerformanceMetrics);
router.get('/document-types', verifyToken, getDocumentTypeStats);
router.get('/system-health', verifyToken, getSystemHealth);
router.post('/update-daily', verifyToken, updateDailyAnalytics);

module.exports = router;
