import { useNavigate } from 'react-router-dom'
import CodeBackground from '../components/CodeBackground'
import ThemeToggle from '../components/ThemeToggle'

const features = [
  {
    icon: '🗺️', title: 'Visual Roadmaps', tag: 'Learning',
    desc: 'Step-by-step tree roadmaps from Beginner to Advanced. Every node is locked until you complete the previous one — so you always know exactly what to learn next.',
    points: ['Beginner → Intermediate → Advanced → Final Project', 'Locked/unlocked nodes with progress tracking', 'Multiple tech paths: React, JS, Node, Python, TypeScript'],
  },
  {
    icon: '🤖', title: 'AI Task Generator', tag: 'AI',
    desc: 'After every video lesson, our AI generates coding tasks tailored to your current level. No generic exercises — every task is specific to what you just learned.',
    points: ['Tasks generated per lesson topic', 'Difficulty scales with your progress', 'Instant AI feedback on every submission'],
  },
  {
    icon: '💻', title: 'In-Browser Code Editor', tag: 'Tools',
    desc: 'Write, run, and submit code without leaving DevMate. The editor includes syntax highlighting, test cases, and an AI feedback panel.',
    points: ['Supports JavaScript, Python, TypeScript', 'Run code and see output instantly', 'AI suggestions, hints, and optimization tips'],
  },
  {
    icon: '🧠', title: 'Developer Simulation', tag: 'Unique',
    desc: 'The most unique feature on DevMate. You join a simulated startup and work on real GitHub-style issues — fix bugs, add features, improve UI.',
    points: ['Real-world task format like GitHub Issues', 'Fix bugs, ship features, improve performance', 'Builds actual industry confidence'],
  },
  {
    icon: '📈', title: 'Progress Analytics', tag: 'Tracking',
    desc: 'See your skill growth over time with detailed charts, streak calendars, and weak area detection. Know exactly where you stand.',
    points: ['Skill progress per technology', 'Weekly activity bar chart + streak calendar', 'Weak area detection with improvement suggestions'],
  },
  {
    icon: '🎯', title: 'Job Readiness Score', tag: 'Career',
    desc: 'Get a real-time job readiness percentage based on your skills, projects, and simulation performance. Know when you\'re ready to apply.',
    points: ['Score updates as you learn', 'Strengths vs weaknesses breakdown', 'Actionable "what to improve next" list'],
  },
  {
    icon: '🧪', title: 'Mini Projects', tag: 'Projects',
    desc: 'Unlock real projects after completing concept modules. Build a Todo App, Weather Dashboard, E-Commerce Cart, and more.',
    points: ['Projects unlock after concept completion', 'Submit via GitHub or live URL', 'AI reviews and scores your project'],
  },
  {
    icon: '🎓', title: 'Verified Certificates', tag: 'Certificates',
    desc: 'Earn DevMate-issued certificates on course completion. Download as PDF or PNG and share with recruiters.',
    points: ['Issued by DevMate organization', 'Unique certificate ID per completion', 'Download as PDF or PNG instantly'],
  },
  {
    icon: '👤', title: 'Portfolio Builder', tag: 'Career',
    desc: 'Your completed projects auto-populate a shareable portfolio page. Connect GitHub and share your profile link with recruiters.',
    points: ['Auto-generated from completed projects', 'GitHub integration', 'Shareable public profile link'],
  },
]

const tagColors = {
  Learning: 'badge-purple', AI: 'badge-cyan', Tools: 'badge-green',
  Unique: 'badge-orange', Tracking: 'badge-purple', Career: 'badge-green',
  Projects: 'badge-cyan', Certificates: 'badge-orange',
}

export default function Features() {
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
              style={{ cursor: 'pointer', transition: 'color 0.18s', color: label === 'Features' ? 'var(--accent)' : 'var(--text2)', fontWeight: label === 'Features' ? 600 : 400 }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = label === 'Features' ? 'var(--accent)' : 'var(--text2)'}>{label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn-secondary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 64px 56px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <span className="badge badge-purple" style={{ marginBottom: 20, fontSize: 13 }}>Everything you need</span>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: -1.5, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text), var(--accent))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'fadeUp 0.3s ease both',
        }}>
          Built for developers,<br />by developers
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, animation: 'fadeUp 0.3s ease 0.08s both' }}>
          Every feature on DevMate is designed to get you from zero to job-ready as fast as possible.
        </p>
      </section>

      {/* Features grid */}
      <section style={{ padding: '0 64px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} className="card card-3d" style={{ animation: `fadeUp 0.3s ease ${i * 50}ms both` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 32 }}>{f.icon}</div>
                <span className={`badge ${tagColors[f.tag]}`} style={{ fontSize: 11 }}>{f.tag}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>{f.desc}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {f.points.map((p, j) => (
                  <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 64px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg2)', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>Ready to start learning?</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 16 }}>All features included in the free plan.</p>
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
