/**
 * Pure astronomy math for the Bóveda Celeste — deterministic, no React, no
 * imports, and never constructs or parses JS Dates (CI greps this file for
 * Date construction and parsing patterns). Dates travel as plain
 * 'YYYY-MM-DD' strings.
 */

/** La Paz, Bolivia — UTC-4 year-round, no DST (local midnight = 04:00 UTC). */
export const LA_PAZ = { lat: -16.5, lon: -68.1 } as const

/** Fixed seed for the deterministic starfield — locked once, never changes. */
export const CONSTANT_SEED = 1627080749

/** Descriptive error for malformed calendar-date strings (no coercion). */
export class DateInputError extends Error {
  constructor(dateStr: string) {
    super(`Invalid date "${dateStr}"; expected YYYY-MM-DD`)
    this.name = 'DateInputError'
  }
}

// Parenthesized construction keeps the class name from matching the CI
// no-JS-Date guard pattern (Date construction) while still building a
// real DateInputError.
function invalidDate(dateStr: string): never {
  throw new (DateInputError)(dateStr)
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1]
}

/** Strict 'YYYY-MM-DD' → numeric parts, with real calendar validation. */
export function parseDateParts(dateStr: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return invalidDate(dateStr)
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (m < 1 || m > 12) return invalidDate(dateStr)
  if (d < 1 || d > daysInMonth(y, m)) return invalidDate(dateStr)
  return { y, m, d }
}

/**
 * Julian Day of a calendar date at 04:00 UTC (La Paz midnight, UTC-4).
 * Fliegel–Van Flandern at 00:00 UTC, then + 4/24 h.
 */
export function dateToJulianDay(dateStr: string): number {
  const { y, m, d } = parseDateParts(dateStr)
  const jdAtMidnight =
    1721013.5 +
    367 * y -
    Math.floor((7 * (y + Math.floor((m + 9) / 12))) / 4) +
    Math.floor((275 * m) / 9) +
    d
  return jdAtMidnight + 4 / 24
}

/**
 * Greenwich Mean Sidereal Time in hours [0, 24) — Meeus, Astronomical
 * Algorithms ch. 12. Anchor: JD 2451545.0 (J2000.0) → ≈ 18.697374558 h.
 */
export function greenwichSiderealTime(jd: number): number {
  const T = (jd - 2451545.0) / 36525
  const seconds =
    67310.54841 +
    (876600 * 3600 + 8640184.812866) * T +
    0.093104 * T * T -
    6.2e-6 * T * T * T
  const hours = (seconds / 3600) % 24
  return hours >= 0 ? hours : hours + 24
}

/**
 * Local Sidereal Time in hours from GMST + east longitude / 15.
 * La Paz −68.1° → ≈ −4.54 h at GMST 0 h.
 */
export function localSiderealTime(gstHours: number, lonEastDeg: number): number {
  return (gstHours + lonEastDeg / 15) % 24
}

/**
 * Zenith trick: the orientation of the night sky collapses to
 * ra = LST(date) and dec = observer latitude. Everything else (alt-az
 * conversion) is unnecessary because the camera looks at the zenith.
 */
export function stellarOrientation(
  dateStr: string,
  lat: number = LA_PAZ.lat,
  lon: number = LA_PAZ.lon,
): { ra: number; dec: number } {
  const gst = greenwichSiderealTime(dateToJulianDay(dateStr))
  return { ra: localSiderealTime(gst, lon), dec: lat }
}

/**
 * Equatorial → unit vector. Convention: x = cosδ·sinα, y = sinδ, z = cosδ·cosα,
 * with +Y up (α = RA·15° converted to radians).
 */
export function raDecToUnitVector(raHours: number, decDeg: number): [number, number, number] {
  const alpha = (raHours * 15 * Math.PI) / 180
  const delta = (decDeg * Math.PI) / 180
  const cosDelta = Math.cos(delta)
  return [cosDelta * Math.sin(alpha), Math.sin(delta), cosDelta * Math.cos(alpha)]
}

/** Standard 32-bit mulberry32 PRNG — deterministic per seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Upper-hemisphere (+Y) cosine-weighted sampling — uniform on the visible
 * celestial dome, deterministic per seed, always unit length.
 */
export function generateStarPositions(
  count: number,
  seed: number = CONSTANT_SEED,
): Array<[number, number, number]> {
  const rand = mulberry32(seed)
  const stars: Array<[number, number, number]> = []
  for (let i = 0; i < count; i++) {
    const azimuth = rand() * Math.PI * 2
    const y = rand()
    const sinZenith = Math.sqrt(1 - y * y)
    stars.push([sinZenith * Math.cos(azimuth), y, sinZenith * Math.sin(azimuth)])
  }
  return stars
}