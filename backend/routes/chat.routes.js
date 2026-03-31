const express = require('express');
const { postMessage, getHistory, chatValidators } = require('../controllers/chatController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.post('/message', chatValidators(), validate, asyncHandler(postMessage));
router.get('/history', asyncHandler(getHistory));

module.exports = router;
