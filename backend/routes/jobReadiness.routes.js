const express = require('express');
const { getScore, getReport } = require('../controllers/jobReadinessController');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.get('/score', asyncHandler(getScore));
router.get('/report', asyncHandler(getReport));

module.exports = router;
