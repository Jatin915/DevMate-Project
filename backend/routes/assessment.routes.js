const express = require('express');
const {
  getAssessments,
  submitAssessment,
  assessmentSubmitValidators,
} = require('../controllers/assessmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.get('/assessments', asyncHandler(getAssessments));
router.post('/assessment/submit', assessmentSubmitValidators(), validate, asyncHandler(submitAssessment));

module.exports = router;
