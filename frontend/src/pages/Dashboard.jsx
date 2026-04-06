import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import ThemeToggle from '../components/ThemeToggle'
import { apiRequest } from '../utils/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await apiRequest('/dashboard')
        if (mounted) setDashboardData(data)
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load dashboard')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const roadmaps = dashboardData?.roadmaps || []
  const recentProjects = dashboardData?.recentProjects || []
  const continueLearning = dashboardData?.continueLearning || null
  const currentLanguage = dashboardData?.currentLanguage || null

  const maxProgress = useMemo(() => {
    if (!Array.isArray(roadmaps) || roadmaps.length === 0) return 0
    return Math.max(...roadmaps.map((r) => r.progress || 0))
  }, [roadmaps])

  const topicsDone = dashboardData?.topicsDone ?? 0
  const projectsBuilt = dashboardData?.projectsBuilt ?? 0
  const tasksSubmitted = dashboardData?.tasksSubmitted ?? 0
  const jobReadiness = dashboardData?.jobReadiness ?? 0
  const streak = dashboardData?.streak ?? 0
  const xpPoints = dashboardData?.xpPoints ?? 0

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <h1 style={{
                fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: -0.5,
                background: 'linear-gradient(135deg, var(--text), var(--accent))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Good morning 👋</h1>
              <p className="page-subtitle">
                You're on a {streak}-day streak. Keep it going.
                {currentLanguage && !loading && (
                  <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>
                    Currently learning: {currentLanguage}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <ThemeToggle />
              <div className="card card-3d" style={{
                padding: '12px 18px', textAlign: 'center', minWidth: 90,
                borderTop: `2px solid var(--orange)`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)' }}>{streak}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Day streak 🔥</div>
              </div>
              <div className="card card-3d" style={{
                padding: '12px 18px', textAlign: 'center', minWidth: 90,
                borderTop: `2px solid var(--accent)`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{xpPoints}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>XP points ⭐</div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 18, color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {/* Progress banner */}
          <div className="card" style={{
            marginBottom: 20,
            borderLeft: '3px solid var(--accent)',
            background: 'linear-gradient(135deg, var(--accent-l), rgba(6,182,212,0.06))',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* subtle shine line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              opacity: 0.4,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Your Learning Progress</div>
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                  {topicsDone} videos completed · {tasksSubmitted} tasks completed
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{maxProgress}%</span>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('/video-task')}>
                  Resume →
                </button>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${maxProgress}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="card card-3d" style={{
              textAlign: 'center',
              animation: 'fadeUp 0.3s ease 0ms both',
              borderTop: `2px solid var(--green)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--green)', opacity: 0.08, filter: 'blur(16px)',
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: 11, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)', marginBottom: 4, position: 'relative' }}>
                {topicsDone}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Topics done</div>
            </div>

            <div className="card card-3d" style={{
              textAlign: 'center',
              animation: 'fadeUp 0.3s ease 60ms both',
              borderTop: `2px solid var(--cyan)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--cyan)', opacity: 0.08, filter: 'blur(16px)',
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: 11, marginBottom: 6 }}>🏗️</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--cyan)', marginBottom: 4, position: 'relative' }}>
                {projectsBuilt}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Projects built</div>
            </div>

            <div className="card card-3d" style={{
              textAlign: 'center',
              animation: 'fadeUp 0.3s ease 120ms both',
              borderTop: `2px solid var(--accent)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--accent)', opacity: 0.08, filter: 'blur(16px)',
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: 11, marginBottom: 6 }}>📝</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', marginBottom: 4, position: 'relative' }}>
                {tasksSubmitted}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Tasks submitted</div>
            </div>

            <div className="card card-3d" style={{
              textAlign: 'center',
              animation: 'fadeUp 0.3s ease 180ms both',
              borderTop: `2px solid var(--orange)`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--orange)', opacity: 0.08, filter: 'blur(16px)',
                pointerEvents: 'none',
              }} />
              <div style={{ fontSize: 11, marginBottom: 6 }}>🎯</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--orange)', marginBottom: 4, position: 'relative' }}>
                {jobReadiness}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Job readiness</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Roadmaps */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Your roadmaps</span>
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/roadmap')}>View all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {loading && (
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>Loading roadmap...</div>
                )}
                {!loading && roadmaps.map((r) => (
                  <div key={r.language}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.language}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{r.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${r.progress}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                ))}
                {!loading && roadmaps.length === 0 && (
                  <div className="card" style={{ padding: 12 }}>No roadmap data yet.</div>
                )}
              </div>
            </div>

            {/* Recent projects */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Recent projects</span>
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => navigate('/mini-project')}>View all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentProjects.map((p, i) => (
                  <div
                    key={i}
                    className="row-click"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 12px',
                      background: 'var(--bg3)',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.language}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${p.status === 'Completed' ? 'badge-green' : 'badge-cyan'}`}>{p.status}</span>
                      {typeof p.score === 'number' && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{p.score}/100</div>
                      )}
                    </div>
                  </div>
                ))}

                {recentProjects.length === 0 && (
                  <div className="card" style={{ padding: 12 }}>No completed projects yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Continue learning */}
          {continueLearning && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Continue learning</div>
              <div
                className="card-click"
                onClick={() => navigate('/video-task')}
                style={{
                  padding: '16px',
                  background: 'var(--bg3)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  borderTop: '2px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: 'var(--text)' }}>
                    {continueLearning.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {continueLearning.type} {continueLearning.duration ? `· ${continueLearning.duration}` : ''}
                  </div>
                </div>
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>Resume →</button>
              </div>
            </div>
          )}
        </PageWrapper>
      </main>
    </div>
  )
}
