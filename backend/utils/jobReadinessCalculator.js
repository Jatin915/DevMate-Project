/**
 * Dynamic Job-Readiness Score from platform activity.
 * Weights: task completion, code quality, debugging, projects, consistency/concept.
 */

const WEIGHTS = {
  completion: 0.25,
  codeQuality: 0.25,
  debugging: 0.2,
  project: 0.15,
  consistency: 0.15,
};

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * @param {object} params
 * @param {number} params.totalTasks - total tasks across user's content
 * @param {number} params.completedTasks
 * @param {Array<{ difficulty?: string }>} params.completedTaskDocs - for concept weighting
 * @param {Array<{ status?: string, executionResult?: { score?: number } }>} params.submissions
 * @param {number} params.miniProjectsCompleted
 * @param {number} params.distinctActiveDays - streak proxy (optional)
 */
function computeJobReadinessScores(params) {
  const {
    totalTasks = 0,
    completedTasks = 0,
    completedTaskDocs = [],
    submissions = [],
    miniProjectsCompleted = 0,
    distinctActiveDays = 0,
  } = params;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  let conceptAccuracy = completionRate;
  if (completedTaskDocs.length > 0) {
    const weight = { easy: 1, medium: 1.5, hard: 2 };
    let num = 0;
    let den = 0;
    for (const t of completedTaskDocs) {
      const w = weight[t.difficulty] || 1;
      num += 100 * w;
      den += w;
    }
    conceptAccuracy = den > 0 ? num / den : completionRate;
  }
  conceptAccuracy = clamp(conceptAccuracy);

  const graded = submissions.filter((s) => s.executionResult && typeof s.executionResult.score === 'number');
  const codeQuality =
    graded.length > 0
      ? graded.reduce((a, s) => a + s.executionResult.score, 0) / graded.length
      : clamp(completionRate * 0.85);

  const totalSubs = submissions.length;
  const passed = submissions.filter((s) => s.status === 'passed').length;
  const debuggingScore =
    totalSubs > 0 ? clamp((passed / totalSubs) * 100 + (passed < totalSubs ? 5 : 0)) : clamp(completionRate * 0.9);

  const projectScore = clamp(Math.min(100, miniProjectsCompleted * 15 + (miniProjectsCompleted >= 3 ? 10 : 0)));

  const consistencyScore = clamp(
    completionRate * 0.6 + Math.min(40, distinctActiveDays * 4),
  );

  const codingScore = round1((codeQuality * 0.55 + conceptAccuracy * 0.45));

  const overallScore = Math.round(
    completionRate * WEIGHTS.completion +
      codeQuality * WEIGHTS.codeQuality +
      debuggingScore * WEIGHTS.debugging +
      projectScore * WEIGHTS.project +
      consistencyScore * WEIGHTS.consistency,
  );

  return {
    codingScore: clamp(codingScore, 0, 100),
    debuggingScore: round1(debuggingScore),
    projectScore: round1(projectScore),
    consistencyScore: round1(consistencyScore),
    conceptAccuracy: round1(conceptAccuracy),
    overallScore: clamp(overallScore, 0, 100),
  };
}

module.exports = { computeJobReadinessScores, WEIGHTS };
