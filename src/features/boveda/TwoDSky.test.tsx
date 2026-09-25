import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STARS } from './starfield'
import { projectStars } from './celestial'
import { TwoDSky } from './components/TwoDSky'

function createFake2dContext() {
  const stats = { amberFills: 0, baseFills: 0 }
  const ctx = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    _fillStyle: '',
    get fillStyle() {
      return this._fillStyle
    },
    set fillStyle(value: string) {
      this._fillStyle = value
      if (value === '#F5B35C') stats.amberFills++
      if (value === '#E8E6E3') stats.baseFills++
    },
  }
  return { ctx, stats }
}

describe('projectStars (pure 2D perspective projection of the dome)', () => {
  it('keeps only stars in front of the view direction (forward dot > 0)', () => {
    const stars: Array<[number, number, number]> = [
      [0, 1, 0], // zenith → center
      [0, 0.5, Math.sqrt(0.75)], // in front
      [0, 0, 1], // exactly on the horizon plane → excluded
      [0.9, 0.1, Math.sqrt(1 - 0.9 ** 2 - 0.1 ** 2)],
    ]
    const points = projectStars(stars, [0, 1, 0], 200, 200)

    expect(points).toHaveLength(3)
  })

  it('projects the zenith star to the exact canvas center', () => {
    const points = projectStars([[0, 1, 0]], [0, 1, 0], 200, 200)

    expect(points[0].x).toBeCloseTo(100, 6)
    expect(points[0].y).toBeCloseTo(100, 6)
    expect(points[0].r).toBeGreaterThan(0)
  })

  it('scales closer stars larger than farther ones (perspective)', () => {
    const stars: Array<[number, number, number]> = [
      [0, 1, 0], // depth 1
      [0, 0.5, Math.sqrt(0.75)], // depth 0.5 → smaller screen scale
    ]
    const points = projectStars(stars, [0, 1, 0], 200, 200)

    expect(points[1].r).toBeGreaterThan(points[0].r)
  })

  it('flags the golden indices for amber tinting', () => {
    const stars: Array<[number, number, number]> = [
      [0, 1, 0],
      [0.5, 0.5, Math.sqrt(0.5)],
      [0.6, 0.8, 0],
    ]
    const points = projectStars(stars, [0.5, 0.5, Math.sqrt(0.5)], 200, 200, new Set([1]))

    expect(points).toHaveLength(3)
    expect(points[1].golden).toBe(true)
    expect(points[0].golden).toBe(false)
    expect(points[2].golden).toBe(false)
  })

  it('projects the real SAME starfield the 3D dome uses', () => {
    const visible = STARS.filter(([, y]) => y > 0)
    const points = projectStars(STARS, [0, 1, 0], 300, 150)

    expect(points.length).toBeGreaterThan(1000)
    expect(points).toHaveLength(visible.length)
    for (const point of points) {
      // perspective projection legitimately leaves some stars off-canvas;
      // the canvas clips them — every star must stay finite
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
      expect(Number.isFinite(point.r)).toBe(true)
    }
  })
})

describe('TwoDSky', () => {
  let fakeCtx: ReturnType<typeof createFake2dContext>

  beforeEach(() => {
    fakeCtx = createFake2dContext()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeCtx.ctx as unknown as RenderingContext,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('paints the starfield onto the 2D canvas on mount', () => {
    render(<TwoDSky date="2026-09-21" golden />)

    expect(screen.getByTestId('two-d-sky')).toBeInTheDocument()
    // ~half of the 4,000 stars sit in front of the view direction
    const arcCalls = (fakeCtx.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length
    expect(arcCalls).toBeGreaterThan(1000)
    expect(fakeCtx.ctx.fill).toHaveBeenCalledTimes(arcCalls)
  })

  it('draws base stars plus amber fills for the golden selection', () => {
    render(<TwoDSky date="2026-09-21" golden />)

    expect(fakeCtx.stats.baseFills).toBeGreaterThan(1000)
    expect(fakeCtx.stats.amberFills).toBeGreaterThanOrEqual(24)
  })

  it('draws no amber when the selected night is not golden', () => {
    render(<TwoDSky date="2026-09-14" golden={false} />)

    expect(fakeCtx.stats.baseFills).toBeGreaterThan(0)
    expect(fakeCtx.stats.amberFills).toBe(0)
  })

  it('survives a missing 2D context (jsdom stub) without painting', () => {
    vi.restoreAllMocks()
    render(<TwoDSky />)

    expect(screen.getByTestId('two-d-sky')).toBeInTheDocument()
  })
})