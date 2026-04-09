/**
 * aiService.js — OpenRouter code evaluation with optimized-code refinement.
 *
 * Flow:
 *   1. Evaluate user code → get score + optimizedCode candidate
 *   2. If score >= 70 and optimizedCode exists → refine loop (max 2 passes)
 *      Each pass re-evaluates the optimized code and asks AI to improve it
 *      until the refined version scores >= 95.
 *   3. Return the final best optimizedCode.
 */

// ── JSON extraction ───────────────────────────────────────────────────────
function safeExtractJson(raw) {
  if (!raw || typeof raw !== 'string') return null

  console.log('[AI RAW]', raw)

  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()

  const jsonStart = stripped.indexOf('{')
  const jsonEnd   = stripped.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    console.warn('[AI] No JSON boundaries found in content')
    return null
  }

  const clean = stripped.slice(jsonStart, jsonEnd + 1)
  try { return JSON.parse(clean) } catch (e1) {
    console.warn('[AI] JSON.parse failed on clean slice:', e1.message)
  }
  try { return JSON.parse(raw.trim()) } catch (e2) {
    console.warn('[AI] JSON.parse failed on raw string:', e2.message)
    return null
  }
}

// ── Result normalisation ──────────────────────────────────────────────────
function normaliseResult(parsed, rawFallback) {
  if (!parsed) {
    console.warn('[AI] Parse-failure fallback (score 50)')
    return {
      score: 50,
      feedback: rawFallback
        ? `AI response parsing failed. Raw: ${String(rawFallback).slice(0, 300)}`
        : 'AI response parsing failed but logic seems partially correct.',
      errors: [], suggestions: ['Try submitting again.'], optimizedCode: null,
    }
  }

  const rawScore = parsed.correctnessScore ?? parsed.score ?? 50
  const score    = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 50)))
  const feedback = typeof parsed.feedback === 'string' && parsed.feedback.trim()
    ? parsed.feedback.trim() : 'Evaluation complete.'
  const errors      = Array.isArray(parsed.errors)      ? parsed.errors.filter(Boolean).map(String)      : []
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(Boolean).map(String) : []
  const optimizedCode = score >= 70 &&
    typeof parsed.optimizedCode === 'string' && parsed.optimizedCode.trim()
      ? parsed.optimizedCode.trim() : null

  console.log('[AI] Normalised score:', score, '| optimizedCode:', !!optimizedCode)
  return { score, feedback, errors, suggestions, optimizedCode }
}

// ── Low-level HTTP helper ─────────────────────────────────────────────────
// Sends messages to OpenRouter and returns { ok, status, rawText }.
// Caller decides which model to use and what messages to send.
async function rawCall(apiKey, modelId, messages) {
  console.log('[AI] MODEL:', modelId, '| messages:', messages.length)

  let resp
  try {
    resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'http://localhost:5173',
        'X-Title':       'DevMate',
      },
      body: JSON.stringify({
        model:       modelId,
        messages,
        temperature: 0,
        max_tokens:  1000,
        // response_format intentionally omitted — not supported by all models
      }),
    })
  } catch (networkErr) {
    console.error('[AI] Network error:', networkErr.message)
    throw new Error(`Network error: ${networkErr.message}`)
  }

  const rawText = await resp.text().catch(() => '')
  console.log('[AI] STATUS:', resp.status, '| body (first 500):', rawText.slice(0, 500))
  return { ok: resp.ok, status: resp.status, rawText }
}

// ── Parse OpenRouter envelope → content string ────────────────────────────
function extractContent(rawText) {
  let httpData
  try { httpData = JSON.parse(rawText) } catch {
    console.error('[AI] Non-JSON HTTP response:', rawText.slice(0, 200))
    throw new Error('OpenRouter returned non-JSON HTTP response')
  }
  const payload = httpData?.data ?? httpData
  return payload?.choices?.[0]?.message?.content ?? payload?.choices?.[0]?.text ?? null
}

// ── Refinement loop ───────────────────────────────────────────────────────
// Takes a candidate optimizedCode and re-evaluates it up to MAX_REFINE times.
// Each pass asks the AI to improve the code if it scores below TARGET_SCORE.
// Returns the best version found (highest score), never worse than the input.
const TARGET_SCORE  = 95
const MAX_REFINE    = 2

async function refineOptimizedCode(apiKey, model, candidate, title, description) {
  let best      = candidate
  let bestScore = 0   // will be set after first evaluation

  for (let pass = 1; pass <= MAX_REFINE; pass++) {
    console.log(`[AI] Refinement pass ${pass}/${MAX_REFINE} | candidate length: ${best.length}`)

    const refinePrompt = [
      'You are a strict code evaluator and optimizer.',
      'You MUST return ONLY valid JSON. No markdown, no text outside JSON.',
      '',
      `Task Title: ${title || '(not provided)'}`,
      `Task Description: ${description || '(not provided)'}`,
      '',
      'Evaluate the following code and, if it scores below 95, rewrite it to be fully correct:',
      best,
      '',
      'Requirements for the rewritten code:',
      '  - Must be fully working and produce correct output',
      '  - Must follow best practices for the language',
      '  - Must be clean, readable, and efficient',
      '  - Must score 95 or above if re-evaluated',
      '',
      'Return exactly this JSON and nothing else:',
      '{',
      '  "correctnessScore": <integer 0-100>,',
      '  "feedback": "<one sentence summary>",',
      '  "errors": [],',
      '  "suggestions": [],',
      '  "optimizedCode": "<fully corrected code string>"',
      '}',
      '',
      'CRITICAL: Start with { and end with }. Nothing outside the JSON.',
    ].join('\n')

    const messages = [{ role: 'user', content: refinePrompt }]
    const { ok, status, rawText } = await rawCall(apiKey, model, messages)

    if (!ok) {
      console.warn(`[AI] Refinement pass ${pass} HTTP error ${status} — keeping previous best`)
      break
    }

    let content
    try { content = extractContent(rawText) } catch {
      console.warn(`[AI] Refinement pass ${pass} envelope parse failed — keeping previous best`)
      break
    }

    if (!content) {
      console.warn(`[AI] Refinement pass ${pass} empty content — keeping previous best`)
      break
    }

    const parsed = safeExtractJson(content)
    if (!parsed) {
      console.warn(`[AI] Refinement pass ${pass} JSON parse failed — keeping previous best`)
      break
    }

    const rawScore    = parsed.correctnessScore ?? parsed.score ?? 0
    const passScore   = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)))
    const passCode    = typeof parsed.optimizedCode === 'string' && parsed.optimizedCode.trim()
      ? parsed.optimizedCode.trim()
      : null

    console.log(`[AI] Refinement pass ${pass} score: ${passScore}`)

    // Keep the best version seen so far
    if (passScore > bestScore) {
      bestScore = passScore
      if (passCode) best = passCode
    }

    // Stop early if we've hit the target
    if (passScore >= TARGET_SCORE) {
      console.log(`[AI] Refinement target ${TARGET_SCORE} reached on pass ${pass}`)
      break
    }
  }

  console.log(`[AI] Refinement complete | final score: ${bestScore} | code length: ${best.length}`)
  return best
}

// ── Main export ───────────────────────────────────────────────────────────
async function evaluateCode(code, problemDescription, { taskTitle = '', taskDescription = '', files = null } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY

  console.log('[AI] OPENROUTER_API_KEY present:', !!apiKey, '| length:', apiKey?.length ?? 0)

  if (!apiKey || !apiKey.trim()) {
    return {
      score: 0,
      feedback: 'OpenRouter API key is not configured. Set OPENROUTER_API_KEY in your .env file.',
      errors: ['OPENROUTER_API_KEY is missing'],
      suggestions: ['Add OPENROUTER_API_KEY=sk-or-v1-... to backend/.env and restart the server.'],
      optimizedCode: null,
    }
  }

  const title       = (taskTitle       || '').trim()
  const description = (taskDescription || problemDescription || '').trim()
  const userCode    = (code            || '').trim()
  const model       = (process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat').trim()
  const FALLBACK    = 'openai/gpt-4o-mini'

  // ── Build prompt — multi-file or single-file ──────────────────────────
  const isMultiFile = files && typeof files === 'object' && Object.keys(files).length > 1

  const codeSection = isMultiFile
    ? Object.entries(files)
        .map(([filename, content]) => `FILE: ${filename}\n\`\`\`\n${content || ''}\n\`\`\``)
        .join('\n\n')
    : userCode || '(empty)'

  const evalPrompt = isMultiFile ? [
    'You are a strict code evaluator and optimizer.',
    'You MUST return ONLY valid JSON.',
    'Do NOT include: explanations, markdown, text before JSON, text after JSON.',
    '',
    `Task Title: ${title || '(not provided)'}`,
    `Task Description: ${description || '(not provided)'}`,
    '',
    'Evaluate this multi-file project:',
    '',
    codeSection,
    '',
    'Check:',
    '  1. Code correctness across all files',
    '  2. Required features implemented',
    '  3. File structure validity (correct imports, references between files)',
    '  4. Project completeness',
    '',
    'Step 1 — Score (0-100):',
    '  90-100 = correct, complete, clean',
    '  70-89  = mostly correct, minor issues',
    '  50-69  = partially correct, logic errors',
    '  0-49   = incorrect or incomplete',
    '',
    'Step 2 — If correctnessScore >= 70:',
    '  Generate optimizedCode for the PRIMARY file (the main logic file).',
    '  It must be production-quality.',
    '',
    'Step 2 — If correctnessScore < 70:',
    '  Set optimizedCode to null.',
    '',
    'Return exactly this JSON and nothing else:',
    '{',
    '  "correctnessScore": <integer 0-100>,',
    '  "feedback": "<one paragraph evaluation summary>",',
    '  "errors": ["<error1>"],',
    '  "suggestions": ["<suggestion1>"],',
    '  "optimizedCode": "<improved primary file code if score >= 70, otherwise null>"',
    '}',
    '',
    'CRITICAL: Start with { and end with }. Nothing outside the JSON.',
  ].join('\n') : [
    'You are a strict code evaluator and optimizer.',
    'You MUST return ONLY valid JSON.',
    'Do NOT include: explanations, markdown, text before JSON, text after JSON.',
    'If the input is not valid code (e.g. plain English text), return correctnessScore: 0.',
    '',
    `Task Title: ${title || '(not provided)'}`,
    `Task Description: ${description || '(not provided)'}`,
    '',
    'Student Code:',
    codeSection,
    '',
    'Step 1 — Evaluate and score (0-100):',
    '  90-100 = correct and clean',
    '  70-89  = mostly correct, minor issues',
    '  50-69  = partially correct, logic errors',
    '  0-49   = incorrect or incomplete',
    '',
    'Step 2 — If correctnessScore >= 70:',
    '  Generate optimizedCode that is fully working, clean, and follows best practices.',
    '  The optimized code must be production-quality and score >= 95 if re-evaluated.',
    '',
    'Step 2 — If correctnessScore < 70:',
    '  Set optimizedCode to null.',
    '',
    'Return exactly this JSON and nothing else:',
    '{',
    '  "correctnessScore": <integer 0-100>,',
    '  "feedback": "<one paragraph evaluation summary>",',
    '  "errors": ["<error1>"],',
    '  "suggestions": ["<suggestion1>"],',
    '  "optimizedCode": "<improved code string if score >= 70, otherwise null>"',
    '}',
    '',
    'CRITICAL: Start with { and end with }. Nothing outside the JSON.',
  ].join('\n')

  const messages = [{ role: 'user', content: evalPrompt }]

  // ── Primary call ──────────────────────────────────────────────────────
  let { ok, status, rawText } = await rawCall(apiKey, model, messages)

  // ── Fallback if primary model fails ──────────────────────────────────
  if (!ok && model !== FALLBACK) {
    console.warn(`[AI] Primary "${model}" failed (${status}). Trying fallback: ${FALLBACK}`)
    ;({ ok, status, rawText } = await rawCall(apiKey, FALLBACK, messages))
  }

  if (!ok) {
    throw new Error(`OpenRouter error ${status}: ${rawText.slice(0, 200) || 'Unknown error'}`)
  }

  // ── Parse response ────────────────────────────────────────────────────
  let content
  try { content = extractContent(rawText) } catch (e) { throw e }

  console.log('[AI] Extracted content:', String(content ?? '').slice(0, 500))

  if (!content) {
    console.error('[AI] No content in response')
    return normaliseResult(null, null)
  }

  const parsed = safeExtractJson(content)
  const result = normaliseResult(parsed, parsed ? null : content)

  // ── Refinement loop — only when initial optimizedCode exists ──────────
  if (result.optimizedCode) {
    console.log('[AI] Starting refinement loop for optimizedCode')
    const activeModel = (!ok && model !== FALLBACK) ? FALLBACK : model
    const refined = await refineOptimizedCode(
      apiKey, activeModel, result.optimizedCode, title, description,
    ).catch((err) => {
      // Refinement is non-fatal — keep the original candidate on error
      console.error('[AI] Refinement loop error (keeping original):', err.message)
      return result.optimizedCode
    })
    result.optimizedCode = refined
  }

  return result
}

module.exports = { evaluateCode }
