const mongoose = require('mongoose');
const { body } = require('express-validator');
const Progress = require('../models/Progress');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const { recalculateJobReadiness } = require('../utils/jobReadinessService');
const Roadmap = require('../models/Roadmap');
const { HttpError } = require('../middleware/errorHandler');

async function assertUserTaskAccess(userId, taskId, videoId) {
  const task = await Task.findById(taskId);
  if (!task) return null;
  if (videoId && task.videoId.toString() !== videoId) return null;
  const video = await Video.findById(task.videoId);
  if (!video) return null;
  const pl = await Playlist.findOne({ _id: video.playlistId, userId });
  if (!pl) return null;
  return { task, video };
}

async function getUserProgress(req, res, next) {
  try {
    const list = await Progress.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .populate('taskId', 'title difficulty order videoId')
      .populate('videoId', 'title youtubeVideoId');

    res.json({ success: true, progress: list });
  } catch (e) {
    next(e);
  }
}

function progressUpdateValidators() {
  return [
    body('taskId').notEmpty().withMessage('taskId is required'),
    body('videoId').optional().isString(),
    body('completed').isBoolean().withMessage('completed must be boolean'),
  ];
}

async function updateProgress(req, res, next) {
  try {
    const { taskId, videoId, completed } = req.body;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new HttpError(400, 'Invalid task id'));
      return;
    }

    const access = await assertUserTaskAccess(req.userId, taskId, videoId);
    if (!access) {
      next(new HttpError(404, 'Task not found'));
      return;
    }

    const { task, video } = access;
    const prior = await Progress.findOne({ userId: req.userId, taskId: task._id });
    const wasDone = prior?.completed;

    const update = {
      userId: req.userId,
      videoId: video._id,
      taskId: task._id,
      completed,
      completedAt: completed ? new Date() : null,
    };

    const doc = await Progress.findOneAndUpdate({ userId: req.userId, taskId: task._id }, update, {
      upsert: true,
      new: true,
    });

    if (completed && !wasDone) {
      await Roadmap.findOneAndUpdate(
        { userId: req.userId, language: 'General' },
        { $inc: { tasksCompleted: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).catch(() => {});
    }

    await recalculateJobReadiness(req.userId);

    res.json({ success: true, progress: doc });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getUserProgress,
  updateProgress,
  progressUpdateValidators,
};
