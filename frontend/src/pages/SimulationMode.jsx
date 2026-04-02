import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { apiRequest } from '../utils/api'

const priorityColors = {
  high:   'var(--red)',
  medium: '#f59e0b',
  low:    'var(--green)',
}

function priorityStyle(p) {
  const c = priorityColors[p] || '#888'
  return { fontSize: 11, fontWeight: 700, color: c, background: `${c}18`, padding: '2px 8px', borderRadius: 10 }
}

function diffBadgeClass(d) {
  if (d === 'easy') return 'badge-green'
  if (d === 'hard') return 'badge-orange'
  return 'badge-cyan'
}

function statusIcon(s) {
  if (s === 'completed') return '✅'
  if (s === 'submitted') return '🔄'
  return '⬜'
}

export default function SimulationMode() {
  const navigate = useNavigate()

  // ── Issues list ───────────────────────────────────────────────────────────
  const [issues, setIssues]       = useState([])
  const [openCount, setOpenCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // ── Selected issue ────────────────────────────────────────────────────────
  const [selected, setSelected]   = useState(null)

  // ── Solution form ─────────────────────────────────────────────────────────
  const [solution, setSolution]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  // { passed, aiScore, feedback, status }

  useEffect(() => {
    apiRequest('/simulation/issues')
      .then((res) => {
        setIssues(res.issues || [])
        setOpenCount(res.openCount ?? 0)
        // Auto-select first issue
        if (res.issues?.length > 0) setSelected(res.issues[0])
      })
      .catch((e) => setError(e.message || 'Failed to load issues'))
      .finally(() => setLoading(false))
  }, [])

  const selectIssue = (issue) => {
    setSelected(issue)
    setSolution(issue.solutionCode || '')
    setSubmitResult(
      issue.userStatus !== 'pending'
        ? { passed: issue.userStatus === 'completed', aiScore: issue.aiScore, feedback: issue.feedback, status: issue.userStatus }
        : null,
    )
  }

  const handleSubmit = async () => {
    if (!solution.trim() || !selected) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const res = await apiRequest('/simulation/submit', {
        method: 'POST',
        body: JSON.stringify({ issueId: selected._id, solutionCode: solution }),
      })
      setSubmitResult({ passed: res.passed, aiScore: res.aiScore, feedback: res.feedback, status: res.status })

      // Update the issue in the list so the status icon refreshes
      setIssues((prev) =>
        prev.map((iss) =>
          String(iss._id) === String(selected._id)
            ? { ...iss, userStatus: res.status, aiScore: res.aiScore }
            : iss,
        ),
      )
      setSelected((prev) => prev ? { ...prev, userStatus: res.status, aiScore: res.aiScore } : prev)
      setOpenCount((c) => res.passed ? Math.max(0, c - 1) : c)
    } catch (e) {
      setSubmitResult({ error: e.message || 'Submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  const openInEditor = () => {
    if (!selected) return
    const context = {
      taskId:          null,
      videoId:         null,
      language:        selected.language || '',
      taskTitle:       selected.title,
      taskDescription: selected.description,
      difficulty:      selected.difficulty || 'medium',
      hints:           [],
      starterCode:     selected.codeSnippet
        ? `// Issue: ${selected.title}\n// Fix the code below:\n\n${selected.codeSnippet}\n`
        : `// Issue: ${selected.title}\n// Write your fix here\n`,
      problemDescription: selected.description,
    }
    localStorage.setItem('dm-code-eval-context', JSON.stringify(context))
    navigate('/code-editor')
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Developer Simulation 🧠</h1>
                <span className="badge badge-orange">🚀 Startup Mode</span>
              </div>
              <p className="page-subtitle" style={{ marginBottom: 0 }}>
                You joined a startup. Real issues, real pressure. Solve them like a pro.
              </p>
            </div>
            <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>
                {loading ? '—' : openCount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Open Issues</div>
            </div>
          </div>

          {/* ── Repo bar ── */}
          <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24 }}>📦</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>devmate-startup / main-app</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                React · Node.js · MongoDB · {loading ? '…' : `${openCount} open issue${openCount !== 1 ? 's' : ''}`}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <span className="badge badge-green">✓ main</span>
              <span className="badge badge-purple">⭐ 142</span>
            </div>
          </div>

          {error && (
            <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && issues.length === 0 && !error && (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎯</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Start your first simulation task</div>
              <div style={{ fontSize: 13 }}>No issues loaded yet. Check back soon.</div>
            </div>
          )}

          {issues.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

              {/* ── Issue list ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>Issues</div>
                {loading
                  ? [1, 2, 3].map((i) => (
                      <div key={i} className="card" style={{ height: 80, opacity: 0.4 }} />
                    ))
                  : issues.map((issue) => (
                      <div
                        key={issue._id}
                        onClick={() => selectIssue(issue)}
                        style={{
                          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                          background: selected?._id === issue._id ? 'rgba(124,58,237,0.1)' : 'var(--card)',
                          border: `1px solid ${selected?._id === issue._id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                            {statusIcon(issue.userStatus)} #{String(issue._id).slice(-4)}
                          </span>
                          <span style={priorityStyle(issue.priority)}>{issue.priority}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                          {issue.title}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(issue.tags || []).map((tag) => (
                            <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                              {tag}
                            </span>
                          ))}
                          <span className={`badge ${diffBadgeClass(issue.difficulty)}`} style={{ fontSize: 10 }}>
                            {issue.difficulty}
                          </span>
                        </div>
                        {issue.userStatus !== 'pending' && (
                          <div style={{ marginTop: 6, fontSize: 11, color: issue.userStatus === 'completed' ? 'var(--green)' : '#f59e0b', fontWeight: 600 }}>
                            {issue.userStatus === 'completed' ? `✅ Completed · Score: ${issue.aiScore ?? '—'}` : '🔄 Submitted'}
                          </div>
                        )}
                      </div>
                    ))}
              </div>

              {/* ── Issue detail ── */}
              {selected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Detail card */}
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text3)' }}>#{String(selected._id).slice(-4)}</span>
                          <span style={priorityStyle(selected.priority)}>{selected.priority} priority</span>
                          <span className={`badge ${diffBadgeClass(selected.difficulty)}`} style={{ fontSize: 11 }}>
                            {selected.difficulty}
                          </span>
                          {selected.language && (
                            <span className="badge badge-cyan" style={{ fontSize: 11 }}>{selected.language}</span>
                          )}
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{selected.title}</h2>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 200 }}>
                        {(selected.tags || []).map((tag) => (
                          <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', marginBottom: 16 }}>
                      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
                        {selected.description}
                      </p>
                    </div>

                    {/* Code snippet */}
                    {selected.codeSnippet && (
                      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
                        <div style={{ padding: '6px 12px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                          RELEVANT CODE
                        </div>
                        <pre style={{ margin: 0, padding: '12px 14px', background: '#0d1117', color: '#e6edf3', fontSize: 12, fontFamily: 'ui-monospace, Consolas, monospace', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                          {selected.codeSnippet}
                        </pre>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)' }}>
                      <span>👤 Assigned to: <strong style={{ color: 'var(--text)' }}>You</strong></span>
                      <span>🏷 {selected.language || 'General'}</span>
                    </div>
                  </div>

                  {/* Solution card */}
                  <div className="card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💡 Your Solution</h3>
                    <textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Describe your approach or paste your code fix here..."
                      style={{
                        width: '100%', minHeight: 120, padding: 14, borderRadius: 8,
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none',
                        fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                      onBlur={(e)  => { e.target.style.borderColor = 'var(--border)'  }}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={submitting || !solution.trim()}
                        style={{ opacity: submitting ? 0.75 : 1 }}
                      >
                        {submitting ? 'Submitting...' : 'Submit Fix →'}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: '10px 18px', fontSize: 14 }}
                        onClick={openInEditor}
                      >
                        Open Editor 💻
                      </button>
                    </div>

                    {/* Submission result */}
                    {submitResult && !submitResult.error && (
                      <div style={{
                        marginTop: 14, padding: 14, borderRadius: 8,
                        background: submitResult.passed ? 'rgba(16,185,129,0.1)' : '#fffbeb',
                        border: `1px solid ${submitResult.passed ? 'rgba(16,185,129,0.3)' : '#fde68a'}`,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: submitResult.passed ? '#6ee7b7' : '#92400e', marginBottom: 6 }}>
                          {submitResult.passed ? '✅ Fix submitted and approved!' : '🔄 Fix submitted for review'}
                          {submitResult.aiScore != null && ` · Score: ${submitResult.aiScore}/100`}
                        </div>
                        {submitResult.feedback && (
                          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                            {submitResult.feedback}
                          </p>
                        )}
                        {!submitResult.feedback && (
                          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                            {submitResult.passed
                              ? 'Great work! Your solution looks solid. +50 XP earned 🎉'
                              : 'Submission saved. Keep refining your solution.'}
                          </p>
                        )}
                      </div>
                    )}

                    {submitResult?.error && (
                      <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#b91c1c' }}>
                        ❌ {submitResult.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </PageWrapper>
      </main>
    </div>
  )
}
