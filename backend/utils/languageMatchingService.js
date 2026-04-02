/**
 * languageMatchingService.js
 * Fuzzy language name matching — no external dependencies.
 * Uses Levenshtein distance to find the closest known language.
 */

const LANGUAGES = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
  'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#', '.NET',
  'Go', 'Rust', 'PHP', 'Laravel', 'Ruby', 'Rails', 'Swift', 'Kotlin',
  'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Git',
]

// Levenshtein distance between two strings
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/**
 * Find the best matching language for a user input string.
 * Returns { match, score } where score is 0-1 (1 = perfect match).
 */
function findBestMatch(input) {
  if (!input || !input.trim()) return null
  const query = input.trim().toLowerCase()

  let best = null, bestScore = -1

  for (const lang of LANGUAGES) {
    const lower = lang.toLowerCase()
    // Exact match
    if (lower === query) return { match: lang, score: 1 }
    // Starts-with bonus
    const startsWith = lower.startsWith(query) || query.startsWith(lower)
    const dist = levenshtein(query, lower)
    const maxLen = Math.max(query.length, lower.length)
    const similarity = 1 - dist / maxLen + (startsWith ? 0.2 : 0)
    if (similarity > bestScore) { bestScore = similarity; best = lang }
  }

  // Only return a suggestion if similarity is reasonable
  return bestScore >= 0.4 ? { match: best, score: Math.min(1, bestScore) } : null
}

/**
 * Return up to `limit` suggestions for a partial input (for autocomplete).
 */
function getSuggestions(input, limit = 5) {
  if (!input || input.trim().length < 1) return LANGUAGES.slice(0, limit)
  const query = input.trim().toLowerCase()
  return LANGUAGES
    .map((lang) => {
      const lower = lang.toLowerCase()
      const dist = levenshtein(query, lower.slice(0, query.length))
      const startsWith = lower.startsWith(query)
      const score = (startsWith ? 1 : 0) + (1 - dist / Math.max(query.length, 1))
      return { lang, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.lang)
}

module.exports = { LANGUAGES, findBestMatch, getSuggestions }
