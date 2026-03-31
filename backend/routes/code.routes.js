const express = require('express');
const {
  submitCode,
  codeSubmitValidators,
} = require('../controllers/codeSubmissionController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.post('/submit', codeSubmitValidators(), validate, asyncHandler(submitCode));

module.exports = router;
