import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateTimeline } from './components/DateTimeline'

describe('DateTimeline', () => {
  it('dedupes repeated nights and shows chips in descending date order', () => {
    render(
      <DateTimeline
        dates={['2026-09-21', '2026-09-14', '2026-09-21']}
        selected="2026-09-21"
        onSelect={() => {}}
      />,
    )

    const chips = screen.getAllByRole('button')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveTextContent('21.09.2026')
    expect(chips[1]).toHaveTextContent('14.09.2026')
  })

  it('marks the selected night with aria-pressed', () => {
    render(
      <DateTimeline dates={['2026-09-21', '2026-09-14']} selected="2026-09-14" onSelect={() => {}} />,
    )

    expect(screen.getByRole('button', { name: '14.09.2026' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: '21.09.2026' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reports the tapped night through onSelect', () => {
    const onSelect = vi.fn()
    render(
      <DateTimeline dates={['2026-09-21', '2026-09-14']} selected="2026-09-21" onSelect={onSelect} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '14.09.2026' }))

    expect(onSelect).toHaveBeenCalledWith('2026-09-14')
  })

  it('renders without dates', () => {
    const { container } = render(
      <DateTimeline dates={[]} selected={null} onSelect={() => {}} />,
    )

    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
  })
})