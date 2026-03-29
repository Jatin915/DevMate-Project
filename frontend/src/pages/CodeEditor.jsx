import { useState } from 'react'
import Sidebar from '../components/Sidebar'

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

const feedbackItems = [
  { type: 'success', icon: '✅', msg: 'Component structure is correct' },
  { type: 'success', icon: '✅', msg: 'Props destructuring used properly' },
  { type: 'warning', icon: '⚠️', msg: 'Consider adding PropTypes for type safety' },
  { type: 'tip', icon: '💡', msg: 'Add a default value: name = "Developer"' },
]

const langs = ['JavaScript', 'Python', 'TypeScript']

export default function CodeEditor() {
  const [code, setCode] = useState(starterCode)
  const [output, setOutput] = useState(null)
  const [activeTab, setActiveTab] = useState('feedback')
  const [activeLang, setActiveLang] = useState('JavaScript')

  const handleRun = () => {
    setOutput(null)
    setTimeout(() => setOutput({ success: true, message: 'Component rendered successfully! Output: Hello, World!' }), 300)
  }

  const handleSubmit = () => {
    setOutput({ reviewing: true, message: 'AI is reviewing your code...' })
    setTimeout(() => setOutput({ success: true, message: 'Code reviewed.', score: 88 }), 1600)
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
              background: output?.score ? '#f0fdf4' : output?.reviewing ? '#fffbeb' : 'var(--bg)',
              display: 'flex', alignItems: 'center', gap: 10,
              minHeight: 48,
              transition: 'background 0.3s',
            }}>
              {output ? (
                <>
                  <span style={{ fontSize: 16 }}>{output.score ? '🏆' : output.reviewing ? '⏳' : '✅'}</span>
                  <span style={{ fontSize: 13, color: output.score ? '#15803d' : output.reviewing ? '#92400e' : 'var(--text2)' }}>
                    {output.message}
                  </span>
                  {output.score && (
                    <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{output.score}/100</span>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {feedbackItems.map((f, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', borderRadius: 8, fontSize: 13,
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                        background: f.type === 'success' ? '#f0fdf4' : f.type === 'warning' ? '#fffbeb' : '#eff6ff',
                        border: `1px solid ${f.type === 'success' ? '#bbf7d0' : f.type === 'warning' ? '#fde68a' : '#bfdbfe'}`,
                        animation: `fadeUp 0.2s ease ${i * 60}ms both`
                      }}>
                        <span>{f.icon}</span>
                        <span style={{ color: '#444', lineHeight: 1.5 }}>{f.msg}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e8e8e4' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 5 }}>Optimization tip</div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                      Wrap with <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>React.memo()</code> to prevent unnecessary re-renders.
                    </p>
                  </div>
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
