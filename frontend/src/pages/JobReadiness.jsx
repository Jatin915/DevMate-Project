import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const strengths = [
  { skill: 'React Components', score: 85 },
  { skill: 'JavaScript ES6+', score: 80 },
  { skill: 'HTML/CSS', score: 90 },
  { skill: 'Git', score: 70 },
]

const weaknesses = [
  { skill: 'TypeScript', score: 20, action: 'Start TypeScript path' },
  { skill: 'Testing (Jest)', score: 15, action: 'Complete Testing module' },
  { skill: 'System Design', score: 25, action: 'Read system design basics' },
  { skill: 'Node.js', score: 30, action: 'Start Node.js roadmap' },
]

const suggestions = [
  { title: 'Complete TypeScript Basics', priority: 'High', xp: '+200 XP' },
  { title: 'Finish Testing Module', priority: 'High', xp: '+150 XP' },
  { title: 'Build 2 more projects', priority: 'Medium', xp: '+300 XP' },
  { title: 'Complete 3 Simulation tasks', priority: 'Medium', xp: '+250 XP' },
]

export default function JobReadiness() {
  const navigate = useNavigate()
  const score = 72

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        <h1 className="page-title">Job Readiness</h1>
        <p className="page-subtitle">See how ready you are and what to improve to land your first role.</p>

        {/* Score */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32, borderLeft: '3px solid #2563eb' }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 52, fontWeight: 700, color: 'var(--orange)', lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Job ready</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="progress-bar" style={{ height: 10, marginBottom: 12 }}>
              <div className="progress-fill" style={{ width: `${score}%`, background: 'var(--orange)' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>You're almost there</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
              You're ready for junior frontend roles. A few more improvements and you'll hit 90%+.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <div style={{ padding: '8px 16px', borderRadius: 8, background: '#dcfce7', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Junior Dev</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Current level</div>
            </div>
            <div style={{ padding: '8px 16px', borderRadius: 8, background: '#e0f2fe', border: '1px solid #bae6fd', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1' }}>Mid-Level</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Next target</div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#15803d' }}>Strengths</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {strengths.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.skill}</span>
                    <span style={{ fontSize: 13, color: 'var(--green)' }}>{s.score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', borderRadius: 99, width: `${s.score}%`, background: 'var(--green)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--orange)' }}>Needs improvement</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weaknesses.map((w, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{w.skill}</span>
                    <span style={{ fontSize: 13, color: 'var(--orange)' }}>{w.score}%</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', borderRadius: 99, width: `${w.score}%`, background: 'var(--orange)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>→ {w.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>What to improve next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => navigate('/roadmap')} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 8, background: 'var(--bg)',
                border: '1px solid #e8e8e4', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(37,99,235,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                  <span className={`badge ${s.priority === 'High' ? 'badge-orange' : 'badge-cyan'}`} style={{ fontSize: 11, marginTop: 4 }}>
                    {s.priority}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{s.xp}</div>
              </div>
            ))}
          </div>
        </div>
        </PageWrapper></main>
    </div>
  )
}
