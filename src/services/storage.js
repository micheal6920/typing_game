/**
 * Thin wrapper around localStorage. Currently only used for local run
 * history — the player's name is intentionally NOT persisted, so every
 * visit starts with a blank name field.
 */

const KEYS = {
  HISTORY: 'typingrace_history',
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addHistoryEntry(entry) {
  try {
    const history = getHistory()
    history.unshift({ ...entry, timestamp: Date.now() })
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 50)))
  } catch {
    /* ignore storage failures */
  }
}
