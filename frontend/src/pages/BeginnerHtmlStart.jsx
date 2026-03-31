import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest, readOnboarding } from '../utils/api'

export default function BeginnerHtmlStart() {
  const navigate = useNavigate()
  const onboarding = readOnboarding()
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [title, setTitle] = useState('HTML Beginner Track')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!playlistUrl.trim()) {
      setError('Please paste a YouTube playlist URL to start your HTML journey.')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/playlists/add', {
        method: 'POST',
        body: JSON.stringify({
          playlistUrl: playlistUrl.trim(),
          title: title.trim() || 'HTML Beginner Track',
          description: 'Beginner path started from HTML onboarding mode',
        }),
      })
      navigate('/roadmap')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!onboarding?.assessmentCompleted) navigate('/onboarding/skills')
  }, [onboarding, navigate])

  if (!onboarding?.assessmentCompleted) return null

  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title">Start from Beginner (HTML)</h1>
        <p className="page-subtitle">You skipped assessment. Add your first HTML playlist to begin learning.</p>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>HTML playlist setup</div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>Track title</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="HTML Beginner Track"
            style={{ marginBottom: 12 }}
          />

          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>YouTube Playlist URL</label>
          <input
            className="input-field"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
          />

          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>
            Current language: <strong>HTML</strong> · Start mode: <strong>Beginner</strong>
          </div>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate('/roadmap')}>Skip for now</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Adding playlist...' : 'Start HTML Journey'}
          </button>
        </div>
      </main>
    </div>
  )
}
