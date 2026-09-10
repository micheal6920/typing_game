import Confetti from './Confetti.jsx'
import { getAvatar } from '../utils/avatars.js'

export default function ResultCard({ result, onTryAgain, onHome }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 32px', position: 'relative' }}>
      <Confetti />
      <div style={{ fontSize: 44, marginBottom: 4 }}>{getAvatar(result.name)}</div>
      <p style={{ color: 'var(--text-mid)', fontSize: 13, margin: '0 0 4px', letterSpacing: '0.02em' }}>
        🎉 Test complete
      </p>
      <h2 style={{ fontSize: 26, margin: '0 0 28px' }}>{result.name}</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
          maxWidth: 360,
          margin: '0 auto 32px',
        }}
      >
        <Stat value={result.wpm} label="WPM" big />
        <Stat value={`${result.accuracy}%`} label="Accuracy" big />
        <Stat value={result.errors} label="Errors" color={result.errors > 0 ? 'var(--red)' : undefined} />
        <Stat value={`${result.timeSeconds}s`} label="Time" />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn" onClick={onHome}>
          Home
        </button>
        <button className="btn btn-primary" onClick={onTryAgain}>
          Try Again
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label, big, color }) {
  return (
    <div className="stat" style={{ alignItems: 'center' }}>
      <span
        className="stat-value"
        style={{ fontSize: big ? 40 : 26, color: color || 'var(--amber)' }}
      >
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
