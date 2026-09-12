import { useEffect, useState } from 'react'
import { BUILD_VERSION } from '../version.js'

const CHECK_INTERVAL_MS = 60_000

/**
 * Solves the classic "stale GitHub Pages tab" problem: since built JS/CSS
 * files get a new hashed name every deploy, an old cached copy of
 * index.html can end up pointing at files that no longer exist. Instead
 * of relying on the visitor to notice and hard-refresh (Ctrl+F5), this
 * periodically fetches a tiny, cache-busted version.json and compares it
 * to the version this page was actually built with. If they differ, it
 * shows a small banner and reloads automatically.
 */
export default function AutoUpdateChecker() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.version && data.version !== BUILD_VERSION) {
          setUpdateReady(true)
        }
      } catch {
        // Offline or blocked — just skip this check, try again next interval.
      }
    }

    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    if (!updateReady) return
    const timeout = setTimeout(() => {
      // A cache-busting query string forces a real network fetch of
      // index.html — a plain reload() can still be served from cache.
      const url = new URL(window.location.href)
      url.searchParams.set('_v', Date.now().toString())
      window.location.replace(url.toString())
    }, 1200)
    return () => clearTimeout(timeout)
  }, [updateReady])

  if (!updateReady) return null

  return (
    <div style={styles.banner}>
      🔄 A new version is available — refreshing…
    </div>
  )
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--amber)',
    color: 'var(--ink-950)',
    fontWeight: 600,
    fontSize: 14,
    padding: '10px 20px',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    zIndex: 100,
  },
}
