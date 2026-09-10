/**
 * A simple semicircle speedometer. Purely presentational and driven by a
 * prop, so it re-renders only as part of whatever parent already re-renders
 * it on (TypingArea, which is already the one component that updates per
 * keystroke) — it doesn't add any new render cost elsewhere.
 */
export default function SpeedGauge({ wpm = 0, max = 150 }) {
  const clamped = Math.min(max, Math.max(0, wpm))
  const angle = -90 + (clamped / max) * 180 // -90deg (left) to +90deg (right)

  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div style={{ width: 130, textAlign: 'center' }}>
      <svg viewBox="0 0 120 70" width="130" height="76">
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke="var(--ink-700)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke="var(--amber)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / max) * 157} 157`}
          style={{ transition: 'stroke-dasharray 0.25s ease' }}
        />
        {ticks.map((t) => {
          const a = (-90 + t * 180) * (Math.PI / 180)
          const x1 = 60 + Math.cos(a) * 42
          const y1 = 65 + Math.sin(a) * 42
          const x2 = 60 + Math.cos(a) * 50
          const y2 = 65 + Math.sin(a) * 50
          return (
            <line
              key={t}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--text-low)"
              strokeWidth="2"
            />
          )
        })}
        <line
          x1="60"
          y1="65"
          x2={60 + Math.cos((angle * Math.PI) / 180) * 38}
          y2={65 + Math.sin((angle * Math.PI) / 180) * 38}
          stroke="var(--text-hi)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.25s ease' }}
        />
        <circle cx="60" cy="65" r="4" fill="var(--amber)" />
      </svg>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--amber)', marginTop: -6 }}>
        {Math.round(wpm)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>WPM</div>
    </div>
  )
}
