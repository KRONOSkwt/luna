import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { Memory } from '../../core/supabase'
import { BovedaPage } from './BovedaPage'

// The real core/supabase module throws at import time without env vars, so the
// data layer is mocked at the module boundary (same pattern as queries.test).
// `rows`/`error` script the query response; `gate` controls the loading state.
const mockState = vi.hoisted(() => ({
  rows: [] as Memory[],
  error: null as Error | null,
  gate: null as Promise<void> | null,
}))

vi.mock('../../core/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          order: () => ({
            order: () => {
              const respond = () => ({ data: mockState.rows, error: mockState.error })
              return mockState.gate ? mockState.gate.then(respond) : Promise.resolve(respond())
            },
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

function renderPage() {
  return render(<BovedaPage />, { wrapper: makeWrapper() })
}

beforeEach(() => {
  mockState.rows = rows
  mockState.error = null
  mockState.gate = null
})

afterEach(() => {
  vi.restoreAllMocks()
  if (!('vibrate' in navigator)) {
    Object.defineProperty(navigator, 'vibrate', { value: () => true, configurable: true })
  }
})

describe('BovedaPage', () => {
  it('defaults to the most recent night and renders its cards', async () => {
    renderPage()

    expect(
      await screen.findByText('Nuestra noche'),
    ).toBeInTheDocument()
    expect(screen.getByText('Segunda tanda')).toBeInTheDocument()
    // the sorted timeline shows both nights
    const chips = screen.getAllByRole('button')
    expect(chips).toHaveLength(2)
  })

  it('switches the stacked cards when a different night is tapped', async () => {
    renderPage()
    await screen.findByText('Nuestra noche')

    fireEvent.click(screen.getByRole('button', { name: '14.09.2026' }))

    expect(await screen.findByText('Bailando bajo las estrellas')).toBeInTheDocument()
    expect(screen.queryByText('Nuestra noche')).not.toBeInTheDocument()
  })

  it('stacks the night memories in query order (order_index asc)', async () => {
    renderPage()
    await screen.findByText('Nuestra noche')

    const stack = screen.getByTestId('memory-stack')
    const articles = stack.querySelectorAll('article')
    expect(articles).toHaveLength(2)
    expect(articles[0]).toHaveTextContent('Nuestra noche')
    expect(articles[1]).toHaveTextContent('Segunda tanda')
  })

  it('shows the first-kiss badge and vibrates on the golden night', async () => {
    const vibrate = vi.spyOn(navigator, 'vibrate').mockImplementation(() => true)
    renderPage()

    expect(await screen.findByText('[ NUESTRO PRIMER BESO ]')).toBeInTheDocument()
    expect(vibrate).toHaveBeenCalledWith([40, 60, 40])
  })

  it('does not vibrate — and does not break — when the device lacks vibrate', async () => {
    delete (navigator as { vibrate?: unknown }).vibrate
    renderPage()

    expect(await screen.findByText('[ NUESTRO PRIMER BESO ]')).toBeInTheDocument()
  })

  it('shows the empty state when there are no memories yet', async () => {
    mockState.rows = []

    renderPage()

    expect(await screen.findByText('aún no hay recuerdos')).toBeInTheDocument()
  })

  it('shows skeletons while loading, then the data', async () => {
    let openGate!: () => void
    mockState.gate = new Promise((resolve) => {
      openGate = resolve
    })

    renderPage()

    expect(screen.getAllByTestId('memory-skeleton').length).toBeGreaterThan(0)

    await act(async () => {
      openGate()
    })

    expect(await screen.findByText('Nuestra noche')).toBeInTheDocument()
  })

  it('surfaces the error state and recovers through Reintentar', async () => {
    mockState.error = new Error('network down')

    renderPage()

    expect(
      await screen.findByText('No pudimos cargar las estrellas'),
    ).toBeInTheDocument()

    mockState.error = null
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Nuestra noche')).toBeInTheDocument()
  })

  it('falls back to the 2D sky when WebGL is unavailable', async () => {
    renderPage()

    expect(await screen.findByTestId('two-d-sky')).toBeInTheDocument()
  })
})