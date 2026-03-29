import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const projects = [
  { name: 'Todo App', tech: 'React', score: 92 },
  { name: 'Weather Dashboard', tech: 'JS + API', score: 85 },
  { name: 'Portfolio Site', tech: 'HTML/CSS', score: 88 },
]

const skills = ['React', 'JavaScript', 'HTML/CSS', 'Git', 'Node.js']

const achievements = [
  { icon: '🔥', title: '7-Day Streak', desc: '7 days in a row' },
  { icon: '🏆', title: 'First Project', desc: 'Completed first project' },
  { icon: '⚡', title: 'Speed Coder', desc: '10 tasks in one day' },
  { icon: '🎯', title: '70% Ready', desc: 'Reached 70% job readiness' },
]

export default function Profile() {
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your developer profile. Share it with recruiters.</p>

        {/* Profile */}
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: '#eff6ff', border: '2px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: 'var(--accent)'
          }}>D</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>Dev User</div>
                <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>Frontend Developer in Training · India</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {skills.map(s => (
                    <span key={s} className="badge badge-purple" style={{ fontSize: 12 }}>{s}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>Copy link</button>
                <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}>Edit</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Projects', value: '3', color: 'var(--cyan)' },
            { label: 'Job readiness', value: '72%', color: 'var(--orange)' },
            { label: 'XP points', value: '1,240', color: 'var(--accent)' },
            { label: 'Streak', value: '7 days', color: 'var(--red)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Completed projects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg)', borderRadius: 7, border: '1px solid #f0f0ec' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.tech}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{p.score}/100</span>
                    <button style={{ padding: '4px 10px', borderRadius: 6, background: '#fff', border: '1px solid #e8e8e4', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Achievements</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {achievements.map((a, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid #f0f0ec', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28 }}>🐙</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>GitHub</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Connect your GitHub to showcase real repositories</div>
          </div>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Connect</button>
        </div>
        </PageWrapper></main>
    </div>
  )
}
