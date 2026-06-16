import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const RAW_DIR = resolve(__dir, 'raw', 'gdelt')
const OUT_JSON = resolve(ROOT, 'src', 'data', 'gdelt-signal.json')

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc'
const USER_AGENT = 'datengeschichten-data-pipeline/1.0 (https://github.com/raffirupp/datengeschichten; Kontakt: raffiruppert@gmail.com)'
const TIMESPAN = '12m'
const REQUEST_DELAY_MS = 8000 // GDELT verlangt mind. ~5s zwischen Abrufen; wir geben uns Luft
const RETRY_DELAY_MS = 12000 // bei Rate-Limit: flache Pause statt exponentiell wachsend
const MAX_ATTEMPTS = 6

// Suchbegriffe je Partei. GDELT lehnt EXAKTE Phrasensuche unterhalb einer Mindestlänge ab
// (getestet: `"SPD"` in Anführungszeichen -> "phrase is too short", `SPD` ohne Anführungszeichen
// funktioniert). Deshalb: einzelne Wörter NIE quoten, nur Mehrwort-Begriffe.
const PARTY_TERMS = {
  CDU: ['CDU', '"Christlich Demokratische Union"'],
  CSU: ['CSU', '"Christlich-Soziale Union"'],
  SPD: ['SPD', 'Sozialdemokraten'],
  GRÜNE: ['"Bündnis 90/Die Grünen"', '"Die Grünen"'],
  FDP: ['FDP', '"Freie Demokraten"'],
  AfD: ['AfD', '"Alternative für Deutschland"'],
  LINKE: ['"Die Linke"', 'Linkspartei'],
  BSW: ['"Bündnis Sahra Wagenknecht"', 'BSW'],
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function buildQuery(party) {
  const terms = PARTY_TERMS[party]
  return `(${terms.join(' OR ')}) sourcelang:german`
}

async function gdeltRequest(party, mode, cacheFile) {
  if (existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf-8'))
  }

  const query = buildQuery(party)
  const url = `${GDELT_URL}?${new URLSearchParams({ query, mode, timespan: TIMESPAN, format: 'json' })}`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let text
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      text = await res.text()
    } catch (e) {
      console.warn(`  ⚠ ${party}/${mode}: Netzwerkfehler (Versuch ${attempt}): ${e.message}`)
      await sleep(RETRY_DELAY_MS)
      continue
    }

    if (text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text)
        if (!Array.isArray(json.timeline) || json.timeline.length === 0) {
          console.warn(`  ⚠ ${party}/${mode}: Antwort ohne timeline (Versuch ${attempt}): ${text.slice(0, 150)}`)
        } else {
          writeFileSync(cacheFile, JSON.stringify(json), 'utf-8')
          return json
        }
      } catch {
        console.warn(`  ⚠ ${party}/${mode}: Antwort kein valides JSON (Versuch ${attempt}): ${text.slice(0, 150)}`)
      }
    } else {
      console.warn(`  ⚠ ${party}/${mode}: ${text.slice(0, 150)} (Versuch ${attempt})`)
    }
    await sleep(RETRY_DELAY_MS)
  }

  console.error(`✗ ${party}/${mode}: nach ${MAX_ATTEMPTS} Versuchen kein Ergebnis`)
  return null
}

// GDELT-Datum "20250702T000000Z" -> Montag der jeweiligen ISO-Woche, als "YYYY-MM-DD"
function dateToWeekStart(gdeltDate) {
  const y = Number(gdeltDate.slice(0, 4))
  const m = Number(gdeltDate.slice(4, 6)) - 1
  const d = Number(gdeltDate.slice(6, 8))
  const date = new Date(Date.UTC(y, m, d))
  const isoDay = date.getUTCDay() || 7 // Sonntag (0) -> 7
  date.setUTCDate(date.getUTCDate() - isoDay + 1)
  return date.toISOString().slice(0, 10)
}

function aggregateByWeek(dailyData, valueKey) {
  const byWeek = new Map() // week -> { sum, count }
  for (const point of dailyData) {
    const week = dateToWeekStart(point.date)
    if (!byWeek.has(week)) byWeek.set(week, { sum: 0, count: 0 })
    const bucket = byWeek.get(week)
    bucket.sum += point[valueKey]
    bucket.count += 1
  }
  return byWeek
}

// — Hauptlauf —
if (!existsSync(RAW_DIR)) mkdirSync(RAW_DIR, { recursive: true })

const parties = Object.keys(PARTY_TERMS)
const weeklyArticlesByParty = {} // party -> Map(week -> articleSum)
const weeklyToneByParty = {} // party -> Map(week -> avgTone)
const incompleteParties = []

for (const party of parties) {
  console.log(`\n${party}: ${buildQuery(party)}`)

  const volrawCache = resolve(RAW_DIR, `${party}-volraw.json`)
  const volraw = await gdeltRequest(party, 'timelinevolraw', volrawCache)
  await sleep(REQUEST_DELAY_MS)

  const toneCache = resolve(RAW_DIR, `${party}-tone.json`)
  const tone = await gdeltRequest(party, 'timelinetone', toneCache)
  await sleep(REQUEST_DELAY_MS)

  const volrawSeries = volraw?.timeline?.[0]?.data ?? []
  const toneSeries = tone?.timeline?.[0]?.data ?? []

  if (volrawSeries.length === 0 || toneSeries.length === 0) {
    console.warn(`  ⚠ ${party}: leeres oder fehlendes Signal (volraw=${volrawSeries.length}, tone=${toneSeries.length} Tage)`)
    incompleteParties.push(party)
  } else {
    console.log(`  ✓ ${party}: ${volrawSeries.length} Tage Aufmerksamkeit, ${toneSeries.length} Tage Ton`)
  }

  const articlesByWeek = aggregateByWeek(
    volrawSeries.map((p) => ({ date: p.date, value: p.value })),
    'value'
  )
  const toneByWeek = aggregateByWeek(
    toneSeries.map((p) => ({ date: p.date, value: p.value })),
    'value'
  )

  weeklyArticlesByParty[party] = new Map(
    [...articlesByWeek.entries()].map(([week, { sum }]) => [week, sum])
  )
  weeklyToneByParty[party] = new Map(
    [...toneByWeek.entries()].map(([week, { sum, count }]) => [week, sum / count])
  )
}

// — Wochen-Vereinigung über alle Parteien —
const allWeeks = new Set()
for (const party of parties) {
  for (const week of weeklyArticlesByParty[party]?.keys() ?? []) allWeeks.add(week)
}
const weeks = [...allWeeks].sort()

// — Aufmerksamkeits-Anteil je Woche (Partei-Artikel / Summe aller Parteien dieser Woche) —
const totalArticlesByWeek = new Map()
for (const week of weeks) {
  let total = 0
  for (const party of parties) total += weeklyArticlesByParty[party]?.get(week) ?? 0
  totalArticlesByWeek.set(week, total)
}

const byParty = {}
for (const party of parties) {
  byParty[party] = weeks
    .filter((week) => weeklyArticlesByParty[party]?.has(week))
    .map((week) => {
      const articles = weeklyArticlesByParty[party].get(week)
      const total = totalArticlesByWeek.get(week)
      const tone = weeklyToneByParty[party]?.get(week) ?? null
      return {
        week,
        attentionShare: total > 0 ? Math.round((articles / total) * 1000) / 1000 : null,
        articles: Math.round(articles),
        tone: tone != null ? Math.round(tone * 100) / 100 : null,
      }
    })
}

const output = {
  meta: {
    weeks,
    parties,
    generatedAt: new Date().toISOString(),
    sourceNote: 'GDELT DOC 2.0 API',
  },
  byParty,
}

writeFileSync(OUT_JSON, JSON.stringify(output, null, 2), 'utf-8')
console.log(`\n✓ Ausgabe: ${OUT_JSON}`)

// — Konsolen-Einschätzung —
console.log('\n=== ZUSAMMENFASSUNG ===')
console.log(`Zeitraum: ${weeks[0]} – ${weeks.at(-1)} (${weeks.length} Wochen)`)
for (const party of parties) {
  const points = byParty[party]
  const withTone = points.filter((p) => p.tone != null).length
  if (incompleteParties.includes(party)) {
    console.warn(`⚠ ${party}: dünn/leer — ${points.length} Wochen mit Daten`)
  } else {
    console.log(`✓ ${party}: ${points.length} Wochen, ${withTone} mit Ton-Wert — plausibles Signal`)
  }
}
