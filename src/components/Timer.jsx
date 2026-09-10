import { useEffect, useState } from 'react'

/**
 * Ticks independently on its own interval. Because it owns its own state,
 * a keystroke in TypingArea (a sibling) never re-renders this component,
 * and this component's ticking never re-renders TypingArea either.
 */
export default function Timer({ startTime, running }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return undefined
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 200)
    return () => clearInterval(interval)
  }, [startTime, running])

  return <span className="stat-value">{elapsed.toFixed(1)}s</span>
}
