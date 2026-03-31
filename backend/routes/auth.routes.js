const express = require('express');
const {
  signup,
  login,
  getProfile,
  updateProfile,
  authValidatorsSignup,
  authValidatorsLogin,
  authValidatorsUpdateProfile,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/signup', authValidatorsSignup(), validate, asyncHandler(signup));
router.post('/login', authValidatorsLogin(), validate, asyncHandler(login));
router.get('/profile', authMiddleware, asyncHandler(getProfile));
router.put('/update-profile', authMiddleware, authValidatorsUpdateProfile(), validate, asyncHandler(updateProfile));

module.exports = router;
