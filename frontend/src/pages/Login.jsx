import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeBackground from '../components/CodeBackground'
import ThemeToggle from '../components/ThemeToggle'
import { apiRequest, setAuthSession, clearAuthSession } from '../utils/api'

// Password strength logic
function getStrength(pw) {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0-5
}

const strengthMeta = [
  { label: '',        color: '#e8e8e4' },
  { label: 'Weak',    color: '#ef4444' },
  { label: 'Fair',    color: '#f59e0b' },
  { label: 'Good',    color: '#3b82f6' },
  { label: 'Strong',  color: '#10b981' },
  { label: 'Strong',  color: '#10b981' },
]

const rules = [
  { test: pw => pw.length >= 8,          label: 'At least 8 characters' },
  { test: pw => /[A-Z]/.test(pw),        label: 'One uppercase letter (A–Z)' },
  { test: pw => /[0-9]/.test(pw),        label: 'One number (0–9)' },
  { test: pw => /[^A-Za-z0-9]/.test(pw), label: 'One special character (!@#$…)' },
]

// Eye icon SVGs
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getStrength(form.password), [form.password])
  const meta = strengthMeta[strength]

  const inputStyle = (focused) => ({
    width: '100%', padding: '10px 13px', borderRadius: 8,
    background: 'var(--bg3)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border2)'}`,
    boxShadow: focused ? '0 0 0 3px var(--accent-l)' : 'none',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    transition: 'border-color 0.18s, box-shadow 0.18s, background 0.2s',
    boxSizing: 'border-box', fontFamily: 'inherit',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSignup && strength < 3) {
      setError('Please choose a stronger password before continuing.')
      return
    }
    setLoading(true)
    setError('')
    try {
      clearAuthSession()
      const endpoint = isSignup ? '/auth/signup' : '/auth/login'
      const payload = isSignup
        ? { name: form.name.trim(), email: form.email.trim(), password: form.password }
        : { email: form.email.trim(), password: form.password }
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAuthSession(res)
      const onboarding = res.onboarding || {}
      if (isSignup) {
        navigate('/onboarding/skills')
      } else if (!onboarding.assessmentCompleted && onboarding.skillsSelected) {
        navigate('/onboarding/assessment')
      } else if (!onboarding.assessmentCompleted) {
        navigate('/onboarding/skills')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsSignup(v => !v)
    setError('')
    setForm({ name: '', email: '', password: '' })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <CodeBackground />

      {/* Theme toggle top-right */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      {/* Glow orb */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp 0.28s ease both', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>
            Dev<span style={{ color: '#2563eb' }}>Mate</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: -0.3 }}>
            {isSignup ? 'Create an account' : 'Welcome back'}
          </h1>
          <p style={{ color: '#999', fontSize: 14 }}>
            {isSignup ? 'Start your learning journey' : 'Log in to continue learning'}
          </p>
        </div>

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 14,
          padding: 28, boxShadow: 'var(--shadow)',
          backdropFilter: 'blur(12px)',
        }}>

          {/* Google */}
          <button onClick={() => navigate('/dashboard')} style={{
            width: '100%', padding: '10px', borderRadius: 8, background: '#fff',
            border: '1px solid #d4d4ce', color: '#1a1a1a', fontSize: 14,
            fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, cursor: 'pointer', marginBottom: 18,
            transition: 'border-color 0.18s, box-shadow 0.18s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#aaa'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4d4ce'; e.currentTarget.style.boxShadow = 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: '#f0f0ec' }} />
            <span style={{ color: '#ccc', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#f0f0ec' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name (signup only) */}
            {isSignup && (
              <div style={{ animation: 'fadeUp 0.2s ease both' }}>
                <label style={{ fontSize: 13, color: '#555', marginBottom: 5, display: 'block', fontWeight: 500 }}>Full name</label>
                <input
                  type="text" placeholder="Your name" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle(false)}
                  onFocus={e => e.target.style.cssText += 'border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.1)'}
                  onBlur={e => e.target.style.cssText += 'border-color:#d4d4ce;box-shadow:none'}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, color: '#555', marginBottom: 5, display: 'block', fontWeight: 500 }}>Email</label>
              <input
                type="email" placeholder="you@example.com" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={inputStyle(false)}
                onFocus={e => e.target.style.cssText += 'border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,0.1)'}
                onBlur={e => e.target.style.cssText += 'border-color:#d4d4ce;box-shadow:none'}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Password</label>
                {!isSignup && (
                  <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>
                )}
              </div>

              {/* Input + toggle */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder={isSignup ? 'Min 8 chars, uppercase, number, symbol' : '••••••••'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  style={{
                    ...inputStyle(pwFocused),
                    paddingRight: 42,
                    borderColor: isSignup && form.password && strength < 3 ? '#ef4444'
                      : isSignup && form.password && strength >= 3 ? '#10b981'
                      : pwFocused ? '#2563eb' : '#d4d4ce',
                    boxShadow: isSignup && form.password && strength < 3 ? '0 0 0 3px rgba(239,68,68,0.1)'
                      : isSignup && form.password && strength >= 3 ? '0 0 0 3px rgba(16,185,129,0.1)'
                      : pwFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                  }}
                />
                {/* Show/hide toggle */}
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: showPw ? '#2563eb' : '#bbb', padding: 2,
                    transition: 'color 0.18s', display: 'flex', alignItems: 'center',
                  }}
                  title={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              {/* Strength bar — signup only */}
              {isSignup && form.password.length > 0 && (
                <div style={{ marginTop: 10, animation: 'fadeUp 0.2s ease both' }}>
                  {/* 5 segment bar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 99,
                        background: i <= strength ? meta.color : '#e8e8e4',
                        transition: 'background 0.25s ease',
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: meta.color, fontWeight: 600, transition: 'color 0.2s' }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>{strength}/5</span>
                  </div>

                  {/* Rules checklist */}
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {rules.map((r, i) => {
                      const pass = r.test(form.password)
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, transition: 'opacity 0.2s' }}>
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                            background: pass ? '#10b981' : '#f3f3f0',
                            border: `1.5px solid ${pass ? '#10b981' : '#d4d4ce'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#fff',
                            transition: 'background 0.2s, border-color 0.2s',
                          }}>
                            {pass ? '✓' : ''}
                          </div>
                          <span style={{ fontSize: 12, color: pass ? '#15803d' : '#999', transition: 'color 0.2s' }}>
                            {r.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '9px 12px', borderRadius: 7,
                background: '#fef2f2', border: '1px solid #fecaca',
                fontSize: 13, color: '#dc2626', animation: 'fadeUp 0.2s ease both'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 2, opacity: loading ? 0.8 : 1 }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, color: '#999', fontSize: 13 }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <span
            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 500, transition: 'opacity 0.15s' }}
            onClick={switchMode}
            onMouseEnter={e => e.target.style.opacity = 0.7}
            onMouseLeave={e => e.target.style.opacity = 1}
          >
            {isSignup ? 'Log in' : 'Sign up free'}
          </span>
        </p>
      </div>
    </div>
  )
}
