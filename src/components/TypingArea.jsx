import { useEffect, useRef, useState } from 'react'
import { calculateAccuracy, calculateWPM, buildResult } from '../utils/typingCalculator.js'
import { generateWordStream } from '../utils/wordLists.js'
import SpeedGauge from './SpeedGauge.jsx'

const WINDOW_BEFORE = 25 // chars of already-typed text kept visible behind the caret
const WINDOW_AFTER = 260 // chars of upcoming text kept visible ahead of the caret

/**
 * Owns all per-keystroke state locally. This is the only part of the page
 * that re-renders on every keystroke — Header, Timer, and (in multiplayer)
 * the opponents' progress bars are separate components that do not depend
 * on this component's state, so they never re-render while the player types.
 *
 * Two modes:
 *  - Paragraph mode (`target` prop): fixed text, test ends when the whole
 *    paragraph is typed. Used by multiplayer and stayed unchanged.
 *  - Timed mode (`timedConfig` prop): a long generated word stream, test
 *    ends when the shared duration elapses, however far the player got.
 *    Used by the new Easy/Medium/Hard single-player modes.
 *
 * Regardless of mode, only a small window of characters around the caret
 * is ever rendered (see WINDOW_BEFORE/AFTER) so a multi-hundred-word timed
 * stream stays just as cheap to render as a short paragraph.
 */
export default function TypingArea({ target: paragraphTarget, timedConfig, onComplete, onProgress, name }) {
  const isTimed = Boolean(timedConfig)

  const [timedTarget, setTimedTarget] = useState(() =>
    isTimed ? generateWordStream(timedConfig.wordList, Math.max(60, Math.round((timedConfig.durationSeconds / 60) * 300))) : ''
  )
  const target = isTimed ? timedTarget : paragraphTarget

  const [typed, setTyped] = useState('')
  const startTimeRef = useRef(isTimed ? timedConfig.startTime : null)
  const finishedRef = useRef(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Timed mode: end the test purely on the clock, independent of how much
  // text the player got through.
  useEffect(() => {
    if (!isTimed) return undefined
    const { durationSeconds, startTime } = timedConfig
    const interval = setInterval(() => {
      if (finishedRef.current) return
      const elapsedMs = Date.now() - startTime
      if (elapsedMs >= durationSeconds * 1000) {
        finishedRef.current = true
        clearInterval(interval)
        const el = document.getElementById('typing-hidden-input')
        const value = el ? el.value : ''
        const result = buildResult({
          target,
          typed: value,
          startTime,
          endTime: startTime + durationSeconds * 1000,
          name,
        })
        onComplete(result)
      }
    }, 150)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, target])

  // Throttled progress broadcast (multiplayer, paragraph mode only).
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

    if (!isTimed && startTimeRef.current === null && value.length > 0) {
      startTimeRef.current = Date.now()
    }

    if (isTimed) {
      setTyped(value)
      // Safety net: keep generating more words if the player is closing
      // in on the end of the current stream before time is up.
      if (target.length - value.length < 60) {
        setTimedTarget((prev) => `${prev} ${generateWordStream(timedConfig.wordList, 60)}`)
      }
      return
    }

    // Paragraph mode: cap at the paragraph length and finish on completion.
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

  const windowStart = Math.max(0, currentIndex - WINDOW_BEFORE)
  const windowEnd = Math.min(target.length, currentIndex + WINDOW_AFTER)
  const visibleChars = target.slice(windowStart, windowEnd).split('')

  return (
    <div style={{ cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
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
        {windowStart > 0 && <span style={{ color: 'var(--text-low)' }}>… </span>}
        {visibleChars.map((char, idx) => {
          const i = windowStart + idx
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
        {windowEnd < target.length && <span style={{ color: 'var(--text-low)' }}> …</span>}
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
        aria-label="Type the text shown above"
      />

      <p style={styles.hint}>Click the text and start typing to begin.</p>
    </div>
  )
}

const styles = {
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
