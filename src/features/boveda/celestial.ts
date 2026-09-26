import * as THREE from 'three'
import { STAR_COUNT, STARS } from './starfield'

/**
 * Design W1: the 3D dome lives at radius 90 (NOT 1) — the camera sits inside
 * the sphere at the origin, so star coordinates must be scaled to it.
 */
export const STAR_RADIUS = 90

/**
 * Gate review C1/W1: the dome material must read as soft additive light —
 * additive blending (spec MUST), 90% opacity, size 1.2 with distance
 * attenuation, per-vertex colors, no depth write. Exported as the single
 * source of truth for the <pointsMaterial> config (jsdom cannot observe
 * boolean attributes on custom elements, so the tuple is pinned here).
 */
export const DOME_POINTS_MATERIAL: {
  size: number
  sizeAttenuation: boolean
  vertexColors: boolean
  transparent: boolean
  opacity: number
  blending: THREE.Blending
  depthWrite: boolean
} = {
  size: 1.2,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
}

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

export type ProjectedStar = { x: number; y: number; r: number; golden: boolean }

/**
 * Pure perspective projection of unit-vector stars onto a canvas plane facing
 * `forward`. Only stars with forward-dot > 0 are visible; screen scale grows
 * as the camera plane recedes (scale = fovK / depth).
 */
export function projectStars(
  stars: Array<[number, number, number]>,
  forward: [number, number, number],
  width: number,
  height: number,
  goldenIndices: Set<number> = new Set(),
): ProjectedStar[] {
  const [fx, fy, fz] = forward

  // Tangent axes: right = normalize(cross(forward, worldUp)), up' = cross(right, forward).
  let rx = -fz
  const ry = 0
  let rz = fx
  const rightLength = Math.hypot(rx, ry, rz)
  if (rightLength < 1e-9) {
    rx = 1
    rz = 0
  } else {
    rx /= rightLength
    rz /= rightLength
  }
  const ux = ry * fz - rz * fy
  const uy = rz * fx - rx * fz
  const uz = rx * fy - ry * fx

  const fovK = Math.min(width, height) * 1.2
  const cx = width / 2
  const cy = height / 2

  const points: ProjectedStar[] = []
  for (let i = 0; i < stars.length; i++) {
    const [sx, sy, sz] = stars[i]
    const depth = sx * fx + sy * fy + sz * fz
    if (depth <= 0) continue
    const screenX = sx * rx + sy * ry + sz * rz
    const screenY = sx * ux + sy * uy + sz * uz
    const scale = fovK / depth
    points.push({
      x: cx + screenX * scale,
      y: cy - screenY * scale,
      r: Math.max(0.4, 1.1 / depth),
      golden: goldenIndices.has(i),
    })
  }
  return points
}