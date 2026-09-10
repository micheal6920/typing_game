const AVATARS = ['🚀', '🏎️', '🐆', '🦅', '🔥', '⚡', '🐎', '🚴', '🛼', '🦖', '🐇', '🌪️']

const RACER_COLORS = [
  '#f0b429', // amber
  '#4f8ef7', // blue
  '#e2574c', // red
  '#4fae6e', // green
  '#b26fea', // purple
  '#33c3c7', // teal
  '#f26d8d', // pink
  '#ff8a3d', // orange
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getAvatar(name) {
  if (!name) return AVATARS[0]
  return AVATARS[hashString(name) % AVATARS.length]
}

export function getRacerColor(name) {
  if (!name) return RACER_COLORS[0]
  return RACER_COLORS[hashString(name) % RACER_COLORS.length]
}
