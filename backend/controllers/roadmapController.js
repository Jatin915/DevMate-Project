const { body } = require('express-validator')
const Roadmap = require('../models/Roadmap')
const { HttpError } = require('../middleware/errorHandler')
const UserSkill = require('../models/UserSkill')
const User = require('../models/User')
const Video = require('../models/Video')
const VideoProgress = require('../models/VideoProgress')
const Playlist = require('../models/Playlist')
const Task = require('../models/Task')
const Progress = require('../models/Progress')
const CodeSubmission = require('../models/CodeSubmission')
const AssessmentResult = require('../models/AssessmentResult')
const UserMiniProject = require('../models/UserMiniProject')

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB']

function normalizeLanguage(lang) {
  const v = (lang || '').trim()
  if (v === 'Node.js') return 'Node'
  if (v === 'Express.js') return 'Express'
  return v
}

async function getRoadmap(req, res, next) {
  try {
    // knownLanguages comes from onboarding selection (UserSkill).
    const skill = await UserSkill.findOne({ userId: req.userId }).lean()
    const knownLanguagesRaw = Array.isArray(skill?.knownLanguages) ? skill.knownLanguages : []
    const knownLanguages = [...new Set(knownLanguagesRaw.map(normalizeLanguage))].filter(Boolean)

    // currentLanguage + completedLanguages come from journey state on User.
    const user = await User.findById(req.userId).select('currentLanguage completedLanguages').lean()
    const userCurrent = user?.currentLanguage ? normalizeLanguage(user.currentLanguage) : null

    const userCompletedRaw = Array.isArray(user?.completedLanguages) ? user.completedLanguages : []
    const userCompleted = [...new Set(userCompletedRaw.map(normalizeLanguage).filter(Boolean))]

    // Compute completedLanguages from DB (per-video completion) so refresh stays consistent.
    const computedCompleted = []
    for (const lang of LANGUAGE_ORDER) {
      const total = await Video.countDocuments({ userId: req.userId, language: lang })
      if (total === 0) continue
      const done = await VideoProgress.countDocuments({ userId: req.userId, language: lang, completed: true })
      if (done >= total) computedCompleted.push(lang)
    }

    // Merge user state with computed state (computed wins).
    const completedLanguages = [...new Set([...userCompleted, ...computedCompleted])]

    // For custom journeys, use UserSkill.currentLanguage directly —
    // custom languages are not in LANGUAGE_ORDER so we must not normalise them.
    const isCustom = skill?.startMode === 'custom'
    const customLangs = Array.isArray(skill?.customLanguages) ? skill.customLanguages : []

    let currentLanguage
    let normalizedCurrentLanguage

    if (isCustom && customLangs.length > 0) {
      // Source of truth for custom journeys is UserSkill, not User
      currentLanguage = skill?.currentLanguage || customLangs[0]
      normalizedCurrentLanguage = currentLanguage
    } else {
      currentLanguage =
        userCurrent ||
        (knownLanguages.length
          ? knownLanguages.slice().sort((a, b) => LANGUAGE_ORDER.indexOf(a) - LANGUAGE_ORDER.indexOf(b))[0]
          : null) ||
        'HTML'
      let currentIdx = LANGUAGE_ORDER.indexOf(currentLanguage)
      if (currentIdx < 0) currentIdx = 0
      normalizedCurrentLanguage = LANGUAGE_ORDER[currentIdx]
    }

    let roadmap
    if (isCustom && customLangs.length > 0) {
      const currentCustomIdx = customLangs.indexOf(currentLanguage)
      roadmap = customLangs.map((lang, idx) => {
        if (idx < currentCustomIdx) return { language: lang, status: 'completed' }
        if (idx === currentCustomIdx) return { language: lang, status: 'current' }
        return { language: lang, status: 'locked' }
      })
    } else {
      // Default: index-based status against LANGUAGE_ORDER
      const currentIdx = LANGUAGE_ORDER.indexOf(normalizedCurrentLanguage)
      roadmap = LANGUAGE_ORDER.map((lang) => {
        const idx = LANGUAGE_ORDER.indexOf(lang)
        if (idx < currentIdx) return { language: lang, status: 'completed' }
        if (idx === currentIdx) return { language: lang, status: 'current' }
        return { language: lang, status: 'locked' }
      })
    }

    res.json({
      knownLanguages,
      completedLanguages,
      currentLanguage: normalizedCurrentLanguage,
      roadmap,
      startMode:       skill?.startMode || 'assessment',
      customLanguages: Array.isArray(skill?.customLanguages) ? skill.customLanguages : [],
    })
  } catch (e) {
    next(e)
  }
}

function roadmapUpdateValidators() {
  return [
    body('language').trim().notEmpty().isLength({ max: 80 }),
    body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('miniProjectsCompleted').optional().isInt({ min: 0 }),
    body('tasksCompleted').optional().isInt({ min: 0 }),
  ];
}

async function updateRoadmap(req, res, next) {
  try {
    const { language, level, miniProjectsCompleted, tasksCompleted } = req.body;

    const payload = {};
    if (level !== undefined) payload.level = level;
    if (miniProjectsCompleted !== undefined) payload.miniProjectsCompleted = miniProjectsCompleted;
    if (tasksCompleted !== undefined) payload.tasksCompleted = tasksCompleted;

    const doc = await Roadmap.findOneAndUpdate(
      { userId: req.userId, language: language.trim() },
      { $set: { ...payload, language: language.trim(), userId: req.userId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ success: true, roadmap: doc });
  } catch (e) {
    if (e.code === 11000) {
      next(new HttpError(409, 'Roadmap conflict'));
      return;
    }
    next(e);
  }
}

// ── POST /api/roadmap/reset ───────────────────────────────────────────────
async function resetRoadmap(req, res, next) {
  try {
    const userId = req.userId

    // ── Snapshot XP before deleting any data ─────────────────────────────
    // XP is computed from VideoProgress + Progress + Roadmap counts.
    // We read those counts NOW, before deletion, and persist the total
    // to User.totalXP so it survives the reset.
    const [topicsDone, tasksSubmitted, projectAgg] = await Promise.all([
      VideoProgress.countDocuments({ userId, completed: true }),
      Progress.countDocuments({ userId, completed: true }),
      Roadmap.aggregate([
        { $match: { userId } },
        { $group: { _id: null, sum: { $sum: { $ifNull: ['$miniProjectsCompleted', 0] } } } },
      ]),
    ])
    const projectsBuilt = projectAgg?.[0]?.sum || 0
    const earnedXP = topicsDone * 10 + tasksSubmitted * 5 + projectsBuilt * 20

    // Read existing accumulated XP so we add to it, not overwrite it
    const userBefore = await User.findById(userId).select('totalXP').lean()
    const previousXP = userBefore?.totalXP || 0
    const preservedXP = previousXP + earnedXP

    console.log(`[Reset] userId: ${userId} | earnedXP: ${earnedXP} | previousXP: ${previousXP} | preservedXP: ${preservedXP}`)

    // 1. Collect all playlist IDs owned by this user
    const playlists = await Playlist.find({ userId }).select('_id').lean()
    const playlistIds = playlists.map((p) => p._id)

    // 2. Collect all video IDs from those playlists
    const videos = await Video.find({ playlistId: { $in: playlistIds } }).select('_id').lean()
    const videoIds = videos.map((v) => v._id)

    // 3. Delete in dependency order
    await CodeSubmission.deleteMany({ userId })
    await Progress.deleteMany({ userId })
    await VideoProgress.deleteMany({ userId })
    await Task.deleteMany({ videoId: { $in: videoIds } })
    await Video.deleteMany({ playlistId: { $in: playlistIds } })
    await Playlist.deleteMany({ userId })
    await Roadmap.deleteMany({ userId })
    await AssessmentResult.deleteMany({ userId })
    await UserMiniProject.deleteMany({ userId })
    await UserSkill.deleteOne({ userId })

    // 4. Reset journey fields only — streakCount, lastLoginDate, and totalXP are preserved
    await User.findByIdAndUpdate(userId, {
      $set: {
        currentLanguage:    null,
        completedLanguages: [],
        upcomingLanguages:  [],
        totalXP:            preservedXP,
      },
    })

    console.log(`[Reset] XP preserved: ${preservedXP}`)

    res.json({ success: true, message: 'Roadmap reset successfully' })
  } catch (e) {
    next(e)
  }
}

module.exports = { getRoadmap, updateRoadmap, roadmapUpdateValidators, resetRoadmap };
