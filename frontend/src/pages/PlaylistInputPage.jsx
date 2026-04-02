import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest, readOnboarding } from '../utils/api'

export default function PlaylistInputPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const onboarding = readOnboarding()

  const language = useMemo(() => {
    // URL param takes priority (set by OnboardingCustomJourney and journey navigation)
    const fromParam = params.get('language')
    if (fromParam && fromParam.trim()) return fromParam.trim()

    // Fall back to onboarding state — works for both default and custom journeys
    const fromStorage = onboarding?.currentLanguage || onboarding?.recommendedNextLanguage
    if (fromStorage && fromStorage.trim()) return fromStorage.trim()

    return 'HTML'
  }, [params, onboarding])

  const [playlistUrl, setPlaylistUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!onboarding?.assessmentCompleted) {
      navigate('/onboarding/skills')
    }
  }, [onboarding, navigate])

  const submit = async () => {
    setError('')
    if (!playlistUrl.trim()) {
      setError('Please paste a YouTube playlist URL.')
      return
    }
    setLoading(true)
    try {
      const res = await apiRequest('/playlists/load', {
        method: 'POST',
        body: JSON.stringify({ language, playlistUrl: playlistUrl.trim() }),
      })
      navigate(`/video-task?language=${encodeURIComponent(language)}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!onboarding?.assessmentCompleted) return null

  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title">Start Your {language} Journey</h1>
        <p className="page-subtitle">Paste a YouTube playlist URL to load your learning path.</p>

        <div className="card" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>YouTube Playlist URL</label>
          <input
            className="input-field"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
          />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
            Current language: <strong>{language}</strong>
          </div>
        </div>

        {error && (
          <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Do this later</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? 'Loading...' : 'Load Playlist'}
          </button>
        </div>
      </main>
    </div>
  )
}

