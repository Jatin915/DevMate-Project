import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const projects = [
  {
    id: 1, title: 'Todo App', tech: 'React', difficulty: 'Beginner', status: 'completed', score: 92,
    desc: 'Build a fully functional todo app with add, delete, and complete features.',
    requirements: ['Add new todos', 'Mark as complete', 'Delete todos', 'Filter by status'],
    expected: 'A working todo list with local state management'
  },
  {
    id: 2, title: 'Weather Dashboard', tech: 'JS + API', difficulty: 'Intermediate', status: 'active', score: null,
    desc: 'Fetch real weather data from an API and display it in a clean dashboard.',
    requirements: ['Search by city', 'Display temperature & conditions', 'Show 5-day forecast', 'Handle errors'],
    expected: 'A responsive weather app with API integration'
  },
  {
    id: 3, title: 'E-Commerce Cart', tech: 'React + Context', difficulty: 'Intermediate', status: 'locked', score: null,
    desc: 'Build a shopping cart with add/remove items and total calculation.',
    requirements: ['Product listing', 'Add to cart', 'Remove from cart', 'Calculate total'],
    expected: 'A functional cart with Context API state management'
  },
  {
    id: 4, title: 'Full Stack Blog', tech: 'React + Node', difficulty: 'Advanced', status: 'locked', score: null,
    desc: 'Create a blog with authentication, CRUD posts, and comments.',
    requirements: ['User auth', 'Create/edit/delete posts', 'Comments system', 'Responsive design'],
    expected: 'A deployed full-stack blog application'
  },
]

export default function MiniProject() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(projects[1])
  const [submission, setSubmission] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        <h1 className="page-title">Mini Projects 🧪</h1>
        <p className="page-subtitle">Build real projects to solidify your skills. Unlock new ones as you progress.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
          {/* Project list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map(p => (
              <div key={p.id} onClick={() => p.status !== 'locked' && setSelected(p)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: p.status !== 'locked' ? 'pointer' : 'default',
                  background: selected?.id === p.id ? 'rgba(124,58,237,0.12)' : 'var(--card)',
                  border: `1px solid ${selected?.id === p.id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                  opacity: p.status === 'locked' ? 0.5 : 1, transition: 'all 0.2s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</div>
                  <span style={{ fontSize: 16 }}>{p.status === 'locked' ? '🔒' : p.status === 'completed' ? '✅' : '🔄'}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{p.tech}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`badge ${p.difficulty === 'Beginner' ? 'badge-green' : p.difficulty === 'Intermediate' ? 'badge-cyan' : 'badge-purple'}`} style={{ fontSize: 10 }}>
                    {p.difficulty}
                  </span>
                  {p.score && <span className="badge badge-orange" style={{ fontSize: 10 }}>Score: {p.score}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Project detail */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{selected.title}</h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-cyan">{selected.tech}</span>
                      <span className={`badge ${selected.difficulty === 'Beginner' ? 'badge-green' : selected.difficulty === 'Intermediate' ? 'badge-cyan' : 'badge-purple'}`}>
                        {selected.difficulty}
                      </span>
                    </div>
                  </div>
                  {selected.score && (
                    <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(16,185,129,0.1)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{selected.score}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Score</div>
                    </div>
                  )}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7 }}>{selected.desc}</p>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📋 Requirements</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selected.requirements.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)' }}>
                        <span style={{ color: 'var(--accent2)', fontSize: 12 }}>◆</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>🎯 Expected Output</h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.expected}</p>
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Estimated time</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>2-4 hours</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>📤 Submit Your Project</h3>
                <input
                  type="text" placeholder="Paste your GitHub repo or live demo URL..."
                  value={submission} onChange={e => setSubmission(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    color: 'var(--text)', fontSize: 14, outline: 'none',
                    marginBottom: 12, boxSizing: 'border-box', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" onClick={() => submission && setSubmitted(true)}>Submit Project →</button>
                  <button className="btn-secondary" style={{ padding: '10px 18px', fontSize: 14 }} onClick={() => navigate('/code-editor')}>
                    Open Editor 💻
                  </button>
                </div>
                {submitted && (
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>🎉 Submitted! AI review in progress...</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>You'll get detailed feedback and a score within moments.</p>
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
