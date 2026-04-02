import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'
import { apiRequest } from '../utils/api'

// Zero-state used while loading or for brand-new users
const EMPTY = {
  currentStreak:  0,
  totalXP:        0,
  topicsDone:     0,
  hoursLearned:   0,
  weeklyActivity: [],
  streakDays:     [],
  skills:         [],
  areasToImprove: [],
}

export default function Progress() {
  const navigate = useNavigate()
  const [data, setData]       = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    let mounted = true
    apiRequest('/progress/summary')
      .then((res) => { if (mounted) setData(res) })
      .catch((e)  => { if (mounted) setError(e.message || 'Failed to load progress') })
      .finally(()  => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const {
    currentStreak, totalXP, topicsDone, hoursLearned,
    weeklyActivity, streakDays, skills, areasToImprove,
  } = data

  // Weekly bar chart helpers
  const maxMins = weeklyActivity.length
    ? Math.max(...weeklyActivity.map((d) => d.minutesLearned), 1)
    : 1
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Track your growth and identify what to work on next.</p>

          {error && (
            <div style={{ padding: 12, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* ── Stat cards ── */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Current streak', value: loading ? '—' : `${currentStreak} days`, color: 'var(--orange)' },
              { label: 'Total XP',       value: loading ? '—' : totalXP.toLocaleString(),  color: 'var(--accent)' },
              { label: 'Topics done',    value: loading ? '—' : String(topicsDone),         color: 'var(--green)'  },
              { label: 'Hours learned',  value: loading ? '—' : `${hoursLearned}h`,         color: 'var(--cyan)'   },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* ── Weekly activity bar chart ── */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Weekly activity</div>
              {loading ? (
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
              ) : weeklyActivity.length === 0 ? (
                <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>No activity yet</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {weeklyActivity.map((d, i) => {
                    const isToday = d.date === todayStr
                    const barH = Math.max(2, Math.round((d.minutesLearned / maxMins) * 70))
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                          {d.minutesLearned > 0 ? `${d.minutesLearned}m` : ''}
                        </div>
                        <div style={{
                          width: '100%', borderRadius: '3px 3px 0 0',
                          height: `${barH}px`,
                          background: isToday ? 'var(--accent)' : d.minutesLearned > 0 ? 'var(--accent-l)' : 'var(--border)',
                          border: isToday ? '1px solid var(--accent)' : 'none',
                          transition: 'height 0.4s ease',
                        }} />
                        <div style={{ fontSize: 10, color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 600 : 400 }}>
                          {d.day}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Streak calendar ── */}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Streak calendar</div>
              {loading ? (
                <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                    {streakDays.length > 0
                      ? streakDays.map((d, i) => (
                          <div
                            key={i}
                            title={d.date}
                            style={{
                              aspectRatio: '1', borderRadius: 3,
                              background: d.completed ? 'var(--accent)' : 'var(--bg3)',
                              border: `1px solid ${d.completed ? 'var(--accent)' : 'var(--border)'}`,
                              opacity: d.completed ? 1 : 0.5,
                            }}
                          />
                        ))
                      : Array.from({ length: 28 }, (_, i) => (
                          <div key={i} style={{ aspectRatio: '1', borderRadius: 3, background: 'var(--bg3)', border: '1px solid var(--border)', opacity: 0.5 }} />
                        ))
                    }
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
                    <span>□ Missed</span>
                    <span style={{ color: 'var(--accent)' }}>■ Active</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Skill progress bars ── */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Skill progress</div>
            {loading ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
            ) : skills.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                No skill data yet. Start a playlist to track your progress.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {skills.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{s.level}%</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${s.level}%`,
                        background: s.color,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Areas to improve ── */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Areas to improve</div>
            {loading ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading...</div>
            ) : areasToImprove.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                {skills.length === 0
                  ? 'Complete some videos to see improvement suggestions.'
                  : '🎉 All active languages are above 50% — keep going!'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {areasToImprove.map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{w.area}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{w.suggestion}</div>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                      onClick={() => navigate(`/video-task?language=${encodeURIComponent(w.area)}`)}
                    >
                      Fix now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PageWrapper>
      </main>
    </div>
  )
}
