const PARAGRAPHS = [
  'The quick brown fox jumps over the lazy dog while the sun sets behind the distant hills, painting the sky in shades of orange and purple that fade slowly into the calm of evening.',
  'Success is not final and failure is not fatal. It is the courage to continue that counts. Every expert was once a beginner who refused to give up when things became difficult.',
  'A journey of a thousand miles begins with a single step, and every great achievement starts as an idea that someone was brave enough to pursue despite the doubts of others.',
  'Technology moves faster than most people expect, reshaping how we work, communicate, and solve problems, yet the fundamentals of clear thinking and steady practice never go out of style.',
  'The old lighthouse stood at the edge of the cliff, its beam sweeping across the dark water every few seconds, guiding ships safely past the rocks that had claimed so many before.',
  'Practice does not make perfect. Only perfect practice makes perfect, and the difference between average and excellent is almost always the willingness to repeat the fundamentals patiently.',
  'In the middle of every difficulty lies opportunity, and the people who succeed are usually the ones who kept experimenting a little longer than everyone else was willing to.',
  'Rain tapped gently against the window as she typed the final paragraph of her novel, feeling a mixture of relief and quiet pride after months of early mornings and late nights.',
  'The fastest way to improve at anything is consistent, focused repetition combined with honest feedback, because raw talent without practice rarely outperforms discipline applied over time.',
  'Mountains do not rise gradually from the plain, but explode upward violently, thrusting rock and ice toward the sky in a display of geological force that took millions of years to complete.',
]

export function getRandomParagraph() {
  return PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)]
}

export default PARAGRAPHS
