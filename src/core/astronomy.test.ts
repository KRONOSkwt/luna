import { describe, expect, it } from 'vitest'
import {
  CONSTANT_SEED,
  LA_PAZ,
  DateInputError,
  dateToJulianDay,
  generateStarPositions,
  greenwichSiderealTime,
  localSiderealTime,
  mulberry32,
  parseDateParts,
  raDecToUnitVector,
  stellarOrientation,
} from './astronomy'

describe('dateToJulianDay (Fliegel–Van Flandern, JD at 04:00 UTC)', () => {
  it('matches the J2000 epoch anchor (2000-01-01 at 00:00 = JD 2451544.5)', () => {
    // 2000-01-01 00:00 UTC is JD 2451544.5; +4/24 h → 04:00 UTC
    expect(dateToJulianDay('2000-01-01')).toBeCloseTo(2451544.5 + 4 / 24, 6)
  })

  it('computes a known modern calendar date at La Paz midnight (UTC-4, no DST)', () => {
    // 2026-09-21 00:00 UTC = JD 2461304.5 (verified from epoch arithmetic); +4/24 h
    expect(dateToJulianDay('2026-09-21')).toBeCloseTo(2461304.5 + 4 / 24, 6)
  })
})

describe('greenwichSiderealTime (Meeus ch.12)', () => {
  it('hits the J2000 anchor: JD 2451545.0 → ≈ 18.697374558 h', () => {
    expect(greenwichSiderealTime(2451545.0)).toBeCloseTo(18.697374558, 6)
  })
})

describe('localSiderealTime', () => {
  it('yields ≈ −4.54 h for La Paz longitude −68.1° at GMST 0 h', () => {
    expect(localSiderealTime(0, LA_PAZ.lon)).toBeCloseTo(-4.54, 6)
  })

  it('shifts a non-zero GMST by the same longitude offset', () => {
    expect(localSiderealTime(18.697374558, -68.1)).toBeCloseTo(18.697374558 - 4.54, 6)
  })

  it('wraps values past 24 h back into the same day range', () => {
    expect(localSiderealTime(30, 0)).toBeCloseTo(6, 6)
  })
})

describe('stellarOrientation (zenith trick)', () => {
  it('collapses orientation to dec = observer latitude and ra = local sidereal time', () => {
    const date = '2026-09-21'
    const orientation = stellarOrientation(date)
    const expectedRa = localSiderealTime(
      greenwichSiderealTime(dateToJulianDay(date)),
      LA_PAZ.lon,
    )

    expect(orientation.dec).toBe(LA_PAZ.lat)
    expect(orientation.ra).toBeCloseTo(expectedRa, 6)
  })
})

describe('parseDateParts', () => {
  it('parses a valid YYYY-MM-DD string into numeric parts', () => {
    expect(parseDateParts('2026-09-21')).toEqual({ y: 2026, m: 9, d: 21 })
  })

  it('accepts the February 29th leap day in leap years', () => {
    expect(parseDateParts('2024-02-29')).toEqual({ y: 2024, m: 2, d: 29 })
  })

  it.each([
    ['21-09-2026', 'day-first format is rejected'],
    ['09/21/2026', 'slash format is rejected'],
    ['2026-13-01', 'month 13 is rejected'],
    ['2026-00-10', 'month 0 is rejected'],
    ['2026-09-32', 'day 32 is rejected'],
    ['2026-09-00', 'day 0 is rejected'],
    ['2023-02-29', 'Feb 29 in a non-leap year is rejected'],
  ])('rejects malformed date %s (%s)', (input) => {
    expect(() => parseDateParts(input)).toThrow(DateInputError)
  })

  it('throws a descriptive, non-coercing error with the offending input', () => {
    let error: unknown
    try {
      dateToJulianDay('21-09-2026')
    } catch (caught) {
      error = caught
    }

    expect(error).toBeInstanceOf(DateInputError)
    const message = error instanceof Error ? error.message : String(error)
    expect(message).toContain('21-09-2026')
    expect(message).toContain('expected YYYY-MM-DD')
  })
})

describe('mulberry32', () => {
  it('produces the canonical first draw for the constant seed', () => {
    // Canonical 32-bit mulberry32 sequence; first draw pinned for the constant seed.
    expect(mulberry32(CONSTANT_SEED)()).toBeCloseTo(0.5825112380553037, 9)
  })

  it('is deterministic: same seed → identical sequences across instances', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]

    expect(seqA).toEqual(seqB)
    for (const draw of seqA) {
      expect(draw).toBeGreaterThanOrEqual(0)
      expect(draw).toBeLessThan(1)
    }
  })

  it('diverges for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })
})

describe('raDecToUnitVector', () => {
  it('maps RA 0 h, Dec 0° to the +Z axis and Dec 90° to +Y (up)', () => {
    expect(raDecToUnitVector(0, 0)[0]).toBeCloseTo(0, 9)
    expect(raDecToUnitVector(0, 0)[2]).toBeCloseTo(1, 9)
    expect(raDecToUnitVector(0, 90)[1]).toBeCloseTo(1, 9)
  })

  it('maps RA 6 h (90°) to the +X axis', () => {
    expect(raDecToUnitVector(6, 0)[0]).toBeCloseTo(1, 9)
    expect(raDecToUnitVector(6, 0)[2]).toBeCloseTo(0, 9)
  })

  it('always returns unit-length vectors', () => {
    const samples: Array<[number, number]> = [
      [14.15, -16.5],
      [0, -90],
      [23.99, 89.9],
      [7.5, 30],
    ]
    for (const [ra, dec] of samples) {
      const [x, y, z] = raDecToUnitVector(ra, dec)
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9)
    }
  })
})

describe('generateStarPositions', () => {
  it('generates exactly count positions', () => {
    expect(generateStarPositions(50, 7)).toHaveLength(50)
  })

  it('samples only the upper hemisphere (+Y) with unit-length vectors', () => {
    const stars = generateStarPositions(200, 7)
    for (const [x, y, z] of stars) {
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(x).toBeGreaterThanOrEqual(-1)
      expect(x).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic per seed → identical skies across renders (3D and 2D)', () => {
    const first = generateStarPositions(64, CONSTANT_SEED)
    const second = generateStarPositions(64, CONSTANT_SEED)

    expect(first).toEqual(second)
  })

  it('diverges when the seed changes', () => {
    expect(generateStarPositions(4, 1)).not.toEqual(generateStarPositions(4, 2))
  })
})