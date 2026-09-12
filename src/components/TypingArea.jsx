import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  calculateAccuracy,
  calculateWPM,
  buildResult,
  scoreWordsTyped,
  buildWordResult,
} from '../utils/typingCalculator.js'
import { generateWordStream } from '../utils/wordLists.js'
import SpeedGauge from './SpeedGauge.jsx'

const WORDS_LOOKAHEAD = 60 // how far ahead of the caret to keep rendered
const WORDS_HISTORY_CAP = 300 // safety cap so a very long session can't bloat the DOM
const EXTEND_WHEN_WORDS_LEFT = 15
const EXTEND_BATCH_SIZE = 60

/**
 * Owns all per-keystroke state locally. This is the only part of the page
 * that re-renders on every keystroke — Header, Timer, and (in multiplayer)
 * the opponents' progress bars are separate components, so they never
 * re-render while the player types.
 *
 * Two modes with two different input models:
 *
 *  - Paragraph mode (`target` prop, used by multiplayer): fixed text,
 *    compared as one continuous string. Test ends when the whole
 *    paragraph is typed.
 *
 *  - Timed mode (`timedConfig` prop, used by Easy/Medium/Hard single
 *    player): words are scored *independently of each other*. The space
 *    key is intercepted and never enters the typed value — pressing it
 *    "commits" the current word and starts a fresh one. This means a
 *    missed space or a mistyped word can never shift character alignment
 *    and cascade into every word after it being marked wrong.
 */
export default function TypingArea({ target: paragraphTarget, timedConfig, onComplete, onProgress, name }) {
  const isTimed = Boolean(timedConfig)

  if (isTimed) {
    return <TimedTypingArea timedConfig={timedConfig} onComplete={onComplete} name={name} />
  }
  return (
    <ParagraphTypingArea target={paragraphTarget} onComplete={onComplete} onProgress={onProgress} name={name} />
  )
}

/* ------------------------------------------------------------------ */
/* Timed mode — word-independent scoring                              */
/* ------------------------------------------------------------------ */

function TimedTypingArea({ timedConfig, onComplete, name }) {
  const { durationSeconds, wordList, startTime } = timedConfig

  const [wordStream, setWordStream] = useState(() =>
    generateWordStream(wordList, Math.max(80, Math.round((durationSeconds / 60) * 300)))
  )
  const words = useMemo(() => wordStream.split(' '), [wordStream])

  const [committedWords, setCommittedWords] = useState([])
  const [currentInput, setCurrentInput] = useState('')
  const finishedRef = useRef(false)
  const inputRef = useRef(null)

  // Kept in sync every render so the timer-expiry effect always reads the
  // latest typed content, even though its interval closure is set up once.
  const committedWordsRef = useRef(committedWords)
  committedWordsRef.current = committedWords
  const currentInputRef = useRef(currentInput)
  currentInputRef.current = currentInput
  const wordsRef = useRef(words)
  wordsRef.current = words

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // End the test purely on the clock, independent of how far the player got.
  useEffect(() => {
    const interval = setInterval(() => {
      if (finishedRef.current) return
      const elapsedMs = Date.now() - startTime
      if (elapsedMs >= durationSeconds * 1000) {
        finishedRef.current = true
        clearInterval(interval)
        const typedSegments = [...committedWordsRef.current]
        const hasInProgress = currentInputRef.current.length > 0
        if (hasInProgress) typedSegments.push(currentInputRef.current)

        const result = buildWordResult({
          targetWords: wordsRef.current,
          typedSegments,
          startTime,
          endTime: startTime + durationSeconds * 1000,
          name,
          lastIsInProgress: hasInProgress,
        })
        onComplete(result)
      }
    }, 150)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commitCurrentWord() {
    const wordIndex = committedWords.length
    setCommittedWords((prev) => [...prev, currentInput])
    setCurrentInput('')

    if (words.length - (wordIndex + 1) < EXTEND_WHEN_WORDS_LEFT) {
      setWordStream((prev) => `${prev} ${generateWordStream(wordList, EXTEND_BATCH_SIZE)}`)
    }
  }

  function handleKeyDown(e) {
    if (finishedRef.current) return
    if (e.key === ' ') {
      e.preventDefault()
      if (currentInput.length === 0) return // ignore stray/double space presses
      commitCurrentWord()
    }
  }

  function handleChange(e) {
    if (finishedRef.current) return
    // Defensive strip in case a space sneaks in via paste/autocomplete —
    // spaces are never part of the scored value in timed mode.
    const stripped = e.target.value.replace(/\s/g, '')
    // Cap how far a mistyped word can overshoot its target length, so
    // mashing keys without hitting space can't stretch a word forever and
    // blow out the layout — a handful of extra characters is enough to
    // show a typo without needing an unbounded runaway string.
    const targetWord = words[currentWordIndex] || ''
    const maxLen = targetWord.length + 10
    setCurrentInput(stripped.length > maxLen ? stripped.slice(0, maxLen) : stripped)
  }

  const currentWordIndex = committedWords.length
  const { correctChars, totalTypedChars } = scoreWordsTyped(words, [...committedWords, currentInput], {
    lastIsInProgress: true,
  })
  const liveAccuracy = calculateAccuracy(correctChars, totalTypedChars)
  const liveErrors = totalTypedChars - correctChars
  const liveWpm = calculateWPM(correctChars, Date.now() - startTime)

  // Words are only ever appended to the visible set as you progress —
  // never removed from the front — so completed lines stay exactly where
  // they are instead of reflowing. WORDS_HISTORY_CAP is just a safety
  // valve for extremely long sessions; in practice it never trims.
  const windowStart = Math.max(0, currentWordIndex - WORDS_HISTORY_CAP)
  const windowEnd = Math.min(words.length, currentWordIndex + WORDS_LOOKAHEAD + 1)

  const currentWordRef = useRef(null)
  const scrollTrackRef = useRef(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  // Instead of swapping which words are rendered, the whole word list
  // stays in place and we smoothly translate it upward so the active
  // word's row settles near the top of the box — a real scroll, not a
  // re-shuffle, so nothing jumps between lines.
  useLayoutEffect(() => {
    if (currentWordRef.current) {
      const anchor = 6 // px from the top of the box to keep the current row pinned at
      setScrollOffset(Math.max(0, currentWordRef.current.offsetTop - anchor))
    }
  }, [currentWordIndex])

  return (
    <div style={{ cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
      <StatsRow accuracy={liveAccuracy} errors={liveErrors} wpm={liveWpm} />

      <div className="card" style={styles.typingBox} aria-hidden="true">
        <div
          ref={scrollTrackRef}
          style={{ ...styles.wordTrack, transform: `translateY(-${scrollOffset}px)` }}
        >
          {words.slice(windowStart, windowEnd).map((word, idx) => {
            const wordIndex = windowStart + idx
            const isCurrentWord = wordIndex === currentWordIndex
            const isPastWord = wordIndex < currentWordIndex
            const typedWord = isCurrentWord ? currentInput : isPastWord ? committedWords[wordIndex] : ''

            return (
              <WordSpan
                key={wordIndex}
                targetWord={word}
                typedWord={typedWord}
                isCurrent={isCurrentWord}
                isPast={isPastWord}
                innerRef={isCurrentWord ? currentWordRef : undefined}
              />
            )
          })}
        </div>
      </div>

      <input
        id="typing-hidden-input"
        ref={inputRef}
        style={styles.hiddenInput}
        value={currentInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Type the current word, then press space"
      />

      <p style={styles.hint}>Click the box and start typing — press space after each word.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Paragraph mode — unchanged continuous-string model (multiplayer)   */
/* ------------------------------------------------------------------ */

function ParagraphTypingArea({ target, onComplete, onProgress, name }) {
  const [typed, setTyped] = useState('')
  const startTimeRef = useRef(null)
  const finishedRef = useRef(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
  const liveWpm = startTimeRef.current ? calculateWPM(correctCount, Date.now() - startTimeRef.current) : 0

  return (
    <div style={{ cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
      <StatsRow accuracy={liveAccuracy} errors={liveErrors} wpm={liveWpm} />

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

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function StatsRow({ accuracy, errors, wpm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 18, flexWrap: 'wrap' }}>
      <SpeedGauge wpm={wpm} />
      <div className="stat-row">
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value" style={{ color: errors > 0 ? 'var(--red)' : 'var(--amber)' }}>
            {errors}
          </span>
          <span className="stat-label">Errors</span>
        </div>
      </div>
    </div>
  )
}

/** Renders one word's characters, independently scored against its own target word. */
function WordSpan({ targetWord, typedWord, isCurrent, isPast, innerRef }) {
  const maxLen = Math.max(targetWord.length, typedWord.length)
  const chars = []

  for (let i = 0; i < maxLen; i++) {
    const targetChar = targetWord[i]
    const typedChar = typedWord[i]
    const hasTyped = typedChar !== undefined
    let color = 'var(--text-mid)'
    let bg = 'transparent'

    if (hasTyped) {
      const isMatch = targetChar !== undefined && typedChar === targetChar
      color = isMatch ? 'var(--text-hi)' : 'var(--red)'
      bg = isMatch ? 'transparent' : 'rgba(226, 87, 76, 0.18)'
    }

    chars.push({ key: i, content: targetChar !== undefined ? targetChar : typedChar, color, bg, isCaret: isCurrent && i === typedWord.length })
  }
  if (isCurrent && typedWord.length === maxLen) {
    chars.push({ key: 'caret-end', content: '', color: 'transparent', bg: 'transparent', isCaret: true })
  }

  return (
    <span
      ref={innerRef}
      style={{
        ...styles.word,
        opacity: isPast ? 0.4 : 1,
        borderBottom: isCurrent ? '2px solid var(--amber)' : '2px solid transparent',
      }}
    >
      {chars.map((c) => (
        <span
          key={c.key}
          style={{
            color: c.color,
            background: c.bg,
            borderLeft: c.isCaret ? '2px solid var(--amber)' : '2px solid transparent',
          }}
        >
          {c.content}
        </span>
      ))}
    </span>
  )
}

const styles = {
  typingBox: {
    position: 'relative',
    overflow: 'hidden',
    maxWidth: 720,
    height: 176,
    padding: '26px 30px',
    userSelect: 'none',
  },
  wordTrack: {
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: '10px 18px',
    transition: 'transform 0.2s ease',
  },
  word: {
    fontFamily: 'var(--font-mono)',
    fontSize: 21,
    lineHeight: 1.6,
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    paddingBottom: 2,
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
