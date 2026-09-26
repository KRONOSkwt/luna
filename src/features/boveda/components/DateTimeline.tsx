import { formatDate } from '../../../shared/dateFormat'
import { colors } from '../../../shared/tokens'

/**
 * Horizontal scroll-snap row of calendar nights. Dedupes its input (the page
 * already passes distinct dates) and keeps descending order — YYYY-MM-DD
 * string sort is calendar-correct.
 */
export function DateTimeline({
  dates,
  selected,
  onSelect,
}: {
  dates: string[]
  selected: string | null
  onSelect: (date: string) => void
}) {
  const uniqueDates = [...new Set(dates)].sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto px-4" role="list">
      {uniqueDates.map((date) => {
        const isSelected = selected === date
        return (
          <button
            key={date}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(date)}
            className="shrink-0 snap-start whitespace-nowrap rounded-full border px-3 py-1 font-mono text-sm transition-colors"
            style={{
              borderColor: isSelected ? colors.ambar : 'rgba(232, 230, 227, 0.25)',
              color: isSelected ? colors.obsidiana : colors.polvoEstelar,
              backgroundColor: isSelected ? colors.ambar : 'transparent',
            }}
          >
            {formatDate(date)}
          </button>
        )
      })}
    </div>
  )
}