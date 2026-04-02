import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { apiRequest } from '../utils/api'

const FALLBACK_CODE = '// Write your solution here\n'

function diffBadge(d) {
  if (!d) return 'badge-cyan'
  if (d === 'easy') return 'badge-green'
  if (d === 'hard') return 'badge-orange'
  return 'badge-cyan'
}

// Colour band for AI score
function scoreMeta(score) {
  if (score >= 90) return { label: 'Excellent',          bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', color: '#15803d' }
  if (score >= 70) return { label: 'Good',               bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.30)', color: 'var(--accent)' }
  if (score >= 50) return { label: 'Needs improvement',  bg: '#fffbeb',               border: '#fde68a',               color: '#92400e' }
  return                  { label: 'Incorrect logic',    bg: '#fef2f2',               border: '#fecaca',               color: '#b91c1c' }
}

export default function CodeEditor() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // ── Context (task metadata) ───────────────────────────────────────────────
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('dm-code-eval-context') || 'null') } catch { return null }
    })()
    const taskId   = params.get('taskId')   || stored?.taskId   || null
    const videoId  = params.get('videoId')  || stored?.videoId  || null
    const language = params.get('language') || stored?.language || null
    const resolved = {
      taskId,
      videoId,
      language,
      taskTitle:          stored?.taskTitle          || '',
      taskDescription:    stored?.taskDescription    || stored?.problemDescription || '',
      difficulty:         stored?.difficulty         || 'medium',
      hints:              Array.isArray(stored?.hints) ? stored.hints : [],
      starterCode:        stored?.starterCode        || FALLBACK_CODE,
      problemDescription: stored?.problemDescription || '',
    }
    setCtx(resolved)

    // Load draft: try backend first, fall back to localStorage
    if (taskId) {
      const lsKey = `dm-draft-${taskId}`
      apiRequest(`/code/draft/${taskId}`)
        .then((res) => {
          const saved = res.code || ''
          if (saved.trim()) {
            setCode(saved)
          } else {
            // No backend draft — try localStorage backup
            const local = localStorage.getItem(lsKey)
            setCode(local && local.trim() ? local : (resolved.starterCode || FALLBACK_CODE))
          }
        })
        .catch(() => {
          // Backend unreachable — use localStorage backup
          const local = localStorage.getItem(lsKey)
          setCode(local && local.trim() ? local : (resolved.starterCode || FALLBACK_CODE))
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sibling tasks ─────────────────────────────────────────────────────────
  const [tasks, setTasks]           = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)

  useEffect(() => {
    if (!ctx?.videoId) return
    setTasksLoading(true)
    apiRequest(`/tasks/${ctx.videoId}`)
      .then((r) => setTasks(r.tasks || []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false))
  }, [ctx?.videoId])

  const orderedTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [tasks],
  )

  // ── Editor state ──────────────────────────────────────────────────────────
  const [code, setCode]           = useState(FALLBACK_CODE)
  const [activeTab, setActiveTab] = useState('task')

  // Save state
  const [saving, setSaving]           = useState(false)
  const [saveResult, setSaveResult]   = useState(null) // { success, message }

  // AI evaluation state
  const [evaluating, setEvaluating]   = useState(false)
  const [aiResult, setAiResult]       = useState(null)
  // { score, feedback, errors[], suggestions[], optimizedCode, passed, error? }

  // ── Switch task ───────────────────────────────────────────────────────────
  const switchTask = (t) => {
    const problem = [
      t.title,
      t.description || '',
      t.expectedOutput ? `Expected output:\n${t.expectedOutput}` : '',
    ].filter(Boolean).join('\n')

    const next = {
      taskId:             t.id,
      videoId:            ctx?.videoId,
      language:           ctx?.language,
      taskTitle:          t.title,
      taskDescription:    t.description || '',
      difficulty:         t.difficulty  || 'medium',
      hints:              t.hints       || [],
      starterCode:        t.starterCode || FALLBACK_CODE,
      problemDescription: problem,
    }
    localStorage.setItem('dm-code-eval-context', JSON.stringify(next))
    setCtx(next)
    setSaveResult(null)
    setAiResult(null)
    setActiveTab('task')
    window.history.replaceState(
      null, '',
      `/code-editor?taskId=${encodeURIComponent(String(t.id))}&videoId=${encodeURIComponent(String(ctx?.videoId || ''))}&language=${encodeURIComponent(ctx?.language || '')}`,
    )

    // Load draft for the newly selected task
    const lsKey = `dm-draft-${t.id}`
    apiRequest(`/code/draft/${t.id}`)
      .then((res) => {
        const saved = res.code || ''
        setCode(saved.trim() ? saved : (t.starterCode || FALLBACK_CODE))
      })
      .catch(() => {
        const local = localStorage.getItem(lsKey)
        setCode(local && local.trim() ? local : (t.starterCode || FALLBACK_CODE))
      })
  }

  // ── Save draft ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!ctx?.taskId) {
      setSaveResult({ success: false, message: 'No task selected.' })
      return
    }
    setSaving(true)
    setSaveResult(null)

    // Always write to localStorage immediately as a backup
    const lsKey = `dm-draft-${ctx.taskId}`
    try { localStorage.setItem(lsKey, code) } catch { /* storage full — ignore */ }

    try {
      await apiRequest('/code/draft', {
        method: 'POST',
        body: JSON.stringify({
          taskId: ctx.taskId,
          videoId: ctx.videoId || '',
          code,
        }),
      })
      setSaveResult({ success: true, message: 'Draft saved ✅' })
    } catch (e) {
      // Backend failed but localStorage backup already written
      setSaveResult({ success: true, message: 'Draft saved locally (offline backup)' })
    } finally {
      setSaving(false)
    }
  }

  // ── AI Evaluate ───────────────────────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!code.trim() || code.trim() === FALLBACK_CODE.trim()) {
      setAiResult({ error: 'Write some code before evaluating.' })
      setActiveTab('feedback')
      return
    }
    setEvaluating(true)
    setAiResult(null)
    setActiveTab('feedback')
    try {
      const res = await apiRequest('/ai/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          taskId:          ctx?.taskId          || '',
          videoId:         ctx?.videoId         || '',
          taskTitle:       ctx?.taskTitle        || '',
          taskDescription: ctx?.taskDescription  || ctx?.problemDescription || '',
        }),
      })

      if (!res.success) {
        setAiResult({ error: res.error || 'AI evaluation failed. Please try again.' })
        return
      }

      setAiResult({
        score:         res.score,
        feedback:      res.feedback,
        errors:        res.errors        || [],
        suggestions:   res.suggestions   || [],
        optimizedCode: res.optimizedCode || null,
        passed:        res.passed,
      })

      // If AI passed, also mark task complete
      if (res.passed && ctx?.taskId) {
        apiRequest('/tasks/complete', {
          method: 'POST',
          body: JSON.stringify({ taskId: ctx.taskId }),
        }).catch(() => {})
        // Refresh task list
        if (ctx.videoId) {
          apiRequest(`/tasks/${ctx.videoId}`)
            .then((r) => setTasks(r.tasks || []))
            .catch(() => {})
        }
      }
    } catch (e) {
      setAiResult({ error: e.message || 'AI evaluation failed. Please try again.' })
    } finally {
      setEvaluating(false)
    }
  }

  const goBack = () => {
    if (ctx?.videoId && ctx?.language) {
      navigate(`/video-task?language=${encodeURIComponent(ctx.language)}&videoId=${encodeURIComponent(ctx.videoId)}`)
    } else {
      navigate('/video-task')
    }
  }

  if (!ctx) return null

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

        {/* ── Toolbar ── */}
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid #e8e8e4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', animation: 'fadeUp 0.25s ease both', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              onClick={goBack}
              style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text2)', flexShrink: 0 }}
            >
              ← Back
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ctx.taskTitle || 'Code Editor'}
              </div>
              {ctx.language && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{ctx.language}</div>
              )}
            </div>
            {ctx.difficulty && (
              <span className={`badge ${diffBadge(ctx.difficulty)}`} style={{ fontSize: 11, flexShrink: 0 }}>
                {ctx.difficulty}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Save without AI */}
            <button
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: 13, opacity: saving ? 0.75 : 1 }}
              onClick={handleSave}
              disabled={saving || evaluating}
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            {/* AI Evaluate */}
            <button
              className="btn-primary"
              style={{ padding: '7px 16px', fontSize: 13, opacity: evaluating ? 0.75 : 1 }}
              onClick={handleEvaluate}
              disabled={evaluating || saving}
            >
              {evaluating ? '⏳ Evaluating...' : '✨ Evaluate with AI'}
            </button>
          </div>
        </div>

        {/* ── Save result banner ── */}
        {saveResult && (
          <div style={{
            padding: '9px 20px', fontSize: 13, fontWeight: 500,
            background: saveResult.success ? '#f0fdf4' : '#fef2f2',
            borderBottom: `1px solid ${saveResult.success ? '#bbf7d0' : '#fecaca'}`,
            color: saveResult.success ? '#15803d' : '#b91c1c',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{saveResult.success ? '✅' : '❌'}</span>
            <span>{saveResult.message}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 320px', flex: 1, overflow: 'hidden' }}>

          {/* ── Left: task list ── */}
          <div style={{ borderRight: '1px solid #e8e8e4', overflowY: 'auto', background: 'var(--bg)', padding: '14px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 10, paddingLeft: 4, letterSpacing: 0.5 }}>
              VIDEO TASKS
            </div>
            {tasksLoading && (
              <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 4px' }}>Loading...</div>
            )}
            {orderedTasks.map((t, idx) => {
              const isActive = String(t.id) === String(ctx.taskId)
              const isDone   = t.completed
              return (
                <div
                  key={t.id}
                  onClick={() => switchTask(t)}
                  style={{
                    padding: '9px 10px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                    background: isActive ? 'var(--accent-l)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                      background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, color: '#fff',
                    }}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      color: isDone ? 'var(--text3)' : 'var(--text)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: 1.4,
                    }}>
                      {t.title}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, marginLeft: 23 }}>
                    <span className={`badge ${diffBadge(t.difficulty)}`} style={{ fontSize: 9 }}>{t.difficulty}</span>
                  </div>
                </div>
              )
            })}
            {!tasksLoading && orderedTasks.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 4px' }}>No tasks found.</div>
            )}
          </div>

          {/* ── Centre: code textarea ── */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8e4' }}>
            <div style={{ padding: '7px 14px', background: 'var(--bg3)', borderBottom: '1px solid #e8e8e4', display: 'flex', alignItems: 'center', gap: 6 }}>
              {['#e55', '#f59e0b', '#22c55e'].map((c, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace' }}>
                solution.{ctx.language === 'HTML' ? 'html' : ctx.language === 'CSS' ? 'css' : 'js'}
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, padding: '18px 22px', background: '#0d1117',
                color: '#e6edf3', fontSize: 13.5,
                fontFamily: 'ui-monospace, Consolas, "Courier New", monospace',
                lineHeight: 1.75, border: 'none', outline: 'none', resize: 'none',
                tabSize: 2,
              }}
            />

            {/* Output strip */}
            <div style={{
              padding: '10px 18px', borderTop: '1px solid #e8e8e4', minHeight: 44,
              background: evaluating ? '#fffbeb' : saveResult?.success ? '#f0fdf4' : 'var(--bg)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background 0.3s',
            }}>
              {evaluating ? (
                <>
                  <span style={{ fontSize: 15 }}>⏳</span>
                  <span style={{ fontSize: 13, color: '#92400e' }}>AI is evaluating your code...</span>
                </>
              ) : saveResult ? (
                <>
                  <span>{saveResult.success ? '✅' : '❌'}</span>
                  <span style={{ fontSize: 13, color: saveResult.success ? '#15803d' : '#b91c1c' }}>
                    {saveResult.message}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                  Click "Evaluate with AI" for feedback, or "Save" to record your submission.
                </span>
              )}
            </div>
          </div>

          {/* ── Right: details panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e4', background: '#fff' }}>
              {['task', 'feedback', 'hints'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: 500,
                    background: 'transparent',
                    color: activeTab === tab ? 'var(--accent)' : 'var(--text3)',
                    borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer', textTransform: 'capitalize',
                    transition: 'color 0.15s, border-color 0.15s',
                    position: 'relative',
                  }}
                >
                  {tab === 'feedback' && aiResult && !aiResult.error && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 7, height: 7, borderRadius: '50%',
                      background: aiResult.passed ? 'var(--green)' : 'var(--orange)',
                    }} />
                  )}
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, padding: 14, overflowY: 'auto', background: 'var(--bg)' }}>

              {/* ── Task tab ── */}
              {activeTab === 'task' && (
                <div style={{ animation: 'fadeUp 0.2s ease both' }}>
                  {ctx.taskTitle && (
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                      {ctx.taskTitle}
                    </div>
                  )}
                  {ctx.difficulty && (
                    <span className={`badge ${diffBadge(ctx.difficulty)}`} style={{ fontSize: 11, marginBottom: 10, display: 'inline-block' }}>
                      {ctx.difficulty}
                    </span>
                  )}
                  {ctx.taskDescription ? (
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginTop: 6 }}>
                      {ctx.taskDescription}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No description available.</p>
                  )}
                  {ctx.problemDescription && ctx.problemDescription !== ctx.taskDescription && (
                    <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>EXPECTED OUTPUT</div>
                      <pre style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
                        {ctx.problemDescription.split('Expected output:')[1]?.trim() || ''}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* ── Feedback tab (AI results) ── */}
              {activeTab === 'feedback' && (
                <div style={{ animation: 'fadeUp 0.2s ease both' }}>

                  {/* Loading */}
                  {evaluating && (
                    <div style={{ padding: 16, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>⏳</div>
                      <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>Evaluating code...</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>AI is reviewing your solution</div>
                    </div>
                  )}

                  {/* Error */}
                  {!evaluating && aiResult?.error && (
                    <div style={{ padding: 14, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>❌ Evaluation failed</div>
                      <div style={{ fontSize: 13, color: '#b91c1c' }}>{aiResult.error}</div>
                    </div>
                  )}

                  {/* No result yet */}
                  {!evaluating && !aiResult && (
                    <div style={{ padding: 14, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, marginBottom: 8 }}>✨</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                        Click <strong>Evaluate with AI</strong> to get instant feedback on your code.
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {!evaluating && aiResult && !aiResult.error && (() => {
                    const meta = scoreMeta(aiResult.score)
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Score card */}
                        <div style={{ padding: 14, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: 0.5, marginBottom: 2 }}>
                                {meta.label.toUpperCase()}
                              </div>
                              <div style={{ fontSize: 32, fontWeight: 900, color: meta.color, lineHeight: 1 }}>
                                {aiResult.score}<span style={{ fontSize: 14, fontWeight: 500 }}>/100</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 28 }}>{aiResult.passed ? '✅' : aiResult.score >= 50 ? '⚠️' : '❌'}</div>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                            {aiResult.feedback}
                          </div>
                        </div>

                        {/* Errors */}
                        {aiResult.errors.length > 0 && (
                          <div style={{ padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>❌ Errors</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {aiResult.errors.map((e, i) => (
                                <div key={i} style={{ fontSize: 12, color: '#b91c1c', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <span style={{ flexShrink: 0, marginTop: 1 }}>•</span>
                                  <span style={{ lineHeight: 1.5 }}>{e}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggestions */}
                        {aiResult.suggestions.length > 0 && (
                          <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>💡 Suggestions</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {aiResult.suggestions.map((s, i) => (
                                <div key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <span style={{ flexShrink: 0, color: 'var(--accent)', marginTop: 1 }}>{i + 1}.</span>
                                  <span style={{ lineHeight: 1.5 }}>{s}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Optimized code — only shown when score >= 70 */}
                        {aiResult.score >= 70 && aiResult.optimizedCode && (
                          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.4)' }}>
                            <div style={{
                              padding: '10px 14px',
                              background: 'rgba(99,102,241,0.08)',
                              borderBottom: '1px solid rgba(99,102,241,0.2)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                              <div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>⚡ Optimized version</span>
                                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>cleaner · more efficient</span>
                              </div>
                              <button
                                onClick={() => {
                                  setCode(aiResult.optimizedCode)
                                  setSaveResult(null)
                                }}
                                style={{
                                  fontSize: 12, padding: '5px 12px', borderRadius: 6,
                                  background: 'var(--accent)', color: '#fff',
                                  border: 'none', cursor: 'pointer', fontWeight: 600,
                                }}
                              >
                                Use Optimized Version
                              </button>
                            </div>
                            <pre style={{
                              margin: 0, padding: '14px 16px',
                              background: '#0d1117', color: '#e6edf3',
                              fontSize: 12, fontFamily: 'ui-monospace, Consolas, monospace',
                              lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre-wrap',
                              maxHeight: 220, overflowY: 'auto',
                            }}>
                              {aiResult.optimizedCode}
                            </pre>
                          </div>
                        )}

                        {/* Re-evaluate button */}
                        <button
                          className="btn-secondary"
                          style={{ width: '100%', padding: '8px', fontSize: 12 }}
                          onClick={handleEvaluate}
                          disabled={evaluating}
                        >
                          🔄 Re-evaluate
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ── Hints tab ── */}
              {activeTab === 'hints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.2s ease both' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Hints</div>
                  {ctx.hints && ctx.hints.length > 0 ? (
                    ctx.hints.map((h, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', borderRadius: 8,
                        background: '#eff6ff', border: '1px solid #bfdbfe',
                        fontSize: 13, color: '#444', lineHeight: 1.5,
                        animation: `fadeUp 0.2s ease ${i * 60}ms both`,
                      }}>
                        {i + 1}. {h}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text3)' }}>
                      No hints available for this task.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
