import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import * as THREE from 'three'

import { DOME_POINTS_MATERIAL } from '../celestial'
import { CelestialCanvas } from './CelestialCanvas'

// The real @react-three/fiber Canvas needs WebGL, which jsdom does not
// provide. The mock renders the props the component hands to R3F as data
// attributes on a probe div so framing (frameloop) and quality (dpr) are
// observable straight from the DOM, while children still render — the
// material contract is asserted on the (custom-element) pointsMaterial node.
const pauseState = vi.hoisted(() => ({ paused: false }))

vi.mock('@react-three/fiber', () => ({
  Canvas: (props: Record<string, unknown>) => (
    <div
      data-testid="mock-canvas"
      data-frameloop={String(props.frameloop)}
      data-dpr={JSON.stringify(props.dpr)}
    >
      {props.children as ReactNode}
    </div>
  ),
  useFrame: () => {},
}))

vi.mock('../usePauseOnHidden', () => ({
  usePauseOnHidden: () => pauseState.paused,
}))

describe('CelestialCanvas', () => {
  beforeEach(() => {
    pauseState.paused = false
    // object-valued props (geometry, position, map) on unknown JSX elements
    // are skipped by React with a console.error noise — silence it here
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const material = (canvas: HTMLElement) => canvas.querySelector('pointsMaterial')

  it('keeps the render loop always running and pauses it when the tab is hidden', () => {
    render(<CelestialCanvas date="2026-09-21" golden={false} />)
    expect(screen.getByTestId('mock-canvas')).toHaveAttribute('data-frameloop', 'always')

    pauseState.paused = true
    render(<CelestialCanvas date="2026-09-21" golden={false} />)
    expect(screen.getAllByTestId('mock-canvas')[1]).toHaveAttribute('data-frameloop', 'never')
  })

  it('caps the device pixel ratio at 2 on pointer-less devices and 1.5 on touch devices', () => {
    vi.stubGlobal('navigator', { ...navigator, maxTouchPoints: 0 })
    render(<CelestialCanvas date="2026-09-21" golden={false} />)
    expect(screen.getByTestId('mock-canvas')).toHaveAttribute('data-dpr', '[1,2]')

    vi.stubGlobal('navigator', { ...navigator, maxTouchPoints: 2 })
    render(<CelestialCanvas date="2026-09-21" golden={false} />)
    expect(screen.getAllByTestId('mock-canvas')[1]).toHaveAttribute('data-dpr', '[1,1.5]')
  })

  it('configures the star dome material with additive blending, 0.9 opacity and 1.2 size', () => {
    render(<CelestialCanvas date="2026-09-21" golden={false} />)

    const dome = material(screen.getByTestId('mock-canvas'))
    expect(dome).not.toBeNull()
    // string/number props reach the custom element as attributes...
    expect(dome?.getAttribute('blending')).toBe(String(THREE.AdditiveBlending))
    expect(dome?.getAttribute('opacity')).toBe('0.9')
    expect(dome?.getAttribute('size')).toBe('1.2')
    // ...booleans are dropped by react-dom on custom elements, so the full
    // tuple (transparent, sizeAttenuation, vertexColors, depthWrite) is pinned
    // by the DOME_POINTS_MATERIAL seam the component spreads onto the element.
    expect(DOME_POINTS_MATERIAL).toEqual({
      size: 1.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  })

  it('disposes the dome geometry and the golden glow texture on unmount', () => {
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose')
    const textureDispose = vi.spyOn(THREE.CanvasTexture.prototype, 'dispose')

    const { unmount } = render(<CelestialCanvas date="2026-09-21" golden />)
    unmount()

    expect(geometryDispose).toHaveBeenCalledTimes(1)
    expect(textureDispose).toHaveBeenCalledTimes(1)
  })
})