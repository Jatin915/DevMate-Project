function heuristicEvaluate(task, code) {
  const text = (code || '').toLowerCase();
  const expected = (task.expectedOutput || '').toLowerCase();
  const tokens = expected.split(/[^a-z0-9]+/).filter((t) => t.length > 3);
  let hits = 0;
  for (const t of tokens) {
    if (text.includes(t)) hits += 1;
  }
  const ratio = tokens.length ? hits / tokens.length : 0;
  const base = Math.min(35, Math.floor((code || '').length / 8));
  const score = Math.min(100, 45 + Math.round(ratio * 40) + base);
  const passed = score >= 80;
  return {
    score,
    passed,
    feedback: passed
      ? 'Good solution structure and expected behavior detected.'
      : 'Your solution needs stronger correctness and output alignment. Improve logic and retry.',
    provider: 'heuristic',
  };
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function llmEvaluate(task, code) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const prompt = [
    'You are a strict code evaluator.',
    'Score from 0 to 100 based on syntax correctness, logic correctness, output correctness.',
    'Return JSON only: {"score": number, "feedback": string}.',
    `Task title: ${task.taskTitle}`,
    `Task description: ${task.description}`,
    `Expected output: ${task.expectedOutput}`,
    `Starter code: ${task.starterCode}`,
    'Submitted code:',
    code,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0,
      max_output_tokens: 220,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.output_text || '';
  const parsed = extractJson(content);
  if (!parsed || typeof parsed.score !== 'number') return null;

  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return {
    score,
    passed: score >= 80,
    feedback: parsed.feedback || 'Evaluation completed.',
    provider: 'openai',
  };
}

async function evaluateAssessment(task, code) {
  try {
    const aiResult = await llmEvaluate(task, code);
    if (aiResult) return aiResult;
  } catch {
    // fallback below
  }
  return heuristicEvaluate(task, code);
}

module.exports = { evaluateAssessment };
