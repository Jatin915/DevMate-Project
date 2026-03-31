const mongoose = require('mongoose');
const { body } = require('express-validator');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const Progress = require('../models/Progress');
const { ensureTasksForVideo } = require('../utils/taskSeeder');
const { recalculateJobReadiness } = require('../utils/jobReadinessService');
const Roadmap = require('../models/Roadmap');
const { HttpError } = require('../middleware/errorHandler');

async function userOwnsVideo(userId, videoId) {
  const video = await Video.findById(videoId);
  if (!video) return null;
  const pl = await Playlist.findOne({ _id: video.playlistId, userId });
  if (!pl) return null;
  return video;
}

async function getTasksForVideo(req, res, next) {
  try {
    const { videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      next(new HttpError(400, 'Invalid video id'));
      return;
    }
    const video = await userOwnsVideo(req.userId, videoId);
    if (!video) {
      next(new HttpError(404, 'Video not found'));
      return;
    }
    const tasks = await ensureTasksForVideo(video._id);

    const taskIds = tasks.map((t) => t._id);
    const progressRows = await Progress.find({
      userId: req.userId,
      taskId: { $in: taskIds },
      completed: true,
    }).select('taskId');
    const completedSet = new Set(progressRows.map((p) => p.taskId.toString()));

    res.json({
      success: true,
      videoId,
      tasks: tasks
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((t) => ({
          id: t._id,
          title: t.title,
          description: t.description,
          difficulty: t.difficulty,
          starterCode: t.starterCode,
          expectedOutput: t.expectedOutput,
          hints: t.hints,
          order: t.order,
          completed: completedSet.has(t._id.toString()),
        })),
    });
  } catch (e) {
    next(e);
  }
}

function completeTaskValidators() {
  return [body('taskId').notEmpty().withMessage('taskId is required')];
}

async function completeTask(req, res, next) {
  try {
    const { taskId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new HttpError(400, 'Invalid task id'));
      return;
    }
    const task = await Task.findById(taskId);
    if (!task) {
      next(new HttpError(404, 'Task not found'));
      return;
    }
    const video = await userOwnsVideo(req.userId, task.videoId);
    if (!video) {
      next(new HttpError(404, 'Task not found'));
      return;
    }

    const prior = await Progress.findOne({ userId: req.userId, taskId: task._id });
    const wasDone = prior?.completed;

    await Progress.findOneAndUpdate(
      { userId: req.userId, taskId: task._id },
      {
        userId: req.userId,
        videoId: video._id,
        taskId: task._id,
        completed: true,
        completedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    if (!wasDone) {
      await Roadmap.findOneAndUpdate(
        { userId: req.userId, language: 'General' },
        { $inc: { tasksCompleted: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).catch(() => {});
    }

    await recalculateJobReadiness(req.userId);

    res.json({ success: true, message: 'Task marked complete' });
  } catch (e) {
    next(e);
  }
}

async function getUserTaskProgress(req, res, next) {
  try {
    const playlists = await Playlist.find({ userId: req.userId }).select('_id');
    const playlistIds = playlists.map((p) => p._id);
    const videos = await Video.find({ playlistId: { $in: playlistIds } }).select('_id title');
    const videoIds = videos.map((v) => v._id);

    const totalTasks = await Task.countDocuments({ videoId: { $in: videoIds } });
    const taskList = await Task.find({ videoId: { $in: videoIds } }).select('_id videoId');
    const taskIds = taskList.map((t) => t._id);

    const completedRows = await Progress.find({
      userId: req.userId,
      taskId: { $in: taskIds },
      completed: true,
    });

    const completedSet = new Set(completedRows.map((p) => p.taskId.toString()));
    const completedTasks = completedRows.length;

    const byVideo = videos.map((v) => {
      const vt = taskList.filter((t) => t.videoId.toString() === v._id.toString());
      const done = vt.filter((t) => completedSet.has(t._id.toString())).length;
      return {
        videoId: v._id,
        title: v.title,
        completedTasks: done,
        totalTasks: vt.length,
      };
    });

    res.json({
      success: true,
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks: Math.max(0, totalTasks - completedTasks),
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      byVideo,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getTasksForVideo,
  completeTask,
  completeTaskValidators,
  getUserTaskProgress,
};
