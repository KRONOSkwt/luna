/**
 * Design tokens — single source of truth for the visual system.
 * Tailwind (tailwind.config.ts) and all components import from here.
 */
export const colors = {
  /** Obsidiana — night-sky base color. */
  obsidiana: '#07080A',
  /** Ámbar — golden accent (first-kiss treatment). */
  ambar: '#F5B35C',
  /** Polvo Estelar — off-white foreground. */
  polvoEstelar: '#E8E6E3',
} as const

/** 4px spacing base — all rhythm derives from this unit. */
export const spacing = {
  base: 4,
} as const
