/**
 * EditorTaskPanel.jsx
 *
 * The right-side panel in the VS Code–style editor.
 * Shows three tabs: Task description, AI Feedback, and Hints.
 */

function diffBadge(d) {
  if (!d) return 'badge-cyan'
  if (d === 'easy') return 'badge-green'
  if (d === 'hard') return 'badge-orange'
  return 'badge-cyan'
}

function scoreMeta(score) {
  if (score >= 90) return { label: 'Excellent',         bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)', color: '#15803d' }
  if (score >= 70) return { label: 'Good',              bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.30)', color: 'var(--accent)' }
  if (score >= 50) return { label: 'Needs improvement', bg: '#fffbeb',               border: '#fde68a',               color: '#92400e' }
  return                  { label: 'Incorrect logic',   bg: '#fef2f2',               border: '#fecaca',               color: '#b91c1c' }
}

const VS = {
  sidebar:  '#252526',
  tab:      '#2d2d2d',
  border:   '#3e3e42',
  text:     '#cccccc',
  textDim:  '#858585',
  textActive: '#ffffff',
  accent:   '#6366f1',
  green:    '#4ec9b0',
  red:      '#f44747',
}

export default function EditorTaskPanel({
  ctx,
  activeTab,
  setActiveTab,
  evaluating,
  aiResult,
  submitting,
  handleEvaluate,
  handleSubmitTask,
  setCode,
  setFiles,
  activeFile,
}) {
  return (
    <div style={{
      width: 300, background: VS.sidebar, borderLeft: `1px solid ${VS.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${VS.border}`, background: VS.tab, flexShrink: 0 }}>
        {['task', 'feedback', 'hints'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 500,
              background: 'transparent',
              color: activeTab === tab ? VS.textActive : VS.textDim,
              borderBottom: `2px solid ${activeTab === tab ? VS.accent : 'transparent'}`,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              transition: 'color 0.15s', position: 'relative',
            }}
          >
            {tab === 'feedback' && aiResult && !aiResult.error && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 6, height: 6, borderRadius: '50%',
                background: aiResult.passed ? '#22c55e' : '#f59e0b',
              }} />
            )}
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>

        {/* ── Task tab ── */}
        {activeTab === 'task' && (
          <div>
            {ctx?.taskTitle ? (
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: VS.textActive, lineHeight: 1.4 }}>
                {ctx.taskTitle}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: VS.textDim, fontStyle: 'italic', marginBottom: 8 }}>
                No task selected.
              </div>
            )}
            {ctx?.difficulty && (
              <span className={`badge ${diffBadge(ctx.difficulty)}`} style={{ fontSize: 10, marginBottom: 10, display: 'inline-block' }}>
                {ctx.difficulty}
              </span>
            )}
            {ctx?.taskDescription ? (
              <p style={{ fontSize: 12, color: VS.text, lineHeight: 1.7, marginTop: 6 }}>
                {ctx.taskDescription}
              </p>
            ) : (
              <p style={{ fontSize: 12, color: VS.textDim, fontStyle: 'italic' }}>
                {ctx?.videoId ? 'No description available.' : 'Open a task from the Video Tasks page.'}
              </p>
            )}
            {ctx?.problemDescription && ctx.problemDescription !== ctx.taskDescription && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: '#2d2d2d', border: `1px solid ${VS.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: VS.textDim, marginBottom: 5, letterSpacing: 0.5 }}>EXPECTED OUTPUT</div>
                <pre style={{ fontSize: 11, color: VS.text, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace', lineHeight: 1.6 }}>
                  {ctx.problemDescription.split('Expected output:')[1]?.trim() || ''}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── Feedback tab ── */}
        {activeTab === 'feedback' && (
          <div>
            {evaluating && (
              <div style={{ padding: 14, borderRadius: 8, background: '#2d2d2d', border: `1px solid ${VS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Evaluating code…</div>
                <div style={{ fontSize: 11, color: VS.textDim, marginTop: 4 }}>AI is reviewing your solution</div>
              </div>
            )}
            {!evaluating && aiResult?.error && (
              <div style={{ padding: 12, borderRadius: 8, background: '#3b1212', border: `1px solid ${VS.red}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: VS.red, marginBottom: 4 }}>❌ Evaluation failed</div>
                <div style={{ fontSize: 12, color: '#fca5a5' }}>{aiResult.error}</div>
              </div>
            )}
            {!evaluating && !aiResult && (
              <div style={{ padding: 14, borderRadius: 8, background: '#2d2d2d', border: `1px solid ${VS.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>✨</div>
                <div style={{ fontSize: 12, color: VS.textDim }}>
                  Click <strong style={{ color: VS.text }}>Evaluate with AI</strong> to get instant feedback.
                </div>
              </div>
            )}
            {!evaluating && aiResult && !aiResult.error && (() => {
              const meta = scoreMeta(aiResult.score)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Score */}
                  <div style={{ padding: 12, borderRadius: 8, background: '#2d2d2d', border: `1px solid ${VS.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: 0.5, marginBottom: 2 }}>{meta.label.toUpperCase()}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: meta.color, lineHeight: 1 }}>
                          {aiResult.score}<span style={{ fontSize: 12, fontWeight: 400 }}>/100</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 24 }}>{aiResult.passed ? '✅' : aiResult.score >= 50 ? '⚠️' : '❌'}</div>
                    </div>
                    <div style={{ fontSize: 12, color: VS.text, lineHeight: 1.6 }}>{aiResult.feedback}</div>
                  </div>

                  {/* Errors */}
                  {aiResult.errors.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 8, background: '#3b1212', border: `1px solid ${VS.red}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: VS.red, marginBottom: 6 }}>❌ Errors</div>
                      {aiResult.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#fca5a5', display: 'flex', gap: 5, marginBottom: 3 }}>
                          <span>•</span><span style={{ lineHeight: 1.5 }}>{e}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {aiResult.suggestions.length > 0 && (
                    <div style={{ padding: 10, borderRadius: 8, background: '#1e2a3a', border: '1px solid #1d4ed8' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>💡 Suggestions</div>
                      {aiResult.suggestions.map((s, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#93c5fd', display: 'flex', gap: 5, marginBottom: 3 }}>
                          <span style={{ color: '#60a5fa' }}>{i + 1}.</span><span style={{ lineHeight: 1.5 }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Optimized code */}
                  {aiResult.score >= 70 && aiResult.optimizedCode && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${VS.accent}` }}>
                      <div style={{ padding: '8px 12px', background: '#2d2d2d', borderBottom: `1px solid ${VS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: VS.accent }}>⚡ Optimized</span>
                        <button
                          onClick={() => {
                            setCode(aiResult.optimizedCode)
                            setFiles((prev) => ({ ...prev, [activeFile]: aiResult.optimizedCode }))
                          }}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: VS.accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Use this
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '10px 12px', background: '#0d1117', color: '#e6edf3', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6, overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto' }}>
                        {aiResult.optimizedCode}
                      </pre>
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    style={{ width: '100%', padding: '7px', fontSize: 11 }}
                    onClick={() => handleEvaluate(setActiveTab)}
                    disabled={evaluating}
                  >
                    🔄 Re-evaluate
                  </button>

                  {aiResult.passed && ctx?.taskId && (
                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '9px', fontSize: 12, fontWeight: 700, background: '#16a34a', opacity: submitting ? 0.75 : 1 }}
                      onClick={handleSubmitTask}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting…' : '✅ Submit Task & Unlock Next'}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Hints tab ── */}
        {activeTab === 'hints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: VS.text, marginBottom: 4 }}>Hints</div>
            {ctx?.hints && ctx.hints.length > 0 ? (
              ctx.hints.map((h, i) => (
                <div key={i} style={{ padding: '9px 11px', borderRadius: 6, background: '#1e2a3a', border: '1px solid #1d4ed8', fontSize: 12, color: '#93c5fd', lineHeight: 1.5 }}>
                  {i + 1}. {h}
                </div>
              ))
            ) : (
              <div style={{ padding: 10, borderRadius: 6, background: '#2d2d2d', border: `1px solid ${VS.border}`, fontSize: 12, color: VS.textDim }}>
                No hints available for this task.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
