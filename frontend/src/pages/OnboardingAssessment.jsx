import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

export default function OnboardingAssessment() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [codes, setCodes] = useState({})
  const [results, setResults] = useState({})
  const [active, setActive] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(null)

  useEffect(() => {
    const boot = async () => {
      try {
        const res = await apiRequest('/assessments')
        setTasks(res.assessments)
        if (res.assessments.length > 0) {
          setActive(res.assessments[0].language)
          const seeded = {}
          const initialResults = {}
          for (const t of res.assessments) {
            seeded[t.language] = t.starterCode || ''
            if (t.result) initialResults[t.language] = {
              score:       t.result.score,
              passed:      t.result.passed,
              feedback:    t.result.feedback    || '',
              errors:      t.result.errors      || [],
              suggestions: t.result.suggestions || [],
            }
          }
          setCodes(seeded)
          setResults(initialResults)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [])

  const passedCount = useMemo(
    () => Object.values(results).filter((r) => r && r.passed).length,
    [results],
  )
  const progressPct = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round((passedCount / tasks.length) * 100)
  }, [tasks, passedCount])

  const currentTask = tasks.find((t) => t.language === active)

  const submitCurrent = async () => {
    if (!currentTask) return
    setSubmitting(true)
    setError('')
    try {
      const res = await apiRequest('/assessment/submit', {
        method: 'POST',
        body: JSON.stringify({
          language: currentTask.language,
          code: codes[currentTask.language] || '',
        }),
      })
      setResults((prev) => ({
        ...prev,
        [currentTask.language]: {
          score:       res.score,
          passed:      res.passed,
          feedback:    res.feedback,
          errors:      res.errors      || [],
          suggestions: res.suggestions || [],
        },
      }))

      const unlockedLang = res.recommendedNextLanguage || res.currentLanguage || 'HTML'
      localStorage.setItem('dm-onboarding', JSON.stringify({
        skillsSelected: true,
        assessmentCompleted: res.assessmentCompleted,
        knownLanguages: tasks.map((t) => t.language),
        passedLanguages: res.passedLanguages,
        recommendedNextLanguage: unlockedLang,
        currentLanguage: unlockedLang,
        startMode: 'assessment',
      }))

      if (res.assessmentCompleted) setUnlocked(unlockedLang)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-layout"><main className="main-content"><div className="card">Loading assessments...</div></main></div>
    )
  }

  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 className="page-title">Entry Assessment</h1>
        <p className="page-subtitle">Step 2/4 + 3/4: Complete one intermediate task for each selected technology.</p>

        <div className="progress-bar" style={{ height: 8, marginBottom: 18 }}>
          <div className="progress-fill" style={{ width: `${Math.max(35, progressPct)}%` }} />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Assessment progress</span>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{passedCount}/{tasks.length} passed</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tasks.map((t) => {
              const r = results[t.language]
              return (
                <button
                  key={t.language}
                  className="btn-secondary"
                  onClick={() => setActive(t.language)}
                  style={{
                    background: active === t.language ? 'var(--accent-l)' : 'var(--card)',
                    borderColor: r?.passed ? 'var(--green)' : active === t.language ? 'var(--accent)' : 'var(--border2)',
                  }}
                >
                  {t.language} {r?.passed ? '✓' : r?.score ? `(${r.score}%)` : ''}
                </button>
              )
            })}
          </div>
        </div>

        {currentTask && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{currentTask.taskTitle}</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 10 }}>{currentTask.description}</div>

            <textarea
              value={codes[currentTask.language] || ''}
              onChange={(e) => setCodes((prev) => ({ ...prev, [currentTask.language]: e.target.value }))}
              style={{
                width: '100%',
                minHeight: 220,
                borderRadius: 10,
                border: '1px solid var(--border2)',
                background: 'var(--bg3)',
                color: 'var(--text)',
                padding: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Pass score: 80%</span>
              <button className="btn-primary" onClick={submitCurrent} disabled={submitting}>
                {submitting ? 'Evaluating...' : 'Submit for AI Evaluation'}
              </button>
            </div>

            {results[currentTask.language] && (() => {
              const r = results[currentTask.language]
              const passed = r.passed
              return (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Score card */}
                  <div className="card" style={{
                    borderColor: passed ? 'var(--green)' : 'var(--orange)',
                    background: passed ? 'rgba(16,185,129,0.06)' : '#fffbeb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: passed ? 'var(--green)' : '#92400e', letterSpacing: 0.5, marginBottom: 2 }}>
                          {passed ? 'PASSED ✅' : 'RETRY REQUIRED ⚠️'}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: passed ? 'var(--green)' : '#f59e0b', lineHeight: 1 }}>
                          {r.score}<span style={{ fontSize: 13, fontWeight: 500 }}>/100</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Pass score: 80%</div>
                    </div>
                    {r.feedback && (
                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{r.feedback}</div>
                    )}
                  </div>

                  {/* Errors */}
                  {r.errors?.length > 0 && (
                    <div style={{ padding: 12, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>❌ Errors</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {r.errors.map((e, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#b91c1c', display: 'flex', gap: 6 }}>
                            <span>•</span><span style={{ lineHeight: 1.5 }}>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {r.suggestions?.length > 0 && (
                    <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>💡 Suggestions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {r.suggestions.map((s, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                            <span style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                            <span style={{ lineHeight: 1.5 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Retry button when failed */}
                  {!passed && (
                    <button
                      className="btn-secondary"
                      style={{ alignSelf: 'flex-start', fontSize: 13 }}
                      onClick={() => {
                        setResults((prev) => { const n = { ...prev }; delete n[currentTask.language]; return n })
                        setCodes((prev) => ({ ...prev, [currentTask.language]: currentTask.starterCode || '' }))
                      }}
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {error && <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginBottom: 16 }}>{error}</div>}

        {unlocked && (
          <div className="card" style={{ borderColor: 'var(--green)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Step 4/4 complete: Learning journey unlocked</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>You passed all selected assessments. Starting point unlocked: {unlocked}</div>
            <button className="btn-green" onClick={() => navigate(`/journey/playlist?language=${encodeURIComponent(unlocked)}`)}>
              Add playlist for {unlocked} →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
