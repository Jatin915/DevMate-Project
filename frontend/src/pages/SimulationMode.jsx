import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const issues = [
  {
    id: '#42', type: 'bug', priority: 'high', title: 'Login button not working on mobile',
    desc: 'Users on iOS Safari report the login button does nothing when tapped. Affects ~15% of users.',
    labels: ['bug', 'mobile', 'urgent'], assignee: 'You', comments: 3, time: '2h ago'
  },
  {
    id: '#38', type: 'feature', priority: 'medium', title: 'Add dark mode toggle to settings',
    desc: 'Users have requested a dark/light mode toggle in the settings page. Design mockup attached.',
    labels: ['enhancement', 'UI'], assignee: 'You', comments: 7, time: '1d ago'
  },
  {
    id: '#35', type: 'improvement', priority: 'low', title: 'Optimize dashboard load time',
    desc: 'Dashboard takes 3.2s to load. Target is under 1s. Profile and optimize API calls.',
    labels: ['performance', 'optimization'], assignee: 'You', comments: 2, time: '2d ago'
  },
]

const typeColors = { bug: 'badge-danger', feature: 'badge-cyan', improvement: 'badge-purple' }
const priorityColors = { high: 'var(--red)', medium: '#f59e0b', low: 'var(--green)' }

export default function SimulationMode() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(issues[0])
  const [solution, setSolution] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>Developer Simulation 🧠</h1>
              <span className="badge badge-orange">🚀 Startup Mode</span>
            </div>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>You joined a startup. Real issues, real pressure. Solve them like a pro.</p>
          </div>
          <div className="card" style={{ padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>3</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Open Issues</div>
          </div>
        </div>

        {/* Repo header */}
        <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 24 }}>📦</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>devmate-startup / main-app</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>React · Node.js · MongoDB · 3 open issues</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <span className="badge badge-green">✓ main</span>
            <span className="badge badge-purple">⭐ 142</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Issues list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>Issues</div>
            {issues.map(issue => (
              <div key={issue.id} onClick={() => { setSelected(issue); setSubmitted(false); setSolution('') }}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  background: selected?.id === issue.id ? 'rgba(124,58,237,0.1)' : 'var(--card)',
                  border: `1px solid ${selected?.id === issue.id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                  transition: 'all 0.2s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{issue.id}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: priorityColors[issue.priority], background: `${priorityColors[issue.priority]}18`, padding: '2px 8px', borderRadius: 10 }}>
                    {issue.priority}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{issue.title}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {issue.labels.map(l => (
                    <span key={l} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border)' }}>{l}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>💬 {issue.comments} · {issue.time}</div>
              </div>
            ))}
          </div>

          {/* Issue detail */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{selected.id}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: priorityColors[selected.priority], background: `${priorityColors[selected.priority]}18`, padding: '3px 10px', borderRadius: 10 }}>
                        {selected.priority} priority
                      </span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{selected.title}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selected.labels.map(l => (
                      <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>{l}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', marginBottom: 16 }}>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{selected.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text3)' }}>
                  <span>👤 Assigned to: <strong style={{ color: 'var(--text)' }}>{selected.assignee}</strong></span>
                  <span>💬 {selected.comments} comments</span>
                  <span>🕐 {selected.time}</span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>💡 Your Solution</h3>
                <textarea
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  placeholder="Describe your approach or paste your code fix here..."
                  style={{
                    width: '100%', minHeight: 120, padding: 14, borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="btn-primary" onClick={() => solution && setSubmitted(true)}>Submit Fix →</button>
                  <button className="btn-secondary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={() => navigate('/code-editor')}>
                    Open Editor 💻
                  </button>
                </div>
                {submitted && (
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7', marginBottom: 6 }}>✅ Fix submitted for review!</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                      Great work! Your solution looks solid. The team lead will review and merge. +50 XP earned 🎉
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </PageWrapper></main>
    </div>
  )
}
