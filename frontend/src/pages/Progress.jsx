import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const skills = [
  { name: 'React', level: 65, color: 'var(--accent)' },
  { name: 'JavaScript', level: 80, color: 'var(--orange)' },
  { name: 'HTML/CSS', level: 90, color: 'var(--red)' },
  { name: 'Node.js', level: 30, color: 'var(--green)' },
  { name: 'TypeScript', level: 20, color: 'var(--cyan)' },
  { name: 'Git', level: 70, color: '#7c3aed' },
]

const weekData = [20, 45, 30, 60, 40, 75, 55]
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const weakAreas = [
  { area: 'Async/Await', suggestion: 'Complete the Promises module' },
  { area: 'TypeScript Generics', suggestion: 'Start the TypeScript path' },
  { area: 'Testing', suggestion: 'Try the Jest mini project' },
]

export default function Progress() {
  const maxVal = Math.max(...weekData)

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">Track your growth and identify what to work on next.</p>

        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Current streak', value: '7 days', color: 'var(--orange)' },
            { label: 'Total XP', value: '1,240', color: 'var(--accent)' },
            { label: 'Topics done', value: '13', color: 'var(--green)' },
            { label: 'Hours learned', value: '42h', color: 'var(--cyan)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Weekly bar chart */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Weekly activity</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {weekData.map((val, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{val}m</div>
                  <div style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    height: `${(val / maxVal) * 70}px`,
                    background: i === 6 ? 'var(--accent)' : 'var(--border)',
                    transition: 'height 0.3s'
                  }} />
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{days[i]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak calendar */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Streak calendar</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {Array.from({ length: 28 }, (_, i) => {
                const active = [0,1,2,3,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27].includes(i)
                return (
                  <div key={i} style={{
                    aspectRatio: '1', borderRadius: 3,
                    background: active ? 'var(--accent)' : 'var(--bg3)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    opacity: active ? 1 : 0.5
                  }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
              <span>□ Missed</span>
              <span style={{ color: 'var(--accent)' }}>■ Active</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Skill progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {skills.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text3)' }}>{s.level}%</span>
                </div>
                <div className="progress-bar">
                  <div style={{ height: '100%', borderRadius: 99, width: `${s.level}%`, background: s.color, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak areas */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Areas to improve</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weakAreas.map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{w.area}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{w.suggestion}</div>
                </div>
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }}>Fix now</button>
              </div>
            ))}
          </div>
        </div>
        </PageWrapper></main>
    </div>
  )
}
