import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle({ style = {} }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px 2px', borderRadius: 8,
        ...style
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{isDark ? '☀️' : '🌙'}</span>
      <div className={`toggle-track ${isDark ? 'on' : ''}`}>
        <div className="toggle-thumb" />
      </div>
    </button>
  )
}
