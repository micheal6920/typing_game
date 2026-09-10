/**
 * Thin wrapper around localStorage. The player "name" stored here is only
 * a convenience so returning players don't retype it — it is never an
 * account, credential, or identity of any kind.
 */

const KEYS = {
  NAME: 'typingrace_last_name',
  HISTORY: 'typingrace_history',
}

export function getLastName() {
  try {
    return localStorage.getItem(KEYS.NAME) || ''
  } catch {
    return ''
  }
}

export function setLastName(name) {
  try {
    localStorage.setItem(KEYS.NAME, name)
  } catch {
    /* localStorage unavailable (e.g. private mode) — fail silently */
  }
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
