const codeLines = `const DevMate = () => {
  const [skill, setSkill] = useState(0)
  useEffect(() => {
    fetch('/api/roadmap')
      .then(r => r.json())
      .then(data => setSkill(data))
  }, [])
  return <Dashboard skill={skill} />
}

function learnReact(level) {
  if (level === 'beginner') {
    return ['JSX', 'Props', 'State']
  } else if (level === 'advanced') {
    return ['Hooks', 'Context', 'Redux']
  }
}

const roadmap = {
  react: ['Components', 'Hooks',
          'Router', 'State Mgmt'],
  node:  ['Express', 'REST API',
          'Auth', 'Database'],
  css:   ['Flexbox', 'Grid',
          'Animations', 'Variables'],
}

async function submitTask(code) {
  const res = await fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  const { score, feedback } = await res.json()
  return { score, feedback }
}

class Developer {
  constructor(name) {
    this.name = name
    this.skills = []
    this.xp = 0
  }
  learn(skill) {
    this.skills.push(skill)
    this.xp += 100
    return this
  }
}

const getJobReady = (dev) =>
  dev.skills.length >= 10 &&
  dev.xp >= 1000

import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard"
               element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

// Keep building. Keep learning.
// You are ${Math.round(Math.random()*40+60)}% job ready.
`

// Repeat to fill screen
const repeated = Array(6).fill(codeLines).join('\n')

export default function CodeBackground() {
  return (
    <div className="code-bg" aria-hidden="true">
      <div className="code-bg-inner">{repeated}</div>
    </div>
  )
}
