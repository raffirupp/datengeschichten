import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const CSV = resolve(__dir, 'raw', 'gdelt-ngrams', 'sources-2025-2026.csv')
const OUT = resolve(ROOT, 'src', 'data', 'gdelt-sources.json')

// Bekannte Mediengruppen — für Transparenz-Hinweis in der UI
const MEDIA_GROUPS = {
  'Ippen Digital': ['merkur.de','tz.de','hna.de','az-online.de','op-online.de',
    'soester-anzeiger.de','kreiszeitung.de','come-on.de','fnp.de','fr.de',
    'ingolstaedter-zeitung.de','rosenheim24.de','chiemgau24.de'],
  'Axel Springer': ['welt.de','bild.de','computerbild.de'],
  'RTL/ntv':       ['n-tv.de','rtl.de','stern.de'],
  'ARD':           ['tagesschau.de','daserste.de','mdr.de','ndr.de','wdr.de','swr.de','br.de'],
  'ZDF':           ['zdf.de'],
  'Spiegel-Gruppe':['spiegel.de','manager-magazin.de'],
  'Zeit-Verlag':   ['zeit.de'],
  'FAZ-Gruppe':    ['faz.net'],
  'Focus':         ['focus.de'],
  'Funke Medien':  ['morgenpost.de','waz.de','nrz.de','wp.de','tz.de'],
}

function groupFor(domain) {
  for (const [group, domains] of Object.entries(MEDIA_GROUPS)) {
    if (domains.includes(domain)) return group
  }
  return null
}

// Partei-Mapping: CSV-Werte → einheitliche Keys
const PARTY_MAP = {
  AfD: 'AfD', SPD: 'SPD', CDU: 'CDU', CSU: 'CSU',
  FDP: 'FDP', BSW: 'BSW', Grüne: 'GRÜNE', Linke: 'LINKE',
}
const PARTIES = ['AfD', 'SPD', 'CDU', 'CSU', 'FDP', 'BSW', 'GRÜNE', 'LINKE']

const lines = readFileSync(CSV, 'utf-8').trim().split('\n')
lines.shift()

// domain → party → month → mentions
const raw = {}
const allMonths = new Set()

for (const line of lines) {
  const [month, partyRaw, domain, mentionsStr] = line.split(',')
  const party = PARTY_MAP[partyRaw]
  if (!party || !domain) continue
  const mentions = Number(mentionsStr)
  allMonths.add(month)
  if (!raw[domain]) raw[domain] = {}
  if (!raw[domain][party]) raw[domain][party] = {}
  raw[domain][party][month] = (raw[domain][party][month] || 0) + mentions
}

const months = [...allMonths].sort()

// Gesamtmenge pro Domain
const domainTotals = {}
for (const [domain, parties] of Object.entries(raw)) {
  domainTotals[domain] = Object.values(parties)
    .flatMap(m => Object.values(m))
    .reduce((s, n) => s + n, 0)
}

// Top 30 Domains gesamt (für "byDomain"-Ansicht)
const top30Domains = Object.entries(domainTotals)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .map(([domain]) => domain)

// byParty: pro Partei Top 10 Domains mit Monats-Breakdown
const byParty = {}
for (const party of PARTIES) {
  const domainMentions = {}
  for (const [domain, parties] of Object.entries(raw)) {
    const total = Object.values(parties[party] ?? {}).reduce((s, n) => s + n, 0)
    if (total > 0) domainMentions[domain] = total
  }
  const top10 = Object.entries(domainMentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  byParty[party] = top10.map(([domain, total]) => ({
    domain,
    total,
    group: groupFor(domain),
    byMonth: months.reduce((acc, m) => {
      const v = raw[domain]?.[party]?.[m] ?? 0
      if (v > 0) acc[m] = v
      return acc
    }, {}),
  }))
}

// byDomain: Top 30 Domains mit Parteianteilen pro Monat
const byDomain = {}
for (const domain of top30Domains) {
  const partyData = {}
  for (const party of PARTIES) {
    const total = Object.values(raw[domain]?.[party] ?? {}).reduce((s, n) => s + n, 0)
    if (total > 0) partyData[party] = {
      total,
      byMonth: months.reduce((acc, m) => {
        const v = raw[domain]?.[party]?.[m] ?? 0
        if (v > 0) acc[m] = v
        return acc
      }, {}),
    }
  }
  byDomain[domain] = {
    total: domainTotals[domain],
    group: groupFor(domain),
    parties: partyData,
  }
}

const output = {
  meta: {
    months,
    parties: PARTIES,
    top30Domains,
    mediaGroups: MEDIA_GROUPS,
    generatedAt: new Date().toISOString(),
    sourceNote: 'GDELT Web NGrams 3.0 via BigQuery, deutschsprachige Quellen, Jan 2025–Jun 2026',
    caveat: 'Rohe Erwähnungshäufigkeit, nicht redaktionelle Relevanz. Mediengruppen wie Ippen Digital betreiben viele Domains mit geteiltem Content.',
  },
  byParty,
  byDomain,
}

writeFileSync(OUT, JSON.stringify(output), 'utf-8')
console.log(`✓ ${OUT}`)
console.log(`  ${months.length} Monate · ${Object.keys(byParty).length} Parteien · ${top30Domains.length} Top-Domains`)
for (const party of PARTIES) {
  const top3 = byParty[party].slice(0,3).map(d => d.domain).join(', ')
  console.log(`  ${party}: ${top3}`)
}
