import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  it('renders the Observatorio heading in Spanish', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /el observatorio/i }),
    ).toBeInTheDocument()
  })
})