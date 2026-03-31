const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const Task = require('../models/Task');
const Progress = require('../models/Progress');
const VideoProgress = require('../models/VideoProgress');
const CodeSubmission = require('../models/CodeSubmission');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB'];

function formatDurationSeconds(seconds) {
  const n = Number(seconds || 0);
  if (!n) return '—';
  const mins = Math.max(1, Math.round(n / 60));
  return `${mins} min`;
}

async function getDashboardSummary(req, res, next) {
  try {
    const userId = req.userId;

    const playlists = await Playlist.find({ userId }).select('_id');
    const playlistIds = playlists.map((p) => p._id);

    const totalPlaylists = playlistIds.length;
    const totalVideos = await Video.countDocuments({ playlistId: { $in: playlistIds } });

    const videos = await Video.find({ playlistId: { $in: playlistIds } }).select('_id');
    const videoIds = videos.map((v) => v._id);

    const totalTasks = await Task.countDocuments({ videoId: { $in: videoIds } });

    const taskIds = await Task.find({ videoId: { $in: videoIds } }).distinct('_id');
    const completedTasks = await Progress.countDocuments({
      userId,
      completed: true,
      taskId: { $in: taskIds },
    });

    const pendingTasks = Math.max(0, totalTasks - completedTasks);
    const learningProgressPercentage = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        totalPlaylists,
        totalVideos,
        learningProgressPercentage,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.userId;

    // Streak is stored on user and updated on /auth/login.
    const user = await User.findById(userId).select('streakCount').lean();
    const streak = user?.streakCount || 0;

    const topicsDone = await VideoProgress.countDocuments({ userId, completed: true });
    const tasksSubmitted = await Progress.countDocuments({ userId, completed: true });

    // Projects are tracked via Roadmap.miniProjectsCompleted.
    const projectAgg = await Roadmap.aggregate([
      { $match: { userId } },
      { $group: { _id: null, sum: { $sum: { $ifNull: ['$miniProjectsCompleted', 0] } } } },
    ]);
    const projectsBuilt = projectAgg?.[0]?.sum || 0;

    // XP computed dynamically from completion counts.
    const xpPoints = topicsDone * 10 + tasksSubmitted * 5 + projectsBuilt * 20;

    const roadmaps = LANGUAGE_ORDER.map((language) => ({
      language,
      progress: 0,
    }));

    // Roadmap progress based on completed videos per language.
    const vpRows = await VideoProgress.find({ userId, language: { $in: LANGUAGE_ORDER } })
      .select('language completed')
      .lean();
    const totalsByLang = new Map();
    const completedByLang = new Map();
    for (const row of vpRows) {
      totalsByLang.set(row.language, (totalsByLang.get(row.language) || 0) + 1);
      if (row.completed) completedByLang.set(row.language, (completedByLang.get(row.language) || 0) + 1);
    }
    for (const item of roadmaps) {
      const total = totalsByLang.get(item.language) || 0;
      const completed = completedByLang.get(item.language) || 0;
      item.progress = total ? Math.round((completed / total) * 100) : 0;
    }

    // Recent projects: proxy recent "projects" using the last 3 passed code submissions.
    const recentSubs = await CodeSubmission.find({ userId, status: 'passed' })
      .sort({ submittedAt: -1 })
      .limit(3)
      .lean();

    const taskIds = [...new Set(recentSubs.map((s) => String(s.taskId)))];
    const tasks = taskIds.length ? await Task.find({ _id: { $in: taskIds } }).select('title videoId') : [];
    const byTask = new Map(tasks.map((t) => [String(t._id), t]));

    const videoIds = [...new Set(tasks.map((t) => String(t.videoId)))];
    const videos = videoIds.length ? await Video.find({ _id: { $in: videoIds } }).select('_id language').lean() : [];
    const byVideo = new Map(videos.map((v) => [String(v._id), v]));

    const recentProjects = recentSubs.map((s) => {
      const task = byTask.get(String(s.taskId));
      const video = task ? byVideo.get(String(task.videoId)) : null;
      return {
        title: task?.title || 'Project',
        language: video?.language || '',
        score: s.executionResult?.score ?? 0,
        status: 'Completed',
      };
    });

    // Continue learning: last unlocked, incomplete video.
    const unlockedRows = await VideoProgress.find({ userId, unlocked: true, completed: false })
      .lean();
    let continueLearning = null;
    if (unlockedRows.length > 0) {
      const videoIds = [...new Set(unlockedRows.map((r) => String(r.videoId)))];
      const videos = await Video.find({ _id: { $in: videoIds } })
        .select('title duration order language')
        .lean();
      const best = videos.sort((a, b) => (b.order || 0) - (a.order || 0))[0];
      if (best) {
        continueLearning = {
          title: best.title,
          type: 'Video',
          duration: formatDurationSeconds(best.duration),
        };
      }
    }

    res.json({
      streak,
      xpPoints,
      topicsDone,
      projectsBuilt,
      tasksSubmitted,
      jobReadiness: 0,
      roadmaps,
      recentProjects,
      continueLearning,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getDashboardSummary, getDashboard };
