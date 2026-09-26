import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import type { Memory } from './core/supabase'
import App from './App'

// Same module-boundary mock as the slice's other component tests: the real
// core/supabase module throws at import time without env vars.
const mockState = vi.hoisted(() => ({
  rows: [] as Memory[],
  error: null as Error | null,
}))

vi.mock('./core/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          order: () => ({
            order: () =>
              Promise.resolve({ data: mockState.rows, error: mockState.error }),
          }),
        }),
      }),
    }),
  },
}))

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return wrapper
}

describe('App shell', () => {
  it('renders the public dome on the root route', async () => {
    mockState.rows = [
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
    ]

    render(<App />, { wrapper: makeWrapper() })

    expect(
      await screen.findByRole('heading', {
        name: 'Por más noches estrelladas admirando a mi Luna',
      }),
    ).toBeInTheDocument()
  })

  it('renders the dome for unknown paths too (no dead 404)', () => {
    window.history.pushState({}, '', '/ruta-desconocida')

    render(<App />, { wrapper: makeWrapper() })

    expect(
      screen.getByRole('heading', {
        name: 'Por más noches estrelladas admirando a mi Luna',
      }),
    ).toBeInTheDocument()
  })
})