const express = require('express')
const asyncHandler = require('../middleware/asyncHandler')
const validate = require('../middleware/validate')
const { authMiddleware } = require('../middleware/authMiddleware')
const { generateTasks, generateTasksValidators } = require('../controllers/taskGenerationController')

const router = express.Router()

router.use(authMiddleware)

router.post('/generate-tasks', generateTasksValidators(), validate, asyncHandler(generateTasks))

module.exports = router

