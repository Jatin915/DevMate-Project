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
            if (t.result) initialResults[t.language] = t.result
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
        [currentTask.language]: { score: res.score, passed: res.passed, feedback: res.feedback },
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

            {results[currentTask.language] && (
              <div className="card" style={{ marginTop: 12, borderColor: results[currentTask.language].passed ? 'var(--green)' : 'var(--orange)' }}>
                <div style={{ fontWeight: 600 }}>
                  Score: {results[currentTask.language].score}% {results[currentTask.language].passed ? '• Passed' : '• Retry required'}
                </div>
                {results[currentTask.language].feedback && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
                    {results[currentTask.language].feedback}
                  </div>
                )}
              </div>
            )}
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
