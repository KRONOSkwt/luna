import { useQuery } from '@tanstack/react-query'
import type { Memory } from './supabase'
import { memoriesKey } from './queryClient'
import { supabase } from './supabase'

/**
 * Shared read model for the memories — binds the same ['memories'] key as the
 * admin mutations so both slices stay in sync without cross-slice imports.
 * ONE ordered query powers the timeline AND the stacked cards:
 * date desc, order_index asc, created_at asc.
 */
export function useMemories() {
  return useQuery({
    queryKey: memoriesKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Memory[]
    },
  })
}

/** Distinct calendar nights in query order (already sorted date desc). */
export function distinctDates(rows: Memory[]): string[] {
  return [...new Set(rows.map((memory) => memory.date))]
}

/** All memories of one night, preserving the query order (order_index asc). */
export function memoriesForDate(rows: Memory[], date: string): Memory[] {
  return rows.filter((memory) => memory.date === date)
}

/** A night is golden if ANY of its memories carries is_first_kiss. */
export function isGoldenDate(rows: Memory[], date: string): boolean {
  return rows.some((memory) => memory.date === date && memory.is_first_kiss)
}