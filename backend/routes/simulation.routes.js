const express = require('express');
const { body } = require('express-validator');
const {
  getIssues,
  getIssueById,
  submitSolution,
  getUserProgress,
} = require('../controllers/simulationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate           = require('../middleware/validate');
const asyncHandler       = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/issues',           asyncHandler(getIssues));
router.get('/issues/:id',       asyncHandler(getIssueById));
router.get('/user-progress',    asyncHandler(getUserProgress));
router.post(
  '/submit',
  [
    body('issueId').notEmpty().withMessage('issueId is required'),
    body('solutionCode').isString().trim().notEmpty().withMessage('solutionCode is required'),
  ],
  validate,
  asyncHandler(submitSolution),
);

module.exports = router;
