import {
  CONSTANT_SEED,
  generateStarPositions,
  raDecToUnitVector,
  stellarOrientation,
} from '../../core/astronomy'

/**
 * Single source of truth for the sky: the SAME seeded positions feed the 3D
 * dome (CelestialCanvas), the 2D projection (TwoDSky) and the golden tint —
 * so every render shows an identical starfield.
 */
export const STAR_COUNT = 4000

/** Module-init once, seeded deterministically — positions never change. */
export const STARS: Array<[number, number, number]> = generateStarPositions(
  STAR_COUNT,
  CONSTANT_SEED,
)

/** Indices of the n stars whose direction best matches `dir` (dot ranking). */
export function nearestStarsTo(dir: [number, number, number], n: number): number[] {
  return STARS.map((star, index) => ({
    index,
    // (star and dir are both unit vectors → dot is the cosine alignment)
    alignment: star[0] * dir[0] + star[1] * dir[1] + star[2] * dir[2],
  }))
    .sort((a, b) => b.alignment - a.alignment)
    .slice(0, n)
    .map((entry) => entry.index)
}

/** Zenith star of a night: unit vector toward stellarOrientation(date). */
export function starDirectionForDate(dateStr: string): [number, number, number] {
  const { ra, dec } = stellarOrientation(dateStr)
  return raDecToUnitVector(ra, dec)
}