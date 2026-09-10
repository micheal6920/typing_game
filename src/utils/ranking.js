/**
 * Ranks finished players for the multiplayer leaderboard.
 *
 * Order of precedence:
 *   1. WPM (higher is better)              — primary measure of speed
 *   2. Accuracy (higher is better)          — first tie-breaker
 *   3. Completion time (lower is better)    — second tie-breaker
 *
 * Players who never finished are ranked after everyone who did, ordered
 * by how much of the text they completed.
 */
export function rankPlayers(players) {
  const finished = players.filter((p) => p.finished)
  const unfinished = players.filter((p) => !p.finished)

  finished.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
    return a.timeSeconds - b.timeSeconds
  })

  unfinished.sort((a, b) => (b.progress || 0) - (a.progress || 0))

  return [...finished, ...unfinished].map((player, index) => ({
    ...player,
    rank: index + 1,
  }))
}

export const MEDALS = ['🥇', '🥈', '🥉']
