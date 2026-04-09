const mongoose = require('mongoose');
const { body } = require('express-validator');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const CodeSubmission = require('../models/CodeSubmission');
const { evaluateSubmission } = require('../utils/codeEvaluator');
const { recalculateJobReadiness } = require('../utils/jobReadinessService');
const { HttpError } = require('../middleware/errorHandler');

async function userOwnsTask(userId, taskId) {
  const task = await Task.findById(taskId);
  if (!task) return null;
  const video = await Video.findById(task.videoId);
  if (!video) return null;
  const pl = await Playlist.findOne({ _id: video.playlistId, userId });
  if (!pl) return null;
  return task;
}

function codeSubmitValidators() {
  return [
    body('taskId').notEmpty().withMessage('taskId is required'),
    body('code').isString().isLength({ min: 1, max: 200000 }).withMessage('code is required'),
  ];
}

async function submitCode(req, res, next) {
  try {
    const { taskId, code } = req.body;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new HttpError(400, 'Invalid task id'));
      return;
    }
    const task = await userOwnsTask(req.userId, taskId);
    if (!task) {
      next(new HttpError(404, 'Task not found'));
      return;
    }

    const evalResult = evaluateSubmission(task, code);
    const submission = await CodeSubmission.create({
      userId: req.userId,
      taskId: task._id,
      code,
      status: evalResult.status,
      executionResult: {
        output: evalResult.output,
        error: evalResult.error,
        score: evalResult.score,
      },
      submittedAt: new Date(),
    });

    await recalculateJobReadiness(req.userId);

    res.status(201).json({
      success: true,
      submission,
      score: evalResult.score,
      feedback: evalResult.output,
      status: evalResult.status,
    });
  } catch (e) {
    next(e);
  }
}

/** Legacy: POST /api/submit with `{ code }` — binds to first available task; response `{ score, feedback }`. */
async function submitCodeLegacy(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      next(new HttpError(400, 'code is required'));
      return;
    }

    const playlists = await Playlist.find({ userId: req.userId }).select('_id');
    const videos = await Video.find({ playlistId: { $in: playlists.map((p) => p._id) } })
      .sort({ createdAt: -1 })
      .limit(1);
    if (videos.length === 0) {
      res.json({
        score: 70,
        feedback: 'Add a playlist first, then submit against a real task.',
      });
      return;
    }
    const tasks = await Task.find({ videoId: videos[0]._id }).sort({ order: 1 }).limit(1);
    if (tasks.length === 0) {
      res.json({
        score: 72,
        feedback: 'Open a video to generate tasks, then submit again.',
      });
      return;
    }

    const task = tasks[0];
    const evalResult = evaluateSubmission(task, code);
    await CodeSubmission.create({
      userId: req.userId,
      taskId: task._id,
      code,
      status: evalResult.status,
      executionResult: {
        output: evalResult.output,
        error: evalResult.error,
        score: evalResult.score,
      },
      submittedAt: new Date(),
    });
    await recalculateJobReadiness(req.userId);

    res.json({ score: evalResult.score, feedback: evalResult.output });
  } catch (e) {
    next(e);
  }
}

/** POST /api/code/draft — upsert a draft for (userId, taskId). */
async function saveDraft(req, res, next) {
  try {
    const { taskId, code, videoId, files } = req.body;
    if (!taskId) {
      next(new HttpError(400, 'taskId is required'));
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new HttpError(400, 'Invalid task id'));
      return;
    }

    // Build the code string to store:
    // If files object provided, combine all files into one string for storage.
    // The draft endpoint stores a single string for backward compat.
    let codeToStore = typeof code === 'string' ? code : '';
    if (files && typeof files === 'object' && Object.keys(files).length > 0) {
      // Store the primary file (first file) as the draft code.
      // The full files object is stored in executionResult for future retrieval.
      codeToStore = Object.values(files)[0] || codeToStore;
    }

    const task = await userOwnsTask(req.userId, taskId);
    if (!task) {
      next(new HttpError(404, 'Task not found'));
      return;
    }

    const draft = await CodeSubmission.findOneAndUpdate(
      { userId: req.userId, taskId: task._id, isDraft: true },
      {
        $set: {
          userId:    req.userId,
          taskId:    task._id,
          code:      codeToStore,
          isDraft:   true,
          status:    'pending',
          submittedAt: new Date(),
          // Store full files object in executionResult.output as JSON
          ...(files ? { 'executionResult.output': JSON.stringify(files) } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, draft });
  } catch (e) {
    next(e);
  }
}

/** GET /api/code/draft/:taskId — return the latest draft code for (userId, taskId). */
async function getDraft(req, res, next) {
  try {
    const { taskId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      res.json({ success: true, code: '', files: null });
      return;
    }

    const draft = await CodeSubmission.findOne(
      { userId: req.userId, taskId, isDraft: true },
      { code: 1, 'executionResult.output': 1 },
    ).sort({ submittedAt: -1 }).lean();

    if (!draft) {
      res.json({ success: true, code: '', files: null });
      return;
    }

    // Try to parse files from executionResult.output (stored as JSON string)
    let files = null;
    const rawOutput = draft?.executionResult?.output;
    if (rawOutput && typeof rawOutput === 'string') {
      try {
        const parsed = JSON.parse(rawOutput);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          files = parsed;
        }
      } catch { /* not a files JSON — ignore */ }
    }

    res.json({ success: true, code: draft.code || '', files });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  submitCode,
  submitCodeLegacy,
  saveDraft,
  getDraft,
  codeSubmitValidators,
};
