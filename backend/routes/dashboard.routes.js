const express = require('express');
const { getDashboard, getDashboardSummary } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.get('/', asyncHandler(getDashboard));
router.get('/summary', asyncHandler(getDashboardSummary));

module.exports = router;
