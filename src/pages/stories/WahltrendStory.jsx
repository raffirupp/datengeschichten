import { Link } from 'react-router-dom'
import pollData              from '../../data/polls-bundestag.json'
import houseData             from '../../data/house-effects.json'
import accuracyData          from '../../data/election-accuracy.json'
import leadLagData           from '../../data/lead-lag.json'
import grangerData           from '../../data/granger.json'
import PollSnapshot              from '../../components/PollSnapshot.jsx'
import PollTrendChart            from '../../components/PollTrendChart.jsx'
import HouseEffectsChart         from '../../components/HouseEffectsChart.jsx'
import ElectionAccuracyChart     from '../../components/ElectionAccuracyChart.jsx'
import LeadLagChart              from '../../components/LeadLagChart.jsx'
import GrangerChart              from '../../components/GrangerChart.jsx'
import { colorsFor } from '../../lib/categoryColors.js'

const { meta, polls, trend } = pollData
const catColors = colorsFor('Deutschland')

const Divider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
)

const SectionLabel = ({ children }) => (
  <h2 style={{
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-muted)',
    margin: 0,
  }}>
    {children}
  </h2>
)

const SectionHeading = ({ children }) => (
  <h2 style={{
    fontFamily: 'var(--font-display)',
    fontVariationSettings: '"opsz" 32',
    fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    color: 'var(--color-ink)',
    margin: 0,
  }}>
    {children}
  </h2>
)

export default function WahltrendStory() {
  return (
    <article className="flex flex-col gap-12 max-w-3xl">
      <div>
        <Link to="/" className="no-underline text-sm"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
          ← Zurück
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <span className="text-xs tracking-[.12em] uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: catColors.text }}>
          Wahltrend · Bundestag
        </span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontVariationSettings: '"opsz" 48',
          fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
          fontWeight: 600, lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--color-ink)', margin: 0,
        }}>
          Wahltrend zur Bundestagswahl
        </h1>
        <p className="text-base leading-relaxed max-w-prose"
          style={{ color: 'var(--color-muted)' }}>
          Alle Umfragen seit 2019 — geglättet zum Trend, und darunter:
          was die Institute voneinander unterscheidet, wie nah sie bei echten Wahlen lagen,
          wer Trendwenden zuerst erfasst und welche Institute systematisch abweichen.
          Stand: {meta.lastUpdated}.
        </p>
      </header>

      {/* ── 1: Sonntagsfrage ── */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <SectionLabel>Aktuell</SectionLabel>
          <PollSnapshot trend={trend} parties={meta.parties} />
        </div>
        <div className="flex flex-col gap-3">
          <SectionLabel>Verlauf · 7 Jahre</SectionLabel>
          <PollTrendChart polls={polls} trend={trend} parties={meta.parties} />
        </div>
      </section>

      <Divider />

      {/* ── 2: House Effects ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Institute im Vergleich</SectionLabel>
          <SectionHeading>Wer schätzt wen wie ein?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}>
            Manche Institute liegen im Vergleich zu den anderen systematisch höher
            oder niedriger — das nennt man House-Effects. Jeder Wert zeigt, um wie viele
            Prozentpunkte ein Institut vom gleichzeitigen Durchschnitt der anderen abweicht.
            Das ist <em>kein</em> Wahrheitsurteil: ob der Konsens stimmt, zeigt erst das
            Wahlergebnis — dazu gleich mehr.
          </p>
        </header>
        <HouseEffectsChart data={houseData} />
      </section>

      <Divider />

      {/* ── 3: Wahlgenauigkeit ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Vergleich mit echten Wahlergebnissen</SectionLabel>
          <SectionHeading>Wie nah lagen die Institute bei der Wahl?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}>
            Hier der externe Prüfstein: letzte Umfrage je Institut vor der Wahl gegen
            das amtliche Ergebnis. Wer lag wie weit daneben, und in welche Richtung?
            Daten für 2017, 2021 und 2025 — aufbereitet aus wahlrecht.de.
          </p>
        </header>
        <ElectionAccuracyChart data={accuracyData} />
      </section>

      <Divider />

      {/* ── 4: Lead/Lag (Cross-Korrelation) ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Reaktionsgeschwindigkeit · Methode 1</SectionLabel>
          <SectionHeading>Wer reagiert zuerst auf Stimmungsänderungen?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}>
            Cross-Korrelation der wöchentlichen Erstdifferenzen: bei welchem zeitlichen Versatz
            stimmen die Änderungen eines Instituts am besten mit dem Gesamt-Konsens überein?
            Positive Werte = Institut läuft vor, negative = folgt nach. Ausgefüllte Punkte
            = hinreichend belegt (r ≥ 0,3, n ≥ 20); Umrisse = wenig Daten.
          </p>
        </header>
        <LeadLagChart data={leadLagData} />
      </section>

      <Divider />

      {/* ── 4b: Granger-Kausalität ── */}
      <section className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <SectionLabel>Reaktionsgeschwindigkeit · Methode 2</SectionLabel>
          <SectionHeading>Welches Institut bewegt den Konsens — und welches folgt ihm?</SectionHeading>
          <p className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}>
            Statt einzelne Trendwenden zu zählen, stelle ich eine statistischere Frage: Sagen
            die vergangenen Werte eines Instituts den künftigen Konsens vorher — über das
            hinaus, was der Konsens selbst vorhersagt? Das nennt sich{' '}
            <em>Granger-Kausalität</em>. Ich berechne zwei Richtungen: Institut → Konsens
            (Vorlauf-Signal) und Konsens → Institut (Institut folgt). Gemessen wird auf
            wöchentlichen Erstdifferenzen mit Lag 2, VAR(2)-Modell.
          </p>
          <p className="text-sm leading-relaxed max-w-prose"
            style={{ color: 'var(--color-muted)' }}>
            Entscheidend: Der Konsens wird hier ohne das getestete Institut berechnet
            (Leave-One-Out). Damit fällt der Frequenz-Bias weg, der die frühere Analyse
            verzerrt hatte — häufig publizierende Institute erschienen als "Vorreiter",
            weil sie den Konsens schlicht mitgebaut hatten.
          </p>
        </header>
        <GrangerChart data={grangerData} />

        {/* Methodische Einordnung */}
        <div className="flex flex-col gap-3 pl-4 py-2 max-w-prose"
          style={{ borderLeft: '2px solid var(--color-rule)' }}>
          <span className="text-xs tracking-[.12em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>
            Was die Ergebnisse bedeuten
          </span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>Forsa und INSA sind bidirektional:</strong>{' '}
            Ihr Signal läuft dem Konsens voraus — aber der Konsens greift auch auf sie zurück.
            Das ist kein Widerspruch: Wer jede Woche publiziert, ist so stark im Konsens
            vertreten, dass Bewegungen gegenseitig sind. Statistisch nicht von Endogenität
            zu trennen.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>Die meisten Institute folgen dem Konsens:</strong>{' '}
            Sie bewegen sich, nachdem der Gesamtmarkt bereits gedreht hat. Das ist kein
            Qualitätsmangel — es zeigt eher, dass der Konsens robuster ist als einzelne
            Messwerte.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>Granger ≠ echte Kausalität:</strong>{' '}
            Der Test misst Vorhersagekraft in der Vergangenheit, nicht kausale Mechanismen.
            Gemeinsame Ursachen (z.B. ein großes politisches Ereignis) können beide Serien
            gleichzeitig bewegen und zu scheinbaren Granger-Signalen führen.
          </p>
        </div>
      </section>

      <footer className="text-xs pt-4" style={{
        borderTop: '1px solid var(--color-rule)',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-muted)',
      }}>
        Quellen:{' '}
        <a href="https://dawum.de" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
          DAWUM (dawum.de)
        </a>
        {' '}(ODbL){' · '}
        <a href="https://www.wahlrecht.de/umfragen/" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-muted)', textDecoration: 'underline' }}>
          wahlrecht.de
        </a>
      </footer>
    </article>
  )
}
