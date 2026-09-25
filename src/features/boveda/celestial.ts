import { STAR_COUNT, STARS } from './starfield'

/**
 * Design W1: the 3D dome lives at radius 90 (NOT 1) — the camera sits inside
 * the sphere at the origin, so star coordinates must be scaled to it.
 */
export const STAR_RADIUS = 90

const BASE_STAR_COLOR: [number, number, number] = [0.9098, 0.902, 0.8902] // #E8E6E3
const AMBER_STAR_COLOR: [number, number, number] = [0.9608, 0.702, 0.3608] // #F5B35C

/** One RGB triple per star; golden indices get the amber tint. */
export function buildStarColors(goldenIndices: Set<number>): Float32Array {
  const colors = new Float32Array(STAR_COUNT * 3)
  for (let i = 0; i < STAR_COUNT; i++) {
    const [r, g, b] = goldenIndices.has(i) ? AMBER_STAR_COLOR : BASE_STAR_COLOR
    const offset = i * 3
    colors[offset] = r
    colors[offset + 1] = g
    colors[offset + 2] = b
  }
  return colors
}

/** Normalized average of unit directions; zenith fallback when they cancel. */
export function meanDirection(
  dirs: Array<[number, number, number]>,
): [number, number, number] {
  let x = 0
  let y = 0
  let z = 0
  for (const [dx, dy, dz] of dirs) {
    x += dx
    y += dy
    z += dz
  }
  const norm = Math.hypot(x, y, z)
  if (norm < 1e-9) return [0, 1, 0]
  return [x / norm, y / norm, z / norm]
}

/** Dome positions (radius-scaled unit vectors) for the single <points> draw call. */
export function buildStarPositions(): Float32Array {
  const positions = new Float32Array(STAR_COUNT * 3)
  for (let i = 0; i < STAR_COUNT; i++) {
    const offset = i * 3
    positions[offset] = STARS[i][0] * STAR_RADIUS
    positions[offset + 1] = STARS[i][1] * STAR_RADIUS
    positions[offset + 2] = STARS[i][2] * STAR_RADIUS
  }
  return positions
}