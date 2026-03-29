import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const techs = ['React', 'JavaScript', 'Node.js', 'Python', 'TypeScript']

const nodes = [
  { id: 1, level: 'Beginner', title: 'HTML & CSS Basics', desc: 'Structure and style web pages', status: 'done', time: '3h' },
  { id: 2, level: 'Beginner', title: 'JavaScript Fundamentals', desc: 'Variables, functions, loops', status: 'done', time: '5h' },
  { id: 3, level: 'Beginner', title: 'DOM Manipulation', desc: 'Interact with the browser', status: 'done', time: '4h' },
  { id: 4, level: 'Intermediate', title: 'React Basics', desc: 'Components, props, JSX', status: 'active', time: '6h' },
  { id: 5, level: 'Intermediate', title: 'React Hooks', desc: 'useState, useEffect, custom hooks', status: 'locked', time: '5h' },
  { id: 6, level: 'Intermediate', title: 'State Management', desc: 'Context API, Redux basics', status: 'locked', time: '6h' },
  { id: 7, level: 'Advanced', title: 'Performance Optimization', desc: 'Memoization, lazy loading', status: 'locked', time: '4h' },
  { id: 8, level: 'Advanced', title: 'Testing', desc: 'Jest, React Testing Library', status: 'locked', time: '5h' },
  { id: 9, level: 'Advanced', title: 'TypeScript with React', desc: 'Type-safe React apps', status: 'locked', time: '6h' },
  { id: 10, level: 'Final Project', title: 'Full Stack App', desc: 'Build and deploy a complete app', status: 'locked', time: '10h' },
]

const levelBadge = { Beginner: 'badge-green', Intermediate: 'badge-cyan', Advanced: 'badge-purple', 'Final Project': 'badge-orange' }

export default function Roadmap() {
  const navigate = useNavigate()
  const [activeTech, setActiveTech] = useState('React')
  const levels = [...new Set(nodes.map(n => n.level))]

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <PageWrapper>
        <h1 className="page-title">Roadmap</h1>
        <p className="page-subtitle">Follow the path step by step. Click any unlocked node to start.</p>

        {/* Tech tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {techs.map(t => (
            <button key={t} onClick={() => setActiveTech(t)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              background: activeTech === t ? 'var(--accent)' : '#fff',
              color: activeTech === t ? '#fff' : 'var(--text2)',
              border: `1px solid ${activeTech === t ? 'var(--accent)' : 'var(--border2)'}`,
              cursor: 'pointer', transition: 'all 0.15s'
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {levels.map(level => {
            const levelNodes = nodes.filter(n => n.level === level)
            return (
              <div key={level}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span className={`badge ${levelBadge[level]}`}>{level}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {levelNodes.filter(n => n.status === 'done').length}/{levelNodes.length} done
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 16 }}>
                  {levelNodes.map((node, idx) => (
                    <div key={node.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 600,
                          background: node.status === 'done' ? 'var(--accent)' : node.status === 'active' ? '#eff6ff' : 'var(--bg3)',
                          border: `1.5px solid ${node.status === 'done' ? 'var(--accent)' : node.status === 'active' ? 'var(--accent)' : 'var(--border)'}`,
                          color: node.status === 'done' ? '#fff' : node.status === 'active' ? 'var(--accent)' : '#ccc',
                          cursor: node.status !== 'locked' ? 'pointer' : 'default',
                        }}>
                          {node.status === 'done' ? '✓' : node.status === 'locked' ? '·' : '▷'}
                        </div>
                        {idx < levelNodes.length - 1 && (
                          <div style={{ width: 1, height: 22, background: node.status === 'done' ? '#bfdbfe' : 'var(--border)', marginTop: 2 }} />
                        )}
                      </div>
                      <div onClick={() => node.status !== 'locked' && navigate('/video-task')}
                        style={{
                          flex: 1, padding: '11px 16px', borderRadius: 8, marginBottom: 8,
                          background: node.status === 'active' ? '#eff6ff' : '#fff',
                          border: `1px solid ${node.status === 'active' ? '#bfdbfe' : node.status === 'done' ? '#dbeafe' : 'var(--border)'}`,
                          cursor: node.status !== 'locked' ? 'pointer' : 'default',
                          opacity: node.status === 'locked' ? 0.45 : 1,
                          transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => { if (node.status !== 'locked') e.currentTarget.style.borderColor = 'var(--accent)' }}
                        onMouseLeave={e => e.currentTarget.style.borderColor = node.status === 'active' ? '#bfdbfe' : node.status === 'done' ? '#dbeafe' : 'var(--border)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{node.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{node.desc}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{node.time}</div>
                            {node.status === 'active' && <span className="badge badge-cyan" style={{ fontSize: 11 }}>In progress</span>}
                            {node.status === 'done' && <span className="badge badge-green" style={{ fontSize: 11 }}>Done</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        </PageWrapper>
      </main>
    </div>
  )
}
