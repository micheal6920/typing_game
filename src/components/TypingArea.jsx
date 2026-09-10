import { useEffect, useRef, useState } from 'react'
import { calculateAccuracy, calculateWPM, buildResult } from '../utils/typingCalculator.js'
import SpeedGauge from './SpeedGauge.jsx'

/**
 * Owns all per-keystroke state locally. This is the only part of the page
 * that re-renders on every keystroke — Header, Timer, and (in multiplayer)
 * the opponents' progress bars are separate components that do not depend
 * on this component's state, so they never re-render while the player types.
 *
 * A single hidden <input> captures keystrokes; the paragraph itself is
 * rendered as styled <span> characters driven by comparing input.value to
 * the target text, which is what gives per-character correct/incorrect
 * highlighting without a heavier text-editor dependency.
 */
export default function TypingArea({ target, onComplete, onProgress, name }) {
  const [typed, setTyped] = useState('')
  const startTimeRef = useRef(null)
  const finishedRef = useRef(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Throttled progress broadcast (multiplayer) — reads from a ref-backed
  // interval rather than firing on every keystroke, so it can't flood the
  // network or trigger extra renders in parent/sibling components.
  useEffect(() => {
    if (!onProgress) return undefined
    const interval = setInterval(() => {
      if (finishedRef.current || !startTimeRef.current) return
      const el = document.getElementById('typing-hidden-input')
      const value = el ? el.value : ''
      const progress = Math.min(100, Math.round((value.length / target.length) * 100))
      const elapsedMs = Date.now() - startTimeRef.current
      let correct = 0
      for (let i = 0; i < value.length; i++) if (value[i] === target[i]) correct++
      const wpm = calculateWPM(correct, elapsedMs)
      onProgress(progress, wpm)
    }, 300)
    return () => clearInterval(interval)
  }, [onProgress, target])

  function handleChange(e) {
    if (finishedRef.current) return
    const value = e.target.value

    if (startTimeRef.current === null && value.length > 0) {
      startTimeRef.current = Date.now()
    }

    // Prevent typing past the end of the paragraph
    const clipped = value.length > target.length ? value.slice(0, target.length) : value
    setTyped(clipped)

    if (clipped.length >= target.length && clipped.length > 0) {
      finishedRef.current = true
      const result = buildResult({
        target,
        typed: clipped,
        startTime: startTimeRef.current,
        endTime: Date.now(),
        name,
      })
      onComplete(result)
    }
  }

  const currentIndex = typed.length
  let correctCount = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correctCount++
  const liveAccuracy = calculateAccuracy(correctCount, typed.length)
  const liveErrors = typed.length - correctCount
  const liveWpm = startTimeRef.current
    ? calculateWPM(correctCount, Date.now() - startTimeRef.current)
    : 0

  return (
    <div
      ref={containerRef}
      style={styles.wrap}
      onClick={() => inputRef.current?.focus()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 18, flexWrap: 'wrap' }}>
        <SpeedGauge wpm={liveWpm} />
        <div className="stat-row">
          <div className="stat">
            <span className="stat-value">{liveAccuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: liveErrors > 0 ? 'var(--red)' : 'var(--amber)' }}>
              {liveErrors}
            </span>
            <span className="stat-label">Errors</span>
          </div>
        </div>
      </div>

      <p style={styles.paragraph} aria-hidden="true">
        {target.split('').map((char, i) => {
          let color = 'var(--text-mid)'
          let bg = 'transparent'
          if (i < typed.length) {
            color = typed[i] === char ? 'var(--text-hi)' : 'var(--red)'
            bg = typed[i] === char ? 'transparent' : 'rgba(226, 87, 76, 0.18)'
          }
          const isCaret = i === currentIndex
          return (
            <span
              key={i}
              style={{
                color,
                background: bg,
                borderLeft: isCaret ? '2px solid var(--amber)' : '2px solid transparent',
              }}
            >
              {char}
            </span>
          )
        })}
      </p>

      <input
        id="typing-hidden-input"
        ref={inputRef}
        style={styles.hiddenInput}
        value={typed}
        onChange={handleChange}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Type the paragraph shown above"
      />

      <p style={styles.hint}>Click the text and start typing to begin.</p>
    </div>
  )
}

const styles = {
  wrap: {
    cursor: 'text',
  },
  paragraph: {
    fontFamily: 'var(--font-mono)',
    fontSize: 21,
    lineHeight: 1.75,
    letterSpacing: '0.01em',
    color: 'var(--text-mid)',
    maxWidth: '68ch',
    userSelect: 'none',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
    pointerEvents: 'none',
  },
  hint: {
    fontSize: 13,
    color: 'var(--text-low)',
    marginTop: 8,
  },
}
