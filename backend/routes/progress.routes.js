const express = require('express');
const {
  getUserProgress,
  updateProgress,
  progressUpdateValidators,
} = require('../controllers/progressController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/user', asyncHandler(getUserProgress));
router.post('/update', progressUpdateValidators(), validate, asyncHandler(updateProgress));

module.exports = router;
