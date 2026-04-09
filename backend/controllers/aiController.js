const mongoose = require('mongoose')
const { body } = require('express-validator')
const { evaluateCode } = require('../utils/aiService')
const CodeSubmission = require('../models/CodeSubmission')
const Task = require('../models/Task')
const Video = require('../models/Video')
const Playlist = require('../models/Playlist')

// ── Request validators ────────────────────────────────────────────────────
function aiEvaluateValidators() {
  return [
    // Accept either a single code string OR a files object — both are valid
    body('code').optional().isString().trim(),
    body('files').optional().isObject(),
    body('taskTitle').optional().isString().trim(),
    body('taskDescription').optional().isString().trim(),
    body('problemDescription').optional().isString().trim(),
    body('taskId').optional().isString().trim(),
    body('videoId').optional().isString().trim(),
  ]
}

// ── Code validation ───────────────────────────────────────────────────────
// Returns false only for obvious plain-text prose — deliberately permissive.
function isLikelyCode(input) {
  const s = (input || '').trim()
  if (s.length < 5) return false

  const patterns = [
    // Universal structural tokens
    '{', '}', '()', '=>', '->', '/*', '//',
    // JS / TS keywords
    'function', 'const ', 'let ', 'var ', 'class ', 'return ',
    'import ', 'export ', 'async ', 'await ', 'if (', 'if(', 'for(',
    'for (', 'while(', 'while (', 'switch(', 'switch (',
    // React / JSX
    'useState', 'useEffect', '<div', '<span', '<p>', '</div>',
    // CSS
    'display:', 'margin:', 'padding:', 'color:', 'background:',
    '@media', 'border:', 'font-size:', 'width:', 'height:',
    // HTML
    '<!DOCTYPE', '<html', '<head', '<body', '<script',
    // Python
    'def ', 'print(', 'elif ', 'self.',
    // Node / Express
    'require(', 'module.exports', 'app.get', 'app.post', 'router.',
    // MongoDB / Mongoose
    'mongoose', 'Schema(', 'findOne(', 'findById(',
    // Generic operators
    '===', '!==', '&&', '||', '++', '--', ';',
  ]

  return patterns.some((p) => s.includes(p))
}

const PLAIN_TEXT_REJECTION = {
  success:       true,
  score:         0,
  feedback:      'No valid code detected. Please submit actual code, not plain text.',
  errors:        ['Input does not appear to be valid code.'],
  suggestions:   [
    'Write valid code in the editor before submitting.',
    'Make sure your solution contains actual syntax (functions, variables, selectors, etc.).',
  ],
  optimizedCode: null,
  passed:        false,
}

// ── Ownership check ───────────────────────────────────────────────────────
async function resolveTaskOwnership(userId, taskId) {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) return null
  const task = await Task.findById(taskId).lean()
  if (!task) return null
  const video = await Video.findById(task.videoId).lean()
  if (!video) return null
  const playlist = await Playlist.findOne({ _id: video.playlistId, userId }).lean()
  if (!playlist) return null
  return task
}

// ── Controller ────────────────────────────────────────────────────────────
async function evaluateCodeController(req, res, next) {
  try {
    const {
      code:              rawCode,
      files:             rawFiles,
      taskTitle          = '',
      taskDescription    = '',
      problemDescription = '',
      taskId             = null,
      videoId            = null, // eslint-disable-line no-unused-vars
    } = req.body

    const description = taskDescription || problemDescription

    // ── Build combined code from files object or fall back to single code ─
    // files = { "index.html": "...", "style.css": "...", "script.js": "..." }
    const isMultiFile = rawFiles && typeof rawFiles === 'object' && Object.keys(rawFiles).length > 0

    let combinedCode
    if (isMultiFile) {
      combinedCode = Object.entries(rawFiles)
        .map(([filename, content]) => `// FILE: ${filename}\n${content || ''}`)
        .join('\n\n')
    } else {
      combinedCode = typeof rawCode === 'string' ? rawCode : ''
    }

    // The primary code for single-file operations (save, submit) is always
    // the active file's content — use rawCode if provided, else first file.
    const primaryCode = typeof rawCode === 'string' && rawCode.trim()
      ? rawCode
      : (isMultiFile ? Object.values(rawFiles)[0] || '' : '')

    console.log('[AI] /evaluate called | taskId:', taskId, '| user:', req.userId,
      '| multiFile:', isMultiFile, '| files:', isMultiFile ? Object.keys(rawFiles).join(', ') : 'n/a')

    // ── Plain-text guard ──────────────────────────────────────────────────
    if (!isLikelyCode(combinedCode)) {
      console.warn('[AI] Rejected plain-text | user:', req.userId, '| preview:', combinedCode.slice(0, 80))
      return res.json(PLAIN_TEXT_REJECTION)
    }

    // ── Call OpenRouter ───────────────────────────────────────────────────
    let result
    try {
      result = await evaluateCode(combinedCode, description, {
        taskTitle,
        taskDescription: description,
        files: isMultiFile ? rawFiles : null,
      })
    } catch (aiErr) {
      console.error('[AI] evaluateCode threw:', aiErr.message)
      return res.status(200).json({
        success:       false,
        error:         'AI evaluation failed. Please try again.',
        score:         0,
        feedback:      aiErr.message || 'AI evaluation failed.',
        errors:        [],
        suggestions:   [],
        optimizedCode: null,
        passed:        false,
      })
    }

    const passed = result.score >= 70

    // ── Persist to CodeSubmission ─────────────────────────────────────────
    const task = await resolveTaskOwnership(req.userId, taskId)
    if (task) {
      try {
        await CodeSubmission.create({
          userId: req.userId,
          taskId: task._id,
          code:   primaryCode,
          status: passed ? 'passed' : 'failed',
          executionResult: {
            output:        result.feedback,
            error:         result.errors.length > 0 ? result.errors.join('; ') : null,
            score:         result.score,
            optimizedCode: result.optimizedCode || null,
          },
          submittedAt: new Date(),
        })
        console.log('[AI] Submission saved | taskId:', task._id, '| score:', result.score)
      } catch (dbErr) {
        console.error('[AI] Failed to save submission:', dbErr.message)
      }
    }

    // ── Final validation ──────────────────────────────────────────────────
    const safeScore       = typeof result.score    === 'number' ? result.score    : 50
    const safeFeedback    = typeof result.feedback === 'string' ? result.feedback : 'Evaluation complete.'
    const safeErrors      = Array.isArray(result.errors)        ? result.errors      : []
    const safeSuggestions = Array.isArray(result.suggestions)   ? result.suggestions : []
    const safeOptimized   = result.optimizedCode ?? null

    console.log('[AI] Sending response | score:', safeScore, '| passed:', passed)

    res.json({
      success:       true,
      score:         safeScore,
      feedback:      safeFeedback,
      errors:        safeErrors,
      suggestions:   safeSuggestions,
      optimizedCode: safeOptimized,
      passed,
    })
  } catch (e) {
    next(e)
  }
}

module.exports = { evaluateCodeController, aiEvaluateValidators }
