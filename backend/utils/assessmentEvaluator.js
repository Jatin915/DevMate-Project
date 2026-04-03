/**
 * assessmentEvaluator.js
 *
 * Uses the same OpenRouter engine as the CodeEditor (aiService.evaluateCode).
 * Falls back to a keyword-heuristic only when the API key is absent or the
 * call fails — never uses random scoring.
 *
 * Pass threshold: score >= 80
 */

const { evaluateCode } = require('./aiService');

// ── Heuristic fallback ────────────────────────────────────────────────────
// Used only when OpenRouter is unavailable. Scores on keyword presence and
// code length — deliberately conservative so it doesn't inflate scores.
function heuristicEvaluate(task, code) {
  const text     = (code || '').toLowerCase();
  const expected = (task.expectedOutput || '').toLowerCase();
  const tokens   = expected.split(/[^a-z0-9]+/).filter((t) => t.length > 3);

  let hits = 0;
  for (const t of tokens) {
    if (text.includes(t)) hits++;
  }

  const ratio = tokens.length ? hits / tokens.length : 0;
  // Length bonus capped at 20 points — prevents empty-but-long code from passing
  const lengthBonus = Math.min(20, Math.floor((code || '').length / 15));
  const score = Math.min(100, Math.round(40 + ratio * 40 + lengthBonus));
  const passed = score >= 80;

  return {
    score,
    passed,
    feedback: passed
      ? 'Solution structure matches expected output. Good work.'
      : 'Your solution needs stronger correctness and output alignment. Review the requirements and retry.',
    errors:      [],
    suggestions: passed ? [] : ['Re-read the task description carefully.', 'Make sure your output matches the expected format.'],
    provider:    'heuristic',
  };
}

// ── Main evaluator ────────────────────────────────────────────────────────
async function evaluateAssessment(task, code) {
  // Try OpenRouter first (same engine as CodeEditor)
  try {
    const result = await evaluateCode(code, task.description, {
      taskTitle:       task.taskTitle,
      taskDescription: task.description,
    });

    // aiService returns score, feedback, errors[], suggestions[], optimizedCode
    const score  = typeof result.score === 'number' ? result.score : 0;
    const passed = score >= 80;

    console.log(`[Assessment] AI score: ${score} | passed: ${passed} | language: ${task.language}`)

    return {
      score,
      passed,
      feedback:    result.feedback    || 'Evaluation complete.',
      errors:      result.errors      || [],
      suggestions: result.suggestions || [],
      provider:    'openrouter',
    };
  } catch (e) {
    console.warn('[Assessment] AI evaluation failed, using heuristic fallback:', e.message);
    return heuristicEvaluate(task, code);
  }
}

module.exports = { evaluateAssessment };
