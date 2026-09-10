import { useState } from 'react'
import { getAvatar } from '../utils/avatars.js'

export default function PlayerNameModal({
  title,
  defaultName = '',
  buttonLabel = 'Continue',
  extraField = null,
  onSubmit,
  error,
}) {
  const [name, setName] = useState(defaultName)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="track-rule" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 30 }}>{getAvatar(name || 'racer')}</span>
        <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
      </div>

      <label className="field-label" htmlFor="player-name">
        Your name
      </label>
      <input
        id="player-name"
        className="text-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Micheal"
        maxLength={20}
        autoFocus
        autoComplete="off"
      />

      {extraField}

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
        {buttonLabel}
      </button>
    </form>
  )
}
