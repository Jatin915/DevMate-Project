const express = require('express')
const asyncHandler = require('../middleware/asyncHandler')
const { authMiddleware } = require('../middleware/authMiddleware')
const validate = require('../middleware/validate')
const { aiEvaluateValidators, evaluateCodeController } = require('../controllers/aiController')

const router = express.Router()

router.use(authMiddleware)

router.post(
  '/evaluate',
  aiEvaluateValidators(),
  validate,
  asyncHandler(evaluateCodeController),
)

module.exports = router

