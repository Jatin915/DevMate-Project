/**
 * VideoPlaylistPanel.jsx
 *
 * The right-side panel in the VideoTask page.
 * Shows: video list, progress bar, hint, and upload-playlist empty state.
 */

export default function VideoPlaylistPanel({
  playlistId,
  videos,
  activeVideoId,
  setActiveVideoId,
  journeyLoading,
  language,
  orderedTasks,
  completed,
  openUpload,
}) {
  return (
    <div style={{ padding: 20, overflowY: 'auto', background: 'var(--bg)', animation: 'fadeUp 0.35s ease both' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
        {playlistId ? 'Playlist videos' : 'AI-Generated Tasks'}
      </div>

      {/* Video list */}
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
                padding: '11px 13px', borderRadius: 8,
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
                  border: `1.5px solid ${v.completed ? 'var(--green)' : 'var(--border2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff',
                }}>{v.completed ? '✓' : ''}</div>
                <span style={{
                  fontSize: 13, fontWeight: 500,
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

      {/* Empty state when no videos */}
      {!journeyLoading && videos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>No playlist yet</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
            Upload a playlist to start learning {language}.
          </div>
          <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }} onClick={openUpload}>
            Upload Playlist
          </button>
        </div>
      )}

      {/* Hint */}
      <div style={{ padding: 14, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 6 }}>Hint</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          Complete each video in order to unlock the next one. Click a task card to open the code editor.
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
  )
}
