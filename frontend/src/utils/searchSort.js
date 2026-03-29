/**
 * Relevance sorting for filter search UIs (C8).
 * When query is empty, behavior is defined per caller (alphabetical or count-desc).
 */

/**
 * @param {string[]} strings - Already filtered to matches (or full list)
 * @param {string} rawQuery
 * @returns {string[]} exact match → starts-with → contains (each bucket sorted A–Z)
 */
export function sortStringsByRelevance(strings, rawQuery) {
  const q = (rawQuery || '').trim().toLowerCase()
  if (!q) {
    return [...strings].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }
  const exact = []
  const starts = []
  const contains = []
  for (const s of strings) {
    const sl = s.toLowerCase()
    if (!sl.includes(q)) continue
    if (sl === q) exact.push(s)
    else if (sl.startsWith(q)) starts.push(s)
    else contains.push(s)
  }
  const cmp = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
  starts.sort(cmp)
  contains.sort(cmp)
  return [...exact, ...starts, ...contains]
}

/**
 * @param {{ name: string, count?: number }[]} tags - Filtered tag records
 * @param {string} rawQuery
 * @returns {typeof tags} Empty query: count desc. Non-empty: exact → starts-with → contains (name A–Z within each).
 */
export function sortTagRecordsByRelevance(tags, rawQuery) {
  const q = (rawQuery || '').trim().toLowerCase()
  if (!q) {
    return [...tags].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
  }
  const exact = []
  const starts = []
  const contains = []
  for (const t of tags) {
    const nl = t.name.toLowerCase()
    if (!nl.includes(q)) continue
    if (nl === q) exact.push(t)
    else if (nl.startsWith(q)) starts.push(t)
    else contains.push(t)
  }
  const cmp = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  starts.sort(cmp)
  contains.sort(cmp)
  return [...exact, ...starts, ...contains]
}
