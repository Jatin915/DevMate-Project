const { body } = require('express-validator');
const Assessment = require('../models/Assessment');
const UserSkill = require('../models/UserSkill');
const AssessmentResult = require('../models/AssessmentResult');
const { ensureAssessmentsForLanguages } = require('../utils/assessmentCatalog');
const { evaluateAssessment } = require('../utils/assessmentEvaluator');
const { refreshSkillProgressFromResults } = require('./userSkillController');
const { HttpError } = require('../middleware/errorHandler');

function assessmentSubmitValidators() {
  return [
    body('language').isString().trim().notEmpty().withMessage('language is required'),
    body('code').isString().isLength({ min: 1, max: 150000 }).withMessage('code is required'),
  ];
}

async function getAssessments(req, res, next) {
  try {
    const skill = await UserSkill.findOne({ userId: req.userId });
    if (!skill || skill.knownLanguages.length === 0) {
      next(new HttpError(400, 'Select skills first using POST /api/user/skills'));
      return;
    }

    await ensureAssessmentsForLanguages(skill.knownLanguages);

    const tasks = await Assessment.find({ language: { $in: skill.knownLanguages } })
      .sort({ language: 1 })
      .lean();

    const results = await AssessmentResult.find({ userId: req.userId }).lean();
    const byLanguage = Object.fromEntries(results.map((r) => [r.language, r]));

    res.json({
      success: true,
      assessments: tasks.map((t) => ({
        id: t._id,
        language: t.language,
        taskTitle: t.taskTitle,
        description: t.description,
        starterCode: t.starterCode,
        expectedOutput: t.expectedOutput,
        difficulty: t.difficulty,
        result: byLanguage[t.language]
          ? {
              score: byLanguage[t.language].score,
              passed: byLanguage[t.language].passed,
              updatedAt: byLanguage[t.language].updatedAt,
            }
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
}

async function submitAssessment(req, res, next) {
  try {
    const { language, code } = req.body;

    const skill = await UserSkill.findOne({ userId: req.userId });
    if (!skill || !skill.knownLanguages.includes(language)) {
      next(new HttpError(403, 'Language not selected for your onboarding'));
      return;
    }

    const task = await Assessment.findOne({ language }).sort({ updatedAt: -1 });
    if (!task) {
      next(new HttpError(404, `Assessment task not found for ${language}`));
      return;
    }

    const evaluation = await evaluateAssessment(task, code);

    const result = await AssessmentResult.findOneAndUpdate(
      { userId: req.userId, language },
      {
        $set: {
          userId: req.userId,
          language,
          submittedCode: code,
          score: evaluation.score,
          passed: evaluation.passed,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const refreshed = await refreshSkillProgressFromResults(req.userId);
    const allPassed = !!refreshed?.assessmentCompleted;

    res.json({
      success: true,
      language,
      score: evaluation.score,
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      evaluator: evaluation.provider,
      result,
      assessmentCompleted: allPassed,
      passedLanguages: refreshed?.passedLanguages || [],
      recommendedNextLanguage: refreshed?.recommendedNextLanguage || null,
      currentLanguage: refreshed?.currentLanguage || null,
      nextModuleUnlocked: allPassed,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getAssessments,
  submitAssessment,
  assessmentSubmitValidators,
};
