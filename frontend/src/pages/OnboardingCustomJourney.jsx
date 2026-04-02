import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../utils/api'

// Debounce helper — avoids an API call on every keystroke
function useDebounce(value, ms = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function OnboardingCustomJourney() {
  const navigate = useNavigate()

  // ── Language list (ordered) ───────────────────────────────────────────────
  const [languages, setLanguages] = useState([])

  // ── Input + autocomplete ──────────────────────────────────────────────────
  const [input, setInput]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [bestMatch, setBestMatch]   = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef(null)
  const debouncedInput = useDebounce(input, 200)

  // ── Drag state ────────────────────────────────────────────────────────────
  const dragIdx = useRef(null)

  // ── Submission ────────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Fetch suggestions whenever input changes
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setSuggestions([])
      setBestMatch(null)
      return
    }
    apiRequest(`/user/language-suggestions?q=${encodeURIComponent(debouncedInput)}`)
      .then((res) => {
        setSuggestions(res.suggestions || [])
        setBestMatch(res.bestMatch || null)
      })
      .catch(() => {})
  }, [debouncedInput])

  const addLanguage = (lang) => {
    const trimmed = lang.trim()
    if (!trimmed || languages.includes(trimmed)) return
    setLanguages((prev) => [...prev, trimmed])
    setInput('')
    setSuggestions([])
    setBestMatch(null)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeLanguage = (idx) => {
    setLanguages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const toAdd = bestMatch || input.trim()
      if (toAdd) addLanguage(toAdd)
    }
    if (e.key === 'Escape') setShowDropdown(false)
  }

  // ── Drag-to-reorder ───────────────────────────────────────────────────────
  const onDragStart = (idx) => { dragIdx.current = idx }
  const onDragOver  = (e, idx) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    const next = [...languages]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(idx, 0, moved)
    dragIdx.current = idx
    setLanguages(next)
  }
  const onDragEnd = () => { dragIdx.current = null }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (languages.length === 0) { setError('Add at least one language.'); return }
    setSaving(true)
    setError('')
    try {
      const res = await apiRequest('/user/custom-journey', {
        method: 'POST',
        body: JSON.stringify({ languages }),
      })
      localStorage.setItem('dm-onboarding', JSON.stringify({
        skillsSelected:         true,
        assessmentCompleted:    true,
        knownLanguages:         res.customLanguages,
        passedLanguages:        [],
        recommendedNextLanguage: res.customLanguages[0],
        startMode:              'custom',
        currentLanguage:        res.customLanguages[0],
        journeyStarted:         true,
        customLanguages:        res.customLanguages,
      }))
      navigate(`/onboarding/html-playlist?language=${encodeURIComponent(res.customLanguages[0])}`)
    } catch (e) {
      setError(e.message || 'Failed to save journey')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-layout">
      <main className="main-content" style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 className="page-title">Create Your Own Journey 🗺️</h1>
        <p className="page-subtitle">Add the languages you want to learn, then drag to set your order.</p>

        <div className="progress-bar" style={{ height: 8, marginBottom: 24 }}>
          <div className="progress-fill" style={{ width: '50%' }} />
        </div>

        {/* ── Input + autocomplete ── */}
        <div className="card" style={{ marginBottom: 16, position: 'relative' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Add a language</div>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowDropdown(true) }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="Type a language… e.g. React, Python, .NET"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, boxSizing: 'border-box',
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                color: 'var(--text)', fontSize: 14, outline: 'none',
                transition: 'border-color 0.18s',
              }}
              onFocusCapture={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlurCapture={(e)  => { e.target.style.borderColor = 'var(--border2)' }}
            />

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 8, marginTop: 4, overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              }}>
                {suggestions.map((s) => (
                  <div
                    key={s}
                    onMouseDown={() => addLanguage(s)}
                    style={{
                      padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                      color: 'var(--text)', transition: 'background 0.12s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-l)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{s}</span>
                    {s === bestMatch && (
                      <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>best match</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fuzzy correction hint */}
          {bestMatch && input.trim() && bestMatch.toLowerCase() !== input.trim().toLowerCase() && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
              Did you mean{' '}
              <span
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => addLanguage(bestMatch)}
              >
                {bestMatch}
              </span>
              ?
            </div>
          )}

          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
            Press <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'var(--bg3)', border: '1px solid var(--border)', fontSize: 11 }}>Enter</kbd> to add
          </div>
        </div>

        {/* ── Language order list ── */}
        {languages.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Your learning order</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Drag to reorder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {languages.map((lang, idx) => (
                <div
                  key={lang}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    cursor: 'grab', userSelect: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-l)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg3)' }}
                >
                  {/* Drag handle */}
                  <span style={{ color: 'var(--text3)', fontSize: 14, cursor: 'grab' }}>⠿</span>
                  {/* Step number */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{lang}</span>
                  <button
                    onClick={() => removeLanguage(idx)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 2px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)' }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages.length === 0 && (
          <div className="card" style={{ marginBottom: 16, padding: 20, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🗺️</div>
            <div style={{ fontSize: 13 }}>No languages added yet. Start typing above.</div>
          </div>
        )}

        {error && (
          <div className="card" style={{ borderColor: 'var(--red)', color: 'var(--red)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/onboarding/skills')} disabled={saving}>
            ← Back
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || languages.length === 0}
          >
            {saving ? 'Saving...' : `Start My Journey (${languages.length} language${languages.length !== 1 ? 's' : ''}) →`}
          </button>
        </div>
      </main>
    </div>
  )
}
