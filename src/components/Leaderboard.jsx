import { rankPlayers, MEDALS } from '../utils/ranking.js'
import { getAvatar, getRacerColor } from '../utils/avatars.js'

/**
 * Two modes:
 *  - "live": shown during the race, with race-lane progress bars.
 *  - "final": shown after the race, ranked with medals and full stats.
 */
export default function Leaderboard({ players, mode = 'live', selfId }) {
  if (mode === 'final') {
    const ranked = rankPlayers(players)
    const winner = ranked[0]

    return (
      <div>
        {winner && (
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 38 }}>{getAvatar(winner.name)}</div>
            <h2 style={{ margin: '8px 0 4px', fontSize: 22 }}>{winner.name.toUpperCase()} WON! 🏆</h2>
            <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: 0 }}>
              Finished #1 out of {ranked.length} player{ranked.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ranked.map((p) => (
            <div key={p.id} className="card" style={rowStyle(p.id === selfId)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, width: 26 }}>{MEDALS[p.rank - 1] || `#${p.rank}`}</span>
                <span style={{ fontSize: 20 }}>{getAvatar(p.name)}</span>
                <strong style={{ fontSize: 16 }}>{p.name}</strong>
              </div>
              <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-mid)' }}>
                <span style={{ color: getRacerColor(p.name) }}>{p.wpm} WPM</span>
                <span>{p.accuracy}% acc</span>
                <span>{p.errors} err</span>
                <span>{p.timeSeconds}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {players.map((p) => (
        <div key={p.id} className="card" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{getAvatar(p.name)}</span>
              {p.name}
              {p.id === selfId ? ' (you)' : ''}
            </strong>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: getRacerColor(p.name) }}>
              {p.finished ? 'Finished 🏁' : `${p.wpm || 0} WPM`}
            </span>
          </div>
          <div className="lane-track">
            <span
              className="lane-icon"
              style={{ left: `${Math.max(4, Math.min(96, p.progress || 0))}%` }}
            >
              {getAvatar(p.name)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function rowStyle(isSelf) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderColor: isSelf ? 'var(--amber)' : 'var(--line)',
  }
}
