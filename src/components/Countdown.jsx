import { useEffect, useState } from 'react'

/**
 * A racing "start lights" countdown: lights stack up red as the count
 * drops, then flash green together for GO. If `targetTime` is supplied
 * (multiplayer), the sequence is driven by that shared timestamp so every
 * player's screen reaches GO at roughly the same moment.
 */
export default function Countdown({ targetTime, onComplete }) {
  const [remaining, setRemaining] = useState(3)
  const [go, setGo] = useState(false)

  useEffect(() => {
    const end = targetTime ?? Date.now() + 3000
    let done = false

    const interval = setInterval(() => {
      const msLeft = end - Date.now()
      if (msLeft <= 0) {
        if (!done) {
          done = true
          setGo(true)
          clearInterval(interval)
          setTimeout(onComplete, 500)
        }
        return
      }
      setRemaining(Math.ceil(msLeft / 1000))
    }, 80)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const litCount = go ? 3 : Math.max(0, 3 - remaining + 1)

  return (
    <div style={styles.wrap}>
      <div style={styles.lights}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={i < litCount ? (go ? 'light on-green' : 'light on-red') : 'light'}
          />
        ))}
      </div>
      <div style={styles.label}>
        {go ? <span className="go-text">GO!</span> : <span>{remaining}</span>}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    minHeight: '40vh',
  },
  lights: {
    display: 'flex',
    gap: 18,
    padding: '18px 26px',
    background: 'var(--ink-900)',
    border: '1px solid var(--line)',
    borderRadius: 16,
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 64,
    fontWeight: 600,
    color: 'var(--text-hi)',
    minHeight: 76,
  },
}
