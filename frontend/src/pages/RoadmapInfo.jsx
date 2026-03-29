import { useNavigate } from 'react-router-dom'
import CodeBackground from '../components/CodeBackground'
import ThemeToggle from '../components/ThemeToggle'

const paths = [
  {
    name: 'React Developer', icon: '⚛️', color: '#6366f1', duration: '8 weeks',
    levels: [
      { name: 'Beginner', topics: ['HTML & CSS Basics', 'JavaScript Fundamentals', 'DOM Manipulation'], done: true },
      { name: 'Intermediate', topics: ['React Basics', 'React Hooks', 'State Management', 'React Router'], done: false },
      { name: 'Advanced', topics: ['Performance Optimization', 'Testing', 'TypeScript with React'], done: false },
      { name: 'Final Project', topics: ['Full Stack React App'], done: false },
    ],
  },
  {
    name: 'JavaScript Mastery', icon: '🟨', color: '#f59e0b', duration: '6 weeks',
    levels: [
      { name: 'Beginner', topics: ['Variables & Types', 'Functions', 'Arrays & Objects'], done: false },
      { name: 'Intermediate', topics: ['ES6+', 'Async/Await', 'Promises', 'Fetch API'], done: false },
      { name: 'Advanced', topics: ['Design Patterns', 'Performance', 'Security'], done: false },
      { name: 'Final Project', topics: ['JS-powered Web App'], done: false },
    ],
  },
  {
    name: 'Node.js Backend', icon: '🟢', color: '#10b981', duration: '7 weeks',
    levels: [
      { name: 'Beginner', topics: ['Node Basics', 'npm & Modules', 'File System'], done: false },
      { name: 'Intermediate', topics: ['Express.js', 'REST APIs', 'Middleware', 'Auth'], done: false },
      { name: 'Advanced', topics: ['Databases', 'Caching', 'Deployment'], done: false },
      { name: 'Final Project', topics: ['Full REST API'], done: false },
    ],
  },
  {
    name: 'Python Developer', icon: '🐍', color: '#06b6d4', duration: '6 weeks',
    levels: [
      { name: 'Beginner', topics: ['Syntax & Types', 'Control Flow', 'Functions'], done: false },
      { name: 'Intermediate', topics: ['OOP', 'File I/O', 'Libraries', 'APIs'], done: false },
      { name: 'Advanced', topics: ['Data Structures', 'Algorithms', 'Testing'], done: false },
      { name: 'Final Project', topics: ['Python CLI or Web App'], done: false },
    ],
  },
]

const levelColors = { Beginner: 'badge-green', Intermediate: 'badge-cyan', Advanced: 'badge-purple', 'Final Project': 'badge-orange' }

export default function RoadmapInfo() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <CodeBackground />

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 64px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div onClick={() => navigate('/')} style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, cursor: 'pointer' }}>
          Dev<span style={{ color: 'var(--accent)' }}>Mate</span>
        </div>
        <div style={{ display: 'flex', gap: 28, color: 'var(--text2)', fontSize: 14 }}>
          {[['Features', '/features'], ['Roadmap', '/roadmap-info'], ['Pricing', '/pricing']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)}
              style={{ cursor: 'pointer', transition: 'color 0.18s', color: label === 'Roadmap' ? 'var(--accent)' : 'var(--text2)', fontWeight: label === 'Roadmap' ? 600 : 400 }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = label === 'Roadmap' ? 'var(--accent)' : 'var(--text2)'}>{label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn-secondary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 64px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 280, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <span className="badge badge-cyan" style={{ marginBottom: 20, fontSize: 13 }}>Learning paths</span>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: -1.5, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text), var(--cyan))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'fadeUp 0.3s ease both',
        }}>
          Your path, clearly defined
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, animation: 'fadeUp 0.3s ease 0.08s both' }}>
          Choose a technology and follow a structured roadmap from zero to job-ready. Every step unlocks the next.
        </p>
      </section>

      {/* Paths */}
      <section style={{ padding: '0 64px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {paths.map((path, pi) => (
            <div key={pi} className="card" style={{ animation: `fadeUp 0.3s ease ${pi * 80}ms both` }}>
              {/* Path header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, fontSize: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: path.color + '18', border: `1px solid ${path.color}40`,
                  }}>{path.icon}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{path.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>⏱ {path.duration} · 4 levels</div>
                  </div>
                </div>
                <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} onClick={() => navigate('/login')}>
                  Start path →
                </button>
              </div>

              {/* Levels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {path.levels.map((level, li) => (
                  <div key={li} style={{
                    padding: '14px', borderRadius: 10,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* connector line */}
                    {li < path.levels.length - 1 && (
                      <div style={{
                        position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 2, background: 'var(--border2)', zIndex: 2,
                      }} />
                    )}
                    <span className={`badge ${levelColors[level.name]}`} style={{ fontSize: 10, marginBottom: 10, display: 'inline-flex' }}>
                      {level.name}
                    </span>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {level.topics.map((t, ti) => (
                        <li key={ti} style={{ display: 'flex', gap: 6, fontSize: 12, color: 'var(--text2)', alignItems: 'flex-start' }}>
                          <span style={{ color: path.color, flexShrink: 0, marginTop: 1, fontSize: 10 }}>◆</span> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 64px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg2)', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>Pick your path and start today</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 16 }}>Free to start. No credit card required.</p>
        <button className="btn-primary" style={{ fontSize: 15, padding: '13px 36px' }} onClick={() => navigate('/login')}>
          Get started free →
        </button>
      </section>

      <footer style={{ padding: '24px 64px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <div>© 2026 DevMate</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(item => (
            <span key={item} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
