import type { Memory } from '../../../core/supabase'
import { formatDate } from '../../../shared/dateFormat'
import { colors } from '../../../shared/tokens'

const BADGE = '[ NUESTRO PRIMER BESO ]'

/**
 * One memory of a night: mono date, editorial title, the story. The badge
 * marks the first-kiss memory AND only on the golden night.
 */
export function MemoryCard({ memory, golden }: { memory: Memory; golden: boolean }) {
  const showBadge = golden && memory.is_first_kiss

  return (
    <article className="rounded-2xl border border-[rgba(232,230,227,0.14)] bg-[rgba(7,8,10,0.85)] p-4 backdrop-blur">
      <header className="mb-2 flex items-center justify-between gap-3">
        <time className="font-mono text-xs tracking-wide" style={{ color: colors.polvoEstelar }}>
          {formatDate(memory.date)}
        </time>
        {showBadge && (
          <span
            data-testid="first-kiss-badge"
            className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
            style={{ borderColor: colors.ambar, color: colors.ambar }}
          >
            {BADGE}
          </span>
        )}
      </header>
      <h3
        className="font-serif text-lg leading-snug"
        style={{ color: colors.polvoEstelar }}
      >
        {memory.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'rgba(232, 230, 227, 0.75)' }}>
        {memory.description}
      </p>
    </article>
  )
}