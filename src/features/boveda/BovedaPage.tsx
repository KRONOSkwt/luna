import { useEffect, useMemo, useRef, useState } from 'react'
import { distinctDates, isGoldenDate, memoriesForDate, useMemories } from '../../core/queries'
import { HeroHeader } from '../../shared/components/HeroHeader'
import { CelestialCanvas } from './components/CelestialCanvas'
import { DateTimeline } from './components/DateTimeline'
import { FirstKissBloom } from './components/FirstKissBloom'
import { MemoryCard } from './components/MemoryCard'
import SkyErrorBoundary from './components/SkyErrorBoundary'
import { TwoDSky } from './components/TwoDSky'
import { detectWebGL } from './webgl'

/**
 * The public dome: hero, sky, stacked memories of the selected night and the
 * timeline. The canvas NEVER gates data: TwoDSky (WebGL null) and the sky are
 * rendered first, cards follow the query. Golden night → bloom + badge + a
 * gentle vibration (guarded for devices without it).
 */
export function BovedaPage() {
  const { data, isLoading, isError, refetch } = useMemories()
  const rows = useMemo(() => data ?? [], [data])
  const dates = useMemo(() => distinctDates(rows), [rows])

  // Derived selection: the most recent night defaults until the user picks
  // another; a selection that vanishes (data refresh) falls back to the most
  // recent — no effect needed, so render always sees a valid date.
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const selectedDate =
    pickedDate !== null && dates.includes(pickedDate) ? pickedDate : (dates[0] ?? null)

  const [hasWebGL] = useState(() => detectWebGL())

  const golden = selectedDate !== null && isGoldenDate(rows, selectedDate)
  const memories = selectedDate ? memoriesForDate(rows, selectedDate) : []

  // Single soft vibration each time a golden night becomes selected.
  const wasGolden = useRef(false)
  useEffect(() => {
    if (golden && !wasGolden.current && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40])
    }
    wasGolden.current = golden
  }, [golden])

  const sky = hasWebGL ? (
    <SkyErrorBoundary>
      <CelestialCanvas date={selectedDate} golden={golden} />
    </SkyErrorBoundary>
  ) : (
    <TwoDSky date={selectedDate} golden={golden} />
  )

  return (
    <div className="relative min-h-svh overflow-hidden bg-obsidiana text-polvo-estelar">
      {golden && <FirstKissBloom />}

      <div className="relative z-10">
        <HeroHeader />

        <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-16">
          <div className="relative h-[40vh] min-h-56 w-full">{sky}</div>

          {isLoading && (
            <div data-testid="memory-stack" className="flex flex-col gap-4">
              <div data-testid="memory-skeleton" className="h-28 animate-pulse rounded-2xl bg-[rgba(232,230,227,0.08)]" />
              <div data-testid="memory-skeleton" className="h-28 animate-pulse rounded-2xl bg-[rgba(232,230,227,0.08)]" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm" style={{ color: 'rgba(232, 230, 227, 0.75)' }}>
                No pudimos cargar las estrellas
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-full border border-ambar px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ambar"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <p className="py-10 text-center text-sm" style={{ color: 'rgba(232, 230, 227, 0.75)' }}>
              aún no hay recuerdos
            </p>
          )}

          {!isLoading && !isError && dates.length > 0 && (
            <>
              <div data-testid="memory-stack" className="flex flex-col gap-4">
                {memories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} golden={golden} />
                ))}
              </div>
              <DateTimeline dates={dates} selected={selectedDate} onSelect={setPickedDate} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}