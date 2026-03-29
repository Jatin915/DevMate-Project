import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import ThemeToggle from '../components/ThemeToggle'

const roadmaps = [
  { name: 'React', progress: 65, color: '#6366f1' },
  { name: 'JavaScript', progress: 80, color: '#f59e0b' },
  { name: 'Node.js', progress: 30, color: '#10b981' },
]

const recentProjects = [
  { name: 'Todo App', tech: 'React', status: 'Completed', score: 92 },
  { name: 'Weather Dashboard', tech: 'JS + API', status: 'In Progress', score: null },
  { name: 'Portfolio Site', tech: 'HTML/CSS', status: 'Completed', score: 88 },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5,
                background: 'linear-gradient(135deg, var(--text), var(--accent))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Good morning 👋</h1>
              <p className="page-subtitle">You're on a 7-day streak. Keep it going.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ThemeToggle />
              {[['7', 'Day streak 🔥', 'var(--orange)'], ['1,240', 'XP points ⭐', 'var(--accent)']].map(([val, label, color]) => (
                <div key={label} className="card card-3d" style={{
                  padding: '12px 18px', textAlign: 'center', minWidth: 90,
                  borderTop: `2px solid ${color}`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress banner */}
          <div className="card" style={{
            marginBottom: 20,
            borderLeft: '3px solid var(--accent)',
            background: 'linear-gradient(135deg, var(--accent-l), rgba(6,182,212,0.06))',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* subtle shine line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              opacity: 0.4,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>React Development Path</div>
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>13 of 20 topics completed</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>65%</span>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/video-task')}>
                  Resume →
                </button>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '65%' }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Topics done', value: '13', color: 'var(--green)', icon: '✅' },
              { label: 'Projects built', value: '3', color: 'var(--cyan)', icon: '🏗️' },
              { label: 'Tasks submitted', value: '28', color: 'var(--accent)', icon: '📝' },
              { label: 'Job readiness', value: '72%', color: 'var(--orange)', icon: '🎯' },
            ].map((s, i) => (
              <div key={i} className="card card-3d" style={{
                textAlign: 'center',
                animation: `fadeUp 0.3s ease ${i * 60}ms both`,
                borderTop: `2px solid ${s.color}`,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* glow behind value */}
                <div style={{
                  position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: 60, height: 60, borderRadius: '50%',
                  background: s.color, opacity: 0.08, filter: 'blur(16px)',
                  pointerEvents: 'none',
                }} />
                <div style={{ fontSize: 11, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4, position: 'relative' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Roadmaps */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Your roadmaps</span>
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/roadmap')}>View all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {roadmaps.map((r, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{r.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${r.progress}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent projects */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Recent projects</span>
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/mini-project')}>View all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentProjects.map((p, i) => (
                  <div key={i} className="row-click" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.tech}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${p.status === 'Completed' ? 'badge-green' : 'badge-cyan'}`}>{p.status}</span>
                      {p.score && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{p.score}/100</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Continue learning */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Continue learning</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { title: 'React Hooks Deep Dive', type: 'Video + Task', time: '25 min', icon: '🎥', color: 'var(--accent)' },
                { title: 'State Management', type: 'Concept', time: '15 min', icon: '📖', color: 'var(--cyan)' },
                { title: 'Build a Todo App', type: 'Project', time: '45 min', icon: '🏗️', color: 'var(--green)' },
              ].map((item, i) => (
                <div key={i} onClick={() => navigate('/video-task')}
                  className="card-click"
                  style={{
                    flex: 1, padding: '16px', background: 'var(--bg3)', borderRadius: 10,
                    border: '1px solid var(--border)', borderTop: `2px solid ${item.color}`,
                    animation: `fadeUp 0.3s ease ${i * 80}ms both`,
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.type} · {item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </PageWrapper>
      </main>
    </div>
  )
}
