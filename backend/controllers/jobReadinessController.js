const JobReadiness = require('../models/JobReadiness');
const { recalculateJobReadiness } = require('../utils/jobReadinessService');

async function getScore(req, res, next) {
  try {
    await recalculateJobReadiness(req.userId);
    const doc = await JobReadiness.findOne({ userId: req.userId });
    res.json({
      success: true,
      score: doc || {
        codingScore: 0,
        debuggingScore: 0,
        projectScore: 0,
        consistencyScore: 0,
        conceptAccuracy: 0,
        overallScore: 0,
        lastUpdated: null,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getReport(req, res, next) {
  try {
    await recalculateJobReadiness(req.userId);
    const doc = await JobReadiness.findOne({ userId: req.userId }).lean();
    const overall = doc?.overallScore ?? 0;

    const strengths = [];
    const weaknesses = [];
    const dims = [
      ['Coding & concepts', doc?.codingScore ?? 0],
      ['Debugging & delivery', doc?.debuggingScore ?? 0],
      ['Projects & portfolio', doc?.projectScore ?? 0],
      ['Consistency', doc?.consistencyScore ?? 0],
    ];
    for (const [label, val] of dims) {
      if (val >= 70) strengths.push({ skill: label, score: Math.round(val) });
      else weaknesses.push({ skill: label, score: Math.round(val), action: `Practice more ${label.toLowerCase()} tasks` });
    }

    const band =
      overall >= 85 ? 'Strong candidate' : overall >= 65 ? 'Junior-ready' : overall >= 40 ? 'Building foundation' : 'Getting started';

    res.json({
      success: true,
      report: {
        overallScore: overall,
        band,
        breakdown: doc,
        strengths: strengths.slice(0, 6),
        weaknesses: weaknesses.slice(0, 6),
        suggestions: [
          { title: 'Complete more playlist tasks', priority: 'High', xp: '+150 XP' },
          { title: 'Submit code for harder tasks', priority: 'Medium', xp: '+120 XP' },
          { title: 'Finish a mini project', priority: 'Medium', xp: '+200 XP' },
        ],
      },
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { getScore, getReport };
