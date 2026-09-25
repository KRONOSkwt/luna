import { describe, expect, it } from 'vitest'
import { STAR_COUNT } from './starfield'
import { STAR_RADIUS, buildStarColors, meanDirection } from './celestial'

describe('buildStarColors', () => {
  it('produces one RGB triple per star', () => {
    const colors = buildStarColors(new Set())

    expect(colors).toHaveLength(STAR_COUNT * 3)
  })

  it('uses the base star color by default', () => {
    const colors = buildStarColors(new Set())

    // #E8E6E3 → 0.9098, 0.9020, 0.8902
    expect(colors[0]).toBeCloseTo(0.9098, 4)
    expect(colors[1]).toBeCloseTo(0.9020, 4)
    expect(colors[2]).toBeCloseTo(0.8902, 4)
  })

  it('tints only the golden indices amber, leaving the rest untouched', () => {
    const colors = buildStarColors(new Set([7, 99]))

    // #F5B35C → 0.9608, 0.7020, 0.3608
    for (const index of [7, 99]) {
      const offset = index * 3
      expect(colors[offset]).toBeCloseTo(0.9608, 4)
      expect(colors[offset + 1]).toBeCloseTo(0.7020, 4)
      expect(colors[offset + 2]).toBeCloseTo(0.3608, 4)
    }

    // any star outside the golden set keeps the base color
    const untouched = 3 * 3
    expect(colors[untouched]).toBeCloseTo(0.9098, 4)
    expect(colors[untouched + 1]).toBeCloseTo(0.9020, 4)
    expect(colors[untouched + 2]).toBeCloseTo(0.8902, 4)
  })
})

describe('meanDirection', () => {
  it('ends at a unit vector for three orthogonal directions', () => {
    const mean = meanDirection([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ])

    expect(Math.hypot(mean[0], mean[1], mean[2])).toBeCloseTo(1, 6)
    expect(mean[0]).toBeCloseTo(1 / Math.sqrt(3), 6)
    expect(mean[1]).toBeCloseTo(1 / Math.sqrt(3), 6)
    expect(mean[2]).toBeCloseTo(1 / Math.sqrt(3), 6)
  })

  it('is the same direction for an already unit input', () => {
    const mean = meanDirection([[0, 0.6, 0.8]])

    expect(mean[0]).toBeCloseTo(0, 6)
    expect(mean[1]).toBeCloseTo(0.6, 6)
    expect(mean[2]).toBeCloseTo(0.8, 6)
  })

  it('falls back to the zenith when directions cancel out', () => {
    const mean = meanDirection([
      [1, 0, 0],
      [-1, 0, 0],
    ])

    expect(mean).toEqual([0, 1, 0])
  })
})

describe('STAR_RADIUS (design W1 pin)', () => {
  it('places the 3D dome at radius 90, not radius 1', () => {
    expect(STAR_RADIUS).toBe(90)
  })
})