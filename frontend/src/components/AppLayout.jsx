import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

const SNIPPETS = [
  'useState()', 'useEffect()', 'async/await', 'const =>',
  'import React', '.map()', 'fetch()', 'return JSX',
  'npm install', 'git commit', 'API call', 'JSON.parse',
  'props', 'export default', 'className', 'onClick',
  '{ }', '[ ]', '( )', '===', '&&', '||',
  'Promise', 'resolve', 'reject', 'try/catch',
  '<Component />', 'render()', 'setState', 'dispatch',
]

function Canvas({ theme }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const particles = []
    const COUNT = 45

    function W() { return canvas.offsetWidth }
    function H() { return canvas.offsetHeight }

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    function mkParticle(atBottom = false) {
      const w = W(), h = H()
      return {
        x:     Math.random() * w,
        y:     atBottom ? h + 20 : Math.random() * h,
        vx:    (Math.random() - 0.5) * 0.25,
        vy:    -(Math.random() * 0.35 + 0.1),
        alpha: Math.random() * 0.35 + 0.08,
        size:  Math.random() * 2.5 + 1.2,
        text:  SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)],
        isText: Math.random() > 0.45,
        hue:   [
          '#6366f1', '#06b6d4', '#10b981', '#a78bfa', '#38bdf8'
        ][Math.floor(Math.random() * 5)],
        life:  1,
        decay: Math.random() * 0.0015 + 0.0004,
      }
    }

    for (let i = 0; i < COUNT; i++) particles.push(mkParticle(false))

    function drawGrid() {
      const isDark = theme === 'dark'
      ctx.strokeStyle = isDark
        ? 'rgba(99,102,241,0.045)'
        : 'rgba(79,70,229,0.035)'
      ctx.lineWidth = 1
      const step = 52
      const w = W(), h = H()
      for (let x = 0; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
    }

    function drawOrbs() {
      const w = W(), h = H()
      const isDark = theme === 'dark'
      const orbs = [
        { cx: w * 0.12, cy: h * 0.18, r: 200, color: '#6366f1', a: isDark ? 0.09 : 0.05 },
        { cx: w * 0.78, cy: h * 0.55, r: 240, color: '#06b6d4', a: isDark ? 0.06 : 0.04 },
        { cx: w * 0.45, cy: h * 0.88, r: 160, color: '#10b981', a: isDark ? 0.05 : 0.03 },
      ]
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.cx, o.cy, 0, o.cx, o.cy, o.r)
        const hex = Math.round(o.a * 255).toString(16).padStart(2, '0')
        g.addColorStop(0, o.color + hex)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(o.cx, o.cy, o.r, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    function frame() {
      const w = W(), h = H()
      ctx.clearRect(0, 0, w, h)
      drawGrid()
      drawOrbs()

      particles.forEach((p, i) => {
        p.x   += p.vx
        p.y   += p.vy
        p.life -= p.decay

        if (p.life <= 0 || p.y < -40 || p.x < -80 || p.x > w + 80) {
          particles[i] = mkParticle(true)
          return
        }

        ctx.globalAlpha = p.alpha * p.life

        if (p.isText) {
          ctx.font = `${Math.round(p.size * 3.5 + 9)}px JetBrains Mono, monospace`
          ctx.fillStyle = p.hue
          ctx.fillText(p.text, p.x, p.y)
        } else {
          ctx.fillStyle = p.hue
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = 1
      })

      animId = requestAnimationFrame(frame)
    }

    resize()
    frame()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [theme])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        display: 'block',
      }}
    />
  )
}

export default function AppLayout({ children }) {
  const { theme } = useTheme()

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Canvas theme={theme} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
