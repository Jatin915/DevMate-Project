const express = require('express');
const {
  saveUserSkills,
  startFromBeginner,
  getUserSkillProfile,
  userSkillValidators,
} = require('../controllers/userSkillController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);
router.post('/skills', userSkillValidators(), validate, asyncHandler(saveUserSkills));
router.post('/start-beginner', asyncHandler(startFromBeginner));
router.get('/skills', asyncHandler(getUserSkillProfile));

module.exports = router;
