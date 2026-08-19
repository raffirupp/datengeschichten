// Geteilte Kernlogik für Umfrage-Verarbeitung (Rohdaten filtern, relevante Parteien
// bestimmen, gewichteten Trend berechnen) — genutzt von build-polls.mjs (Bund) und
// build-polls-laender.mjs (alle 16 Landtage), damit beide exakt dasselbe Verfahren nutzen.

const dayMs = 86_400_000
function toDate(str) { return new Date(str + 'T12:00:00Z') }
function diffDays(a, b) { return (a - b) / dayMs }

export function findParliament(raw, nameOrShortcut) {
  const parliaments = raw.Parliaments ?? {}
  return Object.entries(parliaments).find(([, p]) =>
    (p.Name ?? '').toLowerCase() === nameOrShortcut.toLowerCase() ||
    (p.Shortcut ?? '').toLowerCase() === nameOrShortcut.toLowerCase()
  )
}

/**
 * @param {object} raw geparstes dawum.json
 * @param {string} parlId Parliament-ID
 * @param {object} options { windowYears, trendDays }
 * @returns {{ polls: Array, trend: Array, partyList: Array }}
 */
export function buildPollsData(raw, parlId, { windowYears = 7, trendDays = 21 } = {}) {
  const parties = raw.Parties ?? {}
  const institutes = raw.Institutes ?? {}
  const surveys = raw.Surveys ?? {}

  const cutoffStr = new Date(Date.now() - windowYears * 365.25 * dayMs).toISOString().slice(0, 10)

  const rawPolls = []
  for (const [, survey] of Object.entries(surveys)) {
    if (String(survey.Parliament_ID) !== String(parlId)) continue
    const dateStr = survey.Date ?? ''
    if (!dateStr || dateStr < cutoffStr) continue

    const instituteId = String(survey.Institute_ID ?? '')
    const instituteName = institutes[instituteId]?.Name ?? instituteId
    const n = parseInt(survey.Surveyed_Persons ?? '0') || null

    const rawResults = survey.Results ?? {}
    const results = {}
    for (const [partyId, pct] of Object.entries(rawResults)) {
      const pctNum = parseFloat(pct)
      if (isNaN(pctNum)) continue
      const partyObj = parties[partyId]
      if (!partyObj) continue
      const key = partyObj.Shortcut ?? partyObj.Name ?? partyId
      results[key] = pctNum
    }

    if (Object.keys(results).length === 0) continue
    rawPolls.push({ date: dateStr, institute: instituteName, n, results })
  }
  rawPolls.sort((a, b) => a.date.localeCompare(b.date))

  // Relevante Parteien: erscheinen in >= 30% der Umfragen, "Sonstige" ausgeschlossen
  const partyCounts = {}
  for (const p of rawPolls) {
    for (const k of Object.keys(p.results)) partyCounts[k] = (partyCounts[k] ?? 0) + 1
  }
  const minCount = Math.ceil(rawPolls.length * 0.30)
  const relevantParties = Object.entries(partyCounts)
    .filter(([k, c]) => c >= minCount && k !== 'Sonstige')
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key)

  const partyKeyToName = {}
  for (const [, p] of Object.entries(parties)) {
    partyKeyToName[p.Shortcut ?? p.Name] = p.Name
  }
  const partyList = relevantParties.map((key) => ({ key, name: partyKeyToName[key] ?? key }))

  // Trend: gewichtetes gleitendes Mittel über trendDays
  const pollDates = [...new Set(rawPolls.map((p) => p.date))].sort()
  const trend = pollDates.map((targetDate) => {
    const tDate = toDate(targetDate)
    const window = rawPolls.filter((p) => {
      const age = diffDays(tDate, toDate(p.date))
      return age >= 0 && age < trendDays
    })
    if (window.length === 0) return null

    const values = {}
    for (const party of relevantParties) {
      let wSum = 0, wTotal = 0
      for (const poll of window) {
        if (poll.results[party] == null) continue
        const age = diffDays(tDate, toDate(poll.date))
        const recency = 1 - age / trendDays
        const sampleW = poll.n ? Math.sqrt(poll.n) : 1
        const w = recency * sampleW
        wSum += poll.results[party] * w
        wTotal += w
      }
      if (wTotal > 0) values[party] = Math.round((wSum / wTotal) * 10) / 10
    }
    return { date: targetDate, values }
  }).filter(Boolean)

  return {
    polls: rawPolls.map(({ date, institute, results }) => ({ date, institute, results })),
    trend,
    partyList,
  }
}
