function extractFirstJsonObject(text) {
  if (!text) return null
  const match = String(text).match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function evaluateCode(code, problemDescription) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      score: 0,
      feedback: 'OpenRouter API key is not configured.',
      suggestions: ['Set `OPENROUTER_API_KEY` in your backend environment.'],
    }
  }

  const problem = (problemDescription || '').trim()
  const submittedCode = (code || '').trim()

  const systemPrompt =
    'You are a strict coding evaluator. Evaluate the submitted code against the problem description.'

  const userPrompt = [
    'Problem description:',
    problem || '(not provided)',
    '',
    'Submitted code:',
    submittedCode || '(empty)',
    '',
    'Check:',
    '- code correctness',
    '- logic',
    '- output accuracy',
    '',
    'Return ONLY valid JSON with this exact schema:',
    '{ "score": number, "feedback": string, "suggestions": string[] }',
    'Rules:',
    '- score must be an integer from 0 to 100',
    '- suggestions should be 1-5 actionable items',
  ].join('\n')

  const requestBody = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    // Keep responses short; we only need score + feedback + suggestions
    max_tokens: 500,
  }

  if (process.env.OPENROUTER_MODEL) {
    requestBody.model = process.env.OPENROUTER_MODEL
  }

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`OpenRouter error ${resp.status}: ${text || 'Unknown error'}`)
  }

  const data = await resp.json()
  // OpenRouter may wrap payload under `data`, depending on client/transport.
  const aiResponseData = data?.data ?? data
  console.log('AI Response:', aiResponseData)

  // Expected format:
  // response.data.choices[0].message.content
  const content =
    aiResponseData?.choices?.[0]?.message?.content ??
    aiResponseData?.choices?.[0]?.text ??
    null

  const parsed = typeof content === 'string' ? extractFirstJsonObject(content) : null

  const scoreRaw = parsed?.score
  const score =
    typeof scoreRaw === 'number'
      ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
      : 0

  if (!parsed) {
    // If response missing/invalid, do not throw: caller expects a safe fallback.
    return {
      score: 0,
      feedback: 'AI did not return a valid evaluation response. Using fallback evaluation.',
      suggestions: [],
    }
  }

  return {
    score,
    feedback: parsed?.feedback ? String(parsed.feedback) : 'Evaluation completed.',
    suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions.map(String) : [],
  }
}

module.exports = { evaluateCode }

