const COLORS = ['#f0b429', '#4f8ef7', '#e2574c', '#4fae6e', '#b26fea', '#33c3c7']

/**
 * Pure CSS confetti — a fixed burst of pieces that fall and fade once,
 * driven entirely by keyframes defined in index.css. No canvas, no
 * animation library, no per-frame JS.
 */
export default function Confetti({ pieceCount = 60 }) {
  const pieces = Array.from({ length: pieceCount }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 0.4
    const duration = 2.2 + Math.random() * 1.2
    const color = COLORS[i % COLORS.length]
    const rotate = Math.random() * 360
    const size = 6 + Math.random() * 6
    return { id: i, left, delay, duration, color, rotate, size }
  })

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * 0.4,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
