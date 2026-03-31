const mongoose = require('mongoose')
const { body } = require('express-validator')
const Task = require('../models/Task')
const Video = require('../models/Video')
const Playlist = require('../models/Playlist')
const Progress = require('../models/Progress')
const { ensureTasksForVideo } = require('../utils/taskSeeder')
const { HttpError } = require('../middleware/errorHandler')

function generateTasksValidators() {
  return [
    body('videoId').notEmpty().withMessage('videoId is required'),
    body('videoTitle').optional().isString(),
  ]
}

async function userOwnsVideo(req, videoId) {
  const video = await Video.findById(videoId)
  if (!video) return null
  const pl = await Playlist.findOne({ _id: video.playlistId, userId: req.userId })
  if (!pl) return null
  return video
}

async function generateTasks(req, res, next) {
  try {
    const { videoId, videoTitle } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      next(new HttpError(400, 'Invalid video id'))
      return
    }

    const owned = await userOwnsVideo(req, videoId)
    if (!owned) {
      next(new HttpError(404, 'Video not found'))
      return
    }

    const tasks = await ensureTasksForVideo(videoId, videoTitle)
    const taskIds = tasks.map((t) => t._id)

    const progressRows = await Progress.find({
      userId: req.userId,
      taskId: { $in: taskIds },
      completed: true,
    }).select('taskId')

    const completedSet = new Set(progressRows.map((p) => p.taskId.toString()))

    res.json({
      success: true,
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
    })
  } catch (e) {
    next(e)
  }
}

module.exports = { generateTasks, generateTasksValidators }

