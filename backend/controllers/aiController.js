const { body } = require('express-validator')
const { HttpError } = require('../middleware/errorHandler')
const { evaluateCode } = require('../utils/aiService')

function aiEvaluateValidators() {
  return [
    body('code').isString().trim().notEmpty().withMessage('code is required'),
    body('problemDescription')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('problemDescription is required'),
  ]
}

async function evaluateCodeController(req, res, next) {
  try {
    const { code, problemDescription } = req.body
    if (!code || !problemDescription) {
      next(new HttpError(400, 'code and problemDescription are required'))
      return
    }

    const result = await evaluateCode(code, problemDescription)
    const passed = typeof result?.score === 'number' ? result.score >= 80 : false

    res.json({
      success: true,
      score: result.score ?? 0,
      feedback: result.feedback ?? '',
      suggestions: result.suggestions ?? [],
      passed,
    })
  } catch (e) {
    next(e)
  }
}

module.exports = { evaluateCodeController, aiEvaluateValidators }

