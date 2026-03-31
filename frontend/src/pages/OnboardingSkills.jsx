import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

const TECHS = ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB']

export default function OnboardingSkills() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pct = useMemo(() => 25, [])

  const toggle = (tech) => {
    setSelected((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const chosen = selected.length > 0 ? selected : ['HTML']
      const res = await apiRequest('/user/skills', {
        method: 'POST',
        body: JSON.stringify({ knownLanguages: chosen }),
      })
      localStorage.setItem('dm-onboarding', JSON.stringify({
        skillsSelected: true,
        assessmentCompleted: false,
        knownLanguages: res.userSkill.knownLanguages,
        passedLanguages: [],
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
        skillsSelected: true,
        assessmentCompleted: true,
        knownLanguages: ['HTML'],
        passedLanguages: ['HTML'],
        recommendedNextLanguage: 'HTML',
        startMode: 'beginner',
        currentLanguage: 'HTML',
        journeyStarted: true,
      }))
      navigate(res?.next?.route || '/onboarding/html-playlist')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title">Skill-Based Onboarding</h1>
        <p className="page-subtitle">Step 1/4: Select technologies you already know.</p>

        <div className="progress-bar" style={{ height: 8, marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
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
          <button className="btn-secondary" onClick={startBeginner} disabled={saving}>
            {saving ? 'Please wait...' : 'Start from Beginner (HTML)'}
          </button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Continue to Assessment'}
          </button>
        </div>
      </main>
    </div>
  )
}
