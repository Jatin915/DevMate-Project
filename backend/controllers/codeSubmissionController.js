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

module.exports = {
  submitCode,
  submitCodeLegacy,
  codeSubmitValidators,
};
