import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CodeBackground from '../components/CodeBackground'
import ThemeToggle from '../components/ThemeToggle'

const plans = [
  {
    name: 'Free', price: { monthly: 0, yearly: 0 }, tag: null,
    desc: 'Perfect for getting started and exploring DevMate.',
    cta: 'Get started free', ctaStyle: 'btn-secondary',
    features: [
      '3 learning paths', 'Basic roadmap access', '10 AI tasks per month',
      'In-browser code editor', 'Community support', '1 certificate',
    ],
    missing: ['Unlimited AI tasks', 'Dev Simulation mode', 'Job Readiness score', 'Priority support', 'All certificates'],
  },
  {
    name: 'Pro', price: { monthly: 12, yearly: 8 }, tag: 'Most Popular',
    desc: 'Everything you need to go from beginner to job-ready.',
    cta: 'Start Pro free', ctaStyle: 'btn-primary',
    features: [
      'All learning paths', 'Full roadmap access', 'Unlimited AI tasks',
      'Dev Simulation mode', 'Job Readiness score', 'Progress analytics',
      'All certificates', 'Priority support', 'Portfolio builder',
    ],
    missing: [],
  },
  {
    name: 'Team', price: { monthly: 29, yearly: 20 }, tag: 'For Bootcamps',
    desc: 'For coding bootcamps, colleges, and dev teams.',
    cta: 'Contact us', ctaStyle: 'btn-secondary',
    features: [
      'Everything in Pro', 'Up to 30 members', 'Admin dashboard',
      'Team progress tracking', 'Custom learning paths', 'Dedicated support',
      'Bulk certificates', 'API access',
    ],
    missing: [],
  },
]

const faqs = [
  { q: 'Is the free plan really free?', a: 'Yes, forever. No credit card needed. You get 3 learning paths and 10 AI tasks per month at no cost.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your Pro subscription anytime from your account settings. No questions asked.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards and UPI (India). More methods coming soon.' },
  { q: 'Do certificates expire?', a: 'No. Once earned, your DevMate certificates are yours forever and can be shared anytime.' },
  { q: 'Is there a student discount?', a: 'Yes! Students get 50% off Pro with a valid .edu email. Reach out to us to claim it.' },
]

export default function Pricing() {
  const navigate = useNavigate()
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <CodeBackground />

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 64px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div onClick={() => navigate('/')} style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, cursor: 'pointer' }}>
          Dev<span style={{ color: 'var(--accent)' }}>Mate</span>
        </div>
        <div style={{ display: 'flex', gap: 28, color: 'var(--text2)', fontSize: 14 }}>
          {[['Features', '/features'], ['Roadmap', '/roadmap-info'], ['Pricing', '/pricing']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)}
              style={{ cursor: 'pointer', transition: 'color 0.18s', color: label === 'Pricing' ? 'var(--accent)' : 'var(--text2)', fontWeight: label === 'Pricing' ? 600 : 400 }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = label === 'Pricing' ? 'var(--accent)' : 'var(--text2)'}>{label}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn-secondary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={() => navigate('/login')}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 64px 48px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 280, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <span className="badge badge-green" style={{ marginBottom: 20, fontSize: 13 }}>Simple pricing</span>
        <h1 style={{
          fontSize: 52, fontWeight: 800, letterSpacing: -1.5, marginBottom: 16,
          background: 'linear-gradient(135deg, var(--text), var(--green))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'fadeUp 0.3s ease both',
        }}>
          Pay for what you need
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7, animation: 'fadeUp 0.3s ease 0.08s both' }}>
          Start free. Upgrade when you're ready. No hidden fees.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderRadius: 99, background: 'var(--card)', border: '1px solid var(--border)', animation: 'fadeUp 0.3s ease 0.12s both' }}>
          <span style={{ fontSize: 14, color: !yearly ? 'var(--text)' : 'var(--text3)', fontWeight: !yearly ? 600 : 400 }}>Monthly</span>
          <div className={`toggle-track ${yearly ? 'on' : ''}`} onClick={() => setYearly(v => !v)}>
            <div className="toggle-thumb" />
          </div>
          <span style={{ fontSize: 14, color: yearly ? 'var(--text)' : 'var(--text3)', fontWeight: yearly ? 600 : 400 }}>
            Yearly
            <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>Save 33%</span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '0 64px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {plans.map((plan, i) => (
            <div key={i} className="card card-3d" style={{
              animation: `fadeUp 0.3s ease ${i * 80}ms both`,
              border: plan.name === 'Pro' ? '2px solid var(--accent)' : '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Popular tag */}
              {plan.tag && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>{plan.tag}</div>
              )}
              {/* Glow for Pro */}
              {plan.name === 'Pro' && (
                <div style={{
                  position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                  width: 200, height: 100, borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>{plan.desc}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: plan.name === 'Pro' ? 'var(--accent)' : 'var(--text)' }}>
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span style={{ fontSize: 14, color: 'var(--text3)' }}>/mo</span>
                  )}
                </div>
                {yearly && plan.price.monthly > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                    Billed ${plan.price.yearly * 12}/year
                  </div>
                )}
              </div>

              <button
                className={plan.ctaStyle}
                style={{ width: '100%', padding: '11px', fontSize: 14, marginBottom: 20 }}
                onClick={() => navigate('/login')}
              >
                {plan.cta}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text2)', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </div>
                ))}
                {plan.missing.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text3)', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '0 64px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32, letterSpacing: -0.5, textAlign: 'center' }}>Frequently asked</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = openFaq === i ? 'var(--accent)' : 'var(--border)'}
                style={{
                  cursor: 'pointer', transition: 'border-color 0.2s',
                  borderColor: openFaq === i ? 'var(--accent)' : 'var(--border)',
                  background: 'var(--card)', border: `1px solid ${openFaq === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: 20,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                  <span style={{
                    fontSize: 18, color: 'var(--accent)', transition: 'transform 0.2s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    display: 'inline-block',
                  }}>+</span>
                </div>
                {openFaq === i && (
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 12, lineHeight: 1.65, animation: 'fadeUp 0.2s ease both' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 64px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg2)', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>Start for free today</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 16 }}>No credit card required. Upgrade anytime.</p>
        <button className="btn-primary" style={{ fontSize: 15, padding: '13px 36px' }} onClick={() => navigate('/login')}>
          Get started free →
        </button>
      </section>

      <footer style={{ padding: '24px 64px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <div>© 2026 DevMate</div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(item => (
            <span key={item} style={{ cursor: 'pointer', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
