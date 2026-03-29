import { useNavigate } from 'react-router-dom'
import CodeBackground from '../components/CodeBackground'
import ThemeToggle from '../components/ThemeToggle'

const steps = [
  { num: '01', title: 'Pick a technology', desc: 'Choose from React, JavaScript, Python and more. Get a clear roadmap instantly.' },
  { num: '02', title: 'Learn and practice', desc: 'Watch videos, complete AI-generated tasks, and submit your code for feedback.' },
  { num: '03', title: 'Get job ready', desc: 'Build real projects, simulate dev work, and track your readiness score.' },
]

const features = [
  { icon: '🗺️', title: 'Visual Roadmaps', desc: 'Step-by-step paths from beginner to advanced. Always know what to learn next.' },
  { icon: '🤖', title: 'AI Task Generator', desc: 'Every lesson comes with coding challenges tailored to your current level.' },
  { icon: '💻', title: 'Code Editor', desc: 'Write and run code directly in the browser with instant AI feedback.' },
  { icon: '🧠', title: 'Dev Simulation', desc: 'Work on real startup tasks — fix bugs, add features, ship code.' },
  { icon: '📈', title: 'Progress Tracking', desc: 'See your skill growth, streaks, and weak areas in one place.' },
  { icon: '🎓', title: 'Certificates', desc: 'Earn verified certificates from DevMate on course completion.' },
]

const testimonials = [
  { name: 'Priya S.', role: 'Frontend Dev', text: 'DevMate got me job-ready in 3 months. The simulation mode felt like actual work.' },
  { name: 'Arjun M.', role: 'Full Stack Engineer', text: 'The AI feedback on my code was way more useful than just watching tutorials.' },
  { name: 'Sara K.', role: 'React Developer', text: 'The roadmap kept me focused. I always knew exactly what to learn next.' },
]

export default function Landing() {
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
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
          Dev<span style={{ color: 'var(--accent)' }}>Mate</span>
          <span style={{
            marginLeft: 8, fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--accent)', background: 'var(--accent-l)',
            padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border2)',
            verticalAlign: 'middle'
          }}>v2.0</span>
        </div>
        <div style={{ display: 'flex', gap: 28, color: 'var(--text2)', fontSize: 14 }}>
          {[['Features', '/features'], ['Roadmap', '/roadmap-info'], ['Pricing', '/pricing']].map(([item, path]) => (
            <span key={item} onClick={() => navigate(path)}
              style={{ cursor: 'pointer', transition: 'color 0.18s' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}>{item}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn-secondary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '100px 64px 80px', maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20, marginBottom: 28,
            background: 'var(--accent-l)', border: '1px solid var(--border2)',
            fontSize: 13, fontWeight: 500, color: 'var(--accent)',
            animation: 'fadeUp 0.3s ease both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
            AI-powered developer training platform
          </div>

          <h1 style={{
            fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginBottom: 20,
            letterSpacing: -2, animation: 'fadeUp 0.35s ease 0.05s both',
          }}>
            Learn to code.<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Get hired faster.</span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--text2)', maxWidth: 520, margin: '0 auto 36px',
            lineHeight: 1.7, animation: 'fadeUp 0.35s ease 0.1s both',
          }}>
            Structured roadmaps, AI-generated tasks, and real-world simulations — everything you need to go from zero to job-ready.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', animation: 'fadeUp 0.35s ease 0.15s both' }}>
            <button className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }} onClick={() => navigate('/login')}>
              Start learning free →
            </button>
            <button className="btn-secondary" style={{ fontSize: 15, padding: '13px 32px' }}>
              Watch demo ▷
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 48, justifyContent: 'center',
            marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)',
            animation: 'fadeUp 0.35s ease 0.2s both',
          }}>
            {[['50K+','Learners'],['200+','Learning paths'],['95%','Job placement'],['4.9★','Rating']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{val}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 64px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 48, letterSpacing: -0.5 }}>Three steps to your first job</h2>
          <div className="grid-3">
            {steps.map((s, i) => (
              <div key={i} className="card card-3d" style={{ animation: `fadeUp 0.3s ease ${i * 80}ms both` }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'var(--accent-l)',
                  border: '1px solid var(--border2)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 800,
                  color: 'var(--accent)', marginBottom: 16,
                }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 64px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>Features</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 48, letterSpacing: -0.5 }}>Everything in one place</h2>
          <div className="grid-3">
            {features.map((f, i) => (
              <div key={i} className="card card-3d" style={{ animation: `fadeUp 0.3s ease ${i * 60}ms both` }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap preview */}
      <section style={{ padding: '80px 64px', background: 'var(--bg2)', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>Roadmap preview</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 36, letterSpacing: -0.5 }}>Your path, clearly defined</h2>
          {[
            { label: 'HTML & CSS Basics', done: true },
            { label: 'JavaScript Fundamentals', done: true },
            { label: 'DOM Manipulation', done: true },
            { label: 'React Basics', active: true },
            { label: 'React Hooks', locked: true },
            { label: 'Final Project 🏆', locked: true },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, animation: `fadeUp 0.3s ease ${i * 60}ms both` }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: item.done ? 'var(--accent)' : item.active ? 'var(--accent-l)' : 'var(--bg3)',
                border: `2px solid ${item.done ? 'var(--accent)' : item.active ? 'var(--accent)' : 'var(--border2)'}`,
                color: item.done ? '#fff' : item.active ? 'var(--accent)' : 'var(--text3)',
                boxShadow: item.done || item.active ? 'var(--glow-sm)' : 'none',
              }}>
                {item.done ? '✓' : item.locked ? '·' : '▷'}
              </div>
              <div className="card" style={{
                flex: 1, padding: '11px 16px',
                background: item.active ? 'var(--accent-l)' : 'var(--card)',
                borderColor: item.active ? 'var(--accent)' : item.done ? 'var(--border2)' : 'var(--border)',
                fontSize: 14, fontWeight: item.active ? 600 : 400,
                color: item.locked ? 'var(--text3)' : 'var(--text)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {item.label}
                {item.done && <span className="badge badge-green" style={{ fontSize: 11 }}>Done</span>}
                {item.active && <span className="badge badge-purple" style={{ fontSize: 11 }}>In progress</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 64px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>Testimonials</p>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 48, letterSpacing: -0.5 }}>What learners say</h2>
          <div className="grid-3">
            {testimonials.map((t, i) => (
              <div key={i} className="card card-3d" style={{ animation: `fadeUp 0.3s ease ${i * 80}ms both` }}>
                <div style={{ fontSize: 20, color: 'var(--orange)', marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff',
                  }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 64px', textAlign: 'center',
        background: 'var(--bg2)', borderTop: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 200, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 14, letterSpacing: -0.5, position: 'relative' }}>Ready to start?</h2>
        <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 32, position: 'relative' }}>Join 50,000+ developers already learning on DevMate.</p>
        <button className="btn-primary" style={{ fontSize: 16, padding: '14px 40px', position: 'relative' }} onClick={() => navigate('/login')}>
          Get started for free →
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 64px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <div>© 2026 DevMate</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy','Terms','Contact'].map(item => (
            <span key={item} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
