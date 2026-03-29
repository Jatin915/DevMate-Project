import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import Sidebar from '../components/Sidebar'
import PageWrapper from '../components/PageWrapper'

const completedCourses = [
  { id: 1, title: 'React Development', duration: '40 hours', date: 'March 15, 2026', score: 92 },
  { id: 2, title: 'JavaScript Fundamentals', duration: '30 hours', date: 'February 10, 2026', score: 88 },
  { id: 3, title: 'HTML & CSS Mastery', duration: '20 hours', date: 'January 5, 2026', score: 95 },
]

function CertificateCard({ course, name }) {
  return (
    <div style={{
      width: 900, minHeight: 620, background: '#fff', position: 'relative',
      fontFamily: 'Georgia, serif', overflow: 'hidden', flexShrink: 0,
      border: '1px solid #e5e7eb'
    }}>
      {/* Outer border */}
      <div style={{
        position: 'absolute', inset: 16,
        border: '3px solid #7c3aed', borderRadius: 4, pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', inset: 20,
        border: '1px solid #c4b5fd', borderRadius: 2, pointerEvents: 'none', zIndex: 1
      }} />

      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 8,
        background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #7c3aed)'
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
        background: 'linear-gradient(90deg, #7c3aed, #06b6d4, #7c3aed)'
      }} />

      {/* Content */}
      <div style={{ padding: '50px 70px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'system-ui, sans-serif', color: '#7c3aed', letterSpacing: -1 }}>
            Dev<span style={{ color: '#06b6d4' }}>Mate</span>
          </span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
          AI Learning Platform
        </div>

        {/* Title */}
        <div style={{ fontSize: 13, letterSpacing: 5, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
          Certificate of Completion
        </div>
        <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)', margin: '0 auto 28px' }} />

        {/* Body */}
        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 16, fontFamily: 'system-ui, sans-serif' }}>
          This is to certify that
        </p>
        <div style={{ fontSize: 44, fontWeight: 700, color: '#1f2937', marginBottom: 8, letterSpacing: -1 }}>
          {name || 'Your Name'}
        </div>
        <div style={{ width: 200, height: 2, background: '#e5e7eb', margin: '0 auto 20px' }} />

        <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 8, fontFamily: 'system-ui, sans-serif' }}>
          has successfully completed the course
        </p>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#7c3aed', marginBottom: 6, fontFamily: 'system-ui, sans-serif' }}>
          {course.title}
        </div>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 32, fontFamily: 'system-ui, sans-serif' }}>
          with a score of <strong style={{ color: 'var(--green)' }}>{course.score}%</strong> · {course.duration} · Completed on {course.date}
        </p>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, padding: '0 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontFamily: 'cursive', color: '#374151', marginBottom: 4 }}>Aryan Sharma</div>
            <div style={{ width: 140, height: 1, background: '#d1d5db', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>FOUNDER & CEO</div>
            <div style={{ fontSize: 11, color: '#7c3aed', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>DevMate</div>
          </div>

          {/* Seal */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', margin: '0 auto',
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)'
            }}>
              <div style={{ fontSize: 22, color: '#fff' }}>✦</div>
              <div style={{ fontSize: 9, color: '#fff', fontFamily: 'system-ui, sans-serif', fontWeight: 700, letterSpacing: 1 }}>VERIFIED</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontFamily: 'cursive', color: '#374151', marginBottom: 4 }}>Priya Mehta</div>
            <div style={{ width: 140, height: 1, background: '#d1d5db', margin: '0 auto 6px' }} />
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>HEAD OF EDUCATION</div>
            <div style={{ fontSize: 11, color: '#7c3aed', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>DevMate</div>
          </div>
        </div>

        {/* Certificate ID */}
        <div style={{ marginTop: 28, fontSize: 11, color: '#d1d5db', fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>
          Certificate ID: DM-{course.id.toString().padStart(4, '0')}-{Date.now().toString().slice(-6)} · devmate.io/verify
        </div>
      </div>
    </div>
  )
}

export default function Certificate() {
  const [selected, setSelected] = useState(completedCourses[0])
  const [name, setName] = useState('Dev User')
  const certRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: 'var(--card)' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`DevMate_Certificate_${selected.title.replace(/\s+/g, '_')}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadPNG = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: 'var(--card)' })
      const link = document.createElement('a')
      link.download = `DevMate_Certificate_${selected.title.replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content"><PageWrapper>
        <h1 className="page-title">Certificates 🎓</h1>
        <p className="page-subtitle">Download your completion certificates issued by DevMate.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          {/* Course list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>Completed Courses</div>
            {completedCourses.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  background: selected?.id === c.id ? '#eff6ff' : '#fff',
                  border: `1px solid ${selected?.id === c.id ? '#bfdbfe' : 'var(--border)'}`,
                  transition: 'all 0.2s'
                }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{c.date}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Completed</span>
                  <span className="badge badge-purple" style={{ fontSize: 10 }}>Score: {c.score}%</span>
                </div>
              </div>
            ))}

            {/* Name input */}
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
                Name on Certificate
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: '#fff', border: '1px solid #d4d4ce',
                  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Download buttons */}
            <button className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4 }}
              onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Generating...' : '⬇ Download PDF'}
            </button>
            <button className="btn-secondary" style={{ width: '100%', padding: '11px', fontSize: 14 }}
              onClick={handleDownloadPNG} disabled={downloading}>
              🖼 Download PNG
            </button>
          </div>

          {/* Certificate preview */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 }}>Preview</div>
            <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
              <div ref={certRef}>
                <CertificateCard course={selected} name={name} />
              </div>
            </div>
          </div>
        </div>
        </PageWrapper></main>
    </div>
  )
}
