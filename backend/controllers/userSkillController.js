const { body } = require('express-validator');
const UserSkill = require('../models/UserSkill');
const AssessmentResult = require('../models/AssessmentResult');
const Roadmap = require('../models/Roadmap');
const { ensureAssessmentsForLanguages } = require('../utils/assessmentCatalog');
const { HttpError } = require('../middleware/errorHandler');

const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB'];

function normalizeLanguage(lang) {
  const v = (lang || '').trim();
  if (v === 'Node.js') return 'Node';
  if (v === 'Express.js') return 'Express';
  return v;
}

function computeNextLanguage(passedLanguages) {
  const normalized = [...new Set((passedLanguages || []).map(normalizeLanguage))];
  const indices = normalized.map((l) => LANGUAGE_ORDER.indexOf(l)).filter((i) => i >= 0);
  if (indices.length === 0) return 'HTML';
  const maxIdx = Math.max(...indices);
  return maxIdx < LANGUAGE_ORDER.length - 1 ? LANGUAGE_ORDER[maxIdx + 1] : null;
}

function userSkillValidators() {
  return [
    body('knownLanguages').optional().isArray().withMessage('knownLanguages must be an array'),
    body('knownLanguages.*').optional().isString().trim().notEmpty().withMessage('language value must be text'),
  ];
}

async function saveUserSkills(req, res, next) {
  try {
    const incoming = Array.isArray(req.body.knownLanguages) ? req.body.knownLanguages : [];
    const normalized = incoming
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);
    const knownLanguages = [...new Set(normalized)];
    if (knownLanguages.length === 0) knownLanguages.push('HTML');

    await ensureAssessmentsForLanguages(knownLanguages);

    const skillDoc = await UserSkill.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          knownLanguages,
          assessmentCompleted: false,
          passedLanguages: [],
          recommendedNextLanguage: null,
          startMode: 'assessment',
          currentLanguage: knownLanguages[0] || 'HTML',
          journeyStarted: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AssessmentResult.deleteMany({ userId: req.userId });

    res.status(201).json({ success: true, userSkill: skillDoc });
  } catch (e) {
    next(e);
  }
}

async function startFromBeginner(req, res, next) {
  try {
    const skillDoc = await UserSkill.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          userId: req.userId,
          knownLanguages: ['HTML'],
          assessmentCompleted: true,
          passedLanguages: ['HTML'],
          recommendedNextLanguage: 'HTML',
          startMode: 'beginner',
          currentLanguage: 'HTML',
          journeyStarted: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AssessmentResult.deleteMany({ userId: req.userId });

    await Roadmap.findOneAndUpdate(
      { userId: req.userId, language: 'HTML' },
      {
        $set: {
          userId: req.userId,
          language: 'HTML',
          level: 'beginner',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(200).json({
      success: true,
      userSkill: skillDoc,
      next: {
        route: '/onboarding/html-playlist',
        currentLanguage: 'HTML',
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getUserSkillProfile(req, res, next) {
  try {
    const skill = await UserSkill.findOne({ userId: req.userId }).lean();
    if (!skill) {
      res.json({
        success: true,
        onboarding: {
          skillsSelected: false,
          assessmentCompleted: false,
          knownLanguages: [],
          passedLanguages: [],
          recommendedNextLanguage: null,
          startMode: 'assessment',
          currentLanguage: null,
          journeyStarted: false,
          allPassed: false,
        },
      });
      return;
    }

    const required = skill.knownLanguages || [];
    const allPassed = required.length > 0 && required.every((lang) => (skill.passedLanguages || []).includes(lang));

    res.json({
      success: true,
      onboarding: {
        skillsSelected: required.length > 0,
        assessmentCompleted: skill.assessmentCompleted,
        knownLanguages: required,
        passedLanguages: skill.passedLanguages || [],
        recommendedNextLanguage: skill.recommendedNextLanguage || null,
        startMode: skill.startMode || 'assessment',
        currentLanguage: skill.currentLanguage || null,
        journeyStarted: !!skill.journeyStarted,
        allPassed,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function refreshSkillProgressFromResults(userId) {
  const skill = await UserSkill.findOne({ userId });
  if (!skill) return null;

  const results = await AssessmentResult.find({ userId, passed: true }).select('language');
  const passedLanguages = [...new Set(results.map((r) => normalizeLanguage(r.language)))];
  const knownNormalized = (skill.knownLanguages || []).map(normalizeLanguage);
  const allPassed = knownNormalized.length > 0 && knownNormalized.every((lang) => passedLanguages.includes(lang));
  const recommendedNextLanguage = allPassed ? computeNextLanguage(passedLanguages) : null;

  skill.passedLanguages = passedLanguages;
  skill.assessmentCompleted = allPassed;
  skill.recommendedNextLanguage = recommendedNextLanguage;
  skill.startMode = skill.startMode || 'assessment';
  skill.currentLanguage = recommendedNextLanguage || skill.currentLanguage || skill.knownLanguages[0] || 'HTML';
  if (allPassed) skill.journeyStarted = true;
  await skill.save();

  if (recommendedNextLanguage) {
    await Roadmap.findOneAndUpdate(
      { userId, language: recommendedNextLanguage },
      {
        $set: {
          userId,
          language: recommendedNextLanguage,
          level: recommendedNextLanguage === 'React' ? 'intermediate' : 'advanced',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  return skill;
}

module.exports = {
  saveUserSkills,
  startFromBeginner,
  getUserSkillProfile,
  userSkillValidators,
  refreshSkillProgressFromResults,
  computeNextLanguage,
};
