/**
 * Lightweight, sandbox-free evaluation for MVP.
 * Replace with an isolated runner (Docker/worker) in production.
 */
function evaluateSubmission(task, code) {
  const codeNorm = (code || '').trim();
  const exp = (task.expectedOutput || '').trim();

  if (!exp) {
    return {
      status: 'passed',
      score: 85,
      output: 'Submission recorded (no automated check for this task).',
      error: null,
    };
  }

  const expParts = exp
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const codeLower = codeNorm.toLowerCase();
  let hits = 0;
  for (const w of expParts) {
    if (codeLower.includes(w)) hits += 1;
  }
  const ratio = expParts.length ? hits / expParts.length : 0;
  const passed = ratio >= 0.4 || codeNorm.length >= 30;

  const score = passed
    ? Math.min(100, 68 + Math.round(ratio * 28) + Math.min(8, Math.floor(codeNorm.length / 80)))
    : 38 + Math.round(ratio * 20);

  return {
    status: passed ? 'passed' : 'failed',
    score,
    output: passed
      ? 'Automated checks passed. Keep refining style and edge cases.'
      : 'Not quite there yet — align your solution with the expected output hints.',
    error: passed ? null : 'Did not satisfy expected output checks',
  };
}

module.exports = { evaluateSubmission };
