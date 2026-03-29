import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const tasks = [
  { id: 1, title: 'Create a functional component', difficulty: 'Easy', done: true },
  { id: 2, title: 'Use useState to manage a counter', difficulty: 'Easy', done: true },
  { id: 3, title: 'Pass props between components', difficulty: 'Medium', done: false },
  { id: 4, title: 'Implement useEffect for data fetching', difficulty: 'Medium', done: false },
]

export default function VideoTask() {
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [tasksDone, setTasksDone] = useState(tasks)
  const [videoHover, setVideoHover] = useState(false)

  const handleSubmit = () => {
    if (answer.trim()) setSubmitted(true)
  }

  const toggleTask = (i) => {
    setTasksDone(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t))
  }

  const completed = tasksDone.filter(t => t.done).length

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
            <span className="badge badge-cyan" style={{ marginBottom: 6 }}>React Basics · Level 4</span>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>React Hooks Deep Dive</h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" style={{ padding: '7px 16px', fontSize: 13 }}>← Previous</button>
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => navigate('/roadmap')}>
              Unlock Next →
            </button>
          </div>
        </div>

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
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: '#fff',
                border: '1px solid #e8e8e4', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18,
                transform: videoHover ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: videoHover ? '0 4px 16px rgba(0,0,0,0.12)' : 'none'
              }}>▶</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>React Hooks - Complete Guide</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>YouTube · 24:35</div>
            </div>

            {/* Answer box */}
            <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Your Answer / Code</div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                Task: <strong style={{ color: 'var(--accent)' }}>Pass props between two components and display the data.</strong>
              </p>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Write your answer or paste your code here..."
                className="input-field"
                style={{
                  flex: 1, minHeight: 120, padding: 12, borderRadius: 8,
                  background: 'var(--bg)', border: '1px solid #e8e8e4',
                  color: 'var(--text)', fontSize: 13, resize: 'none',
                  fontFamily: 'ui-monospace, Consolas, monospace', lineHeight: 1.6
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn-green" onClick={handleSubmit}>Submit Task</button>
                <button className="btn-secondary" style={{ padding: '9px 16px', fontSize: 13 }} onClick={() => navigate('/code-editor')}>
                  Open Editor
                </button>
                <button className="btn-primary" style={{ padding: '9px 16px', fontSize: 13, marginLeft: 'auto' }}>
                  Mark Complete
                </button>
              </div>

              {/* Feedback */}
              <div style={{
                marginTop: 14, padding: 14, borderRadius: 8,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                overflow: 'hidden', maxHeight: submitted ? 120 : 0,
                opacity: submitted ? 1 : 0,
                transition: 'max-height 0.35s ease, opacity 0.3s ease, margin 0.3s ease',
                marginTop: submitted ? 14 : 0,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 5 }}>AI Feedback</div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  Good attempt! Your understanding of props is solid. Consider destructuring props for cleaner code —{' '}
                  <code style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{'const { name } = props'}</code>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Tasks panel */}
          <div style={{ padding: 20, overflowY: 'auto', background: 'var(--bg)', animation: 'fadeUp 0.35s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>AI-Generated Tasks</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {tasksDone.map((task, i) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(i)}
                  style={{
                    padding: '11px 13px', borderRadius: 8, cursor: 'pointer',
                    background: task.done ? '#f0fdf4' : '#fff',
                    border: `1px solid ${task.done ? '#bbf7d0' : 'var(--border)'}`,
                    transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1.01)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: task.done ? 'var(--green)' : '#fff',
                      border: `1.5px solid ${task.done ? 'var(--green)' : 'var(--border2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff',
                      transition: 'background 0.2s, border-color 0.2s'
                    }}>{task.done ? '✓' : ''}</div>
                    <span style={{
                      fontSize: 13, fontWeight: 500,
                      textDecoration: task.done ? 'line-through' : 'none',
                      color: task.done ? 'var(--text3)' : 'var(--text)',
                      transition: 'color 0.2s'
                    }}>{task.title}</span>
                    <span className={`badge ${task.difficulty === 'Easy' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 10, marginLeft: 'auto' }}>
                      {task.difficulty}
                    </span>
                  </div>
                </div>
              ))}
            </div>

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
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{completed}/{tasksDone.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(completed / tasksDone.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
