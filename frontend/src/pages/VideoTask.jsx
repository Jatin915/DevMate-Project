/**
 * VideoTask.jsx — Video learning page.
 *
 * Logic lives in:
 *   hooks/useVideoJourney.js    — playlist/video/task loading, markVideoComplete
 *   hooks/usePlaylistModal.js   — upload/change playlist modal state + API calls
 *
 * UI components:
 *   components/VideoTask/VideoPlaylistPanel.jsx — right panel (video list, progress)
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useVideoJourney } from '../hooks/useVideoJourney'
import { usePlaylistModal } from '../hooks/usePlaylistModal'
import VideoPlaylistPanel from '../components/VideoTask/VideoPlaylistPanel'

// ── Shared playlist URL input modal ──────────────────────────────────────
function PlaylistModal({ title, description, language, onConfirm, onCancel, changing, changeError, newPlaylistUrl, setNewPlaylistUrl, confirmLabel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 460, width: '100%', padding: 28, borderRadius: 16, animation: 'fadeUp 0.2s ease both' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title} — {language}</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 18, lineHeight: 1.6 }}>{description}</p>
        <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>YouTube Playlist URL</label>
        <input
          type="text" value={newPlaylistUrl} autoFocus
          onChange={(e) => setNewPlaylistUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=..."
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 14, outline: 'none', marginBottom: 8 }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
        />
        {changeError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>{changeError}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={changing}>Cancel</button>
          <button className="btn-primary" style={{ flex: 1, opacity: changing ? 0.75 : 1 }} onClick={onConfirm} disabled={changing}>
            {changing ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function VideoTask() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const languageParam   = params.get('language')
  const preferredVideoId = params.get('videoId')
  const refreshTasksKey  = params.get('refreshTasks')

  // ── Hooks ─────────────────────────────────────────────────────────────
  const journey = useVideoJourney({ languageParam, preferredVideoId, refreshTasksKey })

  const modal = usePlaylistModal({
    language:        journey.language,
    applyNewPlaylist: journey.applyNewPlaylist,
  })

  const {
    journeyLoading, journeyError,
    playlistId, language, videos, activeVideoId, setActiveVideoId,
    tasksLoading, tasksError,
    activeTaskId, setActiveTaskId,
    activeVideo, orderedTasks, completed,
    activeTask, activeTaskUnlocked, isTaskUnlocked,
    markVideoComplete,
  } = journey

  // ── Navigate to code editor for a task ───────────────────────────────
  const openTaskInEditor = (t) => {
    const problem = [
      t.title,
      t.description || '',
      t.expectedOutput ? `Expected output:\n${t.expectedOutput}` : '',
    ].filter(Boolean).join('\n')

    localStorage.setItem('dm-code-eval-context', JSON.stringify({
      taskId:          t.id,
      videoId:         activeVideoId,
      language:        language || activeVideo?.language || '',
      problemDescription: problem,
      starterCode:     t.starterCode || '// Write your solution here\n',
      taskTitle:       t.title,
      taskDescription: t.description || '',
      difficulty:      t.difficulty || 'medium',
      hints:           t.hints || [],
    }))
    navigate(
      `/code-editor?taskId=${encodeURIComponent(String(t.id))}&videoId=${encodeURIComponent(String(activeVideoId || ''))}&language=${encodeURIComponent(language || activeVideo?.language || '')}`,
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>

        {/* Top bar */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #e8e8e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', animation: 'fadeUp 0.25s ease both' }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: 6 }}>
              {language || activeVideo?.language || 'Journey'} · Video tasks
            </span>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {activeVideo?.title || 'Video'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={modal.openChange}>
              🔄 Change Playlist
            </button>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => navigate('/roadmap')}>
              Unlock Next →
            </button>
          </div>
        </div>

        {/* Modals */}
        {modal.showUploadModal && (
          <PlaylistModal
            title="Upload Playlist"
            description={`Paste a YouTube playlist URL to start your ${language} learning journey.`}
            language={language}
            onConfirm={modal.handleUploadPlaylist}
            onCancel={() => modal.setShowUploadModal(false)}
            changing={modal.changing}
            changeError={modal.changeError}
            newPlaylistUrl={modal.newPlaylistUrl}
            setNewPlaylistUrl={modal.setNewPlaylistUrl}
            confirmLabel="Load Playlist"
          />
        )}
        {modal.showChangeModal && (
          <PlaylistModal
            title="Change Playlist"
            description={`This will remove the current playlist and all its task progress for ${language}. Other languages are not affected.`}
            language={language}
            onConfirm={modal.handleChangePlaylist}
            onCancel={() => modal.setShowChangeModal(false)}
            changing={modal.changing}
            changeError={modal.changeError}
            newPlaylistUrl={modal.newPlaylistUrl}
            setNewPlaylistUrl={modal.setNewPlaylistUrl}
            confirmLabel="Update Playlist"
          />
        )}

        {/* Error banner */}
        {journeyError && (
          <div style={{ padding: 14, background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#b91c1c' }}>
            {journeyError}
          </div>
        )}

        {/* No playlist empty state */}
        {!journeyLoading && !playlistId && language && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, textAlign: 'center', minHeight: 'calc(100vh - 73px)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No playlist selected yet</div>
            <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24, maxWidth: 380, lineHeight: 1.6 }}>
              Upload a YouTube playlist to start your <strong>{language}</strong> learning journey.
              Tasks will be generated automatically for each video.
            </p>
            <button className="btn-primary" style={{ padding: '11px 28px', fontSize: 14, fontWeight: 600 }} onClick={modal.openUpload}>
              📤 Upload Playlist
            </button>
          </div>
        )}

        {/* Main grid */}
        <div style={{ display: playlistId ? 'grid' : 'none', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 73px)' }}>

          {/* Left: video player + task list */}
          <div style={{ borderRight: '1px solid #e8e8e4', display: 'flex', flexDirection: 'column', background: '#fff', animation: 'fadeUp 0.3s ease both' }}>

            {/* Video player */}
            <div style={{ aspectRatio: '16/9', background: 'var(--bg3)', borderBottom: '1px solid #e8e8e4', position: 'relative', overflow: 'hidden' }}>
              {activeVideo?.youtubeVideoId ? (
                <iframe
                  title={activeVideo.title || 'YouTube video'}
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeVideoId}`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 14, color: 'var(--text3)' }}>
                  No video selected.
                </div>
              )}
            </div>

            {/* Task list */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Tasks for this video</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{completed}/{orderedTasks.length} completed</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {tasksLoading && orderedTasks.length === 0 && (
                  <div className="card" style={{ padding: 12 }}>Loading tasks...</div>
                )}
                {tasksError && (
                  <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10 }}>
                    {tasksError}
                  </div>
                )}
                {orderedTasks.map((t, idx) => {
                  const unlocked = isTaskUnlocked(idx, t)
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (!activeVideo?.unlocked || !unlocked) return
                        openTaskInEditor(t)
                      }}
                      style={{
                        padding: '11px 13px', borderRadius: 10,
                        cursor: activeVideo?.unlocked && unlocked ? 'pointer' : 'not-allowed',
                        background: t.completed ? '#f0fdf4' : unlocked ? 'var(--card)' : 'var(--bg3)',
                        border: `1px solid ${t.completed ? '#bbf7d0' : unlocked ? 'var(--border)' : 'var(--border2)'}`,
                        opacity: !activeVideo?.unlocked ? 0.5 : 1,
                        pointerEvents: !activeVideo?.unlocked ? 'none' : 'auto',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, background: t.completed ? 'var(--green)' : '#fff', border: `1.5px solid ${t.completed ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>
                          {t.completed ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t.description}</div>
                        </div>
                        {!t.completed && !unlocked && <span className="badge badge-orange" style={{ fontSize: 10, marginLeft: 'auto' }}>Locked</span>}
                        {!t.completed && unlocked  && <span className="badge badge-cyan"   style={{ fontSize: 10, marginLeft: 'auto' }}>Unlocked</span>}
                        <span className={`badge ${t.difficulty === 'easy' ? 'badge-green' : t.difficulty === 'hard' ? 'badge-orange' : 'badge-cyan'}`} style={{ fontSize: 11 }}>
                          {t.difficulty}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '9px 16px', fontSize: 13 }}
                  disabled={!activeVideo?.unlocked || !activeTask || !activeTaskUnlocked || activeTask.completed || journeyLoading || tasksLoading}
                  title={!activeVideo?.unlocked ? 'Video is locked' : !activeTask ? 'Select an unlocked task' : !activeTaskUnlocked ? 'Complete the previous task first.' : activeTask.completed ? 'Task already completed' : ''}
                  onClick={() => {
                    if (!activeTask || !activeVideo?.unlocked || !activeTaskUnlocked) return
                    openTaskInEditor(activeTask)
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

          {/* Right: playlist panel */}
          <VideoPlaylistPanel
            playlistId={playlistId}
            videos={videos}
            activeVideoId={activeVideoId}
            setActiveVideoId={setActiveVideoId}
            journeyLoading={journeyLoading}
            language={language}
            orderedTasks={orderedTasks}
            completed={completed}
            openUpload={modal.openUpload}
          />
        </div>
      </main>
    </div>
  )
}
