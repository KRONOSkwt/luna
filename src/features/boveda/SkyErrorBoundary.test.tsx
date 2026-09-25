import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SkyErrorBoundary from './components/SkyErrorBoundary'

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

  it('renders its children untouched when nothing throws', () => {
    render(
      <SkyErrorBoundary>
        <div>Payload</div>
      </SkyErrorBoundary>,
    )

    expect(screen.getByText('Payload')).toBeInTheDocument()
  })
})