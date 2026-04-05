const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const VideoProgress = require('../models/VideoProgress');
const Progress = require('../models/Progress');
const JobReadiness = require('../models/JobReadiness');
const UserMiniProject = require('../models/UserMiniProject');
const { HttpError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function authValidatorsSignup() {
  return [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ];
}

function authValidatorsLogin() {
  return [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ];
}

function authValidatorsUpdateProfile() {
  return [
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ];
}

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function computeNextStreak({ lastLoginDate, streakCount }) {
  // Streak counts consecutive days. We only increment when the user logs in on a new day.
  const today = startOfDayUTC(new Date());
  if (!lastLoginDate) {
    return { lastLoginDate: today, streakCount: 1 };
  }

  const last = startOfDayUTC(new Date(lastLoginDate));
  const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { lastLoginDate: today, streakCount: streakCount || 0 };
  }
  if (diffDays === 1) {
    return { lastLoginDate: today, streakCount: (streakCount || 0) + 1 };
  }

  // Missed a day (or more): reset.
  return { lastLoginDate: today, streakCount: 1 };
}

async function buildOnboardingStatus(userId) {
  const skill = await UserSkill.findOne({ userId }).lean();
  if (!skill) {
    return {
      skillsSelected: false,
      assessmentCompleted: false,
      knownLanguages: [],
      passedLanguages: [],
      recommendedNextLanguage: null,
      startMode: 'assessment',
      currentLanguage: null,
      journeyStarted: false,
    };
  }
  return {
    skillsSelected: (skill.knownLanguages || []).length > 0,
    assessmentCompleted: !!skill.assessmentCompleted,
    knownLanguages: skill.knownLanguages || [],
    passedLanguages: skill.passedLanguages || [],
    recommendedNextLanguage: skill.recommendedNextLanguage || null,
    startMode: skill.startMode || 'assessment',
    currentLanguage: skill.currentLanguage || null,
    journeyStarted: !!skill.journeyStarted,
  };
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      next(new HttpError(409, 'Email already registered'));
      return;
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: 'student',
    });
    const token = signToken(user);
    const onboarding = await buildOnboardingStatus(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      onboarding,
    });
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      next(new HttpError(401, 'Invalid email or password'));
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      next(new HttpError(401, 'Invalid email or password'));
      return;
    }

    // Update daily streak on login only (signup keeps streak at 0 by default).
    const nextStreak = computeNextStreak({
      lastLoginDate: user.lastLoginDate,
      streakCount: user.streakCount,
    });
    user.lastLoginDate = nextStreak.lastLoginDate;
    user.streakCount = nextStreak.streakCount;
    await user.save();

    const token = signToken(user);
    const onboarding = await buildOnboardingStatus(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      onboarding,
    });
  } catch (e) {
    next(e);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      next(new HttpError(404, 'User not found'));
      return;
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      onboarding: await buildOnboardingStatus(user._id),
    });
  } catch (e) {
    next(e);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      next(new HttpError(404, 'User not found'));
      return;
    }

    // Name
    if (name && name.trim()) user.name = name.trim();

    // Email — check uniqueness
    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        next(new HttpError(409, 'Email already in use'));
        return;
      }
      user.email = email;
    }

    // Password — only update if provided and meets minimum length
    if (password && password.length >= 8) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    } else if (password && password.length > 0) {
      next(new HttpError(400, 'Password must be at least 8 characters'));
      return;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id:        user._id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        initials:  user.name ? user.name.slice(0, 2).toUpperCase() : '??',
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

// ── GET /api/auth/profile/me ──────────────────────────────────────────────
// Returns everything the Profile page needs in one request.
async function getFullProfile(req, res, next) {
  try {
    const userId = req.userId

    // ── User basics ───────────────────────────────────────────────────────
    const user = await User.findById(userId).lean()
    if (!user) { next(new HttpError(404, 'User not found')); return }

    const streak = user.streakCount || 0

    // ── XP (accumulated + current session) ───────────────────────────────
    const topicsDone    = await VideoProgress.countDocuments({ userId, completed: true })
    const tasksCompleted = await Progress.countDocuments({ userId, completed: true })
    const sessionXP     = topicsDone * 10 + tasksCompleted * 5
    const xpPoints      = (user.totalXP || 0) + sessionXP

    // ── Job readiness ─────────────────────────────────────────────────────
    const jr = await JobReadiness.findOne({ userId }).lean()
    const jobReadiness = jr?.overallScore ?? 0

    // ── Skills — languages the user has started (has VideoProgress rows) ──
    const vpLangs = await VideoProgress.distinct('language', { userId })
    const skills  = [...new Set(vpLangs)].filter(Boolean)

    // ── Completed mini projects ───────────────────────────────────────────
    const miniDocs = await UserMiniProject.find({ userId }).lean()
    const completedProjects = []
    for (const doc of miniDocs) {
      for (const p of doc.projects || []) {
        if (p.status === 'submitted') {
          completedProjects.push({
            title:     p.title,
            language:  doc.language,
            score:     p.aiScore ?? null,
            projectId: p.projectId,
          })
        }
      }
    }
    completedProjects.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

    // ── Achievements — earned dynamically ────────────────────────────────
    const achievements = []

    if (streak >= 7)
      achievements.push({ icon: '🔥', title: '7-Day Streak',   desc: `${streak} days in a row` })
    else if (streak >= 3)
      achievements.push({ icon: '🔥', title: '3-Day Streak',   desc: `${streak} days in a row` })

    if (completedProjects.length >= 1)
      achievements.push({ icon: '🏆', title: 'First Project',  desc: 'Completed your first mini project' })

    if (completedProjects.length >= 5)
      achievements.push({ icon: '🚀', title: 'Project Builder', desc: 'Completed 5 mini projects' })

    if (tasksCompleted >= 10)
      achievements.push({ icon: '⚡', title: 'Task Master',    desc: `Completed ${tasksCompleted} tasks` })

    if (jobReadiness >= 70)
      achievements.push({ icon: '🎯', title: '70% Ready',      desc: 'Reached 70% job readiness' })

    if (topicsDone >= 5)
      achievements.push({ icon: '📚', title: 'Video Learner',  desc: `Watched ${topicsDone} videos` })

    if (xpPoints >= 500)
      achievements.push({ icon: '⭐', title: 'XP Milestone',   desc: `Earned ${xpPoints} XP` })

    res.json({
      success: true,
      name:              user.name,
      email:             user.email,
      role:              user.role,
      initials:          user.name ? user.name.slice(0, 2).toUpperCase() : '??',
      streak,
      xpPoints,
      jobReadiness,
      totalProjects:     completedProjects.length,
      skills,
      completedProjects,
      achievements,
      memberSince:       user.createdAt,
    })
  } catch (e) {
    next(e)
  }
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  getFullProfile,
  signToken,
  authValidatorsSignup,
  authValidatorsLogin,
  authValidatorsUpdateProfile,
};
