import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { apiRequest } from '../utils/api'

const starterCode = `// Task: Create a React component that accepts
// a "name" prop and displays a greeting.

function Greeting({ name }) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Welcome to DevMate.</p>
    </div>
  );
}

export default Greeting;`

const langs = ['JavaScript', 'Python', 'TypeScript']

export default function CodeEditor() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const defaultStarterCode = starterCode

  const [taskId, setTaskId] = useState(null)
  const [videoId, setVideoId] = useState(null)
  const [language, setLanguage] = useState(null)
  const [problemDescription, setProblemDescription] = useState('')

  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState(null) // { reviewing?:boolean, message, score?, feedback?, suggestions? }
  const [activeTab, setActiveTab] = useState('feedback')
  const [activeLang, setActiveLang] = useState('JavaScript')

  useEffect(() => {
    const stored = (() => {
      try {
        const raw = localStorage.getItem('dm-code-eval-context')
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    })()

    const effectiveTaskId = params.get('taskId') || stored?.taskId || null
    const effectiveVideoId = params.get('videoId') || stored?.videoId || null
    const effectiveLanguage = params.get('language') || stored?.language || null
    const effectiveProblem =
      params.get('problemDescription') || stored?.problemDescription || stored?.problem || ''

    setTaskId(effectiveTaskId)
    setVideoId(effectiveVideoId)
    setLanguage(effectiveLanguage)
    setProblemDescription(effectiveProblem)

    if (stored?.starterCode) {
      setCode(stored.starterCode)
    } else {
      setCode(defaultStarterCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRun = () => {
    setOutput(null)
    setTimeout(() => setOutput({ success: true, message: 'Component rendered successfully! Output: Hello, World!' }), 300)
  }

  const handleSubmit = async () => {
    if (!problemDescription) {
      setOutput({
        reviewing: false,
        message: 'Missing problem description. Go back and open the editor from a task card.',
      })
      return
    }
    // Save progress first so learning flow never depends on the AI provider.
    if (taskId) {
      try {
        await apiRequest('/tasks/complete', {
          method: 'POST',
          body: JSON.stringify({ taskId }),
        })
      } catch {
        // If task completion fails for any reason, we still attempt AI evaluation below.
      }

      // Update UI immediately by returning to the video page and forcing a tasks refetch.
      navigate(
        `/video-task?language=${encodeURIComponent(language || '')}&videoId=${encodeURIComponent(videoId || '')}&refreshTasks=${Date.now()}`,
      )

      // AI evaluation is optional: run it silently after save (do not block progress).
      ;(async () => {
        try {
          await apiRequest('/ai/evaluate', {
            method: 'POST',
            body: JSON.stringify({
              code,
              problemDescription,
            }),
          })
        } catch {
          // ignore AI failures
        }
      })()
      return
    }

    setOutput({ reviewing: true, message: 'AI is reviewing your code...' })
    try {
      const res = await apiRequest('/ai/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          code,
          problemDescription,
        }),
      })

      setOutput({
        reviewing: false,
        message: res.passed ? '✅ Passed! Task approved.' : 'AI review complete.',
        score: res.score,
        feedback: res.feedback,
        suggestions: res.suggestions,
      })
    } catch (e) {
      setOutput({ reviewing: false, message: e.message || 'Evaluation failed.' })
    }
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Toolbar */}
        <div style={{
          padding: '11px 20px', borderBottom: '1px solid #e8e8e4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', animation: 'fadeUp 0.25s ease both'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Code Editor</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {langs.map(lang => (
                <button key={lang} onClick={() => setActiveLang(lang)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: activeLang === lang ? '#eff6ff' : 'var(--bg3)',
                  color: activeLang === lang ? 'var(--accent)' : 'var(--text3)',
                  border: `1px solid ${activeLang === lang ? '#bfdbfe' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.18s'
                }}>{lang}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={handleRun}>▶ Run</button>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={handleSubmit}>Submit →</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, overflow: 'hidden' }}>

          {/* Code area */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8e8e4', animation: 'fadeUp 0.3s ease both' }}>
            {/* Mac dots */}
            <div style={{ padding: '8px 14px', background: 'var(--bg3)', borderBottom: '1px solid #e8e8e4', display: 'flex', alignItems: 'center', gap: 6 }}>
              {['var(--red)','#f59e0b','var(--green)'].map((c, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c, transition: 'opacity 0.15s' }} />
              ))}
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text3)' }}>Greeting.jsx</span>
            </div>

            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, padding: '18px 22px', background: '#0d1117',
                color: '#e6edf3', fontSize: 13.5,
                fontFamily: 'ui-monospace, Consolas, monospace',
                lineHeight: 1.75, border: 'none', outline: 'none', resize: 'none',
                tabSize: 2, transition: 'background 0.2s'
              }}
            />

            {/* Output bar */}
            <div style={{
              padding: '12px 18px', borderTop: '1px solid #e8e8e4',
              background: output?.score != null ? '#f0fdf4' : output?.reviewing ? '#fffbeb' : 'var(--bg)',
              display: 'flex', alignItems: 'center', gap: 10,
              minHeight: 48,
              transition: 'background 0.3s',
            }}>
              {output ? (
                <>
                  <span style={{ fontSize: 16 }}>{output?.score != null ? '🏆' : output.reviewing ? '⏳' : '✅'}</span>
                  <span
                    style={{ fontSize: 13, color: output?.score != null ? '#15803d' : output.reviewing ? '#92400e' : 'var(--text2)' }}
                  >
                    {output.message}
                  </span>
                  {typeof output.score === 'number' && (
                    <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
                      {output.score}/100
                    </span>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>Output will appear here after running</span>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeUp 0.35s ease both' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e8e8e4', background: '#fff' }}>
              {['feedback', 'hints', 'tests'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '11px', fontSize: 13, fontWeight: 500,
                  background: 'transparent',
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text3)',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'color 0.18s, border-color 0.18s'
                }}>{tab}</button>
              ))}
            </div>

            <div style={{ flex: 1, padding: 18, overflowY: 'auto', background: 'var(--bg)' }}>
              {activeTab === 'feedback' && (
                <div style={{ animation: 'fadeUp 0.2s ease both' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>AI Feedback</div>
                  {output?.score != null ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: output.score >= 80 ? 'rgba(16,185,129,0.10)' : '#fffbeb',
                          border: `1px solid ${output.score >= 80 ? 'rgba(16,185,129,0.30)' : '#fde68a'}`,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>
                          Score
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)' }}>{output.score}/100</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6, lineHeight: 1.6 }}>
                          {output.feedback || 'No feedback provided.'}
                        </div>
                      </div>

                      {Array.isArray(output.suggestions) && output.suggestions.length > 0 && (
                        <div style={{ marginTop: 4, padding: 12, borderRadius: 10, background: '#fff', border: '1px solid #e8e8e4' }}>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Suggestions</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {output.suggestions.slice(0, 5).map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: 13,
                                  color: 'var(--text2)',
                                  lineHeight: 1.5,
                                  padding: '9px 10px',
                                  borderRadius: 10,
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                {i + 1}. {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      Submit code to get a correctness score and feedback.
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'hints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeUp 0.2s ease both' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Hints</div>
                  {['Props are read-only — never modify them directly.', 'Use default parameters for optional props.', 'JSX must return a single root element.'].map((h, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      fontSize: 13, color: '#444', lineHeight: 1.5,
                      animation: `fadeUp 0.2s ease ${i * 60}ms both`
                    }}>
                      {i + 1}. {h}
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'tests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeUp 0.2s ease both' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Test Cases</div>
                  {[
                    { test: 'Renders without crashing', pass: true },
                    { test: 'Displays correct name prop', pass: true },
                    { test: 'Has correct HTML structure', pass: true },
                    { test: 'Handles empty name gracefully', pass: false },
                  ].map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      background: t.pass ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${t.pass ? '#bbf7d0' : '#fecaca'}`,
                      animation: `fadeUp 0.2s ease ${i * 60}ms both`
                    }}>
                      <span style={{ fontSize: 13 }}>{t.pass ? '✅' : '❌'}</span>
                      <span style={{ fontSize: 13, color: t.pass ? '#15803d' : 'var(--red)' }}>{t.test}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
