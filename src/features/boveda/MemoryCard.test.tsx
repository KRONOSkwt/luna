import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Memory } from '../../core/supabase'
import { MemoryCard } from './components/MemoryCard'

function memory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: '1',
    date: '2026-09-21',
    title: 'Nuestra noche',
    description: 'Bailamos bajo las estrellas.',
    is_first_kiss: false,
    location: 'La Paz, Bolivia',
    order_index: 0,
    metadata: {},
    created_at: '2026-09-22T00:00:00Z',
    ...overrides,
  }
}

describe('MemoryCard', () => {
  it('shows the first-kiss badge on the golden night', () => {
    render(<MemoryCard memory={memory({ is_first_kiss: true })} golden />)

    expect(screen.getByText('[ NUESTRO PRIMER BESO ]')).toBeInTheDocument()
  })

  it('hides the badge for a non-first-kiss memory even on a golden night', () => {
    render(<MemoryCard memory={memory()} golden />)

    expect(screen.queryByText('[ NUESTRO PRIMER BESO ]')).not.toBeInTheDocument()
  })

  it('hides the badge when the night itself is not golden', () => {
    render(<MemoryCard memory={memory({ is_first_kiss: true })} golden={false} />)

    expect(screen.queryByText('[ NUESTRO PRIMER BESO ]')).not.toBeInTheDocument()
  })

  it('renders date, title and story', () => {
    render(<MemoryCard memory={memory()} golden={false} />)

    expect(screen.getByText('21.09.2026')).toBeInTheDocument()
    expect(screen.getByText('Nuestra noche')).toBeInTheDocument()
    expect(screen.getByText('Bailamos bajo las estrellas.')).toBeInTheDocument()
  })
})