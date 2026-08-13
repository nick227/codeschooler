// Explicit synonym -> canonical tag mapping
export const tagSynonyms: Record<string, string> = {
  // user-provided canonical mappings
  'hashmap': 'hash-map',
  'hash-maps': 'hash-map',
  'async-await': 'async',
  'promise-all': 'promises',
}

export function canonicalFor(tag: string): string | undefined {
  const k = (tag || '').toLowerCase()
  return tagSynonyms[k]
}

export function isSynonym(tag: string): boolean {
  return canonicalFor(tag) !== undefined
}

export default tagSynonyms
