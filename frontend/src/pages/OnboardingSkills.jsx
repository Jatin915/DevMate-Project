import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

const TECHS = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB']

export default function OnboardingSkills() {
  const navigate = useNavigate()

  // 'choose' | 'default' | 'custom'
  const [mode, setMode] = useState('choose')

  const [selected, setSelected] = useState([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const toggle = (tech) => {
    setSelected((prev) => prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech])
  }

  // ── Default path: skill selection → assessment ────────────────────────────
  const submitDefault = async () => {
    setSaving(true)
    setError('')
    try {
      const chosen = selected.length > 0 ? selected : ['HTML']
      const res = await apiRequest('/user/skills', {
        method: 'POST',
        body: JSON.stringify({ knownLanguages: chosen }),
      })
      localStorage.setItem('dm-onboarding', JSON.stringify({
        skillsSelected:      true,
        assessmentCompleted: false,
        knownLanguages:      res.userSkill.knownLanguages,
        passedLanguages:     [],
      }))
      navigate('/onboarding/assessment')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const startBeginner = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await apiRequest('/user/start-beginner', { method: 'POST' })
      localStorage.setItem('dm-onboarding', JSON.stringify({
        skillsSelected:         true,
        assessmentCompleted:    true,
        knownLanguages:         ['HTML'],
        passedLanguages:        ['HTML'],
        recommendedNextLanguage: 'HTML',
        startMode:              'beginner',
        currentLanguage:        'HTML',
        journeyStarted:         true,
      }))
      navigate(res?.next?.route || '/onboarding/html-playlist')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Mode: choose ──────────────────────────────────────────────────────────
  if (mode === 'choose') {
    return (
      <div className="page-layout">
        <main className="main-content" style={{ maxWidth: 680, margin: '0 auto' }}>
          <h1 className="page-title">How do you want to learn?</h1>
          <p className="page-subtitle">Choose your path. You can always change it later.</p>

          <div className="progress-bar" style={{ height: 8, marginBottom: 28 }}>
            <div className="progress-fill" style={{ width: '25%' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {/* Option A */}
            <div
              className="card"
              onClick={() => setMode('default')}
              style={{
                cursor: 'pointer', padding: '20px 22px',
                border: '2px solid var(--border2)',
                transition: 'border-color 0.18s, background 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-l)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--card)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 32 }}>🎯</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Use DevMate Default Roadmap</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
                    Select your known languages, take a quick assessment, and get a personalised roadmap from HTML to MongoDB.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Assessment', 'Auto roadmap', 'Guided path'].map((tag) => (
                      <span key={tag} className="badge badge-cyan" style={{ fontSize: 10 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Option B */}
            <div
              className="card"
              onClick={() => navigate('/onboarding/custom-journey')}
              style={{
                cursor: 'pointer', padding: '20px 22px',
                border: '2px solid var(--border2)',
                transition: 'border-color 0.18s, background 0.18s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-l)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--card)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 32 }}>🗺️</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Create My Own Journey</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
                    Pick any languages you want to learn, set your own order, and skip the assessment entirely.
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['No assessment', 'Custom order', 'Any language'].map((tag) => (
                      <span key={tag} className="badge badge-green" style={{ fontSize: 10 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Mode: default (existing skill selection UI) ───────────────────────────
  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title">Skill-Based Onboarding</h1>
        <p className="page-subtitle">Step 1/4: Select technologies you already know.</p>

        <div className="progress-bar" style={{ height: 8, marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: '25%' }} />
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Choose one or more technologies</div>
          <div className="grid-3">
            {TECHS.map((tech) => {
              const active = selected.includes(tech)
              return (
                <button
                  key={tech}
                  className="btn-secondary"
                  onClick={() => toggle(tech)}
                  style={{
                    textAlign: 'left',
                    background: active ? 'var(--accent-l)' : 'var(--card)',
                    borderColor: active ? 'var(--accent)' : 'var(--border2)',
                    color: active ? 'var(--accent)' : 'var(--text)',
                  }}
                >
                  {tech}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
            If you skip selection, DevMate starts you from <strong>HTML</strong>.
          </div>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 16, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setMode('choose')} disabled={saving}>
              ← Back
            </button>
            <button className="btn-secondary" onClick={startBeginner} disabled={saving}>
              {saving ? 'Please wait...' : 'Start from Beginner (HTML)'}
            </button>
          </div>
          <button className="btn-primary" onClick={submitDefault} disabled={saving}>
            {saving ? 'Saving...' : 'Continue to Assessment'}
          </button>
        </div>
      </main>
    </div>
  )
}
