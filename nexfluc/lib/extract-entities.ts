/**
 * Extract entities and concepts from transcription text
 * This creates nodes for the network graph
 */
export function extractEntitiesFromText(text: string): Array<{
  id: string
  label: string
  type: "startup" | "concept" | "feature" | "market"
  size?: number
  description?: string
}> {
  if (!text || text.trim().length === 0) {
    return []
  }

  const entities: Array<{
    id: string
    label: string
    type: "startup" | "concept" | "feature" | "market"
    size?: number
    description?: string
  }> = []

  // Common startup-related keywords
  const startupKeywords = [
    "startup",
    "company",
    "business",
    "venture",
    "enterprise",
    "platform",
    "app",
    "application",
    "service",
  ]

  // Feature keywords
  const featureKeywords = [
    "feature",
    "functionality",
    "capability",
    "tool",
    "system",
    "integration",
    "api",
    "dashboard",
    "analytics",
  ]

  // Market keywords
  const marketKeywords = [
    "market",
    "industry",
    "sector",
    "niche",
    "audience",
    "customer",
    "user",
    "demand",
  ]

  // Concept keywords
  const conceptKeywords = [
    "idea",
    "concept",
    "solution",
    "problem",
    "opportunity",
    "strategy",
    "approach",
    "method",
    "model",
  ]

  // Extract sentences
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10)

  // Extract potential entities from sentences
  sentences.forEach((sentence, index) => {
    const words = sentence.toLowerCase().split(/\s+/)
    const sentenceId = `sentence_${index}`

    // Check for startup mentions
    if (startupKeywords.some((kw) => words.includes(kw))) {
      // Extract potential startup name (capitalized words)
      const capitalizedWords = sentence.match(/\b[A-Z][a-z]+\b/g)
      if (capitalizedWords && capitalizedWords.length > 0) {
        capitalizedWords.forEach((word) => {
          if (word.length > 3) {
            entities.push({
              id: `startup_${word.toLowerCase()}`,
              label: word,
              type: "startup",
              size: 10,
              description: sentence.substring(0, 100),
            })
          }
        })
      }
    }

    // Check for features
    if (featureKeywords.some((kw) => words.includes(kw))) {
      entities.push({
        id: `feature_${index}`,
        label: `Feature: ${sentence.substring(0, 30)}`,
        type: "feature",
        size: 8,
        description: sentence,
      })
    }

    // Check for market mentions
    if (marketKeywords.some((kw) => words.includes(kw))) {
      entities.push({
        id: `market_${index}`,
        label: `Market: ${sentence.substring(0, 30)}`,
        type: "market",
        size: 9,
        description: sentence,
      })
    }

    // Check for concepts
    if (conceptKeywords.some((kw) => words.includes(kw))) {
      entities.push({
        id: `concept_${index}`,
        label: `Concept: ${sentence.substring(0, 30)}`,
        type: "concept",
        size: 12,
        description: sentence,
      })
    }
  })

  // Extract key phrases (2-3 word combinations)
  const phrases = extractKeyPhrases(text)
  phrases.forEach((phrase, index) => {
    if (phrase.length > 5 && phrase.length < 50) {
      const type = determineEntityType(phrase)
      entities.push({
        id: `phrase_${index}`,
        label: phrase,
        type,
        size: 7,
        description: `Key phrase from conversation`,
      })
    }
  })

  // Deduplicate by label
  const uniqueEntities = Array.from(
    new Map(entities.map((e) => [e.label.toLowerCase(), e])).values()
  )

  return uniqueEntities.slice(0, 20) // Limit to 20 entities
}

function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = []
  const words = text.toLowerCase().split(/\s+/)

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`
    if (phrase.length > 5 && !phrases.includes(phrase)) {
      phrases.push(phrase)
    }
  }

  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
    if (phrase.length > 8 && !phrases.includes(phrase)) {
      phrases.push(phrase)
    }
  }

  return phrases.slice(0, 10)
}

function determineEntityType(phrase: string): "startup" | "concept" | "feature" | "market" {
  const lower = phrase.toLowerCase()

  if (
    lower.includes("startup") ||
    lower.includes("company") ||
    lower.includes("business")
  ) {
    return "startup"
  }
  if (
    lower.includes("feature") ||
    lower.includes("tool") ||
    lower.includes("function")
  ) {
    return "feature"
  }
  if (
    lower.includes("market") ||
    lower.includes("industry") ||
    lower.includes("customer")
  ) {
    return "market"
  }
  return "concept"
}

