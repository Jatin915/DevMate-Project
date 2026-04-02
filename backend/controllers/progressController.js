const mongoose = require('mongoose');
const { body } = require('express-validator');
const Progress = require('../models/Progress');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const VideoProgress = require('../models/VideoProgress');
const User = require('../models/User');
const { recalculateJobReadiness } = require('../utils/jobReadinessService');
const Roadmap = require('../models/Roadmap');
const { HttpError } = require('../middleware/errorHandler');

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB'];
const LANGUAGE_COLORS = {
  HTML:       'var(--red)',
  CSS:        'var(--cyan)',
  JavaScript: 'var(--orange)',
  React:      'var(--accent)',
  Node:       'var(--green)',
  Express:    '#7c3aed',
  MongoDB:    'var(--green)',
};
const DISPLAY_LABEL = { Node: 'Node.js', Express: 'Express.js' };

// Returns the ISO date string (YYYY-MM-DD) in UTC for a given Date object
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

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

// ── GET /api/progress/summary ─────────────────────────────────────────────
// Returns everything the Progress page needs in one request.
async function getProgressSummary(req, res, next) {
  try {
    const userId = req.userId;

    // ── Streak + XP ───────────────────────────────────────────────────────
    const user = await User.findById(userId).select('streakCount').lean();
    const currentStreak = user?.streakCount || 0;

    const topicsDone     = await VideoProgress.countDocuments({ userId, completed: true });
    const tasksCompleted = await Progress.countDocuments({ userId, completed: true });
    const projectAgg     = await Roadmap.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, sum: { $sum: { $ifNull: ['$miniProjectsCompleted', 0] } } } },
    ]);
    const projectsBuilt = projectAgg?.[0]?.sum || 0;
    const totalXP = topicsDone * 10 + tasksCompleted * 5 + projectsBuilt * 20;

    // ── Hours learned — sum Video.duration for completed VideoProgress rows ─
    const completedVP = await VideoProgress.find({ userId, completed: true })
      .select('videoId completedAt')
      .lean();
    const completedVideoIds = completedVP.map((r) => r.videoId);
    const videoDocs = completedVideoIds.length
      ? await Video.find({ _id: { $in: completedVideoIds } }).select('_id duration').lean()
      : [];
    const durationMap = new Map(videoDocs.map((v) => [String(v._id), v.duration || 0]));
    const totalSeconds = completedVP.reduce((sum, r) => sum + (durationMap.get(String(r.videoId)) || 0), 0);
    const hoursLearned = Math.round((totalSeconds / 3600) * 10) / 10; // 1 decimal

    // ── Weekly activity — last 7 days, minutes learned per day ────────────
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (6 - i));
      return toDateStr(d);
    });

    // Group completed VideoProgress by completedAt date
    const activityMap = new Map(last7.map((d) => [d, 0]));
    for (const row of completedVP) {
      if (!row.completedAt) continue;
      const dateStr = toDateStr(new Date(row.completedAt));
      if (activityMap.has(dateStr)) {
        const secs = durationMap.get(String(row.videoId)) || 0;
        activityMap.set(dateStr, activityMap.get(dateStr) + Math.round(secs / 60));
      }
    }
    // Also count task completions (each task = 5 min proxy)
    const completedTasks = await Progress.find({ userId, completed: true })
      .select('completedAt')
      .lean();
    for (const row of completedTasks) {
      if (!row.completedAt) continue;
      const dateStr = toDateStr(new Date(row.completedAt));
      if (activityMap.has(dateStr)) {
        activityMap.set(dateStr, activityMap.get(dateStr) + 5);
      }
    }
    const weeklyActivity = last7.map((date) => ({
      date,
      day: new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      minutesLearned: activityMap.get(date) || 0,
    }));

    // ── Streak calendar — last 28 days ────────────────────────────────────
    const last28 = Array.from({ length: 28 }, (_, i) => {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (27 - i));
      return toDateStr(d);
    });
    // A day is "active" if any video was completed or any task was completed that day
    const activeDaySet = new Set();
    for (const row of completedVP) {
      if (row.completedAt) activeDaySet.add(toDateStr(new Date(row.completedAt)));
    }
    for (const row of completedTasks) {
      if (row.completedAt) activeDaySet.add(toDateStr(new Date(row.completedAt)));
    }
    const streakDays = last28.map((date) => ({ date, completed: activeDaySet.has(date) }));

    // ── Skill progress — % of videos completed per language ───────────────
    const vpAll = await VideoProgress.find({ userId, language: { $in: LANGUAGE_ORDER } })
      .select('language completed')
      .lean();
    const totalByLang    = new Map();
    const completedByLang = new Map();
    for (const row of vpAll) {
      totalByLang.set(row.language, (totalByLang.get(row.language) || 0) + 1);
      if (row.completed) completedByLang.set(row.language, (completedByLang.get(row.language) || 0) + 1);
    }
    const skills = LANGUAGE_ORDER
      .filter((lang) => (totalByLang.get(lang) || 0) > 0)
      .map((lang) => ({
        name:  DISPLAY_LABEL[lang] || lang,
        level: Math.round(((completedByLang.get(lang) || 0) / totalByLang.get(lang)) * 100),
        color: LANGUAGE_COLORS[lang] || 'var(--accent)',
      }));

    // ── Areas to improve — languages with < 50% completion ───────────────
    const areasToImprove = LANGUAGE_ORDER
      .filter((lang) => {
        const total = totalByLang.get(lang) || 0;
        if (total === 0) return false;
        const pct = Math.round(((completedByLang.get(lang) || 0) / total) * 100);
        return pct < 50;
      })
      .map((lang) => ({
        area:       DISPLAY_LABEL[lang] || lang,
        suggestion: `Complete more ${DISPLAY_LABEL[lang] || lang} videos to improve your score`,
      }));

    res.json({
      success: true,
      currentStreak,
      totalXP,
      topicsDone,
      hoursLearned,
      weeklyActivity,
      streakDays,
      skills,
      areasToImprove,
    });
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
  getProgressSummary,
  updateProgress,
  progressUpdateValidators,
};
