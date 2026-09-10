import { Link } from 'react-router-dom'

const STEPS = [
  { icon: '⌨️', title: 'Type', text: 'Race through a paragraph as fast and accurately as you can.' },
  { icon: '⏱️', title: 'Time', text: 'Live WPM, accuracy, and errors track as you go — no waiting for a score.' },
  { icon: '🏆', title: 'Win', text: 'Beat your best solo, or race friends and top the leaderboard.' },
]

export default function Home() {
  return (
    <div className="page">
      <div className="page-inner hero-enter" style={{ marginTop: 80, textAlign: 'left' }}>
        <div className="stripe-divider" style={{ width: 90, marginBottom: 22 }} />

        <h1 style={{ fontSize: 56, lineHeight: 1.02, margin: '0 0 18px', fontWeight: 800 }}>
          🏁 Typing Race
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-mid)', maxWidth: 500, margin: '0 0 36px' }}>
          Test your typing speed. Challenge yourself or race your friends —
          no account, no sign-up. Just pick a name and go.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 56 }}>
          <Link to="/single" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: 16, padding: '15px 26px' }}>
            🚀 Single Player
          </Link>
          <Link to="/multiplayer" className="btn" style={{ textDecoration: 'none', fontSize: 16, padding: '15px 26px' }}>
            👥 Multiplayer
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}
        >
          {STEPS.map((step) => (
            <div key={step.title} className="card" style={{ padding: '20px 20px' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{step.icon}</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>{step.title}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-mid)', lineHeight: 1.5 }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
