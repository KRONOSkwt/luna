import { describe, expect, it } from 'vitest'
import { CONSTANT_SEED, generateStarPositions } from '../../core/astronomy'
import { STAR_COUNT, STARS, nearestStarsTo, starDirectionForDate } from './starfield'

describe('STARS singleton (single source of truth for the whole sky)', () => {
  it('keeps the dome within the 4,000-point budget', () => {
    expect(STAR_COUNT).toBe(4000)
    expect(STARS).toHaveLength(4000)
  })

  it('holds only unit-length upper-hemisphere vectors (+Y)', () => {
    for (const [x, y, z] of STARS) {
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 8)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x).toBeGreaterThanOrEqual(-1)
      expect(x).toBeLessThanOrEqual(1)
    }
  })

  it('is seeded with the constant seed so 3D and 2D skies are identical', () => {
    const regenerated = generateStarPositions(STAR_COUNT, CONSTANT_SEED)

    expect(STARS).toEqual(regenerated)
  })
})

describe('nearestStarsTo', () => {
  it('returns exactly n distinct indices ranked by dot product', () => {
    const indices = nearestStarsTo([0, 1, 0], 24)

    expect(indices).toHaveLength(24)
    expect(new Set(indices).size).toBe(24)
  })

  it('ranks the returned indices so the top dot is the maximum', () => {
    const indices = nearestStarsTo([0, 1, 0], 24)
    const dotOf = (i: number) =>
      STARS[i][0] * 0 + STARS[i][1] * 1 + STARS[i][2] * 0
    const maxDot = Math.max(...STARS.map(([, y]) => y))

    expect(dotOf(indices[0])).toBeCloseTo(maxDot, 9)
    // strictly descending ranking across the returned slice
    for (let i = 1; i < indices.length; i++) {
      expect(dotOf(indices[i - 1])).toBeGreaterThanOrEqual(dotOf(indices[i]))
    }
  })

  it('returns an empty selection when n is 0', () => {
    expect(nearestStarsTo([0, 1, 0], 0)).toEqual([])
  })
})

describe('starDirectionForDate (zenith star of a night)', () => {
  it('returns a unit vector for any valid date', () => {
    const [x, y, z] = starDirectionForDate('2026-09-21')

    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9)
  })

  it('points at La Paz latitude: +Y = sin(−16.5°) for every night', () => {
    const [, y] = starDirectionForDate('2026-09-21')

    expect(y).toBeCloseTo(Math.sin((-16.5 * Math.PI) / 180), 9)
  })

  it('rotates with the date (sidereal time drift between nights)', () => {
    const first = starDirectionForDate('2026-09-21')
    const second = starDirectionForDate('2026-09-14')

    expect(first).not.toEqual(second)
  })
})