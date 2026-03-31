const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
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
    const { name, email } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      next(new HttpError(404, 'User not found'));
      return;
    }
    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        next(new HttpError(409, 'Email already in use'));
        return;
      }
      user.email = email;
    }
    if (name) user.name = name;
    await user.save();
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
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  signToken,
  authValidatorsSignup,
  authValidatorsLogin,
  authValidatorsUpdateProfile,
};
