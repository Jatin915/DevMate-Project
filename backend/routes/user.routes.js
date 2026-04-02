const express = require('express');
const { body } = require('express-validator');
const {
  saveUserSkills,
  startFromBeginner,
  getUserSkillProfile,
  userSkillValidators,
  saveCustomJourney,
  getLanguageSuggestions,
} = require('../controllers/userSkillController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.post('/skills',          userSkillValidators(), validate, asyncHandler(saveUserSkills));
router.post('/start-beginner',  asyncHandler(startFromBeginner));
router.get('/skills',           asyncHandler(getUserSkillProfile));
router.post(
  '/custom-journey',
  [body('languages').isArray({ min: 1 }).withMessage('languages array required')],
  validate,
  asyncHandler(saveCustomJourney),
);
router.get('/language-suggestions', asyncHandler(getLanguageSuggestions));

module.exports = router;
