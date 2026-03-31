const express = require('express');
const {
  getTasksForVideo,
  completeTask,
  completeTaskValidators,
  getUserTaskProgress,
} = require('../controllers/taskController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/user-progress', asyncHandler(getUserTaskProgress));
router.post('/complete', completeTaskValidators(), validate, asyncHandler(completeTask));
router.get('/:videoId', asyncHandler(getTasksForVideo));

module.exports = router;
