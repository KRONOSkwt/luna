import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SkyErrorBoundary from './components/SkyErrorBoundary'

// The boundary's job is the fallback swap, not painting stars — probe the
// fallback with a light stub so forwarded props are observable.
vi.mock('./components/TwoDSky', () => ({
  TwoDSky: (props: { date?: string | null; golden?: boolean }) => (
    <div
      data-testid="two-d-sky"
      data-date={props.date ?? ''}
      data-golden={String(Boolean(props.golden))}
    />
  ),
}))

function Bomb(): never {
  throw new Error('webgl context lost')
}

describe('SkyErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to TwoDSky when a child crashes during render — never a black void', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SkyErrorBoundary>
        <Bomb />
      </SkyErrorBoundary>,
    )

    expect(screen.getByTestId('two-d-sky')).toBeInTheDocument()
  })

  it('forwards date and golden to the fallback sky so both fallback paths behave identically', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <SkyErrorBoundary date="2026-09-21" golden>
        <Bomb />
      </SkyErrorBoundary>,
    )

    expect(screen.getByTestId('two-d-sky')).toHaveAttribute('data-date', '2026-09-21')
    expect(screen.getByTestId('two-d-sky')).toHaveAttribute('data-golden', 'true')
  })

  it('renders its children untouched when nothing throws', () => {
    render(
      <SkyErrorBoundary>
        <div>Payload</div>
      </SkyErrorBoundary>,
    )

    expect(screen.getByText('Payload')).toBeInTheDocument()
  })
})