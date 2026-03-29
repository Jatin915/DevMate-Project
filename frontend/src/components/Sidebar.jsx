import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const links = [
  { to: '/dashboard',    icon: '▣', label: 'Dashboard' },
  { to: '/roadmap',      icon: '◈', label: 'Roadmap' },
  { to: '/video-task',   icon: '▷', label: 'Video + Tasks' },
  { to: '/code-editor',  icon: '⌨', label: 'Code Editor' },
  { to: '/mini-project', icon: '◉', label: 'Mini Projects' },
  { to: '/simulation',   icon: '⚙', label: 'Simulation' },
  { to: '/progress',     icon: '↗', label: 'Progress' },
  { to: '/job-readiness',icon: '◎', label: 'Job Readiness' },
  { to: '/profile',      icon: '○', label: 'Profile' },
  { to: '/certificate',  icon: '✦', label: 'Certificates' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside style={{
      width: 215,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 0', minHeight: '100vh',
      position: 'sticky', top: 0, height: '100vh',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
          Dev<span style={{ color: 'var(--accent)' }}>Mate</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
          // learning platform
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map((l, i) => (
          <NavLink
            key={l.to} to={l.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <span style={{ fontSize: 12, opacity: 0.6 }}>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 8,
            background: 'transparent', color: 'var(--text3)', fontSize: 13.5,
            display: 'flex', alignItems: 'center', gap: 9,
            border: 'none', cursor: 'pointer',
            transition: 'color 0.18s, background 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
        >
          ← Logout
        </button>
      </div>
    </aside>
  )
}
