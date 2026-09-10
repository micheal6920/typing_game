/**
 * Pure functions for turning raw keystroke data into typing-test stats.
 * Kept dependency-free and side-effect-free so they're easy to reuse for
 * both single-player and multiplayer scoring.
 */

/**
 * Standard WPM formula: (correct characters / 5) / minutes elapsed.
 * Using correct characters (not total typed) means mistakes reduce WPM,
 * which matches how most typing tests define "net" speed.
 */
export function calculateWPM(correctChars, elapsedMs) {
  const minutes = elapsedMs / 1000 / 60
  if (minutes <= 0) return 0
  return Math.round(correctChars / 5 / minutes)
}

export function calculateAccuracy(correctChars, totalTypedChars) {
  if (totalTypedChars <= 0) return 100
  return Math.round((correctChars / totalTypedChars) * 100)
}

/**
 * Compares the typed string against the target string character-by-character
 * and returns counts. `typed` may be shorter than `target` mid-test.
 */
export function scoreTypedText(target, typed) {
  let correct = 0
  let incorrect = 0

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) {
      correct++
    } else {
      incorrect++
    }
  }

  return {
    correctChars: correct,
    incorrectChars: incorrect,
    totalTypedChars: typed.length,
  }
}

export function buildResult({ target, typed, startTime, endTime, name }) {
  const { correctChars, incorrectChars, totalTypedChars } = scoreTypedText(target, typed)
  const elapsedMs = Math.max(1, endTime - startTime)

  return {
    name,
    wpm: calculateWPM(correctChars, elapsedMs),
    accuracy: calculateAccuracy(correctChars, totalTypedChars),
    errors: incorrectChars,
    correctChars,
    incorrectChars,
    totalTypedChars,
    timeSeconds: Math.round((elapsedMs / 1000) * 10) / 10,
  }
}
