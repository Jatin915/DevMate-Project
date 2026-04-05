import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { apiRequest } from '../utils/api'

const EMPTY = {
  name: '', email: '', initials: '??', role: 'student',
  streak: 0, xpPoints: 0, jobReadiness: 0, totalProjects: 0,
  skills: [], completedProjects: [], achievements: [], memberSince: null,
}

export default function Profile() {
  const navigate = useNavigate()
  const [data, setData]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [showEdit, setShowEdit]   = useState(false)
  const [form, setForm]           = useState({ name: '', email: '', password: '' })
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const loadProfile = () => {
    apiRequest('/auth/profile/me')
      .then((res) => setData(res))
      .catch((e)  => setError(e.message || 'Failed to load profile'))
      .finally(()  => setLoading(false))
  }

  useEffect(() => { loadProfile() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = () => {
    setForm({ name: data.name || '', email: data.email || '', password: '' })
    setSaveError('')
    setSaveSuccess('')
    setShowEdit(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      const payload = {}
      if (form.name.trim())    payload.name     = form.name.trim()
      if (form.email.trim())   payload.email    = form.email.trim()
      if (form.password.trim()) payload.password = form.password.trim()

      const res = await apiRequest('/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setSaveSuccess('Profile updated successfully ✅')
      // Refresh profile data so name/initials update immediately
      setData((prev) => ({
        ...prev,
        name:     res.user.name,
        email:    res.user.email,
        initials: res.user.initials,
      }))
      // Also update localStorage so the sidebar/header stays in sync
      try {
        const stored = JSON.parse(localStorage.getItem('dm-user') || '{}')
        localStorage.setItem('dm-user', JSON.stringify({ ...stored, name: res.user.name, email: res.user.email }))
      } catch { /* ignore */ }

      setTimeout(() => setShowEdit(false), 1200)
    } catch (e) {
      setSaveError(e.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const {
    name, initials, streak, xpPoints, jobReadiness,
    totalProjects, skills, completedProjects, achievements, memberSince,
  } = data

  const memberYear = memberSince ? new Date(memberSince).getFullYear() : null

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your developer profile. Share it with recruiters.</p>

          {error && (
            <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text3)' }}>
              Loading profile...
            </div>
          ) : (
            <>
              {/* ── Profile header ── */}
              <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: '#eff6ff', border: '2px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: 'var(--accent)',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 3 }}>
                        {name || 'Developer'}
                      </div>
                      <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 12 }}>
                        Developer in Training
                        {memberYear && ` · Member since ${memberYear}`}
                      </div>
                      {skills.length > 0 ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {skills.map((s) => (
                            <span key={s} className="badge badge-purple" style={{ fontSize: 12 }}>{s}</span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                          No skills yet — start a playlist to track your languages.
                        </div>
                      )}
                    </div>
                    <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}
                      onClick={openEdit}>
                      ✏️ Edit Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Stats ── */}
              <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                  { label: 'Projects',      value: String(totalProjects),          color: 'var(--cyan)'   },
                  { label: 'Job readiness', value: `${Math.round(jobReadiness)}%`, color: 'var(--orange)' },
                  { label: 'XP points',     value: xpPoints.toLocaleString(),      color: 'var(--accent)' },
                  { label: 'Streak',        value: `${streak} days`,               color: 'var(--red)'    },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                {/* ── Completed projects ── */}
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Completed projects</div>
                  {completedProjects.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                      No submitted projects yet.{' '}
                      <span
                        style={{ color: 'var(--accent)', cursor: 'pointer' }}
                        onClick={() => navigate('/mini-project')}
                      >
                        Start a mini project →
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {completedProjects.map((p, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 12px', background: 'var(--bg)', borderRadius: 7,
                          border: '1px solid var(--border)',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.language}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {p.score != null && (
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>
                                {p.score}/100
                              </span>
                            )}
                            <button
                              style={{ padding: '4px 10px', borderRadius: 6, background: '#fff', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}
                              onClick={() => navigate(`/mini-project/${encodeURIComponent(p.language.toLowerCase())}`)}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Achievements ── */}
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Achievements</div>
                  {achievements.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                      Complete tasks and projects to earn achievements.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {achievements.map((a, i) => (
                        <div key={i} style={{
                          padding: 12, borderRadius: 8, background: 'var(--bg)',
                          border: '1px solid var(--border)', textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── GitHub placeholder ── */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 28 }}>🐙</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>GitHub</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Connect your GitHub to showcase real repositories</div>
                </div>
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>Connect</button>
              </div>
            </>
          )}

          {/* ── Edit Profile Modal ── */}
          {showEdit && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}>
              <div className="card" style={{
                maxWidth: 420, width: '100%', padding: 28,
                borderRadius: 16, animation: 'fadeUp 0.2s ease both',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Edit Profile</div>

                {/* Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 8, boxSizing: 'border-box',
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      color: 'var(--text)', fontSize: 14, outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 8, boxSizing: 'border-box',
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      color: 'var(--text)', fontSize: 14, outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>
                    New Password <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 8, boxSizing: 'border-box',
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      color: 'var(--text)', fontSize: 14, outline: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
                  />
                </div>

                {saveError && (
                  <div style={{ padding: '9px 12px', borderRadius: 7, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div style={{ padding: '9px 12px', borderRadius: 7, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d', marginBottom: 14 }}>
                    {saveSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowEdit(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, opacity: saving ? 0.75 : 1 }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </PageWrapper>
      </main>
    </div>
  )
}
