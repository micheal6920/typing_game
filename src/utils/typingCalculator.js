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

/**
 * Scores typed text word-by-word against target words, rather than as one
 * continuous string. This is what the timed (Easy/Medium/Hard) modes use:
 * each word is compared only against its own matching target word, so a
 * missed space or a mistyped word can never shift the alignment and cause
 * every word after it to falsely show as wrong.
 *
 * `typedSegments` is a parallel array to the target words the player has
 * reached — one entry per word, where the last entry may still be "in
 * progress" (no space pressed yet). Each committed word (i.e. every entry
 * except a genuinely in-progress last one) contributes one extra correct
 * character to account for the space keystroke that advanced past it, so
 * WPM stays consistent with the conventional "5 chars = 1 word" measure.
 */
export function scoreWordsTyped(targetWords, typedSegments, { lastIsInProgress = false } = {}) {
  let correctChars = 0
  let totalTypedChars = 0

  typedSegments.forEach((typedWord, idx) => {
    const targetWord = targetWords[idx] || ''
    const maxLen = Math.max(targetWord.length, typedWord.length)

    for (let i = 0; i < maxLen; i++) {
      if (i < typedWord.length) {
        totalTypedChars++
        if (typedWord[i] === targetWord[i]) correctChars++
      }
    }

    const isLastSegment = idx === typedSegments.length - 1
    if (!(isLastSegment && lastIsInProgress)) {
      // Word was committed via a (correct-by-construction) space press.
      totalTypedChars++
      correctChars++
    }
  })

  return { correctChars, totalTypedChars, incorrectChars: totalTypedChars - correctChars }
}

export function buildWordResult({ targetWords, typedSegments, startTime, endTime, name, lastIsInProgress }) {
  const { correctChars, incorrectChars, totalTypedChars } = scoreWordsTyped(targetWords, typedSegments, {
    lastIsInProgress,
  })
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
