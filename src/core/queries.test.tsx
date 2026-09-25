import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { Memory } from './supabase'
import { distinctDates, isGoldenDate, memoriesForDate, useMemories } from './queries'

// The real core/supabase module throws at import time without env vars, so the
// data layer is mocked at the module boundary — useMemories keeps its real
// TanStack Query wiring while the fake supabase stub returns scripted rows.
const mockState = vi.hoisted(() => ({
  result: { data: null as Memory[] | null, error: null as Error | null },
}))

vi.mock('./supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          order: () => ({
            order: () => Promise.resolve(mockState.result),
          }),
        }),
      }),
    }),
  },
}))

const rows: Memory[] = [
  {
    id: '1',
    date: '2026-09-21',
    title: 'Nuestra noche',
    description: 'Bailamos bajo las estrellas.',
    is_first_kiss: true,
    location: 'La Paz, Bolivia',
    order_index: 0,
    metadata: {},
    created_at: '2026-09-22T01:00:00Z',
  },
  {
    id: '2',
    date: '2026-09-21',
    title: 'Segunda tanda',
    description: 'Otra memoria de la misma noche.',
    is_first_kiss: false,
    location: 'La Paz, Bolivia',
    order_index: 1,
    metadata: {},
    created_at: '2026-09-22T01:30:00Z',
  },
  {
    id: '3',
    date: '2026-09-14',
    title: 'Bailando bajo las estrellas',
    description: 'Una noche tranquila.',
    is_first_kiss: false,
    location: 'La Paz, Bolivia',
    order_index: 0,
    metadata: {},
    created_at: '2026-09-15T00:00:00Z',
  },
]

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return wrapper
}

describe('useMemories', () => {
  beforeEach(() => {
    mockState.result = { data: rows, error: null }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns the memories rows ordered by the design query on success', async () => {
    const { result } = renderHook(() => useMemories(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(rows)
  })

  it('surfaces the query error instead of swallowing it', async () => {
    const networkError = new Error('network down')
    mockState.result = { data: null, error: networkError }

    const { result } = renderHook(() => useMemories(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBe(networkError)
  })

  it('returns an empty list when the database has no memories', async () => {
    mockState.result = { data: [], error: null }

    const { result } = renderHook(() => useMemories(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('distinctDates', () => {
  it('dedupes repeated dates preserving the query order (date desc)', () => {
    expect(distinctDates(rows)).toEqual(['2026-09-21', '2026-09-14'])
  })
})

describe('memoriesForDate', () => {
  it('returns only the memories of the requested date, in input order', () => {
    const night = memoriesForDate(rows, '2026-09-21')

    expect(night).toHaveLength(2)
    expect(night.map((m) => m.id)).toEqual(['1', '2'])
  })

  it('returns an empty array for a date with no memories', () => {
    expect(memoriesForDate(rows, '2026-09-06')).toEqual([])
  })
})

describe('isGoldenDate', () => {
  it('is true when ANY memory of that date carries is_first_kiss', () => {
    expect(isGoldenDate(rows, '2026-09-21')).toBe(true)
  })

  it('is false for dates without a first-kiss memory', () => {
    expect(isGoldenDate(rows, '2026-09-14')).toBe(false)
  })

  it('ignores first-kiss flags belonging to other dates', () => {
    const otherGolden: Memory[] = [{ ...rows[2], is_first_kiss: true }]
    expect(isGoldenDate(otherGolden, '2026-09-21')).toBe(false)
  })
})