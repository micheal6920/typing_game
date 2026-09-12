/**
 * Word banks used by the timed single-player modes. Words are generated
 * into a long stream (joined by spaces) rather than using a fixed
 * paragraph, since a timed test needs enough text to outlast even a very
 * fast typist for the full duration.
 */

export const EASY_WORDS = [
  'cat', 'dog', 'run', 'sun', 'sky', 'red', 'big', 'hot', 'top', 'pen',
  'book', 'time', 'word', 'play', 'jump', 'blue', 'good', 'help', 'walk',
  'fast', 'slow', 'game', 'kind', 'nice', 'love', 'star', 'moon', 'tree',
  'road', 'hand', 'door', 'find', 'take', 'make', 'give', 'look', 'want',
  'need', 'good', 'easy', 'come', 'go', 'see', 'eat', 'day', 'now', 'new',
]

export const MEDIUM_WORDS = [
  'yellow', 'garden', 'little', 'window', 'happy', 'answer', 'friend',
  'planet', 'season', 'people', 'family', 'record', 'strong', 'travel',
  'moment', 'simple', 'wonder', 'create', 'future', 'memory', 'listen',
  'change', 'forest', 'castle', 'silver', 'energy', 'circle', 'bridge',
  'market', 'honest', 'gentle', 'ladder', 'wander', 'pocket', 'kitchen',
  'library', 'holiday', 'morning', 'evening', 'weather', 'journey',
]

export const HARD_WORDS = [
  'extraordinary', 'sophisticated', 'philosophical', 'unbelievable',
  'technological', 'responsibility', 'inconvenience', 'characteristic',
  'misunderstanding', 'representative', 'international', 'organization',
  'infrastructure', 'recommendation', 'transformation', 'achievement',
  'communication', 'independence', 'opportunity', 'environment',
  'circumstances', 'consideration', 'unprecedented', 'entrepreneur',
  'accommodation', 'extraordinarily', 'disproportionate', 'establishment',
]

export function generateWordStream(wordList, count) {
  const words = []
  for (let i = 0; i < count; i++) {
    words.push(wordList[Math.floor(Math.random() * wordList.length)])
  }
  return words.join(' ')
}

/**
 * Word counts are generous on purpose — around 300 words per minute of
 * test time, which comfortably outlasts even a very fast (150+ WPM)
 * typist for the whole duration, so we never run out of text.
 */
export const DIFFICULTIES = {
  easy: {
    key: 'easy',
    label: 'Easy',
    seconds: 60,
    words: EASY_WORDS,
    description: 'Short, simple words. 1 minute.',
    icon: '🟢',
  },
  medium: {
    key: 'medium',
    label: 'Medium',
    seconds: 120,
    words: MEDIUM_WORDS,
    description: 'Everyday words, a bit longer. 2 minutes.',
    icon: '🟡',
  },
  hard: {
    key: 'hard',
    label: 'Hard',
    seconds: 180,
    words: HARD_WORDS,
    description: 'Long, tricky words. 3 minutes.',
    icon: '🔴',
  },
}
