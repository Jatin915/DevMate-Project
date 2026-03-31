import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { apiRequest } from '../utils/api'

const languageTabs = [
  { label: 'React', lang: 'React' },
  { label: 'JavaScript', lang: 'JavaScript' },
  { label: 'Node.js', lang: 'Node' },
  { label: 'Python', lang: 'Python' },
]

function IconForStatus({ status }) {
  if (status === 'completed') return <CheckCircle2 size={18} color="var(--green)" />
  if (status === 'current') return <PlayCircle size={18} color="var(--accent)" />
  return <Lock size={18} color="var(--text2)" />
}

function resumeButtonStyle() {
  return { padding: '9px 16px', fontSize: 13 }
}

export default function Roadmap() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTabLang, setActiveTabLang] = useState('React')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
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

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!data?.currentLanguage) return
    setActiveTabLang(data.currentLanguage)
  }, [data?.currentLanguage])

  const currentLanguage = data?.currentLanguage || null
  const roadmapEntries = data?.roadmap || []
  const roadmapByLang = useMemo(() => {
    const m = new Map()
    for (const r of roadmapEntries) m.set(r.language, r.status)
    return m
  }, [roadmapEntries])

  const activeExpanded = currentLanguage

  const goToLanguage = (language) => {
    if (!language) return
    navigate(`/video-task?language=${encodeURIComponent(language)}`)
  }

  const goToCurrentJourney = () => goToLanguage(currentLanguage)

  const statusText = (status) => {
    if (status === 'completed') return 'Completed'
    if (status === 'current') return 'Current'
    return 'Locked'
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          <h1 className="page-title">Roadmap</h1>
          <p className="page-subtitle" style={{ marginBottom: 18 }}>
            Follow your learning journey. Progress persists after refresh.
          </p>

          {error && (
            <div
              style={{
                padding: 14,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                color: '#b91c1c',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="card" style={{ padding: 14, marginBottom: 16 }}>
              Loading roadmap...
            </div>
          ) : (
            <>
              {/* Language pills */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 18,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {languageTabs.map((t) => {
                  const isActive = activeTabLang === t.lang
                  const status = roadmapByLang.get(t.lang) || (t.lang === currentLanguage ? 'current' : 'locked')
                  return (
                    <button
                      key={t.label}
                      onClick={() => setActiveTabLang(t.lang)}
                      style={{
                        borderRadius: 999,
                        padding: '6px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        background: isActive ? 'var(--accent)' : 'var(--bg3)',
                        color: isActive ? '#fff' : 'var(--text3)',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border2)'}`,
                        cursor: 'pointer',
                        transition: 'background 0.18s, border-color 0.18s, transform 0.14s',
                        opacity: status === 'locked' && !isActive ? 0.9 : 1,
                      }}
                      title={statusText(status)}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Roadmap list with vertical connector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roadmapEntries.map((entry, i) => {
                  const status = entry.status
                  const isCurrent = status === 'current'
                  const isCompleted = status === 'completed'
                  const isLocked = status === 'locked'
                  const isExpanded = entry.language === activeExpanded
                  const isTabFocused = entry.language === activeTabLang
                  const isClickable = !isLocked

                  const borderColor = isCurrent
                    ? 'rgba(191,219,254,0.9)'
                    : isCompleted
                      ? 'rgba(147,197,253,0.7)'
                      : isTabFocused
                        ? 'rgba(99,102,241,0.35)'
                        : 'var(--border2)'

                  const background =
                    isCurrent ? 'rgba(99,102,241,0.10)' : isCompleted ? 'rgba(16,185,129,0.06)' : 'var(--bg3)'

                  return (
                    <div key={entry.language} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12 }}>
                      {/* connector + icon */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 20, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ zIndex: 2, marginTop: 2 }}>
                            <IconForStatus status={status} />
                          </div>
                          {i < roadmapEntries.length - 1 && (
                            <div
                              style={{
                                width: 2,
                                background: 'var(--border)',
                                flex: 1,
                                marginTop: 8,
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* card */}
                      <div
                        className="card"
                        style={{
                          padding: '12px 14px',
                          borderRadius: 12,
                          background,
                          backdropFilter: 'blur(10px)',
                          opacity: isLocked ? 0.55 : 1,
                          border: `1px solid ${borderColor}`,
                          boxShadow: 'none',
                          transition: 'transform 0.15s, border-color 0.18s, background 0.18s',
                          ...(isClickable
                            ? {}
                            : { pointerEvents: 'none' }),
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
                        onClick={() => {
                          if (!isClickable) return
                          // Only navigate on click for non-locked nodes.
                          goToLanguage(entry.language)
                        }}
                        role={isClickable ? 'button' : undefined}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
                              {entry.language}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{statusText(status)}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                            {isCompleted && (
                              <span className="badge badge-green" style={{ fontSize: 11 }}>
                                Completed
                              </span>
                            )}
                            {isCurrent && (
                              <span className="badge badge-cyan" style={{ fontSize: 11 }}>
                                Current
                              </span>
                            )}
                            {isLocked && (
                              <span className="badge badge-orange" style={{ fontSize: 11 }}>
                                Locked
                              </span>
                            )}

                            {isCurrent && (
                              <button className="btn-primary" style={resumeButtonStyle()} onClick={(e) => { e.stopPropagation(); goToCurrentJourney() }}>
                                Resume →
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Current module highlight (only current expanded) */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: 14,
                              borderRadius: 12,
                              background: 'var(--bg3)',
                              border: '1px solid var(--accent-l)',
                            }}
                          >
                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>
                              Current module
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                              Continue with your video journey for <strong>{entry.language}</strong>.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {roadmapEntries.length === 0 && !loading && (
                  <div className="card" style={{ padding: 14 }}>
                    No roadmap data available yet.
                  </div>
                )}
              </div>
            </>
          )}
        </PageWrapper>
      </main>
    </div>
  )
}
