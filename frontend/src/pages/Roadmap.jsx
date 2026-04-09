import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { apiRequest, clearAuthSession, setAuthSession, getAuthToken } from '../utils/api'

// Canonical language order — matches backend LANGUAGE_ORDER exactly
const LANGUAGE_ORDER = ['HTML', 'CSS', 'JavaScript', 'React', 'Node', 'Express', 'MongoDB']

// Display labels for languages that have a different canonical name
const DISPLAY_LABEL = {
  Node: 'Node.js',
  Express: 'Express.js',
}

function label(lang) {
  return DISPLAY_LABEL[lang] || lang
}

function IconForStatus({ status }) {
  if (status === 'completed') return <CheckCircle2 size={18} color="var(--green)" />
  if (status === 'current') return <PlayCircle size={18} color="var(--accent)" />
  return <Lock size={18} color="var(--text2)" />
}

function statusText(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'current') return 'In Progress'
  return 'Locked'
}

export default function Roadmap() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Reset state ───────────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetting, setResetting]     = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      await apiRequest('/roadmap/reset', { method: 'POST' })
      // Clear all cached onboarding/journey state from localStorage
      // Keep the auth token so the user stays logged in
      localStorage.removeItem('dm-onboarding')
      localStorage.removeItem('dm-user')
      localStorage.removeItem('dm-current-language')
      localStorage.removeItem('dm-code-eval-context')
      // Clear any draft keys
      Object.keys(localStorage)
        .filter((k) => k.startsWith('dm-draft-'))
        .forEach((k) => localStorage.removeItem(k))
      // Redirect to onboarding so they can choose a new roadmap
      navigate('/onboarding/skills')
    } catch (e) {
      setError(e.message || 'Reset failed. Please try again.')
      setShowConfirm(false)
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        // GET /api/roadmap — returns { currentLanguage, completedLanguages, knownLanguages, roadmap[] }
        // roadmap[] is built server-side from User.currentLanguage + VideoProgress completion counts.
        // Status logic (backend):
        //   idx < currentIdx  → 'completed'
        //   idx === currentIdx → 'current'
        //   idx > currentIdx  → 'locked'
        const res = await apiRequest('/roadmap')
        if (!mounted) return
        setData(res)
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load roadmap')
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Backend returns roadmap[] already ordered and with correct statuses.
  // For custom journeys, use the user's customLanguages order instead of LANGUAGE_ORDER.
  const isCustom = data?.startMode === 'custom'

  const roadmapEntries = (() => {
    if (!data?.roadmap) return []
    const byLang = new Map(data.roadmap.map((r) => [r.language, r.status]))

    if (isCustom && Array.isArray(data.customLanguages) && data.customLanguages.length > 0) {
      // Custom journey: render in the user's chosen order, include all their languages
      return data.customLanguages.map((lang) => ({
        language: lang,
        status: byLang.get(lang) || (lang === data.currentLanguage ? 'current' : 'locked'),
      }))
    }

    // Default journey: fixed LANGUAGE_ORDER
    return LANGUAGE_ORDER.map((lang) => ({
      language: lang,
      status: byLang.get(lang) || 'locked',
    }))
  })()

  const currentLanguage = data?.currentLanguage || null

  const goToLanguage = (lang) => {
    navigate(`/video-task?language=${encodeURIComponent(lang)}`)
  }

  const goToMiniProjects = (lang) => {
    navigate(`/mini-project/${lang.toLowerCase()}`)
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>Roadmap</h1>
              <p className="page-subtitle" style={{ marginBottom: 0 }}>
                Your learning path. Progress persists after refresh.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'transparent', border: '1px solid var(--red)',
                color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              🔄 Reset Roadmap
            </button>
          </div>

          {/* ── Confirmation modal ── */}
          {showConfirm && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}>
              <div className="card" style={{
                maxWidth: 420, width: '100%', padding: 28,
                border: '1px solid var(--border)', borderRadius: 16,
                animation: 'fadeUp 0.2s ease both',
              }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  Reset your roadmap?
                </div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 18 }}>
                  This will permanently remove:
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
                  {[
                    '🗑 All playlists and videos',
                    '🗑 All task and video progress',
                    '🗑 All code submissions and drafts',
                    '🗑 Mini project progress',
                    '🗑 Assessment results',
                    '🗑 Roadmap data',
                  ].map((item, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', gap: 8 }}>
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                    ✅ Your XP and streak will remain safe.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowConfirm(false)}
                    disabled={resetting}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: resetting ? 0.75 : 1, transition: 'opacity 0.15s',
                    }}
                    onClick={handleReset}
                    disabled={resetting}
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: 14, background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 12, color: '#b91c1c', marginBottom: 16, marginTop: 16,
            }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="card" style={{ padding: 14, marginBottom: 16 }}>Loading roadmap...</div>
          ) : (
            <>
              {/* Current language summary pill */}
              {currentLanguage && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 999, marginBottom: 20,
                  background: 'var(--accent-l)', border: '1px solid var(--accent)',
                  fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                }}>
                  <PlayCircle size={14} />
                  Currently learning: {label(currentLanguage)}
                </div>
              )}

              {/* Roadmap list with vertical connector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roadmapEntries.map((entry, i) => {
                  const { status } = entry
                  const isCurrent = status === 'current'
                  const isCompleted = status === 'completed'
                  const isLocked = status === 'locked'
                  const isClickable = !isLocked

                  const borderColor = isCurrent
                    ? 'rgba(99,102,241,0.6)'
                    : isCompleted
                      ? 'rgba(16,185,129,0.4)'
                      : 'var(--border2)'

                  const background = isCurrent
                    ? 'rgba(99,102,241,0.10)'
                    : isCompleted
                      ? 'rgba(16,185,129,0.06)'
                      : 'var(--bg3)'

                  return (
                    <div key={entry.language} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12 }}>
                      {/* Vertical connector + status icon */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 20, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ zIndex: 2, marginTop: 2 }}>
                            <IconForStatus status={status} />
                          </div>
                          {i < roadmapEntries.length - 1 && (
                            <div style={{
                              width: 2,
                              background: isCompleted ? 'var(--green)' : 'var(--border)',
                              flex: 1,
                              marginTop: 8,
                              opacity: isCompleted ? 0.4 : 1,
                            }} />
                          )}
                        </div>
                      </div>

                      {/* Language card */}
                      <div
                        className="card"
                        role={isClickable ? 'button' : undefined}
                        style={{
                          padding: '12px 14px', borderRadius: 12, background,
                          backdropFilter: 'blur(10px)', opacity: isLocked ? 0.5 : 1,
                          border: `1px solid ${borderColor}`, boxShadow: 'none',
                          transition: 'transform 0.15s, border-color 0.18s, background 0.18s',
                          cursor: isClickable ? 'pointer' : 'default',
                          pointerEvents: isLocked ? 'none' : 'auto',
                        }}
                        onMouseEnter={(e) => {
                          if (!isClickable) return
                          e.currentTarget.style.borderColor = 'var(--accent)'
                          e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = borderColor
                          e.currentTarget.style.background = background
                          e.currentTarget.style.transform = 'none'
                        }}
                        onClick={() => { if (isClickable) goToMiniProjects(entry.language) }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
                              {label(entry.language)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{statusText(status)}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            {isCompleted && <span className="badge badge-green" style={{ fontSize: 11 }}>Completed ✓</span>}
                            {isCurrent && <span className="badge badge-cyan" style={{ fontSize: 11 }}>Current</span>}
                            {isLocked && <span className="badge badge-orange" style={{ fontSize: 11 }}>Locked 🔒</span>}
                            {isCurrent && (
                              <button
                                className="btn-primary"
                                style={{ padding: '7px 14px', fontSize: 12 }}
                                onClick={(e) => { e.stopPropagation(); goToLanguage(entry.language) }}
                              >
                                Resume →
                              </button>
                            )}
                            {isCurrent && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '5px 12px', fontSize: 12 }}
                                onClick={(e) => { e.stopPropagation(); goToMiniProjects(entry.language) }}
                              >
                                🧪 Projects
                              </button>
                            )}
                            {isCompleted && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '5px 12px', fontSize: 12 }}
                                onClick={(e) => { e.stopPropagation(); goToLanguage(entry.language) }}
                              >
                                Review
                              </button>
                            )}
                            {isCompleted && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '5px 12px', fontSize: 12 }}
                                onClick={(e) => { e.stopPropagation(); goToMiniProjects(entry.language) }}
                              >
                                🧪 Projects
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded panel — only for current language */}
                        {isCurrent && (
                          <div style={{
                            marginTop: 12, padding: 14, borderRadius: 10,
                            background: 'var(--bg3)', border: '1px solid var(--accent-l)',
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>
                              Current module
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                              Continue your video journey for <strong>{label(entry.language)}</strong>.
                              Complete all videos to unlock the next language.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {roadmapEntries.length === 0 && !loading && (
                  <div className="card" style={{ padding: 14 }}>No roadmap data yet.</div>
                )}
              </div>
            </>
          )}
        </PageWrapper>
      </main>
    </div>
  )
}
