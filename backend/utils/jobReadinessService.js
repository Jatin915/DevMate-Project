const Progress = require('../models/Progress');
const Task = require('../models/Task');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const CodeSubmission = require('../models/CodeSubmission');
const Roadmap = require('../models/Roadmap');
const JobReadiness = require('../models/JobReadiness');
const { computeJobReadinessScores } = require('./jobReadinessCalculator');

async function recalculateJobReadiness(userId) {
  const playlists = await Playlist.find({ userId }).select('_id');
  const playlistIds = playlists.map((p) => p._id);
  const videos = await Video.find({ playlistId: { $in: playlistIds } }).select('_id');
  const videoIds = videos.map((v) => v._id);

  const totalTasks = await Task.countDocuments({ videoId: { $in: videoIds } });

  const userProgress = await Progress.find({ userId, completed: true });
  const completedTasks = userProgress.length;
  const taskIds = userProgress.map((p) => p.taskId);

  const completedTaskDocs = await Task.find({ _id: { $in: taskIds } });

  const submissions = await CodeSubmission.find({ userId }).sort({ submittedAt: -1 }).limit(300).lean();

  const roadmaps = await Roadmap.find({ userId });
  const miniProjectsCompleted = roadmaps.reduce((a, r) => a + (r.miniProjectsCompleted || 0), 0);

  const distinctDays = new Set(
    userProgress.filter((p) => p.completedAt).map((p) => p.completedAt.toISOString().slice(0, 10)),
  ).size;

  const scores = computeJobReadinessScores({
    totalTasks,
    completedTasks,
    completedTaskDocs,
    submissions,
    miniProjectsCompleted,
    distinctActiveDays: distinctDays,
  });

  await JobReadiness.findOneAndUpdate(
    { userId },
    {
      codingScore: scores.codingScore,
      debuggingScore: scores.debuggingScore,
      projectScore: scores.projectScore,
      consistencyScore: scores.consistencyScore,
      conceptAccuracy: scores.conceptAccuracy,
      overallScore: scores.overallScore,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true },
  );

  return scores;
}

module.exports = { recalculateJobReadiness };
