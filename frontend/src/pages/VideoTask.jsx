import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { apiRequest } from '../utils/api'

export default function VideoTask() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const languageParam = params.get('language')
  const preferredVideoId = params.get('videoId')
  const refreshTasksKey = params.get('refreshTasks')

  const [journeyLoading, setJourneyLoading] = useState(false)
  const [journeyError, setJourneyError] = useState('')
  const [playlistId, setPlaylistId] = useState(null)
  const [language, setLanguage] = useState(null)
  const [videos, setVideos] = useState([])
  const [activeVideoId, setActiveVideoId] = useState(null)

  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const [tasks, setTasks] = useState([])
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [videoHover, setVideoHover] = useState(false)

  // ── Change playlist modal ─────────────────────────────────────────────────
  const [showChangeModal, setShowChangeModal] = useState(false)
  const [newPlaylistUrl, setNewPlaylistUrl]   = useState('')
  const [changing, setChanging]               = useState(false)
  const [changeError, setChangeError]         = useState('')

  const handleChangePlaylist = async () => {
    if (!newPlaylistUrl.trim()) { setChangeError('Please paste a YouTube playlist URL.'); return }
    if (!language) { setChangeError('No language selected.'); return }
    setChanging(true)
    setChangeError('')
    try {
      const res = await apiRequest('/playlists/change', {
        method: 'PUT',
        body: JSON.stringify({ language, playlistUrl: newPlaylistUrl.trim() }),
      })
      // Reload the video list with the new playlist
      setPlaylistId(res.playlistId || null)
      setVideos(res.videos || [])
      setTasks([])
      setActiveTaskId(null)
      const first = (res.videos || []).find((v) => v.unlocked) || res.videos?.[0] || null
      setActiveVideoId(first?.id ? String(first.id) : null)
      setShowChangeModal(false)
      setNewPlaylistUrl('')
    } catch (e) {
      setChangeError(e.message || 'Failed to update playlist.')
    } finally {
      setChanging(false)
    }
  }

  const activeVideo = useMemo(
    () => videos.find((v) => String(v.id) === String(activeVideoId)) || null,
    [videos, activeVideoId],
  )

  useEffect(() => {
    const load = async () => {
      const fromStorage = (() => {
        try {
          const raw = localStorage.getItem('dm-onboarding')
          const parsed = raw ? JSON.parse(raw) : null
          return parsed?.currentLanguage || parsed?.recommendedNextLanguage || null
        } catch {
          return null
        }
      })()
      const langRaw = languageParam || fromStorage
      if (!langRaw) return
      const normalize = (v) => {
        if (v === 'Node.js') return 'Node'
        if (v === 'Express.js') return 'Express'
        return v
      }
      const lang = normalize(String(langRaw).trim())

      setJourneyLoading(true)
      setJourneyError('')
      try {
        const res = await apiRequest(`/videos/${encodeURIComponent(lang)}`)
        setLanguage(lang)
        setPlaylistId(res.playlistId || null)
        setVideos(res.videos)

        if (res.videos.length > 0) {
          const unlocked = res.videos.filter((v) => v.unlocked && !v.completed)
          const firstUnlocked = unlocked[0] || res.videos.find((v) => v.unlocked) || res.videos[0]
          const pick = preferredVideoId
            ? res.videos.find((v) => String(v.id) === String(preferredVideoId)) || firstUnlocked
            : firstUnlocked
          setActiveVideoId(pick?.id != null ? String(pick.id) : null)
        } else {
          setActiveVideoId(null)
        }
      } catch (e) {
        setJourneyError(e.message)
      } finally {
        setJourneyLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageParam])

  useEffect(() => {
    const loadTasks = async () => {
      if (!activeVideoId) return
      setTasksLoading(true)
      setTasksError('')
      try {
        // GET /tasks/:videoId — backend calls ensureTasksForVideo internally,
        // which generates tasks once and never regenerates them.
        const res = await apiRequest(`/tasks/${activeVideoId}`)
        setTasks(res.tasks || [])
      } catch (e) {
        setTasksError(e.message)
        setTasks([])
      } finally {
        setTasksLoading(false)
      }
    }

    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoId, refreshTasksKey])

  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [tasks])

  const completed = orderedTasks.filter((t) => t.completed).length
  const allTasksDone = orderedTasks.length > 0 && orderedTasks.every((t) => t.completed)
  const firstIncompleteIndex = orderedTasks.findIndex((t) => !t.completed)

  const isTaskUnlocked = (idx, task) => {
    if (!task) return false
    if (task.completed) return true
    if (firstIncompleteIndex === -1) return true
    return idx === firstIncompleteIndex
  }

  const activeTask = useMemo(() => {
    return orderedTasks.find((t) => String(t.id) === String(activeTaskId)) || null
  }, [orderedTasks, activeTaskId])

  const activeTaskIndex = useMemo(() => {
    if (!activeTaskId) return -1
    return orderedTasks.findIndex((t) => String(t.id) === String(activeTaskId))
  }, [orderedTasks, activeTaskId])

  const activeTaskUnlocked = activeTask ? isTaskUnlocked(activeTaskIndex, activeTask) : false

  useEffect(() => {
    // Keep the active task valid after refetch.
    if (!activeTaskId) {
      const next = orderedTasks.find((t) => !t.completed) || orderedTasks[0] || null
      setActiveTaskId(next?.id ? String(next.id) : null)
      return
    }

    const stillExists = orderedTasks.some((t) => String(t.id) === String(activeTaskId))
    if (!stillExists) {
      const next = orderedTasks.find((t) => !t.completed) || orderedTasks[0] || null
      setActiveTaskId(next?.id ? String(next.id) : null)
      return
    }

    const current = orderedTasks.find((t) => String(t.id) === String(activeTaskId))
    if (current?.completed) {
      const next = orderedTasks.find((t) => !t.completed) || current
      setActiveTaskId(next?.id ? String(next.id) : null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedTasks])

  const markVideoComplete = async () => {
    if (!playlistId || !activeVideoId) return
    setJourneyLoading(true)
    setJourneyError('')
    try {
      const res = await apiRequest('/videos/complete', {
        method: 'POST',
        body: JSON.stringify({ videoId: activeVideoId }),
      })

      if (Array.isArray(res.videos)) {
        setVideos(res.videos)
      }
      if (res.playlistId) {
        setPlaylistId(res.playlistId)
      }
      if (res.language) {
        setLanguage(res.language)
      }

      if (res.languageCompleted && res.nextLanguage) {
        navigate(`/journey/playlist?language=${encodeURIComponent(res.nextLanguage)}`)
        return
      }

      if (res.nextUnlockedVideoId) {
        setActiveVideoId(String(res.nextUnlockedVideoId))
      } else {
        const nextWatch = res.videos?.find((v) => v.unlocked && !v.completed)
        if (nextWatch) {
          setActiveVideoId(String(nextWatch.id))
        }
      }
    } catch (e) {
      setJourneyError(e.message)
    } finally {
      setJourneyLoading(false)
    }
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        {/* Top bar */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid #e8e8e4',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#fff', animation: 'fadeUp 0.25s ease both'
        }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: 6 }}>
              {language || activeVideo?.language || 'Journey'} · Video tasks
            </span>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {activeVideo?.title || 'Video'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: 13 }}
              onClick={() => { setShowChangeModal(true); setChangeError(''); setNewPlaylistUrl('') }}
            >
              🔄 Change Playlist
            </button>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => navigate('/roadmap')}>
              Unlock Next →
            </button>
          </div>
        </div>

        {/* ── Change Playlist Modal ── */}
        {showChangeModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div className="card" style={{
              maxWidth: 460, width: '100%', padding: 28,
              borderRadius: 16, animation: 'fadeUp 0.2s ease both',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                Change Playlist — {language}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 18, lineHeight: 1.6 }}>
                This will remove the current playlist and all its task progress for <strong>{language}</strong>.
                Other languages are not affected.
              </p>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                New YouTube Playlist URL
              </label>
              <input
                type="text"
                value={newPlaylistUrl}
                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box',
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                  color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 8,
                  transition: 'border-color 0.18s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleChangePlaylist() }}
              />
              {changeError && (
                <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{changeError}</div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowChangeModal(false)}
                  disabled={changing}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, opacity: changing ? 0.75 : 1 }}
                  onClick={handleChangePlaylist}
                  disabled={changing}
                >
                  {changing ? 'Updating...' : 'Update Playlist'}
                </button>
              </div>
            </div>
          </div>
        )}

        {journeyError && (
          <div style={{ padding: 14, background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#b91c1c' }}>
            {journeyError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 73px)' }}>
          {/* Left */}
          <div style={{ borderRight: '1px solid #e8e8e4', display: 'flex', flexDirection: 'column', background: '#fff', animation: 'fadeUp 0.3s ease both' }}>
            {/* Video player */}
            <div
              onMouseEnter={() => setVideoHover(true)}
              onMouseLeave={() => setVideoHover(false)}
              style={{
                background: videoHover ? 'var(--border)' : 'var(--bg3)',
                aspectRatio: '16/9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexDirection: 'column', gap: 10,
                cursor: 'pointer', transition: 'background 0.2s',
                borderBottom: '1px solid #e8e8e4', position: 'relative', overflow: 'hidden'
              }}>
              {activeVideo?.youtubeVideoId ? (
                <iframe
                  title={activeVideo.title || 'YouTube video'}
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div style={{ fontSize: 14, color: 'var(--text3)' }}>No video selected.</div>
              )}
            </div>

            {/* Task box */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Tasks for this video</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{completed}/{orderedTasks.length} completed</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {tasksLoading && orderedTasks.length === 0 && (
                  <div className="card" style={{ padding: 12 }}>
                    Loading tasks...
                  </div>
                )}
                {tasksError && (
                  <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10 }}>
                    {tasksError}
                  </div>
                )}
                {orderedTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (!activeVideo?.unlocked) return
                      if (!isTaskUnlocked(idx, t)) return
                      // Write full task context to localStorage so CodeEditor can
                      // restore it after a page refresh without re-fetching.
                      const problem = [
                        t.title,
                        t.description || '',
                        t.expectedOutput ? `Expected output:\n${t.expectedOutput}` : '',
                      ].filter(Boolean).join('\n')
                      localStorage.setItem('dm-code-eval-context', JSON.stringify({
                        taskId: t.id,
                        videoId: activeVideoId,
                        language: language || activeVideo?.language || '',
                        problemDescription: problem,
                        starterCode: t.starterCode || '// Write your solution here\n',
                        taskTitle: t.title,
                        taskDescription: t.description || '',
                        difficulty: t.difficulty || 'medium',
                        hints: t.hints || [],
                      }))
                      navigate(
                        `/code-editor?taskId=${encodeURIComponent(String(t.id))}&videoId=${encodeURIComponent(String(activeVideoId || ''))}&language=${encodeURIComponent(language || activeVideo?.language || '')}`,
                      )
                    }}
                    style={{
                      padding: '11px 13px',
                      borderRadius: 10,
                      cursor: activeVideo?.unlocked && isTaskUnlocked(idx, t) ? 'pointer' : 'not-allowed',
                      background: t.completed ? '#f0fdf4' : isTaskUnlocked(idx, t) ? 'var(--card)' : 'var(--bg3)',
                      border: `1px solid ${
                        t.completed ? '#bbf7d0' : isTaskUnlocked(idx, t) ? 'var(--border)' : 'var(--border2)'
                      }`,
                      opacity: !activeVideo?.unlocked ? 0.5 : 1,
                      pointerEvents: !activeVideo?.unlocked ? 'none' : 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: t.completed ? 'var(--green)' : '#fff',
                        border: `1.5px solid ${t.completed ? 'var(--green)' : 'var(--border2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff',
                      }}>{t.completed ? '✓' : ''}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t.description}</div>
                      </div>
                      {!t.completed && !isTaskUnlocked(idx, t) && (
                        <span className="badge badge-orange" style={{ fontSize: 10, marginLeft: 'auto' }}>Locked</span>
                      )}
                      {!t.completed && isTaskUnlocked(idx, t) && (
                        <span className="badge badge-cyan" style={{ fontSize: 10, marginLeft: 'auto' }}>Unlocked</span>
                      )}
                      <span className={`badge ${
                        t.difficulty === 'easy' ? 'badge-green'
                          : t.difficulty === 'hard' ? 'badge-orange'
                            : 'badge-cyan'
                      }`} style={{ fontSize: 11 }}>
                        {t.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '9px 16px', fontSize: 13 }}
                  disabled={
                    !activeVideo?.unlocked ||
                    !activeTask ||
                    !activeTaskUnlocked ||
                    activeTask.completed ||
                    journeyLoading ||
                    tasksLoading
                  }
                  title={
                    !activeVideo?.unlocked
                      ? 'Video is locked'
                      : !activeTask
                        ? 'Select an unlocked task'
                        : !activeTaskUnlocked
                          ? 'Complete the previous task first.'
                          : activeTask.completed
                            ? 'Task already completed'
                            : ''
                  }
                  onClick={() => {
                    if (!activeTask || !activeVideo?.unlocked) return
                    if (!activeTaskUnlocked) return
                    const problem = [
                      activeTask.title,
                      activeTask.description || '',
                      activeTask.expectedOutput ? `Expected output:\n${activeTask.expectedOutput}` : '',
                    ].filter(Boolean).join('\n')
                    localStorage.setItem(
                      'dm-code-eval-context',
                      JSON.stringify({
                        taskId: activeTask.id,
                        videoId: activeVideoId,
                        language: language || activeVideo?.language,
                        problemDescription: problem,
                        starterCode: activeTask.starterCode || '// Write your solution here\n',
                        taskTitle: activeTask.title,
                        taskDescription: activeTask.description || '',
                        difficulty: activeTask.difficulty || 'medium',
                        hints: activeTask.hints || [],
                      }),
                    )
                    navigate(
                      `/code-editor?taskId=${encodeURIComponent(String(activeTask.id))}&videoId=${encodeURIComponent(
                        String(activeVideoId || ''),
                      )}&language=${encodeURIComponent(language || activeVideo?.language || '')}`,
                    )
                  }}
                >
                  Open Editor
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: '9px 16px', fontSize: 13, marginLeft: 'auto', opacity: journeyLoading ? 0.8 : 1 }}
                  onClick={markVideoComplete}
                  disabled={journeyLoading || !activeVideo?.unlocked}
                  title={!activeVideo?.unlocked ? 'This video is locked. Complete the previous video first.' : ''}
                >
                  {journeyLoading ? 'Saving...' : 'Mark video complete'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Tasks panel */}
          <div style={{ padding: 20, overflowY: 'auto', background: 'var(--bg)', animation: 'fadeUp 0.35s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              {playlistId ? 'Playlist videos' : 'AI-Generated Tasks'}
            </div>

            {playlistId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {journeyLoading && videos.length === 0 && (
                  <div className="card">Loading videos...</div>
                )}
                {videos.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => v.unlocked && setActiveVideoId(String(v.id))}
                    style={{
                      padding: '11px 13px',
                      borderRadius: 8,
                      cursor: v.unlocked ? 'pointer' : 'not-allowed',
                      background: v.completed ? '#f0fdf4' : v.unlocked ? '#fff' : 'var(--bg3)',
                      border: `1px solid ${v.completed ? '#bbf7d0' : v.unlocked ? 'var(--border)' : 'var(--border2)'}`,
                      opacity: v.unlocked ? 1 : 0.55,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        background: v.completed ? 'var(--green)' : v.unlocked ? '#fff' : 'var(--border)',
                        border: `1.5px solid ${v.completed ? 'var(--green)' : v.unlocked ? 'var(--border2)' : 'var(--border2)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff',
                      }}>{v.completed ? '✓' : ''}</div>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: v.completed ? 'var(--text3)' : 'var(--text)',
                        textDecoration: v.completed ? 'line-through' : 'none',
                      }}>
                        {v.order + 1}. {v.title}
                      </span>
                      {!v.unlocked && !v.completed && (
                        <span className="badge badge-orange" style={{ fontSize: 10, marginLeft: 'auto' }}>Locked</span>
                      )}
                      {v.unlocked && !v.completed && (
                        <span className="badge badge-cyan" style={{ fontSize: 10, marginLeft: 'auto' }}>Unlocked</span>
                      )}
                      {v.completed && (
                        <span className="badge badge-green" style={{ fontSize: 10, marginLeft: 'auto' }}>Done</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!journeyLoading && videos.length === 0 && (
              <div className="card" style={{ marginBottom: 18 }}>
                No playlist loaded yet.
              </div>
            )}

            {/* Tasks list moved to left panel */}

            {/* Hint */}
            <div style={{ padding: 14, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>Hint</div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Props flow one-way from parent to child. Pass values like{' '}
                <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{'<Child name={value} />'}</code>
              </p>
            </div>

            {/* Progress */}
            <div style={{ padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #e8e8e4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Progress</span>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{completed}/{orderedTasks.length}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${orderedTasks.length ? (completed / orderedTasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
