import { DIFFICULTIES } from '../utils/wordLists.js'

export default function DifficultySelect({ onSelect }) {
  return (
    <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="track-rule" />
      <h2 style={{ margin: '0 0 6px', fontSize: 22 }}>Choose your difficulty</h2>
      <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '0 0 22px' }}>
        Harder words, longer clock.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.values(DIFFICULTIES).map((d) => (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className="btn btn-block"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{d.icon}</span>
              <span>
                <strong style={{ display: 'block', fontSize: 15 }}>{d.label}</strong>
                <span style={{ fontSize: 12.5, color: 'var(--text-mid)' }}>{d.description}</span>
              </span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--amber)' }}>
              {d.seconds / 60}:00
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
