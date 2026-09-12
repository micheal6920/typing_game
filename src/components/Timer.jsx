import { useEffect, useState } from 'react'

/**
 * Ticks independently on its own interval. Because it owns its own state,
 * a keystroke in TypingArea (a sibling) never re-renders this component,
 * and this component's ticking never re-renders TypingArea either.
 *
 * Two display modes:
 *  - default: counts up elapsed seconds ("12.4s") — used by the fixed
 *    paragraph modes (multiplayer, and the old single-player mode).
 *  - `durationSeconds` supplied: counts down remaining time as mm:ss —
 *    used by the timed Easy/Medium/Hard single-player modes.
 */
export default function Timer({ startTime, running, durationSeconds }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return undefined
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 200)
    return () => clearInterval(interval)
  }, [startTime, running])

  if (durationSeconds) {
    const remaining = Math.max(0, durationSeconds - elapsed)
    const mm = Math.floor(remaining / 60)
    const ss = Math.floor(remaining % 60)
    return (
      <span className="stat-value" style={{ color: remaining <= 10 ? 'var(--red)' : undefined }}>
        {mm}:{String(ss).padStart(2, '0')}
      </span>
    )
  }

  return <span className="stat-value">{elapsed.toFixed(1)}s</span>
}
